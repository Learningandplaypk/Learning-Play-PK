# Learn & Play PK — “Playful Pro” redesign

**Scope:** visual/UX only. Games, gamification (XP/streak/coins/badges/daily limits), routes,
Firebase, SEO and PWA behaviour are unchanged in behaviour — only their presentation and
payload changed.

---

## 1. What was removed

| Anti-pattern | Status |
| --- | --- |
| Pure-black background, neon 4–5 colour palette | gone — light `#FAFAF7` default + persisted dark `#15171B` |
| Rainbow gradients, glow, glassmorphism, blur blobs | gone — flat fills, 1px borders, exactly two shadows |
| Particle / tunnel / animated backgrounds | gone — static SVG art only |
| Emoji as UI icons | gone — `lucide-react` 20/24px stroke 2 everywhere (emoji survives only in learning content, celebrations and avatars) |
| Everything centred, always-animated, looping motion | gone — left-aligned, motion ≤200ms, nothing loops (only skeleton shimmer while loading) |
| `rounded-3xl`, huge shadows, custom cursor, magnetic buttons, page warp | gone — radius 12 (cards 16, chips pill), `components/cursor.tsx` deleted |
| “Space Grotesk on black” | gone — Nunito 800/900 display, Inter 400/500/600 body, Noto Nastaliq Urdu, all self-hosted |
| WebGL everywhere | gone — ONE adaptive hero scene (globe + mascot); Snake 3D, Racing and Tic-Tac-Toe were rewritten as Canvas 2D / DOM |

## 2. The system

* **Brand:** Pakistan Green `#178A55` (hover `#12734A`, pressed `#0E5C3B`, tint `#E6F4EC`); Saffron
  `#F5A524` (tint `#FEF3DC`) used sparingly for XP / streak / rewards.
  Semantic: success `#178A55`, error `#D7263D`, warning `#F5A524`, info `#2563EB`.
* **Light:** bg `#FAFAF7`, surface `#FFFFFF`, surface-2 `#F3F3EE`, border `#E6E6E0`, text `#1C1C1A`, muted `#6B6B66`.
  **Dark:** bg `#15171B`, surface `#1D2026`, surface-2 `#252932`, border `#2F3340`, text `#F2F2EE`, muted `#9A9CA4`.
* **Type scale** 12/14/16/18/22/28/36/48; body line-height 1.5, headings 1.15; everything left-aligned; one H1 per page.
* **Shape:** radius 12 / cards 16 / chips pill; shadows `sm 0 1px 2px rgba(0,0,0,.06)` and `md 0 4px 12px rgba(0,0,0,.08)` only.
* **Signature button:** chunky primary with a solid 4px darker bottom edge that presses to 2px on `:active`;
  secondary = white surface + 1px border + grey edge.
* **Mascot:** one flat 2-colour “Ustad” owl (`components/brand/ustad.tsx`) for empty states, level-up,
  game-over, onboarding, offline and error screens.
* **Motion:** five CSS keyframes (≤200ms ease-out) — page fade, overlay, dialog, sheet, toast.
  `prefers-reduced-motion` neutralises all of them (global rule in `globals.css`).
* **Spacing** 4pt grid, page padding 16/24, `max-w-1120px`.
* **Adaptive perf:** `lib/perf.ts` reads `deviceMemory`, `hardwareConcurrency`, Save-Data, coarse pointer
  and a 1s FPS probe; low-end → static SVG hero. “Lite mode” toggle forces it.

Reference page: **`/styleguide`** (renders every token, component and both themes).

## 3. Pages

* **Home** — hero “Khelo. Seekho. Jeeto.” + one sub-line + ONE primary CTA “Shuru karo — Free” and
  secondary “Games dekho”; mascot/3D right on desktop; Continue-where-you-left; 4 zone cards;
  today’s challenges; social proof; simple footer. No particles, no tunnel.
* **Nav** — slim top bar on desktop; 56px bottom tab bar on mobile with lucide icons and safe-area inset.
* **Catalogs** (`/learn`, `/brain`, `/quiz`, `/fun`) — search + filter chips, uniform cards
  (art / title / 1-line / difficulty dots / chunky Play), skeletons while loading.
