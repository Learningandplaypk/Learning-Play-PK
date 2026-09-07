import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";

// Self-hosted fonts (Fontsource WOFF) — Satori supports WOFF, not WOFF2.
// No CDN fetch at runtime → works offline and behind firewalls.
// (NOTE: emoji glyphs in the JSX would trigger a CDN fetch — keep this image emoji-free.)
type OgFont = { name: string; data: Buffer; weight?: 400 | 700 | 900; style?: "normal" | "italic" };

function loadFonts(): OgFont[] | undefined {
  try {
    const base = path.join(process.cwd(), "node_modules", "@fontsource", "inter", "files");
    return [
      { name: "inter", data: readFileSync(path.join(base, "inter-latin-400-normal.woff")), weight: 400, style: "normal" },
      { name: "inter", data: readFileSync(path.join(base, "inter-latin-700-normal.woff")), weight: 700, style: "normal" },
      { name: "inter", data: readFileSync(path.join(base, "inter-latin-400-normal.woff")), weight: 900, style: "normal" },
    ];
  } catch {
    return undefined; // let next/og use its bundled Noto Sans default (works on Vercel)
  }
}

/** Dynamic OG score cards + page previews: /api/og?title=...&score=...&game=... */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "Seekho + Khelo").slice(0, 80);
  const game = searchParams.get("game");
  const score = searchParams.get("score");

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#FAFAF7",
          color: "#1C1C1A",
          fontFamily: "inter",
          padding: "0 96px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "#178A55" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", width: 96, height: 96, borderRadius: 24, background: "#178A55", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 54, height: 54, borderRadius: 9999, background: "#FDF6E9" }} />
          </div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#12734A", fontWeight: 700 }}>
            LEARN &amp; PLAY PK
          </div>
        </div>
        <div style={{ display: "flex", fontSize: score ? 72 : 92, fontWeight: 900, marginTop: 40, color: "#1C1C1A", lineHeight: 1.1 }}>
          {title}
        </div>
        {score && (
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 16, color: "#178A55" }}>
            Score: {score}
          </div>
        )}
        {game && <div style={{ display: "flex", fontSize: 30, marginTop: 18, color: "#6B6B66" }}>{game}</div>}
        <div style={{ display: "flex", fontSize: 26, marginTop: 48, color: "#6B6B66" }}>
          43 FREE games - 8 languages with Urdu meanings - learnplaypk.com
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: loadFonts() }
  );
}
