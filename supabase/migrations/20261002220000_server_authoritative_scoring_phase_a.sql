-- ============================================================================
-- Server-authoritative quiz scoring — Phase A (server foundation)
-- ============================================================================
-- Adds server-side quiz session management so that correctness is graded on
-- the server and answers are never shipped to the browser:
--
--   quiz_sessions            one row per quiz attempt (who/what/when/mode)
--   quiz_session_answers     per-question answers, graded server-side
--
--   start_quiz_session()     validates the daily-challenge lock server-side
--                            and creates the session
--   submit_quiz_answer()     grades one answer server-side and returns
--                            correctness + explanation to the client
--
-- Hardening of existing SECURITY DEFINER RPCs (caller validation):
--   assign_student_to_weekly_cohort / update_student_cohort_points
--
-- New: submit_duel_turn() records duel turns server-side and resolves the
-- winner + arena EP without trusting client-computed results.
-- New: calculate_level_from_ep() mirrors levelEngine's EP curve so SQL-side
-- EP awards keep current_level in sync.
--
-- Session-end EP computation (points/mastery/streak/badges) runs in the
-- `complete-quiz-session` Edge Function using the same TypeScript engines the
-- client previously used; the client no longer computes or writes EP.
--
-- RLS: students can SELECT their own sessions/answers but never INSERT or
-- UPDATE them — all writes flow through the SECURITY DEFINER RPCs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice', 'daily_challenge', 'duel')),
  subject text,
  topic text,
  assignment_id uuid REFERENCES public.practice_assignments(id) ON DELETE SET NULL,
  arena_challenge_id uuid REFERENCES public.arena_challenges(id) ON DELETE SET NULL,
  question_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.quiz_session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL,
  selected_index integer,
  is_correct boolean NOT NULL DEFAULT false,
  graded boolean NOT NULL DEFAULT false,
  time_spent_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student ON public.quiz_sessions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_session_answers_session ON public.quiz_session_answers(session_id);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_answers ENABLE ROW LEVEL SECURITY;

-- Read-only for owners (needed for resume/review). All writes go through RPCs.
CREATE POLICY "Students can view own quiz sessions"
  ON public.quiz_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = quiz_sessions.student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to quiz sessions"
  ON public.quiz_sessions FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

CREATE POLICY "Students can view own session answers"
  ON public.quiz_session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_sessions qs
      JOIN public.students s ON s.id = qs.student_id
      WHERE qs.id = quiz_session_answers.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to quiz session answers"
  ON public.quiz_session_answers FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

-- ---------------------------------------------------------------------------
-- 2. Level curve (mirrors src/services/gamification/levelEngine.ts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_required_ep_for_level(p_level integer)
RETURNS bigint
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_level integer := GREATEST(1, LEAST(100, COALESCE(p_level, 1)));
BEGIN
  IF v_level <= 1 THEN RETURN 0; END IF;
  IF v_level = 2 THEN RETURN 250; END IF;
  IF v_level = 3 THEN RETURN 600; END IF;
  IF v_level = 4 THEN RETURN 1200; END IF;
  IF v_level = 5 THEN RETURN 2000; END IF;
  IF v_level < 10 THEN RETURN ROUND(2000 + 1600 * (v_level - 5))::bigint; END IF;        -- steps of 8000/5
  IF v_level = 10 THEN RETURN 10000; END IF;
  IF v_level < 20 THEN RETURN ROUND(10000 + 2500 * (v_level - 10))::bigint; END IF;      -- steps of 25000/10
  IF v_level = 20 THEN RETURN 35000; END IF;
  IF v_level < 30 THEN RETURN ROUND(35000 + 4000 * (v_level - 20))::bigint; END IF;      -- steps of 40000/10
  IF v_level = 30 THEN RETURN 75000; END IF;
  IF v_level < 50 THEN RETURN ROUND(75000 + 6250 * (v_level - 30))::bigint; END IF;      -- steps of 125000/20
  IF v_level = 50 THEN RETURN 200000; END IF;
  RETURN (200000 + (v_level - 50) * 15000)::bigint;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_level_from_ep(p_lifetime_ep bigint)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(l), 1)::integer
  FROM generate_series(1, 100) AS l
  WHERE p_lifetime_ep >= public.get_required_ep_for_level(l)
$$;

