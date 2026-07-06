# LEVIO BLOCK B1 SUPABASE AUTH CONFIGURATION LOCK

## Document Status

- Block: B - Real User Account Runtime.
- Substep: B1 - Supabase Auth Configuration Lock.
- Status: completed documentation/configuration contract.
- Date: 6 July 2026, Europe/Madrid.
- Depends on: `../../../../LEVIO_PROJECT_CONSTITUTION.md`,
  `../../../../LEVIO_IMPLEMENTATION_PLAN.md`,
  `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`,
  `LEVIO_STAGE_4_1B_AUTH_RUNTIME_IMPLEMENTATION_PLAN.md`, and
  `LEVIO_STAGE_4_1_AUTH_RUNTIME_HARDENING.md`.
- Production execution status: not started.

This document locks the minimum Supabase Auth configuration contract required
before Block B runtime implementation continues. It does not configure a remote
Supabase project, change runtime code, change UI behavior, add middleware,
change database schema, add migrations, open Production Release, enable Real
AI, add billing, or start Block C.

## 1. Purpose

B1 exists to make the auth configuration explicit before B2/B3 implement or
validate real account flows.

It fixes:

- required Supabase Auth project settings;
- required redirect URL allowlist;
- required local/dev, preview, and production origins;
- required environment variables;
- public versus server-only env boundaries;
- email delivery expectations;
- current implementation compatibility;
- gaps that must be handled by B2/B3 without broad runtime changes.

## 2. Current Implementation Baseline

The current codebase already provides these auth foundations:

- `lib/auth/config.ts` reads Supabase auth env values, validates app/Supabase
  URLs, defaults `LEVIO_AUTH_PROVIDER` to `supabase`, and fails closed when the
  runtime is disabled or misconfigured.
- `lib/auth/supabase/server.ts` creates server and route-handler Supabase
  clients through `@supabase/ssr`.
- `lib/auth/supabase/client.ts` creates the browser Supabase auth client only
  when browser auth config is enabled.
- `lib/auth/session.ts` reads `getSession()`, validates with `getUser()`, and
  normalizes state into Levio auth context.
- `app/auth/callback/route.ts` routes callbacks to
  `handleSupabaseAuthCallback`.
- `lib/auth/supabase/callback.ts` exchanges callback codes, handles provider
  errors, and redirects only to sanitized dashboard paths.
- `/login` and `/register` initiate Supabase `signInWithOtp` with
  `emailRedirectTo` set to the current browser origin plus
  `/auth/callback?next=...`.
- `/forgot-password` is a prepared surface only; production password recovery is
  not active.
- `app/dashboard/layout.tsx` protects dashboard descendants through
  `requireAuthenticatedDashboardSession`.

## 3. Required Supabase Auth Settings

### 3.1 Site URL

Supabase Auth Site URL must match the canonical app origin for the environment:

```text
local/dev:   http://localhost:3000
production: https://levio.es
preview:    each approved preview deployment origin
```

Rules:

- `LEVIO_APP_URL` must match the canonical Site URL for the deployed
  environment.
- `NEXT_PUBLIC_SITE_URL` may remain a fallback only; production should prefer
  `LEVIO_APP_URL`.
- If `https://www.levio.es` is supported publicly, it must either redirect to
  `https://levio.es` before auth begins or be listed explicitly as a separate
  approved origin.
- No production auth flow may depend on a wildcard origin unless separately
  reviewed and accepted.

### 3.2 Auth Callback URL

The only approved runtime callback route for the current implementation is:

```text
{origin}/auth/callback
```

For the locked environments this means:

```text
http://localhost:3000/auth/callback
https://levio.es/auth/callback
{approved-preview-origin}/auth/callback
```

The callback accepts a `next` query parameter, but Levio sanitizes it to
dashboard-only paths.

### 3.3 Redirect URL Allowlist

Supabase Auth redirect URLs must include only approved callback URLs:

```text
http://localhost:3000/auth/callback
https://levio.es/auth/callback
{approved-preview-origin}/auth/callback
```

Optional only if the public domain strategy requires it:

```text
https://www.levio.es/auth/callback
```

Forbidden redirect targets:

- external domains not owned or approved for Levio;
- `/api/*`;
- `/login`;
- `/register`;
- `/forgot-password`;
- `/auth/callback` as a post-auth destination;
- non-dashboard `next` paths;
- protocol-relative URLs;
- wildcard production origins without separate review.

### 3.4 In-App Redirect Contract

Current approved post-auth destinations:

| Flow | Supabase callback URL | Sanitized in-app destination |
| --- | --- | --- |
| Login default | `{origin}/auth/callback?next=%2Fdashboard` | `/dashboard` |
| Login from saved simulations | `{origin}/auth/callback?next=%2Fdashboard%2Fsimulations` | `/dashboard/simulations` |
| Register / confirmation | `{origin}/auth/callback?next=%2Fdashboard` | `/dashboard` |
| Already authenticated auth entry | no provider callback | `/dashboard` |
| Dashboard auth guard failure | no provider callback | `/login?next=/dashboard&reason=...` |
| Password recovery | not active in current runtime | reserved for B2/B3 decision |

`sanitizeRedirectPath` allows only `/dashboard` and `/dashboard/...`.

### 3.5 Password Recovery Redirect

Password auth is not approved in the current runtime posture, so password
recovery email delivery must remain disabled until B2/B3 either:

1. explicitly keep password recovery disabled and preserve the prepared
   `/forgot-password` state; or
2. implement an approved recovery flow.

If password recovery is later approved, the recovery link must still use an
approved `{origin}/auth/callback` URL and route only to an approved dashboard
recovery destination after server validation. A likely destination is a future
real `/dashboard/security` recovery state, but the current dashboard security
page is prepared/demo and is not yet a real reset surface.

## 4. Required Environment Variables

### 4.1 Auth Runtime Env

| Env var | Current usage | Visibility | Required for enabled auth |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase server/browser auth clients | public | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase server/browser auth clients | public | yes |
| `LEVIO_AUTH_PROVIDER` | server config, defaults to `supabase` | server-only | yes in production config |
| `LEVIO_AUTH_RUNTIME_ENABLED` | server runtime kill switch | server-only | yes |
| `NEXT_PUBLIC_LEVIO_AUTH_RUNTIME_ENABLED` | browser runtime kill switch | public | yes for browser consistency |
| `LEVIO_APP_URL` | canonical server app origin | server-only | yes in production config |
| `NEXT_PUBLIC_SITE_URL` | fallback app origin | public | optional fallback |
| `LEVIO_AUTH_REDIRECT_ALLOWLIST` | approved origin list in config | server-only | yes for environment evidence |

Rules:

- Public Supabase URL and anon key are not secrets and must not be treated as
  authorization.
- Protected access must still be decided by server session validation.
- `LEVIO_AUTH_RUNTIME_ENABLED` and `NEXT_PUBLIC_LEVIO_AUTH_RUNTIME_ENABLED`
  should be aligned per deployment. If the browser flag disables auth while the
  server flag enables it, login/register initiation will fail client-side.
- `LEVIO_APP_URL` must match the Supabase Site URL for the same environment.
- `LEVIO_AUTH_REDIRECT_ALLOWLIST` should contain approved origins, not callback
  paths. Supabase itself must separately allow the callback URLs listed in this
  document.

### 4.2 Server-Only Secrets and Forbidden Client Env

These values must never be exposed through `NEXT_PUBLIC_*`, browser bundles,
client components, logs, or product UI:

```text
SUPABASE_SERVICE_ROLE_KEY
LEVIO_PERSISTENCE_SUPABASE_SERVICE_ROLE_KEY
LEVIO_PERSISTENCE_SUPABASE_PROVIDER_ENABLED
LEVIO_PERSISTENCE_SUPABASE_URL
LEVIO_AUTH_PROVIDER
LEVIO_AUTH_RUNTIME_ENABLED
LEVIO_APP_URL
LEVIO_AUTH_REDIRECT_ALLOWLIST
future SMTP credentials
future webhook secrets
future provider management tokens
```

