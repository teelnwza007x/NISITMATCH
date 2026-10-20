import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const PLANS = {
  weekly: { price: 'price_1USZirRqxNC12BLAmggjV2kg', amount: 3900 },
  monthly: { price: 'price_1USZiGRqxNC12BLAKJolJ90W', amount: 11900 },
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const required = ['STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_URL']
    const missing = required.filter(name => !process.env[name])
    if (missing.length) {
      console.error('[checkout] Missing environment variable names:', missing.join(', '))
      return res.status(503).json({ error: 'Payment configuration is incomplete' })
    }
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.replace(/\/$/, '') !== process.env.SUPABASE_URL.replace(/\/$/, '')) {
      console.error('[checkout] SUPABASE_URL does not match VITE_SUPABASE_URL in Vercel Production')
      return res.status(503).json({ error: 'Supabase project configuration mismatch' })
    }
    const plan = req.body?.plan
    if (!Object.hasOwn(PLANS, plan)) return res.status(400).json({ error: 'Invalid plan' })
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Please sign in' })
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user) {
      console.error('[checkout] Supabase rejected session:', { code: error?.code, status: error?.status, message: error?.message })
      return res.status(401).json({ error: 'Invalid session. Please sign out and sign in again.' })
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const price = await stripe.prices.retrieve(PLANS[plan].price)
    if (!price.active || price.type !== 'one_time' || price.currency !== 'thb' || price.unit_amount !== PLANS[plan].amount) return res.status(503).json({ error: 'Stripe price does not match expected one-time THB price' })
    const base = process.env.PUBLIC_SITE_URL || 'https://nisitmatch.vercel.app'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: ['promptpay'],
      line_items: [{ price: PLANS[plan].price, quantity: 1 }],
      client_reference_id: user.id, metadata: { user_id: user.id, plan },
      payment_intent_data: { metadata: { user_id: user.id, plan } },
      success_url: `${base}/?premium_payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?premium_payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    })
    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('[checkout] Failure:', { name: e?.name, type: e?.type, code: e?.code, message: e?.message })
    return res.status(500).json({ error: 'ไม่สามารถเริ่มชำระเงินได้ กรุณาตรวจสอบการตั้งค่า Stripe และ PromptPay' })
  }
}
