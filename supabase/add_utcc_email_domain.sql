-- Run once in Supabase SQL Editor to enable OTP verification for UTCC.
-- The Edge Function checks student_email_domains on the server.
insert into public.student_email_domains (university_id, domain, enabled)
values ('utcc', 'live4utcc.ac.th', true)
on conflict (university_id, domain) do update set enabled = excluded.enabled;