The service role key is only for approved server-only persistence/admin
boundaries and is not required for ordinary auth session validation.

## 5. Email Delivery Expectations

### 5.1 Magic-Link / OTP Email

Required before real user validation:

- Supabase email delivery configured for the target environment.
- Sender identity/domain reviewed and owned by the Levio operator.
- SPF, DKIM, and DMARC readiness checked before production use.
- Link target points only to an approved `{origin}/auth/callback` URL.
- Links are short-lived according to approved Supabase project settings.
- Templates are Spanish-first and identify Levio as a Decision Simulation
  Engine, not AI Chat or an Answer Engine.
- Templates do not include provider tokens, raw callback payloads, internal
  IDs, owner IDs, service-role details, or decision content.
- Copy tells the user to ignore the email if they did not request access.

### 5.2 Confirmation Email

If Supabase email confirmation is enabled for sign-up, the confirmation email
must obey the same callback, sender, language, and data-minimization rules as
magic-link email.

Register flow currently calls `signInWithOtp` with `shouldCreateUser: true`;
B2/B3 must validate the exact Supabase behavior for new users under the
configured confirmation policy.

### 5.3 Password Recovery Email

Password recovery email must remain disabled unless password auth is approved.

If later approved, recovery email must:

- be short-lived and one-time where supported;
- use only approved callback URLs;
- lead to a real recovery state implemented by B2/B3;
- avoid exposing whether an email address is registered where product/security
  policy requires enumeration resistance;
- require session/security review after successful reset.

## 6. Compatibility Verdict

Current implementation is compatible with the locked B1 contract at foundation
level:

- required auth env names exist in `lib/auth/config.ts`;
- server and browser Supabase clients are isolated behind `lib/auth/supabase`;
- login/register use the approved OTP/magic-link posture;
- callback URL shape matches `{origin}/auth/callback`;
- callback exchange is server-side and fail-closed;
- post-auth redirects are dashboard-only;
- dashboard routes are protected by a server layout guard;
- password recovery is correctly not active while password auth is not approved.

## 7. Gaps for B2/B3

B1 does not require code changes, but it identifies these exact gaps:

1. `LEVIO_AUTH_REDIRECT_ALLOWLIST` is recorded in config but current
   login/register initiation builds `emailRedirectTo` from
   `window.location.origin`. B2 should centralize redirect construction or add
   explicit validation so browser-origin redirects are proven against the
   locked allowlist.
2. `buildAuthRedirectUrl()` exists but is not used by login/register because
   those flows are client-side. B2 should decide whether auth initiation stays
   client-side or moves through a server action/boundary.
3. `NEXT_PUBLIC_LEVIO_AUTH_RUNTIME_ENABLED` is used by code but was not fully
   locked in older Stage 4.1 documentation. B1 now locks it as the browser
   runtime gate.
4. No repository evidence proves remote Supabase Site URL, redirect URLs, email
   sender/domain, email templates, or email delivery. B3 must validate them
   against a real configured project when execution is approved.
5. Password recovery remains disabled. B2/B3 must either preserve that policy
   explicitly or implement the approved recovery path.
6. There is no dedicated Block B auth configuration quality gate. B7 should add
   only necessary checks after B2/B3 define the final runtime behavior.

## 8. B1 Completion Decision

Decision:

```text
B1 COMPLETE - CONFIGURATION CONTRACT LOCKED
```

Reason:

- Required Supabase Auth settings are defined.
- Required redirect allowlist is defined.
- Required auth env variables and server-only boundaries are defined.
- Email delivery expectations are defined.
- Current implementation is compatible with the contract at foundation level.
- Remaining gaps are implementation/validation work for B2/B3/B7, not blockers
  to closing B1.

This decision does not mean Supabase production auth is configured, real email
delivery is validated, password recovery is active, real account lifecycle is
complete, production personal data is approved, or Production Release is open.

Next recommended substep:

```text
B2 - Auth Action Boundary Completion
```
