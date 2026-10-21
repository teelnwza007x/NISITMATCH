-- Admin-only Hangout directory. Does not require campus email verification.
-- Returns room metadata and participant counts, not private chat messages.
create or replace function public.nm_admin_hangouts(p_limit integer default 40,p_offset integer default 0)
returns table(id uuid,title text,venue text,city text,starts_at timestamptz,status text,capacity integer,creator_id uuid,creator_name text,description text,created_at timestamptz,member_count bigint,total_count bigint)
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin is true) then
   raise exception 'Admin only' using errcode='42501';
 end if;
 return query
 select h.id,h.title,h.venue,h.city,h.starts_at,h.status,h.capacity,h.creator_id,
        p.display_name,h.description,h.created_at,
        (select count(*) from public.hangout_rsvps r where r.event_id=h.id),
        count(*) over()
 from public.hangout_events h
 left join public.profiles p on p.id=h.creator_id
 order by h.created_at desc,h.id
 limit least(greatest(coalesce(p_limit,40),1),50)
 offset greatest(coalesce(p_offset,0),0);
end;
$$;
revoke all on function public.nm_admin_hangouts(integer,integer) from public,anon;
grant execute on function public.nm_admin_hangouts(integer,integer) to authenticated;
