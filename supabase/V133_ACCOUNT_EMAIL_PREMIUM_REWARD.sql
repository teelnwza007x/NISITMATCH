-- NISIT MATCH: one-time 3-day Premium reward for verified account email.
-- Run after V132_ACCOUNT_EMAIL_OTP.sql and premium_subscriptions setup.
create table if not exists public.account_email_premium_rewards (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 claimed_at timestamptz not null default now()
);
alter table public.account_email_premium_rewards enable row level security;
revoke all on public.account_email_premium_rewards from public, anon, authenticated;
create policy "read own account email reward" on public.account_email_premium_rewards for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.account_email_premium_rewards to authenticated;

create or replace function public.claim_account_email_premium()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := (select auth.uid());
 mail text;
 expiry timestamptz;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text, 31415));
 select lower(email) into mail from auth.users where id=uid;
 if mail is null or not exists (
  select 1 from public.account_email_verifications
  where user_id=uid and lower(email)=mail
 ) then raise exception 'Please verify your account email first'; end if;
 if exists(select 1 from public.account_email_premium_rewards where user_id=uid) then
  return jsonb_build_object('claimed',false,'reason','already_claimed');
 end if;
 perform 1 from public.profiles where id=uid for update;
 if not found then raise exception 'Profile not found'; end if;
 insert into public.account_email_premium_rewards(user_id,email) values(uid,mail);
 insert into public.premium_subscriptions(user_id,plan,status,starts_at,ends_at,provider,provider_reference,updated_at)
 values(uid,'weekly','active',now(),now()+interval '3 days','account_email_otp','email-verified-3days',now())
 on conflict(user_id) do update set
  plan='weekly',status='active',
  starts_at=coalesce(public.premium_subscriptions.starts_at,now()),
  ends_at=greatest(coalesce(public.premium_subscriptions.ends_at,now()),now())+interval '3 days',
  provider='account_email_otp',provider_reference='email-verified-3days',updated_at=now()
 returning ends_at into expiry;
 return jsonb_build_object('claimed',true,'ends_at',expiry);
end;
$$;
revoke all on function public.claim_account_email_premium() from public,anon;
grant execute on function public.claim_account_email_premium() to authenticated;
