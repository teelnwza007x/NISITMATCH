create table if not exists public.email_delivery_logs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 recipient_email text not null,
 email_type text not null check(email_type in ('university_otp','signup_verify','password_reset')),
 provider text not null,
 status text not null check(status in ('attempted','accepted','failed','delivered','bounced')),
 provider_message_id text,
 error_message text,
 created_at timestamptz not null default now()
);
create index if not exists email_delivery_logs_created_idx on public.email_delivery_logs(created_at desc);
create index if not exists email_delivery_logs_recipient_idx on public.email_delivery_logs(recipient_email);
alter table public.email_delivery_logs enable row level security;
revoke all on public.email_delivery_logs from anon, authenticated;
-- Service role only. Do not expose recipient addresses through client-side queries.
