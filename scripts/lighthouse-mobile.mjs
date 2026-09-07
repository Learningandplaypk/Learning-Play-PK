/* Lighthouse MOBILE audit against the running production server.
   Usage: LD_LIBRARY_PATH=/tmp/libs/lib CHROME_PATH=/tmp/chromium \
            node scripts/lighthouse-mobile.mjs [path]
   Needs: npm i --no-save lighthouse chrome-launcher
   Prints the four category scores + the PWA/SEO/A11y/BP audit failures. */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import fs from "node:fs/promises";

const path = process.argv[2] ?? "/";
const origin = process.env.BASE ?? "http://127.0.0.1:3000";
const url = `${origin}${path}`;

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});

const result = await lighthouse(
  url,
  { port: chrome.port, output: "json", logLevel: "error" },
  undefined
);

const lhr = result.lhr;
const cats = lhr.categories;
const lines = [];
lines.push(`URL ${url}  (mobile emulation, Lighthouse ${lhr.lighthouseVersion})`);
for (const key of ["performance", "accessibility", "best-practices", "seo"]) {
  const c = cats[key];
  if (!c) continue;
  lines.push(`${c.title.padEnd(16)} ${Math.round(c.score * 100)}`);
}
if (cats.pwa) lines.push(`${cats.pwa.title.padEnd(16)} ${Math.round(cats.pwa.score * 100)}`);

lines.push("\n--- failing audits ---");
for (const key of ["accessibility", "best-practices", "seo"]) {
  const c = cats[key];
  if (!c) continue;
  for (const ref of c.auditRefs) {
    const a = lhr.audits[ref.id];
    if (a && a.score !== null && a.score < 1) {
      lines.push(`[${key}] ${a.id}: ${a.title} (score ${a.score})`);
    }
  }
}
lines.push("\n--- perf metrics ---");
for (const id of [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
]) {
  const a = lhr.audits[id];
  if (a) lines.push(`${a.title}: ${a.displayValue ?? a.numericValue}`);
}

const out = lines.join("\n");
console.log(out);
await fs.mkdir("reports", { recursive: true });
const prefix = process.env.OUT_PREFIX ?? "";
const slug = (path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "_")) + prefix;
await fs.writeFile(`reports/lighthouse-mobile-${slug}.json`, JSON.stringify(lhr, null, 0));
await fs.writeFile(`reports/lighthouse-mobile-${slug}.txt`, out + "\n");

await chrome.kill();
