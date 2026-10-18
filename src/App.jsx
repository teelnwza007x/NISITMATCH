import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react'
import { Heart, Search, MessageCircle, UserRound, Settings, LogOut, X, ShieldCheck, GraduationCap, Sparkles, SlidersHorizontal, Send, ImagePlus, Mic, Square, Play, Pause, Trash2, Camera, Flag, Ban, Menu, ArrowRight, Check, Bell, Users, LockKeyhole, Music2, ExternalLink, MapPin, Globe2, Compass, Cake, LocateFixed } from 'lucide-react'
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
const Brand = ({ onClick }) => <button className="brand" onClick={onClick}><span className="brand-icon"><Heart fill="currentColor" /></span><span>nisit <b>match</b></span></button>

function Landing({ onLogin, onRegister }) {
  return (
    <div className="landing">
      <nav className="landing-nav"><Brand /><div className="landing-links"><a href="#how">วิธีใช้งาน</a><a href="#safety">ความปลอดภัย</a><button onClick={onLogin}>เข้าสู่ระบบ</button><button className="btn btn-pink" onClick={onRegister}>เริ่มต้นใช้งาน <ArrowRight size={16} /></button></div></nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> A LITTLE CLOSER TO SOMETHING REAL</div>
          <h1>เจอคนที่ใช่<br /><span>ในแบบที่เป็นคุณ</span><Heart className="hero-heart" fill="currentColor" /></h1>
          <p>พื้นที่เล็ก ๆ สำหรับนิสิตนักศึกษาที่อยากรู้จักใครสักคน<br />เริ่มจากบทสนทนาดี ๆ แล้วปล่อยให้ความสัมพันธ์ค่อย ๆ เติบโต</p>
          <div className="hero-actions"><button className="btn btn-pink btn-lg" onClick={onRegister}>หา Match ของฉัน <ArrowRight size={18} /></button><button className="btn btn-ghost btn-lg" onClick={onLogin}>เข้าสู่ระบบ</button></div>
          <div className="hero-trust"><span><ShieldCheck size={17} /> ใส่ใจความเป็นส่วนตัว</span><span><Heart size={17} /> ความสัมพันธ์ที่จริงใจ</span><span><Users size={17} /> Community ของนิสิต</span></div>
        </div>
        <div className="hero-visual"><div className="glow glow-a" />
          <div className="hero-photo-main"><img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1000&auto=format&fit=crop&q=85" alt="" /><div className="photo-overlay" /><div className="photo-caption"><span className="caption-heart"><Heart fill="currentColor" /></span><div><b>Good people.</b><p>Better tomorrow.</p></div></div></div>
          <div className="floating-card floating-match"><span className="safe-icon" style={{ color: '#ff75b8', background: '#ff75b81a' }}><Heart size={19} fill="currentColor" /></span><div><b>It's a Match!</b><small>จุดเริ่มต้นของเรื่องราวดี ๆ</small></div></div>
          <div className="floating-card floating-safe"><span className="safe-icon"><ShieldCheck size={19} /></span><div><b>พื้นที่ที่คุณสบายใจ</b><small>คุณควบคุมประสบการณ์ได้</small></div></div>
          <span className="sparkle s1">✦</span><span className="sparkle s2">✧</span></div>
      </section>
      <section className="landing-stats"><div><b>01</b><span>เริ่มจากเป็นตัวเอง</span></div><div><b>02</b><span>ค้นหาคนที่มีอะไรคล้ายกัน</span></div><div><b>03</b><span>ค่อย ๆ รู้จักกันในจังหวะของคุณ</span></div></section>
      <section className="how-section" id="how"><div className="section-kicker">HOW IT WORKS</div><h2>ความสัมพันธ์ดี ๆ <span>เริ่มง่ายกว่าที่คิด</span></h2><p className="section-sub">ไม่ต้องรีบ ไม่ต้องฝืน แค่เริ่มต้นจากความเป็นตัวเอง</p>
        <div className="steps">{[[UserRound, 'สร้างโปรไฟล์', 'เล่าเรื่องของคุณ ความสนใจ และสิ่งที่ทำให้คุณเป็นคุณ'], [Heart, 'ค้นหาคนที่ใช่', 'สำรวจผู้คนที่มีความสนใจและมุมมองที่เข้ากันได้'], [MessageCircle, 'เริ่มบทสนทนา', 'เมื่อถูกใจกันทั้งสองฝ่าย ก็เริ่มคุยกันได้เลย']].map(([I, t, d], i) => <div className="step" key={t}><div className="step-icon"><I /></div><span>STEP 0{i + 1}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
      <section className="safety-section" id="safety"><div><div className="section-kicker">YOUR SAFETY MATTERS</div><h2>ความสบายใจของคุณ<br /><span>สำคัญที่สุด</span></h2><p>เครื่องมือให้คุณควบคุมประสบการณ์ของตัวเองได้ ตั้งแต่การเลือกเปิดเผยข้อมูลไปจนถึงการบล็อกและรายงานผู้ใช้</p>
        <div className="safety-points"><span><Check /> บล็อกหรือรายงานบัญชีได้</span><span><Check /> ไม่เปิดเผยอีเมลและวันเกิดในหน้าค้นหา</span><span><Check /> ส่งข้อความได้เมื่อ Match กันเท่านั้น</span></div></div>
        <div className="safety-art"><div className="shield-large"><ShieldCheck size={66} /></div><div className="safety-note"><LockKeyhole size={18} /><span><b>Your space.</b><small>Your boundaries.</small></span></div></div></section>
      <footer className="footer"><Brand /><span>© 2026 nisit match · สร้างความสัมพันธ์อย่างใส่ใจ</span></footer>
    </div>
  )
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

function SwipeDeck({ people, onLike, onSkip, onOpen, onReport }) {
  const [photo, setPhoto] = useState(0), [drag, setDrag] = useState({ x: 0, y: 0 }), [busy, setBusy] = useState(false)
  const start = useRef(null)
  const person = people[0]
  useEffect(() => { setPhoto(0); setDrag({ x: 0, y: 0 }); setBusy(false) }, [person?.id])
  const photos = person ? [person.avatar_path, ...(person.photo_paths || []).filter(x => x !== person.avatar_path)].filter(Boolean).slice(0, 6) : []
  const act = async (like) => {
    if (!person || busy) return
    setBusy(true)
    setDrag({ x: like ? 550 : -550, y: -30 })
    await new Promise(resolve => setTimeout(resolve, 210))
    await (like ? onLike(person) : onSkip(person))
    setBusy(false)
  }
  const down = (e) => { if (busy) return; start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId) }
  const move = (e) => { if (start.current && !busy) setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y }) }
  const up = () => { if (!start.current) return; start.current = null; if (Math.abs(drag.x) > 95) act(drag.x > 0); else setDrag({ x: 0, y: 0 }) }
  if (!person) return <div className="swipe-empty"><Heart size={40}/><h2>ดูครบทุกโปรไฟล์แล้ว</h2><p>ลองปรับตัวกรองเพื่อพบคนใหม่ ๆ</p></div>
  return <div className="swipe-stage"><div className="swipe-stack" aria-label="ปัดโปรไฟล์">
    {people[1] && <div className="swipe-card swipe-behind"><Av u={people[1]} cls="swipe-behind-image" /></div>}
    <article className="swipe-card swipe-front" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`, transition: start.current ? 'none' : 'transform .22s ease', touchAction: 'pan-y' }}>
      <img draggable="false" src={pub(photos[photo]) || ph(person.display_name)} alt={person.display_name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ph(person.display_name) }} />
      <div className="swipe-photo-bars">{(photos.length ? photos : [null]).map((_, i) => <span key={i} className={i === photo ? 'active' : ''}/>)}</div>
      <div className="swipe-tap left" onPointerDown={e => e.stopPropagation()} onClick={() => setPhoto(v => Math.max(0, v - 1))}/><div className="swipe-tap right" onPointerDown={e => e.stopPropagation()} onClick={() => setPhoto(v => Math.min(photos.length - 1, v + 1))}/>
      {drag.x > 25 && <div className="swipe-stamp yes">LIKE</div>}{drag.x < -25 && <div className="swipe-stamp no">NOPE</div>}
      <div className="swipe-info"><h2>{person.display_name}, {person.age}</h2><p><GraduationCap size={17}/>{uniName(person.university_id)}</p><p>{person.bio || 'มาทำความรู้จักกัน'}</p><div className="tags">{(person.interests || []).slice(0, 3).map(x => <span className="tag" key={x}>{x}</span>)}</div>{itunesTrack(person) && <div className="swipe-song" onPointerDown={e => e.stopPropagation()} onPointerMove={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}><ITunesSongCard track={itunesTrack(person)} compact /></div>}</div>
    </article></div><div className="swipe-controls"><button disabled={busy} className="swipe-control reject" onClick={() => act(false)} aria-label="ข้าม" title="ข้าม"><X size={25}/></button><button className="swipe-control info" onClick={() => onOpen(person)} aria-label="ดูโปรไฟล์" title="ดูโปรไฟล์"><UserRound size={20}/></button><button disabled={busy} className="swipe-control accept" onClick={() => act(true)} aria-label="ถูกใจ" title="ถูกใจ"><Heart size={27} fill="currentColor"/></button><button className="swipe-control report" onClick={() => onReport(person)} aria-label="รายงาน" title="รายงาน"><Flag size={17}/></button></div><p className="swipe-hint">← ปัดซ้ายเพื่อข้าม · ปัดขวาเพื่อถูกใจ →</p></div>
}

function PersonCard({ p, onLike, onSkip, onOpen, onReport }) {
  return (
    <article className="person-card"><div className="person-image"><Av u={p} cls="person-photo" /><div className="image-gradient" />
      <span className="verified"><ShieldCheck size={13} /> สมาชิกจริง</span>
      <button className="card-more" onClick={() => onReport(p)} title="รายงาน"><Flag size={15} /></button>
      <div className="person-title"><h3>{p.display_name}, {p.age}</h3><p><GraduationCap size={13} />{uniName(p.university_id)}</p></div></div>
      <div className="person-body"><div className="tags">{(p.interests || []).slice(0, 3).map((i) => <span className="tag" key={i}>{i}</span>)}</div>
        <p className="person-bio">{p.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
        <div className="person-actions"><button className="round-action nope" onClick={() => onSkip(p)} title="ข้าม"><X size={20} /></button><button className="btn btn-pink like-btn" onClick={() => onLike(p)}><Heart size={17} fill="currentColor" /> ถูกใจ</button><button className="round-action more" onClick={() => onOpen(p)} title="ดูโปรไฟล์"><UserRound size={18} /></button></div></div></article>
  )
}

function Heading({ kicker, title, sub, children }) {
  return <div className="welcome-row"><div><div className="section-kicker">{kicker}</div><h1>{title} <span>♥</span></h1><p>{sub}</p></div>{children}</div>
}


function VoiceBubble({ src, mine }) {
  const audio = useRef(null)
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

function Messages({ me, matches, notify, reload, onOpenProfile }) {
  const [selectedId, setSelectedId] = useState(null)
  const sel = matches.find(m => m.id === selectedId) || null
  const roomId = sel?.id
  const [msgs, setMsgs] = useState([])
  const pendingSends = useRef(new Map())
  const [text, setText] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [showLatestButton, setShowLatestButton] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [micStream, setMicStream] = useState(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const discardRecord = useRef(false)
  const [mediaUrls, setMediaUrls] = useState({})
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
  const scrollToLatest = useCallback((smooth = true) => {
    stickToBottom.current = true
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
    if (initial || forceNextScroll.current || last.sender_id === me || stickToBottom.current) {
      if (initial) scrollToLatest(false)
      else requestAnimationFrame(() => scrollToLatest(true))
    }
    forceNextScroll.current = false
  }, [msgs, me, scrollToLatest])
  useEffect(() => {
    lastMessageId.current = null
    stickToBottom.current = true
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

  useEffect(() => { if (!recording) return; const id = setInterval(() => setRecordSeconds(s => s + 1),1000); return () => clearInterval(id) }, [recording])
  const partnerName = p => p?.display_name?.trim() || 'คู่ Match'

  const fetchMessages = useCallback(async (older = false) => {
    if (!roomId) return
    if (older) { initialChatScroll.current = true; setLoadingOlder(true) }
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
      await supabase.from('messages').update({ read_at: new Date().toISOString() })
        .eq('match_id', roomId).neq('sender_id', me).is('read_at', null)
    }
    load()
    const channel = supabase.channel('chat-' + roomId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `match_id=eq.${roomId}` }, (payload) => {
        if (!active) return
        if (payload.eventType === 'INSERT' && payload.new?.id) {
          const incoming = payload.new
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
      }).subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
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

  const send = async e => {
    e.preventDefault()
    const body = text.trim()
    const targetRoom = roomId
    if (!body || !targetRoom) return
    const tempId = 'pending-' + crypto.randomUUID()
    const optimistic = {
      id: tempId, match_id: targetRoom, sender_id: me, body,
      created_at: new Date().toISOString(), pending: true
    }
    pendingSends.current.set(tempId, { roomId: targetRoom, body })
    setText('')
    forceNextScroll.current = true
    setMsgs(prev => [...prev, optimistic])
    try {
      const { data, error } = await supabase.from('messages')
        .insert({ match_id: targetRoom, sender_id: me, body }).select('*').single()
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
  const sendMedia = async (file, type) => {
    if (!roomId || !file) return
    if (file.size > 10 * 1024 * 1024) return notify('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
    if (type === 'image' && !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return notify('รองรับ JPG, PNG, WebP และ GIF')
    if (type === 'audio' && !file.type.startsWith('audio/')) return notify('ไฟล์เสียงไม่รองรับ')
    setUploading(true)
    const extension = (file.name?.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg')).replace(/[^a-z0-9]/gi, '').toLowerCase()
    const path = `${roomId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) { setUploading(false); return notify('อัปโหลดไม่สำเร็จ: ' + uploadError.message) }
    const { error } = await supabase.from('messages').insert({ match_id: roomId, sender_id: me, body: type === 'image' ? '📷 รูปภาพ' : '🎤 ข้อความเสียง', attachment_type: type, attachment_path: path })
    setUploading(false)
    if (error) notify('ส่งไฟล์ไม่สำเร็จ: ' + error.message)
    else { forceNextScroll.current = true; scrollToLatest(true) }
  }
  const toggleRecord = async () => {
    if (recording) { recorder.current?.stop(); setRecording(false); setMicStream(null); return }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return notify('เบราว์เซอร์นี้ไม่รองรับการอัดเสียง')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorder.current = r; recordParts.current = []
      r.ondataavailable = e => { if (e.data.size) recordParts.current.push(e.data) }
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop()); setMicStream(null)
        if (discardRecord.current) { discardRecord.current = false; return }
        const blob = new Blob(recordParts.current, { type: r.mimeType || 'audio/webm' })
        const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
        sendMedia(new File([blob], `voice.${ext}`, { type: blob.type }), 'audio')
      }
      discardRecord.current = false; setRecordSeconds(0); r.start(); setMicStream(stream); setRecording(true)
    } catch { notify('ไม่สามารถใช้ไมโครโฟนได้ กรุณาอนุญาตการเข้าถึงไมโครโฟน') }
  }
  const cancelRecord = () => { discardRecord.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); setRecording(false); setMicStream(null); setRecordSeconds(0) }
  useEffect(() => () => { if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.stop(); recorder.current.stream?.getTracks().forEach(t => t.stop()) } }, [])
  const block = async () => { if (!sel || !confirm(`ต้องการบล็อก ${partnerName(sel.p)} ใช่ไหม?`)) return; const { error } = await supabase.from('blocks').insert({ blocker: me, blocked: sel.p.id }); if (error) return notify(error.message); setSelectedId(null); reload() }
  const report = async () => { if (!sel) return; const reason = prompt('เหตุผลในการรายงาน'); if (!reason) return; const { error } = await supabase.from('reports').insert({ reporter: me, reported: sel.p.id, reason: reason.slice(0,500) }); notify(error ? error.message : 'ส่งรายงานแล้ว') }
  return (<>
    {!sel && <Heading kicker="YOUR CONNECTIONS" title="ข้อความ" sub="เลือกคนที่ต้องการพูดคุย" />}
    <div className={"chat-layout " + (sel ? "chat-room-open chat-fullscreen" : "chat-inbox-open")}>
      <div className="chat-list"><div className="chat-list-head"><b>ข้อความของคุณ<small>เลือกคนที่ต้องการคุย</small></b><span>{matches.length}</span></div>
        {matches.map(m => <button key={m.id} className={'chat-person ' + (roomId === m.id ? 'selected' : '')} onClick={() => setSelectedId(m.id)}><Av u={m.p} cls="avatar md" /><span className="chat-person-info"><b>{partnerName(m.p)}</b><small>💗 Match กันแล้ว</small></span></button>)}
        {!matches.length && <div className="chat-empty">ยังไม่มี Match</div>}
      </div>
      <div className="chat-window">{sel ? <>
        <div className="chat-header"><button type="button" className="chat-back icon-btn" onClick={() => setSelectedId(null)} aria-label="กลับไปหน้ารายชื่อ"><ArrowRight size={20} style={{transform:"rotate(180deg)"}} /></button><button type="button" className="chat-profile-trigger" onClick={() => onOpenProfile?.(sel.p)} title="ดูโปรไฟล์ รูปทั้งหมด และเพลง" aria-label={`ดูโปรไฟล์ ${partnerName(sel.p)}`}><Av u={sel.p} cls="avatar md" /><span><b>{partnerName(sel.p)}</b><small>แตะเพื่อดูโปรไฟล์ · รูปภาพ · เพลง</small></span></button><button className="icon-btn" onClick={report} title="รายงาน"><Flag size={17}/></button><button className="icon-btn" onClick={block} title="บล็อก"><Ban size={17}/></button></div>
        <div className="chat-messages" ref={scrollBox} onScroll={e => { const el = e.currentTarget; const distance = el.scrollHeight - el.scrollTop - el.clientHeight; stickToBottom.current = distance < 65; setShowLatestButton(distance > 75) }}>
          {hasMore && <button type="button" className="chat-older" disabled={loadingOlder} onClick={() => fetchMessages(true)}>{loadingOlder ? 'กำลังโหลด...' : '↑ ดูข้อความก่อนหน้า'}</button>}
          {msgs.map(m => <div key={m.id} className={'message-row ' + (m.sender_id === me ? 'mine' : '') + (m.id === msgs[msgs.length - 1]?.id ? ' latest-message' : '')}>
            {m.sender_id !== me && <Av u={sel.p} cls="avatar sm" />}
            <div className="message-bubble">
              {m.attachment_type === 'image' && m.attachment_path ? (mediaUrls[m.attachment_path] ? <a href={mediaUrls[m.attachment_path]} target="_blank" rel="noopener noreferrer"><img className="chat-attachment-image" src={mediaUrls[m.attachment_path]} alt="รูปภาพในแชต" /></a> : <span>กำลังโหลดรูป...</span>) : m.attachment_type === 'audio' && m.attachment_path ? (mediaUrls[m.attachment_path] ? <VoiceBubble src={mediaUrls[m.attachment_path]} mine={m.sender_id === me} /> : <span>กำลังโหลดเสียง...</span>) : m.body}
              <small>{new Date(m.created_at).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })}{m.pending ? ' · กำลังส่ง…' : m.failed ? ' · ส่งไม่สำเร็จ' : m.sender_id === me && m.read_at ? ' · อ่านแล้ว' : ''}</small>{m.failed && <button type="button" onClick={() => { setText(m.body); setMsgs(prev => prev.filter(x => x.id !== m.id)) }}>ลองส่งอีกครั้ง</button>}
            </div>
          </div>)}
          {!msgs.length && <div className="chat-empty">ทักทาย {partnerName(sel.p)} เป็นคนแรกสิ</div>}
          <div ref={end}/>
        </div>
        {showLatestButton && <button type="button" className="chat-jump-latest" onClick={() => scrollToLatest(true)} aria-label="กลับไปข้อความล่าสุด"><ArrowRight size={16} style={{transform:"rotate(90deg)"}} /> กลับไปข้อความล่าสุด</button>}
        <form className="chat-compose" onSubmit={send}>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) sendMedia(f,'image'); e.target.value = '' }}/>
          <button type="button" className="chat-media-btn" title="ส่งรูปภาพ" disabled={uploading || recording} onClick={() => fileInput.current?.click()}><ImagePlus size={20}/></button>
          {recording ? <div className="voice-recorder" role="status"><span className="record-live"/><span className="record-clock">{Math.floor(recordSeconds/60)}:{String(recordSeconds%60).padStart(2,'0')}</span><LiveMicWave stream={micStream}/><button type="button" className="record-cancel" onClick={cancelRecord} aria-label="ยกเลิกการอัดเสียง"><Trash2 size={19}/></button><button type="button" className="record-send" onClick={toggleRecord} aria-label="หยุดและส่งข้อความเสียง"><Send size={18}/></button></div> : <><button type="button" className="chat-media-btn mic-launch" title="อัดข้อความเสียง" disabled={uploading} onClick={toggleRecord}><Mic size={20}/></button><input value={text} onChange={e => setText(e.target.value)} placeholder="ส่งข้อความถึงคนพิเศษ..." maxLength={2000}/><button className="send-btn" disabled={!text.trim() || uploading}><Send size={18}/></button></>}
        </form>
        {uploading && <div className="chat-upload-status">กำลังอัปโหลดไฟล์...</div>}
      </> : <div className="chat-placeholder"><MessageCircle/><h3>บทสนทนาของคุณ</h3><p>เลือก Match เพื่อเริ่มพูดคุย</p></div>}</div>
    </div>
  </>)
}

