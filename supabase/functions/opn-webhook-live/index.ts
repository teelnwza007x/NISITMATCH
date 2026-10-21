import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// LIVE endpoint. Intentionally disabled until separate live key and webhook
// authentication are configured and the payment flow is audited.
// Never deploy this as a replacement for opn-webhook-test.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const enabled = Deno.env.get('OPN_LIVE_ENABLED') === 'true'
  if (!enabled) return new Response('Live payments disabled', { status: 503 })
  const key = Deno.env.get('OMISE_LIVE_SECRET_KEY') || ''
  if (!key.startsWith('skey_') || key.startsWith('skey_test_')) return new Response('Live key unavailable', { status: 503 })
  try {
    const body = await req.json()
    if (body?.object !== 'event' || !['charge.complete','charge.update','charge.expire'].includes(body.key)) return new Response('Ignored', { status: 200 })
    const chargeId = body?.data?.id
    if (typeof chargeId !== 'string' || !/^chrg_[a-zA-Z0-9]+$/.test(chargeId) || chargeId.startsWith('chrg_test_')) return new Response('Invalid charge', { status: 400 })
    const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const {data:payment,error}=await db.from('opn_live_payments').select('charge_id,user_id,plan,amount_satang').eq('charge_id',chargeId).maybeSingle()
    if (error) return new Response('Database error',{status:500})
    if (!payment) return new Response('Ignored unknown charge',{status:200})
    // Do not trust webhook-supplied status: fetch authoritative charge directly.
    const response=await fetch('https://api.omise.co/charges/'+encodeURIComponent(chargeId),{headers:{Authorization:'Basic '+btoa(key+':')}})
    if (!response.ok) return new Response('Provider unavailable',{status:502})
    const charge=await response.json()
    if (charge.object!=='charge'||charge.id!==chargeId||charge.livemode!==true||
        charge.amount!==payment.amount_satang||charge.currency!=='THB'||
        charge.source?.type!=='promptpay'||charge.paid===true&&charge.status!=='successful')
      return new Response('Charge mismatch',{status:400})
    const status=['successful','failed','expired'].includes(charge.status)?charge.status:'pending'
    const {error:updateError}=await db.from('opn_live_payments').update({status,updated_at:new Date().toISOString()}).eq('charge_id',chargeId)
    if(updateError)return new Response('Update failed',{status:500})
    if(status==='successful'&&charge.paid===true){
      const {error:grantError}=await db.rpc('fulfill_opn_live_payment',{p_charge_id:chargeId})
      if(grantError){console.error('Live fulfillment failed',grantError.message);return new Response('Fulfillment failed',{status:500})}
    }
    return new Response(JSON.stringify({ok:true,status}),{headers:{'Content-Type':'application/json'}})
  }catch(e){console.error('Opn live webhook error',e instanceof Error?e.message:'unknown');return new Response('Webhook error',{status:500})}
})
