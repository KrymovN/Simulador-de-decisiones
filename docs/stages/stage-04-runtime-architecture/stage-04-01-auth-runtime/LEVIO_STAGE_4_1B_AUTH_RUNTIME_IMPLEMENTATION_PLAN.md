# LEVIO STAGE 4.1B AUTH RUNTIME IMPLEMENTATION PLAN

## Document Status

- Stage: 4.1B - Auth Runtime Implementation Plan.
- Status: implementation blueprint only.
- Date: 16 June 2026, Europe/Madrid.
- Approved provider from Stage 4.1A: Supabase Auth.
- Depends on: `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, `../../../decisions/LEVIO_AUTH_PROVIDER_DECISION.md`, `../../../architecture/LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, and `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`.
- Runtime implementation status: not started by this document.
- Persistence status: not started.

This document defines how the next approved runtime implementation should be built. It does not install packages, create routes, create middleware, create environment variables, create a Supabase project, connect persistence, or change application behavior.

## 1. Runtime Architecture

### 1.1 Auth Boundaries

Supabase Auth must be integrated only behind a Levio-owned auth runtime boundary.

Required boundary:

```text
Supabase SDK / Supabase hosted auth flow
->
Levio Auth Runtime Boundary
->
Normalized Principal + Session Context
->
Server-Side Authorization Checks
->
Product Runtime
```

Product code must not consume Supabase-native user objects, raw JWT payloads, refresh tokens, magic-link tokens, OAuth tokens, callback payloads, or provider profile blobs directly.

The normalized runtime context exposed to Levio product code must remain limited to:

```text
principal_id
principal_type
session_id
session_status
assurance_level
auth_time
expires_at
risk_flags
provider_reference
```

For Stage 4.1B runtime implementation, `provider_reference` may point to the Supabase user reference. The canonical durable Levio owner mapping remains deferred to Stage 4.2 Persistence Runtime and must not be implied by Supabase IDs.

### 1.2 Server Responsibilities

Server-side runtime responsibilities:

- create server Supabase clients with approved cookie/session handling;
- validate sessions before protected route access;
- normalize Supabase session/user state into Levio identity context;
- deny protected dashboard access when session validation fails;
- prevent client-provided user IDs, owner IDs, roles, entitlements, or assurance levels from becoming trusted;
- keep auth provider tokens outside product logic;
- enforce fail-closed behavior for protected dashboard routes;
- preserve public simulator behavior when auth runtime is unavailable or disabled.

The server must be the authority for authentication status on protected routes. Client UI state may improve display behavior but must not authorize access.

### 1.3 Client Responsibilities

Client-side responsibilities:

- initiate approved login, register, logout, and recovery flows through the Levio auth boundary;
- display auth states using normalized runtime status only;
- avoid storing provider secrets or refresh tokens in application state;
- avoid using localStorage mock session data as production auth;
- avoid treating hydration-time user display as server-side authorization;
- handle loading, signed-out, and auth-error states without exposing protected content.

The client may show account metadata only after server validation has established a trusted normalized session context.

### 1.4 Session Lifecycle

Planned lifecycle:

```text
no_session
-> login_or_register_started
-> provider_verification_pending
-> callback_received
-> server_session_validated
-> normalized_active_session
-> session_restored_on_navigation
-> logout_requested
-> session_revoked_or_cleared
-> signed_out
```

Failure transitions:

```text
callback_received
-> validation_failed
-> auth_error
-> signed_out

normalized_active_session
-> expired_or_revoked
-> signed_out

normalized_active_session
-> risk_detected
-> pending_step_up
```

Session invariants:

- session ID is not owner ID;
- session state is not memory, consent, subscription, or durable user data;
- session validation is server-side;
- expired, revoked, compromised, or malformed sessions fail closed;
- logout must clear the active runtime session and must not touch local demo simulator records;
- account-wide session revocation and session-management UI are future scope unless explicitly approved.

### 1.5 Identity Lifecycle

Planned identity lifecycle:

```text
anonymous
-> registered flow starts
-> Supabase verifies identity
-> Levio normalizes provider reference
-> authenticated registered user session
-> signed out
-> anonymous public browsing
```

Guest lifecycle remains conceptual only in Stage 4.1B. Supabase anonymous sign-ins must remain disabled unless a later guest-session policy approves them.

