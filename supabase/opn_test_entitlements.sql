-- Isolated test entitlements: never modifies production premium_subscriptions.
create table if not exists public.opn_test_entitlements (
  charge_id text primary key references public.opn_promptpay_payments(charge_id),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('weekly','monthly')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.opn_test_entitlements enable row level security;
revoke all on public.opn_test_entitlements from anon, authenticated;
create index if not exists opn_test_entitlements_user_idx on public.opn_test_entitlements(user_id,ends_at desc);
create or replace function public.fulfill_opn_test_payment(p_charge_id text)
returns table(expires_at timestamptz, newly_granted boolean)
language plpgsql security definer set search_path = ''
as $$
declare p record; expiry timestamptz; inserted boolean;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Forbidden'; end if;
  select charge_id,user_id,plan,amount,status,is_test into p
  from public.opn_promptpay_payments where charge_id=p_charge_id for update;
  if not found or p.is_test is distinct from true or p.status <> 'successful'
    or not ((p.plan='weekly' and p.amount=3900) or (p.plan='monthly' and p.amount=11900))
  then raise exception 'Not eligible'; end if;
  insert into public.opn_test_entitlements(charge_id,user_id,plan,ends_at)
  values(p.charge_id,p.user_id,p.plan,now()+case when p.plan='weekly' then interval '7 days' else interval '30 days' end)
  on conflict(charge_id) do nothing returning ends_at into expiry;
  inserted := found;
  if not inserted then select e.ends_at into expiry from public.opn_test_entitlements e where e.charge_id=p_charge_id; end if;
  return query select expiry, inserted;
end;
$$;
revoke all on function public.fulfill_opn_test_payment(text) from public,anon,authenticated;
grant execute on function public.fulfill_opn_test_payment(text) to service_role;
