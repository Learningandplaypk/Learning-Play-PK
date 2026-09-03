# 🦉 Learn & Play PK — سیکھو + کھیلو

> **Pakistan ka pehla 3D learning arcade.** Sab FREE. Sab 3D. — *Seekho + Khelo!*
> Duolingo wali seekh × Poki wala fun × Awwwards wala design — sab kuch browser mein, Urdu-friendy, mobile-first.

## ⚡ Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

**Sab kuch bina config ke chalta hai** — guest mode, local progress, saare 43 games. Firebase/ads/payments sirf cloud features unlock karte hain.

## 🎮 Kya hai is mein (43 games)

| Zone | Games |
|---|---|
| 📚 **Learn (8 × 8 languages)** | Word Builder, Grammar Quest, Vocabulary Battle, Sentence Puzzle, Listening Challenge, Story Builder, Pronunciation Game, Idiom Master — English full course (300 words + Urdu meanings, 82 grammar MCQs, 36 sentences, 40 idioms, 10 stories) + 7 languages (Arabic w/ Quranic vocab, Turkish, Chinese, French, Spanish, Korean, Japanese) |
| 🧠 **Brain (10)** | Memory Match, Pattern Recall, Math Speed, Stroop Test, Simon Says, Reaction Time, Logic Puzzles, Sudoku, 2048, Chess vs AI |
| ❓ **Quiz (10)** | GK, Pakistan Studies, Science, Islamic, History, Geography, Sports, Tech, Movies + **Millionaire** (15 Q, 50-50/Ask-Audience/Skip lifelines, safe havens) |
| 🕹️ **Fun (15)** | Snake 3D, 2048, Flappy, Crossword, Word Search, Tic Tac Toe 3D, Racing 3D, Fruit Ninja, Tetris, Bubble Shooter, Typing Test, Hangman, Jumble, Connect 4, Minesweeper |

Gamification: XP formula, **levels 1–50** (Newbie → Legend), daily streak (Asia/Karachi + freezes), coins, **30 badges**, 7-day daily chests, leaderboards, free-plan limits (5 games + 3 lessons/day) with fair upsell, guest mode with merge-on-login.

## 🛠 Tech Stack

- **Next.js 15** (App Router, PPR-friendly) + **TypeScript** strict
- **Tailwind CSS v4** — custom "NEON ARCADE" design tokens
- **Three.js + R3F + drei + postprocessing** — home cinematic, Snake 3D, Racing, Tic Tac Toe 3D (custom GLSL feel, no model assets)
- **GSAP + ScrollTrigger + Lenis + Framer Motion** — scroll choreography
- **Zustand** (persisted store) · **Firebase** (auth/Firestore) · **chess.js** · **zod** · WebAudio SFX (Howler-free)
- **PWA** — installable, offline shell (`public/sw.js`), zero-dependency icons

## 🚀 Deploy (Vercel)

```bash
npm i -g vercel && vercel
```

1. Push to GitHub → import in Vercel (zero config).
2. Environment variables: copy `.env.example` → `.env.local` (local) / Vercel dashboard (prod).
3. Firebase Console → Firestore → paste `firestore.rules` + `firestore.indexes.json` → deploy.
4. Webhooks: Stripe → `/api/webhooks/stripe`, Safepay → `/api/webhooks/safepay`.
5. Cron (streak reminders 6pm PKT) already in `vercel.json` — set `CRON_SECRET`.

## 🔑 Environment Variables

Complete list `.env.example` mein hai. Highlights:

| Key | Kya karta hai |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Auth + Firestore sync, leaderboards, phone OTP |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Server-side (webhooks, cron, anti-cheat writes) |
| `STRIPE_SECRET_KEY` / `SAFEPAY_SECRET_KEY` | Premium checkout (Rs. 399/mo) + coin packs |
| `RESEND_API_KEY` | Welcome email, receipts, streak reminder emails |
| `NEXT_PUBLIC_ADSENSE_CLIENT` + `_SLOT_*` | Guest-only ads (premium = zero ads) |
| `NEXT_PUBLIC_ADSENSE_REWARDED_SLOT` | Rewarded video → +1 heart |
| `NEXT_PUBLIC_ADMIN_EMAILS` | `/admin` panel allowlist |

**Missing keys par app gracefully degrade** hoti hai — admin warning chips dikhti hain, games phir bhi poori tarah chalte hain.

## 🧪 Quality

```bash
npm run typecheck    # tsc --noEmit
npm run test         # vitest (engines, gamification, data integrity)
npm run build        # next build (type errors = build errors)
npm run test:e2e     # playwright (install browsers first: npx playwright install)
```

## 📁 Structure

```
app/                    # routes (zones, games, auth, blog, legal, api)
components/games/       # 43 games (learn/, brain/, quiz/, fun/)
components/home3d/      # cinematic 3D home
lib/                    # store, gamification, engines, sfx, firebase, i18n
data/                   # words/grammar/quizzes/badges/blog (all real content)
public/                 # sw.js, icons, manifest
```

## 📜 License

Code: MIT. Content & design: © 2026 Learn & Play PK. Fonts & libraries: `CREDITS.md`.
