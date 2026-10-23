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
  const { data: queue, error } = await db.from('push_queue').select('id,user_id,type,attempts,title,body').is('processed_at',null).lt('attempts',3).order('created_at').limit(30)
  if (error) return new Response(error.message, { status: 500 })
  let processed = 0
  for (const item of queue || []) {
    // Atomically claim this attempt so overlapping cron invocations cannot send
    // the same queued notification at the same time.
    const { data: claimed, error: claimError } = await db.from('push_queue')
      .update({ attempts: item.attempts + 1 })
      .eq('id', item.id).eq('attempts', item.attempts)
      .is('processed_at', null).select('id').maybeSingle()
    if (claimError || !claimed) continue

    const { data: subs, error: subError } = await db.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id',item.user_id)
    if (subError) continue
    if (!['match', 'interest', 'message', 'admin_report', 'admin_domain'].includes(item.type)) {
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
      : item.type === 'message' ? 'คุณมีข้อความใหม่ในแชท'
      : item.type === 'admin_report' ? 'มีรายงานสมาชิกใหม่รอตรวจสอบ'
      : 'มีคำขอโดเมนมหาวิทยาลัยใหม่'
    const senderName = item.type === 'message' ? String(item.title || '').replace(/[\\p{Extended_Pictographic}\\uFE0F\\u200D]/gu, '').trim().slice(0, 70) : ''
    const pushTitle = item.type === 'message' && senderName ? senderName : adminType ? 'NISIT MATCH · Admin' : 'NISIT MATCH'
    const pushBody = item.type === 'message' && item.body ? String(item.body).slice(0, 180) : body
    const payload = JSON.stringify({ title: pushTitle, body: pushBody, type: item.type, url: item.type === 'message' || item.type === 'match' ? '/messages' : '/', tag: 'nisit-'+item.id })
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
    if (!transientFailure) {
      await db.from('push_queue').update({ processed_at: new Date().toISOString() })
        .eq('id', item.id).is('processed_at', null)
    }
    processed++
  }
  // Broadcast announcements are queued separately from match notifications.
  const { data: announcements, error: announceError } = await db.from('nm_announcement_push_queue')
    .select('announcement_id,user_id,attempts').is('processed_at',null).lt('attempts',3).limit(30)
  if (announceError) return Response.json({ processed, announcementError: announceError.message }, { status: 500 })
  for (const job of announcements || []) {
    // Atomically claim before sending; concurrent workers cannot claim the same attempt.
    const { data: claimed, error: claimError } = await db.from('nm_announcement_push_queue')
      .update({ attempts: job.attempts + 1 })
      .eq('announcement_id', job.announcement_id).eq('user_id', job.user_id)
      .eq('attempts', job.attempts).is('processed_at', null)
      .select('announcement_id').maybeSingle()
    if (claimError || !claimed) continue
    const { data: announcement } = await db.from('nm_announcements')
      .select('title,body').eq('id',job.announcement_id).maybeSingle()
    if (!announcement) {
      await db.from('nm_announcement_push_queue').update({ processed_at: new Date().toISOString() })
        .eq('announcement_id',job.announcement_id).eq('user_id',job.user_id)
      continue
    }
    const { data: subscriptions, error: subscriptionError } = await db.from('push_subscriptions')
      .select('endpoint,p256dh,auth').eq('user_id',job.user_id)
    if (subscriptionError) continue
    let retry = false
    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification({ endpoint:sub.endpoint, keys:{p256dh:sub.p256dh,auth:sub.auth} },
          JSON.stringify({ title:announcement.title, body:announcement.body, tag:'announcement-'+job.announcement_id, url:'/announcements' }))
      } catch (err) {
        const status = (err as {statusCode?:number}).statusCode
        if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('endpoint',sub.endpoint)
        else retry = true
      }
    }
    await db.from('nm_announcement_push_queue').update({
      ...(retry ? {} : {processed_at:new Date().toISOString()})
    }).eq('announcement_id',job.announcement_id).eq('user_id',job.user_id).is('processed_at',null)
    processed++
  }
  return Response.json({ processed })
})
