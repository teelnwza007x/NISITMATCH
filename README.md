# Nisit Match (เวอร์ชันแกนหลัก — ธีมชมพู/ม่วงตามต้นแบบ)

## รันบน Windows
1. ติดตั้ง Node.js LTS จาก nodejs.org
2. เปิด Command Prompt ในโฟลเดอร์โปรเจกต์: `npm install` (มีแพ็กเกจ lucide-react เพิ่ม ต้องรันใหม่)
3. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่า URL และ anon key
4. `npm run dev` แล้วเปิด http://localhost:5173

## สร้าง Supabase
1. supabase.com > New project
2. SQL Editor > วางทั้งไฟล์ `supabase/schema.sql` > Run
3. Project Settings > API: คัดลอก Project URL และ anon public key ใส่ `.env` (ห้ามใช้ service_role ใน Frontend)
4. Authentication > URL Configuration: ใส่ Site URL (localhost และ URL บน Vercel) / ตรวจว่าเปิด Confirm email
5. Database > Replication: ตรวจว่า messages, notifications เปิด Realtime

## Deploy (Vercel)
อัปโหลดโปรเจกต์ขึ้น GitHub > Vercel > Import > ใส่ Environment Variables 2 ตัว > Deploy

## สร้าง Admin
สมัครบัญชีปกติ แล้วรันใน SQL Editor: `update profiles set is_admin=true where id='UUID';` (ดู UUID ที่ Authentication > Users)

## ทดสอบ
สมัคร 2 บัญชี (ต่างเบราว์เซอร์) > ยืนยันอีเมล > สร้างโปรไฟล์ > ถูกใจกันทั้งคู่ > ดูแท็บแมตช์ > แชต > ดูแจ้งเตือน
ทดสอบสิทธิ์: ใน SQL Editor เลือก role authenticated แล้วลอง select messages ของคู่อื่น ต้องไม่ได้ข้อมูล

## ยังไม่สมบูรณ์ (ตรงไปตรงมา)
- รูปหน้า Landing โหลดจาก Unsplash (ภาพประกอบ ไม่ใช่สมาชิก) และไม่มีโปรไฟล์/แชตตัวอย่างปลอม
- ยังไม่ได้ติดตั้ง/รัน/ทดสอบ/Deploy จริงเลย (สภาพแวดล้อมที่สร้างไม่มีอินเทอร์เน็ต)
- รายชื่อมหาวิทยาลัยมีแค่ 8 แห่งเป็นตัวอย่าง ต้องเติมให้ครบจากข้อมูล สป.อว. ทั้งใน `src/data/universities.js` และตาราง `universities`
- ยังไม่มีหน้า Admin (ดูรายงานผ่าน Supabase Table Editor ได้), หน้าตั้งรหัสผ่านใหม่หลังกดลิงก์รีเซ็ต, ลบบัญชี (ต้องใช้ Edge Function + service role), Push Notifications, หน้านโยบายความเป็นส่วนตัว
- Rate limiting ยังไม่มี (ใช้ของ Supabase Auth ได้เบื้องต้น ควรเพิ่มฝั่งฐานข้อมูล)
- bucket รูปเป็น public ใครมี URL ก็เปิดรูปได้
- วันเกิดห้ามเห็นโดยคนอื่น แต่ผู้ที่แมตช์แล้วอ่านแถวโปรไฟล์เต็มได้ รวมวันเกิด
- ยังไม่มีการตรวจเนื้อหารูป/ข้อความ

## Swipe + 6 Photos Upgrade

For an existing Supabase project run `supabase/upgrade_swipe_photos.sql` in SQL Editor **once** before deploying this version. For a brand-new database use `supabase/schema.sql` instead (do not run both). Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` and run `npm install && npm run dev`.

The Discover page now supports swipe gestures (or buttons), six photos per user with a selectable primary photo, and a mutual-like match modal. Matches and chat messages are stored in Supabase; Realtime requires `messages` and `notifications` in the `supabase_realtime` publication. To verify end-to-end behavior, create two separate adult test accounts, like each other, and send messages from both sessions. The app has not been connected to your live Supabase instance by this package update.
