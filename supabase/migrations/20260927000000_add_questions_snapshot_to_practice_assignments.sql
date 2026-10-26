-- Add questions_snapshot column to practice_assignments table if it does not exist
ALTER TABLE public.practice_assignments
ADD COLUMN IF NOT EXISTS questions_snapshot JSONB;
