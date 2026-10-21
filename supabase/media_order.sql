-- Run once in Supabase SQL Editor before deploying the media-order UI.
alter table public.profiles add column if not exists media_order jsonb not null default '[]'::jsonb;
comment on column public.profiles.media_order is 'Ordered image storage paths and video profile_media UUIDs for mixed profile galleries';
