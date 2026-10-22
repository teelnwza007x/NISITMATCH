-- RMUTTO campus email domain. Review and apply to the intended Supabase environment.
insert into public.student_email_domains (university_id, domain, enabled)
select 'rmutto', 'rmutto.ac.th', true
where not exists (select 1 from public.student_email_domains where university_id = 'rmutto' and domain = 'rmutto.ac.th');

insert into public.university_email_domains (university_name, domain)
select 'มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก', 'rmutto.ac.th'
where not exists (select 1 from public.university_email_domains where domain = 'rmutto.ac.th');
