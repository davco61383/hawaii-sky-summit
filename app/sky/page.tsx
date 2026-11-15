import type { Metadata } from "next";
import { EventRow } from "@/components/EntryCard";
import { CategoryChips } from "@/components/SearchBar";
import { getEntries, upcomingDated } from "@/lib/entries";
import { tonight } from "@/lib/sky";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Hawaiʻi night sky calendar",
  description: "Meteor shower peaks, new and full moons in HST, and free public star parties across Hawaiʻi.",
  alternates: { canonical: "/sky" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function SkyPage() {
  const all = await getEntries();
  const items = upcomingDated(all, ["meteors", "moon", "star-parties"]);
  const t = tonight();
  const groups = new Map<string, typeof items>();
  for (const e of items) {
    const [y, m] = e.eventDate!.split("-");
    const k = `${MONTHS[Number(m) - 1]} ${y}`;
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  return (
    <>
      <section className="hero sm">
        <h1>🌌 Night sky calendar</h1>
        <p className="muted">
          Tonight: {t.emoji} {t.phase}, {t.illumination}% lit{t.darkFrom ? ` · full dark ${t.darkFrom}` : ""} (Honolulu, HST).
        </p>
      </section>
      <CategoryChips />
      {[...groups.entries()].map(([month, list]) => (
        <section key={month}>
          <h2 className="month">{month}</h2>
          <div className="list">
            {list.map((e) => (
              <EventRow key={e.slug} e={e} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
