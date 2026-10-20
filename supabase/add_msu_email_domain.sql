-- Add Mahasarakham University mailbox domain without changing other domains.
-- Run in Supabase SQL Editor. Email OTP confirms mailbox access, not current enrollment.
BEGIN;
INSERT INTO public.universities (id,name) VALUES ('mahasarakham','มหาวิทยาลัยมหาสารคาม')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO public.student_email_domains (domain,university_id,enabled)
VALUES ('msu.ac.th','mahasarakham',true)
ON CONFLICT (domain) DO UPDATE SET university_id=EXCLUDED.university_id,enabled=true;
COMMIT;
SELECT university_id,domain,enabled FROM public.student_email_domains WHERE domain='msu.ac.th';