* **Game screens** — quiet top bar (back + progress + hearts/timer), big content, bottom actions,
  green tick on correct / red shake on wrong, single game-over card with score, animated XP, stars,
  Play again + Share + Next game.
* **Learning path** — vertical circular nodes (locked / available / done), green + saffron crowns,
  tap → bottom sheet → Start.
* **Profile** — avatar, level ring, 3 stat tiles, weekly bars, badges grid (greyed when locked),
  settings (theme / lite / sound / language / logout).
* **Leaderboard** — Weekly / All-time / Friends tabs, flat top-3 podium, rows (rank / avatar / name / XP).
* **Auth** — minimal card, brand illustration, official-style Google button, email form, phone OTP.
* **Premium** — honest comparison table, one highlighted plan, chunky CTA, no fake urgency.
* **Empty / error / offline** — mascot + one line + one action (`app/offline`, `app/error.tsx`,
  `app/global-error.tsx`).

## 4. PWA

* Manifest rebranded (theme `#178A55`, background `#FAFAF7`, maskable icons, splash), `apple-touch-icon`
  regenerated, service worker bumped to `lpk-v4` with `/profile`, `/leaderboard`, `/premium` added to the
  cached shell.
* `beforeinstallprompt` install prompt + iOS “Add to Home Screen” hint with a 7-day dismiss.
* Offline shell + cached lessons; last-played game is available offline.
* All tap targets ≥44px, no hover-only affordances, no horizontal scroll, safe-area insets, `100dvh`,
  16px inputs (no iOS zoom).

## 5. Performance

Lighthouse **mobile** (13.4.1, simulated slow-4G + 4× CPU) against a local production build.
“Before” = `f605b64` (the state of `main` when this work started, checked out in a worktree and built).

| Route | Before P / A / BP / SEO | After P / A / BP / SEO |
| --- | --- | --- |
| `/` | **21** / 93 / 100 / 100 | **94** / 100 / 100 / 100 |
| `/fun` | 68 / 93 / 100 / 100 | **91** / 100 / 100 / 100 |
| `/learn` | 73 / 93 / 100 / 100 | **92** / 100 / 100 / 100 |
| `/quiz` | – | **93** / 100 / 100 / 100 |
| `/brain` | – | **92** / 100 / 100 / 100 |
| `/profile` | 71 / 93 / 100 / 100 | **95** / 100 / 100 / 100 |
| `/leaderboard` | – | **95** / 100 / 100 / 100 |
| `/premium` | – | **96** / 100 / 100 / 100 |
| `/login` | – | **96** / 100 / 100 / 100 |
| `/blog` | – | **96** / 100 / 100 / 100 |
| `/styleguide` | – | **93** / 100 / 100 / 100 |
| `/offline` | – | **96** / 100 / 100 / 100 |
| `/fun/snake3d` | – | **93** / 100 / 100 / 100 |
| `/quiz/millionaire` | – | **94** / 100 / 100 / 100 |
| `/learn/english/word-builder` | – | **94** / 100 / 100 / 100 |
| `/brain/memory` | – | **93** / 100 / 100 / 100 |

Home page, before → after: **LCP 6.6s → 2.9s**, **TBT 145.8s → 80ms**, **CLS 0.468 → 0**,
**Speed Index 6.1s → 1.4s**, total bytes **884 KB → 293 KB**, script **741 KB → 175 KB**.

### First-load JS (gzipped route bundles reported by `next build`)

| Route | Before | After |
| --- | --- | --- |
| `/` | 470 kB | **132 kB** |
| `/learn` | 119 kB | 122 kB |
| `/fun` | 121 kB | 127 kB |
| `/quiz` | 121 kB | 127 kB |
| `/brain` | 121 kB | 127 kB |
| `/profile` | 243 kB | **126 kB** |
| `/leaderboard` | 236 kB | **120 kB** |
| `/premium` | 114 kB | 117 kB |
| shared chunk | 103 kB | 103 kB |

