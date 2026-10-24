import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
export default function AdminPwaStats() {
  const [data,setData]=useState(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  const reload=async()=>{setLoading(true);setError('');const {data:result,error:err}=await supabase.rpc('nm_admin_pwa_stats');if(err)setError('โหลดสถิติไม่สำเร็จ: '+err.message);else setData(result);setLoading(false)}
  useEffect(()=>{void reload()},[])
  return <section className="nm-admin-queue" style={{display:'grid',gap:12}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><h3 style={{margin:0}}>การติดตั้งแอปและแจ้งเตือน</h3><button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>{loading?'กำลังโหลด…':'รีเฟรช'}</button></div>
    {error && <p role="alert">{error}</p>}
    {data && <div className="nm-admin-metrics">{[['เคยเปิดผ่านแอป PWA',data.pwa_users],['เปิดผ่านแอปใน 30 วัน',data.standalone_recent_30d],['เปิดผ่านเว็บใน 30 วัน',data.browser_recent_30d],['ผู้สมัคร Push',data.push_users],['อุปกรณ์ Push',data.push_devices],['บัญชีที่เริ่มเก็บสถิติ',data.tracked_users]].map(([label,value])=><article key={label}><small>{label}</small><strong>{Number(value||0).toLocaleString('th-TH')}</strong></article>)}</div>}
    <p style={{fontSize:12,opacity:.7,margin:0}}>เริ่มนับหลังปล่อยเวอร์ชันนี้ เฉพาะสมาชิกที่ล็อกอินและเปิดแอป ไม่ใช่ยอดติดตั้งจาก App Store; Push นับจาก subscription ที่บันทึกไว้</p>
  </section>
}