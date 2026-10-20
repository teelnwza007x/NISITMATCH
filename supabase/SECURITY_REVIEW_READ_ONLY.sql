-- Read-only production security review for NISIT MATCH.
-- Run in Supabase SQL Editor. This script does not change policies or data.

-- Public tables without row-level security.
select n.nspname as schema_name, c.relname as table_name
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity
order by c.relname;

-- Policies that apply to anonymous clients; review media and private-data tables.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public'
order by tablename, policyname;

-- Security-definer functions callable by anonymous users.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_userbyid(p.proowner) as owner,
       p.proconfig as configuration
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and has_function_privilege('anon',p.oid,'EXECUTE')
order by p.proname;

-- Security-definer functions without a fixed search_path.
select p.proname as function_name, pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and not exists (select 1 from unnest(coalesce(p.proconfig,ARRAY[]::text[])) c where c like 'search_path=%')
order by p.proname;

-- Exposed storage policies.
select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies where schemaname = 'storage' and tablename = 'objects'
order by policyname;
