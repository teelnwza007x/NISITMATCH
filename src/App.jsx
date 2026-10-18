import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Heart, Search, MessageCircle, UserRound, Settings, LogOut, X, ShieldCheck, GraduationCap, Sparkles, SlidersHorizontal, Send, ImagePlus, Mic, Square, Play, Pause, Trash2, Camera, Flag, Ban, Menu, ArrowRight, Check, Bell, Users, LockKeyhole, Music2, ExternalLink, MapPin, Globe2, Compass, Cake, LocateFixed, Palette, Eye, Reply, SmilePlus, CheckCheck, Star, Undo2, Crop } from 'lucide-react'
import { supabase } from './supabase'
import { UNIVERSITIES, FACULTIES } from './data/universities'
import { campusDistance, hasCampusCoordinates } from './data/campusCoordinates'

const urlBase64ToUint8Array = (base64) => { const b = (base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(b), c => c.charCodeAt(0)) }
const INTERESTS = ['ดนตรี','เกม','คาเฟ่','ท่องเที่ยว','ถ่ายรูป','หนังและซีรีส์','กีฬา','อ่านหนังสือ','อาหาร','ศิลปะ','สัตว์เลี้ยง','เทคโนโลยี']
const GENDERS = { male: 'ชาย', female: 'หญิง', other: 'อื่น ๆ' }
const uniName = (id) => UNIVERSITIES.find((u) => u.id === id)?.name || id
const ageOf = (d) => { if (!d) return ''; const b = new Date(d), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a }
const pub = (p) => {
  if (!p || typeof p !== 'string') return null
  const path = p.trim()
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const normalized = path.replace(/^\/+/, '').replace(/^avatars\//, '')
  return supabase.storage.from('avatars').getPublicUrl(normalized).data.publicUrl
}
const ph = (n) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f45ca5"/><stop offset="1" stop-color="#8e72ff"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="66" font-size="48" text-anchor="middle" fill="#fff" font-family="sans-serif">${((n || '?').trim()[0]) || '?'}</text></svg>`)
const photoCandidates = (u) => [...new Set([u?.avatar_path, ...(Array.isArray(u?.photo_paths) ? u.photo_paths : [])].filter(Boolean).map(pub).filter(Boolean))]
const Av = ({ u, cls = 'avatar' }) => {
  const candidates = photoCandidates(u)
  const [attempt, setAttempt] = useState(0)
  const signature = candidates.join('|')
  useEffect(() => setAttempt(0), [signature])
  return <img className={cls} src={candidates[attempt] || ph(u?.display_name)} alt={u?.display_name || 'โปรไฟล์'} loading="lazy" onError={() => setAttempt(n => n < candidates.length ? n + 1 : n)} />
}
// v58: scroll lock shared by full-screen overlays; restore the exact previous scroll position.
function useViewportScrollLock(active) {
  useLayoutEffect(() => {
    if (!active) return
    const body = document.body, html = document.documentElement
    const y = window.scrollY
    const old = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow, htmlOverflow: html.style.overflow }
    body.style.position = 'fixed'; body.style.top = `-${y}px`; body.style.left = '0'; body.style.right = '0'; body.style.width = '100%'; body.style.overflow = 'hidden'; html.style.overflow = 'hidden'
    return () => {
      body.style.position = old.position; body.style.top = old.top; body.style.left = old.left; body.style.right = old.right; body.style.width = old.width; body.style.overflow = old.overflow; html.style.overflow = old.htmlOverflow
      window.scrollTo(0, y)
    }
  }, [active])
}

const Brand = ({ onClick }) => <button className="brand" onClick={onClick}><span className="brand-icon"><Heart fill="currentColor" /></span><span>nisit <b>match</b></span></button>

function Landing({ onLogin, onRegister }) {
  return <div className="landing landing-editorial">
    <nav className="landing-nav"><Brand /><div className="landing-links"><a href="#how">วิธีใช้งาน</a><a href="#safety">ความปลอดภัย</a><button onClick={onLogin}>เข้าสู่ระบบ</button><button className="btn btn-pink" onClick={onRegister}>สมัครสมาชิก <ArrowRight size={16}/></button></div></nav>
    <main className="editorial-hero">
      <div className="editorial-topline"><span>FOR UNIVERSITY STUDENTS</span><span>MEET YOUR KIND OF PEOPLE — 2026</span></div>
      <div className="editorial-title-wrap"><span className="editorial-orbit" aria-hidden="true"/><h1>เริ่มต้นจาก<br/><em>ความบังเอิญ</em><br/>ที่ตั้งใจ.</h1><p className="editorial-side-note">YOUR STORY<br/>STARTS HERE <ArrowRight size={17}/></p></div>
      <div className="editorial-bottom"><div><span className="editorial-kicker">NISIT MATCH / 01</span><p>พบคนที่คลิกกัน จากรั้วมหาวิทยาลัยเดียวกันหรือใกล้กัน<br/>ปัดเมื่อพร้อม คุยเมื่อใช่ ในจังหวะที่เป็นตัวคุณ</p></div><div className="editorial-actions"><button className="editorial-primary" onClick={onRegister}>เริ่มต้นใช้งาน <ArrowRight size={21}/></button><button className="editorial-secondary" onClick={onLogin}>มีบัญชีแล้ว? เข้าสู่ระบบ</button></div></div>
      <div className="editorial-marquee" aria-hidden="true"><span>GOOD CONNECTIONS START SOMEWHERE</span><span className="editorial-dot"/><span>GOOD CONNECTIONS START SOMEWHERE</span></div>
    </main>
    <section className="editorial-process" id="how"><div className="editorial-section-head"><span>THE PROCESS / 02</span><h2>ง่าย ๆ แค่เป็นตัวเอง</h2></div><div className="editorial-process-grid">{[["01","สร้างโปรไฟล์","เล่าเรื่องของคุณในแบบที่คุณชอบ"],["02","ปัดเพื่อค้นพบ","เจอคนที่เรียนใกล้กันและมีอะไรตรงกัน"],["03","เริ่มบทสนทนา","เมื่อชอบตรงกัน ก็เริ่มทำความรู้จักกัน"]].map(([n,t,d])=><div className="editorial-process-item" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><ArrowRight size={19}/></div>)}</div></section>
    <section className="editorial-safety" id="safety"><div><span>YOUR SPACE / 03</span><h2>เป็นตัวเองได้<br/><em>อย่างสบายใจ.</em></h2></div><div><p>คุณเลือกได้ว่าจะรู้จักใคร และจะคุยกับใคร ข้อมูลส่วนตัวที่สำคัญไม่ถูกแสดงบนโปรไฟล์สาธารณะ</p><div className="editorial-safety-list"><span><ShieldCheck size={18}/> บล็อกและรายงานผู้ใช้ได้</span><span><LockKeyhole size={18}/> คุยได้เมื่อ Match กันเท่านั้น</span></div><button onClick={onRegister}>เริ่มต้นเรื่องราวของคุณ <ArrowRight size={17}/></button></div></section>
    <footer className="editorial-footer"><Brand/><span>© 2026 NISIT MATCH</span><button onClick={onLogin}>เข้าสู่ระบบ <ArrowRight size={14}/></button></footer>
  </div>
}

function AuthModal({ mode, setMode, close, notify }) {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); let r
    try {
    if (mode === 'login') r = await supabase.auth.signInWithPassword({ email, password: pw })
    else if (mode === 'register') {
      r = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } })
      if (!r.error && !r.data.session) notify('ส่งอีเมลยืนยันแล้ว กรุณาตรวจกล่องจดหมายแล้วกลับมาเข้าสู่ระบบ')
    } else { r = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); if (!r.error) notify('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว') }
    if (r.error) notify(r.error.message.includes('rate limit') ? 'ส่งอีเมลเกินกำหนดชั่วคราว กรุณารอสักพักก่อนลองใหม่' : r.error.message)
    } catch (err) { notify(err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่') }
    finally { setBusy(false) }
  }
  const title = { login: 'ยินดีที่ได้เจอกันอีกครั้ง', register: 'เริ่มต้นเรื่องราวของคุณ', reset: 'ลืมรหัสผ่าน?' }[mode]
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="auth-modal">
      <button className="modal-close icon-btn" onClick={close}><X /></button>
      <div className="auth-brand"><span className="brand-icon"><Heart fill="currentColor" /></span><span>nisit <b>match</b></span></div>
      <div className="auth-heading"><h2>{title}</h2><p>{mode === 'reset' ? 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่' : mode === 'register' ? 'สร้างบัญชีด้วยอีเมล แล้วตั้งโปรไฟล์ในขั้นต่อไป' : 'เข้าสู่ระบบเพื่อไปต่อจากที่ค้างไว้'}</p></div>
      <form className="auth-form" onSubmit={submit}>
        <label>อีเมล<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== 'reset' && <label>รหัสผ่าน<input required type="password" minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="อย่างน้อย 8 ตัวอักษร" value={pw} onChange={(e) => setPw(e.target.value)} /></label>}
        {mode === 'register' && <p className="legal-note">การสมัครหมายถึงคุณยืนยันว่ามีอายุ 18 ปีขึ้นไป</p>}
        <button disabled={busy} className="btn btn-pink btn-full btn-lg">{busy ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สร้างบัญชีของฉัน' : 'ส่งลิงก์รีเซ็ต'} <ArrowRight size={17} /></button>
      </form>
      <div className="auth-switch">
        {mode === 'login' ? <>ยังไม่มีบัญชี?<button onClick={() => setMode('register')}>สมัครสมาชิก</button><button onClick={() => setMode('reset')}>ลืมรหัสผ่าน</button></> : <>มีบัญชีอยู่แล้ว?<button onClick={() => setMode('login')}>เข้าสู่ระบบ</button></>}
      </div>
      <div className="auth-security"><ShieldCheck size={15} /> ข้อมูลส่วนตัวของคุณจะไม่แสดงต่อสาธารณะ</div>
    </div></div>
  )
}

function CropPhotoDialog({ file, onDone, onCancel, notify }) {
  const [zoom, setZoom] = useState(1)
  const [url] = useState(() => URL.createObjectURL(file))
  const image = useRef(null)
  const [working, setWorking] = useState(false)
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  useViewportScrollLock(true)
  const finish = async () => {
    const img = image.current
    if (!img?.naturalWidth || working) return
    setWorking(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 900; canvas.height = 900
      const ctx = canvas.getContext('2d')
      const side = Math.min(img.naturalWidth, img.naturalHeight) / zoom
      ctx.drawImage(img, (img.naturalWidth-side)/2, (img.naturalHeight-side)/2, side, side, 0, 0, 900, 900)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .88))
      if (!blob) throw new Error('ไม่สามารถประมวลผลรูปภาพได้')
      const edited = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onDone(edited)
    } catch(e) { notify(e.message); setWorking(false) }
  }
  return createPortal(<div className="v60-crop-backdrop" role="dialog" aria-modal="true" aria-label="ปรับรูปโปรไฟล์"><div className="v60-crop-dialog">
    <div className="v60-crop-head"><h3><Crop size={19}/> ปรับรูปก่อนอัปโหลด</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="ปิด"><X size={21}/></button></div>
    <div className="v60-crop-preview"><img ref={image} src={url} alt="รูปที่กำลังครอป" style={{ transform: `scale(${zoom})` }}/></div>
    <label className="v60-crop-zoom">ซูมรูป <input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={e=>setZoom(+e.target.value)}/></label>
    <p>รูปจะถูกครอปเป็นสี่เหลี่ยมจัตุรัส โดยจัดกึ่งกลางภาพ</p>
    <div className="v60-crop-actions"><button type="button" className="btn btn-ghost" onClick={onCancel}>ยกเลิก</button><button type="button" className="btn btn-pink" disabled={working} onClick={finish}>{working?'กำลังปรับรูป...':'ใช้รูปนี้'}</button></div>
  </div></div>, document.body)
}

function SwipeDeck({ people, onLike, onSkip, onSuperLike, onUndo, canUndo, onOpen, onReport, verifiedIds = [] }) {
  const [photo, setPhoto] = useState(0), [busy, setBusy] = useState(false), [superBurst, setSuperBurst] = useState(false), [swipeBurst, setSwipeBurst] = useState(null)
  const start = useRef(null)
  const dragNow = useRef({ x: 0, y: 0 })
  const dragFrame = useRef(0)
  const cardRef = useRef(null)
  const yesRef = useRef(null)
  const noRef = useRef(null)
  const busyRef = useRef(false)
  const person = people[0]
  const paint = useCallback((x, y, animate = false) => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = animate ? 'transform 360ms cubic-bezier(.2,.85,.25,1)' : 'none'
    card.style.transform = `translate3d(${x}px,${y}px,0) rotate(${x / 18}deg)`
    const strength = Math.min(Math.abs(x) / 125, 1)
    for (const [el, visible] of [[yesRef.current, x > 12], [noRef.current, x < -12]]) {
      if (!el) continue
      el.style.opacity = visible ? String(strength) : '0'
      el.style.transform = `translate3d(0,${(1-strength)*14}px,0) scale(${.83+strength*.17})`
    }
  }, [])
  useEffect(() => () => cancelAnimationFrame(dragFrame.current), [])
  useLayoutEffect(() => {
    setPhoto(0)
    setSuperBurst(false)
    setSwipeBurst(null)
    start.current = null
    dragNow.current = { x: 0, y: 0 }
    busyRef.current = false
    setBusy(false)
    paint(0, 0)
  }, [person?.id, paint])
  const photos = person ? [person.avatar_path, ...(person.photo_paths || []).filter(x => x !== person.avatar_path)].filter(Boolean).slice(0, 6) : []
  const act = async (like) => {
    if (!person || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(like ? 18 : 9)
    setSwipeBurst(like ? 'like' : 'pass')
    // Keep the current profile visible during the cinematic charge-up.
    // The parent only advances the deck after the transition has completed.
    try {
      // Give the visual feedback a short beat, then move the card on the compositor.
      // The database request runs concurrently with the exit animation.
      await new Promise(resolve => setTimeout(resolve, 175))
      paint(like ? 520 : -520, -28, true)
      await Promise.all([
        (like ? onLike(person) : onSkip(person)),
        new Promise(resolve => setTimeout(resolve, 385))
      ])
    } finally { setSwipeBurst(null); busyRef.current = false; setBusy(false); paint(0, 0) }
  }
  const doSuperLike = async () => {
    if (!person || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      const ok = await onSuperLike(person)
      if (!ok) return
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([18, 35, 28])
      setSuperBurst(true)
      // Keep the current card visible long enough for the animation to finish.
      await new Promise(resolve => setTimeout(resolve, 1050))
    } finally {
      setSuperBurst(false)
      busyRef.current = false
      setBusy(false)
    }
  }
  const down = (e) => {
    if (busyRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    if (!start.current || busyRef.current) return
    dragNow.current = { x: e.clientX - start.current.x, y: e.clientY - start.current.y }
    if (!dragFrame.current) dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = 0
      paint(dragNow.current.x, dragNow.current.y)
    })
  }
  const up = () => {
    if (!start.current) return
    start.current = null
    cancelAnimationFrame(dragFrame.current)
    dragFrame.current = 0
    const x = dragNow.current.x
    if (Math.abs(x) > 95) act(x > 0)
    else { dragNow.current = { x: 0, y: 0 }; paint(0, 0, true) }
  }
  if (!person) return <div className="swipe-empty"><Heart size={40}/><h2>ดูครบทุกโปรไฟล์แล้ว</h2><p>ลองปรับตัวกรองเพื่อพบคนใหม่ ๆ</p></div>
  return <div className="swipe-stage"><div className="swipe-stack" aria-label="ปัดโปรไฟล์">
    {people[1] && <div className="swipe-card swipe-behind"><Av u={people[1]} cls="swipe-behind-image" /></div>}
    <article className="swipe-card swipe-front" ref={cardRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; dragNow.current = { x: 0, y: 0 }; paint(0, 0, true) }} style={{ touchAction: 'none' }}>
      <img draggable="false" src={pub(photos[photo]) || ph(person.display_name)} alt={person.display_name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ph(person.display_name) }} />
      <div className="swipe-photo-bars">{(photos.length ? photos : [null]).map((_, i) => <span key={i} className={i === photo ? 'active' : ''}/>)}</div>
      <div className="swipe-tap left" onPointerDown={e => e.stopPropagation()} onClick={() => setPhoto(v => Math.max(0, v - 1))}/><div className="swipe-tap right" onPointerDown={e => e.stopPropagation()} onClick={() => setPhoto(v => Math.min(photos.length - 1, v + 1))}/>
      <div className="swipe-feedback yes" ref={yesRef} aria-hidden="true">
        <span className="swipe-feedback-spark spark-one"/><span className="swipe-feedback-spark spark-two"/><span className="swipe-feedback-spark spark-three"/>
        <span className="swipe-feedback-icon"><Heart size={25} fill="currentColor" strokeWidth={1.8}/></span><span className="swipe-feedback-label">LIKE</span><span className="swipe-feedback-caption">ชอบคนนี้</span>
      </div>
      <div className="swipe-feedback no" ref={noRef} aria-hidden="true">
        <span className="swipe-feedback-spark spark-one"/><span className="swipe-feedback-spark spark-two"/><span className="swipe-feedback-spark spark-three"/>
        <span className="swipe-feedback-icon"><X size={26} strokeWidth={2.7}/></span><span className="swipe-feedback-label">NOPE</span><span className="swipe-feedback-caption">ไว้เจอกันใหม่</span>
      </div>
      <div className="swipe-info"><h2>{person.display_name}, {person.age}</h2><p><GraduationCap size={17}/>{uniName(person.university_id)}</p>{verifiedIds.includes(person.id) && <CampusVerifiedBadge />}{person.relationship_intent && <span className="nm-intent-tag">{intentLabel(person.relationship_intent)}</span>}<p>{person.bio || 'มาทำความรู้จักกัน'}</p><div className="tags">{(person.interests || []).slice(0, 3).map(x => <span className="tag" key={x}>{x}</span>)}</div>{itunesTrack(person) && <div className="swipe-song" onPointerDown={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}><ITunesSongCard track={itunesTrack(person)} compact /></div>}</div>
      {swipeBurst && <div className={'v64-swipe-burst ' + swipeBurst} aria-hidden="true"><div className="v64-swipe-burst-icon">{swipeBurst === 'like' ? <Heart fill="currentColor" size={64}/> : <X size={70}/>}</div><span>{swipeBurst === 'like' ? 'LIKE' : 'PASS'}</span>{Array.from({length:10},(_,i)=><i key={i} style={{'--i':i}}/>)}</div>}
      {superBurst && <div className="nm-superburst" aria-live="polite" aria-label="ส่ง Super Like แล้ว">
        <div className="nm-superburst-halo" />
        <div className="nm-superburst-ring ring-one" /><div className="nm-superburst-ring ring-two" />
        {Array.from({length: 14}, (_, i) => <i key={i} className="nm-superburst-particle" style={{'--i':i,'--angle':`${i*360/14}deg`}} />)}
        <div className="nm-superburst-star"><Star size={68} strokeWidth={1.7} fill="currentColor"/></div>
        <div className="nm-superburst-title">SUPER LIKE</div><div className="nm-superburst-caption">ส่งความพิเศษไปแล้ว</div>
      </div>}
    </article></div><div className="swipe-controls"><button className="swipe-control undo" disabled={busy || !canUndo} onClick={onUndo} title="ย้อนกลับการปัดล่าสุด" aria-label="ย้อนกลับ"><Undo2 size={20}/></button><button disabled={busy} className="swipe-control reject" onClick={() => act(false)} aria-label="ข้าม" title="ข้าม"><X size={25}/></button><button className="swipe-control info" onClick={() => onOpen(person)} aria-label="ดูโปรไฟล์" title="ดูโปรไฟล์"><UserRound size={20}/></button><button disabled={busy} className="swipe-control accept" onClick={() => act(true)} aria-label="ถูกใจ" title="ถูกใจ"><Heart size={27} fill="currentColor"/></button><button disabled={busy} className="swipe-control super" onClick={doSuperLike} aria-label="Super Like" title="Super Like (สูงสุด 3 ครั้งต่อวัน)"><Star size={21}/></button><button className="swipe-control report" onClick={() => onReport(person)} aria-label="รายงาน" title="รายงาน"><Flag size={17}/></button></div><p className="swipe-hint">← ปัดซ้ายเพื่อข้าม · ปัดขวาเพื่อถูกใจ →</p></div>
}

