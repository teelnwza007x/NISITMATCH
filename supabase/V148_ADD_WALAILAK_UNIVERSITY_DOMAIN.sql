-- Enable Walailak University for profile selection and campus email verification.
BEGIN;
INSERT INTO public.universities (id, name)
VALUES ('wu', 'มหาวิทยาลัยวลัยลักษณ์')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES ('mail.wu.ac.th', 'wu', true)
ON CONFLICT (domain) DO UPDATE SET university_id = EXCLUDED.university_id, enabled = true;
COMMIT;
