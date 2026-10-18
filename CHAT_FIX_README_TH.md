แก้หน้าแชตและรูปโปรไฟล์
1. สำรองโปรเจกต์เดิมก่อน จากนั้นใช้โปรเจกต์นี้แทน
2. Supabase Dashboard > SQL Editor > เปิดไฟล์ supabase/FIX_MATCH_PROFILE_VISIBILITY.sql และกด Run
3. ตรวจสอบผลลัพธ์ท้าย SQL ว่าชื่อทั้งสองฝ่ายไม่เป็น NULL และ avatar_path/photo_paths มีข้อมูล
4. ตรวจสอบ Storage > avatars ว่าไฟล์มีอยู่จริง และ bucket เป็น Public
5. npm install && npm run build จากนั้น deploy ใหม่และรีเฟรชหน้าเว็บ
หากยังเห็นข้อความ 'โปรไฟล์ไม่พร้อมใช้งาน' ให้เปิด Developer Tools > Console ดูคำเตือน Match profiles unavailable
หมายเหตุ: SQL จะเปลี่ยนนโยบาย SELECT ของ profiles ชื่อ p_read เท่านั้น โดยอนุญาตเฉพาะตนเองและคู่ Match และปรับ bucket avatars เป็น Public; หากต้องการให้รูปเป็นส่วนตัว ไม่ควรใช้ Public bucket แต่ต้องเปลี่ยนแอปไปใช้ signed URLs แทน
