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
import { URDU_FONT_BOOTSTRAP } from "@/lib/urdu-font";
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
    <html lang="en" dir="ltr" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Urdu face is ~260KB. Injected as deferred inline @font-face
            from lib/urdu-font.ts so we never 404 a missing stylesheet. */}
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
