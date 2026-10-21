-- NISIT MATCH 8.3: approve a requested campus domain for an existing university.
-- Requires campus_domain_requests.sql and student_email_domains table.
-- Run in Supabase SQL Editor. Only admin profiles can execute.
create or replace function public.nm_admin_approve_domain_request(
  p_request_id uuid,
  p_university_id text
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_domain text;
  v_university text;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin is true
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_request_id is null or p_university_id is null then
    raise exception 'request and university are required';
  end if;
  select u.id into v_university
  from public.universities u where u.id = p_university_id;
  if v_university is null then
    raise exception 'unknown university';
  end if;
  select lower(trim(both '@' from trim(r.email_domain))) into v_domain
  from public.campus_domain_requests r
  where r.id = p_request_id
  for update;
  if v_domain is null then
    raise exception 'request not found';
  end if;
  if length(v_domain) > 253 or v_domain !~ '^[a-z0-9-]+([.][a-z0-9-]+)+$' then
    raise exception 'invalid email domain';
  end if;
  -- Never silently reassign an existing domain to a different university.
  if exists (
    select 1 from public.student_email_domains d
    where d.domain = v_domain and d.university_id <> v_university
  ) then
    raise exception 'domain already belongs to another university';
  end if;
  insert into public.student_email_domains (domain, university_id, enabled)
  values (v_domain, v_university, true)
  on conflict (domain) do update set enabled = true;
  delete from public.campus_domain_requests where id = p_request_id;
  return jsonb_build_object('approved', true, 'domain', v_domain, 'university_id', v_university);
end;
$$;
revoke all on function public.nm_admin_approve_domain_request(uuid,text) from public, anon;
grant execute on function public.nm_admin_approve_domain_request(uuid,text) to authenticated;
notify pgrst, 'reload schema';
