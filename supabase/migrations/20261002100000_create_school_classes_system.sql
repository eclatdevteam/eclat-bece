-- Migration: 20261002100000_create_school_classes_system.sql
-- Enables school class management, arm allocations, and student class grouping (Phase 1)

-- 1. Create school_classes table
CREATE TABLE IF NOT EXISTS public.school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g. "JSS 3A", "Primary 6 Gold"
  level text NOT NULL, -- e.g. "JSS 3", "Primary 6"
  class_year text CHECK (class_year IN ('year_6', 'year_9')),
  lead_teacher text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_classes_school_id 
  ON public.school_classes(school_id);

-- 2. Add class_id to students table to optionally assign students to specific class arms
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.school_classes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_class_id 
  ON public.students(class_id);

-- 3. Row Level Security on school_classes
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view own classes"
  ON public.school_classes FOR SELECT
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can insert own classes"
  ON public.school_classes FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can update own classes"
  ON public.school_classes FOR UPDATE
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can delete own classes"
  ON public.school_classes FOR DELETE
  USING (
    school_id IN (
      SELECT s.id FROM public.schools s WHERE s.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins have full access to school_classes"
  ON public.school_classes FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));
