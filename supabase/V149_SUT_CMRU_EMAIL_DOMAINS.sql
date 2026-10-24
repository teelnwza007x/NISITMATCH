-- Add SUT and correct CMRU email verification domains.
BEGIN;
INSERT INTO public.universities (id, name) VALUES
 ('sut', 'มหาวิทยาลัยเทคโนโลยีสุรนารี'),
 ('cmru', 'มหาวิทยาลัยราชภัฏเชียงใหม่')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
UPDATE public.student_email_domains
SET enabled = false
WHERE university_id = 'cmru' AND domain <> 'g.cmru.ac.th';
INSERT INTO public.student_email_domains (domain, university_id, enabled) VALUES
 ('sut.ac.th', 'sut', true),
 ('g.cmru.ac.th', 'cmru', true)
ON CONFLICT (domain) DO UPDATE SET university_id = EXCLUDED.university_id, enabled = true;
COMMIT;
