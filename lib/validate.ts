import { createHash } from "crypto";

const DISPOSABLE = new Set([
  "example.com", "example.org", "example.net", "test.com", "test.org", "testing.com", "invalid", "localhost",
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
  "tempmail.com", "temp-mail.org", "tempmail.net", "yopmail.com", "trashmail.com", "getnada.com",
  "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mailnesia.com", "mintemail.com",
  "emailondeck.com", "spamgourmet.com", "mohmal.com", "burnermail.io", "discard.email", "moakt.com",
  "tempr.email", "mail.tm", "mailpoof.com", "inboxkitten.com", "1secmail.com", "emailfake.com",
]);
const JUNK_LOCAL = /^(test|testing|tester|asdf|qwerty|foo|bar|abc|aaa+|xxx+|fake|none|noreply|no-reply|null|admin|user|sample|demo)(\d*)$/i;

export type EmailCheck = { ok: true; email: string } | { ok: false; reason: string };

export function checkEmail(raw: unknown): EmailCheck {
  if (typeof raw !== "string") return { ok: false, reason: "Please enter an email address." };
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email))
    return { ok: false, reason: "That doesn't look like a valid email address." };
  const [local, domain] = email.split("@");
  if (JUNK_LOCAL.test(local)) return { ok: false, reason: "Please use your real email address." };
  if (
    DISPOSABLE.has(domain) ||
    [...DISPOSABLE].some((d) => domain.endsWith("." + d)) ||
    /(^|\.)(example|test|invalid|localhost)$/.test(domain) ||
    /mailinator|guerrilla|tempmail|trashmail|10minute|yopmail|throwaway/.test(domain)
  )
    return { ok: false, reason: "Disposable or test addresses can't be used." };
  return { ok: true, email };
}

export function clean(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
  return s ? s.slice(0, max) : null;
}

export function cleanUrl(v: unknown): string | null {
  const s = clean(v, 1000);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function cleanDate(v: unknown): string | null {
  const s = clean(v, 10);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) ? s : null;
}

export function ipHash(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  return createHash("sha256").update(ip + (process.env.ADMIN_TOKEN ?? "hss")).digest("hex").slice(0, 16);
}

/** Simple honeypot check: bots fill the hidden "website" field. */
export function isBot(body: Record<string, unknown>): boolean {
  return typeof body.website === "string" && body.website.trim() !== "";
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const fd = await req.formData().catch(() => null);
  return fd ? Object.fromEntries(fd.entries()) : {};
}
