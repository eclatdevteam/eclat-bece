-- Migration: 20260926160000_phase3_ecosystem_and_parent_digests.sql
-- Phase 3: Parent Weekly Growth Digests and Verified Academic Distinction Certificates

CREATE TABLE IF NOT EXISTS public.parent_weekly_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  headline text NOT NULL,
  narrative text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{
    "days_active": 0,
    "ep_earned": 0,
    "current_level": 1,
    "league_tier": 1,
    "league_movement": "retained",
    "turnarounds": [],
    "new_badges": [],
    "current_focus_areas": []
  }'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_parent_weekly_digests_parent ON public.parent_weekly_digests(parent_id, student_id);

ALTER TABLE public.parent_weekly_digests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parent_weekly_digests' AND policyname = 'Parents can view own digests') THEN
    CREATE POLICY "Parents can view own digests"
      ON public.parent_weekly_digests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.parents p
          WHERE p.id = parent_weekly_digests.parent_id
            AND p.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parent_weekly_digests' AND policyname = 'Parents can insert own digests') THEN
    CREATE POLICY "Parents can insert own digests"
      ON public.parent_weekly_digests FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.parents p
          WHERE p.id = parent_weekly_digests.parent_id
            AND p.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parent_weekly_digests' AND policyname = 'Parents can update own digests') THEN
    CREATE POLICY "Parents can update own digests"
      ON public.parent_weekly_digests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.parents p
          WHERE p.id = parent_weekly_digests.parent_id
            AND p.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parent_weekly_digests' AND policyname = 'Admins have full access to digests') THEN
    CREATE POLICY "Admins have full access to digests"
      ON public.parent_weekly_digests FOR ALL
      USING (COALESCE(public.is_admin(auth.uid()), false))
      WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.student_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  verification_code text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_student_certificates_student ON public.student_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_student_certificates_code ON public.student_certificates(verification_code);

ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_certificates' AND policyname = 'Public / authenticated users can view certificates') THEN
    CREATE POLICY "Public / authenticated users can view certificates"
      ON public.student_certificates FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_certificates' AND policyname = 'Students can insert own certificates') THEN
    CREATE POLICY "Students can insert own certificates"
      ON public.student_certificates FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.students
          WHERE students.id = student_certificates.student_id
            AND students.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_certificates' AND policyname = 'Admins have full access to certificates') THEN
    CREATE POLICY "Admins have full access to certificates"
      ON public.student_certificates FOR ALL
      USING (COALESCE(public.is_admin(auth.uid()), false))
      WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));
  END IF;
END $$;
