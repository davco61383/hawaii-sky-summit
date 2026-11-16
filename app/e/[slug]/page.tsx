import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/Countdown";
import SignupForm from "@/components/SignupForm";
import { categoryLabel, computeDrop, getEntry } from "@/lib/entries";
import { moonOn } from "@/lib/sky";
import { fmtDate, fmtTime, hstDate, hstWall, relDay } from "@/lib/time";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEntry(slug);
  return e ? { title: e.title, description: e.summary, alternates: { canonical: `/e/${e.slug}` } } : {};
}

export default async function EntryPage({ params }: P) {
  const { slug } = await params;
  const e = await getEntry(slug);
  if (!e) notFound();
  const d = computeDrop(e);
  const moon =
    e.eventDate && ["meteors", "star-parties"].includes(e.category) ? moonOn(e.eventDate) : null;
  const clock = d.nextRelease
    ? (() => {
        const w = hstWall(new Date(d.nextRelease!));
        return fmtTime(`${String(w.getUTCHours()).padStart(2, "0")}:${String(w.getUTCMinutes()).padStart(2, "0")}`);
      })()
    : null;
  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return u;
    }
  };
  return (
    <>
      <nav className="crumbs">
        <Link href="/">Home</Link> / <Link href={`/c/${e.category}`}>{categoryLabel(e.category)}</Link>
      </nav>
      <article className="card entry">
        <div className="row-top">
          <span className="pill">{categoryLabel(e.category)}</span>
          <span className="meta">{e.island}</span>
        </div>
        <h1>{e.title}</h1>
        {d.nextRelease ? (
          <p className="when big">
            Next drop: <strong>{relDay(hstDate(new Date(d.nextRelease)))} at {clock} HST</strong> → opens <strong>{fmtDate(d.opensFor!)}</strong>
            <br />
            <Countdown at={d.nextRelease} />
          </p>
        ) : d.bookableThrough ? (
          <p className="when big">
            Rolling {e.windowDays}-day window — bookable now through <strong>{fmtDate(d.bookableThrough)}</strong>
          </p>
        ) : null}
        {e.eventDate ? (
          <p className="when big">
            <strong>{fmtDate(e.eventDate)}</strong>
            {e.endDate && e.endDate !== e.eventDate ? <> – {fmtDate(e.endDate)}</> : null}
            {e.eventTime ? <> · {e.eventTime}</> : null}
            {moon ? <span className="muted"> · {moon.emoji} {moon.phase}, {moon.illumination}% lit at 9 PM</span> : null}
          </p>
        ) : null}
        <p className="lead">{e.summary}</p>
        {e.details ? <p>{e.details}</p> : null}
        <div className="actions">
          {e.url ? (
            <a className="btn" href={e.url} target="_blank" rel="noopener">
              {e.category === "drops" ? "Book on the official site" : "Official page"} ↗
            </a>
          ) : null}
        </div>
        <p className="source">
          Source:{" "}
          <a href={e.sourceUrl} target="_blank" rel="noopener">
            {host(e.sourceUrl)}
          </a>
          {e.checked ? <> · checked {fmtDate(e.checked, false)}</> : null}
        </p>
        {e.tags?.length ? (
          <p className="tags">
            {e.tags.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip sm">
                {t}
              </Link>
            ))}
          </p>
        ) : null}
      </article>
      <SignupForm source={`entry:${e.slug}`} />
    </>
  );
}
