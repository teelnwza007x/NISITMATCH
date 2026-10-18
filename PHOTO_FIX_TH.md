# รูปไม่ขึ้น / แชต

1. Run `supabase/CHECK_PHOTOS.sql` in Supabase SQL Editor. Check `avatar_path`, `photo_paths` and `storage.objects` match exactly. If paths are missing from storage, users must upload images again.
2. For this app's public-profile images, the `avatars` bucket must be **public**. In Supabase Dashboard > Storage > avatars > Settings, enable Public bucket only if these images are intended to be publicly viewable. Never expose private images this way.
3. Check browser Network tab for image errors: 404 = wrong path/missing object, 403 = access policy/bucket permissions. Check Console for `Profile error` and confirm profiles RLS permits matched users to read one another.
4. Run `npm install && npm run build` then redeploy. This release preserves the existing chat/messages/matches schema and fixes mixed light/dark chat styles.
5. If name shows `ไม่พบข้อมูลโปรไฟล์`, fix profiles SELECT RLS for matched users; photo UI cannot recover data that the backend refuses to return.
