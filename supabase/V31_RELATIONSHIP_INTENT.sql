-- Run once in Supabase SQL Editor before deploying v31.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS relationship_intent text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_relationship_intent_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_relationship_intent_check
  CHECK (relationship_intent IS NULL OR relationship_intent IN ('serious','getting_to_know','friends','unsure'));
