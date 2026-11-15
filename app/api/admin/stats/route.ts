import { NextResponse } from "next/server";
import { isAdmin, noDb, unauthorized } from "@/lib/admin";
import { ensureSchema, sql } from "@/lib/db";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const db = sql();
  if (!db) return noDb();
  await ensureSchema();
  const [totals] = await db`
    select
      (select count(*)::int from entries where status='approved') as entries,
      (select count(*)::int from submissions where kind='entry' and status='pending') as pending_submissions,
      (select count(*)::int from submissions where kind='sponsor_inquiry' and status='pending') as pending_sponsor_inquiries,
      (select count(*)::int from signups where unsubscribed_at is null) as signups,
      (select count(*)::int from signups where created_at > now() - interval '7 days') as signups_7d,
      (select coalesce(sum(views),0)::int from pageviews where day > current_date - 7) as views_7d,
      (select coalesce(sum(views),0)::int from pageviews where day > current_date - 30) as views_30d,
      (select count(*)::int from sponsor_clicks where created_at > now() - interval '30 days') as sponsor_clicks_30d,
      (select count(*)::int from zero_result_searches where created_at > now() - interval '30 days') as zero_result_searches_30d,
      (select count(*)::int from errors where created_at > now() - interval '7 days') as errors_7d`;
  const daily = await db`select day, sum(views)::int as views from pageviews where day > current_date - 30 group by day order by day`;
  const topPages = await db`select path, sum(views)::int as views from pageviews where day > current_date - 30 group by path order by views desc limit 20`;
  const recentErrors = await db`select where_ as where, message, created_at from errors order by created_at desc limit 20`;
  return NextResponse.json({ totals, daily, topPages, recentErrors });
}
