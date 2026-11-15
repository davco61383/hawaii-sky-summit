import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";

/** Zero-result searches, grouped — tells you what content to add next. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const top = await db`
    select lower(query) as query, count(*)::int as times, max(created_at) as last_seen
    from zero_result_searches where created_at > now() - interval '90 days'
    group by lower(query) order by times desc, last_seen desc limit 100`;
  return NextResponse.json({ items: top });
}
