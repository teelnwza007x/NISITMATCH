# NISIT MATCH — Stripe PromptPay Sandbox Setup

1. Run `supabase/V115_STRIPE_PREMIUM.sql` in Supabase SQL Editor (after V76 migration).
2. In Stripe Sandbox confirm prices are **One-off THB**: weekly `price_1USZirRqxNC12BLAmggjV2kg` (39 THB), monthly `price_1USZiGRqxNC12BLAKJolJ90W` (119 THB). Prices must belong to the same Stripe Sandbox account as your secret key.
3. Enable PromptPay in Stripe Sandbox payment methods. Stripe account eligibility applies.
4. In Vercel project Settings → Environment Variables set `STRIPE_SECRET_KEY` (Sandbox sk_test_...), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SITE_URL=https://nisitmatch.vercel.app`. NEVER use VITE_ for secrets; NEVER paste secrets into chat or commit them.
5. Deploy Vercel. In Stripe Sandbox → Developers → Webhooks (or Workbench → Webhooks) add HTTPS endpoint `https://nisitmatch.vercel.app/api/stripe-webhook`; subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
6. Copy webhook signing secret `whsec_...` into Vercel as `STRIPE_WEBHOOK_SECRET`, redeploy.
7. Test Stripe Checkout PromptPay in Sandbox. Verify `premium_payments` and `premium_subscriptions` updated in Supabase. Confirm repeat webhook does not extend twice, and repeat purchase adds 7/30 days. Stripe Checkout returning success alone does not grant Premium.
8. For Live: activate Stripe account, confirm PromptPay eligibility, create live one-off prices, replace IDs in BOTH API files, configure live secrets and live webhook, redeploy. Do not use sandbox keys in live.

**Security:** ZIP intentionally excludes `.env`, `.env.local`, `.git`, `node_modules`. If old credentials were ever committed to Git, rotate them. Never expose service role key to browser. The webhook checks signature, payment status, amount, currency, price ID, user ID and uses an idempotent SQL function.
