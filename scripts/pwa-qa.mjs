/* PWA QA — Lighthouse 13 dropped the "PWA" category, so this checks the
 * installability requirements directly against the production build:
 *   1. manifest links + fields (name, icons, display, theme/background)
 *   2. maskable + apple-touch icons resolve
 *   3. service worker registers and caches the offline shell
 *   4. a reload with the network switched off still renders the app
 *   5. /offline renders when the shell is missing
 *
 * Usage: LD_LIBRARY_PATH=/tmp/libs/lib node scripts/pwa-qa.mjs
 */
import chromium_ from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const chromium = chromium_.default ?? chromium_;
const BASE = "http://127.0.0.1:3000";
const fails = [];

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--enable-unsafe-swiftshader"],
  headless: true,
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => fails.push(`pageerror: ${String(e).slice(0, 160)}`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 1 + 2 ------------------------------------------------------------- */
await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
const manifestHref = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? null);
if (!manifestHref) fails.push("no <link rel=manifest>");
const manifest = manifestHref ? await (await fetch(BASE + manifestHref)).json() : {};
for (const key of ["name", "short_name", "start_url", "display", "theme_color", "background_color", "icons"]) {
  if (!manifest[key]) fails.push(`manifest missing ${key}`);
}
if (!manifest.icons?.some((i) => (i.purpose ?? "").includes("maskable"))) fails.push("no maskable icon");
if (!manifest.icons?.some((i) => i.sizes === "192x192") || !manifest.icons?.some((i) => i.sizes === "512x512")) {
  fails.push("missing 192/512 icon");
}
for (const icon of ["/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/apple-touch-icon.png"]) {
  const res = await fetch(BASE + icon);
  if (!res.ok) fails.push(`${icon} → ${res.status}`);
}
const themeMeta = await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.content ?? null);
if (!themeMeta) fails.push("no theme-color meta");

/* 3 ------------------------------------------------------------------ */
const swReady = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "unsupported";
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.active ? "active" : "registered";
  } catch (e) {
    return "error: " + e.message;
  }
});
if (!["active", "registered"].includes(swReady)) fails.push(`service worker: ${swReady}`);

// give the SW a moment to pre-cache the shell, then warm the extra routes
await sleep(1500);
for (const route of ["/learn", "/fun", "/profile", "/leaderboard", "/premium", "/offline"]) {
  await page.goto(BASE + route, { waitUntil: "networkidle2" }).catch(() => {});
}
await sleep(1200);

/* 4 ------------------------------------------------------------------ */
await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
await page.setOfflineMode(true);
let offlineOk = false;
try {
  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  await sleep(800);
  offlineOk = await page.evaluate(() => {
    const t = document.body.innerText;
    return t.length > 200 && !/Application error|This site can’t be reached|No internet/i.test(t);
  });
} catch (e) {
  offlineOk = false;
}
if (!offlineOk) fails.push("home does not render offline");

let offlineRouteOk = false;
try {
  await page.goto(`${BASE}/offline`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await sleep(500);
  offlineRouteOk = await page.evaluate(() => /offline/i.test(document.body.innerText));
} catch {
  offlineRouteOk = false;
}
if (!offlineRouteOk) fails.push("/offline does not render offline");
await page.setOfflineMode(false);

await browser.close();

console.log(`manifest: ${manifest.short_name} · display=${manifest.display} · theme=${manifest.theme_color} · icons=${manifest.icons.length}`);
console.log(`service worker: ${swReady}`);
console.log(`offline home: ${offlineOk ? "renders ✓" : "FAIL"} · /offline: ${offlineRouteOk ? "renders ✓" : "FAIL"}`);
if (fails.length) {
  console.log(`\nPWA QA FAILED (${fails.length})`);
  for (const f of fails) console.log(" -", f);
  process.exit(1);
}
console.log("\nPWA QA PASSED");
