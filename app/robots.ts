import type { MetadataRoute } from "next";
import { isLive, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview mode: stay out of search engines until the owner sets SITE_LIVE=1.
  if (!isLive()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/go/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
