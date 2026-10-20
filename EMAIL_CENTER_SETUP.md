# NISIT MATCH Email Center — Gmail SMTP

This branch contains code only. It has NOT been deployed to Supabase or production.

## Included
- Replaces Mailjet API with Gmail SMTP in existing `student-email-otp` Edge Function, retaining university-domain check, 6-digit OTP, 60-second cooldown, 10-minute expiry and 5 attempts.
- Records accepted/failed SMTP attempts in `public.email_delivery_logs`.
- `admin-email-logs` Edge Function checks `profiles.is_admin` server-side.
- Admin Email Center integrated into existing `AdminDashboard`.

## Setup (required before merge / use)
1. Run `supabase/sql/email_center.sql` in Supabase SQL Editor.
2. Configure Edge Function Secrets: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (Google App Password). Keep `OTP_PEPPER` unchanged. Never commit secrets.
3. Deploy Edge Functions `student-email-otp` and `admin-email-logs` through Supabase CLI/dashboard. Keep JWT verification enabled.
4. Test a campus OTP end-to-end with an authorized university email; verify send logs and admin authorization.
5. Verify SMTP outbound connections are supported by your Supabase Edge runtime. If outbound SMTP is blocked, use an HTTPS mail-sending API instead.
6. Once stable, remove Mailjet secrets only if unused elsewhere.

## Limitations
- Supabase Auth Verify and Reset remain sent by Supabase Auth's configured Gmail SMTP and are NOT automatically logged in Email Center.
- `accepted` is SMTP acceptance, not inbox delivery or a read receipt.
- Existing OTP challenge read/upsert is not atomic; concurrent requests can race. For production abuse resistance consider database-enforced rate limiting.
- Personal Gmail sending limits apply.
- Admin lookup assumes `profiles.is_admin` is the project's authoritative admin flag.
- Test the deployed function in the Supabase Deno runtime before production release.
