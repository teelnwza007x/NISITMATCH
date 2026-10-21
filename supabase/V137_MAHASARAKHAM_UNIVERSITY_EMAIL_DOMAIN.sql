-- Enable Mahasarakham University email verification for @msu.ac.th.
-- Uses the existing university ID from src/data/universities.js.
insert into public.universities (id, name)
values ('mahasarakham', 'มหาวิทยาลัยมหาสารคาม')
on conflict (id) do nothing;

insert into public.student_email_domains (domain, university_id, enabled)
values ('msu.ac.th', 'mahasarakham', true)
on conflict (domain) do update
set university_id = excluded.university_id,
    enabled = true;

select domain, university_id, enabled
from public.student_email_domains
where university_id = 'mahasarakham'
order by domain;
