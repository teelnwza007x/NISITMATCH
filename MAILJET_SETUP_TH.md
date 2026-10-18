# Mailjet OTP Setup (v27)

1. Confirm your sender address is Active in Mailjet.
2. In Supabase Edge Functions > Secrets, set MAILJET_API_KEY, MAILJET_SECRET_KEY, OTP_FROM_EMAIL (exact active sender email address only), and OTP_PEPPER (random secret, preserve existing value if already set).
3. Run supabase/V27_STUDENT_EMAIL_OTP.sql in Supabase SQL Editor if not already done.
4. Open CMD in project root (folder with package.json) and run: npx supabase functions deploy student-email-otp
5. Test a supported university email address. Check Edge Function logs if sending fails.

Do not place Mailjet credentials in frontend Vite variables or share them in chat.

Mailjet sender-address verification does not guarantee reliable delivery to all recipients. Gmail sender addresses may have DMARC-related delivery issues; production delivery may require an authenticated domain.
