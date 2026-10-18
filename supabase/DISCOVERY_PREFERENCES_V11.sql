-- Run once in Supabase SQL Editor to sync discovery preferences across devices.
create table if not exists public.discovery_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.discovery_preferences enable row level security;
drop policy if exists "Read own discovery preferences" on public.discovery_preferences;
create policy "Read own discovery preferences" on public.discovery_preferences for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Insert own discovery preferences" on public.discovery_preferences;
create policy "Insert own discovery preferences" on public.discovery_preferences for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Update own discovery preferences" on public.discovery_preferences;
create policy "Update own discovery preferences" on public.discovery_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
