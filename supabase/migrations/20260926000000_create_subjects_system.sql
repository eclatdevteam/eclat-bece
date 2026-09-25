-- Migration: 20260926000000_create_subjects_system.sql
-- Description: Create subjects table, RLS policies, seed data, and administrative RPC functions.

-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'elective')),
    description TEXT,
    available_year_6 BOOLEAN NOT NULL DEFAULT true,
    available_year_9 BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT uq_subjects_name_ci UNIQUE (name),
    CONSTRAINT uq_subjects_code_ci UNIQUE (code),
    CONSTRAINT chk_at_least_one_cohort CHECK (available_year_6 = true OR available_year_9 = true)
);

-- Performance & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_active_order ON public.subjects (is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_subjects_cohort_year6 ON public.subjects (available_year_6) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subjects_cohort_year9 ON public.subjects (available_year_9) WHERE is_active = true;

-- 2. Seed initial subjects from existing question pools
INSERT INTO public.subjects (name, code, icon, category, description, available_year_6, available_year_9, display_order)
VALUES
    ('Mathematics', 'MATH', '📐', 'core', 'Core numeracy, algebra, geometry, and arithmetic processes.', true, true, 1),
    ('English Language', 'ENG', '📚', 'core', 'Core literacy, grammar, composition, and reading comprehension.', true, true, 2),
    ('Basic Science', 'SCI', '🔬', 'core', 'Foundational sciences, living things, energy, and physical processes.', true, true, 3),
    ('Social Studies', 'SOC', '🌍', 'core', 'Civic education, national economy, culture, and environmental awareness.', true, true, 4),
    ('General Paper', 'GEN', '📝', 'core', 'General quantitative and verbal aptitude assessments.', true, false, 5),
    ('Business Studies', 'BUS', '💼', 'elective', 'Foundations of commerce, bookkeeping, office practice, and enterprise.', false, true, 6)
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    available_year_6 = EXCLUDED.available_year_6,
    available_year_9 = EXCLUDED.available_year_9,
    display_order = EXCLUDED.display_order;

-- 3. Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can view all subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can insert subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can update subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can delete subjects" ON public.subjects;

-- RLS Policy: Anyone (authenticated or public) can view active subjects
CREATE POLICY "Public can view active subjects"
ON public.subjects
FOR SELECT
USING (is_active = true);

-- RLS Policy: Active Admins can view all subjects (including inactive)
CREATE POLICY "Admins can view all subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
    )
);

-- RLS Policy: Admins with question management permissions can insert subjects
CREATE POLICY "Admins can insert subjects"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
          AND (
              admins.is_super_admin = true
              OR (admins.permissions->>'canManageQuestions')::boolean = true
          )
    )
);

-- RLS Policy: Admins with question management permissions can update subjects
CREATE POLICY "Admins can update subjects"
ON public.subjects
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
          AND (
              admins.is_super_admin = true
              OR (admins.permissions->>'canManageQuestions')::boolean = true
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
          AND (
              admins.is_super_admin = true
              OR (admins.permissions->>'canManageQuestions')::boolean = true
          )
    )
);

-- RLS Policy: Admins with question management permissions can delete subjects
CREATE POLICY "Admins can delete subjects"
ON public.subjects
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
          AND (
              admins.is_super_admin = true
              OR (admins.permissions->>'canManageQuestions')::boolean = true
          )
    )
);

