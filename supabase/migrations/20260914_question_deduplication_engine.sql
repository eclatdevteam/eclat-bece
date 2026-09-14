-- ============================================================================
-- Migration: Question Deduplication Engine
-- Date: 2026-09-14
-- Description: Advanced detection, clustering, resolution and auto-merge for 
--              duplicate questions per class (Year 6 & Year 9).
-- ============================================================================

-- 1. Enable pg_trgm extension for fuzzy similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create ignore table for false positives / verified distinct questions
CREATE TABLE IF NOT EXISTS public.duplicate_question_ignore_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_year TEXT NOT NULL,
  question_id_1 UUID NOT NULL,
  question_id_2 UUID NOT NULL,
  ignored_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_ignore_pair UNIQUE (class_year, question_id_1, question_id_2)
);

ALTER TABLE public.duplicate_question_ignore_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage duplicate ignore pairs" ON public.duplicate_question_ignore_pairs;
CREATE POLICY "Admins can manage duplicate ignore pairs"
  ON public.duplicate_question_ignore_pairs
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Function to find duplicate question clusters
CREATE OR REPLACE FUNCTION public.find_duplicate_question_clusters(
  p_class_year TEXT,
  p_subject TEXT DEFAULT NULL,
  p_match_type TEXT DEFAULT 'all', -- 'all', 'exact', 'fuzzy'
  p_threshold FLOAT DEFAULT 0.85
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
BEGIN
  -- Admin authorization check: allow if running via service/superuser (auth.uid() IS NULL) or if user is admin
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.is_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can access question deduplication.';
  END IF;

  -- Set trigram threshold
  PERFORM set_limit(COALESCE(p_threshold, 0.85)::real);

  IF p_class_year = 'year_6' THEN
    WITH
    normalized_qs AS (
      SELECT 
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at,
        regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') AS norm_q,
        regexp_replace(lower(trim(q.correct_answer)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') AS norm_ans,
        md5(
          q.subject || '||' || 
          COALESCE(q.passage_id::text, 'none') || '||' || 
          COALESCE(q.image_url, 'none') || '||' || 
          regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        ) AS prompt_key,
        md5(
          q.subject || '||' || 
          COALESCE(q.passage_id::text, 'none') || '||' || 
          COALESCE(q.image_url, 'none') || '||' || 
          regexp_replace(lower(trim(q.correct_answer)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') || '||' ||
          regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        ) AS clone_key
      FROM quiz_questions_year6 q
      WHERE (p_subject IS NULL OR q.subject = p_subject)
        AND length(regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')) > 3
    ),

    -- 1. Exact Clones (Identical Prompt AND Identical Correct Answer)
    clone_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        q1.clone_key
      FROM normalized_qs q1
      JOIN normalized_qs q2 
        ON q1.clone_key = q2.clone_key
       AND q1.id < q2.id
      WHERE (p_match_type IN ('all', 'exact', 'exact_clone'))
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_question_ignore_pairs ig
          WHERE ig.class_year = 'year_6'
            AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
              OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
        )
    ),
    clone_matches AS (
      SELECT 
        'exact_' || cp.clone_key AS cluster_id,
        'exact_clone' AS match_type,
        1.0::float AS similarity_score,
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at
      FROM (
        SELECT DISTINCT clone_key, q1_id AS q_id FROM clone_pairs
        UNION
        SELECT DISTINCT clone_key, q2_id AS q_id FROM clone_pairs
      ) cp
      JOIN normalized_qs q ON q.id = cp.q_id
    ),

    -- 2. Same Prompt, Different Answers (Shared Instruction Prompt)
    prompt_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        q1.prompt_key
      FROM normalized_qs q1
      JOIN normalized_qs q2 
        ON q1.prompt_key = q2.prompt_key
       AND q1.norm_ans != q2.norm_ans
       AND q1.id < q2.id
      WHERE (p_match_type IN ('all', 'same_prompt'))
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_question_ignore_pairs ig
          WHERE ig.class_year = 'year_6'
            AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
              OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
        )
    ),
    prompt_matches AS (
      SELECT 
        'prompt_' || pp.prompt_key AS cluster_id,
        'same_prompt' AS match_type,
        0.99::float AS similarity_score,
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at
      FROM (
        SELECT DISTINCT prompt_key, q1_id AS q_id FROM prompt_pairs
        UNION
        SELECT DISTINCT prompt_key, q2_id AS q_id FROM prompt_pairs
      ) pp
      JOIN normalized_qs q ON q.id = pp.q_id
    ),

    -- 3. Fuzzy Matches (Phrasing Variations)
    fuzzy_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        similarity(q1.question_text, q2.question_text)::float AS sim
      FROM quiz_questions_year6 q1
      JOIN quiz_questions_year6 q2 
        ON q1.subject = q2.subject 
        AND q1.id < q2.id
        AND q1.passage_id IS NOT DISTINCT FROM q2.passage_id
        AND q1.image_url IS NOT DISTINCT FROM q2.image_url
        AND q1.question_text % q2.question_text
        AND similarity(q1.question_text, q2.question_text) >= COALESCE(p_threshold, 0.85)
        AND regexp_replace(lower(trim(q1.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') != 
            regexp_replace(lower(trim(q2.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        AND (
          lower(trim(q1.correct_answer)) = lower(trim(q2.correct_answer))
          OR similarity(q1.question_text, q2.question_text) >= 0.92
        )
      WHERE (p_match_type IN ('all', 'fuzzy'))
        AND (p_subject IS NULL OR q1.subject = p_subject)
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_question_ignore_pairs ig
          WHERE ig.class_year = 'year_6'
            AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
              OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
        )
      LIMIT 50
    ),
    fuzzy_matches AS (
      SELECT 
        'fuzzy_' || fp.q1_id || '_' || fp.q2_id AS cluster_id,
        'fuzzy' AS match_type,
        fp.sim AS similarity_score,
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at
      FROM fuzzy_pairs fp
      JOIN quiz_questions_year6 q ON q.id IN (fp.q1_id, fp.q2_id)
    ),

    all_cluster_items AS (
      SELECT * FROM clone_matches
      UNION ALL
      SELECT * FROM prompt_matches
      UNION ALL
      SELECT * FROM fuzzy_matches
    ),

    clustered AS (
      SELECT 
        c.cluster_id,
        c.match_type,
        max(c.similarity_score) AS similarity_score,
        c.subject,
        min(c.created_at) AS first_created_at,
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'subject', c.subject,
            'topic', c.topic,
            'difficulty', c.difficulty,
            'question_text', c.question_text,
            'correct_answer', c.correct_answer,
            'explanation', c.explanation,
            'passage_id', c.passage_id,
            'passage_title', p.title,
            'image_url', c.image_url,
            'created_at', c.created_at,
            'options', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', o.id,
                  'option_text', o.option_text,
                  'is_correct', o.is_correct,
                  'display_order', o.display_order
                ) ORDER BY o.display_order, o.option_text
              )
              FROM quiz_options_year6 o
              WHERE o.question_id = c.id
            ), '[]'::jsonb)
          ) ORDER BY length(COALESCE(c.explanation, '')) DESC, c.created_at ASC
        ) AS questions
      FROM all_cluster_items c
      LEFT JOIN comprehension_passages_year6 p ON c.passage_id = p.id
      GROUP BY c.cluster_id, c.match_type, c.subject
    )
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'cluster_id', cl.cluster_id,
        'match_type', cl.match_type,
        'similarity_score', cl.similarity_score,
        'subject', cl.subject,
        'questions', cl.questions
      ) ORDER BY 
          CASE cl.match_type 
            WHEN 'exact_clone' THEN 1 
            WHEN 'same_prompt' THEN 2 
            WHEN 'fuzzy' THEN 3 
            ELSE 4 
          END ASC, 
          cl.similarity_score DESC, 
          cl.first_created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM clustered cl;

  ELSIF p_class_year = 'year_9' THEN
    WITH
    normalized_qs AS (
      SELECT 
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at,
        regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') AS norm_q,
        regexp_replace(lower(trim(q.correct_answer)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') AS norm_ans,
        md5(
          q.subject || '||' || 
          COALESCE(q.passage_id::text, 'none') || '||' || 
          COALESCE(q.image_url, 'none') || '||' || 
          regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        ) AS prompt_key,
        md5(
          q.subject || '||' || 
          COALESCE(q.passage_id::text, 'none') || '||' || 
          COALESCE(q.image_url, 'none') || '||' || 
          regexp_replace(lower(trim(q.correct_answer)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') || '||' ||
          regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        ) AS clone_key
      FROM quiz_questions_year9 q
      WHERE (p_subject IS NULL OR q.subject = p_subject)
        AND length(regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')) > 3
    ),

    clone_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        q1.clone_key
      FROM normalized_qs q1
      JOIN normalized_qs q2 
        ON q1.clone_key = q2.clone_key
       AND q1.id < q2.id
      WHERE (p_match_type IN ('all', 'exact', 'exact_clone'))
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_question_ignore_pairs ig
          WHERE ig.class_year = 'year_9'
            AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
              OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
        )
    ),
    clone_matches AS (
      SELECT 
        'exact_' || cp.clone_key AS cluster_id,
        'exact_clone' AS match_type,
        1.0::float AS similarity_score,
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at
      FROM (
        SELECT DISTINCT clone_key, q1_id AS q_id FROM clone_pairs
        UNION
        SELECT DISTINCT clone_key, q2_id AS q_id FROM clone_pairs
      ) cp
      JOIN normalized_qs q ON q.id = cp.q_id
    ),

    prompt_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        q1.prompt_key
      FROM normalized_qs q1
      JOIN normalized_qs q2 
        ON q1.prompt_key = q2.prompt_key
       AND q1.norm_ans != q2.norm_ans
       AND q1.id < q2.id
      WHERE (p_match_type IN ('all', 'same_prompt'))
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_question_ignore_pairs ig
          WHERE ig.class_year = 'year_9'
            AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
              OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
        )
    ),
    prompt_matches AS (
      SELECT 
        'prompt_' || pp.prompt_key AS cluster_id,
        'same_prompt' AS match_type,
        0.99::float AS similarity_score,
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at
      FROM (
        SELECT DISTINCT prompt_key, q1_id AS q_id FROM prompt_pairs
        UNION
        SELECT DISTINCT prompt_key, q2_id AS q_id FROM prompt_pairs
      ) pp
      JOIN normalized_qs q ON q.id = pp.q_id
    ),

    fuzzy_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        similarity(q1.question_text, q2.question_text)::float AS sim
      FROM quiz_questions_year9 q1
      JOIN quiz_questions_year9 q2 
        ON q1.subject = q2.subject 
        AND q1.id < q2.id
        AND q1.passage_id IS NOT DISTINCT FROM q2.passage_id
        AND q1.image_url IS NOT DISTINCT FROM q2.image_url
        AND q1.question_text % q2.question_text
        AND similarity(q1.question_text, q2.question_text) >= COALESCE(p_threshold, 0.85)
        AND regexp_replace(lower(trim(q1.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') != 
            regexp_replace(lower(trim(q2.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        AND (
          lower(trim(q1.correct_answer)) = lower(trim(q2.correct_answer))
          OR similarity(q1.question_text, q2.question_text) >= 0.92
        )
      WHERE (p_match_type IN ('all', 'fuzzy'))
        AND (p_subject IS NULL OR q1.subject = p_subject)
        AND NOT EXISTS (
          SELECT 1 FROM duplicate_question_ignore_pairs ig
          WHERE ig.class_year = 'year_9'
            AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
              OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
        )
      LIMIT 50
    ),
    fuzzy_matches AS (
      SELECT 
        'fuzzy_' || fp.q1_id || '_' || fp.q2_id AS cluster_id,
        'fuzzy' AS match_type,
        fp.sim AS similarity_score,
        q.id,
        q.subject,
        q.topic,
        q.difficulty,
        q.question_text,
        q.correct_answer,
        q.explanation,
        q.passage_id,
        q.image_url,
        q.created_at
      FROM fuzzy_pairs fp
      JOIN quiz_questions_year9 q ON q.id IN (fp.q1_id, fp.q2_id)
    ),

    all_cluster_items AS (
      SELECT * FROM clone_matches
      UNION ALL
      SELECT * FROM prompt_matches
      UNION ALL
      SELECT * FROM fuzzy_matches
    ),

    clustered AS (
      SELECT 
        c.cluster_id,
        c.match_type,
        max(c.similarity_score) AS similarity_score,
        c.subject,
        min(c.created_at) AS first_created_at,
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'subject', c.subject,
            'topic', c.topic,
            'difficulty', c.difficulty,
            'question_text', c.question_text,
            'correct_answer', c.correct_answer,
            'explanation', c.explanation,
            'passage_id', c.passage_id,
            'passage_title', p.title,
            'image_url', c.image_url,
            'created_at', c.created_at,
            'options', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', o.id,
                  'option_text', o.option_text,
                  'is_correct', o.is_correct,
                  'display_order', o.display_order
                ) ORDER BY o.display_order, o.option_text
              )
              FROM quiz_options_year9 o
              WHERE o.question_id = c.id
            ), '[]'::jsonb)
          ) ORDER BY length(COALESCE(c.explanation, '')) DESC, c.created_at ASC
        ) AS questions
      FROM all_cluster_items c
      LEFT JOIN comprehension_passages_year9 p ON c.passage_id = p.id
      GROUP BY c.cluster_id, c.match_type, c.subject
    )
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'cluster_id', cl.cluster_id,
        'match_type', cl.match_type,
        'similarity_score', cl.similarity_score,
        'subject', cl.subject,
        'questions', cl.questions
      ) ORDER BY 
          CASE cl.match_type 
            WHEN 'exact_clone' THEN 1 
            WHEN 'same_prompt' THEN 2 
            WHEN 'fuzzy' THEN 3 
            ELSE 4 
          END ASC, 
          cl.similarity_score DESC, 
          cl.first_created_at DESC
    ), '[]'::jsonb)
    INTO v_result
    FROM clustered cl;

  ELSE
    RAISE EXCEPTION 'Invalid class_year. Expected year_6 or year_9, got: %', p_class_year;
  END IF;

  RETURN v_result;
