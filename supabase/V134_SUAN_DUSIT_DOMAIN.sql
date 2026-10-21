-- Add an additional accepted email domain for Suan Dusit University.
-- Keep the existing suandusit.ac.th domain enabled.
insert into public.student_email_domains (domain, university_id, enabled)
values ('dusit.ac.th', 'dusit', true)
on conflict (domain) do update
set university_id = excluded.university_id, enabled = true;

select domain, university_id, enabled
from public.student_email_domains
where university_id = 'dusit'
order by domain;
