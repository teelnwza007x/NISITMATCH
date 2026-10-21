-- NISIT MATCH: automatic referral premium rewards
-- Run AFTER supabase/nm_referral_rewards.sql.
-- Inviter +7 days, invitee +3 days after verified university email.
-- Keeps plan='weekly' because premium_subscriptions_plan_check only permits weekly/monthly.
create or replace function public.nm_referral_campus_verified(p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
   select 1 from public.student_verifications sv
   where sv.user_id=p_user_id and sv.status='verified'
     and nullif(trim(sv.verified_email),'') is not null
     and nullif(trim(sv.university_id),'') is not null
 );
$$;
revoke all on function public.nm_referral_campus_verified(uuid) from public,anon,authenticated;

-- Internal grant routine. Runs in the same transaction as the referral reward ledger.
create or replace function public.nm_referral_grant(p_invitee uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
 v_inviter uuid;
 v_recipient uuid;
 v_days integer;
 v_now timestamptz := now();
 v_start timestamptz;
 v_end timestamptz;
 v_inserted integer;
begin
 -- Lock referral first to serialize competing trigger / claim requests.
 select inviter_id into v_inviter from public.nm_referrals
 where invitee_id=p_invitee for update;
 if v_inviter is null then return false; end if;
 if not public.nm_referral_campus_verified(p_invitee) then return false; end if;
 if not exists(select 1 from public.profiles where id=p_invitee)
    or not exists(select 1 from public.profiles where id=v_inviter) then return false; end if;
 -- Lock recipients in deterministic order to avoid deadlocks across referral chains.
 perform pg_advisory_xact_lock(hashtextextended(least(v_inviter::text,p_invitee::text),71631));
 perform pg_advisory_xact_lock(hashtextextended(greatest(v_inviter::text,p_invitee::text),71631));
 for v_recipient,v_days in
   select v_inviter,7 union all select p_invitee,3
 loop
   insert into public.nm_referral_rewards(invitee_id,recipient_id,days)
   values(p_invitee,v_recipient,v_days)
   on conflict (invitee_id,recipient_id) do nothing;
   get diagnostics v_inserted = row_count;
   if v_inserted=1 then
     select greatest(v_now,coalesce(ends_at,v_now)) into v_start
     from public.premium_subscriptions where user_id=v_recipient;
     v_start:=coalesce(v_start,v_now);
     v_end:=v_start+make_interval(days=>v_days);
     insert into public.premium_subscriptions
       (user_id,plan,status,starts_at,ends_at,provider,provider_reference,updated_at)
     values(v_recipient,'weekly','active',v_now,v_end,'referral',p_invitee::text,v_now)
     on conflict (user_id) do update set
       status='active',
       ends_at=greatest(v_now,coalesce(public.premium_subscriptions.ends_at,v_now))
               +make_interval(days=>v_days),
       updated_at=v_now;
   end if;
 end loop;
 update public.nm_referrals set rewarded_at=coalesce(rewarded_at,v_now)
 where invitee_id=p_invitee;
 return true;
end;
$$;
revoke all on function public.nm_referral_grant(uuid) from public,anon,authenticated;

-- Wrapper keeps existing referral claim RPC and triggers reward processing
-- when the invitee has already completed university verification.
create or replace function public.nm_claim_referral(p_code text)
returns text language plpgsql security definer set search_path=''
as $$
declare v_inviter uuid; v_code text:=upper(trim(coalesce(p_code,''))); v_existing uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select user_id into v_inviter from public.nm_referral_codes where code=v_code;
 if v_inviter is null then raise exception 'Invalid invitation code'; end if;
 if v_inviter=auth.uid() then raise exception 'Cannot invite yourself'; end if;
 insert into public.nm_referrals(invitee_id,inviter_id,code)
 values(auth.uid(),v_inviter,v_code) on conflict (invitee_id) do nothing;
 select inviter_id into v_existing from public.nm_referrals where invitee_id=auth.uid();
 if v_existing is distinct from v_inviter then raise exception 'Invitation already claimed'; end if;
 perform public.nm_referral_grant(auth.uid());
 return 'claimed';
end;
$$;
revoke all on function public.nm_claim_referral(text) from public,anon;
grant execute on function public.nm_claim_referral(text) to authenticated;

create or replace function public.nm_referral_on_verification()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if new.status='verified'
   and nullif(trim(new.verified_email),'') is not null
   and nullif(trim(new.university_id),'') is not null then
   perform public.nm_referral_grant(new.user_id);
 end if;
 return new;
end;
$$;
revoke all on function public.nm_referral_on_verification() from public,anon,authenticated;
drop trigger if exists nm_referral_verification_reward on public.student_verifications;
create trigger nm_referral_verification_reward
after insert or update of status,verified_email,university_id
on public.student_verifications
for each row execute function public.nm_referral_on_verification();

-- Process already verified invitees who claimed before this migration.
-- Run separately after reviewing rows; this migration does not retroactively award.
