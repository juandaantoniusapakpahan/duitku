# Duitku — Tahap 1: Foundation (Design)

Status: Approved
Parent spec: [prompt-duitku-fullstack.md](../../prompt-duitku-fullstack.md)
Reference mockup: [duitku-dashboard.html](../../duitku-dashboard.html)

## Scope

Spring Boot auth module (register / login / refresh / me) with JWT, Postgres via
Docker, and React auth pages that are pixel-identical to the mockup — functional
end-to-end against the real backend. Email/password only.

**Out of scope for Tahap 1** (deferred to later phases): GitHub OAuth, forgot-password
backend, accounts/categories/transactions/dashboard (real data), deployment.

## Backend

### Entities

- `User`: id (UUID), email (unique), password_hash, full_name, email_verified,
  created_at, updated_at, `oauth_provider` (nullable), `oauth_provider_id` (nullable,
  unique per provider). OAuth columns are created now (per parent data model) even
  though the OAuth flow isn't implemented yet, so the migration doesn't need to
  change again later.
- `RefreshToken`: id, user_id (FK), token_hash, expires_at, revoked, created_at.

### Token strategy

- **Access token**: JWT, HS256, 15 minute expiry, secret from env var. Returned in
  the JSON response body. Frontend keeps it in memory only (Zustand store).
- **Refresh token**: opaque random string (not a JWT), 7 day expiry. Sent to the
  client once, raw. Stored server-side as a SHA-256 hash in `refresh_tokens.token_hash`
  — never the raw value. Rationale: if the DB leaks, the stored value alone isn't a
  usable credential.
- Refresh token delivery: **httpOnly cookie** (`SameSite=Lax`, `Secure=false` in dev,
  `Secure=true` in prod), never in the JSON body. Matches the parent spec's stated
  preference.
- Refresh rotation: on `/auth/refresh`, the old token is marked `revoked=true` and a
  new refresh token + access token are issued (rotate-on-use).

### Endpoints (`/api/v1/auth`)

| Method | Path | Notes |
|---|---|---|
| POST | `/register` | `{email, password, full_name}` → `{user, access_token}` + Set-Cookie refresh |
| POST | `/login` | `{email, password}` → `{user, access_token}` + Set-Cookie refresh |
| POST | `/refresh` | reads refresh cookie → `{access_token}` + rotated Set-Cookie |
| POST | `/logout` | revokes the refresh token, clears cookie |
| GET | `/me` | current user from access token |

### Security config

- Stateless sessions, BCrypt password encoder.
- `SecurityFilterChain` permits `/api/v1/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`;
  everything else requires a valid Bearer access token via `JwtAuthenticationFilter`.
- CORS: allow origin `http://localhost:5173`, `allowCredentials=true` (required for
  the refresh cookie to be sent cross-origin during local dev).

### Migrations (Flyway)

- `V1__users.sql`
- `V2__refresh_tokens.sql`

### Error handling

`GlobalExceptionHandler`: Bean Validation failures → 400 with field errors, duplicate
email on register → 409, bad credentials → 401, expired/invalid/revoked refresh token
→ 401.

### Testing

Testcontainers (Postgres) integration test covering the full flow: register → login →
`/me` → `/refresh` → `/logout` → refresh with the revoked token fails.

### Docs

SpringDoc OpenAPI, Swagger UI at `/swagger-ui.html`.

## Frontend

- Vite + React 18 + TypeScript. Tailwind config copied **exactly** from the mockup's
  inline `tailwind.config` (brand/ink palettes, Inter font family) plus the mockup's
  custom CSS (`.page` fadeIn, `.card-hover`, `.glass`, `.no-scrollbar`).
- `/login` and `/register` pages cloned 1:1 from the mockup markup: split screen on
  desktop (form left, gradient brand panel right with blur circles + feature
  cards/testimonial), full-width form on mobile, password show/hide toggle, "Ingat
  saya 30 hari" checkbox, 4-bar password strength indicator (rule-based: length +
  character variety — no external zxcvbn dependency), required terms checkbox on
  register.
- `lib/api.ts`: axios instance, `baseURL=/api/v1`, `withCredentials: true`. Request
  interceptor attaches `Authorization: Bearer <accessToken>`. Response interceptor:
  on 401, calls `/auth/refresh` once, retries the original request; if refresh also
  fails, clears auth state and redirects to `/login`.
- `lib/auth.ts`: Zustand store holding `user` and `accessToken` (in memory, not
  persisted — a page reload starts empty and relies on silent refresh).
- On app mount, call `/auth/refresh` once (cookie-based) before rendering protected
  routes, so a page reload doesn't force a re-login as long as the refresh cookie is
  still valid.
- `/dashboard` is a placeholder protected route ("Dashboard — coming soon") — proves
  the auth flow end-to-end; the real dashboard is built in Tahap 4.
- Form errors are shown inline (not toasts), matching what the mockup's auth screens
  actually show. A global toast system is introduced in Tahap 6 (Polish).

## Dev workflow

- `docker-compose.yml`: Postgres service (primary dependency for Tahap 1). A backend
  service definition is included for parity with the eventual full-stack compose file,
  but the day-to-day loop is: Postgres in Docker, Spring Boot run locally via
  `mvn spring-boot:run` for fast hot-reload; Vite dev server run locally via `npm run dev`.
- `.env.example` in both `backend/` and `frontend/`.

## Acceptance test for Tahap 1

Register a new user → login → receive access + refresh tokens → `GET /auth/me`
returns the user → `/auth/refresh` issues a new access token → `/auth/logout`
revokes the refresh token (subsequent refresh with it fails). Frontend: same flow
walkable through the UI, visually matching the mockup at 375px / 768px / 1280px.