Identity invariants:

- anonymous users may explore public surfaces and temporary simulator flows;
- guest users are not implemented by the first Supabase runtime;
- registered users have verified provider identity but do not automatically own persisted Levio records until Stage 4.2 defines ownership mapping;
- signed-out users return to public anonymous behavior;
- auth errors never grant dashboard access;
- premium, subscription, memory, and AI capabilities are not identity states in this runtime.

### 1.6 Route Protection Model

Protected route strategy:

- public routes remain accessible without production auth;
- dashboard routes become protected by server-side session validation;
- auth entry routes remain accessible to signed-out users and may redirect already-authenticated users to the dashboard;
- legal/trust/public simulator routes remain public;
- protected routes fail closed when Supabase or the Levio auth boundary cannot validate the session.

Planned route groups:

| Route | Planned auth posture |
| --- | --- |
| `/` | Public. No production auth required. |
| `/login` | Public auth entry. Redirect authenticated sessions to dashboard. |
| `/register` | Public auth entry. Redirect authenticated sessions to dashboard. |
| `/forgot-password` | Public recovery entry if password auth is approved; otherwise future-compatible disabled/recovery guidance state. |
| `/dashboard` and descendants | Registered authenticated session required. |
| `/api/simulate` | Unchanged. Public simulator contract must not be modified by auth runtime. |
| `/visual-lab` | Unchanged unless later explicitly scoped. |

### 1.7 Dashboard Protection Model

The dashboard protection model should be implemented through a shared server-side gate so every dashboard child route inherits the same fail-closed behavior.

Planned behavior:

- unauthenticated direct dashboard access redirects to `/login` or a dedicated signed-out state;
- invalid, expired, or revoked sessions are treated as signed out;
- authenticated sessions may access dashboard shell and current demo dashboard surfaces;
- demo/localStorage dashboard content must remain clearly separate from production user data;
- no saved simulations, memory, subscriptions, export, deletion, or persistence are added by dashboard protection.

The current `MockAuthGate` must not become production authorization. It may be bypassed, retained as demo fallback, or isolated behind an explicit local/demo boundary during the later runtime implementation.

### 1.8 Auth State Transitions

Approved state transitions:

| From | Event | To | Notes |
| --- | --- | --- | --- |
| `anonymous` | Open public page | `anonymous` | No server identity. |
| `anonymous` | Start login/register | `provider_verification_pending` | Email magic link / OTP first. |
| `provider_verification_pending` | Valid provider callback | `authenticated` | Server validates session and normalizes context. |
| `provider_verification_pending` | Invalid/expired callback | `auth_error` | No protected access. |
| `authenticated` | Normal navigation | `authenticated` | Session restored server-side. |
| `authenticated` | Logout | `signed_out` | Session cleared or revoked. |
| `authenticated` | Session expires/revoked | `signed_out` | Protected routes fail closed. |
| `authenticated` | Sensitive action requested | `pending_step_up` | Future export/deletion/provider-linking scope. |
| `auth_error` | User dismisses/retries | `signed_out` or `provider_verification_pending` | No data access during error. |
| `signed_out` | Open public page | `anonymous` | Public behavior resumes. |

Forbidden transitions:

- `anonymous` -> `authenticated` through `levio_es_mock_session`;
- `guest` -> `authenticated` through silent merge;
- `authenticated` -> `premium_user` through client-side state;
- `authenticated` -> memory consent through registration alone;
- auth error -> protected dashboard content.

## 2. Supabase Integration Plan

### 2.1 Required Packages

The later approved runtime implementation is expected to require:

```text
@supabase/supabase-js
@supabase/ssr
```

`@supabase/ssr` is preferred for Next.js App Router server/client cookie handling. Deprecated auth-helper packages must not be selected without a fresh documentation review.

Package installation is not performed by this planning document.

### 2.2 Required Environment Variables

