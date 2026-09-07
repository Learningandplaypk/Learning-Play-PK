import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS } from "@/data/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const json = {"@context": "https://schema.org","@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Learn & Play PK" },
  };

  return (
    <article className="container-page page-pad max-w-2xl pb-24 pt-8 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      <Link href="/blog" className="chip-btn">← Blog</Link>
      <div className="mt-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-tint text-2xl">{post.emoji}</span>
        <h1 className="mt-4 font-display text-3xl font-black leading-tight text-fg sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-xs text-muted">
          {new Date(post.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} • {post.readMins} min parhna
        </p>
      </div>
      <div className="mt-8 space-y-6">
        {post.sections.map((sec, i) => (
          <section key={i}>
            {sec.h && <h2 className="mb-2 font-display text-xl font-bold text-fg">{sec.h}</h2>}
            {sec.p?.map((para, j) => (
              <p key={j} className="mb-3 text-[15px] leading-relaxed text-muted">
                {para}
              </p>
            ))}
            {sec.list && (
              <ul className="space-y-2">
                {sec.list.map((li, j) => (
                  <li key={j} className="flex gap-2 text-[15px] text-muted">
                    <span className="text-brand-ink">▸</span> {li}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <div className="card mt-10 p-6">
        <p className="font-display text-lg font-extrabold text-fg">Yeh tips amali tor par try karnay ka time hai!</p>
        <Link href="/learn" className="btn btn-primary btn-sm mt-3">
          Abhi seekhna shuru karo — free
        </Link>
      </div>
    </article>
  );
}
