NISIT MATCH v60 — ขั้นตอนติดตั้ง

1. สำรองโฟลเดอร์ C:\nisit-match เก็บ .env.local, .git และ deploy.bat เดิมไว้
2. อัปเดตไฟล์โปรเจกต์จาก ZIP
3. Supabase SQL Editor: รัน supabase/V60_SUPERLIKE_UNDO.sql เพียงครั้งเดียว
4. ระบบซ่อนโปรไฟล์ใช้ supabase/V26_TRUST_PRIVACY.sql ที่เคยมีอยู่แล้ว หากยังไม่ได้รัน ให้รัน V26 ก่อน (ตรวจว่ามี profile_visibility และ discover RPC เวอร์ชัน V26)
5. Push Notifications ใช้ระบบที่มีอยู่จาก v59: supabase/push_notifications.sql และ Edge Function supabase/functions/send-push/index.ts
   ต้องตั้งค่า VITE_VAPID_PUBLIC_KEY ฝั่ง Vercel, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_DISPATCH_SECRET ฝั่ง Supabase Edge Function และตั้ง cron/dispatcher เรียก send-push ด้วย x-dispatch-secret อย่างปลอดภัย
   ต้องใช้ HTTPS และอนุญาตแจ้งเตือนจากอุปกรณ์; iOS ต้องเพิ่ม PWA ลงหน้าจอโฮมก่อน
6. cd /d C:\nisit-match && npm install && npm run build
7. เมื่อ Build ผ่านจึง deploy.bat

ฟีเจอร์:
- Super Like ปุ่มดาว จำกัด 3 ครั้งต่อวัน (นับวัน UTC) ใช้ RPC แบบ atomic
- Undo ย้อนการปัดล่าสุดได้ภายใน 2 นาที หากเกิด Match แล้วจะไม่อนุญาตให้ย้อน เพื่อรักษาห้องแชต
- ซ่อนโปรไฟล์: อยู่ในหน้าตั้งค่าเดิม (โหมดพักการค้นหา); ฝั่ง discover ใช้ V26 privacy RPC
- ครอปรูป: เมื่อเลือกรูปในหน้าแก้ไขโปรไฟล์จะเปิดหน้าต่างครอป 1:1 และซูมก่อนบันทึก
- Push: คงระบบตั้งค่า Push เดิมพร้อมคู่มือ deploy; ต้องตั้งค่าเซิร์ฟเวอร์จริงจึงจะส่งได้

หมายเหตุ: การตรวจ Build ต้องดูผล npm run build จริง และทดสอบ Supabase RLS / Push end-to-end บนอุปกรณ์จริงก่อนเปิดสาธารณะ
