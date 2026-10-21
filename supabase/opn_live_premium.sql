-- NISIT MATCH / Opn LIVE Premium fulfillment
-- Run only after reviewing current premium subscription policies and provider approval.
-- This migration does NOT enable live payment creation or webhook endpoints.
create table if not exists public.opn_live_payments (
  charge_id text primary key check (charge_id ~ '^chrg_[A-Za-z0-9]+$' and charge_id !~ '^chrg_test_'),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('weekly','monthly')),
  amount_satang integer not null check ((plan='weekly' and amount_satang=3900) or (plan='monthly' and amount_satang=11900)),
  currency text not null default 'THB' check (currency='THB'),
  status text not null default 'pending' check (status in ('pending','successful','failed','expired')),
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.opn_live_payments enable row level security;
revoke all on public.opn_live_payments from anon, authenticated;
create index if not exists opn_live_payments_user_idx on public.opn_live_payments(user_id,created_at desc);

-- Call ONLY from trusted server code with service_role after independently
-- retrieving the charge from Opn's API and validating paid, livemode, amount,
-- currency, PromptPay source and ownership against the stored payment row.
create or replace function public.fulfill_opn_live_payment(p_charge_id text)
returns table(expires_at timestamptz, newly_granted boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  p public.opn_live_payments%rowtype;
  current_end timestamptz;
  next_start timestamptz;
  next_end timestamptz;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Forbidden'; end if;
  select * into p from public.opn_live_payments
    where charge_id=p_charge_id for update;
  if not found or p.status <> 'successful' or p.fulfilled_at is not null
    or not ((p.plan='weekly' and p.amount_satang=3900) or
            (p.plan='monthly' and p.amount_satang=11900))
  then
    if found and p.fulfilled_at is not null then
      select s.ends_at into next_end from public.premium_subscriptions s where s.user_id=p.user_id;
      return query select next_end,false;
      return;
    end if;
    raise exception 'Payment not eligible';
  end if;

  -- Serialize grants for the same user, including different charge IDs.
  perform 1 from public.profiles where id=p.user_id for update;
  if not found then raise exception 'Profile missing'; end if;

  select s.ends_at into current_end from public.premium_subscriptions s
    where s.user_id=p.user_id for update;
  next_start := greatest(now(),coalesce(current_end,now()));
  next_end := next_start + case when p.plan='weekly' then interval '7 days' else interval '30 days' end;

  insert into public.premium_subscriptions
    (user_id,plan,status,starts_at,ends_at,provider,provider_reference,updated_at)
  values (p.user_id,p.plan,'active',now(),next_end,'opn',p.charge_id,now())
  on conflict(user_id) do update set
    plan=excluded.plan,status='active',
    starts_at=case when public.premium_subscriptions.status='active'
      and public.premium_subscriptions.ends_at>now()
      then public.premium_subscriptions.starts_at else excluded.starts_at end,
    ends_at=excluded.ends_at,provider='opn',
    provider_reference=excluded.provider_reference,updated_at=now();

  update public.opn_live_payments
  set fulfilled_at=now(),updated_at=now()
  where charge_id=p.charge_id and fulfilled_at is null;
  return query select next_end,true;
end;
$$;
revoke all on function public.fulfill_opn_live_payment(text) from public,anon,authenticated;
grant execute on function public.fulfill_opn_live_payment(text) to service_role;
