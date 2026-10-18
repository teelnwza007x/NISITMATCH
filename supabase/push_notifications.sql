-- Run AFTER the existing Nisit Match schema. This does not delete any user data.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own_read on public.push_subscriptions;
drop policy if exists push_own_insert on public.push_subscriptions;
drop policy if exists push_own_delete on public.push_subscriptions;
create policy push_own_read on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_own_insert on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_own_delete on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

-- Queue created from in-app notifications. The sender Edge Function consumes it.
create table if not exists public.push_queue (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  attempts int not null default 0,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.push_queue enable row level security;
-- No client-side policies: only the service role can read/process the queue.
create or replace function public.queue_push_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.push_queue(notification_id,user_id,type) values (new.id,new.user_id,new.type)
  on conflict(notification_id) do nothing;
  return new;
end $$;
drop trigger if exists t_queue_push on public.notifications;
create trigger t_queue_push after insert on public.notifications for each row execute function public.queue_push_notification();
