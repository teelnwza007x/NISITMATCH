-- NISIT MATCH v89: add image/voice attachments to Hangout group chat.
-- Additive only: keeps existing Hangout rooms, messages, profiles, and matches.

alter table public.hangout_messages
  add column if not exists attachment_type text,
  add column if not exists attachment_path text;

-- The app uploads Hangout media to chat-media/<event UUID>/<random filename>.
-- Only event members/creator can read the media; only members of an open event can upload.
drop policy if exists hangout_chat_media_read on storage.objects;
create policy hangout_chat_media_read on storage.objects
for select to authenticated using (
  bucket_id = 'chat-media'
  and exists (
    select 1 from public.hangout_events e
    where e.id::text = (storage.foldername(name))[1]
      and (e.creator_id = auth.uid() or exists (
        select 1 from public.hangout_rsvps r
        where r.event_id = e.id and r.user_id = auth.uid()
      ))
  )
);

drop policy if exists hangout_chat_media_insert on storage.objects;
create policy hangout_chat_media_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'chat-media'
  and exists (
    select 1 from public.hangout_events e
    where e.id::text = (storage.foldername(name))[1]
      and e.status = 'open'
      and e.starts_at > now()
      and (e.creator_id = auth.uid() or exists (
        select 1 from public.hangout_rsvps r
        where r.event_id = e.id and r.user_id = auth.uid()
      ))
  )
);

-- Verify the new columns exist.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'hangout_messages'
  and column_name in ('attachment_type', 'attachment_path')
order by column_name;
