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

function phaseName(angle: number): { name: string; emoji: string } {
  const p = [
    [22.5, "New Moon", "🌑"],
    [67.5, "Waxing Crescent", "🌒"],
    [112.5, "First Quarter", "🌓"],
    [157.5, "Waxing Gibbous", "🌔"],
    [202.5, "Full Moon", "🌕"],
    [247.5, "Waning Gibbous", "🌖"],
    [292.5, "Last Quarter", "🌗"],
    [337.5, "Waning Crescent", "🌘"],
    [360, "New Moon", "🌑"],
  ] as const;
  const hit = p.find(([lim]) => angle < lim)!;
  return { name: hit[1], emoji: hit[2] };
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
  const illum = A.Illumination(A.Body.Moon, at).phase_fraction * 100;
  const { name, emoji } = phaseName(A.MoonPhase(at));
  const pct = Math.round(illum);
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

/** Moon illumination (%) at 9 PM HST on a given HST date. */
export function moonPctOn(ymd: string): number {
  return Math.round(A.Illumination(A.Body.Moon, new Date(`${ymd}T21:00:00-10:00`)).phase_fraction * 100);
}
