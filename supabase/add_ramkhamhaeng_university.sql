-- Add Ramkhamhaeng University to NISIT MATCH profile and university email verification.
BEGIN;

INSERT INTO public.universities (id, name)
VALUES ('ru', 'มหาวิทยาลัยรามคำแหง')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES ('rumail.ru.ac.th', 'ru', true)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id,
    enabled = true;

COMMIT;

-- Verify:
SELECT u.id, u.name, d.domain, d.enabled
FROM public.universities u
JOIN public.student_email_domains d ON d.university_id = u.id
WHERE u.id = 'ru' OR d.domain = 'rumail.ru.ac.th';
