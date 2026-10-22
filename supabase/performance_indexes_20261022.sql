-- Applied to production Supabase on 2026-10-22.
-- Cover frequently joined foreign-key columns; idempotent for fresh environments.
create index if not exists idx_nm_hangout_messages_user_id on public.hangout_messages(user_id);
create index if not exists idx_nm_hangout_rsvps_user_id on public.hangout_rsvps(user_id);
create index if not exists idx_nm_push_subscriptions_user_id on public.push_subscriptions(user_id);
create index if not exists idx_nm_profile_views_viewer_id on public.profile_views(viewer_id);
create index if not exists idx_nm_super_likes_to_id on public.super_likes(to_id);
