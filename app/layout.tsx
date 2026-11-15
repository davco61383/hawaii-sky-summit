import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import SponsorBar from "@/components/SponsorBar";
import Pageview from "@/components/Pageview";
import { SITE, isLive, siteUrl } from "@/lib/site";
import { activeSponsor } from "@/lib/sponsor";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE.name} — Hawaiʻi permit drops & night sky`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name, title: SITE.name, description: SITE.description },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  // Google Search Console: set GOOGLE_SITE_VERIFICATION to the content value of Google's HTML meta tag.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  robots: isLive() ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#070b1f", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sponsor = await activeSponsor();
  return (
    <html lang="en">
      <body>
        <div className="sky" aria-hidden="true" />
        <SponsorBar slug={sponsor?.slug} name={sponsor?.name} tagline={sponsor?.tagline} price={SITE.sponsorPriceWeek} />
        <header className="top">
          <Link href="/" className="logo" aria-label={`${SITE.name} home`}>
            <span className="logo-mark" aria-hidden="true">✦</span>
            <span>Sky <em>&amp;</em> Summit</span>
          </Link>
          <nav className="nav">
            <Link href="/c/drops">Drops</Link>
            <Link href="/sky">Sky</Link>
            <Link href="/search">Search</Link>
            <Link href="/submit" className="hide-sm">Submit</Link>
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer className="foot wrap">
          <p>
            <Link href="/submit">Submit a tip</Link> · <Link href="/sponsor">Sponsor</Link> · <Link href="/#newsletter">Newsletter</Link> ·{" "}
            <Link href="/about">About &amp; sources</Link>
          </p>
          <p className="muted small">
            Independent guide, not affiliated with NPS, DLNR, the City &amp; County of Honolulu or any agency. All times HST. Always confirm on the official booking page.
          </p>
        </footer>
        <Pageview />
      </body>
    </html>
  );
}
