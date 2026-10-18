NISIT MATCH v30 — Safety, First-use Guide, Home Screen

1. แตก ZIP แล้วนำไฟล์โปรเจกต์ไปไว้ใน C:\nisit-match (สำรองโฟลเดอร์เดิมก่อน)
2. เก็บ .env.local ของเครื่องเดิมไว้ อย่าอัปโหลด GitHub
3. เปิด CMD: cd /d C:\nisit-match
4. npm install
5. npm run build
6. ดับเบิลคลิก deploy.bat (ถ้าตั้ง GitHub/Vercel auto deploy แล้ว) หรือ npx vercel --prod
7. เปิด https://nisitmatch.vercel.app/apple-touch-icon.png ตรวจว่าเห็นโลโก้
8. ลบไอคอนเดิมบน iPhone แล้วเพิ่มใหม่จาก Safari > Share > Add to Home Screen

ระบบรายงานและบล็อกใช้ตาราง Supabase public.reports และ public.blocks ที่มีอยู่เดิม ตรวจ RLS ให้ใช้งานได้จริงก่อนเปิดสาธารณะ
คู่มือผู้ใช้ใหม่จะแสดงครั้งเดียวต่อบัญชี/เบราว์เซอร์ และเปิดซ้ำได้จากปุ่มคู่มือและความปลอดภัยที่ท้ายหน้า
