import { useEffect } from 'react'
import { supabase } from '../supabase'

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
const platform = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop'

export default function PwaUsageTracker() {
  useEffect(() => {
    let lastSent = 0
    const record = async () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastSent < 60000) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      lastSent = Date.now()
      const mode = isStandalone() ? 'standalone' : 'browser'
      const { data: old } = await supabase.from('nm_pwa_usage').select('ever_standalone').eq('user_id', user.id).maybeSingle()
      await supabase.from('nm_pwa_usage').upsert({
        user_id: user.id, display_mode: mode, platform: platform(),
        last_seen_at: new Date().toISOString(),
        ever_standalone: mode === 'standalone' || old?.ever_standalone === true
      }, { onConflict: 'user_id' })
    }
    const onVisibility = () => { if (document.visibilityState === 'visible') void record() }
    const onAuth = supabase.auth.onAuthStateChange(() => { lastSent = 0; setTimeout(() => void record(), 0) })
    void record()
    document.addEventListener('visibilitychange', onVisibility)
    const timer = window.setInterval(record, 15 * 60 * 1000)
    return () => { document.removeEventListener('visibilitychange', onVisibility); clearInterval(timer); onAuth.data.subscription.unsubscribe() }
  }, [])
  return null
}
