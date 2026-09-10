"use client";

/**
 * Language tiles — inline SVG flags (no emoji flags: they render as "SA"/"PK"
 * letter pairs on Windows and break the visual rhythm), plus a neutral
 * script-glyph tile for languages with no country of their own
 * (Punjabi, Pashto, Sindhi, Balochi) and a globe tile for English.
 */

import React from "react";
import type { LangMeta } from "@/lib/lang-registry";

const W = 24;
const H = 16;

function stripes(colors: string[]) {
  const h = H / colors.length;
  return colors.map((c, i) => <rect key={i} x="0" y={i * h} width={W} height={h + 0.02} fill={c} />);
}

function verticals(colors: string[]) {
  const w = W / colors.length;
  return colors.map((c, i) => <rect key={i} x={i * w} y="0" width={w + 0.02} height={H} fill={c} />);
}

function Crescent({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx + r * 0.42} cy={cy} r={r * 0.86} fill="none" />
    </>
  );
}

/** Crescent drawn as two overlapping circles (second one uses the bg colour). */
function CrescentCut({ cx, cy, r, fill, bg }: { cx: number; cy: number; r: number; fill: string; bg: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx + r * 0.4} cy={cy} r={r * 0.82} fill={bg} />
    </>
  );
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

const FLAGS: Record<string, React.ReactNode> = {
  DE: stripes(["#111", "#D00", "#FFCE00"]),
  FR: verticals(["#1F4FA3", "#fff", "#C8102E"]),
  IT: verticals(["#009246", "#fff", "#CE2B37"]),
  ES: (
    <>
      <rect width={W} height={H} fill="#AA151B" />
      <rect y={H * 0.25} width={W} height={H * 0.5} fill="#F1BF00" />
      <rect x={W * 0.18} y={H * 0.38} width={W * 0.14} height={H * 0.24} fill="#AA151B" />
    </>
  ),
  TR: (
    <>
      <rect width={W} height={H} fill="#E30A17" />
      <CrescentCut cx={W * 0.36} cy={H / 2} r={H * 0.28} fill="#fff" bg="#E30A17" />
      <Star cx={W * 0.56} cy={H / 2} r={H * 0.17} fill="#fff" />
    </>
  ),
  SA: (
    <>
      <rect width={W} height={H} fill="#006C35" />
      <rect x={W * 0.22} y={H * 0.32} width={W * 0.56} height={H * 0.1} rx={H * 0.05} fill="#fff" />
      <rect x={W * 0.22} y={H * 0.56} width={W * 0.44} height={H * 0.08} rx={H * 0.04} fill="#fff" />
    </>
  ),
  IR: (
    <>
      {stripes(["#239F40", "#fff", "#DA0000"])}
      <circle cx={W / 2} cy={H / 2} r={H * 0.16} fill="#DA0000" />
    </>
  ),
  RU: stripes(["#fff", "#0039A6", "#D52B1E"]),
  BR: (
    <>
      <rect width={W} height={H} fill="#009B3A" />
      <polygon points={`${W / 2},1.4 ${W - 2.2},${H / 2} ${W / 2},${H - 1.4} 2.2,${H / 2}`} fill="#FEDF00" />
      <circle cx={W / 2} cy={H / 2} r={H * 0.24} fill="#002776" />
    </>
  ),
  CN: (
    <>
      <rect width={W} height={H} fill="#DE2910" />
      <Star cx={W * 0.2} cy={H * 0.32} r={H * 0.22} fill="#FFDE00" />
      <Star cx={W * 0.4} cy={H * 0.16} r={H * 0.08} fill="#FFDE00" />
      <Star cx={W * 0.47} cy={H * 0.34} r={H * 0.08} fill="#FFDE00" />
      <Star cx={W * 0.44} cy={H * 0.56} r={H * 0.08} fill="#FFDE00" />
    </>
  ),
  JP: (
    <>
      <rect width={W} height={H} fill="#fff" />
      <circle cx={W / 2} cy={H / 2} r={H * 0.32} fill="#BC002D" />
    </>
  ),
  KR: (
    <>
      <rect width={W} height={H} fill="#fff" />
      <circle cx={W / 2} cy={H / 2} r={H * 0.3} fill="#CD2E3A" />
      <path d={`M ${W / 2 - H * 0.3} ${H / 2} a ${H * 0.3} ${H * 0.3} 0 0 0 ${H * 0.6} 0 z`} fill="#0047A0" />
      <rect x={W * 0.14} y={H * 0.2} width={W * 0.16} height={1} fill="#111" />
      <rect x={W * 0.7} y={H * 0.72} width={W * 0.16} height={1} fill="#111" />
    </>
  ),
  IN: (
    <>
      {stripes(["#FF9933", "#fff", "#138808"])}
      <circle cx={W / 2} cy={H / 2} r={H * 0.17} fill="none" stroke="#000080" strokeWidth={0.7} />
    </>
  ),
  BD: (
    <>
      <rect width={W} height={H} fill="#006A4E" />
      <circle cx={W * 0.45} cy={H / 2} r={H * 0.3} fill="#F42A41" />
    </>
  ),
  MY: (
    <>
      <rect width={W} height={H} fill="#fff" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} y={(i * H) / 7} width={W} height={H / 14} fill="#CC0001" />
      ))}
      <rect width={W * 0.5} height={H * 0.57} fill="#010066" />
      <CrescentCut cx={W * 0.2} cy={H * 0.28} r={H * 0.16} fill="#FFCC00" bg="#010066" />
    </>
  ),
  PK: (
    <>
      <rect width={W} height={H} fill="#01411C" />
      <rect width={W * 0.25} height={H} fill="#fff" />
      <CrescentCut cx={W * 0.6} cy={H / 2} r={H * 0.3} fill="#fff" bg="#01411C" />
      <Star cx={W * 0.72} cy={H * 0.42} r={H * 0.12} fill="#fff" />
    </>
  ),
};

