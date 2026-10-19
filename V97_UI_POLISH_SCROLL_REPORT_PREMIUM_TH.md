# NISIT MATCH v97 — Swipe, UI และ Premium polish

## สิ่งที่ปรับ
- หน้า Swipe เลื่อนขึ้นลงได้เมื่อผู้ใช้ลากแนวตั้ง ขณะที่การปัดซ้าย/ขวาจะเริ่มทำงานเมื่อมีทิศทางแนวนอนชัดเจน
- ปรับหน้าแก้ไขสเปกให้เป็นธีม midnight-indigo แบบเดียวกับ Hangout
- หน้ารายงานผู้ใช้ย้ายไปแสดงผ่าน portal ที่ `document.body` พร้อม z-index สูงและพื้นที่ปลอดภัยบนมือถือ เพื่อลดปัญหาหน้าต่างซ้อนอยู่หลังส่วนอื่น
- การ์ด Swipe โหลดสถานะ Premium ผ่าน RPC ที่คืนค่าเพียง true/false แล้วแสดงป้าย Premium บนการ์ดเมื่อบัญชีมี subscription ที่ active และยังไม่หมดอายุ
- ตัวเลือก “ตอนนี้กำลังมองหาอะไร?” ใช้สีแยกกัน มีอีโมจิและแอนิเมชันลอยเบา ๆ พร้อมปิดแอนิเมชันเมื่อเปิด Reduce Motion

## ติดตั้ง
1. สำรองโปรเจกต์เดิม แล้วแตก ZIP นี้
2. นำไฟล์โปรเจกต์ไปอัปเดตใน GitHub repository เดิม โดยอย่าอัปโหลด `node_modules`
3. Supabase → SQL Editor → รัน `supabase/V96_PREMIUM_LIST_MUSIC_AND_HANGOUT_MAP.sql` เพื่อให้มี RPC สำหรับหน้า Premium และป้าย Premium บนการ์ด
4. รอ Vercel deploy เสร็จ แล้วกด Ctrl+F5 หรือปิดแล้วเปิด PWA ใหม่
5. ทดสอบ: เลื่อนหน้า Swipe ขึ้น/ลง, ปัดการ์ดซ้าย/ขวา, เปิด/ปิด Report, เปิดแก้ไขสเปก, และตรวจป้าย Premium บนบัญชีที่มี subscription active

## ข้อจำกัดการตรวจสอบ
ตรวจไวยากรณ์ JSX ด้วย TypeScript transpile แล้วไม่พบ syntax diagnostics แต่ไม่สามารถรัน `npm run build` ในสภาพแวดล้อมนี้ได้ เพราะแพ็กเกจ Vite ไม่พร้อมใช้งานและติดตั้งแบบ offline ไม่สำเร็จ จึงยังไม่อ้างว่าผ่าน build หรือทดสอบบน Supabase/Vercel จริง การแสดงป้าย Premium ต้องมีแถวใน `premium_subscriptions` ที่ `status = 'active'` และ `ends_at` ยังไม่หมดอายุ (หรือเป็น NULL)