function CampusVerifiedBadge() {
  return <span className="nm-campus-verified" title="ยืนยันความเป็นเจ้าของอีเมลมหาวิทยาลัยแล้ว"><ShieldCheck size={15} strokeWidth={2.2}/><span>ยืนยันอีเมลมหาวิทยาลัยแล้ว</span></span>
}

function PersonCard({ p, onLike, onSkip, onOpen, onReport, verifiedIds = [] }) {
  return (
    <article className="person-card"><div className="person-image"><Av u={p} cls="person-photo" /><div className="image-gradient" />
      {verifiedIds.includes(p.id) && <CampusVerifiedBadge />}
      <button className="card-more" onClick={() => onReport(p)} title="รายงาน"><Flag size={15} /></button>
      <div className="person-title"><h3>{p.display_name}, {p.age}</h3><p><GraduationCap size={13} />{uniName(p.university_id)}</p></div></div>
      <div className="person-body"><div className="tags">{(p.interests || []).slice(0, 3).map((i) => <span className="tag" key={i}>{i}</span>)}</div>
        {p.relationship_intent && <span className="nm-intent-tag">{intentLabel(p.relationship_intent)}</span>}<p className="person-bio">{p.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
        <div className="person-actions"><button className="round-action nope" onClick={() => onSkip(p)} title="ข้าม"><X size={20} /></button><button className="btn btn-pink like-btn" onClick={() => onLike(p)}><Heart size={17} fill="currentColor" /> ถูกใจ</button><button className="round-action more" onClick={() => onOpen(p)} title="ดูโปรไฟล์"><UserRound size={18} /></button></div></div></article>
  )
}

function Heading({ kicker, title, sub, children }) {
  return <div className="welcome-row"><div><div className="section-kicker">{kicker}</div><h1>{title} <span>♥</span></h1><p>{sub}</p></div>{children}</div>
}


function VoiceBubble({ src, mine }) {
  const audio = useRef(null)
  const seekingRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const fmt = n => `${Math.floor((Number.isFinite(n) ? n : 0) / 60)}:${String(Math.floor((Number.isFinite(n) ? n : 0) % 60)).padStart(2, '0')}`

  useEffect(() => {
    setPlaying(false)
    setPosition(0)
    setDuration(0)
    setAudioError(false)
    const node = audio.current
    if (node) { node.pause(); node.load() }
  }, [src])

  const toggle = () => {
    const node = audio.current
    if (!node) return
    if (!node.paused) { node.pause(); return }
    setAudioError(false)
    // เรียก play() โดยตรงภายใน click เพื่อรักษา user gesture ของ iOS Safari
    const promise = node.play()
    if (promise?.catch) promise.catch(err => {
      console.error('Voice playback failed:', err)
      setPlaying(false)
      setAudioError(true)
    })
  }

  const seek = ratio => {
    const node = audio.current
    const total = Number.isFinite(node?.duration) ? node.duration : duration
    if (node && total > 0) node.currentTime = Math.max(0, Math.min(total, ratio * total))
  }

  return <div className={'voice-bubble ' + (mine ? 'voice-mine' : '')}>
    <audio
      ref={audio}
      src={src}
      preload="auto"
      playsInline
      onLoadedMetadata={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      onTimeUpdate={e => setPosition(e.currentTarget.currentTime)}
      onPlaying={() => { setPlaying(true); setAudioError(false) }}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setPosition(0); if (audio.current) audio.current.currentTime = 0 }}
      onError={() => { setPlaying(false); setAudioError(true) }}
    />
    <button type="button" className="voice-play" onClick={toggle} aria-label={playing ? 'หยุดเสียงชั่วคราว' : 'เล่นข้อความเสียง'}>
      {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
    </button>
    <div className="voice-content">
      <div className="voice-wave" role="slider" aria-label="เลื่อนตำแหน่งเสียง" aria-valuemin={0} aria-valuemax={Math.max(1, Math.floor(duration || 1))} aria-valuenow={Math.floor(position)} tabIndex={0}
        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width) }}
        onKeyDown={e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const total = duration || 1; seek((position + (e.key === 'ArrowRight' ? 5 : -5)) / total) } }}>
        {Array.from({ length: 30 }, (_, i) => <span key={i} className={duration && i / 30 <= position / duration ? 'heard' : ''} style={{ height: `${7 + ((i * 13 + 7) % 21)}px` }} />)}
      </div>
      <span className="voice-duration">{audioError ? 'ลองใหม่' : fmt(playing ? position : duration || position)}</span>
    </div>
  </div>
}

// Live microphone visualizer: bars are driven by real audio samples, not a looping CSS animation.
function LiveMicWave({ stream }) {
  const bars = useRef(null)
  useEffect(() => {
    if (!stream || !bars.current) return
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.68
    source.connect(analyser) // Do not connect to speakers: prevents microphone feedback.
    const samples = new Uint8Array(analyser.frequencyBinCount)
    let frame = 0
    let active = true
    const draw = () => {
      if (!active) return
      analyser.getByteTimeDomainData(samples)
      const nodes = bars.current?.children
      if (nodes) {
        const chunk = Math.max(1, Math.floor(samples.length / nodes.length))
        for (let i = 0; i < nodes.length; i++) {
          let energy = 0
          for (let j = i * chunk; j < Math.min(samples.length, (i + 1) * chunk); j++) {
            const v = (samples[j] - 128) / 128
            energy += v * v
          }
          const rms = Math.sqrt(energy / chunk)
          const height = Math.min(34, Math.max(4, 4 + rms * 125))
          nodes[i].style.height = `${height}px`
        }
      }
      frame = requestAnimationFrame(draw)
    }
    context.resume().catch(() => {})
    draw()
    return () => { active = false; cancelAnimationFrame(frame); source.disconnect(); analyser.disconnect(); context.close().catch(() => {}) }
  }, [stream])
  return <span className="record-wave live-mic-wave" ref={bars} aria-label="คลื่นเสียงจากไมโครโฟนแบบเรียลไทม์">{Array.from({length:29}, (_, i) => <i key={i}/>)}</span>
}

