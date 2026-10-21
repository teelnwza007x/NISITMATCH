import React,{useEffect,useState} from 'react'
import {supabase} from '../supabase'
const plans=[{id:'weekly',name:'รายสัปดาห์ · 7 วัน',price:39},{id:'monthly',name:'รายเดือน · 30 วัน',price:119}]
export default function PromptPayTest(){
 const [feedback,setFeedback]=useState('')
 const [plan,setPlan]=useState('weekly'),[charge,setCharge]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const call=async body=>{setBusy(true);setError('');setFeedback('');try{const {data,error}=await supabase.functions.invoke('opn-promptpay',{body});if(error||!data?.ok)throw new Error(data?.error||error?.message||'ไม่สามารถติดต่อระบบชำระเงิน');setCharge(prev=>body.action==='status'?{...prev,...data,charge_id:body.charge_id,qr_url:data.qr_url||prev?.qr_url,expires_at:data.expires_at||prev?.expires_at}:data);setFeedback(body.action==='status'?('ตรวจสอบล่าสุด: '+(data.status||'ไม่ทราบสถานะ')+' · '+new Date().toLocaleTimeString('th-TH')):'สร้างรายการสำเร็จ กำลังติดตามสถานะอัตโนมัติ')}catch(e){setError(e.message)}finally{setBusy(false)}}
 useEffect(()=>{
  if(!charge?.charge_id||charge.status!=='pending')return
  let stopped=false
  let inFlight=false
  const refresh=async()=>{
   if(stopped||inFlight||document.visibilityState==='hidden')return
   inFlight=true
   try{
    const {data,error}=await supabase.functions.invoke('opn-promptpay',{body:{action:'status',charge_id:charge.charge_id}})
    if(!stopped&&!error&&data?.ok){setCharge(prev=>prev?.charge_id===charge.charge_id?{...prev,...data,charge_id:charge.charge_id,qr_url:data.qr_url||prev.qr_url,expires_at:data.expires_at||prev.expires_at}:prev);setFeedback('ตรวจสอบอัตโนมัติ: '+data.status+' · '+new Date().toLocaleTimeString('th-TH'))}
    else if(!stopped&&error)setError('ตรวจสอบอัตโนมัติไม่สำเร็จ: '+error.message)
   }catch(e){console.warn('PromptPay status refresh failed',e)}finally{inFlight=false}
  }
  const timer=setInterval(refresh,5000)
  const onVisible=()=>{if(document.visibilityState==='visible')refresh()}
  document.addEventListener('visibilitychange',onVisible)
  return()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',onVisible)}
 },[charge?.charge_id,charge?.status])
 const btn={padding:'12px 17px',borderRadius:13,border:'1px solid #a577bb',background:'#5e3878',color:'#fff',fontWeight:700,cursor:'pointer'}
 return <section style={{background:'linear-gradient(145deg,#24192f,#16101e)',border:'1px solid #674977',borderRadius:22,padding:24,color:'#fff',marginTop:22}}>
  <div style={{fontSize:12,letterSpacing:2,color:'#e6a7ec'}}>NISIT MATCH / PAYMENT SANDBOX</div><h2 style={{margin:'10px 0'}}>ทดสอบ PromptPay</h2>
  <p style={{color:'#cbb7d6'}}>ใช้ Opn Test Mode เท่านั้น รายการทดสอบจะไม่หักเงินจริงและไม่เปิด Premium · สถานะอัปเดตอัตโนมัติทุก 5 วินาทีขณะเปิดหน้านี้</p>
  <div style={{display:'flex',flexWrap:'wrap',gap:10,margin:'20px 0'}}>{plans.map(p=><button key={p.id} type="button" onClick={()=>{setPlan(p.id);setCharge(null)}} style={{...btn,background:plan===p.id?'#9d54ad':'#31223e'}}>{p.name} · ฿{p.price}</button>)}</div>
  <button type="button" disabled={busy} style={btn} onClick={()=>call({action:'create',plan})}>{busy?'กำลังดำเนินการ...':'สร้างรายการ PromptPay ทดสอบ'}</button>
  {error&&<p role="alert" style={{color:'#ff9da9'}}>{error}</p>}
  {charge&&<div style={{marginTop:20,padding:18,background:'#2b2038',borderRadius:16,overflowWrap:'anywhere'}}>
   <p><strong>Charge ID:</strong> {charge.charge_id}</p><p><strong>ยอดเงิน:</strong> ฿{(charge.amount/100).toFixed(2)}</p><p><strong>สถานะ:</strong> {charge.status}</p>
   {charge.expires_at&&<p><strong>หมดอายุ:</strong> {new Date(charge.expires_at).toLocaleString('th-TH')}</p>}
   {charge.qr_url?<><p>QR สำหรับ Test Mode</p><img src={charge.qr_url} alt="PromptPay test QR" style={{width:230,maxWidth:'100%',background:'#fff',padding:12,borderRadius:12}}/></>:<p style={{color:'#e8c7f4'}}>ผู้ให้บริการไม่ได้ส่ง URL รูป QR กลับมา ตรวจสอบ Charge ใน Opn Test Dashboard</p>}
   <p style={{fontSize:12,color:'#cbb7d6'}}>ทดสอบการเปลี่ยนสถานะได้จาก Opn Test Dashboard โดยไม่ต้องสแกนจ่ายเงินจริง</p>
   <button type="button" disabled={busy} style={btn} onClick={()=>call({action:'status',charge_id:charge.charge_id})}>{busy?'กำลังตรวจสอบ...':'ตรวจสอบสถานะอีกครั้ง'}</button>
   {feedback&&<p role="status" style={{fontSize:13,color:'#a3e4ca'}}>{feedback}</p>}
   {charge.status==='successful'&&<p style={{color:'#a3e4ca'}}>ทดสอบชำระสำเร็จแล้ว — ยังไม่เปิด Premium ใน Test Mode</p>}
  </div>}
 </section>
}
