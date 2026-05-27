-- Parent-controlled student accounts, assignments, and subscription state.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

UPDATE public.students
SET is_premium = false
WHERE is_premium IS NULL;

ALTER TABLE public.students
  ALTER COLUMN is_premium SET DEFAULT false,
  ALTER COLUMN is_premium SET NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Canonicalize student links to parents.id / schools.id instead of auth.users.id.
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_parent_id_fkey;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_school_id_fkey;

UPDATE public.students s
SET parent_id = p.id
FROM public.parents p
WHERE s.parent_id = p.user_id;

UPDATE public.students s
SET school_id = sc.id
FROM public.schools sc
WHERE s.school_id = sc.user_id;

UPDATE public.students s
SET parent_id = NULL
WHERE s.parent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.parents p WHERE p.id = s.parent_id
  );

UPDATE public.students s
SET school_id = NULL
WHERE s.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.schools sc WHERE sc.id = s.school_id
  );

ALTER TABLE public.students
  ADD CONSTRAINT students_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE SET NULL;

ALTER TABLE public.students
  ADD CONSTRAINT students_school_id_fkey
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);

-- Students are provisioned by parents through edge functions, not by public self-insert.
DROP POLICY IF EXISTS "Students can insert own record" ON public.students;
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

DROP POLICY IF EXISTS "Parents can view their children's profiles" ON public.profiles;
CREATE POLICY "Parents can view their children's profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.user_id = profiles.id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can view their students' profiles" ON public.profiles;
CREATE POLICY "Schools can view their students' profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.schools sc ON sc.id = s.school_id
      WHERE s.user_id = profiles.id
        AND sc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
CREATE POLICY "Parents can view their children"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.parents p
      WHERE p.id = students.parent_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can update their children" ON public.students;
CREATE POLICY "Parents can update their children"
  ON public.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.parents p
      WHERE p.id = students.parent_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can view their students" ON public.students;
CREATE POLICY "Schools can view their students"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.schools sc
      WHERE sc.id = students.school_id
        AND sc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can update their students" ON public.students;
CREATE POLICY "Schools can update their students"
  ON public.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.schools sc
      WHERE sc.id = students.school_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_student_self_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.user_id THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.class_year IS DISTINCT FROM OLD.class_year
      OR NEW.is_premium IS DISTINCT FROM OLD.is_premium
      OR NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed THEN
      RAISE EXCEPTION 'Students cannot update protected account fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_student_self_update_rules ON public.students;
CREATE TRIGGER enforce_student_self_update_rules
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_self_update_rules();

DROP POLICY IF EXISTS "Parents can view their children's quiz results" ON public.quiz_results;
CREATE POLICY "Parents can view their children's quiz results"
  ON public.quiz_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.id = quiz_results.student_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Schools can view their students' quiz results" ON public.quiz_results;
CREATE POLICY "Schools can view their students' quiz results"
  ON public.quiz_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.schools sc ON sc.id = s.school_id
      WHERE s.id = quiz_results.student_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.practice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  num_questions INTEGER NOT NULL CHECK (num_questions > 0 AND num_questions <= 60),
  duration INTEGER NOT NULL CHECK (duration >= 1 AND duration <= 240),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  score NUMERIC,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_practice_assignments_student_id
  ON public.practice_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_practice_assignments_parent_id
  ON public.practice_assignments(parent_id);

CREATE INDEX IF NOT EXISTS idx_practice_assignments_status
  ON public.practice_assignments(status);

DROP TRIGGER IF EXISTS set_practice_assignments_updated_at ON public.practice_assignments;
CREATE TRIGGER set_practice_assignments_updated_at
  BEFORE UPDATE ON public.practice_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP POLICY IF EXISTS "Parents can view their children's assignments" ON public.practice_assignments;
CREATE POLICY "Parents can view their children's assignments"
  ON public.practice_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.id = practice_assignments.parent_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can create assignments for their children" ON public.practice_assignments;
CREATE POLICY "Parents can create assignments for their children"
  ON public.practice_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.parents p
      JOIN public.students s ON s.parent_id = p.id
      WHERE p.id = practice_assignments.parent_id
        AND s.id = practice_assignments.student_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents can update their children's assignments" ON public.practice_assignments;
CREATE POLICY "Parents can update their children's assignments"
  ON public.practice_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.id = practice_assignments.parent_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own assignments" ON public.practice_assignments;
