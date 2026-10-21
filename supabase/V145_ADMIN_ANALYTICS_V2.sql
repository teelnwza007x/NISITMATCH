-- Analytics 2.0: aggregate only, no private message content exposed.
create or replace function public.nm_admin_analytics_v2(p_days integer default 14)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_admin=true) then
  raise exception 'Admin only';
 end if;
 if p_days not in (7,14,30) then raise exception 'Invalid period'; end if;
 with days as (
   select generate_series((now() at time zone 'Asia/Bangkok')::date-(p_days-1),
     (now() at time zone 'Asia/Bangkok')::date,'1 day'::interval)::date as activity_date
 ), activity as (
   select (created_at at time zone 'Asia/Bangkok')::date as activity_date,
     count(*)::integer as messages,
     count(distinct sender_id)::integer as chat_users,
     count(distinct match_id)::integer as active_chats
   from public.messages
   where created_at >= ((now() at time zone 'Asia/Bangkok')::date-(p_days-1))::timestamp at time zone 'Asia/Bangkok'
   group by 1
 ), university_counts as (
   select coalesce(nullif(trim(university_id::text),''),'ไม่ระบุ') as university, count(*)::integer as members
   from public.profiles group by 1 order by members desc limit 10
 )
 select jsonb_build_object(
  'daily', (select coalesce(jsonb_agg(jsonb_build_object('day',d.activity_date,'messages',coalesce(a.messages,0),'chat_users',coalesce(a.chat_users,0),'active_chats',coalesce(a.active_chats,0)) order by d.activity_date),'[]'::jsonb) from days d left join activity a using(activity_date)),
  'universities',(select coalesce(jsonb_agg(jsonb_build_object('name',university,'members',members)),'[]'::jsonb) from university_counts)
 ) into result;
 return result;
end $$;
revoke all on function public.nm_admin_analytics_v2(integer) from public,anon;
grant execute on function public.nm_admin_analytics_v2(integer) to authenticated;