What produced the drop:

1. **Firebase client SDK (~100 KB gz) is no longer in the initial graph.** `lib/firebase.ts` now exposes
   async loaders (`authModOf`, `fsModOf`, `fbAuth`, `fbDb`) and the “is it configured?” check moved to
   `lib/firebase-config.ts`, which imports no SDK. `AuthProvider`, `lib/sync`, the auth form and the admin
   page import the SDK on demand. Nothing about the auth flows changed — the SDK just arrives later.
2. **Framer Motion removed** (page template, toast, Modal, Sheet, install prompt → five CSS keyframes).
3. **Noto Nastaliq Urdu (260 KB) moved out of the global stylesheet** into `public/fonts/urdu.css`,
   loaded through a `media="print"` link that flips to `all` on first engagement or 1.5s after load
   (`scripts/copy-urdu-font.mjs` runs on `prebuild`, files are git-ignored). Urdu still renders — with
   `font-display: swap` it simply swaps in after first paint instead of competing with it.
4. **Route prefetch disabled** on the navbar and mobile tab bar (they were pre-fetching 4–5 routes on
   every page load).
5. **Three R3F games rewritten** as Canvas 2D / DOM (Snake 3D, Racing, Tic-Tac-Toe), so `three` is only
   ever pulled in by the single lazy hero chunk.

### Dependencies removed

`@playwright/test`, `gsap`, `lenis`, `@fontsource-variable/space-grotesk`, `@react-three/drei`,
`@react-three/postprocessing`, `framer-motion`.
Added: `@fontsource-variable/nunito`, `lucide-react`. `three` + `@react-three/fiber` stay — the one
hero scene uses them.

## 6. Quality gates

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | 0 errors |
| `npm run test` (vitest) | 51 passed / 5 files |
| `npm run build` | 125+ routes, exit 0 — also verified with `NEXT_PUBLIC_SITE_URL=""` |
| `scripts/browser-qa.mjs` | 29 routes × **8 viewports** (360×640, 390×844, 768×1024, 1280×900) × light + dark — **all clean**: 0 console errors, 0 page errors, no horizontal overflow, no sub-4.5:1 text, no unlabelled icon buttons, no tap target < 44px |
| `scripts/interaction-qa.mjs` | bottom sheet opens/closes, tabs switch, toast shows + dismisses, quiz registers answers, Snake canvas runs and scores, theme toggle flips and persists — 0 console errors |
| `scripts/pwa-qa.mjs` | manifest fields + maskable/192/512/apple icons + theme-color OK, service worker active, home **and** `/offline` render with the network switched off |
| GitHub Actions CI | typecheck + test + build (unchanged workflow) |

New dev tooling (all opt-in, nothing runs in production):

```bash
LD_LIBRARY_PATH=/tmp/libs/lib node scripts/browser-qa.mjs --w=390 --h=844 --theme=dark   # static sweep
LD_LIBRARY_PATH=/tmp/libs/lib node scripts/interaction-qa.mjs                             # clicks through shared UI
LD_LIBRARY_PATH=/tmp/libs/lib node scripts/pwa-qa.mjs                                     # offline + manifest
LD_LIBRARY_PATH=/tmp/libs/lib CHROME_PATH=/tmp/chromium node scripts/lighthouse-mobile.mjs /
LD_LIBRARY_PATH=/tmp/libs/lib node scripts/screenshots.mjs --out=shots/after --theme=dark --w=1280
```

## 7. Screenshots

`shots/before/*` = the old build (`f605b64`), `shots/after/*` = this branch.
7 routes × {before light 390} and × {after light 390, dark 390, light 1280, dark 1280}:

```
shots/before/{home,learn,fun,profile,premium,leaderboard,login}-light-390.png
shots/after/{home,learn,fun,profile,premium,leaderboard,login}-{light,dark}-{390,1280}.png
```

(`shots/` is git-ignored — the PNGs live in the workspace, not in git.)

