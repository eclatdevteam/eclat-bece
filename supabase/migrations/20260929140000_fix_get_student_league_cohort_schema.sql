-- Migration: 20260929140000_fix_get_student_league_cohort_schema.sql
-- Fixes column reference errors in get_student_league_cohort:
-- 1. Joins public.profiles p ON p.id = s.user_id for student name, username, and avatar_url
-- 2. Uses sc.school_name instead of sc.name from public.schools

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
      'name', COALESCE(p.full_name, p.username, 'Student'),
      'username', p.username,
      'avatar_url', p.avatar_url,
      'school_name', sc.school_name,
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
  LEFT JOIN public.profiles p ON p.id = s.user_id
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
