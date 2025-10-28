-- Fix Critical Security Issue: Remove public access to schools table
-- Drop the overly permissive policy that allows anyone to view all schools
DROP POLICY IF EXISTS "Anyone can view school codes" ON public.schools;

-- Add secure policies for schools table

-- Students can view their own school
CREATE POLICY "Students can view their own school"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.school_id = auth.uid()
    AND students.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.school_id = schools.user_id
    AND students.user_id = auth.uid()
  )
);

-- Parents can view schools their children attend
CREATE POLICY "Parents can view their children's schools"
ON public.schools
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.school_id = schools.user_id
    AND students.parent_id = auth.uid()
  )
);

-- School admins can view their own school record
CREATE POLICY "Schools can view own record (existing)"
ON public.schools
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a secure function for school code lookup during onboarding
-- This function only returns school_code and school_name (not user_id or other sensitive data)
CREATE OR REPLACE FUNCTION public.lookup_school_by_code(_school_code text)
RETURNS TABLE (
  id uuid,
  school_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, school_name
  FROM public.schools
  WHERE school_code = _school_code
  LIMIT 1;
$$;