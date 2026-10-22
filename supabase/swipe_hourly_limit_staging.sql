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
  -- Never trust client-supplied timestamps for rolling windows.
  new.created_at := pg_catalog.clock_timestamp();
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

-- Keep the rolling-window timestamp and swipe ownership immutable.
-- Existing application workflows may update is_like, which remains allowed.
create or replace function public.protect_swipe_quota_fields()
returns trigger language plpgsql security invoker
set search_path = '' as $$
begin
  if new.from_id is distinct from old.from_id
     or new.to_id is distinct from old.to_id
     or new.created_at is distinct from old.created_at then
    raise exception 'SWIPE_IMMUTABLE_FIELDS' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_swipe_quota_fields_update on public.likes;
create trigger protect_swipe_quota_fields_update
before update on public.likes
for each row execute function public.protect_swipe_quota_fields();

-- Rolling count is based on retained likes rows. A successful Undo refunds one
-- swipe, matching existing v60_undo_swipe behavior. Re-swiping consumes it again.
