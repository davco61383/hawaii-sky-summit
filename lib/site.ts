export const SITE = {
  name: "Hawaii Sky & Summit",
  short: "Sky & Summit",
  tagline: "Hawaiʻi permit drops + night sky, in one place.",
  description:
    "Know exactly when Haleakalā sunrise, Hanauma Bay, Diamond Head and Hāʻena reservations drop — plus tonight's Hawaiʻi sky, meteor showers, moon phases and free star parties.",
  sponsorPriceWeek: 29,
};

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v}`;
  return "http://localhost:3000";
}

/** The site stays out of search engines until SITE_LIVE=1 (owner's go-ahead). */
export function isLive(): boolean {
  return process.env.SITE_LIVE === "1";
}
