-- NISIT MATCH v98: enforce verified campus on the profile row at database level.
-- A verified student_verifications.university_id is the source of truth.
-- This permits a one-time correction of an older mismatched profile to the verified campus,
-- but prevents the profile from being saved with any other university afterwards.
BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_profile_verified_campus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  locked_university text;
BEGIN
  SELECT sv.university_id
    INTO locked_university
  FROM public.student_verifications sv
  WHERE sv.user_id = NEW.id
    AND sv.status = 'verified'
  LIMIT 1;

  IF locked_university IS NOT NULL THEN
    IF NEW.university_id IS DISTINCT FROM locked_university THEN
      RAISE EXCEPTION 'Verified university is locked for this account';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_verified_campus ON public.profiles;
CREATE TRIGGER profiles_lock_verified_campus
BEFORE INSERT OR UPDATE OF university_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_verified_campus();

COMMIT;
