/**
 * Resend hook. Resend is not connected yet, so every function here is a safe no-op
 * unless RESEND_API_KEY is set. Later: set RESEND_API_KEY + RESEND_AUDIENCE_ID
 * (and optionally NOTIFY_EMAIL / RESEND_FROM) in Vercel and signups start syncing.
 */
const API = "https://api.resend.com";

function key() {
  return process.env.RESEND_API_KEY || "";
}

export function resendEnabled(): boolean {
  return !!key();
}

/** Add a contact to the Resend audience. Returns true if synced, false if skipped/failed. */
export async function syncSignupToResend(email: string): Promise<boolean> {
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key() || !audience) return false;
  try {
    const r = await fetch(`${API}/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Notify the owner (e.g. new sponsor inquiry). No-op until Resend is configured. */
export async function notifyOwner(subject: string, text: string): Promise<boolean> {
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM;
  if (!key() || !to || !from) return false;
  try {
    const r = await fetch(`${API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