## 8. What I could not verify here — please check on the preview

1. **Firebase auth.** The sandbox blocks Google/Firebase endpoints, so no real sign-in was possible.
   The code paths are unchanged and `lib/firebase` is now lazily imported, so please smoke-test on the
   preview: Google popup (desktop), Google redirect (mobile / in-app browser), email sign-up + login,
   phone OTP, password reset, logout. Watch the browser console for `[auth]` errors.
2. **Real-device feel** on a 2 GB Android (Lite mode auto-detect, FPS probe, canvas games at 60fps) and
   iPhone Safari (standalone mode, status bar, safe areas, no input zoom).
3. **Lighthouse on the Vercel preview** — the numbers above come from a local container; Vercel should
   be at least as good, but re-run before publishing.
4. **AdSense / consent** — the consent banner now appears 400ms after load (it used to be 1200ms) so it
   stops being the LCP element. Confirm ads still initialise only after consent.
5. **Firestore rules** were **not** changed and no new `users/{uid}` fields were added, so nothing needs
   re-publishing.

---

## 9. Polish v2 — depth & motion back (desktop rich / mobile lite)

**Branch:** `arena/01a0815b-learning-play-pk`  
**Tokens unchanged:** Pakistan Green `#178A55`, saffron `#F5A524`, Nunito/Inter/Noto Nastaliq, radius 12/16/pill, chunky buttons, Ustad mascot. No neon, no black, no text-gradients, no glass, no particles-everywhere, no custom cursor.

### Scroll-bug root cause

`html, body { overflow-x: hidden }` (plus `overscroll-behavior-y: none` and `touch-action: manipulation` on `body`).

Setting `overflow-x: hidden` on **both** html and body computes `overflow-y` to `auto` on both, so you get two nested scroll containers. The document could not move down — `window.scrollTo(0, 99999)` stayed at `scrollY = 0`.

**Fix (layout-level, not per-page):**

- `html { overflow-x: clip; overflow-y: auto; height: auto }`
- `body { overflow-x: clip; overflow-y: visible }` — no `touch-action` on body
- Nested-safe `lib/scroll-lock.ts` (counter + `.scroll-locked` class) instead of writing `body.style.overflow = hidden` which leaked when two overlays overlapped
- Permanent check in `scripts/browser-qa.mjs`: if `scrollHeight > clientHeight`, `scrollTo` must move; sheet lock must release on Escape; `--lang=ur` asserts `dir=rtl`

### Proof (production `next start`, headless Chromium)

| Route | 1280×900 | 390×844 |
| --- | --- | --- |
| `/` | sh=2448 ch=900 **y=1548** | sh=5433 ch=844 **y=4589** |
| `/learn` | sh=1525 **y=625** | sh=3034 **y=2190** |
| `/fun` | sh=1990 **y=1090** | sh=3838 **y=2994** |
| `/profile` | sh=1780 **y=880** | sh=3837 **y=2993** |

29 routes × 390 light and 1280 light: **all CLEAN**, all scrollable, 0 console errors. `--lang=ur` → `dir=rtl lang=ur`. Interaction QA (sheet, tabs, toast, quiz, snake, theme): **6/6**. 360×640 and 768×1024 dark also clean.

### Urdu