export function LangTile({
  meta,
  size = 44,
  className = "",
}: {
  meta: LangMeta;
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size * 0.28);
  const label = `${meta.name} (${meta.native})`;

  if (meta.tile.kind === "globe") {
    return (
      <span
        className={className}
        role="img"
        aria-label={label}
        style={{ width: size, height: size, display: "grid", placeItems: "center" }}
      >
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9.2" stroke="var(--brand)" strokeWidth="1.8" />
          <path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.7 3.9 9.2S14.6 18.6 12 21.2C9.4 18.6 8.1 15.5 8.1 12S9.4 5.4 12 2.8Z" stroke="var(--brand)" strokeWidth="1.4" />
        </svg>
      </span>
    );
  }

  if (meta.tile.kind === "glyph") {
    return (
      <span
        className={`lang-glyph-tile ${className}`}
        role="img"
        aria-label={label}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          display: "grid",
          placeItems: "center",
          background: "var(--brand-tint)",
          color: "var(--brand-ink)",
          border: "1.5px solid var(--brand)",
          fontSize: size * 0.34,
          fontWeight: 800,
          lineHeight: 1,
          direction: "rtl",
          fontFamily: "var(--font-urdu, 'Noto Nastaliq Urdu Variable', serif)",
        }}
      >
        {meta.tile.text}
      </span>
    );
  }

  return (
    <span
      className={className}
      role="img"
      aria-label={label}
      style={{
        width: size,
        height: Math.round((size * H) / W),
        borderRadius: Math.min(radius, 6),
        overflow: "hidden",
        display: "block",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)",
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        {FLAGS[meta.tile.cc] ?? <rect width={W} height={H} fill="#888" />}
      </svg>
    </span>
  );
}

export function TileSlot({
  meta,
  size = 44,
  className = "mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-tint",
}: {
  meta: LangMeta;
  size?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      <LangTile meta={meta} size={size} />
    </span>
  );
}
