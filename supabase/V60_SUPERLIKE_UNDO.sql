-- NISIT MATCH v60: run once after existing schema and V26 privacy migration.
-- Existing profiles, matches, likes, messages and privacy policies are preserved.
create table if not exists public.super_likes (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(from_id,to_id),
  constraint super_like_not_self check (from_id <> to_id)
);
create index if not exists super_likes_daily_idx on public.super_likes(from_id,created_at);
alter table public.super_likes enable row level security;
-- No client write access. Security-definer RPC enforces quota and identity atomically.
drop policy if exists super_likes_read_self on public.super_likes;
create policy super_likes_read_self on public.super_likes for select to authenticated using (from_id=(select auth.uid()));

create or replace function public.v60_super_like(p_target uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null or p_target is null or p_target = v_me then raise exception 'Invalid Super Like'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_me::text, 60));
  if not exists(select 1 from public.profiles where id=p_target) then raise exception 'Profile not found'; end if;
  if public.is_blocked_pair(v_me,p_target) then raise exception 'Profile unavailable'; end if;
  if exists(select 1 from public.likes where from_id=v_me and to_id=p_target) then raise exception 'Already swiped'; end if;
  if (select count(*) from public.super_likes where from_id=v_me and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC') >= 3 then
    raise exception 'Daily Super Like limit reached';
  end if;
  insert into public.super_likes(from_id,to_id) values(v_me,p_target);
  -- Existing on_like trigger still creates matches/notifications.
  insert into public.likes(from_id,to_id,is_like) values(v_me,p_target,true);
  return true;
end $$;
revoke all on function public.v60_super_like(uuid) from public;
grant execute on function public.v60_super_like(uuid) to authenticated;

create or replace function public.v60_undo_swipe(p_target uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid(); v_swipe timestamptz;
begin
  if v_me is null or p_target is null then return false; end if;
  select created_at into v_swipe from public.likes where from_id=v_me and to_id=p_target for update;
  if v_swipe is null or v_swipe < now()-interval '2 minutes' then return false; end if;
  -- Do not undo a swipe that created a match: this would affect conversations.
  if exists(select 1 from public.matches where user_a=least(v_me,p_target) and user_b=greatest(v_me,p_target)) then return false; end if;
  -- Super Like quota is intentionally not refunded.
  delete from public.likes where from_id=v_me and to_id=p_target;
  return found;
end $$;
revoke all on function public.v60_undo_swipe(uuid) from public;
grant execute on function public.v60_undo_swipe(uuid) to authenticated;
