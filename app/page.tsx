import Link from "next/link";
import { DropCard, EventRow } from "@/components/EntryCard";
import SearchBar, { CategoryChips } from "@/components/SearchBar";
import SignupForm from "@/components/SignupForm";
import { getEntries, upcomingDated, upcomingDrops } from "@/lib/entries";
import { tonight } from "@/lib/sky";
import { fmtDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = await getEntries();
  const now = new Date();
  const drops = upcomingDrops(all, now);
  // one card per booking system (e.g. not both Hāʻena entry and shuttle)
  const timedAll = drops.filter((d) => d.nextRelease);
  const distinct = timedAll.filter((d, i, a) => a.findIndex((x) => x.sourceUrl === d.sourceUrl) === i);
  const timed = [...distinct, ...timedAll.filter((d) => !distinct.includes(d))].slice(0, 4);
  const rolling = drops.filter((d) => !d.nextRelease && d.bookableThrough).slice(0, 4);
  const t = tonight(now);
  let week = upcomingDated(all, ["meteors", "moon", "star-parties"], undefined, 7);
  if (week.length < 3) week = upcomingDated(all, ["meteors", "moon", "star-parties"]).slice(0, 4);
  const parties = upcomingDated(all, ["star-parties"]).filter((e) => !week.includes(e)).slice(0, 3);
  const alerts = all
    .filter((e) => e.category === "alerts")
    .sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? ""))
    .slice(0, 2);

  return (
    <>
      <section className="hero">
        <h1>
          Hawaiʻi permit drops <span className="amp">+</span> tonight&apos;s sky
        </h1>
        <p className="muted">Know the minute Haleakalā, Hanauma Bay and Hāʻena slots open — and when the stars are worth the drive.</p>
      </section>

      <section aria-labelledby="next-drops">
        <div className="sec-head">
          <h2 id="next-drops">⏱ Next drops</h2>
          <Link href="/c/drops" className="more">All drops →</Link>
        </div>
        <div className="grid top-grid">
          {timed[0] ? <DropCard d={timed[0]} big /> : null}
          <section className="card tonight" aria-labelledby="tonight">
            <div className="tn-moon" aria-hidden="true">{t.emoji}</div>
            <div>
              <h2 id="tonight">Tonight · {fmtDate(t.date)}</h2>
              <p className="tn-phase">
                {t.phase} · <strong>{t.illumination}%</strong> lit
              </p>
              <p className="muted">{t.verdict}</p>
              <ul className="tn-facts">
                {t.sunset ? <li>Sunset <strong>{t.sunset}</strong></li> : null}
                {t.darkFrom ? <li>Full dark <strong>{t.darkFrom}</strong></li> : null}
                {t.moonrise ? <li>Moonrise <strong>{t.moonrise}</strong></li> : null}
                {t.moonset ? <li>Moonset <strong>{t.moonset}</strong></li> : null}
              </ul>
              <p className="tiny muted">Honolulu, HST. Computed with Astronomy Engine.</p>
            </div>
          </section>
          {timed.slice(1).map((d) => (
            <DropCard key={d.slug} d={d} />
          ))}
        </div>
      </section>

      <section aria-labelledby="week">
        <div className="sec-head">
          <h2 id="week">🌌 This week in the sky</h2>
          <Link href="/sky" className="more">Sky calendar →</Link>
        </div>
        <div className="list">
          {week.map((e) => (
            <EventRow key={e.slug} e={e} />
          ))}
        </div>
      </section>

      <SignupForm source="home" />

      <SearchBar />
      <CategoryChips />

      {parties.length ? (
        <section aria-labelledby="parties">
          <div className="sec-head">
            <h2 id="parties">🔭 Free star parties</h2>
            <Link href="/c/star-parties" className="more">All →</Link>
          </div>
          <div className="list">
            {parties.map((e) => (
              <EventRow key={e.slug} e={e} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="rolling">
        <div className="sec-head">
          <h2 id="rolling">📅 Book-ahead windows</h2>
        </div>
        <div className="grid">
          {rolling.map((d) => (
            <DropCard key={d.slug} d={d} />
          ))}
        </div>
      </section>

      {alerts.length ? (
        <section aria-labelledby="alerts">
          <div className="sec-head">
            <h2 id="alerts">⚠️ Park alerts</h2>
            <Link href="/c/alerts" className="more">All →</Link>
          </div>
          <div className="list">
            {alerts.map((e) => (
              <EventRow key={e.slug} e={e} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