-- ---------------------------------------------------------------------------
-- 3. start_quiz_session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_quiz_session(
  p_mode text,
  p_question_ids uuid[],
  p_subject text DEFAULT NULL,
  p_topic text DEFAULT NULL,
  p_assignment_id uuid DEFAULT NULL,
  p_arena_challenge_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_student public.students;
  v_session_id uuid;
  v_today date := (now() AT TIME ZONE 'utc')::date;
  v_already_daily boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_mode NOT IN ('practice', 'daily_challenge', 'duel') THEN
    RAISE EXCEPTION 'Invalid session mode';
  END IF;
  IF p_question_ids IS NULL OR array_length(p_question_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No questions selected';
  END IF;
  IF array_length(p_question_ids, 1) > 100 THEN
    RAISE EXCEPTION 'Too many questions';
  END IF;

  SELECT * INTO v_student FROM public.students WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student profile not found';
  END IF;

  -- Daily-challenge lock is enforced HERE, server-side.
  IF p_mode = 'daily_challenge' THEN
    IF EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE student_id = v_student.id
        AND mode = 'daily_challenge'
        AND status = 'completed'
        AND (completed_at AT TIME ZONE 'utc')::date = v_today
    ) THEN
      v_already_daily := true;
    END IF;
    IF NOT v_already_daily AND EXISTS (
      SELECT 1 FROM public.student_points_ledger
      WHERE student_id = v_student.id
        AND source_type = 'daily_challenge'
        AND (created_at AT TIME ZONE 'utc')::date = v_today
    ) THEN
      v_already_daily := true;
    END IF;
    IF NOT v_already_daily AND EXISTS (
      SELECT 1 FROM public.quiz_results
      WHERE student_id = v_student.id
        AND subject = 'Daily Challenge'
        AND (completed_at AT TIME ZONE 'utc')::date = v_today
    ) THEN
      v_already_daily := true;
    END IF;

    IF v_already_daily THEN
      -- Keep the profile lock fresh so future checks are instant
      UPDATE public.student_gamification_profile
      SET last_daily_challenge_date = v_today
      WHERE student_id = v_student.id
        AND (last_daily_challenge_date IS DISTINCT FROM v_today);
      RAISE EXCEPTION 'DAILY_CHALLENGE_ALREADY_COMPLETED';
    END IF;
  END IF;

  INSERT INTO public.quiz_sessions (student_id, mode, subject, topic, assignment_id, arena_challenge_id, question_ids)
  VALUES (v_student.id, p_mode, p_subject, p_topic, p_assignment_id, p_arena_challenge_id, p_question_ids)
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('session_id', v_session_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. submit_quiz_answer — grades one answer server-side
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_index integer,
  p_time_spent_ms integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.quiz_sessions;
  v_question record;
  v_correct_index integer := -1;
  v_is_correct boolean := false;
  v_year text;
  v_ranked record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT qs.* INTO v_session
  FROM public.quiz_sessions qs
  JOIN public.students s ON s.id = qs.student_id
  WHERE qs.id = p_session_id AND s.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  IF v_session.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Session is no longer in progress';
  END IF;
  IF NOT (p_question_id = ANY (v_session.question_ids)) THEN
    RAISE EXCEPTION 'Question does not belong to this session';
  END IF;
  IF p_selected_index IS NULL OR p_selected_index < 0 THEN
    RAISE EXCEPTION 'Invalid answer index';
  END IF;

  -- Determine which cohort table holds the question
  IF EXISTS (SELECT 1 FROM public.quiz_questions_year6 q WHERE q.id = p_question_id) THEN
    v_year := 'year_6';
  ELSIF EXISTS (SELECT 1 FROM public.quiz_questions_year9 q WHERE q.id = p_question_id) THEN
    v_year := 'year_9';
  ELSE
    RAISE EXCEPTION 'Question not found';
  END IF;

  -- Find the index of the correct option (options are addressed by
  -- display_order position, matching the client's rendering order)
  IF v_year = 'year_6' THEN
    SELECT * INTO v_question FROM public.quiz_questions_year6 WHERE id = p_question_id;
    SELECT idx - 1 INTO v_correct_index
    FROM (
      SELECT o.is_correct, row_number() OVER (ORDER BY o.display_order) AS idx
      FROM public.quiz_options_year6 o
      WHERE o.question_id = p_question_id
    ) ranked
    WHERE ranked.is_correct
    LIMIT 1;
  ELSE
    SELECT * INTO v_question FROM public.quiz_questions_year9 WHERE id = p_question_id;
    SELECT idx - 1 INTO v_correct_index
    FROM (
      SELECT o.is_correct, row_number() OVER (ORDER BY o.display_order) AS idx
      FROM public.quiz_options_year9 o
      WHERE o.question_id = p_question_id
    ) ranked
    WHERE ranked.is_correct
    LIMIT 1;
  END IF;

  v_is_correct := v_correct_index >= 0 AND p_selected_index = v_correct_index;

  -- Record the graded answer (idempotent per session+question)
  INSERT INTO public.quiz_session_answers (session_id, question_id, selected_index, is_correct, graded, time_spent_ms)
  VALUES (
    p_session_id,
    p_question_id,
    p_selected_index,
    v_is_correct,
    true,
    GREATEST(0, COALESCE(p_time_spent_ms, 0))
  )
  ON CONFLICT (session_id, question_id) DO UPDATE
    SET selected_index = EXCLUDED.selected_index,
        is_correct = EXCLUDED.is_correct,
        graded = true,
        time_spent_ms = EXCLUDED.time_spent_ms;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_index', v_correct_index,
    'explanation', v_question.explanation
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Harden cohort RPCs (caller must act on their own student record)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_student_to_weekly_cohort(p_student_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier integer;
  v_week_start date;
  v_cohort_id uuid;
  v_cohort_num integer;
  v_user_id uuid := auth.uid();
BEGIN
  -- Only the owning student (or an admin) may assign the cohort
  IF v_user_id IS NOT NULL AND NOT COALESCE(public.is_admin(v_user_id), false) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.students
      WHERE id = p_student_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Not permitted to assign cohort for this student';
    END IF;
  END IF;

  v_week_start := date_trunc('week', now() AT TIME ZONE 'utc')::date;

  SELECT c.id INTO v_cohort_id
  FROM public.league_cohort_members m
  JOIN public.league_cohorts c ON c.id = m.cohort_id
  WHERE m.student_id = p_student_id
    AND c.week_start_date = v_week_start
  LIMIT 1;

  IF v_cohort_id IS NOT NULL THEN
    RETURN v_cohort_id;
  END IF;

  SELECT COALESCE(current_league_tier, 1) INTO v_tier
  FROM public.student_gamification_profile
  WHERE student_id = p_student_id;
  IF v_tier IS NULL THEN
    v_tier := 1;
  END IF;

  SELECT c.id INTO v_cohort_id
  FROM public.league_cohorts c
  WHERE c.league_tier = v_tier
    AND c.week_start_date = v_week_start
    AND (
      SELECT count(*) FROM public.league_cohort_members cm WHERE cm.cohort_id = c.id
    ) < 30
  ORDER BY c.cohort_number ASC
  LIMIT 1;

  IF v_cohort_id IS NULL THEN
    SELECT COALESCE(MAX(cohort_number), 0) + 1 INTO v_cohort_num
    FROM public.league_cohorts
    WHERE league_tier = v_tier
      AND week_start_date = v_week_start;

    INSERT INTO public.league_cohorts (league_tier, week_start_date, cohort_number)
    VALUES (v_tier, v_week_start, v_cohort_num)
    RETURNING id INTO v_cohort_id;
  END IF;

  INSERT INTO public.league_cohort_members (cohort_id, student_id, weekly_points)
  VALUES (
    v_cohort_id,
    p_student_id,
    COALESCE((
      SELECT weekly_ep FROM public.student_gamification_profile WHERE student_id = p_student_id
    ), 0)
  )
  ON CONFLICT (cohort_id, student_id) DO NOTHING;

  RETURN v_cohort_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_student_cohort_points(
  p_student_id uuid,
  p_additional_ep integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  -- Only admins or the owning student may adjust cohort points. This blocks
  -- students from inflating OTHER students' cohort points via direct RPC.
  IF v_user_id IS NOT NULL
     AND NOT COALESCE(public.is_admin(v_user_id), false)
     AND NOT EXISTS (
       SELECT 1 FROM public.students WHERE id = p_student_id AND user_id = v_user_id
     ) THEN
    RAISE EXCEPTION 'Not permitted to update cohort points for this student';
  END IF;

  v_cohort_id := public.assign_student_to_weekly_cohort(p_student_id);

  UPDATE public.league_cohort_members
  SET weekly_points = weekly_points + p_additional_ep
  WHERE cohort_id = v_cohort_id
    AND student_id = p_student_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. submit_duel_turn — server-side turn recording and winner resolution
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_duel_turn(
  p_challenge_id uuid,
  p_score integer,
  p_time_taken_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_student public.students;
  v_challenge public.arena_challenges;
  v_challenger public.students;
  v_opponent public.students;
  v_is_challenger boolean;
  v_is_opponent boolean;
  v_winner_id uuid := NULL;
  v_caller_ep integer := 0;
  v_outcome text;
  v_upset_bonus integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_student FROM public.students WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student profile not found';
  END IF;

  SELECT * INTO v_challenge FROM public.arena_challenges WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  v_is_challenger := v_challenge.challenger_id = v_student.id;
  v_is_opponent := v_challenge.opponent_id = v_student.id;
  IF NOT (v_is_challenger OR v_is_opponent) THEN
    RAISE EXCEPTION 'Not a participant of this challenge';
  END IF;
  IF v_challenge.status = 'completed' THEN
    RAISE EXCEPTION 'Challenge already completed';
  END IF;

  -- Record the caller's turn
  IF v_is_challenger THEN
    UPDATE public.arena_challenges
    SET challenger_score = p_score,
        challenger_time_taken = GREATEST(0, COALESCE(p_time_taken_seconds, 0)),
        status = CASE WHEN status = 'pending' THEN 'accepted' ELSE status END
    WHERE id = p_challenge_id;
  ELSE
    UPDATE public.arena_challenges
    SET opponent_score = p_score,
        opponent_time_taken = GREATEST(0, COALESCE(p_time_taken_seconds, 0)),
        status = CASE WHEN status = 'pending' THEN 'accepted' ELSE status END
    WHERE id = p_challenge_id;
  END IF;

  -- If both turns are in, resolve the duel server-side
  SELECT * INTO v_challenge FROM public.arena_challenges WHERE id = p_challenge_id;
  IF v_challenge.challenger_score IS NULL OR v_challenge.opponent_score IS NULL THEN
    RETURN jsonb_build_object('status', v_challenge.status, 'resolved', false);
  END IF;

  SELECT * INTO v_challenger FROM public.students WHERE id = v_challenge.challenger_id;
  SELECT * INTO v_opponent FROM public.students WHERE id = v_challenge.opponent_id;

  -- Winner: higher score; tie broken by faster time
  IF v_challenge.challenger_score > v_challenge.opponent_score
     OR (v_challenge.challenger_score = v_challenge.opponent_score
         AND COALESCE(v_challenge.challenger_time_taken, 0) < COALESCE(v_challenge.opponent_time_taken, 0)) THEN
    v_winner_id := v_challenge.challenger_id;
  ELSIF v_challenge.opponent_score > v_challenge.challenger_score
     OR (v_challenge.opponent_score = v_challenge.challenger_score
         AND COALESCE(v_challenge.opponent_time_taken, 0) < COALESCE(v_challenge.challenger_time_taken, 0)) THEN
    v_winner_id := v_challenge.opponent_id;
  END IF;

  IF v_winner_id IS NULL THEN
    v_outcome := 'draw';
    v_caller_ep := 20; -- draw reward (arenaEngine ARENA_BASE_REWARDS)
  ELSIF v_winner_id = v_student.id THEN
    v_outcome := 'win';
    v_caller_ep := 50; -- win reward
    -- Upset bonus: beating a higher-tier opponent
    IF EXISTS (
      SELECT 1
      FROM public.student_gamification_profile winner_p, public.student_gamification_profile loser_p
      WHERE winner_p.student_id = v_student.id
        AND loser_p.student_id = (CASE WHEN v_winner_id = v_challenge.challenger_id THEN v_challenge.opponent_id ELSE v_challenge.challenger_id END)
        AND winner_p.current_league_tier < loser_p.current_league_tier
    ) THEN
      v_upset_bonus := 25;
      v_caller_ep := v_caller_ep + v_upset_bonus;
    END IF;
  ELSE
    v_outcome := 'loss';
    v_caller_ep := 5; -- participation reward
  END IF;

  UPDATE public.arena_challenges
  SET winner_id = v_winner_id,
      status = 'completed',
      completed_at = now(),
      challenger_ep = CASE
        WHEN v_winner_id IS NULL THEN 20
        WHEN v_winner_id = challenger_id THEN 50 + v_upset_bonus
        ELSE 5 END,
      opponent_ep = CASE
        WHEN v_winner_id IS NULL THEN 20
        WHEN v_winner_id = opponent_id THEN 50 + v_upset_bonus
        ELSE 5 END
  WHERE id = p_challenge_id;

  -- Award the caller's EP through the ledger + profile + cohort (server-side)
  INSERT INTO public.student_points_ledger (student_id, amount, source_type, reference_id, metadata)
  VALUES (
    v_student.id,
    v_caller_ep,
    'session_bonus',
    p_challenge_id,
    jsonb_build_object('label', 'Arena Duel ' || v_outcome, 'duel', true)
  );

  UPDATE public.student_gamification_profile
  SET lifetime_ep = lifetime_ep + v_caller_ep,
      weekly_ep = weekly_ep + v_caller_ep,
      monthly_ep = monthly_ep + v_caller_ep,
      current_level = public.calculate_level_from_ep(lifetime_ep + v_caller_ep),
      updated_at = now()
  WHERE student_id = v_student.id;

  PERFORM public.update_student_cohort_points(v_student.id, v_caller_ep);

  RETURN jsonb_build_object(
    'status', 'completed',
    'resolved', true,
    'outcome', v_outcome,
    'winner_id', v_winner_id,
    'ep_awarded', v_caller_ep
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Schedule ledger reconciliation (previously manual-only)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'cron' AND table_name = 'job'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-student-points') THEN
      PERFORM cron.schedule(
        'reconcile-student-points',
        '15 2 * * *',
        'SELECT public.reconcile_student_points_ledger()'
      );
    END IF;
  END IF;
END $$;
