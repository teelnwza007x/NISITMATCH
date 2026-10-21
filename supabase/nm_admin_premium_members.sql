-- Admin-only Premium directory for NISIT MATCH
create or replace function public.nm_admin_premium_members(p_search text default '', p_limit integer default 20, p_offset integer default 0)
returns table(user_id uuid, display_name text, plan text, provider text, status text, ends_at timestamptz, is_active boolean, total_count bigint, active_count bigint)
language plpgsql security definer set search_path = ''
as $$
begin
 if (select auth.uid()) is null or not exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin is true) then
  raise exception 'Admin only' using errcode='42501';
 end if;
 return query
 with matching as (
  select s.user_id, p.display_name::text, s.plan::text, s.provider::text, s.status::text, s.ends_at,
  (s.status='active' and s.ends_at>now()) as is_active
  from public.premium_subscriptions s join public.profiles p on p.id=s.user_id
  where coalesce(trim(p_search),'')='' or p.display_name ilike '%'||trim(p_search)||'%'
 )
 select m.user_id,m.display_name,m.plan,m.provider,m.status,m.ends_at,m.is_active,
 (select count(*) from matching)::bigint,(select count(*) from matching where is_active)::bigint
 from matching m order by m.is_active desc,m.ends_at desc nulls last,m.user_id
 limit least(greatest(coalesce(p_limit,20),1),50) offset greatest(coalesce(p_offset,0),0);
end $$;
revoke all on function public.nm_admin_premium_members(text,integer,integer) from public,anon;
grant execute on function public.nm_admin_premium_members(text,integer,integer) to authenticated;
