-- Flag Reports upgrade: snapshot the flagged question's uploader onto each report,
-- tighten value integrity, and index the columns the admin page filters by.
-- The snapshot is taken at flag time (matching the table's denormalized design:
-- question_text/subject/topic are cached the same way) so the reviewer always sees
-- who owned the question when it was reported, even if the question is later deleted.

ALTER TABLE public.flagged_questions
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Copy the uploader from the flagged question at insert time. Runs as the
-- inserting student, who can SELECT questions (authenticated read policy), so no
-- SECURITY DEFINER is needed. A missing/deleted question leaves it null.
CREATE OR REPLACE FUNCTION public.set_flag_uploaded_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_uploaded_by uuid;
BEGIN
  IF NEW.class_year = 'year_9' THEN
    SELECT q.uploaded_by INTO v_uploaded_by
    FROM public.quiz_questions_year9 q
    WHERE q.id = NEW.question_id;
  ELSE
    SELECT q.uploaded_by INTO v_uploaded_by
    FROM public.quiz_questions_year6 q
    WHERE q.id = NEW.question_id;
  END IF;
  NEW.uploaded_by := v_uploaded_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_flag_uploaded_by ON public.flagged_questions;
CREATE TRIGGER set_flag_uploaded_by
  BEFORE INSERT ON public.flagged_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_flag_uploaded_by();

-- Backfill existing flags from the current question tables; flags whose question
-- was deleted stay null and render as "-".
UPDATE public.flagged_questions f
SET uploaded_by = q.uploaded_by
FROM public.quiz_questions_year6 q
WHERE f.class_year = 'year_6'
  AND f.question_id = q.id
  AND f.uploaded_by IS NULL;

UPDATE public.flagged_questions f
SET uploaded_by = q.uploaded_by
FROM public.quiz_questions_year9 q
WHERE f.class_year = 'year_9'
  AND f.question_id = q.id
  AND f.uploaded_by IS NULL;

-- Enforce the documented value sets (previously comment-only).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.flagged_questions'::regclass AND conname = 'flagged_questions_reason_check'
  ) THEN
    ALTER TABLE public.flagged_questions
      ADD CONSTRAINT flagged_questions_reason_check
      CHECK (reason IN ('incorrect_answer', 'typo', 'missing_image', 'incomplete', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.flagged_questions'::regclass AND conname = 'flagged_questions_status_check'
  ) THEN
    ALTER TABLE public.flagged_questions
      ADD CONSTRAINT flagged_questions_status_check
      CHECK (status IN ('pending', 'resolved', 'dismissed'));
  END IF;
END $$;

ALTER TABLE public.flagged_questions
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_flagged_questions_status_created
  ON public.flagged_questions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flagged_questions_question
  ON public.flagged_questions (question_id);
CREATE INDEX IF NOT EXISTS idx_flagged_questions_class_year
  ON public.flagged_questions (class_year);
CREATE INDEX IF NOT EXISTS idx_flagged_questions_student
  ON public.flagged_questions (student_id);
