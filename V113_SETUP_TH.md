NISIT MATCH V113 — Email recovery and templates

1. Deploy ZIP contents (nisit-match folder as project root) to Vercel.
2. Supabase > Authentication > URL Configuration: Site URL https://nisitmatch.vercel.app and redirect https://nisitmatch.vercel.app/auth/callback .
3. IMPORTANT: Copy email-templates/reset-password.html into Supabase > Authentication > Email Templates > Reset Password. Copy confirm-signup.html into Confirm signup. Save both. Old templates will NOT use the new token_hash links.
4. New links use {{ .SiteURL }}/auth/callback?flow=recovery&token_hash={{ .TokenHash }} and explicit verifyOtp. Do not change these variables.
5. Request fresh emails after deploy. Test with a disposable test account.
6. Build and live Supabase SMTP tests may be unavailable; validate on Vercel and real mailbox.

หมายเหตุ: ไฟล์ HTML ต้องนำไปวางใน Supabase Dashboard เอง การ Deploy ZIP ไม่เปลี่ยนอีเมลเทมเพลตอัตโนมัติ
