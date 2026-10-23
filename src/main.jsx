import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './styles.css'
import './chatThemeRefresh.css'
createRoot(document.getElementById('root')).render(<><App /><SpeedInsights /></>)
