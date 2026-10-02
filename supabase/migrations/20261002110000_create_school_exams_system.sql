-- Migration: 20261002110000_create_school_exams_system.sql
-- Enables formal school examination scheduling, BECE mock simulation management, and candidate tracking (Roadmap Item 2)

CREATE TABLE IF NOT EXISTS public.school_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  cohort text NOT NULL CHECK (cohort IN ('year_6', 'year_9')),
  class_id uuid REFERENCES public.school_classes(id) ON DELETE SET NULL,
  subject text NOT NULL,
  exam_date date NOT NULL,
  start_time text,
  duration_minutes integer NOT NULL DEFAULT 60,
  question_count integer NOT NULL DEFAULT 40,
  passing_score integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Draft', 'Archived')),
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_exams_school_id 
  ON public.school_exams(school_id);

CREATE INDEX IF NOT EXISTS idx_school_exams_cohort 
  ON public.school_exams(cohort);

CREATE INDEX IF NOT EXISTS idx_school_exams_class_id 
  ON public.school_exams(class_id);

-- Enable RLS
ALTER TABLE public.school_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view own exams"
  ON public.school_exams FOR SELECT
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can insert own exams"
  ON public.school_exams FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can update own exams"
  ON public.school_exams FOR UPDATE
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can delete own exams"
  ON public.school_exams FOR DELETE
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );
