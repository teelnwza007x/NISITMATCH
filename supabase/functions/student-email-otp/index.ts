import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...cors,'Content-Type':'application/json'}})
const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')
Deno.serve(async req => {
 if(req.method==='OPTIONS') return new Response(null,{headers:cors})
 if(req.method!=='POST') return reply({error:'Method not allowed'},405)
 try {
  const url=Deno.env.get('SUPABASE_URL')!, anon=Deno.env.get('SUPABASE_ANON_KEY')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const mailjetKey=Deno.env.get('MAILJET_API_KEY'), mailjetSecret=Deno.env.get('MAILJET_SECRET_KEY'), sender=Deno.env.get('OTP_FROM_EMAIL'), pepper=Deno.env.get('OTP_PEPPER')
  if(!pepper || !mailjetKey || !mailjetSecret || !sender) return reply({error:'ยังไม่ได้ตั้งค่าระบบส่งอีเมล OTP'},503)
  const auth=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('Authorization')||''}}})
  const {data:{user},error:authError}=await auth.auth.getUser()
  if(authError||!user) return reply({error:'กรุณาเข้าสู่ระบบ'},401)
  const db=createClient(url,service)
  const {action,university_id,email,code}=await req.json()
  if(!['send','verify','request_domain'].includes(action)||typeof university_id!=='string'||typeof email!=='string') return reply({error:'ข้อมูลไม่ถูกต้อง'},400)
  const mail=email.trim().toLowerCase(), domain=mail.split('@')[1]
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return reply({error:'อีเมลไม่ถูกต้อง'},400)
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
  if(!allowed) return reply({error:'ยังไม่รองรับโดเมนอีเมลนี้สำหรับมหาวิทยาลัยที่เลือก กรุณาติดต่อผู้ดูแล'},400)
  const now=Date.now()
  const {data:old}=await db.from('student_email_otp_challenges').select('*').eq('user_id',user.id).maybeSingle()
  if(action==='send') {
   if(old && now-new Date(old.sent_at).getTime()<60000) return reply({error:'กรุณารอ 60 วินาทีก่อนขอรหัสใหม่'},429)
   const bytes=crypto.getRandomValues(new Uint32Array(1)); const otp=String(bytes[0]%1000000).padStart(6,'0')
   const code_hash=await hash(`${user.id}:${mail}:${otp}:${pepper}`)
   const {error:saveError}=await db.from('student_email_otp_challenges').upsert({user_id:user.id,university_id,email:mail,code_hash,expires_at:new Date(now+10*60000).toISOString(),sent_at:new Date(now).toISOString(),attempts:0},{onConflict:'user_id'})
   if(saveError) throw saveError
   // Mailjet Send API v3.1 uses Basic auth with API key + secret key.
   // OTP_FROM_EMAIL must be an active, verified sender address in Mailjet.
   const sent=await fetch('https://api.mailjet.com/v3.1/send',{
    method:'POST',
    headers:{
     Authorization:`Basic ${btoa(`${mailjetKey}:${mailjetSecret}`)}`,
     'Content-Type':'application/json'
    },
    body:JSON.stringify({Messages:[{
     From:{Email:sender,Name:'Nisit Match'},
     To:[{Email:mail}],
     Subject:'Nisit Match — รหัสยืนยันอีเมลมหาวิทยาลัย',
     TextPart:`รหัสยืนยันของคุณคือ ${otp}\nรหัสหมดอายุใน 10 นาที หากคุณไม่ได้ร้องขอ ให้ละเว้นอีเมลนี้`
    }]})
   })
   if(!sent.ok) {
    const detail=(await sent.text()).slice(0,1000)
    console.error('Mailjet send failed',sent.status,detail)
    await db.from('student_email_otp_challenges').delete().eq('user_id',user.id)
    return reply({error:'ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Mailjet และลองอีกครั้ง'},502)
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
  await db.from('student_email_otp_challenges').delete().eq('user_id',user.id)
  return reply({ok:true})
 } catch(e) { console.error(e); return reply({error:'ระบบยืนยันขัดข้อง กรุณาลองใหม่'},500) }
})
