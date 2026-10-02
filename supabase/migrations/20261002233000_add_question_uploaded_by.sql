-- Track which admin uploaded each quiz question.
-- uploaded_by stores the auth user id of the admin; the display name lives in
-- public.admins.full_name and is resolved at read time via get_admin_display_names().

ALTER TABLE public.quiz_questions_year6
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.quiz_questions_year9
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Stamp the inserting admin automatically. Explicit values win, so service-role
-- callers (edge functions) can attribute inserts by passing uploaded_by directly;
-- without a JWT auth.uid() is null and the column stays null.
CREATE OR REPLACE FUNCTION public.set_question_uploaded_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.uploaded_by := COALESCE(NEW.uploaded_by, auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_uploaded_by_year6 ON public.quiz_questions_year6;
CREATE TRIGGER set_uploaded_by_year6
  BEFORE INSERT ON public.quiz_questions_year6
  FOR EACH ROW
  EXECUTE FUNCTION public.set_question_uploaded_by();

DROP TRIGGER IF EXISTS set_uploaded_by_year9 ON public.quiz_questions_year9;
CREATE TRIGGER set_uploaded_by_year9
  BEFORE INSERT ON public.quiz_questions_year9
  FOR EACH ROW
  EXECUTE FUNCTION public.set_question_uploaded_by();

-- Resolve admin names for the Question Bank's "Uploaded By" column. Runs as
-- definer because admins RLS only lets an admin read their own row, but the
-- portal needs every uploader's name. Only active admins may call it.
CREATE OR REPLACE FUNCTION public.get_admin_display_names(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT a.user_id, a.full_name
  FROM public.admins a
  WHERE
    a.user_id = ANY (p_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.admins caller
      WHERE caller.user_id = auth.uid()
        AND caller.is_active
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_display_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_display_names(uuid[]) TO authenticated;

-- Backfill from the audit log; per-question attribution only exists for
-- create_question events (bulk_create_questions entries are batch summaries
-- with a null resource_id, and pre-logging seeds have no attribution).
WITH creator AS (
  SELECT DISTINCT ON (l.resource_id) l.resource_id, l.admin_id
  FROM public.admin_audit_log l
  WHERE l.action = 'create_question'
    AND l.resource_type = 'question'
    AND l.resource_id IS NOT NULL
    AND l.admin_id IS NOT NULL
  ORDER BY l.resource_id, l.created_at ASC
)
UPDATE public.quiz_questions_year6 q
SET uploaded_by = ad.user_id
FROM creator c
JOIN public.admins ad ON ad.id = c.admin_id
WHERE q.id = c.resource_id
  AND q.uploaded_by IS NULL;

WITH creator AS (
  SELECT DISTINCT ON (l.resource_id) l.resource_id, l.admin_id
  FROM public.admin_audit_log l
  WHERE l.action = 'create_question'
    AND l.resource_type = 'question'
    AND l.resource_id IS NOT NULL
    AND l.admin_id IS NOT NULL
  ORDER BY l.resource_id, l.created_at ASC
)
UPDATE public.quiz_questions_year9 q
SET uploaded_by = ad.user_id
FROM creator c
JOIN public.admins ad ON ad.id = c.admin_id
WHERE q.id = c.resource_id
  AND q.uploaded_by IS NULL;
