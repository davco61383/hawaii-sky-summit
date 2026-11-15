import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";
import { clean } from "@/lib/validate";

/**
 * POST /api/admin/approve  { id, action?: "approve"|"reject", overrides?: {title, summary, category, island, event_date, event_time, url, source_url, tags} }
 * Approving an "entry" submission publishes it to the entries table.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    action?: string;
    overrides?: Record<string, unknown>;
  };
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  const [s] = await db`select * from submissions where id = ${id}`;
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (s.status !== "pending") return NextResponse.json({ error: `already ${s.status}` }, { status: 409 });

  if (body.action === "reject" || s.kind !== "entry") {
    const status = body.action === "reject" ? "rejected" : "approved";
    await db`update submissions set status = ${status}, reviewed_at = now() where id = ${id}`;
    return NextResponse.json({ ok: true, id, status });
  }

  const o = body.overrides ?? {};
  const pick = (k: string, max = 600) => clean(o[k], max) ?? (s[k] as string | null);
  const title = pick("title", 140)!;
  const slugBase = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const slug = `${slugBase || "entry"}-${id}`;
  const tags = Array.isArray(o.tags) ? (o.tags as unknown[]).map(String).slice(0, 10) : [];
  const [entry] = await db`
    insert into entries (slug, title, category, island, summary, event_date, event_time, url, source_url, source_checked, tags, status)
    values (${slug}, ${title}, ${pick("category", 40)}, ${pick("island", 40) ?? "Statewide"}, ${pick("summary")},
      ${pick("event_date", 10)}, ${pick("event_time", 60)}, ${pick("url", 1000)}, ${pick("source_url", 1000)},
      current_date, ${tags}, 'approved')
    returning id, slug`;
  await db`update submissions set status = 'approved', reviewed_at = now(), entry_id = ${entry.id} where id = ${id}`;
  return NextResponse.json({ ok: true, id, status: "approved", entry });
}
