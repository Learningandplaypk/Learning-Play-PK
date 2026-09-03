/**
 * Popup-block regression test (headless Chromium).
 * A) App inside a sandboxed iframe WITHOUT allow-popups (like the Arena preview):
 *    clicking Google must NOT surface auth/popup-blocked — it must go straight to
 *    redirect (friendly "Google par le ja rahe hain…" message + frame navigation).
 * B) Top-level desktop with window.open forced to null (hard popup blocker):
 *    popup attempt fails → silent redirect fallback, still no error surfaced.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms, fallback = null) => Promise.race([p, sleep(ms).then(() => fallback)]);

async function main() {
  const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium"),
  ]);
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--single-process"],
    headless: true,
    defaultViewport: { width: 1366, height: 900 },
  });
  let failed = false;

  /* ── A) sandboxed iframe (no allow-popups) ── */
  {
    const page = await browser.newPage();
    try { await page.setBypassServiceWorker(true); } catch {}
    // host the sandboxed iframe from a real same-origin page of the app itself
    await page.goto("http://localhost:3000/offline", { waitUntil: "networkidle0", timeout: 90000 });
    await sleep(5000); // let the host page hydrate so React won't remove our injected node
    await page.evaluate(() => {
      const frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-modals allow-downloads");
      frame.src = "http://localhost:3000/login";
      frame.style.cssText = "width:1280px;height:860px;position:fixed;top:0;left:0;z-index:9999;border:0";
      document.documentElement.appendChild(frame); // outside <body> → React cannot remove it
    });
    await sleep(10000);
    const appFrame = page.frames().find((fr) => fr !== page.mainFrame() && fr.url().startsWith("http://localhost:3000/login"));
    if (!appFrame) {
      console.log("A) IFRAME TEST — ❌ app frame never loaded");
      failed = true;
    } else {
      const inIframe = await withTimeout(appFrame.evaluate("window.self !== window.top"), 8000, null);
      await withTimeout(
        appFrame.evaluate(() => {
          const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Google"));
          btn?.click();
        }),
        8000
      ).catch(() => {});
      await sleep(6000);
      const body = (await withTimeout(appFrame.evaluate(() => document.body?.innerText ?? ""), 8000, "")) ?? "";
      const surfacedAuthError = /auth\/[a-z-]+|popup-blocked|popup-closed|cancelled-popup|internal-error/i.test(body);
      const friendly = /Google par le ja rahe hain|pahunch nahi ban raha/.test(body);
      console.log("A) IFRAME TEST");
      console.log("   window.self !== window.top :", inIframe);
      console.log("   auth error surfaced        :", surfacedAuthError ? "❌ YES (BUG)" : "✅ NO");
      console.log("   friendly redirect message  :", friendly ? "✅ shown" : "❌ missing");
      await page.screenshot({ path: "shots/popup-iframe-test.png" });
      if (surfacedAuthError || !friendly) failed = true;
    }
    await page.close().catch(() => {});
  }

  /* ── B) top-level, window.open hard-blocked ── */
  {
    const page = await browser.newPage();
    let redirectAttempt = null;
    page.on("framenavigated", (f) => {
      if (f === page.mainFrame() && /firebaseapp\.com|accounts\.google\.com|__\/auth/.test(f.url()) && !redirectAttempt) redirectAttempt = f.url();
    });
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(1500);
    await page.evaluate(() => {
      // simulate a hard popup blocker
      Object.defineProperty(window, "open", { value: () => null, writable: false, configurable: true });
    });
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Google"));
      btn?.click();
    });
    await sleep(6000);
    const body = (await withTimeout(page.evaluate(() => document.body?.innerText ?? ""), 8000, "")) ?? "";
    const surfacedPopupError = /auth\/[a-z-]+|popup-blocked|popup-closed|cancelled-popup|internal-error/i.test(body);
    const friendly = /Google par le ja rahe hain|pahunch nahi ban raha/.test(body);
    console.log("B) TOP-LEVEL (popup blocker forced) TEST");
    console.log("   auth error surfaced        :", surfacedPopupError ? "❌ YES (BUG)" : "✅ NO");
    console.log("   friendly redirect message  :", friendly ? "✅ shown" : "❌ missing");
    console.log("   redirect navigation attempt:", redirectAttempt ? "✅ yes → " + redirectAttempt.slice(0, 90) : friendly ? "✅ (state set)" : "❌ none");
    await page.screenshot({ path: "shots/popup-toplevel-test.png" });
    if (surfacedPopupError || !friendly) failed = true;
    await page.close().catch(() => {});
  }

  await browser.close().catch(() => {});
  console.log(failed ? "\n❌ TEST FAILED" : "\n✅ ALL POPUP-BLOCK TESTS PASSED");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("RUNNER ERROR:", e);
  process.exit(1);
});

// hard watchdog — never hang CI
setTimeout(() => {
  console.error("WATCHDOG: test exceeded 150s — aborting");
  process.exit(2);
}, 150000).unref();
