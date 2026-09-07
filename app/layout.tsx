import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Self-hosted variable fonts (Fontsource) — build works fully offline, zero CLS, no CDN
import "@fontsource-variable/nunito";
import "@fontsource-variable/inter";
import { Providers } from "@/components/providers";
import { Navbar, MobileTabs } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VercelAnalytics } from "@/components/vercel-analytics";
import { getSiteUrl, siteUrlObj } from "@/lib/env";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrlObj(),
  title: {
    default: "Learn & Play PK — Seekho + Khelo | Free Learning Games & Quizzes",
    template: "%s | Learn & Play PK",
  },
  description:
    "Pakistan's gamified learning platform — English, Arabic, Korean and 5 more languages with Urdu meanings. 43 games, quizzes, brain training. XP, streaks, badges. 100% Free.",
  keywords: ["learn english pakistan", "language learning games", "urdu meaning", "quiz games pakistan", "seekho khelo"],
  authors: [{ name: "Learn & Play PK" }],
  manifest: "/manifest.webmanifest",
  applicationName: "Learn & Play PK",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Learn&Play PK" },
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: SITE_URL,
    siteName: "Learn & Play PK",
    title: "Learn & Play PK — Khelo. Seekho. Jeeto.",
    description:
      "English, Arabic, Korean & more — learn by playing 43 games, with Urdu meanings. XP, streaks, badges, leaderboards.",
    images: [{ url: "/api/og?title=Khelo.%20Seekho.%20Jeeto.", width: 1200, height: 630, alt: "Learn & Play PK" }],
  },
  twitter: { card: "summary_large_image", title: "Learn & Play PK", description: "Khelo. Seekho. Jeeto. — sab free." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#15171B" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Urdu webfont bootstrap. Runs before hydration (inline, 0 KB of JS chunk):
 * the stylesheet is requested immediately at low priority, but the browser only
 * downloads the woff2 once `media` flips to "all" — which we do on the first
 * sign of engagement (scroll / tap / key) or 1.5s after load, whichever is
 * first. Nastaliq then swaps in over the system Nastaliq/serif fallback.
 */
const URDU_FONT_BOOTSTRAP = `(function(){
  var done=false;
  function flip(){
    if(done) return; done=true;
    var l=document.querySelector('link[data-urdu-font]');
    if(l) l.media='all';
    ['scroll','touchstart','pointerdown','keydown'].forEach(function(e){removeEventListener(e,flip,{capture:true});});
  }
  addEventListener('load',function(){
    ['scroll','touchstart','pointerdown','keydown'].forEach(function(e){addEventListener(e,flip,{capture:true,once:true,passive:true});});
    setTimeout(flip,1500);
  });
})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Learn & Play PK",
  url: SITE_URL,
  inLanguage: ["en", "ur"],
  description: "Pakistan's gamified language-learning and games platform",
  publisher: { "@type": "Organization", name: "Learn & Play PK", url: SITE_URL },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Urdu face is ~260KB — bigger than everything else on the page put
            together. It is fetched with a non-render-blocking `media="print"`
            link and only switched on once the page is idle or the user engages,
            so Urdu never competes with first paint for bandwidth. */}
        <link rel="stylesheet" href="/fonts/urdu.css" media="print" data-urdu-font />
        <script dangerouslySetInnerHTML={{ __html: URDU_FONT_BOOTSTRAP }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a href="#main" className="sr-only sr-only-focusable">
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main" className="min-h-[100dvh]">
            {children}
          </main>
          <Footer />
          <MobileTabs />
        </Providers>
        <VercelAnalytics />
      </body>
    </html>
  );
}
