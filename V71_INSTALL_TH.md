# NISIT MATCH v71 — Instant Swipe Engine

รุ่นนี้ต่อยอดจากซอร์ส v70 ที่ได้รับ ไม่ใช่โปรเจกต์ใหม่ โดยเน้นแก้จังหวะ Like / Pass ที่หน่วงจากการรอ Supabase

## สิ่งที่เปลี่ยน

- **Instant Swipe Engine 2.0:** เริ่มแอนิเมชันออกการ์ดทันที และนำโปรไฟล์ออกจากรายการแบบ Optimistic UI ก่อนรอเครือข่าย
- **ป้องกันกดซ้ำ:** ล็อกการ์ดทันทีใน UI และมีชุด ID ป้องกันการส่งคำขอ Like/Pass ซ้ำระหว่างคำขอยังทำงาน
- **Rollback:** หาก insert ไม่สำเร็จ จะคืนโปรไฟล์กลับเข้ารายการและแจ้งข้อผิดพลาด ไม่แสดงว่าสำเร็จ
- **Undo / Match:** เก็บ RPC `v60_undo_swipe` และ trigger `on_like()` เดิมไว้ การตรวจ Match ยังคงอ่านจากตาราง `matches` หลัง Like สำเร็จ
- **โหลดรูปไว้ล่วงหน้า:** warm cache รูปของโปรไฟล์ปัจจุบัน รูปเพิ่มเติม และโปรไฟล์ถัดไปโดยไม่บล็อกการวาดหน้า
- **รูปเปลี่ยนแบบ Fade:** เพิ่ม transition เบาสำหรับรูป พร้อมกฎ `prefers-reduced-motion`
- รักษาฟีเจอร์แชต เสียง รีแอ็กชัน Super Like และหน้าจอเดิมจาก v70 ไว้
- ไม่มี Daily Picks และไม่มีการเพิ่ม Emoji ใหม่ใน UI

## ติดตั้งบน Windows CMD

1. สำรองโฟลเดอร์โปรเจกต์เดิมก่อน
2. แตก ZIP ไปยังโฟลเดอร์โปรเจกต์ที่ต้องการ
3. สร้าง `.env.local` เองจาก `.env.example` แล้วใส่ค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ของโปรเจกต์ Supabase จริง **ห้ามนำไฟล์ `.env` ที่มีความลับไปเผยแพร่**
4. เปิด CMD ในโฟลเดอร์ที่มี `package.json` แล้วรัน:

```bat
npm ci
npm run build
npm run dev
```

## Deploy ไป Vercel

ตั้งค่า Environment Variables ต่อไปนี้ใน Vercel Project Settings สำหรับ Production (และ Preview ถ้าต้องการ):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

จากนั้นรันใน CMD:

```bat
npm ci
npm run build
npx vercel --prod
```

หากใช้การ Deploy จาก GitHub ให้ commit/push โค้ด v71 แล้วรอ Vercel Build ใหม่แทนการใช้ `npx vercel --prod` ได้

## SQL / Supabase

ไม่มี SQL migration ใหม่ที่จำเป็นสำหรับการปรับ Optimistic UI นี้ และไม่ควรรัน SQL เดิมซ้ำโดยไม่ตรวจสอบฐานข้อมูลก่อน ระบบยังพึ่งพาตาราง `likes`, `matches`, ฟังก์ชัน `v60_undo_swipe` และ trigger `on_like()` ที่ติดตั้งจากรุ่นก่อนหน้าอยู่แล้ว

ก่อนเปิดใช้งานจริง ให้ตรวจ RLS/policies ของตารางเดิมใน Supabase และอย่าเปิดสิทธิ์เขียนแบบสาธารณะเพื่อแก้ปัญหา UI

## ข้อจำกัดและรายการทดสอบ

- แอนิเมชันจะตอบสนองก่อนผลจากฐานข้อมูล แต่หากบันทึกล้มเหลวโปรไฟล์จะคืนกลับและแสดงข้อความแจ้งเตือน
- ยังต้องทดสอบบน iPhone/Safari จริง ทั้งเครือข่ายช้า/หลุด, Match พร้อมกัน, Undo ภายใน 2 นาที, Super Like, ไมโครโฟน, keyboard และ PWA หลัง Deploy
- การ build สำเร็จไม่ใช่หลักฐานว่าการทำงานบนอุปกรณ์จริงหรือสิทธิ์ RLS ถูกต้อง ต้องทดสอบด้วยบัญชีจริงในสภาพแวดล้อมทดสอบก่อน
