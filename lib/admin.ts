import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/** Accepts `Authorization: Bearer <token>` or `x-admin-token: <token>`. */
export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 24) return false;
  const h = req.headers.get("authorization") ?? "";
  const got = (h.toLowerCase().startsWith("bearer ") ? h.slice(7) : req.headers.get("x-admin-token") ?? "").trim();
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function noDb() {
  return NextResponse.json({ error: "database not configured" }, { status: 503 });
}
