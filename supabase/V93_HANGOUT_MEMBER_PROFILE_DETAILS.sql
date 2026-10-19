-- NISIT MATCH v93: expose only profile fields needed by members of the same Hangout room.
-- Safe additive migration. Does not expose email, phone, credentials, or private account fields.
create or replace function public.hangout_public_profile_details(p_event_id uuid, p_profile_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  -- Requester must belong to the room, and target must also belong to that same room.
  if not exists (
    select 1 from public.hangout_events e
    where e.id = p_event_id and (
      e.creator_id = auth.uid() or exists (
        select 1 from public.hangout_rsvps r
        where r.event_id = e.id and r.user_id = auth.uid()
      )
    )
  ) or not exists (
    select 1 from public.hangout_events e
    where e.id = p_event_id and e.creator_id = p_profile_id
    union all
    select 1 from public.hangout_rsvps r
    where r.event_id = p_event_id and r.user_id = p_profile_id
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'avatar_path', p.avatar_path,
    'photo_paths', p.photo_paths,
    'university_id', p.university_id,
    'faculty', p.faculty,
    'major', p.major,
    'bio', p.bio,
    'interests', p.interests,
    'relationship_intent', p.relationship_intent,
    'itunes_track_id', p.itunes_track_id,
    'itunes_track_name', p.itunes_track_name,
    'itunes_track_artist', p.itunes_track_artist,
    'itunes_track_image', p.itunes_track_image,
    'itunes_track_preview', p.itunes_track_preview,
    'itunes_track_url', p.itunes_track_url
  ) into result
  from public.profiles p
  where p.id = p_profile_id;

  return result;
end;
$$;
revoke all on function public.hangout_public_profile_details(uuid, uuid) from public;
grant execute on function public.hangout_public_profile_details(uuid, uuid) to authenticated;