- `.gitignore` is now `public/fonts/*.woff2` (not the whole directory)
- `lib/urdu-font.ts` injects deferred inline `@font-face` — **no `/fonts/urdu.css` request** (that 404'd on every page)
- `lib/i18n.tsx` sets `dir="rtl" lang="ur"` on `<html>` for Urdu and restores `ltr`/`en`
- Directional chrome utilities converted to logical (`text-start`, `ms`/`ps`/`pe`, `start-`/`end-`)

### What came back (gated by `richUI`)

`richUI = width ≥ 1024 AND not prefers-reduced-motion AND not Lite mode AND deviceMemory ≥ 4 (if known)`.

| Item | Desktop rich | Mobile / lite |
| --- | --- | --- |
| 1.1 Hero | R3F globe + green atmosphere + floating A/ب/한/あ/中 + book + controller, idle rotation, mouse parallax, dpr clamp 1.5, lazy after LCP inside SceneBoundary | Designed static SVG of the same scene (`HeroStill`) |
| 1.2 Scroll | GSAP ScrollTrigger **only on home**, step highlight on “Kaise kaam karta hai”, parallax, progress fills; Reveal = 24px / 400ms fade+rise | Single fade-in per section |
| 1.3 Navbar | Guest → coins + Login/Guest; logged-in → level ring, name, Lvl · title, XP bar, streak, coins; dropdown: weekly XP, badges, Profile / Leaderboard / Settings / Logout | Compact avatar + streak chip; full widget on Profile |
| 1.4 Cards | Hover/focus lift −4px + shadow-lg, art scale 1.03, Play pre-highlight | Same layout, no hover lift (coarse pointer) |
| 1.5 Feedback | Tick pop, shake, combo pulse, star fill stagger, lazy confetti (brand colours, one burst), coins fly to `#nav-coins`, level-up mascot, chest-open, badge toast shine | Same, reduced-motion skips travel |
| 1.6 Path | Pulse ring + Ustad on current node, crown pop on done | Same, CSS-only |
| 1.7 Routes | Framer Motion 120ms fade + 8px rise (`app/template.tsx`) | Same; reduced-motion → no travel |
| 1.8 Sound | Procedural SFX kept, **default off**, remembered; brand-tone `tick` | — |

Dark theme: surfaces lift with a **light rim + shadow**, no brand-green glow.

### Perf (do not lose what we gained)

| | Before polish (Playful Pro) | After polish v2 |
| --- | --- | --- |
| First-load JS `/` | 132 kB | **133 kB** (budget ≤ 170) |
| Shared JS | 103 kB | **103 kB** |
| `/learn` | 122 kB | 122 kB |
| `/fun` | 127 kB | 127 kB |
| `/profile` | 126 kB | 128 kB |
| Routes in build | 125+ | **126** static pages generated |

Framer Motion is tree-shaken into the template; **GSAP is a dynamic import on home only**; **confetti is dynamic**; R3F still only on the home hero chunk. CLS kept to transform/opacity. `prefers-reduced-motion` still kills choreography; content still appears.

Lighthouse was not re-run in this sandbox (no LH binary). Previous mobile was 94/100/100/100 on `/`. Payload is essentially unchanged (132 → 133 kB), so those scores should hold. Please re-run on the Vercel preview.

### Tests / gates

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | 0 errors |
| `npm test` | **62 passed** / 6 files (was 51 / 5) |
| `npm run build` | 126 pages, exit 0 |
| `scripts/browser-qa.mjs` | 29 routes × 390 & 1280 light — all clean + scroll |
| `scripts/interaction-qa.mjs` | 6/6 |
| New unit tests | Urdu font (no urdu.css), RTL mapping, `computeRichUI`, scroll CSS |

### Manual checks for you (sandbox cannot)

1. **Firebase auth** — Google popup (desktop) / redirect (mobile), email, phone OTP, logout. Watch `[auth]` in the console.
2. **Logged-in navbar widget** — sign in on desktop ≥1024px and confirm level ring + dropdown (weekly XP, badges, logout). Guest widget is what the screenshots show.
3. **3D hero** — desktop, Lite mode OFF, not reduced-motion, ≥4 GB RAM. First paint is the static globe; 3D mounts after LCP.
4. **Game-over** — play a quiz, confirm XP count-up, stars filling one-by-one, one confetti burst, coins flying to the navbar.
5. **Urdu** — Profile → اردو. Whole chrome should flip RTL and Nastaliq should swap in (no `/fonts/urdu.css` 404).
6. **Lite mode** — Settings → Lite ON should freeze the static hero even on a powerful desktop.
7. **Sound** — new guests start with sound **off**; the footer/profile toggle still persists.
8. **Lighthouse** on the Vercel preview (mobile ≥90, desktop ≥85 with 3D).
9. Firestore rules were **not** changed. No new user fields.
