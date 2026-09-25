-- ============================================================================
-- Migration: Add Missing Foreign Key and Lookup Indexes for Question Deduplication
-- Date: 2026-09-25
-- Description: Adds B-tree indexes on question_id for quiz_options_year6 and
--              quiz_options_year9, and composite indexes on (subject, id) to
--              prevent full table scans and timeouts during deduplication.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quiz_options_year6_question_id 
  ON public.quiz_options_year6(question_id);

CREATE INDEX IF NOT EXISTS idx_quiz_options_year9_question_id 
  ON public.quiz_options_year9(question_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_year6_subject_id 
  ON public.quiz_questions_year6(subject, id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_year9_subject_id 
  ON public.quiz_questions_year9(subject, id);
