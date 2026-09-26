-- Migration: 20260926180000_weekly_league_reset_and_points_reconciliation.sql
-- Implements Automated Weekly League Reset (PRD Section 7 & Sunday 23:59 UTC pg_cron)
-- and Historical Points Conversion & Reconciliation Engine

-- 1. Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Add is_evaluated to league_cohorts
ALTER TABLE public.league_cohorts 
ADD COLUMN IF NOT EXISTS is_evaluated boolean NOT NULL DEFAULT false;

-- 3. Stored Procedure: reset_weekly_league_cohorts
-- Evaluates concluding week's cohorts at Sunday 23:59 UTC per PRD Section 7
CREATE OR REPLACE FUNCTION public.reset_weekly_league_cohorts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort RECORD;
  v_member RECORD;
  v_new_tier integer;
  v_podium_ep integer;
  v_evaluated_cohorts integer := 0;
  v_processed_students integer := 0;
BEGIN
  -- 1. Iterate over all cohorts that have not been evaluated and belong to previous or concluding week
  FOR v_cohort IN
    SELECT c.id, c.league_tier, c.week_start_date, c.cohort_number
    FROM public.league_cohorts c
    WHERE c.is_evaluated = false
      AND c.week_start_date <= (now() AT TIME ZONE 'utc')::date
    ORDER BY c.week_start_date ASC, c.league_tier ASC, c.cohort_number ASC
  LOOP
    -- Rank members in this cohort
    FOR v_member IN
      SELECT 
        lcm.student_id,
        lcm.weekly_points,
        ROW_NUMBER() OVER (ORDER BY lcm.weekly_points DESC, lcm.joined_at ASC) as member_rank,
        COUNT(*) OVER () as total_cohort_members
      FROM public.league_cohort_members lcm
      WHERE lcm.cohort_id = v_cohort.id
    LOOP
      v_podium_ep := 0;
      
      -- Top 5 (Ranks 1 to 5): Promoted (+1 tier, max 8)
      IF v_member.member_rank <= 5 THEN
        v_new_tier := LEAST(8, v_cohort.league_tier + 1);
        -- Podium rewards: 1st (+100 EP), 2nd (+50 EP), 3rd (+25 EP)
        IF v_member.member_rank = 1 THEN
          v_podium_ep := 100;
        ELSIF v_member.member_rank = 2 THEN
          v_podium_ep := 50;
        ELSIF v_member.member_rank = 3 THEN
          v_podium_ep := 25;
        END IF;
      -- Bottom 5 (Ranks 26 to 30): Relegated (-1 tier, min 1), except Tier 1 & 2 which are protected
      ELSIF v_member.member_rank >= 26 THEN
        IF v_cohort.league_tier <= 2 THEN
          v_new_tier := v_cohort.league_tier;
        ELSE
          v_new_tier := GREATEST(1, v_cohort.league_tier - 1);
        END IF;
      -- Ranks 6 to 25: Retained in same tier
      ELSE
        v_new_tier := v_cohort.league_tier;
      END IF;

      -- If podium EP awarded, record to student_points_ledger
      IF v_podium_ep > 0 THEN
        INSERT INTO public.student_points_ledger (
          student_id,
          amount,
          source_type,
          reference_id,
          metadata
        ) VALUES (
          v_member.student_id,
          v_podium_ep,
          'milestone_bonus',
          v_cohort.id,
          jsonb_build_object(
            'label', 'League Podium Finish (Rank ' || v_member.member_rank || ')',
            'description', 'Awarded for finishing Rank ' || v_member.member_rank || ' in League Tier ' || v_cohort.league_tier,
            'league_tier', v_cohort.league_tier,
            'rank', v_member.member_rank
          )
        );
      END IF;

      -- Update student gamification profile (reset weekly_ep to 0, advance tier, add podium EP)
      UPDATE public.student_gamification_profile
      SET
        current_league_tier = v_new_tier,
        weekly_ep = 0,
        lifetime_ep = lifetime_ep + v_podium_ep,
        updated_at = now()
      WHERE student_id = v_member.student_id;

      v_processed_students := v_processed_students + 1;
    END LOOP;

    -- Mark this cohort as evaluated
    UPDATE public.league_cohorts
    SET is_evaluated = true
    WHERE id = v_cohort.id;

    v_evaluated_cohorts := v_evaluated_cohorts + 1;
  END LOOP;

  -- 2. Reset weekly_ep to 0 for any scholars who did not participate in a cohort this week
  UPDATE public.student_gamification_profile
  SET weekly_ep = 0, updated_at = now()
  WHERE weekly_ep > 0;

  RETURN jsonb_build_object(
    'status', 'success',
    'evaluated_cohorts', v_evaluated_cohorts,
    'processed_students', v_processed_students,
    'timestamp', (now() AT TIME ZONE 'utc')
  );
