# NISIT MATCH v64

ต่อยอดจาก v63: Cinematic Like/Pass, 4 chat reactions, Match celebration motion, real audio analyser visualizer (คงปุ่มและหลอดเดิม), photo fade, CSS reduced-motion.

## SQL
1. ต้องมี v56 และ v60 migrations เดิมก่อน
2. รัน `supabase/V64_CHAT_REACTIONS.sql` ใน Supabase SQL Editor เพื่ออนุญาต reaction ใหม่
3. ไม่มี SQL อื่นเพิ่มเติมสำหรับ v64

## Safety / stability
ระบบรายงาน/บล็อกเดิมยังอยู่ แต่ยังไม่ได้ยืนยัน RLS/Storage policies บน Supabase โปรเจกต์จริง จึงไม่ควรอ้างว่าผ่าน security audit แล้ว
Push ต้องตั้งค่า VAPID/Edge Function ตามคู่มือเดิม

## ติดตั้ง
สำรองโปรเจกต์; เก็บ `.env.local`, `.git`, `deploy.bat`; รัน `npm ci && npm run build`; ทดสอบบน Safari/iPhone ก่อน deploy
