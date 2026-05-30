# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing/booking site for a Slovak doula. UI text is in Slovak — keep new copy in Slovak unless asked otherwise.

## Commands

```bash
npm install              # install dependencies
npm run env:generate     # read .env and write public/js/env.js (also aliased as env:refresh)
```

There is no build step, bundler, linter, or test suite. The "build" is just `npm run env:generate`; everything in `public/` is served as-is.

Rerun `env:generate` any time `.env` changes — `public/js/env.js` is `.gitignored` and must be regenerated before the frontend can talk to Google Calendar.

## Deployment

Despite what `README.md` says, this project deploys to **Cloudflare Pages**, not Netlify:

- `wrangler.toml` sets `pages_build_output_dir = "./public"`.
- `functions/api/airtable-slots.js` uses the Cloudflare Pages Functions signature (`export async function onRequest(context)` reading `context.env`), which is not the Netlify Functions format.
- User-facing error strings in `public/js/script.js` reference "Cloudflare Environment Variables" and "Cloudflare function".

Treat the README's Netlify section as stale. Server env vars (`AIRTABLE_*`) must be set in the Cloudflare Pages project dashboard.

## Architecture

Two-tier split driven by what is safe to expose in the browser:

1. **Frontend (`public/`)** — plain HTML pages (`index.html`, `sprievod.html`, `konzultacie.html`, `kurz.html`) styled with Tailwind via CDN. All JS lives in `public/js/script.js`, loaded as an ES module. Dependencies (FullCalendar, flatpickr, Tailwind) come from CDNs; the `node_modules` packages in `package.json` are not bundled into the site.
2. **Server (`functions/api/`)** — Cloudflare Pages Functions. Each file becomes a route under `/api/`. Currently only `airtable-slots.js` → `GET /api/airtable-slots`, which proxies Airtable so the personal access token never reaches the browser.

### Env var split (important, don't break)

`scripts/generate-env.js` has an **allowlist** of keys that get written to `public/js/env.js`:

```js
const allowedKeys = ['GOOGLE_API_KEY', 'GOOGLE_CALENDAR_ID'];
```

Anything in that list is public (visible to any site visitor). Anything else from `.env` stays server-side and is only readable by Pages Functions via `context.env`. **Never add `AIRTABLE_TOKEN` or other secrets to `allowedKeys`** — that would leak them into shipped JS.

Required keys:
- Public (frontend, via `env.js`): `GOOGLE_API_KEY`, `GOOGLE_CALENDAR_ID`
- Server-only (Pages Function): `AIRTABLE_TOKEN`, `AIRTABLE_BASE`, and one of `AIRTABLE_TABLE` or `AIRTABLE_TABLE_ID`

### Booking flow

`public/js/script.js` drives a single booking UI with two modes toggled by a radio group:

- **Individuálna** → FullCalendar widget overlays the doula's Google Calendar (busy times shown as background events using `googleCalendarApiKey` + `googleCalendarId`). User clicks a slot → formatted datetime is written into `#date_input`.
- **Skupinová** → `fetchGroupSlots()` calls `/api/airtable-slots`, which the Pages Function fulfills by querying Airtable sorted by `Datum asc`. `normalizeAirtableRecord` tolerates several field-name variants (`Datum`/`datum`/`Date`, `Cas`/`Čas`/`cas`/`time`, capacity, etc.) — keep that flexibility when touching it, since the Airtable schema has historically used mixed Slovak/English diacritic forms.

Both modes feed the same `#date_input` field, which is then submitted via Web3Forms (`WEB3FORMS_KEY` is hardcoded in `script.js` — it's a public form-submission key, not a secret).
