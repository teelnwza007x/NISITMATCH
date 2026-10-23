-- V147: notification completeness, atomic read receipts, and queue hot-path indexes.
-- Safe to run more than once. Does not delete notification or user data.

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists push_queue_pending_created_idx
  on public.push_queue (created_at)
  where processed_at is null and attempts < 3;
create index if not exists nm_announcement_push_pending_idx
  on public.nm_announcement_push_queue (attempts, announcement_id, user_id)
  where processed_at is null and attempts < 3;

-- Read receipts are written only through ownership-checking RPCs.
alter table public.nm_notification_reads enable row level security;
revoke all on table public.nm_notification_reads from public, anon, authenticated;

create or replace function public.nm_my_notifications(p_limit integer default 50)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with events as (
  select
    'push:' || q.id::text as notification_key,
    case q.type
      when 'match' then 'แมตช์ใหม่'
      when 'interest' then 'มีคนสนใจคุณ'
      when 'message' then 'ข้อความใหม่'
      when 'admin_report' then 'รายงานใหม่สำหรับแอดมิน'
      when 'admin_domain' then 'คำขอโดเมนมหาวิทยาลัย'
      else 'แจ้งเตือน'
    end as title,
    case q.type
      when 'match' then 'คุณได้รับการแมตช์แล้ว!'
      when 'interest' then 'มีคนกำลังสนใจคุณอยู่'
      when 'message' then 'มีข้อความใหม่ในแชทของคุณ'
      when 'admin_report' then 'มีรายงานสมาชิกใหม่รอตรวจสอบ'
      when 'admin_domain' then 'มีคำขอโดเมนมหาวิทยาลัยใหม่'
      else 'มีการแจ้งเตือนใหม่'
    end as body,
    case when q.type in ('admin_report','admin_domain') then '/admin' else '/messages' end as target,
    q.type,
    q.created_at
  from public.push_queue q
  where q.user_id = auth.uid()
    and q.type in ('match','interest','message','admin_report','admin_domain')
  union all
  select
    'announcement:' || a.id::text,
    a.title,
    a.body,
    '/announcements',
    'announcement',
    a.created_at
  from public.nm_announcements a
)
select coalesce(jsonb_agg(jsonb_build_object(
  'key', e.notification_key,
  'title', e.title,
  'body', e.body,
  'target', e.target,
  'type', e.type,
  'created_at', e.created_at,
  'read', r.read_at is not null
) order by e.created_at desc), '[]'::jsonb)
from (
  select * from events order by created_at desc
  limit least(greatest(coalesce(p_limit,50),1),100)
) e
left join public.nm_notification_reads r
  on r.user_id = auth.uid() and r.notification_key = e.notification_key
where auth.uid() is not null;
$$;

create or replace function public.nm_mark_notification_read(p_key text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_key is null or length(p_key) > 100 then return false; end if;
  if not (
    (p_key like 'push:%' and exists (
      select 1 from public.push_queue q
      where q.user_id = auth.uid() and 'push:' || q.id::text = p_key
    ))
    or
    (p_key like 'announcement:%' and exists (
      select 1 from public.nm_announcements a
      where 'announcement:' || a.id::text = p_key
    ))
  ) then return false; end if;
  insert into public.nm_notification_reads(user_id, notification_key)
  values (auth.uid(), p_key)
  on conflict (user_id, notification_key) do nothing;
  return true;
end;
$$;

-- Mark only the keys sent by the signed-in user's currently displayed inbox.
-- The server re-validates ownership for every key; no client-supplied user_id is trusted.
create or replace function public.nm_mark_all_notifications_read(p_keys text[])
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_key text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(cardinality(p_keys), 0) > 100 then raise exception 'Too many notification keys'; end if;
  foreach v_key in array coalesce(p_keys, array[]::text[]) loop
    perform public.nm_mark_notification_read(v_key);
  end loop;
  return true;
end;
$$;

revoke all on function public.nm_my_notifications(integer) from public, anon;
revoke all on function public.nm_mark_notification_read(text) from public, anon;
revoke all on function public.nm_mark_all_notifications_read(text[]) from public, anon;
grant execute on function public.nm_my_notifications(integer) to authenticated;
grant execute on function public.nm_mark_notification_read(text) to authenticated;
grant execute on function public.nm_mark_all_notifications_read(text[]) to authenticated;
