-- NISIT MATCH Notification Center: private inbox + per-user read receipts.
create table if not exists public.nm_notification_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 notification_key text not null check (length(notification_key) between 1 and 100),
 read_at timestamptz not null default now(),
 primary key (user_id,notification_key)
);
alter table public.nm_notification_reads enable row level security;
revoke all on public.nm_notification_reads from anon,authenticated;
create or replace function public.nm_my_notifications(p_limit integer default 50)
returns jsonb language sql stable security definer set search_path = ''
as $$
with events as (
 select 'push:'||q.id::text as notification_key,
  case q.type when 'match' then 'แมตช์ใหม่' when 'interest' then 'มีคนสนใจคุณ'
    when 'admin_report' then 'รายงานใหม่สำหรับแอดมิน'
    when 'admin_domain' then 'คำขอโดเมนมหาวิทยาลัย'
    else 'แจ้งเตือน' end as title,
  case q.type when 'match' then 'คุณได้รับการแมตช์แล้ว!'
    when 'interest' then 'มีคนกำลังสนใจคุณอยู่'
    when 'admin_report' then 'มีรายงานสมาชิกใหม่รอตรวจสอบ'
    when 'admin_domain' then 'มีคำขอโดเมนมหาวิทยาลัยใหม่'
    else 'มีการแจ้งเตือนใหม่' end as body,
  case when q.type in ('admin_report','admin_domain') then '/admin' else '/messages' end as target,
  q.created_at
 from public.push_queue q
 where q.user_id=auth.uid() and q.type in ('match','interest','admin_report','admin_domain')
 union all
 select 'announcement:'||a.id::text, a.title,a.body,'/announcements',a.created_at
 from public.nm_announcements a
)
select coalesce(jsonb_agg(jsonb_build_object(
 'key',e.notification_key,'title',e.title,'body',e.body,'target',e.target,
 'created_at',e.created_at,'read',r.read_at is not null
) order by e.created_at desc),'[]'::jsonb)
from (select * from events order by created_at desc limit least(greatest(coalesce(p_limit,50),1),100)) e
left join public.nm_notification_reads r on r.user_id=auth.uid() and r.notification_key=e.notification_key
where auth.uid() is not null
$$;
create or replace function public.nm_mark_notification_read(p_key text)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if not (
  (p_key like 'push:%' and exists(select 1 from public.push_queue q where q.user_id=auth.uid() and 'push:'||q.id::text=p_key))
  or (p_key like 'announcement:%' and exists(select 1 from public.nm_announcements a where 'announcement:'||a.id::text=p_key))
 ) then return false; end if;
 insert into public.nm_notification_reads(user_id,notification_key)
 values(auth.uid(),p_key) on conflict(user_id,notification_key) do nothing;
 return true;
end $$;
revoke all on function public.nm_my_notifications(integer) from public,anon;
revoke all on function public.nm_mark_notification_read(text) from public,anon;
grant execute on function public.nm_my_notifications(integer) to authenticated;
grant execute on function public.nm_mark_notification_read(text) to authenticated;
