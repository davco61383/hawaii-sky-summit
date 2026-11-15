import { NextResponse } from "next/server";
import { ensureSchema, logError, sql } from "@/lib/db";
import { hstDate } from "@/lib/time";

/** /go/<sponsor> — logs the click, then redirects to the sponsor's site. */
export async function GET(req: Request, ctx: { params: Promise<{ sponsor: string }> }) {
  const { sponsor } = await ctx.params;
  const slug = sponsor.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const fallback = new URL("/sponsor", req.url);
  const db = sql();
  if (!db || !slug) return NextResponse.redirect(fallback, 302);
  try {
    await ensureSchema();
    const today = hstDate();
    const rows = await db<{ id: number; url: string }[]>`
      select id, url from sponsor_weeks where slug = ${slug} and status <> 'cancelled'
      order by (week_start <= ${today} and week_end >= ${today}) desc, week_start desc limit 1`;
    if (!rows[0]) return NextResponse.redirect(fallback, 302);
    await db`insert into sponsor_clicks (sponsor_slug, sponsor_week_id, referer)
             values (${slug}, ${rows[0].id}, ${(req.headers.get("referer") ?? "").slice(0, 300)})`;
    return NextResponse.redirect(rows[0].url, 302);
  } catch (e) {
    await logError("go", e);
    return NextResponse.redirect(fallback, 302);
  }
}