function Messages({ me, matches, notify, reload, onOpenProfile, onMessagesRead }) {
  const [selectedId, setSelectedId] = useState(() => {
    try { return sessionStorage.getItem(`nisit-active-chat:${me}`) || null } catch { return null }
  })
  useEffect(() => {
    try {
      if (selectedId) sessionStorage.setItem(`nisit-active-chat:${me}`, selectedId)
      else sessionStorage.removeItem(`nisit-active-chat:${me}`)
    } catch {}
  }, [selectedId, me])
  // Chat themes are personal to this browser/account and saved per conversation.
  const CHAT_THEMES = [
    { id: 'midnight', name: 'Midnight', swatch: '#8c76ef' },
    { id: 'rose', name: 'Rose', swatch: '#f26b9e' },
    { id: 'ocean', name: 'Ocean', swatch: '#3d9eea' },
    { id: 'sage', name: 'Sage', swatch: '#59ae91' },
    { id: 'lavender', name: 'Lavender', swatch: '#b28bf3' },
    { id: 'sunset', name: 'Sunset', swatch: '#f19b66' },
  ]
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [chatTheme, setChatTheme] = useState('midnight')
  useEffect(() => {
    setThemePickerOpen(false)
    try {
      const stored = localStorage.getItem(`nisit-chat-theme:${me}:${selectedId}`)
      setChatTheme(CHAT_THEMES.some(t => t.id === stored) ? stored : 'midnight')
    } catch { setChatTheme('midnight') }
  }, [selectedId, me])
  const chooseChatTheme = (id) => {
    setChatTheme(id)
    setThemePickerOpen(false)
    try { localStorage.setItem(`nisit-chat-theme:${me}:${selectedId}`, id) } catch {}
  }
  // v50: independent inbox previews and per-room unread counters.
  const [inbox, setInbox] = useState({})
  const inboxRequest = useRef(0)
  const refreshInbox = useCallback(async () => {
    if (!me || !matches.length) { setInbox({}); return }
    const request = ++inboxRequest.current
    const results = await Promise.all(matches.map(async m => {
      const [latest, unread] = await Promise.all([
        supabase.from('messages').select('id,body,sender_id,attachment_type,created_at').eq('match_id', m.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('match_id', m.id).neq('sender_id', me).is('read_at', null)
      ])
      return [m.id, { last: latest.data?.[0] || null, unread: unread.count || 0 }]
    }))
    if (request === inboxRequest.current) setInbox(Object.fromEntries(results))
  }, [me, matches])
  useEffect(() => {
    refreshInbox()
    const channel = supabase.channel(`inbox-preview-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refreshInbox)
      .subscribe()
    // Fallback for projects without Realtime publication enabled for messages.
    const poll = setInterval(refreshInbox, 12000)
    const visible = () => { if (document.visibilityState === 'visible') refreshInbox() }
    document.addEventListener('visibilitychange', visible)
    return () => { inboxRequest.current++; clearInterval(poll); document.removeEventListener('visibilitychange', visible); supabase.removeChannel(channel) }
  }, [me, refreshInbox])
  const sel = matches.find(m => m.id === selectedId) || null
  const roomId = sel?.id
  // Lock document scrolling without shifting the fixed chat viewport.
  // The chat is portaled to document.body below, so it never inherits a scrolled
  // or transformed page container's coordinate system.
  useEffect(() => {
    if (!roomId || typeof window === 'undefined') return
    const root = document.documentElement
    const body = document.body
    const previous = { htmlOverflow: root.style.overflow, bodyOverflow: body.style.overflow,
      htmlOverscroll: root.style.overscrollBehavior, bodyOverscroll: body.style.overscrollBehavior }
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    root.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    return () => {
      root.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      root.style.overscrollBehavior = previous.htmlOverscroll
      body.style.overscrollBehavior = previous.bodyOverscroll
    }
  }, [roomId])
  const [msgs, setMsgs] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [messageMenu, setMessageMenu] = useState(null)
  const longPress = useRef(null)
  const pressOrigin = useRef(null)
  const suppressNextClick = useRef(false)
  const pressActivated = useRef(false)
  useEffect(() => () => clearTimeout(longPress.current), [])
  const chatExtrasSupported = useRef(true)
  const pendingSends = useRef(new Map())
  const [text, setText] = useState('')
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [chatViewport, setChatViewport] = useState(null)
  const typingChannel = useRef(null)
  const typingTimer = useRef(null)
  const lastTypingSent = useRef(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [showLatestButton, setShowLatestButton] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [micStream, setMicStream] = useState(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const recordingRoom = useRef(null)
  const recordingStopTimer = useRef(null)
  const [micBusy, setMicBusy] = useState(false)
  const discardRecord = useRef(false)
  const [mediaUrls, setMediaUrls] = useState({})
  const [openChatImage, setOpenChatImage] = useState(null)
  useEffect(() => { setOpenChatImage(null); setReplyTo(null); setMessageMenu(null) }, [selectedId])
  useEffect(() => {
    if (!openChatImage) return
    const onKey = (event) => { if (event.key === 'Escape') setOpenChatImage(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openChatImage])
  const recorder = useRef(null)
  const recordParts = useRef([])
  const end = useRef(null)
  const scrollBox = useRef(null)
  const fileInput = useRef(null)
  const stickToBottom = useRef(true)
  const forceNextScroll = useRef(false)
  const lastMessageId = useRef(null)
  const initialChatScroll = useRef(false)
  const initialChatRoom = useRef(null)
  const userReadingHistory = useRef(false)
  const scrollToLatest = useCallback((smooth = true) => {
    stickToBottom.current = true
    userReadingHistory.current = false
    setShowLatestButton(false)
    const box = scrollBox.current
    if (!box) return
    box.scrollTo({ top: box.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])
  // Run after React commits the messages, before the browser paints.
  useLayoutEffect(() => {
    const last = msgs[msgs.length - 1]
    if (!last) { lastMessageId.current = null; return }
    if (last.id === lastMessageId.current) return
    const initial = lastMessageId.current === null
    lastMessageId.current = last.id
    if (initial || forceNextScroll.current || (last.sender_id === me && !userReadingHistory.current) || stickToBottom.current) {
      if (initial) scrollToLatest(false)
      else requestAnimationFrame(() => scrollToLatest(true))
    }
    forceNextScroll.current = false
  }, [msgs, me, scrollToLatest])
  useEffect(() => {
    lastMessageId.current = null
    stickToBottom.current = true
    userReadingHistory.current = false
    forceNextScroll.current = false
    setShowLatestButton(false)
    initialChatScroll.current = false
    initialChatRoom.current = roomId
  }, [roomId])
  // Images and voice controls can change message heights after the first paint.
  // Keep the initial view at the newest message while the room settles.
  // Stop doing so once the user scrolls manually or loads older messages.
  useEffect(() => {
    if (!roomId || !msgs.length || initialChatRoom.current !== roomId || initialChatScroll.current) return
    const box = scrollBox.current
    if (!box) return
    let active = true
    let frame = 0
    const pin = () => {
      if (!active) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (active) { box.scrollTop = box.scrollHeight; stickToBottom.current = true; setShowLatestButton(false) }
      })
    }
    pin()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(pin) : null
    if (observer) {
      observer.observe(box)
      Array.from(box.children).forEach(child => observer.observe(child))
    }
    const stop = () => { active = false; initialChatScroll.current = true; observer?.disconnect(); cancelAnimationFrame(frame) }
    box.addEventListener('wheel', stop, { once: true, passive: true })
    box.addEventListener('touchstart', stop, { once: true, passive: true })
    const timeout = setTimeout(stop, 1400)
    return () => {
      active = false
      observer?.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      box.removeEventListener('wheel', stop)
      box.removeEventListener('touchstart', stop)
    }
  }, [roomId, msgs.length, mediaUrls])

  // Keep the newest bubble visible as typing indicators, images and the
  // visual viewport change size. Never pull someone away from older messages.
  useEffect(() => {
    const box = scrollBox.current
    if (!box || !roomId) return
    let frame = 0
    const keepBottom = () => {
      if (!stickToBottom.current || userReadingHistory.current) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { if (stickToBottom.current && !userReadingHistory.current) box.scrollTo({ top: box.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }) })
    }
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(keepBottom) : null
    observer?.observe(box)
    const contents = box.firstElementChild
    if (contents) observer?.observe(contents)
    keepBottom()
    return () => { observer?.disconnect(); cancelAnimationFrame(frame) }
  }, [roomId, partnerTyping, chatViewport?.height, msgs.length])

  useEffect(() => { if (!recording) return; const id = setInterval(() => setRecordSeconds(s => s + 1),1000); return () => clearInterval(id) }, [recording])
  useEffect(() => { if (!recording) return; recordingStopTimer.current = setTimeout(() => { if (recorder.current?.state === 'recording') recorder.current.stop(); setRecording(false); setMicStream(null) }, 60000); return () => { clearTimeout(recordingStopTimer.current); recordingStopTimer.current = null } }, [recording])
  useEffect(() => { if (recording && recordingRoom.current !== roomId) { discardRecord.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); setRecording(false); setMicStream(null) } }, [roomId, recording])
  const partnerName = p => p?.display_name?.trim() || 'คู่ Match'

  const fetchMessages = useCallback(async (older = false) => {
    if (!roomId) return
    if (older) { initialChatScroll.current = true; userReadingHistory.current = true; stickToBottom.current = false; setLoadingOlder(true) }
    const anchor = older ? msgs[0]?.created_at : null
    let query = supabase.from('messages').select('*').eq('match_id', roomId)
      .order('created_at', { ascending: false }).limit(40)
    if (anchor) query = query.lt('created_at', anchor)
    const { data, error } = await query
    if (error) { notify('โหลดข้อความไม่สำเร็จ: ' + error.message); setLoadingOlder(false); return }
    const rows = (data || []).reverse()
    setHasMore((data || []).length === 40)
    if (older) {
      const box = scrollBox.current
      const before = box?.scrollHeight || 0
      setMsgs(prev => [...rows.filter(r => !prev.some(p => p.id === r.id)), ...prev])
      requestAnimationFrame(() => { if (box) box.scrollTop += box.scrollHeight - before })
    } else setMsgs(rows)
    setLoadingOlder(false)
  }, [roomId, msgs[0]?.created_at, notify])

  useEffect(() => {
    if (!roomId) { setMsgs([]); return }
    let active = true
    setMsgs([])
    const load = async () => {
      const { data, error } = await supabase.from('messages').select('*').eq('match_id', roomId)
        .order('created_at', { ascending: false }).limit(40)
      if (!active) return
      if (error) notify(error.message)
      else { setMsgs((data || []).reverse()); setHasMore((data || []).length === 40) }
      const { error: readError } = await supabase.from('messages').update({ read_at: new Date().toISOString() })
        .eq('match_id', roomId).neq('sender_id', me).is('read_at', null)
      if (!readError) { onMessagesRead?.(); refreshInbox() }
    }
    load()
    const channel = supabase.channel('chat-' + roomId, { config: { presence: { key: me } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `match_id=eq.${roomId}` }, (payload) => {
        if (!active) return
        if (payload.eventType === 'INSERT' && payload.new?.id) {
          const incoming = payload.new
          if (incoming.sender_id !== me) {
            supabase.from('messages').update({ read_at: new Date().toISOString() })
              .eq('id', incoming.id).is('read_at', null)
              .then(({ error }) => { if (!error) { onMessagesRead?.(); refreshInbox() } })
          }
          // The optimistic bubble already represents our outgoing message.
          const alreadyPending = [...pendingSends.current.values()].some(p =>
            p.roomId === roomId && p.body === incoming.body && incoming.sender_id === me
          )
          if (alreadyPending) return
          setMsgs(prev => prev.some(m => m.id === incoming.id) ? prev :
            [...prev, incoming].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
        } else if (payload.eventType === 'UPDATE' && payload.new?.id) {
          setMsgs(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m))
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          setMsgs(prev => prev.filter(m => m.id !== payload.old.id))
        }
      }).on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!active || payload?.sender === me) return
        setPartnerTyping(!!payload?.typing)
        clearTimeout(typingTimer.current)
        if (payload?.typing) typingTimer.current = setTimeout(() => setPartnerTyping(false), 2500)
      }).on('presence', { event: 'sync' }, () => {
        if (!active) return
        const state = channel.presenceState()
        setPartnerOnline(Object.keys(state).some(id => id !== me && state[id]?.length > 0))
      }).subscribe(status => {
        if (status === 'SUBSCRIBED') channel.track({ user_id: me, joined_at: new Date().toISOString() }).catch(() => {})
      })
    typingChannel.current = channel
    return () => { active = false; typingChannel.current = null; clearTimeout(typingTimer.current); setPartnerTyping(false); setPartnerOnline(false); supabase.removeChannel(channel) }
  }, [roomId, me, notify])

  useEffect(() => {
    let active = true
    const files = msgs.filter(m => m.attachment_path && !mediaUrls[m.attachment_path])
    if (!files.length) return
    Promise.all(files.map(async m => {
      const { data, error } = await supabase.storage.from('chat-media').createSignedUrl(m.attachment_path, 3600)
      return [m.attachment_path, error ? null : data?.signedUrl]
    })).then(entries => { if (active) setMediaUrls(prev => ({ ...prev, ...Object.fromEntries(entries.filter(x => x[1])) })) })
    return () => { active = false }
  }, [msgs, mediaUrls])

  // Mobile keyboards can resize the visual viewport without resizing fixed-position elements.
  // Keep the composer inside the visible area while Safari/Chrome keyboard is open.
  useEffect(() => {
    if (!roomId || typeof window === 'undefined') { setChatViewport(null); return }
    const viewport = window.visualViewport
    if (!viewport) return
    // iOS Safari/PWA changes the *visual* viewport during keyboard animation.
    // Re-read it on focus and orientation changes as well as resize/scroll.
    let frame = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const height = Math.max(1, Math.floor(viewport.height))
        const top = Math.max(0, Math.floor(viewport.offsetTop))
        const keyboardOpen = viewport.height < window.innerHeight - 100
        setChatViewport({ height, top, keyboardOpen })
      })
    }
    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', sync)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      document.removeEventListener('focusin', sync)
      document.removeEventListener('focusout', sync)
    }
  }, [roomId])
  const onCompose = (value) => {
    setText(value)
    const now = Date.now()
    if (roomId && now - lastTypingSent.current > 1200) {
      lastTypingSent.current = now
      typingChannel.current?.send({ type: 'broadcast', event: 'typing', payload: { sender: me, typing: !!value.trim() } }).catch(() => {})
    }
  }
  const send = async e => {
    e.preventDefault()
    const body = text.trim()
    const targetRoom = roomId
    if (!body || !targetRoom) return
    const tempId = 'pending-' + crypto.randomUUID()
    const optimistic = {
      id: tempId, match_id: targetRoom, sender_id: me, body, reply_to: replyTo?.id || null,
      created_at: new Date().toISOString(), pending: true
    }
    pendingSends.current.set(tempId, { roomId: targetRoom, body })
    setText('')
    setReplyTo(null)
    forceNextScroll.current = true
    setMsgs(prev => [...prev, optimistic])
    try {
      let payload = { match_id: targetRoom, sender_id: me, body }
      if (replyTo?.id && chatExtrasSupported.current) payload.reply_to = replyTo.id
      let { data, error } = await supabase.from('messages').insert(payload).select('*').single()
      if (error && payload.reply_to && /reply_to|schema cache|column/i.test(error.message || '')) {
        chatExtrasSupported.current = false
        ;({ data, error } = await supabase.from('messages').insert({ match_id: targetRoom, sender_id: me, body }).select('*').single())
        notify('ต้องรัน SQL v56 เพื่อเปิดใช้การตอบกลับข้อความ')
      }
      if (error) throw error
      if (data) setMsgs(prev => {
        if (roomId !== targetRoom) return prev
        const withoutTemp = prev.filter(m => m.id !== tempId && m.id !== data.id)
        return [...withoutTemp, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      })
    } catch (error) {
      setMsgs(prev => prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m))
      notify('ส่งข้อความไม่สำเร็จ: ' + (error?.message || 'กรุณาลองใหม่'))
    } finally {
      pendingSends.current.delete(tempId)
    }
  }
  const setReaction = async (message, choice) => {
    setMessageMenu(null)
    if (!chatExtrasSupported.current || message.pending) return notify('กรุณาติดตั้ง SQL v56 ก่อนใช้รีแอ็กชัน')
    const reaction = message.reaction === choice ? null : choice
    const { error } = await supabase.from('messages').update({ reaction }).eq('id', message.id).eq('match_id', roomId)
    if (error) { if (/reaction|schema cache|column/i.test(error.message || '')) chatExtrasSupported.current = false; notify('ใส่รีแอ็กชันไม่สำเร็จ: ' + error.message); return }
    setMsgs(prev => prev.map(m => m.id === message.id ? { ...m, reaction } : m))
  }
  const openMessageMenu = (message) => {
    if (message.pending) return
    suppressNextClick.current = true
    pressActivated.current = true
    if (typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges()
    setMessageMenu(message.id)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12)
  }
  const beginMessagePress = (event, message) => {
    if (event.target.closest('button, audio, input')) return
    pressActivated.current = false
    clearTimeout(longPress.current)
    const point = event.touches?.[0]
    pressOrigin.current = point ? { x: point.clientX, y: point.clientY } : null
    longPress.current = setTimeout(() => openMessageMenu(message), 420)
  }
  const moveMessagePress = (event) => {
    const point = event.touches?.[0]
    if (point && pressOrigin.current && (Math.abs(point.clientX - pressOrigin.current.x) > 9 || Math.abs(point.clientY - pressOrigin.current.y) > 9)) clearTimeout(longPress.current)
  }
  const endMessagePress = () => { clearTimeout(longPress.current); pressOrigin.current = null }
  const preventNativeMessageSelect = (event) => {
    if (event.target.closest('button, audio, input')) return
    event.preventDefault()
  }
  const quoteFor = (message) => message.attachment_type === 'image' ? 'รูปภาพ' : message.attachment_type === 'audio' ? 'ข้อความเสียง' : (message.body || 'ข้อความ')
  const dateLabel = (date) => { const d = new Date(date); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('th-TH', { day:'numeric', month:'long', year:'numeric' }) }
  const sendMedia = async (file, type, targetRoom = roomId) => {
    if (!targetRoom || !file) return
    if (file.size > 10 * 1024 * 1024) return notify('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
    if (type === 'image' && !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return notify('รองรับ JPG, PNG, WebP และ GIF')
    if (type === 'audio' && !['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/x-m4a'].includes(file.type.split(';')[0])) return notify('ไฟล์เสียงไม่รองรับ')
    setUploading(true)
    const extension = (file.name?.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg')).replace(/[^a-z0-9]/gi, '').toLowerCase()
    const path = `${targetRoom}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type.split(';')[0], upsert: false })
    if (uploadError) { setUploading(false); return notify('อัปโหลดไม่สำเร็จ: ' + uploadError.message) }
    const { error } = await supabase.from('messages').insert({ match_id: targetRoom, sender_id: me, body: type === 'image' ? '📷 รูปภาพ' : '🎤 ข้อความเสียง', attachment_type: type, attachment_path: path })
    setUploading(false)
    if (error) { await supabase.storage.from('chat-media').remove([path]); notify('ส่งไฟล์ไม่สำเร็จ: ' + error.message) }
    else if (roomId === targetRoom) { forceNextScroll.current = true; scrollToLatest(true) }
  }
  const toggleRecord = async () => {
    if (recording) { recorder.current?.stop(); setRecording(false); setMicStream(null); return }
    if (micBusy) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return notify('เบราว์เซอร์นี้ไม่รองรับการอัดเสียง')
    setMicBusy(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorder.current = r; recordingRoom.current = roomId; recordParts.current = []
      r.ondataavailable = e => { if (e.data.size) recordParts.current.push(e.data) }
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop()); setMicStream(null)
        if (discardRecord.current) { discardRecord.current = false; return }
        const targetRoom = recordingRoom.current
        if (!recordParts.current.length) return notify('ไม่มีข้อมูลเสียง กรุณาลองอัดใหม่')
        const blob = new Blob(recordParts.current, { type: r.mimeType || 'audio/webm' })
        const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
        if (blob.size < 400) return notify('เสียงสั้นเกินไป กรุณาลองใหม่')
        sendMedia(new File([blob], `voice.${ext}`, { type: blob.type }), 'audio', targetRoom)
      }
      discardRecord.current = false; setRecordSeconds(0); r.start(250); setMicStream(stream); setRecording(true)
    } catch { notify('ไม่สามารถใช้ไมโครโฟนได้ กรุณาอนุญาตการเข้าถึงไมโครโฟน') }
    finally { setMicBusy(false) }
  }
  const cancelRecord = () => { discardRecord.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); setRecording(false); setMicStream(null); setRecordSeconds(0) }
  useEffect(() => () => { if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.stop(); recorder.current.stream?.getTracks().forEach(t => t.stop()) } }, [])
  const block = async () => { if (!sel || !confirm(`ต้องการบล็อก ${partnerName(sel.p)} ใช่ไหม?`)) return; const { error } = await supabase.from('blocks').insert({ blocker: me, blocked: sel.p.id }); if (error) return notify(error.message); setSelectedId(null); reload() }
  const report = async () => { if (!sel) return; const reason = prompt('เหตุผลในการรายงาน'); if (!reason) return; const { error } = await supabase.from('reports').insert({ reporter: me, reported: sel.p.id, reason: reason.slice(0,500) }); notify(error ? error.message : 'ส่งรายงานแล้ว') }
  return (<>
    {!sel && <Heading kicker="YOUR CONNECTIONS" title="ข้อความ" sub="เลือกคนที่ต้องการพูดคุย" />}
    {sel ? createPortal(<div className={"chat-layout chat-theme-" + chatTheme + " " + (sel ? "chat-room-open chat-fullscreen" : "chat-inbox-open") + (sel && chatViewport?.keyboardOpen ? " chat-keyboard-open" : "")} style={sel && chatViewport ? { "--chat-viewport-height": `${chatViewport.height}px`, "--chat-viewport-top": `${chatViewport.top}px` } : undefined}>
      <div className="chat-list"><div className="chat-list-head"><b>ข้อความของคุณ<small>เลือกคนที่ต้องการคุย</small></b><span>{matches.length}</span></div>
        {[...matches].sort((a,b) => new Date(inbox[b.id]?.last?.created_at || b.created_at || 0) - new Date(inbox[a.id]?.last?.created_at || a.created_at || 0)).map(m => {
          const info = inbox[m.id], last = info?.last, unreadCount = info?.unread || 0
          const preview = !last ? 'เริ่มบทสนทนากันเลย' : `${last.sender_id === me ? 'ฉัน : ' : ''}${last.attachment_type === 'image' ? 'ส่งรูปภาพ' : last.attachment_type === 'audio' ? 'ส่งข้อความเสียง' : (last.body || 'ส่งไฟล์')}`
          return <button key={m.id} className={'chat-person ' + (roomId === m.id ? 'selected' : '') + (unreadCount ? ' chat-person-unread' : '')} onClick={() => { setSelectedId(m.id); setInbox(prev => ({ ...prev, [m.id]: { ...prev[m.id], unread: 0 } })) }}><Av u={m.p} cls="avatar md" /><span className="chat-person-info"><b>{partnerName(m.p)}</b><small className="chat-last-preview">{preview}</small></span>{unreadCount > 0 && <span className="chat-room-unread-count" aria-label={`${unreadCount} ข้อความยังไม่อ่าน`}>{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
        })}
        {!matches.length && <div className="chat-empty">ยังไม่มี Match</div>}
      </div>
      <div className="chat-window">{sel ? <>
        <div className="chat-header"><button type="button" className="chat-back icon-btn" onClick={() => setSelectedId(null)} aria-label="กลับไปหน้ารายชื่อ"><ArrowRight size={20} style={{transform:"rotate(180deg)"}} /></button><button type="button" className="chat-profile-trigger" onClick={() => onOpenProfile?.(sel.p)} title="ดูโปรไฟล์ รูปทั้งหมด และเพลง" aria-label={`ดูโปรไฟล์ ${partnerName(sel.p)}`}><Av u={sel.p} cls="avatar md" /><span><b>{partnerName(sel.p)}</b><small className={partnerTyping ? "chat-presence typing" : partnerOnline ? "chat-presence online" : "chat-presence"}>{partnerTyping ? "กำลังพิมพ์…" : partnerOnline ? "กำลังออนไลน์ในแชต" : "แตะเพื่อดูโปรไฟล์ · รูปภาพ · เพลง"}</small></span></button><div className="chat-theme-control"><button type="button" className="icon-btn chat-theme-toggle" onClick={() => setThemePickerOpen(v => !v)} title="เปลี่ยนธีมแชต" aria-label="เปลี่ยนธีมแชต" aria-expanded={themePickerOpen}><Palette size={18}/></button></div><button className="icon-btn" onClick={report} title="รายงาน"><Flag size={17}/></button><button className="icon-btn" onClick={block} title="บล็อก"><Ban size={17}/></button></div>
        {openChatImage && <div className="chat-image-lightbox" role="presentation" onClick={() => setOpenChatImage(null)}>
          <div className="chat-image-lightbox-content" role="dialog" aria-modal="true" aria-label="ดูรูปภาพในแชต" onClick={e => e.stopPropagation()}>
            <button type="button" className="chat-image-close" onClick={() => setOpenChatImage(null)} aria-label="ปิดรูปภาพ"><X size={22}/></button>
            <img src={openChatImage} alt="รูปภาพในแชตขนาดใหญ่" />
          </div>
        </div>}
        {themePickerOpen && createPortal(<div className="chat-theme-overlay chat-theme-portal" onClick={() => setThemePickerOpen(false)}>
          <div className="chat-theme-dialog" role="dialog" aria-modal="true" aria-label="เลือกธีมแชต" onClick={e => e.stopPropagation()}>
            <div className="chat-theme-heading">ธีมบทสนทนา <button type="button" onClick={() => setThemePickerOpen(false)} aria-label="ปิด"><X size={18}/></button></div>
            <div className="chat-theme-grid">{CHAT_THEMES.map(t => <button type="button" key={t.id} className={'chat-theme-choice' + (chatTheme === t.id ? ' active' : '')} onClick={() => chooseChatTheme(t.id)} aria-pressed={chatTheme === t.id}><span className="chat-theme-dot" style={{background:t.swatch}} />{t.name}{chatTheme === t.id && <Check size={15}/>}</button>)}</div>
            <small>ธีมนี้แสดงเฉพาะบนอุปกรณ์ของคุณ</small>
          </div>
        </div>, document.body)}

        <div className={"chat-messages" + (messageMenu ? " chat-focus-active" : "")} ref={scrollBox} onClickCapture={e => { if (messageMenu && !e.target.closest(".chat-message-focused")) setMessageMenu(null) }} onTouchMove={() => { if (!stickToBottom.current) userReadingHistory.current = true }} onWheel={() => { if (!stickToBottom.current) userReadingHistory.current = true }} onScroll={e => { const el = e.currentTarget; const distance = el.scrollHeight - el.scrollTop - el.clientHeight; stickToBottom.current = distance < 65; if (distance < 65) userReadingHistory.current = false; setShowLatestButton(distance > 75) }}>
          {hasMore && <button type="button" className="chat-older" disabled={loadingOlder} onClick={() => fetchMessages(true)}>{loadingOlder ? 'กำลังโหลด...' : '↑ ดูข้อความก่อนหน้า'}</button>}
          {msgs.map((m, i) => <React.Fragment key={m.id}>
            {(i === 0 || dateLabel(msgs[i-1].created_at) !== dateLabel(m.created_at)) && <div className="chat-date-divider"><span>{dateLabel(m.created_at)}</span></div>}
            <div className={'message-row ' + (m.sender_id === me ? 'mine' : '') + (m.id === msgs[msgs.length - 1]?.id ? ' latest-message' : '')}>
              {m.sender_id !== me && <Av u={sel.p} cls="avatar sm" />}
              <div className={'message-bubble' + (messageMenu === m.id ? ' chat-message-focused' : '')} onContextMenu={e => { e.preventDefault(); openMessageMenu(m) }} onSelectStart={preventNativeMessageSelect} onDragStart={e => e.preventDefault()} onPointerDown={e => { if (e.pointerType === 'touch' && !e.target.closest('button, audio, input')) e.preventDefault() }} onTouchStart={e => beginMessagePress(e, m)} onTouchEnd={endMessagePress} onTouchCancel={endMessagePress} onTouchMove={moveMessagePress}>
                {m.reply_to && <div className="chat-reply-quote"><Reply size={13}/>{quoteFor(msgs.find(x => x.id === m.reply_to) || {body:'ข้อความก่อนหน้า'})}</div>}
                {m.attachment_type === 'image' && m.attachment_path ? (mediaUrls[m.attachment_path] ? <button type="button" className="chat-image-open" onClick={() => setOpenChatImage(mediaUrls[m.attachment_path])} aria-label="ดูรูปภาพขนาดใหญ่ในแชต"><img className="chat-attachment-image" src={mediaUrls[m.attachment_path]} alt="รูปภาพในแชต" loading="lazy" /></button> : <span>กำลังโหลดรูป...</span>) : m.attachment_type === 'audio' && m.attachment_path ? (mediaUrls[m.attachment_path] ? <VoiceBubble src={mediaUrls[m.attachment_path]} mine={m.sender_id === me} /> : <span>กำลังโหลดเสียง...</span>) : m.body}
                <small>{new Date(m.created_at).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })}{m.pending ? ' · กำลังส่ง…' : m.failed ? ' · ส่งไม่สำเร็จ' : m.sender_id === me ? (m.read_at ? ' · อ่านแล้ว' : ' · ส่งแล้ว') : ''}</small>
                {m.reaction && <span className="chat-reaction-heart v64-reaction-pill" aria-label={'รีแอ็กชัน '+m.reaction}>{({heart:'❤️',laugh:'😂',wow:'😮',fire:'🔥'})[m.reaction] || '❤️'}</span>}
                {m.failed && <button type="button" onClick={() => { setText(m.body); setMsgs(prev => prev.filter(x => x.id !== m.id)) }}>ลองส่งอีกครั้ง</button>}
                <button type="button" className="chat-message-actions" aria-label="ตัวเลือกข้อความ" onClick={() => setMessageMenu(messageMenu === m.id ? null : m.id)}><SmilePlus size={15}/></button>
                {messageMenu === m.id && <div className="chat-message-menu"><button type="button" onClick={() => { setReplyTo(m); setMessageMenu(null) }}><Reply size={15}/> ตอบกลับ</button><div className="v64-reaction-options" aria-label="เลือกรีแอ็กชัน">{[{id:'heart',label:'หัวใจ',icon:'❤️'},{id:'laugh',label:'หัวเราะ',icon:'😂'},{id:'wow',label:'ตกใจ',icon:'😮'},{id:'fire',label:'ไฟ',icon:'🔥'}].map(r => <button type="button" key={r.id} className={m.reaction === r.id ? 'selected' : ''} aria-label={r.label} title={r.label} onClick={() => setReaction(m,r.id)}>{r.icon}</button>)}</div></div>}
              </div>
            </div>
          </React.Fragment>)}
          {partnerTyping && <div className="message-row typing-message-row" role="status" aria-label={`${partnerName(sel.p)} กำลังพิมพ์`}>
            <Av u={sel.p} cls="avatar sm" />
            <div className="messenger-typing-bubble" aria-hidden="true"><span/><span/><span/></div>
          </div>}
          {!msgs.length && !partnerTyping && <div className="chat-empty">ทักทาย {partnerName(sel.p)} เป็นคนแรกสิ</div>}
          <div ref={end}/>
        </div>
        {showLatestButton && <button type="button" className="chat-jump-latest" onClick={() => scrollToLatest(true)} aria-label="กลับไปข้อความล่าสุด"><ArrowRight size={16} style={{transform:"rotate(90deg)"}} /> กลับไปข้อความล่าสุด</button>}
        {replyTo && <div className="chat-reply-composer"><Reply size={16}/><span><b>กำลังตอบกลับ</b><small>{quoteFor(replyTo)}</small></span><button type="button" onClick={() => setReplyTo(null)} aria-label="ยกเลิกตอบกลับ"><X size={17}/></button></div>}
        <form className="chat-compose" onSubmit={send}>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) sendMedia(f,'image'); e.target.value = '' }}/>
          <button type="button" className="chat-media-btn" title="ส่งรูปภาพ" disabled={uploading || recording} onClick={() => fileInput.current?.click()}><ImagePlus size={20}/></button>
          {recording ? <div className="voice-recorder" role="status"><span className="record-live"/><span className="record-clock">{Math.floor(recordSeconds/60)}:{String(recordSeconds%60).padStart(2,'0')} / 1:00</span><LiveMicWave stream={micStream}/><button type="button" className="record-cancel" onClick={cancelRecord} aria-label="ยกเลิกการอัดเสียง"><Trash2 size={19}/></button><button type="button" className="record-send" onClick={toggleRecord} aria-label="หยุดและส่งข้อความเสียง"><Send size={18}/></button></div> : <><button type="button" className="chat-media-btn mic-launch" title="อัดข้อความเสียง" disabled={uploading || micBusy} onClick={toggleRecord} aria-label="เริ่มอัดข้อความเสียง"><Mic size={20}/></button><input className="chat-text-input" value={text} onChange={e => onCompose(e.target.value)} onFocus={() => { if (stickToBottom.current) requestAnimationFrame(() => scrollToLatest(false)) }} placeholder="พิมพ์ข้อความ..." aria-label="พิมพ์ข้อความ" maxLength={2000} autoComplete="off"/><button className="send-btn" type="submit" title="ส่งข้อความ" aria-label="ส่งข้อความ" disabled={!text.trim() || uploading}><Send size={19}/></button></>}
        </form>
        {uploading && <div className="chat-upload-status">กำลังอัปโหลดไฟล์...</div>}
      </> : <div className="chat-placeholder"><MessageCircle/><h3>บทสนทนาของคุณ</h3><p>เลือก Match เพื่อเริ่มพูดคุย</p></div>}</div>
    </div>, document.body) : <div className={"chat-layout chat-theme-" + chatTheme + " chat-inbox-open"}>
      <div className="chat-list"><div className="chat-list-head"><b>ข้อความของคุณ<small>เลือกคนที่ต้องการคุย</small></b><span>{matches.length}</span></div>
        {[...matches].sort((a,b) => new Date(inbox[b.id]?.last?.created_at || b.created_at || 0) - new Date(inbox[a.id]?.last?.created_at || a.created_at || 0)).map(m => {
          const info = inbox[m.id], last = info?.last, unreadCount = info?.unread || 0
          const preview = !last ? 'เริ่มบทสนทนากันเลย' : `${last.sender_id === me ? 'ฉัน : ' : ''}${last.attachment_type === 'image' ? 'ส่งรูปภาพ' : last.attachment_type === 'audio' ? 'ส่งข้อความเสียง' : (last.body || 'ส่งไฟล์')}`
          return <button key={m.id} className={'chat-person ' + (unreadCount ? 'chat-person-unread' : '')} onClick={() => { setSelectedId(m.id); setInbox(prev => ({ ...prev, [m.id]: { ...prev[m.id], unread: 0 } })) }}><Av u={m.p} cls="avatar md" /><span className="chat-person-info"><b>{partnerName(m.p)}</b><small className="chat-last-preview">{preview}</small></span>{unreadCount > 0 && <span className="chat-room-unread-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
        })}
        {!matches.length && <div className="chat-empty">ยังไม่มี Match</div>}
      </div>
    </div>}
  </>)
}

