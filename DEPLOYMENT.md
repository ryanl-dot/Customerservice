# SolarCS Command Center — Staging Deployment Runbook

Staging-first, **fictional data only**. This document describes the manual steps to
stand up a staging environment on Render. **No Render services have been created and
no billing information has been entered** — creating the services below provisions
billable resources; confirm costs first.

> Not ready for real customer data. Privileged-role MFA is not fully enforced, and
> HubSpot/Enphase are not connected. See "Remaining risks" in the phase report.

---

## 1. Required services
- **Render Web Service** (Docker) — runs Express, which also serves the built React SPA (same origin).
- **Render PostgreSQL 16** — managed database (users, sessions, audit, reset tokens).

## 2. Environment variables (set in the Render dashboard; never commit real values)
| Variable | Value | Notes |
|---|---|---|
| `APP_MODE` | `production` | authority for all safety checks |
| `NODE_ENV` | `production` | |
| `DATA_MODE` | `production` | mock/test rejected at startup |
| `USER_STORE` | `db` | JSON store rejected at startup |
| `AUTH_DISABLE_SEED` | `1` | dev seed users off |
| `SERVE_SPA` | `1` | Express serves `dist/` |
| `PORT` | `8787` | |
| `FRONTEND_ORIGIN` | staging URL | e.g. `https://solarcs-staging.onrender.com` |
| `API_ORIGIN` | staging URL | |
| `COOKIE_SECRET` | generated | Render `generateValue` — stable, not per-restart |
| `SESSION_SECRET` | generated | Render `generateValue` |
| `SESSION_TTL_MS` | `28800000` | 8h |
| `DATABASE_URL` | from DB | `fromDatabase` in render.yaml |

Startup **fails closed** if any required secret is missing, a dev-default secret is
used, `DATA_MODE≠production`, `USER_STORE=json`, or seed users are enabled.

## 3. Manual steps to create staging
1. **Create the database:** Render → New → PostgreSQL → version 16 → smallest plan. Note it provisions a paid resource.
2. **Create the web service:** New → Web Service → connect this repo → Runtime: Docker. Or apply `render.yaml` as a Blueprint (review costs first).
3. **Set env vars** (table above). Set `FRONTEND_ORIGIN`/`API_ORIGIN` to the service URL once known; let Render generate `COOKIE_SECRET`/`SESSION_SECRET`; link `DATABASE_URL` from the DB.
4. **Migration release command:** `npx prisma migrate deploy` (set as the pre-deploy command; already in `render.yaml`). Never `prisma db push`.
5. **Build/start:** Docker build runs `prisma generate` + `npm run build`; the container starts with `npm run start`.
6. **First administrator (one-time, via Render Shell):**
   ```
   USER_STORE=db npm run create-admin
   ```
   Enter name/email/password at the prompt (hidden). No default credentials exist.

## 4. Health checks
- Liveness: `GET /api/health` → `{ ok: true }` (Render health check path).
- Readiness: `GET /api/health/ready` → 200 when the DB is reachable, 503 otherwise.

## 5. Local development
- **JSON store (Codespaces default, no DB):** `npm run dev:server` + `npm run dev`.
  CORS/CSRF are permissive locally; the API server does not serve the SPA (Vite does).
- **PostgreSQL locally:** set `DATABASE_URL` + `USER_STORE=db`, run `npm run db:migrate`,
  `USER_STORE=db npm run create-admin`, then `USER_STORE=db npm run dev:server` + `npm run dev`.
- **Migrate an existing local JSON admin into the DB (explicit, one-time):**
  `USER_STORE=db npm run migrate-local-admin -- you@example.com` (see script header).

## 6. Backups & recovery (documented; NOT yet verified — see caveat)
- **Automated backups:** Render PostgreSQL provides daily backups; retention depends on the plan (confirm in the dashboard).
- **Point-in-time recovery (PITR):** available on higher Render Postgres plans — confirm availability for the chosen plan.
- **Restore procedure:** Render dashboard → Database → Backups → restore to a new instance → update `DATABASE_URL` → redeploy.
- **Administrator recovery:** if locked out, use Render Shell to run `npm run create-admin` (creates a new admin) or re-enable an account via SQL; then rotate secrets.
- **Cookie/Session secret rotation:** update `COOKIE_SECRET`/`SESSION_SECRET` in Render and redeploy. Rotation invalidates all existing sessions (users re-authenticate) — expected.
- **Rollback to prior deployment:** Render → Deploys → Rollback to the previous image.
- **Migration rollback limitation:** Prisma migrations are forward-only; there is no automatic down-migration. To roll back schema, restore from a backup or write a new corrective migration. Test destructive migrations against a staging copy first.
- **CAVEAT:** Do not claim backups work until an actual managed backup has been taken and a restore verified (see restoration test plan below). This has NOT been done (no Render DB exists yet).

## 7. Monitoring & errors
- Structured logs: `[audit]` events and `[error]`/`[startup]` lines with a `x-request-id` correlation id; forward Render logs to a drain.
- Safe errors: clients get typed codes/messages, never stack traces, payloads, or secrets.
- Optional Sentry: wire `SENTRY_DSN` (left blank; do not add a live DSN without approval).

## 8. Operational procedures
- **Disable a user:** `UPDATE users SET "accountStatus"='disabled' WHERE email='...';` — takes effect on their next request (session rejected).
- **Emergency session revocation (one user):** `UPDATE sessions SET "revokedAt"=now() WHERE "userId"='...';`
- **Emergency global revocation:** `UPDATE sessions SET "revokedAt"=now() WHERE "revokedAt" IS NULL;` or rotate `COOKIE_SECRET` + redeploy.
- **Force password reset:** issue a reset token (once mail transport is connected) or set a new hash via `create-admin` for a fresh account.

## 9. Staging restoration test plan (to run once staging exists — fictional data only)
1. Seed staging with fictional users/records.
2. Trigger a manual backup in the Render dashboard.
3. Restore the backup to a new database instance.
4. Point a throwaway web service at the restored `DATABASE_URL`.
5. Verify: admin can log in; audit rows present; sessions table intact; counts match.
6. Record the restore duration and any data gaps. Only then mark backups "verified".

## 10. Staging functional test plan (fictional data)
- Startup fails closed with a missing/`dev-default` secret, `DATA_MODE=mock`, or `USER_STORE=json`.
- Login success/failure; lockout after repeated failures; lock expiry; disabled account; unknown email; generic errors.
- CSRF: state-changing request without the header is rejected; with a matching token it passes.
- CORS: only `FRONTEND_ORIGIN` is allowed; unknown origins rejected.
- Session persists across a service restart; logout revokes; password reset revokes all sessions.
- MFA: enroll → verify → second factor required at next login.
- Role access: each role reaches only its permitted pages/APIs; direct API calls for other roles are rejected server-side.
- Data minimization: responses exclude fields the role may not see.
- Readiness returns 503 when the DB is stopped; recovers when restarted.
