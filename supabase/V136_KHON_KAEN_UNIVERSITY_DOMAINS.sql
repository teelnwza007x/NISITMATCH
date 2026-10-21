-- Register Khon Kaen University and its accepted student email domains.
-- Existing university records are preserved.
insert into public.universities (id, name)
values ('kku', 'มหาวิทยาลัยขอนแก่น')
on conflict (id) do nothing;

insert into public.student_email_domains (domain, university_id, enabled)
values
  ('kkumail.com', 'kku', true),
  ('i.kku.ac.th', 'kku', true)
on conflict (domain) do update
set university_id = excluded.university_id,
    enabled = true;

select domain, university_id, enabled
from public.student_email_domains
where university_id = 'kku'
order by domain;
