# LHP — Staff ID & QR Verification System

Digital staff identity and public QR verification for **Lion Hospitality Partners**.
Admins onboard and manage staff; each staff member gets a digital ID card with a QR
code; anyone can scan that code to verify the member's **live** employment status
without logging in.

**Stack:** Next.js 16 · Prisma 7 + PostgreSQL · React Query · Zustand · Tailwind CSS
**Auth:** BFF pattern, cookie-based sessions — DB-backed and revocable (not JWT-only)

---

## Quick start

```bash
cp .env.example .env     # then fill in DATABASE_URL, SESSION_SECRET, ADMIN_*
npm install
npm run db:migrate       # create tables
npm run db:seed          # bootstrap admin + demo data
npm run dev
```

Open http://localhost:3000.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lhp.com` | `Admin@1234` |
| Staff (active) | `john.doe@lhp.com` | `Staff@1234` |
| Staff (disengaged) | `amaka.obi@lhp.com` | `Staff@1234` — blocked at login by design |

Public verification pages need no login:
`/verify/STF-000247` (active) · `/verify/STF-000512` (disengaged) · `/verify/STF-999999` (not found)

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm run db:migrate` | Create/apply a migration (development) |
| `npm run db:deploy` | Apply existing migrations (CI/production) |
| `npm run db:seed` | Bootstrap admin, roles, venues, demo staff (idempotent) |
| `npm run db:studio` | Browse the database |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

---

## Architecture

```
src/
  app/
    page.tsx                    role-aware entry redirect
    login/                      sign-in
    reset-password/             first-login forced reset
    staff/                      authenticated staff area (guarded layout)
      page.tsx                  Digital Staff ID — server-rendered, self-only
    admin/                      admin area (guarded layout)
      page.tsx                  staff directory: search / filter / paginate
      staff/new/                onboarding
      staff/[id]/               record: edit, status toggle, audit log
    verify/[stfId]/             PUBLIC verification — force-dynamic
    api/                        all endpoints, grouped by domain
  lib/
    prisma.ts                   client singleton (driver adapter)
    auth.ts                     sessions, guards, password hashing
    api.ts                      response envelope + error handling
    validation.ts               Zod schemas — all request validation
    staff-service.ts            queries + the two DTO projections
    rate-limit.ts               login throttling
  components/                   UI kit, staff card, admin components
  store/ui-store.ts             Zustand — client state only
```

**State split:** React Query owns server state; Zustand owns client state (list
filters, toasts). Keeping this strict stops the two from fighting over the same data.

---

## API

All endpoints return one envelope:

```jsonc
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "…", "details": [] } }
```

Codes map to status: `VALIDATION_ERROR` 422 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403
· `NOT_FOUND` 404 · `CONFLICT` 409 · `RATE_LIMITED` 429 · `INTERNAL` 500.

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/login` | Public (rate-limited) |
| POST | `/api/auth/logout` | Authenticated |
| POST | `/api/auth/reset-password` | Authenticated |
| GET | `/api/admin/staff` | Admin — list/search/filter |
| POST | `/api/admin/staff` | Admin — create staff + user account |
| GET·PATCH | `/api/admin/staff/[id]` | Admin — read/edit |
| PATCH | `/api/admin/staff/[id]/status` | Admin — status toggle |
| GET | `/api/admin/staff/[id]/audit` | Admin — change history |
| GET | `/api/admin/meta` | Admin — roles/venues/next STF-ID |
| GET | `/api/staff/me` | Staff — own record only |
| GET | `/api/verify/[stfId]` | **Public** — minimal fields |

Each route file documents its own request/response contract inline.

---

## Security model

- **Sessions are DB-backed and revocable.** The cookie holds a random opaque token;
  the database stores only its HMAC, so leaking the `Session` table yields no usable
  cookie. Every request resolves against the DB — which is what makes revocation
  instant.
- **Disengaging is immediate.** `PATCH …/status` to `DISENGAGED` revokes every active
  session for that member. `requireStaff()` also re-reads live status on each call, so
  an open browser is locked out on its next request, not at cookie expiry.
- **Status toggle is idempotent.** Toggling to the current status is a no-op: no audit
  row, no revocation, still 200. Safe under double-click and concurrent admin races.
- **Reactivation forces a password reset** (`mustResetPw`), since the old password may
  have been exposed while the account was disengaged.
- **The public page exposes only** name, photo, STF-ID, and status. Roles and venues
  are deliberately withheld — telling an anonymous scanner where someone works is a
  personal-safety issue.
- **No hard deletes.** Status is the sole lifecycle control; no delete endpoint exists.
- **Never cached.** The verification page and every API response are `no-store`.
- **Login is rate-limited** (10 attempts / 15 min per IP) and returns an identical
  error for unknown-email and wrong-password, so it can't be used to enumerate accounts.

---

## Locked decisions

1. Staff ID page (`/staff`, authenticated, self-only) and QR verification
   (`/verify/[stfId]`, public) are separate routes — never merged.
2. Reactivation always sets `mustResetPw = true`.
3. Staff records are disengage-only; no hard-delete endpoint is in scope.
4. **STF-ID is immutable after creation** — the QR code and printed badges derive
   from it.

---

## Known limitations

- **Photos are stored as data URIs** on `Staff.photoUrl` (downscaled to 512px in the
  browser). This keeps the feature dependency-free and works on serverless, where
  there is no writable disk. At thousands of records, move to object storage and
  store a URL instead — only `PhotoUpload` and the field value change.
- **Rate limiting is in-memory**, so it is per-instance and resets on redeploy.
  Move to Redis if horizontally scaled; the call sites don't change.
- **Credentials are handed over in person.** The temporary password is shown once
  on screen rather than emailed — no email provider is in scope.
- `/verify/[stfId]` is **enumerable by design** (per spec). `STF-000248` is guessable
  from `STF-000247`, exposing name, photo, and status. An opaque per-staff token
  would prevent roster harvesting if this is ever revisited.
