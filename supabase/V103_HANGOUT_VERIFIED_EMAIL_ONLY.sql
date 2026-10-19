-- NISIT MATCH v103: Hangout is available only to accounts with a verified university email.
-- Run this SQL in Supabase SQL Editor AFTER V27_STUDENT_EMAIL_OTP.sql and the existing V76/V81/V89 Hangout migrations.
-- The client UI gate is for usability; these RLS policies enforce the rule at the database/API layer.

create or replace function public.current_user_has_verified_campus_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_verifications sv
    where sv.user_id = auth.uid()
      and sv.status = 'verified'
      and nullif(trim(sv.verified_email), '') is not null
      and nullif(trim(sv.university_id), '') is not null
  );
$$;
revoke all on function public.current_user_has_verified_campus_email() from public;
grant execute on function public.current_user_has_verified_campus_email() to authenticated;

-- Events: only verified campus-email accounts may list, create, or manage Hangouts.
drop policy if exists hangout_events_read_auth on public.hangout_events;
drop policy if exists hangout_events_insert_own on public.hangout_events;
drop policy if exists hangout_events_update_own on public.hangout_events;
drop policy if exists hangout_events_delete_own on public.hangout_events;
create policy hangout_events_read_verified on public.hangout_events
  for select to authenticated using (public.current_user_has_verified_campus_email());
create policy hangout_events_insert_verified_own on public.hangout_events
  for insert to authenticated with check (
    public.current_user_has_verified_campus_email()
    and creator_id = auth.uid() and starts_at > now()
  );
create policy hangout_events_update_verified_own on public.hangout_events
  for update to authenticated using (
    public.current_user_has_verified_campus_email() and creator_id = auth.uid()
  ) with check (
    public.current_user_has_verified_campus_email() and creator_id = auth.uid()
  );
create policy hangout_events_delete_verified_own on public.hangout_events
  for delete to authenticated using (
    public.current_user_has_verified_campus_email() and creator_id = auth.uid()
  );

-- RSVPs: only verified users can inspect attendance, join, or leave.
drop policy if exists hangout_rsvps_read_auth on public.hangout_rsvps;
drop policy if exists hangout_rsvps_insert_own on public.hangout_rsvps;
drop policy if exists hangout_rsvps_delete_own on public.hangout_rsvps;
create policy hangout_rsvps_read_verified on public.hangout_rsvps
  for select to authenticated using (public.current_user_has_verified_campus_email());
create policy hangout_rsvps_insert_verified_own on public.hangout_rsvps
  for insert to authenticated with check (
    public.current_user_has_verified_campus_email()
    and user_id = auth.uid()
    and exists (
      select 1 from public.hangout_events e
      where e.id = event_id and e.status = 'open' and e.starts_at > now()
    )
  );
create policy hangout_rsvps_delete_verified_own on public.hangout_rsvps
  for delete to authenticated using (
    public.current_user_has_verified_campus_email() and user_id = auth.uid()
  );

-- Group chat: verified accounts must also be a room creator/member to read or send.
drop policy if exists hangout_messages_read_members on public.hangout_messages;
drop policy if exists hangout_messages_insert_members on public.hangout_messages;
create policy hangout_messages_read_verified_members on public.hangout_messages
  for select to authenticated using (
    public.current_user_has_verified_campus_email()
    and exists (
      select 1 from public.hangout_events e
      where e.id = event_id and (
        e.creator_id = auth.uid() or exists (
          select 1 from public.hangout_rsvps r
          where r.event_id = e.id and r.user_id = auth.uid()
        )
      )
    )
  );
create policy hangout_messages_insert_verified_members on public.hangout_messages
  for insert to authenticated with check (
    public.current_user_has_verified_campus_email()
    and user_id = auth.uid()
    and exists (
      select 1 from public.hangout_events e
      where e.id = event_id and e.status = 'open' and e.starts_at > now() and (
        e.creator_id = auth.uid() or exists (
          select 1 from public.hangout_rsvps r
          where r.event_id = e.id and r.user_id = auth.uid()
        )
      )
    )
  );

-- Hangout chat media bucket: retain member-only access, additionally require verified campus email.
drop policy if exists hangout_chat_media_read on storage.objects;
drop policy if exists hangout_chat_media_insert on storage.objects;
create policy hangout_chat_media_read on storage.objects
for select to authenticated using (
  bucket_id = 'chat-media'
  and public.current_user_has_verified_campus_email()
  and exists (
    select 1 from public.hangout_events e
    where e.id::text = (storage.foldername(name))[1]
      and (e.creator_id = auth.uid() or exists (
        select 1 from public.hangout_rsvps r
        where r.event_id = e.id and r.user_id = auth.uid()
      ))
  )
);
create policy hangout_chat_media_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'chat-media'
  and public.current_user_has_verified_campus_email()
  and exists (
    select 1 from public.hangout_events e
    where e.id::text = (storage.foldername(name))[1]
      and e.status = 'open' and e.starts_at > now()
      and (e.creator_id = auth.uid() or exists (
        select 1 from public.hangout_rsvps r
        where r.event_id = e.id and r.user_id = auth.uid()
      ))
  )
);

select 'Hangout requires verified university email' as migration_result;
