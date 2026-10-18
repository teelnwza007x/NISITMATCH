# NISIT MATCH v56 — Chat 2.0 / It's a Match / Stability

## ฟีเจอร์
- ตอบกลับข้อความเฉพาะอัน (Reply) ด้วยเมนูข้อความ
- กดค้างข้อความบนมือถือ หรือคลิกขวา / กดปุ่มตัวเลือก เพื่อเปิดเมนู
- ส่งหัวใจให้ข้อความ / ยกเลิกหัวใจ
- วันที่คั่นระหว่างข้อความ
- หน้าฉลอง It's a Match แอนิเมชัน และเปิดห้องแชตที่เพิ่งแมตช์
- รองรับ prefers-reduced-motion, รูปภาพ lazy-load, คงการล็อก viewport หน้าแชตจาก v55

## ติดตั้ง
1. สำรองโปรเจกต์เดิมและเก็บ .env.local, .git, deploy.bat ไว้
2. อัปเดตไฟล์จาก ZIP
3. เปิด Supabase SQL Editor แล้วรัน `supabase/V56_CHAT_REPLY_REACTIONS.sql` เพื่อเปิดใช้ Reply และ Reaction
4. npm install
5. npm run build
6. Deploy เมื่อ Build ผ่าน

หมายเหตุ: หากยังไม่รัน SQL v56 การส่งข้อความปกติยังทำงานได้ แต่ Reply/Reaction จะใช้ไม่ได้สมบูรณ์
