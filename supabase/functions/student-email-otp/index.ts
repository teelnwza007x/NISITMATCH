import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.10.1'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...cors,'Content-Type':'application/json'}})
const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')
Deno.serve(async req => {
 if(req.method==='OPTIONS') return new Response(null,{headers:cors})
 if(req.method!=='POST') return reply({error:'Method not allowed'},405)
 try {
  const url=Deno.env.get('SUPABASE_URL')!, anon=Deno.env.get('SUPABASE_ANON_KEY')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sender=Deno.env.get('GMAIL_USER'), password=Deno.env.get('GMAIL_APP_PASSWORD'), pepper=Deno.env.get('OTP_PEPPER')
  if(!pepper || !sender || !password) return reply({error:'ยังไม่ได้ตั้งค่าระบบส่งอีเมล OTP'},503)
  const auth=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}})
  const {data:{user},error:authError}=await auth.auth.getUser()
  if(authError||!user) return reply({error:'กรุณาเข้าสู่ระบบ'},401)
  const db=createClient(url,service)
  const {action,university_id,email,code}=await req.json()
  if(!['send','verify','request_domain'].includes(action)||typeof university_id!=='string'||typeof email!=='string') return reply({error:'ข้อมูลไม่ถูกต้อง'},400)
  const mail=email.trim().toLowerCase(), domain=mail.split('@')[1]
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return reply({error:'อีเมลไม่ถูกต้อง'},400)
  // A verified university and address are immutable for this account.
  const {data:locked,error:lockError}=await db.from('student_verifications').select('status,university_id,verified_email').eq('user_id',user.id).maybeSingle()
  if(lockError) throw lockError
  if(locked?.status==='verified') return reply({error:'บัญชีนี้ยืนยันแล้ว ไม่สามารถเปลี่ยนมหาวิทยาลัยหรืออีเมลยืนยันได้'},409)
  if(action==='request_domain') {
   // Request is not verification: never issue a badge or OTP for an unapproved domain.
   const {data:existing,error:lookupError}=await db.from('student_domain_requests').select('requested_at').eq('user_id',user.id).eq('university_id',university_id).eq('domain',domain).maybeSingle()
   if(lookupError) throw lookupError
   if(existing) return reply({ok:true,pending:true,message:'ส่งคำขอไว้แล้ว กรุณารอผู้ดูแลตรวจสอบโดเมน'})
   const {error:requestError}=await db.from('student_domain_requests').insert({user_id:user.id,university_id,domain})
   if(requestError) throw requestError
   return reply({ok:true,pending:true,message:'รับคำขอเพิ่มโดเมนแล้ว ผู้ดูแลต้องตรวจสอบก่อนเปิดใช้ OTP'})
  }
  const {data:allowed}=await db.from('student_email_domains').select('domain').eq('domain',domain).eq('university_id',university_id).eq('enabled',true).maybeSingle()
  if(!allowed) return reply({error:'โดเมนอีเมลนี้ไม่อยู่ในรายการที่รองรับสำหรับมหาวิทยาลัยที่เลือก'},400)
  // One verified mailbox may belong to only one account.
  const {data:usedEmail,error:usedEmailError}=await db.from('student_verifications').select('user_id').ilike('verified_email',mail).eq('status','verified').neq('user_id',user.id).maybeSingle()
  if(usedEmailError) throw usedEmailError
  if(usedEmail) return reply({error:'อีเมลมหาวิทยาลัยนี้ถูกใช้ยืนยันกับบัญชีอื่นแล้ว ใช้ซ้ำไม่ได้'},409)
  if(locked && locked.status !== 'verified' && locked.university_id && locked.university_id !== university_id) {
   // Once a verification attempt has begun, keep the selected campus stable for that pending attempt.
   const {data:challenge}=await db.from('student_email_otp_challenges').select('user_id').eq('user_id',user.id).maybeSingle()
   if(challenge) return reply({error:'มีคำขอยืนยันค้างอยู่ กรุณาใช้มหาวิทยาลัยเดิมจนกว่าคำขอนี้จะหมดอายุ'},409)
  }
  const now=Date.now()
  const {data:old}=await db.from('student_email_otp_challenges').select('*').eq('user_id',user.id).maybeSingle()
  if(action==='send') {
   if(old && now-new Date(old.sent_at).getTime()<60000) return reply({error:'กรุณารอ 60 วินาทีก่อนขอรหัสใหม่'},429)
   const bytes=crypto.getRandomValues(new Uint32Array(1)); const otp=String(bytes[0]%1000000).padStart(6,'0')
   const code_hash=await hash(`${user.id}:${mail}:${otp}:${pepper}`)
   const {error:saveError}=await db.from('student_email_otp_challenges').upsert({user_id:user.id,university_id,email:mail,code_hash,expires_at:new Date(now+10*60000).toISOString(),sent_at:new Date(now).toISOString(),attempts:0},{onConflict:'user_id'})
   if(saveError) throw saveError
   const log=async(status:string,messageId:string|null=null,errorMessage:string|null=null)=>{
    const {error:logError}=await db.from('email_delivery_logs').insert({user_id:user.id,recipient_email:mail,email_type:'university_otp',provider:'gmail_smtp',status,provider_message_id:messageId,error_message:errorMessage})
    if(logError) console.error('Email log failed',logError.message)
   }
   try {
    const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:sender,pass:password},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000})
    const result=await transport.sendMail({
      from:`"NISIT MATCH" <${sender}>`,to:mail,
      subject:'NISIT MATCH — รหัสยืนยันอีเมลมหาวิทยาลัย',
      text:`รหัสยืนยันของคุณคือ ${otp}\nรหัสหมดอายุใน 10 นาที หากไม่ได้ร้องขอ โปรดละเว้นอีเมลนี้`,
      html:`<div style="background:#100c19;padding:32px 16px;font-family:Arial,sans-serif;color:white"><div style="max-width:520px;margin:auto;background:#24152e;border:1px solid #6c3a69;border-radius:18px;padding:32px"><b style="color:#ff70bf;letter-spacing:3px">NISIT MATCH</b><h1>ยืนยันอีเมลมหาวิทยาลัย</h1><p>กรอกรหัส 6 หลักนี้เพื่อยืนยันตัวตน</p><div style="font-size:38px;letter-spacing:9px;text-align:center;color:#ff83d2;background:#130d1e;padding:20px 0;border-radius:12px">${otp}</div><p>รหัสหมดอายุใน 10 นาที</p><small>หากไม่ได้ร้องขอ โปรดละเว้นอีเมลนี้</small></div></div>`
    })
    if(!result.accepted?.some((x:string)=>x.toLowerCase()===mail))throw new Error('SMTP recipient not accepted')
    await log('accepted',result.messageId||null)
   } catch(e) {
    console.error('Gmail SMTP send failed',e instanceof Error?e.message:'unknown')
    await log('failed',null,e instanceof Error?e.message.slice(0,300):'SMTP error')
    await db.from('student_email_otp_challenges').delete().eq('user_id',user.id)
    return reply({error:'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่'},502)
   }
   return reply({ok:true})
  }
  if(typeof code!=='string'||!/^\d{6}$/.test(code)) return reply({error:'กรุณากรอกรหัส 6 หลัก'},400)
  if(!old||old.email!==mail||old.university_id!==university_id||new Date(old.expires_at).getTime()<now) return reply({error:'รหัสหมดอายุ กรุณาขอรหัสใหม่'},400)
  if(old.attempts>=5) return reply({error:'ลองผิดเกินจำนวนครั้ง กรุณาขอรหัสใหม่'},429)
  await db.from('student_email_otp_challenges').update({attempts:old.attempts+1}).eq('user_id',user.id)
  if(await hash(`${user.id}:${mail}:${code}:${pepper}`)!==old.code_hash) return reply({error:'รหัสไม่ถูกต้อง'},400)
  const {error:saveError}=await db.from('student_verifications').upsert({user_id:user.id,email_domain:domain,verified_email:mail,university_id,status:'verified',requested_at:new Date().toISOString(),reviewed_at:new Date().toISOString()},{onConflict:'user_id'})
  if(saveError) throw saveError
  const {error:auditError}=await db.from('student_otp_verified_audit').upsert({user_id:user.id,university_id,verified_email:mail,verified_at:new Date().toISOString()},{onConflict:'user_id'})
  if(auditError){console.error('OTP audit write failed',auditError.message);return reply({error:'ยืนยันสำเร็จ แต่บันทึกหลักฐาน OTP ไม่สำเร็จ กรุณาติดต่อผู้ดูแล'},500)}
  await db.from('student_email_otp_challenges').delete().eq('user_id',user.id)
  return reply({ok:true})
 } catch(e) { console.error(e); return reply({error:'ระบบยืนยันขัดข้อง กรุณาลองใหม่'},500) }
})
