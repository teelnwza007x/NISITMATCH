-- Run once in Supabase SQL Editor. Existing messages remain unchanged.
alter table public.messages add column if not exists attachment_type text;
alter table public.messages add column if not exists attachment_path text;
alter table public.messages drop constraint if exists messages_attachment_type_check;
alter table public.messages add constraint messages_attachment_type_check check (attachment_type is null or attachment_type in ('image','audio'));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('chat-media','chat-media',false,10485760,array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/x-m4a'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
-- Private media: only members of the room can upload/read.
drop policy if exists "chat_media_member_read_v4" on storage.objects;
create policy "chat_media_member_read_v4" on storage.objects for select to authenticated
using (bucket_id='chat-media' and public.is_member((split_part(name,'/',1))::uuid));
drop policy if exists "chat_media_member_insert_v4" on storage.objects;
create policy "chat_media_member_insert_v4" on storage.objects for insert to authenticated
with check (bucket_id='chat-media' and public.is_member((split_part(name,'/',1))::uuid));
