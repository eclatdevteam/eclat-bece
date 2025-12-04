-- Remove topic column from Year 6 passages
ALTER TABLE public.comprehension_passages_year6 DROP COLUMN IF EXISTS topic;

-- Remove topic column from Year 9 passages
ALTER TABLE public.comprehension_passages_year9 DROP COLUMN IF EXISTS topic;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
