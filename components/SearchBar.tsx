import { CATEGORIES } from "@/lib/seed-data";

export default function SearchBar({ q = "", category = "" }: { q?: string; category?: string }) {
  return (
    <form action="/search" className="searchbar" role="search">
      <label className="sr-only" htmlFor="q">Search</label>
      <input id="q" name="q" defaultValue={q} placeholder="Search: haleakala, hanauma, geminids…" type="search" enterKeyHint="search" />
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <button className="btn" type="submit" aria-label="Search">Search</button>
    </form>
  );
}

export function CategoryChips({ active }: { active?: string }) {
  return (
    <nav className="chips" aria-label="Categories">
      {CATEGORIES.map((c) => (
        <a key={c.id} href={`/c/${c.id}`} className={`chip ${active === c.id ? "on" : ""}`}>
          <span aria-hidden="true">{c.emoji}</span> {c.label}
        </a>
      ))}
    </nav>
  );
}
