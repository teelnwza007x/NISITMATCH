# NISIT MATCH v31

เพิ่มตัวเลือกสถานะกำลังมองหาอะไรในหน้าแก้ไขโปรไฟล์และแสดงบนการ์ดปัดและโปรไฟล์คนอื่น รวมทั้งขั้นตอนเพิ่มเว็บลงหน้าจอโฮมในคู่มือภายในเว็บ

1. เปิด Supabase SQL Editor แล้วรัน supabase/V31_RELATIONSHIP_INTENT.sql ก่อน (จำเป็นสำหรับการบันทึกสถานะ)
2. สำรองโปรเจกต์เดิม และเก็บ .env.local กับ .vercel/ ไว้
3. คัดลอกไฟล์เวอร์ชันใหม่ทับโปรเจกต์ โดยไม่ลบ .env.local
4. npm install และ npm run build
5. deploy.bat เพื่อ push GitHub และให้ Vercel deploy (หากเชื่อม Git integration แล้ว)
6. เปิดเว็บบน iPhone ผ่าน Safari แล้วเลือก Share > Add to Home Screen; Android ผ่าน Chrome > Install app
