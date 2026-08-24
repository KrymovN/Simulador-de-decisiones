# Levio Production Environment Configuration Package v1

## Document status

- Package: `PREPARE_PRODUCTION_ENVIRONMENT_CONFIGURATION`.
- Version: `1.0`.
- Prepared: 24 August 2026, Europe/Madrid.
- Repository baseline: `0bd75a76ae2223079bef0c19dc34721ffa58dc7e`.
- State: `PREPARED_NOT_APPLIED`.
- Product baseline: `CORE_V1_IMPLEMENTATION_COMPLETE`.
- Real AI state required throughout preparation and initial configuration:
  `LEVIO_REAL_AI_DEV_ENABLED=false`.

This is a versioned configuration and operator handoff package. It does not
authorize or perform infrastructure provisioning, production configuration,
deployment, database connection or migration, DNS/TLS changes, credential
creation, external provider calls, Real AI activation, release, Commercial
Launch, or Scale execution. It contains no secret values.

## 1. Authority and scope

This package applies the existing requirements in:

- [`LEVIO_PROJECT_CONSTITUTION.md`](../../LEVIO_PROJECT_CONSTITUTION.md);
- [`LEVIO_IMPLEMENTATION_PLAN.md`](../../LEVIO_IMPLEMENTATION_PLAN.md);
- [`LEVIO_TESTING_STRATEGY.md`](../qa/LEVIO_TESTING_STRATEGY.md);
- [`LEVIO_BLOCK_B1_SUPABASE_AUTH_CONFIGURATION_LOCK.md`](../stages/stage-04-runtime-architecture/stage-04-01-auth-runtime/LEVIO_BLOCK_B1_SUPABASE_AUTH_CONFIGURATION_LOCK.md);
- [`LEVIO_USER_DATA_ARCHITECTURE.md`](../architecture/LEVIO_USER_DATA_ARCHITECTURE.md);
- [`LEVIO_STAGE_14_2_PUBLIC_LAUNCH_READINESS_CHECKLIST_VERIFICATION_MATRIX.md`](../stages/stage-14-public-launch/LEVIO_STAGE_14_2_PUBLIC_LAUNCH_READINESS_CHECKLIST_VERIFICATION_MATRIX.md);
- the current runtime configuration readers and migrations referenced below.

Where this package records an external value as required, the repository does
not supply that value and no placeholder is a substitute for owner-approved
production configuration. Production Release remains a separate major
execution decision.

## 2. Production component inventory

| Component or resource | V1 classification | Configuration state | Repository-grounded requirement | Later external action |
| --- | --- | --- | --- | --- |
| Next.js web application runtime | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_DEPLOYMENT_VALIDATION` | Run the current Node/Next.js application at an exact approved commit. | Owner selects the hosting target, deployment owner, runtime settings, and rollback facility. |
| Production environment and secret store | `REQUIRED` | `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Server-only variables must remain outside client bundles, logs, UI, and repository files. | Owner selects the environment/secret mechanism, grants least-privilege access, and names the secret/config owner. |
| Canonical domain and HTTPS/TLS | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Canonical origin is `https://levio.es`; auth callback is `https://levio.es/auth/callback`. | Owner confirms domain control; deployment operator provisions and validates TLS and routing. |
| Supabase production project: Postgres and Auth | `REQUIRED` | `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Supabase is the implemented database, auth, and persistence provider. The existing non-production project is not production evidence. | Owner supplies/authorizes the production project and its provider-generated values. |
| Supabase Auth and email delivery | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Site URL, callback allowlist, magic-link/OTP sender, Spanish-first templates, and short-lived links must follow the B1 lock. Password recovery remains disabled. | Owner approves sender identity, confirmation policy, template copy, expiry, and SPF/DKIM/DMARC readiness. |
| Database schema, migrations, RLS, and ownership isolation | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_DEPLOYMENT_VALIDATION` | Apply executable migrations `001`-`006`, then `008`; `007_rollback_notes.md` is non-executable. RLS and owner/principal boundaries must remain enabled. | Authorized database operator applies migrations to the approved target and records validation evidence. |
| Account-owned simulation persistence and user-data controls | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_DEPLOYMENT_VALIDATION` | Existing runtime flags enable records, drafts, history, save/list/reopen, export, deletion, and retention surfaces. | Operator configures the flags and validates authenticated, cross-owner, deletion, export, and retention behavior. |
| Production logging, error tracking, monitoring, and alerts | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Structured Real AI operational events are implemented and exclude sensitive/raw content; deterministic observability and controlled failures exist. No vendor is canonically prescribed. | Owner selects the deployment collection/error/alert facility, retention, routing, on-call owner, and incident path. |
| Backup and recovery | `REQUIRED` | `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Recovery must preserve user data, RLS, export/deletion/retention obligations, and the approved backup-deletion lifecycle. | Owner approves backup availability, retention/rotation, restore-test method, deletion-marker handling, and recovery ownership. |
| OpenAI provider configuration for the approved later Real AI path | `REQUIRED` | `READY_FOR_CONFIGURATION`; `REQUIRES_EXTERNAL_VALUE`; `REQUIRES_DEPLOYMENT_VALIDATION` | Provider is `openai`; model is the repository constant `gpt-5.6-terra`; runtime remains OFF until separate explicit approval. | Owner separately approves credential provisioning, activation, data/cost/operations controls, and one bounded live smoke. |

