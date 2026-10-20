-- NISIT MATCH security audit: run manually in Supabase SQL Editor after reviewing policies.
-- Read-only diagnostics. Does not change production data.
select p.id, p.display_name,
       coalesce(array_length(p.photo_paths, 1), 0) as photo_count,
       p.avatar_path
from public.profiles p
where coalesce(array_length(p.photo_paths, 1), 0) = 0
   or p.avatar_path is null
limit 100;

-- Find accounts with unusually many outgoing likes in the past hour.
select from_id, count(*) as likes_last_hour
from public.likes
where created_at >= now() - interval '1 hour'
group by from_id
having count(*) > 60
order by likes_last_hour desc;

-- Inspect actual discover definition before modifying its filters or permissions.
select pg_get_functiondef(p.oid) as discover_sql
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'discover';

-- IMPORTANT: enforce photo requirements and rate limits at the DB/API layer
-- only after validating onboarding, media uploads, undo, and admin moderation.
-- Do not apply a blanket RLS policy that could break existing accounts.
