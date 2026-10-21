import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

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
      if (rpcError) throw rpcError
      setReports(Array.isArray(data) ? data : [])
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
      setError('')
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
  const pending = reports.filter(r => ['pending', 'open', 'new'].includes(String(r.status || '').toLowerCase()))
  const visibleReports = showAll ? reports : pending
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
      {health?.checked_at && <p style={{fontSize:12,opacity:.65,margin:'8px 0 0'}}>ตรวจสอบ {new Date(health.checked_at).toLocaleString('th-TH')}</p>}
    </div>
    <p><strong>รายงานรอตรวจสอบ {pending.length} รายการ</strong> · รายงานล่าสุด {reports.length} รายการ</p>
    <p><strong>คำขอเพิ่มโดเมนมหาวิทยาลัย {domainRequests.length} รายการล่าสุด</strong></p>
    {domainError && <p role="alert">{domainError} — ตรวจว่าได้รัน V138_ADMIN_DOMAIN_REQUEST_QUEUE.sql ใน Supabase แล้ว</p>}
    {domainRequests.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => setShowDomains(v => !v)}>{showDomains ? 'ซ่อนคำขอมหาวิทยาลัย' : 'ดูคำขอมหาวิทยาลัย'}</button>}
    {showDomains && domainRequests.length > 0 && <div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['วันที่','มหาวิทยาลัย','โดเมนที่ขอ'].map(h=><th key={h} style={{textAlign:'left',padding:10}}>{h}</th>)}</tr></thead><tbody>{domainRequests.map(r=><tr key={r.id}><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.created_at ? new Date(r.created_at).toLocaleString('th-TH') : '—'}</td><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.university_name}</td><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{r.email_domain}</td></tr>)}</tbody></table></div>}
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
