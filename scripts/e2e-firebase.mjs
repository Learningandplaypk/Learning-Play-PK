/**
 * Learn & Play PK — Full Firebase E2E flow (headless Chromium)
 *
 * Runs the complete loop against the REAL Firebase project (uses .env.local):
 *   1. Seeds guest progress in localStorage (pre-login)
 *   2. Email signup → lands on /profile (logged in)
 *   3. Verifies users/{uid} in Firestore — guest XP/results MERGED into the new doc
 *   4. Logout → Google login popup loads accounts.google.com (no auth/unauthorized-domain)
 *   5. Seeds fresh guest progress → login again → merge-on-login branch verified
 *   6. Plays Reaction game via real UI clicks → XP/coins awarded
 *   7. Verifies users/{uid} updated AND leaderboards/reaction/scores contains the score
 *   8. Screenshots: logged-in profile + Google popup → shots/
 *
 * Usage:  node scripts/e2e-firebase.mjs
 * Needs:  npm i  (puppeteer + firebase are already in package.json)
 *         Firebase console: Email/Password + Google providers enabled,
 *         localhost is authorized by default; add your preview domain in
 *         Authentication → Settings → Authorized domains.
 */
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

/* ── config from .env.local ─────────────────────────────────────────── */
function readEnvLocal() {
  const raw = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^(NEXT_PUBLIC_FIREBASE_[A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}
const ENV = readEnvLocal();
const cfg = {
  apiKey: ENV.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (!cfg.apiKey || !cfg.projectId) {
  console.error("❌ .env.local missing NEXT_PUBLIC_FIREBASE_* keys");
  process.exit(1);
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const TEST_NAME = "QA E2E";
const TEST_EMAIL = process.env.E2E_EMAIL ?? "qa.e2e@learnplaypk.com";
const TEST_PASS = process.env.E2E_PASS ?? "QaE2E!pass2026";

const results = [];
const step = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

/* ── firebase client (for Firestore verification reads) ─────────────── */
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

const serialize = (v) =>
  JSON.parse(JSON.stringify(v, (_k, val) => (typeof val?.toDate === "function" ? val.toDate().toISOString() : val)));

async function readUserDoc(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? serialize(snap.data()) : null;
}

async function loginClient() {
  const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASS);
  return cred.user.uid;
}

/* ── guest seed payload (matches zustand persist shape, version 0) ──── */
function guestSeed(xp, coins, score) {
  return JSON.stringify({
    state: {
      uid: null,
      name: "Guest Khiladi",
      avatar: "🦊",
      xp,
      coins,
      streak: 2,
      bestStreak: 3,
      badges: ["first-win"],
      wordsLearned: ["book"],
      quizCorrect: 4,
      perfectScores: 1,
      results: [{ slug: "g2048", zone: "brain", score, maxScore: 500, xp: 40, at: Date.now() - 60000 }],
    },
    version: 0,
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── main ───────────────────────────────────────────────────────────── */
fs.mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage();
page.setDefaultTimeout(60000);
let uid = null;

try {
  /* 1 ─ guest seed */
  await page.goto(BASE + "/", { waitUntil: "networkidle2" });
  await page.evaluate((seed) => localStorage.setItem("learnplay-player", seed), guestSeed(120, 55, 123));
  await page.reload({ waitUntil: "networkidle2" });
  step("Guest progress seeded in localStorage", true, "xp 120, coins 55, 1 result");

  /* 2 ─ email signup */
  await page.goto(BASE + "/signup", { waitUntil: "networkidle2" });
  await page.type('input[placeholder="Aapka naam"]', TEST_NAME);
  await page.type('input[type="email"]', TEST_EMAIL);
  await page.type('input[type="password"]', TEST_PASS);
  await page.click("button.btn-neon");
  try {
    await page.waitForFunction(() => location.pathname === "/profile", { timeout: 30000 });
    step("Email signup → logged in → /profile", true);
  } catch {
    const err = await page.evaluate(() => [...document.querySelectorAll("p")].find((p) => p.innerText.includes("⚠️"))?.innerText ?? "no error shown");
    const loggedIn = await page.evaluate(() => document.body.innerText.includes("Logout"));
    step("Email signup → logged in → /profile", loggedIn, loggedIn ? "(already had account)" : String(err));
  }
  await sleep(3000); // allow onAuthStateChanged + ensureUserDoc

  uid = await page.evaluate(() => JSON.parse(localStorage.getItem("learnplay-player")).state.uid);
  step("Firebase uid stored in app state", !!uid && !String(uid).startsWith("guest"), uid ?? "null");

  /* 3 ─ Firestore users/{uid}: exists + guest merge */
  const doc1 = uid ? await readUserDoc(uid) : null;
  step("users/{uid} document created in Firestore", !!doc1, doc1 ? `xp=${doc1.xp} coins=${doc1.coins}` : "MISSING");
  const merged = !!doc1 && doc1.xp >= 120 && (doc1.results ?? []).some((r) => r.slug === "g2048");
  step("Guest progress merged on first login (xp≥120 + g2048 result)", merged, doc1 ? `results=${(doc1.results ?? []).map((r) => r.slug).join(",")}` : "");

  /* screenshot: logged-in profile */
  await page.goto(BASE + "/profile", { waitUntil: "networkidle2" });
  await sleep(2500);
  await page.screenshot({ path: "shots/e2e-profile-logged-in.png", fullPage: false });
  console.log("   📸 shots/e2e-profile-logged-in.png");

  /* 4 ─ logout */
  const logoutClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Logout"));
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(2500);
  step("Logout works", logoutClicked);

  /* 5 ─ Google popup loads (no auth/unauthorized-domain) */
  await page.goto(BASE + "/login", { waitUntil: "networkidle2" });
  const popupPromise = page.waitForPopup({ timeout: 20000 }).catch(() => null);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Google"));
    btn?.click();
  });
  const popup = await popupPromise;
  if (popup) {
    await popup.waitForFunction(() => document.readyState === "complete").catch(() => {});
    await sleep(3000);
    const url = popup.url();
    const bodyText = await popup.evaluate(() => document.body?.innerText?.slice(0, 400) ?? "").catch(() => "");
    const unauthorized = /unauthorized-domain|auth\/unauthorized-domain/i.test(url + bodyText);
    step("Google login popup loads", /accounts\.google\.com|google\.com\/o\/oauth2/i.test(url), url.slice(0, 90));
    step("No auth/unauthorized-domain error", !unauthorized, unauthorized ? "ADD DOMAIN TO AUTHORIZED DOMAINS" : "clean");
    await page.screenshot({ path: "shots/e2e-google-popup.png" });
    console.log("   📸 shots/e2e-google-popup.png");
    await popup.close().catch(() => {});
  } else {
    step("Google login popup loads", false, "popup blocked by headless — try non-headless or verify manually");
    step("No auth/unauthorized-domain error", false, "could not open popup");
  }

  /* 5b ─ fresh guest seed → login again → merge-on-login branch */
  await page.evaluate((seed) => localStorage.setItem("learnplay-player", seed), guestSeed(300, 99, 200));
  await page.goto(BASE + "/login", { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', TEST_EMAIL);
  await page.type('input[type="password"]', TEST_PASS);
  await page.click("button.btn-neon");
  await page.waitForFunction(() => location.pathname === "/profile", { timeout: 30000 }).catch(() => {});
  await sleep(3500);
  const doc2 = uid ? await readUserDoc(uid) : null;
  const mergedAgain = !!doc2 && doc2.xp >= 300;
  step("Merge-on-login (2nd login, guest xp 300 → cloud)", mergedAgain, doc2 ? `cloud xp=${doc2.xp}` : "no doc");

  /* 6 ─ play Reaction game via real UI clicks */
  await page.goto(BASE + "/brain/reaction", { waitUntil: "networkidle2" });
  await sleep(1500);
  // game-shell start screen
  const startClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /start|shuru/i.test(b.innerText) && !b.disabled);
    if (btn) { btn.click(); return true; }
    return false;
  });
  for (let round = 0; round < 5; round++) {
    await page.evaluate(() => new Promise((resolve) => {
      const findBtn = () => [...document.querySelectorAll("button")].find((b) => /Tap shuru|Phir se tap/.test(b.innerText));
      const begin = findBtn();
      if (begin) begin.click();
      const iv = setInterval(() => {
        const go = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("TAP!"));
        if (go) { clearInterval(iv); go.click(); resolve(); }
      }, 25);
    }));
    await sleep(400);
  }
  step("Reaction game played (5 rounds via UI clicks)", startClicked);
  // wait for local record + Firestore push
  await page.waitForFunction(
    () => { const s = JSON.parse(localStorage.getItem("learnplay-player") ?? "{}").state ?? {}; return (s.results ?? []).some((r) => r.slug === "reaction"); },
    { timeout: 20000 }
  ).catch(() => {});
  await sleep(5000); // pushProgressToFirestore

  /* 7 ─ Firestore verification: user doc + leaderboard */
  const doc3 = uid ? await readUserDoc(uid) : null;
  const reactionRec = doc3?.results?.find((r) => r.slug === "reaction");
  step("users/{uid} updated with game XP", !!reactionRec, doc3 ? `xp=${doc3.xp} coins=${doc3.coins} results=${doc3.results.map((r) => r.slug).join(",")}` : "no doc");

  const lb = query(collection(db, "leaderboards", "reaction", "scores"), where("uid", "==", uid ?? "_"));
  const lbSnap = await getDocs(lb);
  const lbRow = lbSnap.docs.map((d) => serialize(d.data()))[0];
  step("leaderboards/reaction/scores has the score", !!lbRow, lbRow ? `score=${lbRow.score}` : "missing");

  /* final artifacts */
  if (doc3) {
    fs.writeFileSync("shots/firestore-users-doc.json", JSON.stringify(doc3, null, 2));
    console.log("\n📄 Firestore users/" + uid + " →");
    console.log(JSON.stringify(doc3, null, 2).slice(0, 1200));
  }
  await page.goto(BASE + "/profile", { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({ path: "shots/e2e-profile-final.png" });
} catch (e) {
  console.error("SCRIPT ERROR:", e.message);
  await page.screenshot({ path: "shots/e2e-error.png" }).catch(() => {});
} finally {
  try { if (uid) { await loginClient().catch(() => {}); } } catch {}
  try { await signOut(auth); } catch {}
  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n===== E2E SUMMARY: ${passed}/${results.length} passed =====`);
  process.exit(passed === results.length ? 0 : 1);
}
