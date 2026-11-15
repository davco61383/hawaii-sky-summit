import fs from "fs";
import path from "path";
import { getEntries, upcomingDated, upcomingDrops } from "./entries";
import { activeSponsor } from "./sponsor";
import { siteUrl, SITE } from "./site";
import { fmtDate, fmtTime, hstDate, hstWall, relDay } from "./time";

export type Pick = { line: string; url: string };

/** Five one-line picks: mix of the soonest permit drops and this week's sky events. */
export async function weeklyPicks(now = new Date()): Promise<Pick[]> {
  const all = await getEntries();
  const base = siteUrl();
  const drops = upcomingDrops(all, now)
    .filter((d) => d.nextRelease)
    .filter((d, i, arr) => arr.findIndex((x) => x.sourceUrl === d.sourceUrl) === i) // one per system
    .slice(0, 2)
    .map((d) => {
      const w = hstWall(new Date(d.nextRelease!));
      const hhmm = `${String(w.getUTCHours()).padStart(2, "0")}:${String(w.getUTCMinutes()).padStart(2, "0")}`;
      return {
        line: `🎟️ ${d.title}: next drop ${fmtTime(hhmm)} HST, for ${fmtDate(d.opensFor!)}.`,
        url: `${base}/e/${d.slug}`,
      };
    });
  const sky = upcomingDated(all, ["meteors", "moon", "star-parties", "alerts"], undefined, 14)
    .slice(0, 5 - drops.length)
    .map((e) => ({
      line: `${e.category === "star-parties" ? "🔭" : e.category === "meteors" ? "🌠" : e.category === "moon" ? "🌕" : "⚠️"} ${relDay(e.eventDate!)} — ${e.title}: ${e.summary}`,
      url: `${base}/e/${e.slug}`,
    }));
  const picks = [...drops, ...sky];
  // top up with more drops if the sky is quiet
  if (picks.length < 5) {
    for (const d of upcomingDrops(all, now)) {
      if (picks.length >= 5) break;
      if (!picks.some((p) => p.url.endsWith(d.slug))) picks.push({ line: `🎟️ ${d.title}: ${d.summary}`, url: `${base}/e/${d.slug}` });
    }
  }
  return picks.slice(0, 5);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Renders newsletter/template.html + template.txt with this week's picks (for a Resend Broadcast). */
export async function renderNewsletter(now = new Date()) {
  const picks = await weeklyPicks(now);
  const sponsor = await activeSponsor();
  const base = siteUrl();
  const dir = path.join(process.cwd(), "newsletter");
  const html = fs.readFileSync(path.join(dir, "template.html"), "utf8");
  const text = fs.readFileSync(path.join(dir, "template.txt"), "utf8");
  const sponsorName = sponsor ? sponsor.name : `This spot is open — $${SITE.sponsorPriceWeek}/week`;
  const sponsorUrl = sponsor ? `${base}/go/${sponsor.slug}` : `${base}/sponsor`;
  const sponsorLine = sponsor?.tagline ?? (sponsor ? "" : "Reach Hawaiʻi stargazers and planners.");
  const weekOf = fmtDate(hstDate(now), false);
  const vars: Record<string, string> = {
    WEEK_OF: weekOf,
    SITE_URL: base,
    SPONSOR_NAME: sponsorName,
    SPONSOR_URL: sponsorUrl,
    SPONSOR_LINE: sponsorLine,
  };
  const fill = (tpl: string, isHtml: boolean) => {
    let out = tpl;
    picks.forEach((p, i) => {
      out = out.replaceAll(`{{PICK_${i + 1}}}`, isHtml ? esc(p.line) : p.line);
      out = out.replaceAll(`{{PICK_${i + 1}_URL}}`, p.url);
    });
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, isHtml ? esc(v) : v);
    return out;
  };
  return {
    subject: `5 picks: Hawaiʻi drops + sky, week of ${weekOf}`,
    html: fill(html, true),
    text: fill(text, false),
    picks,
  };
}
