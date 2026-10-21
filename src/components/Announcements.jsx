import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Announcements({ admin = false }) {
 const [items,setItems] = useState([])
 const [title,setTitle] = useState('')
 const [body,setBody] = useState('')
 const [busy,setBusy] = useState(false)
 const [error,setError] = useState('')
 const [success,setSuccess] = useState('')
 const load = async () => {
  const {data,error} = await supabase.from('nm_announcements').select('id,title,body,created_at').order('created_at',{ascending:false}).limit(50)
  if(error) setError('ยังไม่สามารถโหลดประกาศได้ กรุณารัน SQL V144 ใน Supabase')
  else {setItems(data||[]);setError('')}
 }
 useEffect(()=>{load()},[])
 const publish = async e => {
  e.preventDefault()
  if(busy || !title.trim() || !body.trim()) return
  if(!window.confirm('ยืนยันส่งประกาศและ Push Notification ให้สมาชิกทั้งหมดที่เปิดแจ้งเตือน?')) return
  setBusy(true);setError('');setSuccess('')
  const {error} = await supabase.rpc('nm_admin_publish_announcement',{p_title:title.trim(),p_body:body.trim()})
  if(error) setError(error.message)
  else {setSuccess('บันทึกประกาศแล้ว ระบบจะทยอยส่งแจ้งเตือนตามรอบของ Push Worker');setTitle('');setBody('');await load()}
  setBusy(false)
 }
 return <section style={{display:'grid',gap:16,maxWidth:760,margin:'0 auto',padding:'12px 0 28px'}}>
  <header><h2 style={{margin:'0 0 6px'}}>ข่าวสารและประกาศ</h2><p style={{opacity:.75,fontSize:13}}>ข่าวสารล่าสุดจากทีมงาน NISIT MATCH</p></header>
  {admin && <form onSubmit={publish} style={{display:'grid',gap:12,padding:18,border:'1px solid #ffffff25',borderRadius:18,background:'#ffffff08'}}>
   <h3 style={{margin:0}}>ส่งประกาศถึงสมาชิกทั้งหมด</h3>
   <label style={{display:'grid',gap:6}}>หัวข้อ<input className="input" maxLength={120} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="เช่น เพิ่มมหาวิทยาลัยใหม่แล้ว" style={{width:'100%',padding:12,borderRadius:12}}/></label>
   <label style={{display:'grid',gap:6}}>รายละเอียด<textarea maxLength={1000} required rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="ข้อความที่จะแสดงใน Push Notification" style={{width:'100%',padding:12,borderRadius:12,background:'#201a29',color:'white'}}/></label>
   <p style={{fontSize:12,opacity:.75,margin:0}}>แจ้งเตือนเฉพาะอุปกรณ์ที่เปิดรับ Push และทยอยส่งผ่านคิว เพื่อไม่ให้กระทบแชต</p>
   <button type="submit" className="btn btn-pink" disabled={busy||!title.trim()||!body.trim()}>{busy?'กำลังส่ง…':'ส่งประกาศถึงสมาชิกทั้งหมด'}</button>
   {success && <p role="status" style={{color:'#a7f3d0'}}>{success}</p>}
  </form>}
  {error && <p role="alert" style={{color:'#fda4af'}}>{error}</p>}
  <div style={{display:'grid',gap:12}}>{items.map(item=><article key={item.id} style={{padding:16,borderRadius:16,border:'1px solid #ffffff20',background:'#ffffff08',overflowWrap:'anywhere'}}>
   <small style={{opacity:.65}}>{new Date(item.created_at).toLocaleString('th-TH')}</small>
   <h3 style={{margin:'8px 0'}}>{item.title}</h3><p style={{whiteSpace:'pre-wrap',margin:0,lineHeight:1.6}}>{item.body}</p>
  </article>)}
  {!items.length && !error && <p style={{opacity:.7}}>ยังไม่มีประกาศ</p>}</div>
 </section>
}
