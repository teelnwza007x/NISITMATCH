# NISIT MATCH — แก้ Reset Password แสดงเป็นยืนยันอีเมล

- เพิ่ม `flow=recovery` ใน redirectTo ของการส่งอีเมลกู้รหัสผ่านทั้งสองจุด
- เพิ่ม `flow=signup` ใน emailRedirectTo สำหรับการสมัคร
- หน้า `/auth/callback` แยก recovery จาก signup ด้วย query parameter ที่คงอยู่หลัง Supabase แลก code เป็น session
- ยังคงรองรับ event `PASSWORD_RECOVERY` และ `type=recovery` จาก Supabase

## ต้องตั้งค่า Supabase
Authentication → URL Configuration → Redirect URLs เพิ่ม `https://nisitmatch.vercel.app/auth/callback**` เพื่ออนุญาต query string หรือใช้ `https://nisitmatch.vercel.app/**` ตามที่ตั้งไว้แล้ว
Site URL: `https://nisitmatch.vercel.app`

## ทดสอบ
Deploy โปรเจกต์ใหม่ จากนั้นขอลิงก์กู้รหัสผ่าน **ฉบับใหม่** และกดจากอีเมลล่าสุดเท่านั้น ต้องเห็นฟอร์มตั้งรหัสผ่านใหม่ ไม่ใช่ข้อความยืนยันบัญชี
ตรวจว่าลิงก์ในอีเมลใช้ `{{ .ConfirmationURL }}` และไม่ได้คัดลอกลิงก์ยืนยันบัญชีมาใช้แบบตายตัว

ยังไม่ได้ทดสอบกับ Supabase จริงหรือมือถือจริง และยังไม่ได้ยืนยันว่า Build ผ่าน
