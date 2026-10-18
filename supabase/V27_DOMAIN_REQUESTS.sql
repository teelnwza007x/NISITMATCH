-- Run after V26_TRUST_PRIVACY.sql and V27_STUDENT_EMAIL_OTP.sql.
-- Requests are private and require manual domain verification before approval.
CREATE TABLE IF NOT EXISTS public.student_domain_requests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id text NOT NULL REFERENCES public.universities(id),
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, university_id, domain),
  CONSTRAINT valid_domain CHECK (domain ~ '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$')
);
ALTER TABLE public.student_domain_requests ENABLE ROW LEVEL SECURITY;
-- No client policies; only service role in Edge Function and dashboard admins can access.
-- After independently verifying the student email domain, admin may approve with:
-- INSERT INTO public.student_email_domains(domain,university_id,enabled)
-- VALUES ('verified.example.ac.th','actual_university_id',true)
-- ON CONFLICT (domain) DO UPDATE SET university_id=EXCLUDED.university_id, enabled=true;
