-- NISIT MATCH: Siam University profile and campus email verification.
-- Run in Supabase SQL Editor. Existing records are preserved.
-- Verifying email ownership does not independently prove current enrollment.
BEGIN;
INSERT INTO public.universities (id, name)
VALUES ('siam', 'มหาวิทยาลัยสยาม')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES ('siam.edu', 'siam', true)
ON CONFLICT (domain) DO UPDATE SET university_id = EXCLUDED.university_id, enabled = true;
COMMIT;

SELECT u.name, d.domain, d.enabled
FROM public.student_email_domains d
JOIN public.universities u ON u.id = d.university_id
WHERE d.domain = 'siam.edu';
