-- Create Year 6 Comprehension Passages Table
CREATE TABLE IF NOT EXISTS public.comprehension_passages_year6 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  passage_text TEXT NOT NULL,
  subject TEXT DEFAULT 'English Language',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Year 9 Comprehension Passages Table
CREATE TABLE IF NOT EXISTS public.comprehension_passages_year9 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  passage_text TEXT NOT NULL,
  subject TEXT DEFAULT 'English Language',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add passage_id to questions tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions_year6' AND column_name = 'passage_id') THEN
        ALTER TABLE public.quiz_questions_year6 
        ADD COLUMN passage_id UUID REFERENCES public.comprehension_passages_year6(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_questions_year9' AND column_name = 'passage_id') THEN
        ALTER TABLE public.quiz_questions_year9 
        ADD COLUMN passage_id UUID REFERENCES public.comprehension_passages_year9(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_quiz_questions_year6_passage ON public.quiz_questions_year6(passage_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_year9_passage ON public.quiz_questions_year9(passage_id);

-- Enable RLS
ALTER TABLE public.comprehension_passages_year6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprehension_passages_year9 ENABLE ROW LEVEL SECURITY;

-- Grant Permissions (CRITICAL FIX)
GRANT ALL ON public.comprehension_passages_year6 TO authenticated;
GRANT ALL ON public.comprehension_passages_year9 TO authenticated;
GRANT ALL ON public.comprehension_passages_year6 TO service_role;
GRANT ALL ON public.comprehension_passages_year9 TO service_role;

-- RLS Policies for Year 6 Passages
DROP POLICY IF EXISTS "Authenticated users can view year 6 passages" ON public.comprehension_passages_year6;
CREATE POLICY "Authenticated users can view year 6 passages"
  ON public.comprehension_passages_year6 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Admins can insert year 6 passages" ON public.comprehension_passages_year6;
CREATE POLICY "Admins can insert year 6 passages"
  ON public.comprehension_passages_year6 
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can update year 6 passages" ON public.comprehension_passages_year6;
CREATE POLICY "Admins can update year 6 passages"
  ON public.comprehension_passages_year6 
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can delete year 6 passages" ON public.comprehension_passages_year6;
CREATE POLICY "Admins can delete year 6 passages"
  ON public.comprehension_passages_year6 
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
  );

-- RLS Policies for Year 9 Passages
DROP POLICY IF EXISTS "Authenticated users can view year 9 passages" ON public.comprehension_passages_year9;
CREATE POLICY "Authenticated users can view year 9 passages"
  ON public.comprehension_passages_year9 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Admins can insert year 9 passages" ON public.comprehension_passages_year9;
CREATE POLICY "Admins can insert year 9 passages"
  ON public.comprehension_passages_year9 
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can update year 9 passages" ON public.comprehension_passages_year9;
CREATE POLICY "Admins can update year 9 passages"
  ON public.comprehension_passages_year9 
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can delete year 9 passages" ON public.comprehension_passages_year9;
CREATE POLICY "Admins can delete year 9 passages"
  ON public.comprehension_passages_year9 
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
  );
