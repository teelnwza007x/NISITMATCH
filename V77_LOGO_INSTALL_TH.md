# NISIT MATCH v77 — Logo Integration (ภาษาไทย)

เวอร์ชันนี้นำชุดไอคอน `NISIT-MATCH-Apple-Web-PWA-Icons.zip` มาใส่ในโปรเจกต์ v76 ทั้งหน้า Landing, หน้า Login/Register, โลโก้ในแถบเมนูด้านใน, หน้า Discovery, favicon, Apple Touch Icon, PWA manifest และไอคอนแจ้งเตือน

## ติดตั้ง
1. แตก ZIP v77 ลงในโฟลเดอร์ใหม่
2. เปิด CMD ในโฟลเดอร์ที่มี `package.json`
3. รัน:
   ```cmd
   npm ci
   npm run build
   ```
4. ถ้าผ่าน ให้นำโปรเจกต์ขึ้น GitHub/Vercel ตามขั้นตอนเดิม
5. หลัง Deploy หากไอคอนยังเป็นอันเก่า ให้ hard refresh เว็บ หรือถอด PWA ออกจากหน้าจอโฮมแล้วติดตั้งใหม่ เพราะ favicon/PWA icons อาจถูก cache

## จุดที่ใช้โลโก้
- หน้า Landing และ Footer ผ่านคอมโพเนนต์ Brand
- Sidebar ภายในแอปผ่านคอมโพเนนต์ Brand
- Login/Register modal
- Discovery Preferences
- Favicon / Apple Touch Icon / PWA manifest
- Push notification icon

## หมายเหตุ
- ใช้สีธีมของ PWA `#FABED2` ให้เข้ากับชุดไอคอนใหม่ โดยไม่เปลี่ยนโครงสร้าง Supabase หรือฟีเจอร์แอป
- `nisit-match-mark.png` เป็นเครื่องหมายย่อที่ตัดจากส่วนสัญลักษณ์ของไอคอนที่คุณส่งมา เพื่อให้อ่านออกเมื่อแสดงขนาดเล็ก
- ต้องยืนยัน Build บนเครื่องคุณด้วย `npm ci` และ `npm run build` ก่อน Deploy; ยังไม่ควรถือว่าทดสอบเว็บจริงแล้ว
