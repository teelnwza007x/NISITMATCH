-- Run in Supabase SQL Editor. Keeps RLS enabled and does not delete any data.
-- Allow signed-in users to read their own profile and profiles of mutual matches.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_read ON public.profiles;
CREATE POLICY p_read ON public.profiles FOR SELECT TO authenticated
USING (
  id = (select auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.user_a = (select auth.uid()) AND m.user_b = profiles.id)
       OR (m.user_b = (select auth.uid()) AND m.user_a = profiles.id)
  )
);
-- Storage image URLs are public URLs; this bucket must be public to display them.
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
-- Check matching users' profiles, image paths, and actual storage objects.
SELECT m.id AS match_id, a.display_name AS name_a, b.display_name AS name_b,
       a.avatar_path AS photo_a, b.avatar_path AS photo_b,
       a.photo_paths AS photos_a, b.photo_paths AS photos_b
FROM public.matches m
LEFT JOIN public.profiles a ON a.id = m.user_a
LEFT JOIN public.profiles b ON b.id = m.user_b
ORDER BY m.created_at DESC LIMIT 30;
