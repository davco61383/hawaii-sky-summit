import AjaxForm from "./AjaxForm";

export default function SignupForm({ source = "site" }: { source?: string }) {
  return (
    <section className="card signup" id="newsletter">
      <h2>5 picks, every week</h2>
      <p className="muted">Upcoming drops + sky events, one line each. Free. Unsubscribe anytime.</p>
      <AjaxForm action="/api/signup" submitLabel="Get the picks" inline>
        <input type="hidden" name="source" value={source} />
        <label className="sr-only" htmlFor={`email-${source}`}>Email</label>
        <input id={`email-${source}`} type="email" name="email" placeholder="you@email.com" required autoComplete="email" inputMode="email" />
      </AjaxForm>
    </section>
  );
}