function Notifs({ me, refresh, go }) {
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', me).in('type', ['interest', 'match']).order('created_at', { ascending: false }).limit(50)
    if (!error) setRows(data || [])
  }, [me])
  useEffect(() => { load() }, [load])
  const allRead = rows !== null && rows.every(n => n.read)
  const readAll = async () => {
    if (busy || allRead) return
    setBusy(true)
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', me).in('type', ['interest', 'match']).eq('read', false)
    if (!error) { setRows(prev => prev?.map(n => ({ ...n, read: true })) || []); refresh() }
    setBusy(false)
  }
  return (<>
    <Heading kicker="STAY IN THE LOOP" title="การแจ้งเตือน" sub="แจ้งเฉพาะเมื่อมีคนสนใจคุณหรือคุณได้รับแมตช์ใหม่"><button className="btn btn-ghost" disabled={busy || rows === null || allRead} onClick={readAll}><Check size={16} /> {allRead ? 'อ่านทั้งหมดแล้ว' : busy ? 'กำลังบันทึก...' : 'อ่านทั้งหมด'}</button></Heading>
    {rows === null ? <div className="page-center"><span className="spin" /></div> : !rows.length ? <div className="empty-state"><div className="empty-icon"><Bell /></div><h3>ยังไม่มีการแจ้งเตือน</h3><p>เมื่อมีคนสนใจคุณหรือแมตช์ใหม่ จะขึ้นที่นี่</p></div> :
      <div className="notif-list">{rows.map((n) => <div key={n.id} className={'notif-row ' + (n.read ? '' : 'unread')} onClick={async () => {
        if (!n.read) {
          const { error } = await supabase.from('notifications').update({ read: true }).eq('id', n.id).eq('user_id', me)
          if (!error) { setRows(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); refresh() }
        }
        go(n.type === 'match' ? 'messages' : 'home')
      }}>
        <span className="settings-icon"><Heart /></span><div><b>{n.type === 'match' ? 'คุณได้รับการแมตช์แล้ว!' : 'มีคนกำลังสนใจคุณอยู่'}</b><small>{new Date(n.created_at).toLocaleString('th-TH')}</small></div></div>)}</div>}
  </>)
}

// iTunes Search API: public catalog search; no Spotify credentials or Edge Function.
const itunesTrack = (p) => p?.itunes_track_id ? {
  id: String(p.itunes_track_id),
  name: p.itunes_track_name || 'เพลงโปรด',
  artist: p.itunes_track_artist || 'ศิลปิน',
  image: p.itunes_track_image || '',
  preview: p.itunes_track_preview || '',
  url: p.itunes_track_url || '',
} : null