-- 4. Stored Procedure: get_admin_subjects_with_counts
-- Returns all subjects with live question counts for Year 6 and Year 9.
CREATE OR REPLACE FUNCTION public.get_admin_subjects_with_counts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    code TEXT,
    icon TEXT,
    category TEXT,
    description TEXT,
    available_year_6 BOOLEAN,
    available_year_9 BOOLEAN,
    is_active BOOLEAN,
    display_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    year_6_count BIGINT,
    year_9_count BIGINT,
    total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH y6_counts AS (
        SELECT subject, count(*)::bigint AS count
        FROM public.quiz_questions_year6
        GROUP BY subject
    ),
    y9_counts AS (
        SELECT subject, count(*)::bigint AS count
        FROM public.quiz_questions_year9
        GROUP BY subject
    )
    SELECT
        s.id,
        s.name,
        s.code,
        s.icon,
        s.category,
        s.description,
        s.available_year_6,
        s.available_year_9,
        s.is_active,
        s.display_order,
        s.created_at,
        s.updated_at,
        COALESCE(y6.count, 0) AS year_6_count,
        COALESCE(y9.count, 0) AS year_9_count,
        (COALESCE(y6.count, 0) + COALESCE(y9.count, 0)) AS total_count
    FROM public.subjects s
    LEFT JOIN y6_counts y6 ON y6.subject = s.name
    LEFT JOIN y9_counts y9 ON y9.subject = s.name
    ORDER BY s.display_order ASC, s.name ASC;
$$;