The following are not required production dependencies for current V1 and must
not be introduced by applying this package: object storage, background or
scheduled retention jobs, entitlement/subscription/billing infrastructure,
analytics, advertising, marketing tracking, session replay, or a specifically
named observability vendor. A `www` hostname and dedicated persistence env
aliases are optional only if the owner selects them without changing the
canonical `https://levio.es` origin.

No component above is classified `MISSING_IMPLEMENTATION`. Deployment-owned
configuration and validation work is not a product code gap.

## 3. Environment variable inventory

No value in the table is a credential. `Required now` means required during a
later approved production configuration with Real AI OFF. `Required later`
means required only after a separate Real AI activation approval.

| Variable | Requirement and boundary | Purpose and runtime validation | Source of value | Safe default or missing behavior |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required now; client-safe endpoint, not a secret | Supabase Auth server/browser endpoint; persistence endpoint fallback. URL syntax is checked by auth and persistence config readers. | External-provider-provided production project value | No safe production fallback. Missing/invalid disables Auth; persistence also disables if no dedicated URL exists. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required now; client-safe public key, never an authorization boundary | Creates Supabase Auth browser/server clients; protected access still uses server-validated sessions and RLS. | External-provider-provided production project value | No fallback. Missing disables Auth. |
| `LEVIO_AUTH_PROVIDER` | Required now; server-only | Selects the implemented Auth provider. | Repository-defined: `supabase` | Runtime defaults to `supabase`, but production configuration must be explicit; any other value disables Auth. |
| `LEVIO_AUTH_RUNTIME_ENABLED` | Required now; server-only | Server Auth kill switch. | Repository-defined desired production state; owner-applied | `false`, `0`, or `off` disables. Absence is not a disabling value, so production must set an explicit reviewed value. |
| `NEXT_PUBLIC_LEVIO_AUTH_RUNTIME_ENABLED` | Required now; client-safe switch | Browser Auth switch; must align with the server switch. | Repository-defined desired production state; owner-applied | `false`, `0`, or `off` disables browser Auth. Absence is not a disabling value, so production must set it explicitly. |
| `LEVIO_APP_URL` | Required now; server-only | Canonical app URL and redirect origin. URL syntax and allowlist membership are enforced when constructing auth redirects. | Repository-defined: `https://levio.es` | Falls back to `NEXT_PUBLIC_SITE_URL`, then localhost; neither fallback is acceptable for production configuration. |
| `NEXT_PUBLIC_SITE_URL` | Optional fallback; client-safe | Secondary app origin fallback. | Repository-defined if used: `https://levio.es` | May be absent when `LEVIO_APP_URL` is set. It must not disagree with the canonical origin. |
| `LEVIO_AUTH_REDIRECT_ALLOWLIST` | Required now; server-only | Comma-separated approved origins for in-app auth redirect construction. | Repository-defined minimum: `https://levio.es`; owner decides any separately approved optional origin | The app origin is added automatically if absent, but production requires an explicit value as configuration evidence. Invalid/unapproved origins must not be added. |
| `LEVIO_PERSISTENCE_SUPABASE_PROVIDER_ENABLED` | Required now; server-only | Enables the implemented Supabase persistence provider. | Repository-defined desired production state; owner-applied | Only `true`, `1`, or `on` enables. Missing/other values disable persistence. |
| `LEVIO_PERSISTENCE_SUPABASE_URL` | Optional; server-only | Dedicated persistence endpoint. | External-provider-provided if owner selects a dedicated alias | Falls back to `NEXT_PUBLIC_SUPABASE_URL`. |
| `LEVIO_PERSISTENCE_SUPABASE_SERVICE_ROLE_KEY` | One of the two service-role names is required now; server-only secret | Preferred server credential for principal resolution and persistence. Config validation requires a non-empty URL and key. | External-provider-provided; owner-controlled secret | Falls back to `SUPABASE_SERVICE_ROLE_KEY`; if both are missing, persistence is disabled fail-closed. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional fallback; server-only secret | Backward-compatible service-role credential alias. | External-provider-provided; owner-controlled secret | Not read when the preferred variable is present; missing together with it disables persistence fail-closed. |
| `LEVIO_SAVED_DECISION_SIMULATIONS_RUNTIME_ENABLED` | Required now; server-only | Enables the saved-decision simulation runtime. | Repository-defined desired production state; owner-applied | Only `true`, `1`, or `on` enables; otherwise disabled. |
| `LEVIO_SIMULATION_RECORD_PERSISTENCE_ENABLED` | Required now; server-only | Enables simulation-record persistence. | Repository-defined desired production state; owner-applied | Only `true`, `1`, or `on` enables; otherwise disabled. |
| `LEVIO_SIMULATION_DRAFT_PERSISTENCE_ENABLED` | Required now; server-only | Enables simulation-draft persistence. | Repository-defined desired production state; owner-applied | Only `true`, `1`, or `on` enables; otherwise disabled. |
| `LEVIO_SIMULATION_HISTORY_PERSISTENCE_ENABLED` | Required now; server-only | Enables simulation-history persistence. | Repository-defined desired production state; owner-applied | Only `true`, `1`, or `on` enables; otherwise disabled. |
| `LEVIO_REAL_AI_DEV_ENABLED` | Required now; server-only | Sole current switch selecting the protected public Real AI path. | Repository-defined preparation/initial value: `false` | Missing or any value except exact lowercase `true` keeps the public route on the deterministic/mock path. Package application must still set explicit `false`. |
| `LEVIO_AI_PROVIDER` | May be staged now while AI remains OFF; required later; server-only | Selects the approved provider inside the protected runtime. | Repository-defined: `openai` | With AI OFF, no provider is called. With AI ON, missing or any other value fails closed as provider not approved. |
| `OPENAI_API_KEY` | Not required now; required later only after separate approval; server-only secret | Creates the OpenAI transport only when AI is explicitly ON and provider selection is valid. | External-provider-provided; owner-controlled secret | With AI OFF, it is not required for runtime selection. With AI ON, missing/blank value produces controlled `credentials_unavailable` failure and no mock-as-real fallback. |

