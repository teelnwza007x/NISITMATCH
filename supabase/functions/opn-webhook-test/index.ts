import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Test-only endpoint. No premium fulfillment or live-key support.
// Deploy with JWT verification OFF for provider-to-server callbacks.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  try {
    const secret = Deno.env.get('OMISE_SECRET_KEY') || ''
    if (!secret.startsWith('skey_test_')) return new Response('Test mode only', { status: 503 })
    const body = await req.json()
    if (body?.object !== 'event' || !['charge.complete', 'charge.update', 'charge.expire'].includes(body.key)) return new Response('Ignored', { status: 200 })
    const chargeId = body?.data?.id
    if (typeof chargeId !== 'string' || !/^chrg_test_[a-zA-Z0-9]+$/.test(chargeId)) return new Response('Invalid charge', { status: 400 })
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: payment, error } = await db.from('opn_promptpay_payments').select('charge_id,amount,user_id,status').eq('charge_id', chargeId).eq('is_test', true).maybeSingle()
    if (error) return new Response('Database error', { status: 500 })
    if (!payment) return new Response('Ignored unknown charge', { status: 200 })
    const response = await fetch('https://api.omise.co/charges/' + encodeURIComponent(chargeId), { headers: { Authorization: 'Basic ' + btoa(secret + ':') } })
    if (!response.ok) return new Response('Provider unavailable', { status: 502 })
    const charge = await response.json()
    if (charge.id !== chargeId || charge.object !== 'charge' || charge.livemode !== false || charge.amount !== payment.amount || charge.currency !== 'THB' || charge.source?.type !== 'promptpay') return new Response('Charge mismatch', { status: 400 })
    const status = ['successful','failed','expired'].includes(charge.status) ? charge.status : 'pending'
    const { error: updateError } = await db.from('opn_promptpay_payments').update({ status, updated_at: new Date().toISOString() }).eq('charge_id', chargeId).eq('is_test', true)
    if (updateError) return new Response('Database update failed', { status: 500 })
    if (status === 'successful' && charge.paid === true) {
      const { error: grantError } = await db.rpc('fulfill_opn_test_payment', { p_charge_id: chargeId })
      if (grantError) { console.error('Test entitlement error', grantError.message); return new Response('Test entitlement failed', { status: 500 }) }
    }
    return new Response(JSON.stringify({ ok: true, test: true, status, premium_unlocked: false }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('opn-webhook-test', error instanceof Error ? error.message : 'Unknown error')
    return new Response('Webhook processing failed', { status: 500 })
  }
})
