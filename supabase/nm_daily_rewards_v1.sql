-- Run once in Supabase SQL Editor. Daily check-in is server-authoritative.
create table if not exists public.nm_daily_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null,
  streak integer not null check (streak between 1 and 100000),
  points integer not null check (points between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, claim_date)
);
alter table public.nm_daily_checkins enable row level security;
revoke all on public.nm_daily_checkins from anon, authenticated;
create or replace function public.nm_daily_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'today_claimed', exists(select 1 from public.nm_daily_checkins where user_id=auth.uid() and claim_date=(now() at time zone 'Asia/Bangkok')::date),
    'streak', coalesce((select case when claim_date >= (now() at time zone 'Asia/Bangkok')::date - 1 then streak else 0 end from public.nm_daily_checkins where user_id=auth.uid() order by claim_date desc limit 1),0),
    'total_points', coalesce((select sum(points) from public.nm_daily_checkins where user_id=auth.uid()),0)
  );
$$;
create or replace function public.nm_daily_claim()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Bangkok')::date;
  previous_date date;
  previous_streak integer;
  next_streak integer;
  earned integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if exists(select 1 from public.nm_daily_checkins where user_id=uid and claim_date=today) then
    return jsonb_build_object('claimed',false,'reason','already_claimed','status',public.nm_daily_status());
  end if;
  select claim_date,streak into previous_date,previous_streak
  from public.nm_daily_checkins where user_id=uid order by claim_date desc limit 1;
  next_streak := case when previous_date=today-1 then previous_streak+1 else 1 end;
  earned := case when next_streak % 7=0 then 30 when next_streak % 3=0 then 15 else 10 end;
  insert into public.nm_daily_checkins(user_id,claim_date,streak,points) values(uid,today,next_streak,earned);
  return jsonb_build_object('claimed',true,'earned_points',earned,'status',public.nm_daily_status());
end;
$$;
revoke all on function public.nm_daily_status() from public, anon;
revoke all on function public.nm_daily_claim() from public, anon;
grant execute on function public.nm_daily_status() to authenticated;
grant execute on function public.nm_daily_claim() to authenticated;
-- Points are display-only until a separate server-side redemption RPC is implemented.