-- 5. Stored Procedure: rename_subject_cascade
-- Atomically renames a subject in the subjects table and across all questions and assignments.
CREATE OR REPLACE FUNCTION public.rename_subject_cascade(
    p_subject_id UUID,
    p_new_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old_name TEXT;
    v_y6_updated INT := 0;
    v_y9_updated INT := 0;
    v_passages_y6 INT := 0;
    v_passages_y9 INT := 0;
    v_assignments INT := 0;
    v_quiz_results INT := 0;
    v_flags INT := 0;
BEGIN
    -- Verify admin permission
    IF NOT EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
          AND (admins.is_super_admin = true OR (admins.permissions->>'canManageQuestions')::boolean = true)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins with question management permissions can rename subjects.';
    END IF;

    -- Trim and validate new name
    p_new_name := trim(p_new_name);
    IF p_new_name IS NULL OR p_new_name = '' THEN
        RAISE EXCEPTION 'Subject name cannot be empty.';
    END IF;

    -- Get old subject name
    SELECT name INTO v_old_name
    FROM public.subjects
    WHERE id = p_subject_id;

    IF v_old_name IS NULL THEN
        RAISE EXCEPTION 'Subject with ID % not found.', p_subject_id;
    END IF;

    IF v_old_name = p_new_name THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Subject name is unchanged.',
            'old_name', v_old_name,
            'new_name', p_new_name
        );
    END IF;

    -- Update subjects table
    UPDATE public.subjects
    SET name = p_new_name,
        updated_at = now()
    WHERE id = p_subject_id;

    -- Cascade update to quiz_questions_year6
    WITH u_y6 AS (
        UPDATE public.quiz_questions_year6
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_y6_updated FROM u_y6;

    -- Cascade update to quiz_questions_year9
    WITH u_y9 AS (
        UPDATE public.quiz_questions_year9
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_y9_updated FROM u_y9;

    -- Cascade update to comprehension passages
    WITH u_py6 AS (
        UPDATE public.comprehension_passages_year6
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_passages_y6 FROM u_py6;

    WITH u_py9 AS (
        UPDATE public.comprehension_passages_year9
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_passages_y9 FROM u_py9;

    -- Cascade update to practice assignments
    WITH u_pa AS (
        UPDATE public.practice_assignments
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_assignments FROM u_pa;

    -- Cascade update to quiz results
    WITH u_qr AS (
        UPDATE public.quiz_results
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_quiz_results FROM u_qr;

    -- Cascade update to flagged questions
    WITH u_fq AS (
        UPDATE public.flagged_questions
        SET subject = p_new_name
        WHERE subject = v_old_name
        RETURNING 1
    )
    SELECT count(*) INTO v_flags FROM u_fq;

    -- Record in admin audit log
    INSERT INTO public.admin_audit_log (
        admin_id,
        action,
        resource_type,
        resource_id,
        details
    )
    SELECT
        admins.id,
        'RENAME_SUBJECT',
        'subjects',
        p_subject_id,
        jsonb_build_object(
            'old_name', v_old_name,
            'new_name', p_new_name,
            'questions_year6_updated', v_y6_updated,
            'questions_year9_updated', v_y9_updated,
            'assignments_updated', v_assignments,
            'quiz_results_updated', v_quiz_results
        )
    FROM public.admins
    WHERE admins.user_id = auth.uid();

    RETURN jsonb_build_object(
        'success', true,
        'old_name', v_old_name,
        'new_name', p_new_name,
        'questions_year6_updated', v_y6_updated,
        'questions_year9_updated', v_y9_updated,
        'passages_updated', v_passages_y6 + v_passages_y9,
        'assignments_updated', v_assignments,
        'quiz_results_updated', v_quiz_results,
        'flags_updated', v_flags
    );
END;
$$;

-- 6. Stored Procedure: delete_subject_safe
-- Validates that no questions exist for this subject before allowing permanent deletion.
CREATE OR REPLACE FUNCTION public.delete_subject_safe(
    p_subject_id UUID,
    p_force_archive_if_populated BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_subject_name TEXT;
    v_y6_count BIGINT := 0;
    v_y9_count BIGINT := 0;
    v_total_questions BIGINT := 0;
BEGIN
    -- Verify admin permission
    IF NOT EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.user_id = auth.uid()
          AND admins.is_active = true
          AND (admins.is_super_admin = true OR (admins.permissions->>'canManageQuestions')::boolean = true)
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins with question management permissions can delete subjects.';
    END IF;

    -- Look up subject
    SELECT name INTO v_subject_name
    FROM public.subjects
    WHERE id = p_subject_id;

    IF v_subject_name IS NULL THEN
        RAISE EXCEPTION 'Subject with ID % does not exist.', p_subject_id;
    END IF;

    -- Count existing questions
    SELECT count(*) INTO v_y6_count
    FROM public.quiz_questions_year6
    WHERE subject = v_subject_name;

    SELECT count(*) INTO v_y9_count
    FROM public.quiz_questions_year9
    WHERE subject = v_subject_name;

    v_total_questions := v_y6_count + v_y9_count;

    -- If populated with questions
    IF v_total_questions > 0 THEN
        IF p_force_archive_if_populated THEN
            -- Soft archive instead
            UPDATE public.subjects
            SET is_active = false,
                updated_at = now()
            WHERE id = p_subject_id;

            -- Log to admin audit log
            INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, details)
            SELECT admins.id, 'ARCHIVE_SUBJECT', 'subjects', p_subject_id,
                   jsonb_build_object('name', v_subject_name, 'reason', 'Auto-archived because questions exist', 'questions_count', v_total_questions)
            FROM public.admins WHERE admins.user_id = auth.uid();

            RETURN jsonb_build_object(
                'success', true,
                'action', 'archived',
                'message', format('Subject "%s" has %s questions and was archived (deactivated) instead of permanently deleted.', v_subject_name, v_total_questions),
                'questions_count', v_total_questions
            );
        ELSE
            RAISE EXCEPTION 'Cannot delete subject "%" because it contains % questions (% in Year 6, % in Year 9). Please deactivate it instead, or reassign the questions first.',
                v_subject_name, v_total_questions, v_y6_count, v_y9_count;
        END IF;
    END IF;

    -- Clean permanent deletion for unpopulated subject
    DELETE FROM public.subjects
    WHERE id = p_subject_id;

    -- Log to admin audit log
    INSERT INTO public.admin_audit_log (admin_id, action, resource_type, resource_id, details)
    SELECT admins.id, 'DELETE_SUBJECT', 'subjects', p_subject_id,
           jsonb_build_object('name', v_subject_name, 'questions_count', 0)
    FROM public.admins WHERE admins.user_id = auth.uid();

    RETURN jsonb_build_object(
        'success', true,
        'action', 'deleted',
        'message', format('Subject "%s" was permanently deleted.', v_subject_name),
        'questions_count', 0
    );
END;
$$;