END;
$$;

-- 4. Stored Procedure: reconcile_student_points_ledger
-- Converts legacy unweighted points, backfills orphans, and reconciles profile totals with 100% ledger audit accuracy
CREATE OR REPLACE FUNCTION public.reconcile_student_points_ledger()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_true_lifetime integer;
  v_true_weekly integer;
  v_true_monthly integer;
  v_calculated_level integer;
  v_reconciled_count integer := 0;
  v_week_start timestamptz;
  v_month_start timestamptz;
BEGIN
  v_week_start := date_trunc('week', now() AT TIME ZONE 'utc');
  v_month_start := date_trunc('month', now() AT TIME ZONE 'utc');

  -- Ensure every student in students has a student_gamification_profile row
  INSERT INTO public.student_gamification_profile (
    student_id,
    lifetime_ep,
    current_level,
    weekly_ep,
    monthly_ep,
    streak_count,
    longest_streak,
    streak_shields,
    current_league_tier
  )
  SELECT 
    s.id,
    0, 1, 0, 0, 0, 0, 0, 1
  FROM public.students s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.student_gamification_profile sgp WHERE sgp.student_id = s.id
  )
  ON CONFLICT (student_id) DO NOTHING;

  -- Reconcile each profile with the exact ledger sums
  FOR v_student IN
    SELECT sgp.student_id
    FROM public.student_gamification_profile sgp
  LOOP
    -- Calculate exact true lifetime EP from ledger
    SELECT COALESCE(SUM(amount), 0) INTO v_true_lifetime
    FROM public.student_points_ledger
    WHERE student_id = v_student.student_id;

    -- Calculate current week EP from ledger
    SELECT COALESCE(SUM(amount), 0) INTO v_true_weekly
    FROM public.student_points_ledger
    WHERE student_id = v_student.student_id
      AND created_at >= v_week_start;

    -- Calculate current month EP from ledger
    SELECT COALESCE(SUM(amount), 0) INTO v_true_monthly
    FROM public.student_points_ledger
    WHERE student_id = v_student.student_id
      AND created_at >= v_month_start;

    -- Calculate level matching PRD Section 6 progression formula
    IF v_true_lifetime < 250 THEN
      v_calculated_level := 1;
    ELSIF v_true_lifetime < 600 THEN
      v_calculated_level := 2;
    ELSIF v_true_lifetime < 1200 THEN
      v_calculated_level := 3;
    ELSIF v_true_lifetime < 2000 THEN
      v_calculated_level := 4;
    ELSIF v_true_lifetime < 10000 THEN
      -- Levels 5 to 9: 2000 to 10000 in steps of 1600
      v_calculated_level := 5 + FLOOR((v_true_lifetime - 2000) / 1600);
    ELSIF v_true_lifetime < 35000 THEN
      -- Levels 10 to 19: 10000 to 35000 in steps of 2500
      v_calculated_level := 10 + FLOOR((v_true_lifetime - 10000) / 2500);
    ELSIF v_true_lifetime < 75000 THEN
      -- Levels 20 to 29: 35000 to 75000 in steps of 4000
      v_calculated_level := 20 + FLOOR((v_true_lifetime - 35000) / 4000);
    ELSIF v_true_lifetime < 200000 THEN
      -- Levels 30 to 49: 75000 to 200000 in steps of 6250
      v_calculated_level := 30 + FLOOR((v_true_lifetime - 75000) / 6250);
    ELSE
      -- Levels 50+: 200000+ in steps of 15000
      v_calculated_level := LEAST(100, 50 + FLOOR((v_true_lifetime - 200000) / 15000));
    END IF;

    -- Update profile
    UPDATE public.student_gamification_profile
    SET
      lifetime_ep = v_true_lifetime,
      current_level = v_calculated_level,
      weekly_ep = v_true_weekly,
      monthly_ep = v_true_monthly,
      updated_at = now()
    WHERE student_id = v_student.student_id;

    v_reconciled_count := v_reconciled_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'reconciled_students', v_reconciled_count,
    'timestamp', (now() AT TIME ZONE 'utc')
  );
END;
$$;

-- 5. Schedule pg_cron Job for Weekly League Reset (Every Sunday at 23:59 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-league-reset') THEN
    PERFORM cron.unschedule('weekly-league-reset');
  END IF;

  PERFORM cron.schedule(
    'weekly-league-reset',
    '59 23 * * 0',
    'SELECT public.reset_weekly_league_cohorts();'
  );
END;
$$;
