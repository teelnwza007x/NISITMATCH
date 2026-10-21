-- NISIT MATCH 8.3: admin-only campus domain request review.
-- Apply in Supabase SQL Editor after campus_domain_requests.sql.
-- Read-only RPC; never exposes requests to ordinary members.
create or replace function public.nm_admin_domain_request_queue()
returns table (id uuid, university_name text, email_domain text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin is true
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
  select r.id, r.university_name, r.email_domain, r.created_at
  from public.campus_domain_requests r
  order by r.created_at desc limit 100;
end;
$$;
revoke all on function public.nm_admin_domain_request_queue() from public, anon;
grant execute on function public.nm_admin_domain_request_queue() to authenticated;
notify pgrst, 'reload schema';
