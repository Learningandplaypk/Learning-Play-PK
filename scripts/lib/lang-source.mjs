/**
 * Language source format — the human-authored form of every learning language.
 *
 * One pipe-delimited file per language (`scripts/lang-src/<slug>.txt`) is the
 * single source of truth; `scripts/build-lang-data.mjs` expands it into
 * `data/langs/<slug>.json` (the runtime pack) plus `data/_review/<slug>.md`
 * (spot-check sheet). Authoring stays compact, the JSON stays consistent.
 *
 *   @info        key|value  (alphabet.title, alphabet.intro, romanization)
 *   @frames      cat|native template|english template
 *   @words       en|w|r[|slot[|ex|exEn]]            (metadata from _concepts.txt)
 *                en|w|r|slot|ur|pos|cat|lv          (self-contained, for extras)
 *   @phrases     p|r|en|ur|ctx
 *   @grammar     q|o1|o2|o3[|o4]|a(1-based)|why|urWhy
 *   @sentences   s|en|ur
 *   @listening   t|r|en|o1|o2|o3|a(1-based)
 *   @stories     title|emoji|text(\n line breaks, ___ (n) blanks)|english|blanks
 *   @idioms      i|r|m|ur|ex
 *   @alphabet    ch|r|name|ex
 *
 * Templates may use {s} (slot form, defaults to the word), {w}, {en}, {ur}.
 */

const SECTIONS = [
  "info",
  "frames",
  "words",
  "phrases",
  "grammar",
  "sentences",
  "listening",
  "stories",
  "idioms",
  "alphabet",
];

export function parseLangSource(text, slug) {
  const out = {};
  for (const s of SECTIONS) out[s] = [];
  let cur = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("@")) {
      const name = line.slice(1).trim();
      if (!SECTIONS.includes(name)) throw new Error(`${slug}: unknown section "${name}" (line ${i + 1})`);
      cur = name;
      continue;
    }
    if (!cur) throw new Error(`${slug}: content before any @section (line ${i + 1})`);
    out[cur].push({ n: i + 1, cells: line.split("|").map((c) => c.trim()) });
  }
  return out;
}

function applyTemplate(tpl, vars) {
  return tpl
    .replace(/\{s\}/g, vars.s)
    .replace(/\{w\}/g, vars.w)
    .replace(/\{en\}/g, vars.en)
    .replace(/\{ur\}/g, vars.ur);
}

export function parseConcepts(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [en, ur, pos, cat, lv] = t.split("|").map((c) => c.trim());
    if (!en || !ur || !pos || !cat || !lv) throw new Error(`_concepts: bad line "${t}"`);
    if (!["A1", "A2", "B1"].includes(lv)) throw new Error(`_concepts: bad level "${lv}" in "${t}"`);
    map.set(en.toLowerCase(), { en, ur, pos, cat, lv });
  }
  return map;
}