The selected model has no environment variable: `gpt-5.6-terra` is fixed by
`OPENAI_DECISION_MATERIAL_MODEL` in
[`openai-decision-material-adapter.ts`](../../lib/ai-provider/openai-decision-material-adapter.ts).
Do not introduce a provider/model override while applying this package.

## 4. Auth, database, persistence, and data-control configuration

### Authentication

- `READY_FOR_CONFIGURATION`: Supabase server/browser clients, callback route,
  session validation, dashboard protection, redirect sanitization, and runtime
  config validation exist.
- `REQUIRES_EXTERNAL_VALUE`: production project URL, anon key, Auth Site URL,
  redirect allowlist, sender identity, confirmation/OTP policy, and email
  delivery configuration.
- `REQUIRES_DEPLOYMENT_VALIDATION`: production-origin sign-in, callback,
  session refresh/expiry, logout, unauthorized access, enumeration-safe error
  behavior, and email deliverability.
- `MISSING_IMPLEMENTATION`: none for the current magic-link/OTP V1 scope.
  Password recovery remains intentionally inactive and must not be represented
  as a production capability.

Supabase Auth must use Site URL `https://levio.es` and must allow exactly
`https://levio.es/auth/callback`, plus only separately approved preview or
optional `www` callbacks. `LEVIO_AUTH_REDIRECT_ALLOWLIST` contains origins, not
callback paths. Wildcard production origins are not allowed. There is no
separate application CORS variable in the current runtime contract; deployment
proxy policy must not widen the locked redirect/origin boundary. HTTPS is
required for production session/cookie transport, and the existing Supabase SSR
cookie contract must be validated on the deployed origin.

