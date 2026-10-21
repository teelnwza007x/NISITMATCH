-- NISIT MATCH · Referral feedback and reward status
-- Run after nm_referral_auto_rewards.sql
create or replace function public.nm_referral_status()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid := auth.uid(); v_claim public.nm_referrals%rowtype; v_days integer;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 select * into v_claim from public.nm_referrals where invitee_id=v_uid;
 select days into v_days from public.nm_referral_rewards
 where invitee_id=v_uid and recipient_id=v_uid;
 return jsonb_build_object(
  'claimed', v_claim.invitee_id is not null,
  'code', v_claim.code,
  'rewarded', v_days is not null,
  'days', coalesce(v_days,0)
 );
end;
$$;
revoke all on function public.nm_referral_status() from public,anon;
grant execute on function public.nm_referral_status() to authenticated;

create or replace function public.nm_claim_referral(p_code text)
returns text language plpgsql security definer set search_path=''
as $$
declare
 v_uid uuid := auth.uid();
 v_inviter uuid;
 v_code text := upper(trim(coalesce(p_code,'')));
 v_existing public.nm_referrals%rowtype;
 v_rewarded boolean;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 select * into v_existing from public.nm_referrals where invitee_id=v_uid;
 if v_existing.invitee_id is not null then
   if v_existing.code = v_code then
     if exists(select 1 from public.nm_referral_rewards where invitee_id=v_uid and recipient_id=v_uid)
       then return 'already_rewarded'; end if;
     return 'already_claimed';
   end if;
   return 'already_used_other';
 end if;
 select user_id into v_inviter from public.nm_referral_codes where code=v_code;
 if v_inviter is null then return 'invalid_code'; end if;
 if v_inviter=v_uid then return 'self_referral'; end if;
 insert into public.nm_referrals(invitee_id,inviter_id,code)
 values(v_uid,v_inviter,v_code) on conflict(invitee_id) do nothing;
 select * into v_existing from public.nm_referrals where invitee_id=v_uid;
 if v_existing.code is distinct from v_code then return 'already_used_other'; end if;
 v_rewarded := public.nm_referral_grant(v_uid);
 if v_rewarded then return 'rewarded'; end if;
 return 'pending_verification';
end;
$$;
revoke all on function public.nm_claim_referral(text) from public,anon;
grant execute on function public.nm_claim_referral(text) to authenticated;
