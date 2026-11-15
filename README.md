# Hawaii Sky & Summit

Hawaiʻi permit/reservation drop tracker + night-sky calendar. Next.js (App Router) on Vercel, Postgres (Neon via Vercel Marketplace).

- **Drops**: Haleakalā sunrise (60-day & 2-day, 7:00 AM HST), Hanauma Bay (2 days, 7:00 AM HST), Hāʻena (30 days, 12:00 AM HST), Diamond Head / ʻĪao / Waiʻānapanapa (30-day windows), Kalalau camping (90 days), Haleakalā cabins & campgrounds. Countdowns are computed from each agency's published release rule.
- **Sky**: meteor shower peaks (AMS), new/full moons (USNO, converted to HST), free star parties (HAS, KEASA, Maunakea VIS), plus a live "tonight" card computed with Astronomy Engine for Honolulu.
- Every entry has a `source_url` and a `checked` date. If a date can't be verified it's left out.

## Pages
`/` home · `/c/<category>` · `/sky` · `/search` · `/e/<slug>` · `/submit` · `/sponsor` · `/about` · `/go/<sponsor>` (logs click → redirect) · `/sitemap.xml` · `/robots.txt` · `/opengraph-image`

## Data
Tables (auto-created on first request, see `lib/db.ts`): `entries`, `submissions` (tips + sponsor inquiries), `signups`, `zero_result_searches`, `pageviews` (first-party daily counts, no cookies), `sponsor_weeks`, `sponsor_clicks`, `errors`.
Seed data lives in `lib/seed-data.ts`; it is upserted into `entries` the first time the DB is empty, or on demand via `POST /api/admin/setup`. Without a database the site still renders from the seed list (forms return 503).

## Admin API
Send `Authorization: Bearer $ADMIN_TOKEN`.

| Method | Path | What |
| --- | --- | --- |
| GET | `/api/admin/queue?status=pending&kind=entry\|sponsor_inquiry` | review queue |
| POST | `/api/admin/approve` `{id, action?: "approve"\|"reject", overrides?}` | publish/reject a submission |
| GET | `/api/admin/stats` | totals, daily views, top pages, recent errors |
| GET | `/api/admin/searches` | zero-result searches (what to add next) |
| GET/POST | `/api/admin/sponsors` | list / book sponsor weeks `{slug,name,url,tagline,week_start,week_end,price_cents,status}` |
| POST | `/api/admin/setup` | create tables + upsert seed entries |
| GET | `/api/admin/newsletter?format=html\|text` | this week's 5-pick newsletter draft |

## Newsletter
`newsletter/template.html` + `template.txt` — weekly, 5 one-line picks + "Sponsored by". Rendered by `/api/admin/newsletter`; paste into a Resend Broadcast (`{{{RESEND_UNSUBSCRIBE_URL}}}` is filled by Resend).

## Env vars
See `.env.example`. `DATABASE_URL` (from Neon integration), `ADMIN_TOKEN`, `SITE_LIVE=1` to allow indexing (off by default = preview), optional `NEXT_PUBLIC_SITE_URL`, and optional Resend vars (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM`, `NOTIFY_EMAIL`) — all Resend calls are no-ops until set.

## Dev
```
npm i
DATABASE_URL=postgres://... ADMIN_TOKEN=... npm run dev
```
