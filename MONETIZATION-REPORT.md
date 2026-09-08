# Monetization Rebuild — "Everything free, Premium = better experience"

**Branch:** `arena/01a081d4-learning-play-pk` · **Date:** 2026-09-08
**Principle:** nothing is locked. Free users get 100% of the learning + games content.
Premium buys comfort (no ads, unlimited hearts, reports, certificates, cosmetics), never ability.
No countdown timers, no fake scarcity, no interstitial guilt-trips.

---

## 1. Limits removed (all of them)

| Removed | Where it lived | Now |
| --- | --- | --- |
| 5 games/day cap | `lib/gamification.ts` (`FREE_DAILY_GAMES`, `isLimitReached`, `remainingToday`, `bumpUsage`) | deleted |
| 3 lessons/day cap | same | deleted |
| `canPlay()` / `limitInfo()` gates | `lib/store.ts` | deleted; `canPlay` no longer exists — games start immediately |
| "Aaj ka free limit khatam" upsell modal | `components/game-shell.tsx` | deleted |
| "Free plan: roz 5 games + 3 lessons" intro line | `components/game-shell.tsx` | replaced with "Sab kuch free hai." |
| Level/lesson path gating (`locked` nodes) | `components/zones/learn-path-client.tsx` | every lesson is playable; nodes are now `done` / `next` / `todo` |
| Limit copy in FAQ / Terms / zone grid / style guide | several | rewritten |
| Daily-usage counters (`daily: {date, games, lessons}`) | persisted store | dropped from state (migration v2 strips it) |

Tests: `tests/no-limits.test.ts` asserts the limit helpers no longer exist, that the store exposes
no `canPlay`/`limitInfo`, and that 50 consecutive plays in one day all succeed.

## 2. Plans (PKR)

| Plan | Price | Notes |
| --- | --- | --- |
| Free | Rs. 0 | forever, all content |
| Premium Monthly | **Rs. 299 / mahina** | cancel anytime |
| Premium Yearly | **Rs. 999 / saal** | shown as "Rs. 83/mah · 72% bachat", badge **"Sab se popular"**, optional **7-day free trial** (card/wallet required, cancel anytime) |

Source of truth: `lib/plans.ts` (`PLANS`, `PRICE_PKR`, `YEARLY_MONTHLY_EQUIV`, `YEARLY_SAVING_PCT`).
Server routes read prices from here — the client can never set the amount.

## 3. Premium features (all implemented, server-enforced)

Entitlement = `users/{uid}.isPremium && (premiumExpiry + 3 day grace) >= today`, computed by
`lib/entitlements.ts::isPremiumActive()` — used by the client store *and* by every server route
(`/api/entitlement`, `/api/certificate`, `/api/report/weekly`). The client copy is a mirror; it can be
faked locally but every server-side benefit re-checks Firestore.

| # | Feature | Implementation |
| --- | --- | --- |
| a | Zero ads | `components/ads.tsx` returns `null` and never injects the AdSense script when premium |
| b | Streak Freeze 2/mo + Repair 1/mo | `lib/entitlements.ts` (`monthlyAllowance`, `applyStreakProtection`), auto-applied in `submitGame`; counters reset on PKT month change; free users can buy 1 freeze for 60 coins in the shop |
| c | Unlimited hearts | `lib/hearts.ts` — free: 5 max, refill 1/hour, rewarded ad = +1; premium: `Infinity` |
| d | Progress reports | `/progress` page (accuracy by topic, weak words, time spent, 7-day chart) + `POST /api/report/weekly` sends a Resend digest when `RESEND_API_KEY` is set |
| e | Certificates | `lib/certificate.ts` (jsPDF) — name, language, level, date, verification code; `/verify/[code]` validates and shows the record |
| f | Mistakes Review | wrong answers recorded per user (`mistakes[]` in the store + Firestore), practiced from `/progress` → `/mistakes` in one tap |
| g | Offline lesson packs | `lib/offline-packs.ts` talks to the service worker (`CACHE_PACK` / `DROP_PACK` messages, `lpk-pack-<lang>` caches); manage-storage UI at `/downloads` |
| h | Cosmetics | 6 avatars, 3 frames, 2 themes in `lib/cosmetics.ts` (existing design tokens only, no neon) + `PremiumBadge` next to the name on leaderboard/profile |
| i | 2× daily coins + premium chest | `claimDailyReward()` doubles coins and adds a premium bonus chest |
| j | Priority support | WhatsApp deep link from `NEXT_PUBLIC_SUPPORT_WHATSAPP` (hidden when unset) |
| — | Family plan | **not built** — flag `FEATURES.familyPlan = false` in `lib/plans.ts` |

