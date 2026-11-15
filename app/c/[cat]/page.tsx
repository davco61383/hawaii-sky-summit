import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DropCard, EventRow, ResultCard } from "@/components/EntryCard";
import SearchBar, { CategoryChips } from "@/components/SearchBar";
import { CATEGORIES, getEntries, upcomingDated, upcomingDrops } from "@/lib/entries";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ cat: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { cat } = await params;
  const c = CATEGORIES.find((x) => x.id === cat);
  return c ? { title: `${c.label} in Hawaiʻi`, description: `${c.blurb} — Hawaiʻi, all times HST.`, alternates: { canonical: `/c/${c.id}` } } : {};
}

export default async function CategoryPage({ params }: P) {
  const { cat } = await params;
  const c = CATEGORIES.find((x) => x.id === cat);
  if (!c) notFound();
  const all = await getEntries();
  let body: React.ReactNode;
  if (c.id === "drops") {
    body = <div className="grid">{upcomingDrops(all).map((d) => <DropCard key={d.slug} d={d} />)}</div>;
  } else if (["meteors", "moon", "star-parties"].includes(c.id)) {
    const items = upcomingDated(all, [c.id]);
    body = items.length ? <div className="list">{items.map((e) => <EventRow key={e.slug} e={e} />)}</div> : <p className="muted">Nothing upcoming right now.</p>;
  } else {
    body = <div className="grid">{all.filter((e) => e.category === c.id).map((e) => <ResultCard key={e.slug} e={e} />)}</div>;
  }
  return (
    <>
      <section className="hero sm">
        <h1>
          <span aria-hidden="true">{c.emoji}</span> {c.label}
        </h1>
        <p className="muted">{c.blurb}. All times HST.</p>
      </section>
      <SearchBar category={c.id} />
      <CategoryChips active={c.id} />
      {body}
    </>
  );
}
