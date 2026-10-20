import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }
const EXPECTED = {
  price_1USbJURqFWgXWBBi39VMnQwx: { plan: 'weekly', amount: 3900 },
  price_1USbJXRqFWgXWBBiDlVJBTX7: { plan: 'monthly', amount: 11900 },
}
async function rawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) return res.status(503).end()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let event
  try { event = stripe.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET) }
  catch (e) { console.error('Webhook signature failed', e.message); return res.status(400).end() }
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') return res.status(200).json({ received: true })
  const session = event.data.object
  if (session.payment_status !== 'paid' || session.mode !== 'payment') return res.status(200).json({ received: true })
  try {
    const details = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] })
    const lines = details.line_items?.data || []
    if (lines.length !== 1 || lines[0].quantity !== 1) throw new Error('Unexpected checkout line items')
    const expected = EXPECTED[lines[0].price?.id]
    if (!expected || details.amount_total !== expected.amount || details.currency !== 'thb' || details.metadata?.plan !== expected.plan || details.client_reference_id !== details.metadata?.user_id) throw new Error('Checkout verification mismatch')
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { error } = await admin.rpc('apply_stripe_premium_payment', {
      p_session_id: details.id, p_user_id: details.client_reference_id,
      p_plan: expected.plan, p_amount: expected.amount,
    })
    if (error) throw error
    return res.status(200).json({ received: true })
  } catch (e) {
    console.error('Premium fulfillment failed', e.message)
    return res.status(500).json({ error: 'Fulfillment pending retry' })
  }
}
