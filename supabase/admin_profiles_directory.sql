-- Admin-only profile directory. Exposes only public profile fields, no email, birth date or private messages.
create or replace function public.nm_admin_profiles(p_search text default '', p_limit integer default 30, p_offset integer default 0)
returns table(id uuid, display_name text, university_id text, faculty text, major text, bio text, avatar_path text, photo_paths text[], created_at timestamptz, is_admin boolean, total_count bigint)
language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles a where a.id=auth.uid() and a.is_admin is true) then
    raise exception 'Admin only' using errcode='42501';
  end if;
  return query
  select p.id,p.display_name,p.university_id,p.faculty,p.major,p.bio,p.avatar_path,p.photo_paths,p.created_at,p.is_admin,
    count(*) over() as total_count
  from public.profiles p
  where coalesce(trim(p_search),'')='' or p.display_name ilike '%'||replace(replace(trim(p_search),'%','\\%'),'_','\\_')||'%' or p.university_id ilike '%'||trim(p_search)||'%'
  order by p.created_at desc,p.id
  limit least(greatest(coalesce(p_limit,30),1),50)
  offset greatest(coalesce(p_offset,0),0);
end;
$$;
revoke all on function public.nm_admin_profiles(text,integer,integer) from public,anon;
grant execute on function public.nm_admin_profiles(text,integer,integer) to authenticated;
