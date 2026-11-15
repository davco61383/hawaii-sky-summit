import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";

/** GET /api/admin/queue?status=pending&kind=entry|sponsor_inquiry */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const u = new URL(req.url);
  const status = u.searchParams.get("status") ?? "pending";
  const kind = u.searchParams.get("kind");
  const rows = kind
    ? await db`select * from submissions where status = ${status} and kind = ${kind} order by created_at limit 200`
    : await db`select * from submissions where status = ${status} order by created_at limit 200`;
  return NextResponse.json({ count: rows.length, items: rows.map(({ ip_hash, ...r }) => r) });
}
