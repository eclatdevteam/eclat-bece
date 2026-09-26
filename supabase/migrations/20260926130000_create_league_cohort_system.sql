-- Migration: 20260926130000_create_league_cohort_system.sql
-- Implements Phase 2 Weekly 30-Player League Cohorts (PRD Section 5 & Module 3)

-- 1. Create league_cohorts table
CREATE TABLE IF NOT EXISTS public.league_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_tier integer NOT NULL CHECK (league_tier >= 1 AND league_tier <= 8),
  week_start_date date NOT NULL, -- Monday UTC of the active week
  cohort_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_tier, week_start_date, cohort_number)
);

-- 2. Create league_cohort_members table
CREATE TABLE IF NOT EXISTS public.league_cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.league_cohorts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  weekly_points integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cohort_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_league_cohorts_lookup 
  ON public.league_cohorts(league_tier, week_start_date);

CREATE INDEX IF NOT EXISTS idx_league_cohort_members_ranking 
  ON public.league_cohort_members(cohort_id, weekly_points DESC, joined_at ASC);

CREATE INDEX IF NOT EXISTS idx_league_cohort_members_student 
  ON public.league_cohort_members(student_id);

-- 3. RLS
ALTER TABLE public.league_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public/authenticated can view cohorts"
  ON public.league_cohorts
  FOR SELECT
  USING (true);

CREATE POLICY "Public/authenticated can view cohort members"
  ON public.league_cohort_members
  FOR SELECT
  USING (true);

CREATE POLICY "Students can insert own cohort membership"
  ON public.league_cohort_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = league_cohort_members.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own cohort membership"
  ON public.league_cohort_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = league_cohort_members.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to cohorts"
  ON public.league_cohorts
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

CREATE POLICY "Admins have full access to cohort members"
  ON public.league_cohort_members
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

-- 4. Stored Procedure: assign_student_to_weekly_cohort
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
BEGIN
  -- Determine current week's Monday (UTC)
  v_week_start := date_trunc('week', now() AT TIME ZONE 'utc')::date;

  -- Check if student is already in a cohort for this week
  SELECT c.id INTO v_cohort_id
  FROM public.league_cohort_members m
  JOIN public.league_cohorts c ON c.id = m.cohort_id
  WHERE m.student_id = p_student_id
    AND c.week_start_date = v_week_start
  LIMIT 1;

  IF v_cohort_id IS NOT NULL THEN
    RETURN v_cohort_id;
  END IF;

  -- Get student's current league tier
  SELECT COALESCE(current_league_tier, 1) INTO v_tier
  FROM public.student_gamification_profile
  WHERE student_id = p_student_id;

  IF v_tier IS NULL THEN
    v_tier := 1;
  END IF;

  -- Find an open cohort with < 30 members for this tier and week
  SELECT c.id INTO v_cohort_id
  FROM public.league_cohorts c
  WHERE c.league_tier = v_tier
    AND c.week_start_date = v_week_start
    AND (
      SELECT count(*) FROM public.league_cohort_members cm WHERE cm.cohort_id = c.id
    ) < 30
  ORDER BY c.cohort_number ASC
  LIMIT 1;

  -- If no open cohort exists, create a new cohort
  IF v_cohort_id IS NULL THEN
    SELECT COALESCE(MAX(cohort_number), 0) + 1 INTO v_cohort_num
    FROM public.league_cohorts
    WHERE league_tier = v_tier
      AND week_start_date = v_week_start;

    INSERT INTO public.league_cohorts (league_tier, week_start_date, cohort_number)
    VALUES (v_tier, v_week_start, v_cohort_num)
    RETURNING id INTO v_cohort_id;
  END IF;

  -- Add student to cohort with initial weekly EP from profile or ledger
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

-- 5. Stored Procedure: update_student_cohort_points
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
BEGIN
  -- Ensure student is in a cohort
  v_cohort_id := public.assign_student_to_weekly_cohort(p_student_id);

  UPDATE public.league_cohort_members
  SET weekly_points = weekly_points + p_additional_ep
  WHERE cohort_id = v_cohort_id
    AND student_id = p_student_id;
END;
$$;

-- 6. RPC Function: get_student_league_cohort
CREATE OR REPLACE FUNCTION public.get_student_league_cohort(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_id uuid;
  v_tier integer;
  v_cohort_num integer;
  v_week_start date;
  v_members jsonb;
BEGIN
  -- Ensure student is assigned
  v_cohort_id := public.assign_student_to_weekly_cohort(p_student_id);

  SELECT league_tier, cohort_number, week_start_date
  INTO v_tier, v_cohort_num, v_week_start
  FROM public.league_cohorts
  WHERE id = v_cohort_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'student_id', m.student_id,
      'name', COALESCE(s.name, 'Student'),
      'username', s.username,
      'avatar_url', s.avatar_url,
      'school_name', sc.name,
      'weekly_ep', m.weekly_points,
      'rank', m.member_rank,
      'is_current_user', (m.student_id = p_student_id)
    )
  ) INTO v_members
  FROM (
    SELECT 
      lcm.student_id,
      lcm.weekly_points,
      lcm.joined_at,
      ROW_NUMBER() OVER (ORDER BY lcm.weekly_points DESC, lcm.joined_at ASC) as member_rank
    FROM public.league_cohort_members lcm
    WHERE lcm.cohort_id = v_cohort_id
  ) m
  JOIN public.students s ON s.id = m.student_id
  LEFT JOIN public.schools sc ON sc.id = s.school_id;

  RETURN jsonb_build_object(
    'cohort_id', v_cohort_id,
    'league_tier', v_tier,
    'cohort_number', v_cohort_num,
    'week_start_date', v_week_start,
    'members', COALESCE(v_members, '[]'::jsonb)
  );
END;
$$;
