import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero sm">
      <h1>Lost in the dark 🌑</h1>
      <p className="muted">That page doesn&apos;t exist. <Link href="/">Back home</Link> or <Link href="/search">search</Link>.</p>
    </section>
  );
}
