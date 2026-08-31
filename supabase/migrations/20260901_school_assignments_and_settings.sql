-- Migration: 20260901_school_assignments_and_settings.sql
-- Enables school-assigned quizzes and school profile information

BEGIN;

-- 1. Add contact_email and address to schools table if not present
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 2. Update practice_assignments to support school-based assignments
ALTER TABLE public.practice_assignments
  ALTER COLUMN parent_id DROP NOT NULL;

ALTER TABLE public.practice_assignments
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;

-- Ensure an assignment belongs to either a parent or a school
ALTER TABLE public.practice_assignments
  DROP CONSTRAINT IF EXISTS practice_assignments_creator_check;

ALTER TABLE public.practice_assignments
  ADD CONSTRAINT practice_assignments_creator_check
  CHECK (parent_id IS NOT NULL OR school_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_practice_assignments_school_id
  ON public.practice_assignments(school_id);

-- 3. RLS Policies for Schools on practice_assignments
DROP POLICY IF EXISTS "Schools can create assignments" ON public.practice_assignments;
CREATE POLICY "Schools can create assignments"
  ON public.practice_assignments FOR INSERT
  WITH CHECK (
    school_id = (
      SELECT s.id FROM public.schools s
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can view assignments they created" ON public.practice_assignments;
CREATE POLICY "Schools can view assignments they created"
  ON public.practice_assignments FOR SELECT
  USING (
    school_id = (
      SELECT s.id FROM public.schools s
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can update assignments they created" ON public.practice_assignments;
CREATE POLICY "Schools can update assignments they created"
  ON public.practice_assignments FOR UPDATE
  USING (
    school_id = (
      SELECT s.id FROM public.schools s
      WHERE s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can delete assignments they created" ON public.practice_assignments;
CREATE POLICY "Schools can delete assignments they created"
  ON public.practice_assignments FOR DELETE
  USING (
    school_id = (
      SELECT s.id FROM public.schools s
      WHERE s.user_id = auth.uid()
    )
  );

COMMIT;
