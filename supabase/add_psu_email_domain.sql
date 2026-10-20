-- Enable Prince of Songkla University campus email verification.
-- Run in Supabase SQL Editor; safe to rerun.
BEGIN;
INSERT INTO public.universities (id, name)
VALUES ('psu', 'มหาวิทยาลัยสงขลานครินทร์')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES ('email.psu.ac.th', 'psu', true)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id, enabled = true;
COMMIT;

SELECT university_id, domain, enabled
FROM public.student_email_domains
WHERE domain = 'email.psu.ac.th';
