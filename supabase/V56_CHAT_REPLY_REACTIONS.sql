-- NISIT MATCH v56: Run once in Supabase SQL Editor.
-- Keeps existing messages and access policies intact.
alter table public.messages add column if not exists reply_to uuid references public.messages(id) on delete set null;
alter table public.messages add column if not exists reaction text;
alter table public.messages drop constraint if exists messages_reaction_allowed;
alter table public.messages add constraint messages_reaction_allowed check (reaction is null or reaction = 'heart');
create index if not exists messages_reply_to_idx on public.messages(reply_to) where reply_to is not null;
-- Existing RLS policies continue to apply to UPDATE and SELECT.
