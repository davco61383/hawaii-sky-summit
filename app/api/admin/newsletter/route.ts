import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/admin";
import { renderNewsletter } from "@/lib/newsletter";

/** GET /api/admin/newsletter[?format=html|text] — this week's 5-pick draft, ready to paste into a Resend Broadcast. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const n = await renderNewsletter();
  const f = new URL(req.url).searchParams.get("format");
  if (f === "html") return new NextResponse(n.html, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (f === "text") return new NextResponse(n.text, { headers: { "content-type": "text/plain; charset=utf-8" } });
  return NextResponse.json(n);
}
