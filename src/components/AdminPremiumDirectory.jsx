import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AdminPremiumDirectory() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase.rpc('nm_admin_premium_members', {
      p_search: search.trim(), p_limit: 20, p_offset: page * 20
    })
    if (err) { setError(err.message); setRows([]); setTotal(0); setActive(0) }
    else { setError(''); setRows(data || []); setTotal(Number(data?.[0]?.total_count || 0)); setActive(Number(data?.[0]?.active_count || 0)) }
    setLoading(false)
  }, [search, page])
  useEffect(() => { reload() }, [reload])
  return <section className="nm-admin-queue">
    <h3>สมาชิก Premium</h3>
    <p>ข้อมูลสิทธิ์ Premium จาก Supabase เฉพาะผู้ดูแลระบบ</p>
    <p><strong>ใช้งานอยู่ {active} คน</strong> · รายการที่ค้นพบ {total} คน</p>
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      <input aria-label="ค้นหาสมาชิก Premium" placeholder="ค้นหาชื่อสมาชิก" value={search}
        onChange={e => {setSearch(e.target.value);setPage(0)}}
        style={{flex:'1 1 200px',padding:12,borderRadius:12}}/>
      <button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>รีเฟรช</button>
    </div>
    {error && <p role="alert">โหลดข้อมูลไม่สำเร็จ: {error}</p>}
    {loading ? <p>กำลังโหลด...</p> : !error && (rows.length ? <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>{['ชื่อผู้ใช้','แพ็กเกจ','แหล่งที่มา','สถานะ','วันหมดอายุ'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r=><tr key={r.user_id}>
          <td style={{padding:10}}>{r.display_name || r.user_id}</td>
          <td style={{padding:10}}>{r.plan || '—'}</td>
          <td style={{padding:10}}>{r.provider || '—'}</td>
          <td style={{padding:10,color:r.is_active?'#86efac':'#fda4af'}}>{r.is_active?'Active':'Expired'}</td>
          <td style={{padding:10}}>{r.ends_at?new Date(r.ends_at).toLocaleString('th-TH'):'—'}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p>ไม่พบสมาชิก Premium</p>)}
    <div style={{display:'flex',alignItems:'center',gap:12,marginTop:16}}>
      <button type="button" className="btn btn-ghost" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>ก่อนหน้า</button>
      <span>หน้า {page+1}</span>
      <button type="button" className="btn btn-ghost" disabled={loading||(page+1)*20>=total} onClick={()=>setPage(p=>p+1)}>ถัดไป</button>
    </div>
  </section>
}
