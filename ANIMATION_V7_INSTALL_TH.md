# Nisit Match v7 — Smooth Animations

ใช้โปรเจกต์ v6 เป็นฐาน แก้เฉพาะ `src/styles.css` เพื่อไม่กระทบ React/Supabase/Match/Chat/Swipe

## ติดตั้งอย่างปลอดภัย

ถ้าโปรเจกต์ปัจจุบันยังเป็น v6 ให้นำ `src/styles.css` จาก ZIP ไปแทนไฟล์เดิม
ถ้าแก้โค้ดต่อจาก v6 แล้ว ให้คัดลอกเฉพาะบล็อก CSS ท้ายไฟล์ที่ขึ้นต้น `Nisit Match v7 — motion-only enhancement` ไปต่อท้าย styles.css ปัจจุบัน เพื่อไม่ทับงานใหม่

รัน `npm run build` แล้วทดสอบปัด, เปิด/ปิดโปรไฟล์, แชต, รูปภาพ, เพลง และการค้นหาเพลงก่อน Deploy

ไม่มีการแก้ Edge Function, SQL, JavaScript หรือ dependencies
