NISIT MATCH V117: แก้เลขแจ้งเตือนข้อความค้างและฝัง Stripe Checkout ในหน้า Premium

ก่อน Deploy: เพิ่ม Environment Variable ชื่อ STRIPE_PUBLISHABLE_KEY ใน Vercel Production โดยใช้ pk_live_... จาก Stripe Live Dashboard (ไม่ใช่ rk_live_). อย่าใส่คีย์ลับใน VITE_.

ข้อควรทราบ: PromptPay อาจต้องเปิดแอปธนาคารเพื่อยืนยันการจ่าย แม้แบบฟอร์มอยู่ในเว็บ; Premium เปิดหลัง webhook ยืนยัน paid เท่านั้น. ควรทดสอบจริงอย่างระมัดระวัง.
