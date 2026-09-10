# Learning & Play PK — 21-language rebuild report

Branch `arena/01a0824b-learning-play-pk` → target `main`. Base commit `c7fbd52`.

**Branch state at the time of writing:** the sandbox rolled the branch pointer back to the
base commit and dropped `node_modules`, so this report was re-verified from scratch against
the working tree after `npm ci`. Every number below was produced in that state — see §2.
The change set is **131 files changed, roughly +17.8k / −1,390** (`git diff --shortstat c7fbd52 HEAD`; the exact insertion count moves by a line each time this document is edited).

---

## 1. What shipped

### Task A — UI language

| Item | Where | Behaviour |
| --- | --- | --- |
| Default locale | `lib/i18n.tsx` | `"en"` for every new visitor. Browser `navigator.language` is **never** read, so there is no auto-switch. |
| Persistence | `lib/store.ts` + `lib/sync.ts` | Choice stored in the Zustand persist store and mirrored to `users/{uid}.lang` via `pushLanguagePrefs()`. |
| Onboarding | `components/onboarding.tsx` (`OnboardingSheet`), mounted in `components/providers.tsx` | One screen, shown once, skippable. "Choose your app language" (English / Roman Urdu / اردو) + "Which languages do you want to learn?" multi-select chips with English pre-selected. Gated on the `onboarded` flag so it never returns. |
| Settings → Language | `components/zones/*` settings sheet | Changes the UI language at any time, after onboarding. |
| Direction | `lib/i18n-core.ts` `documentLangAttrs` + `applyDocumentLang` | `<html dir>` follows the **UI** language: Urdu UI → `dir="rtl"`, English/Roman Urdu → `ltr`. |

### Task B — 13 new learning languages (21 total)

All 13 new packs were authored by hand into `scripts/lang-src/<slug>.txt` and compiled to
`data/langs/<slug>.json` by `scripts/build-lang-data.mjs`. Nothing is machine-translated:
each source file carries its own romanization scheme, 12 per-category sentence frames and a
full alphabet table.

| # | Language | Slug | Words | Phrases | Grammar | Jumbled | Listen | Stories | Idioms | Alphabet | Script | RTL | TTS code(s) | Font |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Urdu (for English speakers) | `urdu` | 300 | 146 | 91 | 40 | 20 | 10 | 25 | 37 | Nastaliq | ✔ | ur-PK, ur-IN, hi-IN | nastaliq |
| 2 | Punjabi (Shahmukhi) | `punjabi` | 300 | 145 | 76 | 40 | 20 | 10 | 25 | 37 | Shahmukhi | ✔ | pa-IN, ur-PK | nastaliq |
| 3 | Pashto | `pashto` | 300 | 144 | 62 | 40 | 20 | 10 | 25 | 42 | Naskh | ✔ | ps-AF, ur-PK | naskh |
| 4 | Sindhi | `sindhi` | 300 | 143 | 69 | 40 | 20 | 10 | 26 | 45 | Naskh | ✔ | sd-PK, ur-PK | naskh |
| 5 | Balochi | `balochi` | 300 | 142 | 61 | 40 | 20 | 10 | 25 | 35 | Naskh | ✔ | bal, ur-PK | naskh |
| 6 | Persian / Farsi | `persian` | 300 | 145 | 66 | 40 | 20 | 10 | 25 | 32 | Naskh | ✔ | fa-IR | naskh |
| 7 | German | `german` | 300 | 174 | 92 | 40 | 20 | 10 | 25 | 30 | Latin | — | de-DE, de-AT | — |
| 8 | Italian | `italian` | 300 | 145 | 62 | 40 | 20 | 10 | 25 | 21 | Latin | — | it-IT | — |
| 9 | Portuguese (Brazil) | `portuguese` | 300 | 145 | 63 | 40 | 20 | 10 | 25 | 26 | Latin | — | pt-BR, pt-PT | — |
| 10 | Russian | `russian` | 300 | 145 | 61 | 40 | 20 | 10 | 25 | 33 | Cyrillic | — | ru-RU | — |
| 11 | Hindi (Devanagari) | `hindi` | 300 | 143 | 66 | 40 | 20 | 10 | 25 | 40 | Devanagari | — | hi-IN | devanagari |
| 12 | Bengali | `bengali` | 300 | 145 | 64 | 40 | 20 | 10 | 25 | 50 | Bengali | — | bn-BD, bn-IN | bengali |
| 13 | Malay | `malay` | 300 | 144 | 72 | 40 | 20 | 10 | 25 | 26 | Latin | — | ms-MY, id-ID | — |
| — | *English (existing)* | `english` | 304 | — | 120 | 60 | — | 10 | 40 | — | Latin | — | en-US, en-GB | — |
| — | *Arabic (starter)* | `arabic` | 98 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | Naskh | ✔ | ar-SA, ar-EG | naskh |
| — | *French (starter)* | `french` | 100 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | Latin | — | fr-FR, fr-CA | — |
| — | *Spanish (starter)* | `spanish` | 98 | 29 | 0 | 0 | 0 | 0 | 0 | 0 | Latin | — | es-ES, es-MX | — |
| — | *Turkish (starter)* | `turkish` | 99 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | Latin | — | tr-TR | — |
| — | *Chinese (starter)* | `chinese` | 97 | 29 | 0 | 0 | 0 | 0 | 0 | 0 | Han | — | zh-CN, zh-TW | — |
| — | *Japanese (starter)* | `japanese` | 98 | 29 | 0 | 0 | 0 | 0 | 0 | 0 | Kana + Han | — | ja-JP | — |
| — | *Korean (starter)* | `korean` | 98 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | Hangul | — | ko-KR | — |

