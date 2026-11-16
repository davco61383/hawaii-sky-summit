import * as A from "astronomy-engine";
import { hstDate, hstWall } from "./time";

// Honolulu; times are computed, then shown in HST.
const OBS = new A.Observer(21.3069, -157.8583, 0);

function hstClock(d: Date | undefined | null): string | undefined {
  if (!d) return undefined;
  const w = hstWall(d);
  const h = w.getUTCHours();
  const m = w.getUTCMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Mean synodic month, days. Used to convert phase angle to lunar age. */
export const SYNODIC_DAYS = 29.530588853;

export type MoonPhase = { name: string; emoji: string };

/**
 * Name the moon's phase from illumination (0–100) and Astronomy Engine's
 * MoonPhase angle (0=new, 90=first quarter, 180=full, 270=last quarter).
 *
 * First/Last Quarter apply only near 50% lit (45–55% on the displayed,
 * rounded percentage) or within about a day of the quarter by lunar age.
 * New/Full use the same ~1-day age window. This is the one shared labeler
 * for the homepage, sky calendar, and event pages.
 */
export function moonPhaseName(illuminationPct: number, angleDeg: number): MoonPhase {
  const shown = Math.round(Math.min(100, Math.max(0, illuminationPct)));
  let angle = angleDeg % 360;
  if (angle < 0) angle += 360;
  const age = (angle / 360) * SYNODIC_DAYS;

  const daysFrom = (targetAge: number) => {
    const d = Math.abs(age - targetAge);
    return Math.min(d, SYNODIC_DAYS - d);
  };

  const nearNew = daysFrom(0) <= 1;
  const nearFirst = daysFrom(SYNODIC_DAYS / 4) <= 1;
  const nearFull = daysFrom(SYNODIC_DAYS / 2) <= 1;
  const nearLast = daysFrom((SYNODIC_DAYS * 3) / 4) <= 1;
  const nearHalfLit = shown >= 45 && shown <= 55;

  if (nearNew) return { name: "New Moon", emoji: "🌑" };
  if (nearFull) return { name: "Full Moon", emoji: "🌕" };
  if (nearHalfLit || nearFirst || nearLast) {
    return angle < 180
      ? { name: "First Quarter", emoji: "🌓" }
      : { name: "Last Quarter", emoji: "🌗" };
  }
  if (angle < 90) return { name: "Waxing Crescent", emoji: "🌒" };
  if (angle < 180) return { name: "Waxing Gibbous", emoji: "🌔" };
  if (angle < 270) return { name: "Waning Gibbous", emoji: "🌖" };
  return { name: "Waning Crescent", emoji: "🌘" };
}

function moonAt(at: Date): { illumination: number; angle: number } & MoonPhase {
  const illumination = A.Illumination(A.Body.Moon, at).phase_fraction * 100;
  const angle = A.MoonPhase(at);
  return { illumination: Math.round(illumination), angle, ...moonPhaseName(illumination, angle) };
}

export type Tonight = {
  date: string;
  sunset?: string;
  darkFrom?: string; // end of astronomical twilight
  moonrise?: string;
  moonset?: string;
  illumination: number; // 0..100
  phase: string;
  emoji: string;
  verdict: string;
};

/** Tonight's sky for Honolulu, computed with Astronomy Engine (approximate to a minute or two). */
export function tonight(now = new Date()): Tonight {
  const date = hstDate(now);
  // start the search at local noon today
  const noon = new Date(`${date}T12:00:00-10:00`);
  const at = new Date(`${date}T21:00:00-10:00`);
  const sunset = A.SearchRiseSet(A.Body.Sun, OBS, -1, noon, 1);
  const dark = A.SearchAltitude(A.Body.Sun, OBS, -1, noon, 1, -18);
  const moonrise = A.SearchRiseSet(A.Body.Moon, OBS, +1, noon, 1);
  const moonset = A.SearchRiseSet(A.Body.Moon, OBS, -1, noon, 1);
  const m = moonAt(at);
  const pct = m.illumination;
  const { name, emoji } = m;
  const verdict =
    pct <= 25
      ? "Dark skies — great night for the Milky Way and faint stars."
      : pct <= 60
        ? "Some moonlight — fine for planets, clusters, and bright stars."
        : "Bright Moon — best for Moon views; faint stars will be washed out.";
  return {
    date,
    sunset: hstClock(sunset?.date),
    darkFrom: hstClock(dark?.date),
    moonrise: hstClock(moonrise?.date),
    moonset: hstClock(moonset?.date),
    illumination: pct,
    phase: name,
    emoji,
    verdict,
  };
}

/** Moon illumination and phase name at 9 PM HST on a given HST date. */
export function moonOn(ymd: string): { illumination: number; phase: string; emoji: string; angle: number } {
  const m = moonAt(new Date(`${ymd}T21:00:00-10:00`));
  return { illumination: m.illumination, phase: m.name, emoji: m.emoji, angle: m.angle };
}

/** Moon illumination (%) at 9 PM HST on a given HST date. */
export function moonPctOn(ymd: string): number {
  return moonOn(ymd).illumination;
}
