/**
 * Copies the self-hosted Noto Nastaliq Urdu woff2 files out of node_modules into
 * public/fonts/ so `public/fonts/urdu.css` can point at stable URLs.
 *
 * The Urdu face is ~260KB. @font-face is injected inline from lib/urdu-font.ts
 * (no /fonts/urdu.css request). These woff2 files are the only artifacts.
 *
 * Runs from `prebuild` / `predev`. public/fonts/*.woff2 are git-ignored.
 */
import fs from "node:fs";
import path from "node:path";

const from = path.join(process.cwd(), "node_modules/@fontsource-variable/noto-nastaliq-urdu/files");
const to = path.join(process.cwd(), "public/fonts");
const files = [
  "noto-nastaliq-urdu-arabic-wght-normal.woff2",
  "noto-nastaliq-urdu-latin-wght-normal.woff2",
];

fs.mkdirSync(to, { recursive: true });
for (const f of files) {
  const src = path.join(from, f);
  if (!fs.existsSync(src)) {
    console.warn(`[fonts] missing ${f} — Urdu text will fall back to a system serif`);
    continue;
  }
  fs.copyFileSync(src, path.join(to, f));
}
console.log("[fonts] Urdu face ready in public/fonts/");
