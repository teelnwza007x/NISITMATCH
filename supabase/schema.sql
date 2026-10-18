-- รันทั้งไฟล์ใน Supabase > SQL Editor
create table universities (id text primary key, name text not null);
insert into universities values ('chula','จุฬาลงกรณ์มหาวิทยาลัย'),('tu','มหาวิทยาลัยธรรมศาสตร์'),('ku','มหาวิทยาลัยเกษตรศาสตร์'),('kmutt','มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี'),('cmu','มหาวิทยาลัยเชียงใหม่'),('kku','มหาวิทยาลัยขอนแก่น'),('psu','มหาวิทยาลัยสงขลานครินทร์'),('mu','มหาวิทยาลัยมหิดล');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  birth_date date not null check (birth_date <= (current_date - interval '18 years')),
  gender text not null check (gender in ('male','female','other')),
  university_id text not null references universities(id),
  faculty text not null, major text,
  bio text check (char_length(bio) <= 300),
  interests text[] default '{}',
  avatar_path text,
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 6),
  is_admin boolean not null default false,
  created_at timestamptz default now()
);
create function protect_admin() returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then new.is_admin:=false;
  elsif new.is_admin is distinct from old.is_admin and coalesce(auth.role(),'')<>'service_role' then new.is_admin:=old.is_admin; end if;
  return new; end $$;
create trigger t_protect_admin before insert or update on profiles for each row execute function protect_admin();

create table likes (from_id uuid references profiles on delete cascade, to_id uuid references profiles on delete cascade, is_like boolean not null, created_at timestamptz default now(), primary key (from_id,to_id), check (from_id<>to_id));
create table matches (id uuid primary key default gen_random_uuid(), user_a uuid references profiles on delete cascade, user_b uuid references profiles on delete cascade, created_at timestamptz default now(), check (user_a<user_b), unique(user_a,user_b));
create table messages (id uuid primary key default gen_random_uuid(), match_id uuid references matches on delete cascade, sender_id uuid references profiles on delete cascade, body text not null check (char_length(body) between 1 and 2000), read_at timestamptz, created_at timestamptz default now());
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, type text not null, ref_id uuid, read boolean default false, created_at timestamptz default now());
create table blocks (blocker uuid references profiles on delete cascade, blocked uuid references profiles on delete cascade, primary key(blocker,blocked));
create table reports (id uuid primary key default gen_random_uuid(), reporter uuid references profiles on delete cascade, reported uuid references profiles on delete cascade, reason text not null check (char_length(reason)<=500), status text default 'open', created_at timestamptz default now());

create function is_admin() returns boolean language sql security definer stable as $$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;
create function is_member(m uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from matches where id=m and auth.uid() in (user_a,user_b)) $$;
create function is_blocked_pair(a uuid,b uuid) returns boolean language sql security definer stable as $$ select exists(select 1 from blocks where (blocker=a and blocked=b) or (blocker=b and blocked=a)) $$;

create function on_like() returns trigger language plpgsql security definer as $$
declare m uuid; begin
  if new.is_like and exists(select 1 from likes where from_id=new.to_id and to_id=new.from_id and is_like) then
    insert into matches(user_a,user_b) values (least(new.from_id,new.to_id),greatest(new.from_id,new.to_id)) on conflict do nothing returning id into m;
    if m is not null then insert into notifications(user_id,type,ref_id) values (new.from_id,'match',m),(new.to_id,'match',m); end if;
  end if; return new; end $$;
create trigger t_like after insert on likes for each row execute function on_like();
create function on_message() returns trigger language plpgsql security definer as $$
declare o uuid; begin
  select case when user_a=new.sender_id then user_b else user_a end into o from matches where id=new.match_id;
  insert into notifications(user_id,type,ref_id) values (o,'message',new.match_id); return new; end $$;
create trigger t_msg after insert on messages for each row execute function on_message();

create function discover(p_university text default null, p_min_age int default 18, p_max_age int default 99, p_gender text default null)
returns table(id uuid, display_name text, age int, gender text, university_id text, faculty text, bio text, interests text[], avatar_path text, photo_paths text[])
language sql security definer stable as $$
  select p.id,p.display_name,date_part('year',age(p.birth_date))::int,p.gender,p.university_id,p.faculty,p.bio,p.interests,p.avatar_path,p.photo_paths
  from profiles p
  where auth.uid() is not null and p.id<>auth.uid()
   and exists(select 1 from profiles me where me.id=auth.uid())
   and not exists(select 1 from likes l where l.from_id=auth.uid() and l.to_id=p.id)
   and not is_blocked_pair(auth.uid(),p.id)
   and (p_university is null or p.university_id=p_university)
   and (p_gender is null or p.gender=p_gender)
   and date_part('year',age(p.birth_date)) between p_min_age and p_max_age
  order by p.created_at desc limit 30 $$;

alter table profiles enable row level security; alter table likes enable row level security; alter table matches enable row level security;
alter table messages enable row level security; alter table notifications enable row level security; alter table blocks enable row level security; alter table reports enable row level security; alter table universities enable row level security;
create policy uni_read on universities for select using (true);
create policy p_read on profiles for select using (id=auth.uid() or is_admin() or exists(select 1 from matches m where (m.user_a=auth.uid() and m.user_b=id) or (m.user_b=auth.uid() and m.user_a=id)));
create policy p_insert on profiles for insert with check (id=auth.uid());
create policy p_update on profiles for update using (id=auth.uid()) with check (id=auth.uid());
create policy p_delete on profiles for delete using (id=auth.uid() or is_admin());
create policy l_insert on likes for insert with check (from_id=auth.uid());
create policy l_read on likes for select using (from_id=auth.uid());
create policy m_read on matches for select using (auth.uid() in (user_a,user_b));
create policy msg_read on messages for select using (is_member(match_id));
create policy msg_insert on messages for insert with check (sender_id=auth.uid() and is_member(match_id) and not exists(select 1 from matches m where m.id=match_id and is_blocked_pair(m.user_a,m.user_b)));
create policy msg_mark on messages for update using (is_member(match_id) and sender_id<>auth.uid());
create policy n_read on notifications for select using (user_id=auth.uid());
create policy n_update on notifications for update using (user_id=auth.uid());
create policy b_all on blocks for all using (blocker=auth.uid()) with check (blocker=auth.uid());
create policy r_insert on reports for insert with check (reporter=auth.uid());
create policy r_admin on reports for select using (is_admin());
create policy r_admin_up on reports for update using (is_admin());

alter publication supabase_realtime add table messages, notifications;

insert into storage.buckets(id,name,public) values ('avatars','avatars',true) on conflict do nothing;
create policy av_read on storage.objects for select using (bucket_id='avatars');
create policy av_write on storage.objects for insert with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy av_update on storage.objects for update using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
-- สร้าง Admin (รันใน SQL Editor เท่านั้น): update profiles set is_admin=true where id='UUID-ของคุณ';
