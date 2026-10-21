import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const url = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const secret = Deno.env.get('PUSH_DISPATCH_SECRET')!
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)
const db = createClient(url, serviceKey, { auth: { persistSession: false } })
Deno.serve(async (req) => {
  if (req.method !== 'POST' || !secret || req.headers.get('x-dispatch-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { data: queue, error } = await db.from('push_queue').select('id,user_id,type,attempts').is('processed_at',null).lt('attempts',3).order('created_at').limit(30)
  if (error) return new Response(error.message, { status: 500 })
  let processed = 0
  for (const item of queue || []) {
    const { data: subs, error: subError } = await db.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id',item.user_id)
    if (subError) continue
    if (!['match', 'interest', 'admin_report', 'admin_domain'].includes(item.type)) {
      await db.from('push_queue').update({ processed_at: new Date().toISOString() }).eq('id', item.id)
      continue
    }
    // Respect opt-out for match notifications. Missing preferences mean
    // defaults apply; the optional table is installed by social_features_admin_v1.sql.
    if (item.type === 'match') {
      const { data: preference, error: preferenceError } = await db.from('user_social_preferences')
        .select('notify_matches').eq('user_id', item.user_id).maybeSingle()
      if (!preferenceError && preference?.notify_matches === false) {
        await db.from('push_queue').update({ processed_at: new Date().toISOString() }).eq('id', item.id)
        continue
      }
    }
    const adminType = item.type === 'admin_report' || item.type === 'admin_domain'
    if (adminType) {
      const { data: admin } = await db.from('profiles').select('is_admin').eq('id', item.user_id).maybeSingle()
      if (admin?.is_admin !== true) {
        await db.from('push_queue').update({ processed_at: new Date().toISOString() }).eq('id', item.id)
        continue
      }
    }
    const body = item.type === 'match' ? 'คุณได้รับการแมตช์แล้ว!'
      : item.type === 'interest' ? 'มีคนกำลังสนใจคุณอยู่'
      : item.type === 'admin_report' ? 'มีรายงานสมาชิกใหม่รอตรวจสอบ'
      : 'มีคำขอโดเมนมหาวิทยาลัยใหม่'
    const payload = JSON.stringify({ title: adminType ? 'NISIT MATCH · Admin' : 'NISIT MATCH', body, tag: 'nisit-'+item.id })
    let transientFailure = false
    for (const s of subs || []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh:s.p256dh, auth:s.auth } }, payload)
      } catch (err) {
        const status = (err as {statusCode?:number}).statusCode
        if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('endpoint',s.endpoint)
        else transientFailure = true
      }
    }
    await db.from('push_queue').update({ attempts: item.attempts+1, ...(transientFailure ? {} : {processed_at:new Date().toISOString()}) }).eq('id',item.id).is('processed_at',null)
    processed++
  }
  return Response.json({ processed })
})
