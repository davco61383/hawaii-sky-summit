import type { Metadata } from "next";
import Link from "next/link";
import { getEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About & sources", description: "How Hawaii Sky & Summit gets its information, and every source we use." };

export default async function About() {
  const all = await getEntries();
  const sources = [...new Set(all.map((e) => e.sourceUrl))].sort();
  return (
    <>
      <section className="hero sm">
        <h1>About &amp; sources</h1>
      </section>
      <section className="card">
        <p>
          Hawaii Sky &amp; Summit tracks when Hawaiʻi&apos;s timed-entry and permit reservations open, and what&apos;s worth looking up at night. Every listing links to the official or primary source it came from, with the date we checked it. If we can&apos;t verify a date, we leave it out.
        </p>
        <p>
          Countdown times are calculated from each agency&apos;s published release rule (e.g. Haleakalā sunrise: 60 and 2 days ahead at 7:00 AM HST). &ldquo;Tonight&rdquo; moon and sun times are computed for Honolulu with the open-source Astronomy Engine library.
        </p>
        <p>
          Spotted something wrong? <Link href="/submit">Send a correction</Link>.
        </p>
      </section>
      <section className="card">
        <h2>Sources ({sources.length})</h2>
        <ul className="sources">
          {sources.map((s) => (
            <li key={s}>
              <a href={s} target="_blank" rel="noopener">{s}</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