### Database and persistence

- `READY_FOR_CONFIGURATION`: schema, ownership keys, constraints, RLS policies,
  Supabase provider adapter, persistence feature flags, export, deletion, and
  retention surfaces exist.
- `REQUIRES_EXTERNAL_VALUE`: approved production Supabase project, endpoint,
  server-only service role secret, backup policy, and named database/recovery
  owner.
- `REQUIRES_DEPLOYMENT_VALIDATION`: apply executable migrations `001` through
  `006`, skip non-executable `007_rollback_notes.md`, then apply `008`; verify
  tables, constraints, RLS, principal resolution, same-owner operations,
  cross-owner denial, atomic parent/history cleanup, export, deletion, and
  retention behavior.
- `MISSING_IMPLEMENTATION`: none.

The service role secret must remain server-only and must never substitute for
RLS/ownership validation. Production backup copies must age out under an
approved backup-deletion lifecycle. Restore procedure must preserve or reapply
deletion/restriction state before normal processing resumes; Levio must not
claim immediate deletion from every backup when the approved lifecycle has a
bounded expiry.

## 5. Observability, error handling, and alerts

Already implemented:

- deterministic runtime observability and rollback semantics;
- controlled public failure envelopes with no mock result presented as Real AI;
- structured `levio:production-ai-runtime` operational events covering runtime
  selection, orchestration, provider operation, latency, normalized
  usage/cost, fallback, and rollback state;
- event construction that marks sensitive data excluded and does not log raw
  decision content, provider payload, credentials, or Prompt Context.

Deployment configuration still required:

- collection of application logs and unhandled server errors;
- health/availability checks for the web runtime and critical routes;
- alert routing for deployment failures, sustained route failures,
  auth/session errors, persistence errors, backup failures, and—only after Real
  AI activation—provider errors/timeouts/rate/cost thresholds;
- short, approved log retention, access control, on-call/incident owner, and
  escalation path;
- validation that client bundles, product UI, logs, traces, and alerts contain
  no secrets, raw decision content, or external provider payloads.

No observability/error-tracking vendor is selected by canonical documents.
Choosing or integrating one is an owner decision. If the chosen deployment
facility cannot satisfy these requirements without code/SDK changes, that is a
separate bounded, owner-approved pre-release technical task; it is not proven
as a current V1 implementation gap by this preparation.

## 6. Owner and external inputs required

