/**
 * Copies the self-hosted script webfonts out of node_modules into public/fonts/
 * so the lazy @font-face rules in lib/lang-fonts.ts + lib/urdu-font.ts can point
 * at stable, cache-immutable URLs.
 *
 * Only the script blocks a language actually needs are copied:
 *   Urdu / Punjabi (Shahmukhi) → Noto Nastaliq Urdu
 *   Arabic / Persian / Pashto / Sindhi / Balochi → Noto Naskh Arabic
 *   Hindi → Noto Sans Devanagari
 *   Bengali → Noto Sans Bengali
 *
 * Runs from `prebuild` / `predev`. public/fonts/*.woff2 are git-ignored, so the
 * files are produced on every build instead of being committed.
 */
import fs from "node:fs";
import path from "node:path";

const to = path.join(process.cwd(), "public/fonts");
fs.mkdirSync(to, { recursive: true });

const PACKAGES = [
  { pkg: "@fontsource-variable/noto-nastaliq-urdu", prefix: "noto-nastaliq-urdu" },
  { pkg: "@fontsource-variable/noto-naskh-arabic", prefix: "noto-naskh-arabic" },
  { pkg: "@fontsource-variable/noto-sans-devanagari", prefix: "noto-sans-devanagari" },
  { pkg: "@fontsource-variable/noto-sans-bengali", prefix: "noto-sans-bengali" },
];

let copied = 0;
for (const { pkg, prefix } of PACKAGES) {
  const dir = path.join(process.cwd(), "node_modules", pkg, "files");
  if (!fs.existsSync(dir)) {
    console.warn(`[fonts] ${pkg} not installed — that script falls back to a system font`);
    continue;
  }
  for (const f of fs.readdirSync(dir)) {
    if (!f.startsWith(prefix) || !f.endsWith(".woff2")) continue;
    // skip the optical-width / standard variants — we only serve the wght axis
    if (f.includes("-wdth-") || f.includes("-standard-") || f.includes("-math-") || f.includes("-symbols-")) continue;
    fs.copyFileSync(path.join(dir, f), path.join(to, f));
    copied += 1;
  }
}

console.log(`[fonts] ${copied} woff2 files ready in public/fonts/`);
