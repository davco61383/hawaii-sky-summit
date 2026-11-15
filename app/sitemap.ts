import type { MetadataRoute } from "next";
import { CATEGORIES, getEntries } from "@/lib/entries";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const all = await getEntries();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/sky`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: `${base}/c/${c.id}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    { url: `${base}/sponsor`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/submit`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.3 },
    ...all.map((e) => ({ url: `${base}/e/${e.slug}`, lastModified: e.checked ? new Date(e.checked) : now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
