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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #05060F 0%, #0B0D1C 55%, #141a3f 100%)",
          color: "#F4F6FF",
          fontFamily: "inter",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -160, left: -120, width: 500, height: 500, borderRadius: 9999, background: "rgba(45,124,255,0.25)", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", bottom: -180, right: -100, width: 520, height: 520, borderRadius: 9999, background: "rgba(176,38,255,0.25)", filter: "blur(100px)" }} />
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: "#39FF14", fontWeight: 700 }}>LEARN &amp; PLAY PK</div>
        <div style={{ display: "flex", fontSize: score ? 64 : 88, fontWeight: 700, marginTop: 28, backgroundImage: "linear-gradient(90deg,#39FF14,#2D7CFF,#B026FF)", backgroundClip: "text", color: "transparent" }}>{title}</div>
        {score && (
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 10, color: "#F4F6FF" }}>
            Score: {score}
          </div>
        )}
        {game && (
          <div style={{ display: "flex", fontSize: 28, marginTop: 18, color: "#8B90B0" }}>{game}</div>
        )}
        <div style={{ display: "flex", fontSize: 26, marginTop: 34, color: "#8B90B0" }}>40+ FREE games • English + 7 languages • learnplaypk.com</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: loadFonts() }
  );
}
