-- Migration: 20260926150000_fix_gamification_profile_rls_and_daily_challenge.sql
-- 1. Grant students INSERT permissions on student_gamification_profile to allow upserts/creation
-- 2. Backfill last_daily_challenge_date and sync quiz_results subject for Daily Challenges

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_gamification_profile' 
      AND policyname = 'Students can insert own gamification profile'
  ) THEN
    CREATE POLICY "Students can insert own gamification profile"
      ON public.student_gamification_profile
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.students
          WHERE students.id = student_gamification_profile.student_id
            AND students.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Backfill last_daily_challenge_date in student_gamification_profile from student_points_ledger
UPDATE public.student_gamification_profile sgp
SET last_daily_challenge_date = (spl.created_at AT TIME ZONE 'UTC')::date
FROM (
  SELECT student_id, MAX(created_at) as created_at
  FROM public.student_points_ledger
  WHERE source_type = 'daily_challenge'
  GROUP BY student_id
) spl
WHERE sgp.student_id = spl.student_id
  AND (sgp.last_daily_challenge_date IS NULL OR sgp.last_daily_challenge_date < (spl.created_at AT TIME ZONE 'UTC')::date);

-- Backfill quiz_results subject to 'Daily Challenge' for quizzes recorded as daily challenges in student_points_ledger
UPDATE public.quiz_results qr
SET subject = 'Daily Challenge'
FROM public.student_points_ledger spl
WHERE spl.reference_id = qr.id
  AND spl.source_type = 'daily_challenge';
