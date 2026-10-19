-- NISIT MATCH v81: Hangout group chat + participant counts + close-room support
-- Run this after the existing V76_PREMIUM_HANGOUT_MEDIA.sql in Supabase SQL Editor.

create table if not exists public.hangout_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hangout_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index if not exists hangout_messages_event_created_idx
  on public.hangout_messages(event_id, created_at);

alter table public.hangout_messages enable row level security;
drop policy if exists hangout_messages_read_members on public.hangout_messages;
create policy hangout_messages_read_members on public.hangout_messages
  for select to authenticated using (
    exists (
      select 1 from public.hangout_events e
      where e.id = event_id and (
        e.creator_id = auth.uid() or exists (
          select 1 from public.hangout_rsvps r
          where r.event_id = e.id and r.user_id = auth.uid()
        )
      )
    )
  );
drop policy if exists hangout_messages_insert_members on public.hangout_messages;
create policy hangout_messages_insert_members on public.hangout_messages
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.hangout_events e
      where e.id = event_id and e.status = 'open' and e.starts_at > now() and (
        e.creator_id = auth.uid() or exists (
          select 1 from public.hangout_rsvps r
          where r.event_id = e.id and r.user_id = auth.uid()
        )
      )
    )
  );
grant select, insert on public.hangout_messages to authenticated;

-- Enable Realtime for group chat if the table is not already in the publication.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hangout_messages'
     ) then
    alter publication supabase_realtime add table public.hangout_messages;
  end if;
end $$;