**Known gap, stated plainly:** the 7 languages that shipped with the original app
(arabic, french, spanish, turkish, chinese, japanese, korean) are still at their original
starter size — ~100 words and ~30 phrases, with no grammar/sentence/listening/story/idiom
content. They were outside the 13 new languages in scope for this release and were only
migrated onto the new pack schema (`scripts/migrate-legacy-langs.mjs`). They are held to a
lower bar in the validator (`STARTER` tier in `scripts/validate-lang-data.mjs`) so the gap
cannot silently widen, and expanding them to full spec is the obvious next content task.

#### Fonts (all self-hosted, subset + lazy-loaded)

`public/fonts/` holds 12 WOFF2 subsets across 4 families — Noto Nastaliq Urdu (ur, pa),
Noto Naskh Arabic (ar, fa, ps, sd, bal), Noto Sans Devanagari (hi), Noto Sans Bengali (bn) —
each in arabic/latin/latin-ext (or bengali/devanagari) subsets with a variable-weight axis.
These files are **git-ignored and generated**: `scripts/copy-script-fonts.mjs` copies them
out of `node_modules` on every `prebuild`/`predev` run (verified just now — the script
prints `[fonts] 12 woff2 files ready in public/fonts/`).
`lib/lang-fonts.ts` maps slug → family and `useLangFont()` injects the `@font-face` only
when a lesson for that script mounts, so no other page pays for it.

#### Flags and script tiles

`components/brand/lang-tile.tsx` renders an inline SVG flag for every language that has one
(no emoji flags anywhere). The four languages without a national flag — Punjabi (Shahmukhi),
Pashto, Sindhi, Balochi — get a neutral script glyph tile: `پنج`, `ښتو`, `سنڌ`, `بلو`.

#### TTS

`lib/tts.ts` exports the pure `chooseTtsLang(codes, available)` helper: it walks the
registry's code list and returns the first voice the device actually has. Where nothing
matches (sd-PK, bal, pa-IN are rarely installed) the lesson shows the friendly
"Audio is device-dependent" note instead of failing.

### Task C — My Languages

- `learningLanguages: string[]`, default `["english"]`, in the player store **and** mirrored
  to `users/{uid}` by `pushLanguagePrefs()`.
- `/learn` (`components/zones/learn-hub-client.tsx`) shows only the learner's languages as
  big cards, plus an "Add a language" tile.
- `/learn/add` (`lang-picker-client.tsx`) is a full-screen picker with search and four
  groups — Popular · Europe · Asia · Middle East · Pakistan & South Asia — each row showing
  the English name, native name, and "300 words · 120 phrases · 60 grammar".
- Removal is a long-press / menu action on the card; progress is kept in `langProgress`.
- Per-language XP, words and level come from `lib/lang-progress.ts` (`langStat`) and render
  on the hub cards and in the profile.
- Home "Continue learning" uses `continueLang()` — the last-played language
  (`lastLearnLang`).
- Bottom tab "Learn" points at the hub.
- The optional leaderboard per-language filter was **not** implemented.

### Task D — SEO

- `app/learn/[lang]/page.tsx` and `app/learn/[lang]/[game]/page.tsx` are SSG via
  `generateStaticParams`: 21 hubs + 147 lesson routes (21 × 7 games), each with unique
  metadata, OG image and JSON-LD (`components/game-jsonld.tsx`).
