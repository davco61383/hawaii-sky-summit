import { ensureSchema, logError, sql } from "./db";
import { hstDate, addDays } from "./time";

export type Sponsor = { id: number; slug: string; name: string; url: string; tagline: string | null; week_start: string; week_end: string };

export async function activeSponsor(): Promise<Sponsor | null> {
  const db = sql();
  if (!db) return null;
  try {
    await ensureSchema();
    const today = hstDate();
    const rows = await db<Sponsor[]>`
      select id, slug, name, url, tagline, week_start, week_end from sponsor_weeks
      where status in ('booked','active') and week_start <= ${today} and week_end >= ${today}
      order by week_start desc limit 1`;
    return rows[0] ?? null;
  } catch (e) {
    await logError("activeSponsor", e);
    return null;
  }
}

export type PublicStats = {
  available: boolean;
  views7: number;
  views30: number;
  subscribers: number;
  entries: number;
  sponsorClicks30: number;
  since?: string;
};

/** Real numbers straight from Postgres (no padding). */
export async function publicStats(): Promise<PublicStats> {
  const db = sql();
  const empty = { available: false, views7: 0, views30: 0, subscribers: 0, entries: 0, sponsorClicks30: 0 };
  if (!db) return empty;
  try {
    await ensureSchema();
    const today = hstDate();
    const [r] = await db`
      select
        (select coalesce(sum(views),0)::int from pageviews where day > ${addDays(today, -7)}) as views7,
        (select coalesce(sum(views),0)::int from pageviews where day > ${addDays(today, -30)}) as views30,
        (select count(*)::int from signups where unsubscribed_at is null) as subscribers,
        (select count(*)::int from entries where status='approved') as entries,
        (select count(*)::int from sponsor_clicks where created_at > now() - interval '30 days') as clicks30,
        (select min(day) from pageviews) as since`;
    return {
      available: true,
      views7: r.views7,
      views30: r.views30,
      subscribers: r.subscribers,
      entries: r.entries,
      sponsorClicks30: r.clicks30,
      since: r.since ?? undefined,
    };
  } catch (e) {
    await logError("publicStats", e);
    return empty;
  }
}