| Input or decision | Why it is needed | Approval boundary |
| --- | --- | --- |
| Hosting target, Node runtime settings, deployment owner, and previous-version rollback mechanism | Repository code does not select or provision a production hosting platform. | Required before configuration application. |
| Control of `levio.es`, TLS/routing operator, and decision on optional `www` redirect | The canonical origin is known, but external domain control and routing are not repository values. | Required before domain/TLS configuration. |
| Production Supabase project and its public URL/anon key/server-only service-role secret | Auth, database, and persistence cannot connect without provider-generated project values. | Project selection and secret handling require explicit owner authorization. |
| Supabase Auth Site URL/redirect settings, email sender, templates, expiry/confirmation policy, and SPF/DKIM/DMARC readiness | Real OTP/magic-link authentication depends on provider and domain settings outside the repository. | Required before production auth validation. |
| Authorization and named operator for migrations `001`-`006` and `008` | Schema application changes external production state and needs accountable execution. | Required before any production database operation. |
| Environment/secret store, access policy, config owner, and credential rotation procedure | Server-only credentials must be provisioned and recoverable without entering source control or client output. | Required before secrets are staged. |
| Logging/error/monitoring facility, alert destinations, retention, on-call owner, and incident route | Runtime events exist, but collection and operational response are deployment-owned. | Required before deployed pre-release validation. |
| Backup availability, retention/rotation, restore-test method, deletion-marker handling, and recovery owner | Production Gate requires recovery evidence and the data architecture requires an approved backup-deletion lifecycle. | Required before production personal data is accepted. |
| OpenAI API credential owner and separate Real AI activation approval | Provider transport cannot be activated safely without a protected credential and explicit provider/data/cost/safety/observability/rollback authority. | Not required for initial Real AI OFF deployment; required before later activation. |
| Release, incident-stop, rollback, privacy/legal, and support sign-off owners | Production Release and its claims remain a separate major decision. | Required for release go/no-go, not for this package. |

Do not place any actual input value in this package or request it during the
preparation task.

## 7. Dependency-aware application sequence

Each step requires the stated authority and recorded evidence. This document
does not authorize executing any step.

1. Owner approves a bounded production configuration application with Real AI
   OFF; selects the hosting target, production Supabase project, environment
   store, operators, and operational owners.
2. Provision production-intended hosting/environment storage, the Supabase
   project, Auth/email settings, logging/alert destinations, and backup policy
   without public traffic and without Real AI credentials or calls.
3. Authorized database operator applies migrations `001`-`006`, skips
   non-executable `007`, applies `008`, and validates schema, constraints, RLS,
   ownership isolation, and atomic cleanup before accepting user traffic.
4. Apply Auth and persistence environment values through the approved secret
   store. Set explicit aligned Auth/persistence flags. Set
   `LEVIO_REAL_AI_DEV_ENABLED=false`; provider selection may be staged as
   `openai`, but the OpenAI credential remains deferred unless separately
   approved.
5. Configure canonical `https://levio.es` routing/TLS, Supabase Site URL, exact
   callback allowlist, and secure session/cookie transport. Any optional `www`
   origin must redirect to canonical or be separately approved and allowlisted.
6. Deploy the exact approved commit to a production-intended, non-released
   environment with Real AI OFF and record build/config provenance.
7. Run deterministic and deployed smoke validation: homepage/public simulator,
   `/api/simulate` deterministic/mock contract, Auth/email/session lifecycle,
   protected dashboard, save/list/reopen, RLS/cross-owner denial, export,
   deletion, and retention.
8. Validate security/privacy, browser/accessibility, performance/reliability,
   log/alert collection, backup/restore, incident-stop, config rollback, and
   previous-deployment rollback; record Production Gate evidence.
9. Obtain a separate explicit owner approval for Real AI provider scope,
   production credential, minimum-necessary Prompt Context boundary, data and
   privacy controls, budget/cost limits, safety/quality, observability,
   rollback, and the one bounded live smoke.
10. Only under that later approval, provision the server-only OpenAI credential,
    verify `openai / gpt-5.6-terra`, change the flag to exact `true`, and execute
    one newly authorized bounded live Terra end-to-end integration smoke.
11. Return the flag to `false` on any stop condition. A successful smoke may
    inform a separate release go/no-go; it does not itself authorize Production
    Release.

## 8. Verification checklist with Real AI OFF

Before any provider activation, capture evidence that:

- [ ] deployed commit and environment name match the approved record;
- [ ] build, type/lint, focused auth/persistence/security/runtime gates, and
  release regression pass for the deployed candidate;
- [ ] all required variables are present at the correct client/server boundary,
  and no server secret appears in source control, client bundles, UI, logs, or
  error output;
