-- NISIT MATCH v91: per-message Hangout read receipts.
-- Safe additive migration: does not delete or rewrite existing messages.

create table if not exists public.hangout_message_reads (
  event_id uuid not null references public.hangout_events(id) on delete cascade,
  message_id uuid not null references public.hangout_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists hangout_message_reads_event_idx
  on public.hangout_message_reads(event_id, message_id);

alter table public.hangout_message_reads enable row level security;

drop policy if exists hangout_message_reads_select_members on public.hangout_message_reads;
create policy hangout_message_reads_select_members
on public.hangout_message_reads for select to authenticated
using (
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

drop policy if exists hangout_message_reads_insert_self on public.hangout_message_reads;
create policy hangout_message_reads_insert_self
on public.hangout_message_reads for insert to authenticated
with check (
  user_id = auth.uid() and exists (
    select 1 from public.hangout_events e
    where e.id = event_id and (
      e.creator_id = auth.uid() or exists (
        select 1 from public.hangout_rsvps r
        where r.event_id = e.id and r.user_id = auth.uid()
      )
    ) and exists (
      select 1 from public.hangout_messages m
      where m.id = message_id and m.event_id = public.hangout_message_reads.event_id
    )
  )
);

grant select, insert on public.hangout_message_reads to authenticated;

-- Realtime is optional because the UI also polls receipts; enable if available.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'hangout_message_reads'
     ) then
    alter publication supabase_realtime add table public.hangout_message_reads;
  end if;
end $$;
