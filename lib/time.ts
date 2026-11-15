// Hawaii is UTC-10 all year (no DST).
export const HST_OFFSET_MS = -10 * 3600 * 1000;

/** A Date whose UTC fields read as Hawaii wall-clock time. */
export function hstWall(d = new Date()): Date {
  return new Date(d.getTime() + HST_OFFSET_MS);
}

/** YYYY-MM-DD for the given instant, in HST. */
export function hstDate(d = new Date()): string {
  return hstWall(d).toISOString().slice(0, 10);
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Instant for a Hawaii wall-clock date + "HH:MM". */
export function hstInstant(ymd: string, hhmm = "00:00"): Date {
  return new Date(`${ymd}T${hhmm}:00-10:00`);
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(ymd: string, withWeekday = true): string {
  const d = new Date(ymd + "T00:00:00Z");
  const s = `${MO[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const y = d.getUTCFullYear() !== new Date().getUTCFullYear() ? `, ${d.getUTCFullYear()}` : "";
  return withWeekday ? `${WD[d.getUTCDay()]}, ${s}${y}` : `${s}${y}`;
}

export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 0 && m === 0) return "12:00 AM";
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export function weekdayOf(ymd: string): number {
  return new Date(ymd + "T00:00:00Z").getUTCDay();
}

export function relDay(ymd: string, today = hstDate()): string {
  const diff = Math.round((Date.parse(ymd) - Date.parse(today)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return fmtDate(ymd);
}
