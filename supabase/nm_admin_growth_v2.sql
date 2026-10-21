-- Admin-only daily growth metrics, Bangkok calendar days. Run in Supabase SQL Editor.
create or replace function public.nm_admin_growth(p_days integer default 14)
returns table(day date, new_profiles bigint, new_matches bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin is true
  ) then raise exception 'Admin only' using errcode = '42501'; end if;
  return query
  with days as (
    select (timezone('Asia/Bangkok', now())::date - n)::date as d
    from generate_series(0, least(greatest(coalesce(p_days,14),1),30)-1) n
  )
  select days.d,
    (select count(*) from public.profiles p where (p.created_at at time zone 'Asia/Bangkok')::date = days.d),
    (select count(*) from public.matches m where (m.created_at at time zone 'Asia/Bangkok')::date = days.d)
  from days order by days.d;
end $$;
revoke all on function public.nm_admin_growth(integer) from public, anon;
grant execute on function public.nm_admin_growth(integer) to authenticated;
