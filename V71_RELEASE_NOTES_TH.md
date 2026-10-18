# NISIT MATCH v71 — Release Notes

## เป้าหมายของรุ่นนี้
แก้ความหน่วงขณะกด Like / Pass โดยให้ UI เริ่มตอบสนองก่อนการตอบกลับจาก Supabase พร้อมกลไกคืนการ์ดเมื่อบันทึกล้มเหลว

## รายการเปลี่ยนแปลง
- เพิ่ม Optimistic UI สำหรับ Like / Pass
- ล็อกการ์ดทันทีเพื่อป้องกันการแตะซ้ำ และป้องกันคำขอซ้ำต่อโปรไฟล์เดียวกัน
- คืนโปรไฟล์พร้อมแจ้งเตือนเมื่อการบันทึกล้มเหลว
- รักษาการตรวจ Match ผ่านตารางเดิมและ Undo ผ่าน RPC `v60_undo_swipe`
- preload รูปโปรไฟล์ถัดไปและรูปเพิ่มเติม
- เพิ่ม fade transition แบบเบาสำหรับภาพและรองรับ `prefers-reduced-motion`
- ไม่มี SQL migration ใหม่
- ไม่มี Daily Picks

## สถานะการตรวจสอบในสภาพแวดล้อมผู้พัฒนา
- ตรวจไวยากรณ์ JSX ด้วย Babel parser: ผ่านก่อนการแก้เล็กน้อยล่าสุด; ต้องตรวจซ้ำหลังดาวน์โหลด ZIP
- `npm ci`: ไม่สำเร็จในสภาพแวดล้อมนี้ เพราะ npm registry/network ไม่พร้อมและ cache ขาดแพ็กเกจ (`ENOTCACHED`)
- `npm run build`: ไม่สำเร็จในสภาพแวดล้อมนี้ เพราะแพ็กเกจ optional binary `@rollup/rollup-linux-x64-gnu` ไม่มีใน `node_modules` ที่แนบมากับ ZIP ต้นฉบับ
- ดังนั้น **ยังไม่มีผลยืนยันว่า Build ผ่าน** ให้รัน `npm ci` และ `npm run build` ในเครื่อง Windows ที่เชื่อมต่ออินเทอร์เน็ตก่อน Deploy

## ต้องทดสอบก่อน Production
- Like / Pass ทั้งเมื่อเครือข่ายเร็ว ช้า และขาดการเชื่อมต่อ
- Like แล้ว Match กับการตรวจจับ Match จริง
- Undo ภายใน 2 นาที และกรณีมี Match แล้ว
- Super Like และโควตาประจำวัน
- Safari iOS: gesture, safe area, keyboard, audio recording, PWA
- ตรวจ RLS และ trigger ใน Supabase โดยใช้บัญชีทดสอบสองบัญชี
