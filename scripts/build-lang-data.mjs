#!/usr/bin/env node
/**
 * Builds every learning-language pack from its authored source file.
 *
 *   scripts/lang-src/<slug>.txt   →   data/langs/<slug>.json      (runtime pack)
 *                                 →   data/_review/<slug>.md      (30-entry spot-check sheet)
 *                                 →   data/langs/_manifest.json   (counts used by tests/CI)
 *
 * Usage:
 *   node scripts/build-lang-data.mjs            write everything
 *   node scripts/build-lang-data.mjs --check    fail if a committed JSON is stale
 *   node scripts/build-lang-data.mjs urdu       only that language
 */
import fs from "node:fs";
import path from "node:path";
import { parseLangSource, buildPack, parseConcepts, sampleForReview } from "./lib/lang-source.mjs";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "scripts/lang-src");
const OUT_DIR = path.join(ROOT, "data/langs");
const REVIEW_DIR = path.join(ROOT, "data/_review");
const args = process.argv.slice(2);
const check = args.includes("--check");
const only = args.filter((a) => !a.startsWith("--"));

function reviewMd(slug, pack, src) {
  const s = sampleForReview(pack);
  const L = [];
  L.push(`# ${slug} — content review sheet`);
  L.push("");
  L.push(
    `Generated from \`scripts/lang-src/${slug}.txt\` — ${pack.meta.words} words · ${pack.meta.phrases} phrases · ` +
      `${pack.meta.grammar} grammar · ${pack.meta.sentences} sentences · ${pack.meta.listening} listening · ` +
      `${pack.meta.stories} stories · ${pack.meta.idioms} idioms.`
  );
  if (pack.romanization) L.push(`Romanization: ${pack.romanization}`);
  L.push("");
  L.push(`Random sample (stable order). Tick anything that reads wrong, then fix it in the source file and re-run \`npm run lang:build\`.`);
  L.push("");
  L.push("## Words");
  L.push("");
  L.push("| # | Native | Roman | English | Urdu | PoS | Cat | Lv | Example | English example |");
  L.push("|---|--------|-------|---------|------|-----|-----|----|---------|-----------------|");
  s.words.forEach((w, i) => {
    L.push(
      `| ${i + 1} | ${w.w} | ${w.r} | ${w.en} | ${w.ur} | ${w.pos} | ${w.cat} | ${w.lv} | ${w.ex} | ${w.exEn} |`
    );
  });
  L.push("");
  L.push("## Phrases");
  L.push("");
  L.push("| # | Native | Roman | English | Urdu | Context |");
  L.push("|---|--------|-------|---------|------|---------|");
  s.phrases.forEach((p, i) => L.push(`| ${i + 1} | ${p.p} | ${p.r} | ${p.en} | ${p.ur} | ${p.ctx} |`));
  L.push("");
  L.push("## Grammar MCQs");
  L.push("");
  s.grammar.forEach((g, i) => {
    L.push(`${i + 1}. ${g.q}`);
    g.o.forEach((o, oi) => L.push(`   - ${oi === g.a ? "**" : ""}${o}${oi === g.a ? "** ✓" : ""}`));
    L.push(`   - Why: ${g.why}`);
    L.push(`   - Roman Urdu: ${g.urWhy}`);
  });
  L.push("");
  L.push("## Jumbled sentences");
  L.push("");
  L.push("| # | Correct order | English | Urdu |");
  L.push("|---|---------------|---------|------|");
  s.sentences.forEach((x, i) => L.push(`| ${i + 1} | ${x.s} | ${x.en} | ${x.ur} |`));
  L.push("");
  L.push("## Idioms");
  L.push("");
  L.push("| # | Idiom | Roman | Meaning | Urdu | Example |");
  L.push("|---|-------|-------|---------|------|---------|");
  s.idioms.forEach((x, i) => L.push(`| ${i + 1} | ${x.i} | ${x.r} | ${x.m} | ${x.ur} | ${x.ex} |`));
  L.push("");
  L.push("## Stories");
  L.push("");
  for (const st of s.stories) {
    L.push(`### ${st.emoji} ${st.title}`);
    L.push("");
    for (const line of st.text.split("\n")) L.push(`> ${line}`);
    L.push("");
    L.push(`Blanks: ${st.blanks.map((b, bi) => `${bi + 1}) ${b.o.join(" / ")} → **${b.o[b.a]}**`).join("  ")}`);
    L.push("");
    L.push(`English: ${st.en}`);
    L.push("");
  }
  L.push("## Category / level coverage");
  L.push("");
  const byCat = {};
  const byLv = {};
  for (const w of pack.words) {
    byCat[w.cat] = (byCat[w.cat] ?? 0) + 1;
    byLv[w.lv] = (byLv[w.lv] ?? 0) + 1;
  }
  L.push(`- Levels: ${Object.entries(byLv).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  L.push(`- Categories: ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  L.push("");
  L.push(`Sections in source: ${Object.keys(src).filter((k) => src[k].length).join(", ")}`);
  L.push("");
  return `${L.join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log("[lang-data] no scripts/lang-src yet — nothing to build");
    return;
  }
  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.endsWith(".txt") && !f.startsWith("_"))
    .filter((f) => !only.length || only.includes(path.basename(f, ".txt")))
    .sort();
  const conceptsPath = path.join(SRC_DIR, "_concepts.txt");
  const concepts = fs.existsSync(conceptsPath)
    ? parseConcepts(fs.readFileSync(conceptsPath, "utf8"))
    : new Map();
  const manifestPath = path.join(OUT_DIR, "_manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  let stale = [];
  let built = 0;

  for (const file of files) {
    const slug = path.basename(file, ".txt");
    const text = fs.readFileSync(path.join(SRC_DIR, file), "utf8");
    const src = parseLangSource(text, slug);
    const pack = buildPack(slug, src, concepts);
    const jsonPath = path.join(OUT_DIR, `${slug}.json`);
    const nextJson = `${JSON.stringify(pack, null, 0)}\n`;
    const prevJson = fs.existsSync(jsonPath) ? fs.readFileSync(jsonPath, "utf8") : null;
    if (check) {
      if (prevJson !== nextJson) stale.push(slug);
    } else {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.mkdirSync(REVIEW_DIR, { recursive: true });
      fs.writeFileSync(jsonPath, nextJson);
      fs.writeFileSync(path.join(REVIEW_DIR, `${slug}.md`), reviewMd(slug, pack, src));
    }
    manifest[slug] = { ...pack.meta, alphabet: pack.alphabet?.rows.length ?? 0 };
    built += 1;
    console.log(
      `[lang-data] ${slug}: ${pack.meta.words}w ${pack.meta.phrases}p ${pack.meta.grammar}g ` +
        `${pack.meta.sentences}s ${pack.meta.listening}l ${pack.meta.stories}st ${pack.meta.idioms}i ` +
        `${pack.alphabet?.rows.length ?? 0}abc`
    );
  }

  if (!check) {
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`[lang-data] ${built} pack(s) written, manifest updated`);
  } else if (stale.length) {
    console.error(`[lang-data] STALE — run "npm run lang:build": ${stale.join(", ")}`);
    process.exit(1);
  } else {
    console.log(`[lang-data] ${built} pack(s) up to date`);
  }
}

main();
