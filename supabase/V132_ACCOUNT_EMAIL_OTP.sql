-- Account email verification is independent of Supabase Auth email_confirmed_at.
create table if not exists public.account_email_verifications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 verified_at timestamptz not null default now()
);
create table if not exists public.account_email_otp_challenges (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 code_hash text not null,
 expires_at timestamptz not null,
 sent_at timestamptz not null default now(),
 attempts integer not null default 0
);
create index if not exists account_email_verifications_email_idx on public.account_email_verifications (lower(email));
alter table public.account_email_verifications enable row level security;
alter table public.account_email_otp_challenges enable row level security;
revoke all on public.account_email_verifications from anon, authenticated;
revoke all on public.account_email_otp_challenges from anon, authenticated;
create policy "account email status own read" on public.account_email_verifications
 for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.account_email_verifications to authenticated;
-- Writes are exclusively via the Edge Function using service role.
