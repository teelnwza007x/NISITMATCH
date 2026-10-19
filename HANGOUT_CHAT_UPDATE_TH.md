# Hangouts chat update
- เพิ่มสัญญาณกำลังพิมพ์ผ่าน Supabase Realtime Broadcast พร้อมจุดเคลื่อนไหวและชื่อผู้พิมพ์
- จำกัดความถี่ของสัญญาณและล้างสถานะอัตโนมัติ
- ปรับ layout ห้องแชทในหน้าข้อความให้ช่องพิมพ์อยู่ในกรอบ viewport ที่มองเห็น และแยกพื้นที่เลื่อนข้อความ
- ติดตาม visualViewport resize และ scroll เพื่อรองรับคีย์บอร์ดมือถือ

## ข้อจำกัดการทดสอบ
- ยังไม่ได้ทดสอบบน iOS/Android จริงหรือกับ Supabase Realtime หลายบัญชี
- Build ไม่สำเร็จในสภาพแวดล้อมนี้ เนื่องจาก node_modules ที่ติด ZIP ขาด native Rollup module (MODULE_NOT_FOUND)
- การแก้รอบนี้เน้น Hangouts chat ในหน้า Messages; ส่วนหน้าปัดโปรไฟล์ตามรายการก่อนหน้ายังไม่ได้แก้
