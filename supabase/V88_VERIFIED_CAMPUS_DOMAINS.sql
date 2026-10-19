-- NISIT MATCH v88: restore the requested campus choices with reviewed mailbox domains.
-- Does not delete or modify existing verification rows or user profiles.
BEGIN;

-- Keep the universities already used by the project; only enable the reviewed domains below.
UPDATE public.student_email_domains SET enabled = false;

INSERT INTO public.student_email_domains (domain, university_id, enabled) VALUES
  ('kmitl.ac.th', 'kmitl', true),
  ('ku.th', 'ku', true),
  ('live.ku.th', 'ku', true),
  ('student.chula.ac.th', 'chula', true),
  ('dome.tu.ac.th', 'tu', true),
  ('mail.kmutt.ac.th', 'kmutt', true),
  ('email.kmutnb.ac.th', 'kmutnb', true),
  ('go.buu.ac.th', 'buu', true),
  ('my.buu.ac.th', 'buu', true),
  ('g.swu.ac.th', 'swu', true),
  ('su.ac.th', 'su', true),
  ('silpakorn.edu', 'su', true),
  ('spumail.net', 'spu', true),
  ('spulive.net', 'spu', true),
  ('bumail.net', 'bu', true)
ON CONFLICT (domain) DO UPDATE
SET university_id = EXCLUDED.university_id,
    enabled = EXCLUDED.enabled;

-- Review the final allow-list after the transaction commits.
COMMIT;

SELECT university_id, domain, enabled
FROM public.student_email_domains
WHERE enabled = true
ORDER BY university_id, domain;
