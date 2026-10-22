-- Add Huachiew Chalermprakiet University to campus email verification.
-- The university's digital education guide documents @live.hcu.ac.th.
-- Run this migration in Supabase SQL Editor.
BEGIN;

INSERT INTO public.universities (id, name)
VALUES ('huachiew', 'มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO public.student_email_domains (domain, university_id, enabled)
VALUES
  ('live.hcu.ac.th', 'huachiew', true),
  ('student.hcu.ac.th', 'huachiew', true)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id,
    enabled = true;

COMMIT;

-- Verify:
-- SELECT university_id, domain, enabled
-- FROM public.student_email_domains
-- WHERE university_id = 'huachiew'
-- ORDER BY domain;
