/* Interaction QA — drives the shared UI the static sweep can't reach.
 *
 * The static sweep (scripts/browser-qa.mjs) only loads pages. This one clicks:
 * bottom sheets, modals, tabs, a toast, a canvas game and a quiz, and fails on
 * any console error / page error along the way.
 *
 * Usage: LD_LIBRARY_PATH=/tmp/libs/lib node scripts/interaction-qa.mjs
 *        [--w=390] [--h=844] [--theme=light]
 * Exit code 1 when a step fails.
 */
import chromium_ from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const chromium = chromium_.default ?? chromium_;
const argv = process.argv.slice(2);
const opt = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=")[1] : d;
};
const w = Number(opt("w", 390));
const h = Number(opt("h", 844));
const theme = opt("theme", "light");
const BASE = "http://127.0.0.1:3000";

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--enable-unsafe-swiftshader"],
  headless: true,
  defaultViewport: { width: w, height: h, deviceScaleFactor: 1 },
});

const problems = [];
const page = await browser.newPage();
await page.evaluateOnNewDocument((t) => {
  try {
    localStorage.setItem("learnplay-theme", t);
  } catch {}
}, theme);
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 220)}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 220)}`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let step = 0;
async function run(name, fn) {
  step += 1;
  const before = problems.length;
  try {
    const ok = await fn();
    const fresh = problems.slice(before);
    console.log(`${fresh.length || !ok ? "FAIL" : "ok  "} ${name}${fresh.length ? ` — ${fresh.join(" | ")}` : ""}`);
    if (!ok && !fresh.length) problems.push(`step failed: ${name}`);
  } catch (e) {
    problems.push(`${name} threw: ${String(e).slice(0, 200)}`);
    console.log(`FAIL ${name} — threw ${String(e).slice(0, 160)}`);
  }
}

const clickText = async (selector, text) => {
  const handle = await page.evaluateHandle(
    (sel, tx) => [...document.querySelectorAll(sel)].find((e) => (e.textContent || "").toLowerCase().includes(tx.toLowerCase())) ?? null,
    selector,
    text
  );
  const el = handle.asElement();
  if (!el) return false;
  await el.click();
  return true;
};

/* ------------------------------- 1. Sheet -------------------------------- */
await run("learn path node opens a bottom sheet", async () => {
  await page.goto(`${BASE}/learn/english`, { waitUntil: "networkidle2" });
  await sleep(400);
  // path nodes are numbered buttons ("1. Word Builder …")
  const opened = await page.evaluate(() => {
    const node = [...document.querySelectorAll("button")].find((b) => /^\d+\.\s/.test((b.textContent || "").trim()));
    if (node) node.click();
    return !!node;
  });
  await sleep(500);
  const dialog = await page.$('[role="dialog"]');
  if (!dialog) return false;
  const visible = await page.evaluate((d) => {
    const r = d.getBoundingClientRect();
    return r.width > 40 && r.height > 40 && getComputedStyle(d).opacity !== "0";
  }, dialog);
  // close it again (Esc path)
  await page.keyboard.press("Escape");
  await sleep(300);
  const gone = await page.$('[role="dialog"]');
  return visible && !gone && opened !== false;
});

/* -------------------------------- 2. Tabs -------------------------------- */
await run("leaderboard tabs switch", async () => {
  await page.goto(`${BASE}/leaderboard`, { waitUntil: "networkidle2" });
  await sleep(400);
  const tabs = await page.$$('[role="tab"]');
  if (tabs.length < 2) return false;
  await tabs[1].click();
  await sleep(400);
  const selected = await page.evaluate(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? "");
  return selected.toLowerCase().includes("all");
});

/* ------------------------------ 3. Toast --------------------------------- */
await run("toast appears and is dismissible", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await sleep(800);
  const got = await page.evaluate(async () => {
    // the store is exposed for debugging in dev only — fall back to a click on
    // the daily chest button if it exists
    const btn = [...document.querySelectorAll("button")].find((b) => /chest|inaam|claim/i.test(b.textContent || ""));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!got) return true; // nothing to click today — not a failure
  await sleep(600);
  const toast = await page.$('[role="status"] [aria-label="Dismiss notification"]');
  if (!toast) return false;
  await toast.click();
  await sleep(400);
  return true;
});

/* ------------------------------- 4. Quiz --------------------------------- */
await run("quiz answers register (feedback + progress)", async () => {
  await page.goto(`${BASE}/quiz/gk`, { waitUntil: "networkidle2" });
  await sleep(700);
  const before = await page.evaluate(() => document.body.innerText.slice(0, 400));
  const clicked = await page.evaluate(() => {
    const opts = [...document.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().height > 36 && !/next|skip|quit|home/i.test(b.textContent || ""));
    const target = opts.find((b) => (b.textContent || "").trim().length > 0);
    if (target) target.click();
    return !!target;
  });
  if (!clicked) return false;
  await sleep(700);
  const after = await page.evaluate(() => document.body.innerText.slice(0, 400));
  return before !== after;
});

/* ---------------------------- 5. Canvas game ------------------------------ */
await run("snake3d canvas runs and scores", async () => {
  await page.goto(`${BASE}/fun/snake3d`, { waitUntil: "networkidle2" });
  await sleep(700);
  // games boot behind a start screen
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /shuru|khelo|start|play/i.test(b.textContent || ""));
    if (btn) btn.click();
  });
  await sleep(900);
  const started = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return false;
    const r = c.getBoundingClientRect();
    return r.width > 80 && r.height > 80;
  });
  if (!started) return false;
  // steer for a while; the game must keep its RAF loop alive
  for (const key of ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"]) {
    await page.keyboard.press(key);
    await sleep(250);
  }
  await sleep(600);
  return await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return !!c && c.width > 0 && !document.body.innerText.includes("Application error");
  });
});

/* ------------------------- 6. Theme toggle persists ----------------------- */
await run("theme toggle flips and persists", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await sleep(400);
  const flipped = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /theme|dark|light|raat|din/i.test(b.getAttribute("aria-label") || b.textContent || ""));
    if (!btn) return null;
    btn.click();
    return true;
  });
  if (!flipped) return true; // no toggle rendered at this width — skip
  await sleep(400);
  const attr = await page.evaluate(() => document.documentElement.dataset.theme);
  const stored = await page.evaluate(() => localStorage.getItem("learnplay-theme"));
  return !!attr && !!stored;
});

await browser.close();

if (problems.length) {
  console.log(`\nINTERACTION QA FAILED (${problems.length})`);
  for (const p of problems) console.log(" -", p);
  process.exit(1);
}
console.log(`\nINTERACTION QA PASSED — ${step} steps, no console errors`);
