# NISIT MATCH 8.0 — release verification

## Automated checks (run locally; GitHub connector cannot run the app)

```bash
npm ci
npm run build
npm run dev -- --host 0.0.0.0
```

## Manual verification on actual iPhone (Safari and installed PWA)

- [ ] Fresh registration; confirm campus email; expired/reused confirmation link; password reset
- [ ] Log in/out and reopen the installed PWA; check session persistence
- [ ] Swipe like/pass/super-like rapidly; ensure only one action per profile and no blank card
- [ ] Match two test accounts; confirm both see the match, animation fits screen, open chat targets correct match
- [ ] Send a text twice rapidly; verify one message, correct order, and delivery after reconnect
- [ ] Upload JPG/HEIC conversion path, multiple photos, unsupported and oversized images
- [ ] Record audio; cancel; send; play once; switch rooms while upload is in progress
- [ ] Scroll long message history, switch rooms, return from background and receive a new message
- [ ] Receive match/message/hangout push with screen locked and app backgrounded; check permission denied
- [ ] Check daily login Bangkok date rollover and concurrent claims on two devices
- [ ] Run required SQL migrations; confirm Admin RPC denies non-admin accounts
- [ ] Check Supabase Storage RLS, browser console, network errors and Vercel deployment logs

## Known blockers / limitations

- Daily Login currently awards display-only points in `supabase/nm_daily_rewards_v1.sql`. It does **not** grant spendable Super Likes. Do not label it as enabled until the server-side Super Like quota and consumption logic are audited and migrated atomically.
- Client-side guards reduce duplicate submits but cannot guarantee exactly-once delivery on timeouts. A database-backed idempotency key is needed for guaranteed deduplication.
- This checklist does not mean tests were executed. Run and record results before shipping.
