-- NISIT MATCH: North Bangkok University (NBU) campus email support.
-- Run in Supabase SQL Editor after base university/domain tables exist.
BEGIN;
INSERT INTO public.universities (id, name) VALUES ('nbu', 'มหาวิทยาลัยนอร์ทกรุงเทพ')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES ('northbkk.ac.th', 'nbu', true)
ON CONFLICT (domain) DO UPDATE SET university_id = EXCLUDED.university_id, enabled = true;
COMMIT;
SELECT u.name, d.domain, d.enabled FROM public.student_email_domains d
JOIN public.universities u ON u.id = d.university_id WHERE d.domain = 'northbkk.ac.th';
