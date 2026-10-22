-- Stage only: apply to a staging Supabase project after review.
-- The BEFORE INSERT trigger protects direct REST inserts and concurrent devices.
create or replace function public.enforce_swipe_hourly_limit()
returns trigger language plpgsql security invoker
set search_path = '' as $$
declare
  used_count integer;
  next_available timestamptz;
begin
  if auth.uid() is null or new.from_id is distinct from auth.uid() then
    raise exception 'SWIPE_AUTH_REQUIRED' using errcode = '42501';
  end if;
  -- Serialize concurrent inserts from the same member across devices.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.from_id::text, 630060));
  select count(*), min(created_at) + interval '60 minutes'
    into used_count, next_available
    from public.likes
    where from_id = new.from_id
      and created_at > pg_catalog.clock_timestamp() - interval '60 minutes';
  if used_count >= 30 then
    raise exception 'SWIPE_HOURLY_LIMIT'
      using errcode = 'P0001',
            detail = pg_catalog.to_char(next_available at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_swipe_hourly_limit_insert on public.likes;
create trigger enforce_swipe_hourly_limit_insert
before insert on public.likes
for each row execute function public.enforce_swipe_hourly_limit();

create or replace function public.swipe_hourly_status()
returns table(used integer, remaining integer, next_available_at timestamptz)
language sql security invoker set search_path = '' stable as $$
  select count(*)::integer,
         pg_catalog.greatest(0, 30 - count(*)::integer),
         case when count(*) >= 30 then min(created_at) + interval '60 minutes' else null::timestamptz end
  from public.likes
  where from_id = (select auth.uid())
    and created_at > now() - interval '60 minutes';
$$;
revoke all on function public.swipe_hourly_status() from public, anon;
grant execute on function public.swipe_hourly_status() to authenticated;
