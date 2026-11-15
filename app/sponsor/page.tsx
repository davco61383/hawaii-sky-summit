import type { Metadata } from "next";
import AjaxForm from "@/components/AjaxForm";
import { SITE } from "@/lib/site";
import { publicStats } from "@/lib/sponsor";
import { fmtDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sponsor",
  description: `Reach people planning Haleakalā sunrises, Hanauma Bay days and Hawaiʻi stargazing. Intro $${SITE.sponsorPriceWeek}/week.`,
};

export default async function SponsorPage() {
  const s = await publicStats();
  const nf = new Intl.NumberFormat("en-US");
  return (
    <>
      <section className="hero sm">
        <h1>Sponsor Sky &amp; Summit</h1>
        <p className="muted">Put your Hawaiʻi tour, rental, gear shop or café in front of people actively planning sunrises, snorkels and stargazing nights.</p>
      </section>

      <section className="card offer">
        <div className="price">
          <span className="amt">${SITE.sponsorPriceWeek}</span>
          <span className="per">/ week · intro rate</span>
        </div>
        <ul className="checks">
          <li>The sponsor bar across every page of the site for 7 days</li>
          <li>&ldquo;Sponsored by&rdquo; line in that week&apos;s 5-pick email</li>
          <li>Listing on this page, with a tracked link so you see your clicks</li>
          <li>One sponsor per week for the featured spot — no clutter</li>
        </ul>
        <p className="tiny muted">No checkout here — send a note below and we&apos;ll reply with open weeks.</p>
      </section>

      <section className="card">
        <h2>Real numbers</h2>
        {s.available ? (
          <>
            <div className="stats">
              <div><strong>{nf.format(s.views7)}</strong><span>page views, 7 days</span></div>
              <div><strong>{nf.format(s.views30)}</strong><span>page views, 30 days</span></div>
              <div><strong>{nf.format(s.subscribers)}</strong><span>email subscribers</span></div>
              <div><strong>{nf.format(s.entries)}</strong><span>sourced listings</span></div>
            </div>
            <p className="tiny muted">
              Live from our database{ s.since ? `, counting since ${fmtDate(s.since, false)}` : "" }. First-party counts, bots excluded. We&apos;re new — these numbers are honest, not padded.
            </p>
          </>
        ) : (
          <p className="muted">Stats will appear here as soon as our database is connected. We&apos;re brand new and will always show real numbers.</p>
        )}
      </section>

      <section className="card">
        <h2>Get in touch</h2>
        <AjaxForm action="/api/sponsor-inquiry" submitLabel="Send">
          <div className="two">
            <label>
              Your name*
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
            <label>
              Email*
              <input type="email" name="email" required autoComplete="email" />
            </label>
          </div>
          <div className="two">
            <label>
              Business*
              <input name="business" required maxLength={120} autoComplete="organization" />
            </label>
            <label>
              Website
              <input type="url" name="website_url" placeholder="https://…" />
            </label>
          </div>
          <label>
            Message
            <textarea name="message" rows={3} maxLength={2000} placeholder="Which week(s) are you interested in?" />
          </label>
        </AjaxForm>
      </section>
    </>
  );
}
