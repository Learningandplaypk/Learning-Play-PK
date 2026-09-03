import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Self-hosted variable fonts (Fontsource) — build works fully offline, zero CLS
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-nastaliq-urdu";
import { Providers } from "@/components/providers";
import { Navbar, MobileTabs } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VercelAnalytics } from "@/components/vercel-analytics";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnplaypk.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Learn & Play PK — Seekho + Khelo | 3D Language Learning & Games",
    template: "%s | Learn & Play PK",
  },
  description:
    "Pakistan's first fully 3D gamified learning platform. English, Arabic, Korean aur 7 languages — 40+ games se seekho. XP, streaks, badges, leaderboards. 100% Free.",
  keywords: ["learn english pakistan", "language learning games", "3d games", "seekho khelo", "english urdu", "quiz games pakistan"],
  authors: [{ name: "Learn & Play PK" }],
  manifest: "/manifest.webmanifest",
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
    title: "Learn & Play PK — Seekho + Khelo, Sab 3D, Sab Free",
    description: "English, Arabic, Korean & more — learn by playing 40+ 3D games. XP, streaks, badges, leaderboards.",
    images: [{ url: "/api/og?title=Seekho%20%2B%20Khelo%20%E2%80%94%20Sab%203D%2C%20Sab%20FREE", width: 1200, height: 630, alt: "Learn & Play PK" }],
  },
  twitter: { card: "summary_large_image", title: "Learn & Play PK", description: "Seekho + Khelo — sab 3D, sab free." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05060F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Learn & Play PK",
  url: SITE_URL,
  inLanguage: ["en", "ur"],
  description: "Pakistan's first fully 3D gamified language-learning and games platform",
  publisher: { "@type": "Organization", name: "Learn & Play PK", url: SITE_URL },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:rounded-lg focus:bg-neon-green focus:px-4 focus:py-2 focus:text-black">
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
          <MobileTabs />
        </Providers>
        <VercelAnalytics />
      </body>
    </html>
  );
}
