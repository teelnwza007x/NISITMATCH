-- Run once in Supabase SQL Editor. Returns only verified user IDs, never email addresses.
CREATE OR REPLACE FUNCTION public.verified_student_profile_ids(candidate_ids uuid[])
RETURNS TABLE(user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT v.user_id
  FROM public.student_verifications AS v
  WHERE auth.uid() IS NOT NULL
    AND v.status = 'verified'
    AND v.user_id = ANY(candidate_ids)
    AND EXISTS (SELECT 1 FROM public.profiles AS p WHERE p.id = v.user_id)
    AND NOT public.is_blocked_pair(auth.uid(), v.user_id)
  LIMIT 100;
$$;
REVOKE ALL ON FUNCTION public.verified_student_profile_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verified_student_profile_ids(uuid[]) TO authenticated;
