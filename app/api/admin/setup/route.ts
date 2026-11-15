import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, seedEntries, sql } from "@/lib/db";

/** POST /api/admin/setup — create tables and (re)upsert the sourced seed entries. Idempotent. */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  if (!sql()) return noDb();
  await ensureSchema();
  const seeded = await seedEntries();
  return NextResponse.json({ ok: true, seeded });
}
