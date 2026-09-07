/* Screenshot harness — full-page PNGs of a running build, one theme + width at
 * a time. Used for the redesign before/after comparison.
 *
 * Usage: LD_LIBRARY_PATH=/tmp/libs/lib node scripts/screenshots.mjs \
 *          --base=http://127.0.0.1:3000 --w=390 --h=844 --theme=light \
 *          --out=shots/after [paths...]
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
const base = opt("base", "http://127.0.0.1:3000");
const w = Number(opt("w", 390));
const h = Number(opt("h", 844));
const theme = opt("theme", "light");
const out = opt("out", "shots/after");
const wait = Number(opt("wait", 900));
const paths = argv.filter((a) => !a.startsWith("--"));
const routes = paths.length ? paths : ["/", "/learn", "/fun", "/profile", "/premium", "/leaderboard", "/login"];

await mkdir(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--enable-unsafe-swiftshader"],
  headless: true,
  defaultViewport: { width: w, height: h, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.evaluateOnNewDocument((t) => {
  try {
    localStorage.setItem("learnplay-theme", t);
  } catch {}
}, theme);

for (const route of routes) {
  const name = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
  const errors = [];
  const onErr = (m) => m.type() === "error" && errors.push(m.text().slice(0, 120));
  const onFail = (e) => errors.push(String(e).slice(0, 120));
  page.on("console", onErr);
  page.on("pageerror", onFail);
  try {
    await page.goto(base + route, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({ path: `${out}/${name}-${theme}-${w}.png`, fullPage: true });
    console.log(`${out}/${name}-${theme}-${w}.png ${errors.length ? "ERRORS: " + errors.join(" | ") : "clean"}`);
  } catch (e) {
    console.log(`${name} FAILED ${String(e).slice(0, 120)}`);
  }
  page.off("console", onErr);
  page.off("pageerror", onFail);
}

await browser.close();
