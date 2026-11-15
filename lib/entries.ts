import { ensureSchema, logError, sql } from "./db";
import { CATEGORIES, SEED_ENTRIES, type Category, type Entry } from "./seed-data";
import { addDays, hstDate, hstInstant, weekdayOf } from "./time";

export type { Entry, Category };
export { CATEGORIES };

type Row = {
  slug: string;
  title: string;
  category: Category;
  island: string;
  summary: string;
  details: string | null;
  event_date: Date | string | null;
  end_date: Date | string | null;
  event_time: string | null;
  window_days: number | null;
  release_time: string | null;
  release_weekdays: number[] | null;
  url: string | null;
  source_url: string;
  source_checked: Date | string | null;
  tags: string[] | null;
};

function ymd(v: Date | string | null): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v.slice(0, 10);
  // postgres "date" is parsed at local midnight; build from local fields to avoid TZ drift
  return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
}

function fromRow(r: Row): Entry {
  return {
    slug: r.slug,
    title: r.title,
    category: r.category,
    island: r.island,
    summary: r.summary,
    details: r.details ?? undefined,
    eventDate: ymd(r.event_date),
    endDate: ymd(r.end_date),
    eventTime: r.event_time ?? undefined,
    windowDays: r.window_days ?? undefined,
    releaseTime: r.release_time ?? undefined,
    releaseWeekdays: r.release_weekdays ?? undefined,
    url: r.url ?? undefined,
    sourceUrl: r.source_url,
    checked: ymd(r.source_checked) ?? "",
    tags: r.tags ?? [],
  };
}

/** All approved entries — from Postgres when configured, otherwise the bundled seed list. */
export async function getEntries(): Promise<Entry[]> {
  const db = sql();
  if (!db) return SEED_ENTRIES;
  try {
    await ensureSchema();
    const rows = await db<Row[]>`select * from entries where status = 'approved' order by event_date nulls last, id`;
    return rows.map(fromRow);
  } catch (e) {
    await logError("getEntries", e);
    return SEED_ENTRIES;
  }
}

export async function getEntry(slug: string): Promise<Entry | undefined> {
  return (await getEntries()).find((e) => e.slug === slug);
}

export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʻ'‘’`]/g, "")
    .toLowerCase();
}

export function searchEntries(all: Entry[], q: string, category?: string): Entry[] {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  return all.filter((e) => {
    if (category && e.category !== category) return false;
    if (!terms.length) return true;
    const hay = norm([e.title, e.summary, e.details, e.island, e.category, ...(e.tags ?? [])].join(" "));
    return terms.every((t) => hay.includes(t));
  });
}

export type Drop = Entry & {
  /** Next release instant (ISO) when the source gives an exact release time. */
  nextRelease?: string;
  /** HST date that the next release opens. */
  opensFor?: string;
  /** Latest bookable HST date right now, for rolling windows. */
  bookableThrough?: string;
};

export function computeDrop(e: Entry, now = new Date()): Drop {
  if (!e.windowDays) return e;
  const today = hstDate(now);
  if (e.releaseTime) {
    for (let i = 0; i < 8; i++) {
      const day = addDays(today, i);
      if (e.releaseWeekdays && !e.releaseWeekdays.includes(weekdayOf(day))) continue;
      const at = hstInstant(day, e.releaseTime);
      if (at.getTime() > now.getTime()) {
        return { ...e, nextRelease: at.toISOString(), opensFor: addDays(day, e.windowDays) };
      }
    }
  }
  return { ...e, bookableThrough: addDays(today, e.windowDays) };
}

/** Drops ordered by soonest exact release first, then rolling windows. */
export function upcomingDrops(all: Entry[], now = new Date()): Drop[] {
  return all
    .filter((e) => e.category === "drops")
    .map((e) => computeDrop(e, now))
    .sort((a, b) => {
      if (a.nextRelease && b.nextRelease) return a.nextRelease.localeCompare(b.nextRelease);
      if (a.nextRelease) return -1;
      if (b.nextRelease) return 1;
      return (a.windowDays ?? 999) - (b.windowDays ?? 999);
    });
}

/** Dated sky/event entries that haven't ended yet, soonest first. */
export function upcomingDated(all: Entry[], cats: Category[], today = hstDate(), days?: number): Entry[] {
  const until = days ? addDays(today, days) : "9999-12-31";
  return all
    .filter((e) => cats.includes(e.category) && e.eventDate)
    .filter((e) => (e.endDate ?? e.eventDate)! >= today && e.eventDate! <= until)
    .sort((a, b) => a.eventDate!.localeCompare(b.eventDate!));
}

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
