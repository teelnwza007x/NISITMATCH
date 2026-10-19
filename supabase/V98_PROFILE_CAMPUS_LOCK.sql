-- NISIT MATCH v98
-- Enforce verified campus at the database layer, not only in the profile editor UI.
-- When a student has a verified university, profile inserts/updates always retain that campus.
BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_verified_profile_university()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  verified_campus text;
BEGIN
  SELECT sv.university_id::text
    INTO verified_campus
  FROM public.student_verifications sv
  WHERE sv.user_id = NEW.id
    AND sv.status = 'verified'
    AND sv.university_id IS NOT NULL
  LIMIT 1;

  IF verified_campus IS NOT NULL THEN
    NEW.university_id := verified_campus;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_verified_university ON public.profiles;
CREATE TRIGGER profiles_enforce_verified_university
BEFORE INSERT OR UPDATE OF university_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_verified_profile_university();

REVOKE ALL ON FUNCTION public.enforce_verified_profile_university() FROM PUBLIC;

COMMIT;

-- Verify after running:
-- SELECT p.id, p.university_id AS profile_university, sv.university_id AS verified_university, sv.status
-- FROM public.profiles p JOIN public.student_verifications sv ON sv.user_id = p.id
-- WHERE sv.status = 'verified';
