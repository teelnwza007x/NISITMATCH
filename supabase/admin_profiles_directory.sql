-- Admin-only member directory with gender filters and public-facing profile presentation fields.
-- Run this migration in Supabase SQL Editor to replace the previous RPC signature.
drop function if exists public.nm_admin_profiles(text,integer,integer);
create or replace function public.nm_admin_profiles(p_search text default '', p_limit integer default 30, p_offset integer default 0, p_gender text default '')
returns table(id uuid, display_name text, university_id text, faculty text, major text, bio text, avatar_path text, photo_paths text[], created_at timestamptz, is_admin boolean, total_count bigint, gender text, age integer, interests text[], relationship_intent text, itunes_track_id text, itunes_track_name text, itunes_track_artist text, itunes_track_image text, itunes_track_preview text, itunes_track_url text)
language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles a where a.id=auth.uid() and a.is_admin is true) then
    raise exception 'Admin only' using errcode='42501';
  end if;
  return query
  select p.id,p.display_name,p.university_id,p.faculty,p.major,p.bio,p.avatar_path,p.photo_paths,p.created_at,p.is_admin,
    count(*) over() as total_count,p.gender,
    case when p.birth_date is null then null else date_part('year',age(current_date,p.birth_date))::integer end,
    p.interests,p.relationship_intent,p.itunes_track_id,p.itunes_track_name,p.itunes_track_artist,p.itunes_track_image,p.itunes_track_preview,p.itunes_track_url
  from public.profiles p
  where (coalesce(trim(p_search),'')='' or p.display_name ilike '%'||trim(p_search)||'%' or p.university_id ilike '%'||trim(p_search)||'%')
    and (coalesce(p_gender,'')='' or p.gender=p_gender)
  order by p.created_at desc,p.id
  limit least(greatest(coalesce(p_limit,30),1),50)
  offset greatest(coalesce(p_offset,0),0);
end;
$$;
revoke all on function public.nm_admin_profiles(text,integer,integer,text) from public,anon;
grant execute on function public.nm_admin_profiles(text,integer,integer,text) to authenticated;