function Notifs({ me, refresh, go }) {
  const [rows, setRows] = useState(null)
  const load = useCallback(async () => { const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50); setRows(data || []) }, [])
  useEffect(() => { load() }, [load])
  const readAll = async () => { await supabase.from('notifications').update({ read: true }).eq('user_id', me).eq('read', false); load(); refresh() }
  return (<>
    <Heading kicker="STAY IN THE LOOP" title="การแจ้งเตือน" sub="แมตช์ใหม่และข้อความใหม่จะแสดงที่นี่"><button className="btn btn-ghost" onClick={readAll}><Check size={16} /> อ่านทั้งหมด</button></Heading>
    {rows === null ? <div className="page-center"><span className="spin" /></div> : !rows.length ? <div className="empty-state"><div className="empty-icon"><Bell /></div><h3>ยังไม่มีการแจ้งเตือน</h3><p>เมื่อมีแมตช์หรือข้อความใหม่ จะขึ้นที่นี่</p></div> :
      <div className="notif-list">{rows.map((n) => <div key={n.id} className={'notif-row ' + (n.read ? '' : 'unread')} onClick={async () => { await supabase.from('notifications').update({ read: true }).eq('id', n.id); refresh(); go('messages') }}>
        <span className="settings-icon">{n.type === 'match' ? <Heart /> : <MessageCircle />}</span><div><b>{n.type === 'match' ? 'คุณมีแมตช์ใหม่!' : 'มีข้อความใหม่'}</b><small>{new Date(n.created_at).toLocaleString('th-TH')}</small></div></div>)}</div>}
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
        const beat = 0.28 + 0.38 * Math.abs(Math.sin(time / (165 + i * 17) + i * 1.9))
        bar.style.height = `${Math.round(3 + 13 * Math.max(energy, beat * (energy < 0.04 ? 1 : 0.23)))}px`
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
      <button className="itunes-premium-play" type="button" onClick={toggle} disabled={!preview} aria-label={playing ? 'หยุดเพลงชั่วคราว' : 'เล่นตัวอย่างเพลง'} title={preview ? (playing ? 'Pause' : 'Play preview') : 'เพลงนี้ไม่มีตัวอย่าง'}>{playing ? <Pause size={15} strokeWidth={2.6} fill="currentColor" /> : <Play size={15} strokeWidth={2.6} fill="currentColor" />}</button>
    </div>
    {preview && <div className="itunes-premium-timeline">
      <span>{formatTime(position)}</span>
      <input type="range" min="0" max="100" step="0.1" value={progress} onChange={seek} style={{'--progress': `${progress}%`}} aria-label="เลื่อนตำแหน่งเพลง" />
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
const initialProfileForm = p => ({ display_name: p?.display_name || '', birth_date: p?.birth_date || '', gender: p?.gender || 'other', uni: p?.university_id || '', faculty: p?.faculty || FACULTIES[0], major: p?.major || '', bio: p?.bio || '', interests: p?.interests || [] })

function ProfilePage({ user, profile, onSaved, notify, onboarding }) {
  const [f, setF] = useState(() => initialProfileForm(profile))
  const [busy, setBusy] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const draftRevision = useRef(0)
  const skipDraftSave = useRef(false)
  const [song, setSong] = useState(() => itunesTrack(profile))
  const [photos, setPhotos] = useState(profile?.photo_paths?.length ? profile.photo_paths : (profile?.avatar_path ? [profile.avatar_path] : []))
  const [newPhotos, setNewPhotos] = useState([])
  const [mainPhoto, setMainPhoto] = useState(profile?.avatar_path || '')
  const [uniQuery, setUniQuery] = useState(''), [uniType, setUniType] = useState('ทั้งหมด')
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
  const addPhotos = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 3e6)
    if (valid.length !== files.length) notify('รองรับเฉพาะรูปภาพไม่เกิน 3MB ต่อรูป')
    const slots = Math.max(0, 6 - photos.length - newPhotos.length)
    const additions = valid.slice(0, slots).map(f => ({ key: `new-${crypto.randomUUID()}`, file: f, url: URL.createObjectURL(f) }))
    setNewPhotos(old => [...old, ...additions]); if (!mainPhoto && additions[0]) setMainPhoto(additions[0].key)
  }
  const removePhoto = (key) => {
    const remaining = [...photos.filter(x => x !== key), ...newPhotos.filter(x => x.key !== key).map(x => x.key)]
    setPhotos(old => old.filter(x => x !== key)); setNewPhotos(old => old.filter(x => x.key !== key))
    if (mainPhoto === key) setMainPhoto(remaining[0] || '')
  }
  const save = async (e) => {
    e.preventDefault()
    const u = UNIVERSITIES.find((x) => x.id === f.uni)
    if (!u) return notify('กรุณาเลือกมหาวิทยาลัยจากรายการ')
    if (!f.birth_date || ageOf(f.birth_date) < 18) return notify('ต้องมีอายุอย่างน้อย 18 ปี')
    if (!f.faculty?.trim()) return notify('กรุณาเลือกคณะ')
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
    const payload = { display_name: f.display_name.trim(), birth_date: f.birth_date, gender: f.gender, university_id: u.id, faculty: f.faculty.trim(), major: f.major, bio: f.bio, interests: f.interests, avatar_path, photo_paths, itunes_track_id: song?.id || null, itunes_track_name: song?.name || null, itunes_track_artist: song?.artist || null, itunes_track_image: song?.image || null, itunes_track_preview: song?.preview || null, itunes_track_url: song?.url || null }
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
  return (<>
    <Heading kicker={onboarding ? 'WELCOME' : 'THIS IS YOU'} title={onboarding ? 'สร้างโปรไฟล์ของคุณ' : 'โปรไฟล์ของฉัน'} sub="เล่าเรื่องของคุณในแบบที่เป็นตัวเอง" />
    <div className="profile-edit-layout">
      <div className="profile-preview"><div className="preview-cover"><div className="preview-glow" /></div><div className="preview-content">
        <img className="preview-avatar" src={preview} alt="" />
        <div className="photo-editor"><b>รูปโปรไฟล์ ({photos.length + newPhotos.length}/6)</b><p>แตะดาวเพื่อกำหนดรูปหลัก</p><div className="photo-grid">{[...photos.map(key => ({key, url: pub(key)})), ...newPhotos].map(item => <div className="photo-tile" key={item.key}><img src={item.url} alt="รูปโปรไฟล์"/><button type="button" className={'photo-main ' + (mainPhoto === item.key ? 'selected' : '')} onClick={() => setMainPhoto(item.key)} title="ตั้งเป็นรูปหลัก">★</button><button type="button" className="photo-remove" onClick={() => removePhoto(item.key)} title="ลบรูป">×</button></div>)}{photos.length + newPhotos.length < 6 && <label className="photo-add"><Camera size={21}/><span>เพิ่มรูป</span><input type="file" accept="image/*" multiple onChange={e => {addPhotos(e.target.files); e.target.value = ''}} /></label>}</div></div>
        <h2>{f.display_name || 'ชื่อของคุณ'}{f.birth_date ? `, ${ageOf(f.birth_date)}` : ''}</h2>
        <p><GraduationCap size={15} />{uniName(f.uni) || 'เลือกมหาวิทยาลัย'}</p>
        <p className="preview-bio">{f.bio || 'เพิ่มเรื่องราวของคุณเพื่อให้คนอื่นรู้จักคุณมากขึ้น'}</p>
        <div className="tags centered">{f.interests.map((x) => <span className="tag" key={x}>{x}</span>)}</div>
        {song && <ITunesSongCard track={song} compact/>}
        <div className="privacy-note"><ShieldCheck size={16} /> อายุคำนวณจากวันเกิดอัตโนมัติ และไม่แสดงวันเกิดในหน้าค้นหา</div></div></div>
      <form className="form-panel" onSubmit={save}>
        <div className="panel-heading"><div><h2>ข้อมูลส่วนตัว</h2><p>อัปเดตข้อมูลให้เป็นปัจจุบันอยู่เสมอ</p></div><span className="edit-badge">EDIT PROFILE</span></div>
        <label>ชื่อที่อยากให้เรียก<input required maxLength={40} value={f.display_name} onChange={set('display_name')} /></label>
        <div className="form-row"><label>วันเกิด (ต้องอายุ 18+)<input type="date" required value={f.birth_date} onChange={set('birth_date')} /></label><label>เพศ<select value={f.gender} onChange={set('gender')}>{Object.entries(GENDERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div>
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
        <label>แนะนำตัว<textarea rows={4} maxLength={300} value={f.bio} onChange={set('bio')} placeholder="เล่าเกี่ยวกับตัวคุณ ความสนใจ หรือสิ่งที่ชอบ..." /><small className="char-count">{f.bio.length}/300</small></label>
        <div className="label-title">ความสนใจ <span className="optional">เลือกได้หลายข้อ</span></div>
        <div className="interest-picker">{INTERESTS.map((i) => <button type="button" key={i} className={'interest-option ' + (f.interests.includes(i) ? 'chosen' : '')} onClick={() => toggle(i)}>{f.interests.includes(i) && <Check size={13} />} {i}</button>)}</div>
        <ITunesSongPicker value={song} onChange={setSong} />
        <button className="btn btn-pink btn-lg save-btn" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'} <Check size={17} /></button>
      </form></div></>)
}

function SettingsPage({ user, notify }) {
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
    <div className="settings-grid">
      <div className="settings-card"><div className="settings-icon"><ShieldCheck /></div><div><h3>ความเป็นส่วนตัวและความปลอดภัย</h3><p>หน้าค้นหาไม่แสดงอีเมลและวันเกิดของคุณ และคุณสามารถบล็อกหรือรายงานผู้ใช้ได้</p></div><span className="settings-status">เปิดใช้งาน</span></div>
      <div className="settings-card"><div className="settings-icon"><LockKeyhole /></div><div><h3>รหัสผ่าน</h3><p>ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ {user.email}</p></div><button className="btn btn-ghost btn-small" onClick={reset}>ส่งลิงก์</button></div>
      <div className="settings-card"><div className="settings-icon"><Bell /></div><div><h3>Push Notifications</h3><p>รับแจ้งเตือน Match และข้อความใหม่บนโทรศัพท์ หลังตั้งค่าระบบส่ง Push</p></div><button className="btn btn-ghost btn-small" disabled={pushBusy} onClick={pushEnabled ? disablePush : enablePush}>{pushBusy ? "กำลังตั้งค่า..." : pushEnabled ? "ปิดแจ้งเตือน" : "เปิดแจ้งเตือน"}</button></div>
      <div className="settings-card"><div className="settings-icon"><Users /></div><div><h3>ชุมชน nisit match</h3><p>เคารพขอบเขตของกันและกัน ไม่ส่งข้อความคุกคาม และรายงานพฤติกรรมที่ไม่เหมาะสม</p></div></div>
      <div className="settings-danger"><div><h3>ออกจากระบบ</h3><p>ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน</p></div><button className="btn btn-danger" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> ออกจากระบบ</button></div>
    </div></>)
}

function ProfileGallery({ person }) {
  const photos = [...new Set([person?.avatar_path, ...(Array.isArray(person?.photo_paths) ? person.photo_paths : [])].filter(Boolean))]
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [person?.id])
  const current = photos[index] || photos[0]
  return <div className="detail-gallery">
    <img className="detail-cover" src={pub(current) || ph(person?.display_name)} alt={`รูปของ ${person?.display_name || 'สมาชิก'}`} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = ph(person?.display_name) }} />
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
  const closeSmoothly = () => { if (closing) return; setClosing(true); window.setTimeout(onClose, 310) }
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
  const close = () => { if (closing || saving) return; setClosing(true); window.setTimeout(onClose, 360) }
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
  const [session, setSession] = useState(undefined), [profile, setProfile] = useState(undefined), [view, setView] = useState(() => { try { return sessionStorage.getItem('nisit-view') || 'search' } catch { return 'search' } }), [modal, setModal] = useState(''), [toast, setToast] = useState(null), [nav, setNav] = useState(false)
  const [people, setPeople] = useState(null), [matches, setMatches] = useState([]), [unread, setUnread] = useState(0), [detail, setDetail] = useState(null)
  const [newMatch, setNewMatch] = useState(null)
  const [fl, setFl] = useState({ q: '', uni: '', min: 18, max: 40, gender: '' }), [filterOpen, setFilterOpen] = useState(false)
  const [discovery, setDiscovery] = useState(null), [discoveryReady, setDiscoveryReady] = useState(false), [discoveryEditing, setDiscoveryEditing] = useState(false)
  const [visibleDetail, setVisibleDetail] = useState(null)
  const [detailLeaving, setDetailLeaving] = useState(false)
  useEffect(() => {
    if (detail) { setVisibleDetail(detail); setDetailLeaving(false); return }
    if (!visibleDetail) return
    setDetailLeaving(true)
    const timer = window.setTimeout(() => { setVisibleDetail(null); setDetailLeaving(false) }, 330)
    return () => window.clearTimeout(timer)
  }, [detail])
  const notify = useCallback((m) => { setToast(m); setTimeout(() => setToast(null), 3000) }, [])
  const user = session?.user
  const userId = user?.id
  useEffect(() => { try { sessionStorage.setItem('nisit-view', view) } catch {} }, [view])

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => data.subscription.unsubscribe() }, [])
  useEffect(() => { if (userId) setModal('') }, [userId])
  const loadProfile = useCallback(async () => { if (!userId) return; const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle(); if (error) { notify('โหลดโปรไฟล์ไม่สำเร็จ: ' + error.message); return } setProfile(data) }, [userId, notify])
  const loadUnread = useCallback(async () => { if (!userId) return; const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false); setUnread(count || 0) }, [userId])
  
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
  const loadPeople = useCallback(async () => {
    setPeople(null)
    const { data, error } = await supabase.rpc('discover', { p_university: null, p_min_age: +(discovery?.min ?? fl.min), p_max_age: +(discovery?.max ?? fl.max), p_gender: discovery?.gender || null })
    if (error) notify(error.message); setPeople(data || [])
  }, [discovery?.min, discovery?.max, discovery?.gender, fl.min, fl.max, notify])
  useEffect(() => { if (!userId) { setProfile(undefined); return } setProfile(undefined); loadProfile(); loadUnread() }, [userId, loadProfile, loadUnread])
  useEffect(() => { if (profile) { loadMatches(); loadPeople() } }, [profile, loadMatches, loadPeople])
  useEffect(() => { const refresh = () => { if (document.visibilityState === 'visible' && user?.id) loadMatches() }; document.addEventListener('visibilitychange', refresh); return () => document.removeEventListener('visibilitychange', refresh) }, [user?.id, loadMatches])
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('notif-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (p) => { notify(p.new.type === 'match' ? 'คุณมีแมตช์ใหม่!' : 'มีข้อความใหม่'); loadUnread(); loadMatches() }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, notify, loadUnread, loadMatches])

  const swipe = async (p, is_like) => {
    if (!user || !p?.id) return notify('กรุณาเข้าสู่ระบบก่อน')
    const { error } = await supabase.from('likes').insert({ from_id: user.id, to_id: p.id, is_like })
    if (error) return notify(error.code === '23505' ? 'คุณเลือกคนนี้ไปแล้ว' : `บันทึกไม่สำเร็จ: ${error.message}`)
    setPeople((l) => (l || []).filter((x) => x.id !== p.id)); setDetail(null)
    if (is_like) {
      const [a, b] = [user.id, p.id].sort()
      // Trigger on_like() creates the match when the other person has already liked back.
      const { data, error: matchError } = await supabase.from('matches').select('id').eq('user_a', a).eq('user_b', b).maybeSingle()
      if (matchError) notify('บันทึก Like แล้ว แต่ตรวจสอบ Match ไม่สำเร็จ กรุณารีเฟรชหน้า')
      else if (data) { setNewMatch({ id: data.id, p }); await loadMatches() }
      else notify(`ส่งหัวใจให้ ${p.display_name} แล้ว 💙`)
    } else notify('ข้ามโปรไฟล์แล้ว')
  }
  const report = async (p) => { const reason = prompt('เหตุผลในการรายงาน (เช่น โปรไฟล์ปลอม / คุกคาม)'); if (!reason) return; const { error } = await supabase.from('reports').insert({ reporter: user.id, reported: p.id, reason: reason.slice(0, 500) }); notify(error ? error.message : 'ส่งรายงานให้ทีมดูแลแล้ว') }
  const block = async (p) => { if (!confirm(`ต้องการบล็อก ${p.display_name} ใช่ไหม?`)) return; const { error } = await supabase.from('blocks').insert({ blocker: user.id, blocked: p.id }); if (error) return notify(error.message); setPeople((l) => l.filter((x) => x.id !== p.id)); setDetail(null); notify('บล็อกบัญชีแล้ว') }
  const openDetail = async (person) => {
    setDetail(person)
    if (!person?.id) return
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
        {items.map(([id, label, I]) => <button key={id} className={'nav-item ' + (view === id ? 'active' : '')} onClick={() => go(id)}><I size={18} />{label}{id === 'messages' && matches.length > 0 && <span className="nav-count">{matches.length}</span>}{id === 'notifs' && unread > 0 && <span className="nav-count">{unread}</span>}</button>)}
        <div className="sidebar-spacer" />
        <div className="sidebar-user"><Av u={profile} /><div className="user-mini"><b>{profile.display_name}</b><span>{uniName(profile.university_id)}</span></div><button className="icon-btn" onClick={() => supabase.auth.signOut()} title="ออกจากระบบ"><LogOut size={17} /></button></div></aside>
      <nav className="bottom-nav" aria-label="เมนูหลักบนมือถือ">
        {[["home","ปัด",Heart],["profile","โปรไฟล์",UserRound],["messages","ข้อความ",MessageCircle],["notifs","แจ้งเตือน",Bell],["settings","ตั้งค่า",Settings]].map(([id,label,Icon]) => <button type="button" key={id} onClick={() => go(id)} className={view === id ? "bottom-nav-item active" : "bottom-nav-item"} aria-current={view === id ? "page" : undefined}><span className="bottom-icon"><Icon size={21} strokeWidth={view === id ? 2.5 : 1.8}/>{id === "notifs" && unread > 0 && <i className="bottom-dot"/>}</span><span>{label}</span></button>)}
      </nav>
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu icon-btn" onClick={() => setNav(!nav)}><Menu /></button><div className="breadcrumb">พื้นที่สำหรับความสัมพันธ์ดี ๆ <span>/</span> <b>{items.find((i) => i[0] === view)?.[1] || 'หน้าหลัก'}</b></div><div className="top-actions"><span className="online-pill"><i /> Your space, your pace</span><button className="profile-chip" onClick={() => go('profile')}><Av u={profile} cls="avatar sm" /><span>{profile.display_name}</span></button></div></header>
        <div className="page-content">
          {view === 'home' && <>
            <Heading kicker="DISCOVER" title="พบคนที่ใช่ในแบบของคุณ" sub="ทำความรู้จักคนใหม่ ๆ จากมหาวิทยาลัยที่คุณสนใจ"><button className="btn btn-ghost" onClick={() => setDiscoveryEditing(true)}><SlidersHorizontal size={17}/> แก้ไขสเปก</button></Heading>
            <div className="result-meta"><span>โปรไฟล์ที่ตรงกับสเปกของคุณ</span><span>{swipePeople.length} โปรไฟล์</span></div>
            {nearbyFallback && <p className="nearby-fallback-note">ยังไม่พบคนในรัศมีที่ตั้งไว้ จึงแสดงโปรไฟล์อื่นให้ปัดได้ก่อน · ปรับระยะทางได้ในตั้งค่าสเปก</p>}
            {people === null ? <div className="page-center"><span className="spin" /></div> : swipePeople.length ? <SwipeDeck people={swipePeople} onLike={(x) => swipe(x, true)} onSkip={(x) => swipe(x, false)} onOpen={openDetail} onReport={report} /> : empty}
            <div className="section-heading matches-heading"><div><h2>พื้นที่ของความสัมพันธ์</h2><p>เมื่อคุณ Match กับใคร แชตของคุณจะปรากฏตรงนี้</p></div></div>
            <div className="empty-state compact"><div className="empty-icon"><MessageCircle /></div><div><b>{matches.length ? `คุณมี ${matches.length} Match แล้ว` : 'ทุกความสัมพันธ์เริ่มจากการทักทาย'}</b><p>{matches.length ? 'เข้าไปเริ่มบทสนทนากับคนที่ Match กันได้เลย' : 'กดถูกใจโปรไฟล์ที่คุณสนใจ แล้วรอให้ถูกใจกันทั้งสองฝ่าย'}</p></div><button className="btn btn-ghost" onClick={() => go(matches.length ? 'messages' : 'home')}>{matches.length ? 'เปิดข้อความ' : 'ปัดต่อ'} <ArrowRight size={15} /></button></div>
          </>}
          {view === 'messages' && <Messages me={user.id} matches={matches} notify={notify} reload={loadMatches} onOpenProfile={openDetail} />}
          {view === 'notifs' && <Notifs me={user.id} refresh={loadUnread} go={go} />}
          {view === 'profile' && <ProfilePage user={user} profile={profile} onSaved={loadProfile} notify={notify} />}
          {view === 'settings' && <SettingsPage user={user} notify={notify} />}
          <footer className="app-footer"><span>© 2026 nisit match</span><span>สร้างด้วยความใส่ใจ <Heart size={12} fill="currentColor" /></span><button onClick={() => notify('หากพบการละเมิด โปรดรายงานผ่านโปรไฟล์ผู้ใช้')}>ช่วยเหลือและความปลอดภัย</button></footer>
        </div>
      </main>
      {visibleDetail && <div className={"modal-backdrop detail-backdrop" + (detailLeaving ? " is-closing" : "")} onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}><div className="detail-modal"><button type="button" className="modal-close detail-close-btn" onClick={() => setDetail(null)} aria-label="ปิดโปรไฟล์" title="ปิดโปรไฟล์"><X size={21} strokeWidth={2.6} /></button>
        <ProfileGallery person={visibleDetail} />
        <div className="detail-body"><div className="section-kicker">GET TO KNOW THEM</div><h2>{visibleDetail.display_name}, {visibleDetail.age}</h2>
          <p><GraduationCap size={15} />{uniName(visibleDetail.university_id)} · {visibleDetail.faculty}</p><p>{visibleDetail.bio || 'กำลังมองหาคนที่คุยกันได้อย่างสบายใจ'}</p>
          <div className="tags">{(visibleDetail.interests || []).map((i) => <span className="tag" key={i}>{i}</span>)}</div>
          <div className="match-profile-song"><ITunesSongCard track={itunesTrack(visibleDetail)} compact /></div>
          {detailIsMatch ? <button className="btn btn-pink btn-full" onClick={() => { setDetail(null); go("messages") }}><MessageCircle size={17} /> กลับไปคุยกัน</button> : <button className="btn btn-pink btn-full" onClick={() => swipe(visibleDetail, true)}><Heart size={17} fill="currentColor" /> ส่งหัวใจให้คนนี้</button>}
          <button type="button" className="detail-bottom-close" onClick={() => setDetail(null)}>← กลับไปหน้าปัด</button>
          <div className="detail-secondary"><button onClick={() => report(visibleDetail)}><Flag size={15} /> รายงานโปรไฟล์</button><button onClick={() => block(visibleDetail)}><Ban size={15} /> บล็อก</button></div></div></div></div>}
      {newMatch && <div className="match-overlay"><div className="match-dialog"><button className="match-close" onClick={() => setNewMatch(null)} aria-label="ปิด"><X/></button><div className="match-confetti" aria-hidden="true">{Array.from({length: 22}, (_,i) => <span key={i} style={{'--i':i,'--delay':`${(i%8)*.11}s`}}>{i%3===0?'♥':'✦'}</span>)}</div><div className="match-hearts">💗 ✨ 💗</div><div className="match-eyebrow">A NEW CONNECTION</div><h1>It's a Match!</h1><p>คุณและ {newMatch.p.display_name} ถูกใจกันและกัน</p><div className="match-avatars"><Av u={profile}/><Heart fill="currentColor"/><Av u={newMatch.p}/></div><button className="btn btn-pink btn-full" onClick={() => { setNewMatch(null); go('messages') }}>เริ่มพูดคุยเลย <MessageCircle size={18}/></button><button className="match-later" onClick={() => setNewMatch(null)}>ปัดต่อ</button></div></div>}
      {Toast}
    </div>
  )
}
