import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import { UNIVERSITIES } from '../data/universities'

export default function AdminAlerts() {
  const [reports, setReports] = useState([])
  const [domainRequests, setDomainRequests] = useState([])
  const [domainError, setDomainError] = useState('')
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const loadingRef = useRef(false)
  const [showDomains, setShowDomains] = useState(false)
  const [showHealthDetails, setShowHealthDetails] = useState(false)
  const [domainSearch, setDomainSearch] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [approvalError, setApprovalError] = useState('')
  const [approvalSuccess, setApprovalSuccess] = useState('')
  const [universityIds, setUniversityIds] = useState({})
  const aliveRef = useRef(true)
  const requestRef = useRef(0)
  const reload = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    const requestId = ++requestRef.current
    try {
      const [reportResult, domainResult, healthResult] = await Promise.all([
        supabase.rpc('nm_admin_report_queue'),
        supabase.rpc('nm_admin_domain_request_queue'),
        supabase.rpc('nm_admin_health_summary')
      ])
      const { data, error: rpcError } = reportResult
      if (!aliveRef.current || requestId !== requestRef.current) return
      if (rpcError) { setError(rpcError.message); setReports([]) }
      if (!rpcError) setReports(Array.isArray(data) ? data : [])
      // Older databases may not have the 8.3 migration yet; keep reports usable.
      if (domainResult.error) {
        setDomainError('โหลดคำขอโดเมนไม่ได้: ' + domainResult.error.message)
      } else {
        setDomainRequests(Array.isArray(domainResult.data) ? domainResult.data : [])
        setDomainError('')
      }
      if (healthResult.error) {
        setHealth(null)
        setHealthError('โหลดสถานะระบบไม่ได้: ' + healthResult.error.message)
      } else {
        setHealth(healthResult.data && typeof healthResult.data === 'object' ? healthResult.data : null)
        setHealthError('')
      }
      if (!rpcError) setError('')
      setCheckedAt(new Date())
    } catch (err) {
      if (!aliveRef.current || requestId !== requestRef.current) return
      setError(err?.message || 'โหลดรายการแจ้งเตือนไม่สำเร็จ')
    } finally {
      loadingRef.current = false
      if (aliveRef.current && requestId === requestRef.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    aliveRef.current = true
    reload()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload()
    }, 60000)
    const onVisible = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      aliveRef.current = false
      requestRef.current += 1
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])
  const approveDomain = async request => {
    const universityId = String(universityIds[request.id] || '').trim().toLowerCase()
    const university = UNIVERSITIES.find(u => u.id === universityId && u.id !== 'unspecified')
    if (!university) {
      setApprovalError('กรุณาเลือกมหาวิทยาลัยก่อนอนุมัติ')
      return
    }
    if (!window.confirm(`อนุมัติ @${request.email_domain} ให้ ${university.name} ใช่ไหม? โปรดตรวจสอบว่าโดเมนเป็นของสถาบันนี้จริง`)) return
    setApprovingId(request.id)
    setApprovalError('')
    setApprovalSuccess('')
    try {
      const { data, error } = await supabase.rpc('nm_admin_approve_domain_request', {
        p_request_id: request.id, p_university_id: universityId
      })
      if (error) throw error
      setDomainRequests(rows => rows.filter(row => row.id !== request.id))
      setApprovalSuccess(`อนุมัติ @${data?.domain || request.email_domain} สำเร็จ`)
      setUniversityIds(ids => { const next = { ...ids }; delete next[request.id]; return next })
      // Refresh health counters and queue from the server after a successful mutation.
      await reload()
    } catch (err) {
      setApprovalError('อนุมัติไม่สำเร็จ: ' + (err?.message || 'กรุณาตรวจสอบ SQL V140 และสิทธิ์แอดมิน'))
    } finally {
      setApprovingId(null)
    }
  }
  const pending = reports.filter(r => ['pending', 'open', 'new'].includes(String(r.status || '').toLowerCase()))
  const visibleReports = showAll ? reports : pending
  const filteredDomainRequests = domainRequests.filter(r => `${r.university_name || ''} ${r.email_domain || ''}`.toLocaleLowerCase().includes(domainSearch.trim().toLocaleLowerCase()))
  const failedPushCount = Number(health?.failed_push || 0)
  const waitingPushCount = Number(health?.pending_push || 0)
  return <section className="nm-admin-queue" aria-label="ศูนย์แจ้งเตือนแอดมิน">
    <h3>ศูนย์แจ้งเตือนแอดมิน</h3>
    <p>รายงานสมาชิกจาก Supabase · รีเฟรชอัตโนมัติทุก 60 วินาทีเมื่อเปิดแท็บนี้</p>
    <div className="nm-admin-health" aria-label="สถานะระบบ" style={{margin:'14px 0',padding:14,border:'1px solid #ffffff24',borderRadius:14}}>
      <h4 style={{margin:'0 0 8px'}}>สถานะระบบ NISIT MATCH</h4>
      {healthError && <p role="alert">{healthError} — ตรวจว่าได้รัน V139_ADMIN_HEALTH_READ_ONLY.sql แล้ว</p>}
      {health && <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:10}}>
        {[
          ['รายงานรอตรวจสอบ',health.pending_reports],
          ['คำขอโดเมน',health.domain_requests],
          ['Push รอส่ง',health.pending_push],
          ['Push ส่งไม่สำเร็จ',health.failed_push]
        ].map(([label,value]) => <div key={label} style={{padding:12,borderRadius:10,background:'#ffffff0a'}}><div style={{fontSize:22,fontWeight:700}}>{Number(value ?? 0).toLocaleString('th-TH')}</div><div style={{fontSize:12,opacity:.75}}>{label}</div></div>)}
      </div>}
      <button type="button" className="btn btn-ghost" onClick={() => setShowHealthDetails(v => !v)} aria-expanded={showHealthDetails}>{showHealthDetails ? 'ซ่อนคำแนะนำตรวจสอบระบบ' : 'วิธีตรวจสอบระบบ'}</button>
      {showHealthDetails && <div style={{fontSize:13,opacity:.85,marginTop:8}}><p>Push รอส่ง: ตรวจ Cron และ Edge Function send-push</p><p>Push ส่งไม่สำเร็จ: ตรวจ Edge Function Logs และการตั้งค่า VAPID</p><p>ข้อมูลนี้เป็นจำนวนรายการในคิว ไม่ใช่ผลการตรวจสอบสถานะบริการแบบเรียลไทม์</p></div>}
      {failedPushCount > 0 && <p role="alert" style={{margin:'10px 0',color:'#ffb4a8'}}>พบ Push Notification ส่งไม่สำเร็จ {failedPushCount.toLocaleString('th-TH')} รายการ กรุณาตรวจสอบ Edge Function send-push และ Cron</p>}
      {waitingPushCount > 0 && <p style={{margin:'10px 0',opacity:.8}}>มี Push Notification รอส่ง {waitingPushCount.toLocaleString('th-TH')} รายการ</p>}
      {health?.checked_at && <p style={{fontSize:12,opacity:.65,margin:'8px 0 0'}}>ตรวจสอบ {new Date(health.checked_at).toLocaleString('th-TH')}</p>}
    </div>
    <p><strong>รายงานรอตรวจสอบ {pending.length} รายการ</strong> · รายงานล่าสุด {reports.length} รายการ</p>
    <p><strong>คำขอเพิ่มโดเมนมหาวิทยาลัย {domainRequests.length} รายการล่าสุด</strong></p>
    {domainError && <p role="alert">{domainError} — ตรวจว่าได้รัน V138_ADMIN_DOMAIN_REQUEST_QUEUE.sql ใน Supabase แล้ว</p>}
    {domainRequests.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => setShowDomains(v => !v)}>{showDomains ? 'ซ่อนคำขอมหาวิทยาลัย' : 'ดูคำขอมหาวิทยาลัย'}</button>}
    {showDomains && domainRequests.length > 0 && <label style={{display:'block',marginTop:10}}>ค้นหาคำขอมหาวิทยาลัย <input type="search" value={domainSearch} onChange={e => setDomainSearch(e.target.value)} placeholder="ชื่อมหาวิทยาลัยหรือโดเมน" style={{display:'block',width:'100%',maxWidth:380,marginTop:6}} /></label>}
    {approvalError && <p role="alert">{approvalError}</p>}
    {approvalSuccess && <p role="status">{approvalSuccess}</p>}
    {showDomains && domainRequests.length > 0 && <div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['วันที่','มหาวิทยาลัย','โดเมนที่ขอ','อนุมัติ'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{filteredDomainRequests.map(r=><tr key={r.id}><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.created_at ? new Date(r.created_at).toLocaleString('th-TH') : '—'}</td><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.university_name}</td><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.email_domain}</td><td style={{padding:10,borderTop:'1px solid #ffffff20'}}><select aria-label={`เลือกมหาวิทยาลัยสำหรับ ${r.email_domain}`} value={universityIds[r.id] || ''} onChange={e => setUniversityIds(ids => ({...ids,[r.id]:e.target.value}))} style={{width:190,maxWidth:'100%',padding:8,marginRight:6}}><option value="">เลือกมหาวิทยาลัย</option>{UNIVERSITIES.filter(u => u.id !== 'unspecified').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><button type="button" className="btn btn-pink" disabled={approvingId !== null} onClick={() => approveDomain(r)}>{approvingId === r.id ? 'กำลังอนุมัติ…' : 'อนุมัติ'}</button></td></tr>)}</tbody></table></div>}
    <button type="button" className="btn btn-ghost" onClick={reload} disabled={loading}>{loading ? 'กำลังโหลด…' : 'รีเฟรชรายการ'}</button>
    {checkedAt && <p style={{fontSize:12,opacity:.7}}>ตรวจล่าสุด {checkedAt.toLocaleTimeString('th-TH')}</p>}
    <button type="button" className="btn btn-ghost" style={{marginLeft:8}} onClick={() => setShowAll(v => !v)}>{showAll ? 'เฉพาะรอตรวจสอบ' : 'ดูรายงานทั้งหมด'}</button>
    {error && <p role="alert">{error}</p>}
    {!loading && !error && visibleReports.length === 0 && <p>ไม่มีรายงานในมุมมองนี้</p>}
    {!error && visibleReports.length > 0 && <div style={{overflowX:'auto',marginTop:12}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>{['วันที่','ผู้ถูกรายงาน','เหตุผล','สถานะ'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead>
        <tbody>{visibleReports.map(r=><tr key={r.id}>
          <td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.created_at ? new Date(r.created_at).toLocaleString('th-TH') : '—'}</td>
          <td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.reported || '—'}</td>
          <td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.reason || '—'}</td>
          <td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.status || '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>
}
