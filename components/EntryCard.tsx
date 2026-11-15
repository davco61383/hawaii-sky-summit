import Link from "next/link";
import Countdown from "./Countdown";
import { categoryLabel, type Drop, type Entry } from "@/lib/entries";
import { fmtDate, fmtTime, hstDate, hstWall, relDay } from "@/lib/time";

const ICON: Record<string, string> = { drops: "🎟️", meteors: "🌠", moon: "🌕", "star-parties": "🔭", alerts: "⚠️", spots: "🌋" };

function releaseClock(iso: string) {
  const w = hstWall(new Date(iso));
  return fmtTime(`${String(w.getUTCHours()).padStart(2, "0")}:${String(w.getUTCMinutes()).padStart(2, "0")}`);
}

export function DropCard({ d, big }: { d: Drop; big?: boolean }) {
  return (
    <Link href={`/e/${d.slug}`} className={`card drop ${big ? "big" : ""}`}>
      <div className="row-top">
        <span className="pill">{d.island}</span>
        {d.nextRelease ? <Countdown at={d.nextRelease} /> : <span className="pill soft">Rolling {d.windowDays}-day window</span>}
      </div>
      <h3>{d.title}</h3>
      {d.nextRelease ? (
        <p className="when">
          Next drop <strong>{relDay(hstDate(new Date(d.nextRelease)))} · {releaseClock(d.nextRelease)} HST</strong>
          {d.opensFor ? <> → opens <strong>{fmtDate(d.opensFor)}</strong></> : null}
        </p>
      ) : d.bookableThrough ? (
        <p className="when">
          Bookable now through <strong>{fmtDate(d.bookableThrough)}</strong>
        </p>
      ) : null}
      <p className="sum">{d.summary}</p>
    </Link>
  );
}

export function EventRow({ e }: { e: Entry }) {
  return (
    <Link href={`/e/${e.slug}`} className="event">
      <div className="date">
        <span className="d1">{e.eventDate ? relDay(e.eventDate) : categoryLabel(e.category)}</span>
        {e.eventTime ? <span className="d2">{e.eventTime}</span> : null}
      </div>
      <div className="body">
        <h3>
          <span aria-hidden="true">{ICON[e.category]}</span> {e.title}
        </h3>
        <p className="sum">{e.summary}</p>
        <span className="meta">{e.island}</span>
      </div>
    </Link>
  );
}

export function ResultCard({ e }: { e: Entry }) {
  return (
    <Link href={`/e/${e.slug}`} className="card result">
      <div className="row-top">
        <span className="pill">{ICON[e.category]} {categoryLabel(e.category)}</span>
        <span className="meta">{e.island}</span>
      </div>
      <h3>{e.title}</h3>
      {e.eventDate ? <p className="when">{fmtDate(e.eventDate)}{e.eventTime ? ` · ${e.eventTime}` : ""}</p> : null}
      <p className="sum">{e.summary}</p>
    </Link>
  );
}