END;
$$;

-- 4. Function to resolve duplicates: keeps canonical, re-links flagged questions, deletes redundant
CREATE OR REPLACE FUNCTION public.resolve_duplicate_questions(
  p_class_year TEXT,
  p_canonical_id UUID,
  p_duplicate_ids UUID[],
  p_action TEXT DEFAULT 'merge'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_deleted_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.is_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can resolve duplicate questions.';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT public.get_admin_id(auth.uid()) INTO v_admin_id;
  END IF;

  -- 1. Re-point flagged_questions records referencing duplicate IDs to canonical ID
  UPDATE public.flagged_questions
  SET question_id = p_canonical_id
  WHERE question_id = ANY(p_duplicate_ids)
    AND class_year = p_class_year;

  -- 2. Remove the duplicate questions from the appropriate table (options cascade automatically)
  IF p_class_year = 'year_6' THEN
    DELETE FROM public.quiz_questions_year6
    WHERE id = ANY(p_duplicate_ids)
      AND id != p_canonical_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  ELSIF p_class_year = 'year_9' THEN
    DELETE FROM public.quiz_questions_year9
    WHERE id = ANY(p_duplicate_ids)
      AND id != p_canonical_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Invalid class_year: %', p_class_year;
  END IF;

  -- 3. Log the admin action
  IF v_admin_id IS NOT NULL THEN
    PERFORM public.log_admin_action(
      v_admin_id,
      'resolve_duplicate_questions',
      'question',
      p_canonical_id,
      jsonb_build_object(
        'class_year', p_class_year,
        'action', p_action,
        'canonical_id', p_canonical_id,
        'duplicate_ids', p_duplicate_ids,
        'deleted_count', v_deleted_count
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'canonical_id', p_canonical_id,
    'deleted_count', v_deleted_count
  );
END;
$$;

-- 5. Function to ignore a duplicate pair (false positive)
CREATE OR REPLACE FUNCTION public.ignore_duplicate_question_pair(
  p_class_year TEXT,
  p_question_id_1 UUID,
  p_question_id_2 UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id1 UUID;
  v_id2 UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.is_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can ignore duplicate question pairs.';
  END IF;

  IF p_question_id_1 < p_question_id_2 THEN
    v_id1 := p_question_id_1;
    v_id2 := p_question_id_2;
  ELSE
    v_id1 := p_question_id_2;
    v_id2 := p_question_id_1;
  END IF;

  INSERT INTO public.duplicate_question_ignore_pairs (class_year, question_id_1, question_id_2, ignored_by)
  VALUES (p_class_year, v_id1, v_id2, auth.uid())
  ON CONFLICT (class_year, question_id_1, question_id_2) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Function to safely auto-merge all 100% exact duplicate clusters in one shot
CREATE OR REPLACE FUNCTION public.auto_merge_all_exact_duplicates(
  p_class_year TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_total_clusters INTEGER := 0;
  v_total_deleted INTEGER := 0;
  r RECORD;
  v_deleted_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.is_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can auto-merge duplicate questions.';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT public.get_admin_id(auth.uid()) INTO v_admin_id;
  END IF;

  IF p_class_year = 'year_6' THEN
    FOR r IN (
      WITH ranked AS (
        SELECT 
          q.id,
          q.explanation,
          q.created_at,
          md5(
            q.subject || '||' || 
            COALESCE(q.passage_id::text, 'none') || '||' || 
            COALESCE(q.image_url, 'none') || '||' || 
            lower(trim(q.correct_answer)) || '||' ||
            regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?\!,;:"''`]+', '', 'g')
          ) AS exact_key,
          ROW_NUMBER() OVER (
            PARTITION BY md5(
              q.subject || '||' || 
              COALESCE(q.passage_id::text, 'none') || '||' || 
              COALESCE(q.image_url, 'none') || '||' || 
              lower(trim(q.correct_answer)) || '||' ||
              regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?\!,;:"''`]+', '', 'g')
            )
            ORDER BY length(COALESCE(q.explanation, '')) DESC, q.created_at ASC
          ) as rn
        FROM quiz_questions_year6 q
        WHERE length(regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?\!,;:"''`]+', '', 'g')) > 3
      ),
      clusters AS (
        SELECT exact_key, count(*) as cnt
        FROM ranked
        GROUP BY exact_key
        HAVING count(*) > 1
      )
      SELECT 
        r.exact_key,
        (SELECT id FROM ranked WHERE exact_key = r.exact_key AND rn = 1) AS canonical_id,
        array_agg(r.id) FILTER (WHERE r.rn > 1) AS duplicate_ids
      FROM ranked r
      JOIN clusters c ON r.exact_key = c.exact_key
      GROUP BY r.exact_key
    ) LOOP
      IF r.duplicate_ids IS NOT NULL AND array_length(r.duplicate_ids, 1) > 0 THEN
        UPDATE public.flagged_questions
        SET question_id = r.canonical_id
        WHERE question_id = ANY(r.duplicate_ids) AND class_year = 'year_6';

        DELETE FROM public.quiz_questions_year6
        WHERE id = ANY(r.duplicate_ids);
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

        v_total_deleted := v_total_deleted + v_deleted_count;
        v_total_clusters := v_total_clusters + 1;
      END IF;
    END LOOP;

  ELSIF p_class_year = 'year_9' THEN
    FOR r IN (
      WITH ranked AS (
        SELECT 
          q.id,
          q.explanation,
          q.created_at,
          md5(
            q.subject || '||' || 
            COALESCE(q.passage_id::text, 'none') || '||' || 
            COALESCE(q.image_url, 'none') || '||' || 
            lower(trim(q.correct_answer)) || '||' ||
            regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?\!,;:"''`]+', '', 'g')
          ) AS exact_key,
          ROW_NUMBER() OVER (
            PARTITION BY md5(
              q.subject || '||' || 
              COALESCE(q.passage_id::text, 'none') || '||' || 
              COALESCE(q.image_url, 'none') || '||' || 
              lower(trim(q.correct_answer)) || '||' ||
              regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?\!,;:"''`]+', '', 'g')
            )
            ORDER BY length(COALESCE(q.explanation, '')) DESC, q.created_at ASC
          ) as rn
        FROM quiz_questions_year9 q
        WHERE length(regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?\!,;:"''`]+', '', 'g')) > 3
      ),
      clusters AS (
        SELECT exact_key, count(*) as cnt
        FROM ranked
        GROUP BY exact_key
        HAVING count(*) > 1
      )
      SELECT 
        r.exact_key,
        (SELECT id FROM ranked WHERE exact_key = r.exact_key AND rn = 1) AS canonical_id,
        array_agg(r.id) FILTER (WHERE r.rn > 1) AS duplicate_ids
      FROM ranked r
      JOIN clusters c ON r.exact_key = c.exact_key
      GROUP BY r.exact_key
    ) LOOP
      IF r.duplicate_ids IS NOT NULL AND array_length(r.duplicate_ids, 1) > 0 THEN
        UPDATE public.flagged_questions
        SET question_id = r.canonical_id
        WHERE question_id = ANY(r.duplicate_ids) AND class_year = 'year_9';

        DELETE FROM public.quiz_questions_year9
        WHERE id = ANY(r.duplicate_ids);
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

        v_total_deleted := v_total_deleted + v_deleted_count;
        v_total_clusters := v_total_clusters + 1;
      END IF;
    END LOOP;

  ELSE
    RAISE EXCEPTION 'Invalid class_year: %', p_class_year;
  END IF;

  -- Log admin audit
  IF v_admin_id IS NOT NULL AND v_total_deleted > 0 THEN
    PERFORM public.log_admin_action(
      v_admin_id,
      'auto_merge_all_exact_duplicates',
      'question',
      NULL,
      jsonb_build_object(
        'class_year', p_class_year,
        'clusters_merged', v_total_clusters,
        'duplicates_removed', v_total_deleted
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'class_year', p_class_year,
    'clusters_merged', v_total_clusters,
    'duplicates_removed', v_total_deleted
  );
END;
$$;

-- 7. Function to ignore an entire cluster of duplicate questions at once
CREATE OR REPLACE FUNCTION public.ignore_duplicate_cluster(
  p_class_year TEXT,
  p_question_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_i INTEGER;
  v_j INTEGER;
  v_id1 UUID;
  v_id2 UUID;
  v_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.is_admin(auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can ignore duplicate questions.';
  END IF;

  IF p_question_ids IS NULL OR array_length(p_question_ids, 1) < 2 THEN
    RETURN jsonb_build_object('success', true, 'pairs_ignored', 0);
  END IF;

  FOR v_i IN 1..array_length(p_question_ids, 1) LOOP
    FOR v_j IN (v_i + 1)..array_length(p_question_ids, 1) LOOP
      IF p_question_ids[v_i] < p_question_ids[v_j] THEN
        v_id1 := p_question_ids[v_i];
        v_id2 := p_question_ids[v_j];
      ELSE
        v_id1 := p_question_ids[v_j];
        v_id2 := p_question_ids[v_i];
      END IF;

      INSERT INTO public.duplicate_question_ignore_pairs (class_year, question_id_1, question_id_2, ignored_by)
      VALUES (p_class_year, v_id1, v_id2, auth.uid())
      ON CONFLICT (class_year, question_id_1, question_id_2) DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'pairs_ignored', v_count);
END;
$$;

-- 8. Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.find_duplicate_question_clusters(TEXT, TEXT, TEXT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_duplicate_questions(TEXT, UUID, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ignore_duplicate_question_pair(TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ignore_duplicate_cluster(TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_merge_all_exact_duplicates(TEXT) TO authenticated;
