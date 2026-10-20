
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const PLANS = {
  weekly: {
    price: 'price_1USbJURqFWgXWBBi39VMnQwx',
    amount: 3900,
  },
  monthly: {
    price: 'price_1USbJXRqFWgXWBBiDlVJBTX7',
    amount: 11900,
  },
}

const SITE_URL = 'https://nisitmatch.vercel.app'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    // ตรวจสอบ Environment Variables
    const required = [
      'STRIPE_SECRET_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_URL',
    ]

    const missing = required.filter(
      (key) => !process.env[key]
    )

    if (missing.length > 0) {
      console.error('[checkout] Missing env:', missing)

      return res.status(503).json({
        error: 'Payment configuration is incomplete',
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
      .replace(/\/+$/, '')

    const publicSupabaseUrl =
      process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')

    if (
      publicSupabaseUrl &&
      publicSupabaseUrl !== supabaseUrl
    ) {
      console.error('[checkout] Supabase URL mismatch')

      return res.status(503).json({
        error: 'Supabase configuration mismatch',
      })
    }

    // ตรวจสอบแพ็กเกจ
    const plan = req.body?.plan

    if (
      typeof plan !== 'string' ||
      !Object.prototype.hasOwnProperty.call(PLANS, plan)
    ) {
      return res.status(400).json({
        error: 'Invalid premium plan',
      })
    }

    // ตรวจสอบผู้ใช้
    const token = (req.headers.authorization || '')
      .replace(/^Bearer\s+/i, '')
      .trim()

    if (!token) {
      return res.status(401).json({
        error: 'กรุณาเข้าสู่ระบบก่อนสมัคร Premium',
      })
    }

    const supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('[checkout] Auth error:', {
        code: authError?.code,
        message: authError?.message,
      })

      return res.status(401).json({
        error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
      })
    }

    // เริ่ม Stripe
    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY
    )

    const selectedPlan = PLANS[plan]

    // ตรวจสอบ Price ID
    let price

    try {
      price = await stripe.prices.retrieve(
        selectedPlan.price
      )
    } catch (priceError) {
      console.error('[checkout] Price lookup failed:', {
        type: priceError?.type,
        code: priceError?.code,
        message: priceError?.message,
        requestId: priceError?.requestId,
      })

      return res.status(503).json({
        error: 'ไม่พบแพ็กเกจใน Stripe กรุณาตรวจสอบ Price ID',
      })
    }

    if (
      !price.active ||
      price.type !== 'one_time' ||
      price.currency !== 'thb' ||
      price.unit_amount !== selectedPlan.amount
    ) {
      console.error('[checkout] Price mismatch:', {
        active: price.active,
        type: price.type,
        currency: price.currency,
        amount: price.unit_amount,
        expectedAmount: selectedPlan.amount,
      })

      return res.status(503).json({
        error: 'การตั้งค่าราคา Premium ไม่ถูกต้อง',
      })
    }

    // สร้าง Checkout Session
    const baseUrl = (
      process.env.PUBLIC_SITE_URL || SITE_URL
    ).replace(/\/+$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      payment_method_types: ['promptpay'],

      line_items: [
        {
          price: selectedPlan.price,
          quantity: 1,
        },
      ],

      client_reference_id: user.id,

      metadata: {
        user_id: user.id,
        plan,
      },

      payment_intent_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },

      ui_mode: 'embedded',

      return_url:
        `${baseUrl}/?premium_payment=success` +
        '&session_id={CHECKOUT_SESSION_ID}',

      expires_at:
        Math.floor(Date.now() / 1000) + 1800,
    })

    if (!session.client_secret) {
      console.error(
        '[checkout] Missing Checkout client secret'
      )

      return res.status(500).json({
        error: 'Stripe ไม่ส่งข้อมูลสำหรับเปิดหน้าชำระเงิน',
      })
    }

    console.log('[checkout] Session created:', {
      sessionId: session.id,
      plan,
    })

    return res.status(200).json({
      clientSecret: session.client_secret,
    })

  } catch (e) {
    // แสดงรายละเอียด Error ใน Vercel Logs
    console.error(
      '[checkout] STRIPE ERROR:',
      JSON.stringify(
        {
          name: e?.name,
          type: e?.type,
          code: e?.code,
          message: e?.message,
          param: e?.param,
          statusCode: e?.statusCode,
          requestId: e?.requestId,
          raw: e?.raw?.message,
        },
        null,
        2
      )
    )

    return res.status(500).json({
      error: 'ไม่สามารถเริ่มชำระเงินได้ กรุณาลองใหม่',
      requestId: e?.requestId || null,
    })
  }
}