The later runtime implementation should define these environment variables through approved deployment configuration, not in this document:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
LEVIO_AUTH_PROVIDER=supabase
LEVIO_AUTH_RUNTIME_ENABLED
LEVIO_APP_URL
LEVIO_AUTH_REDIRECT_ALLOWLIST
```

Optional or future-only variables:

```text
LEVIO_AUTH_COOKIE_DOMAIN
LEVIO_AUTH_COOKIE_SECURE
LEVIO_AUTH_SESSION_MAX_AGE_SECONDS
SUPABASE_SERVICE_ROLE_KEY
```

Rules:

- `SUPABASE_SERVICE_ROLE_KEY` must be server-only and must not be required for ordinary user session validation.
- public environment variables must never authorize product access by themselves;
- runtime must fail closed when required auth configuration is missing and a protected route is requested;
- public simulator behavior must remain available when production auth is disabled.

### 2.3 Required Configuration

Planned application configuration:

- server Supabase client for session validation and callback exchange;
- browser Supabase client for initiating sign-in/sign-out flows only;
- central Levio auth config module that validates required variables;
- explicit auth runtime enabled/disabled flag;
- redirect allowlist for production, preview, and local development origins;
- no direct product imports of Supabase clients outside the auth boundary.

### 2.4 Required Supabase Project Settings

Planned Supabase project settings:

- configured site URL matching the production Levio domain;
- explicit redirect URLs for local development, preview deployment, and production;
- email provider configured for magic link / OTP delivery;
- email confirmation enabled for registered identity;
- short-lived auth and recovery links where supported;
- anonymous sign-ins disabled by default;
- OAuth providers disabled until account-linking policy is approved;
- password sign-in disabled by default unless separately approved;
- security and abuse controls reviewed before production launch;
- Supabase region and data-processing terms reviewed before production personal data.

No Supabase project is created or configured by this planning document.

### 2.5 Auth Providers Strategy

Initial approved strategy:

```text
email magic link / OTP first
OAuth later only after account-linking policy is approved
password login later only if product/support needs justify it
anonymous sign-ins disabled by default
```

Reason:

- passwordless email aligns with the approved low-friction account posture;
- OAuth introduces account-linking and provider-profile data minimization questions that are not solved in Stage 4.1B;
- password login adds password reset and security-support surface that is not required for the first identity foundation;
- Supabase anonymous users can blur Levio anonymous/guest boundaries and must not be enabled without a guest policy.

### 2.6 Email Verification Strategy

Email verification must be provider-backed and server-validated.

Planned behavior:

- user enters email on login/register surface;
- Supabase sends magic link or OTP;
- callback is exchanged server-side where required;
- Levio normalizes the validated provider identity into a registered-user session context;
- unverified, expired, replayed, or malformed links enter `auth_error`;
- no protected content is rendered before successful server validation.

Email templates must be reviewed for Spanish-first product tone, clarity, phishing resistance, and no unnecessary personal data.

### 2.7 Password Reset Strategy

Password login is not approved for the first Stage 4.1B runtime posture.

Therefore:

- password reset must not be activated unless password sign-in is explicitly approved;
- `/forgot-password` may remain a future-compatible recovery surface but must not promise active password recovery if password auth is disabled;
- if password auth is later approved, reset links must be short-lived, one-time, server-validated, and must revoke or review risky sessions after successful reset;
- password reset QA in this stage should verify the disabled/not-offered behavior, or the approved recovery behavior if password auth is separately enabled.

## 3. Levio Identity Model

### 3.1 Anonymous

Definition:

- no server-recognized production identity;
- no authenticated Supabase session;
- no durable cross-device owner guarantees.

Allowed:

- public pages;
- temporary simulator exploration;
- local unsaved draft behavior;
- local demo preferences where already implemented.

Denied:

- production dashboard access;
- durable save/history/memory;
- export/deletion initiation;
- subscription ownership;
- cross-device recovery.

Transitions:

- `anonymous` -> `provider_verification_pending` when login/register begins;
- `anonymous` -> `anonymous` for public browsing;
- `anonymous` must not transition to `authenticated` through mock/localStorage state.

### 3.2 Guest

Definition:

- temporary bounded identity for future active-flow continuity;
- not a verified person;
- not implemented in the first Supabase runtime unless separately approved.

Allowed in future:

- short-lived temporary server-side flow continuity;
- explicit bounded claim source for eligible data.

Denied in Stage 4.1B:

- durable ownership;
- memory;
- subscription ownership;
- silent merge into registered account.

Transitions:

- `anonymous` -> `guest` only after a future guest-session policy;
- `guest` -> `authenticated` only through explicit verified claim flow after persistence is approved;
- Supabase anonymous sign-ins must not be used as an implicit guest implementation in Stage 4.1B.

### 3.3 Authenticated

Definition:

- registered user with a validated Supabase-backed session normalized through the Levio auth boundary.

Allowed:

- protected dashboard access;
- account-level authenticated UI state;
- future durable operations only when later stages add authorization and persistence.

Denied:

- automatic memory consent;
- automatic subscription entitlement;
- automatic claim of local/demo simulations;
- direct use of Supabase user ID as permanent Levio owner ID before Stage 4.2;
- access to another user's future data.

Transitions:

- `provider_verification_pending` -> `authenticated` after valid server-side callback/session validation;
- `authenticated` -> `signed_out` on logout;
- `authenticated` -> `signed_out` when session expires or is revoked;
- `authenticated` -> `pending_step_up` for future sensitive operations.

### 3.4 Signed Out

Definition:

- previous authenticated session has been cleared, revoked, expired, or is absent.

Allowed:

- public pages;
- auth entry pages;
- temporary public simulator behavior.

Denied:

- protected dashboard access;
- production user-data access.

Transitions:

- `signed_out` -> `anonymous` for public browsing;
- `signed_out` -> `provider_verification_pending` when login/register restarts.

### 3.5 Auth Error

Definition:

- callback, token, session, config, provider, or validation failure.

Allowed:

- display retry-safe auth error state;
- return to login/register;
- continue public browsing after clearing unsafe auth state.

Denied:

- dashboard rendering;
- session restoration;
- fallback to mock auth as production authorization.

Transitions:

- `auth_error` -> `signed_out` after clearing invalid runtime state;
- `auth_error` -> `provider_verification_pending` when the user retries;
- `auth_error` must never transition directly to protected content.

## 4. File-Level Implementation Plan

This section lists planned files for the later approved runtime implementation. It does not create or modify those files in this planning step.

### 4.1 Files To Create During Approved Runtime Implementation

Planned new files:

```text
lib/auth/config.ts
lib/auth/types.ts
lib/auth/identity.ts
lib/auth/session.ts
lib/auth/guards.ts
lib/auth/supabase/server.ts
lib/auth/supabase/client.ts
lib/auth/supabase/callback.ts
components/auth/AuthRuntimeProvider.tsx
components/auth/AuthStateView.tsx
app/dashboard/layout.tsx
app/auth/callback/route.ts
middleware.ts
```

Creation rules:

- `lib/auth/*` owns provider normalization and must be the only product-facing auth boundary.
- `lib/auth/supabase/*` may import Supabase SDKs, but product code outside `lib/auth` must not.
- `app/dashboard/layout.tsx` should centralize dashboard protection.
- `app/auth/callback/route.ts` should exchange/validate provider callback state without exposing provider tokens.
- `middleware.ts` may perform coarse route checks only; final authorization remains server-side inside protected route/layout logic.

### 4.2 Files To Modify During Approved Runtime Implementation

Planned modified files:

```text
package.json
package-lock.json
app/layout.tsx
app/login/page.tsx
app/register/page.tsx
app/forgot-password/page.tsx
components/MockAuthGate.tsx
components/AuthShell.tsx
```

Modification intent:

- `package.json` and `package-lock.json`: add Supabase packages only during the approved implementation, never in this planning step.
- `app/layout.tsx`: add runtime provider only if needed for client auth state display, not for authorization.
- `app/login/page.tsx`: initiate Supabase email magic link / OTP flow through Levio boundary.
- `app/register/page.tsx`: initiate the approved registration flow through Levio boundary.
- `app/forgot-password/page.tsx`: align with approved recovery posture, including disabled/not-offered state when password auth remains disabled.
- `components/MockAuthGate.tsx`: isolate or retire demo-only gate for production-protected dashboard routes without deleting local demo behavior unless explicitly approved.
- `components/AuthShell.tsx`: preserve visual shell while wiring future auth states.

### 4.3 Files Forbidden To Modify Without Separate Approval

Forbidden for Stage 4.1B runtime implementation unless a later scope explicitly allows it:

```text
app/api/simulate/route.ts
app/page.tsx
components/HomeSimulator.tsx
components/DecisionSingularity.tsx
components/DecisionSingularityWebGL.tsx
components/DecisionSphereVisual.tsx
components/SimulationDetailClient.tsx
components/SimulationsList.tsx
lib/simulationEngine.ts
lib/mockSimulations.ts
lib/personalArea.ts
lib/decision-engine/**
lib/runtime-integration/**
app/dashboard/simulations/**
```

Reason:

- these files are simulator, deterministic brain, local demo data, or Stage 3 runtime surfaces;
- Stage 4.1B auth must not change public simulator behavior, SimulationResponse contracts, deterministic V2, local demo simulation data, or persistence-like behavior.

### 4.4 Files Not To Create In Stage 4.1B

Stage 4.1B must not create:

```text
database migrations
Supabase SQL schema files
user profile tables
simulation history tables
draft storage tables
memory tables
subscription tables
payment routes
AI provider clients
export job routes
deletion job routes
guest claim persistence routes
```

## 5. Security Model

### 5.1 Session Validation

Requirements:

- validate Supabase session server-side for every protected route request;
- normalize provider session into Levio session context before product use;
- treat missing, expired, revoked, malformed, or unverifiable sessions as signed out;
- do not trust client-side session claims for protected access;
- do not use session status alone as authorization for future records.

### 5.2 Token Handling

Requirements:

- provider tokens and refresh tokens remain inside Supabase/runtime handling;
- product logic never receives raw provider tokens;
- callback parameters are treated as sensitive and never logged with token material;
- service role key, if ever required, is server-only and not used for ordinary user session validation;
- no auth secrets are stored in localStorage, simulation records, memory, or logs.

### 5.3 Route Protection

Requirements:

- protected dashboard routes fail closed;
- public simulator and public pages remain accessible;
- auth entry pages handle already-authenticated users safely;
- unauthorized direct dashboard requests redirect or render a signed-out state without protected content;
- UI gates must not be the only protection.

### 5.4 Middleware Strategy

Middleware, if used, should be coarse-grained:

- identify protected path prefixes such as `/dashboard`;
- refresh or check session where the approved Supabase SSR pattern requires it;
- redirect clearly unauthenticated requests;
- avoid loading product data;
- avoid making ownership, consent, subscription, memory, or AI decisions.

Final authorization remains the responsibility of server-side protected route/layout logic and later Stage 4.2 data access policies.

### 5.5 SSR Considerations

SSR requirements:

- protected dashboard content renders only after server validation;
- no protected dashboard content is streamed before session validation completes;
- missing auth config on protected routes fails closed with a safe error;
- public pages must not become dependent on auth provider availability;
- server components must import only Levio auth boundary APIs, not Supabase product objects directly.

### 5.6 Client Hydration Considerations

Hydration requirements:

- server-rendered signed-out/protected decisions must not be overwritten by stale client auth state;
- client auth display may update after hydration but must not expose protected data;
- loading states must avoid flashes of protected dashboard content;
- mock/localStorage session must not re-open dashboard content after server denial;
- logout must clear client state consistently with server/session state.

## 6. Rollback Plan

### 6.1 Disable Runtime Safely

The implementation must support disabling production auth through an explicit runtime flag:

```text
LEVIO_AUTH_RUNTIME_ENABLED=false
```

Expected behavior when disabled:

- public pages continue to work;
- public simulator V1/mock contract remains unchanged;
- dashboard production protection does not silently fall back to trusted mock authorization;
- protected production data remains inaccessible;
- auth entry pages show disabled/unavailable state or retain approved mock/demo behavior clearly separated from production auth.

### 6.2 Return To Current State

Rollback steps for the later implementation:

1. Disable the auth runtime flag.
2. Remove Supabase environment variables from deployment configuration if needed.
3. Revert Stage 4.1B runtime files and package changes through git.
4. Confirm `MockAuthGate` and `levio_es_mock_session` remain demo-only.
5. Confirm no database or persistence migrations exist to roll back.
6. Confirm dashboard/demo localStorage behavior has not been promoted to production auth.

### 6.3 Verify No Stage 3 Impact

Required rollback verification:

- `/api/simulate` diff remains empty;
- `lib/decision-engine/**` diff remains empty;
- `lib/runtime-integration/**` diff remains empty;
- public simulator still uses V1/mock public contract;
- Stage 3.15 controlled runtime switch remains deny-by-default;
- Stage 3.16 regression assumptions remain unchanged;
- production build, lint, and TypeScript checks pass.

## 7. QA Plan

The later runtime implementation must verify these flows on desktop and mobile.

### 7.1 Login

- signed-out user can request approved magic link / OTP;
- valid callback creates normalized authenticated session;
- invalid or expired callback enters auth error;
- already-authenticated user is not trapped on login page.

### 7.2 Register

- registration uses the same approved provider-backed email verification posture;
- new user becomes authenticated only after provider verification;
- registration does not create memory consent, subscription entitlement, saved history, or persistence.

### 7.3 Logout

- authenticated user can log out;
- server session is cleared or revoked as supported;
- dashboard direct access after logout fails closed;
- local demo simulator data is not deleted by logout unless a separate user action does so.

### 7.4 Session Restore

- valid session restores dashboard access after page refresh;
- restored session is normalized through Levio boundary;
- product code does not read raw Supabase user objects.

### 7.5 Direct Dashboard Access

- signed-out direct access to `/dashboard` redirects or renders signed-out state;
- invalid session direct access fails closed;
- protected content does not flash before redirect.

### 7.6 Mobile

- login/register/recovery flows fit small screens;
- magic link or OTP callback works on mobile browsers;
- dashboard protection works after mobile refresh and browser restore.

### 7.7 Desktop

- login/register/recovery flows work in supported desktop browsers;
- direct navigation and refresh preserve protected-route behavior;
- browser back/forward cache does not expose protected content after logout.

### 7.8 Expired Session

- expired session is detected server-side;
- protected route access fails closed;
- user can re-authenticate cleanly;
- no stale client state reopens dashboard content.

### 7.9 Invalid Credentials

- invalid OTP or malformed callback enters auth error;
- repeated invalid attempts do not leak account existence;
- no protected route access is granted.

### 7.10 Email Verification

- verification link/OTP is short-lived and one-time according to provider configuration;
- successful verification creates authenticated state only after server validation;
- expired/replayed links are denied.

### 7.11 Password Reset

For the initial passwordless posture:

- password reset is not offered as an active production flow;
- `/forgot-password` does not promise a password recovery path when password auth is disabled;
- QA verifies safe disabled/recovery guidance behavior.

If password auth is separately approved later:

- recovery link is short-lived and one-time;
- reset succeeds only through server-validated provider flow;
- risky sessions are revoked or reviewed after reset.

### 7.12 Regression Checks

Required commands:

```text
git diff --check
npm run lint
npx tsc --noEmit
npm run build
```

For runtime-code implementation, additionally confirm:

- Stage 3.15 validation is not broken;
- Stage 3.16 regression assumptions are not violated;
- public simulator V1 mock contract is unchanged.

## 8. Scope Lock Confirmation

### 8.1 What Stage 4.1B Includes

Stage 4.1B runtime implementation, when explicitly approved after this plan, may include:

- Supabase Auth dependency installation;
- Supabase runtime boundary files under `lib/auth`;
- server and browser Supabase client wrappers limited to auth;
- normalized Levio identity/session types;
- server-side dashboard protection;
- auth callback route;
- login/register flow wiring for email magic link / OTP;
- safe disabled/not-offered recovery behavior while password auth is disabled;
- route protection and session validation QA;
- rollback flag and fail-closed behavior;
- documentation updates for implemented auth runtime.

### 8.2 What Stage 4.1B Does Not Include

Stage 4.1B does not include:

- Stage 4.2 Persistence Runtime;
- database schema creation;
- Supabase table creation;
- saved simulations;
- draft storage;
- history storage;
- guest claim persistence;
- subscriptions or payments;
- AI provider integration;
- memory runtime;
- export implementation;
- deletion implementation;
- workspace model;
- OAuth provider linking;
- password login unless separately approved;
- Supabase anonymous sign-ins unless separately approved;
- deterministic brain changes;
- simulator runtime changes;
- `SimulationResponse` or `SimulationResponse V2` changes;
- public simulator behavior changes;
- production ownership mapping beyond provider-reference normalization.

### 8.3 Current Planning Step Confirmation

This planning step creates only this document.

Confirmed:

- no runtime code is implemented;
- no packages are installed;
- `package.json` and `package-lock.json` are not changed by this step;
- no Supabase project is created;
- no environment variables are created;
- no middleware is created;
- no API routes are created;
- no persistence is connected;
- Stage 4.2 is not started.
