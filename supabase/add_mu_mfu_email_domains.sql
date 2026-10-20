-- Enable Mahidol and Mae Fah Luang institutional email verification.
-- Run once in Supabase SQL Editor. Idempotent without assuming a UNIQUE constraint.
insert into public.universities (id, name)
select v.id, v.name
from (values
  ('mu', 'มหาวิทยาลัยมหิดล'),
  ('mfu', 'มหาวิทยาลัยแม่ฟ้าหลวง')
) as v(id, name)
where not exists (select 1 from public.universities u where u.id = v.id);

update public.universities set name = 'มหาวิทยาลัยมหิดล' where id = 'mu';
update public.universities set name = 'มหาวิทยาลัยแม่ฟ้าหลวง' where id = 'mfu';

update public.student_email_domains set enabled = true where university_id = 'mu' and domain = 'mu.ac.th';
update public.student_email_domains set enabled = true where university_id = 'mfu' and domain = 'mfu.ac.th';

insert into public.student_email_domains (university_id, domain, enabled)
select v.university_id, v.domain, true
from (values ('mu', 'mu.ac.th'), ('mfu', 'mfu.ac.th')) as v(university_id, domain)
where not exists (
  select 1 from public.student_email_domains d
  where d.university_id = v.university_id and d.domain = v.domain
);

select university_id, domain, enabled from public.student_email_domains where domain in ('mu.ac.th', 'mfu.ac.th');
