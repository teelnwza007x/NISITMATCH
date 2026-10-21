-- Add military and police academies to profile institution database.
-- No email domains are enabled until each academy's student email domain is verified.
insert into public.universities (id, name) values
 ('crma', 'โรงเรียนนายร้อยพระจุลจอมเกล้า (จปร.)'),
 ('rtna', 'โรงเรียนนายเรือ'),
 ('nkrafa', 'โรงเรียนนายเรืออากาศนวมินทกษัตริยาธิราช'),
 ('rpca', 'โรงเรียนนายร้อยตำรวจ')
on conflict (id) do update set name = excluded.name;
