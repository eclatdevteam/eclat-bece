-- Migration: 20261002120000_create_school_teachers_system.sql
-- Enables formal teacher registry, department assignments, and class allocations (Roadmap Item 3)

CREATE TABLE IF NOT EXISTS public.school_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  department text,
  primary_subject text,
  assigned_class_ids uuid[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_teachers_school_id 
  ON public.school_teachers(school_id);

-- Enable RLS
ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view own teachers"
  ON public.school_teachers FOR SELECT
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can insert own teachers"
  ON public.school_teachers FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can update own teachers"
  ON public.school_teachers FOR UPDATE
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can delete own teachers"
  ON public.school_teachers FOR DELETE
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );
