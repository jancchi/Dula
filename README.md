# Website for a Doula

A full implementation of a web for a client

## Environment variables

This project uses two environment variable scopes:

- Frontend-public values are generated into `public/js/env.js`
- Server-only values are read by Netlify Functions from `process.env`

1. Copy `.env.example` to `.env`
2. Fill in your keys/tokens
3. Generate `public/js/env.js`

```bash
cp .env.example .env
npm install
npm run env:generate
```

`public/js/script.js` reads values from `public/js/env.js`.

### Netlify deployment

In Netlify UI, set these Environment Variables:

- `GOOGLE_API_KEY`
- `GOOGLE_CALENDAR_ID`
- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE`
- `AIRTABLE_TABLE` or `AIRTABLE_TABLE_ID`

Set build command to:

```bash
npm ci && npm run env:generate
```

Set base directory to repo root (leave empty) and publish directory to `public`.

Set publish directory to `public`.

Important: anything loaded in browser JavaScript is visible to users. Airtable personal access tokens must stay server-side (Netlify Function), not in frontend code.
