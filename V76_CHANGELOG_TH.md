# v76 — สรุปการเปลี่ยนแปลง

- เพิ่ม Premium รายสัปดาห์/รายเดือนและหน้า gated list สำหรับคนกดใจ/ผู้เข้าชม โดยไม่แอบอ้างว่ารับชำระเงินจริงแล้ว
- เพิ่มตารางและ RPC ที่จำกัดสิทธิ์ข้อมูลคนกดใจ/ผู้เข้าชมไว้กับบัญชี Premium ที่ active
- เพิ่ม profile media video พร้อม gallery และ Supabase Storage bucket แยก
- เพิ่มระบบสร้างกิจกรรม Hangout และ RSVP พร้อม RLS และ trigger จำกัดความจุ
- ปรับ crop dialog ให้ผู้ใช้ลากตำแหน่งภาพและซูมก่อนบันทึก
- ปรับ swipe threshold, easing และ timing ให้ตอบสนองง่ายขึ้น และให้ Like/Pass burst อยู่กลาง viewport ระหว่างการ์ดออก
- เพิ่ม `supabase/V76_PREMIUM_HANGOUT_MEDIA.sql`

## ข้อจำกัด
- การชำระเงินจริงยังต้องเชื่อม provider + server-side webhook
- Live Photo รองรับในรูปแบบคลิปวิดีโอสั้น ไม่ใช่ไฟล์ Apple Live Photo คู่ HEIC/MOV โดยตรง
- Build ยังต้องตรวจบนเครื่องจริงด้วย `npm ci` และ `npm run build`
