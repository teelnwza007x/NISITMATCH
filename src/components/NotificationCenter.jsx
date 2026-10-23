import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, ArrowRight, RefreshCw, Heart, MessageCircle, Megaphone, Sparkles, ShieldAlert, Inbox } from 'lucide-react'
import { supabase } from '../supabase'

const categoryFor = item => {
  if (item.target === '/announcements') return 'announcements'
  if (item.target === '/admin') return 'admin'
  if (item.type === 'message' || /ข้อความ/.test(item.title || '')) return 'messages'
  return 'social'
}
const iconFor = item => {
  const category = categoryFor(item)
  if (category === 'announcements') return Megaphone
  if (category === 'admin') return ShieldAlert
  if (category === 'messages') return MessageCircle
  if (/แมตช์/.test(item.title || '')) return Sparkles
  if (/สนใจ|ไลก์|Super Like/i.test(item.title || '')) return Heart
  return Bell
}
const FILTERS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'unread', label: 'ยังไม่อ่าน' },
  { id: 'social', label: 'ไลก์และแมตช์' },
  { id: 'messages', label: 'ข้อความ' },
  { id: 'announcements', label: 'ประกาศ' }
]

export default function NotificationCenter({ onNavigate, onReadChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState('')
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    const { data, error: loadError } = await supabase.rpc('nm_my_notifications', { p_limit: 50 })
    if (loadError) {
      setError('โหลดการแจ้งเตือนไม่สำเร็จ กรุณาตรวจสอบ SQL V146 และ V147')
    } else {
      setItems(Array.isArray(data) ? data : [])
      setError('')
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  const unread = useMemo(() => items.filter(item => !item.read).length, [items])
  const visibleItems = useMemo(() => items.filter(item => {
    if (filter === 'unread') return !item.read
    if (filter === 'all') return true
    return categoryFor(item) === filter
  }), [items, filter])

  const mark = async item => {
    if (working) return
    setWorking(item.key)
    if (!item.read) {
      const { data, error: markError } = await supabase.rpc('nm_mark_notification_read', { p_key: item.key })
      if (markError || data !== true) {
        setError('บันทึกสถานะอ่านแล้วไม่สำเร็จ กรุณาลองอีกครั้ง')
        setWorking('')
        return
      }
      setItems(old => old.map(x => x.key === item.key ? { ...x, read: true } : x))
      onReadChange?.()
    }
    setWorking('')
    onNavigate?.(item.target === '/announcements' ? 'announcements' : item.target === '/admin' ? 'admin' : 'messages')
  }

  const markAll = async () => {
    if (working || !unread) return
    setWorking('all')
    const keys = items.filter(item => !item.read).map(item => item.key)
    const { data, error: markError } = await supabase.rpc('nm_mark_all_notifications_read', { p_keys: keys })
    if (markError || data !== true) {
      setError('อ่านทั้งหมดไม่สำเร็จ กรุณาติดตั้ง SQL V147 แล้วลองอีกครั้ง')
    } else {
      const keySet = new Set(keys)
      setItems(old => old.map(item => keySet.has(item.key) ? { ...item, read: true } : item))
      setError('')
      onReadChange?.()
    }
    setWorking('')
  }

  return <section className="nm-notification-center" style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 16, padding: '10px 0 36px' }}>
    <style>{`
      .nm-notification-center .nm-notif-filter { border:1px solid #ffffff20; background:#ffffff06; color:inherit; border-radius:999px; padding:8px 12px; font-size:12px; cursor:pointer; white-space:nowrap; transition:background .18s ease,border-color .18s ease,transform .18s ease; }
      .nm-notification-center .nm-notif-filter:hover { transform:translateY(-1px); border-color:#c4b5fd80; }
      .nm-notification-center .nm-notif-filter[aria-pressed="true"] { background:#a78bfa24; border-color:#c4b5fd99; color:#e9ddff; }
      .nm-notification-center .nm-notif-item { animation:nmNotifIn .24s ease both; transition:transform .18s ease,border-color .18s ease,background .18s ease; }
      .nm-notification-center .nm-notif-item:hover { transform:translateY(-1px); border-color:#c4b5fd80 !important; }
      @keyframes nmNotifIn { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } }
      @keyframes nmNotifSpin { to { transform:rotate(360deg) } }
      @media (prefers-reduced-motion: reduce) { .nm-notification-center *, .nm-notification-center *::before, .nm-notification-center *::after { animation:none !important; transition:none !important; } }
    `}</style>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px' }}>
          <span style={{ position: 'relative', display: 'inline-flex', padding: 10, borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa24,#ec489924)', border: '1px solid #c4b5fd45' }}>
            <Bell size={22} />
            {unread > 0 && <span aria-label={unread + ' รายการยังไม่อ่าน'} style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 99, background: '#fb7185', boxShadow: '0 0 0 3px #fb718522,0 0 12px #fb7185' }} />}
          </span>
          การแจ้งเตือน
        </h2>
        <p style={{ margin: 0, opacity: .72, fontSize: 13 }}>{unread ? 'มีรายการที่ยังไม่ได้อ่าน ' + unread + ' รายการ' : 'คุณติดตามข่าวสารและความเคลื่อนไหวล่าสุดแล้ว'}</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={() => load(true)} disabled={loading || refreshing || !!working} aria-label="รีเฟรชการแจ้งเตือน" title="รีเฟรช">
          <RefreshCw size={16} style={{ animation: refreshing ? 'nmNotifSpin .8s linear infinite' : 'none' }} />
        </button>
        <button type="button" className="btn btn-ghost" onClick={markAll} disabled={!unread || !!working}><CheckCheck size={16} /> อ่านทั้งหมด</button>
      </div>
    </div>
    <div role="tablist" aria-label="กรองการแจ้งเตือน" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0 5px' }}>
      {FILTERS.map(option => <button key={option.id} type="button" className="nm-notif-filter" role="tab" aria-selected={filter === option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}{option.id === 'unread' && unread > 0 ? ' · ' + unread : ''}</button>)}
    </div>
    {error && <p role="alert" style={{ color: '#fda4af', margin: 0 }}>{error}</p>}
    {loading && <p role="status" style={{ opacity: .75 }}>กำลังโหลดการแจ้งเตือน…</p>}
    {!loading && !visibleItems.length && !error && <div style={{ textAlign: 'center', padding: '42px 20px', border: '1px solid #ffffff20', borderRadius: 20, background: 'linear-gradient(145deg,#a78bfa0b,#ffffff03)' }}>
      <span style={{ display: 'inline-flex', padding: 14, borderRadius: 18, background: '#a78bfa18', border: '1px solid #a78bfa35' }}><Inbox size={28} style={{ opacity: .8 }} /></span>
      <h3 style={{ marginBottom: 6 }}>{filter === 'unread' ? 'อ่านครบแล้ว เยี่ยมเลย!' : 'ยังไม่มีการแจ้งเตือน'}</h3>
      <p style={{ opacity: .7, margin: 0, fontSize: 13 }}>{filter === 'unread' ? 'ไม่มีรายการที่ยังไม่ได้อ่าน' : 'เมื่อมีแมตช์ ข้อความ หรือประกาศใหม่ จะแสดงที่นี่'}</p>
    </div>}
    <div style={{ display: 'grid', gap: 10 }}>
      {visibleItems.map(item => {
        const Icon = iconFor(item)
        return <button type="button" className="nm-notif-item" key={item.key} onClick={() => mark(item)} disabled={!!working}
          style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: 14, color: 'inherit', background: item.read ? '#ffffff05' : 'linear-gradient(110deg,#a78bfa1a,#ec48990b)', border: '1px solid ' + (item.read ? '#ffffff16' : '#c4b5fd65'), borderRadius: 18, cursor: 'pointer', opacity: working && working !== item.key ? .72 : 1 }}>
          <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: item.read ? '#ffffff0a' : '#a78bfa20', border: '1px solid ' + (item.read ? '#ffffff14' : '#c4b5fd40') }}>
            <Icon size={19} />
            {!item.read && <span style={{ position: 'absolute', width: 7, height: 7, top: -2, right: -2, borderRadius: 99, background: '#fb7185', boxShadow: '0 0 9px #fb7185' }} />}
          </span>
          <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 5 }}>
            <strong style={{ overflowWrap: 'anywhere', fontSize: 14 }}>{item.title}</strong>
            <span style={{ opacity: .8, fontSize: 13, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.5 }}>{item.body}</span>
            <small style={{ opacity: .58, fontSize: 11 }}>{item.created_at ? new Date(item.created_at).toLocaleString('th-TH') : ''}</small>
          </span>
          <ArrowRight size={17} style={{ opacity: .5, flexShrink: 0 }} />
        </button>
      })}
    </div>
    <p style={{ fontSize: 12, opacity: .58, margin: 0 }}>แสดง 50 รายการล่าสุดจากไลก์ แมตช์ ข้อความ และประกาศที่เกี่ยวข้องกับคุณ</p>
  </section>
}
