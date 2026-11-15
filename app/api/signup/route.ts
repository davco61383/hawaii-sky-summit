import { NextResponse } from "next/server";
import { ensureSchema, logError, sql } from "@/lib/db";
import { syncSignupToResend } from "@/lib/resend";
import { checkEmail, clean, ipHash, isBot, readBody } from "@/lib/validate";

export async function POST(req: Request) {
  const body = await readBody(req);
  if (isBot(body)) return NextResponse.json({ ok: true });
  const check = checkEmail(body.email);
  if (!check.ok) return NextResponse.json({ ok: false, error: check.reason }, { status: 400 });
  const db = sql();
  if (!db) return NextResponse.json({ ok: false, error: "Signups open very soon — please check back." }, { status: 503 });
  try {
    await ensureSchema();
    const source = clean(body.source, 60) ?? "site";
    const rows = await db`
      insert into signups (email, source, ip_hash) values (${check.email}, ${source}, ${ipHash(req)})
      on conflict (email) do update set unsubscribed_at = null
      returning id, resend_synced`;
    if (!rows[0].resend_synced && (await syncSignupToResend(check.email))) {
      await db`update signups set resend_synced = true where id = ${rows[0].id}`;
    }
    return NextResponse.json({ ok: true, message: "You're in! Watch for 5 picks each week." });
  } catch (e) {
    await logError("api/signup", e);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
