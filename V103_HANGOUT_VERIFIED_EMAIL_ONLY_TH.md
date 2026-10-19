# NISIT MATCH v103 — Hangout เฉพาะบัญชีที่ยืนยันอีเมลมหาวิทยาลัยแล้ว

## ฐานโปรเจกต์
เวอร์ชันนี้ต่อยอดจาก `NISIT_MATCH_v101_THREE_ACTIONS_FLOATING_MENU.zip` โดยตรง ไม่ได้นำการเปลี่ยนแปลงจาก v102 มารวม

## สิ่งที่เปลี่ยน
- หน้า Hangout ตรวจ `student_verifications.status = 'verified'` ก่อนแสดงรายการนัด
- ถ้ายังไม่ยืนยันหรืออ่านสถานะไม่ได้ จะไม่โหลดรายการ Hangout และแสดงข้อความให้ไปยืนยันอีเมลมหาวิทยาลัยก่อน
- เพิ่ม SQL migration เพื่อบังคับสิทธิ์ผ่าน Supabase RLS สำหรับการอ่าน/สร้าง/จัดการ Hangout, RSVP, แชทกลุ่ม และไฟล์แนบแชท
- สถานะยืนยันต้องมี `verified_email` และ `university_id` ด้วย ไม่ใช่แค่ค่าจากฝั่ง UI

## ขั้นตอนติดตั้ง
1. สำรองฐานข้อมูล/โปรเจกต์ก่อน
2. เปิด Supabase Dashboard → SQL Editor
3. รัน `supabase/V103_HANGOUT_VERIFIED_EMAIL_ONLY.sql` หลังจาก migration เดิมที่สร้าง `student_verifications`, Hangout events, RSVPs และ messages (V27, V76, V81, V89)
4. Deploy โปรเจกต์นี้
5. ทดสอบด้วยบัญชีที่ `status='verified'` และบัญชีที่ยังไม่ยืนยัน: บัญชีที่ยังไม่ยืนยันต้องไม่เห็นรายการ ไม่สร้างนัด ไม่เข้าร่วม และไม่อ่าน/ส่งข้อความหรือไฟล์แนบ Hangout ได้

## ข้อควรทราบ
- การแก้หน้าเว็บอย่างเดียวไม่ใช่การป้องกันสิทธิ์ จึงเพิ่ม RLS migration ด้วย
- ต้องรัน SQL migration ใน Supabase ด้วย ไม่ใช่แค่ deploy ZIP
- ยังไม่ได้ทดสอบกับฐานข้อมูล Supabase จริงในบัญชีผู้ใช้ และยังไม่ได้รัน Vite production build ในสภาพแวดล้อมนี้
