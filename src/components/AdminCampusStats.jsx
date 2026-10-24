import React, { useEffect, useMemo, useState } from 'react'
import { BarChart3, RefreshCw, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import './AdminCampusStats.css'

const CAMPUSES = {
 ku: ['bangkhen','kamphaengsaen','sriracha','chalermphrakiat'],
 tu: ['tha_prachan','rangsit','lampang'],
 swu: ['prasarnmit','ongkharak'],
 buu: ['bangsaen','chanthaburi','sakaeo'],
}
const CAMPUS_NAMES = {
 bangkhen:'บางเขน',kamphaengsaen:'กำแพงแสน',sriracha:'ศรีราชา',chalermphrakiat:'เฉลิมพระเกียรติ จ.สกลนคร',
 tha_prachan:'ท่าพระจันทร์',rangsit:'รังสิต',lampang:'ลำปาง',pattaya:'พัทยา',prasarnmit:'ประสานมิตร',ongkharak:'องครักษ์',
 bangsaen:'บางแสน',chanthaburi:'จันทบุรี',sakaeo:'สระแก้ว'
}
const UNI_NAMES = { ku:'มหาวิทยาลัยเกษตรศาสตร์',tu:'มหาวิทยาลัยธรรมศาสตร์',swu:'มหาวิทยาลัยศรีนครินทรวิโรฒ',buu:'มหาวิทยาลัยบูรพา' }
const number = n => Number(n || 0).toLocaleString('th-TH')

export default function AdminCampusStats({ supabase }) {
 const [data,setData] = useState(null)
 const [busy,setBusy] = useState(false)
 const [error,setError] = useState('')
 const [university,setUniversity] = useState('all')
 const load = async () => {
  setBusy(true);setError('')
  try {
   const {data:result,error:failure} = await supabase.rpc('nm_admin_campus_stats')
   if(failure) throw failure
   setData(result)
  } catch(e) {setError('โหลดสถิติไม่สำเร็จ: '+(e?.message || 'กรุณาลองใหม่'))}
  finally {setBusy(false)}
 }
 useEffect(()=>{load()},[])
 const rows = useMemo(()=> {
  const list = (data?.rows || []).filter(r=>university==='all'||r.university_id===university)
  return [...list].sort((a,b)=>Number(b.count)-Number(a.count)||String(a.university_id).localeCompare(String(b.university_id)))
 },[data,university])
 const max = Math.max(1,...rows.map(r=>Number(r.count)))
 return <section className="nm-cstats" aria-label="สถิติการเลือกวิทยาเขต">
  <header className="nm-cstats-header"><div><span className="nm-cstats-kicker"><BarChart3 size={15}/> CAMPUS INSIGHTS</span><h3>สถิติวิทยาเขต</h3><p>จำนวนสมาชิกที่บันทึกวิทยาเขตจริง แยกตามมหาวิทยาลัย</p></div><button onClick={load} disabled={busy} type="button"><RefreshCw size={16}/>{busy?'กำลังโหลด':'รีเฟรช'}</button></header>
  {error && <p role="alert" className="nm-cstats-error">{error}</p>}
  <div className="nm-cstats-metrics">
   <article><Users size={19}/><small>สมาชิกในมหาวิทยาลัยที่มีวิทยาเขต</small><strong>{data?number(data.total):'—'}</strong></article>
   <article><CheckCircle2 size={19}/><small>เลือกวิทยาเขตแล้ว</small><strong>{data?number(data.selected):'—'}</strong></article>
   <article><AlertCircle size={19}/><small>ยังไม่ได้เลือก</small><strong>{data?number(data.missing):'—'}</strong></article>
  </div>
  <div className="nm-cstats-filter"><label htmlFor="nm-cstats-uni">กรองมหาวิทยาลัย</label><select id="nm-cstats-uni" value={university} onChange={e=>setUniversity(e.target.value)}><option value="all">ทุกมหาวิทยาลัย</option>{Object.entries(UNI_NAMES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></div>
  <div className="nm-cstats-list">{rows.length?rows.map(r=><div className="nm-cstats-item" key={r.university_id+':'+r.campus}><div className="nm-cstats-item-top"><span><MapPin size={16}/><b>{CAMPUS_NAMES[r.campus] || r.campus}</b><small>{UNI_NAMES[r.university_id]||r.university_id}</small></span><strong>{number(r.count)} <small>คน</small></strong></div><div className="nm-cstats-track"><div style={{width:(Number(r.count)/max*100)+'%'}}/></div></div>):<p className="nm-cstats-empty">{busy?'กำลังโหลดข้อมูล...':'ยังไม่มีข้อมูลการเลือกวิทยาเขต'}</p>}</div>
  <p className="nm-cstats-note">นับจำนวนสมาชิกปัจจุบัน ไม่ใช่จำนวนครั้งที่กดเปลี่ยนตัวเลือก · เรียงจากมากไปน้อย</p>
 </section>
}
