-- Run once in Supabase SQL Editor before using Admin announcements.
create table if not exists public.nm_announcements (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 120),
 body text not null check (char_length(body) between 1 and 1000),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.nm_announcement_push_queue (
 announcement_id uuid not null references public.nm_announcements(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 processed_at timestamptz,
 attempts integer not null default 0,
 primary key (announcement_id,user_id)
);
create index if not exists nm_announcement_pending_idx on public.nm_announcement_push_queue (announcement_id) where processed_at is null and attempts < 3;
alter table public.nm_announcements enable row level security;
alter table public.nm_announcement_push_queue enable row level security;
revoke all on public.nm_announcement_push_queue from anon, authenticated;
grant select on public.nm_announcements to authenticated;
drop policy if exists nm_announcements_read on public.nm_announcements;
create policy nm_announcements_read on public.nm_announcements for select to authenticated using (true);
create or replace function public.nm_admin_publish_announcement(p_title text,p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
 if auth.uid() is null or not exists (select 1 from public.profiles where id=auth.uid() and is_admin=true) then
  raise exception 'Admin only';
 end if;
 if length(trim(coalesce(p_title,''))) not between 1 and 120 or length(trim(coalesce(p_body,''))) not between 1 and 1000 then
  raise exception 'Invalid announcement length';
 end if;
 insert into public.nm_announcements(title,body,created_by) values(trim(p_title),trim(p_body),auth.uid()) returning id into v_id;
 insert into public.nm_announcement_push_queue(announcement_id,user_id)
 select v_id, s.user_id from public.push_subscriptions s group by s.user_id
 on conflict do nothing;
 return v_id;
end $$;
revoke all on function public.nm_admin_publish_announcement(text,text) from public,anon;
grant execute on function public.nm_admin_publish_announcement(text,text) to authenticated;
