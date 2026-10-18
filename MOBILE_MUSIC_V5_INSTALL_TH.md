# Nisit Match v5 — ติดตั้ง

## อัปเดตเว็บ
1. สำรองโปรเจกต์เดิม
2. นำ `src/App.jsx` และ `src/styles.css` ไปแทนไฟล์เดิม (หรือใช้ทั้งโปรเจกต์ใน ZIP)
3. รัน `npm install` และ `npm run build`
4. Push GitHub แล้วรอ Vercel Deploy

## สำคัญ: แก้ค้นหาเพลงบนมือถือ
การเปลี่ยน App.jsx อย่างเดียวไม่พอ ต้อง Deploy Supabase Edge Function ที่แนบมาด้วย

1. ติดตั้ง Supabase CLI และล็อกอิน: `npx supabase login`
2. เชื่อมโปรเจกต์: `npx supabase link --project-ref YOUR_PROJECT_REF`
3. Deploy: `npx supabase functions deploy itunes-search`
4. ทดสอบการค้นหาเพลงในหน้าตั้งค่าโปรไฟล์บนมือถือ

Function อยู่ใน `supabase/functions/itunes-search/index.ts` และใช้ JWT ของผู้ใช้ที่ล็อกอินตามค่าเริ่มต้น ไม่ต้องเพิ่ม SQL หรือ Environment Variable ใน Vercel หากตั้งค่า Supabase เดิมถูกต้องอยู่แล้ว

หาก iTunes ไม่ตอบจากฝั่ง Supabase หรือ Edge Function ไม่ได้ Deploy ระบบจะลองค้นหาโดยตรงเป็นทางสำรอง ซึ่งอาจถูกบล็อกบนมือถือได้

## การออกแบบ
- เพลงบนการ์ดปัดเป็นแถบขนาดเล็ก แสดงปก ชื่อเพลง ศิลปิน และปุ่มเล่น
- ปุ่มปัดเปลี่ยนเป็นกลุ่มปุ่มทรงเหลี่ยมโค้ง แยกสี Skip / Profile / Like / Report
- ไม่เปลี่ยนการทำงาน Like, Match, Chat หรือฐานข้อมูล
