import { NextResponse } from "next/server";
import { ensureSchema, logError, sql } from "@/lib/db";
import { CATEGORIES } from "@/lib/seed-data";
import { checkEmail, clean, cleanDate, cleanUrl, ipHash, isBot, readBody } from "@/lib/validate";

export async function POST(req: Request) {
  const b = await readBody(req);
  if (isBot(b)) return NextResponse.json({ ok: true });
  const title = clean(b.title, 140);
  const summary = clean(b.summary, 600);
  const sourceUrl = cleanUrl(b.source_url);
  const category = CATEGORIES.some((c) => c.id === b.category) ? String(b.category) : null;
  if (!title || !summary || !sourceUrl || !category)
    return NextResponse.json(
      { ok: false, error: "Please add a title, category, short description and an official source link." },
      { status: 400 },
    );
  let email: string | null = null;
  if (typeof b.contact_email === "string" && b.contact_email.trim()) {
    const c = checkEmail(b.contact_email);
    if (!c.ok) return NextResponse.json({ ok: false, error: c.reason }, { status: 400 });
    email = c.email;
  }
  const db = sql();
  if (!db) return NextResponse.json({ ok: false, error: "Submissions open very soon — please check back." }, { status: 503 });
  try {
    await ensureSchema();
    const ip = ipHash(req);
    const [{ n }] = await db`select count(*)::int as n from submissions where ip_hash = ${ip} and created_at > now() - interval '1 hour'`;
    if (n >= 5) return NextResponse.json({ ok: false, error: "Too many submissions — try again later." }, { status: 429 });
    await db`
      insert into submissions (kind, title, category, island, summary, event_date, event_time, url, source_url,
        contact_name, contact_email, ip_hash)
      values ('entry', ${title}, ${category}, ${clean(b.island, 40) ?? "Statewide"}, ${summary},
        ${cleanDate(b.event_date)}, ${clean(b.event_time, 60)}, ${cleanUrl(b.url)}, ${sourceUrl},
        ${clean(b.contact_name, 80)}, ${email}, ${ip})`;
    return NextResponse.json({ ok: true, message: "Mahalo! It's in the review queue." });
  } catch (e) {
    await logError("api/submit", e);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
