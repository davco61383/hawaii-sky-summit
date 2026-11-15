import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";

/**
 * POST /api/admin/remove { email?, pageview_path?, sponsor_click_slug? }
 * Deletes exact matches only: a subscriber (removal request or test row), pageview rows for one path,
 * or click rows for one sponsor slug. Used to clean up test data after checks.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const out: Record<string, number> = {};
  if (typeof b.email === "string" && b.email.includes("@"))
    out.signups = (await db`delete from signups where email = ${b.email.trim().toLowerCase()}`).count;
  if (typeof b.pageview_path === "string" && b.pageview_path.startsWith("/"))
    out.pageviews = (await db`delete from pageviews where path = ${b.pageview_path}`).count;
  if (typeof b.sponsor_click_slug === "string" && b.sponsor_click_slug)
    out.sponsor_clicks = (await db`delete from sponsor_clicks where sponsor_slug = ${b.sponsor_click_slug}`).count;
  if (!Object.keys(out).length) return NextResponse.json({ error: "email, pageview_path or sponsor_click_slug required" }, { status: 400 });
  return NextResponse.json({ ok: true, deleted: out });
}
