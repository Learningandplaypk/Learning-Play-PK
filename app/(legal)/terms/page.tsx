import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Learn & Play PK istemal ke shart-o-sharaet.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: Array<[string, React.ReactNode]> = [
  ["Platform", <p key="1">Learn & Play PK aik free educational gaming platform hai. Saare games, saare levels aur saari zubanein har user ke liye free hain — koi daily limit nahi. Premium (Rs. 299/mahina ya Rs. 999/saal) content nahi kholta; woh sirf tajurba behtar banata hai: zero ads, unlimited hearts, progress reports, certificate, offline packs aur cosmetics.</p>],
  ["Accounts", <ul key="2" className="list-disc space-y-1.5 ps-5">
    <li>Ek insaan, ek account — multi-account se leaderboard ranking invalid.</li>
    <li>Guest progress login par merge hota hai; merge reversible nahi.</li>
  </ul>],
  ["Fair play", <ul key="3" className="list-disc space-y-1.5 ps-5">
    <li>Bots, scripts, score manipulation mana. Server-side sanity checks se detect hone par scores remove.</li>
    <li>Leaderboard ranks final hote hain — manual review ke baad.</li>
  </ul>],
  ["Payments & refunds", <ul key="4" className="list-disc space-y-1.5 ps-5">
    <li>Premium Rs. 299/mahina ya Rs. 999/saal — auto-renew, cancel kabhi bhi (email ya /account se). Yearly par 7-din free trial optional hai. Refund 7 din ke andar.</li>
    <li>Refund: 7 din ke andar, agar 3 se kam games khele hon — no questions asked.</li>
    <li>Coins in-app currency hain; cash redemption nahi.</li>
  </ul>],
  ["Content", <p key="5">Platform ka content (words, questions, design) Learn & Play PK ki milkiyat hai. Educational use ke liye free; commercial scraping/reuse mana.</p>],
  ["Liability", <p key="6">Service &quot;as-is&quot; provided hai. Game progress data loss (device change bagair backup) ki zimmedari user ki.</p>],
  ["Contact", <p key="7">salam@learnplaypk.com</p>],
];

export default function TermsPage() {
  return (
    <article>
      <h1 className="mb-6 font-display text-3xl font-black">
        <span className="">Terms of Service</span>
      </h1>
      <p className="mb-8 text-xs text-muted">Aakhri update: September 2026</p>
      {SECTIONS.map(([h, body]) => (
        <section key={h} className="mb-7">
          <h2 className="mb-2 font-display text-lg font-bold">{h}</h2>
          <div className="text-sm leading-relaxed text-muted">{body}</div>
        </section>
      ))}
    </article>
  );
}
