import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { hstDate } from "@/lib/time";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|vercel-/i;

/** First-party pageview counter: one row per (HST day, path). No cookies, no IPs stored. */
export async function POST(req: Request) {
  const db = sql();
  if (!db || BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  try {
    const { path } = (await req.json().catch(() => ({}))) as { path?: string };
    if (typeof path !== "string" || !path.startsWith("/") || path.length > 200 || path.startsWith("/api")) {
      return new NextResponse(null, { status: 204 });
    }
    await ensureSchema();
    const clean = path.split("?")[0];
    await db`insert into pageviews (day, path, views) values (${hstDate()}, ${clean}, 1)
             on conflict (day, path) do update set views = pageviews.views + 1`;
  } catch {
    /* counting must never break the page */
  }
  return new NextResponse(null, { status: 204 });
}
