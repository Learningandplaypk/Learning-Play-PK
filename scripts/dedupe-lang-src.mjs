#!/usr/bin/env node
/**
 * Removes accidental duplicate lines from authored language sources.
 * The builder rejects duplicates loudly; this keeps a source file tidy after
 * hand-editing (e.g. the same phrase written twice in different sections).
 * Usage: node scripts/dedupe-lang-src.mjs [slug ...]
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIR = "scripts/lang-src";
const SECTIONS = new Set(["words", "phrases", "grammar", "sentences", "listening", "stories", "idioms", "alphabet"]);
const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => path.join(DIR, `${a}.txt`))
  : readdirSync(DIR).filter((f) => f.endsWith(".txt") && !f.startsWith("_")).map((f) => path.join(DIR, f));

let changed = 0;
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  let section = null;
  const seen = new Map();
  const out = [];
  const dropped = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("@")) {
      section = t.slice(1);
      seen.set(section, new Set());
      out.push(line);
      continue;
    }
    if (!t || t.startsWith("#")) {
      out.push(line);
      continue;
    }
    const key = t.split("|")[0].trim();
    const bucket = SECTIONS.has(section) ? seen.get(section) : null;
    if (bucket) {
      if (bucket.has(key)) {
        dropped.push(`${section}: ${key}`);
        continue;
      }
      bucket.add(key);
    }
    out.push(line);
  }
  if (dropped.length) {
    writeFileSync(file, out.join("\n"));
    changed++;
    console.log(`[dedupe] ${path.basename(file)}: dropped ${dropped.length} → ${dropped.join("; ")}`);
  }
}
if (!changed) console.log("[dedupe] no duplicates found");
