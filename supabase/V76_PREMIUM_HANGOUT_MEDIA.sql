-- NISIT MATCH v76: profile video media, Premium gating, profile views and Hangout
-- Run once in Supabase SQL Editor. This migration does NOT process payments.

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists profile_media_profile_created_idx on public.profile_media(profile_id, created_at);
alter table public.profile_media enable row level security;
drop policy if exists profile_media_read_auth on public.profile_media;
create policy profile_media_read_auth on public.profile_media for select to authenticated using (true);
drop policy if exists profile_media_insert_own on public.profile_media;
create policy profile_media_insert_own on public.profile_media for insert to authenticated with check (profile_id = auth.uid());
drop policy if exists profile_media_delete_own on public.profile_media;
create policy profile_media_delete_own on public.profile_media for delete to authenticated using (profile_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media','profile-media',true,26214400,array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 26214400;
drop policy if exists profile_media_storage_read on storage.objects;
create policy profile_media_storage_read on storage.objects for select using (bucket_id = 'profile-media');
drop policy if exists profile_media_storage_insert on storage.objects;
create policy profile_media_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists profile_media_storage_delete on storage.objects;
create policy profile_media_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists public.premium_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('weekly','monthly')),
  status text not null default 'inactive' check (status in ('inactive','pending','active','expired','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  provider text,
  provider_reference text,
  updated_at timestamptz not null default now()
);
alter table public.premium_subscriptions enable row level security;
drop policy if exists premium_subscription_read_own on public.premium_subscriptions;
create policy premium_subscription_read_own on public.premium_subscriptions for select to authenticated using (user_id = auth.uid());
-- Writes are intentionally not allowed from the browser. A verified payment webhook/admin must update subscriptions.

create table if not exists public.premium_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('weekly','monthly')),
  status text not null default 'pending' check (status in ('pending','contacted','completed','cancelled')),
  created_at timestamptz not null default now()
);
alter table public.premium_requests enable row level security;
drop policy if exists premium_request_insert_own on public.premium_requests;
create policy premium_request_insert_own on public.premium_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists premium_request_read_own on public.premium_requests;
create policy premium_request_read_own on public.premium_requests for select to authenticated using (user_id = auth.uid());

