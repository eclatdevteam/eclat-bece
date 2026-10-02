-- Second backfill pass for uploaded_by: CSV bulk uploads only log batch-level
-- audit entries (bulk_create_questions has a null resource_id), so per-question
-- attribution must come from timing. The CSV uploader logs the event right after
-- the batch finishes, so each question's created_at sits just before its batch's
-- event. Attribute a question only when every bulk event for the same class year
-- within 15 minutes after creation points to the SAME admin; anything ambiguous
-- (overlapping uploads by different admins) stays null and shows as "-".

WITH ev AS (
  SELECT admin_id, created_at, details->>'class_year' AS cy
  FROM admin_audit_log
  WHERE action = 'bulk_create_questions'
    AND admin_id IS NOT NULL
    AND details->>'class_year' IS NOT NULL
),
cand AS (
  SELECT q.id, e.admin_id
  FROM public.quiz_questions_year6 q
  JOIN LATERAL (
    SELECT e.admin_id, e.created_at FROM ev e
    WHERE e.cy = 'year_6'
      AND e.created_at > q.created_at
      AND e.created_at <= q.created_at + interval '15 minutes'
  ) e ON true
  WHERE q.uploaded_by IS NULL
  GROUP BY q.id, e.admin_id
),
winner AS (
  SELECT id, (array_agg(admin_id))[1] AS admin_pk
  FROM cand
  GROUP BY id
  HAVING count(DISTINCT admin_id) = 1
)
UPDATE public.quiz_questions_year6 q
SET uploaded_by = a.user_id
FROM winner w JOIN public.admins a ON a.id = w.admin_pk
WHERE q.id = w.id
  AND q.uploaded_by IS NULL;

WITH ev AS (
  SELECT admin_id, created_at, details->>'class_year' AS cy
  FROM admin_audit_log
  WHERE action = 'bulk_create_questions'
    AND admin_id IS NOT NULL
    AND details->>'class_year' IS NOT NULL
),
cand AS (
  SELECT q.id, e.admin_id
  FROM public.quiz_questions_year9 q
  JOIN LATERAL (
    SELECT e.admin_id, e.created_at FROM ev e
    WHERE e.cy = 'year_9'
      AND e.created_at > q.created_at
      AND e.created_at <= q.created_at + interval '15 minutes'
  ) e ON true
  WHERE q.uploaded_by IS NULL
  GROUP BY q.id, e.admin_id
),
winner AS (
  SELECT id, (array_agg(admin_id))[1] AS admin_pk
  FROM cand
  GROUP BY id
  HAVING count(DISTINCT admin_id) = 1
)
UPDATE public.quiz_questions_year9 q
SET uploaded_by = a.user_id
FROM winner w JOIN public.admins a ON a.id = w.admin_pk
WHERE q.id = w.id
  AND q.uploaded_by IS NULL;
