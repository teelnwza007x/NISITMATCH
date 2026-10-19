-- NISIT MATCH v86: only explicitly confirmed email domains, one verified mailbox per account,
-- and immutable university/email after successful verification.
BEGIN;

-- Keep the selector limited to the two institutions/domains supplied by the project owner.
UPDATE public.student_email_domains SET enabled = false;
INSERT INTO public.student_email_domains(domain, university_id, enabled) VALUES
  ('spumail.net', 'spu', true),
  ('bumail.net', 'bu', true),
  ('bu.ac.th', 'bu', true)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id, enabled = true;

ALTER TABLE public.student_verifications ADD COLUMN IF NOT EXISTS verified_email text;
ALTER TABLE public.student_verifications ADD COLUMN IF NOT EXISTS university_id text;

-- Stop migration with an actionable error if old data already contains duplicate verified addresses.
DO $$
BEGIN
  IF EXISTS (
    SELECT lower(verified_email)
    FROM public.student_verifications
    WHERE status = 'verified' AND verified_email IS NOT NULL
    GROUP BY lower(verified_email)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate verified university emails already exist. Resolve duplicate rows in student_verifications before running V86 migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS student_verifications_unique_verified_email
ON public.student_verifications (lower(verified_email))
WHERE status = 'verified' AND verified_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_verified_campus_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'verified' AND (
    NEW.university_id IS DISTINCT FROM OLD.university_id OR
    lower(NEW.verified_email) IS DISTINCT FROM lower(OLD.verified_email)
  ) THEN
    RAISE EXCEPTION 'Verified university and email are locked and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS student_verification_lock_campus ON public.student_verifications;
CREATE TRIGGER student_verification_lock_campus
BEFORE UPDATE ON public.student_verifications
FOR EACH ROW EXECUTE FUNCTION public.prevent_verified_campus_change();

COMMIT;

-- Review enabled domains after running:
-- SELECT university_id, domain, enabled FROM public.student_email_domains WHERE enabled ORDER BY university_id, domain;