create or replace function public.is_premium_active(p_user uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.premium_subscriptions s where s.user_id = p_user and s.status = 'active' and s.ends_at > now())
$$;

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  check (viewer_id <> profile_id)
);
create index if not exists profile_views_profile_time_idx on public.profile_views(profile_id, viewed_at desc);
alter table public.profile_views enable row level security;
-- No direct table access. Functions below enforce who can track/read visitors.
create or replace function public.track_profile_view(p_profile_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_profile_id is null or p_profile_id = auth.uid() then return false; end if;
  if not exists(select 1 from public.profiles where id = p_profile_id) then return false; end if;
  if exists(select 1 from public.blocks where (blocker = auth.uid() and blocked = p_profile_id) or (blocker = p_profile_id and blocked = auth.uid())) then return false; end if;
  if not exists(select 1 from public.profile_views where viewer_id = auth.uid() and profile_id = p_profile_id and viewed_at > now() - interval '24 hours') then
    insert into public.profile_views(viewer_id, profile_id) values (auth.uid(), p_profile_id);
  end if;
  return true;
end $$;

create or replace function public.get_received_likes()
returns table(id uuid, display_name text, age int, university_id text, faculty text, avatar_path text, photo_paths text[], liked_at timestamptz)
language plpgsql security definer stable set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.is_premium_active(auth.uid()) then raise exception 'Premium subscription required'; end if;
  return query
    select p.id, p.display_name, date_part('year', age(p.birth_date))::int, p.university_id, p.faculty, p.avatar_path, p.photo_paths, l.created_at
    from public.likes l join public.profiles p on p.id = l.from_id
    where l.to_id = auth.uid() and l.is_like = true
      and not exists(select 1 from public.blocks b where (b.blocker = auth.uid() and b.blocked = p.id) or (b.blocker = p.id and b.blocked = auth.uid()))
    order by l.created_at desc limit 100;
end $$;

create or replace function public.get_profile_visitors()
returns table(id uuid, display_name text, age int, university_id text, faculty text, avatar_path text, photo_paths text[], viewed_at timestamptz)
language plpgsql security definer stable set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.is_premium_active(auth.uid()) then raise exception 'Premium subscription required'; end if;
  return query
    select distinct on (p.id) p.id, p.display_name, date_part('year', age(p.birth_date))::int, p.university_id, p.faculty, p.avatar_path, p.photo_paths, v.viewed_at
    from public.profile_views v join public.profiles p on p.id = v.viewer_id
    where v.profile_id = auth.uid()
      and not exists(select 1 from public.blocks b where (b.blocker = auth.uid() and b.blocked = p.id) or (b.blocker = p.id and b.blocked = auth.uid()))
    order by p.id, v.viewed_at desc;
end $$;
revoke all on function public.track_profile_view(uuid) from public;
grant execute on function public.track_profile_view(uuid) to authenticated;
revoke all on function public.get_received_likes() from public;
grant execute on function public.get_received_likes() to authenticated;
revoke all on function public.get_profile_visitors() from public;
grant execute on function public.get_profile_visitors() to authenticated;
revoke all on function public.is_premium_active(uuid) from public;
grant execute on function public.is_premium_active(uuid) to authenticated;

create table if not exists public.hangout_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 70),
  venue text not null check (char_length(venue) between 2 and 100),
  city text not null default 'ไม่ระบุ',
  starts_at timestamptz not null,
  capacity int not null default 6 check (capacity between 2 and 20),
  description text not null default '' check (char_length(description) <= 500),
  status text not null default 'open' check (status in ('open','cancelled','closed')),
  created_at timestamptz not null default now()
);
create index if not exists hangout_events_start_idx on public.hangout_events(status, starts_at);
alter table public.hangout_events enable row level security;
drop policy if exists hangout_events_read_auth on public.hangout_events;
create policy hangout_events_read_auth on public.hangout_events for select to authenticated using (true);
drop policy if exists hangout_events_insert_own on public.hangout_events;
create policy hangout_events_insert_own on public.hangout_events for insert to authenticated with check (creator_id = auth.uid() and starts_at > now());
drop policy if exists hangout_events_update_own on public.hangout_events;
create policy hangout_events_update_own on public.hangout_events for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
drop policy if exists hangout_events_delete_own on public.hangout_events;
create policy hangout_events_delete_own on public.hangout_events for delete to authenticated using (creator_id = auth.uid());

create table if not exists public.hangout_rsvps (
  event_id uuid not null references public.hangout_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(event_id,user_id)
);
alter table public.hangout_rsvps enable row level security;
drop policy if exists hangout_rsvps_read_auth on public.hangout_rsvps;
create policy hangout_rsvps_read_auth on public.hangout_rsvps for select to authenticated using (true);
drop policy if exists hangout_rsvps_insert_own on public.hangout_rsvps;
create policy hangout_rsvps_insert_own on public.hangout_rsvps for insert to authenticated with check (user_id = auth.uid() and exists(select 1 from public.hangout_events e where e.id = event_id and e.status='open' and e.starts_at > now()));
drop policy if exists hangout_rsvps_delete_own on public.hangout_rsvps;
create policy hangout_rsvps_delete_own on public.hangout_rsvps for delete to authenticated using (user_id = auth.uid());

-- IMPORTANT: A verified payment webhook/admin must create/update premium_subscriptions.
-- Do not mark subscriptions active from client-side code or accept a client-supplied payment success flag.

-- Explicit grants for Supabase API roles (RLS still applies).
grant select, insert, delete on public.profile_media to authenticated;
grant select on public.premium_subscriptions to authenticated;
grant select, insert on public.premium_requests to authenticated;
grant select, insert, update, delete on public.hangout_events to authenticated;
grant select, insert, delete on public.hangout_rsvps to authenticated;

-- Prevent RSVPs beyond the event capacity, even if many people submit at once.
create or replace function public.enforce_hangout_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare max_people int; current_people int;
begin
  select capacity into max_people from public.hangout_events where id = new.event_id and status = 'open' and starts_at > now() for update;
  if max_people is null then raise exception 'Hangout is not open'; end if;
  select count(*) into current_people from public.hangout_rsvps where event_id = new.event_id;
  if current_people >= max_people then raise exception 'Hangout is full'; end if;
  return new;
end $$;
drop trigger if exists hangout_capacity_before_insert on public.hangout_rsvps;
create trigger hangout_capacity_before_insert before insert on public.hangout_rsvps for each row execute function public.enforce_hangout_capacity();
