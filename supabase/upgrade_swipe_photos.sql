-- Run once on an existing Nisit Match database in Supabase SQL Editor.
alter table public.profiles add column if not exists photo_paths text[] not null default '{}';
update public.profiles set photo_paths = array[avatar_path] where avatar_path is not null and cardinality(photo_paths)=0;
alter table public.profiles drop constraint if exists profile_max_six_photos;
alter table public.profiles add constraint profile_max_six_photos check (cardinality(photo_paths) <= 6);
-- Include additional photos in the discover RPC while keeping original parameters.
drop function if exists public.discover(text, integer, integer, text);
create function public.discover(p_university text default null, p_min_age int default 18, p_max_age int default 99, p_gender text default null)
returns table(id uuid, display_name text, age int, gender text, university_id text, faculty text, bio text, interests text[], avatar_path text, photo_paths text[])
language sql security definer stable set search_path = public as $$
 select p.id,p.display_name,date_part('year',age(p.birth_date))::int,p.gender,p.university_id,p.faculty,p.bio,p.interests,p.avatar_path,p.photo_paths
 from public.profiles p
 where auth.uid() is not null and p.id<>auth.uid()
 and exists(select 1 from public.profiles me where me.id=auth.uid())
 and not exists(select 1 from public.likes l where l.from_id=auth.uid() and l.to_id=p.id)
 and not public.is_blocked_pair(auth.uid(),p.id)
 and (p_university is null or p.university_id=p_university)
 and (p_gender is null or p.gender=p_gender)
 and date_part('year',age(p.birth_date)) between p_min_age and p_max_age
 order by p.created_at desc limit 30 $$;
-- Ensure realtime is enabled in Supabase > Database > Publications for messages and notifications.

-- Repair matchmaking on existing databases: create match for reciprocal likes.
create or replace function public.on_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_match uuid;
begin
  if new.is_like and exists (
    select 1 from public.likes l where l.from_id = new.to_id
      and l.to_id = new.from_id and l.is_like = true
  ) and not public.is_blocked_pair(new.from_id,new.to_id) then
    insert into public.matches(user_a,user_b)
    values (least(new.from_id,new.to_id),greatest(new.from_id,new.to_id))
    on conflict (user_a,user_b) do nothing returning id into v_match;
    if v_match is not null then
      insert into public.notifications(user_id,type,ref_id)
      values (new.from_id,'match',v_match),(new.to_id,'match',v_match);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_like on public.likes;
create trigger t_like after insert or update of is_like on public.likes
for each row execute function public.on_like();

-- Backfill matches missing from previous mutual likes (idempotent).
with created as (
  insert into public.matches(user_a,user_b)
  select least(a.from_id,a.to_id), greatest(a.from_id,a.to_id)
  from public.likes a
  join public.likes b on b.from_id=a.to_id and b.to_id=a.from_id
  where a.is_like=true and b.is_like=true
    and not public.is_blocked_pair(a.from_id,a.to_id)
  on conflict (user_a,user_b) do nothing
  returning id,user_a,user_b
)
insert into public.notifications(user_id,type,ref_id)
select user_id,'match',id from created
cross join lateral (values (user_a),(user_b)) as recipients(user_id);

-- Realtime chat publication (safe to re-run).
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
   alter publication supabase_realtime add table public.messages;
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
   alter publication supabase_realtime add table public.notifications;
 end if;
end $$;