- [ ] `LEVIO_REAL_AI_DEV_ENABLED` is explicitly `false`, no OpenAI transport is
  initialized, and no provider/API/token-count operation occurs;
- [ ] `/api/simulate` retains its deterministic/mock envelope and never labels a
  mock response as Real AI;
- [ ] `https://levio.es` and `https://levio.es/auth/callback` are the effective
  canonical app/callback values; HTTPS, redirect restrictions, and Supabase SSR
  session cookies work as expected;
- [ ] Auth OTP/magic-link flows, protected routes, session refresh/expiry,
  logout, and email templates/delivery pass without exposing account existence
  or internal data;
- [ ] migrations `001`-`006` and `008` are recorded; RLS is enabled; own-user
  operations succeed; cross-owner reads/writes fail;
- [ ] save/list/reopen, draft/history behavior, export, deletion, retention, and
  atomic parent/history cleanup match approved contracts;
- [ ] application errors and operational events reach the approved sink without
  secrets or raw decision content, and synthetic non-provider alert paths reach
  the named operator;
- [ ] backup/restore rehearsal preserves ownership controls and honors deletion,
  restriction, retention, and backup-expiry rules;
- [ ] previous-deployment, config, secret-version, persistence-write-stop, and
  Real AI kill-switch rollback procedures are rehearsed;
- [ ] Production Gate evidence has no unresolved critical/high privacy,
  ownership, security, recovery, or release blocker.

The repository checks relevant to a later candidate include `npm run build`,
`npm run lint`, TypeScript validation, focused Auth/persistence/user-data gates,
`quality:public-home-simulator-api-integration`,
`quality:public-api-controlled-ai-composition`,
`quality:simulation-response-v2-persistence-flow`, deterministic runtime
security/contract/observability gates, and rendered public-surface regression.
Offline tests must not be reinterpreted as deployed production evidence.

## 9. Rollback checklist

- [ ] Keep `LEVIO_REAL_AI_DEV_ENABLED=false` throughout initial application.
  After any later activation, setting it back to exact `false` is the first AI
  rollback and prevents provider transport selection.
- [ ] Restore the previous reviewed environment/secret version through the
  selected platform; rotate any credential suspected of disclosure. Never copy
  a server secret into client-visible variables or logs.
- [ ] Roll application traffic back to the previous known-good deployment using
  the owner-selected hosting mechanism, or pause public access through that
  mechanism if safe service cannot be maintained.
- [ ] For persistence incidents, disable application persistence writes and keep
  protected routes fail-closed. Preserve read-only access only where it safely
  supports export/deletion review.
- [ ] Never disable RLS as a rollback shortcut. Never execute the destructive
  table-drop examples in `007_rollback_notes.md` against production user data.
  Prefer an approved additive forward migration and preserve all user data,
  deletion, retention, export, and legal obligations.
- [ ] Use only the approved backup/restore process; after restore, validate RLS,
  ownership isolation, migrations, and reapply deletion/restriction state before
  normal processing or public traffic resumes.
- [ ] Record the incident, affected configuration/deployment versions, operator,
  decision, evidence, and remaining follow-up without logging user decision
  content or credentials.

Rollback mechanisms are `READY_FOR_CONFIGURATION` but remain
`REQUIRES_EXTERNAL_VALUE` and `REQUIRES_DEPLOYMENT_VALIDATION` until the owner
selects the hosting/config/backup facilities and names their operators.

## 10. Approval boundaries and next action

Separate explicit approval is required before each external state change:

- production infrastructure or Supabase project provisioning;
- environment/secret application or credential access;
- production database migration or connection;
- DNS, domain, TLS, Auth provider, or email configuration;
- deployment or public traffic;
- backup/restore rehearsal using production resources;
- observability vendor integration if it changes code/data processing;
- OpenAI credential provisioning, Real AI activation, or any live provider call;
- release go/no-go and Production Release.

The exact next bounded action after this package is:

`OWNER_APPROVAL_REQUIRED: APPLY_PRODUCTION_ENVIRONMENT_CONFIGURATION_WITH_REAL_AI_OFF`

That action is not executed by this package.
