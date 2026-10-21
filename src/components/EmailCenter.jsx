import React,{useEffect,useState} from 'react'
import {supabase} from '../supabase'

const types=[{id:'',label:'อีเมลทั้งหมด'},{id:'signup_verify',label:'ยืนยันสมัครสมาชิก'},{id:'password_reset',label:'รีเซ็ตรหัสผ่าน'},{id:'university_otp',label:'OTP มหาวิทยาลัย'}]
const statuses=[{id:'',label:'ทุกสถานะ'},{id:'accepted',label:'SMTP รับแล้ว'},{id:'failed',label:'ส่งล้มเหลว'},{id:'delivered',label:'ส่งถึงแล้ว'},{id:'bounced',label:'ตีกลับ'}]
const names={signup_verify:'ยืนยันสมัครสมาชิก',password_reset:'รีเซ็ตรหัสผ่าน',university_otp:'OTP มหาวิทยาลัย',accepted:'SMTP รับแล้ว',failed:'ส่งล้มเหลว',delivered:'ส่งถึงแล้ว',bounced:'ตีกลับ',attempted:'กำลังส่ง'}
const theme={surface:'var(--theme-panel)',border:'1px solid var(--theme-border)',muted:'var(--theme-muted)',accent:'var(--theme-accent)'}
const date=s=>s?new Date(s).toLocaleString('th-TH'):'—'
const button=(active=false)=>({border:'1px solid '+(active?'var(--theme-accent)':'var(--theme-border)'),background:active?'linear-gradient(135deg,var(--theme-accent),var(--theme-accent2))':'var(--theme-sidebar)',color:active?'#fff':'var(--theme-text)',padding:'11px 16px',borderRadius:13,cursor:'pointer',fontWeight:700,transition:'all .2s'})
const invokeAdmin=async body=>{
 const {data,error}=await supabase.functions.invoke('admin-email-logs',{body})
 if(error){
  let detail=data?.error||''
  try{const response=error.context;if(response && typeof response.json==='function'){const payload=await response.json();detail=payload?.error||detail}}catch{}
  const status=error.context?.status
  const hint=status===401?'เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่':status===403?'บัญชีนี้ไม่มีสิทธิ์ Admin ในฐานข้อมูล':status===404?'ไม่พบ Edge Function admin-email-logs กรุณาตรวจสอบการ Deploy':status===500?'Function อ่านฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Logs ของ Edge Function':''
  throw new Error([status?`HTTP ${status}`:null,detail||error.message,hint].filter(Boolean).join(' — '))
 }
 if(!data?.ok)throw new Error(data?.error||'โหลดข้อมูลไม่สำเร็จ')
 return data
}
const field={background:'var(--theme-sidebar)',border:'1px solid var(--theme-border)',borderRadius:12,padding:'12px 14px',color:'var(--theme-text)',minWidth:0}
export default function EmailCenter(){
 const [panel,setPanel]=useState('emails')
 const [otpRows,setOtpRows]=useState([]),[otpTotal,setOtpTotal]=useState(0),[otpPage,setOtpPage]=useState(0),[otpSearch,setOtpSearch]=useState(''),[otpQuery,setOtpQuery]=useState(''),[otpError,setOtpError]=useState(''),[otpLoading,setOtpLoading]=useState(false)
 const [domainRows,setDomainRows]=useState([]),[domainTotal,setDomainTotal]=useState(0),[domainPage,setDomainPage]=useState(0),[domainSearch,setDomainSearch]=useState(''),[domainQuery,setDomainQuery]=useState(''),[domainError,setDomainError]=useState(''),[domainLoading,setDomainLoading]=useState(false)
 const [rows,setRows]=useState([]),[stats,setStats]=useState(null),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[type,setType]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(0),[total,setTotal]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const loadOtp=async()=>{setOtpLoading(true);setOtpError('');try{const data=await invokeAdmin({mode:'otp_verified',search:otpQuery,page:otpPage,limit:25});setOtpRows(data.rows||[]);setOtpTotal(data.total||0)}catch(e){setOtpError(e.message)}finally{setOtpLoading(false)}}
 const loadDomains=async()=>{setDomainLoading(true);setDomainError('');try{const data=await invokeAdmin({mode:'domain_requests',search:domainQuery,page:domainPage,limit:25});setDomainRows(data.rows||[]);setDomainTotal(data.total||0)}catch(e){setDomainError(e.message)}finally{setDomainLoading(false)}}
 const load=async()=>{setLoading(true);setError('');try{const data=await invokeAdmin({search:query,type,status,page,limit:25});setRows(data.rows||[]);setStats(data.stats||null);setTotal(data.total||0)}catch(e){setError(e.message)}finally{setLoading(false)}}
 useEffect(()=>{if(panel==='otp')loadOtp()},[panel,otpPage,otpQuery])
 useEffect(()=>{if(panel==='domains')loadDomains()},[panel,domainPage,domainQuery])
 useEffect(()=>{if(panel==='emails')load()},[panel,type,status,page,query])
 const refresh=()=>panel==='otp'?loadOtp():panel==='domains'?loadDomains():load()
 const pill=status=>({display:'inline-block',padding:'5px 10px',borderRadius:99,background:status==='failed'||status==='bounced'?'#582c40':status==='delivered'?'#244b48':'#453454',color:status==='failed'||status==='bounced'?'#ffb1bf':status==='delivered'?'#9aebd1':'#e8c3fa',fontSize:12,fontWeight:700,whiteSpace:'nowrap'})
 const td={padding:'15px 12px',borderBottom:'1px solid var(--theme-border)',verticalAlign:'top'}
 const th={...td,color:'var(--theme-muted)',fontWeight:600,fontSize:12,whiteSpace:'nowrap'}
 const stat=(label,value,sub)=><div style={{background:'var(--theme-panel)',border:theme.border,borderRadius:18,padding:20,flex:'1 1 180px',minWidth:0}}><div style={{fontSize:12,color:theme.muted}}>{label}</div><div style={{fontSize:30,fontWeight:800,margin:'7px 0',fontVariantNumeric:'tabular-nums'}}>{value??'—'}</div><div style={{fontSize:11,color:'var(--theme-muted)'}}>{sub}</div></div>
 return <section style={{marginTop:24,padding:'clamp(16px,3vw,28px)',border:'1px solid var(--theme-border)',borderRadius:24,background:'var(--theme-panel)',color:'var(--theme-text)',boxShadow:'0 18px 55px #09061155'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:22}}>
   <div><div style={{fontSize:11,letterSpacing:2.5,color:theme.accent,fontWeight:800}}>NISIT MATCH / ADMIN</div><h2 style={{margin:'8px 0 5px',fontSize:'clamp(23px,3vw,32px)'}}>Email Center</h2><div style={{color:theme.muted,fontSize:13}}>จัดการและตรวจสอบประวัติการส่งอีเมล</div></div>
   <button type="button" style={button(true)} onClick={refresh} disabled={panel==='otp'?otpLoading:panel==='domains'?domainLoading:loading}>{(panel==='otp'?otpLoading:panel==='domains'?domainLoading:loading)?'กำลังโหลด...':'↻ รีเฟรชข้อมูล'}</button>
  </div>
  <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:22}}>
   <button type="button" style={button(panel==='emails')} onClick={()=>setPanel('emails')}>✉ ประวัติการส่งอีเมล</button>
   <button type="button" style={button(panel==='otp')} onClick={()=>setPanel('otp')}>✓ ยืนยัน OTP 6 หลัก</button>
   <button type="button" style={button(panel==='domains')} onClick={()=>setPanel('domains')}>◈ คำขอเพิ่มโดเมน</button>
  </div>
  {panel==='otp'?<>
   <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:18}}>{stat('ยืนยัน OTP สำเร็จ',otpTotal,'เฉพาะหลักฐานที่บันทึกหลังติดตั้งระบบนี้')}</div>
   <p style={{color:theme.muted,fontSize:13,lineHeight:1.7}}>แสดงเฉพาะบัญชีที่ตรวจสอบรหัส OTP มหาวิทยาลัย 6 หลักสำเร็จและมีหลักฐานจากเซิร์ฟเวอร์ ไม่รวมการส่งรหัส การยืนยันบัญชีทั่วไป หรือสถานะเก่าที่ไม่มีหลักฐาน OTP</p>
   <form onSubmit={e=>{e.preventDefault();setOtpPage(0);setOtpQuery(otpSearch);if(otpPage===0&&otpQuery===otpSearch)loadOtp()}} style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:16}}><input aria-label="ค้นหาอีเมล OTP ที่ยืนยันแล้ว" style={{...field,flex:'1 1 220px'}} placeholder="ค้นหาอีเมลมหาวิทยาลัยที่ยืนยันแล้ว..." value={otpSearch} onChange={e=>setOtpSearch(e.target.value)}/><button type="submit" style={button(true)}>ค้นหา</button><button type="button" style={button()} onClick={()=>{setOtpSearch('');setOtpQuery('');setOtpPage(0)}}>ล้าง</button></form>
   {otpError&&<p role="alert" style={{color:'#ff9aaa'}}>{otpError}</p>}
   <div style={{overflowX:'auto',background:theme.surface,border:theme.border,borderRadius:18}}><table style={{width:'100%',minWidth:760,borderCollapse:'collapse',textAlign:'left',fontSize:13}}><thead><tr>{['ยืนยันเมื่อ','อีเมลมหาวิทยาลัย','มหาวิทยาลัย (ID)','ผู้ใช้ (ID)','สถานะ'].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{otpRows.map(r=><tr key={r.user_id}><td style={td}>{date(r.verified_at)}</td><td style={{...td,overflowWrap:'anywhere'}}>{r.verified_email}</td><td style={td}>{r.university_id}</td><td style={{...td,overflowWrap:'anywhere'}}>{r.user_id}</td><td style={td}><span style={{color:'#9aebd1',fontWeight:700}}>✓ OTP สำเร็จ</span></td></tr>)}</tbody></table>{otpLoading&&<p style={{padding:16}}>กำลังโหลด...</p>}{!otpRows.length&&!otpLoading&&!otpError&&<p style={{padding:16,color:theme.muted}}>ยังไม่มีหลักฐานการยืนยัน OTP 6 หลักหลังเปิดใช้ระบบ</p>}</div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginTop:18}}><span style={{color:theme.muted,fontSize:13}}>หน้า {otpPage+1} · ทั้งหมด {otpTotal} รายการ</span><div style={{display:'flex',gap:8}}><button style={button()} disabled={otpPage===0||otpLoading} onClick={()=>setOtpPage(p=>p-1)}>← ก่อนหน้า</button><button style={button()} disabled={(otpPage+1)*25>=otpTotal||otpLoading} onClick={()=>setOtpPage(p=>p+1)}>ถัดไป →</button></div></div>
  </>:panel==='domains'?<>
   <div style={{background:theme.surface,border:theme.border,borderRadius:18,padding:18,marginBottom:16}}><h3 style={{margin:'0 0 7px'}}>คำขอเพิ่มโดเมนมหาวิทยาลัย</h3><p style={{color:theme.muted,fontSize:13,margin:'0 0 16px'}}>รายการที่ผู้ใช้ขอให้เพิ่มโดเมนอีเมลมหาวิทยาลัย ไม่ใช่ประวัติการส่ง OTP</p>
    <form onSubmit={e=>{e.preventDefault();setDomainPage(0);setDomainQuery(domainSearch);if(domainPage===0&&domainQuery===domainSearch)loadDomains()}} style={{display:'flex',gap:9,flexWrap:'wrap'}}><input style={{...field,flex:'1 1 220px'}} placeholder="ค้นหามหาวิทยาลัยหรือโดเมน..." value={domainSearch} onChange={e=>setDomainSearch(e.target.value)}/><button type="submit" style={button(true)}>ค้นหา</button><button type="button" style={button()} onClick={()=>{setDomainSearch('');setDomainQuery('');setDomainPage(0)}}>ล้าง</button></form>
   </div>
   {domainError&&<p role="alert" style={{color:'#ff9aaa'}}>{domainError}</p>}
   <div style={{overflowX:'auto',background:theme.surface,border:theme.border,borderRadius:18}}><table style={{width:'100%',minWidth:760,borderCollapse:'collapse',textAlign:'left',fontSize:13}}><thead><tr>{['วันที่แจ้ง','มหาวิทยาลัย','โดเมนที่ขอเพิ่ม','ผู้แจ้ง (User ID)'].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{domainRows.map((r,i)=><tr key={r.user_id+'-'+r.created_at+'-'+i}>{[date(r.created_at),r.university_name,r.email_domain,r.user_id].map((v,j)=><td key={j} style={{...td,overflowWrap:'anywhere'}}>{v||'—'}</td>)}</tr>)}</tbody></table>{domainLoading&&<p style={{padding:16}}>กำลังโหลด...</p>}{!domainRows.length&&!domainLoading&&!domainError&&<p style={{padding:16,color:theme.muted}}>ไม่พบคำขอเพิ่มโดเมน</p>}</div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginTop:18}}><span style={{color:theme.muted,fontSize:13}}>หน้า {domainPage+1} · ทั้งหมด {domainTotal} รายการ</span><div style={{display:'flex',gap:8}}><button style={button()} disabled={domainPage===0||domainLoading} onClick={()=>setDomainPage(p=>p-1)}>← ก่อนหน้า</button><button style={button()} disabled={(domainPage+1)*25>=domainTotal||domainLoading} onClick={()=>setDomainPage(p=>p+1)}>ถัดไป →</button></div></div>
  </>:<>
   <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>{stat('รายการใน 24 ชั่วโมง',stats?.total24h,'บันทึกใน email_delivery_logs')}{stat('SMTP รับแล้ว',stats?.accepted24h,'ยังไม่ยืนยันว่าเข้ากล่องจดหมาย')}{stat('ส่งล้มเหลว',stats?.failed24h,'ตรวจสอบรายละเอียดในตาราง')}</div>
   <div style={{background:'var(--theme-sidebar)',border:'1px solid var(--theme-border)',borderRadius:15,padding:'13px 16px',marginBottom:20,color:'var(--theme-muted)',fontSize:13,lineHeight:1.7}}>ข้อมูลในหน้านี้มาจากตาราง <code>email_delivery_logs</code> เท่านั้น หาก Verify Email หรือ Reset Password ส่งผ่าน Supabase Auth SMTP โดยไม่ได้บันทึก Log เพิ่ม รายการเหล่านั้นจะยังไม่ปรากฏที่นี่ และสถานะ “SMTP รับแล้ว” ไม่ได้หมายความว่าอีเมลถึง Inbox แล้ว</div>
   <div style={{background:theme.surface,border:theme.border,borderRadius:18,padding:18,marginBottom:16}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>ประเภทอีเมล</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>{types.map(t=><button key={t.id} type="button" style={button(type===t.id)} onClick={()=>{setType(t.id);setPage(0)}}>{t.label}</button>)}</div>
    <form onSubmit={e=>{e.preventDefault();setPage(0);setQuery(search);if(page===0&&query===search)load()}} style={{display:'flex',gap:10,flexWrap:'wrap'}}><input aria-label="ค้นหาอีเมล" style={{...field,flex:'2 1 220px'}} placeholder="ค้นหาอีเมลผู้รับ..." value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="สถานะ" style={{...field,flex:'1 1 155px'}} value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}}>{statuses.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select><button type="submit" style={button(true)}>ค้นหา</button><button type="button" style={button()} onClick={()=>{setSearch('');setQuery('');setType('');setStatus('');setPage(0)}}>ล้างตัวกรอง</button></form>
   </div>
   {error&&<p role="alert" style={{color:'#ff9aaa'}}>{error}</p>}
   <div style={{overflowX:'auto',background:theme.surface,border:theme.border,borderRadius:18}}><table style={{width:'100%',minWidth:790,borderCollapse:'collapse',textAlign:'left',fontSize:13}}><thead><tr>{['วันที่ / เวลา','อีเมลผู้รับ','ประเภท','สถานะ','รายละเอียด'].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}><td style={{...td,whiteSpace:'nowrap'}}>{date(r.created_at)}</td><td style={{...td,overflowWrap:'anywhere'}}>{r.recipient_email||'—'}</td><td style={td}>{names[r.email_type]||r.email_type||'—'}</td><td style={td}><span style={pill(r.status)}>{names[r.status]||r.status||'—'}</span></td><td style={{...td,overflowWrap:'anywhere',color:theme.muted}}>{r.error_message||r.provider_message_id||'—'}</td></tr>)}</tbody></table>{loading&&<p style={{padding:16}}>กำลังโหลดประวัติ...</p>}{!rows.length&&!loading&&!error&&<p style={{padding:16,color:theme.muted}}>ไม่พบประวัติในตัวกรองนี้</p>}</div>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginTop:18}}><span style={{color:theme.muted,fontSize:13}}>หน้า {page+1} · ทั้งหมด {total} รายการ</span><div style={{display:'flex',gap:8}}><button style={button()} disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>← ก่อนหน้า</button><button style={button()} disabled={(page+1)*25>=total||loading} onClick={()=>setPage(p=>p+1)}>ถัดไป →</button></div></div>
  </>}
 </section>
}
