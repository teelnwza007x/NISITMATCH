-- NISIT MATCH v102: enforce university-email verification for Hangout at the database layer.
-- Run in Supabase SQL Editor after the existing V86/V87/V89/V91 migrations.
-- Additive policy/function changes only; does not delete existing data.

create or replace function public.is_verified_campus_student()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.student_verifications sv
    where sv.user_id = auth.uid()
      and sv.status = 'verified'
      and nullif(trim(sv.verified_email), '') is not null
      and nullif(trim(sv.university_id), '') is not null
  );
$$;
revoke all on function public.is_verified_campus_student() from public;
grant execute on function public.is_verified_campus_student() to authenticated;

-- Events: only verified students may discover, create, edit or remove Hangout events.
drop policy if exists hangout_events_read_auth on public.hangout_events;
create policy hangout_events_read_auth on public.hangout_events
for select to authenticated using (public.is_verified_campus_student());
drop policy if exists hangout_events_insert_own on public.hangout_events;
create policy hangout_events_insert_own on public.hangout_events
for insert to authenticated with check (public.is_verified_campus_student() and creator_id = auth.uid() and starts_at > now());
drop policy if exists hangout_events_update_own on public.hangout_events;
create policy hangout_events_update_own on public.hangout_events
for update to authenticated using (public.is_verified_campus_student() and creator_id = auth.uid())
with check (public.is_verified_campus_student() and creator_id = auth.uid());
drop policy if exists hangout_events_delete_own on public.hangout_events;
create policy hangout_events_delete_own on public.hangout_events
for delete to authenticated using (public.is_verified_campus_student() and creator_id = auth.uid());

-- RSVPs: verified accounts only; users can only join/leave as themselves.
drop policy if exists hangout_rsvps_read_auth on public.hangout_rsvps;
create policy hangout_rsvps_read_auth on public.hangout_rsvps
for select to authenticated using (
  public.is_verified_campus_student() and exists (select 1 from public.hangout_events e where e.id = event_id)
);
drop policy if exists hangout_rsvps_insert_own on public.hangout_rsvps;
create policy hangout_rsvps_insert_own on public.hangout_rsvps
for insert to authenticated with check (
  public.is_verified_campus_student() and user_id = auth.uid() and exists (
    select 1 from public.hangout_events e where e.id = event_id and e.status = 'open' and e.starts_at > now()
  )
);
drop policy if exists hangout_rsvps_delete_own on public.hangout_rsvps;
create policy hangout_rsvps_delete_own on public.hangout_rsvps
for delete to authenticated using (public.is_verified_campus_student() and user_id = auth.uid());

-- Messages: verified event members/creators only.
drop policy if exists hangout_messages_read_members on public.hangout_messages;
create policy hangout_messages_read_members on public.hangout_messages
for select to authenticated using (
  public.is_verified_campus_student() and exists (
    select 1 from public.hangout_events e where e.id = event_id and (
      e.creator_id = auth.uid() or exists (select 1 from public.hangout_rsvps r where r.event_id = e.id and r.user_id = auth.uid())
    )
  )
);
drop policy if exists hangout_messages_insert_members on public.hangout_messages;
create policy hangout_messages_insert_members on public.hangout_messages
for insert to authenticated with check (
  public.is_verified_campus_student() and user_id = auth.uid() and exists (
    select 1 from public.hangout_events e where e.id = event_id and e.status = 'open' and e.starts_at > now() and (
      e.creator_id = auth.uid() or exists (select 1 from public.hangout_rsvps r where r.event_id = e.id and r.user_id = auth.uid())
    )
  )
);

-- Read receipts: same verified membership boundary.
drop policy if exists hangout_message_reads_select_members on public.hangout_message_reads;
create policy hangout_message_reads_select_members on public.hangout_message_reads
for select to authenticated using (
  public.is_verified_campus_student() and exists (
    select 1 from public.hangout_events e where e.id = event_id and (
      e.creator_id = auth.uid() or exists (select 1 from public.hangout_rsvps r where r.event_id = e.id and r.user_id = auth.uid())
    )
  )
);
drop policy if exists hangout_message_reads_insert_self on public.hangout_message_reads;
create policy hangout_message_reads_insert_self on public.hangout_message_reads
for insert to authenticated with check (
  public.is_verified_campus_student() and user_id = auth.uid() and exists (
    select 1 from public.hangout_events e where e.id = event_id and (
      e.creator_id = auth.uid() or exists (select 1 from public.hangout_rsvps r where r.event_id = e.id and r.user_id = auth.uid())
    ) and exists (select 1 from public.hangout_messages m where m.id = message_id and m.event_id = public.hangout_message_reads.event_id)
  )
);

-- Keep Hangout attachments restricted to verified event members without touching other chat-media folders.
drop policy if exists hangout_chat_media_read on storage.objects;
create policy hangout_chat_media_read on storage.objects
for select to authenticated using (
  bucket_id = 'chat-media' and public.is_verified_campus_student() and exists (
    select 1 from public.hangout_events e where e.id::text = (storage.foldername(name))[1] and (
      e.creator_id = auth.uid() or exists (select 1 from public.hangout_rsvps r where r.event_id = e.id and r.user_id = auth.uid())
    )
  )
);
drop policy if exists hangout_chat_media_insert on storage.objects;
create policy hangout_chat_media_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'chat-media' and public.is_verified_campus_student() and exists (
    select 1 from public.hangout_events e where e.id::text = (storage.foldername(name))[1]
      and e.status = 'open' and e.starts_at > now() and (
        e.creator_id = auth.uid() or exists (select 1 from public.hangout_rsvps r where r.event_id = e.id and r.user_id = auth.uid())
      )
  )
);

select public.is_verified_campus_student() as current_account_is_verified;


-- Refresh the existing group notification on every new message so it becomes unread again.
-- Updating first avoids depending on a specific unique-constraint name on notifications.
create or replace function public.notify_hangout_message_members()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_creator uuid;
  v_recipient uuid;
begin
  select e.creator_id into v_creator from public.hangout_events e where e.id = new.event_id;
  for v_recipient in
    select distinct recipient_id from (
      select v_creator as recipient_id
      union
      select r.user_id as recipient_id from public.hangout_rsvps r where r.event_id = new.event_id
    ) recipients
    where recipient_id is not null and recipient_id <> new.user_id
  loop
    update public.notifications
       set read = false, created_at = now()
     where user_id = v_recipient and type = 'hangout_message' and ref_id = new.event_id;
    if not found then
      insert into public.notifications(user_id, type, ref_id, read)
      values (v_recipient, 'hangout_message', new.event_id, false)
      on conflict do nothing;
    end if;
  end loop;
  return new;
end;
$$;
