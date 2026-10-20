import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors})
 if(req.method!=='POST')return respond({error:'Method not allowed'},405)
 try{
  const authHeader=req.headers.get('Authorization')||''
  if(!authHeader.startsWith('Bearer '))return respond({error:'Unauthorized'},401)
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const auth=createClient(url,anon,{global:{headers:{Authorization:authHeader}}})
  const {data:{user},error:authError}=await auth.auth.getUser()
  if(authError||!user)return respond({error:'Unauthorized'},401)
  const db=createClient(url,service)
  const {data:admin,error:adminError}=await db.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(adminError||admin?.is_admin!==true)return respond({error:'Forbidden'},403)
  const body=await req.json().catch(()=>({}))
  const page=Math.max(0,Math.min(10000,Number.isInteger(body.page)?body.page:0))
  const limit=Math.max(1,Math.min(100,Number.isInteger(body.limit)?body.limit:30))
  const type=['university_otp','signup_verify','password_reset'].includes(body.type)?body.type:null
  const status=['attempted','accepted','failed','delivered','bounced'].includes(body.status)?body.status:null
  const search=typeof body.search==='string'?body.search.trim().slice(0,150):''
  if(body.mode==='domain_requests'){
    const query=typeof body.search==='string'?body.search.trim().slice(0,100):''
    let requests=db.from('campus_domain_requests').select('university_name,email_domain,user_id,created_at',{count:'exact'}).order('created_at',{ascending:false}).range(page*limit,page*limit+limit-1)
    if(query){const safe=query.replace(/[%,()]/g,'');if(safe)requests=requests.or(`university_name.ilike.%${safe}%,email_domain.ilike.%${safe}%`)}
    const {data,error,count}=await requests
    if(error){console.error('domain requests query',error.message);return respond({error:'Unable to load university domain requests'},500)}
    return respond({ok:true,rows:data||[],total:count||0})
  }
  let q=db.from('email_delivery_logs').select('id,recipient_email,email_type,provider,status,provider_message_id,error_message,created_at',{count:'exact'}).order('created_at',{ascending:false}).range(page*limit,page*limit+limit-1)
  if(type)q=q.eq('email_type',type)
  if(status)q=q.eq('status',status)
  if(search)q=q.ilike('recipient_email',`%${search.replace(/[%,()]/g,'')}%`)
  const {data,error,count}=await q
  if(error)throw error
  const since=new Date(Date.now()-86400000).toISOString()
  const {data:recent,error:statsError}=await db.from('email_delivery_logs').select('status').gte('created_at',since).limit(10000)
  if(statsError)throw statsError
  return respond({ok:true,rows:data||[],total:count||0,stats:{total24h:recent?.length||0,accepted24h:recent?.filter(x=>x.status==='accepted').length||0,failed24h:recent?.filter(x=>x.status==='failed').length||0},statsCapped:(recent?.length||0)===10000})
 }catch(e){console.error('admin-email-logs',e instanceof Error?e.message:'unknown');return respond({error:'Unable to load logs'},500)}
})
