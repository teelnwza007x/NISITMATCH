-- NISIT MATCH v96
-- Adds a guarded profile-detail RPC for Premium likes/visitors, including profile music.
-- Also keeps the existing profile/media and Hangout policies unchanged.

CREATE OR REPLACE FUNCTION public.get_premium_list_profile_details(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  result jsonb;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF p_profile_id IS NULL OR p_profile_id = caller_id THEN
    RETURN NULL;
  END IF;
  IF NOT public.is_premium_active(caller_id) THEN
    RAISE EXCEPTION 'Premium subscription required';
  END IF;

  -- Only reveal extended details for people who liked the caller or visited them.
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.likes l
      WHERE l.from_id = p_profile_id AND l.to_id = caller_id AND l.is_like = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profile_views v
      WHERE v.viewer_id = p_profile_id AND v.profile_id = caller_id
    )
  ) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker = caller_id AND b.blocked = p_profile_id)
       OR (b.blocker = p_profile_id AND b.blocked = caller_id)
  ) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'age', CASE WHEN p.birth_date IS NULL THEN NULL ELSE date_part('year', age(p.birth_date))::int END,
    'university_id', p.university_id,
    'faculty', p.faculty,
    'major', p.major,
    'bio', p.bio,
    'interests', p.interests,
    'relationship_intent', p.relationship_intent,
    'avatar_path', p.avatar_path,
    'photo_paths', p.photo_paths,
    'itunes_track_id', p.itunes_track_id::text,
    'itunes_track_name', p.itunes_track_name,
    'itunes_track_artist', p.itunes_track_artist,
    'itunes_track_image', p.itunes_track_image,
    'itunes_track_preview', p.itunes_track_preview,
    'itunes_track_url', p.itunes_track_url
  ) INTO result
  FROM public.profiles p
  WHERE p.id = p_profile_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_premium_list_profile_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_premium_list_profile_details(uuid) TO authenticated;
