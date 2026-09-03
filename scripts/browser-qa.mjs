/* Headless browser QA: capture console errors + uncaught exceptions + screenshots.
 * Usage: node scripts/browser-qa.mjs [--shot] [paths...]
 */
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const shot = process.argv.includes("--shot");
const routes = paths.length ? paths : ["/"];

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--single-process", "--enable-webgl", "--enable-unsafe-swiftshader"],
  headless: true,
  defaultViewport: { width: 1366, height: 900 },
});

let failed = false;
for (const route of routes) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("[console.error] " + m.text());
  });
  page.on("pageerror", (e) => errors.push("[pageerror] " + e.message + "\n" + (e.stack ?? "").split("\n").slice(0, 4).join("\n")));
  await page.goto("http://localhost:3000" + route, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => errors.push("[goto] " + e.message));
  await new Promise((r) => setTimeout(r, 5000));
  const appErr = await page
    .evaluate(() => /Application error/i.test(document.body?.innerText ?? ""))
    .catch((e) => {
      errors.push("[evaluate] " + e.message);
      return false;
    });
  if (errors.length || appErr) failed = true;
  console.log(`\n### ${route} — ${errors.length === 0 && !appErr ? "CLEAN ✓" : "ERRORS:" + errors.length + (appErr ? " +APP-ERROR-SCREEN" : "")}`);
  errors.slice(0, 6).forEach((e) => console.log(e.slice(0, 1200)));
  if (shot) {
    const name = route === "/" ? "home" : route.replaceAll("/", "_").replace(/^_/, "");
    await page.screenshot({ path: `shots/${name}.png` });
    console.log("screenshot: shots/" + name + ".png");
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
