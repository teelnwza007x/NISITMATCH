-- v27: run AFTER V26_TRUST_PRIVACY.sql. Requires pgcrypto and Edge Function deployment.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE public.student_verifications ADD COLUMN IF NOT EXISTS verified_email text;
ALTER TABLE public.student_verifications ADD COLUMN IF NOT EXISTS university_id text;
CREATE TABLE IF NOT EXISTS public.student_email_otp_challenges (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 university_id text NOT NULL, email text NOT NULL, code_hash text NOT NULL,
 expires_at timestamptz NOT NULL, sent_at timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10)
);
ALTER TABLE public.student_email_otp_challenges ENABLE ROW LEVEL SECURITY;
-- Intentionally NO client policies: Edge Function service role only.
-- Verified student domains: validate each with institution before enabling.
-- Do not blindly allow *.ac.th or arbitrary .edu domains.
INSERT INTO public.student_email_domains(domain,university_id,enabled) VALUES
 ('student.chula.ac.th','chula',true),
 ('student.mahidol.ac.th','mu',true),
 ('student.mahidol.edu','mu',true),
 ('email.kmutnb.ac.th','kmutnb',true),
 ('mail.kmutt.ac.th','kmutt',true),
 ('mail.rmutt.ac.th','rmutt',true),
 ('bumail.net','bu',true),
 ('spumail.net','spu',true),
 ('spulive.net','spu',true)
ON CONFLICT(domain) DO NOTHING;
-- Remove the insecure v26 RPC from client access: it used the LOGIN email, not proof of a separate address.
REVOKE EXECUTE ON FUNCTION public.request_student_verification() FROM authenticated;
COMMIT;
