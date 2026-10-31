-- Migration: 20261031230500_upgrade_public_leaderboard_avatars_and_science.sql
-- Upgrades get_public_leaderboard to include avatar_url for student photos and adds the Science specialist leaderboard

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
                    COALESCE(sgp.weekly_ep, 0)::int as points,
                    p.avatar_url as avatar_url
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        ),
        -- 2. Monthly Leaderboard (National Championship)
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
                    COALESCE(sgp.monthly_ep, 0)::int as points,
                    p.avatar_url as avatar_url
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
                    COALESCE(sgp.lifetime_ep, 0)::bigint as points,
                    p.avatar_url as avatar_url
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
                    COALESCE(SUM(spl.amount), 0)::int as points,
                    p.avatar_url as avatar_url
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                JOIN student_points_ledger spl ON spl.student_id = s.id 
                  AND (spl.metadata->>'subject' ILIKE '%Math%')
                GROUP BY s.id, p.full_name, p.username, p.avatar_url, s.school_id, sch.school_name, sgp.current_level
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
                    COALESCE(SUM(spl.amount), 0)::int as points,
                    p.avatar_url as avatar_url
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                JOIN student_points_ledger spl ON spl.student_id = s.id 
                  AND (spl.metadata->>'subject' ILIKE '%English%')
                GROUP BY s.id, p.full_name, p.username, p.avatar_url, s.school_id, sch.school_name, sgp.current_level
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        ),
        -- 6. Science Specialist Leaderboard (Basic Science / BST)
        'science', (
            SELECT COALESCE(json_agg(t), '[]'::json)
            FROM (
                SELECT 
                    s.id as student_id,
                    COALESCE(NULLIF(p.full_name, ''), p.username, 'Learner') as name,
                    COALESCE(sch.school_name, 'Independent Scholar') as school,
                    s.school_id,
                    COALESCE(sgp.current_level, 1) as level,
                    COALESCE(SUM(spl.amount), 0)::int as points,
                    p.avatar_url as avatar_url
                FROM students s
                LEFT JOIN profiles p ON s.user_id = p.id
                LEFT JOIN schools sch ON s.school_id = sch.id
                LEFT JOIN student_gamification_profile sgp ON sgp.student_id = s.id
                JOIN student_points_ledger spl ON spl.student_id = s.id 
                  AND (spl.metadata->>'subject' ILIKE '%Sci%')
                GROUP BY s.id, p.full_name, p.username, p.avatar_url, s.school_id, sch.school_name, sgp.current_level
                ORDER BY points DESC, name ASC
                LIMIT 20
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant execution permission to public anonymous users and authenticated accounts
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_public_leaderboard() IS 'Public leaderboard feed for landing and competition views including student avatar_url and science specialization.';

