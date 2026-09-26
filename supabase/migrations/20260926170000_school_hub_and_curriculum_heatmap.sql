-- Phase 3: School Hub, Topic Mastery School Access, and Aggregates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_topic_mastery' 
      AND policyname = 'Schools can view linked students topic mastery'
  ) THEN
    CREATE POLICY "Schools can view linked students topic mastery"
      ON public.student_topic_mastery FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.students s
          JOIN public.schools sch ON sch.id = s.school_id
          WHERE s.id = student_topic_mastery.student_id
            AND sch.user_id = auth.uid()
        )
      );
  END IF;
END $$;
