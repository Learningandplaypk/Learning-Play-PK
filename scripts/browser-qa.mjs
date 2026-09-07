/* Headless browser QA — console errors + layout + touch targets + contrast.
 *
 * Usage: node scripts/browser-qa.mjs [--shot] [--w=390] [--h=844] [--theme=light] [paths...]
 * Exit code 1 when any route fails.
 */
import chromium_ from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const chromium = chromium_.default ?? chromium_;

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split("=")[1] : d;
};
const shot = argv.includes("--shot");
const w = Number(opt("w", 390));
const h = Number(opt("h", 844));
const theme = opt("theme", "light");
const paths = argv.filter((a) => !a.startsWith("--"));
const routes = paths.length
  ? paths
  : [
      "/",
      "/styleguide",
      "/learn",
      "/learn/english",
      "/learn/english/word-builder",
      "/brain",
      "/brain/memory",
      "/quiz",
      "/quiz/gk",
      "/quiz/millionaire",
      "/fun",
      "/fun/snake3d",
      "/fun/tetris",
      "/fun/racing",
      "/fun/tictactoe",
      "/profile",
      "/leaderboard",
      "/premium",
      "/shop",
      "/login",
      "/signup",
      "/blog",
      "/blog/streak-psychology",
      "/about",
      "/privacy",
      "/terms",
      "/refund-policy",
      "/contact",
      "/offline",
    ];

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--enable-unsafe-swiftshader"],
  headless: true,
  defaultViewport: { width: w, height: h },
});

if (shot) await mkdir("shots", { recursive: true });

/* ---------- in-page audits ---------- */
const audits = () => {
  const out = { overflow: 0, smallTargets: [], lowContrast: [], missingLabels: [] };
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((v) => parseFloat(v));
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const bgOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.5) return c;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  if (document.documentElement.scrollWidth > window.innerWidth + 1) {
    out.overflow = document.documentElement.scrollWidth;
  }

  const interactive = Array.from(document.querySelectorAll("a,button,input,select,textarea,[role='button']"));
  for (const el of interactive) {
    const cs0 = getComputedStyle(el);
    if (cs0.visibility === "hidden" || cs0.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width <= 2 || r.height <= 2) continue; // visually-hidden (skip link etc.)
    if (r.height < 44 || r.width < 44) {
      // inline links inside a paragraph are allowed to be smaller
      const inlineLink =
        ["A", "BUTTON"].includes(el.tagName) &&
        getComputedStyle(el).display.includes("inline") &&
        !!el.parentElement?.tagName.match(/^(P|LI|SPAN|TD|H[1-6]|DIV)$/) &&
        (el.textContent || "").trim().length > 0;
      if (!inlineLink) out.smallTargets.push(`${el.tagName}.${(el.className || "").toString().slice(0, 40)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
    const iconOnly = el.matches("button") && !label && !el.getAttribute("title");
    if (iconOnly) out.missingLabels.push(el.outerHTML.slice(0, 80));
  }

  const texts = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,li,span,a,button,label,td,th,summary"));
  for (const el of texts) {
    const txt = (el.textContent || "").trim();
    if (!txt || txt.length < 2) continue;
    if (el.children.length > 0 && el.childNodes[0]?.nodeType !== 3) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.5) continue;
    const fg = parse(cs.color);
    if (!fg || fg.a < 0.5) continue;
    const bg = bgOf(el);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const cr = ratio(fg, bg);
    if (cr < need) out.lowContrast.push(`${el.tagName} "${txt.slice(0, 30)}" ${cs.color} on rgb(${bg.r},${bg.g},${bg.b}) = ${cr.toFixed(2)} (needs ${need})`);
  }
  return out;
};

let failed = false;
for (const route of routes) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("[console.error] " + m.text());
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem("learnplay-theme", t);
    } catch {}
  }, theme);
  await page.goto("http://localhost:3000" + route, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => errors.push("[goto] " + e.message));
  await new Promise((r) => setTimeout(r, 1800));
  const appErr = await page
    .evaluate(() => /Application error/i.test(document.body?.innerText ?? ""))
    .catch(() => false);
  const res = await page.evaluate(audits).catch((e) => ({ error: e.message }));

  const problems = [];
  if (errors.length) problems.push(...errors.slice(0, 4));
  if (appErr) problems.push("APP-ERROR-SCREEN");
  if (res.error) problems.push("[audit] " + res.error);
  if (res.overflow) problems.push(`horizontal overflow: ${res.overflow}px > ${w}px`);
  if (res.smallTargets?.length) problems.push(`small tap targets (${res.smallTargets.length}): ` + res.smallTargets.slice(0, 3).join(" | "));
  if (res.missingLabels?.length) problems.push(`unlabelled buttons (${res.missingLabels.length}): ` + res.missingLabels.slice(0, 2).join(" | "));
  if (res.lowContrast?.length) problems.push(`low contrast (${res.lowContrast.length}): ` + res.lowContrast.slice(0, 3).join(" | "));

  if (problems.length) failed = true;
  console.log(`\n### ${route} — ${problems.length ? "ISSUES" : "CLEAN ✓"}`);
  problems.forEach((p) => console.log("   " + p.slice(0, 300)));

  if (shot) {
    const name = (route === "/" ? "home" : route.replaceAll("/", "_").replace(/^_/, "")) + `-${theme}-${w}`;
    await page.screenshot({ path: `shots/${name}.png` });
  }
  await page.close();
}

await browser.close();
console.log(failed ? "\nQA FAILED" : "\nQA PASSED — all routes clean");
process.exit(failed ? 1 : 0);
