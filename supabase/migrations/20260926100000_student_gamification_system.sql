-- Migration: 20260926100000_student_gamification_system.sql
-- Implements Phase 1 Gamification Infrastructure: Points Ledger, Gamification Profile, Topic Mastery, and Badges

-- 1. Create student_points_ledger table
CREATE TABLE IF NOT EXISTS public.student_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source_type text NOT NULL,
  reference_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create student_gamification_profile table
CREATE TABLE IF NOT EXISTS public.student_gamification_profile (
  student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  lifetime_ep bigint NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  weekly_ep integer NOT NULL DEFAULT 0,
  monthly_ep integer NOT NULL DEFAULT 0,
  current_league_tier integer NOT NULL DEFAULT 1,
  streak_count integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_qualifying_date date,
  streak_shields integer NOT NULL DEFAULT 0 CHECK (streak_shields >= 0 AND streak_shields <= 2),
  pinned_badge_ids text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create student_topic_mastery table
CREATE TABLE IF NOT EXISTS public.student_topic_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  rolling_answers boolean[] NOT NULL DEFAULT '{}'::boolean[],
  rolling_accuracy numeric(5,2) NOT NULL DEFAULT 0.0,
  status text NOT NULL DEFAULT 'developing',
  total_attempted integer NOT NULL DEFAULT 0,
  last_assessed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject, topic)
);

-- 4. Create student_badges table
CREATE TABLE IF NOT EXISTS public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(student_id, badge_id)
);

-- Create Indexes for fast querying and leaderboard aggregation
CREATE INDEX IF NOT EXISTS idx_student_points_ledger_student_id ON public.student_points_ledger(student_id);
CREATE INDEX IF NOT EXISTS idx_student_points_ledger_created_at ON public.student_points_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_student_points_ledger_source_type ON public.student_points_ledger(source_type);
CREATE INDEX IF NOT EXISTS idx_student_gamification_profile_lifetime_ep ON public.student_gamification_profile(lifetime_ep DESC);
CREATE INDEX IF NOT EXISTS idx_student_gamification_profile_weekly_ep ON public.student_gamification_profile(weekly_ep DESC);
CREATE INDEX IF NOT EXISTS idx_student_topic_mastery_student_id ON public.student_topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON public.student_badges(student_id);

-- Backfill gamification profile for all existing students
INSERT INTO public.student_gamification_profile (student_id, streak_count, longest_streak, last_qualifying_date)
SELECT 
  s.id,
  COALESCE(ss.current_streak, 0),
  COALESCE(ss.longest_streak, 0),
  ss.last_activity_date
FROM public.students s
LEFT JOIN public.student_streaks ss ON ss.student_id = s.id
ON CONFLICT (student_id) DO NOTHING;

-- Auto-provision gamification profile when a new student is inserted
CREATE OR REPLACE FUNCTION public.handle_new_student_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_gamification_profile (student_id)
  VALUES (NEW.id)
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_student_created_gamification ON public.students;
CREATE TRIGGER on_student_created_gamification
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_gamification();

-- Enable Row Level Security (RLS)
ALTER TABLE public.student_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_gamification_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

-- RLS: student_points_ledger
CREATE POLICY "Students can view own points ledger"
  ON public.student_points_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_points_ledger.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own points ledger"
  ON public.student_points_ledger
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_points_ledger.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view linked children points ledger"
  ON public.student_points_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.id = student_points_ledger.student_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Schools can view student points ledger"
  ON public.student_points_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.schools sc ON sc.id = s.school_id
      WHERE s.id = student_points_ledger.student_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to points ledger"
  ON public.student_points_ledger
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

-- RLS: student_gamification_profile
CREATE POLICY "Students can view own gamification profile"
  ON public.student_gamification_profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_gamification_profile.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own gamification profile"
  ON public.student_gamification_profile
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_gamification_profile.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Public / authenticated users can view profiles for leaderboards"
  ON public.student_gamification_profile
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Parents can view linked children gamification profile"
  ON public.student_gamification_profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.id = student_gamification_profile.student_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to gamification profiles"
  ON public.student_gamification_profile
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

-- RLS: student_topic_mastery
CREATE POLICY "Students can view own topic mastery"
  ON public.student_topic_mastery
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_topic_mastery.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own topic mastery"
  ON public.student_topic_mastery
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_topic_mastery.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own topic mastery"
  ON public.student_topic_mastery
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_topic_mastery.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view linked children topic mastery"
  ON public.student_topic_mastery
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.id = student_topic_mastery.student_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to topic mastery"
  ON public.student_topic_mastery
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

-- RLS: student_badges
CREATE POLICY "Students can view own badges"
  ON public.student_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_badges.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own badges"
  ON public.student_badges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_badges.student_id
        AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Public / authenticated users can view badges for showcases"
  ON public.student_badges
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Parents can view linked children badges"
  ON public.student_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.id = student_badges.student_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to badges"
  ON public.student_badges
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));
