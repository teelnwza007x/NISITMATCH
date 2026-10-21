-- NISIT MATCH 8.3: read-only admin health summary.
-- Requires public.profiles.is_admin, public.reports and public.campus_domain_requests.
-- Does not expose service credentials, member email addresses or push endpoints.
create or replace function public.nm_admin_health_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin is true
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'checked_at', now(),
    'pending_reports', (select count(*) from public.reports r where lower(coalesce(r.status,'')) in ('pending','open','new')),
    'domain_requests', (select count(*) from public.campus_domain_requests),
    'pending_push', (select count(*) from public.push_queue q where q.processed_at is null and q.attempts < 3),
    'failed_push', (select count(*) from public.push_queue q where q.processed_at is null and q.attempts >= 3)
  ) into result;
  return result;
end;
$$;
revoke all on function public.nm_admin_health_summary() from public, anon;
grant execute on function public.nm_admin_health_summary() to authenticated;
notify pgrst, 'reload schema';