function ITunesSongCard({ track, compact = false }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(30)
  const seekingRef = useRef(false)
  const seekAnimationRef = useRef(null)
  const [seeking, setSeeking] = useState(false)
  // Update the position at display refresh rate, rather than only on the
  // browser's infrequent timeupdate events. Pause updates while dragging.
  useEffect(() => {
    if (!playing) return
    let lastPaint = 0
    const frame = now => {
      const audio = audioRef.current
      if (audio && !seekingRef.current && now - lastPaint >= 32) {
        setPosition(audio.currentTime)
        lastPaint = now
      }
      seekAnimationRef.current = requestAnimationFrame(frame)
    }
    seekAnimationRef.current = requestAnimationFrame(frame)
    return () => {
      if (seekAnimationRef.current != null) cancelAnimationFrame(seekAnimationRef.current)
      seekAnimationRef.current = null
    }
  }, [playing])
  const startSeek = () => { seekingRef.current = true; setSeeking(true) }
  const endSeek = () => { seekingRef.current = false; setSeeking(false) }
  const barsRef = useRef(null)
  const animationRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const safeUrl = url => /^https:\/\//i.test(url || '') ? url : ''
  const preview = safeUrl(track?.preview)
  useEffect(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    setPlaying(false); setPosition(0); setDuration(30)
  }, [track?.id, preview])
  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause()
    if (animationRef.current != null) cancelAnimationFrame(animationRef.current)
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
  }, [])
  useEffect(() => {
    if (!playing) {
      if (animationRef.current != null) cancelAnimationFrame(animationRef.current)
      animationRef.current = null
      barsRef.current?.querySelectorAll('i').forEach(bar => { bar.style.height = '4px' })
      return
    }
    const audio = audioRef.current
    // Web Audio provides frequency-driven bars when the preview server permits CORS.
    // A soft beat animation is used when analysis is unavailable.
    if (audio && !audioContextRef.current) {
      try {
        const Context = window.AudioContext || window.webkitAudioContext
        if (Context) {
          const context = new Context()
          const analyser = context.createAnalyser()
          analyser.fftSize = 256
          const source = context.createMediaElementSource(audio)
          source.connect(analyser)
          analyser.connect(context.destination)
          audioContextRef.current = context
          analyserRef.current = analyser
          sourceRef.current = source
        }
      } catch { /* preview remains playable without audio analysis */ }
    }
    audioContextRef.current?.resume().catch(() => {})
    const bins = analyserRef.current ? new Uint8Array(analyserRef.current.frequencyBinCount) : null
    const animate = (time) => {
      const bars = barsRef.current?.querySelectorAll('i')
      if (bins && analyserRef.current) analyserRef.current.getByteFrequencyData(bins)
      bars?.forEach((bar, i) => {
        const energy = bins ? bins[Math.min(bins.length - 1, 2 + i * 3)] / 255 : 0
        bar.style.height = `${Math.round(3 + 14 * energy)}px` // real analyser samples only; quiet if cross-origin audio disallows analysis
      })
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current != null) cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [playing])
  if (!track?.id) return null
  const formatTime = n => { const v = Math.floor(Number.isFinite(n) ? n : 0); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` }
  const toggle = async () => {
    const audio = audioRef.current
    if (!audio || !preview) return
    if (audio.paused) {
      // Stop another song preview if the user starts a different card.
      document.querySelectorAll('.itunes-song-card audio').forEach(other => { if (other !== audio) other.pause() })
      try { await audio.play() } catch { setPlaying(false) }
    } else audio.pause()
  }
  const seek = e => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    audio.currentTime = (Number(e.target.value) / 100) * audio.duration
    setPosition(audio.currentTime)
  }
  const progress = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0
  return <section className={'itunes-song-card itunes-premium ' + (compact ? 'compact ' : '') + (playing ? 'is-playing' : '')} aria-label={'เพลงประจำโปรไฟล์ ' + track.name}>
    <div className="itunes-premium-glow" aria-hidden="true" />
    <div className="itunes-premium-main">
      <div className="itunes-premium-artwrap">
        {safeUrl(track.image) ? <img className="itunes-premium-cover" src={safeUrl(track.image).replace(/100x100bb/, '300x300bb')} alt={'ปกเพลง ' + track.name} loading="lazy" /> : <span className="itunes-premium-cover itunes-premium-cover-empty"><Music2 size={24}/></span>}
        <div className="itunes-premium-art-shine" aria-hidden="true" />
      </div>
      <div className="itunes-premium-copy">
        <div className="itunes-premium-eyebrow"><span className="itunes-premium-heart">♥</span> MY ANTHEM <span className="itunes-premium-dot">·</span> 30s PREVIEW</div>
        <strong title={track.name}>{track.name}</strong>
        <span title={track.artist}>{track.artist}</span>
        <div className="itunes-premium-eq" ref={barsRef} aria-label={playing ? 'กำลังเล่นเพลง' : 'ตัวอย่างเพลง'}>{Array.from({length: 12}, (_, i) => <i key={i} style={{'--bar': i}} />)}</div>
      </div>
      <button className={'itunes-premium-play music-smooth-toggle' + (playing ? ' music-smooth-toggle--playing' : '')} type="button" onClick={toggle} disabled={!preview} aria-pressed={playing} aria-label={playing ? 'หยุดเพลงชั่วคราว' : 'เล่นตัวอย่างเพลง'} title={preview ? (playing ? 'Pause' : 'Play preview') : 'เพลงนี้ไม่มีตัวอย่าง'}><span className="music-smooth-icon music-smooth-icon--play" aria-hidden="true"><Play size={15} strokeWidth={2.6} fill="currentColor" /></span><span className="music-smooth-icon music-smooth-icon--pause" aria-hidden="true"><Pause size={15} strokeWidth={2.6} fill="currentColor" /></span></button>
    </div>
    {preview && <div className="itunes-premium-timeline">
      <span>{formatTime(position)}</span>
      <input className={seeking ? "music-seek-active" : ""} type="range" min="0" max="100" step="0.1" value={progress} onPointerDown={startSeek} onPointerUp={endSeek} onPointerCancel={endSeek} onBlur={endSeek} onChange={seek} style={{'--progress': `${progress}%`}} aria-label="เลื่อนตำแหน่งเพลง" />
      <span>{formatTime(duration)}</span>
    </div>}
    {!compact && <div className="itunes-premium-footer"><span>♫ เพลงที่บอกความเป็นฉัน</span>{safeUrl(track.url) && <a href={safeUrl(track.url)} target="_blank" rel="noopener noreferrer">Apple Music ↗</a>}</div>}
    {preview && <audio ref={audioRef} src={preview} crossOrigin="anonymous" preload="none" playsInline onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPosition(0) }} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)} onLoadedMetadata={e => { const d=e.currentTarget.duration; if(Number.isFinite(d) && d>0) setDuration(d) }} />}
  </section>
}

// iTunes supports JSONP; this avoids mobile browser cross-origin fetch failures.
// Each request cleans up its script, callback and timeout on completion/cancel.
let itunesSearchSerial = 0
function searchITunesJSONP(query, signal) {
  return new Promise((resolve, reject) => {
    const callbackName = '__nisitItunes_' + (++itunesSearchSerial)
    const script = document.createElement('script')
    let finished = false
    const cleanup = () => {
      clearTimeout(timeout)
      script.remove()
      delete window[callbackName]
      signal?.removeEventListener('abort', onAbort)
    }
    const finish = (error, data) => {
      if (finished) return
      finished = true
      cleanup()
      error ? reject(error) : resolve(data)
    }
    const onAbort = () => finish(new DOMException('Aborted', 'AbortError'))
    const timeout = setTimeout(() => finish(new Error('Search timeout')), 9000)
    window[callbackName] = (data) => finish(null, data)
    script.onerror = () => finish(new Error('iTunes unavailable'))
    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) return onAbort()
    const params = new URLSearchParams({ term: query, media: 'music', entity: 'song', country: 'TH', limit: '20', callback: callbackName })
    script.src = 'https://itunes.apple.com/search?' + params.toString()
    script.async = true
    document.head.appendChild(script)
  })
}

function ITunesSongPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setBusy(false); setSearched(false); setError(''); return }
    const controller = new AbortController()
    setBusy(true); setSearched(false); setError(''); setResults([])
    const timer = setTimeout(async () => {
      try {
        // Route mobile searches through our Supabase Edge Function first.
        // Direct iTunes calls are often blocked on mobile networks or by CSP.
        let data
        try {
          const { data: proxyData, error: proxyError } = await supabase.functions.invoke('itunes-search', {
            body: { query: q }, signal: controller.signal
          })
          if (proxyError || !Array.isArray(proxyData?.results)) throw proxyError || new Error('Invalid response')
          data = proxyData
        } catch (proxyError) {
          if (controller.signal.aborted) return
          // Keep a direct-browser fallback for installations without the function.
          try {
            data = await searchITunesJSONP(q, controller.signal)
          } catch {
            if (controller.signal.aborted) return
            const params = new URLSearchParams({ term: q, media: 'music', entity: 'song', country: 'TH', limit: '20' })
            const response = await fetch('https://itunes.apple.com/search?' + params, { signal: controller.signal })
            if (!response.ok) throw new Error('HTTP ' + response.status)
            data = await response.json()
          }
        }
        if (controller.signal.aborted) return
        setResults((Array.isArray(data.results) ? data.results : []).filter(item => item.kind === 'song' && item.trackId).map(item => ({
          id: String(item.trackId), name: item.trackName || 'ไม่ระบุชื่อเพลง', artist: item.artistName || 'ไม่ระบุศิลปิน',
          image: item.artworkUrl100 || '', preview: item.previewUrl || '', url: item.trackViewUrl || ''
        })))
        setSearched(true)
      } catch (err) {
        if (!controller.signal.aborted) setError('ค้นหาเพลงไม่ได้ กรุณาตรวจสอบว่า Deploy Edge Function itunes-search แล้ว (ดูคู่มือใน ZIP)')
      } finally { if (!controller.signal.aborted) setBusy(false) }
    }, 650)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])
  return <section className="itunes-picker">
    <div className="itunes-picker-title"><span className="itunes-picker-icon"><Music2 size={21}/></span><div><b>YOUR PROFILE ANTHEM <span>✦</span></b><small>เลือกเพลงที่เล่าเรื่องความเป็นคุณ ให้คนที่ Match ได้ฟัง</small></div></div>
    {value && <><div className="itunes-picker-preview-label"><span className="itunes-picker-live-dot"/> ตัวอย่างเพลงบนโปรไฟล์ของคุณ</div><ITunesSongCard track={value}/><button type="button" className="itunes-remove" onClick={() => onChange(null)}><X size={14}/> เอาเพลงออก</button></>}
    <label htmlFor="itunes-search-input">ค้นหาชื่อเพลงหรือศิลปิน</label>
    <div className="itunes-search-box"><Search size={17}/><input id="itunes-search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="เช่น เพลงรัก หรือชื่อศิลปิน" maxLength={100} autoComplete="off" /></div>
    {busy && <p className="itunes-feedback">กำลังค้นหาเพลง...</p>}
    {error && <p className="itunes-feedback itunes-error" role="alert">{error}</p>}
    {searched && !busy && !error && !results.length && <p className="itunes-feedback">ไม่พบเพลง ลองใช้ชื่อภาษาอังกฤษหรือชื่อศิลปิน</p>}
    {!!results.length && <div className="itunes-results" aria-label="ผลการค้นหาเพลง">{results.map(track => <button type="button" key={track.id} className={'itunes-result ' + (value?.id === track.id ? 'selected' : '')} onClick={() => { onChange(track); setQuery(''); setResults([]) }}>
      {track.image ? <img src={track.image} alt="" loading="lazy"/> : <span className="itunes-result-placeholder"><Music2 size={20}/></span>}
      <span><b>{track.name}</b><small>{track.artist}</small></span>
      {value?.id === track.id ? <Check size={18}/> : <ArrowRight size={16}/>}
    </button>)}</div>}
    <p className="itunes-help">ค้นหาผ่าน iTunes Search API · กดบันทึกการเปลี่ยนแปลงด้านล่าง · ตัวอย่างเพลงมีเฉพาะบางเพลง</p>
  </section>
}


// Local-only draft storage: IndexedDB can persist File objects across reloads.
const draftDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('nisit-match-drafts', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('profiles')
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})
async function draftAction(userId, mode, value) {
  if (!userId || !('indexedDB' in window)) return null
  const db = await draftDB()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', mode === 'read' ? 'readonly' : 'readwrite')
      const store = tx.objectStore('profiles')
      const req = mode === 'read' ? store.get(userId) : mode === 'delete' ? store.delete(userId) : store.put(value, userId)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally { db.close() }
}
const RELATIONSHIP_INTENTS = [{ id: 'serious', label: 'ความสัมพันธ์จริงจัง' }, { id: 'getting_to_know', label: 'ค่อย ๆ ทำความรู้จัก' }, { id: 'friends', label: 'หาเพื่อน' }, { id: 'unsure', label: 'ยังไม่แน่ใจ' }]
const intentLabel = id => RELATIONSHIP_INTENTS.find(item => item.id === id)?.label || ''
const initialProfileForm = p => ({ display_name: p?.display_name || '', birth_date: p?.birth_date || '', gender: p?.gender || 'other', uni: p?.university_id || '', faculty: p?.faculty || FACULTIES[0], major: p?.major || '', bio: p?.bio || '', interests: p?.interests || [], relationship_intent: p?.relationship_intent || '' })

function ProfilePage({ user, profile, onSaved, notify, onboarding }) {
  const [profileEmailVerified, setProfileEmailVerified] = useState(false)
  useEffect(() => {
    let alive = true
    supabase.from('student_verifications').select('status').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => { if (alive && !error) setProfileEmailVerified(data?.status === 'verified') })
      .catch(() => {})
    return () => { alive = false }
  }, [user.id])
  const [f, setF] = useState(() => initialProfileForm(profile))
  const [busy, setBusy] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const draftRevision = useRef(0)
  const skipDraftSave = useRef(false)
  const [song, setSong] = useState(() => itunesTrack(profile))
  const [photos, setPhotos] = useState(profile?.photo_paths?.length ? profile.photo_paths : (profile?.avatar_path ? [profile.avatar_path] : []))
  const [newPhotos, setNewPhotos] = useState([])
  const [cropQueue, setCropQueue] = useState([])
  const [mainPhoto, setMainPhoto] = useState(profile?.avatar_path || '')
  const [uniQuery, setUniQuery] = useState(''), [uniType, setUniType] = useState('ทั้งหมด')
  const [editTab, setEditTab] = useState('photos')
  const [selfPreviewOpen, setSelfPreviewOpen] = useState(false)
  const [selfPreviewIndex, setSelfPreviewIndex] = useState(0)
  const editTabs = [['photos', 'รูปภาพ', Camera], ['basic', 'ข้อมูลส่วนตัว', UserRound], ['campus', 'การศึกษา', GraduationCap], ['interests', 'ความสนใจ', Heart], ['music', 'เพลงโปรด', Music2], ['verification', 'ยืนยันเมลมหาวิทยาลัย', ShieldCheck]]
  // Restore a draft before any autosave runs; never overwrite a saved draft with initial values.
  useEffect(() => {
    let alive = true
    setDraftReady(false)
    draftAction(user.id, 'read').then(d => {
      if (!alive) return
      if (d && d.version === 1) {
        if (d.f) setF(d.f)
        if (Array.isArray(d.photos)) setPhotos(d.photos)
        if (d.song !== undefined) setSong(d.song)
        if (Array.isArray(d.newPhotos)) setNewPhotos(d.newPhotos.filter(x => x.file instanceof Blob).map(x => ({ ...x, url: URL.createObjectURL(x.file) })))
        if (typeof d.mainPhoto === 'string') setMainPhoto(d.mainPhoto)
      }
      setDraftReady(true)
    }).catch(err => { console.warn('Draft restore unavailable:', err); if (alive) setDraftReady(true) })
    return () => { alive = false }
  }, [user.id])
  useEffect(() => {
    if (!draftReady) return
    const revision = ++draftRevision.current
    const timer = setTimeout(() => {
      if (skipDraftSave.current || revision !== draftRevision.current) return
      draftAction(user.id, 'write', { version: 1, f, photos, mainPhoto, song,
        newPhotos: newPhotos.map(({ key, file }) => ({ key, file }))
      }).catch(err => console.warn('Draft autosave unavailable:', err))
    }, 350)
    return () => clearTimeout(timer)
  }, [draftReady, user.id, f, photos, mainPhoto, song, newPhotos])
  // Release preview URLs when the editor unmounts.
  const photoUrls = useRef([])
  useEffect(() => { photoUrls.current = newPhotos.map(p => p.url) }, [newPhotos])
  useEffect(() => () => photoUrls.current.forEach(url => URL.revokeObjectURL(url)), [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const filteredUniversities = UNIVERSITIES.filter((u) => (uniType === 'ทั้งหมด' || u.type === uniType) && u.name.toLowerCase().includes(uniQuery.trim().toLowerCase()))
  const preview = newPhotos.find(x => x.key === mainPhoto)?.url || pub(mainPhoto) || ph(f.display_name)
  const appendCropped = (file) => {
    const key = `new-${crypto.randomUUID()}`
    const item = { key, file, url: URL.createObjectURL(file) }
    setNewPhotos(old => [...old, item])
    if (!mainPhoto && photos.length === 0 && newPhotos.length === 0) setMainPhoto(key)
    setCropQueue(q => q.slice(1))
  }
  const addPhotos = (files) => {
    const incoming = Array.from(files || [])
    const valid = incoming.filter(f => f.type.startsWith('image/') && f.size <= 10e6)
    if (valid.length !== incoming.length) notify('รองรับรูปภาพขนาดไม่เกิน 10MB ก่อนครอป')
    const slots = Math.max(0, 6 - photos.length - newPhotos.length - cropQueue.length)
    setCropQueue(q => [...q, ...valid.slice(0, slots)])
  }
  const removePhoto = (key) => {
    const remaining = [...photos.filter(x => x !== key), ...newPhotos.filter(x => x.key !== key).map(x => x.key)]
    setPhotos(old => old.filter(x => x !== key)); setNewPhotos(old => old.filter(x => x.key !== key))
    if (mainPhoto === key) setMainPhoto(remaining[0] || '')
  }
  const save = async (e) => {
    e.preventDefault()
    const u = UNIVERSITIES.find((x) => x.id === f.uni)
    if (!f.display_name.trim()) { setEditTab('basic'); return notify('กรุณากรอกชื่อที่อยากให้เรียก') }
    if (!u) { setEditTab('campus'); return notify('กรุณาเลือกมหาวิทยาลัยจากรายการ') }
    if (!f.birth_date || ageOf(f.birth_date) < 18) { setEditTab('basic'); return notify('ต้องมีอายุอย่างน้อย 18 ปี') }
    if (!f.faculty?.trim()) { setEditTab('campus'); return notify('กรุณาเลือกคณะ') }
    setBusy(true)
    const uploaded = [...photos]
    const keyMap = {}
    for (const item of newPhotos) {
      const ext = item.file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/photo-${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, item.file, { contentType: item.file.type })
      if (uploadError) { setBusy(false); return notify(`อัปโหลดรูปไม่สำเร็จ: ${uploadError.message}`) }
      uploaded.push(path); keyMap[item.key] = path
    }
    const avatar_path = keyMap[mainPhoto] || mainPhoto || uploaded[0] || null
    const photo_paths = [...new Set(uploaded)].slice(0, 6)
    const payload = { display_name: f.display_name.trim(), birth_date: f.birth_date, gender: f.gender, university_id: u.id, faculty: f.faculty.trim(), major: f.major, bio: f.bio, interests: f.interests, relationship_intent: f.relationship_intent || null, avatar_path, photo_paths, itunes_track_id: song?.id || null, itunes_track_name: song?.name || null, itunes_track_artist: song?.artist || null, itunes_track_image: song?.image || null, itunes_track_preview: song?.preview || null, itunes_track_url: song?.url || null }
    const { error } = profile?.id
      ? await supabase.from('profiles').update(payload).eq('id', user.id).select('id').single()
      : await supabase.from('profiles').insert({ id: user.id, ...payload }).select('id').single()
    setBusy(false)
    if (error) return notify(error.code === '23503' ? 'ไม่พบมหาวิทยาลัยในฐานข้อมูล กรุณารันไฟล์ supabase/sync_universities.sql ก่อน' : 'บันทึกไม่สำเร็จ: ' + error.message)
    skipDraftSave.current = true
    draftRevision.current++
    await draftAction(user.id, 'delete').catch(err => console.warn('Draft cleanup unavailable:', err))
    setPhotos(photo_paths); setNewPhotos([]); setMainPhoto(avatar_path || '')
    notify('บันทึกมหาวิทยาลัย คณะ และโปรไฟล์สำเร็จแล้ว'); await onSaved()
  }
  const toggle = (i) => setF({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i].slice(0, 12) })
  const selfPreviewPhotos = [...photos.map(path => ({ key: path, url: pub(path) })), ...newPhotos.map(item => ({ key: item.key, url: item.url }))]
  const orderedSelfPhotos = [...selfPreviewPhotos.filter(item => item.key === mainPhoto), ...selfPreviewPhotos.filter(item => item.key !== mainPhoto)]
  const selfPreviewImage = orderedSelfPhotos[selfPreviewIndex]?.url || ph(f.display_name)
  useViewportScrollLock(selfPreviewOpen)
  const selfTouchStart = useRef(null)
  useEffect(() => {
    if (!selfPreviewOpen || orderedSelfPhotos.length < 2) return
    const next = orderedSelfPhotos[(selfPreviewIndex + 1) % orderedSelfPhotos.length]?.url
    if (next) { const image = new Image(); image.src = next }
  }, [selfPreviewOpen, selfPreviewIndex, orderedSelfPhotos.length])
  useEffect(() => {
    if (!selfPreviewOpen) return
    const onKey = e => { if (e.key === 'Escape') setSelfPreviewOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [selfPreviewOpen])
  return (<>
    {cropQueue[0] && <CropPhotoDialog file={cropQueue[0]} onDone={appendCropped} onCancel={() => setCropQueue(q=>q.slice(1))} notify={notify}/>}

    <Heading kicker={onboarding ? 'WELCOME' : 'THIS IS YOU'} title={onboarding ? 'สร้างโปรไฟล์ของคุณ' : 'โปรไฟล์ของฉัน'} sub="เล่าเรื่องของคุณในแบบที่เป็นตัวเอง" />
    <div className="nm-self-preview-actions"><button type="button" className="btn btn-ghost nm-self-preview-open" onClick={() => { setSelfPreviewIndex(0); setSelfPreviewOpen(true) }}><Eye size={18}/> ดูตัวอย่างโปรไฟล์ของฉัน <ArrowRight size={16}/></button><span>ดูหน้าตาที่คนอื่นจะเห็น โดยไม่ต้องบันทึกก่อน</span></div>
    <div className="nm-profile-editor">
      <nav className="nm-edit-tabs" aria-label="หมวดแก้ไขโปรไฟล์" role="tablist">{editTabs.map(([id, name, Icon]) => <button key={id} type="button" role="tab" aria-selected={editTab === id} className={editTab === id ? 'active' : ''} onClick={() => setEditTab(id)}><Icon size={17}/><span>{name}</span></button>)}</nav>
      <div className="nm-edit-workspace">
      {editTab === 'verification' && <CampusEmailVerification user={user} />}
      {editTab === 'photos' && <section className="nm-edit-photo-page" role="tabpanel"><div className="nm-photo-hero"><img src={preview} alt="ตัวอย่างรูปหลัก"/><div><span className="theme-kicker">PROFILE PHOTOS</span><h2>จัดการรูปโปรไฟล์</h2><p>เลือกรูปหลักและเพิ่มรูปได้สูงสุด 6 รูป</p></div></div>
        <div className="photo-editor"><b>รูปโปรไฟล์ ({photos.length + newPhotos.length}/6)</b><p>แตะดาวเพื่อกำหนดรูปหลัก</p><div className="photo-grid">{[...photos.map(key => ({key, url: pub(key)})), ...newPhotos].map(item => <div className="photo-tile" key={item.key}><img src={item.url} alt="รูปโปรไฟล์"/><button type="button" className={'photo-main ' + (mainPhoto === item.key ? 'selected' : '')} onClick={() => setMainPhoto(item.key)} title="ตั้งเป็นรูปหลัก">★</button><button type="button" className="photo-remove" onClick={() => removePhoto(item.key)} title="ลบรูป">×</button></div>)}{photos.length + newPhotos.length < 6 && <label className="photo-add"><Camera size={21}/><span>เพิ่มรูป</span><input type="file" accept="image/*" multiple onChange={e => {addPhotos(e.target.files); e.target.value = ''}} /></label>}</div></div>
      </section>}
      <form className="form-panel nm-tab-form" onSubmit={save} noValidate>
        {editTab === 'basic' && <div className="panel-heading"><div><h2>ข้อมูลส่วนตัว</h2><p>อัปเดตข้อมูลให้เป็นปัจจุบันอยู่เสมอ</p></div><span className="edit-badge">EDIT PROFILE</span></div>}
        {editTab === 'basic' && <>
        <label>ชื่อที่อยากให้เรียก<input required maxLength={40} value={f.display_name} onChange={set('display_name')} /></label>
        <div className="nm-intent-editor"><strong>ตอนนี้กำลังมองหาอะไร?</strong><p>เลือกได้หนึ่งอย่าง เปลี่ยนได้ทุกเมื่อ และจะแสดงบนโปรไฟล์ของคุณ</p><div className="nm-intent-options">{RELATIONSHIP_INTENTS.map(item => <button type="button" key={item.id} className={f.relationship_intent === item.id ? 'selected' : ''} aria-pressed={f.relationship_intent === item.id} onClick={() => setF(old => ({ ...old, relationship_intent: old.relationship_intent === item.id ? '' : item.id }))}>{item.label}</button>)}</div></div>
        <div className="form-row"><label>วันเกิด (ต้องอายุ 18+)<input type="date" required value={f.birth_date} onChange={set('birth_date')} /></label><label>เพศ<select value={f.gender} onChange={set('gender')}>{Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div>
        </>}
        {editTab === 'campus' && <>
        <section className="choice-section" aria-label="เลือกมหาวิทยาลัย">
          <div className="choice-heading"><div><span className="choice-step">STEP 01 · CAMPUS</span><h3>เรียนอยู่ที่ไหน? <span>✦</span></h3><p>เลือกมหาวิทยาลัยเพื่อเจอคนในคอมมูนิตี้เดียวกัน</p></div><span className="choice-count">{UNIVERSITIES.length}+ สถาบัน</span></div>
          <div className="uni-search"><Search size={17}/><input aria-label="ค้นหามหาวิทยาลัย" placeholder="พิมพ์ชื่อมหาวิทยาลัย..." value={uniQuery} onChange={(e) => setUniQuery(e.target.value)} /><span>{filteredUniversities.length} รายการ</span></div>
          <div className="choice-tabs">{['ทั้งหมด','รัฐ','เอกชน'].map((t) => <button type="button" key={t} className={uniType === t ? 'active' : ''} onClick={() => setUniType(t)}>{t === 'ทั้งหมด' ? 'ทุกสถาบัน' : t === 'รัฐ' ? 'มหาวิทยาลัยรัฐ' : 'มหาวิทยาลัยเอกชน'}</button>)}</div>
          <div className="university-grid">{filteredUniversities.map((u) => <button type="button" key={u.id} className={'university-option ' + (f.uni === u.id ? 'selected' : '')} onClick={() => setF(old => ({ ...old, uni: u.id }))}><span className="uni-symbol"><GraduationCap size={19}/></span><span className="uni-option-copy"><b>{u.name}</b><small>{u.type || 'สถาบันอุดมศึกษา'}</small></span><span className="uni-check">{f.uni === u.id ? <Check size={16}/> : <ArrowRight size={14}/>}</span></button>)}</div>
          {!filteredUniversities.length && <div className="choice-empty">ไม่พบชื่อมหาวิทยาลัย ลองค้นหาด้วยคำสั้น ๆ อีกครั้ง</div>}
          {!f.uni && <small className="choice-hint">เลือกมหาวิทยาลัย 1 แห่งเพื่อไปต่อ</small>}
          {f.uni && <div className="selected-campus"><Check size={15}/> เลือกแล้ว: <b>{uniName(f.uni)}</b></div>}
        </section>
        <section className="choice-section faculty-section" aria-label="เลือกคณะ">
          <div className="choice-heading"><div><span className="choice-step">STEP 02 · YOUR FIELD</span><h3>สนใจสายไหน? <span>✦</span></h3><p>เลือกคณะที่ใกล้กับตัวคุณที่สุด</p></div></div>
          <div className="faculty-grid">{FACULTIES.map((x, i) => <button type="button" key={x} className={'faculty-option ' + (f.faculty === x ? 'selected' : '')} onClick={() => setF({ ...f, faculty: x })}><span className="faculty-number">{String(i + 1).padStart(2, '0')}</span><span>{x}</span>{f.faculty === x && <Check size={15}/>}</button>)}</div>
          <div className="major-field"><label>สาขาวิชา <span className="optional">ไม่บังคับ</span><input value={f.major} onChange={set('major')} placeholder="เช่น วิศวกรรมคอมพิวเตอร์" /></label></div>
        </section>
        </>}
        {editTab === 'interests' && <>
        <label>แนะนำตัว<textarea rows={4} maxLength={300} value={f.bio} onChange={set('bio')} placeholder="เล่าเกี่ยวกับตัวคุณ ความสนใจ หรือสิ่งที่ชอบ..." /><small className="char-count">{f.bio.length}/300</small></label>
        <div className="label-title">ความสนใจ <span className="optional">เลือกได้หลายข้อ</span></div>
        <div className="interest-picker">{INTERESTS.map((i) => <button type="button" key={i} className={'interest-option ' + (f.interests.includes(i) ? 'chosen' : '')} onClick={() => toggle(i)}>{f.interests.includes(i) && <Check size={13} />} {i}</button>)}</div>
        </>}
        {editTab === 'music' && <ITunesSongPicker value={song} onChange={setSong} />}
        <button className="btn btn-pink btn-lg save-btn" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'} <Check size={17} /></button>
      </form></div></div>
    {selfPreviewOpen && createPortal(<div className="modal-backdrop detail-backdrop nm-self-preview-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelfPreviewOpen(false) }}>
      <div className="detail-modal nm-self-preview-modal" role="dialog" aria-modal="true" aria-label="ตัวอย่างโปรไฟล์ของฉัน">
        <button type="button" className="modal-close detail-close-btn" onClick={() => setSelfPreviewOpen(false)} aria-label="ปิดตัวอย่างโปรไฟล์"><X size={21}/></button>
        <div className="nm-self-preview-label"><Eye size={15}/> ตัวอย่างโปรไฟล์ของคุณ</div>
        <div className="detail-gallery v58-swipe-gallery" onTouchStart={e => { selfTouchStart.current = e.touches[0]?.clientX ?? null }} onTouchEnd={e => { if (selfTouchStart.current === null || orderedSelfPhotos.length < 2) return; const diff = (e.changedTouches[0]?.clientX ?? selfTouchStart.current) - selfTouchStart.current; selfTouchStart.current = null; if (Math.abs(diff) > 45) setSelfPreviewIndex(i => (i + (diff < 0 ? 1 : orderedSelfPhotos.length - 1)) % orderedSelfPhotos.length) }}><img key={selfPreviewImage} className="detail-cover v64-photo-fade" src={selfPreviewImage} alt="รูปโปรไฟล์ของฉัน" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ph(f.display_name) }}/>
          {orderedSelfPhotos.length > 1 && <><button type="button" className="gallery-prev" onClick={() => setSelfPreviewIndex(i => (i - 1 + orderedSelfPhotos.length) % orderedSelfPhotos.length)} aria-label="รูปก่อนหน้า">‹</button><button type="button" className="gallery-next" onClick={() => setSelfPreviewIndex(i => (i + 1) % orderedSelfPhotos.length)} aria-label="รูปถัดไป">›</button><div className="gallery-count">{selfPreviewIndex + 1} / {orderedSelfPhotos.length}</div><div className="gallery-thumbnails">{orderedSelfPhotos.map((item,i) => <button type="button" key={item.key} className={i === selfPreviewIndex ? 'active' : ''} onClick={() => setSelfPreviewIndex(i)} aria-label={`ดูรูปที่ ${i+1}`}><img src={item.url} alt=""/></button>)}</div></>}
        </div>
        <div className="detail-body"><div className="section-kicker">YOUR PROFILE PREVIEW</div><h2>{f.display_name || 'ชื่อของคุณ'}{ageOf(f.birth_date) ? `, ${ageOf(f.birth_date)}` : ''}</h2>
          <p><GraduationCap size={15}/>{uniName(f.uni) || 'มหาวิทยาลัย'}{f.faculty ? ` · ${f.faculty}` : ''}</p>
          {profileEmailVerified && <CampusVerifiedBadge/>}
          {f.relationship_intent && <span className="nm-intent-tag">{intentLabel(f.relationship_intent)}</span>}
          <p>{f.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
          <div className="tags">{(f.interests || []).map(i => <span className="tag" key={i}>{i}</span>)}</div>
          <div className="match-profile-song"><ITunesSongCard track={song} compact/></div>
          <button type="button" className="btn btn-pink btn-full" onClick={() => setSelfPreviewOpen(false)}>กลับไปแก้ไขโปรไฟล์</button>
          <p className="nm-self-preview-note">นี่คือตัวอย่างจากข้อมูลที่กำลังแก้ไข คนอื่นจะเห็นข้อมูลใหม่หลังจากคุณกดบันทึกเท่านั้น</p>
        </div>
      </div>
    </div>, document.body)}
  </>)
}

const THEME_OPTIONS = [
  { id: 'midnight', name: 'Midnight', detail: 'เข้ม เรียบ และคลาสสิก', colors: ['#0b101b','#f45ca5','#8e72ff'] },
  { id: 'rose', name: 'Rose', detail: 'ชมพูอ่อน อบอุ่น สบายตา', colors: ['#fff5f9','#d95d91','#f3b7ce'] },
  { id: 'ocean', name: 'Ocean', detail: 'น้ำเงินหม่น ดูสงบ', colors: ['#0b1b2c','#4aa9c7','#8ad6dc'] },
  { id: 'sage', name: 'Sage', detail: 'เขียวธรรมชาติ มินิมอล', colors: ['#15231f','#89b99e','#d3d5a2'] },
  { id: 'lavender', name: 'Lavender', detail: 'ม่วงละมุน นุ่มนวล', colors: ['#1b162a','#b299ed','#efacd7'] },
]
const THEME_KEY = 'nisit-match-theme-v1'
function applyTheme(theme) {
  const next = THEME_OPTIONS.some(item => item.id === theme) ? theme : 'midnight'
  document.documentElement.dataset.theme = next
  try { localStorage.setItem(THEME_KEY, next) } catch {}
}
if (typeof document !== 'undefined') {
  let saved = 'midnight'
  try { saved = localStorage.getItem(THEME_KEY) || saved } catch {}
  applyTheme(saved)
}


function CampusEmailVerification({ user }) {
  const [verification, setVerification] = useState('unverified')
  const [campusEmail, setCampusEmail] = useState('')
  const [campusCode, setCampusCode] = useState('')
  const [campusUniversity, setCampusUniversity] = useState('')
  const [verifyStep, setVerifyStep] = useState('email')
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')
  useEffect(() => {
    let active = true
    supabase.from('student_verifications').select('status').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => { if (active && !error) setVerification(data?.status || 'unverified') })
      .catch(() => {})
    return () => { active = false }
  }, [user.id])
  const requestVerification = async (action) => {
    if (verifyBusy) return
    const email = campusEmail.trim().toLowerCase()
    if (!campusUniversity) return setVerifyMessage('กรุณาเลือกมหาวิทยาลัย')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setVerifyMessage('กรุณากรอกอีเมลมหาวิทยาลัยที่ถูกต้อง')
    if (action === 'verify' && !/^\d{6}$/.test(campusCode.trim())) return setVerifyMessage('กรุณากรอกรหัส 6 หลัก')
    setVerifyBusy(true); setVerifyMessage('')
    try {
      const {data, error} = await supabase.functions.invoke('student-email-otp', {body: {action, university_id: campusUniversity, email, code: campusCode.trim()}})
      if (error || !data?.ok) throw new Error(data?.error || error?.message || 'ไม่สามารถดำเนินการได้')
      if (action === 'request_domain') { setVerifyMessage(data?.message || 'รับคำขอแล้ว กรุณารอการตรวจสอบโดเมน'); return }
      if (action === 'send') { setVerifyStep('code'); setVerifyMessage('ส่งรหัส 6 หลักแล้ว กรุณาตรวจกล่องจดหมายและจดหมายขยะ (Spam / Junk) ของอีเมลมหาวิทยาลัย') }
      else { setVerification('verified'); setVerifyMessage('ยืนยันอีเมลมหาวิทยาลัยสำเร็จ'); setCampusCode('') }
    } catch (err) { setVerifyMessage(err?.message || 'เกิดข้อผิดพลาด') }
    finally { setVerifyBusy(false) }
  }
  return (<>    <section className="v26-settings-section v27-verification" aria-label="ยืนยันนักศึกษา">
      <span className="theme-kicker">STUDENT VERIFICATION</span>
      <h3>ยืนยันอีเมลมหาวิทยาลัย</h3>
      <p>ใช้ Gmail เข้าสู่ระบบได้เหมือนเดิม เพิ่มอีเมลมหาวิทยาลัยเพื่อรับรหัสยืนยันแยกต่างหาก</p>
      <div className="v26-verify-row">{verification === 'verified' ? <span className="nm-verified-badge" role="status"><ShieldCheck size={17} strokeWidth={2.2}/>ยืนยันอีเมลมหาวิทยาลัยแล้ว</span> : <span className="v26-status">ยังไม่ยืนยันอีเมลมหาวิทยาลัย</span>}</div>
      {verification === 'verified' && <p className="v27-verify-success" role="status"><ShieldCheck size={18}/> บัญชีนี้ผ่านการยืนยันความเป็นเจ้าของอีเมลมหาวิทยาลัยแล้ว</p>}
      {verification !== 'verified' && <div className="v27-verify-form">
        <label htmlFor="v27-campus">มหาวิทยาลัย / สถาบันอุดมศึกษา</label>
        <select id="v27-campus" value={campusUniversity} onChange={e => {setCampusUniversity(e.target.value); setVerifyStep('email'); setVerifyMessage('')}}>
          <option value="">เลือกมหาวิทยาลัย</option>
          {UNIVERSITIES.filter((u,i,a)=>a.findIndex(x=>x.name===u.name)===i).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <label htmlFor="v27-campus-email">อีเมลมหาวิทยาลัย (ไม่ใช่อีเมลล็อกอิน)</label>
        <input id="v27-campus-email" type="email" inputMode="email" autoComplete="email" placeholder="student@university.ac.th" value={campusEmail} onChange={e=>{setCampusEmail(e.target.value); setVerifyStep('email')}} />
        {verifyStep === 'code' && <p className="v27-spam-hint" role="note">หากไม่พบรหัสยืนยัน กรุณาตรวจโฟลเดอร์จดหมายขยะ (Spam / Junk) และรอสักครู่ก่อนกดส่งรหัสอีกครั้ง</p>}
        {verifyStep === 'code' && <><label htmlFor="v27-campus-code">รหัสยืนยัน 6 หลัก</label><input id="v27-campus-code" type="text" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={campusCode} onChange={e=>setCampusCode(e.target.value.replace(/\D/g,'').slice(0,6))}/></>}
        <button type="button" className="btn btn-pink" disabled={verifyBusy} onClick={()=>requestVerification(verifyStep === 'code' ? 'verify' : 'send')}>{verifyBusy ? 'กำลังดำเนินการ...' : verifyStep === 'code' ? 'ยืนยันรหัส' : 'ส่งรหัสไปยังอีเมลมหาวิทยาลัย'}</button>
        {verifyStep === 'code' && <button type="button" className="btn btn-ghost btn-small" disabled={verifyBusy} onClick={()=>requestVerification('send')}>ส่งรหัสอีกครั้ง</button>}
        {verifyMessage && <p className="v27-verify-message" role="status">{verifyMessage}</p>}
        <p className="v27-verify-note">ถ้ายังไม่รองรับโดเมนอีเมลของสถาบัน สามารถส่งคำขอเพิ่มได้ ผู้ดูแลจะตรวจสอบก่อนเปิดใช้ OTP และป้ายยืนยัน</p>
        {verifyStep === 'email' && <button type="button" className="btn btn-ghost btn-small" disabled={verifyBusy} onClick={()=>requestVerification('request_domain')}>ไม่พบโดเมนของฉัน — ขอเพิ่มโดเมน</button>}
      </div>}
    </section>
  </>)
}

function SettingsPage({ user, notify }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'midnight' } catch { return 'midnight' }
  })
  const chooseTheme = (id) => { setTheme(id); applyTheme(id) }

  const [privacy, setPrivacy] = useState({ mode: 'visible' })
  const [privacyBusy, setPrivacyBusy] = useState(false)
  useEffect(() => {
    let active = true
    supabase.from('profile_visibility').select('mode').eq('user_id', user.id).maybeSingle()
      .then(({data,error}) => { if (active && !error && data) setPrivacy(data) }).catch(() => {})
    return () => { active = false }
  }, [user.id])
  const setPrivacyMode = async (mode) => {
    setPrivacyBusy(true)
    const { error } = await supabase.from('profile_visibility').upsert({user_id:user.id,mode}, {onConflict:'user_id'})
    setPrivacyBusy(false)
    if (error) return notify('ตั้งค่าความเป็นส่วนตัวไม่สำเร็จ: ' + error.message)
    setPrivacy({mode}); notify('บันทึกการมองเห็นโปรไฟล์แล้ว')
  }
  const [pushBusy, setPushBusy] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration().then(r => r?.pushManager.getSubscription()).then(s => setPushEnabled(!!s)).catch(() => {})
    }
  }, [])
  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !window.isSecureContext) return notify('ต้องใช้ HTTPS และเบราว์เซอร์ที่รองรับ Push')
    const key = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!key) return notify('ยังไม่ได้ตั้งค่า VITE_VAPID_PUBLIC_KEY')
    setPushBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('ยังไม่ได้อนุญาตการแจ้งเตือน')
      const registration = await navigator.serviceWorker.register('/sw.js')
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      const json = subscription.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({ user_id: user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' })
      if (error) throw error
      setPushEnabled(true); notify('เปิดแจ้งเตือนบนอุปกรณ์นี้แล้ว')
    } catch (e) { notify('เปิดแจ้งเตือนไม่สำเร็จ: ' + e.message) }
    finally { setPushBusy(false) }
  }
  const disablePush = async () => {
    setPushBusy(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const sub = await registration?.pushManager.getSubscription()
      if (sub) {
        const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint).eq('user_id', user.id)
        if (error) throw error
        await sub.unsubscribe()
      }
      setPushEnabled(false); notify('ปิดแจ้งเตือนอุปกรณ์นี้แล้ว')
    } catch(e) { notify(e.message) }
    finally { setPushBusy(false) }
  }
  const reset = async () => { const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin }); notify(error ? error.message : 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว') }
  return (<>
    <Heading kicker="YOUR ACCOUNT, YOUR RULES" title="การตั้งค่า" sub="จัดการบัญชีและดูแลความปลอดภัยของคุณ" />
    <section className="theme-gallery" aria-label="เลือกธีมของแอป">
      <div className="theme-gallery-heading"><div><span className="theme-kicker">APPEARANCE</span><h3>ธีมของคุณ</h3><p>เลือกบรรยากาศที่ชอบ เปลี่ยนได้ทุกเมื่อ</p></div><span className="theme-selected-label">{THEME_OPTIONS.find(t => t.id === theme)?.name || 'Midnight'}</span></div>
      <div className="theme-options">{THEME_OPTIONS.map(t => <button type="button" key={t.id} className={'theme-option' + (theme === t.id ? ' is-selected' : '')} aria-pressed={theme === t.id} onClick={() => chooseTheme(t.id)}>
        <span className="theme-swatch" style={{ background: t.colors[0] }}><span className="theme-swatch-card" style={{ background: t.colors[1] }} /><span className="theme-swatch-pill" style={{ background: t.colors[2] }} /><span className="theme-swatch-dot" style={{ background: t.colors[1] }} /></span>
        <span className="theme-option-label"><strong>{t.name}</strong><small>{t.detail}</small></span>
        <span className="theme-check">{theme === t.id && <Check size={14}/>}</span>
      </button>)}</div>
    </section>
    <section className="v26-settings-section" aria-label="ความเป็นส่วนตัว">
      <span className="theme-kicker">PRIVACY & DISCOVERY</span><h3>ใครสามารถพบคุณได้</h3><p>ควบคุมการแสดงโปรไฟล์ในหน้าปัดของคนอื่น</p>
      <div className="v26-mode-grid">{[
        ['visible','เปิดให้ค้นพบ','แสดงโปรไฟล์ตามปกติ'],
        ['incognito','Incognito','เฉพาะคนที่คุณกดถูกใจเท่านั้น'],
        ['paused','พักการค้นหา','ซ่อนโปรไฟล์ชั่วคราว']
      ].map(([id,title,sub]) => <button type="button" key={id} disabled={privacyBusy} className={'v26-mode' + (privacy.mode === id ? ' selected' : '')} onClick={() => setPrivacyMode(id)} aria-pressed={privacy.mode === id}><span><strong>{title}</strong><small>{sub}</small></span>{privacy.mode === id && <Check size={19}/>}</button>)}</div>
    </section>
    <div className="settings-grid">
      <div className="settings-card"><div className="settings-icon"><ShieldCheck /></div><div><h3>ความเป็นส่วนตัวและความปลอดภัย</h3><p>หน้าค้นหาไม่แสดงอีเมลและวันเกิดของคุณ และคุณสามารถบล็อกหรือรายงานผู้ใช้ได้</p></div><span className="settings-status">เปิดใช้งาน</span></div>
      <div className="settings-card"><div className="settings-icon"><LockKeyhole /></div><div><h3>รหัสผ่าน</h3><p>ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ {user.email}</p></div><button className="btn btn-ghost btn-small" onClick={reset}>ส่งลิงก์</button></div>
      <div className="settings-card"><div className="settings-icon"><Bell /></div><div><h3>Push Notifications</h3><p>รับแจ้งเตือนเมื่อมีคนสนใจคุณหรือแมตช์ใหม่บนโทรศัพท์ หลังตั้งค่าระบบส่ง Push</p></div><button className="btn btn-ghost btn-small" disabled={pushBusy} onClick={pushEnabled ? disablePush : enablePush}>{pushBusy ? "กำลังตั้งค่า..." : pushEnabled ? "ปิดแจ้งเตือน" : "เปิดแจ้งเตือน"}</button></div>
      <div className="settings-card"><div className="settings-icon"><Users /></div><div><h3>ชุมชน nisit match</h3><p>เคารพขอบเขตของกันและกัน ไม่ส่งข้อความคุกคาม และรายงานพฤติกรรมที่ไม่เหมาะสม</p></div></div>
      <div className="settings-danger"><div><h3>ออกจากระบบ</h3><p>ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน</p></div><button className="btn btn-danger" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> ออกจากระบบ</button></div>
    </div></>)
}

function LockedProfileDetail({ children, onClose, className = '' }) {
  useViewportScrollLock(true)
  useEffect(() => { const onKey = e => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onClose])
  return createPortal(<div className={'modal-backdrop detail-backdrop ' + className} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>{children}</div>, document.body)
}

function ProfileGallery({ person }) {
  const photos = [...new Set([person?.avatar_path, ...(Array.isArray(person?.photo_paths) ? person.photo_paths : [])].filter(Boolean))]
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [person?.id])
  const current = photos[index] || photos[0]
  const touchStart = useRef(null)
  useEffect(() => { if (photos.length > 1) { const image = new Image(); image.src = pub(photos[(index + 1) % photos.length]) } }, [index, person?.id])
  return <div className="detail-gallery v58-swipe-gallery" onTouchStart={e => { touchStart.current = e.touches[0]?.clientX ?? null }} onTouchEnd={e => { if (touchStart.current === null || photos.length < 2) return; const diff = (e.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; touchStart.current = null; if (Math.abs(diff) > 45) setIndex(i => (i + (diff < 0 ? 1 : photos.length - 1)) % photos.length) }}>
    <img className="detail-cover v64-photo-fade" src={pub(current) || ph(person?.display_name)} alt={`รูปของ ${person?.display_name || 'สมาชิก'}`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ph(person?.display_name) }} />
    {photos.length > 1 && <>
      <button type="button" className="gallery-prev" onClick={() => setIndex(i => (i - 1 + photos.length) % photos.length)} aria-label="รูปก่อนหน้า">‹</button>
      <button type="button" className="gallery-next" onClick={() => setIndex(i => (i + 1) % photos.length)} aria-label="รูปถัดไป">›</button>
      <div className="gallery-count">{index + 1} / {photos.length}</div>
      <div className="gallery-thumbnails">{photos.map((path, i) => <button type="button" key={path} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`ดูรูปที่ ${i + 1}`}><img src={pub(path)} alt="" /></button>)}</div>
    </>}
  </div>
}

const defaultDiscovery = { mode: 'nearby', radius: 25, gender: '', min: 18, max: 30, universities: [] }
const discoveryKey = id => `nisit-discovery-v11-${id}`
const readDiscovery = id => { try { const x = JSON.parse(localStorage.getItem(discoveryKey(id)) || 'null'); return x && typeof x === 'object' ? { ...defaultDiscovery, ...x } : null } catch { return null } }

function DiscoverySetup({ initial, profile, onSave, onClose, isEditing = false }) {
  const [step, setStep] = useState(0)
  const [pref, setPref] = useState(() => ({ ...defaultDiscovery, ...initial }))
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeSmoothly = () => { if (closing) return; setClosing(true); window.setTimeout(onClose, 190) }
  const homeHasCoords = hasCampusCoordinates(profile.university_id)
  const toggleUni = id => setPref(p => ({ ...p, universities: p.universities.includes(id) ? p.universities.filter(x => x !== id) : [...p.universities, id] }))
  const finish = async () => { setSaving(true); try { await onSave(pref) } finally { setSaving(false) } }
  return <div className={"discovery-overlay" + (isEditing ? " discovery-editing" : "") + (closing ? " is-closing" : "")}><div className="discovery-aurora a"/><div className="discovery-aurora b"/><div className="discovery-card" key={step}>
    <div className="discovery-head"><span className="discovery-logo"><Heart size={18} fill="currentColor"/> NISIT <b>MATCH</b></span>{isEditing && <button className="discovery-close" onClick={closeSmoothly} aria-label="ปิด"><X size={20}/></button>}</div>
    <div className="discovery-progress"><span style={{ width: `${(step + 1) * 33.333}%` }}/></div>
    <div className="discovery-step-label">DISCOVERY PREFERENCES <span>0{step + 1} / 03</span></div>
    {step === 0 && <div className="discovery-body"><div className="discovery-symbol"><Heart size={27} strokeWidth={1.6}/></div><h1>หัวใจคุณกำลัง<br/><em>มองหาใครอยู่?</em></h1><p>เลือกคนที่คุณสนใจ แล้วเราจะช่วยพาไปเจอคนที่ใช่</p><div className="discovery-choice-grid">{[['',Users,'ทุกเพศ'],['male',UserRound,'ผู้ชาย'],['female',Heart,'ผู้หญิง'],['other',Sparkles,'เพศอื่น ๆ']].map(([id,Icon,label]) => <button key={id} className={'discovery-choice ' + (pref.gender === id ? 'chosen' : '')} onClick={() => setPref(p => ({...p, gender:id}))}><span className="choice-icon"><Icon size={19} strokeWidth={1.8}/></span><b>{label}</b>{pref.gender === id && <Check size={17}/>}</button>)}</div><div className="discovery-age"><div className="discovery-age-title"><b>ช่วงอายุที่สนใจ</b><span>{pref.min} – {pref.max} ปี</span></div><label>อายุต่ำสุด <input type="range" min="18" max="40" value={pref.min} onChange={e => setPref(p => ({...p,min: Math.min(+e.target.value,p.max)}))}/></label><label>อายุสูงสุด <input type="range" min="18" max="60" value={pref.max} onChange={e => setPref(p => ({...p,max: Math.max(+e.target.value,p.min)}))}/></label></div></div>}
    {step === 1 && <div className="discovery-body"><div className="discovery-symbol"><MapPin size={27} strokeWidth={1.6}/></div><h1>คนที่ใช่<br/><em>อาจอยู่ใกล้กว่าที่คิด</em></h1><p>เลือกว่าจะค้นหาจากมหาวิทยาลัยไหน โดยไม่ต้องเปิด GPS</p><div className="discovery-mode-list">{[['nearby',LocateFixed,'มหาวิทยาลัยใกล้ฉัน','ค้นหาจากระยะห่างระหว่างวิทยาเขต'],['same',GraduationCap,'มหาวิทยาลัยเดียวกัน','คนที่เรียนมหาวิทยาลัยเดียวกับคุณ'],['selected',Compass,'เลือกมหาวิทยาลัยเอง','เลือกได้มากกว่าหนึ่งแห่ง'],['all',Globe2,'ทุกมหาวิทยาลัย','เปิดโอกาสเจอทุกคน']].map(([id,Icon,label,sub]) => <button key={id} className={'discovery-mode ' + (pref.mode === id ? 'chosen' : '')} onClick={() => setPref(p => ({...p,mode:id}))}><span className="mode-icon"><Icon size={19} strokeWidth={1.8}/></span><span><b>{label}</b><small>{sub}</small></span><span className="mode-radio">{pref.mode === id && <Check size={14}/>}</span></button>)}</div>{pref.mode === 'nearby' && <div className="discovery-distance"><div><b>รัศมีค้นหา</b><strong>{pref.radius} กม.</strong></div><input type="range" min="5" max="100" step="5" value={pref.radius} onChange={e => setPref(p => ({...p,radius:+e.target.value}))}/>{!homeHasCoords && <small>ยังไม่มีพิกัดมหาวิทยาลัยของคุณในระบบ กรุณาเลือกโหมดอื่นหรือเพิ่มพิกัดใน campusCoordinates.js</small>}</div>}</div>}
    {step === 2 && <div className="discovery-body"><div className="discovery-symbol"><Check size={27} strokeWidth={1.6}/></div><h1>เกือบแล้ว!<br/><em>พร้อมเจอคนใหม่หรือยัง?</em></h1><p>คุณสามารถกลับมาแก้ไขสเปกได้ทุกเมื่อจากหน้าหลัก</p>{pref.mode === 'selected' ? <div className="discovery-uni-picker"><div className="discovery-uni-list">{UNIVERSITIES.map(u => <button key={u.id} className={pref.universities.includes(u.id) ? 'chosen' : ''} onClick={() => toggleUni(u.id)}><span>{u.name}</span>{pref.universities.includes(u.id) ? <Check size={16}/> : <span>+</span>}</button>)}</div><small>เลือกแล้ว {pref.universities.length} มหาวิทยาลัย</small></div> : <div className="discovery-summary"><div><Heart size={17}/> <span>เพศที่สนใจ</span><b>{GENDERS[pref.gender] || 'ทุกเพศ'}</b></div><div><Cake size={17}/> <span>ช่วงอายุ</span><b>{pref.min}–{pref.max} ปี</b></div><div><GraduationCap size={17}/> <span>มหาวิทยาลัย</span><b>{({nearby:`ใกล้เคียง ${pref.radius} กม.`,same:'มหาวิทยาลัยเดียวกัน',all:'ทุกมหาวิทยาลัย'})[pref.mode]}</b></div></div>}</div>}
    <div className="discovery-actions">{step > 0 && <button className="discovery-back" onClick={() => setStep(x => x - 1)}>ย้อนกลับ</button>}<button className="discovery-next" disabled={saving || (step === 2 && pref.mode === 'selected' && !pref.universities.length) || (step === 2 && pref.mode === 'nearby' && !homeHasCoords)} onClick={() => step < 2 ? setStep(x => x + 1) : finish()}>{saving ? 'กำลังบันทึก...' : step === 2 ? 'เริ่มปัดเลย' : 'ไปต่อ'} <ArrowRight size={19}/></button></div>
    <div className="discovery-privacy"><ShieldCheck size={14}/> ใช้พิกัดมหาวิทยาลัย ไม่ติดตามตำแหน่งของคุณ</div>
  </div></div>
}


function PreferencesEditor({ initial, profile, onSave, onClose }) {
  const [pref, setPref] = useState(() => ({ ...defaultDiscovery, ...initial }))
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const hasCoords = hasCampusCoordinates(profile?.university_id)
  const close = () => { if (closing || saving) return; setClosing(true); window.setTimeout(onClose, 190) }
  const update = patch => setPref(p => ({ ...p, ...patch }))
  const toggleUni = id => setPref(p => ({ ...p, universities: p.universities.includes(id) ? p.universities.filter(x => x !== id) : [...p.universities, id] }))
  const valid = !(pref.mode === 'selected' && !pref.universities.length) && !(pref.mode === 'nearby' && !hasCoords)
  const save = async () => { if (!valid || saving) return; setSaving(true); try { await onSave(pref) } finally { setSaving(false) } }
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closing, saving])
  return <div className={'pref-overlay' + (closing ? ' pref-leaving' : '')} onMouseDown={e => { if (e.target === e.currentTarget) close() }}>
    <section className="pref-sheet" role="dialog" aria-modal="true" aria-labelledby="pref-title">
      <header className="pref-header"><div className="pref-header-copy"><span className="pref-eyebrow">YOUR DISCOVERY</span><h1 id="pref-title">คนแบบที่คุณอยากเจอ</h1><p>ปรับความชอบให้ตรงใจ แล้วกลับไปทำความรู้จักกัน</p></div><button className="pref-close" type="button" onClick={close} aria-label="ปิดการตั้งค่า"><X size={20}/></button></header>
      <div className="pref-content">
        <section className="pref-section"><div className="pref-section-heading"><span className="pref-index">01</span><div><h2>เพศที่สนใจ</h2><p>เลือกคนที่อยากให้ปรากฏบนหน้าปัด</p></div></div><div className="pref-gender-grid">{[['','ทุกเพศ'],['male','ผู้ชาย'],['female','ผู้หญิง'],['other','เพศอื่น ๆ']].map(([id,label]) => <button type="button" key={id} className={'pref-pill' + (pref.gender === id ? ' is-active' : '')} onClick={() => update({gender:id})} aria-pressed={pref.gender === id}><span>{label}</span>{pref.gender === id && <Check size={15}/>}</button>)}</div></section>
        <section className="pref-section"><div className="pref-section-heading"><span className="pref-index">02</span><div><h2>ช่วงอายุ</h2><p>ช่วงอายุของคนที่คุณอยากทำความรู้จัก</p></div><span className="pref-value">{pref.min}–{pref.max} ปี</span></div><div className="pref-range-row"><label htmlFor="pref-age-min">ตั้งแต่ <b>{pref.min}</b> ปี</label><input id="pref-age-min" className="pref-range" type="range" min="18" max="40" value={pref.min} style={{'--fill':`calc(10px + (100% - 20px) * ${(pref.min-18)/22})`}} onChange={e => update({min:Math.min(+e.target.value,pref.max)})}/></div><div className="pref-range-row"><label htmlFor="pref-age-max">ถึง <b>{pref.max}</b> ปี</label><input id="pref-age-max" className="pref-range" type="range" min="18" max="60" value={pref.max} style={{'--fill':`calc(10px + (100% - 20px) * ${(pref.max-18)/42})`}} onChange={e => update({max:Math.max(+e.target.value,pref.min)})}/></div></section>
        <section className="pref-section"><div className="pref-section-heading"><span className="pref-index">03</span><div><h2>มหาวิทยาลัย</h2><p>เลือกพื้นที่ที่อยากค้นหาคนใหม่ ๆ</p></div></div><div className="pref-mode-list">{[['nearby','มหาวิทยาลัยใกล้เคียง','คำนวณจากระยะห่างระหว่างวิทยาเขต'],['same','มหาวิทยาลัยเดียวกัน','คนจากมหาวิทยาลัยของคุณ'],['selected','เลือกมหาวิทยาลัยเอง','เลือกได้หลายแห่ง'],['all','ทุกมหาวิทยาลัย','ไม่จำกัดมหาวิทยาลัย']].map(([id,label,sub]) => <button type="button" key={id} className={'pref-mode' + (pref.mode === id ? ' is-active' : '')} onClick={() => update({mode:id})} aria-pressed={pref.mode === id}><span className="pref-radio"><span/></span><span className="pref-mode-text"><strong>{label}</strong><small>{sub}</small></span></button>)}</div>
        {pref.mode === 'nearby' && <div className="pref-extra"><div className="pref-extra-head"><span>ระยะทางที่สนใจ</span><b>{pref.radius} กม.</b></div><input className="pref-range" aria-label="ระยะทางค้นหา" type="range" min="5" max="100" step="5" value={pref.radius} style={{'--fill':`calc(10px + (100% - 20px) * ${(pref.radius-5)/95})`}} onChange={e => update({radius:+e.target.value})}/>{!hasCoords && <p className="pref-hint">ยังไม่มีพิกัดวิทยาเขตนี้ กรุณาเลือกวิธีค้นหาอื่น</p>}</div>}
        {pref.mode === 'selected' && <div className="pref-uni-list">{UNIVERSITIES.map(u => <button type="button" key={u.id} className={pref.universities.includes(u.id) ? 'is-active' : ''} onClick={() => toggleUni(u.id)}><span>{u.name}</span><span className="pref-uni-check">{pref.universities.includes(u.id) && <Check size={14}/>}</span></button>)}</div>}
        </section>
      </div>
      <footer className="pref-footer"><span><ShieldCheck size={15}/> ไม่ใช้ตำแหน่ง GPS ส่วนตัว</span><div><button type="button" className="pref-cancel" onClick={close}>ยกเลิก</button><button type="button" className="pref-save" disabled={!valid || saving} onClick={save}>{saving ? 'กำลังบันทึก...' : 'บันทึกสเปก'}<ArrowRight size={17}/></button></div></footer>
    </section>
  </div>
}

export default function App() {
  const [session, setSession] = useState(undefined), [profile, setProfile] = useState(undefined), [view, setView] = useState('home'), [modal, setModal] = useState(''), [toast, setToast] = useState(null), [nav, setNav] = useState(false)
  const [people, setPeople] = useState(null), [matches, setMatches] = useState([]), [unread, setUnread] = useState(0), [unreadMessages, setUnreadMessages] = useState(0), [detail, setDetail] = useState(null)
  const [newMatch, setNewMatch] = useState(null)
  const [lastSwipe, setLastSwipe] = useState(null)
  const [superBusy, setSuperBusy] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('fake_profile')
  const [reportNotes, setReportNotes] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [verifiedCampusIds, setVerifiedCampusIds] = useState([])
  const [fl, setFl] = useState({ q: '', uni: '', min: 18, max: 40, gender: '' }), [filterOpen, setFilterOpen] = useState(false)
  const [discovery, setDiscovery] = useState(null), [discoveryReady, setDiscoveryReady] = useState(false), [discoveryEditing, setDiscoveryEditing] = useState(false)
  const [visibleDetail, setVisibleDetail] = useState(null)
  const [detailLeaving, setDetailLeaving] = useState(false)
  useEffect(() => {
    if (detail) { setVisibleDetail(detail); setDetailLeaving(false); return }
    if (!visibleDetail) return
    setDetailLeaving(true)
    const timer = window.setTimeout(() => { setVisibleDetail(null); setDetailLeaving(false) }, 190)
    return () => window.clearTimeout(timer)
  }, [detail])
  const notify = useCallback((m) => { setToast(m); setTimeout(() => setToast(null), 3000) }, [])
  const user = session?.user
  const userId = user?.id
  // Restore the last tab only for the same account; do not reset it on token refresh.
  const lastAccountRef = useRef(null)
  useEffect(() => {
    if (session === undefined) return
    if (!userId) {
      lastAccountRef.current = null
      setView('home')
      setDetail(null)
      setVisibleDetail(null)
      return
    }
    if (lastAccountRef.current !== userId) {
      lastAccountRef.current = userId
      try {
        const saved = sessionStorage.getItem(`nisit-last-view:${userId}`)
        setView(['home', 'messages', 'notifs', 'profile', 'settings'].includes(saved) ? saved : 'home')
      } catch { setView('home') }
    }
  }, [userId, session === undefined])
  useEffect(() => {
    if (!userId) return
    try { sessionStorage.setItem(`nisit-last-view:${userId}`, view) } catch {}
  }, [view, userId])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // SIGNED_IN also fires when an existing session is revalidated after app resume.
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => { if (userId) setModal('') }, [userId])
  const loadProfile = useCallback(async () => { if (!userId) return; const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle(); if (error) { notify('โหลดโปรไฟล์ไม่สำเร็จ: ' + error.message); return } setProfile(data) }, [userId, notify])
  const loadUnread = useCallback(async () => { if (!userId) return; const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false).in('type', ['interest', 'match']); setUnread(count || 0) }, [userId])
  // Message badges are separate from activity notifications: unread chat messages
  // animate the Messages tab, without generating a noisy notification for each text.
  const loadUnreadMessages = useCallback(async () => {
    if (!userId) { setUnreadMessages(0); return }
    const { data: rooms, error: roomsError } = await supabase.from('matches')
      .select('id').or(`user_a.eq.${userId},user_b.eq.${userId}`)
    if (roomsError || !rooms?.length) { if (!roomsError) setUnreadMessages(0); return }
    const { count, error } = await supabase.from('messages')
      .select('id', { count: 'exact', head: true })
      .in('match_id', rooms.map(r => r.id))
      .neq('sender_id', userId).is('read_at', null)
    if (!error) setUnreadMessages(count || 0)
  }, [userId])
  useEffect(() => {
    if (!userId) { setUnreadMessages(0); return }
    loadUnreadMessages()
    const poll = setInterval(loadUnreadMessages, 12000)
    const channel = supabase.channel(`unread-messages-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadUnreadMessages())
      .subscribe()
    const refresh = () => { if (document.visibilityState === 'visible') loadUnreadMessages() }
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(poll); document.removeEventListener('visibilitychange', refresh); supabase.removeChannel(channel) }
  }, [userId, loadUnreadMessages])

  
