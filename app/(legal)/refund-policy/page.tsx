import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Learn & Play PK premium subscription aur coin packs ki refund policy.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPage() {
  return (
    <article>
      <h1 className="mb-6 font-display text-3xl font-black">
        <span className="text-gradient">Refund Policy</span>
      </h1>
      <div className="space-y-7 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">7-din no-questions refund</h2>
          <p>Premium kharidne ke 7 din ke andar, agar aapne 3 se kam games khelAY hon, full refund — sirf ek email: salam@learnplaypk.com subject &quot;Refund&quot; ke sath. 3-5 working days mein wahi channel se wapsi.</p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Coin packs</h2>
          <p>Coins redeem hone se pehle (payment ke 48h andar) full refund. Redeemed coins refundable nahi.</p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Duplicate charge</h2>
          <p>Doo dafa kat gaya? Ghabrao nahi — screenshot ke sath email karein, 24h mein duplicate wapas.</p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Cancellation</h2>
          <p>Subscription cancel karne ke baad paid period khatam hone tak premium chalta rehta hai. Kabhi bhi email se cancel — koi call shcall nahi.</p>
        </section>
      </div>
    </article>
  );
}
