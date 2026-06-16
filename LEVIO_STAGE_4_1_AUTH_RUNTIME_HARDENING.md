# LEVIO STAGE 4.1 AUTH RUNTIME HARDENING

## Document Status

- Stage: 4.1B-2 - Auth Runtime Hardening + Production Readiness.
- Status: completed auth-runtime hardening assessment.
- Date: 16 June 2026, Europe/Madrid.
- Approved provider: Supabase Auth.
- Depends on: `LEVIO_AUTH_PROVIDER_DECISION.md`, `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, and `LEVIO_STAGE_4_1B_AUTH_RUNTIME_IMPLEMENTATION_PLAN.md`.
- Persistence status: not started.
- Stage 4.2 status: not started.

This document records the hardening pass for the Stage 4.1 auth runtime foundation. It covers only authentication runtime behavior. It does not approve persistence, database schema, saved simulations, drafts, subscriptions, AI, memory, or user-owned data storage.

## 1. Completed Auth Runtime Scope

Completed within Stage 4.1 auth scope:

- Supabase Auth runtime dependencies are installed:
  - `@supabase/supabase-js`;
  - `@supabase/ssr`.
- Levio auth boundary exists under `lib/auth`.
- Supabase SDK imports are isolated behind auth runtime modules.
- Server-side session read and validation exist.
- Session validation normalizes provider state into a Levio session context.
- Dashboard access is protected by a server-side dashboard layout.
- Dashboard routes are forced dynamic so session validation occurs at request time.
- Auth callback route exists at `/auth/callback`.
- Login and register use the approved email magic-link / OTP posture.
- Password reset remains disabled because password auth is not approved.
- Auth entry pages do not create mock/localStorage production sessions.
- `MockAuthGate` no longer authorizes dashboard access.
- Public simulator and `/api/simulate` remain unchanged.

## 2. Hardening Audit Findings

### 2.1 Auth Flow Consistency

Finding:

- Auth entry pages had the correct magic-link foundation but did not redirect already authenticated users away from login/register/recovery surfaces.

Resolution:

- Login, register, and forgot-password pages now redirect authenticated runtime state to `/dashboard`.

### 2.2 Redirect Loops

Finding:

- The first redirect sanitizer allowed any internal path, including auth entry routes and API paths.

Resolution:

- Auth redirects are now constrained to `/dashboard` routes only.
- `/login`, `/register`, `/forgot-password`, `/auth/callback`, external URLs, protocol-relative URLs, malformed URLs, and `/api` paths are rejected to the safe `/dashboard` fallback.

### 2.3 Callback Safety

Finding:

- Callback handling only checked for a missing `code`; provider error query parameters were not handled first.

Resolution:

- Callback flow now checks provider `error` and `error_code` query parameters before code exchange.
- Missing code redirects to an explicit auth error.
- Failed code exchange redirects to an explicit auth error.
- Callback `next` is sanitized before redirect.

### 2.4 Session Recovery

Finding:

- Server session recovery already used Supabase session read followed by user validation, which preserves provider-side verification.

Resolution:

- No change required for the foundation.
- Session recovery remains server-side through the Levio auth boundary.

### 2.5 Session Expiration Handling

Finding:

- Normalized sessions already map expired sessions to signed-out behavior.

Resolution:

- No change required for the foundation.
- Expired sessions continue to fail closed at protected dashboard access.

### 2.6 Auth Error States

Finding:

- Guard and callback error query parameters were not visibly surfaced on auth pages.

Resolution:

- Login now displays mapped auth errors for:
  - auth runtime disabled;
  - config missing;
  - session missing;
  - invalid session;
  - expired session;
  - missing callback code;
  - callback exchange failure;
  - provider error.

### 2.7 Signed-Out State

Finding:

- Signed-out state existed but config-missing state was not explicit in the shared auth state view.

Resolution:

- The shared auth state view now renders an explicit config-missing state.

### 2.8 Missing Env Behavior

Finding:

- Missing Supabase env already caused protected dashboard access to fail closed, but config validation did not check malformed runtime URLs or unsupported provider config.

Resolution:

- Server config now rejects invalid app/Supabase URLs.
- Server config now rejects unsupported `LEVIO_AUTH_PROVIDER` values.
- Browser config now rejects invalid Supabase URL values.
- Disabled/missing env continues to fail closed for dashboard and remains non-blocking for public routes.

### 2.9 Unauthorized Dashboard Access

Finding:

- Unauthorized dashboard access already redirected to login and dashboard pages were dynamic after the first implementation pass.

Resolution:

- No new middleware was added.
- The server layout remains the dashboard authorization boundary.
- Direct unauthenticated or invalid-session access fails closed.

### 2.10 Logout Cleanup

Finding:

- Logout used Supabase client sign-out but did not clear the legacy mock session marker.

Resolution:

- Logout now clears the legacy `levio_es_mock_session` marker in addition to Supabase sign-out state.
- This cleanup does not make mock auth production-trusted.

## 3. Production Safety Status

Safety properties now present:

- Protected dashboard access fails closed.
- Missing env fails closed for dashboard.
- Invalid session fails closed.
- Expired session fails closed.
- Missing callback code fails closed.
- Provider callback error fails closed.
- Callback exchange failure fails closed.
- Auth redirects are dashboard-only and cannot redirect to external, auth-entry, callback, or API paths.
- Auth runtime tokens and provider objects remain behind `lib/auth`.
- Product runtime consumes normalized auth state only.
- No production user data is read or written.
- Public simulator V1/mock contract remains untouched.

Safety properties still requiring production environment validation:

- Real Supabase magic-link delivery.
- Real Supabase callback exchange with production redirect URLs.
- Provider-side email template review.
- Provider-side session expiry/revocation behavior under configured project settings.
- Legal/privacy review of Supabase project region, DPA, subprocessors, and retention.

## 4. Known Limitations

- No Supabase project is configured in the repository.
- No environment variables are created by this stage.
- Real email delivery cannot be validated locally without Supabase project settings.
- Password login is not enabled.
- Password reset is intentionally disabled.
- OAuth is not enabled.
- Supabase anonymous sign-ins are not enabled.
- Account linking is not implemented.
- Session-management UI is not implemented.
- Recent-auth or step-up assurance is not implemented.
- Internal Levio principal mapping remains a Stage 4.2 prerequisite.
- No database tables or RLS policies exist.
- Dashboard content still uses demo/local data where it existed before auth runtime.

## 5. Remaining Blockers

Blockers before production launch:

- Configure Supabase project and approved auth settings.
- Configure production and preview redirect allowlist.
- Configure and review email magic-link templates.
- Validate real magic-link login and callback exchange.
- Validate session restoration and logout against a real Supabase project.
- Review provider legal/privacy terms for production personal data.
- Define Stage 4.2 stable internal principal mapping before any user-owned data is persisted.
- Define persistence schemas, ownership tables, and RLS policies before saved user data exists.

These blockers do not require Stage 4.1 code changes unless real-provider QA discovers a runtime defect.

## 6. Rollback Instructions

Safe rollback path:

1. Disable auth runtime in deployment configuration:

```text
LEVIO_AUTH_RUNTIME_ENABLED=false
```

2. Remove Supabase runtime environment variables if needed:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
LEVIO_AUTH_PROVIDER
LEVIO_APP_URL
LEVIO_AUTH_REDIRECT_ALLOWLIST
```

