-- ============================================================================
-- Server-authoritative quiz scoring — Phase B (RLS lockdown)
-- ============================================================================
-- !! DO NOT APPLY until the client that uses the server-scoring flow
-- !! (start_quiz_session / submit_quiz_answer / complete-quiz-session /
-- !! submit_duel_turn) is deployed to ALL users.
--
-- Applying this while old clients are in use breaks quiz submission,
-- badge awarding, duel resolution and league sync for those users.
--
-- This migration revokes direct client write access to gamification data.
-- Previously a student could INSERT arbitrary points into their own ledger,
-- update their own profile/level/tier, mint badges, set their weekly league
-- points, or overwrite duel scores — RLS proved ownership, not validity.
-- After Phase A, all of those writes flow through SECURITY DEFINER RPCs and
-- the complete-quiz-session Edge Function, which run with elevated rights
-- regardless of these policies.
-- ============================================================================

-- Points ledger: the append-only EP journal. Client INSERTs revoked.
DROP POLICY IF EXISTS "Students can insert own points ledger"
  ON public.student_points_ledger;

-- Gamification profile: client INSERT/UPDATE revoked (level/EP/tier are
-- server-computed).
DROP POLICY IF EXISTS "Students can update own gamification profile"
  ON public.student_gamification_profile;
DROP POLICY IF EXISTS "Students can insert own gamification profile"
  ON public.student_gamification_profile;

-- Badges are awarded by the server only.
DROP POLICY IF EXISTS "Students can insert own badges"
  ON public.student_badges;

-- Weekly league points are maintained by the server; students keep read
-- access (shared with cohort view policies) but cannot UPDATE their rows.
DROP POLICY IF EXISTS "Students can update own cohort membership"
  ON public.league_cohort_members;
DROP POLICY IF EXISTS "Students can insert own cohort membership"
  ON public.league_cohort_members;

-- quiz_results: rows are now written by the server at session completion.
-- The legacy client INSERT policy is removed; reads (own/parent/school/admin)
-- are untouched.
DROP POLICY IF EXISTS "Students can insert own quiz results"
  ON public.quiz_results;

-- Topic mastery is maintained by the scoring pipeline.
DROP POLICY IF EXISTS "Students can insert own topic mastery"
  ON public.student_topic_mastery;
DROP POLICY IF EXISTS "Students can update own topic mastery"
  ON public.student_topic_mastery;

-- Arena challenges: participants keep status-only transitions (accept/decline)
-- but score, EP and winner fields are server-owned. Column-restricted UPDATE
-- policies are not supported by CREATE POLICY directly, so the broad policy is
-- replaced by one that only allows status changes while the duel is unresolved.
DROP POLICY IF EXISTS "Participants can update challenges"
  ON public.arena_challenges;

CREATE POLICY "Participants can update status only"
  ON public.arena_challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id IN (arena_challenges.challenger_id, arena_challenges.opponent_id)
        AND s.user_id = auth.uid()
    )
    AND arena_challenges.status IN ('pending', 'accepted')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id IN (arena_challenges.challenger_id, arena_challenges.opponent_id)
        AND s.user_id = auth.uid()
    )
    AND arena_challenges.status IN ('pending', 'accepted')
  );

-- NOTE ON TRACKING: after this migration, `student_gamification_profile`
-- self-upserts in legacy client code (recordSessionGamification) will fail.
-- That is intentional: it means an un-deployed client is still live. Rollback
-- is to re-run the corresponding CREATE POLICY statements from
-- 20260926100000_student_gamification_system.sql,
-- 20260926130000_create_league_cohort_system.sql,
-- 20260926150000_fix_gamification_profile_rls_and_daily_challenge.sql and
-- 20251107085341_1338e684-1bcd-404a-98ba-24f06e2e9764.sql.
