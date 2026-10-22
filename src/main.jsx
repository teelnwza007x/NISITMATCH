import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(<App />)

// Keep the branded intro visible briefly on a fresh page load, then fade out.
// Navigation within the mounted React app never replays this intro.
const firstPaint = document.getElementById('nm-first-paint')
if (firstPaint) {
  const splashStartedAt = performance.now()
  const minimumVisibleMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200
  let frames = 0
  const finishSplash = () => {
    if (!firstPaint.isConnected) return
    if (!document.getElementById('root')?.firstElementChild && frames++ < 120) {
      requestAnimationFrame(finishSplash)
      return
    }
    const remaining = Math.max(0, minimumVisibleMs - (performance.now() - splashStartedAt))
    window.setTimeout(() => {
      if (!firstPaint.isConnected) return
      firstPaint.classList.remove('nm-first-pending')
      firstPaint.classList.add('nm-first-exit')
      window.setTimeout(() => firstPaint.remove(), 240)
    }, remaining)
  }
  requestAnimationFrame(finishSplash)
}
