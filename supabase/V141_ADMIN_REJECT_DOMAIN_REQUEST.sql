-- NISIT MATCH 8.3: admin-only rejection of a campus domain request.
-- Requires supabase/campus_domain_requests.sql.
-- Rejection removes only the request; it never changes verified users or enabled domains.
create or replace function public.nm_admin_reject_domain_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_domain text;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin is true
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_request_id is null then
    raise exception 'request ID required';
  end if;
  delete from public.campus_domain_requests r
  where r.id = p_request_id
  returning r.email_domain into v_domain;
  if not found then
    raise exception 'request not found';
  end if;
  return jsonb_build_object('rejected', true, 'domain', v_domain);
end;
$$;
revoke all on function public.nm_admin_reject_domain_request(uuid) from public, anon;
grant execute on function public.nm_admin_reject_domain_request(uuid) to authenticated;
notify pgrst, 'reload schema';
