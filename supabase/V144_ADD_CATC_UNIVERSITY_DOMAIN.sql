-- Add Civil Aviation Training Center to profile and campus email verification.
-- Run this migration in Supabase SQL Editor.
BEGIN;

INSERT INTO public.universities (id, name)
VALUES ('catc', 'สถาบันการบินพลเรือน')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES ('students.catc.or.th', 'catc', true)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id,
    enabled = true;

COMMIT;
