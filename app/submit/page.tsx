import type { Metadata } from "next";
import AjaxForm from "@/components/AjaxForm";
import { CATEGORIES } from "@/lib/seed-data";

export const metadata: Metadata = { title: "Submit a tip", description: "Know a permit drop, star party or sky event in Hawaiʻi? Send it in — every tip is reviewed." };

export default function SubmitPage() {
  return (
    <>
      <section className="hero sm">
        <h1>Submit a tip</h1>
        <p className="muted">Star party, permit change, closure, sky event? Every submission is checked against its source before it goes live.</p>
      </section>
      <section className="card">
        <AjaxForm action="/api/submit" submitLabel="Send for review">
          <label>
            Title*
            <input name="title" required maxLength={140} placeholder="e.g. Public star party at …" />
          </label>
          <div className="two">
            <label>
              Category*
              <select name="category" required defaultValue="">
                <option value="" disabled>Choose…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              Island
              <select name="island" defaultValue="Statewide">
                {["Statewide", "Oahu", "Maui", "Hawaii Island", "Kauai", "Molokai", "Lanai"].map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Short description*
            <textarea name="summary" required maxLength={600} rows={3} />
          </label>
          <div className="two">
            <label>
              Date (if any)
              <input type="date" name="event_date" />
            </label>
            <label>
              Time (HST)
              <input name="event_time" maxLength={60} placeholder="7:00 PM" />
            </label>
          </div>
          <label>
            Official source link*
            <input type="url" name="source_url" required placeholder="https://…" />
          </label>
          <label>
            Booking / event link
            <input type="url" name="url" placeholder="https://…" />
          </label>
          <div className="two">
            <label>
              Your name
              <input name="contact_name" maxLength={80} autoComplete="name" />
            </label>
            <label>
              Your email (optional)
              <input type="email" name="contact_email" autoComplete="email" />
            </label>
          </div>
        </AjaxForm>
      </section>
    </>
  );
}
