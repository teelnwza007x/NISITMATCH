-- Run after V76_PREMIUM_HANGOUT_MEDIA.sql. Only service_role can execute fulfillment.
create table if not exists public.premium_payments (
  stripe_session_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('weekly','monthly')),
  amount_satang integer not null,
  created_at timestamptz not null default now()
);
alter table public.premium_payments enable row level security;
revoke all on public.premium_payments from anon, authenticated;
create or replace function public.apply_stripe_premium_payment(p_session_id text, p_user_id uuid, p_plan text, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
declare current_expiry timestamptz;
begin
  if p_session_id is null or length(p_session_id) < 8 or p_user_id is null or
    not ((p_plan = 'weekly' and p_amount = 3900) or (p_plan = 'monthly' and p_amount = 11900)) then
    raise exception 'Invalid payment';
  end if;
  -- Serialize payments for the same user; prevents lost subscription extensions.
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'User profile not found'; end if;
  insert into public.premium_payments(stripe_session_id,user_id,plan,amount_satang)
  values (p_session_id,p_user_id,p_plan,p_amount)
  on conflict (stripe_session_id) do nothing;
  if not found then return; end if;
  select ends_at into current_expiry from public.premium_subscriptions where user_id = p_user_id;
  insert into public.premium_subscriptions(user_id,plan,status,starts_at,ends_at,provider,provider_reference,updated_at)
  values(p_user_id,p_plan,'active',now(),greatest(coalesce(current_expiry,now()),now()) + case when p_plan='weekly' then interval '7 days' else interval '30 days' end,'stripe',p_session_id,now())
  on conflict(user_id) do update set
    plan=excluded.plan,status='active',
    starts_at=coalesce(public.premium_subscriptions.starts_at,now()),
    ends_at=excluded.ends_at,provider='stripe',provider_reference=p_session_id,updated_at=now();
end $$;
revoke all on function public.apply_stripe_premium_payment(text,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.apply_stripe_premium_payment(text,uuid,text,integer) to service_role;
