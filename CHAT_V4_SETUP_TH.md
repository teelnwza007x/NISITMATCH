# Nisit Match — Chat v4

1. Run `supabase/CHAT_MEDIA_V4.sql` in Supabase SQL Editor (once). This creates a **private** `chat-media` bucket, adds message attachment columns, and limits Storage access to members of each match.
2. Deploy this project with your existing Supabase environment variables.
3. Test with two accounts: names/photos persist, older messages load using the ↑ button, image upload and voice recording play on both sides.
4. Voice recording requires HTTPS or localhost and microphone permission. Audio support varies by browser; WebM/MP4 are preferred.
5. Files are limited to 10 MB. Signed media URLs expire after 1 hour; reopen the chat to renew.
6. If a profile is still missing after a fresh login, inspect profiles SELECT RLS and matches RLS. This code preserves previously loaded profile data but cannot bypass database permissions.
7. SQL is an additive migration; it does not delete existing messages or matches.
