-- NISIT MATCH: Daily Login real rewards (run in Supabase SQL Editor)
-- Requires nm_daily_rewards_v1.sql, V60_SUPERLIKE_UNDO.sql, V76_PREMIUM_HANGOUT_MEDIA.sql
create table if not exists public.nm_daily_reward_wallet (
 user_id uuid primary key references auth.users(id) on delete cascade,
 super_like_credits integer not null default 0 check(super_like_credits >= 0),
 updated_at timestamptz not null default now()
);
alter table public.nm_daily_reward_wallet enable row level security;
revoke all on public.nm_daily_reward_wallet from public, anon, authenticated;
create or replace function public.nm_daily_status()
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
 'today_claimed', exists(select 1 from public.nm_daily_checkins where user_id=auth.uid() and claim_date=(now() at time zone 'Asia/Bangkok')::date),
 'streak', coalesce((select case when claim_date >= (now() at time zone 'Asia/Bangkok')::date - 1 then streak else 0 end from public.nm_daily_checkins where user_id=auth.uid() order by claim_date desc limit 1),0),
 'total_points',coalesce((select sum(points) from public.nm_daily_checkins where user_id=auth.uid()),0),
 'super_like_credits',coalesce((select super_like_credits from public.nm_daily_reward_wallet where user_id=auth.uid()),0)
 );
$$;
create or replace function public.nm_daily_claim()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid();
 today date := (now() at time zone 'Asia/Bangkok')::date;
 previous_date date; previous_streak integer; next_streak integer;
 day_in_cycle integer; earned integer; credits integer := 0; premium_awarded boolean := false;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if exists(select 1 from public.nm_daily_checkins where user_id=uid and claim_date=today) then
  return jsonb_build_object('claimed',false,'reason','already_claimed','status',public.nm_daily_status());
 end if;
 select claim_date,streak into previous_date,previous_streak from public.nm_daily_checkins where user_id=uid order by claim_date desc limit 1;
 next_streak := case when previous_date=today-1 then previous_streak+1 else 1 end;
 day_in_cycle := ((next_streak-1)%7)+1;
 earned := case when day_in_cycle=7 then 30 when day_in_cycle in (3,6) then 15 else 10 end;
 insert into public.nm_daily_checkins(user_id,claim_date,streak,points) values(uid,today,next_streak,earned);
 if day_in_cycle < 7 then
  credits := case day_in_cycle when 1 then 1 when 2 then 1 when 3 then 2 when 4 then 2 when 5 then 3 else 3 end;
  insert into public.nm_daily_reward_wallet(user_id,super_like_credits)
  values(uid,credits) on conflict(user_id) do update set super_like_credits=public.nm_daily_reward_wallet.super_like_credits+excluded.super_like_credits,updated_at=now();
 else
  perform 1 from public.profiles where id=uid for update;
  if not found then raise exception 'Profile not found'; end if;
  insert into public.premium_subscriptions(user_id,plan,status,starts_at,ends_at,provider,provider_reference,updated_at)
  values(uid,'weekly','active',now(),now()+interval '1 day','daily_login','streak:'||next_streak,now())
  on conflict(user_id) do update set
   plan='weekly',status='active',
   starts_at=coalesce(public.premium_subscriptions.starts_at,now()),
   ends_at=greatest(coalesce(public.premium_subscriptions.ends_at,now()),now())+interval '1 day',
   provider='daily_login',provider_reference='streak:'||next_streak,updated_at=now();
  premium_awarded := true;
 end if;
 return jsonb_build_object('claimed',true,'earned_points',earned,'reward_day',day_in_cycle,'earned_super_likes',credits,'earned_premium_days',case when premium_awarded then 1 else 0 end,'status',public.nm_daily_status());
end;
$$;
-- Preserve existing daily quota of three Super Likes; reward credits permit extra sends.
create or replace function public.v60_super_like(p_target uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_me uuid := auth.uid(); v_used bigint;
begin
 if v_me is null or p_target is null or p_target=v_me then raise exception 'Invalid Super Like'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_me::text,60));
 if not exists(select 1 from public.profiles where id=p_target) then raise exception 'Profile not found'; end if;
 if public.is_blocked_pair(v_me,p_target) then raise exception 'Profile unavailable'; end if;
 if exists(select 1 from public.likes where from_id=v_me and to_id=p_target) then raise exception 'Already swiped'; end if;
 select count(*) into v_used from public.super_likes where from_id=v_me and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if v_used >= 3 then
  update public.nm_daily_reward_wallet set super_like_credits=super_like_credits-1,updated_at=now()
  where user_id=v_me and super_like_credits>0;
  if not found then raise exception 'Daily Super Like limit reached'; end if;
 end if;
 insert into public.super_likes(from_id,to_id) values(v_me,p_target);
 insert into public.likes(from_id,to_id,is_like) values(v_me,p_target,true);
 return true;
end;
$$;
revoke all on function public.nm_daily_status() from public,anon;
revoke all on function public.nm_daily_claim() from public,anon;
revoke all on function public.v60_super_like(uuid) from public,anon;
grant execute on function public.nm_daily_status() to authenticated;
grant execute on function public.nm_daily_claim() to authenticated;
grant execute on function public.v60_super_like(uuid) to authenticated;
