import postgres from "postgres";
import { SEED_ENTRIES } from "./seed-data";

type Sql = ReturnType<typeof postgres>;

const g = globalThis as unknown as { __sql?: Sql | null; __schemaReady?: Promise<void> };

export function dbUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

export function hasDb(): boolean {
  return !!dbUrl();
}

/** Returns a postgres client, or null when no database is configured yet. */
export function sql(): Sql | null {
  if (g.__sql !== undefined) return g.__sql;
  const url = dbUrl();
  if (!url) {
    g.__sql = null;
    return null;
  }
  const local = /localhost|127\.0\.0\.1/.test(url);
  g.__sql = postgres(url, {
    max: Number(process.env.PG_POOL_MAX ?? 3),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // safe with Neon's pooled (pgbouncer) endpoint
    ssl: local ? false : "require",
    onnotice: () => {},
    // return DATE columns as plain 'YYYY-MM-DD' strings (no timezone drift)
    types: { date: { to: 1082, from: [1082], serialize: (x: string) => x, parse: (x: string) => x } },
  });
  return g.__sql;
}

export const SCHEMA = /* sql */ `
create table if not exists entries (
  id serial primary key,
  slug text unique not null,
  title text not null,
  category text not null,
  island text not null default 'Statewide',
  summary text not null,
  details text,
  event_date date,
  end_date date,
  event_time text,
  window_days int,
  release_time text,
  release_weekdays int[],
  url text,
  source_url text not null,
  source_checked date,
  tags text[] not null default '{}',
  status text not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entries_cat_idx on entries (category, event_date);

create table if not exists submissions (
  id serial primary key,
  kind text not null default 'entry',          -- 'entry' | 'sponsor_inquiry'
  title text,
  category text,
  island text,
  summary text,
  event_date date,
  event_time text,
  url text,
  source_url text,
  contact_name text,
  contact_email text,
  message text,
  status text not null default 'pending',      -- pending | approved | rejected
  entry_id int references entries(id) on delete set null,
  ip_hash text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists submissions_status_idx on submissions (status, created_at);

create table if not exists signups (
  id serial primary key,
  email text unique not null,
  source text,
  resend_synced boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists zero_result_searches (
  id serial primary key,
  query text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists pageviews (
  day date not null,
  path text not null,
  views int not null default 0,
  primary key (day, path)
);

create table if not exists sponsor_weeks (
  id serial primary key,
  slug text unique not null,
  name text not null,
  url text not null,
  tagline text,
  week_start date not null,
  week_end date not null,
  price_cents int not null default 2900,
  status text not null default 'booked',       -- booked | active | done | cancelled
  created_at timestamptz not null default now()
);

create table if not exists sponsor_clicks (
  id serial primary key,
  sponsor_slug text not null,
  sponsor_week_id int references sponsor_weeks(id) on delete set null,
  referer text,
  created_at timestamptz not null default now()
);

create table if not exists errors (
  id serial primary key,
  where_ text not null,
  message text not null,
  detail text,
  created_at timestamptz not null default now()
);
`;

/** Creates tables (idempotent) and seeds entries the first time. Runs once per server instance. */
export function ensureSchema(): Promise<void> {
  const db = sql();
  if (!db) return Promise.resolve();
  if (!g.__schemaReady) {
    g.__schemaReady = (async () => {
      for (const stmt of SCHEMA.split(/;\s*\n/).map((x) => x.trim()).filter(Boolean)) await db.unsafe(stmt);
      const [{ n }] = await db`select count(*)::int as n from entries`;
      if (n === 0) await seedEntries();
    })().catch((e) => {
      g.__schemaReady = undefined;
      throw e;
    });
  }
  return g.__schemaReady;
}

/** Upserts all seed entries (safe to re-run; updates text of existing seed slugs). */
export async function seedEntries(): Promise<number> {
  const db = sql();
  if (!db) return 0;
  let count = 0;
  for (const e of SEED_ENTRIES) {
    await db`
      insert into entries (slug, title, category, island, summary, details, event_date, end_date, event_time,
        window_days, release_time, release_weekdays, url, source_url, source_checked, tags, status)
      values (${e.slug}, ${e.title}, ${e.category}, ${e.island}, ${e.summary}, ${e.details ?? null},
        ${e.eventDate ?? null}, ${e.endDate ?? null}, ${e.eventTime ?? null}, ${e.windowDays ?? null},
        ${e.releaseTime ?? null}, ${e.releaseWeekdays ?? null}, ${e.url ?? null}, ${e.sourceUrl},
        ${e.checked}, ${e.tags ?? []}, 'approved')
      on conflict (slug) do update set
        title = excluded.title, category = excluded.category, island = excluded.island,
        summary = excluded.summary, details = excluded.details, event_date = excluded.event_date,
        end_date = excluded.end_date, event_time = excluded.event_time, window_days = excluded.window_days,
        release_time = excluded.release_time, release_weekdays = excluded.release_weekdays,
        url = excluded.url, source_url = excluded.source_url, source_checked = excluded.source_checked,
        tags = excluded.tags, updated_at = now()`;
    count++;
  }
  return count;
}

export async function logError(where: string, err: unknown) {
  try {
    const db = sql();
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${where}]`, err);
    if (!db) return;
    await ensureSchema();
    await db`insert into errors (where_, message, detail) values (${where}, ${message.slice(0, 1000)},
      ${err instanceof Error ? (err.stack ?? "").slice(0, 4000) : null})`;
  } catch {
    /* never throw from the error logger */
  }
}
