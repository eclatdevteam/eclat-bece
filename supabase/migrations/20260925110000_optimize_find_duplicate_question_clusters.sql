-- ============================================================================
-- Migration: Optimize Question Deduplication Functions
-- Date: 2026-09-25
-- Description: Optimizes public.find_duplicate_question_clusters to prevent
--              timeouts on large question sets (15,000+ rows) by structuring
--              exact and prompt duplicate checks with hash-matching and bounding
--              fuzzy candidate scans. Adds public.count_duplicate_question_clusters.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_duplicate_question_clusters(
  p_class_year TEXT,
  p_subject TEXT DEFAULT NULL,
  p_match_type TEXT DEFAULT 'all', -- 'all', 'exact', 'exact_clone', 'same_prompt', 'fuzzy'
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
  -- Admin authorization check
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

    -- 3. Fuzzy Matches (Phrasing Variations - executed when explicitly requested via 'fuzzy')
    fuzzy_pairs AS (
      SELECT 
        q1.id AS q1_id,
        q2.id AS q2_id,
        similarity(q1.question_text, q2.question_text)::float AS sim
      FROM (
        SELECT id, subject, question_text, passage_id, image_url, correct_answer
        FROM quiz_questions_year6
        WHERE (p_subject IS NULL OR subject = p_subject)
        ORDER BY created_at DESC
        LIMIT (CASE WHEN p_subject IS NULL THEN 250 ELSE 800 END)
      ) q1
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
      WHERE (p_match_type = 'fuzzy')
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
      FROM (
        SELECT id, subject, question_text, passage_id, image_url, correct_answer
        FROM quiz_questions_year9
        WHERE (p_subject IS NULL OR subject = p_subject)
        ORDER BY created_at DESC
        LIMIT (CASE WHEN p_subject IS NULL THEN 250 ELSE 800 END)
      ) q1
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
      WHERE (p_match_type = 'fuzzy')
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
    RAISE EXCEPTION 'Invalid class_year: %', p_class_year;
  END IF;

  RETURN v_result;
END;
$$;

-- Dedicated lightweight count function for dashboard badge
CREATE OR REPLACE FUNCTION public.count_duplicate_question_clusters(
  p_class_year TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF p_class_year = 'year_6' THEN
    WITH normalized_qs AS (
      SELECT 
        q.id,
        md5(
          q.subject || '||' || 
          COALESCE(q.passage_id::text, 'none') || '||' || 
          COALESCE(q.image_url, 'none') || '||' || 
          regexp_replace(lower(trim(q.correct_answer)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') || '||' ||
          regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        ) AS clone_key
      FROM quiz_questions_year6 q
      WHERE length(regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')) > 3
    ),
    clone_pairs AS (
      SELECT q1.clone_key
      FROM normalized_qs q1
      JOIN normalized_qs q2 ON q1.clone_key = q2.clone_key AND q1.id < q2.id
      WHERE NOT EXISTS (
        SELECT 1 FROM duplicate_question_ignore_pairs ig
        WHERE ig.class_year = 'year_6'
          AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
            OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
      )
    )
    SELECT count(DISTINCT clone_key) INTO v_count FROM clone_pairs;

  ELSIF p_class_year = 'year_9' THEN
    WITH normalized_qs AS (
      SELECT 
        q.id,
        md5(
          q.subject || '||' || 
          COALESCE(q.passage_id::text, 'none') || '||' || 
          COALESCE(q.image_url, 'none') || '||' || 
          regexp_replace(lower(trim(q.correct_answer)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g') || '||' ||
          regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')
        ) AS clone_key
      FROM quiz_questions_year9 q
      WHERE length(regexp_replace(lower(trim(q.question_text)), '[\r\n\t\s\.\?!,;:\"''`]+', '', 'g')) > 3
    ),
    clone_pairs AS (
      SELECT q1.clone_key
      FROM normalized_qs q1
      JOIN normalized_qs q2 ON q1.clone_key = q2.clone_key AND q1.id < q2.id
      WHERE NOT EXISTS (
        SELECT 1 FROM duplicate_question_ignore_pairs ig
        WHERE ig.class_year = 'year_9'
          AND ((ig.question_id_1 = q1.id AND ig.question_id_2 = q2.id) 
            OR (ig.question_id_1 = q2.id AND ig.question_id_2 = q1.id))
      )
    )
    SELECT count(DISTINCT clone_key) INTO v_count FROM clone_pairs;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_duplicate_question_clusters(TEXT, TEXT, TEXT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_duplicate_question_clusters(TEXT) TO authenticated;