const loadMatches = useCallback(async () => {
  if (!user?.id) return

  const { data: ms, error: matchError } = await supabase
    .from('matches')
    .select('id, user_a, user_b, created_at')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (matchError) {
    console.error('Match error:', matchError)
    notify('โหลดห้องแชตไม่สำเร็จ: ' + matchError.message)
    return
  }

  const mine = ms || []

  const otherIds = [
    ...new Set(
      mine.map(m =>
        m.user_a === user.id ? m.user_b : m.user_a
      )
    )
  ]

  let profiles = []

  if (otherIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, birth_date, avatar_path, photo_paths, itunes_track_id, itunes_track_name, itunes_track_artist, itunes_track_image, itunes_track_preview, itunes_track_url')
      .in('id', otherIds)

    if (error) {
      console.error('Profile error:', error)
      notify('โหลดโปรไฟล์คู่ Match ไม่สำเร็จ: ' + error.message)
    }

    profiles = data || []
    if (profiles.length < otherIds.length) {
      console.warn('Match profiles unavailable: check profiles RLS or missing profile rows', { requested: otherIds.length, returned: profiles.length })
    }
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('blocks')
    .select('blocked')
    .eq('blocker', user.id)

  if (blocksError) {
    console.error('Blocks error:', blocksError)
  }

  const blockedIds = new Set(
    (blocks || []).map(b => b.blocked)
  )

  const profileMap = new Map(
    profiles.map(p => [p.id, p])
  )

  const rooms = mine.map(m => {
    const otherId =
      m.user_a === user.id ? m.user_b : m.user_a

    const p = profileMap.get(otherId)

    return {
      id: m.id,
      p: p
        ? {
            ...p,
            age: p.birth_date
              ? ageOf(p.birth_date)
              : ''
          }
        : {
            id: otherId,
            display_name: 'โปรไฟล์ไม่พร้อมใช้งาน',
            age: '',
            avatar_path: null,
            photo_paths: []
          }
    }
  })

  setMatches(previous => rooms.filter(room => !blockedIds.has(room.p.id)).map(room => {
    const old = previous.find(x => x.id === room.id)
    const newName = room.p?.display_name
    const missing = !newName || newName === 'โปรไฟล์ไม่พร้อมใช้งาน'
    return missing && old?.p?.display_name && old.p.display_name !== 'โปรไฟล์ไม่พร้อมใช้งาน'
      ? { ...room, p: old.p } : room
  }))

}, [user?.id, notify])

  useEffect(() => {
    if (!userId || !profile?.id) { setDiscoveryReady(false); return }
    let active = true
    const cached = readDiscovery(userId)
    setDiscovery(cached)
    setDiscoveryReady(true)
    supabase.from('discovery_preferences').select('preferences').eq('user_id', userId).maybeSingle().then(({data}) => {
      if (!active || !data?.preferences) return
      const remote = {...defaultDiscovery, ...data.preferences}
      setDiscovery(remote)
      try { localStorage.setItem(discoveryKey(userId), JSON.stringify(remote)) } catch {}
    })
    return () => { active = false }
  }, [userId, profile?.id])
  const saveDiscovery = async prefs => {
    try { localStorage.setItem(discoveryKey(userId), JSON.stringify(prefs)) } catch {}
    setDiscovery(prefs)
    setDiscoveryEditing(false)
    setFl(f => ({...f, uni: '', gender: prefs.gender, min: prefs.min, max: prefs.max}))
    const {error} = await supabase.from('discovery_preferences').upsert({user_id:userId, preferences:prefs}, {onConflict:'user_id'})
    if (error) notify('บันทึกในเครื่องแล้ว · หากต้องการซิงก์ข้ามอุปกรณ์ ให้รัน SQL ของ v11')
  }
  const campusFiltered = useCallback(p => {
    if (!discovery) return true
    if (discovery.mode === 'same') return p.university_id === profile?.university_id
    if (discovery.mode === 'selected') return (discovery.universities || []).includes(p.university_id)
    if (discovery.mode === 'nearby') { const km = campusDistance(profile?.university_id, p.university_id); return km !== null && km <= discovery.radius }
    return true
  }, [discovery, profile?.university_id])
  const discoveryRequest = useRef(0)
  const loadPeople = useCallback(async () => {
    const request = ++discoveryRequest.current
    const { data, error } = await supabase.rpc('discover', { p_university: null, p_min_age: +(discovery?.min ?? fl.min), p_max_age: +(discovery?.max ?? fl.max), p_gender: discovery?.gender || null })
    if (request !== discoveryRequest.current) return
    if (error) { notify(error.message); return }
    setPeople(data || [])
  }, [discovery?.min, discovery?.max, discovery?.gender, fl.min, fl.max, notify])
  useEffect(() => { if (!userId) { setProfile(undefined); return } setProfile(undefined); loadProfile(); loadUnread() }, [userId, loadProfile, loadUnread])
  useEffect(() => { if (profile) { loadMatches(); loadPeople() } }, [profile, loadMatches, loadPeople])
  // Only expose verified account IDs, never private university email addresses.
  useEffect(() => {
    if (!userId || !people?.length) { setVerifiedCampusIds([]); return }
    let active = true
    const ids = [...new Set(people.map(p => p.id).filter(Boolean))]
    supabase.rpc('verified_student_profile_ids', { candidate_ids: ids })
      .then(({ data, error }) => { if (active) setVerifiedCampusIds(error ? [] : (data || []).map(x => x.user_id)) })
      .catch(() => { if (active) setVerifiedCampusIds([]) })
    return () => { active = false }
  }, [userId, people])

  useEffect(() => { const refresh = () => { if (document.visibilityState === 'visible' && user?.id) loadMatches() }; document.addEventListener('visibilitychange', refresh); return () => document.removeEventListener('visibilitychange', refresh) }, [user?.id, loadMatches])
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('notif-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (p) => { if (!['interest', 'match'].includes(p.new.type)) return; notify(p.new.type === 'match' ? 'คุณได้รับการแมตช์แล้ว!' : 'มีคนกำลังสนใจคุณอยู่'); loadUnread(); if (p.new.type === 'match') loadMatches() }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, notify, loadUnread, loadMatches])

  const swipe = async (p, is_like) => {
    if (!user || !p?.id) return notify('กรุณาเข้าสู่ระบบก่อน')
    const { error } = await supabase.from('likes').insert({ from_id: user.id, to_id: p.id, is_like })
    if (error) return notify(error.code === '23505' ? 'คุณเลือกคนนี้ไปแล้ว' : `บันทึกไม่สำเร็จ: ${error.message}`)
    setLastSwipe({ person: p, at: Date.now(), matched: false })
    // The deck owns the exit animation; don't add a second 650ms wait after the request.
    setPeople((l) => (l || []).filter((x) => x.id !== p.id)); setDetail(null)
    if (is_like) {
      const [a, b] = [user.id, p.id].sort()
      // Trigger on_like() creates the match when the other person has already liked back.
      const { data, error: matchError } = await supabase.from('matches').select('id').eq('user_a', a).eq('user_b', b).maybeSingle()
      if (matchError) notify('บันทึก Like แล้ว แต่ตรวจสอบ Match ไม่สำเร็จ กรุณารีเฟรชหน้า')
      else if (data) { setLastSwipe(null); setNewMatch({ id: data.id, p }); await loadMatches() }
      else notify(`ส่งหัวใจให้ ${p.display_name} แล้ว 💙`)
    } else notify('ข้ามโปรไฟล์แล้ว')
  }
  const undoSwipe = async () => {
    if (!lastSwipe || Date.now()-lastSwipe.at > 120000) { setLastSwipe(null); return notify('ย้อนกลับได้ภายใน 2 นาทีหลังปัด') }
    const { data, error } = await supabase.rpc('v60_undo_swipe', { p_target: lastSwipe.person.id })
    if (error || !data) return notify(error?.message || 'ไม่สามารถย้อนกลับได้ หากเกิด Match แล้วจะย้อนกลับไม่ได้')
    setPeople(old => [lastSwipe.person, ...(old || []).filter(p=>p.id!==lastSwipe.person.id)])
    setLastSwipe(null); notify('ย้อนกลับการปัดล่าสุดแล้ว')
  }
  const superLike = async (p) => {
    if (!p?.id || superBusy) return
    setSuperBusy(true)
    const { error } = await supabase.rpc('v60_super_like', { p_target: p.id })
    setSuperBusy(false)
    if (error) return notify(error.message.includes('limit') ? 'ใช้ Super Like ครบ 3 ครั้งของวันนี้แล้ว' : 'Super Like ไม่สำเร็จ: '+error.message)
    setLastSwipe(null)
    notify(`ส่ง Super Like ให้ ${p.display_name} แล้ว`)
    // Delay card removal until the Super Like burst has played.
    setTimeout(() => setPeople(old => (old || []).filter(x=>x.id!==p.id)), 950)
    const [a,b]=[user.id,p.id].sort()
    const {data}=await supabase.from('matches').select('id').eq('user_a',a).eq('user_b',b).maybeSingle()
    if(data){setTimeout(() => setNewMatch({id:data.id,p}), 1050); await loadMatches()}
    return true
  }
  const report = (p) => { if (!p?.id) return; setReportTarget(p); setReportReason('fake_profile'); setReportNotes('') }
  const submitReport = async () => {
    if (!reportTarget?.id || reportBusy) return
    setReportBusy(true)
    const labels = { fake_profile: 'โปรไฟล์ปลอมหรือแอบอ้าง', harassment: 'คุกคามหรือใช้คำพูดไม่เหมาะสม', inappropriate: 'เนื้อหาไม่เหมาะสม', scam: 'หลอกลวงหรือสแปม', other: 'อื่น ๆ' }
    const reason = [labels[reportReason] || labels.other, reportNotes.trim()].filter(Boolean).join(' — ').slice(0, 500)
    const { error } = await supabase.from('reports').insert({ reporter: user.id, reported: reportTarget.id, reason })
    setReportBusy(false)
    if (error) return notify('รายงานไม่สำเร็จ: ' + error.message)
    setReportTarget(null)
    notify('ส่งรายงานให้ทีมดูแลแล้ว')
  }
  const block = async (p) => {
    if (!p?.id || !confirm(`ต้องการบล็อก ${p.display_name || 'ผู้ใช้นี้'} ใช่ไหม?\nหลังบล็อกจะไม่เห็นโปรไฟล์นี้อีก`)) return
    const { error } = await supabase.from('blocks').insert({ blocker: user.id, blocked: p.id })
    if (error && error.code !== '23505') return notify('บล็อกไม่สำเร็จ: ' + error.message)
    setPeople(l => (l || []).filter(x => x.id !== p.id))
    setMatches(l => l.filter(x => x.p?.id !== p.id))
    setDetail(null)
    notify('บล็อกผู้ใช้นี้แล้ว')
    loadMatches()
  }
  useEffect(() => {
    if (!userId || !profile || !discoveryReady || !discovery) return
    const key = `nisit-intro-v1:${userId}`
    try { if (!localStorage.getItem(key)) { setGuideStep(0); setGuideOpen(true) } } catch {}
  }, [userId, profile, discoveryReady, discovery])
  const closeGuide = () => {
    setGuideOpen(false)
    try { if (userId) localStorage.setItem(`nisit-intro-v1:${userId}`, 'done') } catch {}
  }
  const openDetail = async (person) => {
    setDetail(person)
    if (!person?.id) return
    // Matches may not be in the swipe deck: fetch verification for the opened profile too.
    // Only the verified user ID is returned; university email stays private.
    supabase.rpc('verified_student_profile_ids', { candidate_ids: [person.id] })
      .then(({ data, error }) => {
        if (!error) setVerifiedCampusIds(prev => {
          const next = new Set(prev)
          if ((data || []).some(row => row.user_id === person.id)) next.add(person.id)
          else next.delete(person.id)
          return [...next]
        })
      })
      .catch(err => console.warn('Could not check student verification', err))
    const { data, error } = await supabase.from('profiles')
      .select('avatar_path, photo_paths, university_id, faculty, major, bio, interests, itunes_track_id, itunes_track_name, itunes_track_artist, itunes_track_image, itunes_track_preview, itunes_track_url')
      .eq('id', person.id).maybeSingle()
    if (!error && data) setDetail(current => current?.id === person.id ? { ...current, ...data } : current)
  }
  const detailIsMatch = !!(detail?.id && matches.some(m => m.p?.id === detail.id))
  const go = (v) => { if (v === 'search') v = 'home'; setView(v); setNav(false); if (v === 'messages') loadMatches() }
  const shown = (people || []).filter((p) => campusFiltered(p) && (!fl.q || (p.display_name || '').toLowerCase().includes(fl.q.toLowerCase())))
  const filteredPeople = (people || []).filter(campusFiltered)
  const nearbyFallback = discovery?.mode === 'nearby' && (people || []).length > 0 && filteredPeople.length === 0
  const swipePeople = nearbyFallback ? (people || []) : filteredPeople
  const Toast = toast && <div className="toast"><Heart size={16} fill="currentColor" />{toast}</div>

  if (session === undefined || (user && profile === undefined)) return <div className="page-center"><span className="spin" /></div>
  if (!user) return <><Landing onLogin={() => setModal('login')} onRegister={() => setModal('register')} />{modal && <AuthModal mode={modal} setMode={setModal} close={() => setModal('')} notify={notify} />}{Toast}</>
  if (!profile) return <main className="page-content onboard"><ProfilePage user={user} onboarding onSaved={loadProfile} notify={notify} /><button className="btn btn-ghost btn-small" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> ออกจากระบบ</button>{Toast}</main>

  if (discoveryReady && discoveryEditing) return <PreferencesEditor initial={discovery} profile={profile} onSave={saveDiscovery} onClose={() => setDiscoveryEditing(false)} />
  if (discoveryReady && !discovery) return <DiscoverySetup initial={discovery} profile={profile} onSave={saveDiscovery} onClose={() => setDiscoveryEditing(false)} />

  const items = [['home', 'หน้าหลัก', Heart], ['messages', 'ข้อความ', MessageCircle], ['notifs', 'การแจ้งเตือน', Bell], ['profile', 'โปรไฟล์ของฉัน', UserRound], ['settings', 'การตั้งค่า', Settings]]
  const empty = <div className="empty-state"><div className="empty-icon"><Search /></div><h3>ยังไม่มีสมาชิกให้แสดง</h3><p>ตอนนี้ยังไม่มีสมาชิกคนอื่นที่ตรงกับตัวกรอง ลองปรับตัวกรอง หรือชวนเพื่อนมาสมัคร</p></div>
  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (nav ? 'show' : '')}><Brand onClick={() => go('home')} /><div className="side-label">เมนูหลัก</div>
        {items.map(([id, label, I]) => <button key={id} className={'nav-item ' + (view === id ? 'active' : '') + (id === 'messages' && unreadMessages > 0 ? ' has-unread-messages' : '')} onClick={() => go(id)}><I size={18} />{label}{id === 'messages' && unreadMessages > 0 && <span className="nav-count">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}{id === 'notifs' && unread > 0 && <span className="nav-count">{unread}</span>}</button>)}
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><Av u={profile} /><div className="user-mini"><b>{profile.display_name}</b><span>{uniName(profile.university_id)}</span></div><button className="icon-btn" onClick={() => supabase.auth.signOut()} title="ออกจากระบบ"><LogOut size={17} /></button></div></aside>
      <nav className="bottom-nav" aria-label="เมนูหลักบนมือถือ">
        {[["home","ปัด",Heart],["profile","โปรไฟล์",UserRound],["messages","ข้อความ",MessageCircle],["notifs","แจ้งเตือน",Bell],["settings","ตั้งค่า",Settings]].map(([id,label,Icon]) => <button type="button" key={id} onClick={() => go(id)} className={(view === id ? "bottom-nav-item active" : "bottom-nav-item") + (id === "messages" && unreadMessages > 0 ? " has-unread-messages" : "")} aria-current={view === id ? "page" : undefined}><span className="bottom-icon"><Icon size={21} strokeWidth={view === id ? 2.5 : 1.8}/>{id === "notifs" && unread > 0 && <i className="bottom-dot"/>}{id === "messages" && unreadMessages > 0 && <span className="message-unread-count">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</span><span>{label}</span></button>)}
      </nav>
      <main className="main-area">
        <div className="page-content">
          {view === 'home' && <>
            <Heading kicker="DISCOVER" title="พบคนที่ใช่ในแบบของคุณ" sub="ทำความรู้จักคนใหม่ ๆ จากมหาวิทยาลัยที่คุณสนใจ"><button className="btn btn-ghost" onClick={() => setDiscoveryEditing(true)}><SlidersHorizontal size={17}/> แก้ไขสเปก</button></Heading>
            <div className="result-meta"><span>โปรไฟล์ที่ตรงกับสเปกของคุณ</span><span>{swipePeople.length} โปรไฟล์</span></div>
            {nearbyFallback && <p className="nearby-fallback-note">ยังไม่พบคนในรัศมีที่ตั้งไว้ จึงแสดงโปรไฟล์อื่นให้ปัดได้ก่อน · ปรับระยะทางได้ในตั้งค่าสเปก</p>}
            {people === null ? <div className="page-center"><span className="spin" /></div> : swipePeople.length ? <SwipeDeck people={swipePeople} onLike={(x) => swipe(x, true)} onSkip={(x) => swipe(x, false)} onSuperLike={superLike} onUndo={undoSwipe} canUndo={!!lastSwipe && !superBusy} onOpen={openDetail} onReport={report} verifiedIds={verifiedCampusIds} /> : empty}
            <div className="section-heading matches-heading"><div><h2>พื้นที่ของความสัมพันธ์</h2><p>เมื่อคุณ Match กับใคร แชตของคุณจะปรากฏตรงนี้</p></div></div>
            <div className="empty-state compact"><div className="empty-icon"><MessageCircle /></div><div><b>{matches.length ? `คุณมี ${matches.length} Match แล้ว` : 'ทุกความสัมพันธ์เริ่มจากการทักทาย'}</b><p>{matches.length ? 'เข้าไปเริ่มบทสนทนากับคนที่ Match กันได้เลย' : 'กดถูกใจโปรไฟล์ที่คุณสนใจ แล้วรอให้ถูกใจกันทั้งสองฝ่าย'}</p></div><button className="btn btn-ghost" onClick={() => go(matches.length ? 'messages' : 'home')}>{matches.length ? 'เปิดข้อความ' : 'ปัดต่อ'} <ArrowRight size={15} /></button></div>
          </>}
          {view === 'messages' && <Messages me={user.id} matches={matches} notify={notify} reload={loadMatches} onOpenProfile={openDetail} onMessagesRead={loadUnreadMessages} />}
          {view === 'notifs' && <Notifs me={user.id} refresh={loadUnread} go={go} />}
          {view === 'profile' && <ProfilePage user={user} profile={profile} onSaved={loadProfile} notify={notify} />}
          {view === 'settings' && <SettingsPage user={user} notify={notify} />}
          <footer className="app-footer"><span>© 2026 nisit match</span><span>สร้างด้วยความใส่ใจ <Heart size={12} fill="currentColor" /></span><button onClick={() => { setGuideStep(0); setGuideOpen(true) }}>คู่มือและวิธีเพิ่มแอปลงหน้าจอโฮม</button></footer>
        </div>
      </main>
      {visibleDetail && <div className={"modal-backdrop detail-backdrop" + (detailLeaving ? " is-closing" : "")} onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}><div className="detail-modal" role="dialog" aria-modal="true" aria-label="โปรไฟล์สมาชิก"><button type="button" className="modal-close detail-close-btn" onClick={() => setDetail(null)} aria-label="ปิดโปรไฟล์" title="ปิดโปรไฟล์"><X size={21} strokeWidth={2.6} /></button>
        <ProfileGallery person={visibleDetail} />
        <div className="detail-body"><div className="section-kicker">GET TO KNOW THEM</div><h2>{visibleDetail.display_name}, {visibleDetail.age}</h2>
          <p><GraduationCap size={15} />{uniName(visibleDetail.university_id)} · {visibleDetail.faculty}</p>{verifiedCampusIds.includes(visibleDetail.id) && <CampusVerifiedBadge />}{visibleDetail.relationship_intent && <span className="nm-intent-tag">{intentLabel(visibleDetail.relationship_intent)}</span>}<p>{visibleDetail.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
          <div className="tags">{(visibleDetail.interests || []).map((i) => <span className="tag" key={i}>{i}</span>)}</div>
          <div className="match-profile-song"><ITunesSongCard track={itunesTrack(visibleDetail)} compact /></div>
          {detailIsMatch ? <button className="btn btn-pink btn-full" onClick={() => { setDetail(null); go("messages") }}><MessageCircle size={17} /> กลับไปคุยกัน</button> : <button className="btn btn-pink btn-full" onClick={() => swipe(visibleDetail, true)}><Heart size={17} fill="currentColor" /> ส่งหัวใจให้คนนี้</button>}
          <button type="button" className="detail-bottom-close" onClick={() => setDetail(null)}>← กลับไปหน้าปัด</button>
          <div className="detail-secondary"><button onClick={() => report(visibleDetail)}><Flag size={15} /> รายงานโปรไฟล์</button><button onClick={() => block(visibleDetail)}><Ban size={15} /> บล็อก</button></div></div></div></div>}
      {reportTarget && <div className="modal-backdrop nm-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !reportBusy) setReportTarget(null) }}><div className="nm-dialog" role="dialog" aria-modal="true" aria-labelledby="nm-report-title"><button className="nm-dialog-close" type="button" onClick={() => setReportTarget(null)} disabled={reportBusy} aria-label="ปิด"><X size={20}/></button><div className="nm-dialog-eyebrow"><ShieldCheck size={16}/> SAFETY CENTER</div><h2 id="nm-report-title">รายงานผู้ใช้</h2><p>รายงานโปรไฟล์ของ {reportTarget.display_name || 'ผู้ใช้นี้'} ทีมดูแลจะตรวจสอบข้อมูลโดยไม่เปิดเผยตัวตนผู้รายงานแก่ผู้ถูกรายงาน</p><label className="nm-field-label" htmlFor="nm-report-reason">เหตุผลที่รายงาน</label><select id="nm-report-reason" className="nm-report-select" value={reportReason} onChange={e => setReportReason(e.target.value)}><option value="fake_profile">โปรไฟล์ปลอมหรือแอบอ้าง</option><option value="harassment">คุกคามหรือใช้คำพูดไม่เหมาะสม</option><option value="inappropriate">เนื้อหาไม่เหมาะสม</option><option value="scam">หลอกลวงหรือสแปม</option><option value="other">อื่น ๆ</option></select><label className="nm-field-label" htmlFor="nm-report-notes">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label><textarea id="nm-report-notes" className="nm-report-notes" maxLength={350} value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="เล่าเหตุการณ์สั้น ๆ เพื่อช่วยให้ตรวจสอบได้เร็วขึ้น"/><div className="nm-dialog-actions"><button type="button" className="btn btn-ghost" onClick={() => setReportTarget(null)} disabled={reportBusy}>ยกเลิก</button><button type="button" className="btn btn-pink" onClick={submitReport} disabled={reportBusy}>{reportBusy ? 'กำลังส่ง...' : 'ส่งรายงาน'}</button></div></div></div>}
      {guideOpen && <div className="modal-backdrop nm-dialog-backdrop" role="presentation"><div className="nm-dialog nm-guide" role="dialog" aria-modal="true" aria-labelledby="nm-guide-title"><button className="nm-dialog-close" type="button" onClick={closeGuide} aria-label="ปิดคู่มือ"><X size={20}/></button><div className="nm-dialog-eyebrow"><Sparkles size={16}/> WELCOME TO NISIT MATCH</div><div className="nm-guide-counter">{guideStep + 1} / 5</div><div className="nm-guide-illustration">{guideStep === 0 ? <Heart size={46}/> : guideStep === 1 ? <MessageCircle size={46}/> : guideStep === 2 ? <GraduationCap size={46}/> : guideStep === 3 ? <ShieldCheck size={46}/> : <GraduationCap size={46}/>}</div><h2 id="nm-guide-title">{['เริ่มค้นหาคนที่ใช่','แมตช์แล้วเริ่มคุยกัน','ยืนยันสถานะนักศึกษา','พื้นที่ปลอดภัยสำหรับทุกคน','เพิ่ม NISIT MATCH ลงหน้าจอโฮม'][guideStep]}</h2><p>{['ปัดขวาเมื่อถูกใจ ปัดซ้ายเพื่อข้าม หรือแตะโปรไฟล์เพื่อทำความรู้จักเพิ่มเติม','เมื่อคุณและอีกฝ่ายกดถูกใจตรงกัน จะเกิด Match และสามารถเริ่มแชตได้','ยืนยันอีเมลมหาวิทยาลัยเพื่อแสดงเครื่องหมายยืนยันบนโปรไฟล์ โดยไม่เปิดเผยอีเมลของคุณ','หากพบโปรไฟล์ปลอม การคุกคาม หรือข้อความไม่เหมาะสม สามารถรายงานหรือบล็อกผู้ใช้ได้','iPhone: เปิดเว็บใน Safari > แชร์ > เพิ่มไปยังหน้าจอโฮม > เพิ่ม  |  Android: เปิดใน Chrome > เมนู ⋮ > ติดตั้งแอป หรือ เพิ่มลงในหน้าจอหลัก'][guideStep]}</p><div className="nm-guide-dots">{[0,1,2,3,4].map(i => <span key={i} className={i === guideStep ? 'active' : ''}/>)}</div><div className="nm-dialog-actions"><button type="button" className="btn btn-ghost" onClick={guideStep === 0 ? closeGuide : () => setGuideStep(x => x - 1)}>{guideStep === 0 ? 'ข้าม' : 'ย้อนกลับ'}</button><button type="button" className="btn btn-pink" onClick={guideStep === 4 ? closeGuide : () => setGuideStep(x => x + 1)}>{guideStep === 3 ? 'เริ่มใช้งาน' : 'ถัดไป'} <ArrowRight size={16}/></button></div></div></div>}
      {newMatch && <div className="match-overlay v26-match-overlay" role="dialog" aria-modal="true" aria-label="คุณแมตช์กันแล้ว" onMouseDown={e => {if(e.target === e.currentTarget) setNewMatch(null)}}><div className="v26-match-dialog v56-match-dialog v67-match-dialog"><div className="v64-match-glow" aria-hidden="true"/><div className="v67-match-shockwave" aria-hidden="true"/><div className="v67-match-shockwave second" aria-hidden="true"/><div className="v67-match-confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{"--i":i,"--angle":`${i*360/24}deg`}}/>)}</div><div className="v67-match-crown" aria-hidden="true"><Heart size={70} fill="currentColor"/></div><div className="v56-match-sparkles" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{"--i":i}} />)}</div><button className="match-close" onClick={() => setNewMatch(null)} aria-label="ปิด"><X size={21}/></button><div className="v26-match-kicker">A NEW CONNECTION</div><div className="v26-match-pictures v64-match-pictures"><div className="v26-match-picture yours"><Av u={profile}/></div><span className="v26-match-heart"><Heart size={24} fill="currentColor"/></span><div className="v26-match-picture theirs"><Av u={newMatch.p}/></div></div><h1>It's a Match<span>!</span></h1><p>คุณกับ {newMatch.p.display_name} ถูกใจกันและกัน<br/>นี่อาจเป็นจุดเริ่มต้นของเรื่องราวดี ๆ</p><button className="v26-match-primary" onClick={() => {try { sessionStorage.setItem('nisit-active-chat:' + user.id, newMatch.id) } catch {} setNewMatch(null);go('messages')}}>เริ่มพูดคุย <ArrowRight size={18}/></button><button className="v26-match-secondary" onClick={() => setNewMatch(null)}>ปัดต่อ</button></div></div>}
      {Toast}
    </div>
  )
}


