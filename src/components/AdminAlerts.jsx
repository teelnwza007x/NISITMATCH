import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

export default function AdminAlerts() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkedAt, setCheckedAt] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const loadingRef = useRef(false)
  const aliveRef = useRef(true)
  const requestRef = useRef(0)
  const reload = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    const requestId = ++requestRef.current
    try {
      const { data, error: rpcError } = await supabase.rpc('nm_admin_report_queue')
      if (!aliveRef.current || requestId !== requestRef.current) return
      if (rpcError) throw rpcError
      setReports(Array.isArray(data) ? data : [])
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
    <p><strong>รายงานรอตรวจสอบ {pending.length} รายการ</strong> · รายงานล่าสุด {reports.length} รายการ</p>
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
