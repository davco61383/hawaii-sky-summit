import type { Metadata } from "next";
import Link from "next/link";
import { ResultCard } from "@/components/EntryCard";
import SearchBar, { CategoryChips } from "@/components/SearchBar";
import { ensureSchema, logError, sql } from "@/lib/db";
import { CATEGORIES, getEntries, searchEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", robots: { index: false } };

type P = { searchParams: Promise<{ q?: string; category?: string }> };

export default async function SearchPage({ searchParams }: P) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100).trim();
  const category = CATEGORIES.some((c) => c.id === sp.category) ? sp.category : undefined;
  const all = await getEntries();
  const results = searchEntries(all, q, category);
  if (q && results.length === 0) {
    const db = sql();
    if (db) {
      try {
        await ensureSchema();
        await db`insert into zero_result_searches (query, category) values (${q}, ${category ?? null})`;
      } catch (e) {
        await logError("search/zero", e);
      }
    }
  }
  return (
    <>
      <section className="hero sm">
        <h1>Search</h1>
      </section>
      <SearchBar q={q} category={category} />
      <CategoryChips active={category} />
      {q || category ? (
        <p className="muted">
          {results.length} result{results.length === 1 ? "" : "s"}
          {q ? <> for “{q}”</> : null}
        </p>
      ) : null}
      {results.length ? (
        <div className="grid">{results.map((e) => <ResultCard key={e.slug} e={e} />)}</div>
      ) : (
        <div className="card">
          <p>No matches yet. We log empty searches to decide what to add next.</p>
          <p>
            Know an official source? <Link href="/submit">Submit it →</Link>
          </p>
        </div>
      )}
    </>
  );
}
