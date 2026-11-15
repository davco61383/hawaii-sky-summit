import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";
import { clean, cleanDate, cleanUrl } from "@/lib/validate";

/** GET: sponsor weeks + click counts. POST: book a week {slug,name,url,tagline,week_start,week_end,price_cents,status}. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const weeks = await db`
    select w.*, (select count(*)::int from sponsor_clicks c where c.sponsor_week_id = w.id) as clicks
    from sponsor_weeks w order by week_start desc limit 100`;
  const inquiries = await db`
    select id, title as business, url, contact_name, contact_email, message, status, created_at
    from submissions where kind = 'sponsor_inquiry' order by created_at desc limit 50`;
  return NextResponse.json({ weeks, inquiries });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = (clean(b.slug, 60) ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const name = clean(b.name, 80);
  const url = cleanUrl(b.url);
  const start = cleanDate(b.week_start);
  const end = cleanDate(b.week_end);
  if (!slug || !name || !url || !start || !end)
    return NextResponse.json({ error: "slug, name, url, week_start, week_end required" }, { status: 400 });
  const status = ["booked", "active", "done", "cancelled"].includes(String(b.status)) ? String(b.status) : "booked";
  const price = Number.isInteger(b.price_cents) ? (b.price_cents as number) : 2900;
  const [row] = await db`
    insert into sponsor_weeks (slug, name, url, tagline, week_start, week_end, price_cents, status)
    values (${slug}, ${name}, ${url}, ${clean(b.tagline, 140)}, ${start}, ${end}, ${price}, ${status})
    on conflict (slug) do update set name = excluded.name, url = excluded.url, tagline = excluded.tagline,
      week_start = excluded.week_start, week_end = excluded.week_end, price_cents = excluded.price_cents, status = excluded.status
    returning *`;
  return NextResponse.json({ ok: true, sponsor: row });
}
