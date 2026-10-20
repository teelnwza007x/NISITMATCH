-- Requests for university email domains not yet supported by NISIT MATCH.
-- Run in Supabase SQL Editor before enabling the request form.
create table if not exists public.campus_domain_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_name text not null check (char_length(trim(university_name)) between 3 and 150),
  email_domain text not null check (char_length(email_domain) between 3 and 253),
  created_at timestamptz not null default now(),
  constraint campus_domain_requests_unique unique (user_id, email_domain)
);
create index if not exists campus_domain_requests_created_at_idx on public.campus_domain_requests (created_at desc);
alter table public.campus_domain_requests enable row level security;
revoke all on public.campus_domain_requests from anon;
grant insert on public.campus_domain_requests to authenticated;
drop policy if exists "Users can submit campus domain requests" on public.campus_domain_requests;
create policy "Users can submit campus domain requests"
on public.campus_domain_requests for insert to authenticated
with check (auth.uid() = user_id);
-- No SELECT/UPDATE/DELETE policy: only project administrators/service role can review requests.
