-- Drop existing tables
DROP TABLE IF EXISTS public.quiz_options CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;

-- Create Year 6 quiz questions table
CREATE TABLE public.quiz_questions_year6 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Year 6 quiz options table
CREATE TABLE public.quiz_options_year6 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions_year6(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Year 9 quiz questions table
CREATE TABLE public.quiz_questions_year9 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Year 9 quiz options table
CREATE TABLE public.quiz_options_year9 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions_year9(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quiz_questions_year6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options_year6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions_year9 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options_year9 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Year 6 tables
CREATE POLICY "Authenticated users can view year 6 quiz questions"
  ON public.quiz_questions_year6
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view year 6 quiz options"
  ON public.quiz_options_year6
  FOR SELECT
  USING (true);

-- Create RLS policies for Year 9 tables
CREATE POLICY "Authenticated users can view year 9 quiz questions"
  ON public.quiz_questions_year9
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can view year 9 quiz options"
  ON public.quiz_options_year9
  FOR SELECT
  USING (true);