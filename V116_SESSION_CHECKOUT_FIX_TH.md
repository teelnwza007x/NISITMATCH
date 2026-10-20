# NISIT MATCH V116 — Stripe Checkout Session Diagnostics

แก้เฉพาะหน้า Premium และ API สร้าง Checkout:
- รีเฟรช Supabase session ก่อนเรียก Checkout
- ตรวจสอบ URL Supabase ฝั่งเซิร์ฟเวอร์กับฝั่งหน้าเว็บ (เมื่อ VITE_SUPABASE_URL ถูกตั้งใน Vercel)
- แสดงสาเหตุ 401 ใน Vercel Logs โดยไม่บันทึก Token หรือ Secret
- คง Price ID, ราคา, PromptPay, Webhook และฟีเจอร์เดิมไว้

## ติดตั้ง
1. สำรองโฟลเดอร์ C:\nisit-match ก่อน
2. แตก ZIP แล้วคัดลอกเนื้อหาในโฟลเดอร์ nisit-match ไปทับโฟลเดอร์โปรเจกต์เดิม
3. ใช้ไฟล์ AUTO DEPLOY .bat ของคุณเพื่อ push ไป GitHub
4. รอ Vercel Production Ready แล้วออกจากระบบและเข้าใหม่
5. ทดลองซื้อ Premium ฿39 ใน Stripe Sandbox
6. ถ้ายังไม่สำเร็จ เปิด Vercel Logs ค้นหา [checkout] และตรวจสอบ SUPABASE_URL กับ VITE_SUPABASE_URL

หมายเหตุ: ไม่สามารถยืนยันว่า Supabase Environment Variables ในบัญชีจริงถูกต้องได้จาก ZIP นี้ และยังไม่ได้ทดสอบการจ่ายเงินจริง