- `app/sitemap.ts` emits **233 URLs**, including every language hub and lesson route.
- `app/api/og/route.tsx` renders OG images server-side (Node runtime, self-hosted Inter
  WOFF, emoji-free) from `title|game|score|sub` params.
- 3 new blog posts in `data/blog.ts`: `german-seekhne-ke-10-free-games`,
  `apni-zubaan-pashto-punjabi-sindhi-seekho`, `hindi-vs-urdu-kya-farq-hai`.

---

## 2. Verification — what was actually run

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | **0 errors** |
| Unit tests | `npx vitest run` | **326 passed / 11 files, 0 failed** |
| Language schema | `npm run lang:validate` | **OK — 20 packs passed**, exit 0 |
| Production build | `NEXT_PUBLIC_SITE_URL="" npm run build` | **✓ 253 static pages** |
| First-load JS on `/` | build output | **14.3 kB route / 141 kB first load** (budget 170 kB) |
| Shared chunk isolation | build output | 104 kB shared; no language JSON in it |
| HTTP/HTML QA | see §2.3 | **all checks passed** |

Breakdown of the 326: **105 in the 9 files that existed before this branch** (entitlements
24, data-integrity 21, hearts 14, polish 11, utils 9, g2048 8, gamification 7, no-limits 6,
sudoku 5) — all still passing — plus **197 in `tests/languages.test.ts`** and **24 in
`tests/i18n-languages.test.ts`**, both new.

### 2.1 The new validator

`scripts/validate-lang-data.mjs` (wired to `npm run lang:validate`, `--help`-less, accepts
slug arguments) checks every pack for: required top-level fields; a positive integer
`version`; 300 words with all nine fields filled, category and level from the allowed
enums, and no duplicate (word, category) pairs; ≥120 phrases, ≥60 grammar MCQs, 40
sentences, 20 listening items, 10 stories and ≥25 idioms; MCQ sanity (≥2 pairwise-distinct
non-empty options, answer index in range); **script integrity** — the native column must
actually contain the language's script, RTL languages must have no Latin letters leaking
into it, and the roman column must stay Latin-only (tone marks and diacritics allowed); a
Roman Urdu hint that is not just a copy of the English explanation; manifest counts
matching the pack; and a `data/_review/<slug>.md` sheet existing.

I verified the validator catches real faults rather than only passing: injecting a Latin
string into an Urdu word, an Urdu string into a roman field, duplicate MCQ options, an
out-of-range answer index, a missing `version`, and a duplicated `urWhy` produced
**7 problems and exit code 1**; restoring the file returned to exit 0. It also found and
I fixed **8 real grammar rows** (bengali ×2, persian ×3, portuguese, russian, sindhi) whose
Roman Urdu hint was a verbatim copy of the English explanation.

### 2.2 Per-language test assertions

`tests/languages.test.ts` pins all 13 newly authored languages to the full-spec bar
(300/120/60/40/20/10/25) and asserts the list covers exactly 13 slugs, so a pack cannot be
trimmed without a failing test. It also asserts registry ↔ loader ↔ manifest parity, that
every built language has a review sheet, and romanization hygiene.

### 2.3 HTTP/HTML QA (run against `npm start` on the production build)

Every route returned 200: `/`, `/learn`, `/learn/add`, `/profile`, `/progress`,
`/leaderboard`, `/blog`, `/premium`, `/shop`, `/sitemap.xml`, `/robots.txt`; all 21
language hubs; 11 lesson screens covering 6 RTL languages (urdu, pashto, persian, sindhi,
balochi, punjabi), 3 non-Latin scripts (hindi, bengali, russian), english and german; and
all 3 new blog posts. Each lesson page renders its language's script in the server HTML and
carries JSON-LD + an OG image. The home page does not inline any language pack content
(checked for a Russian phrase that would only appear if it did) and loads 18 shared chunks.
`/sitemap.xml` contains all 21 hubs across 233 URLs.

### 2.4 What could NOT be checked here

- **Pixel/layout QA at 360·390·1280, light and dark.** `scripts/browser-qa.mjs` cannot run
  in this sandbox: the bundled `/tmp/chromium` fails with
  `libnspr4.so: cannot open shared object file`, and the three missing libraries
  (`libnspr4`, `libnss3`, `libnssutil3`) are not on the filesystem and cannot be installed —
  `apt-get update` cannot reach the Debian mirrors, and `~/.cache/puppeteer` is empty.
  Console-error, touch-target, contrast and overflow checks therefore did **not** run, and
  neither did onboarding screenshots (§3). This is the one verification gap; everything
  else above was executed.
