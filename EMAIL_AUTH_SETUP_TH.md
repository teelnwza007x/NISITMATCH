# NISIT MATCH — อีเมลยืนยันและกู้รหัสผ่าน

## สิ่งที่เปลี่ยนในโค้ด
- เปลี่ยน redirect ของสมัครสมาชิก, ลืมรหัสผ่าน และส่งลิงก์เปลี่ยนรหัสผ่านจากหน้า Settings ไปที่ `/auth/callback`
- เพิ่มหน้ารับลิงก์และแบบฟอร์มเปลี่ยนรหัสผ่าน (ขั้นต่ำ 8 ตัวอักษรและยืนยันซ้ำ)
- เพิ่ม Vercel SPA rewrite (`vercel.json`) และ Netlify fallback (`public/_redirects`)
- เพิ่มอีเมล HTML ธีม NISIT MATCH สองชุดใน `email-templates/`

## ต้องตั้งค่าที่ Supabase (สำคัญมาก)
1. ไปที่ Supabase Dashboard → Authentication → URL Configuration
2. **Site URL**: ใส่ URL เว็บจริง เช่น `https://your-domain.example` (ห้ามใส่ตัวอย่างนี้ตรง ๆ)
3. **Redirect URLs**: เพิ่ม `https://your-domain.example/auth/callback` และโดเมน preview ที่คุณใช้งานจริง (สำหรับ localhost เพิ่ม `http://localhost:5173/auth/callback`)
4. Authentication → Email Templates → **Confirm signup**: คัดลอก HTML จาก `email-templates/confirm-signup.html` แล้วตั้ง Subject เช่น `ยืนยันอีเมลของคุณ 💗 | NISIT MATCH`
5. Authentication → Email Templates → **Reset Password**: คัดลอก HTML จาก `email-templates/reset-password.html` แล้วตั้ง Subject เช่น `ตั้งรหัสผ่านใหม่ | NISIT MATCH`
6. **ต้องเก็บ** `{{ .ConfirmationURL }}` ตามเดิม เพราะเป็นลิงก์ยืนยันที่ Supabase สร้างขึ้น อย่าแทนด้วยลิงก์หน้าเว็บโดยตรง
7. Deploy โค้ดใหม่บน Vercel หรือ Netlify แล้วลองส่งลิงก์ใหม่ (ลิงก์เก่าที่หมดอายุหรือชี้โดเมนผิดอาจใช้ไม่ได้)

## ตรวจหาสาเหตุ 404
- หากลิงก์พาไป `localhost`, โดเมนเก่า หรือโดเมนที่ไม่ใช่เว็บจริง: แก้ Site URL และ Redirect URLs ก่อน
- หาก URL ลงท้าย `/auth/callback` แล้ว 404: ตรวจว่าโฮสต์ได้ deploy ไฟล์ rewrite แล้ว
- หากหน้าเปิดได้แต่ขึ้นลิงก์หมดอายุ: ขออีเมลใหม่ อย่ากดลิงก์เดิมซ้ำ; บางโปรแกรมสแกนอีเมลอาจเปิดลิงก์ก่อนผู้ใช้
- ถ้าใช้โฮสต์อื่นที่ไม่ใช่ Vercel/Netlify ต้องตั้งค่า SPA fallback ให้คืน `index.html` สำหรับ `/auth/callback` เอง

## ข้อจำกัด
- ยังไม่ได้เข้าถึง Supabase Dashboard หรือเว็บ production จึงไม่ได้เปลี่ยน Email Templates/Redirect URLs จริงในบัญชีคุณ
- ไม่ได้ทดสอบการส่งเมลจริง, ลิงก์จริง, อีเมลบน Gmail/Outlook หรือ deployment จริง
- Supabase บางรูปแบบการยืนยัน/การใช้ PKCE อาจต้องตรวจสอบ flow เพิ่มตามการตั้งค่าจริง
- อย่าใส่ service_role key หรือรหัสผ่าน SMTP ในโค้ด frontend
