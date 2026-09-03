import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Aapka data kaise use hota hai — Learn & Play PK privacy policy.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: Array<[string, React.ReactNode]> = [
  ["Ham kaun data rakhte hain", <ul key="1" className="list-disc space-y-1.5 pl-5">
    <li><b>Guest:</b> progress sirf aapke browser (localStorage) mein — humare servers tak nahi jata.</li>
    <li><b>Login par:</b> naam, email, XP/level, badges, scores — progress sync ke liye.</li>
    <li><b>Phone OTP:</b> Firebase Secure ko number diya jata hai; hum number store nahi karte.</li>
    <li><b>Audio:</b> pronunciation practice mic sirf aapke device par process hota hai — recording save nahi hoti.</li>
  </ul>],
  ["Ads aur analytics", <ul key="2" className="list-disc space-y-1.5 pl-5">
    <li>Google AdSense (guest users ke liye) — personalized ads ke liye consent poochte hain; decline karo toh non-personalized ads.</li>
    <li>Vercel Analytics — anonymous page views, koi personal profile nahi.</li>
  </ul>],
  ["Payments", <p key="3">Payments Stripe/Safepay ke secure pages par hotay hain — card details kabhi humare servers par nahi aati. Receipt emails billing ke liye.</p>],
  ["Bachon ki privacy", <p key="4">Platform 13+ ke liye hai. Kids mode ke liye parents device-level controls use kar sakte hain.</p>],
  ["Data delete karne ka haq", <p key="5">Profile → Progress Reset (local) ya support@learnplaypk.com par email (cloud). 7 din ke andar delete confirm.</p>],
  ["Contact", <p key="6">salam@learnplaypk.com</p>],
];

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="mb-6 font-display text-3xl font-black">
        <span className="text-gradient">Privacy Policy</span>
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
