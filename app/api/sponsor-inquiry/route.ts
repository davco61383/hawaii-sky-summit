import { NextResponse } from "next/server";
import { ensureSchema, logError, sql } from "@/lib/db";
import { notifyOwner } from "@/lib/resend";
import { checkEmail, clean, cleanUrl, ipHash, isBot, readBody } from "@/lib/validate";

export async function POST(req: Request) {
  const b = await readBody(req);
  if (isBot(b)) return NextResponse.json({ ok: true });
  const name = clean(b.name, 80);
  const business = clean(b.business, 120);
  const message = clean(b.message, 2000);
  const email = checkEmail(b.email);
  if (!email.ok) return NextResponse.json({ ok: false, error: email.reason }, { status: 400 });
  if (!name || !business) return NextResponse.json({ ok: false, error: "Please add your name and business." }, { status: 400 });
  const db = sql();
  if (!db) return NextResponse.json({ ok: false, error: "The form opens very soon — please check back." }, { status: 503 });
  try {
    await ensureSchema();
    const ip = ipHash(req);
    const [{ n }] = await db`select count(*)::int as n from submissions where ip_hash = ${ip} and created_at > now() - interval '1 hour'`;
    if (n >= 5) return NextResponse.json({ ok: false, error: "Too many messages — try again later." }, { status: 429 });
    await db`
      insert into submissions (kind, title, url, contact_name, contact_email, message, ip_hash)
      values ('sponsor_inquiry', ${business}, ${cleanUrl(b.website_url)}, ${name}, ${email.email}, ${message}, ${ip})`;
    await notifyOwner(`Sponsor inquiry: ${business}`, `${name} <${email.email}>\n${b.website_url ?? ""}\n\n${message ?? ""}`);
    return NextResponse.json({ ok: true, message: "Mahalo! We'll be in touch within a couple of days." });
  } catch (e) {
    await logError("api/sponsor-inquiry", e);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
