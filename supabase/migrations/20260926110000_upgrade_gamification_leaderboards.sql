-- Migration: 20260926110000_upgrade_gamification_leaderboards.sql
-- Backfills historical points into student_points_ledger and upgrades get_public_leaderboard to support PRD Feature Module 5

-- 1. Backfill student_points_ledger from historical quiz_results
INSERT INTO public.student_points_ledger (
  student_id,
  amount,
  source_type,
  reference_id,
  metadata,
  created_at
)
SELECT 
  qr.student_id,
  (
    (qr.correct_answers * 10) + 
    ROUND((qr.correct_answers * 10) * (
      CASE 
        WHEN qr.score >= 100 THEN 0.30
        WHEN qr.score >= 90 THEN 0.20
        WHEN qr.score >= 80 THEN 0.15
        WHEN qr.score >= 70 THEN 0.10
        WHEN qr.score >= 50 THEN 0.05
        ELSE 0.0
      END
    ))
  )::int AS amount,
  'base_question' AS source_type,
  qr.id AS reference_id,
  json_build_object(
    'subject', qr.subject,
    'score', qr.score,
    'total_questions', qr.total_questions,
    'correct_answers', qr.correct_answers,
    'historical_backfill', true
  )::jsonb AS metadata,
  qr.completed_at AS created_at
FROM public.quiz_results qr
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_points_ledger spl
  WHERE spl.reference_id = qr.id
);

-- 2. Update student_gamification_profile with aggregated historical points
WITH student_totals AS (
  SELECT 
    spl.student_id,
    COALESCE(SUM(spl.amount), 0)::bigint AS lifetime_ep,
    COALESCE(SUM(CASE WHEN spl.created_at >= DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC') THEN spl.amount ELSE 0 END), 0)::int AS weekly_ep,
    COALESCE(SUM(CASE WHEN spl.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') THEN spl.amount ELSE 0 END), 0)::int AS monthly_ep
  FROM public.student_points_ledger spl
  GROUP BY spl.student_id
)
UPDATE public.student_gamification_profile sgp
SET 
  lifetime_ep = st.lifetime_ep,
  weekly_ep = st.weekly_ep,
  monthly_ep = st.monthly_ep,
  current_level = CASE 
    WHEN st.lifetime_ep >= 200000 THEN 50
    WHEN st.lifetime_ep >= 75000 THEN 30
    WHEN st.lifetime_ep >= 35000 THEN 20
    WHEN st.lifetime_ep >= 10000 THEN 10
    WHEN st.lifetime_ep >= 2000 THEN 5
    WHEN st.lifetime_ep >= 1200 THEN 4
    WHEN st.lifetime_ep >= 600 THEN 3
    WHEN st.lifetime_ep >= 250 THEN 2
    ELSE 1
  END,
  updated_at = NOW()
FROM student_totals st
WHERE sgp.student_id = st.student_id;

-- 3. Upgrade get_public_leaderboard to return Weekly, Monthly, All-Time, and Subject views
CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        -- 1. Weekly Leaderboard (Monday 00:00 UTC to Sunday 23:59 UTC)
        'weekly', (
            SELECT COALESCE(json_agg(t), '[]'::json)
            FROM (
                SELECT 
                    s.id as student_id,
                    COALESCE(NULLIF(p.full_name, ''), p.username, 'Learner') as name,
                    COALESCE(sch.school_name, 'Independent Scholar') as school,
                    s.school_id,
                    COALESCE(sgp.current_level, 1) as level,
                    COALESCE(sgp.current_league_tier, 1) as league_tier,
                    COALESCE(sgp.weekly_ep, 0)::int as points
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        ),
        -- 2. Monthly Leaderboard
        'monthly', (
            SELECT COALESCE(json_agg(t), '[]'::json)
            FROM (
                SELECT 
                    s.id as student_id,
                    COALESCE(NULLIF(p.full_name, ''), p.username, 'Learner') as name,
                    COALESCE(sch.school_name, 'Independent Scholar') as school,
                    s.school_id,
                    COALESCE(sgp.current_level, 1) as level,
                    COALESCE(sgp.current_league_tier, 1) as league_tier,
                    COALESCE(sgp.monthly_ep, 0)::int as points
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        ),
        -- 3. All-Time Hall of Fame
        'all_time', (
            SELECT COALESCE(json_agg(t), '[]'::json)
            FROM (
                SELECT 
                    s.id as student_id,
                    COALESCE(NULLIF(p.full_name, ''), p.username, 'Learner') as name,
                    COALESCE(sch.school_name, 'Independent Scholar') as school,
                    s.school_id,
                    COALESCE(sgp.current_level, 1) as level,
                    COALESCE(sgp.current_league_tier, 1) as league_tier,
                    COALESCE(sgp.lifetime_ep, 0)::bigint as points
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        ),
        -- 4. Mathematics Specialist Leaderboard
        'math', (
            SELECT COALESCE(json_agg(t), '[]'::json)
            FROM (
                SELECT 
                    s.id as student_id,
                    COALESCE(NULLIF(p.full_name, ''), p.username, 'Learner') as name,
                    COALESCE(sch.school_name, 'Independent Scholar') as school,
                    s.school_id,
                    COALESCE(sgp.current_level, 1) as level,
                    COALESCE(SUM(spl.amount), 0)::int as points
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                JOIN student_points_ledger spl ON spl.student_id = s.id 
                  AND (spl.metadata->>'subject' ILIKE '%Math%')
                GROUP BY s.id, p.full_name, p.username, s.school_id, sch.school_name, sgp.current_level
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        ),
        -- 5. English Specialist Leaderboard
        'english', (
            SELECT COALESCE(json_agg(t), '[]'::json)
            FROM (
                SELECT 
                    s.id as student_id,
                    COALESCE(NULLIF(p.full_name, ''), p.username, 'Learner') as name,
                    COALESCE(sch.school_name, 'Independent Scholar') as school,
                    s.school_id,
                    COALESCE(sgp.current_level, 1) as level,
                    COALESCE(SUM(spl.amount), 0)::int as points
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                JOIN student_points_ledger spl ON spl.student_id = s.id 
                  AND (spl.metadata->>'subject' ILIKE '%English%')
                GROUP BY s.id, p.full_name, p.username, s.school_id, sch.school_name, sgp.current_level
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
