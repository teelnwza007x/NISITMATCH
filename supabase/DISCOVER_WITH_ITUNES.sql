-- Run in Supabase SQL Editor after checking existing discover function and column types.
-- This replaces discover return columns to include the saved iTunes song.
BEGIN;
DROP FUNCTION IF EXISTS public.discover(text, integer, integer, text);
CREATE FUNCTION public.discover(
  p_university text DEFAULT NULL,
  p_min_age integer DEFAULT 18,
  p_max_age integer DEFAULT 99,
  p_gender text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, display_name text, age integer, gender text, university_id text,
  faculty text, bio text, interests text[], avatar_path text, photo_paths text[],
  itunes_track_id text, itunes_track_name text, itunes_track_artist text,
  itunes_track_image text, itunes_track_preview text, itunes_track_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, date_part('year', age(p.birth_date))::int,
    p.gender, p.university_id, p.faculty, p.bio, p.interests, p.avatar_path,
    p.photo_paths, p.itunes_track_id::text, p.itunes_track_name,
    p.itunes_track_artist, p.itunes_track_image, p.itunes_track_preview,
    p.itunes_track_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND p.id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.likes l WHERE l.from_id = auth.uid() AND l.to_id = p.id)
    AND NOT public.is_blocked_pair(auth.uid(), p.id)
    AND (p_university IS NULL OR p.university_id = p_university)
    AND (p_gender IS NULL OR p.gender = p_gender)
    AND date_part('year', age(p.birth_date)) BETWEEN p_min_age AND p_max_age
  ORDER BY p.created_at DESC LIMIT 30;
$function$;
REVOKE ALL ON FUNCTION public.discover(text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discover(text, integer, integer, text) TO authenticated;
COMMIT;
