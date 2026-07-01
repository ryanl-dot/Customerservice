# SolarCS API (server)

Secure backend/API boundary for the SolarCS Command Center. The browser only ever
talks to `/api/*`; external credentials (HubSpot, Enphase, DB) live here, never in the
frontend bundle.

## Run (dev)

```bash
# 1. backend (terminal A)
SEED_PASSWORD=yourdevpw COOKIE_SECRET=$(openssl rand -hex 32) npm run dev:server
# 2. frontend (terminal B) — proxies /api to :8787
npm run dev
```

Type-check the server: `npm run typecheck:server`.

## Endpoints

| Method | Path                | Auth        | Notes |
|--------|---------------------|-------------|-------|
| GET    | `/api/health`       | none        | liveness |
| POST   | `/api/auth/login`   | none        | rate-limited; sets httpOnly signed cookie |
| POST   | `/api/auth/logout`  | cookie      | clears session |
| GET    | `/api/auth/session` | none        | current `SessionInfo` |
| GET    | `/api/cases`        | role: cases | data-minimized per role |
| GET    | `/api/truck-rolls`  | role: truck-roll | data-minimized per role |
| GET    | `/api/kpis`         | role: dashboard | aggregate only |

## Security model

- **AuthN**: opaque session token in a **signed, httpOnly, SameSite=Lax** cookie
  (`secure` in production). Passwords hashed with Node `scrypt`. Dev user store is an
  integration seam — swap for a real IdP/DB in production.
- **AuthZ**: every protected route runs `requireAuth` then `requirePage(...)`, resolved
  through the shared permission model (`shared/auth/permissions.ts`). This is the
  security boundary; client route guards are usability only.
- **Data minimization**: responses are stripped of fields the role may not see
  (`server/src/lib/minimize.ts`).
- **Data mode**: `DATA_MODE` is server-side only. `production` returns an empty state
  until a connector (`HUBSPOT_PRIVATE_APP_TOKEN` / `DATABASE_URL`) is configured — it
  never falls back to mock data.
- **Errors**: central handler returns safe codes/messages; never leaks stack traces.
- **Audit**: structured `[audit]` log lines for login/logout/denied access/record
  access; no secrets or PII logged.

## Production deployment — secrets to set on the host (not in git)

`COOKIE_SECRET`, `SESSION_TTL_MS`, `DATA_MODE=production`, and — once authorized —
`HUBSPOT_PRIVATE_APP_TOKEN`, `ENPHASE_API_KEY`/`ENPHASE_CLIENT_ID`/`ENPHASE_CLIENT_SECRET`,
`DATABASE_URL`. Replace the dev user store with the real identity provider.
