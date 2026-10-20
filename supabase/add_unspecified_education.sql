-- Required before saving the new 'ไม่ระบุ' university selection.
-- Run in Supabase SQL Editor. Does not alter existing profiles.
INSERT INTO public.universities (id, name)
VALUES ('unspecified', 'ไม่ระบุ')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT id, name FROM public.universities WHERE id = 'unspecified';