3. Revert Stage 4.1 runtime files and package changes through git.
4. Confirm `/api/simulate` remains unchanged.
5. Confirm `lib/decision-engine/**` remains unchanged.
6. Confirm `lib/runtime-integration/**` remains unchanged.
7. Confirm public simulator V1/mock contract still works.
8. Confirm dashboard does not fall back to mock auth as production authorization.

No user-data migration or data rollback is required because Stage 4.1 creates no persistence.

## 7. Stage 4.2 Prerequisites

Stage 4.2 may start only after an explicit approval and must define:

- stable internal Levio principal IDs;
- provider-reference mapping from Supabase user IDs;
- owner/access-control schemas;
- database provider and region posture;
- RLS and server-side authorization model;
- profile and account metadata minimization;
- consent record boundaries;
- retention/deletion/export implications;
- tests for forged owner IDs and cross-user isolation;
- guest/anonymous data claim rules if guest persistence is introduced.

Stage 4.2 must not treat Supabase `auth.users.id` as the final owner model unless separately approved by architecture review.

## 8. Production Readiness Decision

Decision:

```text
READY FOR STAGE 4.2
```

Reason:

- The Stage 4.1 auth runtime foundation is implemented and hardened enough to serve as the identity/session boundary for the next persistence planning stage.
- Protected dashboard access fails closed.
- Auth provider integration is isolated behind Levio-owned boundary modules.
- Mock auth no longer authorizes dashboard access.
- No persistence or user-owned data storage has started.
- Remaining blockers are provider-environment and Stage 4.2 persistence prerequisites, not blockers to beginning Stage 4.2 architecture/runtime planning.

This decision does not mean ready for production users or real personal data. It means ready to proceed to the separately approved Stage 4.2 Persistence Runtime work.
