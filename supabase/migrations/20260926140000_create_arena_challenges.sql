-- Migration: 20260926140000_create_arena_challenges.sql
-- Implements Phase 2 Head-to-Head Arena (Duel of Minds) Point Economy & Challenge System (PRD Section 3.9, 4, 7)

CREATE TABLE IF NOT EXISTS public.arena_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  challenge_name text NOT NULL DEFAULT 'Head-to-Head Duel',
  subject text NOT NULL,
  topic text,
  question_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  max_time_seconds integer NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'declined', 'expired')),
  challenger_score integer,
  challenger_time_taken integer,
  opponent_score integer,
  opponent_time_taken integer,
  challenger_ep integer DEFAULT 0,
  opponent_ep integer DEFAULT 0,
  winner_id uuid REFERENCES public.students(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for active queries
CREATE INDEX IF NOT EXISTS idx_arena_challenges_challenger ON public.arena_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_arena_challenges_opponent ON public.arena_challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_arena_challenges_status ON public.arena_challenges(status);
CREATE INDEX IF NOT EXISTS idx_arena_challenges_created ON public.arena_challenges(created_at DESC);

-- Enable RLS
ALTER TABLE public.arena_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view challenges involving them" ON public.arena_challenges;
CREATE POLICY "Students can view challenges involving them"
  ON public.arena_challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE (s.id = arena_challenges.challenger_id OR s.id = arena_challenges.opponent_id)
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can create challenges as challenger" ON public.arena_challenges;
CREATE POLICY "Students can create challenges as challenger"
  ON public.arena_challenges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = arena_challenges.challenger_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can update challenges" ON public.arena_challenges;
CREATE POLICY "Participants can update challenges"
  ON public.arena_challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE (s.id = arena_challenges.challenger_id OR s.id = arena_challenges.opponent_id)
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to challenges" ON public.arena_challenges;
CREATE POLICY "Admins have full access to challenges"
  ON public.arena_challenges
  FOR ALL
  USING (COALESCE(public.is_admin(auth.uid()), false))
  WITH CHECK (COALESCE(public.is_admin(auth.uid()), false));

-- Function: create_or_send_duel
CREATE OR REPLACE FUNCTION public.create_arena_challenge(
  p_challenger_id uuid,
  p_opponent_id uuid,
  p_challenge_name text,
  p_subject text,
  p_topic text,
  p_max_time_seconds integer,
  p_question_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge_id uuid;
BEGIN
  INSERT INTO public.arena_challenges (
    challenger_id,
    opponent_id,
    challenge_name,
    subject,
    topic,
    max_time_seconds,
    question_ids,
    status
  ) VALUES (
    p_challenger_id,
    p_opponent_id,
    COALESCE(p_challenge_name, 'Head-to-Head Duel'),
    p_subject,
    p_topic,
    COALESCE(p_max_time_seconds, 300),
    COALESCE(p_question_ids, '{}'::uuid[]),
    'pending'
  )
  RETURNING id INTO v_challenge_id;

  RETURN v_challenge_id;
END;
$$;
