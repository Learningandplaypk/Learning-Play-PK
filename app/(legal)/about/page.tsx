import type { Metadata } from "next";
import Link from "next/link";
import { Ustad } from "@/components/brand/ustad";

export const metadata: Metadata = {
  title: "About — Hamari Kahani",
  description: "Learn & Play PK kyun bana? Pakistan ke students ke liye world-class learning games — free, Urdu mein.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto">
      <div className="mb-8">
        <Ustad mood="happy" className="mb-4 h-20 w-20" />
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Seekho + Khelo</h1>
        <p className="mt-2 text-base text-muted">43 games, 21 zubanein, Urdu meanings ke sath — sab free.</p>
      </div>

      <div className="space-y-6 text-[15px] leading-relaxed text-muted">
        <p>
          <b className="text-fg">Learn & Play PK</b> ka i deed Pakistan ke laakhon students ke liye hai jinke paas English medium schools, expensive apps ($10/mahina!) ya gaming PCs nahi hain — magar mobile aur sapne dono hain.
        </p>
        <p>
          Humara soch 2026 ke aghaz mein bana jab ek student ne poocha: &quot;Duolingo jaisa app Urdu mein kab aayega?&quot; Jawab: intezar nahi — khud banaenge. Lekin sirf Duolingo nahi: games ki arcade fun (Poki-style), websites ki cinematic beauty (Awwwards-style) aur courses ki depth — sab aik jagah.
        </p>
        <div className="card p-5">
          <h2 className="font-display font-bold text-fg">Hamara wada</h2>
          <ul className="mt-3 list-disc space-y-2 ps-5">
            <li><b className="text-brand-ink">Core education hamesha free</b> — English course, saare 43 games ki basic access, leaderboards.</li>
            <li><b className="text-info-ink">Roman Urdu + اردو</b> — jo zuban aap bolte hain usi mein seekhein.</li>
            <li><b className="text-info-ink">No pay-to-win</b> — premium sirf comfort ke liye, kabhi ability ke liye nahi.</li>
            <li><b className="text-accent-ink">Made in Pakistan</b> 🇵🇰 — Lahore se, Pakistan ke liye, duniya ke liye.</li>
          </ul>
        </div>
        <p>
          Platform par 43 games hain — 8 lesson games jo 21 languages mein kaam karte hain (English full course, Urdu, Arabic Quranic set samet, German, French, Spanish, Turkish, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Bengali, Malay, Persian, Punjabi, Pashto, Sindhi aur Balochi), 10 brain teasers, 10 quiz topics aur 15 arcade games. Sab kuch browser mein — install, download, 50MB — kuch nahi chahiye.
        </p>
        <p className="font-display text-lg font-extrabold text-fg">Chalo shuru karein?</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/learn" className="btn btn-primary btn-sm">Seekho</Link>
          <Link href="/fun" className="btn btn-secondary btn-sm">Khelo</Link>
        </div>
      </div>
    </div>
  );
}
