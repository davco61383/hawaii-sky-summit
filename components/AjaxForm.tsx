"use client";
import { useState, type ReactNode } from "react";

type Props = { action: string; children: ReactNode; submitLabel: string; className?: string; inline?: boolean };

/** Small progressive form: posts JSON to an API route and shows the result inline. */
export default function AjaxForm({ action, children, submitLabel, className, inline }: Props) {
  const [state, setState] = useState<{ busy: boolean; ok?: boolean; msg?: string }>({ busy: false });
  return (
    <form
      className={`${className ?? ""} ${inline ? "form-inline" : "form"}`}
      onSubmit={async (ev) => {
        ev.preventDefault();
        const form = ev.currentTarget;
        setState({ busy: true });
        try {
          const body = Object.fromEntries(new FormData(form).entries());
          const r = await fetch(action, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok !== false) {
            setState({ busy: false, ok: true, msg: j.message ?? "Mahalo!" });
            form.reset();
          } else setState({ busy: false, ok: false, msg: j.error ?? "Something went wrong." });
        } catch {
          setState({ busy: false, ok: false, msg: "Network error — please try again." });
        }
      }}
    >
      {children}
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <button type="submit" className="btn" disabled={state.busy}>
        {state.busy ? "Sending…" : submitLabel}
      </button>
      {state.msg ? (
        <p className={`form-msg ${state.ok ? "ok" : "err"}`} role="status">
          {state.msg}
        </p>
      ) : null}
    </form>
  );
}
