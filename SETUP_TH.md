# Nisit Match — คู่มือติดตั้งเวอร์ชันเต็ม

## 1. ติดตั้งและเปิดเว็บ
1. แตก ZIP และเปิดโฟลเดอร์ `nisit-match`
2. คัดลอก `.env.example` เป็น `.env` และใส่ URL/Anon Key ของ Supabase โปรเจกต์เดิม
3. `npm install` แล้ว `npm run dev` เพื่อทดสอบ
4. `npm run build` แล้ว deploy โฟลเดอร์ `dist` บนโฮสต์ HTTPS

## 2. ฐานข้อมูลเดิม (สำคัญ)
- **อย่ารัน `schema.sql` ซ้ำ** กับโปรเจกต์ที่มีตารางอยู่แล้ว เพราะไฟล์นี้สำหรับติดตั้งใหม่
- เปิด Supabase SQL Editor และรัน `supabase/universities_seed.sql` เพื่อเพิ่มมหาวิทยาลัยที่ยังขาด (ใช้ ON CONFLICT)
- รัน `supabase/push_notifications.sql` เพื่อเพิ่มตารางสมัครรับ Push และคิวส่งแจ้งเตือน
- ตรวจสอบว่า `profiles` มีคอลัมน์ `university_id`, `faculty`, `avatar_path`, `photo_paths` และตาราง `matches`, `messages` มี RLS ที่อนุญาตเฉพาะสมาชิกห้อง
- หากข้อมูลโปรไฟล์ของคู่ Match ไม่ขึ้น ให้ตรวจสอบ `profiles` SELECT RLS โดยไม่ปิด RLS ทั้งตาราง

## 3. เปิดแจ้งเตือนโทรศัพท์แบบ Web Push
การกดปุ่มในหน้าตั้งค่า **ยังไม่เพียงพอ** ต้องมีตัวส่งแจ้งเตือนฝั่งเซิร์ฟเวอร์:
1. สร้าง VAPID key pair ด้วย `npx web-push generate-vapid-keys` บนเครื่องผู้ดูแล
2. ใส่ public key ใน `.env` เป็น `VITE_VAPID_PUBLIC_KEY` แล้ว deploy เว็บใหม่
3. ตั้งค่า Supabase Edge Function Secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (เช่น `mailto:you@example.com`) และ `PUSH_DISPATCH_SECRET` (สุ่มค่ายาวปลอดภัย) ห้ามใส่ private key หรือ service role key ใน Vite env
4. Deploy Edge Function `send-push` โดยใช้ Supabase CLI (`supabase functions deploy send-push --no-verify-jwt`) เพราะ endpoint นี้ตรวจ `x-dispatch-secret` เอง
5. ตั้ง cron ฝั่งเซิร์ฟเวอร์ที่เชื่อถือได้ให้ POST ไปที่ `https://PROJECT_REF.supabase.co/functions/v1/send-push` ทุก 1 นาที โดยส่ง header `x-dispatch-secret: YOUR_SECRET` ห้ามใส่ secret ในเว็บฝั่ง client; ควรใช้ระบบ secret manager ของโฮสต์
6. ผู้ใช้เปิดเว็บผ่าน HTTPS และกด **เปิดแจ้งเตือน** ในหน้าตั้งค่า จากนั้นอนุญาตในเบราว์เซอร์
7. iPhone/iPad: ใช้ Safari → Share → Add to Home Screen แล้วเปิดเว็บจากไอคอนหน้าจอหลักเพื่อขออนุญาต Web Push (ขึ้นกับ iOS และเบราว์เซอร์)

> คิวส่ง Push ทำงานเมื่อมี notification ใหม่ใน `notifications` เท่านั้น และต้องมี cron เรียก Edge Function อย่างต่อเนื่อง การแจ้งเตือนขึ้นกับการตั้งค่าระบบ/เบราว์เซอร์/เครือข่ายของผู้รับ

## 4. การทดสอบ
- โปรไฟล์: เลือกมหาวิทยาลัยและคณะ → บันทึก → รีเฟรช ตรวจว่าค่าเดิมยังอยู่
- รูป: อัปโหลดสูงสุด 6 รูป เลือกรูปหลัก → บันทึก → รีเฟรช
- Match: ใช้ 2 บัญชีปัดขวาหากัน ตรวจว่ามีแถวใน `matches`
- แชต: เปิดห้อง ตรวจชื่อและรูป ส่งข้อความจากทั้ง 2 บัญชี แล้วตรวจ `messages`
- Push: เปิดรับแจ้งเตือนบนมือถือ ตั้งค่า dispatcher แล้วให้บัญชีอื่นส่งข้อความ

## 5. ข้อจำกัดที่ควรทราบ
- ยังไม่ได้ทดสอบกับ Supabase จริงของคุณ ต้องใช้ URL/keys และ SQL ของฐานข้อมูลจริง
- ระบบส่ง Push นี้เป็นตัวอย่างสำหรับการใช้งานขนาดเล็ก หากผู้ใช้จำนวนมากควรใช้ queue locking, retry/backoff, observability และ rate limits เพิ่มเติม
- อย่าลบ `matches`, `likes`, `messages` หรือ `notifications` ระหว่างการอัปเกรด
