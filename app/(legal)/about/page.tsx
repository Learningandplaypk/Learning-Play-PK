import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Hamari Kahani",
  description: "Learn & Play PK kyun bana? Pakistan ke students ke liye world-class learning games — free, 3D, Urdu mein.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-gradient-to-br from-neon-green via-electric to-neon-purple text-4xl">🦉</div>
        <h1 className="font-display text-3xl font-black sm:text-5xl">
          <span className="text-gradient">Seekho + Khelo</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Sab FREE. Sab 3D. Sab Urdu-friendy.</p>
      </div>

      <div className="space-y-6 text-[15px] leading-relaxed text-muted">
        <p>
          <b className="text-ink">Learn & Play PK</b> ka i deed Pakistan ke laakhon students ke liye hai jinke paas English medium schools, expensive apps ($10/mahina!) ya gaming PCs nahi hain — magar mobile aur sapne dono hain.
        </p>
        <p>
          Humara soch 2026 ke aghaz mein bana jab ek student ne poocha: &quot;Duolingo jaisa app Urdu mein kab aayega?&quot; Jawab: intezar nahi — khud banaenge. Lekin sirf Duolingo nahi: games ki arcade fun (Poki-style), websites ki cinematic beauty (Awwwards-style) aur courses ki depth — sab aik jagah.
        </p>
        <div className="glass p-5">
          <h2 className="font-display font-bold text-ink">Hamara wada</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li><b className="text-neon-green">Core education hamesha free</b> — English course, saare 43 games ki basic access, leaderboards.</li>
            <li><b className="text-electric">Roman Urdu + اردو</b> — jo zuban aap bolte hain usi mein seekhein.</li>
            <li><b className="text-neon-purple">No pay-to-win</b> — premium sirf comfort ke liye, kabhi ability ke liye nahi.</li>
            <li><b className="text-neon-orange">Made in Pakistan</b> 🇵🇰 — Lahore se, Pakistan ke liye, duniya ke liye.</li>
          </ul>
        </div>
        <p>
          Platform par 43 games hain — 8 lesson games jo 8 languages mein kaam karte hain (English full course, Arabic Quranic set samet), 10 brain teasers, 10 quiz topics aur 15 arcade games. Sab kuch browser mein — install, download, 50MB — kuch nahi chahiye.
        </p>
        <p className="text-center font-display text-lg font-bold text-ink">
          Chalo shuru karein? 🚀
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/learn" className="btn btn-neon btn-sm">📚 Seekho</Link>
          <Link href="/fun" className="btn btn-neon btn-sm !bg-none !bg-gradient-to-r !from-pink-accent !to-neon-orange">🎮 Khelo</Link>
        </div>
      </div>
    </div>
  );
}
