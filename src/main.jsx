import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
createRoot(document.getElementById('root')).render(<App />)

// Fade the first-paint splash as soon as React has committed; never hold up app startup.
const firstPaint = document.getElementById('nm-first-paint')
if (firstPaint) {
  let frames = 0
  const finishSplash = () => {
    if (!firstPaint.isConnected) return
    if (!document.getElementById('root')?.firstElementChild && frames++ < 120) {
      requestAnimationFrame(finishSplash)
      return
    }
    firstPaint.classList.remove('nm-first-pending')
    firstPaint.classList.add('nm-first-exit')
    window.setTimeout(() => firstPaint.remove(), 240)
  }
  requestAnimationFrame(finishSplash)
}