## 4. Payments

* **Safepay** (primary, PK): hosted checkout, JazzCash / EasyPaisa / local cards. `POST /api/checkout/safepay`.
* **Stripe** (fallback, international cards): `POST /api/checkout/stripe`, monthly + yearly recurring prices, 7-day trial on yearly.
* Webhooks (`/api/webhooks/safepay`, `/api/webhooks/stripe`) set `isPremium`, `premiumExpiry`, `premiumPlan`, `premiumSince`, `premiumProvider` and write a `payments/{id}` receipt.
* **Grace period 3 days** after `premiumExpiry`; after that `isPremiumActive()` returns false → automatic downgrade (no cron needed; `/api/cron/downgrade` also cleans the flag in Firestore for anybody who has lapsed).
* **Manage subscription**: `/account` — plan, renewal date, provider, cancel instructions, receipts.
* **Receipt email** via Resend on successful payment (both providers).
* **Never a broken button**: `GET /api/payments/status` reports which providers are configured; `/premium` shows a calm "Payments abhi configure nahi hain" notice instead of a dead button, and `/admin` shows a banner listing the missing env vars.

### Env vars you must set

| Var | Needed for | Notes |
| --- | --- | --- |
| `SAFEPAY_SECRET_KEY` | Safepay checkout + webhook signature | from Safepay dashboard → Developers → API keys |
| `SAFEPAY_WEBHOOK_SECRET` | webhook HMAC (falls back to `SAFEPAY_SECRET_KEY`) | Safepay → Developers → Webhooks |
| `SAFEPAY_ENV` | `sandbox` \| `production` | default `sandbox` |
| `STRIPE_SECRET_KEY` | Stripe checkout | `sk_test_…` while testing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | `whsec_…` |
| `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` | optional; use existing Stripe Price IDs instead of inline price_data | recommended for production |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | webhooks writing entitlements | raw or base64 service-account JSON |
| `RESEND_API_KEY`, `EMAIL_FROM` | receipts + weekly progress email | optional |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | priority support link | digits only, e.g. `923001234567` |
| `CRON_SECRET` | protects `/api/cron/downgrade` and the weekly report cron | |
| `NEXT_PUBLIC_ADSENSE_*` | free-tier ads | premium never loads them |

### Safepay dashboard steps

1. Sign up at **getsafepay.com** → Merchant dashboard → complete KYC (NTN / CNIC + bank account) to enable JazzCash & EasyPaisa rails.
2. **Developers → API keys** → copy the *sandbox* secret key → `SAFEPAY_SECRET_KEY`, keep `SAFEPAY_ENV=sandbox`.
3. **Developers → Webhooks → Add endpoint**: `https://<your-domain>/api/webhooks/safepay`, events: `payment.succeeded`, `payment.failed`, `subscription.cancelled`. Copy the signing secret → `SAFEPAY_WEBHOOK_SECRET`.
4. **Settings → Checkout** → set redirect URLs: success `https://<domain>/premium?success=1`, cancel `https://<domain>/premium?cancelled=1`.
5. Test with Safepay sandbox JazzCash/EasyPaisa test wallets, confirm `users/{uid}.isPremium` flips.
6. Flip `SAFEPAY_ENV=production` and swap in the live secret key when KYC is approved.

### Stripe dashboard steps

1. **Products → Add product** "Learn & Play PK Premium" with two recurring prices: PKR 299 / month and PKR 999 / year. (If PKR is not enabled on your account, create USD equivalents and set `STRIPE_PRICE_*`.)
2. On the yearly price enable a **7-day free trial** (or leave it — the checkout route sets `trial_period_days: 7` for yearly).
3. Copy both price IDs → `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`.
4. **Developers → API keys** → secret key → `STRIPE_SECRET_KEY`.
5. **Developers → Webhooks → Add endpoint** `https://<domain>/api/webhooks/stripe`, events:
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy `whsec_…` → `STRIPE_WEBHOOK_SECRET`.
6. **Settings → Billing → Customer portal** → enable, so `/account` can deep-link cancellation.

