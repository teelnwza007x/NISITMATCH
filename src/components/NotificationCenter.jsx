import React, { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, ArrowRight, RefreshCw } from 'lucide-react'
import { supabase } from '../supabase'

export default function NotificationCenter({ onNavigate }) {
 const [items,setItems] = useState([])
 const [loading,setLoading] = useState(true)
 const [error,setError] = useState('')
 const [working,setWorking] = useState('')
 const load = useCallback(async () => {
  setLoading(true)
  const {data,error} = await supabase.rpc('nm_my_notifications',{p_limit:50})
  if(error) setError('โหลดการแจ้งเตือนไม่สำเร็จ กรุณาติดตั้ง SQL V146_NOTIFICATION_CENTER.sql')
  else {setItems(Array.isArray(data)?data:[]);setError('')}
  setLoading(false)
 },[])
 useEffect(()=>{load()},[load])
 const mark = async item => {
  if(working) return
  setWorking(item.key)
  if(!item.read) {
   const {error} = await supabase.rpc('nm_mark_notification_read',{p_key:item.key})
   if(error) {setError('บันทึกสถานะอ่านแล้วไม่สำเร็จ');setWorking('');return}
   setItems(old=>old.map(x=>x.key===item.key?{...x,read:true}:x))
  }
  setWorking('')
  onNavigate?.(item.target === '/announcements' ? 'announcements' : item.target === '/admin' ? 'admin' : 'messages')
 }
 const markAll = async () => {
  if(working) return
  setWorking('all')
  for(const item of items.filter(x=>!x.read)){
   const {error} = await supabase.rpc('nm_mark_notification_read',{p_key:item.key})
   if(error){setError('อ่านทั้งหมดไม่สำเร็จ กรุณาลองอีกครั้ง');break}
   setItems(old=>old.map(x=>x.key===item.key?{...x,read:true}:x))
  }
  setWorking('')
 }
 const unread = items.filter(x=>!x.read).length
 return <section style={{maxWidth:760,margin:'0 auto',display:'grid',gap:16,padding:'10px 0 36px'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
   <div><h2 style={{display:'flex',alignItems:'center',gap:9,margin:'0 0 6px'}}><Bell size={23}/> การแจ้งเตือน</h2><p style={{margin:0,opacity:.7,fontSize:13}}>{unread ? 'ยังไม่ได้อ่าน '+unread+' รายการ' : 'ติดตามข่าวสารและความเคลื่อนไหวของคุณ'}</p></div>
   <div style={{display:'flex',gap:8}}>
    <button type="button" className="btn btn-ghost" onClick={load} disabled={loading||!!working} aria-label="รีเฟรช"><RefreshCw size={16}/></button>
    <button type="button" className="btn btn-ghost" onClick={markAll} disabled={!unread||!!working}> <CheckCheck size={16}/> อ่านทั้งหมด</button>
   </div>
  </div>
  {error && <p role="alert" style={{color:'#fda4af'}}>{error}</p>}
  {loading && <p role="status">กำลังโหลดการแจ้งเตือน…</p>}
  {!loading && !items.length && !error && <div style={{textAlign:'center',padding:'48px 20px',border:'1px solid #ffffff20',borderRadius:18}}><Bell size={32} style={{opacity:.65}}/><h3>ยังไม่มีการแจ้งเตือน</h3><p style={{opacity:.7}}>เมื่อมีแมตช์หรือประกาศใหม่ จะแสดงที่นี่</p></div>}
  <div style={{display:'grid',gap:10}}>
   {items.map(item=><button type="button" key={item.key} onClick={()=>mark(item)} disabled={!!working}
    style={{width:'100%',display:'flex',gap:12,alignItems:'center',textAlign:'left',padding:16,color:'inherit',background:item.read?'#ffffff06':'#a78bfa18',border:'1px solid '+(item.read?'#ffffff16':'#c4a4ff65'),borderRadius:16,cursor:'pointer'}}>
    <span style={{width:9,height:9,borderRadius:'50%',flexShrink:0,background:item.read?'#ffffff30':'#d6a5ff'}}/>
    <span style={{flex:1,minWidth:0,display:'grid',gap:5}}><strong style={{overflowWrap:'anywhere'}}>{item.title}</strong><span style={{opacity:.8,fontSize:13,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.body}</span><small style={{opacity:.6}}>{new Date(item.created_at).toLocaleString('th-TH')}</small></span>
    <ArrowRight size={17} style={{opacity:.65,flexShrink:0}}/>
   </button>)}
  </div>
  <p style={{fontSize:12,opacity:.6}}>แสดง 50 รายการล่าสุดจากแมตช์ ความสนใจ และประกาศของทีมงาน</p>
 </section>
}
