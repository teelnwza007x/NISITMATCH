-- NISIT MATCH referral rewards. Run in Supabase SQL Editor after configuring verification adapter.
-- Inviter: 7 days; invited member: 3 days. One claim per invited account.
create table if not exists public.nm_referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{10,20}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.nm_referrals (
  invitee_id uuid primary key references auth.users(id) on delete cascade,
  inviter_id uuid not null references auth.users(id),
  code text not null,
  claimed_at timestamptz not null default now(),
  rewarded_at timestamptz,
  constraint no_self_referral check (invitee_id <> inviter_id)
);
create table if not exists public.nm_referral_rewards (
  invitee_id uuid not null references auth.users(id),
  recipient_id uuid not null references auth.users(id),
  days integer not null check (days in (3,7)),
  created_at timestamptz not null default now(),
  primary key (invitee_id,recipient_id)
);
alter table public.nm_referral_codes enable row level security;
alter table public.nm_referrals enable row level security;
alter table public.nm_referral_rewards enable row level security;
revoke all on public.nm_referral_codes, public.nm_referrals, public.nm_referral_rewards from anon,authenticated;
grant select on public.nm_referral_codes to authenticated;
create policy "read own code" on public.nm_referral_codes for select to authenticated using (user_id=auth.uid());
-- SECURITY: verification is deliberately fail-closed until adapted to the project's
-- authoritative campus-email verification table/function. Never trust client booleans.
create or replace function public.nm_referral_campus_verified(p_user_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  return false;
end $$;
revoke all on function public.nm_referral_campus_verified(uuid) from public,anon,authenticated;
create or replace function public.nm_get_referral_code()
returns text language plpgsql security definer set search_path='' as $$
declare v_code text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select code into v_code from public.nm_referral_codes where user_id=auth.uid();
 if v_code is null then
   v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
   insert into public.nm_referral_codes(user_id,code) values(auth.uid(),v_code)
   on conflict (user_id) do nothing;
   select code into v_code from public.nm_referral_codes where user_id=auth.uid();
 end if;
 return v_code;
end $$;
create or replace function public.nm_claim_referral(p_code text)
returns text language plpgsql security definer set search_path='' as $$
declare v_inviter uuid; v_code text:=upper(trim(coalesce(p_code,'')));
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select user_id into v_inviter from public.nm_referral_codes where code=v_code;
 if v_inviter is null then raise exception 'Invalid invitation code'; end if;
 if v_inviter=auth.uid() then raise exception 'Cannot invite yourself'; end if;
 insert into public.nm_referrals(invitee_id,inviter_id,code)
 values(auth.uid(),v_inviter,v_code)
 on conflict (invitee_id) do nothing;
 if not exists(select 1 from public.nm_referrals where invitee_id=auth.uid() and inviter_id=v_inviter) then
  raise exception 'Invitation already claimed';
 end if;
 return 'claimed';
end $$;
-- Do not activate a reward job until campus verification AND the existing premium
-- subscription schema are reviewed. Rewards are not issued by these RPCs.
revoke all on function public.nm_get_referral_code() from public,anon;
revoke all on function public.nm_claim_referral(text) from public,anon;
grant execute on function public.nm_get_referral_code() to authenticated;
grant execute on function public.nm_claim_referral(text) to authenticated;
