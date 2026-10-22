-- Add covering indexes for high-traffic discovery, chat, notification, and ownership lookups.
-- These are additive and do not change rows, RLS policies, or function permissions.
create index if not exists idx_likes_to_id on public.likes (to_id);
create index if not exists idx_matches_user_b on public.matches (user_b);
create index if not exists idx_messages_match_created_at on public.messages (match_id, created_at desc);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_profiles_university_id on public.profiles (university_id);
create index if not exists idx_push_queue_user_id on public.push_queue (user_id);
create index if not exists idx_notifications_user_created_at on public.notifications (user_id, created_at desc);
create index if not exists idx_blocks_blocked on public.blocks (blocked);
create index if not exists idx_email_delivery_logs_user_id on public.email_delivery_logs (user_id);
