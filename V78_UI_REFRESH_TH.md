# NISIT MATCH v78 — UI Refresh + Swipe Gesture

## สิ่งที่ปรับ
- ปรับหน้า Premium, คนที่กดใจ, ผู้เข้าชมโปรไฟล์ และ Hangout ให้เป็น glass UI โปร่งแสง มีแสงไล่สี เงานุ่ม และเอฟเฟกต์ hover/กด
- เพิ่ม animation ลอยเบา ๆ ให้จุดสำคัญ, shimmer, card entrance และปุ่มไล่สี โดยเคารพการตั้งค่า Reduce Motion ของอุปกรณ์
- ปรับการ์ดกิจกรรม Hangout, แพ็กเกจ Premium, การ์ดรายชื่อ และสถานะว่าง/ล็อกให้มีมิติขึ้นทั้งเดสก์ท็อปและมือถือ
- ปรับการ์ดปัดให้ยึด gesture แนวนอนและป้องกันหน้าเลื่อนขณะเริ่มปัด พร้อม preventDefault ใน pointer down/move
- คงเส้นทางข้อมูล Supabase, ปุ่ม, form, RSVP, Premium, visitor/likes และระบบปัดเดิมไว้ ไม่ได้เปลี่ยน schema หรือ key ของข้อมูล

## ติดตั้ง / ทดสอบ
1. แตก ZIP แล้วเปิดโฟลเดอร์ `nisit-match`
2. เปิด Terminal ในโฟลเดอร์นั้น
3. รัน `npm ci`
4. รัน `npm run build`
5. ถ้า build ผ่าน ให้ deploy ตาม workflow เดิมของโปรเจกต์

หมายเหตุ: รอบจัดทำนี้พยายามรัน `npm ci` แต่สภาพแวดล้อมหยุดตอบสนองก่อนจบ จึงยังยืนยันผล build ไม่ได้ กรุณารัน `npm run build` ในเครื่องก่อน deploy
