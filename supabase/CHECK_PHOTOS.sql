-- Read-only diagnosis: run in Supabase SQL Editor. No data is deleted.
select id, display_name, avatar_path, photo_paths from public.profiles order by created_at desc nulls last limit 30;
select id, name, public from storage.buckets where id = 'avatars';
select name, bucket_id from storage.objects where bucket_id='avatars' order by created_at desc limit 30;
