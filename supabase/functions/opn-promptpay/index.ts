import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})
const amounts:Record<string,number>={weekly:3900,monthly:11900}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors})
 if(req.method!=='POST')return json({error:'Method not allowed'},405)
 try{
  const key=Deno.env.get('OMISE_SECRET_KEY')||''
  if(!key.startsWith('skey_test_'))return json({error:'Test key required. Live payments are disabled.'},503)
  const header=req.headers.get('Authorization')||''
  if(!header.startsWith('Bearer '))return json({error:'Sign in required'},401)
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const auth=createClient(url,anon,{global:{headers:{Authorization:header}}})
  const {data:{user},error:authError}=await auth.auth.getUser()
  if(authError||!user)return json({error:'Invalid session'},401)
  const body=await req.json().catch(()=>({}))
  const db=createClient(url,service)
  const authValue='Basic '+btoa(key+':')
  if(body.action==='status'){
   if(typeof body.charge_id!=='string'||!/^chrg_test_[a-zA-Z0-9]+$/.test(body.charge_id))return json({error:'Invalid charge ID'},400)
   const {data:payment,error}=await db.from('opn_promptpay_payments').select('charge_id,plan,amount,status').eq('charge_id',body.charge_id).eq('user_id',user.id).maybeSingle()
   if(error||!payment)return json({error:'Payment not found'},404)
   const response=await fetch('https://api.omise.co/charges/'+encodeURIComponent(payment.charge_id),{headers:{Authorization:authValue}})
   if(!response.ok)return json({error:'Payment provider unavailable'},502)
   const charge=await response.json()
   if(charge.livemode!==false||charge.amount!==payment.amount||charge.currency!=='THB')return json({error:'Charge verification failed'},502)
   const status=['successful','failed','expired'].includes(charge.status)?charge.status:'pending'
   await db.from('opn_promptpay_payments').update({status,updated_at:new Date().toISOString()}).eq('charge_id',payment.charge_id).eq('user_id',user.id)
   let testPremiumExpiresAt=null
   if(status==='successful'&&charge.paid===true){const {data:grant,error:grantError}=await db.rpc('fulfill_opn_test_payment',{p_charge_id:payment.charge_id});if(grantError)return json({error:'Test entitlement processing failed'},500);testPremiumExpiresAt=grant?.[0]?.expires_at||null}
   return json({ok:true,test:true,charge_id:payment.charge_id,status,paid:charge.paid===true,plan:payment.plan,amount:payment.amount,qr_url:charge.source?.scannable_code?.image?.download_uri||null,expires_at:charge.expires_at,test_premium_expires_at:testPremiumExpiresAt,premium_unlocked:false})
  }
  if(body.action!=='create'||!Object.hasOwn(amounts,body.plan))return json({error:'Invalid action or plan'},400)
  const amount=amounts[body.plan]
  const params=new URLSearchParams({'amount':String(amount),'currency':'THB','source[type]':'promptpay','description':'NISIT MATCH Premium TEST '+body.plan})
  const response=await fetch('https://api.omise.co/charges',{method:'POST',headers:{Authorization:authValue,'Content-Type':'application/x-www-form-urlencoded'},body:params})
  const charge=await response.json()
  if(!response.ok||charge.object!=='charge'||charge.livemode!==false||charge.amount!==amount||!charge.id?.startsWith('chrg_test_'))return json({error:'Unable to create test charge'},502)
  const {error:saveError}=await db.from('opn_promptpay_payments').insert({user_id:user.id,charge_id:charge.id,plan:body.plan,amount,status:'pending'})
  if(saveError){console.error('Payment record error',saveError.message);return json({error:'Unable to save test payment; do not pay this charge'},500)}
  // Some PromptPay responses populate the scannable code after charge creation. Retrieve once more.
  let qrUrl=charge.source?.scannable_code?.image?.download_uri||null
  if(!qrUrl){const qrResponse=await fetch('https://api.omise.co/charges/'+encodeURIComponent(charge.id),{headers:{Authorization:authValue}});if(qrResponse.ok){const fresh=await qrResponse.json();if(fresh.livemode===false&&fresh.amount===amount&&fresh.currency==='THB')qrUrl=fresh.source?.scannable_code?.image?.download_uri||null}}
  return json({ok:true,test:true,charge_id:charge.id,amount,status:charge.status,expires_at:charge.expires_at,qr_url:qrUrl,premium_unlocked:false})
 }catch(e){console.error('opn-promptpay',e instanceof Error?e.message:'unknown');return json({error:'Payment service error'},500)}
})
