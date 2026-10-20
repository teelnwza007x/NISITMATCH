-- NISIT MATCH: opt-in social signals and admin metrics.
-- Run manually in Supabase SQL Editor. Review existing policies before deployment.
create table if not exists public.user_social_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  show_online boolean not null default false,
  show_read_receipts boolean not null default true,
  notify_matches boolean not null default true,
  notify_messages boolean not null default true,
  notify_hangouts boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.user_social_preferences enable row level security;
drop policy if exists social_preferences_self_select on public.user_social_preferences;
create policy social_preferences_self_select on public.user_social_preferences for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists social_preferences_self_insert on public.user_social_preferences;
create policy social_preferences_self_insert on public.user_social_preferences for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists social_preferences_self_update on public.user_social_preferences;
create policy social_preferences_self_update on public.user_social_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
alter table public.user_presence enable row level security;
drop policy if exists presence_self_write on public.user_presence;
create policy presence_self_write on public.user_presence for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists presence_self_update on public.user_presence;
create policy presence_self_update on public.user_presence for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Presence is accessible only via this opt-in, matched-users RPC.
create or replace function public.get_match_presence(p_user_id uuid)
returns table(last_seen_at timestamptz) language sql stable security definer
set search_path = '' as $$
 select p.last_seen_at from public.user_presence p
 join public.user_social_preferences sp on sp.user_id = p.user_id and sp.show_online
 where p.user_id = p_user_id
 and exists (select 1 from public.matches m where
  (m.user_a = (select auth.uid()) and m.user_b = p_user_id) or
  (m.user_b = (select auth.uid()) and m.user_a = p_user_id))
 and not exists (select 1 from public.blocks b where
  (b.blocker = (select auth.uid()) and b.blocked = p_user_id) or
  (b.blocker = p_user_id and b.blocked = (select auth.uid())));
$$;
revoke all on function public.get_match_presence(uuid) from public, anon;
grant execute on function public.get_match_presence(uuid) to authenticated;

-- Aggregate admin data without exposing individual records.
create or replace function public.nm_admin_metrics()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_is_admin boolean; v_result jsonb;
begin
 select exists(select 1 from public.profiles a where a.id = (select auth.uid()) and a.is_admin = true) into v_is_admin;
 if not v_is_admin then raise exception 'not authorized' using errcode='42501'; end if;
 select jsonb_build_object(
   'profiles',(select count(*) from public.profiles),
   'matches',(select count(*) from public.matches),
   'reports',(select count(*) from public.reports),
   'pending_verifications',(select count(*) from public.student_verifications where status = 'pending')
 ) into v_result;
 return v_result;
end $$;
revoke all on function public.nm_admin_metrics() from public, anon;
grant execute on function public.nm_admin_metrics() to authenticated;

-- Admin-only report queue. No reporter identity is exposed.
create or replace function public.nm_admin_report_queue()
returns table(id uuid, reported uuid, reason text, status text, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin is true
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  select r.id, r.reported, r.reason, r.status, r.created_at
  from public.reports r
  order by r.created_at desc
  limit 50;
end $$;
revoke all on function public.nm_admin_report_queue() from public, anon;
grant execute on function public.nm_admin_report_queue() to authenticated;
