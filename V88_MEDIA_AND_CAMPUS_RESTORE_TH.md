# NISIT MATCH v88 — Campus & Profile Media patch

## สิ่งที่แก้
- คืนตัวเลือกยืนยันมหาวิทยาลัยที่ร้องขอ: KMITL, KU, CU, TU, KMUTT, KMUTNB, BUU, SWU, SU รวมถึง SPU และ BU
- แสดงโดเมนตามมหาวิทยาลัยที่เลือก และตรวจโดเมนตรงตัวก่อนขอ OTP
- โดเมนสำหรับนิสิต/นักศึกษาที่พบจากหน้าทางการ: `student.chula.ac.th`, `dome.tu.ac.th`, `ku.th`, `live.ku.th`, `mail.kmutt.ac.th`, `email.kmutnb.ac.th`, `go.buu.ac.th`, `my.buu.ac.th`, `g.swu.ac.th`, `su.ac.th`, `silpakorn.edu`, `spumail.net`, `spulive.net`, `bumail.net` และ `kmitl.ac.th` ที่ใช้เป็นโดเมนของสถาบันในระบบเดิม
- วิดีโอโปรไฟล์ยังอยู่ในแกลเลอรีร่วมกันสูงสุด 6 รายการและแสดงในหน้าโปรไฟล์รายละเอียด
- แจ้งเตือนกรณี HEIC/HEIF ที่เบราว์เซอร์ไม่สามารถอ่านได้ แทนการปล่อยให้ครอปเปอร์ค้าง
- ปรับหน้าต่างครอปรูปให้ลากตามนิ้ว/เมาส์ทันที ไม่หน่วงจาก CSS transition และรองรับ safe-area บนมือถือ

## ติดตั้ง
1. ใช้ source ใน ZIP นี้แทน source เดิม (อย่าลบ Environment Variables บน Vercel)
2. Supabase → SQL Editor → รัน `supabase/V88_VERIFIED_CAMPUS_DOMAINS.sql`
3. `npm ci` แล้ว `npm run build`
4. Deploy ผ่าน GitHub/Vercel

SQL นี้ไม่ลบบัญชี โปรไฟล์ หรือประวัติการยืนยัน แต่จะปิดโดเมนเดิมทั้งหมดใน `student_email_domains` แล้วเปิดเฉพาะ allow-list ที่ระบุในไฟล์นี้ โปรดตรวจรายการ SELECT ท้ายไฟล์ก่อนนำขึ้น production

## ข้อจำกัดที่ควรรู้
- การรับ OTP ยืนยันได้ว่าผู้ใช้ควบคุมกล่องเมลนั้นได้ ไม่ได้พิสูจน์สถานะนักศึกษาปัจจุบันโดยอัตโนมัติ
- Live Photo ของ Apple เป็นชุดภาพ HEIC + วิดีโอ MOV ซึ่ง file picker บางตัวไม่ได้ส่งออกทั้งคู่พร้อมกัน แนะนำให้เปิด Photos แล้วใช้ Save as Video เพื่อเพิ่ม MOV เป็น 1 ช่อง หรือแปลงภาพ HEIC เป็น JPG
- ไฟล์วิดีโอถูกจำกัด 25MB และต้องเป็น MIME type ที่ Storage bucket อนุญาต (MP4/MOV/WebM ตาม SQL v76) หาก bucket จริงต่างจากนี้ต้องตรวจ Storage settings เพิ่ม
- ยังต้องทดสอบ `npm run build`, การอัปโหลดจริง และ OTP บน Supabase ของโปรเจกต์ก่อน production; ไม่อ้างว่าทดสอบบนอุปกรณ์จริงแล้ว

## แหล่งข้อมูลโดเมนทางการที่ตรวจพบ
- Chulalongkorn IT: https://www.it.chula.ac.th/service/email-student/
- Kasetsart new student guide: https://www.admission.ku.ac.th/media/announcements/2026/05/20/69-KU86-Register-Official-EN.pdf
- Thammasat student guide: https://www.tep.engr.tu.ac.th/current-students/new-students-2026
- KMUTT Computer Center: https://cc.kmutt.ac.th/en/email.html
- KMUTNB student email: https://mail.kmutnb.ac.th/
- Burapha student email: https://email.buu.ac.th/
- SWU Account: https://account.swu.ac.th/
- Silpakorn portal: https://portal.su.ac.th/index1.php
- SPU Students: https://www.spu.ac.th/students/email-spu-%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88/
- Bangkok University FAQ: https://faq.bu.ac.th/wordpress/channelnews/
- KMITL official contact: https://kmitl.ac.th/contact-us

Some official pages describe staff and student domains separately. This allow-list uses student-specific domains where a source identified them; `kmitl.ac.th` is retained from the existing project allow-list and should be confirmed with KMITL IT before treating it as student-only.
