"use client";
import { useEffect, useState } from "react";

type Props = { slug?: string; name?: string; tagline?: string | null; price: number };

export default function SponsorBar({ slug, name, tagline, price }: Props) {
  const key = `hss-sponsorbar-${slug ?? "house"}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(localStorage.getItem(key) !== "closed");
  }, [key]);
  if (!open) return null;
  return (
    <div className="sponsorbar" role="region" aria-label="Sponsor">
      {slug ? (
        <a href={`/go/${slug}`} rel="sponsored noopener" target="_blank">
          <span className="sb-label">Sponsored by</span> <strong>{name}</strong>
          {tagline ? <span className="sb-tag"> — {tagline}</span> : null}
        </a>
      ) : (
        <a href="/sponsor">
          <span className="sb-label">Sponsor spot open</span> <strong>Reach Hawaiʻi stargazers & planners</strong>
          <span className="sb-tag"> — intro ${price}/week</span>
        </a>
      )}
      <button
        aria-label="Close sponsor bar"
        onClick={() => {
          localStorage.setItem(key, "closed");
          setOpen(false);
        }}
      >
        ×
      </button>
    </div>
  );
}
