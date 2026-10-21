-- Run once in Supabase SQL Editor before deploying opn-promptpay.
create table if not exists public.opn_promptpay_payments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 charge_id text not null unique,
 plan text not null check (plan in ('weekly','monthly')),
 amount integer not null check ((plan='weekly' and amount=3900) or (plan='monthly' and amount=11900)),
 currency text not null default 'THB' check (currency='THB'),
 status text not null default 'pending' check (status in ('pending','successful','failed','expired')),
 is_test boolean not null default true check (is_test = true),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.opn_promptpay_payments enable row level security;
revoke all on public.opn_promptpay_payments from anon, authenticated;
create index if not exists opn_promptpay_user_idx on public.opn_promptpay_payments(user_id,created_at desc);
-- Test payments NEVER grant Premium. Production fulfillment needs a separate audited implementation.
