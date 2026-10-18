-- v64 expands the existing v56 reaction constraint. Apply v56 first.
BEGIN;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_reaction_allowed;
ALTER TABLE public.messages ADD CONSTRAINT messages_reaction_allowed CHECK (reaction IS NULL OR reaction IN ('heart','laugh','wow','fire'));
COMMIT;
