import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog — Learning Tips & Guides",
  description: "English seekhne ke tareeqay, Arabic for Quran, streak psychology, Sudoku guides aur gaming trends — Learn & Play PK blog.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="page-pad mx-auto min-h-[100dvh] max-w-3xl pb-28 pt-28">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-black sm:text-5xl">
          <span className="text-gradient">📝 Blog</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Seekhne ke tips, guides aur Pakistan gaming scene ki baatein.</p>
      </div>
      <div className="space-y-4">
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="glass glass-hover block p-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{p.emoji}</span>
              <div>
                <h2 className="font-display text-lg font-bold">{p.title}</h2>
                <p className="mt-1 text-sm text-muted">{p.description}</p>
                <p className="mt-2 text-xs text-muted/70">
                  {new Date(p.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} • {p.readMins} min parhna
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
