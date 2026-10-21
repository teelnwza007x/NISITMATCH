-- NISIT MATCH: add/enable requested institutional email domains.
-- Run once in Supabase SQL Editor. Does not delete existing verifications.
-- OTP verifies mailbox control, not current student enrollment.
BEGIN;
INSERT INTO public.universities (id, name) VALUES
  ('su', 'มหาวิทยาลัยศิลปากร'),
  ('cra', 'ราชวิทยาลัยจุฬาภรณ์')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.student_email_domains (domain, university_id, enabled) VALUES
  ('su.ac.th', 'su', true),
  ('edu.cra.ac.th', 'cra', true)
ON CONFLICT (domain) DO UPDATE SET
  university_id = EXCLUDED.university_id,
  enabled = true;
COMMIT;

SELECT u.name, d.domain, d.enabled
FROM public.student_email_domains d
JOIN public.universities u ON u.id = d.university_id
WHERE d.domain IN ('su.ac.th', 'edu.cra.ac.th')
ORDER BY d.domain;
