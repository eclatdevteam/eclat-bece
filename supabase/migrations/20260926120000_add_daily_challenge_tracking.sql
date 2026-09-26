-- Migration: 20260926120000_add_daily_challenge_tracking.sql
-- Adds last_daily_challenge_date column to student_gamification_profile for fast calendar-day challenge tracking

ALTER TABLE public.student_gamification_profile 
ADD COLUMN IF NOT EXISTS last_daily_challenge_date date;

CREATE INDEX IF NOT EXISTS idx_student_gamification_profile_daily_challenge 
ON public.student_gamification_profile(student_id, last_daily_challenge_date);
