import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AdminPremiumDirectory() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [active, setActive] = useState(0)
  const [sources, setSources] = useState([])
  const [sourceError, setSourceError] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [targetResults, setTargetResults] = useState([])
  const [targetLoading, setTargetLoading] = useState(false)
  const [grantDays, setGrantDays] = useState('7')
  const [grantingUser, setGrantingUser] = useState('')
  const [grantMessage, setGrantMessage] = useState('')
  const [grantError, setGrantError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true)
    const [members, sourceSummary] = await Promise.all([
      supabase.rpc('nm_admin_premium_members', {
        p_search: search.trim(), p_limit: 20, p_offset: page * 20
      }),
      supabase.rpc('nm_admin_premium_source_summary')
    ])
    if (members.error) { setError(members.error.message); setRows([]); setTotal(0); setActive(0) }
    else { setError(''); setRows(members.data || []); setTotal(Number(members.data?.[0]?.total_count || 0)); setActive(Number(members.data?.[0]?.active_count || 0)) }
    if (sourceSummary.error) { setSourceError(sourceSummary.error.message); setSources([]) }
    else { setSourceError(''); setSources(sourceSummary.data || []) }
    setLoading(false)
  }, [search, page])
  const searchUsers = async () => {
    const q = targetQuery.trim()
    if (!q) { setTargetResults([]); setGrantError('กรอกชื่อหรืออีเมลของสมาชิกก่อน'); return }
    setTargetLoading(true); setGrantError(''); setGrantMessage('')
    const { data, error: err } = await supabase.rpc('nm_admin_search_premium_users', { p_search: q })
    if (err) { setGrantError('ค้นหาสมาชิกไม่สำเร็จ: ' + err.message); setTargetResults([]) }
    else { setTargetResults(data || []); if (!(data || []).length) setGrantError('ไม่พบสมาชิกที่ค้นหา') }
    setTargetLoading(false)
  }
  const grantPremium = async user => {
    const days = Number(grantDays)
    const label = user.display_name || user.email || user.user_id
    if (!window.confirm('ยืนยันเพิ่ม Premium ให้ ' + label + ' อีก ' + days + ' วันหรือไม่? หากมี Premium อยู่แล้ว ระบบจะต่ออายุจากวันหมดอายุเดิม')) return
    setGrantingUser(user.user_id); setGrantError(''); setGrantMessage('')
    const { data, error: err } = await supabase.rpc('nm_admin_grant_premium', { p_user_id: user.user_id, p_days: days })
    if (err) setGrantError('เพิ่ม Premium ไม่สำเร็จ: ' + err.message)
    else {
      setGrantMessage('เพิ่ม Premium ให้ ' + label + ' สำเร็จ หมดอายุ ' + (data ? new Date(data).toLocaleString('th-TH') : 'ตามระบบ'))
      await searchUsers()
      await reload()
    }
    setGrantingUser('')
  }
  const sourceLabel = provider => {
    const value = String(provider || '').toLowerCase()
    if (value === 'referral') return 'ชวนเพื่อน'
    if (['account_email_otp', 'email_verification', 'verified_email'].includes(value)) return 'ยืนยันอีเมล'
    if (['stripe', 'thunder', 'opn', 'opn_promptpay', 'opn_live', 'promptpay', 'manual_payment', 'purchase'].includes(value)) return 'ซื้อ Premium'
    if (value === 'admin_manual') return 'แอดมินมอบให้'
    if (value === 'owner_grant') return 'สิทธิ์เจ้าของระบบ'
    return provider || 'อื่น ๆ'
  }
  useEffect(() => { reload() }, [reload])
  return <section className="nm-admin-queue">
    <h3>สมาชิก Premium</h3>
    <p>ข้อมูลสิทธิ์ Premium จาก Supabase เฉพาะผู้ดูแลระบบ</p>
    <p><strong>ใช้งานอยู่ {active} คน</strong> · รายการที่ค้นพบ {total} คน</p>
    {sourceError && <p role="status" style={{fontSize:12,opacity:.75}}>โหลดสรุปแหล่งที่มาไม่ได้: {sourceError}</p>}
    {sources.length > 0 && <div aria-label="สรุปแหล่งที่มาของ Premium" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))',gap:10,margin:'14px 0 18px'}}>
      {sources.map(source => <article key={source.source_key} style={{padding:14,border:'1px solid #ffffff20',borderRadius:14,background:'linear-gradient(145deg,#ffffff0d,#ffffff04)',minWidth:0}}>
        <small style={{display:'block',opacity:.72,marginBottom:8}}>{source.source_label}</small>
        <strong style={{display:'block',fontSize:24,lineHeight:1.2}}>{Number(source.total_count || 0).toLocaleString('th-TH')}</strong>
        <span style={{fontSize:12,opacity:.72}}>ทั้งหมด · ใช้งาน {Number(source.active_count || 0).toLocaleString('th-TH')} คน</span>
      </article>)}
    </div>}
    <div style={{border:'1px solid #a78bfa55',borderRadius:16,padding:14,margin:'16px 0',background:'linear-gradient(145deg,#8b5cf610,#ffffff04)'}}>
      <h4 style={{margin:'0 0 6px'}}>เพิ่ม Premium ให้สมาชิก</h4>
      <p style={{fontSize:12,opacity:.75,margin:'0 0 12px'}}>ค้นหาด้วยชื่อหรืออีเมล แล้วเลือกจำนวนวันที่ต้องการให้สิทธิ์</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <input aria-label="ค้นหาผู้ใช้เพื่อเพิ่ม Premium" placeholder="ชื่อสมาชิกหรืออีเมล" value={targetQuery}
          onChange={e=>setTargetQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();searchUsers()}}}
          style={{flex:'1 1 220px',minWidth:0,padding:12,borderRadius:12}}/>
        <select aria-label="จำนวนวัน Premium" value={grantDays} onChange={e=>setGrantDays(e.target.value)} style={{padding:10,borderRadius:12}}>
          <option value="1">1 วัน</option><option value="3">3 วัน</option><option value="7">7 วัน</option><option value="14">14 วัน</option><option value="30">30 วัน</option><option value="90">90 วัน</option><option value="365">365 วัน</option>
        </select>
        <button type="button" className="btn btn-ghost" onClick={searchUsers} disabled={targetLoading}>{targetLoading?'กำลังค้นหา…':'ค้นหาสมาชิก'}</button>
      </div>
      {grantError && <p role="alert" style={{color:'#fda4af',fontSize:13}}>{grantError}</p>}
      {grantMessage && <p role="status" style={{color:'#86efac',fontSize:13}}>{grantMessage}</p>}
      {targetResults.length>0 && <div style={{marginTop:12,display:'grid',gap:8}}>
        {targetResults.map(user=><div key={user.user_id} style={{display:'flex',gap:10,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',padding:10,border:'1px solid #ffffff18',borderRadius:12}}>
          <div style={{minWidth:0,flex:'1 1 180px'}}>
            <strong style={{display:'block',overflowWrap:'anywhere'}}>{user.display_name || 'ไม่มีชื่อ'}</strong>
            <span style={{display:'block',fontSize:12,opacity:.7,overflowWrap:'anywhere'}}>{user.email || user.user_id}</span>
            <span style={{display:'block',fontSize:12,opacity:.7}}>{user.premium_active?'มี Premium อยู่':'ยังไม่มี Premium'}{user.premium_ends_at?' · หมดอายุ '+new Date(user.premium_ends_at).toLocaleDateString('th-TH'):''}</span>
          </div>
          <button type="button" className="btn" disabled={!!grantingUser} onClick={()=>grantPremium(user)}>{grantingUser===user.user_id?'กำลังเพิ่ม…':'เพิ่ม '+grantDays+' วัน'}</button>
        </div>)}
      </div>}
    </div>
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
          <td style={{padding:10}}><span style={{display:'inline-flex',alignItems:'center',padding:'5px 9px',borderRadius:999,border:'1px solid #a78bfa55',background:'#8b5cf61a',whiteSpace:'nowrap'}}>{sourceLabel(r.provider)}</span></td>
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