Local webhook simulation: `node scripts/simulate-webhooks.mjs` (signs a Safepay payload with your
`SAFEPAY_SECRET_KEY` and posts both provider payloads at `http://localhost:3000`).

## 5. `/premium` page

Honest layout: hero ("Sab kuch free hai — Premium sirf tajurba behtar banata hai"), two plan cards
(yearly highlighted with "Sab se popular" + Rs. 83/mah · 72% bachat), full Free-vs-Premium table where the
Free column is deliberately full of ✓, FAQ (cancel anytime, 7-day refund, progress is never taken away,
what happens when premium expires), trust row (JazzCash / EasyPaisa / Visa / Mastercard wordmarks).
**No testimonials** — we have no verified premium customers yet, so the section is omitted.

Soft entry points only: a small "Go Premium" chip in the navbar account widget, one calm card after
game-over (max once per browser session, `sessionStorage` guard), and a Settings row in `/profile`.

## 6. Ads for free users

Banner slots only on catalog pages (`/learn`, `/brain`, `/quiz`, `/fun`) and the game-over card — never
inside gameplay. Rewarded ad gives +1 heart or +25 coins. All ad code is behind the consent banner
(`consentAds === true`) and behind `!premium`; the AdSense script tag is never injected for premium users.

## 7. Firestore rules diff — **you must re-publish**

`users/{uid}` `hasOnly()` list gains these client-writable fields:

```
'hearts','heartsAt','mistakes','frame','theme','cosmetics','downloads',
'premiumCycle','freezesUsedThisMonth','repairsUsedThisMonth','certificates'
```

and these **server-only** fields are now explicitly rejected from client writes
(previously only `isPremium` was): `isPremium`, `premiumExpiry`, `premiumPlan`, `premiumSince`,
`premiumProvider`, `trialEnd`. A new `certificates/{code}` collection is public-read (so `/verify/[code]`
works for anyone) and server-write only.

Publish with:

```bash
firebase deploy --only firestore:rules --project learnandplaypk
```

## 8. Verification — results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **0 errors** |
| `npx vitest run` | **105 tests / 9 files, all passing** (was 62) — new: `no-limits`, `entitlements`, `hearts` |
| `npx next build` | **success**, all 12 new routes compiled |
| Webhook simulation | **5/5** — `scripts/simulate-webhooks.mjs`: valid Safepay payload → 200, tampered signature → **401**, unsigned Stripe → **400**, trial + cancellation events handled |
| Page QA (dev server) | `/`, `/premium`, `/progress`, `/downloads`, `/account`, `/mistakes`, `/verify/[code]`, `/learn/english`, `/brain/memory` → all **200**, no console/server errors |
| Copy audit | no "roz 5 games", no "3 free lessons", no `Locked` chip, no countdown/scarcity strings anywhere |
| Bundle size | `/premium` 5.1 kB, `/progress` 8.3 kB, shared 104 kB — jsPDF is dynamically imported so it never enters the main bundle |

### New tests added

* `tests/no-limits.test.ts` — asserts the limit helpers, `canPlay`/`limitInfo`, the `daily` counter, the `locked` lesson state and the old limit copy are all gone; 50 plays in one day all succeed.
* `tests/entitlements.test.ts` — expiry, the 3-day grace window, auto-downgrade, cancellation override, lifetime access, trials, renewal stacking, streak freeze/repair allowances + monthly reset, 2× coins, plan prices/badges, certificate codes.
* `tests/hearts.test.ts` — premium infinity, free refill maths, floors/caps, rewarded-ad grants, plus mistakes-review and progress-report analytics.

### Notes / limitations

* **Lighthouse was not run in the sandbox** — Chrome could not be downloaded (network blocked). The mobile build is unchanged structurally from the previous ≥90 baseline and the new pages add only 2–8 kB each with no new blocking scripts, no new fonts and no layout-shifting images. Worth one confirming run on the Vercel preview.
* Puppeteer-based visual QA was likewise unavailable; QA was done via server-rendered HTML assertions and dev-server logs instead.
* Mistake capture is currently wired into the quiz engine (all 10 quiz topics) and Vocab Battle. Other learn games can call `usePlayer().addMistake(...)` with the same one-line pattern.
