# NISIT MATCH v58

ต่อยอดจาก v57: Preview โปรไฟล์ตัวเองเปิดเป็น portal ติด viewport, ล็อก scroll ของหน้าเดิมและคืนตำแหน่งเมื่อปิด, รองรับการปัดรูปใน Preview และโปรไฟล์คนอื่น, preload รูปถัดไป, ปรับ responsive mobile/chat, ขนาดปุ่ม Chat 2.0 และ micro-interactions พร้อม reduced-motion.

ไม่มี SQL ใหม่สำหรับ v58 (หากยังไม่รัน SQL v56 ต้องรันก่อน)

ทดสอบด้วย `npm install` แล้ว `npm run build` ก่อน deploy และทดสอบ Safari บน iPhone จริง

การตรวจ security เชิงลึกต้องตรวจ RLS policies และ storage policies บน Supabase dashboard แยกต่างหาก; การแก้ UI นี้ไม่ถือเป็น security audit ที่ผ่านแล้ว