/** Expand the compact source into a runtime LangPack. Throws on authoring errors. */
export function buildPack(slug, src, concepts = new Map()) {
  const frames = new Map();
  for (const { n, cells } of src.frames) {
    if (cells.length < 3) throw new Error(`${slug}: @frames line ${n} needs cat|native|english`);
    frames.set(cells[0], { native: cells[1], en: cells[2] });
  }

  const words = [];
  const seen = new Map();
  const seenConcepts = new Map();
  for (const { n, cells } of src.words) {
    let w;
    let r;
    let en;
    let ur;
    let pos;
    let cat;
    let lv;
    let slot;
    let exOverride = "";
    let exEnOverride = "";
    if (cells.length >= 8) {
      [en, w, r, slot, ur, pos, cat, lv] = cells;
    } else if (cells.length >= 3) {
      [en, w, r, slot, exOverride, exEnOverride] = cells;
      const c = concepts.get(en.toLowerCase());
      if (!c) throw new Error(`${slug}: @words line ${n} "${en}" is not in _concepts.txt`);
      ({ ur, pos, cat, lv } = c);
    } else {
      throw new Error(`${slug}: @words line ${n} needs en|w|r[|slot[|ex|exEn]] or the 8-column self-contained form`);
    }
    if (!w || !r || !en || !ur || !pos || !cat || !lv) {
      throw new Error(`${slug}: @words line ${n} needs w|r|en|ur|pos|cat|lv (got ${cells.length} cells)`);
    }
    if (!["A1", "A2", "B1"].includes(lv)) throw new Error(`${slug}: @words line ${n} bad level "${lv}"`);
    // A word may legitimately appear twice when it is polysemous in the target
    // language (Urdu زبان = "tongue" and "language"), but never twice in the
    // same category and never for the same concept.
    const dupKey = `${w}||${cat}`;
    if (seen.has(dupKey)) throw new Error(`${slug}: duplicate word "${w}" in category ${cat} (lines ${seen.get(dupKey)} and ${n})`);
    seen.set(dupKey, n);
    if (seenConcepts.has(en)) throw new Error(`${slug}: concept "${en}" listed twice (lines ${seenConcepts.get(en)} and ${n})`);
    seenConcepts.set(en, n);
    const vars = { s: slot || w, w, en, ur };
    let nativeEx = exOverride || "";
    let nativeExEn = exEnOverride || "";
    if (!nativeEx) {
      const f = frames.get(cat) ?? frames.get("default");
      if (!f) throw new Error(`${slug}: @words line ${n} category "${cat}" has no @frames entry (and no "default") and no example override`);
      nativeEx = applyTemplate(f.native, vars);
      nativeExEn = applyTemplate(f.en, vars);
    }
    if (!nativeExEn) throw new Error(`${slug}: @words line ${n} example override without English translation`);
    words.push({ w, r, en, ur, pos, cat, lv, ex: nativeEx, exEn: nativeExEn });
  }

  const phrases = src.phrases.map(({ n, cells }) => {
    const [p, r, en, ur, ctx] = cells;
    if (!p || !r || !en || !ur || !ctx) throw new Error(`${slug}: @phrases line ${n} needs p|r|en|ur|ctx`);
    return { p, r, en, ur, ctx };
  });

  const grammar = src.grammar.map(({ n, cells }) => {
    const opts = [];
    let i = 1;
    while (i < cells.length && cells[i] && !/^\d+$/.test(cells[i])) {
      opts.push(cells[i]);
      i += 1;
    }
    const a1 = Number(cells[i]);
    const why = cells[i + 1] ?? "";
    const urWhy = cells[i + 2] ?? "";
    if (!cells[0] || opts.length < 3 || !a1 || !why || !urWhy) {
      throw new Error(`${slug}: @grammar line ${n} needs q|3+ options|answer|why|urWhy`);
    }
    if (a1 < 1 || a1 > opts.length) throw new Error(`${slug}: @grammar line ${n} answer ${a1} out of range`);
    if (new Set(opts).size !== opts.length) throw new Error(`${slug}: @grammar line ${n} duplicate options`);
    return { q: cells[0], o: opts, a: a1 - 1, why, urWhy };
  });

  const sentences = src.sentences.map(({ n, cells }) => {
    const [s, en, ur] = cells;
    if (!s || !en || !ur) throw new Error(`${slug}: @sentences line ${n} needs s|en|ur`);
    return { s, en, ur };
  });

  const listening = src.listening.map(({ n, cells }) => {
    const [t, r, en, o1, o2, o3, a1] = cells;
    const o = [o1, o2, o3].filter(Boolean);
    if (!t || !r || !en || o.length < 3 || !a1) throw new Error(`${slug}: @listening line ${n} needs t|r|en|3 options|answer`);
    const a = Number(a1) - 1;
    if (a < 0 || a > 2) throw new Error(`${slug}: @listening line ${n} answer out of range`);
    if (new Set(o).size !== o.length) throw new Error(`${slug}: @listening line ${n} duplicate options`);
    return { t, r, en, o, a };
  });

  const stories = src.stories.map(({ n, cells }) => {
    const [title, emoji, text, en, blanksRaw] = cells;
    if (!title || !text || !en || !blanksRaw) throw new Error(`${slug}: @stories line ${n} needs title|emoji|text|en|blanks`);
    const text2 = text.replace(/\\n/g, "\n");
    const blanks = blanksRaw.split(";").map((b, bi) => {
      const [optsRaw, aRaw] = b.split("=");
      const o = optsRaw.split("/");
      const a = Number(aRaw);
      if (o.length < 2 || Number.isNaN(a) || a < 0 || a >= o.length) {
        throw new Error(`${slug}: @stories line ${n} blank ${bi + 1} must be opt/opt/opt=index`);
      }
      return { o, a };
    });
    const marks = (text2.match(/___\s*\((\d+)\)/g) || []).length;
    if (marks !== blanks.length) {
      throw new Error(`${slug}: @stories line ${n} has ${marks} blanks marked but ${blanks.length} answer sets`);
    }
    return { title, emoji: emoji || "📖", text: text2, en, blanks };
  });

  const idioms = src.idioms.map(({ n, cells }) => {
    const [i, r, m, ur, ex] = cells;
    if (!i || !r || !m || !ur || !ex) throw new Error(`${slug}: @idioms line ${n} needs i|r|m|ur|ex`);
    return { i, r, m, ur, ex };
  });

  const info = new Map(src.info.map(({ cells }) => [cells[0], cells.slice(1).join("|")]));

  const alphabetRows = src.alphabet.map(({ n, cells }) => {
    const [ch, r, name, ex] = cells;
    if (!ch || !r || !name) throw new Error(`${slug}: @alphabet line ${n} needs ch|r|name[|ex]`);
    return { ch, r, name, ex: ex || "" };
  });

  return {
    slug,
    version: 1,
    romanization: info.get("romanization") || "",
    meta: {
      words: words.length,
      phrases: phrases.length,
      grammar: grammar.length,
      sentences: sentences.length,
      listening: listening.length,
      stories: stories.length,
      idioms: idioms.length,
    },
    words,
    phrases,
    grammar,
    sentences,
    listening,
    stories,
    idioms,
    ...(alphabetRows.length
      ? {
          alphabet: {
            title: info.get("alphabet.title") || "",
            intro: info.get("alphabet.intro") || "",
            rows: alphabetRows,
          },
        }
      : {}),
  };
}

/** 30 pseudo-random (but stable) entries for the human review sheet. */
export function sampleForReview(pack, count = 30) {
  const seedOf = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const pick = (arr, k, salt) =>
    [...arr]
      .sort((a, b) => seedOf(JSON.stringify(a) + salt) - seedOf(JSON.stringify(b) + salt))
      .slice(0, Math.min(k, arr.length));
  return {
    words: pick(pack.words, count, "w"),
    phrases: pick(pack.phrases, 10, "p"),
    grammar: pick(pack.grammar, 8, "g"),
    sentences: pick(pack.sentences, 8, "s"),
    stories: pack.stories.slice(0, 2),
    idioms: pick(pack.idioms, 6, "i"),
  };
}
