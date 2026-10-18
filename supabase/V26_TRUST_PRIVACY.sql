-- v26: run in Supabase SQL Editor as project owner. Review existing schema first.
BEGIN;
CREATE TABLE IF NOT EXISTS public.profile_visibility (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 mode text NOT NULL DEFAULT 'visible' CHECK (mode IN ('visible','incognito','paused')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_visibility ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own visibility" ON public.profile_visibility;
CREATE POLICY "read own visibility" ON public.profile_visibility FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert own visibility" ON public.profile_visibility;
CREATE POLICY "insert own visibility" ON public.profile_visibility FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update own visibility" ON public.profile_visibility;
CREATE POLICY "update own visibility" ON public.profile_visibility FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.student_verifications (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 email_domain text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
 requested_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own verification" ON public.student_verifications;
CREATE POLICY "read own verification" ON public.student_verifications FOR SELECT TO authenticated USING (user_id=auth.uid());
-- No client INSERT/UPDATE policy. Only the trusted RPC and project admins can write.
CREATE TABLE IF NOT EXISTS public.student_email_domains (domain text PRIMARY KEY, university_id text REFERENCES public.universities(id), enabled boolean NOT NULL DEFAULT true);
ALTER TABLE public.student_email_domains ENABLE ROW LEVEL SECURITY;
-- Populate the allowlist manually after checking ownership of each domain.
CREATE OR REPLACE FUNCTION public.request_student_verification() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE mail text; domain_part text; current_status text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT lower(email) INTO mail FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF mail IS NULL THEN RAISE EXCEPTION 'Confirm your email before requesting verification'; END IF;
 domain_part := split_part(mail,'@',2);
 IF NOT EXISTS (SELECT 1 FROM public.student_email_domains WHERE domain=domain_part AND enabled) THEN RAISE EXCEPTION 'This university email domain is not supported yet'; END IF;
 INSERT INTO public.student_verifications(user_id,email_domain,status) VALUES(auth.uid(),domain_part,'pending')
 ON CONFLICT(user_id) DO UPDATE SET email_domain=EXCLUDED.email_domain,status=CASE WHEN student_verifications.status='verified' THEN 'verified' ELSE 'pending' END,requested_at=now();
 SELECT status INTO current_status FROM public.student_verifications WHERE user_id=auth.uid();
 RETURN current_status;
END $$;
REVOKE ALL ON FUNCTION public.request_student_verification() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_student_verification() TO authenticated;
-- Keep the existing discover RPC signature/return type for frontend compatibility.
DROP FUNCTION IF EXISTS public.discover(text,integer,integer,text);
CREATE FUNCTION public.discover(p_university text DEFAULT NULL,p_min_age integer DEFAULT 18,p_max_age integer DEFAULT 99,p_gender text DEFAULT NULL)
RETURNS TABLE(id uuid,display_name text,age integer,gender text,university_id text,faculty text,bio text,interests text[],avatar_path text,photo_paths text[],itunes_track_id text,itunes_track_name text,itunes_track_artist text,itunes_track_image text,itunes_track_preview text,itunes_track_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT p.id,p.display_name,date_part('year',age(p.birth_date))::int,p.gender,p.university_id,p.faculty,p.bio,p.interests,p.avatar_path,p.photo_paths,p.itunes_track_id::text,p.itunes_track_name,p.itunes_track_artist,p.itunes_track_image,p.itunes_track_preview,p.itunes_track_url
 FROM public.profiles p LEFT JOIN public.profile_visibility v ON v.user_id=p.id
 WHERE auth.uid() IS NOT NULL AND p.id<>auth.uid()
 AND EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid())
 AND NOT EXISTS(SELECT 1 FROM public.likes l WHERE l.from_id=auth.uid() AND l.to_id=p.id)
 AND NOT public.is_blocked_pair(auth.uid(),p.id)
 AND coalesce(v.mode,'visible') <> 'paused'
 AND (coalesce(v.mode,'visible') <> 'incognito' OR EXISTS(SELECT 1 FROM public.likes l WHERE l.from_id=p.id AND l.to_id=auth.uid() AND l.is_like))
 AND (p_university IS NULL OR p.university_id=p_university)
 AND (p_gender IS NULL OR p.gender=p_gender)
 AND date_part('year',age(p.birth_date)) BETWEEN p_min_age AND p_max_age
 ORDER BY p.created_at DESC LIMIT 30;
$$;
REVOKE ALL ON FUNCTION public.discover(text,integer,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discover(text,integer,integer,text) TO authenticated;
COMMIT;
