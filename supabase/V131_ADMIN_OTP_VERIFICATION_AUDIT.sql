-- Admin-only evidence of successful university 6-digit OTP verification.
-- Run in Supabase SQL Editor BEFORE deploying the updated Edge Functions.
create table if not exists public.student_otp_verified_audit (
 user_id uuid primary key references auth.users(id) on delete cascade,
 university_id text not null,
 verified_email text not null,
 verified_at timestamptz not null default now()
);
create index if not exists student_otp_verified_audit_verified_at_idx on public.student_otp_verified_audit(verified_at desc);
alter table public.student_otp_verified_audit enable row level security;
revoke all on public.student_otp_verified_audit from anon, authenticated;
-- No RLS policies: only service-role Edge Functions can insert/read.
-- No backfill: prior verified statuses do not prove OTP was entered.
