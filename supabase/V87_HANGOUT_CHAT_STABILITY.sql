-- NISIT MATCH v87: secure member-name lookup and Hangout message notifications.
-- Safe additive migration. Does not delete profiles, accounts, rooms, or messages.

-- Return only minimal member profile fields and only to a member/creator of this event.
create or replace function public.hangout_member_profiles(p_event_id uuid)
returns table(id uuid, display_name text, avatar_path text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.display_name, p.avatar_path
  from public.profiles p
  where auth.uid() is not null
    and exists (
      select 1 from public.hangout_events e
      where e.id = p_event_id
        and (e.creator_id = auth.uid() or exists (
          select 1 from public.hangout_rsvps r
          where r.event_id = e.id and r.user_id = auth.uid()
        ))
    )
    and (
      exists (select 1 from public.hangout_events e where e.id = p_event_id and e.creator_id = p.id)
      or exists (select 1 from public.hangout_rsvps r where r.event_id = p_event_id and r.user_id = p.id)
    )
  order by p.display_name;
$$;
revoke all on function public.hangout_member_profiles(uuid) from public;
grant execute on function public.hangout_member_profiles(uuid) to authenticated;

-- Each new Hangout message creates in-app notifications for other room members.
create or replace function public.notify_hangout_message_members()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_creator uuid;
begin
  select e.creator_id into v_creator
  from public.hangout_events e where e.id = new.event_id;

  insert into public.notifications(user_id, type, ref_id, read)
  select distinct recipient_id, 'hangout_message', new.event_id, false
  from (
    select v_creator as recipient_id
    union
    select r.user_id as recipient_id
    from public.hangout_rsvps r where r.event_id = new.event_id
  ) recipients
  where recipient_id is not null and recipient_id <> new.user_id
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists t_notify_hangout_message_members on public.hangout_messages;
create trigger t_notify_hangout_message_members
after insert on public.hangout_messages
for each row execute function public.notify_hangout_message_members();

-- Make sure the notification table is published for realtime updates.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
