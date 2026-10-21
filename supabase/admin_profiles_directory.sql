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
  select p.id,p.display_name::text,p.university_id::text,p.faculty::text,p.major::text,p.bio::text,p.avatar_path::text,ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(to_jsonb(p.photo_paths))='array' THEN to_jsonb(p.photo_paths) ELSE '[]'::jsonb END)),p.created_at::timestamptz,p.is_admin::boolean,
    count(*) over() as total_count,p.gender::text,
    case when p.birth_date is null then null else date_part('year',age(current_date,p.birth_date))::integer end,
    ARRAY(SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(to_jsonb(p.interests))='array' THEN to_jsonb(p.interests) ELSE '[]'::jsonb END)),p.relationship_intent::text,p.itunes_track_id::text,p.itunes_track_name::text,p.itunes_track_artist::text,p.itunes_track_image::text,p.itunes_track_preview::text,p.itunes_track_url::text
  from public.profiles p
  where (coalesce(trim(p_search),'')='' or p.display_name ilike '%'||trim(p_search)||'%' or p.university_id ilike '%'||trim(p_search)||'%')
    and (coalesce(p_gender,'')='' or p.gender::text=p_gender)
  order by p.created_at desc,p.id
  limit least(greatest(coalesce(p_limit,30),1),50)
  offset greatest(coalesce(p_offset,0),0);
end;
$$;
revoke all on function public.nm_admin_profiles(text,integer,integer,text) from public,anon;
grant execute on function public.nm_admin_profiles(text,integer,integer,text) to authenticated;
