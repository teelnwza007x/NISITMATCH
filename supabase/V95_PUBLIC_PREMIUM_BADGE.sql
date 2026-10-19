-- NISIT MATCH v95: safe, read-only Premium status for public profile badges.
-- Does not grant Premium to anyone and does not expose billing/provider details.
CREATE OR REPLACE FUNCTION public.is_profile_premium(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.premium_subscriptions ps
    WHERE ps.user_id = p_profile_id
      AND ps.status = 'active'
      AND (ps.ends_at IS NULL OR ps.ends_at > now())
  );
$$;

REVOKE ALL ON FUNCTION public.is_profile_premium(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_premium(uuid) TO authenticated;
