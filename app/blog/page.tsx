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
    <div className="container-page page-pad max-w-3xl pb-24 pt-8 md:pb-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-fg sm:text-4xl">Blog</h1>
        <p className="mt-2 text-base text-muted">Seekhne ke tips, guides aur Pakistan gaming scene ki baatein.</p>
      </div>
      <div className="space-y-4">
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card block p-5 transition-colors hover:border-brand">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint text-xl">
                {p.emoji}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-extrabold text-fg">{p.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {new Date(p.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} •{" "}
                  {p.readMins} min parhna
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
