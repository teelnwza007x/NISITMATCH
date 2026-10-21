import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.10.1'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('')
Deno.serve(async req => {
 if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
 if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405)
 try {
  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sender = Deno.env.get('GMAIL_USER')
  const password = Deno.env.get('GMAIL_APP_PASSWORD')
  const pepper = Deno.env.get('OTP_PEPPER')
  if (!sender || !password || !pepper) return respond({ error: 'ระบบส่ง OTP ยังไม่ได้ตั้งค่า' }, 503)
  const auth = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } })
  const { data: { user }, error: authError } = await auth.auth.getUser()
  if (authError || !user?.email) return respond({ error: 'กรุณาเข้าสู่ระบบ' }, 401)
  const db = createClient(url, service)
  const email = user.email.trim().toLowerCase()
  const payload = await req.json()
  if (!['send', 'verify'].includes(payload.action)) return respond({ error: 'คำสั่งไม่ถูกต้อง' }, 400)
  const { data: verified } = await db.from('account_email_verifications').select('email').eq('user_id', user.id).maybeSingle()
  if (verified?.email === email) return respond({ ok: true, verified: true })
  const { data: previous, error: readError } = await db.from('account_email_otp_challenges').select('*').eq('user_id', user.id).maybeSingle()
  if (readError) throw readError
  const now = Date.now()
  if (payload.action === 'send') {
   if (previous && now - new Date(previous.sent_at).getTime() < 60000) return respond({ error: 'กรุณารอ 60 วินาทีก่อนขอรหัสใหม่' }, 429)
   const otp = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0')
   const code_hash = await digest([user.id, email, otp, pepper].join(':'))
   const { error: saveError } = await db.from('account_email_otp_challenges').upsert({ user_id: user.id, email, code_hash, expires_at: new Date(now + 600000).toISOString(), sent_at: new Date(now).toISOString(), attempts: 0 }, { onConflict: 'user_id' })
   if (saveError) throw saveError
   try {
    const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: sender, pass: password }, connectionTimeout: 15000 })
    const delivery = await transport.sendMail({ from: '"NISIT MATCH" <' + sender + '>', to: email, subject: 'NISIT MATCH - Account verification code', text: 'Your NISIT MATCH account verification code is ' + otp + '. It expires in 10 minutes.' })
    const accepted = delivery.accepted || []
    const rejected = delivery.rejected || []
    console.info('account-email-otp smtp result', { acceptedCount: accepted.length, rejectedCount: rejected.length, messageId: delivery.messageId, response: delivery.response })
    if (!accepted.some((recipient: string) => recipient.toLowerCase() === email) || rejected.some((recipient: string) => recipient.toLowerCase() === email)) {
     throw new Error('SMTP did not accept OTP recipient')
    }
   } catch (error) {
    await db.from('account_email_otp_challenges').delete().eq('user_id', user.id)
    throw error
   }
   return respond({ ok: true })
  }
  const code = String(payload.code || '')
  if (!/^\d{6}$/.test(code)) return respond({ error: 'กรุณากรอกรหัส 6 หลัก' }, 400)
  if (!previous || previous.email !== email || now > new Date(previous.expires_at).getTime()) return respond({ error: 'รหัสหมดอายุ กรุณาขอรหัสใหม่' }, 400)
  if (previous.attempts >= 5) return respond({ error: 'ลองผิดเกินกำหนด กรุณาขอรหัสใหม่' }, 429)
  const { data: claimed, error: claimError } = await db.from('account_email_otp_challenges').update({ attempts: previous.attempts + 1 }).eq('user_id', user.id).eq('attempts', previous.attempts).select('user_id')
  if (claimError) throw claimError
  if (!claimed?.length) return respond({ error: 'มีการส่งคำขอซ้ำ กรุณาลองใหม่' }, 409)
  if (await digest([user.id, email, code, pepper].join(':')) !== previous.code_hash) return respond({ error: 'รหัสไม่ถูกต้อง' }, 400)
  const { error: verifiedError } = await db.from('account_email_verifications').upsert({ user_id: user.id, email, verified_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (verifiedError) throw verifiedError
  await db.from('account_email_otp_challenges').delete().eq('user_id', user.id)
  return respond({ ok: true, verified: true })
 } catch (error) {
  console.error('account-email-otp:', error)
  return respond({ error: 'ระบบยืนยันอีเมลขัดข้อง กรุณาลองใหม่' }, 500)
 }
})
