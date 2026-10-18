# NISIT MATCH v70 — Match Portrait & Swipe Smoothness

- หน้า It's a Match: แก้รูปเป็นกรอบสี่เหลี่ยมมุมโค้งอัตราส่วน 3:4 และบังคับรูปเต็มกรอบด้วย object-fit: cover โดยไม่รับ CSS avatar วงกลมเดิม
- Like/Pass: ลดช่วงรอเอฟเฟกต์ 420ms เป็น 175ms; ให้การ์ดออก 360ms พร้อมส่งคำขอฐานข้อมูล; ลบเวลารอ 650ms ที่ซ้อนหลังคำขอ
- คง Daily Picks ที่ถูกลบตั้งแต่ v68 และฟีเจอร์ v69 ทั้งหมด
- ไม่ต้องรัน SQL ใหม่
- สำรองโปรเจกต์ เก็บ .env.local, .git, deploy.bat แล้วรัน npm ci และ npm run build
- ต้องทดสอบการตอบสนองบน iPhone จริงและเครือข่ายช้า; ผล build ระบุในคำตอบ
