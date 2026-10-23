import NotificationCenter from './components/NotificationCenter'
import Announcements from './components/Announcements'
import AdminPremiumDirectory from './components/AdminPremiumDirectory'
import AdminAlerts from './components/AdminAlerts'
import './dailyRewards.css'
import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Heart, Search, MessageCircle, UserRound, Settings, LogOut, X, ShieldCheck, GraduationCap, Sparkles, SlidersHorizontal, Send, ImagePlus, Mic, Square, Play, Pause, Trash2, Camera, Flag, Ban, Menu, ArrowRight, ArrowLeft, Check, Bell, Users, LockKeyhole, Music2, ExternalLink, MapPin, Globe2, Compass, Cake, LocateFixed, Palette, Eye, Reply, SmilePlus, CheckCheck, Star, Undo2, Crop, Video, Crown, Gift, MailCheck, CalendarDays, Clock, MapPinned, Ticket, Eye as EyeIcon, HeartHandshake, MoreHorizontal, ChevronDown, Volume2, VolumeX } from 'lucide-react'
import { supabase } from './supabase'

// Cache public premium badges briefly and deduplicate concurrent requests.
// The swipe deck changes frequently, so querying every visible profile on every
// deck update can create thousands of redundant RPC calls per day.
const PREMIUM_STATUS_TTL_MS = 10 * 60 * 1000
const premiumStatusCache = new Map()
const premiumStatusRequests = new Map()
const PREMIUM_MAX_CONCURRENT = 3
let premiumActiveRequests = 0
const premiumRequestQueue = []
const withPremiumRequestSlot = async task => {
  if (premiumActiveRequests >= PREMIUM_MAX_CONCURRENT) await new Promise(resolve => premiumRequestQueue.push(resolve))
  premiumActiveRequests++
  try { return await task() } finally {
    premiumActiveRequests--
    premiumRequestQueue.shift()?.()
  }
}
const getPublicPremiumStatus = async (profileId) => {
  const cached = premiumStatusCache.get(profileId)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  const pending = premiumStatusRequests.get(profileId)
  if (pending) return pending
  const request = (async () => {
    try {
      const { data, error } = await withPremiumRequestSlot(() => supabase.rpc('is_profile_premium', { p_profile_id: profileId }))
      if (error) return null
      const value = data === true
      premiumStatusCache.set(profileId, { value, expiresAt: Date.now() + PREMIUM_STATUS_TTL_MS })
      return value
    } catch {
      return null
    } finally {
      premiumStatusRequests.delete(profileId)
    }
  })()
  premiumStatusRequests.set(profileId, request)
  return request
}
import EmailCenter from './components/EmailCenter'
import { authRedirectUrl, isAuthCallbackPath, clearAuthCallbackUrl } from './authRedirect'
import './authLink.css'
import { UNIVERSITIES, FACULTIES } from './data/universities'
import { campusDistance, hasCampusCoordinates } from './data/campusCoordinates'

// Safari on LAN HTTP does not expose crypto.randomUUID (secure-context API).
const makeClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// Shrink profile photos before upload so mobile swiping downloads fewer bytes.
// GIFs and unsupported/animated formats are preserved to avoid changing their behavior.
const optimizeProfilePhoto = async (file) => {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 350 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) { bitmap.close?.(); return file }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], (file.name.split('.').slice(0, -1).join('.') || 'profile-photo') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

// Store a smaller swipe variant alongside new profile photos; originals stay intact.
const createSwipeThumbnail = async file => {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return null
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return null }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .78))
    return blob && blob.size < file.size ? blob : null
  } catch { return null }
}
const swipeThumbPath = p => typeof p === 'string' && /^([^/]+)\/(photo-optimized-[^.]+)\.(jpe?g|png|webp)$/i.test(p) ? p.replace(/\.(jpe?g|png|webp)$/i, '-swipe.jpg') : null
const swipePhotoUrl = p => {
  const thumb = swipeThumbPath(p)
  return thumb ? supabase.storage.from('avatars').getPublicUrl(thumb).data.publicUrl : pub(p)
}

const urlBase64ToUint8Array = (base64) => { const b = (base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(b), c => c.charCodeAt(0)) }
const INTERESTS = ['ดนตรี','เกม','คาเฟ่','ท่องเที่ยว','ถ่ายรูป','หนังและซีรีส์','กีฬา','อ่านหนังสือ','อาหาร','ศิลปะ','สัตว์เลี้ยง','เทคโนโลยี']
const GENDERS = { male: 'ชาย', female: 'หญิง', other: 'อื่น ๆ' }
const uniName = (id) => UNIVERSITIES.find((u) => u.id === id)?.name || id
const UNIVERSITY_CAMPUSES = {
  ku: [{id:'bangkhen',name:'บางเขน'},{id:'kamphaengsaen',name:'กำแพงแสน'},{id:'sriracha',name:'ศรีราชา'},{id:'chalermphrakiat',name:'เฉลิมพระเกียรติ จังหวัดสกลนคร'}],
  tu: [{id:'tha_prachan',name:'ท่าพระจันทร์'},{id:'rangsit',name:'รังสิต'},{id:'lampang',name:'ลำปาง'},{id:'pattaya',name:'พัทยา'}],
  swu: [{id:'prasarnmit',name:'ประสานมิตร'},{id:'ongkharak',name:'องครักษ์'}],
  buu: [{id:'bangsaen',name:'บางแสน'},{id:'chanthaburi',name:'จันทบุรี'},{id:'sakaeo',name:'สระแก้ว'}]
}
const campusName = p => UNIVERSITY_CAMPUSES[p?.university_id]?.find(c => c.id === p?.campus)?.name || ''
const universityWithCampus = (p) => `${uniName(p.university_id)}${campusName(p) ? ` · ${campusName(p)}` : ''}`
// คำเรียกผู้เรียนอิงตามธรรมเนียมของมหาวิทยาลัย ไม่ใช้คำว่า ‘นิสิต’ กับทุกสถาบัน
const NISIT_CAMPUS_IDS = new Set(['chula', 'ku', 'swu', 'buu', 'nu', 'mahasarakham'])
const studentTerm = (universityId) => NISIT_CAMPUS_IDS.has(universityId) ? 'นิสิต' : 'นักศึกษา'
const ageOf = (d) => { if (!d) return ''; const b = new Date(d), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a }
const mediaPub = (p) => { if (!p || typeof p !== 'string') return null; if (/^(https?:|data:|blob:)/i.test(p)) return p; return supabase.storage.from('profile-media').getPublicUrl(p.replace(/^\/+/, '').replace(/^profile-media\//, '')).data.publicUrl }
const pub = (p) => {
  if (!p || typeof p !== 'string') return null
  const path = p.trim()
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const normalized = path.replace(/^\/+/, '').replace(/^avatars\//, '')
  return supabase.storage.from('avatars').getPublicUrl(normalized).data.publicUrl
}
const ph = (n) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f45ca5"/><stop offset="1" stop-color="#8e72ff"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="66" font-size="48" text-anchor="middle" fill="#fff" font-family="sans-serif">${((n || '?').trim()[0]) || '?'}</text></svg>`)
const photoCandidates = (u) => [...new Set([u?.avatar_path, ...(Array.isArray(u?.photo_paths) ? u.photo_paths : [])].filter(Boolean).map(pub).filter(Boolean))]
// Preload only the next swipe card, avoiding downloads for the whole deck.
const preloadImage = (src) => { if (!src || typeof Image === 'undefined') return; const image = new Image(); image.decoding = 'async'; image.src = src }
const Av = ({ u, cls = 'avatar', loading = 'lazy', fetchPriority = 'auto' }) => {
  const candidates = photoCandidates(u)
  const [attempt, setAttempt] = useState(0)
  const signature = candidates.join('|')
  useEffect(() => setAttempt(0), [signature])
  return <img className={cls} src={candidates[attempt] || ph(u?.display_name)} alt={u?.display_name || 'โปรไฟล์'} loading={loading} fetchPriority={fetchPriority} decoding="async" onError={() => setAttempt(n => n < candidates.length ? n + 1 : n)} />
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

const Brand = ({ onClick }) => <button className="brand" onClick={onClick} aria-label="NISIT MATCH หน้าหลัก"><span className="brand-icon"><img src="/nisit-match-mark.png" alt="" /></span><span>nisit <b>match</b></span></button>

function Landing({ onLogin, onRegister }) {
  return <div className="landing landing-editorial">
    <nav className="landing-nav"><Brand /><div className="landing-links"><a href="#how">วิธีใช้งาน</a><a href="#safety">ความปลอดภัย</a><button onClick={onLogin}>เข้าสู่ระบบ</button><button className="btn btn-pink" onClick={onRegister}>สมัครสมาชิก <ArrowRight size={16}/></button></div></nav>
    <main className="editorial-hero">
      <div className="editorial-topline"><span className="nm-lobby-live"><span className="nm-lobby-live-dot"/> THE UNIVERSITY CONNECTION</span><span>NISIT MATCH · FIND YOUR SPARK</span></div>
      <div className="nm-lobby-sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
      <div className="nm-lobby-glow" aria-hidden="true"/>
      <div className="nm-lobby-floating-card nm-lobby-card-one" aria-hidden="true"><span className="nm-lobby-card-heart">♥</span><span>someone likes your vibe</span><b>IT'S A MATCH ✦</b></div>
      <div className="nm-lobby-floating-card nm-lobby-card-two" aria-hidden="true"><span>✳</span><b>same campus, new story</b></div>
      <div className="editorial-title-wrap"><span className="editorial-orbit" aria-hidden="true"/><h1>บางความสัมพันธ์<br/>เริ่มจาก<em>การปัดครั้งเดียว.</em></h1><p className="editorial-side-note">A LITTLE SPARK<br/>A NEW STORY <ArrowRight size={17}/></p></div>
      <div className="editorial-bottom"><div><span className="editorial-kicker">YOUR CAMPUS. YOUR PEOPLE. YOUR STORY.</span><p>คนที่ใช่อาจอยู่ใกล้กว่าที่คิด ✨<br/>ค้นพบเพื่อนใหม่ คนคุยใหม่ และโมเมนต์ที่เป็นของคุณ</p><div className="nm-lobby-perks"><span>✦ สำหรับนักศึกษา</span><span>♡ แมตช์แล้วคุยเลย</span><span>✧ เริ่มต้นฟรี</span></div></div><div className="editorial-actions"><button className="editorial-primary" onClick={onRegister}>สร้างโปรไฟล์ฟรี <ArrowRight size={21}/></button><button className="editorial-secondary" onClick={onLogin}>มีบัญชีแล้ว? เข้าสู่ระบบ</button><button type="button" className="editorial-google-login" onClick={async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } }); if (error) { window.alert('Google Login ไม่สำเร็จ: ' + error.message) } }}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 6.51 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.81 7.18l7.73 6C44.37 38.03 46.98 31.89 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6C30.03 37.64 27.28 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>เข้าสู่ระบบด้วย Google</button></div></div>
      <div className="editorial-marquee" aria-hidden="true"><span>GOOD CONNECTIONS START SOMEWHERE</span><span className="editorial-dot"/><span>GOOD CONNECTIONS START SOMEWHERE</span></div>
    </main>
    <section className="editorial-process" id="how"><div className="editorial-section-head"><span>THE PROCESS / 02</span><h2>ง่าย ๆ แค่เป็นตัวเอง</h2></div><div className="editorial-process-grid">{[["01","สร้างโปรไฟล์","เล่าเรื่องของคุณในแบบที่คุณชอบ"],["02","ปัดเพื่อค้นพบ","เจอคนที่เรียนใกล้กันและมีอะไรตรงกัน"],["03","เริ่มบทสนทนา","เมื่อชอบตรงกัน ก็เริ่มทำความรู้จักกัน"]].map(([n,t,d])=><div className="editorial-process-item" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p><ArrowRight size={19}/></div>)}</div></section>
    <section className="editorial-safety" id="safety"><div><span>YOUR SPACE / 03</span><h2>เป็นตัวเองได้<br/><em>อย่างสบายใจ.</em></h2></div><div><p>คุณเลือกได้ว่าจะรู้จักใคร และจะคุยกับใคร ข้อมูลส่วนตัวที่สำคัญไม่ถูกแสดงบนโปรไฟล์สาธารณะ</p><div className="editorial-safety-list"><span><ShieldCheck size={18}/> บล็อกและรายงานผู้ใช้ได้</span><span><LockKeyhole size={18}/> คุยได้เมื่อ Match กันเท่านั้น</span></div><button onClick={onRegister}>เริ่มต้นเรื่องราวของคุณ <ArrowRight size={17}/></button></div></section>
    <footer className="editorial-footer"><Brand/><span>© 2026 NISIT MATCH</span><button onClick={onLogin}>เข้าสู่ระบบ <ArrowRight size={14}/></button></footer>
  </div>
}

function AuthLinkScreen({ onFinished }) {
  const [status, setStatus] = useState('กำลังตรวจสอบลิงก์ที่ได้รับ…')
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)
  useEffect(() => {
    let alive = true
    const params = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const flow = params.get('flow') || params.get('type') || hash.get('type')
    const tokenHash = params.get('token_hash')
    const linkError = params.get('error_description') || hash.get('error_description')
    const showRecovery = () => { if (!alive) return; setReady(true); setCompleted(false); setStatus('สร้างรหัสผ่านใหม่เพื่อกลับมาใช้งานบัญชีของคุณ') }
    const run = async () => {
      if (linkError) { setStatus(linkError); return }
      try {
        // Token-hash email links are explicitly verified here, without relying on
        // Supabase's automatic URL processing or the timing of auth state events.
        if (tokenHash) {
          const otpType = flow === 'recovery' ? 'recovery' : flow === 'signup' ? 'email' : null
          if (!otpType) throw new Error('ประเภทลิงก์ไม่ถูกต้อง กรุณาขอลิงก์ใหม่')
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
          if (error) throw error
          if (!alive) return
          window.history.replaceState({}, '', window.location.pathname + '?flow=' + flow)
          if (flow === 'recovery') showRecovery()
          else { setCompleted(true); setStatus('ยืนยันอีเมลสำเร็จแล้ว เข้าสู่ระบบเพื่อเริ่มใช้งานได้เลย') }
          return
        }
        // Legacy links can contain a code, access_token, or recovery event.
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!alive) return
        if (!data.session) throw new Error('ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่')
        if (flow === 'recovery' || hash.get('type') === 'recovery') showRecovery()
        else { setCompleted(true); setStatus('ยืนยันอีเมลสำเร็จแล้ว เข้าสู่ระบบเพื่อเริ่มใช้งานได้เลย') }
      } catch (err) { if (alive) setStatus(err.message || 'ตรวจสอบลิงก์ไม่สำเร็จ') }
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') showRecovery()
    })
    run()
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])
  const save = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setStatus('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return }
    if (password !== confirm) { setStatus('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) { setStatus(error.message); return }
    setReady(false); setCompleted(true); setStatus('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว')
  }
  return <main className="nm-auth-link-page"><div className="nm-auth-link-card">
    <div className="nm-auth-link-brand">♥ <span>NISIT <b>MATCH</b></span></div>
    <div className="nm-auth-link-icon"><LockKeyhole size={30}/></div>
    <div className="nm-auth-link-eyebrow">SECURE YOUR ACCOUNT</div>
    <h1>{ready ? 'ตั้งรหัสผ่านใหม่' : completed ? 'เรียบร้อยแล้ว!' : 'ตรวจสอบลิงก์อีเมล'}</h1>
    <p role="status">{status}</p>
    {ready && <form onSubmit={save} className="nm-auth-link-form">
      <label>รหัสผ่านใหม่<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
      <label>ยืนยันรหัสผ่าน<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="พิมพ์รหัสผ่านอีกครั้ง" /></label>
      <button type="submit" className="btn btn-pink btn-full" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}</button>
    </form>}
    <button className="nm-auth-link-back" type="button" onClick={onFinished}>กลับไป NISIT MATCH <ArrowRight size={16}/></button>
  </div></main>
}

function AuthModal({ mode, setMode, close, notify }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [awaitingVerification, setAwaitingVerification] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendFeedback, setResendFeedback] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verificationEmail, setVerificationEmail] = useState('')
  const submitInFlight = useRef(false)
  const resendInFlight = useRef(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [existingAccount, setExistingAccount] = useState(false)
  useEffect(() => { setExistingAccount(false); setRegistrationComplete(false) }, [mode])
  const cooldownKey = address => 'nisit-auth-resend-until:' + address
  const startResendCooldown = (address) => {
    const until = Date.now() + 60000
    try { localStorage.setItem(cooldownKey(address), String(until)) } catch {}
    setResendCooldown(60)
  }
  useEffect(() => {
    const address = (verificationEmail || email).trim().toLowerCase()
    if (!address) { setResendCooldown(0); return }
    const refresh = () => {
      let until = 0
      try { until = Number(localStorage.getItem(cooldownKey(address))) || 0 } catch {}
      setResendCooldown(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    }
    refresh()
    const timer = window.setInterval(refresh, 1000)
    return () => window.clearInterval(timer)
  }, [verificationEmail, email])
  const errorText = (error) => {
    const message = error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    if (/rate limit|too many requests|429/i.test(message)) return 'ส่งอีเมลเกินกำหนดชั่วคราว กรุณารอสักพักก่อนลองใหม่'
    if (/email not confirmed/i.test(message)) return 'บัญชียังไม่ได้ยืนยันอีเมล กรุณากดส่งอีเมลยืนยันอีกครั้ง'
    return message
  }
  const [googleBusy, setGoogleBusy] = useState(false)
  const signInWithGoogle = async () => {
    if (googleBusy || busy) return
    setGoogleBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      })
      if (error) throw error
    } catch (error) {
      notify(errorText(error))
      setGoogleBusy(false)
    }
  }
  const resendVerification = async () => {
    const address = (verificationEmail || email).trim().toLowerCase()
    if (!address || resendInFlight.current || resendBusy || resendCooldown > 0) return
    resendInFlight.current = true
    startResendCooldown(address)
    setResendFeedback('')
    setResendBusy(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: address,
        options: { emailRedirectTo: `${authRedirectUrl()}?flow=signup` },
      })
      if (error) throw error
      setResendFeedback('ส่งคำขอสำเร็จแล้ว โปรดตรวจ Inbox, Spam และ Junk หากผู้ให้บริการส่งล่าช้า ลิงก์อาจมาถึงภายหลัง')
      notify('รับคำขอส่งอีเมลยืนยันอีกครั้งแล้ว กรุณาตรวจกล่องจดหมายและจดหมายขยะ')
    } catch (error) {
      setResendFeedback(errorText(error))
      notify(errorText(error))
    } finally { resendInFlight.current = false; setResendBusy(false) }
  }
  const submit = async (e) => {
    e.preventDefault()
    if (submitInFlight.current || busy || (mode === 'register' && registrationComplete)) return
    if (mode === 'register' && pw !== confirmPw) { notify('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return }
    submitInFlight.current = true
    setBusy(true)
    try {
      const address = email.trim().toLowerCase()
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password: pw })
        if (error) {
          if (/email not confirmed/i.test(error.message || '')) {
            setVerificationEmail(address)
            setAwaitingVerification(true)
          }
          notify(errorText(error))
        }
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: address, password: pw,
          options: { emailRedirectTo: `${authRedirectUrl()}?flow=signup` },
        })
        if (error) {
          if (/already registered|already exists|user already registered|email exists/i.test(error.message || '')) {
            setExistingAccount(true)
            setAwaitingVerification(false)
            return
          }
          throw error
        }
        // Supabase returns an obfuscated user with no identities when email
        // confirmation is enabled and a confirmed account already exists.
        // Do not claim a new signup or offer resend for that response.
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0 && !data.session) {
          setExistingAccount(true)
          setAwaitingVerification(false)
          return
        }
        setExistingAccount(false)
        setRegistrationComplete(true)
        if (!data?.session) {
          setVerificationEmail(address)
          setAwaitingVerification(true)
          startResendCooldown(address)
          notify('รับคำขอสมัครสมาชิกแล้ว หากยังไม่พบอีเมลยืนยัน กรุณาตรวจ Spam หรือกดส่งอีกครั้งหลังครบเวลารอ')
        } else {
          notify('สมัครสมาชิกสำเร็จแล้ว · คุณสามารถยืนยันอีเมลบัญชีภายหลังได้ที่โปรไฟล์')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(address, {
          redirectTo: `${authRedirectUrl()}?flow=recovery`,
        })
        if (error) throw error
        setSent(true)
      }
    } catch (error) {
      if (mode === 'register' && (error?.status === 429 || /rate limit|too many requests|429/i.test(error?.message || ''))) startResendCooldown(email.trim().toLowerCase())
      notify(errorText(error))
    }
    finally { submitInFlight.current = false; setBusy(false) }
  }
  const title = { login: 'ยินดีที่ได้เจอกันอีกครั้ง', register: 'เริ่มต้นเรื่องราวของคุณ', reset: 'ลืมรหัสผ่าน?' }[mode]
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="auth-modal">
      <button className="modal-close icon-btn" onClick={close}><X /></button>
      <div className="auth-brand"><span className="brand-icon"><img src="/nisit-match-mark.png" alt="" /></span><span>nisit <b>match</b></span></div>
      <div className={"auth-heading" + (mode === "reset" ? " nm-reset-heading" : "")}><span className="nm-auth-eyebrow">{mode === 'register' ? 'JOIN THE CONNECTION' : mode === 'login' ? 'WELCOME BACK' : 'ACCOUNT RECOVERY'}</span><h2>{title}</h2><p>{mode === 'reset' ? 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่' : mode === 'register' ? 'สร้างบัญชีใหม่ แล้วมาเจอคนที่ใช่ไปด้วยกัน ✨' : 'เข้าสู่ระบบเพื่อไปต่อจากที่ค้างไว้'}</p></div>
      {mode === 'reset' && sent ? <div className="nm-reset-sent" role="status"><div className="nm-reset-sent-halo" aria-hidden="true"/><div className="nm-reset-sent-icon"><Send size={27}/><span>✦</span></div><h3>ส่งคำขอเรียบร้อยแล้ว!</h3><p>หากอีเมลนี้มีบัญชีอยู่ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้คุณแล้ว</p><div className="nm-reset-address">{email}</div><p className="nm-reset-tip">ลองเช็กกล่องจดหมายและจดหมายขยะด้วยนะ 💗</p><button type="button" className="btn btn-pink btn-full" onClick={() => { setSent(false); setMode('login') }}>กลับไปเข้าสู่ระบบ <ArrowRight size={16}/></button><button type="button" className="nm-reset-retry" onClick={() => setSent(false)}>เปลี่ยนอีเมล / ขอส่งใหม่</button></div> : <form className="auth-form" onSubmit={submit}>
        <label>อีเมล<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (awaitingVerification && e.target.value.trim().toLowerCase() !== verificationEmail) setAwaitingVerification(false) }} /></label>
        {mode !== 'reset' && <label>รหัสผ่าน<div className="nm-auth-password-wrap"><input required type={showPassword ? 'text' : 'password'} minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="อย่างน้อย 8 ตัวอักษร" value={pw} onChange={(e) => setPw(e.target.value)} /><button type="button" className="nm-auth-password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? 'ซ่อน' : 'แสดง'}</button></div></label>}
        {mode === 'register' && <label>ยืนยันรหัสผ่านอีกครั้ง<input required type={showPassword ? 'text' : 'password'} minLength={8} autoComplete="new-password" placeholder="พิมพ์รหัสผ่านให้ตรงกัน" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />{confirmPw && <span className={'nm-auth-password-hint ' + (pw === confirmPw ? 'is-match' : 'is-mismatch')}>{pw === confirmPw ? '✓ รหัสผ่านตรงกัน' : 'รหัสผ่านยังไม่ตรงกัน'}</span>}</label>}
        {mode === 'register' && <p className="legal-note">การสมัครหมายถึงคุณยืนยันว่ามีอายุ 18 ปีขึ้นไป</p>}
        <button disabled={busy || (mode === 'register' && (registrationComplete || (confirmPw && pw !== confirmPw)))} className="btn btn-pink btn-full btn-lg">{busy ? (mode === 'reset' ? 'กำลังส่งลิงก์…' : 'กำลังดำเนินการ...') : mode === 'register' && registrationComplete ? 'สมัครแล้ว กรุณายืนยันอีเมล' : mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สร้างบัญชีของฉัน' : 'ส่งลิงก์รีเซ็ต'} <ArrowRight size={17} /></button>
      </form>}
      {mode !== 'reset' && <div className="nm-google-auth">
        <div className="nm-google-auth-divider"><span>หรือดำเนินการต่อด้วย</span></div>
        <button type="button" className="nm-google-auth-button" onClick={signInWithGoogle} disabled={googleBusy || busy}>
          <svg aria-hidden="true" width="21" height="21" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 6.51 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.81 7.18l7.73 6C44.37 38.03 46.98 31.89 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6C30.03 37.64 27.28 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {googleBusy ? 'กำลังเชื่อมต่อ Google…' : 'ดำเนินการต่อด้วย Google'}
        </button>
      </div>}
      {mode === 'register' && existingAccount && <section className="nm-existing-account" role="status" aria-live="polite"><div className="nm-existing-account-icon"><ShieldCheck size={23}/></div><div><h3>อีเมลนี้อาจมีบัญชีอยู่แล้ว</h3><p>หากเคยสมัคร NISIT MATCH ด้วยอีเมลนี้ กรุณาเข้าสู่ระบบ หรือขอตั้งรหัสผ่านใหม่</p></div><div className="nm-existing-account-actions"><button type="button" className="btn btn-pink" onClick={() => setMode('login')}>เข้าสู่ระบบ <ArrowRight size={16}/></button><button type="button" className="btn btn-ghost" onClick={() => setMode('reset')}>ลืมรหัสผ่าน</button></div></section>}
      {mode !== 'reset' && awaitingVerification && <section className="nm-verify-resend" aria-labelledby="nm-verify-resend-title">
        <div className="nm-verify-resend-icon" aria-hidden="true"><Send size={22}/></div><span className="nm-verify-kicker">NISIT MATCH · EMAIL VERIFICATION</span>
        <div className="nm-verify-resend-copy">
          <h3 id="nm-verify-resend-title">ยังไม่ได้รับอีเมลยืนยัน?</h3>
          <p>เราได้รับคำขอยืนยันบัญชีของคุณแล้ว</p>
          <div className="nm-verify-resend-email" title={verificationEmail}><span>ส่งถึง</span><strong>{verificationEmail}</strong></div>
          <p className="nm-verify-resend-tip">ลองเช็กกล่องจดหมาย รวมถึง Spam หรือ Junk ก่อนขอส่งอีกครั้งนะ</p>
        </div>
        <button type="button" className="btn btn-pink btn-full nm-verify-resend-button" onClick={resendVerification} disabled={resendBusy || resendCooldown > 0}>
          {resendBusy ? <><Send size={17}/> กำลังส่งอีเมล…</> : resendCooldown > 0 ? <><Clock size={17}/> ส่งอีกครั้งได้ใน {resendCooldown} วินาที</> : <><Send size={17}/> ส่งอีเมลยืนยันอีกครั้ง</>}
        </button>
        {resendFeedback && <p className="nm-verify-resend-feedback" role="status" aria-live="polite">{resendFeedback}</p>}
        <p className="nm-verify-resend-footnote">หากยังไม่ได้รับ อาจมีข้อจำกัดจากผู้ให้บริการอีเมล กรุณารอสักครู่แล้วลองใหม่</p>
      </section>}
      <div className="auth-switch">
        {mode === 'login' ? <>ยังไม่มีบัญชี?<button onClick={() => { setAwaitingVerification(false); setMode('register') }}>สมัครสมาชิก</button><button onClick={() => setMode('reset')}>ลืมรหัสผ่าน</button></> : <>มีบัญชีอยู่แล้ว?<button onClick={() => setMode('login')}>เข้าสู่ระบบ</button></>}
      </div>
      <div className="auth-security"><ShieldCheck size={15} /> ข้อมูลส่วนตัวของคุณจะไม่แสดงต่อสาธารณะ</div>
    </div></div>
  )
}

function CropPhotoDialog({ file, onDone, onCancel, notify }) {
  const [zoom, setZoom] = useState(1)
  const [url] = useState(() => URL.createObjectURL(file))
  const image = useRef(null)
  const drag = useRef(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [working, setWorking] = useState(false)
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  useViewportScrollLock(true)
  const previewSize = 320
  const baseScale = natural.w && natural.h ? previewSize / Math.min(natural.w, natural.h) : 1
  const renderW = natural.w ? natural.w * baseScale : '100%'
  const renderH = natural.h ? natural.h * baseScale : '100%'
  const clampPan = (next, z = zoom) => {
    const scale = baseScale * z
    const maxX = Math.max(0, (natural.w * scale - previewSize) / 2)
    const maxY = Math.max(0, (natural.h * scale - previewSize) / 2)
    setPan({ x: Math.max(-maxX, Math.min(maxX, next.x)), y: Math.max(-maxY, Math.min(maxY, next.y)) })
  }
  const finish = async () => {
    const img = image.current
    if (!img?.naturalWidth || working) return
    setWorking(true)
    try {
      const w = img.naturalWidth, h = img.naturalHeight
      const side = Math.min(w, h) / zoom
      const scale = previewSize / Math.min(w, h)
      const sx = Math.max(0, Math.min(w - side, (w - side) / 2 - pan.x / (scale * zoom)))
      const sy = Math.max(0, Math.min(h - side, (h - side) / 2 - pan.y / (scale * zoom)))
      const canvas = document.createElement('canvas')
      canvas.width = 900; canvas.height = 900
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, sx, sy, side, side, 0, 0, 900, 900)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .9))
      if (!blob) throw new Error('ไม่สามารถประมวลผลรูปภาพได้')
      onDone(new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    } catch(e) { notify(e.message); setWorking(false) }
  }
  const pointerDown = e => { drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const pointerMove = e => { if (!drag.current) return; clampPan({ x: drag.current.panX + e.clientX - drag.current.x, y: drag.current.panY + e.clientY - drag.current.y }) }
  return createPortal(<div className="v60-crop-backdrop" role="dialog" aria-modal="true" aria-label="ปรับรูปโปรไฟล์"><div className="v60-crop-dialog">
    <div className="v60-crop-head"><h3><Crop size={19}/> จัดตำแหน่งรูปก่อนอัปโหลด</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="ปิด"><X size={21}/></button></div>
    <div className="v60-crop-preview" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => {drag.current=null}} onPointerCancel={() => {drag.current=null}}>
      <img ref={image} src={url} alt="รูปที่กำลังครอป" draggable="false" onLoad={e => setNatural({w:e.currentTarget.naturalWidth,h:e.currentTarget.naturalHeight})} style={{width:renderW,height:renderH,maxWidth:'none',maxHeight:'none',objectFit:'cover',transform:`translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`,transformOrigin:'center',touchAction:'none',cursor:'grab'}} />
      <span className="v76-crop-guide">ลากรูปเพื่อจัดตำแหน่ง</span>
    </div>
    <label className="v60-crop-zoom">ซูมรูป <input type="range" min="1" max="3" step="0.02" value={zoom} onChange={e=>{const z=+e.target.value;setZoom(z);clampPan(pan,z)}}/></label>
    <p>ลากรูปเพื่อเลือกส่วนที่ต้องการ แล้วใช้แถบซูมเพื่อปรับกรอบได้เอง</p>
    <div className="v60-crop-actions"><button type="button" className="btn btn-ghost" onClick={onCancel}>ยกเลิก</button><button type="button" className="btn btn-pink" disabled={working} onClick={finish}>{working?'กำลังปรับรูป...':'ใช้รูปนี้'}</button></div>
  </div></div>, document.body)
}

function SwipeDeck({ people, swipeRemaining = null, myInterests = [], onLike, onSkip, onSuperLike, onUndo, canUndo, onOpen, onReport, verifiedIds = [] }) {
  const [photo, setPhoto] = useState(0), [busy, setBusy] = useState(false), [superBurst, setSuperBurst] = useState(false), [swipeBurst, setSwipeBurst] = useState(null), [showSwipeMenu, setShowSwipeMenu] = useState(false)
  const [cardVideos, setCardVideos] = useState([])
  const start = useRef(null)
  const dragNow = useRef({ x: 0, y: 0 })
  const dragFrame = useRef(0)
  const cardRef = useRef(null)
  const yesRef = useRef(null)
  const noRef = useRef(null)
  const busyRef = useRef(false)
  const person = people[0]
  useEffect(() => { const next = people[1]; if (next) preloadImage(photoCandidates(next)[0]) }, [people[1]?.id, people[1]?.avatar_path])
  const paint = useCallback((x, y, animate = false) => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = animate ? 'transform 520ms cubic-bezier(.22,1,.36,1)' : 'none'
    card.style.transform = `translate3d(${x}px,${y}px,0) rotate(${x / 18}deg)`
    const strength = Math.min(Math.abs(x) / 125, 1)
    for (const [el, visible] of [[yesRef.current, x > 12], [noRef.current, x < -12]]) {
      if (!el) continue
      el.style.opacity = visible ? String(strength) : '0'
      el.style.transform = `translate3d(0,${(1-strength)*14}px,0) scale(${.83+strength*.17})`
    }
  }, [])
  useEffect(() => () => cancelAnimationFrame(dragFrame.current), [])
  useEffect(() => { cancelAnimationFrame(dragFrame.current); dragFrame.current = 0 }, [person?.id])
  useLayoutEffect(() => {
    setPhoto(0)
    setSuperBurst(false)
    setShowSwipeMenu(false)
    start.current = null
    dragNow.current = { x: 0, y: 0 }
    paint(0, 0)
  }, [person?.id, paint])
  const photos = useMemo(() => person ? [person.avatar_path, ...(person.photo_paths || []).filter(x => x !== person.avatar_path)].filter(Boolean).slice(0, 6) : [], [person?.avatar_path, person?.photo_paths])
  useEffect(() => {
    let active = true
    setCardVideos([])
    setPhoto(0)
    if (!person?.id) return () => { active = false }
    supabase.from('profile_media').select('id,media_type,storage_path').eq('profile_id', person.id).eq('media_type', 'video').order('created_at', { ascending: true })
      .then(({ data, error }) => { if (active && !error) setCardVideos((data || []).map(item => ({ type: 'video', path: item.storage_path, key: item.id }))) })
      .catch(() => {})
    return () => { active = false }
  }, [person?.id])
  const photoItems = [...photos.map(path => ({ type: 'image', path, key: path })), ...cardVideos].sort((a, b) => { const order = person?.media_order; if (!Array.isArray(order)) return 0; const ai = order.indexOf(a.key), bi = order.indexOf(b.key); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) })
  // Mobile: keep at most one upcoming image in memory. Never decode the
  // whole gallery eagerly; large images can heat up iOS devices.
  const galleryPreloads = useRef(new Map())
  useEffect(() => {
    galleryPreloads.current.clear()
    if (typeof Image === 'undefined' || !person?.id || document.visibilityState === 'hidden') return
    const next = photoItems[photo + 1] || photoItems[photo - 1]
    if (next?.type !== 'image') return
    const url = swipePhotoUrl(next.path)
    if (!url) return
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    // Decode the next photo off-screen so the browser can reuse it on the next tap.
    // Keep only one prefetched image to avoid iOS memory pressure.
    image.decode?.().catch(() => {})
    galleryPreloads.current.set(url, image)
    return () => { galleryPreloads.current.clear() }
  }, [person?.id, photo, person?.avatar_path, person?.photo_paths, cardVideos, person?.media_order])
  const act = async (like) => {
    if (!person || busyRef.current) return
    // Exhausted quota: show the quota dialog directly, without swipe burst, vibration or card exit.
    if (swipeRemaining !== null && Number(swipeRemaining) <= 0) {
      await (like ? onLike(person) : onSkip(person))
      return
    }
    busyRef.current = true
    setBusy(true)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(like ? 18 : 9)
    setSwipeBurst(like ? 'like' : 'pass')
    // Keep the current profile visible during the cinematic charge-up.
    // The parent only advances the deck after the transition has completed.
    try {
      // Give the visual feedback a short beat, then move the card on the compositor.
      // The database request runs concurrently with the exit animation.
      await new Promise(resolve => setTimeout(resolve, 120))
      paint(like ? 560 : -560, -22, true)
      await Promise.all([
        (like ? onLike(person) : onSkip(person)),
        new Promise(resolve => setTimeout(resolve, 840))
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
    // Do not cancel touch at pointer-down: the browser needs a chance to
    // recognize vertical intent and scroll the discovery page naturally.
    start.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, horizontal: false }
    dragNow.current = { x: 0, y: 0 }
  }
  const move = (e) => {
    const origin = start.current
    if (!origin || busyRef.current || e.pointerId !== origin.pointerId) return
    const dx = e.clientX - origin.x, dy = e.clientY - origin.y
    // Vertical-dominant movement belongs to the page, not the swipe gesture.
    if (!origin.horizontal && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.12) {
      start.current = null
      dragNow.current = { x: 0, y: 0 }
      cancelAnimationFrame(dragFrame.current)
      dragFrame.current = 0
      paint(0, 0)
      return
    }
    // Claim the pointer only after a clear horizontal gesture is detected.
    if (!origin.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.08) {
      origin.horizontal = true
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    }
    if (!origin.horizontal) return
    if (e.cancelable) e.preventDefault()
    dragNow.current = { x: dx, y: dy }
    if (!dragFrame.current) dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = 0
      paint(dragNow.current.x, dragNow.current.y)
    })
  }
  const up = () => {
    const origin = start.current
    if (!origin) return
    start.current = null
    cancelAnimationFrame(dragFrame.current)
    dragFrame.current = 0
    const x = origin.horizontal ? dragNow.current.x : 0
    if (Math.abs(x) > 62) act(x > 0)
    else { dragNow.current = { x: 0, y: 0 }; paint(0, 0, true) }
  }
  if (!person) return <div className="swipe-empty"><Heart size={40}/><h2>ดูครบทุกโปรไฟล์แล้ว</h2><p>ลองปรับตัวกรองเพื่อพบคนใหม่ ๆ</p></div>
  return <div className="swipe-stage"><div className="swipe-stack" aria-label="ปัดโปรไฟล์">
    {people[1] && <div className="swipe-card swipe-behind"><Av u={people[1]} cls="swipe-behind-image" loading="eager" fetchPriority="low" /></div>}
    <article className="swipe-card swipe-front" ref={cardRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; cancelAnimationFrame(dragFrame.current); dragFrame.current = 0; dragNow.current = { x: 0, y: 0 }; paint(0, 0, true) }} style={{ touchAction: 'none' }}>
      {photoItems[photo]?.type === 'video' ? <TapSoundVideo key={photoItems[photo].key} className="swipe-media-video" draggable="false" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} src={mediaPub(photoItems[photo].path)} label={`วิดีโอของ ${person.display_name}`} /> : <img draggable="false" src={swipePhotoUrl(photoItems[photo]?.path) || ph(person.display_name)} alt={person.display_name} loading="eager" fetchPriority="high" decoding="async" onError={(e) => { const original = pub(photoItems[photo]?.path); if (original && e.currentTarget.src !== original) { e.currentTarget.src = original; return } e.currentTarget.onerror = null; e.currentTarget.src = ph(person.display_name) }} />}
      <div className="swipe-photo-bars">{(photoItems.length ? photoItems : [null]).map((_, i) => <span key={photoItems[i]?.key || i} className={i === photo ? 'active' : ''}/>)}</div>
      <button type="button" className={'swipe-more-trigger ' + (showSwipeMenu ? 'active' : '')} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setShowSwipeMenu(v => !v) }} aria-label="ตัวเลือกโปรไฟล์" aria-expanded={showSwipeMenu} title="ตัวเลือกเพิ่มเติม"><MoreHorizontal size={22}/></button>
      {showSwipeMenu && <div className="swipe-more-menu swipe-more-menu-card" role="menu" aria-label="ตัวเลือกโปรไฟล์" onPointerDown={e => e.stopPropagation()}><div className="swipe-more-heading">จัดการโปรไฟล์</div><button type="button" role="menuitem" onClick={e => { e.stopPropagation(); setShowSwipeMenu(false); onOpen(person) }}><UserRound size={16}/><span><b>ดูโปรไฟล์</b><small>อ่านรายละเอียดเพิ่มเติม</small></span></button><div className="swipe-more-divider"/><button type="button" role="menuitem" className="danger" onClick={e => { e.stopPropagation(); setShowSwipeMenu(false); onReport(person) }}><Flag size={16}/><span><b>รายงานโปรไฟล์</b><small>แจ้งปัญหาให้ทีมงานตรวจสอบ</small></span></button></div>}
      <button type="button" className="swipe-tap left" aria-label="รูปก่อนหน้า" disabled={photo === 0} onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setPhoto(v => Math.max(0, v - 1)) }}/><button type="button" className="swipe-tap right" aria-label="รูปถัดไป" disabled={photo >= photoItems.length - 1} onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setPhoto(v => Math.min(photoItems.length - 1, v + 1)) }}/>
      <div className="swipe-feedback yes" ref={yesRef} aria-hidden="true">
        <span className="swipe-feedback-spark spark-one"/><span className="swipe-feedback-spark spark-two"/><span className="swipe-feedback-spark spark-three"/>
        <span className="swipe-feedback-icon"><Heart size={25} fill="currentColor" strokeWidth={1.8}/></span><span className="swipe-feedback-label">LIKE</span><span className="swipe-feedback-caption">ชอบคนนี้</span>
      </div>
      <div className="swipe-feedback no" ref={noRef} aria-hidden="true">
        <span className="swipe-feedback-spark spark-one"/><span className="swipe-feedback-spark spark-two"/><span className="swipe-feedback-spark spark-three"/>
        <span className="swipe-feedback-icon"><X size={26} strokeWidth={2.7}/></span><span className="swipe-feedback-label">NOPE</span><span className="swipe-feedback-caption">ไว้เจอกันใหม่</span>
      </div>
      {person.is_premium && <div className="swipe-premium-badge"><Crown size={13} fill="currentColor"/><span>PREMIUM</span><Sparkles size={12}/></div>}
      <div className="swipe-info"><h2>{person.display_name}, {person.age}</h2>{(person.interests || []).some(x => myInterests.includes(x)) && <div className="nm-mutual-interests"><Sparkles size={14}/> สนใจตรงกัน {(person.interests || []).filter(x => myInterests.includes(x)).length} อย่าง</div>}<p><GraduationCap size={17}/>{universityWithCampus(person)}</p>{verifiedIds.includes(person.id) && <CampusVerifiedBadge universityId={person.university_id} />}{person.relationship_intent && <RelationshipVibe intent={person.relationship_intent} />}<p>{person.bio || 'มาทำความรู้จักกัน'}</p><div className="tags">{(person.interests || []).slice(0, 3).map(x => <span className="tag" key={x}>{x}</span>)}</div>{itunesTrack(person) && <div className="swipe-song" onPointerDown={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}><ITunesSongCard track={itunesTrack(person)} compact /></div>}</div>
      {superBurst && <div className="nm-superburst" aria-live="polite" aria-label="ส่ง Super Like แล้ว">
        <div className="nm-superburst-halo" />
        <div className="nm-superburst-ring ring-one" /><div className="nm-superburst-ring ring-two" />
        {Array.from({length: 14}, (_, i) => <i key={i} className="nm-superburst-particle" style={{'--i':i,'--angle':`${i*360/14}deg`}} />)}
        <div className="nm-superburst-star"><Star size={68} strokeWidth={1.7} fill="currentColor"/></div>
        <div className="nm-superburst-title">SUPER LIKE</div><div className="nm-superburst-caption">ส่งความพิเศษไปแล้ว</div>
      </div>}
    </article>{swipeBurst && createPortal(<div className={'v64-swipe-burst v76-swipe-burst-overlay ' + swipeBurst} aria-hidden="true"><div className="v64-swipe-burst-icon">{swipeBurst === 'like' ? <Heart fill="currentColor" size={64}/> : <X size={70}/>}</div><span>{swipeBurst === 'like' ? 'LIKE' : 'PASS'}</span>{Array.from({length:10},(_,i)=><i key={i} style={{'--i':i}}/>)}</div>, document.body)}</div><div className="swipe-action-area nm-swipe-actions-framed"><button type="button" className="swipe-control undo nm-swipe-undo" disabled={busy || !canUndo} onClick={onUndo} aria-label="ย้อนกลับการปัด" title={canUndo ? "ย้อนกลับการปัดล่าสุด" : "ยังไม่มีรายการให้ย้อนกลับ"}><Undo2 size={20}/></button><div className="swipe-controls nm-swipe-primary-actions"><button type="button" className="swipe-control reject" disabled={busy} onClick={() => act(false)} aria-label="ผ่าน" title="ผ่าน"><X size={23}/></button><button type="button" disabled={busy} className="swipe-control accept" onClick={() => act(true)} aria-label="ใจ" title="ใจ"><Heart size={26} fill="currentColor"/>{Number.isFinite(Number(swipeRemaining)) && swipeRemaining !== null && <span className="nm-heart-remaining" aria-label={`เหลือ ${swipeRemaining} ครั้ง`}>{Math.max(0, Number(swipeRemaining))}</span>}</button><button type="button" disabled={busy} className="swipe-control super" onClick={doSuperLike} aria-label="Super Like" title="Super Like (สูงสุด 3 ครั้งต่อวัน)"><Star size={20}/></button></div></div><p className="swipe-hint">← ปัดซ้ายเพื่อผ่าน · ปัดขวาเพื่อส่งใจ →</p></div>
}

function CampusVerifiedBadge({ universityId }) {
  const label = `${studentTerm(universityId)}ยืนยันแล้ว`
  return <span className="nm-campus-verified" title="ยืนยันอีเมลมหาวิทยาลัยแล้ว" aria-label={`ยืนยันอีเมลมหาวิทยาลัยแล้ว: ${label}`}><ShieldCheck size={13} strokeWidth={2.4}/><span>{label}</span></span>
}

function PersonCard({ p, onLike, onSkip, onOpen, onReport, verifiedIds = [] }) {
  return (
    <article className="person-card"><div className="person-image"><Av u={p} cls="person-photo" /><div className="image-gradient" />
      {verifiedIds.includes(p.id) && <CampusVerifiedBadge universityId={p.university_id} />}
      <button className="card-more" onClick={() => onReport(p)} title="รายงาน"><Flag size={15} /></button>
      <div className="person-title"><h3>{p.display_name}, {p.age}</h3><p><GraduationCap size={13} />{universityWithCampus(p)}</p></div></div>
      <div className="person-body"><div className="tags">{(p.interests || []).slice(0, 3).map((i) => <span className="tag" key={i}>{i}</span>)}</div>
        {p.relationship_intent && <RelationshipVibe intent={p.relationship_intent} />}<p className="person-bio">{p.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
        <div className="person-actions"><button className="round-action nope" onClick={() => onSkip(p)} title="ข้าม"><X size={20} /></button><button className="btn btn-pink like-btn" onClick={() => onLike(p)}><Heart size={17} fill="currentColor" /> ถูกใจ</button><button className="round-action more" onClick={() => onOpen(p)} title="ดูโปรไฟล์"><UserRound size={18} /></button></div></div></article>
  )
}

function Heading({ kicker, title, sub, children }) {
  return <div className="welcome-row"><div><div className="section-kicker">{kicker}</div><h1>{title}</h1><p>{sub}</p></div>{children}</div>
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

function Messages({ me, matches, notify, reload, onOpenProfile, onMessagesRead, onOpenHangoutChat }) {
  useEffect(() => () => { try { sessionStorage.removeItem(`nisit-active-hangout-chat:${me}`) } catch {} }, [me])
  const [hangoutRooms, setHangoutRooms] = useState([])
  useEffect(() => {
    let alive = true
    let inFlight = false
    const loadHangoutRooms = async () => {
      if (!alive || inFlight || document.visibilityState !== 'visible') return
      inFlight = true
      try {
      const [membershipResult, createdResult] = await Promise.all([
        supabase.from("hangout_rsvps").select("event_id").eq("user_id", me),
        supabase.from("hangout_events").select("id,title,venue,city,starts_at,status,capacity,creator_id").eq("creator_id", me).order("starts_at", { ascending: false }).limit(30),
      ])
      const ids = [...new Set((membershipResult.data || []).map(x => x.event_id).concat((createdResult.data || []).map(x => x.id)))]
      if (!ids.length) { if (alive) setHangoutRooms([]); return }
      const { data, error } = await supabase.from("hangout_events").select("id,title,venue,city,starts_at,status,capacity,creator_id").in("id", ids).order("starts_at", { ascending: false }).limit(40)
      // Closed rooms should disappear from the Messages inbox after the next refresh.
      if (alive) setHangoutRooms((error ? (createdResult.data || []) : (data || [])).filter(room => room.status === 'open'))
      } finally { inFlight = false }
    }
    loadHangoutRooms()
    // Avoid repeated Supabase reads while Safari/PWA is in the background.
    const poll = setInterval(() => { if (document.visibilityState === 'visible') loadHangoutRooms() }, 30000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadHangoutRooms() }
    document.addEventListener('visibilitychange', onVisible)
    const channel = supabase.channel(`hangout-room-list-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hangout_rsvps', filter: `user_id=eq.${me}` }, loadHangoutRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hangout_events', filter: `creator_id=eq.${me}` }, loadHangoutRooms)
      .subscribe()
    return () => { alive = false; clearInterval(poll); document.removeEventListener('visibilitychange', onVisible); supabase.removeChannel(channel) }
  }, [me])
  const [hangoutChatEvent, setHangoutChatEvent] = useState(null)
  const [hangoutChatMessages, setHangoutChatMessages] = useState([])
  const [hangoutChatNames, setHangoutChatNames] = useState({})
  const [hangoutChatProfiles, setHangoutChatProfiles] = useState({})
  const [hangoutChatMembers, setHangoutChatMembers] = useState([])
  const [hangoutReadReceipts, setHangoutReadReceipts] = useState([])
  const [hangoutChatDraft, setHangoutChatDraft] = useState('')
  const [hangoutChatBusy, setHangoutChatBusy] = useState(false)
  const [hangoutUploading, setHangoutUploading] = useState(false)
  const [hangoutRecording, setHangoutRecording] = useState(false)
  const [hangoutMicBusy, setHangoutMicBusy] = useState(false)
  const [hangoutMicStream, setHangoutMicStream] = useState(null)
  const [hangoutMediaUrls, setHangoutMediaUrls] = useState({})
  const hangoutFileInput = useRef(null)
  const hangoutRecorder = useRef(null)
  const hangoutRecordParts = useRef([])
  const hangoutRecordingRoom = useRef(null)
  const hangoutDiscardRecord = useRef(false)
  const hangoutChatStickBottom = useRef(true)
  const hangoutChatListRef = useRef(null)
  const [hangoutTyping, setHangoutTyping] = useState({})
  const hangoutTypingChannel = useRef(null)
  const hangoutLastTyping = useRef(0)
  const hangoutTypingStop = useRef(null)
  useEffect(() => {
    if (!hangoutChatEvent?.id) { setHangoutTyping({}); return }
    const channel = supabase.channel(`hangout-typing-${hangoutChatEvent.id}`, { config: { broadcast: { self: false } } })
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload?.userId || payload.userId === me) return
      setHangoutTyping(old => ({ ...old, [payload.userId]: payload.active ? Date.now() + 3500 : 0 }))
    }).subscribe()
    hangoutTypingChannel.current = channel
    const sweep = setInterval(() => setHangoutTyping(old => {
      const next = Object.fromEntries(Object.entries(old).filter(([, until]) => until > Date.now()))
      return Object.keys(next).length === Object.keys(old).length ? old : next
    }), 900)
    return () => { clearInterval(sweep); clearTimeout(hangoutTypingStop.current); hangoutTypingChannel.current = null; supabase.removeChannel(channel) }
  }, [hangoutChatEvent?.id, me])
  const broadcastHangoutTyping = (active) => {
    if (!hangoutTypingChannel.current) return
    if (active && Date.now() - hangoutLastTyping.current < 900) return
    hangoutLastTyping.current = Date.now()
    hangoutTypingChannel.current.send({ type: 'broadcast', event: 'typing', payload: { userId: me, active } })
  }
  const onHangoutDraftChange = (value) => {
    setHangoutChatDraft(value)
    broadcastHangoutTyping(Boolean(value.trim()))
    clearTimeout(hangoutTypingStop.current)
    hangoutTypingStop.current = setTimeout(() => broadcastHangoutTyping(false), 2000)
  }

  useViewportScrollLock(!!hangoutChatEvent)
  useEffect(() => {
    if (!hangoutChatEvent) return
    const updateViewport = () => {
      document.documentElement.style.setProperty('--nm-visual-height', `${window.visualViewport?.height || window.innerHeight}px`)
      document.documentElement.style.setProperty('--nm-visual-top', `${window.visualViewport?.offsetTop || 0}px`)
    }
    updateViewport(); window.visualViewport?.addEventListener('resize', updateViewport); window.visualViewport?.addEventListener('scroll', updateViewport); window.addEventListener('resize', updateViewport)
    return () => { window.visualViewport?.removeEventListener('resize', updateViewport); window.visualViewport?.removeEventListener('scroll', updateViewport); window.removeEventListener('resize', updateViewport); document.documentElement.style.removeProperty('--nm-visual-height'); document.documentElement.style.removeProperty('--nm-visual-top') }
  }, [!!hangoutChatEvent])
  const loadHangoutChat = useCallback(async (eventOrId) => {
    const event = typeof eventOrId === 'string' ? hangoutRooms.find(x => x.id === eventOrId) : eventOrId
    if (!event) { notify('ไม่พบห้อง Hangout นี้ในรายการข้อความ'); return }
    setHangoutChatEvent(event); setHangoutChatMessages([]); setHangoutChatDraft(''); hangoutChatStickBottom.current = true; setHangoutMediaUrls({})
    try { sessionStorage.setItem(`nisit-active-hangout-chat:${me}`, event.id) } catch {}
    setHangoutChatMembers([]); setHangoutChatNames({}); setHangoutChatProfiles({}); setHangoutReadReceipts([])
    const [messageResult, memberResult] = await Promise.all([
      supabase.from('hangout_messages').select('id,event_id,user_id,body,attachment_type,attachment_path,created_at').eq('event_id', event.id).order('created_at', { ascending: true }).limit(300),
      supabase.rpc('hangout_member_profiles', { p_event_id: event.id }),
    ])
    if (messageResult.error) { notify('เปิดแชทกลุ่มไม่ได้: ' + messageResult.error.message + ' · ตรวจ SQL v81/v87'); return }
    const rows = messageResult.data || []; setHangoutChatMessages(rows)
    // Mark visible messages as read for this member; the SQL migration restricts receipts to room members.
    const unreadRows = rows.filter(row => row.user_id !== me)
    if (unreadRows.length) {
      const receipts = unreadRows.map(row => ({ event_id: event.id, message_id: row.id, user_id: me }))
      const { error: readError } = await supabase.from('hangout_message_reads').upsert(receipts, { onConflict: 'message_id,user_id', ignoreDuplicates: true })
      if (readError && !String(readError.message || '').includes('does not exist')) console.warn('Hangout read receipts unavailable; run V91 SQL', readError.message)
    }
    const { data: initialReceipts } = await supabase.from('hangout_message_reads').select('message_id,user_id,read_at').eq('event_id', event.id)
    setHangoutReadReceipts(initialReceipts || [])
    await supabase.from('notifications').update({ read: true }).eq('user_id', me).eq('type', 'hangout_message').eq('ref_id', event.id).eq('read', false)
    onMessagesRead?.()
    if (memberResult.error) { notify('โหลดรายชื่อสมาชิกไม่ได้: ' + memberResult.error.message + ' · ต้องรัน SQL v87'); }
    const profiles = memberResult.data || []
    const names = {}; const profileMap = {}; profiles.forEach(x => { names[x.id] = x.display_name || 'สมาชิก'; profileMap[x.id] = x })
    setHangoutChatProfiles(profileMap)
    // Fallback to sender IDs if member RPC is temporarily unavailable, then retry on realtime/poll.
    const memberIds = [...new Set(profiles.map(x => x.id).concat([event.creator_id, me], rows.map(x => x.user_id)).filter(Boolean))]
    setHangoutChatMembers(memberIds); setHangoutChatNames(names)
  }, [hangoutRooms, me, notify, onMessagesRead])
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(`nisit-pending-hangout-chat:${me}`)
      if (pending) { const target = hangoutRooms.find(x => x.id === pending); if (target) { sessionStorage.removeItem(`nisit-pending-hangout-chat:${me}`); loadHangoutChat(target) } }
    } catch {}
  }, [hangoutRooms, me, loadHangoutChat])
  useEffect(() => {
    if (!hangoutChatEvent) return
    const eventId = hangoutChatEvent.id
    const channel = supabase.channel('messages-hangout-' + eventId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hangout_messages', filter: `event_id=eq.${eventId}` }, async payload => {
        const m = payload.new
        setHangoutChatMessages(old => old.some(x => x.id === m.id) ? old : [...old, m])
        if (m.user_id !== me) {
          const { error: readError } = await supabase.from('hangout_message_reads').upsert({ event_id: eventId, message_id: m.id, user_id: me }, { onConflict: 'message_id,user_id', ignoreDuplicates: true })
          if (readError && !String(readError.message || '').includes('does not exist')) console.warn('Hangout read receipt failed', readError.message)
        }
        const { data: receipts } = await supabase.from('hangout_message_reads').select('message_id,user_id,read_at').eq('event_id', eventId)
        if (receipts) setHangoutReadReceipts(receipts)
        const { data } = await supabase.rpc('hangout_member_profiles', { p_event_id: eventId })
        if (data?.length) {
          const names = {}; const profileMap = {}; data.forEach(x => { names[x.id] = x.display_name || 'สมาชิก'; profileMap[x.id] = x })
          setHangoutChatProfiles(old => ({ ...old, ...profileMap }))
          setHangoutChatNames(old => ({ ...old, ...names }))
          setHangoutChatMembers(old => [...new Set(old.concat(data.map(x => x.id)))])
        }
      }).subscribe()
    let fallbackBusy = false
    const fallbackPoll = setInterval(async () => {
      if (document.visibilityState !== 'visible' || fallbackBusy) return
      fallbackBusy = true
      try {
      const [{ data }, { data: latestEvent }] = await Promise.all([
        supabase.from('hangout_messages').select('id,event_id,user_id,body,attachment_type,attachment_path,created_at').eq('event_id', eventId).order('created_at', { ascending: true }).limit(300),
        supabase.from('hangout_events').select('id,title,venue,city,starts_at,status,capacity,creator_id').eq('id', eventId).maybeSingle(),
      ])
      if (data) setHangoutChatMessages(old => { const byId = new Map(old.map(x => [x.id, x])); data.forEach(x => byId.set(x.id, x)); return [...byId.values()].sort((a,b) => new Date(a.created_at)-new Date(b.created_at)) })
      if (latestEvent) setHangoutChatEvent(old => old?.id === eventId ? latestEvent : old)
      const { data: members } = await supabase.rpc('hangout_member_profiles', { p_event_id: eventId })
      if (members?.length) { const names = {}; const profileMap = {}; members.forEach(x => { names[x.id] = x.display_name || 'สมาชิก'; profileMap[x.id] = x }); setHangoutChatProfiles(old => ({ ...old, ...profileMap })); setHangoutChatNames(old => ({ ...old, ...names })); setHangoutChatMembers(members.map(x => x.id)) }
      const { data: receipts } = await supabase.from('hangout_message_reads').select('message_id,user_id,read_at').eq('event_id', eventId)
      if (receipts) setHangoutReadReceipts(receipts)
      } finally { fallbackBusy = false }
    }, 15000)
    return () => { clearInterval(fallbackPoll); supabase.removeChannel(channel) }
  }, [hangoutChatEvent?.id])
  useEffect(() => {
    if (!hangoutChatEvent) return
    const channel = supabase.channel('hangout-members-' + hangoutChatEvent.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hangout_rsvps', filter: `event_id=eq.${hangoutChatEvent.id}` }, async () => {
        const { data } = await supabase.rpc('hangout_member_profiles', { p_event_id: hangoutChatEvent.id })
        if (data?.length) { const names = {}; data.forEach(x => { names[x.id] = x.display_name || 'สมาชิก' }); setHangoutChatMembers(data.map(x => x.id)); setHangoutChatNames(old => ({ ...old, ...names })) }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [hangoutChatEvent?.id])
  useEffect(() => {
    if (!hangoutChatEvent) return
    const onKey = e => { if (e.key === 'Escape') { setHangoutChatEvent(null); try { sessionStorage.removeItem(`nisit-active-hangout-chat:${me}`) } catch {} } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [!!hangoutChatEvent, me])
  useEffect(() => {
    if (!hangoutChatEvent || !hangoutChatListRef.current || !hangoutChatStickBottom.current) return
    const el = hangoutChatListRef.current
    requestAnimationFrame(() => { if (hangoutChatListRef.current && hangoutChatStickBottom.current) hangoutChatListRef.current.scrollTop = hangoutChatListRef.current.scrollHeight })
  }, [hangoutChatMessages, hangoutChatEvent?.id])
  useEffect(() => {
    let active = true
    const paths = hangoutChatMessages.filter(m => m.attachment_path && !hangoutMediaUrls[m.attachment_path]).map(m => m.attachment_path)
    if (!paths.length) return
    Promise.all(paths.map(async path => {
      const { data, error } = await supabase.storage.from('chat-media').createSignedUrl(path, 3600)
      return [path, error ? null : data?.signedUrl]
    })).then(entries => { if (active) setHangoutMediaUrls(prev => ({ ...prev, ...Object.fromEntries(entries.filter(x => x[1])) })) })
    return () => { active = false }
  }, [hangoutChatMessages, hangoutMediaUrls])
  const hangoutReadersFor = (messageId) => {
    const ids = [...new Set(hangoutReadReceipts.filter(r => r.message_id === messageId && r.user_id !== me).map(r => r.user_id))]
    return ids.map(id => ({ id, display_name: hangoutChatNames[id] || 'สมาชิก', avatar_path: null }))
  }
  const openHangoutMemberProfile = (id) => {
    if (!id || !onOpenProfile) return
    onOpenProfile({ ...(hangoutChatProfiles[id] || { id, display_name: hangoutChatNames[id] || 'สมาชิก' }), hangout_event_id: hangoutChatEvent?.id })
  }
  const sendHangoutChat = async e => {
    e.preventDefault(); const body = hangoutChatDraft.trim()
    if (!body || !hangoutChatEvent || hangoutChatBusy || hangoutChatEvent.status !== 'open') return
    setHangoutChatBusy(true)
    const { data, error } = await supabase.from('hangout_messages').insert({ event_id: hangoutChatEvent.id, user_id: me, body }).select('id,event_id,user_id,body,attachment_type,attachment_path,created_at').single()
    setHangoutChatBusy(false)
    if (error) { notify('ส่งข้อความไม่สำเร็จ: ' + error.message); return }
    setHangoutChatMessages(old => old.some(x => x.id === data.id) ? old : [...old, data]); setHangoutChatNames(old => ({ ...old, [me]: old[me] || 'คุณ' })); setHangoutChatDraft('')
  }
  const sendHangoutMedia = async (file, type, targetEvent = hangoutChatEvent) => {
    if (!file || !targetEvent || targetEvent.status !== 'open') return
    if (file.size > 10 * 1024 * 1024) return notify('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
    if (type === 'image' && !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return notify('รองรับ JPG, PNG, WebP และ GIF')
    if (type === 'audio' && !['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/x-m4a'].includes(file.type.split(';')[0])) return notify('ไฟล์เสียงไม่รองรับ')
    setHangoutUploading(true)
    const extension = (file.name?.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg')).replace(/[^a-z0-9]/gi, '').toLowerCase()
    const path = `${targetEvent.id}/${makeClientId()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type.split(';')[0], upsert: false })
    if (uploadError) { setHangoutUploading(false); return notify('อัปโหลดไม่สำเร็จ: ' + uploadError.message + ' · ตรวจ SQL v89') }
    const body = type === 'image' ? '📷 รูปภาพ' : '🎤 ข้อความเสียง'
    const { data, error } = await supabase.from('hangout_messages').insert({ event_id: targetEvent.id, user_id: me, body, attachment_type: type, attachment_path: path }).select('id,event_id,user_id,body,attachment_type,attachment_path,created_at').single()
    setHangoutUploading(false)
    if (error) { await supabase.storage.from('chat-media').remove([path]); notify('ส่งไฟล์ไม่สำเร็จ: ' + error.message + ' · ตรวจ SQL v89'); return }
    setHangoutMessagesSafely(data)
  }
  const setHangoutMessagesSafely = (data) => { setHangoutChatMessages(old => old.some(x => x.id === data.id) ? old : [...old, data]); setHangoutChatNames(old => ({ ...old, [me]: old[me] || 'คุณ' })) }
  const toggleHangoutRecord = async () => {
    if (hangoutRecording) { hangoutRecorder.current?.stop(); setHangoutRecording(false); setHangoutMicStream(null); return }
    if (hangoutMicBusy || !hangoutChatEvent || hangoutChatEvent.status !== 'open') return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return notify('เบราว์เซอร์นี้ไม่รองรับการอัดเสียง')
    setHangoutMicBusy(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      hangoutRecorder.current = recorder; hangoutRecordingRoom.current = hangoutChatEvent; hangoutRecordParts.current = []
      recorder.ondataavailable = e => { if (e.data.size) hangoutRecordParts.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop()); setHangoutMicStream(null)
        if (hangoutDiscardRecord.current) { hangoutDiscardRecord.current = false; return }
        const target = hangoutRecordingRoom.current
        if (!hangoutRecordParts.current.length) return notify('ไม่มีข้อมูลเสียง กรุณาลองอัดใหม่')
        const blob = new Blob(hangoutRecordParts.current, { type: recorder.mimeType || 'audio/webm' })
        const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
        if (blob.size < 400) return notify('เสียงสั้นเกินไป กรุณาลองใหม่')
        sendHangoutMedia(new File([blob], `voice.${ext}`, { type: blob.type }), 'audio', target)
      }
      hangoutDiscardRecord.current = false; recorder.start(250); setHangoutMicStream(stream); setHangoutRecording(true)
    } catch { notify('ไม่สามารถใช้ไมโครโฟนได้ กรุณาอนุญาตการเข้าถึงไมโครโฟน') }
    finally { setHangoutMicBusy(false) }
  }
  const cancelHangoutRecord = () => { hangoutDiscardRecord.current = true; if (hangoutRecorder.current?.state === 'recording') hangoutRecorder.current.stop(); setHangoutRecording(false); setHangoutMicStream(null) }
  useEffect(() => () => { if (hangoutRecorder.current?.state === 'recording') { hangoutRecorder.current.onstop = null; hangoutRecorder.current.stop(); hangoutRecorder.current.stream?.getTracks().forEach(t => t.stop()) } }, [])
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
  const inboxRefreshInFlight = useRef(false)
  const inboxRefreshQueued = useRef(false)
  const inboxRefreshQueuedTimer = useRef(null)
  const inboxRefreshRunner = useRef(null)
  const refreshInbox = useCallback(async () => {
    if (document.visibilityState === 'hidden') return
    if (!me || !matches.length) { setInbox({}); return }
    // Coalesce overlapping refreshes so a slow database response cannot cause
    // multiple full inbox query batches to run at the same time.
    if (inboxRefreshInFlight.current) { inboxRefreshQueued.current = true; return }
    inboxRefreshInFlight.current = true
    const request = ++inboxRequest.current
    try {
      const results = await Promise.all(matches.map(async m => {
        const [latest, unread] = await Promise.all([
          supabase.from('messages').select('id,body,sender_id,attachment_type,created_at').eq('match_id', m.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('match_id', m.id).neq('sender_id', me).is('read_at', null)
        ])
        return [m.id, { last: latest.data?.[0] || null, unread: unread.count || 0 }]
      }))
      if (request === inboxRequest.current) setInbox(previous => { const next = Object.fromEntries(results); return JSON.stringify(previous) === JSON.stringify(next) ? previous : next })
    } catch (error) {
      console.warn('Inbox refresh failed:', error)
    } finally {
      inboxRefreshInFlight.current = false
      if (inboxRefreshQueued.current) {
        inboxRefreshQueued.current = false
        if (inboxRefreshQueuedTimer.current) clearTimeout(inboxRefreshQueuedTimer.current)
        inboxRefreshQueuedTimer.current = setTimeout(() => {
          inboxRefreshQueuedTimer.current = null
          inboxRefreshRunner.current?.()
        }, 350)
      }
    }
  }, [me, matches])
  inboxRefreshRunner.current = refreshInbox
  useEffect(() => {
    refreshInbox()
    // Debounce bursts of Realtime message events. The messages table is shared
    // across users, so a burst can otherwise trigger repeated inbox queries
    // across every open client.
    let inboxRefreshTimer = null
    const scheduleInboxRefresh = () => {
      if (inboxRefreshTimer) clearTimeout(inboxRefreshTimer)
      inboxRefreshTimer = setTimeout(() => {
        inboxRefreshTimer = null
        if (document.visibilityState === 'visible') refreshInbox()
      }, 750)
    }
    const channel = supabase.channel(`inbox-preview-${me}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        const matchId = payload?.new?.match_id || payload?.old?.match_id
        if (matchId && matches.some(match => match.id === matchId)) scheduleInboxRefresh()
      })
      .subscribe()
    // Fallback for projects without Realtime publication enabled for messages.
    // Realtime is primary; use a less frequent visible-only fallback to limit
    // two queries per match on mobile connections.
    const poll = setInterval(() => { if (document.visibilityState === 'visible') refreshInbox() }, 90000)
    const visible = () => { if (document.visibilityState === 'visible') refreshInbox() }
    document.addEventListener('visibilitychange', visible)
    return () => {
      inboxRequest.current++
      clearInterval(poll)
      if (inboxRefreshTimer) clearTimeout(inboxRefreshTimer)
      if (inboxRefreshQueuedTimer.current) clearTimeout(inboxRefreshQueuedTimer.current)
      inboxRefreshQueued.current = false
      document.removeEventListener('visibilitychange', visible)
      supabase.removeChannel(channel)
    }
  }, [me, refreshInbox])
  const [onlineMatchIds, setOnlineMatchIds] = useState({})
  // Keep presence checks for the same 20 matches, but poll less often to reduce RPC load.
  const presenceIds = matches.slice(0, 20).map(m => m.p?.id).filter(Boolean).join(',')
  useEffect(() => {
    if (!presenceIds) { setOnlineMatchIds({}); return }
    let active = true
    const ids = presenceIds.split(',')
    let presenceBusy = false
    const refresh = async () => {
      if (document.visibilityState !== 'visible' || presenceBusy) return
      presenceBusy = true
      try {
      const next = {}
      for (let i = 0; i < ids.length; i += 4) {
        const results = await Promise.all(ids.slice(i, i + 4).map(id => supabase.rpc('get_match_presence', { p_user_id: id })))
        if (!active) return
        results.forEach((result, j) => {
          const last = result.data?.[0]?.last_seen_at
          if (!result.error && last && Date.now() - new Date(last).getTime() < 120000) next[ids[i + j]] = true
        })
      }
      if (active) setOnlineMatchIds(old => { const a=Object.keys(old),b=Object.keys(next); return a.length===b.length && b.every(id=>old[id]) ? old : next })
      } finally { presenceBusy = false }
    }
    refresh()
    const timer = setInterval(refresh, 90000)
    const visible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', visible)
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [presenceIds])
  const sel = matches.find(m => m.id === selectedId) || null
  const roomId = sel?.id
  const [lastSeenAt, setLastSeenAt] = useState(null)
  useEffect(() => {
    if (!sel?.p?.id) { setLastSeenAt(null); return }
    let alive = true
    const loadPresence = async () => {
      const {data,error}=await supabase.rpc('get_match_presence',{p_user_id:sel.p.id})
      if (alive) setLastSeenAt(!error && data?.[0]?.last_seen_at ? data[0].last_seen_at : null)
    }
    loadPresence()
    const timer=setInterval(() => { if (document.visibilityState === 'visible') loadPresence() },60000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadPresence() }
    document.addEventListener('visibilitychange', onVisible)
    return ()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange', onVisible)}
  },[sel?.p?.id])
  const lastSeenLabel = lastSeenAt && Date.now()-new Date(lastSeenAt).getTime()<120000 ? 'ออนไลน์เมื่อสักครู่' : lastSeenAt ? 'ใช้งานล่าสุด '+new Date(lastSeenAt).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'แตะเพื่อดูโปรไฟล์ · รูปภาพ · เพลง'

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
  const pendingOlderScroll = useRef(null)
  useLayoutEffect(() => {
    const pending = pendingOlderScroll.current
    if (!pending || pending.roomId !== roomId) return
    pendingOlderScroll.current = null
    const box = scrollBox.current
    if (box) box.scrollTop = pending.top + box.scrollHeight - pending.height
  }, [msgs, roomId])
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
  const [pendingChatPhoto, setPendingChatPhoto] = useState(null)
  const [photoSending, setPhotoSending] = useState(false)
  const [photoUploadStage, setPhotoUploadStage] = useState('idle')
  const pendingChatPhotoRef = useRef(null)
  const closeChatPhotoPreview = () => {
    if (pendingChatPhotoRef.current?.url) URL.revokeObjectURL(pendingChatPhotoRef.current.url)
    pendingChatPhotoRef.current = null
    setPendingChatPhoto(null)
    setPhotoUploadStage('idle')
  }
  const compressChatPhoto = async file => {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size < 700 * 1024) return file
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close?.()
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82))
      if (!blob || blob.size >= file.size) return file
      return new File([blob], 'chat-photo.jpg', { type: 'image/jpeg' })
    } catch { return file }
  }
  const previewChatPhoto = file => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return notify('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return notify('รองรับ JPG, PNG, WebP และ GIF')
    closeChatPhotoPreview()
    const next = { file, url: URL.createObjectURL(file), roomId }
    pendingChatPhotoRef.current = next
    setPendingChatPhoto(next)
  }
  useEffect(() => () => { if (pendingChatPhotoRef.current?.url) URL.revokeObjectURL(pendingChatPhotoRef.current.url) }, [])
  useEffect(() => { closeChatPhotoPreview() }, [roomId])
  const confirmChatPhoto = async () => {
    const pending = pendingChatPhotoRef.current
    if (!pending || photoSending || uploading || !pending.roomId) return
    setPhotoSending(true)
    try { const optimized = await compressChatPhoto(pending.file); setPhotoUploadStage('uploading'); const ok = await sendMedia(optimized, 'image', pending.roomId); if (ok) { setPhotoUploadStage('done'); closeChatPhotoPreview() } else setPhotoUploadStage('failed') } catch (error) { setPhotoUploadStage('failed'); notify('ส่งรูปไม่สำเร็จ: ' + (error?.message || 'กรุณาลองอีกครั้ง')) }
    finally { setPhotoSending(false) }
  }
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
  const cameraInput = useRef(null)
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
        if (active && !userReadingHistory.current && stickToBottom.current) { box.scrollTop = box.scrollHeight; setShowLatestButton(false) }
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
      frame = requestAnimationFrame(() => { if (stickToBottom.current && !userReadingHistory.current) box.scrollTop = box.scrollHeight })
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
      const beforeTop = box?.scrollTop || 0
      // Restore the reader's position after React has committed the older messages.
      pendingOlderScroll.current = box ? { roomId, height: before, top: beforeTop } : null
      setMsgs(prev => { const existing = new Set(prev.map(p => p.id)); const incoming = rows.filter(row => !existing.has(row.id)); return incoming.length ? [...incoming, ...prev] : prev })
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
    // Fall back to the layout viewport on browsers without VisualViewport.
    // iOS Safari/PWA changes the *visual* viewport during keyboard animation.
    // Re-read it on focus and orientation changes as well as resize/scroll.
    let frame = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const height = Math.max(1, Math.floor(viewport?.height ?? window.innerHeight))
        const top = Math.max(0, Math.floor(viewport?.offsetTop ?? 0))
        const keyboardOpen = !!viewport && height < window.innerHeight - 100
        setChatViewport(prev => prev?.height === height && prev?.top === top && prev?.keyboardOpen === keyboardOpen
          ? prev : { height, top, keyboardOpen })
      })
    }
    sync()
    viewport?.addEventListener('resize', sync)
    viewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', sync)
    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', sync)
      viewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      document.removeEventListener('focusin', sync)
      document.removeEventListener('focusout', sync)
    }
  }, [roomId])
  const outgoingTyping = useRef(false)
  const outgoingTypingTimer = useRef(null)
  useEffect(() => {
    outgoingTyping.current = false
    lastTypingSent.current = 0
    return () => clearTimeout(outgoingTypingTimer.current)
  }, [roomId])
  const onCompose = (value) => {
    setText(value)
    clearTimeout(outgoingTypingTimer.current)
    const active = !!value.trim()
    const now = Date.now()
    const shouldSend = roomId && (active !== outgoingTyping.current || (active && now - lastTypingSent.current > 1200))
    if (shouldSend) {
      outgoingTyping.current = active
      lastTypingSent.current = now
      typingChannel.current?.send({ type: 'broadcast', event: 'typing', payload: { sender: me, typing: active } }).catch(() => {})
    }
    if (active && roomId) {
      const channel = typingChannel.current
      const targetRoom = roomId
      outgoingTypingTimer.current = setTimeout(() => {
        if (!outgoingTyping.current || targetRoom !== roomId) return
        outgoingTyping.current = false
        channel?.send({ type: 'broadcast', event: 'typing', payload: { sender: me, typing: false } }).catch(() => {})
      }, 1800)
    }
  }
  const sendingGuard = useRef(false)
  const send = async e => {
    e.preventDefault()
    const body = text.trim()
    const targetRoom = roomId
    if (!body || !targetRoom || sendingGuard.current) return
    sendingGuard.current = true
    // Stop the typing indicator immediately when the message is submitted.
    clearTimeout(outgoingTypingTimer.current)
    if (outgoingTyping.current) {
      outgoingTyping.current = false
      typingChannel.current?.send({ type: 'broadcast', event: 'typing', payload: { sender: me, typing: false } }).catch(() => {})
    }
    const tempId = 'pending-' + makeClientId()
    const optimistic = {
      id: tempId, match_id: targetRoom, sender_id: me, body, reply_to: replyTo?.id || null,
      created_at: new Date().toISOString(), pending: true
    }
    pendingSends.current.set(tempId, { roomId: targetRoom, body })
    setText('')
    setReplyTo(null)
    forceNextScroll.current = true
    setMsgs(prev => [...prev, optimistic])
    playNisitSound('send')
    try {
      let payload = { match_id: targetRoom, sender_id: me, body }
      if (replyTo?.id && chatExtrasSupported.current) payload.reply_to = replyTo.id
      // Supabase's abortSignal prevents a timed-out request from lingering.
      const sendController = new AbortController()
      const sendTimeout = setTimeout(() => sendController.abort(), 15000)
      let data, error
      try {
        ;({ data, error } = await supabase.from('messages').insert(payload).select('*').single().abortSignal(sendController.signal))
      } catch (sendError) {
        if (sendController.signal.aborted) throw new Error('send_timeout')
        throw sendError
      } finally {
        clearTimeout(sendTimeout)
      }
      if (sendController.signal.aborted) throw new Error('send_timeout')
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
      notify(error?.message === 'send_timeout'
        ? 'การส่งข้อความใช้เวลานาน กรุณาตรวจสอบแชตก่อนส่งซ้ำ'
        : 'ส่งข้อความไม่สำเร็จ: ' + (error?.message || 'กรุณาลองใหม่'))
    } finally {
      pendingSends.current.delete(tempId)
      sendingGuard.current = false
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
  const mediaSending = useRef(false)
  const sendMedia = async (file, type, targetRoom = roomId) => {
    if (!targetRoom || !file || mediaSending.current) return false
    if (file.size > 10 * 1024 * 1024) return notify('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
    if (type === 'image' && !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return notify('รองรับ JPG, PNG, WebP และ GIF')
    if (type === 'audio' && !['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/x-m4a'].includes(file.type.split(';')[0])) return notify('ไฟล์เสียงไม่รองรับ')
    mediaSending.current = true
    setUploading(true)
    const extension = (file.name?.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg')).replace(/[^a-z0-9]/gi, '').toLowerCase()
    const path = `${targetRoom}/${makeClientId()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type.split(';')[0], upsert: false })
    if (uploadError) { setUploading(false); mediaSending.current = false; notify('อัปโหลดไม่สำเร็จ: ' + uploadError.message); return false }
    const { error } = await supabase.from('messages').insert({ match_id: targetRoom, sender_id: me, body: type === 'image' ? '📷 รูปภาพ' : '🎤 ข้อความเสียง', attachment_type: type, attachment_path: path })
    setUploading(false)
    mediaSending.current = false
    if (error) { await supabase.storage.from('chat-media').remove([path]); notify('ส่งไฟล์ไม่สำเร็จ: ' + error.message); return false }
    if (roomId === targetRoom) { forceNextScroll.current = true; scrollToLatest(true) }
    return true
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
  const report = async () => {
    if (!sel) return
    const categories = ['ข้อความคุกคามหรือไม่เหมาะสม', 'บัญชีปลอมหรือแอบอ้าง', 'สแปมหรือหลอกลวง', 'เนื้อหาทางเพศที่ไม่ยินยอม', 'การข่มขู่หรือความปลอดภัย', 'อื่น ๆ']
    const input = window.prompt('เลือกเหตุผลที่ต้องการรายงาน (พิมพ์หมายเลข 1–6 หรือระบุเหตุผลเอง)\\n' + categories.map((name, index) => (index + 1) + '. ' + name).join('\\n'))
    if (input == null || !input.trim()) return
    const choice = Number(input.trim())
    const reason = (Number.isInteger(choice) && choice >= 1 && choice <= categories.length ? categories[choice - 1] : input.trim()).slice(0, 500)
    const { error } = await supabase.from('reports').insert({ reporter: me, reported: sel.p.id, reason })
    notify(error ? 'ส่งรายงานไม่สำเร็จ กรุณาลองใหม่' : 'ส่งรายงานแล้ว ขอบคุณที่ช่วยดูแลความปลอดภัยของชุมชน')
  }
  return (<>
    {!sel && <Heading kicker="YOUR CONNECTIONS" title="ข้อความ" sub="เลือกคนที่ต้องการพูดคุย" />}
    {sel ? createPortal(<div className={"chat-layout chat-theme-" + chatTheme + " " + (sel ? "chat-room-open chat-fullscreen" : "chat-inbox-open") + (sel && chatViewport?.keyboardOpen ? " chat-keyboard-open" : "")} style={sel && chatViewport ? { "--chat-viewport-height": `${chatViewport.height}px`, "--chat-viewport-top": `${chatViewport.top}px` } : undefined}>
      <div className="chat-list"><div className="chat-list-head nm-inbox-head"><div className="nm-inbox-headline"><span className="nm-inbox-icon"><MessageCircle size={20}/></span><b>แชตของคุณ<small>ทุกการเชื่อมต่อ เริ่มต้นที่นี่ ✨</small></b></div><span className="nm-inbox-count">{matches.length} แชต</span></div>
        {!!hangoutRooms.length && <section className="message-hangout-rooms"><div className="message-hangout-heading"><CalendarDays size={15}/> ห้อง Hangout <span>{hangoutRooms.length}</span></div>{hangoutRooms.map(room => <button type="button" key={room.id} className="message-hangout-room" onClick={() => loadHangoutChat(room)}><span className="message-hangout-room-icon"><Users size={17}/></span><span><b>{room.title}</b><small>{room.venue} · {room.status === "open" ? "เปิดอยู่" : "ปิดแล้ว"}</small></span><MessageCircle size={15}/></button>)}</section>}
        {[...matches].sort((a,b) => new Date(inbox[b.id]?.last?.created_at || b.created_at || 0) - new Date(inbox[a.id]?.last?.created_at || a.created_at || 0)).map(m => {
          const info = inbox[m.id], last = info?.last, unreadCount = info?.unread || 0
          const preview = !last ? 'เริ่มบทสนทนากันเลย' : `${last.sender_id === me ? 'ฉัน : ' : ''}${last.attachment_type === 'image' ? 'ส่งรูปภาพ' : last.attachment_type === 'audio' ? 'ส่งข้อความเสียง' : (last.body || 'ส่งไฟล์')}`
          return <button key={m.id} className={'chat-person ' + (roomId === m.id ? 'selected' : '') + (unreadCount ? ' chat-person-unread' : '')} onClick={() => { setSelectedId(m.id); setInbox(prev => ({ ...prev, [m.id]: { ...prev[m.id], unread: 0 } })) }}><span style={{position:'relative',display:'inline-flex',flexShrink:0}}><Av u={m.p} cls="avatar md" />{onlineMatchIds[m.p?.id] && <span title="ออนไลน์เมื่อสักครู่" aria-label="ออนไลน์เมื่อสักครู่" style={{position:'absolute',right:0,bottom:0,width:12,height:12,borderRadius:'50%',background:'#22c55e',border:'2px solid #15121f'}} />}</span><span className="chat-person-info"><b>{partnerName(m.p)}</b><small className="chat-last-preview">{preview}</small></span>{unreadCount > 0 && <span className="chat-room-unread-count" aria-label={`${unreadCount} ข้อความยังไม่อ่าน`}>{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
        })}
        {!matches.length && <div className="chat-empty nm-inbox-empty"><span className="nm-inbox-empty-icon"><MessageCircle size={27}/></span><b>ยังไม่มีบทสนทนา</b><small>เมื่อคุณ Match กับใคร แชตจะปรากฏตรงนี้ 💗</small></div>}
      </div>
      <div className="chat-window">{sel ? <>
        <div className="chat-header"><button type="button" className="chat-back icon-btn" onClick={() => setSelectedId(null)} aria-label="กลับไปหน้ารายชื่อ"><ArrowRight size={20} style={{transform:"rotate(180deg)"}} /></button><button type="button" className="chat-profile-trigger" onClick={() => onOpenProfile?.(sel.p)} title="ดูโปรไฟล์ รูปทั้งหมด และเพลง" aria-label={`ดูโปรไฟล์ ${partnerName(sel.p)}`}><span style={{position:"relative",display:"inline-flex",flexShrink:0}}><Av u={sel.p} cls="avatar md" />{(partnerOnline || (lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 120000)) && <span role="img" aria-label="ออนไลน์" title="ออนไลน์" style={{position:"absolute",right:0,bottom:0,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #15121f",boxShadow:"0 0 0 1px rgba(34,197,94,.22)"}} />}</span><span><b>{partnerName(sel.p)}</b><small className={partnerTyping ? "chat-presence typing" : partnerOnline ? "chat-presence online" : "chat-presence"}>{partnerTyping ? "กำลังพิมพ์…" : partnerOnline ? "กำลังออนไลน์ในแชต" : lastSeenLabel}</small></span></button><div className="chat-theme-control"><button type="button" className="icon-btn chat-theme-toggle" onClick={() => setThemePickerOpen(v => !v)} title="เปลี่ยนธีมแชต" aria-label="เปลี่ยนธีมแชต" aria-expanded={themePickerOpen}><Palette size={18}/></button></div><button className="icon-btn" onClick={report} title="รายงาน"><Flag size={17}/></button><button className="icon-btn" onClick={block} title="บล็อก"><Ban size={17}/></button></div>
        {openChatImage && <div className="chat-image-lightbox" role="presentation" onClick={() => setOpenChatImage(null)}>
          <div className="chat-image-lightbox-content" role="dialog" aria-modal="true" aria-label="ดูรูปภาพในแชต" onClick={e => e.stopPropagation()}>
            <button type="button" className="chat-image-close" onClick={() => setOpenChatImage(null)} aria-label="ปิดรูปภาพ"><X size={22}/></button>
            <img src={openChatImage} alt="รูปภาพในแชตขนาดใหญ่" decoding="async" />
          </div>
        </div>}
        {themePickerOpen && createPortal(<div className="chat-theme-overlay chat-theme-portal" onClick={() => setThemePickerOpen(false)}>
          <div className="chat-theme-dialog" role="dialog" aria-modal="true" aria-label="เลือกธีมแชต" onClick={e => e.stopPropagation()}>
            <div className="chat-theme-heading">ธีมบทสนทนา <button type="button" onClick={() => setThemePickerOpen(false)} aria-label="ปิด"><X size={18}/></button></div>
            <div className="chat-theme-grid">{CHAT_THEMES.map(t => <button type="button" key={t.id} className={'chat-theme-choice' + (chatTheme === t.id ? ' active' : '')} onClick={() => chooseChatTheme(t.id)} aria-pressed={chatTheme === t.id}><span className="chat-theme-dot" style={{background:t.swatch}} />{t.name}{chatTheme === t.id && <Check size={15}/>}</button>)}</div>
            <small>ธีมนี้แสดงเฉพาะบนอุปกรณ์ของคุณ</small>
          </div>
        </div>, document.body)}

        <div className={"chat-messages" + (messageMenu ? " chat-focus-active" : "")} ref={scrollBox} onClickCapture={e => { if (messageMenu && !e.target.closest(".chat-message-focused")) setMessageMenu(null) }} onTouchMove={() => { if (!stickToBottom.current) userReadingHistory.current = true }} onWheel={() => { if (!stickToBottom.current) userReadingHistory.current = true }} onScroll={e => { const el = e.currentTarget; const distance = el.scrollHeight - el.scrollTop - el.clientHeight; stickToBottom.current = distance < 65; if (distance < 65) userReadingHistory.current = false; setShowLatestButton(previous => previous === (distance > 75) ? previous : distance > 75) }}>
          {hasMore && <button type="button" className="chat-older" disabled={loadingOlder} onClick={() => fetchMessages(true)}>{loadingOlder ? 'กำลังโหลด...' : '↑ ดูข้อความก่อนหน้า'}</button>}
          {msgs.map((m, i) => <React.Fragment key={m.id}>
            {(i === 0 || dateLabel(msgs[i-1].created_at) !== dateLabel(m.created_at)) && <div className="chat-date-divider"><span>{dateLabel(m.created_at)}</span></div>}
            <div className={'message-row ' + (m.sender_id === me ? 'mine' : '') + (m.id === msgs[msgs.length - 1]?.id ? ' latest-message' : '')}>
              {m.sender_id !== me && <Av u={sel.p} cls="avatar sm" />}
              <div className={'message-bubble' + (messageMenu === m.id ? ' chat-message-focused' : '')} onContextMenu={e => { e.preventDefault(); openMessageMenu(m) }} onSelectStart={preventNativeMessageSelect} onDragStart={e => e.preventDefault()} onPointerDown={e => { if (e.pointerType === 'touch' && !e.target.closest('button, audio, input')) e.preventDefault() }} onTouchStart={e => beginMessagePress(e, m)} onTouchEnd={endMessagePress} onTouchCancel={endMessagePress} onTouchMove={moveMessagePress}>
                {m.reply_to && <div className="chat-reply-quote"><Reply size={13}/>{quoteFor(msgs.find(x => x.id === m.reply_to) || {body:'ข้อความก่อนหน้า'})}</div>}
                {m.attachment_type === 'image' && m.attachment_path ? (mediaUrls[m.attachment_path] ? <button type="button" className="chat-image-open" onClick={() => setOpenChatImage(mediaUrls[m.attachment_path])} aria-label="ดูรูปภาพขนาดใหญ่ในแชต"><img className="chat-attachment-image" src={mediaUrls[m.attachment_path]} alt="รูปภาพในแชต" loading="lazy" decoding="async" /></button> : <span>กำลังโหลดรูป...</span>) : m.attachment_type === 'audio' && m.attachment_path ? (mediaUrls[m.attachment_path] ? <VoiceBubble src={mediaUrls[m.attachment_path]} mine={m.sender_id === me} /> : <span>กำลังโหลดเสียง...</span>) : m.body}
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
        {pendingChatPhoto && createPortal(<div role="presentation" onClick={() => { if (!photoSending) closeChatPhotoPreview() }} style={{position:'fixed',inset:0,zIndex:100000,background:'rgba(9,7,18,.94)',display:'flex',alignItems:'center',justifyContent:'center',padding:'max(20px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))'}}>
          <div role="dialog" aria-modal="true" aria-label="ตรวจสอบรูปก่อนส่ง" onClick={e => e.stopPropagation()} style={{width:'100%',maxWidth:460,maxHeight:'100%',display:'flex',flexDirection:'column',gap:16,color:'#fff'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><strong style={{fontSize:18}}>ตรวจสอบรูปก่อนส่ง</strong><button type="button" disabled={photoSending} onClick={closeChatPhotoPreview} aria-label="ปิดพรีวิว" style={{background:'rgba(255,255,255,.12)',color:'#fff',border:0,borderRadius:99,padding:9,display:'flex'}}><X size={21}/></button></div>
            <img src={pendingChatPhoto.url} alt="รูปภาพที่เลือกเพื่อส่ง" style={{display:'block',width:'100%',maxHeight:'min(65dvh,620px)',objectFit:'contain',borderRadius:18,background:'#191423'}} />
            <div style={{fontSize:13,opacity:.7,textAlign:'center'}}>ส่งให้ {partnerName(sel?.p)} · {(pendingChatPhoto.file.size / 1024 / 1024).toFixed(1)} MB</div>
            {photoUploadStage !== 'idle' && <div role="status" style={{fontSize:13,color:photoUploadStage === 'failed' ? '#ffb4c4' : '#d9d0e6',textAlign:'center'}}>{photoUploadStage === 'uploading' ? 'กำลังอัปโหลดรูปภาพ กรุณารอสักครู่…' : photoUploadStage === 'failed' ? 'ส่งไม่สำเร็จ รูปยังอยู่ กดลองส่งอีกครั้งได้' : 'ส่งสำเร็จ'}</div>}
            <div style={{display:'flex',gap:12}}><button type="button" disabled={photoSending} onClick={closeChatPhotoPreview} style={{flex:1,padding:14,borderRadius:14,border:'1px solid rgba(255,255,255,.22)',background:'transparent',color:'#fff',fontWeight:700}}>ยกเลิก</button><button type="button" disabled={photoSending} onClick={confirmChatPhoto} style={{flex:2,padding:14,borderRadius:14,border:0,background:'#ee5b98',color:'#fff',fontWeight:800}}>{photoSending ? 'กำลังส่ง...' : photoUploadStage === 'failed' ? 'ลองส่งอีกครั้ง' : 'ส่งรูปภาพ'} <Send size={16} style={{verticalAlign:'middle'}}/></button></div>
          </div>
        </div>, document.body)}
        <form className="chat-compose" onSubmit={send}>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) previewChatPhoto(f); e.target.value = '' }}/>
          <button type="button" className="chat-media-btn" title="เลือกรูปจากคลัง" aria-label="เลือกรูปจากคลัง" disabled={uploading || recording} onClick={() => fileInput.current?.click()}><ImagePlus size={20}/></button>
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; if (f) previewChatPhoto(f); e.target.value = "" }}/>
          <button type="button" className="chat-media-btn" title="ถ่ายรูปส่งในแชต" aria-label="เปิดกล้องถ่ายรูปส่งในแชต" disabled={uploading || recording} onClick={() => cameraInput.current?.click()}><Camera size={20}/></button>
          {recording ? <div className="voice-recorder" role="status"><span className="record-live"/><span className="record-clock">{Math.floor(recordSeconds/60)}:{String(recordSeconds%60).padStart(2,'0')} / 1:00</span><LiveMicWave stream={micStream}/><button type="button" className="record-cancel" onClick={cancelRecord} aria-label="ยกเลิกการอัดเสียง"><Trash2 size={19}/></button><button type="button" className="record-send" onClick={toggleRecord} aria-label="หยุดและส่งข้อความเสียง"><Send size={18}/></button></div> : <><button type="button" className="chat-media-btn mic-launch" title="อัดข้อความเสียง" disabled={uploading || micBusy} onClick={toggleRecord} aria-label="เริ่มอัดข้อความเสียง"><Mic size={20}/></button><input className="chat-text-input" value={text} onChange={e => onCompose(e.target.value)} onFocus={() => { if (stickToBottom.current) requestAnimationFrame(() => scrollToLatest(false)) }} placeholder="พิมพ์ข้อความ..." aria-label="พิมพ์ข้อความ" maxLength={2000} autoComplete="off"/><button className="send-btn" type="submit" title="ส่งข้อความ" aria-label="ส่งข้อความ" disabled={!text.trim() || uploading}><Send size={19}/></button></>}
        </form>
        {uploading && <div className="chat-upload-status">กำลังอัปโหลดไฟล์...</div>}
      </> : <div className="chat-placeholder"><MessageCircle/><h3>บทสนทนาของคุณ</h3><p>เลือก Match เพื่อเริ่มพูดคุย</p></div>}</div>
    </div>, document.body) : <div className={"chat-layout chat-theme-" + chatTheme + " chat-inbox-open"}>
      <div className="chat-list"><div className="chat-list-head nm-inbox-head"><div className="nm-inbox-headline"><span className="nm-inbox-icon"><MessageCircle size={20}/></span><b>แชตของคุณ<small>ทุกการเชื่อมต่อ เริ่มต้นที่นี่ ✨</small></b></div><span className="nm-inbox-count">{matches.length} แชต</span></div>
        {!!hangoutRooms.length && <section className="message-hangout-rooms"><div className="message-hangout-heading"><CalendarDays size={15}/> ห้อง Hangout <span>{hangoutRooms.length}</span></div>{hangoutRooms.map(room => <button type="button" key={room.id} className="message-hangout-room" onClick={() => loadHangoutChat(room)}><span className="message-hangout-room-icon"><Users size={17}/></span><span><b>{room.title}</b><small>{room.venue} · {room.status === "open" ? "เปิดอยู่" : "ปิดแล้ว"}</small></span><MessageCircle size={15}/></button>)}</section>}
        {[...matches].sort((a,b) => new Date(inbox[b.id]?.last?.created_at || b.created_at || 0) - new Date(inbox[a.id]?.last?.created_at || a.created_at || 0)).map(m => {
          const info = inbox[m.id], last = info?.last, unreadCount = info?.unread || 0
          const preview = !last ? 'เริ่มบทสนทนากันเลย' : `${last.sender_id === me ? 'ฉัน : ' : ''}${last.attachment_type === 'image' ? 'ส่งรูปภาพ' : last.attachment_type === 'audio' ? 'ส่งข้อความเสียง' : (last.body || 'ส่งไฟล์')}`
          return <button key={m.id} className={'chat-person ' + (unreadCount ? 'chat-person-unread' : '')} onClick={() => { setSelectedId(m.id); setInbox(prev => ({ ...prev, [m.id]: { ...prev[m.id], unread: 0 } })) }}><span style={{position:'relative',display:'inline-flex',flexShrink:0}}><Av u={m.p} cls="avatar md" />{onlineMatchIds[m.p?.id] && <span title="ออนไลน์เมื่อสักครู่" aria-label="ออนไลน์เมื่อสักครู่" style={{position:'absolute',right:0,bottom:0,width:12,height:12,borderRadius:'50%',background:'#22c55e',border:'2px solid #15121f'}} />}</span><span className="chat-person-info"><b>{partnerName(m.p)}</b><small className="chat-last-preview">{preview}</small></span>{unreadCount > 0 && <span className="chat-room-unread-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
        })}
        {!matches.length && <div className="chat-empty nm-inbox-empty"><span className="nm-inbox-empty-icon"><MessageCircle size={27}/></span><b>ยังไม่มีบทสนทนา</b><small>เมื่อคุณ Match กับใคร แชตจะปรากฏตรงนี้ 💗</small></div>}
      </div>
    </div>}
    {hangoutChatEvent && createPortal(<div className="hangout-overlay nm-message-hangout-overlay" style={{top:'var(--nm-visual-top, 0px)',height:'var(--nm-visual-height, 100dvh)'}} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) { setHangoutChatEvent(null); try { sessionStorage.removeItem(`nisit-active-hangout-chat:${me}`) } catch {} } }}><section className="hangout-chat-modal nm-message-hangout-chat" role="dialog" aria-modal="true" aria-label={`แชทกลุ่ม ${hangoutChatEvent.title}`}><header><div className="hangout-chat-header-main"><b><Users size={18}/> {hangoutChatEvent.title}</b><div className="hangout-member-chips" aria-label="สมาชิกในห้อง">{hangoutChatMembers.map(id => <button type="button" key={id} className="hangout-member-chip" onClick={() => openHangoutMemberProfile(id)} title={`ดูโปรไฟล์ ${hangoutChatNames[id] || 'สมาชิก'}`}><Av u={hangoutChatProfiles[id] || {id, display_name: hangoutChatNames[id] || (id === me ? 'คุณ' : 'สมาชิก')}} cls="hangout-member-avatar"/><span>{id === me ? 'คุณ' : (hangoutChatNames[id] || 'สมาชิก')}</span></button>)}</div><small>{hangoutChatEvent.venue}</small></div><button type="button" className="icon-btn" onClick={() => { setHangoutChatEvent(null); try { sessionStorage.removeItem(`nisit-active-hangout-chat:${me}`) } catch {} }} aria-label="ปิดแชท"><X size={20}/></button></header><div ref={hangoutChatListRef} onScroll={e=>{const el=e.currentTarget;hangoutChatStickBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<100}} className="hangout-chat-messages nm-message-hangout-list">{hangoutChatMessages.length ? hangoutChatMessages.map(m => <div key={m.id} className={'hangout-chat-bubble'+(m.user_id===me?' mine':'')}><button type="button" className="hangout-message-sender" onClick={() => openHangoutMemberProfile(m.user_id)}>{m.user_id===me ? 'คุณ' : (hangoutChatNames[m.user_id] || 'กำลังโหลดชื่อ…')}</button>{m.attachment_type === 'image' && m.attachment_path ? (hangoutMediaUrls[m.attachment_path] ? <img className="hangout-chat-image" src={hangoutMediaUrls[m.attachment_path]} alt="รูปภาพในแชทกลุ่ม" loading="lazy" decoding="async" onClick={() => window.open(hangoutMediaUrls[m.attachment_path], '_blank', 'noopener,noreferrer')} /> : <p>กำลังโหลดรูปภาพ…</p>) : m.attachment_type === 'audio' && m.attachment_path ? (hangoutMediaUrls[m.attachment_path] ? <VoiceBubble src={hangoutMediaUrls[m.attachment_path]} mine={m.user_id===me} /> : <p>กำลังโหลดเสียง…</p>) : <p>{m.body}</p>}<time>{new Date(m.created_at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</time>{m.user_id===me && hangoutReadersFor(m.id).length>0 && <div className="hangout-read-receipts"><CheckCheck size={13}/><span>อ่านแล้ว</span>{hangoutReadersFor(m.id).slice(0,4).map(reader => <button type="button" key={reader.id} onClick={() => openHangoutMemberProfile(reader.id)} title={`ดูโปรไฟล์ ${reader.display_name}`}>{reader.display_name}</button>)}{hangoutReadersFor(m.id).length>4 && <span>+{hangoutReadersFor(m.id).length-4}</span>}</div>}</div>) : <div className="hangout-chat-empty"><MessageCircle size={25}/><b>เริ่มคุยกับคนในนัดนี้</b><span>ชื่อผู้ส่งจะแสดงเหนือข้อความ</span></div>}</div>{Object.entries(hangoutTyping).some(([, until]) => until > Date.now()) && <div className="hangout-typing-indicator" aria-live="polite"><span>{Object.entries(hangoutTyping).filter(([, until]) => until > Date.now()).slice(0,2).map(([id]) => hangoutChatNames[id] || "สมาชิก").join(", ")} กำลังพิมพ์</span><span className="hangout-typing-dots"><i/><i/><i/></span></div>}{hangoutChatEvent.status !== 'open' && <div className="hangout-closed-notice">ห้องนี้ปิดแล้ว · ไม่สามารถส่งข้อความเพิ่มได้</div>}{hangoutChatEvent.status === 'open' ? <form className="hangout-chat-compose" onSubmit={sendHangoutChat}>
          <input ref={hangoutFileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e=>{const f=e.target.files?.[0];if(f)sendHangoutMedia(f,'image');e.target.value=''}} />
          <button type="button" className="hangout-compose-media" title="ส่งรูปภาพ" disabled={hangoutUploading||hangoutRecording} onClick={()=>hangoutFileInput.current?.click()} aria-label="ส่งรูปภาพ"><ImagePlus size={19}/></button>
          {hangoutRecording ? <div className="hangout-recording-bar"><span className="record-live"/><LiveMicWave stream={hangoutMicStream}/><button type="button" className="record-cancel" onClick={cancelHangoutRecord} aria-label="ยกเลิกการอัดเสียง"><Trash2 size={18}/></button><button type="button" className="record-send" onClick={toggleHangoutRecord} aria-label="หยุดและส่งเสียง"><Send size={18}/></button></div> : <><button type="button" className="hangout-compose-media" title="อัดข้อความเสียง" disabled={hangoutUploading||hangoutMicBusy} onClick={toggleHangoutRecord} aria-label="อัดข้อความเสียง"><Mic size={19}/></button><input value={hangoutChatDraft} onChange={e=>onHangoutDraftChange(e.target.value)} onFocus={()=>{hangoutChatStickBottom.current=hangoutChatListRef.current ? hangoutChatListRef.current.scrollHeight-hangoutChatListRef.current.scrollTop-hangoutChatListRef.current.clientHeight<100 : true}} placeholder="พิมพ์ข้อความถึงสมาชิก..." aria-label="พิมพ์ข้อความแชทกลุ่ม" maxLength={1500} autoComplete="off"/><button type="submit" disabled={hangoutChatBusy||hangoutUploading||!hangoutChatDraft.trim()} aria-label="ส่งข้อความ"><Send size={18}/></button></>}
        </form> : null}{hangoutUploading && <div className="chat-upload-status">กำลังอัปโหลดไฟล์...</div>}</section></div>, document.body)}
  </>)
}

function Notifs({ me, refresh, go }) {
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('all')
  const [markError, setMarkError] = useState('')
  const notificationLoadVersion = useRef(0)
  const load = useCallback(async () => {
    const requestVersion = ++notificationLoadVersion.current
    setLoadError('')
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', me).in('type', ['interest', 'match', 'hangout_message']).order('created_at', { ascending: false }).limit(50)
      if (requestVersion !== notificationLoadVersion.current) return
      if (!error) setRows(data || [])
      else { setRows([]); setLoadError('โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่') }
    } catch (error) {
      if (requestVersion === notificationLoadVersion.current) {
        console.warn('Notification center load failed:', error)
        setRows([])
        setLoadError('โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่')
      }
    }
  }, [me])
  useEffect(() => {
    let active = true
    load()
    const channel = supabase.channel('notification-center-' + me)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + me }, () => { if (active && document.visibilityState === 'visible') load() })
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; notificationLoadVersion.current++; document.removeEventListener('visibilitychange', onVisible); supabase.removeChannel(channel) }
  }, [load, me])
  const visibleRows = (rows || []).filter(n => filter === 'all' || (filter === 'unread' ? !n.read : n.type === filter))
  const allRead = rows !== null && rows.every(n => n.read)
  const readAll = async () => {
    if (busy || allRead) return
    setBusy(true)
    setMarkError('')
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', me).in('type', ['interest', 'match', 'hangout_message']).eq('read', false)
    if (!error) { setRows(prev => prev?.map(n => ({ ...n, read: true })) || []); refresh() }
    else setMarkError('ทำเครื่องหมายอ่านทั้งหมดไม่สำเร็จ กรุณาลองใหม่')
    setBusy(false)
  }
  return (<>
    <Heading kicker="STAY IN THE LOOP" title="การแจ้งเตือน" sub="ติดตามคนที่สนใจคุณ การแมตช์ และข้อความใหม่ในห้อง Hangout"><button className="btn btn-ghost" disabled={busy || rows === null || allRead} onClick={readAll}><Check size={16} /> {allRead ? 'อ่านทั้งหมดแล้ว' : busy ? 'กำลังบันทึก...' : 'อ่านทั้งหมด'}</button></Heading>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}} role="group" aria-label="กรองการแจ้งเตือน">{[['all','ทั้งหมด'],['unread','ยังไม่อ่าน'],['match','แมตช์'],['interest','ถูกใจ'],['hangout_message','Hangout']].map(([value,label])=><button key={value} type="button" className={'btn '+(filter===value?'btn-primary':'btn-ghost')} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
    {markError && <p role="alert">{markError}</p>}
    {loadError && <div role="alert" style={{padding:14,marginBottom:12}}>{loadError} <button type="button" className="btn btn-ghost" onClick={load}>ลองใหม่</button></div>}
    {rows === null ? <div className="page-center"><span className="spin" /></div> : !visibleRows.length ? <div className="empty-state"><div className="empty-icon"><Bell /></div><h3>ยังไม่มีการแจ้งเตือน</h3><p>เมื่อมีคนสนใจคุณ แมตช์ใหม่ หรือข้อความในห้อง Hangout จะขึ้นที่นี่</p></div> :
      <div className="notif-list">{visibleRows.map((n, index) => <React.Fragment key={n.id}>{(index === 0 || new Date(visibleRows[index - 1].created_at).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" }) !== new Date(n.created_at).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })) && <div className="nm-notif-date-heading">{new Date(n.created_at).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "long", year: "numeric" })}</div>}<div className={'notif-row ' + (n.read ? '' : 'unread')} onClick={async () => {
        if (!n.read) {
          const { error } = await supabase.from('notifications').update({ read: true }).eq('id', n.id).eq('user_id', me)
          if (!error) { setRows(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); refresh() }
        }
        if (n.type === 'hangout_message' && n.ref_id) { try { sessionStorage.setItem(`nisit-pending-hangout-chat:${me}`, n.ref_id) } catch {} }
        go(['match', 'hangout_message'].includes(n.type) ? 'messages' : 'home')
      }}>
        <span className="settings-icon">{n.type === 'hangout_message' ? <Users /> : <Heart />}</span><div><b>{n.type === 'match' ? 'คุณได้รับการแมตช์แล้ว!' : n.type === 'hangout_message' ? 'มีข้อความใหม่ในห้อง Hangout' : 'มีคนกำลังสนใจคุณอยู่'}</b><small>{new Date(n.created_at).toLocaleString('th-TH')}</small></div></div></React.Fragment>)}</div>}
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
  const eqRef = useRef(null)
  const waveformRef = useRef(null)
  const [waveformAvailable, setWaveformAvailable] = useState(false)
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
  const safeUrl = url => /^https:\/\//i.test(url || '') ? url : ''
  const preview = safeUrl(track?.preview)
  const [resolvedPreview, setResolvedPreview] = useState(preview)
  const [previewError, setPreviewError] = useState(false)
  // Decode a separate copy of the preview. Never attach MediaElementSource to
  // the playback element: Apple's cross-origin streams can become silent.
  // When CORS disallows reading the preview, do not fabricate audio levels.
  useEffect(() => {
    waveformRef.current = null
    setWaveformAvailable(false)
    const url = resolvedPreview
    if (!url) return
    let active = true
    const controller = new AbortController()
    const load = async () => {
      let ctx
      try {
        const response = await fetch(url, { mode: 'cors', signal: controller.signal })
        if (!response.ok) return
        const bytes = await response.arrayBuffer()
        if (!active || bytes.byteLength > 5_000_000) return
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        ctx = new AudioCtx()
        const decoded = await ctx.decodeAudioData(bytes)
        if (!active) return
        const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i))
        const windowsPerSecond = 24
        const count = Math.ceil(decoded.duration * windowsPerSecond)
        const levels = new Float32Array(count * 12)
        const samplesPerWindow = decoded.sampleRate / windowsPerSecond
        for (let windowIndex = 0; windowIndex < count; windowIndex++) {
          const begin = Math.floor(windowIndex * samplesPerWindow)
          const end = Math.min(decoded.length, Math.floor((windowIndex + 1) * samplesPerWindow))
          for (let bar = 0; bar < 12; bar++) {
            let sum = 0
            let n = 0
            // Each bar reads a different interleaved slice of the real PCM
            // samples, creating a varied display without synthetic oscillators.
            for (let sample = begin + bar; sample < end; sample += 12) {
              for (const channel of channels) { const v = channel[sample]; sum += v * v; n++ }
            }
            levels[windowIndex * 12 + bar] = n ? Math.sqrt(sum / n) : 0
          }
        }
        let peak = 0
        for (const level of levels) if (level > peak) peak = level
        if (peak <= 0) return
        waveformRef.current = { levels, windowsPerSecond, peak }
        setWaveformAvailable(true)
      } catch { /* CORS-protected preview: preserve normal audio playback. */ }
      finally { if (ctx) ctx.close().catch(() => {}) }
    }
    load()
    return () => { active = false; controller.abort() }
  }, [resolvedPreview])
  useEffect(() => {
    const bars = eqRef.current?.querySelectorAll('i')
    if (!bars?.length) return
    const reset = () => bars.forEach(bar => { bar.style.transform = 'scaleY(.25)' })
    if (!playing || !waveformAvailable) { reset(); return }
    let frameId = 0
    const tick = () => {
      const waveform = waveformRef.current
      const audio = audioRef.current
      if (waveform && audio && !audio.paused) {
        const frame = Math.min(Math.floor(audio.currentTime * waveform.windowsPerSecond), waveform.levels.length / 12 - 1)
        // A short stagger creates a left-to-right travelling waveform.
        // Every bar still follows real decoded audio, sampled at a slightly
        // earlier playback position instead of moving all bars in lockstep.
        for (let bar = 0; bar < bars.length; bar++) {
          const delayedTime = Math.max(0, audio.currentTime - bar * 0.055)
          const delayedFrame = Math.min(Math.floor(delayedTime * waveform.windowsPerSecond), waveform.levels.length / 12 - 1)
          const rms = waveform.levels[Math.max(0, delayedFrame) * 12 + bar] || 0
          const height = Math.min(1, Math.max(.12, Math.sqrt(rms / waveform.peak)))
          bars[bar].style.transform = 'scaleY(' + height.toFixed(3) + ')'
        }
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frameId); reset() }
  }, [playing, waveformAvailable])
  useEffect(() => {
    setResolvedPreview(preview)
    setPreviewError(false)
  }, [track?.id, preview])
  useEffect(() => {
    if (preview || !track?.id) return
    let active = true
    const controller = new AbortController()
    fetch('https://itunes.apple.com/lookup?' + new URLSearchParams({ id: String(track.id), entity: 'song', country: 'TH' }), { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Music lookup failed'); return r.json() })
      .then(data => { if (active) setResolvedPreview(safeUrl(data?.results?.find(x => x.previewUrl)?.previewUrl)) })
      .catch(() => {})
    return () => { active = false; controller.abort() }
  }, [track?.id, preview])
  useEffect(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    setPlaying(false); setPosition(0); setDuration(30)
  }, [track?.id, preview])
  // Stop preview when the app is backgrounded, navigated away from,
  // or when a swipe card is removed. Avoid unexpected PWA background audio.
  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.visibilityState === 'hidden') audioRef.current?.pause()
    }
    const stopOnNavigation = () => audioRef.current?.pause()
    document.addEventListener('visibilitychange', stopWhenHidden)
    window.addEventListener('pagehide', stopOnNavigation)
    window.addEventListener('popstate', stopOnNavigation)
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden)
      window.removeEventListener('pagehide', stopOnNavigation)
      window.removeEventListener('popstate', stopOnNavigation)
    }
  }, [])
  useEffect(() => () => { audioRef.current?.pause() }, [])
  if (!track?.id) return null
  const formatTime = n => { const v = Math.floor(Number.isFinite(n) ? n : 0); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` }
  const toggle = async () => {
    const audio = audioRef.current
    if (!audio || !resolvedPreview) return
    if (audio.paused) {
      // Stop another song preview if the user starts a different card.
      document.querySelectorAll('.itunes-song-card audio').forEach(other => { if (other !== audio) other.pause() })
      try { await audio.play() } catch { setPlaying(false); setPreviewError(true) }
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
        {safeUrl(track.image) ? <img className="itunes-premium-cover" src={safeUrl(track.image).replace(/100x100bb/, '300x300bb')} alt={'ปกเพลง ' + track.name} loading="lazy" decoding="async" /> : <span className="itunes-premium-cover itunes-premium-cover-empty"><Music2 size={24}/></span>}
        <div className="itunes-premium-art-shine" aria-hidden="true" />
      </div>
      <div className="itunes-premium-copy">
        <div className="itunes-premium-eyebrow">เพลงในโปรไฟล์</div>
        <strong title={track.name}>{track.name}</strong>
        <span title={track.artist}>{track.artist}</span>
        <div className="itunes-premium-eq" ref={eqRef} aria-label={playing ? 'กำลังเล่นเพลง' : 'ตัวอย่างเพลง'}>{Array.from({length: 12}, (_, i) => <i key={i} style={{animationDelay: `-${(i * 0.113).toFixed(3)}s`, animationDuration: `${0.58 + (i % 5) * 0.13}s`}} />)}</div>
      </div>
      <button className={'itunes-premium-play music-smooth-toggle' + (playing ? ' music-smooth-toggle--playing' : '')} type="button" onClick={toggle} disabled={!resolvedPreview} aria-pressed={playing} aria-label={playing ? 'หยุดเพลงชั่วคราว' : 'เล่นตัวอย่างเพลง'} title={resolvedPreview ? (playing ? 'Pause' : 'Play preview') : 'เพลงนี้ไม่มีตัวอย่าง'}><span className="music-smooth-icon music-smooth-icon--play" aria-hidden="true"><Play size={15} strokeWidth={2.6} fill="currentColor" /></span><span className="music-smooth-icon music-smooth-icon--pause" aria-hidden="true"><Pause size={15} strokeWidth={2.6} fill="currentColor" /></span></button>
    </div>
    {resolvedPreview && <div className="itunes-premium-timeline">
      <span>{formatTime(position)}</span>
      <input className={seeking ? "music-seek-active" : ""} type="range" min="0" max="100" step="0.1" value={progress} onPointerDown={startSeek} onPointerUp={endSeek} onPointerCancel={endSeek} onBlur={endSeek} onChange={seek} style={{'--progress': `${progress}%`}} aria-label="เลื่อนตำแหน่งเพลง" />
      <span>{formatTime(duration)}</span>
    </div>}
    {previewError && <small className="itunes-preview-error">ไม่สามารถโหลดตัวอย่างเพลงได้ในขณะนี้ ลองใหม่อีกครั้ง</small>}
    {!compact && <div className="itunes-premium-footer"><span>♫ เพลงที่บอกความเป็นฉัน</span>{safeUrl(track.url) && <a href={safeUrl(track.url)} target="_blank" rel="noopener noreferrer">Apple Music ↗</a>}</div>}
    {resolvedPreview && <audio ref={audioRef} src={resolvedPreview} preload="metadata" playsInline onPlay={() => { setPlaying(true); setPreviewError(false) }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPosition(0) }} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)} onError={() => { setPlaying(false); setPreviewError(true) }} onLoadedMetadata={e => { const d=e.currentTarget.duration; if(Number.isFinite(d) && d>0) setDuration(d) }} />}
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
      {track.image ? <img src={track.image} alt="" loading="lazy" decoding="async"/> : <span className="itunes-result-placeholder"><Music2 size={20}/></span>}
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
const INTENT_DESCRIPTIONS = { serious: 'อยากสร้างความสัมพันธ์ที่มั่นคง', getting_to_know: 'เริ่มจากคุยกัน แล้วปล่อยให้เป็นไป', friends: 'หาเพื่อนใหม่ที่คุยกันถูกคอ', unsure: 'เปิดใจให้ทุกความเป็นไปได้' }
function RelationshipVibe({ intent }) {
  const item = RELATIONSHIP_INTENTS.find(x => x.id === intent)
  if (!item) return null
  const Icon = { serious: Heart, getting_to_know: MessageCircle, friends: Users, unsure: Sparkles }[intent] || Heart
  return <div className={'nm-vibe-card nm-vibe-' + intent}><span className="nm-vibe-icon"><Icon size={21} strokeWidth={1.9}/></span><span className="nm-vibe-copy"><small>กำลังมองหา</small><strong>{item.label}</strong><span>{INTENT_DESCRIPTIONS[intent]}</span></span><span className="nm-vibe-accent" aria-hidden="true" /></div>
}
const initialProfileForm = p => ({ display_name: p?.display_name || '', birth_date: p?.birth_date || '', gender: p?.gender || 'other', uni: p?.university_id || '', campus: p?.campus || '', faculty: p?.faculty || FACULTIES[0], major: p?.major || '', bio: p?.bio || '', interests: p?.interests || [], relationship_intent: p?.relationship_intent || '' })

function AccountEmailVerification({ user, notify }) {
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [rewardBusy, setRewardBusy] = useState(false)
  const [rewardEnds, setRewardEnds] = useState('')
  const [cooldown, setCooldown] = useState(0)
  useEffect(() => {
    let active = true
    supabase.from('account_email_verifications').select('email').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => { if (active) { if (!error) setVerified(data?.email?.toLowerCase() === user.email?.toLowerCase()); setLoading(false) } })
      .catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id, user.email])
  useEffect(() => {
    let active = true
    supabase.from('account_email_premium_rewards').select('claimed_at').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (active) setRewardClaimed(Boolean(data)) }).catch(() => {})
    return () => { active = false }
  }, [user.id])
  const claimReward = async () => {
    if (rewardBusy || rewardClaimed || !verified) return
    setRewardBusy(true)
    try {
      const { data, error } = await supabase.rpc('claim_account_email_premium')
      if (error) throw error
      if (data?.claimed) {
        setRewardClaimed(true)
        setRewardEnds(data.ends_at || '')
        notify('รับ Premium ฟรี 3 วันสำเร็จแล้ว!')
      } else if (data?.reason === 'already_claimed') {
        setRewardClaimed(true)
        notify('บัญชีนี้เคยรับ Premium ฟรี 3 วันแล้ว')
      }
    } catch (error) { notify('รับสิทธิ์ไม่สำเร็จ: ' + error.message) }
    finally { setRewardBusy(false) }
  }
  useEffect(() => {
    if (!cooldown) return
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown > 0])
  const request = async action => {
    if (busy || (action === 'send' && cooldown)) return
    if (action === 'verify' && !/^\d{6}$/.test(code)) return notify('กรุณากรอกรหัส OTP 6 หลัก')
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('account-email-otp', { body: { action, ...(action === 'verify' ? { code } : {}) } })
      if (error) {
        const payload = await error.context?.json?.().catch(() => null)
        throw new Error(payload?.error || error.message)
      }
      if (data?.error) throw new Error(data.error)
      if (data?.verified) { setVerified(true); notify('ยืนยันอีเมลบัญชีสำเร็จแล้ว'); return }
      if (action === 'send') { setSent(true); setCooldown(60); notify('ส่ง OTP ไปยังอีเมลบัญชีแล้ว') }
    } catch (error) { notify(error.message || 'ดำเนินการไม่สำเร็จ') }
    finally { setBusy(false) }
  }
  return <section className="nm-account-otp-card" aria-label="ยืนยันอีเมลบัญชี">
    <div className="nm-account-otp-heading"><ShieldCheck size={24}/><div><span className="theme-kicker">ACCOUNT SECURITY</span><h3>ยืนยันอีเมลบัญชี</h3><p>แยกจากการยืนยันอีเมลมหาวิทยาลัย</p></div></div>
    <div className="nm-account-otp-address">{user.email || 'ไม่พบอีเมลบัญชี'}</div>
    {loading ? <p>กำลังตรวจสอบสถานะ...</p> : verified ? <div className="nm-account-otp-reward"><p className="nm-account-otp-success"><Check size={17}/> ยืนยันอีเมลบัญชีเรียบร้อยแล้ว</p><div className="nm-account-otp-gift"><Crown size={21}/><div><strong>Premium ฟรี 3 วัน</strong><small>{rewardClaimed ? 'คุณรับสิทธิ์นี้ไปแล้ว (รับได้ครั้งเดียว)' : 'ของขวัญสำหรับบัญชีที่ยืนยันอีเมลแล้ว'}</small></div></div><button type="button" className="btn btn-pink btn-full" disabled={rewardBusy || rewardClaimed} onClick={claimReward}>{rewardClaimed ? 'รับสิทธิ์แล้ว' : rewardBusy ? 'กำลังรับสิทธิ์...' : 'รับ Premium ฟรี 3 วัน'}</button>{rewardEnds && <small>Premium หมดอายุ: {new Date(rewardEnds).toLocaleString('th-TH')}</small>}</div> : <>
      <p>คุณสามารถใช้งาน NISIT MATCH ได้ก่อน แล้วกลับมายืนยันอีเมลภายหลังได้</p>
      {sent && <label>รหัส OTP 6 หลัก<input inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}/></label>}
      <div className="nm-account-otp-actions">
        {sent && <button type="button" className="btn btn-pink" disabled={busy || code.length !== 6} onClick={() => request('verify')}>{busy ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP'}</button>}
        <button type="button" className="btn btn-pink nm-account-otp-send" disabled={busy || cooldown > 0} onClick={() => request('send')}>{cooldown ? 'ขอรหัสใหม่ใน ' + cooldown + ' วินาที' : sent ? 'ส่งรหัสใหม่' : 'ส่งรหัสยืนยันอีเมล'}</button>
      </div>
    </>}
  </section>
}

function ProfilePage({ user, profile, onSaved, notify, onboarding, ownerPremium = false, initialEditTab = 'photos' }) {
  const [profileEmailVerified, setProfileEmailVerified] = useState(false)
  const [profileVerificationLoaded, setProfileVerificationLoaded] = useState(false)
  const [verifiedUniversityId, setVerifiedUniversityId] = useState('')
  useEffect(() => {
    let alive = true
    setProfileVerificationLoaded(false)
    supabase.from('student_verifications').select('status,university_id').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (!error) {
          const verified = data?.status === 'verified'
          setProfileEmailVerified(verified)
          setVerifiedUniversityId(verified ? (data?.university_id || '') : '')
          if (verified && data?.university_id) setF(old => ({ ...old, uni: data.university_id }))
        }
        setProfileVerificationLoaded(true)
      })
      .catch(() => { if (alive) setProfileVerificationLoaded(true) })
    return () => { alive = false }
  }, [user.id])
  useEffect(() => {
    let active = true
    // Paint the profile first; fetch secondary video metadata after the first frame.
    const timer = window.setTimeout(() => {
      supabase.from('profile_media').select('id,media_type,storage_path,created_at').eq('profile_id', user.id).order('created_at', { ascending: true })
        .then(({ data, error }) => { if (active && !error) setProfileVideos(data || []) })
        .catch(() => {})
    }, 120)
    return () => { active = false; window.clearTimeout(timer) }
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
  const [profileVideos, setProfileVideos] = useState([])
  const [newVideos, setNewVideos] = useState([])
  const [mainPhoto, setMainPhoto] = useState(profile?.avatar_path || '')
  const [photoOrder, setPhotoOrder] = useState(() => Array.isArray(profile?.media_order) ? profile.media_order : [])
  const draggingPhoto = useRef(null)
  const holdTimer = useRef(null)
  const [activeDragKey, setActiveDragKey] = useState(null)
  const [dragOffset, setDragOffset] = useState({x:0,y:0})
  const dragOrigin = useRef(null)
  const photoKeys = [...photos, ...newPhotos.map(x => x.key), ...profileVideos.map(x => x.id), ...newVideos.map(x => x.key)]
  const orderedKeys = useMemo(() => {
    const orderIndex = new Map(photoOrder.map((key, index) => [key, index]))
    const fallback = photoOrder.length
    return [...photoKeys].sort((a, b) => (orderIndex.get(a) ?? (fallback + photoKeys.indexOf(a))) - (orderIndex.get(b) ?? (fallback + photoKeys.indexOf(b))))
  }, [photos, newPhotos, profileVideos, newVideos, photoOrder])
  const reorderPhoto = (from, to) => {
    if (!from || !to || from === to || !photoKeys.includes(from) || !photoKeys.includes(to)) return
    const next = [...orderedKeys]
    const fromIndex = next.indexOf(from)
    const toIndex = next.indexOf(to)
    ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
    setPhotoOrder(next); setMainPhoto(next[0])
  }
  const releasePhoto = e => {
    clearTimeout(holdTimer.current)
    if (draggingPhoto.current) {
      const tiles = [...document.querySelectorAll('[data-photo-key]')].filter(el => el.dataset.photoKey !== draggingPhoto.current)
      const hit = tiles.find(el => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom })
      if (hit) reorderPhoto(draggingPhoto.current, hit.dataset.photoKey)
    }
    draggingPhoto.current = null
    dragOrigin.current = null
    setDragOffset({x:0,y:0})
    setActiveDragKey(null)
  }
  const movePhotoToFront = key => {
    if (!photoKeys.includes(key)) return
    const next = [key, ...orderedKeys.filter(x => x !== key)]
    setPhotoOrder(next)
    setMainPhoto(key)
  }
  const [uniQuery, setUniQuery] = useState(''), [uniType, setUniType] = useState('ทั้งหมด')
  const [editTab, setEditTab] = useState(initialEditTab)
  const [selfPreviewOpen, setSelfPreviewOpen] = useState(false)
  const [selfPreviewIndex, setSelfPreviewIndex] = useState(0)
  const aboutTabs = [['basic', 'ข้อมูลส่วนตัว', UserRound], ['campus', 'การศึกษา', GraduationCap], ['interests', 'ความสนใจ', Heart], ['music', 'เพลงโปรด', Music2]]
  const [aboutMenuOpen, setAboutMenuOpen] = useState(initialEditTab === 'campus' || ['basic', 'interests', 'music'].includes(initialEditTab))
  const selectEditTab = (tab) => { if (tab !== editTab) playNisitSound('menu'); setEditTab(tab) }
  // Restore a draft before any autosave runs; never overwrite a saved draft with initial values.
  useEffect(() => {
    let alive = true
    let idleId = null
    let fallbackTimer = null
    setDraftReady(false)
    const restoreDraft = () => draftAction(user.id, 'read').then(d => {
      if (!alive) return
      if (d && d.version === 1) {
        if (d.f) setF(d.f)
        if (Array.isArray(d.photos)) setPhotos(d.photos)
        if (d.song !== undefined) setSong(d.song)
        if (Array.isArray(d.newPhotos)) setNewPhotos(d.newPhotos.filter(x => x.file instanceof Blob).map(x => ({ ...x, url: URL.createObjectURL(x.file) })))
        if (typeof d.mainPhoto === 'string') setMainPhoto(d.mainPhoto)
        if (Array.isArray(d.photoOrder) && d.photoOrder.length) setPhotoOrder(d.photoOrder)
      }
      setDraftReady(true)
    }).catch(err => { console.warn('Draft restore unavailable:', err); if (alive) setDraftReady(true) })
    // Let the profile screen paint before reading large photo/video drafts from IndexedDB.
    if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(restoreDraft, { timeout: 1200 })
    else fallbackTimer = window.setTimeout(restoreDraft, 90)
    return () => {
      alive = false
      if (idleId !== null) window.cancelIdleCallback(idleId)
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer)
    }
  }, [user.id])
  useEffect(() => {
    if (!draftReady) return
    const revision = ++draftRevision.current
    const timer = setTimeout(() => {
      if (skipDraftSave.current || revision !== draftRevision.current) return
      draftAction(user.id, 'write', { version: 1, f, photos, mainPhoto, photoOrder, song,
        newPhotos: newPhotos.map(({ key, file }) => ({ key, file }))
      }).catch(err => console.warn('Draft autosave unavailable:', err))
    }, 350)
    return () => clearTimeout(timer)
  }, [draftReady, user.id, f, photos, mainPhoto, photoOrder, song, newPhotos])
  // Release preview URLs when the editor unmounts.
  const photoUrls = useRef([])
  useEffect(() => { photoUrls.current = newPhotos.map(p => p.url) }, [newPhotos])
  useEffect(() => () => photoUrls.current.forEach(url => URL.revokeObjectURL(url)), [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const filteredUniversities = UNIVERSITIES.filter((u) => (uniType === 'ทั้งหมด' || u.type === uniType) && u.name.toLowerCase().includes(uniQuery.trim().toLowerCase()))
  const previewKey = orderedKeys[0] || ''
  const preview = newPhotos.find(x => x.key === previewKey)?.url || pub(previewKey) || ph(f.display_name)
  const appendCropped = (file) => {
    const key = `new-${makeClientId()}`
    const item = { key, file, url: URL.createObjectURL(file) }
    setNewPhotos(old => [...old, item])
    if (!mainPhoto && photos.length === 0 && newPhotos.length === 0) setMainPhoto(key)
    setCropQueue(q => q.slice(1))
  }
  // รูปและวิดีโอใช้พื้นที่แกลเลอรีร่วมกันได้สูงสุด 6 รายการ
  const mediaSlotCount = photos.length + newPhotos.length + cropQueue.length + profileVideos.length + newVideos.length
  const addMedia = files => {
    const incoming = Array.from(files || [])
    if (!incoming.length) return
    const extOf = file => (file.name.split('.').pop() || '').toLowerCase()
    const isHeic = file => /^(heic|heif)$/.test(extOf(file)) || /image\/(heic|heif)/i.test(file.type)
    const isVideo = file => file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|quicktime)$/i.test(file.name)
    const isImage = file => file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i.test(file.name)
    const videos = incoming.filter(isVideo)
    const heics = incoming.filter(isHeic)
    // iPhone Live Photos commonly arrive as a still image plus a paired .MOV.
    // The MOV carries the motion and is the reliable browser-playable representation;
    // don't upload the HEIC as a broken static image in browsers without HEIC decoding.
    const base = file => file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[-_ ](edited|edit|1)$/,'')
    const pairedHeics = heics.filter(still => videos.some(video => base(video) === base(still)))
    const images = incoming.filter(isImage).filter(file => !heics.includes(file))
    const standaloneHeics = heics.filter(file => !pairedHeics.includes(file))
    const requestedSlots = images.length + videos.length + standaloneHeics.length
    const unsupported = incoming.filter(file => !isVideo(file) && !isImage(file) && !isHeic(file))
    const slots = Math.max(0, 6 - mediaSlotCount)
    if (requestedSlots > slots) notify(`เพิ่มสื่อได้อีก ${slots} รายการ (รวมสูงสุด 6 รายการ)`)
    // Prefer the paired MOV when a Live Photo pair is selected; it represents one gallery item.
    const acceptedVideos = videos.slice(0, Math.max(0, slots - Math.min(images.length, slots)))
    const acceptedImages = [...images, ...standaloneHeics].slice(0, Math.max(0, slots - acceptedVideos.length))
    const validImages = acceptedImages.filter(file => file.size <= 10 * 1024 * 1024)
    const validVideos = acceptedVideos.filter(file => file.size <= 25 * 1024 * 1024)
    if (validImages.length !== acceptedImages.length) notify('รูปภาพต้องมีขนาดไม่เกิน 10MB')
    if (validVideos.length !== acceptedVideos.length) notify('วิดีโอ/Live Photo ต้องมีขนาดไม่เกิน 25MB ต่อไฟล์')
    if (standaloneHeics.length) notify('กำลังเพิ่มรูป HEIC จาก iPhone หากรูปไม่แสดงตัวอย่าง ให้เลือกตัวเลือก Most Compatible ใน iPhone หรือแปลงเป็น JPEG')
    if (unsupported.length) notify('มีไฟล์ที่ไม่รองรับบางรายการ · ใช้ JPG/PNG/WebP หรือวิดีโอ MP4/MOV/M4V/WebM')
    if (pairedHeics.length) notify(`ตรวจพบ Live Photo จาก iPhone ${pairedHeics.length} ชุด · ใช้ไฟล์ MOV ให้เล่นวนอัตโนมัติ`)
    // Batch-select photos: add every selected image immediately instead of opening
    // a separate crop dialog for each file. The existing editor can still reorder
    // photos and choose the main image after import.
    if (validImages.length) {
      const additions = validImages.map(file => ({ key: `new-${makeClientId()}`, file, url: URL.createObjectURL(file) }))
      setNewPhotos(old => [...old, ...additions])
      if (!mainPhoto && photos.length === 0 && newPhotos.length === 0) setMainPhoto(additions[0].key)
      notify(`เพิ่มรูปภาพ ${additions.length} รูปแล้ว · กดบันทึกเพื่อยืนยัน`)
    }
    setNewVideos(old => [...old, ...validVideos.map(file => ({ key: `video-${makeClientId()}`, file, url: URL.createObjectURL(file), livePhoto: pairedHeics.some(still => base(still) === base(file)) }))])
  }
  const removeNewVideo = key => setNewVideos(old => old.filter(item => { if (item.key === key) URL.revokeObjectURL(item.url); return item.key !== key }))
  const removeExistingVideo = async item => {
    const { error } = await supabase.from('profile_media').delete().eq('id', item.id).eq('profile_id', user.id)
    if (error) return notify('ลบวิดีโอไม่สำเร็จ: ' + error.message)
    setProfileVideos(old => old.filter(x => x.id !== item.id))
    await supabase.storage.from('profile-media').remove([item.storage_path])
    notify('ลบวิดีโอแล้ว')
  }
  const removePhoto = (key) => {
    if (photos.length + newPhotos.length <= 1) return notify('ต้องมีรูปโปรไฟล์อย่างน้อย 1 รูป กรุณาเพิ่มรูปใหม่ก่อนลบรูปสุดท้าย')
    const remaining = [...photos.filter(x => x !== key), ...newPhotos.filter(x => x.key !== key).map(x => x.key)]
    setPhotos(old => old.filter(x => x !== key)); setNewPhotos(old => old.filter(x => x.key !== key))
    if (mainPhoto === key) setMainPhoto(remaining[0] || '')
  }
  const save = async (e) => {
    e.preventDefault()
    if (!profileVerificationLoaded) return notify('กำลังตรวจสอบสถานะอีเมลมหาวิทยาลัย กรุณารอสักครู่')
    const lockedUniversityId = profileEmailVerified && verifiedUniversityId ? verifiedUniversityId : ''
    const u = UNIVERSITIES.find((x) => x.id === (lockedUniversityId || f.uni))
    if (photos.length + newPhotos.length === 0) { setEditTab('photos'); return notify('กรุณาเพิ่มรูปโปรไฟล์อย่างน้อย 1 รูปก่อนบันทึก') }
    if (!f.display_name.trim()) { setEditTab('basic'); return notify('กรุณากรอกชื่อที่อยากให้เรียก') }
    if (!u) { setEditTab('campus'); return notify('กรุณาเลือกมหาวิทยาลัยจากรายการ') }
    if (!f.birth_date || ageOf(f.birth_date) < 18) { setEditTab('basic'); return notify('ต้องมีอายุอย่างน้อย 18 ปี') }
    if (!f.faculty?.trim()) { setEditTab('campus'); return notify('กรุณาเลือกคณะ') }
    if (UNIVERSITY_CAMPUSES[lockedUniversityId || u.id] && !UNIVERSITY_CAMPUSES[lockedUniversityId || u.id].some(c => c.id === f.campus)) { setEditTab('campus'); return notify('กรุณาเลือกวิทยาเขต') }
    if (busy) return
    setBusy(true)
    const previousPhotos = [...new Set([profile?.avatar_path, ...(profile?.photo_paths || [])].filter(Boolean))]
    const newlyUploadedPaths = []
    const rollbackNewUploads = async () => {
      if (newlyUploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from('avatars').remove(newlyUploadedPaths)
        if (cleanupError) console.warn('Could not clean up unsuccessful photo uploads:', cleanupError)
      }
    }
    const uploaded = [...photos]
    const keyMap = {}
    for (const item of newPhotos) {
      const uploadFile = await optimizeProfilePhoto(item.file)
      const ext = uploadFile.type === 'image/jpeg' ? 'jpg' : uploadFile.type === 'image/webp' ? 'webp' : uploadFile.type === 'image/png' ? 'png' : (uploadFile.name.split('.').pop()?.toLowerCase() || 'jpg')
      const path = `${user.id}/photo-optimized-${makeClientId()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, uploadFile, { contentType: uploadFile.type || item.file.type, upsert: false, cacheControl: '31536000' })
      if (uploadError) { await rollbackNewUploads(); setBusy(false); return notify(`อัปโหลดรูปไม่สำเร็จ: ${uploadError.message}`) }
      newlyUploadedPaths.push(path)
      const thumb = await createSwipeThumbnail(uploadFile)
      const thumbPath = swipeThumbPath(path)
      if (thumb && thumbPath) {
        const { error: thumbError } = await supabase.storage.from('avatars').upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' })
        if (!thumbError) newlyUploadedPaths.push(thumbPath)
      }
      uploaded.push(path); keyMap[item.key] = path
    }
    const photo_paths = [...new Set(orderedKeys.map(key => keyMap[key] || key).filter(key => uploaded.includes(key)))].slice(0, 6)
    const avatar_path = photo_paths[0] || null
    const payload = { media_order: orderedKeys.map(key => keyMap[key] || key), display_name: f.display_name.trim(), birth_date: f.birth_date, gender: f.gender, university_id: (lockedUniversityId || u.id), campus: UNIVERSITY_CAMPUSES[lockedUniversityId || u.id] ? f.campus : null, faculty: f.faculty.trim(), major: f.major, bio: f.bio, interests: f.interests, relationship_intent: f.relationship_intent || null, avatar_path, photo_paths, itunes_track_id: song?.id || null, itunes_track_name: song?.name || null, itunes_track_artist: song?.artist || null, itunes_track_image: song?.image || null, itunes_track_preview: song?.preview || null, itunes_track_url: song?.url || null }
    const { error } = profile?.id
      ? await supabase.from('profiles').update(payload).eq('id', user.id).select('id').single()
      : await supabase.from('profiles').insert({ id: user.id, ...payload }).select('id').single()
    if (error) { await rollbackNewUploads(); setBusy(false); return notify(error.code === '23503' ? 'ไม่พบมหาวิทยาลัยในฐานข้อมูล กรุณารันไฟล์ supabase/sync_universities.sql ก่อน' : 'บันทึกไม่สำเร็จ: ' + error.message) }
    for (const item of newVideos) {
      const ext = (item.file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${user.id}/clip-${makeClientId()}.${ext}`
      const { error: videoUploadError } = await supabase.storage.from('profile-media').upload(path, item.file, { contentType: item.file.type || ({mov:'video/quicktime',mp4:'video/mp4',m4v:'video/x-m4v',webm:'video/webm'}[ext] || 'application/octet-stream'), upsert: false })
      if (videoUploadError) { setBusy(false); return notify(`อัปโหลดวิดีโอไม่สำเร็จ: ${videoUploadError.message} · ตรวจว่ารัน SQL v76 แล้ว`) }
      const { data: mediaRow, error: mediaError } = await supabase.from('profile_media').insert({ profile_id: user.id, media_type: 'video', storage_path: path }).select('id,media_type,storage_path,created_at').single()
      if (mediaError) { setBusy(false); return notify(`บันทึกวิดีโอไม่สำเร็จ: ${mediaError.message}`) }
      setProfileVideos(old => [...old, mediaRow]); keyMap[item.key] = mediaRow.id
    }
    const savedMediaOrder = orderedKeys.map(key => keyMap[key] || key)
    const { error: mediaOrderError } = await supabase.from('profiles').update({ media_order: savedMediaOrder }).eq('id', user.id)
    if (mediaOrderError) { setBusy(false); return notify('บันทึกลำดับสื่อไม่สำเร็จ: ' + mediaOrderError.message) }
    setBusy(false)
    skipDraftSave.current = true
    draftRevision.current++
    await draftAction(user.id, 'delete').catch(err => console.warn('Draft cleanup unavailable:', err))
    // Only remove paths that belonged to this user and are no longer referenced by
    // the committed profile. Never remove paths still used by the saved profile.
    const retiredPaths = previousPhotos.filter(path =>
      typeof path === 'string' &&
      path.startsWith(user.id + '/') &&
      !photo_paths.includes(path)
    )
    if (retiredPaths.length) {
      const { error: cleanupError } = await supabase.storage.from('avatars').remove(retiredPaths)
      if (cleanupError) console.warn('Old profile photos could not be removed:', cleanupError)
    }
    setPhotos(photo_paths); setPhotoOrder(orderedKeys.map(key => keyMap[key] || key)); setNewPhotos([]); newVideos.forEach(item => URL.revokeObjectURL(item.url)); setNewVideos([]); setMainPhoto(avatar_path || '')
    notify('บันทึกมหาวิทยาลัย คณะ และโปรไฟล์สำเร็จแล้ว'); await onSaved()
  }
  const toggle = (i) => setF({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i].slice(0, 12) })
  const selfPreviewPhotos = [...photos.map(path => ({ key: path, url: pub(path), type: 'image' })), ...newPhotos.map(item => ({ key: item.key, url: item.url, type: 'image' })), ...profileVideos.map(item => ({ key: item.id, url: mediaPub(item.storage_path), type: 'video' })), ...newVideos.map(item => ({ key: item.key, url: item.url, type: 'video' }))]
  const orderedSelfPhotos = orderedKeys.map(key => selfPreviewPhotos.find(item => item.key === key)).filter(Boolean)
  const selfPreviewImage = orderedSelfPhotos[selfPreviewIndex]?.url || ph(f.display_name)
  const selfPreviewCurrent = orderedSelfPhotos[selfPreviewIndex]
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
      <nav className="nm-edit-tabs nm-edit-tabs-grouped" aria-label="หมวดแก้ไขโปรไฟล์">
        <button type="button" className={editTab === 'photos' ? 'active' : ''} aria-current={editTab === 'photos' ? 'page' : undefined} onClick={() => { setAboutMenuOpen(false); selectEditTab('photos') }}><Camera size={18}/><span>รูปและวิดีโอ</span></button>
        <button type="button" className={aboutTabs.some(([id]) => id === editTab) ? 'active' : ''} aria-expanded={aboutMenuOpen} aria-controls="nm-about-profile-tabs" onClick={() => { playNisitSound('menu'); setAboutMenuOpen(v => !v); if (!aboutTabs.some(([id]) => id === editTab)) selectEditTab('basic') }}><UserRound size={18}/><span>เกี่ยวกับฉัน</span><ChevronDown size={16} className={aboutMenuOpen ? 'nm-chevron-open' : ''}/></button>
        {aboutMenuOpen && <div id="nm-about-profile-tabs" className="nm-edit-subtabs">{aboutTabs.map(([id, name, Icon]) => <button key={id} type="button" className={editTab === id ? 'active' : ''} aria-current={editTab === id ? 'page' : undefined} onClick={() => selectEditTab(id)}><Icon size={16}/><span>{name}</span></button>)}</div>}
        {!aboutMenuOpen && <>
        <div className="nm-edit-nav-separator"/>
        <div className="nm-edit-category-label">บัญชีและความปลอดภัย</div>
        <button type="button" className={editTab === 'account-email' ? 'active' : ''} aria-current={editTab === 'account-email' ? 'page' : undefined} onClick={() => selectEditTab('account-email')}><ShieldCheck size={18}/><span>ยืนยันอีเมลบัญชี</span></button>
        <button type="button" className={editTab === 'verification' ? 'active' : ''} aria-current={editTab === 'verification' ? 'page' : undefined} onClick={() => selectEditTab('verification')}><GraduationCap size={18}/><span>ยืนยันอีเมลมหาวิทยาลัย</span></button>
        </>}
      </nav>
      <div className="nm-edit-workspace">
      {editTab === 'account-email' && <AccountEmailVerification user={user} notify={notify} />}
      {editTab === 'verification' && <CampusEmailVerification user={user} />}
      {editTab === 'photos' && <section className="nm-edit-photo-page" role="tabpanel"><div className="nm-photo-hero"><img src={preview} alt="ตัวอย่างรูปหลัก" decoding="async"/><div><span className="theme-kicker">PROFILE PHOTOS</span><h2>จัดการรูปโปรไฟล์</h2><p>ลากรูปเพื่อเปลี่ยนลำดับ · รูปแรกเป็นรูปหลักอัตโนมัติ</p></div></div>
        <div className="photo-editor"><b>รูปและวิดีโอโปรไฟล์ ({mediaSlotCount}/6)</b><p>รูปแรกเป็นรูปหลักเสมอ · แตะรูปแล้วลากไปยังตำแหน่งที่ต้องการ</p><div className="photo-grid">{orderedKeys.map(key => { const fresh = newPhotos.find(x => x.key === key); if (fresh) return {...fresh, type: "image"}; const existingVideo = profileVideos.find(x => x.id === key); if (existingVideo) return {key, url: mediaPub(existingVideo.storage_path), type: "video", existing: existingVideo}; const newVideo = newVideos.find(x => x.key === key); if (newVideo) return {...newVideo, type: "video"}; return {key, url: pub(key), type: "image"} }).map(item => <div className={"photo-tile v83-media-tile" + (activeDragKey === item.key ? " is-reordering" : "")} style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", cursor: "grab", opacity: activeDragKey === item.key ? 0.9 : 1, transform: activeDragKey === item.key ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.06)` : undefined, zIndex: activeDragKey === item.key ? 30 : undefined, position: "relative", transition: activeDragKey === item.key ? "none" : "transform 160ms ease", boxShadow: activeDragKey === item.key ? "0 12px 30px rgba(0,0,0,.45)" : undefined }} key={item.key} data-photo-key={item.key} draggable={true} onDragStart={e => { draggingPhoto.current = item.key; e.dataTransfer.effectAllowed = "move" }} onDragOver={e => { e.preventDefault() }} onDrop={e => { e.preventDefault(); reorderPhoto(draggingPhoto.current, item.key); draggingPhoto.current = null }} onDragEnd={() => { draggingPhoto.current = null; dragOrigin.current = null; setDragOffset({x:0,y:0}); setActiveDragKey(null) }} onPointerDown={e => { if (e.pointerType === "mouse" || e.target.closest("button")) return; e.preventDefault(); draggingPhoto.current = item.key; dragOrigin.current = {x:e.clientX,y:e.clientY}; setDragOffset({x:0,y:0}); setActiveDragKey(item.key); e.currentTarget.setPointerCapture(e.pointerId) }} onPointerMove={e => { if (!dragOrigin.current || draggingPhoto.current !== item.key) return; e.preventDefault(); setDragOffset({x:e.clientX-dragOrigin.current.x,y:e.clientY-dragOrigin.current.y}) }} onPointerUp={releasePhoto} onPointerCancel={() => { clearTimeout(holdTimer.current); draggingPhoto.current = null; dragOrigin.current = null; setDragOffset({x:0,y:0}); setActiveDragKey(null) }}>{item.type === 'video' ? <video src={item.url} muted playsInline loop autoPlay preload="metadata" aria-label="วิดีโอโปรไฟล์" draggable={false} style={{pointerEvents:"none"}}/> : <img src={item.url} alt="รูปโปรไฟล์" loading="lazy" decoding="async" draggable={false} onContextMenu={e => e.preventDefault()} style={{userSelect:"none",WebkitUserSelect:"none",WebkitTouchCallout:"none",pointerEvents:"none"}} onError={e => { if (/\.(heic|heif)(?:$|\?)/i.test(item.url)) e.currentTarget.alt = 'ไฟล์ HEIC อาจต้องเลือกส่งเป็นวิดีโอ Live Photo หรือแปลงเป็น JPG'; }} />}{item.type === 'image' && orderedKeys[0] === item.key && <span className="photo-main selected" title="รูปหลัก" aria-label="รูปหลัก" style={{pointerEvents:"none",display:"grid",placeItems:"center",width:27,height:27,padding:0,borderRadius:"50%",background:"linear-gradient(135deg,#a855f7,#6d28d9)",color:"#fff",boxShadow:"0 3px 10px rgba(0,0,0,.35)",border:"1px solid rgba(255,255,255,.35)",fontSize:16,lineHeight:1}}>✦</span>}{item.type === 'video' ? <button type="button" className="photo-remove" style={{display:"grid",placeItems:"center",width:28,height:28,borderRadius:"50%",background:"rgba(18,14,29,.82)",color:"#fff",border:"1px solid rgba(255,255,255,.28)",fontSize:19,lineHeight:1,boxShadow:"0 3px 10px rgba(0,0,0,.3)"}} aria-label="ลบวิดีโอ" onClick={() => item.existing ? removeExistingVideo(item.existing) : removeNewVideo(item.key)} title="ลบวิดีโอ">×</button> : <button type="button" className="photo-remove" style={{display:"grid",placeItems:"center",width:28,height:28,borderRadius:"50%",background:"rgba(18,14,29,.82)",color:"#fff",border:"1px solid rgba(255,255,255,.28)",fontSize:19,lineHeight:1,boxShadow:"0 3px 10px rgba(0,0,0,.3)"}} aria-label="ลบรูป" onClick={() => removePhoto(item.key)} title="ลบรูป">×</button>}</div>)}{mediaSlotCount < 6 && <label className="photo-add v83-media-add"><Camera size={21}/><Video size={20}/><span>เลือกหลายรูป / วิดีโอ</span><input type="file" accept="image/*,video/*,.heic,.heif" multiple onChange={e => {addMedia(e.target.files); e.target.value = ''}} /></label>}</div><small className="v83-media-note">รองรับรูปและวิดีโอรวม 6 รายการ · iPhone Live Photo: ตัวเลือกไฟล์บนเว็บอาจส่งมาเฉพาะภาพนิ่งและไม่เปิดให้เว็บดึง MOV คู่กันอัตโนมัติ ให้เปิดรูปใน Photos → Share → Save as Video แล้วอัปโหลดวิดีโอที่ได้ · วิดีโอ MOV/MP4 จะเล่นวนอัตโนมัติเมื่อเปิดดูรายการนั้น (ปิดเสียง)</small></div>
      </section>}
      <form className="form-panel nm-tab-form" onSubmit={save} noValidate>
        {editTab === 'basic' && <div className="panel-heading"><div><h2>ข้อมูลส่วนตัว</h2><p>อัปเดตข้อมูลให้เป็นปัจจุบันอยู่เสมอ</p></div><span className="edit-badge">EDIT PROFILE</span></div>}
        {editTab === 'basic' && <>
        <label>ชื่อที่อยากให้เรียก<input required maxLength={40} value={f.display_name} onChange={set('display_name')} /></label>
        <div className="nm-intent-editor nm-intent-editor-fresh"><div className="nm-intent-heading"><span className="nm-intent-kicker"><Sparkles size={14}/> YOUR VIBE</span><strong>ตอนนี้มองหาความสัมพันธ์แบบไหน?</strong><p>เลือกความสัมพันธ์ที่ใช่สำหรับคุณ เปลี่ยนได้เสมอนะ</p></div><div className="nm-intent-options">{RELATIONSHIP_INTENTS.map((item, index) => <button type="button" key={item.id} style={{'--intent-index':index}} className={'intent-' + item.id + (f.relationship_intent === item.id ? ' selected' : '')} aria-pressed={f.relationship_intent === item.id} onClick={() => { playNisitSound('menu'); setF(old => ({ ...old, relationship_intent: old.relationship_intent === item.id ? '' : item.id })) }}><span className="nm-intent-emoji nm-intent-symbol" aria-hidden="true">{[<Heart size={19}/>,<MessageCircle size={19}/>,<Sparkles size={19}/>,<HeartHandshake size={19}/>][index]}</span><span className="nm-intent-label">{item.label}</span><span className="nm-intent-check" aria-hidden="true">{f.relationship_intent === item.id ? '✓' : '＋'}</span></button>)}</div></div>
        <div className="form-row"><label>วันเกิด (ต้องอายุ 18+)<input type="date" required value={f.birth_date} onChange={set('birth_date')} /></label><label>เพศ<select value={f.gender} onChange={set('gender')}>{Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div>
        </>}
        {editTab === 'campus' && <>
        <section className="choice-section" aria-label="เลือกมหาวิทยาลัย">
          <div className="choice-heading"><div><span className="choice-step">STEP 01 · CAMPUS</span><h3>เรียนอยู่ที่ไหน? <span>✦</span></h3><p>เลือกมหาวิทยาลัยเพื่อเจอคนในคอมมูนิตี้เดียวกัน</p></div><span className="choice-count">{UNIVERSITIES.length}+ สถาบัน</span></div>
          {profileEmailVerified ? <div className="nm-campus-lock-card"><span className="nm-campus-lock-icon"><ShieldCheck size={18}/></span><span><b>{uniName(verifiedUniversityId || f.uni)}</b><small>{studentTerm(verifiedUniversityId || f.uni)}ยืนยันแล้ว · ล็อกมหาวิทยาลัยกับบัญชีนี้</small></span><span className="nm-campus-lock-status">LOCKED</span><p>เพื่อป้องกันการสวมสิทธิ์ มหาวิทยาลัยจะเปลี่ยนไม่ได้หลังยืนยันอีเมล หากข้อมูลไม่ถูกต้องให้ติดต่อผู้ดูแล</p></div> : <>
          <button type="button" className={'nm-campus-unspecified' + (f.uni === 'unspecified' ? ' selected' : '')} aria-pressed={f.uni === 'unspecified'} onClick={() => setF(old => ({...old,uni:'unspecified',campus:'',faculty:'ไม่ระบุ',major:''}))}><span className="nm-campus-unspecified-icon"><GraduationCap size={19}/></span><span><b>ไม่ระบุสถานศึกษา</b><small>ยังไม่ต้องการแสดงข้อมูลการศึกษาในโปรไฟล์</small></span>{f.uni === 'unspecified' ? <Check size={18}/> : <ArrowRight size={17}/>}</button>
          <div className="uni-search"><Search size={17}/><input aria-label="ค้นหามหาวิทยาลัย" placeholder="พิมพ์ชื่อมหาวิทยาลัย..." value={uniQuery} onChange={(e) => setUniQuery(e.target.value)} /><span>{filteredUniversities.length} รายการ</span></div>
          <div className="choice-tabs">{['ทั้งหมด','รัฐ','เอกชน','ทหารและตำรวจ'].map((t) => <button type="button" key={t} className={uniType === t ? 'active' : ''} onClick={() => setUniType(t)}>{t === 'ทั้งหมด' ? 'ทุกสถาบัน' : t === 'รัฐ' ? 'มหาวิทยาลัยรัฐ' : t === 'เอกชน' ? 'มหาวิทยาลัยเอกชน' : 'ทหารและตำรวจ'}</button>)}</div>
          <div className="university-grid">{filteredUniversities.map((u) => <button type="button" key={u.id} className={'university-option ' + (f.uni === u.id ? 'selected' : '')} onClick={() => setF(old => ({ ...old, uni: u.id, campus: u.id === old.uni ? old.campus : '' }))}><span className="uni-symbol"><GraduationCap size={19}/></span><span className="uni-option-copy"><b>{u.name}</b><small>{u.type || 'สถาบันอุดมศึกษา'}</small></span><span className="uni-check">{f.uni === u.id ? <Check size={16}/> : <ArrowRight size={14}/>}</span></button>)}</div>
          {!filteredUniversities.length && <div className="choice-empty">ไม่พบชื่อมหาวิทยาลัย ลองค้นหาด้วยคำสั้น ๆ อีกครั้ง</div>}
          {!f.uni && <small className="choice-hint">เลือกมหาวิทยาลัย 1 แห่งเพื่อไปต่อ</small>}
          {f.uni && <div className="selected-campus"><Check size={15}/> เลือกแล้ว: <b>{uniName(f.uni)}</b></div>}
          </>}
          {!!UNIVERSITY_CAMPUSES[profileEmailVerified ? (verifiedUniversityId || f.uni) : f.uni] && <div className="nm-ku-campus-picker"><div className="choice-heading"><div><span className="choice-step">STEP 01.5 · YOUR CAMPUS</span><h3>วิทยาเขตของคุณ <span>✦</span></h3><p>เลือกวิทยาเขตที่กำลังศึกษาอยู่</p></div></div><div className="nm-campus-option-grid">{(UNIVERSITY_CAMPUSES[profileEmailVerified ? (verifiedUniversityId || f.uni) : f.uni] || []).map(c => <button type="button" key={c.id} className={"university-option nm-campus-option" + (f.campus === c.id ? " selected" : "")} aria-pressed={f.campus === c.id} onClick={() => setF(old => ({ ...old, campus: c.id }))}><span className="uni-symbol"><MapPin size={19}/></span><span className="uni-option-copy"><b>{c.name}</b><small>วิทยาเขต</small></span><span className="uni-check">{f.campus === c.id ? <Check size={16}/> : <ArrowRight size={14}/>}</span></button>)}</div>{f.campus && <div className="selected-campus"><Check size={15}/> เลือกแล้ว: <b>{(UNIVERSITY_CAMPUSES[profileEmailVerified ? (verifiedUniversityId || f.uni) : f.uni] || []).find(c => c.id === f.campus)?.name}</b></div>}</div>}
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
        <div className="detail-gallery v58-swipe-gallery" onTouchStart={e => { selfTouchStart.current = e.touches[0]?.clientX ?? null }} onTouchEnd={e => { if (selfTouchStart.current === null || orderedSelfPhotos.length < 2) return; const diff = (e.changedTouches[0]?.clientX ?? selfTouchStart.current) - selfTouchStart.current; selfTouchStart.current = null; if (Math.abs(diff) > 45) setSelfPreviewIndex(i => (i + (diff < 0 ? 1 : orderedSelfPhotos.length - 1)) % orderedSelfPhotos.length) }}>{selfPreviewCurrent?.type === 'video' ? <TapSoundVideo key={selfPreviewCurrent.key} className="detail-cover v64-photo-fade" src={selfPreviewCurrent.url} label="วิดีโอโปรไฟล์ของฉัน"/> : <img key={selfPreviewImage} className="detail-cover v64-photo-fade" src={selfPreviewImage} alt="รูปโปรไฟล์ของฉัน" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ph(f.display_name) }}/>}
          {orderedSelfPhotos.length > 1 && <><button type="button" className="gallery-prev" onClick={() => setSelfPreviewIndex(i => (i - 1 + orderedSelfPhotos.length) % orderedSelfPhotos.length)} aria-label="สื่อก่อนหน้า">‹</button><button type="button" className="gallery-next" onClick={() => setSelfPreviewIndex(i => (i + 1) % orderedSelfPhotos.length)} aria-label="สื่อถัดไป">›</button><div className="gallery-thumbnails">{orderedSelfPhotos.map((item,i) => <button type="button" key={item.key} className={i === selfPreviewIndex ? 'active' : ''} onClick={() => setSelfPreviewIndex(i)} aria-label={`ดูสื่อที่ ${i+1}`}>{item.type === 'video' ? <span className="v76-video-thumb"><Video size={18}/></span> : <img src={item.url} alt="" loading="lazy" decoding="async"/>}</button>)}</div></>}
        </div>
        <div className="detail-body"><div className="section-kicker">YOUR PROFILE PREVIEW</div><h2>{f.display_name || 'ชื่อของคุณ'}{ageOf(f.birth_date) ? `, ${ageOf(f.birth_date)}` : ''}</h2>{ownerPremium && <PremiumProfileBadge owner />}
          <p><GraduationCap size={15}/>{universityWithCampus({university_id:f.uni,campus:f.campus}) || 'มหาวิทยาลัย'}{f.faculty ? ` · ${f.faculty}` : ''}</p>
          {profileEmailVerified && <CampusVerifiedBadge universityId={verifiedUniversityId || f.uni}/>}
          {f.relationship_intent && <RelationshipVibe intent={f.relationship_intent} />}
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
const SOUND_SETTING_KEY = 'nisit-match-sound-v1'
const SOUND_VOLUME_KEY = 'nisit-match-sound-volume-v1'
const soundVolume = () => { try { const saved = Number(localStorage.getItem(SOUND_VOLUME_KEY)); return Number.isFinite(saved) ? Math.min(1, Math.max(0, (saved - 0.4) / 1.4)) : 0.6 } catch { return 0.6 } }
const soundEnabled = () => { try { return localStorage.getItem(SOUND_SETTING_KEY) !== 'off' } catch { return true } }
let nmAudioContext = null
let nmLastSound = 0
function playNisitSound(kind) {
  if (!soundEnabled() || typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    if (!nmAudioContext || nmAudioContext.state === 'closed') nmAudioContext = new AudioCtx()
    const ctx = nmAudioContext
    if (ctx.state !== 'running') { ctx.resume().catch(() => {}); return }
    const now = performance.now()
    if (now - nmLastSound < 95) return
    nmLastSound = now
    // Small, gentle two-note cues. No noise buffers or per-button listeners.
    const notes = {
      menu: [[560,.07,.015,0]],
      send: [[650,.09,.024,0],[880,.12,.014,.055]],
      like: [[520,.12,.035,0],[780,.18,.023,.085]],
      message: [[784,.15,.027,0],[988,.19,.018,.07]],
      match: [[523,.22,.037,0],[659,.24,.034,.12],[784,.32,.029,.25]],
      super: [[587,.12,.033,0],[880,.18,.028,.09],[1175,.25,.02,.2]],
      skip: [[390,.09,.016,0]]
    }[kind] || [[560,.07,.015,0]]
    for (const [frequency,duration,volume,delay] of notes) {
      const osc = ctx.createOscillator(), gain = ctx.createGain()
      const t = ctx.currentTime + .012 + delay
      osc.type = 'sine'; osc.frequency.setValueAtTime(frequency,t)
      gain.gain.setValueAtTime(.0001,t)
      gain.gain.exponentialRampToValueAtTime(Math.min(.35, volume * (0.12 + soundVolume() * 8)),t+.015)
      gain.gain.exponentialRampToValueAtTime(.0001,t+duration)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t); osc.stop(t+duration+.015)
      osc.onended = () => { osc.disconnect(); gain.disconnect() }
    }
  } catch { /* Audio is optional */ }
}
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


// Student mailbox domains checked against official university IT/email pages.
// Mailbox access verifies control of an institutional mailbox, not enrollment status by itself.
const VERIFIED_CAMPUS_DOMAINS = {
  kku: { name: 'มหาวิทยาลัยขอนแก่น', domains: ['kkumail.com', 'i.kku.ac.th'] },
  mahasarakham: { name: 'มหาวิทยาลัยมหาสารคาม', domains: ['msu.ac.th'] },
  kmitl: { name: 'สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง', domains: ['kmitl.ac.th'] },
  catc: { name: 'สถาบันการบินพลเรือน', domains: ['students.catc.or.th'] },
  ku: { name: 'มหาวิทยาลัยเกษตรศาสตร์', domains: ['ku.th', 'live.ku.th'] },
  chula: { name: 'จุฬาลงกรณ์มหาวิทยาลัย', domains: ['student.chula.ac.th'] },
  tu: { name: 'มหาวิทยาลัยธรรมศาสตร์', domains: ['dome.tu.ac.th'] },
  kmutt: { name: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี', domains: ['mail.kmutt.ac.th'] },
  kmutnb: { name: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ', domains: ['email.kmutnb.ac.th'] },
  buu: { name: 'มหาวิทยาลัยบูรพา', domains: ['go.buu.ac.th', 'my.buu.ac.th'] },
  swu: { name: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', domains: ['g.swu.ac.th'] },
  su: { name: 'มหาวิทยาลัยศิลปากร', domains: ['su.ac.th', 'silpakorn.edu'] },
  cra: { name: 'ราชวิทยาลัยจุฬาภรณ์', domains: ['edu.cra.ac.th'] },
  spu: { name: 'มหาวิทยาลัยศรีปทุม', domains: ['spumail.net', 'spulive.net'] },
  bu: { name: 'มหาวิทยาลัยกรุงเทพ', domains: ['bumail.net'] },
  rangsit: { name: 'มหาวิทยาลัยรังสิต', domains: ['rsu.ac.th'] },
  siam: { name: 'มหาวิทยาลัยสยาม', domains: ['siam.edu'] },
  nbu: { name: 'มหาวิทยาลัยนอร์ทกรุงเทพ', domains: ['northbkk.ac.th'] },
  rmutk: { name: 'มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ', domains: ['mail.rmutk.ac.th'] },
  rmutt: { name: 'มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี', domains: ['mail.rmutt.ac.th'] },
  nu: { name: 'มหาวิทยาลัยนเรศวร', domains: ['nu.ac.th'] },
  dusit: { name: 'มหาวิทยาลัยสวนดุสิต', domains: ['mail.dusit.ac.th', 'suandusit.ac.th'] },
  abac: { name: 'มหาวิทยาลัยอัสสัมชัญ', domains: ['au.edu'] },
  cmu: { name: 'มหาวิทยาลัยเชียงใหม่', domains: ['cmu.ac.th'] },
  cmru: { name: 'มหาวิทยาลัยราชภัฏเชียงใหม่', domains: ['cmru.ac.th'] },
  rmuti: { name: 'มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน', domains: ['rmuti.ac.th'] },
  utcc: { name: 'มหาวิทยาลัยหอการค้าไทย', domains: ['live4utcc.ac.th'] },
  up: { name: 'มหาวิทยาลัยพะเยา', domains: ['up.ac.th'] },
  mu: { name: 'มหาวิทยาลัยมหิดล', domains: ['mu.ac.th', 'student.mahidol.edu'] },
  mfu: { name: 'มหาวิทยาลัยแม่ฟ้าหลวง', domains: ['mfu.ac.th', 'lamduan.mfu.ac.th'] },
  nmu: { name: 'มหาวิทยาลัยนวมินทราธิราช', domains: ['nmu.ac.th'] },
  ssru: { name: 'มหาวิทยาลัยราชภัฏสวนสุนันทา', domains: ['ssru.ac.th'] },
  huachiew: { name: 'มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ', domains: ['hcu.ac.th', 'live.hcu.ac.th', 'student.hcu.ac.th'] },
  ru: { name: 'มหาวิทยาลัยรามคำแหง', domains: ['rumail.ru.ac.th'] },
  mju: { name: 'มหาวิทยาลัยแม่โจ้', domains: ['mju.ac.th'] },
  dpu: { name: 'มหาวิทยาลัยธุรกิจบัณฑิตย์', domains: ['dpu.ac.th'] },
  npru: { name: 'มหาวิทยาลัยราชภัฏนครปฐม', domains: ['webmail.npru.ac.th'] },
  rmutto: { name: 'มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก', domains: ['rmutto.ac.th'] },
}

function CampusEmailVerification({ user }) {
  const [verification, setVerification] = useState(null)
  const [campusEmail, setCampusEmail] = useState('')
  const [campusCode, setCampusCode] = useState('')
  const [campusUniversity, setCampusUniversity] = useState('')
  const [campusSearch, setCampusSearch] = useState('')
  const [campusPickerOpen, setCampusPickerOpen] = useState(false)
  const campusGroups = [
    ['มหาวิทยาลัยของรัฐและสถาบันของรัฐ', ['kku','mahasarakham','ku','chula','tu','buu','swu','su','cra','nu','up','mu','mfu','nmu','ssru','catc','ru','mju','npru','cmu','cmru','dusit']],
    ['มหาวิทยาลัยเทคโนโลยี / ราชมงคล', ['kmitl','kmutt','kmutnb','rmutk','rmutt','rmutto','rmuti']],
    ['มหาวิทยาลัยเอกชน', ['spu','bu','utcc','rangsit','siam','nbu','huachiew','dpu','abac']]
  ]
  const normalizedCampusQuery = campusSearch.trim().toLocaleLowerCase('th')
  const campusResults = campusGroups.map(([title, ids]) => [title, ids.filter(id => {
    const campus = VERIFIED_CAMPUS_DOMAINS[id]
    return campus && (!normalizedCampusQuery || [campus.name, id, ...campus.domains].join(' ').toLocaleLowerCase('th').includes(normalizedCampusQuery))
  })]).filter(([, ids]) => ids.length)
  const chooseCampus = id => {
    setCampusUniversity(id)
    setCampusSearch('')
    setCampusPickerOpen(false)
    setCampusEmail('')
    setVerifyStep('email')
    setCampusCode('')
    setVerifyMessage('')
  }
  const [verifyStep, setVerifyStep] = useState('email')
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')
  const [showDomainRequest, setShowDomainRequest] = useState(false)
  const [requestedUniversity, setRequestedUniversity] = useState('')
  const [requestedDomain, setRequestedDomain] = useState('')
  const [domainRequestBusy, setDomainRequestBusy] = useState(false)
  const [domainRequestMessage, setDomainRequestMessage] = useState('')
  const [domainRequestSuccess, setDomainRequestSuccess] = useState('')
  const submitDomainRequest = async (event) => {
    event.preventDefault()
    if (domainRequestBusy) return
    const domain = requestedDomain.trim().toLowerCase().replace(/^@+/, '')
    const universityName = requestedUniversity.trim() || 'ไม่ระบุ (' + domain + ')'
    if (universityName.length > 150) return setDomainRequestMessage('ชื่อมหาวิทยาลัยยาวเกินไป')
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain) || domain.length > 253) return setDomainRequestMessage('กรุณากรอกเฉพาะโดเมน เช่น @nu.ac.th')
    setDomainRequestBusy(true)
    setDomainRequestMessage('')
    setDomainRequestSuccess('')
    try {
      const { error } = await supabase.from('campus_domain_requests').insert({
        user_id: user.id, university_name: universityName, email_domain: domain,
      })
      if (error) throw error
      setDomainRequestMessage(`ส่งคำขอเพิ่มโดเมน @${domain} ไปให้ทีมงานตรวจสอบแล้ว 💗`)
      setDomainRequestSuccess({ domain: `@${domain}`, university: universityName })
      setRequestedDomain('')
      setRequestedUniversity('')
    } catch (error) {
      setDomainRequestMessage(error?.code === '23505' ? 'คุณเคยแจ้งโดเมนนี้แล้ว ทีมงานกำลังตรวจสอบ' : 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่ หากยังไม่ได้ให้แจ้งผู้ดูแลระบบ')
    } finally { setDomainRequestBusy(false) }
  }

  useEffect(() => {
    let active = true
    supabase.from('student_verifications').select('status,university_id,verified_email,email_domain').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active || error) return
        setVerification(data || { status: 'unverified' })
        if (data?.university_id) setCampusUniversity(data.university_id)
        if (data?.verified_email) setCampusEmail(data.verified_email)
      })
      .catch(() => { if (active) setVerification({ status: 'unverified' }) })
    return () => { active = false }
  }, [user.id])
  const isVerified = verification?.status === 'verified'
  const selectedCampus = VERIFIED_CAMPUS_DOMAINS[campusUniversity]
  const allowedDomains = selectedCampus?.domains || []
  const requestVerification = async (action) => {
    if (verifyBusy) return
    const email = campusEmail.trim().toLowerCase()
    if (isVerified) return setVerifyMessage('ยืนยันแล้ว ไม่สามารถเปลี่ยนมหาวิทยาลัยหรืออีเมลที่ใช้ยืนยันได้')
    if (!campusUniversity || !selectedCampus) return setVerifyMessage('กรุณาเลือกมหาวิทยาลัยที่รองรับการยืนยัน')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setVerifyMessage('กรุณากรอกอีเมลมหาวิทยาลัยที่ถูกต้อง')
    const domain = email.split('@')[1]
    if (!allowedDomains.includes(domain)) return setVerifyMessage(`มหาวิทยาลัยนี้รองรับเฉพาะ ${allowedDomains.map(x => '@' + x).join(' หรือ ')}`)
    if (action === 'verify' && !/^\d{6}$/.test(campusCode.trim())) return setVerifyMessage('กรุณากรอกรหัส 6 หลัก')
    setVerifyBusy(true); setVerifyMessage('')
    try {
      const {data, error} = await supabase.functions.invoke('student-email-otp', {body: {action, university_id: campusUniversity, email, code: campusCode.trim()}})
      if (error || !data?.ok) throw new Error(data?.error || error?.message || 'ไม่สามารถดำเนินการได้')
      if (action === 'send') { setVerifyStep('code'); setVerifyMessage('ส่งรหัส 6 หลักแล้ว กรุณาตรวจกล่องจดหมายและ Spam / Junk') }
      else {
        setVerification({ status: 'verified', university_id: campusUniversity, verified_email: email, email_domain: domain })
        setCampusCode('')
        setVerifyMessage('ยืนยันสำเร็จ! มหาวิทยาลัยและอีเมลนี้ถูกล็อกกับบัญชีนี้แล้ว')
      }
    } catch (err) { setVerifyMessage(err?.message || 'เกิดข้อผิดพลาด') }
    finally { setVerifyBusy(false) }
  }
  return <section className="v26-settings-section v27-verification" aria-label="ยืนยันนักศึกษา">
    <span className="theme-kicker">STUDENT VERIFICATION</span>
    <h3>ยืนยันอีเมลมหาวิทยาลัย</h3>
    <p>เพื่อป้องกันการใช้สิทธิ์ซ้ำ อีเมลที่ยืนยันสำเร็จจะใช้ได้เพียงบัญชีเดียว และเปลี่ยนมหาวิทยาลัยที่ยืนยันไม่ได้</p>
    <div className="v26-verify-row">{isVerified ? <span className="nm-verified-badge" role="status"><ShieldCheck size={17} strokeWidth={2.2}/> {studentTerm(verification.university_id)}ยืนยันแล้ว · ล็อกมหาวิทยาลัย</span> : <span className="v26-status">ยังไม่ยืนยันอีเมลมหาวิทยาลัย</span>}</div>
    {isVerified ? <div className="v27-verify-success" role="status"><ShieldCheck size={18}/><div><b>{VERIFIED_CAMPUS_DOMAINS[verification.university_id]?.name || uniName(verification.university_id)}</b><p>อีเมลยืนยัน: {verification.verified_email || `*@${verification.email_domain}`}</p><small>มหาวิทยาลัยและอีเมลยืนยันนี้เปลี่ยนไม่ได้ หากมีปัญหาให้ติดต่อผู้ดูแล</small></div></div> : <div className="v27-verify-form">
      <div className="nm-campus-picker-heading"><span className="nm-campus-picker-icon"><GraduationCap size={21}/></span><div><strong>เลือกสถาบันของคุณ</strong><p>ค้นหาชื่อมหาวิทยาลัยหรือโดเมนอีเมล แล้วเลือกจากหมวดหมู่</p></div></div>
      <label htmlFor="v27-campus-search">ค้นหาและเลือกมหาวิทยาลัย</label>
      <div className="nm-campus-search-wrap">
        <Search size={18} aria-hidden="true"/>
        <input id="v27-campus-search" type="search" role="combobox" aria-autocomplete="list" aria-controls="nm-campus-results" aria-expanded={campusPickerOpen} value={campusSearch} onFocus={() => setCampusPickerOpen(true)} onChange={e => { setCampusSearch(e.target.value); setCampusPickerOpen(true) }} onKeyDown={e => {
          if (e.key === 'Escape') setCampusPickerOpen(false)
          if (e.key === 'Enter' && campusPickerOpen && campusResults[0]?.[1]?.[0]) { e.preventDefault(); chooseCampus(campusResults[0][1][0]) }
        }} placeholder="พิมพ์ชื่อมหาลัย เช่น มหิดล หรือ mu.ac.th" autoComplete="off"/>
        {campusSearch && <button type="button" className="nm-campus-clear" onClick={() => {setCampusSearch(''); setCampusPickerOpen(true)}} aria-label="ล้างคำค้นหา"><X size={16}/></button>}
      </div>
      {selectedCampus && <button type="button" className="nm-campus-current" onClick={() => setCampusPickerOpen(v => !v)}><GraduationCap size={18}/><span><strong>{selectedCampus.name}</strong><small>{selectedCampus.domains.map(d => '@'+d).join(' · ')}</small></span><span className="nm-campus-change">เปลี่ยน</span></button>}
      {campusPickerOpen && <div id="nm-campus-results" className="nm-campus-results" role="listbox" aria-label="ผลการค้นหามหาวิทยาลัย">
        {campusResults.length ? campusResults.map(([title, ids]) => <div className="nm-campus-group" key={title}>
          <div className="nm-campus-group-title">{title}</div>
          {ids.map(id => <button key={id} type="button" role="option" aria-selected={campusUniversity === id} className={'nm-campus-result' + (campusUniversity === id ? ' selected' : '')} onClick={() => chooseCampus(id)}>
            <span className="nm-campus-result-icon"><GraduationCap size={17}/></span>
            <span className="nm-campus-result-label"><strong>{VERIFIED_CAMPUS_DOMAINS[id].name}</strong><small>{VERIFIED_CAMPUS_DOMAINS[id].domains.map(d => '@' + d).join(' · ')}</small></span>
            {campusUniversity === id ? <Check size={18}/> : <ArrowRight size={16}/>}
          </button>)}
        </div>) : <div className="nm-campus-no-results"><Search size={22}/><strong>ไม่พบมหาวิทยาลัยที่ค้นหา</strong><span>ลองใช้ชื่อภาษาไทยหรือโดเมนอีเมล เช่น @mu.ac.th</span></div>}
      </div>}
      {!selectedCampus && !campusPickerOpen && <button type="button" className="nm-campus-open" onClick={() => setCampusPickerOpen(true)}>แตะเพื่อดูมหาวิทยาลัยทั้งหมด <ArrowRight size={17}/></button>}
      {selectedCampus && <p className="v27-domain-hint">รองรับเฉพาะโดเมน: <b>{allowedDomains.map(x => '@' + x).join(' · ')}</b></p>}
      <label htmlFor="v27-campus-email">อีเมลมหาวิทยาลัย</label>
      <input id="v27-campus-email" type="email" inputMode="email" autoComplete="email" placeholder={selectedCampus ? selectedCampus.domains.map(d => `ชื่อผู้ใช้@${d}`).join(' หรือ ') : 'เลือกมหาวิทยาลัยก่อน'} value={campusEmail} onChange={e=>{setCampusEmail(e.target.value); setVerifyMessage('')}} disabled={!selectedCampus || verifyStep === 'code'} />
      {verifyStep === 'code' && <><p className="v27-spam-hint" role="note">หากไม่พบรหัส กรุณาตรวจ Spam / Junk ก่อนขอรหัสใหม่</p><label htmlFor="v27-campus-code">รหัสยืนยัน 6 หลัก</label><input id="v27-campus-code" type="text" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="000000" value={campusCode} onChange={e=>setCampusCode(e.target.value.replace(/\D/g,'').slice(0,6))}/></>}
      <button type="button" className="btn btn-pink" disabled={verifyBusy || !selectedCampus} onClick={()=>requestVerification(verifyStep === 'code' ? 'verify' : 'send')}>{verifyBusy ? 'กำลังดำเนินการ...' : verifyStep === 'code' ? 'ยืนยันรหัสและล็อกมหาวิทยาลัย' : 'ส่งรหัสไปยังอีเมลมหาวิทยาลัย'}</button>
      {verifyStep === 'code' && <button type="button" className="btn btn-ghost btn-small" disabled={verifyBusy} onClick={()=>requestVerification('send')}>ส่งรหัสอีกครั้ง</button>}
      {verifyMessage && <p className="v27-verify-message" role="status">{verifyMessage}</p>}
      <div className="nm-domain-request" style={{marginTop:18,padding:16,border:'1px solid var(--border, rgba(160,150,180,.28))',borderRadius:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><GraduationCap size={19}/><strong>ไม่พบโดเมนอีเมลมหาวิทยาลัยของคุณ?</strong></div>
        <p style={{margin:'0 0 12px'}}>แจ้งชื่อมหาวิทยาลัยและโดเมนอีเมลเพื่อให้ทีมงานตรวจสอบและเพิ่มการรองรับ</p>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => { setShowDomainRequest(v => !v); setDomainRequestMessage('') }}>{showDomainRequest ? 'ปิดแบบฟอร์ม' : 'แจ้งเพิ่มโดเมนอีเมลมหาวิทยาลัย'} <ArrowRight size={15}/></button>
        {showDomainRequest && <form onSubmit={submitDomainRequest} style={{display:'grid',gap:10,marginTop:14}}>
          <label htmlFor="nm-request-university">ชื่อมหาวิทยาลัย (ไม่จำเป็น)</label>
          <input id="nm-request-university" maxLength={150} placeholder="ไม่กรอกก็ได้" value={requestedUniversity} onChange={e=>setRequestedUniversity(e.target.value)} />
          <label htmlFor="nm-request-domain">โดเมนอีเมลมหาวิทยาลัย (กรอกแค่ @...)</label>
          <input id="nm-request-domain" required maxLength={254} placeholder="เช่น @nu.ac.th" value={requestedDomain} onChange={e=>setRequestedDomain(e.target.value)} />
          <button type="submit" className="btn btn-pink" disabled={domainRequestBusy}>{domainRequestBusy ? 'กำลังส่งคำขอ...' : 'ส่งคำขอให้ทีมงานตรวจสอบ'} <Send size={16}/></button>
          {domainRequestSuccess && <div className="nm-domain-request-success" role="status" aria-live="polite"><Check size={20}/><div><strong>ส่งคำขอเรียบร้อยแล้ว!</strong><p>เราได้รับคำขอเพิ่มโดเมน <b>{domainRequestSuccess.domain}</b> ของมหาวิทยาลัย <b>{domainRequestSuccess.university}</b> แล้ว ทีมงานจะตรวจสอบก่อนเพิ่มเข้าระบบ</p></div></div>}
          {domainRequestMessage && !domainRequestSuccess && <p role="status" className="v27-verify-message">{domainRequestMessage}</p>}
        </form>}
      </div>
      <p className="v27-verify-note">ตอนนี้แสดงเฉพาะมหาวิทยาลัยที่กำหนดโดเมนอีเมลชัดเจนแล้ว เมื่อมีโดเมนอื่นที่ตรวจสอบได้จะเพิ่มเข้ารายการภายหลัง</p>
    </div>}
  </section>
}

function PushPermissionCard({ user }) {
  const [state, setState] = useState('checking')
  const [busy, setBusy] = useState(false)
  const dismissedKey = 'nm-push-invite:' + user.id
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window) || !window.isSecureContext) { setState('unsupported'); return }
    if (Notification.permission === 'denied') { setState('denied'); return }
    if (localStorage.getItem(dismissedKey) === 'later') { setState('later'); return }
    let active = true
    navigator.serviceWorker.getRegistration().then(reg => reg?.pushManager.getSubscription()).then(sub => { if (active) setState(sub ? 'enabled' : 'invite') }).catch(() => { if (active) setState('invite') })
    return () => { active = false }
  }, [dismissedKey])
  const allow = async () => {
    if (busy) return
    setBusy(true)
    try {
      const key = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!key) throw new Error('ยังไม่ได้ตั้งค่า Push')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState(permission === 'denied' ? 'denied' : 'later'); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      const json = sub.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({ user_id: user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' })
      if (error) throw error
      setState('enabled')
    } catch (e) { window.alert('เปิดแจ้งเตือนไม่สำเร็จ: ' + e.message) }
    finally { setBusy(false) }
  }
  if (state !== 'invite') return null
  return <div className="nm-push-permission" role="region" aria-label="ตั้งค่าการแจ้งเตือน">
    <span className="nm-push-permission-icon"><Bell size={19}/></span>
    <div className="nm-push-permission-copy"><strong>ไม่พลาดแมตช์และข้อความใหม่</strong><p>รับแจ้งเตือนเมื่อไม่ได้ใช้งานแอป และปิดได้ทุกเมื่อในหน้าตั้งค่า</p></div>
    <button type="button" className="btn btn-pink" disabled={busy} onClick={allow}>{busy ? 'กำลังเปิด…' : 'เปิดแจ้งเตือน'}</button>
    <button type="button" className="nm-push-permission-dismiss" onClick={() => { localStorage.setItem(dismissedKey, 'later'); setState('later') }} aria-label="ไว้ทีหลัง"><X size={17}/></button>
  </div>
}


function AdminDirectory({ kind }) {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [total, setTotal] = useState(0)
  const [verifiedCampusIds, setVerifiedCampusIds] = useState([])
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const rpc = kind === 'profiles' ? 'nm_admin_profiles' : 'nm_admin_hangouts'
    const params = { p_limit: 20, p_offset: page * 20, ...(kind === 'profiles' ? { p_search: search, p_gender: gender } : {}) }
    Promise.race([
      supabase.rpc(rpc, params),
      new Promise((_, reject) => setTimeout(() => reject(new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่')), 15000))
    ]).then(({data,error}) => {
      if (!active) return
      if (error) { setError(error.message); setRows([]) }
      else { setRows(data || []); setTotal(Number(data?.[0]?.total_count || 0)); setVerifiedCampusIds([]); if (kind === 'profiles' && data?.length) supabase.rpc('nm_admin_verified_campus_ids', { p_ids: data.map(row => row.id) }).then(({ data: verified, error: verifiedError }) => { if (active && !verifiedError) setVerifiedCampusIds((verified || []).map(row => row.user_id)) }).catch(() => {}) }
      setLoading(false)
    }).catch(e => { if (active) { setError(e.message); setLoading(false) } })
    return () => { active = false }
  }, [kind,page,search,gender])
  return <section className="nm-admin-queue">
    <h3>{kind === 'profiles' ? 'โปรไฟล์สมาชิก' : 'ห้อง Hangout ทั้งหมด'}</h3>
    <p>เฉพาะ Admin เท่านั้น • ไม่ต้องยืนยันอีเมลมหาวิทยาลัย</p>
    {kind === 'profiles' && <form onSubmit={e => { e.preventDefault(); setPage(0); setSearch(query.trim()) }} style={{display:'flex',gap:8,marginBottom:16}}>
      <input aria-label="ค้นหาสมาชิก" value={query} onChange={e => setQuery(e.target.value)} placeholder="ชื่อหรือมหาวิทยาลัย" style={{minWidth:0,flex:1,padding:10,borderRadius:8}}/>
      <button type="submit" className="btn btn-pink">ค้นหา</button>
    </form>}
    {kind === 'profiles' && <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>{[['','ทั้งหมด'],['male','ชาย'],['female','หญิง'],['other','อื่น ๆ']].map(([value,label]) => <button type="button" key={value} className={'btn ' + (gender === value ? 'btn-pink' : 'btn-ghost')} onClick={() => {setGender(value);setPage(0);setSelected(null)}}>{label}</button>)}</div>}
    {loading && <p>กำลังโหลด…</p>}
    {error && <p role="alert">โหลดข้อมูลไม่ได้: {error} (ตรวจสอบ SQL admin_{kind === 'profiles' ? 'profiles' : 'hangouts'}_directory.sql)</p>}
    {!loading && !error && rows.length === 0 && <p>ไม่มีข้อมูล</p>}
    {!loading && rows.map(r => <article key={r.id} style={{padding:14,borderBottom:'1px solid #555'}}>
      {kind === 'profiles' ? <>
        <div style={{display:'flex',gap:12,alignItems:'center'}}><Av u={r}/><div style={{flex:1}}><strong>{r.display_name || 'ไม่ระบุชื่อ'}</strong><p>{uniName(r.university_id)} • {r.faculty || '-'}</p><span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:verifiedCampusIds.includes(r.id)?'#67e8b4':'#a1a1aa'}}>{verifiedCampusIds.includes(r.id) ? <><ShieldCheck size={14}/> ยืนยันเมลมหาวิทยาลัยแล้ว</> : 'ยังไม่ยืนยันเมลมหาวิทยาลัย'}</span></div><button type="button" className="btn btn-ghost" onClick={() => setSelected(selected === r.id ? null : r.id)}>ดูโปรไฟล์</button></div>
        {selected === r.id && createPortal(<div className="modal-backdrop detail-backdrop hangout-member-profile-portal" onMouseDown={e => {if(e.target===e.currentTarget)setSelected(null)}}><div className="detail-modal" role="dialog" aria-modal="true" aria-label="โปรไฟล์สมาชิก"><button type="button" className="modal-close detail-close-btn" onClick={() => setSelected(null)} aria-label="ปิด"><X size={21}/></button><ProfileGallery person={r}/><div className="detail-body nm-member-profile-body"><div className="section-kicker">GET TO KNOW THEM · ADMIN VIEW</div><h2>{r.display_name || 'ไม่ระบุชื่อ'}{r.age != null ? ', ' + r.age : ''}</h2><p className="detail-campus-line"><GraduationCap size={15}/>{uniName(r.university_id) || 'ไม่ระบุมหาวิทยาลัย'}{r.faculty ? ' · ' + r.faculty : ''}{r.major ? ' · ' + r.major : ''}</p>{r.relationship_intent && <RelationshipVibe intent={r.relationship_intent}/>}<p>{r.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p><div className="tags nm-member-interest-tags">{(r.interests || []).map((interest,index) => <span className="tag" style={{'--tag-index':index}} key={interest}>{interest}</span>)}</div><div className="match-profile-song">{itunesTrack(r) ? <ITunesSongCard track={itunesTrack(r)} compact/> : <div className="detail-no-song"><Music2 size={17}/><span><b>ยังไม่ได้เพิ่มเพลงโปรด</b></span></div>}</div><button type="button" className="btn btn-ghost btn-full" onClick={() => setSelected(null)}>ปิดโปรไฟล์</button></div></div></div>,document.body)}
      </> : <><strong>{r.title || 'ไม่มีชื่อห้อง'}</strong><p>{[r.venue,r.city].filter(Boolean).join(' • ')}</p><p>ผู้สร้าง: {r.creator_name || '-'} • สมาชิก: {r.member_count ?? 0}/{r.capacity ?? '-'} • สถานะ: {r.status || '-'}</p><p>{r.starts_at ? new Date(r.starts_at).toLocaleString('th-TH') : 'ไม่ระบุเวลา'}</p><p>{r.description || ''}</p></>}
    </article>)}
    {!loading && !error && <div style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}>
      <button type="button" className="btn btn-ghost" disabled={page===0} onClick={() => {setPage(p=>p-1);setSelected(null)}}>ก่อนหน้า</button><span>หน้า {page+1} • {total} รายการ</span>
      <button type="button" className="btn btn-ghost" disabled={rows.length<20 || (total>0 && (page+1)*20>=total)} onClick={() => {setPage(p=>p+1);setSelected(null)}}>ถัดไป</button>
    </div>}
  </section>
}

function AdminDashboard({ onBack }) {
  useEffect(() => { window.scrollTo(0, 0); document.querySelector('main')?.scrollTo?.(0, 0) }, [])
  const [metrics, setMetrics] = useState(null)
  const [onlineCount, setOnlineCount] = useState(null)
  const [onlineError, setOnlineError] = useState(false)
  const [adminTab, setAdminTab] = useState('overview')
  useEffect(() => {
    let alive = true
    // Read the shared visitor channel; attaching presence handlers to an already
    // subscribed channel throws in supabase-js and crashes the React tree.
    const update = () => {
      if (!alive) return
      const channel = supabase.getChannels().find(item => item.topic === 'realtime:nm-site-visitors-v1')
      if (!channel) { setOnlineCount(null); setOnlineError(true); return }
      try {
        const state = channel.presenceState()
        const count = Object.values(state || {}).reduce((total, entries) => total + (Array.isArray(entries) ? entries.filter(entry => entry?.active === true).length : 0), 0)
        setOnlineCount(count)
        setOnlineError(false)
      } catch (error) {
        console.warn('Admin presence read failed', error)
        setOnlineError(true)
        setOnlineCount(null)
      }
    }
    update()
    const timer = setInterval(update, 3000)
    return () => { alive = false; clearInterval(timer) }
  }, [])
  const [reports, setReports] = useState([])
  const [growth, setGrowth] = useState(null)
  const [growthError, setGrowthError] = useState('')
  const [analyticsDays,setAnalyticsDays] = useState(14)
  const [analyticsV2,setAnalyticsV2] = useState(null)
  const [analyticsV2Error,setAnalyticsV2Error] = useState('')
  const [reportError, setReportError] = useState('')
  const [lastChecked, setLastChecked] = useState(null)
  const [latency, setLatency] = useState(null)
  const [health, setHealth] = useState('checking')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const reloadSequence = useRef(0)
  const reload = useCallback(async () => {
    const requestId = ++reloadSequence.current
    setBusy(true)
    setError('')
    setHealth('checking')
    const startedAt = performance.now()
    let summary, queue, trend
    try {
      [summary, queue, trend] = await Promise.all([
        supabase.rpc('nm_admin_metrics'),
        supabase.rpc('nm_admin_report_queue'),
        supabase.rpc('nm_admin_growth', { p_days: 14 })
      ])
    } catch (err) {
      if (requestId !== reloadSequence.current) return
      setHealth('error'); setMetrics(null); setGrowth(null); setReports([])
      setError('เชื่อมต่อฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่')
      setBusy(false)
      return
    }
    if (requestId !== reloadSequence.current) return
    setLatency(Math.round(performance.now() - startedAt))
    setLastChecked(new Date())
    setHealth(summary.error ? 'error' : 'ok')
    if (summary.error) { setMetrics(null); setError('โหลดสถิติไม่ได้ กรุณาตรวจสิทธิ์ Admin และรัน SQL social_features_admin_v1.sql') }
    else { setMetrics(summary.data); setError('') }
    if (!queue.error) { setReports(Array.isArray(queue.data) ? queue.data : []); setReportError('') }
    else { setReports([]); setReportError(`โหลดรายงานไม่สำเร็จ: ${queue.error.message} (ตรวจสอบฟังก์ชัน nm_admin_report_queue ใน Supabase)`) }
    if (!trend.error) { setGrowth(Array.isArray(trend.data) ? trend.data : []); setGrowthError('') }
    else { setGrowth(null); setGrowthError('ยังไม่ได้ติดตั้ง SQL nm_admin_growth_v2.sql หรือไม่มีสิทธิ์เข้าถึง') }
    setBusy(false)
  }, [])
  useEffect(() => { if (adminTab === 'overview' || adminTab === 'analytics') reload(); return () => { reloadSequence.current += 1 } }, [reload, adminTab])
  useEffect(() => {
    if (adminTab !== 'analytics') return
    let active = true
    setAnalyticsV2(null); setAnalyticsV2Error('')
    supabase.rpc('nm_admin_analytics_v2',{p_days:analyticsDays}).then(({data,error})=>{
      if (!active) return
      if(error) setAnalyticsV2Error('ต้องรัน SQL V145_ADMIN_ANALYTICS_V2.sql ใน Supabase ก่อนใช้งานสถิติขั้นสูง')
      else setAnalyticsV2(data)
    }).catch(()=>{if(active)setAnalyticsV2Error('โหลดสถิติขั้นสูงไม่สำเร็จ')})
    return ()=>{active=false}
  },[adminTab,analyticsDays])
  const analyticsDaily = analyticsV2?.daily || []
  const analyticsPeak = Math.max(1,...analyticsDaily.map(d=>Number(d.messages)||0))
  const growthMax = Math.max(1,...(growth || []).flatMap(d=>[Number(d.new_profiles)||0,Number(d.new_matches)||0]))
  return <section className="nm-admin-dashboard">
    <div className="nm-admin-topbar"><button type="button" className="nm-admin-back" onClick={onBack}><ArrowLeft size={18}/> <span>กลับไปตั้งค่า</span></button></div>
    <Heading kicker="ADMIN ONLY" title="Admin Dashboard" sub="สถิติและคิวรายงานสำหรับผู้ดูแลระบบเท่านั้น" />
    <style>{`@media (max-width: 640px) {
      .nm-admin-dashboard { min-width: 0; width: 100%; overflow-x: hidden; padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)); }
      .nm-admin-dashboard .nm-admin-navigation { gap: 14px !important; }
      .nm-admin-dashboard .nm-admin-tabs { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px !important; overflow: visible; }
      .nm-admin-dashboard .nm-admin-tabs button { min-width: 0; min-height: 48px; white-space: normal; line-height: 1.3; padding: 10px 8px; border-radius: 13px; font-size: 13px; text-align: center; }
      .nm-admin-dashboard .nm-admin-navigation > div:last-child { display: grid !important; grid-template-columns: minmax(0, 1fr); gap: 8px !important; }
      .nm-admin-dashboard .nm-admin-navigation > div:last-child button { min-width: 0; width: 100%; min-height: 44px; justify-content: space-between; text-align: left; }
      .nm-admin-dashboard .nm-admin-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .nm-admin-dashboard .nm-admin-metrics article { min-width: 0; padding: 14px 10px; }
      .nm-admin-dashboard .nm-admin-overview, .nm-admin-dashboard .nm-admin-queue { min-width: 0; max-width: 100%; }
      .nm-admin-dashboard .nm-admin-queue { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .nm-admin-dashboard button { touch-action: manipulation; }
    }`}</style>
    <div className="nm-admin-navigation nm-admin-redesign">
      <header className="nm-admin-hero">
        <div className="nm-admin-hero-copy">
          <span className="nm-admin-eyebrow"><ShieldCheck size={14}/> NISIT MATCH · ADMIN</span>
          <h2>ศูนย์ควบคุม</h2>
          <p>ภาพรวมระบบและเครื่องมือจัดการสมาชิกในที่เดียว</p>
        </div>
        <div className="nm-admin-hero-actions">
          <span className={'nm-admin-health-chip '+(health === 'ok' ? 'is-healthy' : health === 'error' ? 'is-unhealthy' : '')}><span className="nm-admin-status-dot"/>{health === 'ok' ? 'ระบบเชื่อมต่อปกติ' : health === 'error' ? 'เชื่อมต่อไม่สำเร็จ' : 'กำลังตรวจสอบระบบ'}</span>
          <button type="button" className="nm-admin-refresh" onClick={reload} disabled={busy}><Clock size={16}/>{busy ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</button>
        </div>
      </header>
      {adminTab === 'overview' && <>
        <div className="nm-admin-summary-grid" aria-label="ภาพรวมตัวเลขสำคัญ">
          <article className="nm-admin-summary-card is-online"><div className="nm-admin-summary-top"><span className="nm-admin-summary-icon"><Globe2 size={19}/></span><span className="nm-admin-summary-tag">กำลังใช้งาน</span></div><small>สมาชิกออนไลน์</small><strong>{onlineCount === null ? '—' : onlineCount.toLocaleString('th-TH')}</strong><span className="nm-admin-summary-note">{onlineError ? 'ไม่สามารถโหลดข้อมูลได้' : 'ผู้เข้าชมที่เปิดหน้าเว็บอยู่ (นับตามแท็บ)'}</span></article>
          {[['สมาชิกทั้งหมด',metrics?.profiles,Users,'จำนวนบัญชี'],['แมตช์ทั้งหมด',metrics?.matches,Heart,'การจับคู่'],['คำขอรอตรวจสอบ',metrics?.pending_verifications,ShieldCheck,'ยืนยันมหาวิทยาลัย']].map(([label,value,Icon,note])=><article className="nm-admin-summary-card" key={label}><div className="nm-admin-summary-top"><span className="nm-admin-summary-icon"><Icon size={19}/></span></div><small>{label}</small><strong>{metrics === null ? '—' : Number(value || 0).toLocaleString('th-TH')}</strong><span className="nm-admin-summary-note">{note}</span></article>)}
        </div>
        <div className="nm-admin-block-title"><div><h3>จัดการด่วน</h3><p>งานที่ผู้ดูแลใช้งานบ่อย</p></div></div>
        <div className="nm-admin-shortcuts" aria-label="งานที่ใช้บ่อย">
          {[['alerts','ตรวจคำขอ',Bell,'รายงานและการแจ้งเตือน'],['profiles','จัดการสมาชิก',Users,'ค้นหาและตรวจสอบบัญชี'],['announcements','ส่งประกาศ',Send,'ข่าวสารถึงสมาชิก'],['analytics','ดูสถิติ',Eye,'การเติบโตและกิจกรรม']].map(([id,label,Icon,description])=><button type="button" key={id} className="nm-admin-shortcut" onClick={()=>setAdminTab(id)}><span className="nm-admin-shortcut-icon"><Icon size={21}/></span><span className="nm-admin-shortcut-text"><strong>{label}</strong><small>{description}</small></span><ArrowRight size={17} className="nm-admin-shortcut-arrow"/></button>)}
        </div>
      </>}
      <div className="nm-admin-block-title nm-admin-menu-title"><div><h3>เมนูจัดการ</h3><p>เลือกส่วนที่ต้องการดูหรือแก้ไข</p></div></div>
      <nav className="nm-admin-tabs" aria-label="เมนูผู้ดูแลระบบ">
        {[['overview','ภาพรวม',Eye],['analytics','สถิติ',Clock],['announcements','ประกาศ',Send],['alerts','แจ้งเตือนและคำขอ',Bell],['profiles','สมาชิก',Users],['premium','Premium',Crown],['hangouts','Hangout',HeartHandshake],['email','อีเมล',MailCheck]].map(([id,label,Icon])=><button key={id} type="button" aria-current={adminTab===id?'page':undefined} className={adminTab===id?'is-active':''} onClick={()=>setAdminTab(id)}><Icon size={17}/><span>{label}</span></button>)}
      </nav>
    </div>
    {adminTab === 'analytics' && <section className="nm-admin-overview" aria-label="สถิติผู้ใช้งาน" style={{display:'grid',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h3 style={{margin:0}}>สถิติการเติบโต</h3><p style={{opacity:.7,fontSize:13,margin:'5px 0 0'}}>ข้อมูลสรุปจาก Supabase ไม่แสดงข้อความส่วนตัวของสมาชิก</p></div><button type="button" className="btn btn-ghost" disabled={busy} onClick={reload}>{busy?'กำลังโหลด…':'รีเฟรช'}</button></div>
      {error && <p role="alert">{error}</p>}
      {metrics && <div className="nm-admin-metrics">{[['สมาชิกทั้งหมด',metrics.profiles],['แมตช์ทั้งหมด',metrics.matches],['รายงานทั้งหมด',metrics.reports],['รอยืนยันมหาวิทยาลัย',metrics.pending_verifications]].map(([label,value])=><article key={label}><small>{label}</small><strong>{Number(value||0).toLocaleString('th-TH')}</strong></article>)}</div>}
      <div className="nm-admin-queue"><h3>14 วันที่ผ่านมา</h3>{growthError && <p role="status">{growthError}</p>}{growth && <><div className="nm-admin-metrics">{[['สมาชิกใหม่',growth.reduce((n,d)=>n+(Number(d.new_profiles)||0),0)],['แมตช์ใหม่',growth.reduce((n,d)=>n+(Number(d.new_matches)||0),0)]].map(([label,value])=><article key={label}><small>{label}</small><strong>{value.toLocaleString('th-TH')}</strong></article>)}</div><div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}><table style={{width:'100%',minWidth:290,borderCollapse:'collapse',fontSize:13}}><thead><tr><th style={{textAlign:'left',padding:10}}>วันที่</th><th style={{textAlign:'right',padding:10}}>สมาชิกใหม่</th><th style={{textAlign:'right',padding:10}}>แมตช์ใหม่</th></tr></thead><tbody>{growth.map(d=><tr key={d.day}><td style={{padding:10,borderTop:'1px solid #ffffff20'}}>{d.day}</td><td style={{padding:10,textAlign:'right',borderTop:'1px solid #ffffff20'}}>{Number(d.new_profiles||0).toLocaleString('th-TH')}</td><td style={{padding:10,textAlign:'right',borderTop:'1px solid #ffffff20'}}>{Number(d.new_matches||0).toLocaleString('th-TH')}</td></tr>)}</tbody></table></div></>}</div>
      <section className="nm-admin-queue" style={{display:'grid',gap:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div><h3 style={{margin:0}}>Analytics 2.0</h3><small style={{opacity:.7}}>ข้อมูลกิจกรรมแชตและมหาวิทยาลัย · เวลาไทย</small></div>
          <div style={{display:'flex',gap:6}}>{[7,14,30].map(n=><button key={n} type="button" className={analyticsDays===n?'btn btn-pink':'btn btn-ghost'} onClick={()=>setAnalyticsDays(n)}>{n} วัน</button>)}</div>
        </div>
        {analyticsV2Error && <p role="status">{analyticsV2Error}</p>}
        {analyticsV2 && <>
          <div className="nm-admin-metrics">{[
            ['ข้อความที่ส่ง',analyticsDaily.reduce((n,d)=>n+Number(d.messages||0),0)],
            ['ผู้ส่งแชตเฉลี่ยต่อวัน',Math.round(analyticsDaily.reduce((n,d)=>n+Number(d.chat_users||0),0)/Math.max(1,analyticsDaily.length))],
            ['ห้องแชตที่ใช้งานเฉลี่ยต่อวัน',Math.round(analyticsDaily.reduce((n,d)=>n+Number(d.active_chats||0),0)/Math.max(1,analyticsDaily.length))]
          ].map(([label,value])=><article key={label}><small>{label}</small><strong>{value.toLocaleString('th-TH')}</strong></article>)}</div>
          <div style={{padding:14,border:'1px solid #ffffff20',borderRadius:14}}>
            <h4 style={{margin:'0 0 12px'}}>ข้อความที่ส่งรายวัน</h4>
            <div role="img" aria-label="กราฟแท่งจำนวนข้อความรายวัน" style={{height:150,display:'flex',alignItems:'end',gap:4}}>
              {analyticsDaily.map(d=><div key={d.day} title={d.day+': '+d.messages+' ข้อความ'} style={{flex:1,minWidth:0,height:Math.max(3,(Number(d.messages)||0)/analyticsPeak*100)+'%',background:'linear-gradient(180deg,#d6a5ff,#8654cf)',borderRadius:'5px 5px 2px 2px'}}/>)}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,opacity:.7,marginTop:8}}><span>{analyticsDaily[0]?.day}</span><span>{analyticsDaily[analyticsDaily.length-1]?.day}</span></div>
          </div>
          <div style={{padding:14,border:'1px solid #ffffff20',borderRadius:14}}>
            <h4 style={{margin:'0 0 12px'}}>10 อันดับมหาวิทยาลัยตามจำนวนสมาชิก</h4>
            {(analyticsV2.universities||[]).map((u,i)=><div key={u.name} style={{display:'grid',gridTemplateColumns:'26px minmax(0,1fr) auto',gap:9,alignItems:'center',padding:'9px 0',borderBottom:'1px solid #ffffff12'}}>
              <span style={{opacity:.7}}>{i+1}</span><div style={{minWidth:0}}><div style={{overflowWrap:'anywhere',fontSize:13}}>{u.name}</div><div style={{height:5,background:'#ffffff16',borderRadius:8,marginTop:6}}><div style={{height:'100%',width:(100*Number(u.members||0)/Math.max(1,Number(analyticsV2.universities?.[0]?.members||1)))+'%',background:'#b794f4',borderRadius:8}}/></div></div><strong>{Number(u.members||0).toLocaleString('th-TH')}</strong>
            </div>)}
          </div>
          <p style={{fontSize:12,opacity:.65}}>ผู้ส่งแชตเป็นจำนวนบัญชีที่ส่งข้อความในแต่ละวัน ไม่ใช่ผู้ใช้งานทั้งหมดของแอป และค่าเฉลี่ยรายวันไม่ใช่จำนวนผู้ใช้ที่ไม่ซ้ำตลอดช่วงเวลา</p>
        </>}
      </section>
    </section>}
    {adminTab === 'announcements' && <Announcements admin/>}
    {adminTab === 'premium' && <AdminPremiumDirectory/>}
    {adminTab === 'alerts' && <AdminAlerts/>}
    {adminTab === 'profiles' && <AdminDirectory kind="profiles"/>}
    {adminTab === 'hangouts' && <AdminDirectory kind="hangouts"/>}
    {adminTab === "email" && <EmailCenter />}
    {adminTab === 'overview' && <details style={{margin:'0 0 16px',padding:'12px 16px',border:'1px solid #ffffff24',borderRadius:14}}><summary style={{cursor:'pointer',fontWeight:600}}>การชำระเงิน (ปิดชั่วคราว)</summary><p style={{fontSize:13,opacity:.75}}>ระบบชำระเงินยังไม่เปิดให้บริการ</p></details>}
    {adminTab === "payments" && <div role="status" style={{padding:24,borderRadius:16,background:"#251b30",color:"#e6d8ed"}}><h3>ระบบชำระเงินปิดให้บริการชั่วคราว</h3><p>ยังไม่เปิดรับชำระเงินผ่าน PromptPay หรือช่องทางอื่น ข้อมูลการชำระเงินเดิมยังคงอยู่</p></div>}
    {adminTab === "overview" && <div className="nm-admin-overview">
    <button type="button" className="btn btn-ghost" disabled={busy} onClick={reload}>{busy ? 'กำลังรีเฟรช…' : '↻ รีเฟรชข้อมูล'}</button>
    <p style={{fontSize:12,opacity:.7}}>ข้อมูลจาก Supabase ณ เวลาที่รีเฟรช ไม่ใช่สถิติแบบเรียลไทม์</p>
    <section aria-label="สถานะการเชื่อมต่อฐานข้อมูล" style={{padding:16,border:'1px solid #ffffff25',borderRadius:16,marginBottom:14,background:'#ffffff08'}}><strong style={{display:'flex',alignItems:'center',gap:8}}><span aria-hidden="true" style={{width:9,height:9,borderRadius:'50%',background:health==='ok'?'#4ade80':health==='error'?'#fb7185':'#fbbf24'}}/>Supabase: {health==='ok'?'ตอบสนองปกติ':health==='error'?'ตรวจสอบไม่สำเร็จ':'กำลังตรวจสอบ'}</strong><p style={{fontSize:12,opacity:.75,margin:'8px 0 0'}}>ตรวจจาก Admin Metrics RPC เท่านั้น ไม่ใช่สถานะระบบ Supabase ทั้งหมด{latency!==null ? ` · ${latency} ms (คำขอชุดนี้)` : ''}{lastChecked ? ` · ตรวจล่าสุด ${lastChecked.toLocaleTimeString('th-TH')}` : ''}</p></section>
    {error && <p role="alert">{error}</p>}
    {metrics ? <div className="nm-admin-metrics">{[['สมาชิก',metrics.profiles],['แมตช์',metrics.matches],['รายงาน',metrics.reports],['รอยืนยันมหาวิทยาลัย',metrics.pending_verifications]].map(([label,value])=><article key={label}><small>{label}</small><strong>{Number(value||0).toLocaleString('th-TH')}</strong></article>)}</div> : !error && <div className="page-center"><span className="spin"/></div>}
    <section className="nm-admin-queue"><h3>การเติบโต 14 วันล่าสุด</h3><p>นับตามวันที่ประเทศไทย · แสดงจำนวนโปรไฟล์ใหม่และแมตช์ใหม่ต่อวัน</p>{growthError && <p role="status">{growthError}</p>}{growth && growth.length>0 && <div role="img" aria-label="กราฟแท่งจำนวนสมาชิกใหม่และแมตช์ใหม่ย้อนหลัง 14 วัน" style={{display:'flex',alignItems:'end',gap:7,height:140,overflowX:'auto',padding:'12px 2px 20px',marginBottom:12,borderBottom:'1px solid #ffffff20'}}>{growth.map(row=>{const max=growthMax;return <div key={row.day} title={`${row.day}: สมาชิก ${row.new_profiles}, แมตช์ ${row.new_matches}`} style={{flex:'1 0 18px',minWidth:18,height:'100%',display:'flex',alignItems:'end',gap:2}}><div style={{height:`${Math.max(2,Number(row.new_profiles||0)/max*100)}%`,flex:1,background:'#f472b6',borderRadius:'4px 4px 0 0'}}/><div style={{height:`${Math.max(2,Number(row.new_matches||0)/max*100)}%`,flex:1,background:'#a78bfa',borderRadius:'4px 4px 0 0'}}/></div>})}</div>}{growth && <p style={{fontSize:12,opacity:.8}}> <span style={{color:'#f472b6'}}>■</span> สมาชิกใหม่ &nbsp; <span style={{color:'#a78bfa'}}>■</span> แมตช์ใหม่</p>}{growth && <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr><th style={{textAlign:'left',padding:8}}>วันที่</th><th style={{textAlign:'right',padding:8}}>สมาชิกใหม่</th><th style={{textAlign:'right',padding:8}}>แมตช์ใหม่</th></tr></thead><tbody>{growth.map(row=><tr key={row.day}><td style={{padding:8,borderTop:'1px solid #ffffff20'}}>{row.day}</td><td style={{padding:8,textAlign:'right',borderTop:'1px solid #ffffff20'}}>{Number(row.new_profiles||0).toLocaleString('th-TH')}</td><td style={{padding:8,textAlign:'right',borderTop:'1px solid #ffffff20'}}>{Number(row.new_matches||0).toLocaleString('th-TH')}</td></tr>)}</tbody></table></div>}</section>
    <section className="nm-admin-queue"><h3>รายงานล่าสุด</h3><p>ใช้ตรวจสอบรายงานก่อนดำเนินการ ไม่มีการเปิดเผยข้อมูลส่วนตัวของผู้รายงาน</p>
    {reportError && <p role="alert">{reportError}</p>}
    {reports.length ? reports.map((report,index)=><article key={report.id||index}><span className="nm-admin-queue-meta">{report.created_at ? new Date(report.created_at).toLocaleString('th-TH') : 'รายงาน'}</span><strong>{report.reason||'ไม่ระบุเหตุผล'}</strong><small>ผู้ถูกรายงาน: {report.reported||'ไม่ระบุ'}</small></article>) : <p>ไม่มีรายงานที่แสดงได้ หรือยังไม่ได้ติดตั้ง SQL สำหรับคิวรายงาน</p>}</section>
    </div>}
  </section>
}

function DailyRewardsAndSafety({ user, notify, mode = 'safety' }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState([])
  const [safetyBusy, setSafetyBusy] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)
  const refreshRewards = useCallback(async () => {
    const { data, error } = await supabase.rpc('nm_daily_status')
    if (!error) setStatus(data)
  }, [])
  const refreshBlocked = useCallback(async () => {
    const { data, error } = await supabase.from('blocks').select('blocked').eq('blocker', user.id)
    if (!error) setBlocked(data || [])
  }, [user.id])
  useEffect(() => { if (mode === 'daily') refreshRewards() }, [mode, refreshRewards])
  useEffect(() => { if (safetyOpen) refreshBlocked() }, [safetyOpen, refreshBlocked])
  const claim = async () => {
    if (loading || status?.today_claimed) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('nm_daily_claim')
      if (error) throw error
      if (data?.status) setStatus(data.status)
      notify(data?.claimed ? (data?.earned_premium_days ? '🎉 รับ Premium ฟรี 1 วันแล้ว!' : `🎁 ได้รับ Super Like +${data?.earned_super_likes || 0} ครั้ง!`) : 'วันนี้คุณเช็กอินแล้ว')
    } catch (error) { notify('ยังเช็กอินไม่ได้ กรุณาติดตั้ง SQL nm_daily_rewards_v1.sql: ' + error.message) }
    finally { setLoading(false) }
  }
  const unblock = async id => {
    if (safetyBusy || !window.confirm('ต้องการปลดบล็อกบัญชีนี้ใช่ไหม?')) return
    setSafetyBusy(true)
    const { error } = await supabase.from('blocks').delete().eq('blocker', user.id).eq('blocked', id)
    setSafetyBusy(false)
    if (error) notify('ปลดบล็อกไม่สำเร็จ: ' + error.message)
    else { notify('ปลดบล็อกแล้ว'); refreshBlocked() }
  }
  return <div style={{display:'grid',gap:16,margin: mode === 'daily' ? '0' : '20px 0'}}>
    {mode === 'daily' && <section aria-label="รางวัลเช็กอินรายวัน">
      <div className="nm-daily-streak"><span>🔥</span><span>{status?.streak ?? '—'} DAY STREAK</span></div>
      <div className="nm-daily-days" aria-label="ความคืบหน้าการเช็กอิน 7 วัน">
        {Array.from({length:7},(_,i)=>{const day=i+1;const streak=Math.max(0,Number(status?.streak)||0);const done=day<=Math.min(streak,7);const today=!status?.today_claimed && day===Math.min(streak+1,7);return <div key={day} className={'nm-daily-day'+(done?' is-done':'')+(today?' is-today':'')+(day===7?' is-special':'')}><strong>DAY {day}</strong>{done?<Check size={23} color="#86efac"/>:day===7?<Crown size={24} color="#fbd38d"/>:<Gift size={23} color={today?'#e5b3ff':'#ac96be'}/>}<small>{done?'เช็กอินแล้ว':day===7?'Premium 1 วัน':today?'วันนี้':'รอเช็กอิน'}</small></div>})}
      </div>
      <button type="button" className="nm-daily-cta" onClick={claim} disabled={loading || !status || status.today_claimed}><Gift size={19}/>{loading?'กำลังเช็กอิน...':status?.today_claimed?'เช็กอินวันนี้แล้ว ✓':'เช็กอินวันนี้'}</button>
      {status?.today_claimed&&<p className="nm-daily-success" role="status">✨ กลับมาใหม่พรุ่งนี้นะ!</p>}
      <p className="nm-daily-note">วันที่ 1–6 รับ Super Like 1, 1, 2, 2, 3, 3 ครั้ง · วันที่ 7 รับ Premium 1 วัน · Super Like คงเหลือ {status?.super_like_credits ?? 0}</p>
      {!status&&<p className="nm-daily-note" role="status">ยังโหลดสถานะไม่ได้ กรุณาตรวจสอบระบบ Daily Rewards</p>}
    </section>}
    {mode === 'safety' && <section className="nm-settings-install" aria-label="ศูนย์ความปลอดภัย NISIT MATCH" style={{flexWrap:'wrap'}}>
      <div className="nm-settings-install-symbol"><ShieldCheck size={25}/></div>
      <div className="nm-settings-install-copy"><span className="theme-kicker">SAFETY CENTER</span><h3>ศูนย์ความปลอดภัย</h3><p>จัดการบัญชีที่บล็อกและดูแลความเป็นส่วนตัวของคุณ</p></div>
      <button type="button" className="nm-settings-install-action" aria-expanded={safetyOpen} onClick={() => setSafetyOpen(x => !x)}>{safetyOpen ? <>ปิดรายการ <X size={17}/></> : <>จัดการ <ArrowRight size={17}/></>}</button>
      {safetyOpen && <div style={{flexBasis:'100%',width:'100%',paddingTop:14,borderTop:'1px solid rgba(255,255,255,.1)',display:'grid',gap:12}}>
        <p style={{fontSize:13,opacity:.8,margin:0}}>บล็อกหรือรายงานบุคคลได้จากหน้าโปรไฟล์และห้องแชต อย่าเปิดเผยรหัสผ่านหรือโอนเงินให้คนที่เพิ่งรู้จัก</p>
        {!blocked.length && <p style={{fontSize:13,margin:0}}>ไม่มีบัญชีที่บล็อก หรือยังโหลดรายการไม่ได้</p>}
        {blocked.map(item => <div key={item.blocked} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,overflowWrap:'anywhere'}}><small>{item.blocked}</small><button type="button" className="nm-settings-install-action" disabled={safetyBusy} onClick={() => unblock(item.blocked)}>ปลดบล็อก</button></div>)}
      </div>}
    </section>}
  </div>
}

function SettingsPage({ user, notify, onInstall, isInstalled, onAdmin }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'midnight' } catch { return 'midnight' }
  })
  const chooseTheme = (id) => { setTheme(id); applyTheme(id) }
  const [soundsOn, setSoundsOn] = useState(soundEnabled)
  const [volumeLevel, setVolumeLevel] = useState(soundVolume)
  const changeVolume = (value) => { const next = Math.min(1, Math.max(0, Number(value))); setVolumeLevel(next); try { localStorage.setItem(SOUND_VOLUME_KEY,String(0.4 + next * 1.4)) } catch {} }
  const toggleSounds = () => {
    const next = !soundsOn
    try { localStorage.setItem(SOUND_SETTING_KEY, next ? 'on' : 'off') } catch {}
    setSoundsOn(next)
    if (next) {
      try { if (!nmAudioContext) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) nmAudioContext = new Ctx() } nmAudioContext?.resume().then(() => playNisitSound('like')).catch(() => {}) } catch {}
    }
    notify(next ? 'เปิดเสียงเอฟเฟกต์แล้ว' : 'ปิดเสียงเอฟเฟกต์แล้ว')
  }


  const [social, setSocial] = useState({show_online:false,show_read_receipts:true,notify_matches:true,notify_messages:true,notify_hangouts:true})
  const [socialSaving, setSocialSaving] = useState(false)
  useEffect(() => {
    let alive = true
    supabase.from('user_social_preferences').select('show_online,show_read_receipts,notify_matches,notify_messages,notify_hangouts').eq('user_id',user.id).maybeSingle().then(({data})=>{if(alive && data)setSocial(old=>({...old,...data}))}).catch(()=>{})
    return ()=>{alive=false}
  },[user.id])
  const changeSocial = async (key) => {
    if(socialSaving)return
    const next={...social,[key]:!social[key]}
    setSocialSaving(true)
    const {error}=await supabase.from('user_social_preferences').upsert({user_id:user.id,...next,updated_at:new Date().toISOString()},{onConflict:'user_id'})
    setSocialSaving(false)
    if(error) return notify('บันทึกไม่ได้ กรุณารัน SQL social_features_admin_v1.sql ก่อน')
    setSocial(next)
    notify('บันทึกการตั้งค่าแล้ว')
  }
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
  const reset = async () => { const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${authRedirectUrl()}?flow=recovery` }); notify(error ? error.message : 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว') }
  return (<>
    <Heading kicker="YOUR ACCOUNT, YOUR RULES" title="การตั้งค่า" sub="จัดการบัญชีและดูแลความปลอดภัยของคุณ" />
    <nav className="nm-settings-quick-nav" aria-label="ทางลัดการตั้งค่า">
      <button type="button" onClick={() => document.getElementById('nm-settings-appearance')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><Palette size={17}/> ธีมและเสียง</button>
      <button type="button" onClick={() => document.getElementById('nm-settings-social')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><Bell size={17}/> การแจ้งเตือน</button>
      <button type="button" onClick={() => document.getElementById('nm-settings-privacy')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><ShieldCheck size={17}/> ความเป็นส่วนตัว</button>
      <button type="button" onClick={() => document.getElementById('nm-settings-account')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><LockKeyhole size={17}/> บัญชีและแอป</button>
    </nav>
    <div id="nm-settings-appearance" className="nm-settings-group-title"><Palette size={18}/> รูปลักษณ์และเสียง</div>
    <section className="nm-sound-settings" aria-label="ตั้งค่าเสียงเอฟเฟกต์">
      <div className="nm-sound-settings-info"><span className="nm-sound-settings-icon"><Music2 size={21}/></span><div><h3>เสียงเอฟเฟกต์</h3><p>เสียงน่ารักเบา ๆ ตอนกดถูกใจ เจอแมตช์ และมีข้อความใหม่</p></div></div>
      <button type="button" className={'nm-sound-toggle' + (soundsOn ? ' is-on' : '')} role="switch" aria-checked={soundsOn} aria-label="เปิดหรือปิดเสียงเอฟเฟกต์" onClick={toggleSounds}><span/></button>
      <label className="nm-sound-volume"><span>ระดับเสียงเอฟเฟกต์ <b>{Math.round(volumeLevel*100)}%</b></span><input type="range" min="0" max="1" step="0.01" value={volumeLevel} disabled={!soundsOn} onChange={e => changeVolume(e.target.value)} onPointerUp={() => { if(soundsOn) playNisitSound('match') }} aria-label="ระดับเสียงเอฟเฟกต์"/></label>
      <button type="button" className="nm-sound-test-btn" onClick={() => playNisitSound('match')} disabled={!soundsOn}><Play size={15}/> ทดลองเสียงเอฟเฟกต์</button>
    </section>
    <section className="theme-gallery" aria-label="เลือกธีมของแอป">
      <div className="theme-gallery-heading"><div><span className="theme-kicker">APPEARANCE</span><h3>ธีมของคุณ</h3><p>เลือกบรรยากาศที่ชอบ เปลี่ยนได้ทุกเมื่อ</p></div><span className="theme-selected-label">{THEME_OPTIONS.find(t => t.id === theme)?.name || 'Midnight'}</span></div>
      <div className="theme-options">{THEME_OPTIONS.map(t => <button type="button" key={t.id} className={'theme-option' + (theme === t.id ? ' is-selected' : '')} aria-pressed={theme === t.id} onClick={() => chooseTheme(t.id)}>
        <span className="theme-swatch" style={{ background: t.colors[0] }}><span className="theme-swatch-card" style={{ background: t.colors[1] }} /><span className="theme-swatch-pill" style={{ background: t.colors[2] }} /><span className="theme-swatch-dot" style={{ background: t.colors[1] }} /></span>
        <span className="theme-option-label"><strong>{t.name}</strong><small>{t.detail}</small></span>
        <span className="theme-check">{theme === t.id && <Check size={14}/>}</span>
      </button>)}</div>
    </section>
    <div id="nm-settings-social" className="nm-settings-group-title"><Bell size={18}/> สถานะและการแจ้งเตือน</div>
    <section className="v26-settings-section nm-social-settings" aria-label="สถานะและการแจ้งเตือน"><span className="theme-kicker">SOCIAL & NOTIFICATIONS</span><h3>สถานะและการแจ้งเตือน</h3><p>เลือกข้อมูลที่ต้องการแชร์และประเภทการแจ้งเตือน (ขณะนี้ระบบ Push รองรับแมตช์ใหม่ ส่วนข้อความและ Hangouts จะเพิ่มในระบบส่งแจ้งเตือนภายหลัง)</p><div className="nm-social-options">{[['show_online','แสดงสถานะออนไลน์','เฉพาะคนที่แมตช์กัน'],['notify_matches','แจ้งเตือนแมตช์ใหม่','ความต้องการรับแจ้งเตือน'],].map(([key,title,desc])=><button type="button" key={key} className={'nm-social-option'+(social[key]?' selected':'')} disabled={socialSaving} onClick={()=>changeSocial(key)} role="switch" aria-checked={!!social[key]}><span><strong>{title}</strong><small>{desc}</small></span><span className="nm-social-switch">{social[key]?'เปิด':'ปิด'}</span></button>)}</div><div className="nm-social-push-card"><span className="nm-social-push-icon" aria-hidden="true"><Bell size={17} strokeWidth={1.8}/></span><div className="nm-social-push-copy"><strong>Push Notifications</strong><small>รับแจ้งเตือนเมื่อมีคนสนใจคุณหรือแมตช์ใหม่บนโทรศัพท์</small></div><button type="button" className={"nm-social-push-toggle" + (pushEnabled ? " is-on" : "")} disabled={pushBusy} onClick={pushEnabled ? disablePush : enablePush} aria-label={pushEnabled ? "ปิด Push Notifications" : "เปิด Push Notifications"}>{pushBusy ? "กำลังตั้งค่า..." : pushEnabled ? "เปิดอยู่" : "เปิดใช้งาน"}</button></div></section>
    {onAdmin && <section className="v26-settings-section"><span className="theme-kicker">ADMIN</span><h3>จัดการระบบ</h3><p>เฉพาะบัญชีผู้ดูแลระบบเท่านั้น</p><button type="button" className="btn btn-pink" onClick={onAdmin}>เปิด Admin Dashboard <ArrowRight size={16}/></button></section>}
    <div id="nm-settings-privacy" className="nm-settings-group-title"><ShieldCheck size={18}/> ความเป็นส่วนตัวและความปลอดภัย</div>
    <section className="v26-settings-section" aria-label="ความเป็นส่วนตัว">
      <span className="theme-kicker">PRIVACY & DISCOVERY</span><h3>ใครสามารถพบคุณได้</h3><p>ควบคุมการแสดงโปรไฟล์ในหน้าปัดของคนอื่น</p>
      <div className="v26-mode-grid">{[
        ['visible','เปิดให้ค้นพบ','แสดงโปรไฟล์ตามปกติ'],
        ['incognito','Incognito','เฉพาะคนที่คุณกดถูกใจเท่านั้น'],
        ['paused','พักการค้นหา','ซ่อนโปรไฟล์ชั่วคราว']
      ].map(([id,title,sub]) => <button type="button" key={id} disabled={privacyBusy} className={'v26-mode' + (privacy.mode === id ? ' selected' : '')} onClick={() => setPrivacyMode(id)} aria-pressed={privacy.mode === id}><span><strong>{title}</strong><small>{sub}</small></span>{privacy.mode === id && <Check size={19}/>}</button>)}</div>
    </section>
    <DailyRewardsAndSafety user={user} notify={notify} mode="safety" />
    <div id="nm-settings-account" className="nm-settings-group-title"><LockKeyhole size={18}/> บัญชีและแอป</div>
        <section className="nm-settings-install" aria-label="ติดตั้งแอป NISIT MATCH"><div className="nm-settings-install-symbol"><Globe2 size={25}/></div><div className="nm-settings-install-copy"><span className="theme-kicker">INSTALL THE APP</span><h3>ติดตั้ง NISIT MATCH</h3><p>{isInstalled ? 'กำลังใช้งานผ่านแอปที่ติดตั้งแล้ว' : 'เพิ่มแอปลงหน้าจอโฮม เปิดใช้งานง่าย ไม่ต้องค้นหาเว็บไซต์'}</p></div><button type="button" className="nm-settings-install-action" onClick={onInstall} disabled={isInstalled}>{isInstalled ? <><Check size={16}/> ติดตั้งแล้ว</> : <>ติดตั้งแอป <ArrowRight size={17}/></>}</button></section>
    <div className="settings-grid">
      <div className="settings-card"><div className="settings-icon"><ShieldCheck /></div><div><h3>ความเป็นส่วนตัวและความปลอดภัย</h3><p>หน้าค้นหาไม่แสดงอีเมลและวันเกิดของคุณ และคุณสามารถบล็อกหรือรายงานผู้ใช้ได้</p></div><span className="settings-status">เปิดใช้งาน</span></div>
      <div className="settings-card"><div className="settings-icon"><LockKeyhole /></div><div><h3>รหัสผ่าน</h3><p>ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ {user.email}</p></div><button className="btn btn-ghost btn-small" onClick={reset}>ส่งลิงก์</button></div>
      
      <div className="settings-card"><div className="settings-icon"><Users /></div><div><h3>ชุมชน nisit match</h3><p>เคารพขอบเขตของกันและกัน ไม่ส่งข้อความคุกคาม และรายงานพฤติกรรมที่ไม่เหมาะสม</p></div></div>
      <div className="settings-danger"><div><h3>ออกจากระบบ</h3><p>ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน</p></div><button className="btn btn-danger" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> ออกจากระบบ</button></div>
    </div></>)
}

function LockedProfileDetail({ children, onClose, className = '' }) {
  useViewportScrollLock(true)
  useEffect(() => { const onKey = e => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onClose])
  return createPortal(<div className={'modal-backdrop detail-backdrop ' + className} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>{children}</div>, document.body)
}

function PremiumProfileBadge({ owner = false }) {
  return <span className={"nm-profile-premium-badge" + (owner ? " is-owner" : "")} title={owner ? "Premium ของเจ้าของบัญชี" : "สมาชิก Premium"}>
    <span className="nm-profile-premium-orbit" aria-hidden="true" />
    <Crown size={14} fill="currentColor" strokeWidth={2.1} />
    <b>PREMIUM</b><Sparkles size={12} className="nm-profile-premium-spark" aria-hidden="true" />
  </span>
}

function TapSoundVideo({ className, src, label, onPointerDown, onPointerUp, ...rest }) {
  const videoRef = useRef(null)
  const [soundOn, setSoundOn] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const feedbackTimer = useRef(null)
  const tapOrigin = useRef(null)
  useEffect(() => {
    setSoundOn(true)
    setShowFeedback(false)
    setFeedbackVisible(false)
    const video = videoRef.current
    if (!video) return
    video.muted = false
    const play = video.play()
    if (play?.catch) play.catch(() => {
      // Mobile browsers block unmuted autoplay until the first user gesture.
      video.muted = true
      setSoundOn(false)
      video.play().catch(() => {})
    })
  }, [src])
  useEffect(() => () => window.clearTimeout(feedbackTimer.current), [])
  const flash = () => {
    window.clearTimeout(feedbackTimer.current)
    setShowFeedback(true)
    setFeedbackVisible(true)
    feedbackTimer.current = window.setTimeout(() => setFeedbackVisible(false), 650)
  }
  const toggleSound = e => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    const next = video.muted
    video.muted = !next
    setSoundOn(next)
    flash()
    if (video.paused) video.play().catch(() => {})
  }
  return <div className="nm-tap-sound-wrap" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
    <video {...rest} ref={videoRef} className={className} src={src} playsInline loop autoPlay preload="metadata" onCanPlay={e => { const video = e.currentTarget; if (!video.paused) return; const p = video.play(); if (p?.catch) p.catch(() => { video.muted = true; setSoundOn(false); video.play().catch(() => {}) }) }} aria-label={label} controls={false} onPointerDown={e => { tapOrigin.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; onPointerDown?.(e) }} onPointerUp={e => { const origin = tapOrigin.current; tapOrigin.current = null; if (origin?.id === e.pointerId && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < 12) toggleSound(e); onPointerUp?.(e) }} onPointerCancel={() => { tapOrigin.current = null }} onClick={e => e.stopPropagation()}/>
    {showFeedback && <span className={"nm-tap-sound-feedback" + (feedbackVisible ? " is-visible" : "")} aria-hidden="true" onTransitionEnd={() => { if (!feedbackVisible) setShowFeedback(false) }}>{soundOn ? <Volume2 size={26} strokeWidth={1.65}/> : <VolumeX size={26} strokeWidth={1.65}/>}</span>}
  </div>
}

function ProfileGallery({ person }) {
  const photos = [...new Set([person?.avatar_path, ...(Array.isArray(person?.photo_paths) ? person.photo_paths : [])].filter(Boolean))].map(path => ({ type: 'image', path, key: path }))
  const [media, setMedia] = useState([])
  const [index, setIndex] = useState(0)
  useEffect(() => {
    setIndex(0); setMedia([])
    if (!person?.id) return
    let active = true
    supabase.from('profile_media').select('id,media_type,storage_path').eq('profile_id', person.id).order('created_at', { ascending: true })
      .then(({data,error}) => { if (active && !error) setMedia((data||[]).map(item => ({type:item.media_type,path:item.storage_path,key:item.id}))) }).catch(()=>{})
    return () => { active = false }
  }, [person?.id])
  const items = [...photos, ...media].sort((a, b) => { const order = person?.media_order; if (!Array.isArray(order)) return 0; const ai = order.indexOf(a.key), bi = order.indexOf(b.key); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) })
  const current = items[index] || items[0]
  const touchStart = useRef(null)
  useEffect(() => {
    if (items.length < 2) return
    const next = items[(index + 1) % items.length]
    if (next?.type === 'image' && typeof window !== 'undefined') { const image = new Image(); image.decoding = 'async'; image.src = pub(next.path) }
  }, [index, person?.id, items.length])
  return <div className="detail-gallery v58-swipe-gallery" onPointerDown={e => { if (e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen') touchStart.current = e.clientX }} onPointerUp={e => { if (touchStart.current === null || items.length < 2) return; const diff = e.clientX - touchStart.current; touchStart.current = null; if (Math.abs(diff) > 45) setIndex(i => (i + (diff < 0 ? 1 : items.length - 1)) % items.length) }} onPointerCancel={() => { touchStart.current = null }}>
    {current?.type === 'video' ? <TapSoundVideo key={current.key} className="detail-cover v64-photo-fade" src={mediaPub(current.path)} label={`วิดีโอของ ${person?.display_name || 'สมาชิก'}`} /> : <img className="detail-cover v64-photo-fade" loading="eager" decoding="async" src={pub(current?.path) || ph(person?.display_name)} alt={`รูปของ ${person?.display_name || 'สมาชิก'}`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ph(person?.display_name) }} />}
    {items.length > 1 && <>
      <button type="button" className="gallery-prev" onClick={() => setIndex(i => (i - 1 + items.length) % items.length)} aria-label="สื่อก่อนหน้า">‹</button>
      <button type="button" className="gallery-next" onClick={() => setIndex(i => (i + 1) % items.length)} aria-label="สื่อถัดไป">›</button>
      <div className="gallery-count">{index + 1} / {items.length}</div>
      <div className="gallery-thumbnails">{items.map((item, i) => <button type="button" key={item.key} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`ดูสื่อที่ ${i + 1}`}>{item.type === 'video' ? <span className="v76-video-thumb"><Video size={18}/></span> : <img src={pub(item.path)} alt="" loading="lazy" decoding="async" />}</button>)}</div>
    </>}
  </div>
}

const defaultDiscovery = { mode: 'nearby', radius: 25, gender: '', min: 18, max: 30, universities: [], campusOnly: false }
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
    <div className="discovery-head"><span className="discovery-logo"><img src="/nisit-match-mark.png" alt="" /> <span>NISIT <b>MATCH</b></span></span>{isEditing && <button className="discovery-close" onClick={closeSmoothly} aria-label="ปิด"><X size={20}/></button>}</div>
    <div className="discovery-progress"><span style={{ width: `${(step + 1) * 33.333}%` }}/></div>
    <div className="discovery-step-label">DISCOVERY PREFERENCES <span>0{step + 1} / 03</span></div>
    {step === 0 && <div className="discovery-body"><div className="discovery-symbol"><Heart size={27} strokeWidth={1.6}/></div><h1>หัวใจคุณกำลัง<br/><em>มองหาใครอยู่?</em></h1><p>เลือกคนที่คุณสนใจ แล้วเราจะช่วยพาไปเจอคนที่ใช่</p><div className="discovery-choice-grid">{[['',Users,'ทุกเพศ'],['male',UserRound,'ผู้ชาย'],['female',Heart,'ผู้หญิง'],['other',Sparkles,'เพศอื่น ๆ']].map(([id,Icon,label]) => <button key={id} className={'discovery-choice ' + (pref.gender === id ? 'chosen' : '')} onClick={() => setPref(p => ({...p, gender:id}))}><span className="choice-icon"><Icon size={19} strokeWidth={1.8}/></span><b>{label}</b>{pref.gender === id && <Check size={17}/>}</button>)}</div><div className="discovery-age"><div className="discovery-age-title"><b>ช่วงอายุที่สนใจ</b><span>{pref.min} – {pref.max} ปี</span></div><label>อายุต่ำสุด <input type="range" min="18" max="40" value={pref.min} onChange={e => setPref(p => ({...p,min: Math.min(+e.target.value,p.max)}))}/></label><label>อายุสูงสุด <input type="range" min="18" max="60" value={pref.max} onChange={e => setPref(p => ({...p,max: Math.max(+e.target.value,p.min)}))}/></label></div></div>}
    {step === 1 && <div className="discovery-body"><div className="discovery-symbol"><MapPin size={27} strokeWidth={1.6}/></div><h1>คนที่ใช่<br/><em>อาจอยู่ใกล้กว่าที่คิด</em></h1><p>เลือกว่าจะค้นหาจากมหาวิทยาลัยไหน โดยไม่ต้องเปิด GPS</p><div className="discovery-mode-list">{[['nearby',LocateFixed,'มหาวิทยาลัยใกล้ฉัน','ค้นหาจากระยะห่างระหว่างวิทยาเขต'],['same',GraduationCap,'มหาวิทยาลัยเดียวกัน','คนที่เรียนมหาวิทยาลัยเดียวกับคุณ'],['selected',Compass,'เลือกมหาวิทยาลัยเอง','เลือกได้มากกว่าหนึ่งแห่ง'],['all',Globe2,'ทุกมหาวิทยาลัย','เปิดโอกาสเจอทุกคน']].map(([id,Icon,label,sub]) => <button key={id} className={'discovery-mode ' + (pref.mode === id ? 'chosen' : '')} onClick={() => setPref(p => ({...p,mode:id}))}><span className="mode-icon"><Icon size={19} strokeWidth={1.8}/></span><span><b>{label}</b><small>{sub}</small></span><span className="mode-radio">{pref.mode === id && <Check size={14}/>}</span></button>)}</div>{profile?.campus && UNIVERSITY_CAMPUSES[profile.university_id] && <div className="nm-campus-filter"><label><input type="checkbox" checked={!!pref.campusOnly} onChange={e => setPref(p => ({...p,campusOnly:e.target.checked}))}/><span>เฉพาะวิทยาเขตเดียวกับฉัน</span></label><small>กรองเฉพาะคนที่เลือกวิทยาเขตเดียวกัน · ไม่ใช้ GPS</small></div>}{pref.mode === 'nearby' && <div className="discovery-distance"><div><b>รัศมีค้นหา</b><strong>{pref.radius} กม.</strong></div><input type="range" min="5" max="100" step="5" value={pref.radius} onChange={e => setPref(p => ({...p,radius:+e.target.value}))}/>{!homeHasCoords && <small>ยังไม่มีพิกัดมหาวิทยาลัยของคุณในระบบ กรุณาเลือกโหมดอื่นหรือเพิ่มพิกัดใน campusCoordinates.js</small>}</div>}</div>}
    {step === 2 && <div className="discovery-body"><div className="discovery-symbol"><Check size={27} strokeWidth={1.6}/></div><h1>เกือบแล้ว!<br/><em>พร้อมเจอคนใหม่หรือยัง?</em></h1><p>คุณสามารถกลับมาแก้ไขสเปกได้ทุกเมื่อจากหน้าหลัก</p>{pref.mode === 'selected' ? <div className="discovery-uni-picker"><div className="discovery-uni-list">{UNIVERSITIES.map(u => <button key={u.id} className={pref.universities.includes(u.id) ? 'chosen' : ''} onClick={() => toggleUni(u.id)}><span>{u.name}</span>{pref.universities.includes(u.id) ? <Check size={16}/> : <span>+</span>}</button>)}</div><small>เลือกแล้ว {pref.universities.length} มหาวิทยาลัย</small></div> : <div className="discovery-summary"><div><Heart size={17}/> <span>เพศที่สนใจ</span><b>{GENDERS[pref.gender] || 'ทุกเพศ'}</b></div><div><Cake size={17}/> <span>ช่วงอายุ</span><b>{pref.min}–{pref.max} ปี</b></div><div><GraduationCap size={17}/> <span>มหาวิทยาลัย</span><b>{({nearby:`ใกล้เคียง ${pref.radius} กม.`,same:'มหาวิทยาลัยเดียวกัน',all:'ทุกมหาวิทยาลัย'})[pref.mode]}</b></div></div>}</div>}
    <div className="discovery-actions">{step > 0 && <button className="discovery-back" onClick={() => setStep(x => x - 1)}>ย้อนกลับ</button>}<button className="discovery-next" disabled={saving || (step === 2 && pref.mode === 'selected' && !pref.universities.length) || (step === 2 && pref.mode === 'nearby' && !homeHasCoords)} onClick={() => step < 2 ? setStep(x => x + 1) : finish()}>{saving ? 'กำลังบันทึก...' : step === 2 ? 'เริ่มปัดเลย' : 'ไปต่อ'} <ArrowRight size={19}/></button></div>
    <div className="discovery-privacy"><ShieldCheck size={14}/> ใช้พิกัดมหาวิทยาลัย ไม่ติดตามตำแหน่งของคุณ</div>
  </div></div>
}


function PreferencesEditor({ initial, profile, onSave, onClose }) {
  const [uniSearch, setUniSearch] = useState('')
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
        {profile?.campus && UNIVERSITY_CAMPUSES[profile.university_id] && <div className="nm-campus-filter"><label><input type="checkbox" checked={!!pref.campusOnly} onChange={e => update({campusOnly:e.target.checked})}/><span>เฉพาะวิทยาเขตเดียวกับฉัน</span></label><small>ค้นหาเฉพาะคนในวิทยาเขตของคุณ</small></div>}{pref.mode === 'nearby' && <div className="pref-extra"><div className="pref-extra-head"><span>ระยะทางที่สนใจ</span><b>{pref.radius} กม.</b></div><input className="pref-range" aria-label="ระยะทางค้นหา" type="range" min="5" max="100" step="5" value={pref.radius} style={{'--fill':`calc(10px + (100% - 20px) * ${(pref.radius-5)/95})`}} onChange={e => update({radius:+e.target.value})}/>{!hasCoords && <p className="pref-hint">ยังไม่มีพิกัดวิทยาเขตนี้ กรุณาเลือกวิธีค้นหาอื่น</p>}</div>}
        {pref.mode === 'selected' && <div className="pref-uni-picker">
          <div className="pref-uni-toolbar"><label className="pref-uni-search"><Search size={18}/><input type="search" value={uniSearch} onChange={e => setUniSearch(e.target.value)} placeholder="ค้นหาชื่อมหาวิทยาลัย..." aria-label="ค้นหามหาวิทยาลัย"/></label><span className="pref-uni-count">เลือกแล้ว {pref.universities.length} แห่ง</span></div>
          {pref.universities.length > 0 && <div className="pref-uni-selected"><div className="pref-uni-selected-head"><b>มหาวิทยาลัยที่เลือก</b><button type="button" onClick={() => update({universities:[]})}>ล้างทั้งหมด</button></div><div className="pref-uni-chips">{pref.universities.map(id => {const u=UNIVERSITIES.find(x=>x.id===id);return u?<button key={id} type="button" onClick={()=>toggleUni(id)} title="นำออก"><span>{u.name}</span><X size={13}/></button>:null})}</div></div>}
          <div className="pref-uni-list">{UNIVERSITIES.filter(u=>u.name.toLocaleLowerCase().includes(uniSearch.trim().toLocaleLowerCase())).sort((a,b)=>Number(pref.universities.includes(b.id))-Number(pref.universities.includes(a.id))).map(u => <button type="button" key={u.id} className={pref.universities.includes(u.id) ? 'is-active' : ''} onClick={() => toggleUni(u.id)} aria-pressed={pref.universities.includes(u.id)}><span>{u.name}</span><span className="pref-uni-check">{pref.universities.includes(u.id) && <Check size={14}/>}</span></button>)}{!UNIVERSITIES.some(u=>u.name.toLocaleLowerCase().includes(uniSearch.trim().toLocaleLowerCase())) && <p className="pref-uni-empty">ไม่พบมหาวิทยาลัยที่ค้นหา</p>}</div>
        </div>}
        </section>
      </div>
      <footer className="pref-footer"><span><ShieldCheck size={15}/> ไม่ใช้ตำแหน่ง GPS ส่วนตัว</span><div><button type="button" className="pref-cancel" onClick={close}>ยกเลิก</button><button type="button" className="pref-save" disabled={!valid || saving} onClick={save}>{saving ? 'กำลังบันทึก...' : 'บันทึกสเปก'}<ArrowRight size={17}/></button></div></footer>
    </section>
  </div>
}

function ReferralPanel({ user }) {
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [message, setMessage] = useState('')
  const [noticeType, setNoticeType] = useState('info')
  const [rewardStatus, setRewardStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)
  useEffect(() => {
    let active = true
    supabase.rpc('nm_get_referral_code').then(({ data, error }) => {
      if (!active) return
      if (error) setMessage('ระบบชวนเพื่อนยังไม่พร้อมใช้งาน กรุณาติดตั้ง SQL ก่อน')
      else setCode(data || '')
    }).catch(() => { if (active) setMessage('ไม่สามารถโหลดรหัสเชิญได้') })
    return () => { active = false }
  }, [user.id])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const incoming = params.get('ref')
    if (incoming && /^[a-z0-9]{10,20}$/i.test(incoming)) {
      setInput(incoming.toUpperCase())
      try { localStorage.setItem('nisit-referral-pending', incoming.toUpperCase()) } catch {}
    } else {
      try { const saved = localStorage.getItem('nisit-referral-pending'); if (saved) setInput(saved) } catch {}
    }
  }, [])
  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const { data, error } = await supabase.rpc('nm_referral_status')
        if (!active || error) return
        setRewardStatus(data)
      } catch {}
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    const interval = window.setInterval(refresh, 30000)
    return () => { active = false; window.removeEventListener('focus', onFocus); window.clearInterval(interval) }
  }, [user.id])
  const notify = (type, value) => { setNoticeType(type); setMessage(value) }
  const claim = async () => {
    if (!/^[A-Z0-9]{10,20}$/.test(input.trim().toUpperCase()) || busy || !accepted) return
    setBusy(true); setMessage('')
    try {
      const { data, error } = await supabase.rpc('nm_claim_referral', { p_code: input.trim().toUpperCase() })
      if (error) throw error
      const feedback = {
        rewarded: ['success', '🎉 ยินดีด้วย! คุณได้รับ Premium ฟรี 3 วันแล้ว และคนชวนได้รับ 7 วัน'],
        pending_verification: ['info', '✅ ใช้รหัสสำเร็จ! ยืนยันอีเมลมหาวิทยาลัยเพื่อรับ Premium ฟรี 3 วัน'],
        already_rewarded: ['success', '🎁 คุณใช้รหัสนี้ไปแล้ว และได้รับ Premium ฟรี 3 วันเรียบร้อย'],
        already_claimed: ['warning', 'ℹ️ คุณใช้รหัสนี้ไปแล้ว กำลังรอการยืนยันมหาวิทยาลัย'],
        already_used_other: ['warning', '⚠️ คุณเคยใช้รหัสชวนเพื่อนอื่นไปแล้ว ใช้รหัสใหม่ไม่ได้'],
        invalid_code: ['error', '❌ ไม่พบรหัสเชิญนี้ กรุณาตรวจสอบอีกครั้ง'],
        self_referral: ['error', '❌ ไม่สามารถใช้รหัสเชิญของตัวเองได้']
      }
      const [type, msg] = feedback[data] || ['info', 'บันทึกรหัสเชิญแล้ว']
      notify(type, msg)
      if (['rewarded','pending_verification','already_rewarded','already_claimed'].includes(data)) {
        try { localStorage.removeItem('nisit-referral-pending') } catch {}
      }
      const status = await supabase.rpc('nm_referral_status')
      if (!status.error) setRewardStatus(status.data)
    } catch (error) { notify('error', error?.message || 'บันทึกรหัสไม่สำเร็จ') }
    finally { setBusy(false) }
  }
  const link = code ? window.location.origin + '/?ref=' + encodeURIComponent(code) : ''
  return <section className="nm-referral-card">
    <div className="nm-referral-heading"><span><Sparkles size={15}/> INVITE & EARN</span><h2>🎁 ชวนเพื่อน รับ Premium ฟรี</h2><p>ชวนเพื่อนมาเจอคนที่ใช่ แล้วปลดล็อกสิทธิพิเศษด้วยกัน</p></div>
    <div className="nm-referral-rewards"><div><span>คนชวน</span><strong>+7 วัน</strong><small>Premium ฟรี</small></div><div><span>เพื่อนที่ถูกชวน</span><strong>+3 วัน</strong><small>Premium ฟรี</small></div></div>
    {rewardStatus?.claimed && <div className={'nm-referral-status nm-referral-status--' + (rewardStatus.rewarded ? 'success' : 'pending')} role="status">
      <strong>{rewardStatus.rewarded ? '🎉 คุณได้รับ Premium ฟรีแล้ว!' : '⏳ รอยืนยันอีเมลมหาวิทยาลัย'}</strong>
      <span>{rewardStatus.rewarded ? 'ได้รับ Premium ฟรี ' + rewardStatus.days + ' วันจากการชวนเพื่อน' : 'ใช้รหัส ' + rewardStatus.code + ' แล้ว ยืนยันมหาวิทยาลัยเพื่อรับสิทธิ์'}</span>
    </div>}
    <div className="nm-referral-code-area"><span>รหัสเชิญของคุณ</span><strong>{code || 'กำลังโหลดรหัส...'}</strong><div className="nm-referral-buttons">
      <button type="button" disabled={!code} onClick={async()=>{try{await navigator.clipboard.writeText(code);setMessage('คัดลอกรหัสเชิญแล้ว')}catch{setMessage('คัดลอกไม่สำเร็จ')}}}>คัดลอกรหัส</button>
      <button type="button" disabled={!code} onClick={async()=>{try{await navigator.clipboard.writeText(link);setMessage('คัดลอกลิงก์แล้ว')}catch{setMessage('คัดลอกไม่สำเร็จ')}}}>คัดลอกลิงก์</button>
    </div></div>
    <div className="nm-referral-use"><label htmlFor="referral-code-input">ได้รับรหัสจากเพื่อน?</label><div><input id="referral-code-input" aria-label="รหัสเชิญ" placeholder="กรอกรหัสเชิญ" maxLength={20} value={input} onChange={e=>setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))}/><button type="button" disabled={busy || !accepted || !/^[A-Z0-9]{10,20}$/.test(input.trim())} onClick={claim}>{busy?'กำลังบันทึก...':'ใช้รหัสเชิญ'}</button></div>
    <label className="nm-referral-accept"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/> ฉันอ่านและยอมรับเงื่อนไขการใช้รหัสเชิญ</label></div>
    <button type="button" className="nm-referral-terms-button" aria-expanded={termsOpen} onClick={()=>setTermsOpen(v=>!v)}><ShieldCheck size={17}/> เงื่อนไขและกติกา <span>{termsOpen?'−':'+'}</span></button>
    {termsOpen&&<div className="nm-referral-terms"><ol><li>ผู้ถูกชวนต้องยืนยันอีเมลมหาวิทยาลัยจนสถานะเป็น Verified</li><li>คนชวนรับ Premium 7 วัน ผู้ถูกชวนรับ 3 วัน หลังผ่านการตรวจสอบ</li><li>แต่ละบัญชีรับคำเชิญได้ครั้งเดียว และห้ามใช้รหัสของตัวเอง</li><li>มี Premium อยู่แล้วจะต่อวันจากวันหมดอายุเดิม ไม่ลบสิทธิ์เก่า</li><li>รางวัลหนึ่งคำเชิญให้เพียงครั้งเดียว ไม่สามารถกดรับซ้ำได้</li><li>ห้ามสร้างบัญชีปลอมหรือแอบอ้างเพื่อรับสิทธิ์</li></ol><p>การกรอกรหัสอย่างเดียวไม่ได้ทำให้ได้รับ Premium ทันที ระบบจะตรวจสอบสถานะจาก Supabase ก่อน</p></div>}
    {message&&<p role="status" className={"nm-referral-feedback nm-referral-feedback--"+noticeType}>{message}</p>}
  </section>
}


function PremiumPage({ user, onGoVisitors }) {
  const [status, setStatus] = useState(null)
  const [plan, setPlan] = useState('weekly')
  const [slipFile, setSlipFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [showPayment, setShowPayment] = useState(true)
  const fileInputRef = useRef(null)

  const loadStatus = useCallback(async () => {
    const { data, error } = await supabase.from('premium_subscriptions')
      .select('plan,status,ends_at').eq('user_id', user.id).maybeSingle()
    if (!error) setStatus(data)
  }, [user.id])

  useEffect(() => { loadStatus() }, [loadStatus])

  const activePlan = status?.status === 'active' && status.ends_at && new Date(status.ends_at) > new Date()
  const submitSlip = async () => {
    if (!slipFile) {
      setMessage('กรุณาเลือกรูปสลิปก่อนส่งตรวจสอบ')
      setMessageType('error')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(slipFile.type)) {
      setMessage('รองรับไฟล์ JPG, PNG, WEBP หรือ GIF เท่านั้น')
      setMessageType('error')
      return
    }
    if (slipFile.size > 4 * 1024 * 1024) {
      setMessage('ไฟล์สลิปต้องมีขนาดไม่เกิน 4 MB')
      setMessageType('error')
      return
    }
    setBusy(true)
    setMessage('กำลังตรวจสอบสลิปกับระบบ กรุณาอย่าปิดหน้านี้')
    setMessageType('info')
    try {
      const form = new FormData()
      form.append('image', slipFile, slipFile.name)
      form.append('plan', plan)
      const { data, error } = await supabase.functions.invoke('thunder-verify-slip', { body: form })
      if (error) throw error
      if (!data?.verified || !data?.activated) {
        throw new Error(data?.error || 'ตรวจสอบสลิปไม่ผ่าน กรุณาตรวจยอดเงินและรูปสลิป')
      }
      setSlipFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessage(data.message || 'ตรวจสอบสำเร็จ')
      setMessageType('success')
      await loadStatus()
    } catch (error) {
      setMessage(error?.message || 'ส่งตรวจสอบไม่สำเร็จ กรุณาลองใหม่')
      setMessageType('error')
    } finally {
      setBusy(false)
    }
  }

  const selectedAmount = plan === 'weekly' ? 39 : 119
  const selectedDuration = plan === 'weekly' ? '7 วัน' : '30 วัน'
  return <div className="v76-page nm-coming-soon-page nm-premium-clean">
    <style>{`@keyframes nmPremiumShimmer{0%{background-position:0% 50%;filter:brightness(1)}50%{background-position:100% 50%;filter:brightness(1.12)}100%{background-position:0% 50%}}@keyframes nmPremiumFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes nmPremiumGlow{0%,100%{box-shadow:0 0 0 1px rgba(244,114,182,.18),0 0 18px rgba(236,72,153,.08)}50%{box-shadow:0 0 0 1px rgba(244,114,182,.5),0 0 30px rgba(168,85,247,.24),0 0 54px rgba(236,72,153,.1)}}@keyframes nmPremiumTwinkle{0%,100%{opacity:.2;transform:scale(.7) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(45deg)}}.nm-premium-clean{position:relative;isolation:isolate}.nm-premium-clean:before{content:"";position:absolute;z-index:-1;inset:-12px -8px auto;height:440px;pointer-events:none;background:radial-gradient(ellipse at 18% 12%,rgba(236,72,153,.15),transparent 48%),radial-gradient(ellipse at 86% 20%,rgba(139,92,246,.18),transparent 45%);filter:blur(12px)}.nm-premium-clean .nm-premium-page-kicker{letter-spacing:.16em;color:#f9a8d4;text-shadow:0 0 18px rgba(236,72,153,.35)}.nm-premium-clean .nm-premium-page-heading h1{text-shadow:0 0 28px rgba(236,72,153,.22)}.nm-premium-clean .nm-premium-hero-clean{position:relative;overflow:hidden;border:1px solid rgba(244,114,182,.3);background:radial-gradient(ellipse at 85% 10%,rgba(168,85,247,.24),transparent 44%),radial-gradient(ellipse at 12% 100%,rgba(236,72,153,.18),transparent 48%),linear-gradient(145deg,rgba(27,17,39,.97),rgba(12,10,22,.98));box-shadow:0 14px 42px rgba(0,0,0,.22),inset 0 1px rgba(255,255,255,.06)}.nm-premium-clean .nm-premium-hero-clean:after{content:"✦  ·  ✧       ·       ✦";position:absolute;right:14px;top:15px;letter-spacing:12px;font-size:12px;color:#f9a8d4;text-shadow:0 0 12px #ec4899;animation:nmPremiumTwinkle 3s ease-in-out infinite;pointer-events:none}.nm-premium-clean .v76-premium-orb{filter:drop-shadow(0 0 16px rgba(236,72,153,.55));animation:nmPremiumFloat 4s ease-in-out infinite}.nm-premium-clean .nm-coming-soon-pill{background:linear-gradient(100deg,rgba(236,72,153,.16),rgba(168,85,247,.28),rgba(236,72,153,.16));background-size:200% 200%;animation:nmPremiumShimmer 4s ease-in-out infinite;border:1px solid rgba(244,114,182,.4);box-shadow:0 0 22px rgba(236,72,153,.1)}.nm-premium-clean .nm-premium-benefits{gap:10px}.nm-premium-clean .nm-premium-benefit{border:1px solid rgba(255,255,255,.07);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border-radius:16px;padding:12px;transition:border-color .25s,transform .25s}.nm-premium-clean .nm-premium-benefit-icon{animation:nmPremiumFloat 3.5s ease-in-out infinite;filter:drop-shadow(0 0 8px rgba(236,72,153,.32))}.nm-premium-clean > section[style*="margin-top:18px"]{position:relative;overflow:visible;border:0!important;background:transparent!important;box-shadow:none!important;animation:none;padding:8px 0!important}.nm-premium-clean > section[style*="margin-top:18px"] button[aria-pressed]{transition:transform .22s,border-color .22s,box-shadow .22s}.nm-premium-clean > section[style*="margin-top:18px"] button[aria-pressed="true"]{animation:nmPremiumGlow 3.5s ease-in-out infinite;background:linear-gradient(135deg,rgba(190,24,93,.26),rgba(126,34,206,.2))!important;transform:translateY(-2px)}.nm-premium-clean .nm-premium-visitors-link{border-color:rgba(244,114,182,.2)}@media(max-width:480px){.nm-premium-clean .nm-premium-hero-clean{padding:22px 16px}.nm-premium-clean > section[style*="margin-top:18px"]{padding:8px 0!important;border-radius:0!important}.nm-premium-clean .nm-premium-benefit{padding:10px}.nm-premium-clean .nm-premium-benefit small{font-size:11px}}`}</style>
    <header className="nm-premium-page-heading">
      <span className="nm-premium-page-kicker">NISIT MATCH <i /> PREMIUM</span>
      <h1>อัปเกรดเป็น Premium</h1>
      <p>ปลดล็อกประสบการณ์ทำความรู้จักให้เต็มที่กว่าเดิม</p>
    </header>
    <div className="v76-premium-hero nm-coming-soon-hero nm-premium-hero-clean">
      {activePlan && <div className="nm-premium-active-chip"><Crown size={14}/> ใช้งาน Premium ถึง {new Date(status.ends_at).toLocaleDateString('th-TH')}</div>}
      <div className="v76-premium-orb"><Crown size={30}/></div>
      <span className="v76-eyebrow">A LITTLE MORE MAGIC</span>
      <h2>{activePlan ? 'Premium ของคุณกำลังทำงาน' : 'ให้ทุกการปัดพิเศษกว่าเดิม'}</h2>
      <p>{activePlan ? 'สิทธิ์ Premium ของคุณเปิดใช้งานอยู่แล้ว' : 'เลือกแพ็กเกจ สแกน QR เพื่อชำระเงิน แล้วส่งสลิปให้ระบบตรวจสอบอัตโนมัติ'}</p>
      <div className="nm-coming-soon-pill"><Sparkles size={15}/> พร้อมจำหน่ายแล้ว</div>
    </div>
    <section className="nm-premium-benefits" aria-label="สิทธิพิเศษ Premium">
      <div className="nm-premium-benefit nm-premium-unlimited"><span className="nm-premium-benefit-icon"><Sparkles size={19}/></span><span><b>ปัดได้ไม่จำกัดโควต้า</b><small>สำหรับสมาชิก Premium เมื่อเปิดใช้งาน</small></span></div>
      <div className="nm-premium-benefit"><span className="nm-premium-benefit-icon"><HeartHandshake size={19}/></span><span><b>คนที่กดใจคุณ</b><small>รู้ว่าใครสนใจคุณ</small></span></div>
      <div className="nm-premium-benefit"><span className="nm-premium-benefit-icon"><EyeIcon size={19}/></span><span><b>ผู้เข้าชมโปรไฟล์</b><small>ดูคนที่แวะมาเยี่ยมชม</small></span></div>
      <div className="nm-premium-benefit"><span className="nm-premium-benefit-icon"><Sparkles size={19}/></span><span><b>สิทธิพิเศษอื่น ๆ</b><small>ทยอยเปิดให้ใช้ในอนาคต</small></span></div>
    </section>
    <section style={{marginTop:18,padding:'8px 0',border:0,borderRadius:0,background:'transparent'}}>
      <h2 style={{margin:'0 0 6px',fontSize:19}}>เลือกแพ็กเกจ Premium</h2>
      <p style={{margin:'0 0 14px',fontSize:13,opacity:.76}}>ชำระด้วย QR PromptPay แล้วแนบสลิปเพื่อตรวจสอบ</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        {[{id:'weekly',amount:39,duration:'7 วัน',label:'รายสัปดาห์'},{id:'monthly',amount:119,duration:'30 วัน',label:'รายเดือน'}].map(item=><button key={item.id} type="button" onClick={()=>{setPlan(item.id);setMessage('')}} aria-pressed={plan===item.id} style={{textAlign:'left',padding:14,borderRadius:16,border:plan===item.id?'1.5px solid #f472b6':'1px solid rgba(255,255,255,.12)',background:plan===item.id?'rgba(190,24,93,.18)':'rgba(255,255,255,.035)',color:'inherit',cursor:'pointer'}}>
          <span style={{display:'block',fontSize:12,opacity:.75}}>{item.label}</span><strong style={{display:'block',fontSize:25,margin:'4px 0'}}>{item.amount} บาท</strong><span style={{fontSize:12,opacity:.75}}>{item.duration}</span>{plan===item.id&&<span style={{display:'block',fontSize:11,color:'#f9a8d4',marginTop:7}}>✓ เลือกแล้ว</span>}
        </button>)}
      </div>
      <button type="button" onClick={()=>{setShowPayment(v=>!v);setMessage('')}} style={{width:'100%',marginTop:14,padding:'13px 16px',border:0,borderRadius:14,background:'linear-gradient(100deg,#ec4899,#a855f7)',color:'#fff',fontWeight:750,fontSize:15,cursor:'pointer'}}>{showPayment?'ซ่อน QR และแบบฟอร์ม':'แสดง QR เพื่อชำระเงิน · '+selectedAmount+' บาท'}</button>
      {showPayment&&<div style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.1)'}}>
        <div style={{display:'grid',placeItems:'center',gap:8}}>
          <div style={{position:'relative',width:'min(72vw,240px)',aspectRatio:'1/1',overflow:'hidden',borderRadius:18,background:'#fff',boxShadow:'0 0 0 1px rgba(255,255,255,.18),0 12px 36px rgba(236,72,153,.18)',border:'5px solid #fff',boxSizing:'border-box'}}><img src={plan==='weekly'?'/premium-39.jpg':'/premium-119.jpg'} alt={'QR PromptPay '+selectedAmount+' บาท'} style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/></div>
          <strong style={{fontSize:18}}>ยอดชำระ {selectedAmount} บาท</strong>
          <span style={{fontSize:12,opacity:.75}}>แพ็กเกจ {selectedDuration} · ตรวจสอบชื่อผู้รับก่อนโอนทุกครั้ง</span>
        </div>
        <label htmlFor="premium-slip-upload" style={{display:'block',marginTop:18,marginBottom:7,fontSize:13,fontWeight:700}}>แนบสลิปการโอน</label>
        <input ref={fileInputRef} id="premium-slip-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" disabled={busy} onChange={e=>{setSlipFile(e.target.files?.[0]||null);setMessage('')}} style={{width:'100%',boxSizing:'border-box',padding:11,borderRadius:12,border:'1px solid rgba(255,255,255,.16)',background:'rgba(255,255,255,.04)',color:'inherit'}}/>
        <p style={{fontSize:12,opacity:.7,margin:'7px 0 12px'}}>รองรับ JPG / PNG / WEBP / GIF ไม่เกิน 4 MB · สลิปซ้ำหรือยอดไม่ตรงจะไม่ผ่าน</p>
        <button type="button" disabled={busy||!slipFile} onClick={submitSlip} style={{width:'100%',padding:'13px 16px',border:0,borderRadius:14,background:busy||!slipFile?'#51465b':'#db2777',color:'#fff',fontWeight:750,fontSize:15,cursor:busy||!slipFile?'not-allowed':'pointer'}}>{busy?'กำลังตรวจสอบสลิป…':'ส่งสลิปตรวจสอบอัตโนมัติ'}</button>
      </div>}
      {message&&<p role="status" aria-live="polite" style={{margin:'12px 0 0',padding:11,borderRadius:12,fontSize:13,background:messageType==='error'?'rgba(239,68,68,.12)':messageType==='success'?'rgba(34,197,94,.12)':'rgba(168,85,247,.12)',color:messageType==='error'?'#fca5a5':messageType==='success'?'#86efac':'#e9d5ff'}}>{message}</p>}
    </section>
    <button type="button" className="v76-secondary-link nm-premium-visitors-link" onClick={onGoVisitors}><EyeIcon size={16}/> ดูผู้เข้าชมโปรไฟล์</button>
    <ReferralPanel user={user} />
    <p className="v76-disclaimer">* สิทธิ์และระยะเวลา Premium จะเปิดใช้งานเมื่อระบบตรวจสอบสลิปสำเร็จเท่านั้น โปรดตรวจชื่อบัญชีผู้รับก่อนชำระเงิน</p>
  </div>
}

function LikesVisitorsPage({ user, notify, onOpenProfile, onGoPremium }) {
  const [tab, setTab] = useState('likes')
  return <div className="v76-page">
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
      {[['likes','คนที่กดใจ',HeartHandshake],['visitors','ผู้เข้าชมโปรไฟล์',EyeIcon]].map(([id,label,Icon]) =>
        <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab===id}
          className={tab===id?'btn btn-primary':'btn btn-ghost'}
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,minWidth:0,padding:'12px 8px',borderRadius:14,fontSize:13}}>
          <Icon size={17}/><span>{label}</span>
        </button>)}
    </div>
    <PremiumListPage kind={tab} user={user} notify={notify} onOpenProfile={onOpenProfile} onGoPremium={onGoPremium}/>
  </div>
}

function PremiumListPage({ kind, user, notify, onOpenProfile, onGoPremium }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  useEffect(() => {
    let active = true
    const rpc = kind === 'likes' ? 'get_received_likes' : 'get_profile_visitors'
    supabase.rpc(rpc).then(({data,error}) => {
      if (!active) return
      setLoading(false)
      if (error) {
        const msg = String(error.message || '').toLowerCase()
        if (msg.includes('premium') || msg.includes('subscription')) setLocked(true)
        else notify(`โหลดข้อมูลไม่สำเร็จ: ${error.message} · ตรวจว่าได้รัน SQL v76 แล้ว`)
        return
      }
      setItems(data || [])
    }).catch(() => { if (active) { setLoading(false); notify('เชื่อมต่อข้อมูลไม่สำเร็จ') } })
    return () => { active = false }
  }, [kind, notify])
  const isLikes = kind === 'likes'
  return <div className="v76-page"><Heading kicker={isLikes?'YOUR ADMIRERS':'PROFILE VISITORS'} title={isLikes?'คนที่กดใจคุณ':'คนที่เข้าชมโปรไฟล์'} sub={isLikes?'คนที่ส่งหัวใจมาให้คุณ อาจเป็นคนที่กำลังรอให้คุณทัก':'ดูคนที่แวะเข้ามาดูโปรไฟล์ของคุณ'} />
    {locked ? <div className="v76-locked-panel"><div className="v76-lock-icon"><Crown size={28}/></div><h2>ฟีเจอร์สำหรับ Premium</h2><p>อัปเกรดเพื่อดูรายชื่อแบบเต็ม โดยข้อมูลจะแสดงเมื่อระบบ Premium เปิดใช้งานและตรวจสอบสิทธิ์แล้ว</p><button className="v76-primary-cta" onClick={onGoPremium}>ดูแพ็กเกจ Premium <ArrowRight size={17}/></button></div> : loading ? <div className="page-center"><span className="spin"/></div> : items.length ? <div className="v76-people-grid">{items.map(item => <button className="v76-person-row" key={item.id} onClick={()=>onOpenProfile(item)}><Av u={item} cls="v76-person-avatar"/><span><b>{item.display_name}{item.age?`, ${item.age}`:''}</b><small>{uniName(item.university_id)}{item.faculty?` · ${item.faculty}`:''}</small><small>{item.viewed_at?`เข้าชม ${new Date(item.viewed_at).toLocaleDateString('th-TH')}`:item.liked_at?`กดใจ ${new Date(item.liked_at).toLocaleDateString('th-TH')}`:''}</small></span><ArrowRight size={17}/></button>)}</div> : <div className="v76-empty"><div><HeartHandshake size={30}/></div><h2>{isLikes?'ยังไม่มีคนกดใจที่แสดงได้':'ยังไม่มีผู้เข้าชมที่แสดงได้'}</h2><p>{isLikes?'เมื่อมีคนกดใจคุณ รายชื่อจะแสดงตรงนี้เมื่อ Premium พร้อมใช้งาน':'เมื่อมีคนเปิดโปรไฟล์ รายชื่อจะเริ่มปรากฏที่นี่'}</p></div>}
  </div>
}

const HANGOUT_VENUES = [
  // ร้านแนะนำจากรายการสาธารณะ; เปิดแผนที่เพื่อตรวจสอบพิกัด/เวลาอีกครั้งก่อนเดินทาง
  {name:'Zync Rangsit',area:'เมืองเอก · ม.รังสิต',city:'รังสิต, ปทุมธานี',address:'89/9 ซอยหลักหก ตำบลหลักหก อำเภอเมืองปทุมธานี',vibe:'ผับ · ดนตรีสด',query:'Zync Rangsit'},
  {name:'HASHTAG Rangsit',area:'หลักหก · รังสิต',city:'รังสิต, ปทุมธานี',address:'หลักหก เมืองเอก ปทุมธานี',vibe:'ไนต์ไลฟ์ · ดนตรี',query:'HASHTAG Rangsit'},
  {name:'JACK BAR Rangsit',area:'เมืองเอก · ม.รังสิต',city:'รังสิต, ปทุมธานี',address:'เมืองเอก ตำบลหลักหก ปทุมธานี',vibe:'ค็อกเทลบาร์ · นั่งชิล',query:'JACK BAR Rangsit'},
  {name:'8E88 Bar & Bistro',area:'รังสิต · ปทุมธานี',city:'รังสิต, ปทุมธานี',address:'ถนนพหลโยธิน ประชาธิปัตย์ ธัญบุรี',vibe:'บาร์แอนด์บิสโทร · ดนตรีสด',query:'8E88 Bar & Bistro Rangsit'},
  {name:'Blur Rangsit',area:'คลองหลวง · ม.กรุงเทพ',city:'คลองหลวง, ปทุมธานี',address:'คลองหนึ่ง คลองหลวง ปทุมธานี',vibe:'ผับ · ไนต์ไลฟ์',query:'Blur Rangsit'},
  {name:'โกดังรังสิต',area:'รังสิต · ปทุมธานี',city:'รังสิต, ปทุมธานี',address:'ถนนรังสิต-นครนายก ปทุมธานี',vibe:'ร้านอาหาร · ดนตรีสด',query:'Kodang Rangsit'},
  {name:'คลองเพลง 1',area:'ธัญบุรี · รังสิต',city:'ธัญบุรี, ปทุมธานี',address:'ถนนรังสิต-นครนายก ธัญบุรี',vibe:'ดนตรีสด · กลุ่มเพื่อน',query:'Klong Pleang 1 Rangsit'},
  {name:'The Big Tree รังสิต',area:'คลองหลวง · ธรรมศาสตร์',city:'คลองหลวง, ปทุมธานี',address:'คลองหนึ่ง คลองหลวง ปทุมธานี',vibe:'สวน · ร้านอาหาร · เครื่องดื่ม',query:'The Big Tree Rangsit'},
  {name:'Sports Bar at Novotel Rangsit',area:'ฟิวเจอร์พาร์ค · รังสิต',city:'รังสิต, ปทุมธานี',address:'Novotel Bangkok Future Park Rangsit',vibe:'สปอร์ตบาร์ · นั่งคุย',query:'Sports Bar Novotel Bangkok Future Park Rangsit'},
  {name:'Merry Vibes Privacy Craft',area:'เมืองปทุม · รังสิต',city:'เมืองปทุมธานี, ปทุมธานี',address:'The Loop Rangsit ซอยวัดเสด็จ',vibe:'คราฟต์เบียร์ · ดนตรี',query:'Merry Vibes Privacy Craft Rangsit'},
  {name:'The Secret at Kaset',area:'เกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'งามวงศ์วาน แขวงลาดยาว เขตจตุจักร',vibe:'บาร์ · ดนตรีสด',query:'The Secret at Kaset'},
  {name:'Marin Kaset Rooftop Bar',area:'เกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'19/6 แขวงลาดยาว เขตจตุจักร',vibe:'รูฟท็อป · ดนตรีสด',query:'Marin Kaset Rooftop Bar'},
  {name:'Club Microphone | KU',area:'ตลาดอมรพันธ์ · เกษตร',city:'เกษตร, กรุงเทพฯ',address:'ตลาดอมรพันธ์ ซอยอมรพันธ์ แขวงลาดยาว',vibe:'คาราโอเกะ · ห้องส่วนตัว',query:'Club Microphone KU'},
  {name:'GuestHouse Kaset',area:'เกษตร · เสนานิคม',city:'เกษตร, กรุงเทพฯ',address:'ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร',vibe:'ผับ · ดนตรีสด',query:'GuestHouse Kaset'},
  {name:'Madi333',area:'ตลาดอมรพันธ์ · เกษตร',city:'เกษตร, กรุงเทพฯ',address:'ซอยอมรพันธ์ แขวงลาดยาว เขตจตุจักร',vibe:'บาร์ · ดนตรี',query:'Madi333 Kaset'},
  {name:'GoDung Kaset',area:'เกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'2103/46 แขวงลาดยาว เขตจตุจักร',vibe:'ดนตรีสด · ร้านนั่งชิล',query:'GoDung Kaset'},
  {name:'VIRAL Kaset',area:'สะพานเกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'ชั้น 4 อาคารคอร์เนอร์ ใกล้สะพานเกษตร',vibe:'บาร์ · ไนต์ไลฟ์',query:'VIRAL Kaset'},
  {name:'The Traffic',area:'เกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'ย่านมหาวิทยาลัยเกษตรศาสตร์ บางเขน',vibe:'แฮงเอาต์ · ดนตรีสด',query:'The Traffic Kaset'},
  {name:'Morty’s',area:'เกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'ย่านเกษตร-บางเขน กรุงเทพฯ',vibe:'บาร์ · ปาร์ตี้',query:'Mortys Kaset'},
  {name:'Ivory Coast Almond',area:'เกษตร · บางเขน',city:'เกษตร, กรุงเทพฯ',address:'ย่านเกษตร-บางเขน กรุงเทพฯ',vibe:'สวน · ดนตรีสด',query:'Ivory Coast Almond Kaset'},
  {name:'บ้านเพื่อน บางกอก',area:'เกษตรนวมินทร์ · บางเขน',city:'เกษตรนวมินทร์, กรุงเทพฯ',address:'36 ถนนประเสริฐมนูกิจ แขวงเสนานิคม',vibe:'ดนตรีสด · กลุ่มเพื่อน',query:'บ้านเพื่อน บางกอก'},
  {name:'The Moon · ลาดกระบัง',area:'ลาดกระบัง · KMITL',city:'ลาดกระบัง, กรุงเทพฯ',address:'ย่านลาดกระบัง กรุงเทพฯ · ควรตรวจสอบพิกัดและชื่อร้านบนแผนที่ก่อนเดินทาง',vibe:'ร้านนั่งชิล · Hangout',query:'The Moon bar Lat Krabang Bangkok'},
  {name:'ละมุนบาร์ ลาดกระบัง',area:'ลาดกระบัง · KMITL',city:'ลาดกระบัง, กรุงเทพฯ',address:'ตลาดต้นไทร ซอยลาดกระบัง 13/1',vibe:'ร้านนั่งดื่ม · ดนตรีสด',query:'ละมุนบาร์ ลาดกระบัง'},
  {name:'Bangmod Cafe and Glamping',area:'พุทธบูชา · KMUTT',city:'บางมด, กรุงเทพฯ',address:'286 แขวงบางมด เขตทุ่งครุ',vibe:'แคมป์ปิ้ง · นั่งชิลช่วงเย็น',query:'Bangmod Cafe and Glamping'},
]
const HANGOUT_CAMPUS_SEARCHES = [
  {label:'KMITL · ลาดกระบัง',query:'ร้านเหล้า บาร์ ผับ ใกล้ KMITL ลาดกระบัง'},
  {label:'KU · เกษตรบางเขน',query:'bars pubs near Kasetsart University Bangkhen'},
  {label:'CU · จุฬาฯ',query:'ร้านเหล้า บาร์ ใกล้ จุฬาลงกรณ์มหาวิทยาลัย'},
  {label:'TU · ธรรมศาสตร์ รังสิต',query:'bars pubs near Thammasat University Rangsit'},
  {label:'KMUTT · บางมด',query:'bars pubs near KMUTT Bangmod'},
  {label:'KMUTNB · พระนครเหนือ',query:'ร้านเหล้า บาร์ ใกล้ มจพ พระนครเหนือ'},
  {label:'BUU · บางแสน',query:'ร้านเหล้า บาร์ ใกล้ มหาวิทยาลัยบูรพา บางแสน'},
  {label:'SWU · อโศก/ประสานมิตร',query:'bars pubs near Srinakharinwirot University Prasarnmit'},
  {label:'SU · ศิลปากร',query:'ร้านเหล้า บาร์ ใกล้ มหาวิทยาลัยศิลปากร วังท่าพระ'},
  {label:'BU · ม.กรุงเทพ รังสิต',query:'bars pubs near Bangkok University Rangsit'},
]

const mapsSearchUrl = (name, area='') => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name,area].filter(Boolean).join(' '))}`

const mapsEmbedUrl = (name, area='') => `https://www.google.com/maps?q=${encodeURIComponent([name,area].filter(Boolean).join(' '))}&output=embed`

function HangoutPage({ user, profile, notify, onJoinedHangout, onGoVerify }) {
  const [campusVerification, setCampusVerification] = useState(null)
  const [campusVerificationLoading, setCampusVerificationLoading] = useState(true)
  const isCampusVerified = campusVerification?.status === 'verified'
  useEffect(() => {
    let active = true
    setCampusVerificationLoading(true)
    supabase.from('student_verifications').select('status,university_id,verified_email').eq('user_id', user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        setCampusVerification(error ? null : (data || { status: 'unverified' }))
        setCampusVerificationLoading(false)
      })
      .catch(() => { if (active) { setCampusVerification(null); setCampusVerificationLoading(false) } })
    return () => { active = false }
  }, [user.id])
  const [hangoutSearch, setHangoutSearch] = useState('')
  const [hangoutFilter, setHangoutFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [joined, setJoined] = useState([])
  const [counts, setCounts] = useState({})
  const [venueQuery, setVenueQuery] = useState('')
  const [showVenuePicker, setShowVenuePicker] = useState(false)
  const [mapTarget, setMapTarget] = useState(null)
  const [chatEvent, setChatEvent] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatNames, setChatNames] = useState({})
  const [chatMembers, setChatMembers] = useState([])
  const [chatDraft, setChatDraft] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [form, setForm] = useState({title:'',venue:'',city:'รังสิต, ปทุมธานี',starts_at:'',capacity:'6',description:''})
  useViewportScrollLock(!!mapTarget || !!chatEvent)
  useEffect(() => {
    if (!mapTarget && !chatEvent) return
    const updateViewport = () => {
      document.documentElement.style.setProperty('--nm-visual-height', `${window.visualViewport?.height || window.innerHeight}px`)
      document.documentElement.style.setProperty('--nm-visual-top', `${window.visualViewport?.offsetTop || 0}px`)
    }
    updateViewport(); window.visualViewport?.addEventListener('resize', updateViewport); window.addEventListener('resize', updateViewport)
    return () => { window.visualViewport?.removeEventListener('resize', updateViewport); window.removeEventListener('resize', updateViewport); document.documentElement.style.removeProperty('--nm-visual-height'); document.documentElement.style.removeProperty('--nm-visual-top') }
  }, [!!mapTarget, !!chatEvent])
  const visibleHangouts = events.filter(event => {
    const text = [event.title,event.venue,event.city,event.description].filter(Boolean).join(' ').toLocaleLowerCase()
    const matchesSearch = text.includes(hangoutSearch.trim().toLocaleLowerCase())
    const participants = counts[event.id] || 0
    return matchesSearch && (hangoutFilter === 'all' || (hangoutFilter === 'available' && participants < Number(event.capacity)) || (hangoutFilter === 'joined' && joined.includes(event.id)))
  })
  const filteredVenues = HANGOUT_VENUES.filter(v => `${v.name} ${v.area} ${v.address}`.toLowerCase().includes(venueQuery.trim().toLowerCase()))
  const chooseVenue = venue => { setForm(old => ({...old, venue:venue.name, city:venue.city})); setVenueQuery(venue.name); setShowVenuePicker(false) }
  const refresh = useCallback(async () => {
    if (!isCampusVerified) { setEvents([]); setJoined([]); setCounts({}); setLoading(false); return }
    let data, error
    try {
      const result = await Promise.race([
        supabase.from('hangout_events').select('id,creator_id,title,venue,city,starts_at,capacity,description,created_at,status').eq('status','open').gte('starts_at',new Date().toISOString()).order('starts_at',{ascending:true}).limit(40),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ])
      data = result.data; error = result.error
    } catch (e) { error = e }
    if (error) { setLoading(false); if (!String(error.message||'').includes('does not exist')) notify(error.message === 'timeout' ? 'โหลด Hangout ช้าเกินไป กรุณาลองใหม่' : 'โหลด Hangout ไม่สำเร็จ: '+error.message); return }
    const list=(data||[]).filter(event => event.status === 'open' && new Date(event.starts_at).getTime() > Date.now()); setEvents(list); setLoading(false)
    const {data:mine,error:mineError} = await supabase.from('hangout_rsvps').select('event_id').eq('user_id',user.id)
    if (!mineError) setJoined((mine||[]).map(x=>x.event_id))
    if(list.length){ const {data:rsvps,error:rsvpError}=await supabase.from('hangout_rsvps').select('event_id'); if(!rsvpError){const c={}; (rsvps||[]).forEach(x=>c[x.event_id]=(c[x.event_id]||0)+1); setCounts(c)} }
  },[user.id,notify,isCampusVerified])
  useEffect(()=>{if (!campusVerificationLoading && isCampusVerified) { refresh(); const timer=setInterval(refresh,20000); return ()=>clearInterval(timer) } else if (!campusVerificationLoading) { setLoading(false); setEvents([]) }},[refresh,campusVerificationLoading,isCampusVerified])
  useEffect(() => {
    try {
      const pendingId = sessionStorage.getItem(`nisit-pending-hangout-chat:${user.id}`)
      if (!pendingId || loading) return
      const event = events.find(item => item.id === pendingId)
      if (event) { sessionStorage.removeItem(`nisit-pending-hangout-chat:${user.id}`); loadChat(event) }
    } catch {}
  }, [events, loading, user.id])
  const create = async e => {
    e.preventDefault(); if(!form.title.trim()||!form.venue.trim()||!form.starts_at) return notify('กรอกชื่อกิจกรรม สถานที่ และวันเวลาให้ครบ')
    if(new Date(form.starts_at)<=new Date()) return notify('เลือกวันเวลาในอนาคต')
    setBusy(true)
    const {error}=await supabase.from('hangout_events').insert({creator_id:user.id,title:form.title.trim(),venue:form.venue.trim(),city:form.city.trim()||'ไม่ระบุ',starts_at:new Date(form.starts_at).toISOString(),capacity:Math.max(2,Math.min(20,+form.capacity||6)),description:form.description.trim(),status:'open'})
    setBusy(false); if(error) return notify('สร้าง Hangout ไม่สำเร็จ: '+error.message+' · ตรวจว่าได้รัน SQL v81 แล้ว')
    setForm({title:'',venue:'',city:'กรุงเทพฯ',starts_at:'',capacity:'6',description:''}); setShowCreate(false); notify('สร้าง Hangout แล้ว'); refresh()
  }
  const rsvp = async event => {
    if(joined.includes(event.id)) { const {error}=await supabase.from('hangout_rsvps').delete().eq('event_id',event.id).eq('user_id',user.id); if(error) return notify('ยกเลิกการเข้าร่วมไม่สำเร็จ: '+error.message); setJoined(old=>old.filter(x=>x!==event.id)); setCounts(old=>({...old,[event.id]:Math.max(0,(old[event.id]||0)-1)})); notify('ยกเลิกการเข้าร่วมแล้ว'); return }
    const {error}=await supabase.from('hangout_rsvps').insert({event_id:event.id,user_id:user.id}); if(error) return notify(error.code==='23505'?'คุณเข้าร่วมกิจกรรมนี้แล้ว':`เข้าร่วมไม่สำเร็จ: ${error.message}`); setJoined(old=>[...old,event.id]); setCounts(old=>({...old,[event.id]:(old[event.id]||0)+1})); notify('เข้าร่วม Hangout แล้ว · เปิดแชทกลุ่มในข้อความ'); if (onJoinedHangout) onJoinedHangout(event.id); else loadChat(event)
  }
  const closeEvent = async event => {
    if(!window.confirm('ปิดห้อง Hangout นี้ใช่ไหม? คนอื่นจะเข้าร่วมใหม่ไม่ได้ และห้องจะหายจากรายการเปิด')) return
    const {error}=await supabase.from('hangout_events').update({status:'closed'}).eq('id',event.id).eq('creator_id',user.id)
    if(error) return notify('ปิดห้องไม่สำเร็จ: '+error.message)
    // Remove the closed room immediately instead of waiting for a network refresh.
    setEvents(old => old.filter(item => item.id !== event.id))
    setJoined(old => old.filter(id => id !== event.id))
    setCounts(old => { const next = {...old}; delete next[event.id]; return next })
    if(chatEvent?.id===event.id)setChatEvent(null)
    notify('ปิดห้อง Hangout แล้ว')
    refresh()
  }
  const loadChat = useCallback(async event => {
    setChatEvent(event); setChatMessages([]); setChatNames({}); setChatMembers([])
    const [messagesResult, membersResult] = await Promise.all([
      supabase.from('hangout_messages').select('id,event_id,user_id,body,created_at').eq('event_id',event.id).order('created_at',{ascending:true}).limit(300),
      supabase.rpc('hangout_member_profiles', { p_event_id: event.id }),
    ])
    if(messagesResult.error){notify('เปิดแชทไม่ได้: '+messagesResult.error.message+' · ตรวจ SQL v81/v87');return}
    setChatMessages(messagesResult.data||[])
    if (membersResult.data?.length) { const names={}; membersResult.data.forEach(x=>names[x.id]=x.display_name||'สมาชิก'); setChatNames(names); setChatMembers(membersResult.data.map(x=>x.id)) }
  },[notify])
  useEffect(()=>{
    if(!chatEvent)return
    const eventId=chatEvent.id
    const channel=supabase.channel('hangout-chat-'+eventId).on('postgres_changes',{event:'INSERT',schema:'public',table:'hangout_messages',filter:`event_id=eq.${eventId}`},async payload=>{
      setChatMessages(old=>old.some(m=>m.id===payload.new.id)?old:[...old,payload.new])
      const {data}=await supabase.rpc('hangout_member_profiles',{p_event_id:eventId})
      if(data?.length){const names={};data.forEach(x=>names[x.id]=x.display_name||'สมาชิก');setChatNames(old=>({...old,...names}));setChatMembers(data.map(x=>x.id))}
    }).subscribe()
    const poll=setInterval(async()=>{if(document.visibilityState !== 'visible')return;const {data}=await supabase.from('hangout_messages').select('id,event_id,user_id,body,created_at').eq('event_id',eventId).order('created_at',{ascending:true}).limit(300);if(data)setChatMessages(old=>{const m=new Map(old.map(x=>[x.id,x]));data.forEach(x=>m.set(x.id,x));const next=[...m.values()].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));return next.length===old.length && next.every((v,i)=>v.id===old[i]?.id && v.body===old[i]?.body)?old:next})},30000)
    return ()=>{clearInterval(poll);supabase.removeChannel(channel)}
  },[chatEvent?.id])
  useEffect(() => {
    if (!mapTarget && !chatEvent) return
    const onKey = e => { if (e.key === 'Escape') { setMapTarget(null); setChatEvent(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [!!mapTarget, !!chatEvent])
  const sendChat = async e => {
    e.preventDefault(); const body=chatDraft.trim(); if(!body||!chatEvent||chatBusy)return
    setChatBusy(true)
    try {
      const {data,error}=await Promise.race([
        supabase.from('hangout_messages').insert({event_id:chatEvent.id,user_id:user.id,body}).select('id,event_id,user_id,body,created_at').single(),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),15000))
      ])
      if(error) { notify('ส่งข้อความไม่สำเร็จ: '+error.message); return }
      if(data) setChatMessages(old=>old.some(m=>m.id===data.id)?old:[...old,data])
      setChatDraft(current=>current===body?'':current)
    } catch(e) {
      notify(e.message==='timeout'?'การส่งข้อความใช้เวลานาน กรุณาตรวจสอบแชตก่อนลองส่งซ้ำ':'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่')
    } finally { setChatBusy(false) }
  }
  if (campusVerificationLoading) return <div className="v76-page"><div className="page-center"><span className="spin"/><p>กำลังตรวจสอบการยืนยันอีเมลมหาวิทยาลัย…</p></div></div>
  if (!isCampusVerified) return <div className="v76-page hangout-verification-required"><Heading kicker="CAMPUS VERIFIED ONLY" title="Hangout สำหรับนิสิต/นักศึกษาที่ยืนยันแล้ว" sub="เพื่อความปลอดภัย การดูนัด สร้างนัด เข้าร่วม และแชท Hangout ต้องยืนยันอีเมลมหาวิทยาลัยก่อน"/><section className="v76-hangout-safety"><ShieldCheck size={22}/><span><b>ต้องยืนยันอีเมลมหาวิทยาลัยก่อน</b><small>บัญชีนี้ยังไม่พบสถานะยืนยันที่สำเร็จ ไปที่โปรไฟล์หรือการตั้งค่าเพื่อยืนยันอีเมลมหาวิทยาลัย แล้วกลับมาที่ Hangout อีกครั้ง</small></span></section><button type="button" className="v76-primary-cta" onClick={onGoVerify}><ShieldCheck size={17}/> ไปหน้ายืนยันอีเมลมหาวิทยาลัย <ArrowRight size={17}/></button></div>
  return <div className="v76-page"><Heading kicker="MEET IRL" title="Hangout กับคนใหม่ ๆ" sub="นัดเจอกันในพื้นที่สาธารณะ ดูจำนวนผู้เข้าร่วม คุยกันในห้องกลุ่ม และเปิดแผนที่ได้จากในเว็บ"><button className="btn btn-pink" onClick={()=>setShowCreate(v=>!v)}><CalendarDays size={17}/> สร้าง Hangout</button></Heading>
    <div className="v76-hangout-safety"><ShieldCheck size={19}/><span><b>เจอกันอย่างปลอดภัย</b><small>เลือกสถานที่สาธารณะ แจ้งเพื่อนที่ไว้ใจ และอย่าโอนเงินให้คนที่เพิ่งรู้จัก</small></span></div>
    {showCreate&&<form className="v76-hangout-form" onSubmit={create}><div className="v76-form-heading"><h2>สร้างนัด Hangout</h2><button type="button" className="icon-btn" onClick={()=>setShowCreate(false)}><X size={19}/></button></div><label>ชื่อนัด<input required maxLength="70" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="เช่น หลังเลิกเรียนไปนั่งชิลกัน"/></label>
      <section className="hangout-venue-picker"><div className="hangout-venue-heading"><span><MapPinned size={17}/> เลือกร้าน / สถานที่จริง</span><small>เลือกจากร้านแนะนำ หรือค้นหาชื่อร้านอื่น</small></div><div className="hangout-venue-search"><Search size={17}/><input aria-label="ค้นหาร้าน" value={venueQuery} onFocus={()=>setShowVenuePicker(true)} onChange={e=>{setVenueQuery(e.target.value);setShowVenuePicker(true);setForm(old=>({...old,venue:e.target.value}))}} placeholder="เช่น Zync Rangsit, The Secret, Rachour"/><button type="button" onClick={()=>setMapTarget({name:venueQuery||'บาร์และร้านอาหาร',city:form.city})} title="ดูแผนที่ในเว็บ"><MapPinned size={17}/></button></div>
      {showVenuePicker&&<div className="hangout-venue-results">{filteredVenues.map(v=><button type="button" className={'hangout-venue-option'+(form.venue===v.name?' selected':'')} key={v.name} onClick={()=>chooseVenue(v)}><span className="hangout-venue-pin"><MapPin size={18}/></span><span className="hangout-venue-info"><b>{v.name}</b><small>{v.address}</small><em>{v.vibe}</em></span><span className="hangout-venue-actions"><span role="button" tabIndex="0" onClick={e=>{e.stopPropagation();setMapTarget({name:v.query,city:v.city})}} aria-label={'ดู '+v.name+' บนแผนที่'}><MapPinned size={15}/></span><Check size={16}/></span></button>)}{venueQuery.trim()&&<button type="button" className="hangout-venue-custom" onClick={()=>{setForm(old=>({...old,venue:venueQuery.trim()}));setShowVenuePicker(false)}}><Search size={16}/><span><b>ใช้ชื่อ “{venueQuery.trim()}”</b><small>เลือกแล้วสามารถเปิดแผนที่ดูตำแหน่งในเว็บได้</small></span></button>}<details className="hangout-campus-discovery"><summary><span className="campus-discovery-title"><GraduationCap size={17}/> <span><b>เลือกร้านตามมหาวิทยาลัย</b><small>ค้นหาบาร์และที่ Hangout รอบแคมปัส</small></span></span><span className="campus-discovery-count">10 แห่ง</span></summary><div className="hangout-campus-grid">{HANGOUT_CAMPUS_SEARCHES.map((c,i)=><button type="button" key={c.label} onClick={()=>setMapTarget({name:c.query,city:c.label})}><span className="campus-card-icon">{i===0?'🏫':i===1?'🌿':i===2?'❤️':i===3?'📚':i===4?'🌊':'🎓'}</span><span className="campus-card-copy"><b>{c.label}</b><small>{i===0?'ลาดกระบัง':i===1?'บางเขน':i===2?'ปทุมวัน':i===3?'รังสิต':'รอบมหาวิทยาลัย'}</small></span><ExternalLink size={14}/></button>)}</div></details></div>}
      {form.venue&&<div className="hangout-selected-venue"><Check size={15}/><span>สถานที่ที่เลือก: <b>{form.venue}</b></span><button type="button" onClick={()=>setMapTarget({name:form.venue,city:form.city})}>ดูแผนที่ในเว็บ <MapPinned size={13}/></button></div>}</section>
      <div className="v76-form-two"><label>ชื่อสถานที่<input required maxLength="100" value={form.venue} onFocus={()=>setShowVenuePicker(true)} onChange={e=>{setForm({...form,venue:e.target.value});setVenueQuery(e.target.value);setShowVenuePicker(true)}} placeholder="เลือกร้านด้านบน หรือพิมพ์ชื่อร้าน"/></label><label>จังหวัด / พื้นที่<input value={form.city} maxLength="80" onChange={e=>setForm({...form,city:e.target.value})}/></label></div><div className="v76-form-two"><label>วันและเวลา<input type="datetime-local" required value={form.starts_at} onChange={e=>setForm({...form,starts_at:e.target.value})}/></label><label>จำนวนคนสูงสุด<select value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}>{[2,3,4,5,6,8,10,12,15,20].map(n=><option key={n} value={n}>{n} คน</option>)}</select></label></div><label>รายละเอียด<textarea rows="3" maxLength="500" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="แนวกิจกรรม งบประมาณโดยประมาณ หรือสิ่งที่ควรรู้"/></label><button className="v76-primary-cta" disabled={busy}>{busy?'กำลังสร้าง...':'เผยแพร่นัด Hangout'} <ArrowRight size={17}/></button></form>}
    <section className="nm-hangout-discovery" aria-label="ค้นหาและกรอง Hangout">
      <label>ค้นหากิจกรรมหรือสถานที่<input type="search" value={hangoutSearch} onChange={e=>setHangoutSearch(e.target.value)} placeholder="ค้นหาชื่อนัด ร้าน หรือจังหวัด" /></label>
      <div className="nm-hangout-filter-buttons">{[['all','ทั้งหมด'],['available','ยังมีที่ว่าง'],['joined','ที่เข้าร่วม']].map(([value,label])=><button type="button" key={value} className={hangoutFilter===value?'active':''} aria-pressed={hangoutFilter===value} onClick={()=>setHangoutFilter(value)}>{label}</button>)}</div>
      <small>พบ {visibleHangouts.length} กิจกรรม จาก {events.length} กิจกรรม</small>
    </section>
    {loading?<div className="page-center"><span className="spin"/></div>:visibleHangouts.length?<div className="v76-hangout-grid">{visibleHangouts.map(event=><article className="v76-event-card" key={event.id}><div className="v76-event-date"><span>{new Date(event.starts_at).toLocaleDateString('th-TH',{day:'2-digit'})}</span><small>{new Date(event.starts_at).toLocaleDateString('th-TH',{month:'short'})}</small></div><div className="v76-event-content"><span className="v76-event-tag"><MapPinned size={13}/>{event.city||'นัดพบ'}</span><h3>{event.title}</h3><p><MapPin size={14}/>{event.venue}<button type="button" className="v76-event-map-link" onClick={()=>setMapTarget({name:event.venue,city:event.city})}><MapPinned size={13}/> ดูแผนที่ในเว็บ</button></p><p><Clock size={14}/>{new Date(event.starts_at).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'})}</p>{event.description&&<p className="v76-event-desc">{event.description}</p>}<div className="v76-event-footer"><span><Users size={15}/> เข้าร่วม {counts[event.id]||0}/{event.capacity} คน</span><button className={joined.includes(event.id)?'joined':''} onClick={()=>rsvp(event)}>{joined.includes(event.id)?'ออกจากห้อง ✓':'เข้าร่วม'}</button></div><div className="hangout-card-actions">{(joined.includes(event.id)||event.creator_id===user.id)&&<button type="button" onClick={()=>onJoinedHangout ? onJoinedHangout(event.id) : loadChat(event)}><MessageCircle size={15}/> แชทกลุ่มในข้อความ</button>}{event.creator_id===user.id&&<button type="button" className="hangout-close-btn" onClick={()=>closeEvent(event)}><X size={15}/> ปิดห้อง</button>}</div></div></article>)}</div>:<div className="v76-empty"><div><CalendarDays size={30}/></div><h2>ยังไม่มีนัด Hangout</h2><p>เริ่มสร้างนัดในพื้นที่สาธารณะ แล้วชวนคนที่สนใจมาร่วมกิจกรรม</p><button className="v76-primary-cta" onClick={()=>setShowCreate(true)}>สร้าง Hangout แรก <ArrowRight size={17}/></button></div>}
    {mapTarget&&createPortal(<div className="hangout-overlay hangout-map-overlay-v96" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setMapTarget(null)}}><section className="hangout-map-modal hangout-map-modal-v96" role="dialog" aria-modal="true" aria-label="แผนที่ Hangout"><header><div><b><MapPinned size={18}/> แผนที่สถานที่</b><small>{mapTarget.name} · {mapTarget.city}</small></div><button type="button" className="icon-btn" onClick={()=>setMapTarget(null)} aria-label="ปิดแผนที่"><X size={20}/></button></header><iframe title={'แผนที่ '+mapTarget.name} src={`https://maps.google.com/maps?hl=th&z=15&q=${encodeURIComponent([mapTarget.name,mapTarget.city].filter(Boolean).join(' '))}&output=embed`} loading="eager" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><footer className="hangout-map-actions-v96"><span>เลื่อนแผนที่ภายในกรอบนี้ได้</span><a href={mapsSearchUrl(mapTarget.name,mapTarget.city)} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> เปิด Google Maps</a></footer></section></div>, document.body)}
    {chatEvent&&<div className="hangout-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setChatEvent(null)}}><section className="hangout-chat-modal" role="dialog" aria-modal="true" aria-label="ห้องแชท Hangout"><header><div><b><MessageCircle size={18}/> {chatEvent.title}</b><small>{chatEvent.venue} · สมาชิก {chatMembers.map(id=>chatNames[id]||(id===user.id?'คุณ':'กำลังโหลดชื่อ')).join('、')||`${counts[chatEvent.id]||0}/${chatEvent.capacity} คน`}</small></div><button type="button" className="icon-btn" onClick={()=>setChatEvent(null)} aria-label="ปิดแชท"><X size={20}/></button></header><div className="hangout-chat-messages">{chatMessages.length?chatMessages.map(m=><div key={m.id} className={'hangout-chat-bubble'+(m.user_id===user.id?' mine':'')}><small>{m.user_id===user.id?'คุณ':(chatNames[m.user_id]||'กำลังโหลดชื่อ…')}</small>{m.attachment_type === 'image' && m.attachment_path ? (hangoutMediaUrls[m.attachment_path] ? <img className="hangout-chat-image" src={hangoutMediaUrls[m.attachment_path]} alt="รูปภาพในแชทกลุ่ม" loading="lazy" decoding="async" onClick={() => window.open(hangoutMediaUrls[m.attachment_path], '_blank', 'noopener,noreferrer')} /> : <p>กำลังโหลดรูปภาพ…</p>) : m.attachment_type === 'audio' && m.attachment_path ? (hangoutMediaUrls[m.attachment_path] ? <VoiceBubble src={hangoutMediaUrls[m.attachment_path]} mine={m.user_id===me} /> : <p>กำลังโหลดเสียง…</p>) : <p>{m.body}</p>}<time>{new Date(m.created_at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</time></div>):<div className="hangout-chat-empty"><MessageCircle size={25}/><b>เริ่มคุยกับคนในนัดนี้</b><span>ใช้แชทกลุ่มเพื่อคุยรายละเอียดก่อนเจอกัน</span></div>}</div><form className="hangout-chat-compose" onSubmit={sendChat}><input value={chatDraft} maxLength={1500} onChange={e=>setChatDraft(e.target.value)} placeholder="พิมพ์ข้อความถึงสมาชิก..." aria-label="ข้อความแชท"/><button disabled={chatBusy||!chatDraft.trim()} aria-label="ส่งข้อความ"><Send size={18}/></button></form></section></div>}
  </div>
}

// Anonymous, aggregate site activity: one presence per browser tab, no identity or profile data.
function SiteVisitorPresence() {
  useEffect(() => {
    const visitorKey = 'nm-site-presence:' + Math.random().toString(36).slice(2)
    const channel = supabase.channel('nm-site-visitors-v1', { config: { presence: { key: visitorKey } } })
    let joined = false
    const sync = async () => {
      if (!joined) return
      try {
        if (document.visibilityState === 'visible') await channel.track({ active: true })
        else await channel.untrack()
      } catch (error) { console.warn('Site presence update failed', error) }
    }
    channel.subscribe(status => { if (status === 'SUBSCRIBED') { joined = true; sync() } })
    document.addEventListener('visibilitychange', sync)
    return () => { joined = false; document.removeEventListener('visibilitychange', sync); supabase.removeChannel(channel) }
  }, [])
  return null
}

function AppContent() {
  const [authCallback, setAuthCallback] = useState(() => isAuthCallbackPath())
  const [session, setSession] = useState(undefined), [profile, setProfile] = useState(undefined), [authInitTimedOut, setAuthInitTimedOut] = useState(false), [profileLoadTimedOut, setProfileLoadTimedOut] = useState(false), [profileLoadAttempt, setProfileLoadAttempt] = useState(0), [view, setView] = useState(() => window.location.pathname === '/notifications' ? 'notifications' : window.location.pathname === '/announcements' ? 'announcements' : 'home'), [profileVisited, setProfileVisited] = useState(false), [modal, setModal] = useState(''), [toast, setToast] = useState(null), [nav, setNav] = useState(false)
  // Reset page position after the new view is committed, including direct route changes.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('main, .app-main, .page-content').forEach(el => {
      if (el.scrollTop > 0) el.scrollTop = 0
    })
  }, [view])

  // Stop in-app media when the PWA is backgrounded or closed. iOS controls
  // the Dynamic Island itself; pausing media only releases active playback.
  useEffect(() => {
    const pauseMedia = () => document.querySelectorAll('audio, video').forEach(el => {
      if (!el.paused) el.pause()
    })
    const onVisibility = () => { if (document.visibilityState === 'hidden') pauseMedia() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', pauseMedia)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', pauseMedia)
    }
  }, [])

  const [people, setPeople] = useState(null), [matches, setMatches] = useState([]), [unread, setUnread] = useState(0), [unreadMessages, setUnreadMessages] = useState(0), [detail, setDetail] = useState(null)
  const [profileEntryTab, setProfileEntryTab] = useState('photos')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installHelpOpen, setInstallHelpOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true))
  const isIOSInstall = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent)
  useEffect(() => {
    const onBeforeInstall = event => { event.preventDefault(); setInstallPrompt(event) }
    const onInstalled = () => { setInstallPrompt(null); setIsInstalled(true); setInstallHelpOpen(false) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  const openInstall = async () => {
    if (installPrompt) {
      const prompt = installPrompt
      setInstallPrompt(null)
      try { await prompt.prompt(); await prompt.userChoice } catch { setInstallHelpOpen(true) }
    } else setInstallHelpOpen(true)
  }

  const user = session?.user
  const userId = user?.id
  const [dailyOpen, setDailyOpen] = useState(false)
  const [referralEventOpen, setReferralEventOpen] = useState(false)
  const [eventSlide, setEventSlide] = useState(0)
  const eventTouchStart = useRef(null)
  const [referralEventNeverShow, setReferralEventNeverShow] = useState(false)
  useEffect(() => {
    if (!userId || !profile?.id) { setReferralEventOpen(false); return }
    const key = 'nm-referral-event-dismissed:' + userId
    try { if (localStorage.getItem(key) === '1') return } catch {}
    const timer = window.setTimeout(() => setReferralEventOpen(true), 1800)
    return () => window.clearTimeout(timer)
  }, [userId, profile?.id])
  const closeReferralEvent = () => {
    if (referralEventNeverShow && userId) {
      try { localStorage.setItem('nm-referral-event-dismissed:' + userId, '1') } catch {}
    }
    setReferralEventOpen(false)
  }

  const [dailyClaimed, setDailyClaimed] = useState(true)
  useEffect(() => {
    let active = true
    const refresh = async () => { const { data, error } = await supabase.rpc('nm_daily_status'); if (active) setDailyClaimed(error ? true : !!data?.today_claimed) }
    refresh()
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; document.removeEventListener('visibilitychange', onVisible) }
  }, [session?.user?.id, dailyOpen])
  const [newMatch, setNewMatch] = useState(null)
  useEffect(() => { if (newMatch) playNisitSound('match') }, [newMatch])
  useEffect(() => {
    if (!newMatch) return
    const onKey = e => { if (e.key === 'Escape') setNewMatch(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [newMatch])
  const previousUnreadMessages = useRef(null)
  useEffect(() => {
    if (previousUnreadMessages.current !== null && unreadMessages > previousUnreadMessages.current && document.visibilityState === 'visible') playNisitSound('message')
    previousUnreadMessages.current = unreadMessages
  }, [unreadMessages])
  const [lastSwipe, setLastSwipe] = useState(null)
  const [superBusy, setSuperBusy] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('fake_profile')
  const [reportNotes, setReportNotes] = useState('')
  const [reportBusy, setReportBusy] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [verifiedCampusIds, setVerifiedCampusIds] = useState([])
  const [ownerPremium, setOwnerPremium] = useState(false)
  const [fl, setFl] = useState({ q: '', uni: '', min: 18, max: 40, gender: '' }), [filterOpen, setFilterOpen] = useState(false)
  const discoverySaveRevision = useRef(0)
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
  useEffect(() => {
    if (!user || profile === undefined) return
    if (window.location.pathname === '/admin') setView(profile?.is_admin ? 'admin' : 'home')
  },[user?.id,profile?.is_admin,profile === undefined])
  useEffect(() => {
    const onBack = () => { if (window.location.pathname !== '/admin') setView(old => old === 'admin' ? 'settings' : old) }
    window.addEventListener('popstate',onBack)
    return ()=>window.removeEventListener('popstate',onBack)
  },[])

  // Presence is opt-in and is never exposed directly from the table.
  useEffect(() => {
    if (!userId) return
    let active = true
    let allowed = false
    const refreshPreference = async () => {
      const {data}=await supabase.from('user_social_preferences').select('show_online').eq('user_id',userId).maybeSingle()
      if (!active) return
      allowed = !!data?.show_online
      if (allowed && document.visibilityState === 'visible') {
        await supabase.from('user_presence').upsert({user_id:userId,last_seen_at:new Date().toISOString()},{onConflict:'user_id'})
      }
    }
    const tick = () => { if (allowed && document.visibilityState === 'visible') supabase.from('user_presence').upsert({user_id:userId,last_seen_at:new Date().toISOString()},{onConflict:'user_id'}).then(()=>{}) }
    refreshPreference()
    const interval = setInterval(()=>{refreshPreference()},60000)
    document.addEventListener('visibilitychange',tick)
    return ()=>{active=false;clearInterval(interval);document.removeEventListener('visibilitychange',tick)}
  },[userId])

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
        setView(['home', 'messages', 'notifs', 'profile', 'settings', 'likes', 'visitors', 'hangout', 'premium'].includes(saved) ? saved : 'home')
      } catch { setView('home') }
    }
  }, [userId, session === undefined])
  useEffect(() => {
    if (!userId) return
    try { sessionStorage.setItem(`nisit-last-view:${userId}`, view) } catch {}
  }, [view, userId])
  useEffect(() => {
    let active = true
    if (!userId) { setOwnerPremium(false); return () => { active = false } }
    // Use the same server-side Premium check as profile badges, with a subscription fallback.
    supabase.rpc('is_profile_premium', { p_profile_id: userId })
      .then(async ({ data, error }) => {
        if (!active) return
        if (!error && typeof data === 'boolean') {
          setOwnerPremium(data)
          return
        }
        const { data: subscription, error: subscriptionError } = await supabase.from('premium_subscriptions')
          .select('status,ends_at').eq('user_id', userId).maybeSingle()
        if (!active || subscriptionError) return
        setOwnerPremium(subscription?.status === 'active' && (!subscription.ends_at || new Date(subscription.ends_at).getTime() > Date.now()))
      }).catch(() => {})
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    let active = true
    // Supabase Auth can occasionally stall during an API outage. Never leave the
    // entire app on an infinite spinner; show a retry screen after 12 seconds.
    const timeout = window.setTimeout(() => { if (active) setAuthInitTimedOut(true) }, 12000)
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) { setAuthInitTimedOut(true); return }
      window.clearTimeout(timeout)
      setAuthInitTimedOut(false)
      setSession(data.session)
    }).catch(() => { if (active) setAuthInitTimedOut(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      window.clearTimeout(timeout)
      setAuthInitTimedOut(false)
      // SIGNED_IN also fires when an existing session is revalidated after app resume.
      setSession(nextSession)
    })
    return () => { active = false; window.clearTimeout(timeout); data.subscription.unsubscribe() }
  }, [])
  useEffect(() => { if (userId) setModal('') }, [userId])
  const loadProfile = useCallback(async () => { if (!userId) return; setProfileLoadTimedOut(false); const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle(); if (error) { notify('โหลดโปรไฟล์ไม่สำเร็จ: ' + error.message); return } setProfile(data) }, [userId, notify])
  useEffect(() => {
    if (!userId || profile !== undefined) { setProfileLoadTimedOut(false); return }
    const timeout = window.setTimeout(() => setProfileLoadTimedOut(true), 12000)
    return () => window.clearTimeout(timeout)
  }, [userId, profile, profileLoadAttempt])
  const loadUnread = useCallback(async () => { if (!userId) return; const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false).in('type', ['interest', 'match', 'hangout_message']); setUnread(count || 0) }, [userId])
  // Message badges are separate from activity notifications: unread chat messages
  // animate the Messages tab, without generating a noisy notification for each text.
  const unreadRequestRef = useRef({ userId: null, pending: false, queued: false, generation: 0 })
  const loadUnreadMessages = useCallback(async () => {
    const state = unreadRequestRef.current
    if (!userId) {
      state.generation++
      state.userId = null
      state.queued = false
      setUnreadMessages(0)
      return
    }
    if (state.userId !== userId) {
      state.generation++
      state.userId = userId
      state.pending = false
      state.queued = false
    }
    if (state.pending) { state.queued = true; return }
    state.pending = true
    const generation = state.generation
    try {
      const { data: rooms, error: roomsError } = await supabase.from('matches')
        .select('id').or(`user_a.eq.${userId},user_b.eq.${userId}`)
      if (roomsError) return
      let directCount = 0
      if (rooms?.length) {
        const { count, error } = await supabase.from('messages')
          .select('id', { count: 'exact', head: true })
          .in('match_id', rooms.map(r => r.id))
          .neq('sender_id', userId).is('read_at', null)
        if (error) return
        directCount = count || 0
      }
      if (state.generation === generation && state.userId === userId) {
        setUnreadMessages(current => current === directCount ? current : directCount)
      }
    } catch (error) {
      console.warn('Unread message refresh failed:', error)
    } finally {
      if (state.generation === generation) {
        state.pending = false
        if (state.queued) {
          state.queued = false
          // Coalesce bursts of realtime events into a single follow-up refresh.
          queueMicrotask(() => {
            if (unreadRequestRef.current.generation === generation) loadUnreadMessages()
          })
        }
      }
    }
  }, [userId])
  useEffect(() => {
    if (!userId) { setUnreadMessages(0); return }
    loadUnreadMessages()
    // Realtime already updates unread counts; poll only as a visible-tab fallback.
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') loadUnreadMessages()
    }, 30000)
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
    if (!userId || !profile?.id) { setDiscoveryReady(false); setPeople(null); return }
    let active = true
    setDiscoveryReady(false)
    const cached = readDiscovery(userId)
    setPeople(null)
    const revisionAtLoad = discoverySaveRevision.current
    setDiscovery(cached)
    setDiscoveryReady(true)
    supabase.from('discovery_preferences').select('preferences').eq('user_id', userId).maybeSingle().then(({data}) => {
      if (!active || !data?.preferences) return
      // Local selections are authoritative while a save is pending or a previous sync failed.
      if (discoverySaveRevision.current !== revisionAtLoad) return
      const latestLocal = readDiscovery(userId)
      if (latestLocal) return
      const remote = {...defaultDiscovery, ...data.preferences}
      setDiscovery(remote)
      try { localStorage.setItem(discoveryKey(userId), JSON.stringify(remote)) } catch {}
    })
    return () => { active = false }
  }, [userId, profile?.id])
  const saveDiscovery = async prefs => {
    discoverySaveRevision.current += 1
    try { localStorage.setItem(discoveryKey(userId), JSON.stringify(prefs)) } catch {}
    setDiscovery(prefs)
    discoveryRequest.current += 1
    discoveryInFlight.current = false
    setPeople(null)
    setDiscoveryEditing(false)
    setFl(f => ({...f, uni: '', gender: prefs.gender, min: prefs.min, max: prefs.max}))
    // Save to the server in the background: navigation and the new swipe deck must
    // never wait for a slow network request. Local preferences remain authoritative.
    Promise.resolve().then(() => supabase.from('discovery_preferences').upsert(
      {user_id:userId, preferences:prefs}, {onConflict:'user_id'}
    )).then(({error}) => {
      if (error) notify('บันทึกสเปคในเครื่องแล้ว แต่ซิงก์ Supabase ไม่สำเร็จ')
    }).catch(() => notify('บันทึกสเปคในเครื่องแล้ว แต่ซิงก์ Supabase ไม่สำเร็จ'))
  }
  const campusFiltered = useCallback(p => {
    if (!discovery) return true
    if (discovery.campusOnly && (!profile?.campus || p.university_id !== profile.university_id || p.campus !== profile.campus)) return false
    if (discovery.mode === 'same') return p.university_id === profile?.university_id
    if (discovery.mode === 'selected') return (discovery.universities || []).includes(p.university_id)
    if (discovery.mode === 'nearby') { const km = campusDistance(profile?.university_id, p.university_id); return km !== null && km <= discovery.radius }
    return true
  }, [discovery, profile?.university_id, profile?.campus])
  const discoveryRequest = useRef(0)
  const seenSwipes = useRef(new Set())
  const discoveryRanks = useRef(new Map())
  const discoveryInFlight = useRef(false)
  const discoveryQueryKey = useRef('')
  const [discoveryLimited, setDiscoveryLimited] = useState(false)
  const discoverySession = useRef('')
  const discoveryOffset = useRef(0)
  const discoveryPageSize = 100
  const [discoveryPageError, setDiscoveryPageError] = useState(false)
  const discoveryHasMore = useRef(true)
  const [discoveryLoadingMore, setDiscoveryLoadingMore] = useState(false)
  const loadPeople = useCallback(async ({ silent = false, nextPage = false } = {}) => {
    if (!discoveryReady || !discovery || !userId || (nextPage && !discoveryHasMore.current)) return
    const queryKey = JSON.stringify([userId, discovery.gender, discovery.min, discovery.max, discovery.mode, discovery.radius, discovery.universities, discovery.campusOnly])
    if (discoveryInFlight.current && discoveryQueryKey.current === queryKey) return
    discoveryInFlight.current = true
    discoveryQueryKey.current = queryKey
    const request = ++discoveryRequest.current
    const offset = nextPage ? discoveryOffset.current : 0
    if (nextPage) setDiscoveryLoadingMore(true)
    let data, error
    try {
      const result = await Promise.race([
        supabase.rpc('discover_with_campus', { p_university: null, p_min_age: +(discovery?.min ?? fl.min), p_max_age: +(discovery?.max ?? fl.max), p_gender: discovery?.gender || null }).range(offset, offset + discoveryPageSize - 1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ])
      data = result.data
      error = result.error
    } catch (e) { error = e }
    if (request !== discoveryRequest.current) return
    discoveryInFlight.current = false
    if (nextPage) setDiscoveryLoadingMore(false)
    if (error) {
      // A silent refresh must not leave the deck stuck on its initial spinner.
      // Keep existing cards when refreshing in the background.
      setPeople(current => ((silent || nextPage) && current !== null) ? current : [])
      if (nextPage) setDiscoveryPageError(true) // Pause automatic paging; allow a manual retry.
      if (!silent) notify('ค้นหาสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง')
      return
    }
    setDiscoveryLimited(false)
    if (!silent) setDiscoveryPageError(false)
    if (!silent) {
      // Advance by the number of raw RPC rows, not the number surviving UI filters.
      discoveryOffset.current = offset + (data?.length || 0)
      discoveryHasMore.current = (data?.length || 0) >= discoveryPageSize
    }
    // One random ordering per signed-in user/session. New members append without reshuffling visible cards.
    const sessionKey = userId || ''
    if (discoverySession.current !== sessionKey) {
      discoverySession.current = sessionKey
      discoveryRanks.current = new Map()
      seenSwipes.current = new Set()
    }
    const matchesGender = p => !discovery.gender || p.gender === discovery.gender
    const unique = [...new Map((data || []).filter(p => p?.id && p.id !== userId && !seenSwipes.current.has(p.id) && matchesGender(p)).map(p => [p.id, p])).values()]
    const ranks = discoveryRanks.current
    const rankFor = id => {
      let hash = 2166136261
      const key = sessionKey + ':' + id
      for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619)
      return hash >>> 0
    }
    for (const p of unique) if (!ranks.has(p.id)) ranks.set(p.id, rankFor(p.id))
    unique.sort((a,b) => ranks.get(a.id) - ranks.get(b.id))
    setPeople(current => {
      // Preserve the exact visible deck on background refresh; only append newcomers.
      // Never replace/reorder the first card unless the user swipes or changes filters.
      if ((silent || nextPage) && current !== null) {
        const existingIds = new Set((current || []).map(p => p.id))
        return [...(current || []).filter(matchesGender), ...unique.filter(p => !existingIds.has(p.id))]
      }
      return unique
    })
  }, [discoveryReady, discovery?.min, discovery?.max, discovery?.gender, discovery?.mode, discovery?.radius, discovery?.universities, discovery?.campusOnly, fl.min, fl.max, notify, userId])
  // Fetch the next 100 only when the visible deck is running low.
  // Avoid exhausting the entire discovery RPC and overloading mobile devices.
  useEffect(() => {
    if (view === 'home' && people !== null && people.filter(p => (!discovery?.gender || p.gender === discovery.gender) && campusFiltered(p)).length < 24 && discoveryHasMore.current && !discoveryPageError && !discoveryInFlight.current && !discoveryLoadingMore) loadPeople({ nextPage: true })
  }, [view, people, discovery?.gender, campusFiltered, discoveryPageError, discoveryLoadingMore, loadPeople])
  // Refresh only when returning to Swipe, without replacing the current card.
  useEffect(() => {
    if (view !== 'home' || !userId || !profile) return
    const refresh = () => { if (document.visibilityState === 'visible') loadPeople({ silent: true }) }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [view, userId, !!profile, loadPeople])
  // A token refresh must not blank the entire app or trigger another profile fetch.
  const loadedProfileUserRef = useRef(null)
  useEffect(() => {
    if (!userId) {
      loadedProfileUserRef.current = null
      setProfile(undefined)
      return
    }
    if (loadedProfileUserRef.current === userId) return
    loadedProfileUserRef.current = userId
    setProfile(undefined)
    loadProfile()
    loadUnread()
  }, [userId, loadProfile, loadUnread])
  // Match list depends on account identity, not profile object refreshes.
  useEffect(() => { if (profile?.id) loadMatches() }, [profile?.id, loadMatches])
  useEffect(() => {
    if (!profile || !discoveryReady || !discovery) return
    // Discard a deck loaded for older preferences before requesting new matches.
    discoveryOffset.current = 0
    discoveryHasMore.current = true
    setDiscoveryPageError(false)
    setPeople(null)
    loadPeople()
  }, [profile?.id, discoveryReady, discovery?.gender, discovery?.min, discovery?.max, discovery?.mode, discovery?.radius, discovery?.universities, loadPeople])
  // Public Premium status for swipe cards: use a short cache so advancing the deck
  // does not re-query the same profile IDs over and over.
  const premiumCandidateKey = (people || []).slice(0, 12).map(p => p.id).filter(Boolean).join('|')
  useEffect(() => {
    if (!premiumCandidateKey) return
    let active = true
    const ids = premiumCandidateKey.split('|').slice(0, 12)
    Promise.all(ids.map(async id => {
      const value = await getPublicPremiumStatus(id)
      return value === null ? null : [id, value]
    })).then(results => {
      if (!active) return
      const status = new Map(results.filter(Boolean))
      setPeople(current => {
        if (!current) return current
        let changed = false
        const updated = current.map(person => {
          if (!status.has(person.id) || person.is_premium === status.get(person.id)) return person
          changed = true
          return { ...person, is_premium: status.get(person.id) }
        })
        return changed ? updated : current
      })
    })
    return () => { active = false }
  }, [premiumCandidateKey])
  // Verification badges only need the upcoming cards. A stable ID signature
  // prevents repeated RPCs when unrelated card fields (e.g. premium) update.
  const verificationCandidateKey = (people || []).slice(0, 12).map(p => p.id).filter(Boolean).join('|')
  useEffect(() => {
    if (!userId || !verificationCandidateKey) { setVerifiedCampusIds([]); return }
    let active = true
    const ids = [...new Set(verificationCandidateKey.split('|'))]
    supabase.rpc('verified_student_profile_ids', { candidate_ids: ids })
      .then(({ data, error }) => {
        if (!active) return
        const next = error ? [] : (data || []).map(x => x.user_id)
        setVerifiedCampusIds(current => current.length === next.length && current.every(id => next.includes(id)) ? current : next)
      })
      .catch(() => { if (active) setVerifiedCampusIds(current => current.length ? [] : current) })
    return () => { active = false }
  }, [userId, verificationCandidateKey])

  useEffect(() => { const refresh = () => { if (document.visibilityState === 'visible' && user?.id) loadMatches() }; document.addEventListener('visibilitychange', refresh); return () => document.removeEventListener('visibilitychange', refresh) }, [user?.id, loadMatches])
  const notificationViewRef = useRef(view)
  notificationViewRef.current = view
  useEffect(() => {
    if (!user?.id) return
    const ch = supabase.channel('notif-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async (p) => {
      if (p.new.type === 'hangout_message') {
        let activeRoom = null; try { activeRoom = sessionStorage.getItem(`nisit-active-hangout-chat:${user.id}`) } catch {}
        if (notificationViewRef.current === 'messages' && activeRoom === p.new.ref_id) { await supabase.from('notifications').update({ read: true }).eq('id', p.new.id).eq('user_id', user.id); loadUnread(); loadUnreadMessages(); return }
        loadUnread(); loadUnreadMessages()
        let title = 'ข้อความใหม่ใน Hangout', body = 'มีสมาชิกส่งข้อความในห้องกลุ่ม'
        const [{ data: event }, { data: latest }, { data: memberProfiles }] = await Promise.all([
          supabase.from('hangout_events').select('title').eq('id', p.new.ref_id).maybeSingle(),
          supabase.from('hangout_messages').select('user_id,body').eq('event_id', p.new.ref_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.rpc('hangout_member_profiles', { p_event_id: p.new.ref_id }),
        ])
        if (event?.title) title = event.title
        if (latest?.body) {
          const sender = memberProfiles?.find(x => x.id === latest.user_id)?.display_name
          const text = latest.body.length > 95 ? latest.body.slice(0, 92) + '…' : latest.body
          body = `${sender ? sender + ': ' : ''}${text}`
        }
        notify(`${title}: ${body}`)
        if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') { try { new Notification(title, { body, tag: `hangout-${p.new.ref_id}`, icon: '/icons/icon-192.png' }).onclick = () => { window.focus(); try { sessionStorage.setItem(`nisit-pending-hangout-chat:${user.id}`, p.new.ref_id); sessionStorage.setItem(`nisit-last-view:${user.id}`, 'messages') } catch {}; window.location.reload() } } catch {} }
        return
      }
      if (!['interest', 'match'].includes(p.new.type)) return
      notify(p.new.type === 'match' ? 'คุณได้รับการแมตช์แล้ว!' : 'มีคนกำลังสนใจคุณอยู่'); loadUnread(); if (p.new.type === 'match') loadMatches()
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user?.id, notify, loadUnread, loadUnreadMessages, loadMatches])

  const [swipeQuota, setSwipeQuota] = useState(null)
  const [quotaDialog, setQuotaDialog] = useState(false)
  const [quotaNow, setQuotaNow] = useState(Date.now())
  const refreshSwipeQuota = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase.rpc('nm_swipe_quota_status')
    if (!error && data) setSwipeQuota(data)
  }, [user?.id])
  useEffect(() => { refreshSwipeQuota() }, [refreshSwipeQuota])
  // A rolling 24-hour allowance can recover while the app remains open.
  // Refresh on return to the PWA and periodically while the quota is exhausted.
  useEffect(() => {
    const onResume = () => { if (document.visibilityState === 'visible') refreshSwipeQuota() }
    document.addEventListener('visibilitychange', onResume)
    window.addEventListener('focus', onResume)
    return () => {
      document.removeEventListener('visibilitychange', onResume)
      window.removeEventListener('focus', onResume)
    }
  }, [refreshSwipeQuota])
  useEffect(() => {
    if (swipeQuota?.remaining !== 0) return
    const timer = setInterval(refreshSwipeQuota, 30000)
    return () => clearInterval(timer)
  }, [swipeQuota?.remaining, refreshSwipeQuota])
  useEffect(() => {
    if (!quotaDialog) return
    const timer = setInterval(() => setQuotaNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [quotaDialog])
  const quotaWaitMinutes = swipeQuota?.next_available_at ? Math.max(0, Math.ceil((new Date(swipeQuota.next_available_at).getTime() - quotaNow) / 60000)) : 0
  const quotaWaitLabel = quotaWaitMinutes >= 60 ? `${Math.floor(quotaWaitMinutes / 60)} ชั่วโมง${quotaWaitMinutes % 60 ? ` ${quotaWaitMinutes % 60} นาที` : ''}` : `${quotaWaitMinutes} นาที`
  const quotaNextTimeLabel = swipeQuota?.next_available_at ? new Date(swipeQuota.next_available_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''
  useEffect(() => { if (quotaDialog && swipeQuota?.next_available_at && quotaWaitMinutes === 0) { refreshSwipeQuota(); setQuotaDialog(false) } }, [quotaDialog, quotaWaitMinutes, swipeQuota?.next_available_at, refreshSwipeQuota])
  const swipeInFlight = useRef(new Set())
  const swipe = async (p, is_like) => {
    if (!user || !p?.id) return notify('กรุณาเข้าสู่ระบบก่อน')
    if (swipeQuota?.remaining === 0 && quotaWaitMinutes > 0) { setQuotaDialog(true); return }
    if (swipeInFlight.current.has(p.id) || seenSwipes.current.has(p.id)) return
    swipeInFlight.current.add(p.id)
    let error
    let swipeInserted = false
    let swipeResult = null
    try {
      // ON CONFLICT DO NOTHING avoids noisy likes_pkey errors when a stale deck
      // or retry submits the same (from_id, to_id) pair more than once.
      const result = await supabase.from('likes')
        .upsert({ from_id: user.id, to_id: p.id, is_like }, { onConflict: 'from_id,to_id', ignoreDuplicates: true })
        .select('from_id')
        .maybeSingle()
      error = result.error
      swipeResult = result.data
      swipeInserted = !!result.data
    } catch (e) { error = e }
    finally { swipeInFlight.current.delete(p.id) }
    if (error) {
      if (String(error.message).includes('SWIPE_QUOTA_EXCEEDED')) {
        await refreshSwipeQuota(); setQuotaNow(Date.now()); setQuotaDialog(true); return
      }
      return notify(`บันทึกไม่สำเร็จ: ${error.message}`)
    }
    // A null result with no error means ON CONFLICT ignored an existing swipe.
    // Do not increment quota or run match-side effects for that duplicate.
    if (!swipeInserted) {
      seenSwipes.current.add(p.id)
      setPeople(list => (list || []).filter(x => x.id !== p.id))
      setDetail(null)
      notify('บันทึกการปัดรายการนี้ไว้แล้ว')
      return
    }
    setSwipeQuota(old => old ? {...old, used: Number(old.used || 0) + 1, remaining: Math.max(0, Number(old.remaining || 0) - 1)} : old)
    refreshSwipeQuota()
    seenSwipes.current.add(p.id)
    setLastSwipe({ person: p, at: Date.now(), matched: false })
    // Keep the current profile mounted while the swipe-out transition completes.
    await new Promise(resolve => setTimeout(resolve, 520))
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
    seenSwipes.current.delete(lastSwipe.person.id)
    setPeople(old => [lastSwipe.person, ...(old || []).filter(p=>p.id!==lastSwipe.person.id)])
    setLastSwipe(null); refreshSwipeQuota(); notify('ย้อนกลับการปัดล่าสุดแล้ว')
  }
  const superLike = async (p) => {
    if (!p?.id || superBusy || swipeInFlight.current.has(p.id)) return false
    swipeInFlight.current.add(p.id)
    setSuperBusy(true)
    const { error } = await supabase.rpc('v60_super_like', { p_target: p.id })
    setSuperBusy(false)
    swipeInFlight.current.delete(p.id)
    if (error) return notify(error.message.includes('limit') ? 'ใช้ Super Like ครบ 3 ครั้งของวันนี้แล้ว' : 'Super Like ไม่สำเร็จ: '+error.message)
    setLastSwipe(null)
    refreshSwipeQuota()
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
    setDetail({ ...person, is_premium: person?.id === userId ? ownerPremium : !!person?.is_premium })
    if (!person?.id) return
    if (person.id !== userId) {
      supabase.rpc('is_profile_premium', { p_profile_id: person.id }).then(({ data, error }) => {
        if (!error) setDetail(current => current?.id === person.id ? { ...current, is_premium: data === true } : current)
      }).catch(() => {})
    }
    if (person.id !== userId) supabase.rpc('track_profile_view', { p_profile_id: person.id }).then(({error}) => { if (error && !String(error.message || '').includes('function')) console.debug('Profile view tracking unavailable until v76 SQL is applied') }).catch(() => {})
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
    // Hangout participants may not be allowed to read each other's full profiles directly.
    // Use the room-scoped, privacy-limited RPC first, then the normal profile query as fallback.
    if (person.hangout_event_id) {
      const { data: roomProfile, error: roomProfileError } = await supabase.rpc('hangout_public_profile_details', { p_event_id: person.hangout_event_id, p_profile_id: person.id })
      if (!roomProfileError && roomProfile && typeof roomProfile === 'object') {
        setDetail(current => current?.id === person.id ? { ...current, ...roomProfile } : current)
      }
    }
    const { data, error } = await supabase.from('profiles')
      .select('avatar_path, photo_paths, university_id, faculty, major, bio, interests, relationship_intent, itunes_track_id, itunes_track_name, itunes_track_artist, itunes_track_image, itunes_track_preview, itunes_track_url')
      .eq('id', person.id).maybeSingle()
    if (!error && data) setDetail(current => current?.id === person.id ? { ...current, ...data } : current)
    // Premium likes/visitor RPCs intentionally return a compact list. Fetch song/profile
    // details through a guarded RPC too, so music still appears when direct profile RLS
    // does not return the same fields as the swipe deck.
    if (person.id !== userId && ['likes', 'visitors'].includes(view)) {
      const { data: premiumDetails, error: premiumDetailsError } = await supabase.rpc('get_premium_list_profile_details', { p_profile_id: person.id })
      if (!premiumDetailsError && premiumDetails && typeof premiumDetails === 'object') {
        setDetail(current => current?.id === person.id ? { ...current, ...premiumDetails } : current)
      }
    }
  }
  const detailIsMatch = !!(detail?.id && matches.some(m => m.p?.id === detail.id))
  const notificationReturnView = useRef('home')
  const go = (v) => { if (v !== view) { document.querySelectorAll('audio, video').forEach(media => { if (!media.paused) media.pause() }); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.querySelectorAll('main, .app-main, .page-content').forEach(el => { if (el.scrollTop > 0) el.scrollTop = 0 }); requestAnimationFrame(() => { window.scrollTo(0, 0); document.querySelectorAll('main, .app-main, .page-content').forEach(el => { if (el.scrollTop > 0) el.scrollTop = 0 }) }) } if ((v === 'notifications' || v === 'announcements') && view !== 'notifications' && view !== 'announcements') notificationReturnView.current = view; if (v === 'admin' && !profile?.is_admin) return; if (v === 'admin') window.history.pushState({}, '', '/admin'); else if (v === 'announcements') window.history.pushState({}, '', '/announcements'); else if (v === 'notifications') window.history.pushState({}, '', '/notifications'); else if (window.location.pathname === '/admin' || window.location.pathname === '/announcements' || window.location.pathname === '/notifications') window.history.pushState({}, '', '/'); if (v !== view) playNisitSound('menu'); if (v === 'search') v = 'home'; if (v === 'profile' && !profileVisited) setProfileVisited(true); if (v === 'profile' && view !== 'profile' && profileEntryTab !== 'verification') setProfileEntryTab('photos'); setView(v); setNav(false); if (v === 'messages') loadMatches() }
  const matchesSelectedGender = p => !discovery?.gender || p.gender === discovery.gender
  const filteredPeople = useMemo(() => (people || []).filter(p => (!discovery?.gender || p.gender === discovery.gender) && campusFiltered(p)), [people, discovery?.gender, campusFiltered])
  // Never bypass the chosen campus radius when no nearby profile exists.
  const swipePeople = filteredPeople
  // A failed background page can be retried without clearing existing swipe cards.
  const Toast = toast && <div className="toast"><Heart size={16} fill="currentColor" />{toast}</div>

  if (session === undefined) return authInitTimedOut
    ? <main className="page-center" role="alert"><section className="empty-state"><h3>เชื่อมต่อระบบไม่สำเร็จ</h3><p>ระบบยืนยันตัวตนตอบกลับช้า อาจเป็นปัญหาชั่วคราวของเซิร์ฟเวอร์ ข้อมูลของคุณยังไม่ถูกลบ</p><button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>ลองเชื่อมต่ออีกครั้ง</button></section></main>
    : <div className="page-center"><span className="spin" /></div>
  if (user && profile === undefined) return profileLoadTimedOut
    ? <main className="page-center" role="alert"><section className="empty-state"><h3>โหลดโปรไฟล์ไม่สำเร็จ</h3><p>ระบบยังติดต่อฐานข้อมูลไม่ได้ ลองโหลดโปรไฟล์ใหม่โดยไม่ต้องออกจากระบบ</p><button type="button" className="btn btn-primary" onClick={() => { setProfileLoadTimedOut(false); setProfileLoadAttempt(attempt => attempt + 1); loadProfile() }}>ลองอีกครั้ง</button></section></main>
    : <div className="page-center"><span className="spin" /></div>
  if (authCallback) return <AuthLinkScreen onFinished={() => { clearAuthCallbackUrl(); setAuthCallback(false) }} />
  if (!user) return <><Landing onLogin={() => setModal('login')} onRegister={() => setModal('register')} />{modal && <AuthModal mode={modal} setMode={setModal} close={() => setModal('')} notify={notify} />}{Toast}</>
  if (!profile) return <main className="page-content onboard"><ProfilePage user={user} onboarding onSaved={loadProfile} notify={notify} /><button className="btn btn-ghost btn-small" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> ออกจากระบบ</button>{Toast}</main>

  if (discoveryReady && discoveryEditing) return <PreferencesEditor initial={discovery} profile={profile} onSave={saveDiscovery} onClose={() => setDiscoveryEditing(false)} />
  if (discoveryReady && !discovery) return <DiscoverySetup initial={discovery} profile={profile} onSave={saveDiscovery} onClose={() => setDiscoveryEditing(false)} />

  const items = [['home', 'หน้าหลัก', Heart], ['messages', 'ข้อความ', MessageCircle], ['likes', 'ถูกใจ / ผู้เข้าชม', HeartHandshake], ['hangout', 'Hangout', CalendarDays], ['premium', 'Premium', Crown], ['notifs', 'การแจ้งเตือน', Bell], ['profile', 'โปรไฟล์ของฉัน', UserRound], ['settings', 'การตั้งค่า', Settings]]
  const empty = <div className="empty-state"><div className="empty-icon"><Search /></div><h3>ยังไม่มีสมาชิกให้แสดง</h3><p>ตอนนี้ยังไม่มีสมาชิกคนอื่นที่ตรงกับตัวกรอง ลองปรับตัวกรอง หรือชวนเพื่อนมาสมัคร</p><button type="button" className="btn btn-ghost" onClick={() => loadPeople()}>ลองค้นหาอีกครั้ง</button></div>
  return (
    <div className={"app-shell" + (view === 'home' ? " home-swipe-locked" : "")}>
      <aside className={'sidebar ' + (nav ? 'show' : '')}><Brand onClick={() => go('home')} /><div className="side-label">เมนูหลัก</div>
        {items.map(([id, label, I]) => <button key={id} className={'nav-item ' + (id === 'premium' ? 'premium-nav-item ' : '') + (view === id ? 'active' : '') + (id === 'messages' && unreadMessages > 0 ? ' has-unread-messages' : '') + (id === 'notifs' && unread > 0 ? ' has-unread-notifications' : '')} onClick={() => go(id)}><I size={18} />{label}{id === 'messages' && unreadMessages > 0 && <span className="nav-count">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}{id === 'notifs' && unread > 0 && <span className="nav-count">{unread}</span>}</button>)}
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><Av u={profile} /><div className="user-mini"><b>{profile.display_name}</b><span>{universityWithCampus(profile)}</span></div><button className="icon-btn" onClick={() => supabase.auth.signOut()} title="ออกจากระบบ"><LogOut size={17} /></button></div></aside>

      <PushPermissionCard user={user} />
      <nav className="bottom-nav" aria-label="เมนูหลักบนมือถือ">
        {[["home","ปัด",Heart],["likes","ถูกใจ / ผู้เข้าชม",HeartHandshake],["messages","ข้อความ",MessageCircle],["hangout","Hangout",CalendarDays],["profile","โปรไฟล์",UserRound],["settings","ตั้งค่า",Settings]].map(([id,label,Icon]) => <button type="button" key={id} onClick={() => go(id)} className={(view === id ? "bottom-nav-item active" : "bottom-nav-item") + (id === "messages" && unreadMessages > 0 ? " has-unread-messages" : "") + (id === "notifs" && unread > 0 ? " has-unread-notifications" : "")} aria-current={view === id ? "page" : undefined}><span className="bottom-icon"><Icon size={21} strokeWidth={view === id ? 2.5 : 1.8}/>{id === "notifs" && unread > 0 && <i className="bottom-dot"/>}{id === "messages" && unreadMessages > 0 && <span className="message-unread-count">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</span><span>{label}</span></button>)}
      </nav>
      <main className="main-area">
        <div className="page-content">
          {view === 'home' && <>
            <header className="nm-discover-header">
              <div className="nm-discover-title-row">
                <div className="nm-discover-title"><span className="nm-discover-eyebrow">DISCOVER</span><h1>พบคนที่ใช่ในแบบของคุณ</h1><p>ทำความรู้จักคนใหม่ ๆ จากมหาวิทยาลัยที่คุณสนใจ</p></div>
                <button type="button" onClick={() => go("notifications")} className={unread > 0 ? "nm-notification-bell nm-notification-bell-unread nm-discover-notifications" : "nm-notification-bell nm-discover-notifications"} title="การแจ้งเตือน" aria-label={unread > 0 ? `การแจ้งเตือน ${unread} รายการที่ยังไม่อ่าน` : "การแจ้งเตือน"}><Bell size={20}/>{unread > 0 && <span className="nm-discover-unread">{unread > 99 ? "99+" : unread}</span>}</button>
              </div>
              <div className="nm-discover-actions">
                <style>{`@keyframes nmDailyNudge{0%,100%{transform:translateY(0) scale(1)}35%{transform:translateY(-3px) scale(1.035)}60%{transform:translateY(0) scale(1)}}@keyframes nmDailyGlow{0%,100%{box-shadow:0 0 0 1px rgba(250,204,21,.2),0 0 8px rgba(250,204,21,.08)}50%{box-shadow:0 0 0 1px rgba(250,204,21,.6),0 0 18px rgba(250,204,21,.24)}}@keyframes nmCrownShine{0%,100%{filter:drop-shadow(0 0 2px rgba(253,224,71,.35));transform:translateY(0) rotate(-3deg)}50%{filter:drop-shadow(0 0 7px rgba(253,224,71,.95));transform:translateY(-1px) rotate(3deg)}}@keyframes nmPremiumSparkle{0%,100%{opacity:.55;transform:scale(.8) rotate(0)}50%{opacity:1;transform:scale(1.22) rotate(25deg)}}.nm-discover-daily.nm-daily-unclaimed{animation:nmDailyNudge 2s ease-in-out infinite,nmDailyGlow 2s ease-in-out infinite;border-color:rgba(250,204,21,.65)!important}.nm-discover-daily.nm-daily-unclaimed svg{filter:drop-shadow(0 0 5px rgba(250,204,21,.75))}.nm-discover-premium{position:relative;overflow:visible;border-color:rgba(244,194,80,.45)!important;box-shadow:0 0 12px rgba(234,179,8,.08)}.nm-discover-premium>svg:first-child{color:#fcd34d;transform-origin:center;animation:nmCrownShine 2.4s ease-in-out infinite}.nm-discover-premium .nm-discover-premium-sparkle{color:#f9a8d4;animation:nmPremiumSparkle 1.8s ease-in-out infinite;filter:drop-shadow(0 0 4px rgba(249,168,212,.85))}@media(prefers-reduced-motion:reduce){.nm-discover-daily.nm-daily-unclaimed,.nm-discover-premium>svg:first-child,.nm-discover-premium .nm-discover-premium-sparkle{animation:none!important}}`}</style>
                <button type="button" aria-label="เปิด Daily Login" className={'btn nm-discover-daily' + (!dailyClaimed ? ' nm-daily-unclaimed' : '')} onClick={() => setDailyOpen(true)}><Gift size={17}/><span>Daily Login</span></button>
                <button type="button" className="btn nm-discover-premium" onClick={() => go('premium')}><Crown size={17}/><span>Premium</span><Sparkles size={13} className="nm-discover-premium-sparkle"/></button>
                <button type="button" className="btn nm-discover-preferences" onClick={() => setDiscoveryEditing(true)}><SlidersHorizontal size={17}/><span>แก้ไขสเปก</span></button>
              </div>
            </header>
            {dailyOpen && createPortal(<div className="nm-daily-backdrop" role="presentation" onClick={() => setDailyOpen(false)}>
              <section className="nm-daily-modal" role="dialog" aria-modal="true" aria-labelledby="nm-daily-title" onClick={e=>e.stopPropagation()}>
                <button type="button" className="nm-daily-close" aria-label="ปิด Daily Login" onClick={()=>setDailyOpen(false)}><X size={19}/></button>
                <div className="nm-daily-hero"><div className="nm-daily-gift"><Gift size={42}/></div><span className="nm-daily-kicker">DAILY REWARDS · NISIT MATCH</span><h2 id="nm-daily-title">ของขวัญประจำวัน</h2><p>กลับมาเจอกันทุกวัน สะสมสถิติไปด้วยกัน ✨</p></div>
                <DailyRewardsAndSafety user={user} notify={notify} mode="daily"/>
              </section>
            </div>, document.body)}
            <div className="result-meta"><span>โปรไฟล์ที่ตรงกับสเปกของคุณ</span><span>{swipePeople.length} โปรไฟล์{discoveryLoadingMore ? ' · กำลังโหลดเพิ่ม' : ''}{discoveryPageError ? ' · โหลดเพิ่มไม่สำเร็จ' : ''}</span>{discoveryPageError && <button type="button" onClick={() => { setDiscoveryPageError(false); loadPeople({ nextPage: true }) }} style={{marginLeft:8,padding:'6px 10px',borderRadius:10,border:'1px solid var(--theme-border)',background:'var(--theme-sidebar)',color:'var(--theme-text)',cursor:'pointer'}}>ลองโหลดเพิ่มอีกครั้ง</button>}</div>
            
            {quotaDialog && <div className="nm-quota-overlay" role="presentation" onClick={() => setQuotaDialog(false)}><section className="nm-quota-dialog" role="alertdialog" aria-modal="true" aria-labelledby="nm-quota-title" aria-describedby="nm-quota-description" onClick={e => e.stopPropagation()}><div className="nm-quota-symbol" aria-hidden="true"><Heart size={30} fill="currentColor"/><span className="nm-quota-orbit" aria-hidden="true"/></div><span className="nm-quota-eyebrow">NISIT MATCH · SWIPE LIMIT</span><h2 id="nm-quota-title">พักหัวใจสักครู่</h2><p id="nm-quota-description" className="nm-quota-description">คุณใช้สิทธิ์ปัดครบ 30 ครั้งในรอบ 1 ชั่วโมงแล้ว</p><div className="nm-quota-timer"><span>ปัดได้อีกครั้งใน</span><strong aria-live="off">{quotaWaitLabel}</strong>{quotaNextTimeLabel && <small>เริ่มปัดได้ประมาณ {quotaNextTimeLabel} น.</small>}</div><p className="nm-quota-footnote">ระหว่างนี้แวะดูข้อความหรือโปรไฟล์ของคุณได้นะ</p><button type="button" className="nm-quota-confirm" autoFocus onClick={() => setQuotaDialog(false)}>เข้าใจแล้ว <span aria-hidden="true">→</span></button></section></div>}
            {people === null ? <div className="page-center nm-swipe-smart-loading" role="status" aria-live="polite"><div className="nm-swipe-loading-orbit"><div className="nm-swipe-loading-heart"><Heart size={29} fill="currentColor" /></div></div><strong>NISIT <em>MATCH</em></strong><span>กำลังเตรียมคนที่ใช่ให้คุณ...</span><div className="nm-swipe-loading-track"><span /></div><small>อีกนิดเดียวก็ได้เจอกัน</small></div> : swipePeople.length ? <SwipeDeck key={swipePeople[0]?.id || 'empty-swipe'} people={swipePeople} swipeRemaining={ownerPremium ? null : (swipeQuota?.remaining ?? null)} myInterests={profile?.interests || []} onLike={(x) => { if (swipeQuota?.remaining !== 0) playNisitSound('like'); return swipe(x, true) }} onSkip={(x) => swipe(x, false)} onSuperLike={superLike} onUndo={undoSwipe} canUndo={!!lastSwipe && !superBusy} onOpen={openDetail} onReport={report} verifiedIds={verifiedCampusIds} /> : empty}
            <div className="section-heading matches-heading"><div><h2>พื้นที่ของความสัมพันธ์</h2><p>เมื่อคุณ Match กับใคร แชตของคุณจะปรากฏตรงนี้</p></div></div>
            <div className="empty-state compact"><div className="empty-icon"><MessageCircle /></div><div><b>{matches.length ? `คุณมี ${matches.length} Match แล้ว` : 'ทุกความสัมพันธ์เริ่มจากการทักทาย'}</b><p>{matches.length ? 'เข้าไปเริ่มบทสนทนากับคนที่ Match กันได้เลย' : 'กดถูกใจโปรไฟล์ที่คุณสนใจ แล้วรอให้ถูกใจกันทั้งสองฝ่าย'}</p></div><button className="btn btn-ghost" onClick={() => go(matches.length ? 'messages' : 'home')}>{matches.length ? 'เปิดข้อความ' : 'ปัดต่อ'} <ArrowRight size={15} /></button></div>
          </>}
          {view === 'likes' && <LikesVisitorsPage user={user} notify={notify} onOpenProfile={openDetail} onGoPremium={() => go('premium')} />}
          {view === 'visitors' && <PremiumListPage kind="visitors" user={user} notify={notify} onOpenProfile={openDetail} onGoPremium={() => go('premium')} />}
          {view === 'hangout' && <HangoutPage user={user} profile={profile} notify={notify} onJoinedHangout={(eventId) => { try { sessionStorage.setItem(`nisit-pending-hangout-chat:${user.id}`, eventId) } catch {}; go('messages') }} onGoVerify={() => go('verification')} />}
          {view === 'premium' && <PremiumPage user={user} notify={notify} onGoVisitors={() => go('visitors')} />}
          {view === 'messages' && <Messages me={user.id} matches={matches} notify={notify} reload={loadMatches} onOpenProfile={openDetail} onMessagesRead={() => { loadUnreadMessages(); loadUnread() }} onOpenHangoutChat={(eventId) => { try { sessionStorage.setItem(`nisit-pending-hangout-chat:${user.id}`, eventId) } catch {}; go('messages') }} />}
          {view === 'notifs' && <Notifs me={user.id} refresh={loadUnread} go={go} />}
          {view === 'verification' && <section className="nm-direct-verification"><button type="button" className="btn btn-ghost" onClick={() => go('hangout')}><ArrowRight size={18}/> กลับไป Hangout</button><Heading kicker="CAMPUS VERIFICATION" title="ยืนยันอีเมลมหาวิทยาลัย" sub="ยืนยันสถานะนักศึกษาเพื่อเข้าร่วม Hangout" /><CampusEmailVerification user={user} /></section>}
          {view === 'profile' && <ProfilePage user={user} profile={profile} onSaved={loadProfile} notify={notify} ownerPremium={ownerPremium} initialEditTab={profileEntryTab} />}
          {view === 'settings' && <SettingsPage user={user} notify={notify} onInstall={openInstall} isInstalled={isInstalled} onAdmin={profile?.is_admin ? () => go('admin') : null} />}{view === 'admin' && profile?.is_admin && <AdminDashboard onBack={() => go('settings')} />}{view === 'announcements' && <><button type="button" className="btn btn-ghost" onClick={() => go(notificationReturnView.current === 'announcements' ? 'home' : notificationReturnView.current)}><ArrowLeft size={16}/> กลับ</button><Announcements/></>}{view === 'notifications' && <><button type="button" className="btn btn-ghost" onClick={() => go(notificationReturnView.current === 'notifications' ? 'home' : notificationReturnView.current)}><ArrowLeft size={16}/> กลับ</button><NotificationCenter onNavigate={go}/><section style={{marginTop:28}}><Announcements/></section></>}
          <footer className="app-footer"><span>© 2026 nisit match</span><span>สร้างด้วยความใส่ใจ <Heart size={12} fill="currentColor" /></span><button type="button" className="nm-guide-open-btn" onClick={() => { setGuideStep(0); setGuideOpen(true) }}><Sparkles size={15}/> ดูคู่มือการใช้งาน <ArrowRight size={15}/></button></footer>
        </div>
      </main>
      {referralEventOpen && !dailyOpen && createPortal(<div className="nm-referral-event-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeReferralEvent() }}>
        <section className="nm-referral-event" role="dialog" aria-modal="true" aria-labelledby="nm-referral-event-title">
          <button type="button" className="nm-referral-event-close" aria-label="ปิดกิจกรรมชวนเพื่อน" onClick={closeReferralEvent}><X size={20}/></button>
          <div className="nm-referral-event-slides" onTouchStart={e => { eventTouchStart.current = e.touches[0]?.clientX ?? null }} onTouchEnd={e => { if (eventTouchStart.current == null) return; const dx = e.changedTouches[0].clientX - eventTouchStart.current; if (Math.abs(dx) > 45) setEventSlide(dx < 0 ? 1 : 0); eventTouchStart.current = null }}>
            {eventSlide === 0 ? <>
              <div className="nm-referral-event-glow"><Sparkles size={25}/><Crown size={52}/><Sparkles size={25}/></div>
              <span className="nm-referral-event-kicker">SPECIAL EVENT · INVITE & EARN</span>
              <h2 id="nm-referral-event-title">ชวนเพื่อน รับ Premium ฟรี!</h2>
              <p>ชวนเพื่อนมาเจอคนที่ใช่ และรับสิทธิพิเศษเมื่อเพื่อนยืนยันอีเมลมหาวิทยาลัยสำเร็จ</p>
              <div className="nm-referral-event-rewards"><div><small>คุณได้รับ</small><strong>7 วัน</strong><span>Premium ฟรี</span></div><div><small>เพื่อนที่ถูกชวน</small><strong>3 วัน</strong><span>Premium ฟรี</span></div></div>
              <button type="button" className="nm-referral-event-cta" onClick={() => { closeReferralEvent(); go('premium') }}><Gift size={20}/> ดูรหัสชวนเพื่อน <ArrowRight size={19}/></button>
            </> : <>
              <div className="nm-referral-event-glow"><Sparkles size={25}/><MailCheck size={52}/><Sparkles size={25}/></div>
              <span className="nm-referral-event-kicker">SPECIAL EVENT · EMAIL REWARD</span>
              <h2 id="nm-referral-event-title">ยืนยันอีเมล รับ Premium ฟรี!</h2>
              <p>ยืนยันอีเมลบัญชีด้วย OTP 6 หลัก เพื่อรับ Premium ฟรี 3 วัน เพียงครั้งเดียวต่อบัญชี</p>
              <div className="nm-referral-event-rewards"><div><small>ยืนยันอีเมลบัญชี</small><strong>3 วัน</strong><span>Premium ฟรี</span></div></div>
              <button type="button" className="nm-referral-event-cta" onClick={() => { closeReferralEvent(); setProfileEntryTab('account-email'); go('profile') }}><MailCheck size={20}/> ไปยืนยันอีเมล <ArrowRight size={19}/></button>
            </>}
          </div>
          <div className="nm-event-pagination" aria-label="เลือกหน้ากิจกรรม">
            <button type="button" aria-label="กิจกรรมชวนเพื่อน" aria-current={eventSlide === 0 ? 'page' : undefined} className={eventSlide === 0 ? 'active' : ''} onClick={() => setEventSlide(0)} />
            <button type="button" aria-label="กิจกรรมยืนยันอีเมล" aria-current={eventSlide === 1 ? 'page' : undefined} className={eventSlide === 1 ? 'active' : ''} onClick={() => setEventSlide(1)} />
            <button type="button" className="nm-event-next" onClick={() => setEventSlide(eventSlide === 0 ? 1 : 0)}>{eventSlide === 0 ? 'ปัดซ้ายเพื่อดูอีกกิจกรรม →' : '← กลับไปกิจกรรมชวนเพื่อน'}</button>
          </div>
          <label className="nm-referral-event-optout"><input type="checkbox" checked={referralEventNeverShow} onChange={e => setReferralEventNeverShow(e.target.checked)}/> ไม่ต้องแสดงกิจกรรมนี้อีก</label>
          <button type="button" className="nm-referral-event-later" onClick={closeReferralEvent}>ไว้ทีหลัง · ปิดหน้าต่าง</button>
        </section>
      </div>, document.body)}
      {visibleDetail && createPortal(<div className={"modal-backdrop detail-backdrop hangout-member-profile-portal" + (detailLeaving ? " is-closing" : "")} onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}><div className="detail-modal" role="dialog" aria-modal="true" aria-label="โปรไฟล์สมาชิก"><button type="button" className="modal-close detail-close-btn" onClick={() => setDetail(null)} aria-label="ปิดโปรไฟล์" title="ปิดโปรไฟล์"><X size={21} strokeWidth={2.6} /></button>
        <ProfileGallery person={visibleDetail} />
        <div className="detail-body nm-member-profile-body"><div className="section-kicker">GET TO KNOW THEM</div><h2>{visibleDetail.display_name}, {visibleDetail.age}</h2>{visibleDetail.is_premium && <PremiumProfileBadge owner={visibleDetail.id === userId} />}
          <p className="detail-campus-line"><GraduationCap size={15} />{visibleDetail.university_id ? universityWithCampus(visibleDetail) : 'มหาวิทยาลัยยังไม่ระบุ'}{visibleDetail.faculty ? ` · ${visibleDetail.faculty}` : ''}{visibleDetail.major ? ` · ${visibleDetail.major}` : ''}</p>{verifiedCampusIds.includes(visibleDetail.id) && <CampusVerifiedBadge universityId={visibleDetail.university_id} />}{visibleDetail.relationship_intent && <RelationshipVibe intent={visibleDetail.relationship_intent} />}<p>{visibleDetail.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
          <div className="tags nm-member-interest-tags">{(visibleDetail.interests || []).map((i, index) => <span className="tag" style={{"--tag-index":index}} key={i}>{i}</span>)}</div>
          <div className="match-profile-song">{itunesTrack(visibleDetail) ? <ITunesSongCard track={itunesTrack(visibleDetail)} compact /> : <div className="detail-no-song"><Music2 size={17}/><span><b>ยังไม่ได้เพิ่มเพลงโปรด</b><small>เพลงที่สมาชิกเลือกจะแสดงตรงนี้</small></span></div>}</div>
          {detailIsMatch ? <button className="btn btn-pink btn-full" onClick={() => { setDetail(null); go("messages") }}><MessageCircle size={17} /> กลับไปคุยกัน</button> : <button className="btn btn-pink btn-full" onClick={() => swipe(visibleDetail, true)}><Heart size={17} fill="currentColor" /> ส่งหัวใจให้คนนี้</button>}
          <button type="button" className="detail-bottom-close" onClick={() => setDetail(null)}>← กลับไปหน้าปัด</button>
          <div className="detail-secondary"><button onClick={() => report(visibleDetail)}><Flag size={15} /> รายงานโปรไฟล์</button><button onClick={() => block(visibleDetail)}><Ban size={15} /> บล็อก</button></div></div></div></div>, document.body)}
      {reportTarget && createPortal(<div className="modal-backdrop nm-dialog-backdrop nm-report-portal" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !reportBusy) setReportTarget(null) }}><div className="nm-dialog" role="dialog" aria-modal="true" aria-labelledby="nm-report-title"><button className="nm-dialog-close" type="button" onClick={() => setReportTarget(null)} disabled={reportBusy} aria-label="ปิด"><X size={20}/></button><div className="nm-dialog-eyebrow"><ShieldCheck size={16}/> SAFETY CENTER</div><h2 id="nm-report-title">รายงานผู้ใช้</h2><p>รายงานโปรไฟล์ของ {reportTarget.display_name || 'ผู้ใช้นี้'} ทีมดูแลจะตรวจสอบข้อมูลโดยไม่เปิดเผยตัวตนผู้รายงานแก่ผู้ถูกรายงาน</p><label className="nm-field-label" htmlFor="nm-report-reason">เหตุผลที่รายงาน</label><select id="nm-report-reason" className="nm-report-select" value={reportReason} onChange={e => setReportReason(e.target.value)}><option value="fake_profile">โปรไฟล์ปลอมหรือแอบอ้าง</option><option value="harassment">คุกคามหรือใช้คำพูดไม่เหมาะสม</option><option value="inappropriate">เนื้อหาไม่เหมาะสม</option><option value="scam">หลอกลวงหรือสแปม</option><option value="other">อื่น ๆ</option></select><label className="nm-field-label" htmlFor="nm-report-notes">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label><textarea id="nm-report-notes" className="nm-report-notes" maxLength={350} value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="เล่าเหตุการณ์สั้น ๆ เพื่อช่วยให้ตรวจสอบได้เร็วขึ้น"/><div className="nm-dialog-actions"><button type="button" className="btn btn-ghost" onClick={() => setReportTarget(null)} disabled={reportBusy}>ยกเลิก</button><button type="button" className="btn btn-pink" onClick={submitReport} disabled={reportBusy}>{reportBusy ? 'กำลังส่ง...' : 'ส่งรายงาน'}</button></div></div></div>, document.body)}
      {installHelpOpen && createPortal(<div className="modal-backdrop nm-dialog-backdrop nm-install-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setInstallHelpOpen(false) }}><div className="nm-dialog nm-install-dialog" role="dialog" aria-modal="true" aria-labelledby="nm-install-title"><button type="button" className="nm-dialog-close" aria-label="ปิด" onClick={() => setInstallHelpOpen(false)}><X size={20}/></button><div className="nm-install-icon"><Heart size={32} fill="currentColor"/></div><span className="nm-install-kicker">NISIT MATCH · APP</span><h2 id="nm-install-title">เพิ่มแอปไว้บนหน้าจอโฮม</h2><p>เปิด NISIT MATCH ได้สะดวกเหมือนแอปทั่วไป ไม่ต้องพิมพ์ชื่อเว็บใหม่</p><div className="nm-install-steps">{isIOSInstall ? <><div><b>01</b><span>เปิดเว็บไซต์นี้ใน <strong>Safari</strong></span></div><div><b>02</b><span>แตะปุ่ม <strong>แชร์</strong> ในแถบเครื่องมือ</span></div><div><b>03</b><span>เลือก <strong>เพิ่มไปยังหน้าจอโฮม</strong> แล้วกดเพิ่ม</span></div></> : <><div><b>01</b><span>เปิดเว็บนี้ใน <strong>Chrome หรือ Edge</strong></span></div><div><b>02</b><span>แตะเมนูเบราว์เซอร์ <strong>⋮</strong> หรือไอคอนติดตั้ง</span></div><div><b>03</b><span>เลือก <strong>ติดตั้งแอป</strong> หรือ <strong>เพิ่มลงหน้าจอหลัก</strong></span></div></>}</div><button type="button" className="nm-install-done" onClick={() => setInstallHelpOpen(false)}>เข้าใจแล้ว <Check size={17}/></button><small>เพื่อความปลอดภัย เบราว์เซอร์ต้องให้คุณยืนยันการติดตั้งด้วยตัวเอง</small></div></div>, document.body)}
      {guideOpen && createPortal(<div className="modal-backdrop nm-dialog-backdrop nm-guide-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeGuide() }}><div className="nm-dialog nm-guide nm-guide-v2" role="dialog" aria-modal="true" aria-labelledby="nm-guide-title">
        <button className="nm-dialog-close" type="button" onClick={closeGuide} aria-label="ปิดคู่มือ"><X size={20}/></button>
        <div className="nm-guide-v2-top"><span className="nm-guide-v2-brand"><Sparkles size={17}/> NISIT MATCH <small>GUIDE</small></span><span className="nm-guide-v2-counter">{String(guideStep+1).padStart(2,'0')} / 06</span></div>
        <div className="nm-guide-v2-progress">{[0,1,2,3,4,5].map(i=><button key={i} type="button" className={i<=guideStep?'active':''} aria-label={`ไปยังขั้นตอนที่ ${i+1}`} onClick={()=>setGuideStep(i)}/>)}</div>
        <div className="nm-guide-v2-visual" key={guideStep}>
          <div className="nm-guide-v2-halo"/><div className="nm-guide-v2-icon">{[<Heart size={49} key="swipe"/>,<MessageCircle size={49} key="chat"/>,<GraduationCap size={49} key="campus"/>,<CalendarDays size={49} key="hangout"/>,<ShieldCheck size={49} key="safety"/>,<Globe2 size={49} key="install"/>][guideStep]}</div>
          <span className="nm-guide-v2-visual-caption">{['DISCOVER YOUR VIBE','BETTER TOGETHER','CAMPUS VERIFIED','MEET YOUR PEOPLE','STAY SAFE','YOUR APP, YOUR WAY'][guideStep]}</span>
        </div>
        <div className="nm-guide-v2-copy"><span className="nm-guide-v2-kicker">ขั้นตอนที่ {guideStep+1} · เรียนรู้การใช้งาน</span><h2 id="nm-guide-title">{['ค้นหาคนที่ตรงสเปค','กดใจ แล้วเริ่มแชต','ยืนยันอีเมลมหาวิทยาลัย','ค้นพบ Hangout','ปลอดภัยและเป็นตัวเอง','ติดตั้งแอปบนหน้าจอ'][guideStep]}</h2>
        <p>{[
          'ตั้งค่าสเปคเพศ ช่วงอายุ และมหาวิทยาลัย จากนั้นปัดขวาเมื่อถูกใจ ปัดซ้ายเพื่อข้าม หรือแตะรูปเพื่อดูโปรไฟล์เพิ่มเติม',
          'เมื่อคุณและอีกฝ่ายกดถูกใจตรงกัน จะเกิด Match เข้าแท็บข้อความเพื่อส่งแชต รูปภาพ หรือข้อความเสียงถึงกันได้',
          'เข้าโปรไฟล์แล้วเลือก “ยืนยันสถานะนักศึกษา” หรือกดปุ่มยืนยันจากหน้า Hangout ใช้อีเมลมหาวิทยาลัยเพื่อรับเครื่องหมายยืนยัน',
          'เข้าเมนู Hangout เพื่อดูกิจกรรมและพบเพื่อนใหม่ ระบบอาจขอให้ยืนยันอีเมลมหาวิทยาลัยก่อนเข้าร่วม',
          'ไม่ต้องแชร์รหัสผ่านหรือข้อมูลส่วนตัวกับคนอื่น หากพบพฤติกรรมไม่เหมาะสม สามารถบล็อกและรายงานโปรไฟล์ได้',
          'iPhone: เปิดเว็บด้วย Safari แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม” · Android: เปิดด้วย Chrome แตะเมนู ⋮ แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มลงในหน้าจอหลัก”'
        ][guideStep]}</p></div>
        <div className="nm-guide-v2-actions"><button type="button" className="nm-guide-v2-back" onClick={guideStep===0?closeGuide:()=>setGuideStep(x=>x-1)}>{guideStep===0?'ไว้ทีหลัง':'ย้อนกลับ'}</button><button type="button" className="nm-guide-v2-next" onClick={guideStep===5?closeGuide:()=>setGuideStep(x=>x+1)}>{guideStep===5?'เริ่มใช้งาน':'ถัดไป'} <ArrowRight size={18}/></button></div>
      </div></div>, document.body)}
      {newMatch && createPortal(<div className="match-overlay v26-match-overlay" style={{position:'fixed',inset:0,zIndex:99999,overflowY:'auto',overscrollBehavior:'contain',padding:'max(16px, env(safe-area-inset-top)) 12px max(24px, env(safe-area-inset-bottom))'}} role="dialog" aria-modal="true" aria-label="คุณแมตช์กันแล้ว" onMouseDown={e => {if(e.target === e.currentTarget) setNewMatch(null)}}><div className="v26-match-dialog v56-match-dialog v67-match-dialog" style={{maxHeight:'calc(100dvh - 40px)',overflowY:'auto',margin:'auto'}}><div className="v64-match-glow" aria-hidden="true"/><div className="v67-match-shockwave" aria-hidden="true"/><div className="v67-match-shockwave second" aria-hidden="true"/><div className="v67-match-confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{"--i":i,"--angle":`${i*360/24}deg`}}/>)}</div><div className="v67-match-crown" aria-hidden="true"><Heart size={70} fill="currentColor"/></div><div className="v56-match-sparkles" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{"--i":i}} />)}</div><button className="match-close" onClick={() => setNewMatch(null)} aria-label="ปิด"><X size={21}/></button><div className="v26-match-kicker">A NEW CONNECTION</div><div className="v26-match-pictures v64-match-pictures"><div className="v26-match-picture yours"><Av u={profile}/></div><span className="v26-match-heart"><Heart size={24} fill="currentColor"/></span><div className="v26-match-picture theirs"><Av u={newMatch.p}/></div></div><h1>It's a Match<span>!</span></h1><p>คุณกับ {newMatch.p.display_name} ถูกใจกันและกัน<br/>นี่อาจเป็นจุดเริ่มต้นของเรื่องราวดี ๆ</p><button className="v26-match-primary" onClick={() => {try { sessionStorage.setItem('nisit-active-chat:' + user.id, newMatch.id) } catch {} setNewMatch(null);go('messages')}}>เริ่มพูดคุย <ArrowRight size={18}/></button><button className="v26-match-secondary" onClick={() => setNewMatch(null)}>ปัดต่อ</button></div></div>, document.body)}
      {Toast}
    </div>
  )
}



// Keep unexpected rendering failures from taking down the entire application shell.
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('NISIT MATCH render error', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return <main role="alert" style={{minHeight:'100dvh',display:'grid',placeContent:'center',gap:16,padding:24,textAlign:'center',background:'#130f1c',color:'#fff'}}>
      <ShieldCheck size={42} style={{margin:'auto',color:'#f9a8d4'}}/>
      <h1 style={{fontSize:22,margin:0}}>เกิดข้อผิดพลาดในการแสดงผล</h1>
      <p style={{opacity:.8,margin:0}}>ลองโหลดแอปใหม่อีกครั้ง หากยังพบปัญหากรุณาติดต่อผู้ดูแล</p>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>โหลดแอปใหม่</button>
    </main>
  }
}
export default function App() { return <AppErrorBoundary><SiteVisitorPresence/><AppContent/></AppErrorBoundary> }