CREATE POLICY "Students can view own assignments"
  ON public.practice_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = practice_assignments.student_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can update own assignments" ON public.practice_assignments;
CREATE POLICY "Students can update own assignments"
  ON public.practice_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = practice_assignments.student_id
        AND s.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_practice_assignment_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
  v_is_premium BOOLEAN;
  v_student_user_id UUID;
BEGIN
  IF COALESCE(array_length(NEW.topics, 1), 0) = 0 THEN
    RAISE EXCEPTION 'At least one topic is required';
  END IF;

  SELECT parent_id, is_premium, user_id
  INTO v_parent_id, v_is_premium, v_student_user_id
  FROM public.students
  WHERE id = NEW.student_id;

  IF TG_OP = 'UPDATE' AND auth.uid() = v_student_user_id THEN
    IF NEW.student_id IS DISTINCT FROM OLD.student_id
      OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
      OR NEW.subject IS DISTINCT FROM OLD.subject
      OR NEW.topics IS DISTINCT FROM OLD.topics
      OR NEW.num_questions IS DISTINCT FROM OLD.num_questions
      OR NEW.duration IS DISTINCT FROM OLD.duration THEN
      RAISE EXCEPTION 'Students can only update assignment progress fields';
    END IF;

    IF NEW.status NOT IN ('in_progress', 'completed') THEN
      RAISE EXCEPTION 'Students can only mark assignments as in progress or completed';
    END IF;
  END IF;

  IF v_parent_id IS NULL OR v_parent_id <> NEW.parent_id THEN
    RAISE EXCEPTION 'Assignment parent must own the selected student';
  END IF;

  IF COALESCE(v_is_premium, false) = false AND NEW.num_questions > 10 THEN
    RAISE EXCEPTION 'Standard student accounts are limited to 10 questions per assignment';
  END IF;

  IF NEW.num_questions > 60 THEN
    RAISE EXCEPTION 'Assignments cannot exceed 60 questions';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_practice_assignment_rules ON public.practice_assignments;
CREATE TRIGGER enforce_practice_assignment_rules
  BEFORE INSERT OR UPDATE OF student_id, parent_id, topics, num_questions ON public.practice_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_practice_assignment_rules();

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'premium_annual',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  amount INTEGER NOT NULL DEFAULT 15000,
  currency TEXT NOT NULL DEFAULT 'NGN',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subscriptions_parent_id
  ON public.subscriptions(parent_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id
  ON public.subscriptions(student_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_student
  ON public.subscriptions(student_id)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP POLICY IF EXISTS "Parents can view subscriptions for their children" ON public.subscriptions;
CREATE POLICY "Parents can view subscriptions for their children"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.id = subscriptions.parent_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Students can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = subscriptions.student_id
        AND s.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.notify_practice_assignment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_user_id UUID;
BEGIN
  SELECT user_id
  INTO v_student_user_id
  FROM public.students
  WHERE id = NEW.student_id;

  IF v_student_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_student_user_id,
      'practice_assignment',
      'New Practice Task',
      'You have a new ' || NEW.subject || ' practice task.',
      jsonb_build_object('assignment_id', NEW.id, 'student_id', NEW.student_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_practice_assignment_created ON public.practice_assignments;
CREATE TRIGGER on_practice_assignment_created
  AFTER INSERT ON public.practice_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_practice_assignment_created();

CREATE OR REPLACE FUNCTION public.notify_practice_assignment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_user_id UUID;
  v_student_name TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT p.user_id, COALESCE(pr.full_name, 'Your child')
    INTO v_parent_user_id, v_student_name
    FROM public.parents p
    JOIN public.students s ON s.parent_id = p.id
    LEFT JOIN public.profiles pr ON pr.id = s.user_id
    WHERE s.id = NEW.student_id;

    IF v_parent_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_parent_user_id,
        'practice_completed',
        'Practice Completed',
        v_student_name || ' completed a ' || NEW.subject || ' practice task.',
        jsonb_build_object(
          'assignment_id', NEW.id,
          'student_id', NEW.student_id,
          'score', NEW.score
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_practice_assignment_completed ON public.practice_assignments;
CREATE TRIGGER on_practice_assignment_completed
  AFTER UPDATE ON public.practice_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_practice_assignment_completed();