- **Firestore.** The sandbox blocks Google/Firebase, so `scripts/e2e-firebase.mjs` was not
  run and the rules below are not deployed.
- **RTL direction in the DOM.** Confirmed by code and unit test, not by a rendered page:
  `dir="rtl"` is applied by the client-side `.lesson-scope` wrapper in
  `components/game-shell.tsx` (`dir={lessonDirection(meta.zone, lang)}`) once a lesson
  starts — game engines are loaded with `next/dynamic` `ssr:false` per the project's
  infrastructure rules, so it is legitimately absent from the server HTML. `<html dir>`
  stays `ltr` for an English UI, which is the intended split.

---

## 3. Onboarding screenshots

Not produced — see §2.4. The headless browser required by `scripts/screenshots.mjs` and
`scripts/browser-qa.mjs` cannot start in this environment. The onboarding flow itself is
covered by unit tests in `tests/i18n-languages.test.ts` (default locale `en`, shown once,
`onboarded` flag, add/remove language, `lessonDirection`, `chooseTtsLang` fallback).

---

## 4. Review sheets

30 random entries per language, one file per language, generated by the build:

```
data/_review/
  arabic.md      balochi.md     bengali.md     chinese.md     french.md
  german.md      hindi.md       italian.md     japanese.md    korean.md
  malay.md       pashto.md      persian.md     portuguese.md  punjabi.md
  russian.md     sindhi.md      spanish.md     turkish.md     urdu.md
```

20 sheets — one for every non-English language. `tests/languages.test.ts` fails if any
built pack loses its sheet.

---

## 5. ⚠️ Firestore rules must be re-published

`firestore.rules` gained four client-writable fields on `users/{uid}`. Until the rules are
re-published, signed-in users will get `PERMISSION_DENIED` when the app syncs their
language preferences.

```diff
@@ -29,7 +29,9 @@ service cloud.firestore {
            'updatedAt','createdAt','rewards','lastActive',
            // monetization rebuild — client-writable comfort state
            'hearts','heartsState','heartsAt','mistakes','frame','themeSkin','cosmetics','downloads',
-           'premiumCycle','allowance','freezesUsedThisMonth','repairsUsedThisMonth','certificates'])
+           'premiumCycle','allowance','freezesUsedThisMonth','repairsUsedThisMonth','certificates',
+           // 21-language rebuild — UI locale + the learner's language list
+           'learningLanguages','langProgress','lastLearnLang','onboarded'])
```

Re-publish with:

```sh
firebase deploy --only firestore:rules
```

Note that `lib/sync.ts` also writes `users/{uid}.lang`; if that field is not already in the
allow-list on your live rules, add it in the same pass.

---

## 6. Infrastructure rules respected

- `lib/env.ts` helpers used for all env access in server code; client code uses
  `process.env.X || ""`.
- Canvas/scene code only via `next/dynamic` with `ssr:false` behind `SceneBoundary`.
- Zustand selectors return primitives.
- `lib/auth.tsx` untouched; security headers untouched.
- All four script fonts self-hosted as WOFF2 subsets — no font CDNs.
- Design tokens untouched: light `#FAFAF7` default + dark, brand `#178A55`, saffron
  `#F5A524`, Nunito/Inter/Noto Nastaliq, lucide icons, chunky buttons, Ustad owl.
- Nothing is paywalled or rate-limited; `tests/no-limits.test.ts` still passes.

## 7. Commit history

The work was built up over nine commits (platform scaffolding → German/Urdu/Punjabi/Pashto
→ Sindhi/Balochi → Persian/Hindi → Italian/Portuguese → Russian → Bengali/Russian/Malay +
validator → typecheck fix → this report). When the sandbox rolled the branch pointer back
to the base commit those commit objects became unreachable while the files survived in the
working tree, so the whole change set was re-committed as one:

```
ce4bf83 feat: 21-language platform — English-default UI, My Languages hub, 13 full-spec packs, SEO + validation
c7fbd52 Merge pull request #5 from Learningandplaypk/arena/01a081d4-learning-play-pk   ← base
```

## 8. Commands for the next developer

```sh
npm ci
npm run lang:build            # regenerate every pack from scripts/lang-src/*.txt
npm run lang:validate         # schema + content + script-integrity validation
npm run typecheck && npm test
NEXT_PUBLIC_SITE_URL="" npm run build
node scripts/browser-qa.mjs --w=390 --lang=ur --shot   # needs a working chromium
```
