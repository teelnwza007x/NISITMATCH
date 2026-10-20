export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.STRIPE_PUBLISHABLE_KEY
  if (!key || !key.startsWith('pk_')) return res.status(503).json({ error: 'กรุณาตั้งค่า STRIPE_PUBLISHABLE_KEY บน Vercel' })
  return res.status(200).json({ publishableKey: key })
}
