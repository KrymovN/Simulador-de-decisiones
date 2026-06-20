# LEVIO.ES - CURRENT PROJECT STATE

## Updated

20 June 2026, Europe/Madrid.

This document reflects the local project state in `/Users/s3/Documents/New project` after Stage 4.3Z Route Hardening Foundation. It is the primary current handoff file. `PROJECT_CONTEXT.md` must remain synchronized with it.

## Current Confirmed Checkpoint - 20 June 2026

Stage 4.3Z Route Hardening Foundation is the current confirmed checkpoint after
owner approval following Stage 4.3Y Blocker Reality Audit and commit `f027d89`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3Z_ROUTE_HARDENING_FOUNDATION.md` records the implementation
  closure.
- Runtime code was added only for User Data Controls route hardening foundation.
- `lib/user-data-controls/api-route-hardening.ts` was created.
- `lib/user-data-controls/api-route-foundation.ts` now composes route hardening
  before JSON parsing and workflow planning when routes are enabled.
- `lib/user-data-controls/api-route-foundation-validation.ts` now validates
  Stage 4.3Z hardening cases.
- `lib/user-data-controls/index.ts` exports the hardening foundation.
- `lib/auth/types.ts` and `lib/auth/messages.ts` now include explicit
  `session_revoked` foundation support.
- API route files were not changed.
- API surface was not changed.
- Production route enablement was not approved or changed.
- Product UI was not changed.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Real export packages were not created.
- Deletion writes, hard delete, and account deletion orchestration were not
  implemented.
- Stage 4.3Z implements route-specific rate limiting foundation, abuse
  protection foundation, CSRF protection foundation, Origin / Referer validation
  foundation, explicit revoked-session handling foundation, fail-closed response
  mapping, and rollback-safe disabled-route preemption.
- Stage 4.3V/4.3Z API route foundation validation passed: 18 passed / 0 failed.
- Stage 4.3Z remains foundation only. It does not make User Data Controls
  production-ready.
- Production route enablement remains `NO-GO`.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3Z-1 Route Hardening Integration Evidence & Route Enablement Re-Gate`.
- The next step is a governance/evidence validation gate unless the owner
  separately approves additional implementation work.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3Y Blocker Reality Audit was the confirmed checkpoint after Stage 4.3Y
Read Provider Integration Validation & Route Enablement Gate and commit
`ef2b4d0`; it is superseded by Stage 4.3Z.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3Y_BLOCKER_REALITY_AUDIT.md` records the blocker reality
  audit.
- The audit is documentation-only.
- Runtime code was not changed.
- API surface was not changed.
- Product UI was not changed.
- Production route enablement was not approved or changed.
- New endpoints were not created.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Real export packages were not created.
- Deletion writes, hard delete, and account deletion orchestration were not
  implemented.
- The audit classifies the ten Stage 4.3Y blockers as implementation,
  partial-implementation, or evidence gaps.
- Aggregate result: `IMPLEMENTED` 1, `PARTIALLY IMPLEMENTED` 5,
  `NOT IMPLEMENTED` 4, `EVIDENCE PRESENT` 0, `EVIDENCE MISSING` 10.
- Final conclusion: `Преимущественно Implementation Gap`.
- Route enablement remains `NO-GO`.
- Logical next step: obtain owner approval for a narrowly scoped blocker closure
  plan that separates engineering implementation blockers from evidence-only
  blockers. No new roadmap stage is automatically created by the audit.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3Y User Data Controls Read Provider Integration Validation & Route
Enablement Gate was the confirmed checkpoint after Stage 4.3X and commit
`1588323`; it is superseded by Stage 4.3Y Blocker Reality Audit.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3Y_READ_PROVIDER_INTEGRATION_VALIDATION_AND_ROUTE_ENABLEMENT_GATE.md`
  records the integration validation and route enablement gate.
- The gate is documentation-only.
- Runtime code was not changed.
- API routes were not changed.
- New endpoints were not created.
- Product UI was not changed.
- Production route enablement was not approved or changed.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Real export packages were not created.
- Storage/download links were not created.
- Deletion writes, hard delete, and account deletion orchestration were not
  implemented.
- Stage 4.3Y audits the Stage 4.3S/4.3T/4.3V/4.3X integration chain:
  canonical principal resolution, ownership guarantees, read provider
  boundaries, API route protection, feature flag behavior, sanitization,
  fail-closed behavior, and rollback posture.
- The foundation chain is structurally coherent, but production route enablement
  is not ready.
- Gate result: `NO-GO` for production route enablement.
- Technical blockers: no recorded route-through-provider validation against an
  approved production-like Supabase target, no route-specific rate limiting /
  abuse-protection evidence, no CSRF/origin/session-hardening evidence, no
  expired/revoked-session route evidence, no route-through-provider sanitized
  error validation, no rollback rehearsal, and no browser/API product QA for
  enabled routes.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3Z User Data Controls Route Enablement Blocker Closure & Integration Evidence`.
- The next step is a governance/evidence validation stage unless the owner
  separately approves narrowly scoped route-hardening implementation.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3X User Data Controls Production Read Provider Foundation was the
confirmed checkpoint after explicit owner approval following commit `79bf8d5`;
it is superseded by Stage 4.3Y.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3X_PRODUCTION_READ_PROVIDER_FOUNDATION.md` records the
  implementation closure.
- Runtime code was added only for User Data Controls production read provider
  foundation.
- `lib/user-data-controls/production-read-provider.ts` was created.
- `lib/user-data-controls/production-read-provider-validation.ts` was created.
- `lib/user-data-controls/api-route-foundation.ts` now composes the production
  read provider into the existing Stage 4.3V route foundation while preserving
  disabled-by-default route behavior.
- `lib/user-data-controls/index.ts` exports the new provider and validation
  catalog.
- Public simulator behavior was not changed.
- Product UI was not changed.
- Export UI and Deletion UI were not created.
- Production route enablement was not approved or changed.
- Real export packages were not created.
- Export storage/download links were not created.
- Deletion writes, hard delete, and account deletion orchestration were not
  implemented.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Stage 4.3X implements a server-only, read-only, owner-scoped production read
  provider foundation for `simulation_records`, `simulation_drafts`, and
  `simulation_history_entries`.
- The provider is disabled by default through
  `LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED`.
- The provider reads minimal planning columns, does not select raw payload
  columns, and sanitizes row contracts before handing rows to Stage 4.3T.
- Stage 4.3X validation catalog passed: 10 passed / 0 failed.
- Stage 4.3X remains foundation only. It does not make User Data Controls
  production-ready.
- Still blocked: production route enablement, public product UI, real export
  package generation, storage/download/expiration, deletion writes, hard
  deletion, account deletion orchestration, durable consent ledger, retention
  jobs, legal/privacy publication, browser/API product QA, route rate limiting /
  abuse protection review, CSRF/session-hardening review, OpenAI, billing, and
  Subscription Runtime.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3Y User Data Controls Read Provider Integration Validation & Route Enablement Gate`.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3W User Data Controls API Route Validation & Production Read Provider
Scope Gate was the confirmed checkpoint after Stage 4.3V and commit `2171861`;
it is superseded by Stage 4.3X.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3W_API_ROUTE_VALIDATION_AND_READ_PROVIDER_SCOPE_GATE.md`
  records the API route validation and production read-provider scope gate.
- The gate is documentation-only.
- Runtime code was not changed.
- Production read-provider code was not written.
- Supabase runtime was not connected.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- UI was not changed.
- New public endpoints were not created.
- Stage 4.3W audits the current export/deletion API route foundation, owner
  scope guarantees, canonical principal path, fail-closed behavior, feature flag
  protection, response sanitization, export planning path, and deletion planning
  path.
- Stage 4.3W defines production read-provider scope, allowed reads, forbidden
  reads, mandatory read-access checks, validation matrix, and rollback matrix.
- Gate result: GO for `Stage 4.3X User Data Controls Production Read Provider
  Foundation`; NO-GO for production route enablement, public UI exposure, real
  export package generation, deletion writes, hard delete, account deletion
  orchestration, OpenAI, billing, and Subscription Runtime.
- Stage 4.3W remains governance only. It does not make User Data Controls
  production-ready.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3X User Data Controls Production Read Provider Foundation`.
- The next step is an implementation stage, not another governance stage, if the
  owner explicitly approves production read-provider foundation work.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3V User Data Controls API Route Foundation was the confirmed
checkpoint after explicit owner approval following commit `d8f3ecb`; it is
superseded by Stage 4.3W.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3V_API_ROUTE_FOUNDATION.md` records the implementation
  closure.
- Runtime code was added only for User Data Controls API route foundation.
- `app/api/user-data-controls/export/route.ts` was created.
- `app/api/user-data-controls/deletion/route.ts` was created.
- `lib/user-data-controls/api-route-foundation.ts` was created.
- `lib/user-data-controls/api-route-foundation-validation.ts` was created.
- Public simulator behavior was not changed.
- Product UI was not changed.
- Export UI and Deletion UI were not created.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Real export packages were not created.
- Export storage/download links were not created.
- Deletion writes, hard delete, and account deletion orchestration were not
  implemented.
- Public unauthenticated endpoints were not created.
- API routes are disabled by default through
  `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED`.
- Stage 4.3V implements authenticated, owner-scoped, server-only route
  foundation for export request planning and deletion request planning.
- Export route output is manifest-only and sanitized.
- Deletion route output is lifecycle-only and sanitized.
- Stage 4.3V validation catalog passed: 10 passed / 0 failed.
- Stage 4.3V remains foundation only. It does not make User Data Controls
  production-ready.
- Still blocked: production route enablement, production Supabase read-provider
  connection, production Supabase validation, public product UI, real export
  package generation, storage/download/expiration, deletion writes, hard
  deletion, account deletion orchestration, durable consent ledger, retention
  jobs, legal/privacy publication, browser/API product QA, OpenAI, billing, and
  Subscription Runtime.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3W User Data Controls API Route Validation & Production Read Provider Scope Gate`.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3U User Data Controls API Scope & Product Exposure Gate was the
confirmed checkpoint after Stage 4.3T and commit `2421f32`; it is superseded by
Stage 4.3V.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3U_API_SCOPE_AND_PRODUCT_EXPOSURE_GATE.md` records the API
  scope and product exposure gate.
- The gate is documentation-only.
- Runtime code was not changed.
- UI was not changed.
- API routes were not created.
- Public endpoints were not created.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Export UI and Deletion UI were not created.
- Real export packages were not created.
- Deletion writes and account deletion orchestration were not implemented.
- Stage 4.3U defines future API eligibility for export request/status, deletion
  request/status, consent management, and retention visibility.
- Stage 4.3U defines what may leave the persistence boundary, what must never
  leave it, which operations must remain server-only, and which ownership,
  principal-resolution, and rollback checks are mandatory before exposure.
- Gate result: conditional GO for a future narrow server-side API route
  foundation stage; NO-GO for production public release, UI exposure, real export
  packages, deletion writes, hard deletion, consent ledger writes, retention
  jobs, OpenAI, billing, and Subscription Runtime.
- Stage 4.3U remains governance only. It does not make User Data Controls
  production-ready.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3V User Data Controls API Route Foundation`.
- The next step is an implementation stage, not another governance stage, if the
  owner explicitly approves API route foundation work.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3T User Data Controls Persistence Read Adapter Foundation is the
previous confirmed checkpoint after explicit owner approval following commit
`6e96e9a` and is superseded by Stage 4.3U.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3T_PERSISTENCE_READ_ADAPTER_FOUNDATION.md` records the
  implementation closure.
- Runtime code was added only inside `lib/user-data-controls`.
- Public simulator behavior was not changed.
- UI was not changed.
- API routes were not changed.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Export UI and Deletion UI were not created.
- Real export packages were not created.
- Deletion writes and account deletion orchestration were not implemented.
- Stage 4.3T implements an owner-scoped persistence read adapter foundation,
  safe server-only read provider contract, principal-based artifact access,
  export/deletion snapshot mapping, parent context for history deletion
  planning, rollback-safe invariants, and deterministic validation.
- Stage 4.3T remains foundation only. It does not make User Data Controls
  production-ready.
- Still blocked: public API routes, public UI workflows, real export package
  generation, storage/download/expiration, deletion writes, hard deletion,
  account deletion orchestration, durable consent ledger, retention jobs,
  production Supabase read-provider connection, production Supabase validation,
  legal/privacy publication, and browser/API product QA.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3U User Data Controls API Scope & Product Exposure Gate`.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3S User Data Controls Server Workflow Foundation was the previous
confirmed checkpoint after explicit owner approval following commit `9c02ae5`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3S_SERVER_WORKFLOW_FOUNDATION.md` records the implementation
  closure.
- Runtime code was added only inside `lib/user-data-controls`.
- Public simulator behavior was not changed.
- UI was not changed.
- API routes were not changed.
- OpenAI / Real AI Runtime was not connected.
- Billing / Subscription Runtime was not connected.
- Export UI and Deletion UI were not created.
- Stage 4.3S implements canonical principal resolution, ownership verification,
  owner-scoped artifact access contracts, manifest-only export workflow
  foundation, lifecycle-only deletion workflow foundation, runtime invariants,
  rollback evidence, and deterministic validation.
- Stage 4.3S remains foundation only. It does not make User Data Controls
  production-ready.
- Still blocked: public UI/API workflows, real export package generation,
  storage/download/expiration, deletion writes, account deletion orchestration,
  durable consent ledger, retention jobs, production Supabase validation,
  legal/privacy publication, and product QA.
- Next allowable roadmap step after separate owner approval:
  `Stage 4.3T User Data Controls Persistence Read Adapter Foundation`.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3R Blocker Reality Audit was the previous confirmed checkpoint after
Stage 4.3R and commit `2e38a86`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3R_BLOCKER_REALITY_AUDIT.md` classifies each Stage 4.3R blocker
  as implementation status plus evidence status.
- The audit is documentation-only.
- No runtime code, UI, API route, OpenAI, billing, dependency, or
  product-behavior change was approved.
- No new roadmap stage was created automatically.
- Stage 4.3S User Data Controls Server Workflow Foundation remained blocked at
  that checkpoint.
- Blockers were classified as predominantly implementation gaps, with some
  evidence/documentation gaps that can be reduced without runtime code.
- Evidence validation could help with production auth/session, legal/privacy
  copy, foundation QA, and rollback design.
- Real engineering was still required for canonical principal resolution on the
  product path, owner-scoped persistence product reads, export workflow,
  deletion workflow, product QA, and complete workflow rollback evidence.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3R User Data Controls Implementation Gate & Evidence Closure was the
previous confirmed checkpoint at commit `2e38a86`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3R_USER_DATA_CONTROLS_IMPLEMENTATION_GATE.md` records the
  implementation gate evidence and decision.
- The gate is documentation-only.
- No runtime code, UI, API route, Supabase production runtime, OpenAI, billing,
  Subscription Runtime, dependency, or product-behavior change was approved.
- Gate status: `NO-GO`.
- Stage 4.3S User Data Controls Server Workflow Foundation must not start yet.
- Foundation evidence exists for Stage 4.3 user data controls, owner-scoped
  persistence, and non-chat product invariants.
- Implementation evidence remains incomplete for production auth/session,
  canonical principal resolution, owner-scoped persistence product readiness,
  export workflow, deletion workflow, retention policy, consent workflow,
  legal/privacy copy, QA evidence, rollback drill, and explicit owner approval.
- The next approved roadmap step is `Stage 4.3R-1 User Data Controls Gate
  Blocker Closure Plan`.
- Stage 4.3R-1 must remain documentation/validation-only unless the project
  owner explicitly changes scope.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3Q User Data Controls Product Integration Readiness Plan was the
previous confirmed checkpoint at commit `43cf892`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3Q_USER_DATA_CONTROLS_READINESS_PLAN.md` records the readiness
  plan for future User Data Controls product integration.
- The readiness plan is documentation-only.
- No runtime code, UI, API route, Supabase production runtime, OpenAI, billing,
  Subscription Runtime, dependency, or product-behavior change was approved.
- Stage 4.3 foundation exists, but product/runtime implementation remains
  blocked.
- Stage 4.3Q does not approve implementation.
- Implementation may not start immediately after Stage 4.3Q.
- Required before implementation: Stage 4.3R implementation gate, auth/session
  evidence, principal-resolution evidence, persistence product-readiness
  evidence, legal/privacy copy path, QA matrix, rollback evidence, and explicit
  owner approval.
- The first possible implementation stage after mandatory gates is `Stage 4.3S
  User Data Controls Server Workflow Foundation`.
- The next approved roadmap step is `Stage 4.3R User Data Controls
  Implementation Gate & Evidence Closure`.
- Stage 4.3R must remain documentation/validation-only unless the project owner
  explicitly approves implementation.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3P User Data Controls Product Integration Scope Lock was the previous
confirmed checkpoint after Stage 4.2L and commit `732dff6`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3P_USER_DATA_CONTROLS_PRODUCT_INTEGRATION_SCOPE_LOCK.md`
  records the future product integration boundary for user data controls.
- The scope lock is documentation-only.
- No runtime code, UI, API route, Supabase production runtime, OpenAI, billing,
  Subscription Runtime, dependency, or product-behavior change was approved.
- Stage 4.3 remains complete only at foundation/runtime-boundary/QA level.
- Stage 4.3 product integration has not started.
- Stage 4.3 production readiness is not approved.
- User data controls are scoped to decision simulation artifacts only:
  simulations, drafts, saved decision artifacts, user-owned metadata, future
  export packages, and future deletion records.
- AI chat history, generic prompt history, and assistant conversation logs are
  not primary Levio product objects.
- User data controls must not turn Levio into AI Chat, an Answer Engine, or a
  generic AI assistant.
- Runtime dependencies remain owner-scoped persistence,
  `levio_principals.principal_id`, auth/session boundary, future export/delete
  workflows, and future retention policy.
- The next approved roadmap step is `Stage 4.3Q User Data Controls Product
  Integration Readiness Plan`.
- Stage 4.3Q must remain documentation/planning-only unless the project owner
  explicitly approves implementation.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.2L Persistence Runtime State Closure & Product Integration Scope Lock is
the previous confirmed checkpoint after `bf2d6d1`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_2L_PERSISTENCE_RUNTIME_STATE_CLOSURE.md` records the current
  persistence runtime state and product integration boundary.
- The closure is documentation-only.
- No runtime code, UI, API route, Supabase runtime connection, OpenAI, billing,
  Subscription Runtime, dependency, or product-behavior change was approved.
- Stage 4.2 is closed as foundation / isolated runtime boundary complete.
- Stage 4.2 product integration has not started.
- Stage 4.2 production readiness is not approved.
- Persistence remains owner-scoped to `levio_principals.principal_id`.
- Persisted simulations and drafts are decision simulation artifacts, not AI
  chat history.
- Future exports and deletions must operate only over owner-scoped eligible
  resources.
- The next approved roadmap step is `Stage 4.3P User Data Controls Product
  Integration Scope Lock`.
- Stage 4.3P must remain documentation/planning-only unless the project owner
  explicitly approves implementation.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 20 June 2026

Stage 4.3 Runtime Dependency & Scope Lock Audit was the confirmed
checkpoint after the Product Alignment Session and `LEVIO_PROJECT_PROGRESS.md`.

Confirmed facts from the repository:

- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md` records the dependency
  audit before any production User Data Controls runtime work.
- The audit is documentation-only.
- No runtime code, UI, API route, AI Provider, Stripe, billing, dependency, or
  product-logic change was approved by the audit.
- Stage 4.2 has runtime foundation modules under `lib/persistence-runtime`,
  including Stage 4.2E through Stage 4.2K code-level work, but product
  UI/API/auth/simulator integration remains unapproved and unconnected.
- Stage 4.3 remains complete only at the foundation/runtime-boundary/QA level.
- Stage 4.4 remains complete only at the foundation/runtime-boundary/QA level.
- Stage 5.1, Stage 5.2, and Stage 5.3A-C remain foundation/runtime/boundary
  work only; real AI runtime integration has not started.
- Stage 5.3A-C have code commits under `lib/ai-quality`, but no standalone
  Stage 5.3A-C closure documents exist.
- The next approved roadmap step is `Stage 4.2L Persistence Runtime State
  Closure & Product Integration Scope Lock`.
- Stage 4.3 production runtime remains blocked until Stage 4.2L closes the
  persistence runtime state and product integration boundary, unless the project
  owner explicitly approves a narrower non-production Stage 4.3 preflight-only
  step.
- Strategic invariant: Levio is not an AI Chat; Levio is not an Answer Engine;
  Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## Superseded Checkpoint - 19 June 2026

Stage 5.3C AI Quality / Cost / Safety Runtime Boundary was the confirmed checkpoint.
This documentation-only governance step adds `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
as an immutable architecture reference for all future Stage 5 runtime integration
work.

Confirmed facts from the repository:

- Stage 2, Stage 3, Stage 4.1, Stage 4.2, Stage 4.3, Stage 4.4, Stage 5.1, and Stage 5.2 are complete.
- Stage 5.3A through Stage 5.3C are complete and accepted at the contracts/runtime/boundary foundation level.
- The completed Stage 5.1 package is isolated under `lib/ai-provider`.
- The completed Stage 5.2 package is isolated under `lib/prompt-context`.
- The current Stage 5.3 package is isolated under `lib/ai-quality`.
- Stage 5.3A through Stage 5.3C did not connect OpenAI SDK, API keys, environment variables, API routes, real model calls, simulator runtime, Decision Engine runtime, AI Provider runtime, Prompt / Context runtime, database runtime, Supabase runtime, auth runtime, persistence runtime, subscriptions runtime, UI, or dashboard.
- Stage 5.3D has not started.
- Real AI runtime integration has not started.
- The immutable target runtime architecture is now documented in `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`.
- Future Stage 5 runtime integration must preserve `USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI`.
- Any deviation requires a separate warning, risk analysis, consequence analysis, alternative options, and explicit owner confirmation before code changes.
- Strategic invariant: Levio is not an AI Chat; Levio is not an Answer Engine; Levio is a Decision Simulation Engine.

Levio remains a system for decision simulation: modeling decisions, scenarios, risks, consequences, outcomes, and tradeoffs. The AI Provider is an internal replaceable component only. AI must not answer users directly, must not become the center of the product, and must not bypass the Decision Engine before or after candidate generation. The UI must present simulation process and simulation results, not direct AI answers.

## Superseded Checkpoint - 18 June 2026

Stage 4.2D Validation Intake was the confirmed checkpoint before Stage 4.3 foundation work.

Confirmed facts from the repository:

- Stage 4.2D Validation Intake records the owner/operator-submitted successful dev migration execution result for the approved Empty Dev Supabase Project.
- Owner/operator reported `SUCCESS` for `001_create_levio_principals.sql`, `002_create_simulation_records.sql`, `003_create_simulation_drafts.sql`, `004_create_simulation_history_entries.sql`, `005_indexes_and_constraints.sql`, `006_enable_rls_and_policies.sql`, and `007_rollback_notes.sql`.
- Stage 4.2D Validation Intake decision is `ACCEPTED DEV EXECUTION`.
- Stage 4.2D is fully completed at the dev migration execution level.
- The next actionable stage is `STAGE 4.2E PERSISTENCE RUNTIME FOUNDATION`, but Stage 4.2E implementation has not started.
- No production environment exists according to the owner/operator submission.
- No runtime integration, persistence code connection, auth-runtime database integration, AI/OpenAI, memory, or subscriptions exist.
- Codex did not execute SQL, connect to Supabase, request secrets, change migration files, change runtime, change auth, change simulator, start Stage 4.3, or start Stage 4.4 during validation intake.
- Stage 4.2D-11 creates `LEVIO_STAGE_4_2D_11_DEV_EXECUTION_RESULT_INTAKE.md`, defining owner/operator result submission requirements, validation result template, decision logic, next-step mapping, and safety rules for manual Empty Dev Supabase Project migration execution results.
- Stage 4.2D-11 decision statuses are `ACCEPTED DEV EXECUTION`, `ACCEPTED WITH WARNINGS`, `REJECTED / NEEDS FIX`, and `EXECUTION FAILED`.
- Stage 4.2D-11 maps accepted dev execution to `STAGE 4.2E PERSISTENCE RUNTIME FOUNDATION`; warnings require targeted fix/review before runtime if they affect evidence quality; rejected or failed execution blocks runtime until the migration/dev execution issue is resolved.
- Stage 4.2D-11 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-10 creates `LEVIO_STAGE_4_2D_10_OWNER_EXECUTION_CHECKLIST.md`, a short practical owner/operator checklist for manually applying the reviewed migration files in the approved Empty Dev Supabase Project.
- Stage 4.2D-10 keeps the exact migration order `001_create_levio_principals.sql`, `002_create_simulation_records.sql`, `003_create_simulation_drafts.sql`, `004_create_simulation_history_entries.sql`, `005_indexes_and_constraints.sql`, `006_enable_rls_and_policies.sql`, and review-only `007_rollback_notes.sql`.
- Stage 4.2D-10 defines before-start checks, per-file success/failure recording, post-execution validation checks, evidence to return, and stop conditions for wrong project, production selection, migration errors, rollback uncertainty, RLS/policy errors, and constraint errors.
- Stage 4.2D-10 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-9 creates `LEVIO_STAGE_4_2D_9_DEV_SUPABASE_EXECUTION_SUPPORT_PLAN.md`, defining the practical first-execution support plan for owner/operator-run migrations in an Empty Dev Supabase Project.
- Stage 4.2D-9 records the project-owner decision that the approved dev target is `Empty Dev Supabase Project`, local Supabase is not used for this stage, and production Supabase remains forbidden.
- Stage 4.2D-9 defines dev project requirements, dev project checklist, per-file migration execution sequence, validation evidence requirements, failure handling, Go criteria, and next-stage mapping to Stage 4.2E only after successful dev execution and accepted validation evidence.
- Stage 4.2D-9 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-8 creates `LEVIO_STAGE_4_2D_8_DEV_SUPABASE_TARGET_UNBLOCK_PLAN.md`, breaking down the Stage 4.2D-7 `NO-GO` blockers and defining the owner/operator inputs required before dev migration execution can be reconsidered.
- Stage 4.2D-8 requires confirmation of an isolated local/dev Supabase target, reset/restore path, execution method, test user strategy, service-role boundary, anon-key validation boundary, validation-log capture process, and stop-condition acceptance. Secrets must not be written into git or project documentation.
- Stage 4.2D-8 recommended safe path is Supabase local development first, with an empty dev Supabase project as fallback only when reset/snapshot and non-production boundaries are confirmed. Production Supabase and Vercel production env changes remain forbidden.
- Stage 4.2D-8 defines the next eligible step as `STAGE 4.2D-9 DEV MIGRATION EXECUTION SUPPORT PLAN` only after target/checklist confirmation. It does not start execution, Stage 4.2E, Stage 4.3, or Stage 4.4.
- Stage 4.2D-8 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-7 creates `LEVIO_STAGE_4_2D_7_PRE_EXECUTION_AUDIT.md`, auditing the full migration package order, dependencies, rollback chain, RLS dependencies, trigger dependencies, foreign key dependencies, ownership consistency, execution risks, environment readiness, and next-stage mapping.
- Stage 4.2D-7 Go / No-Go decision is `NO-GO`. The migration package is structurally coherent, but real execution remains blocked until the owner/operator confirms the exact isolated local/dev Supabase target, reset/restore path, execution method, test users, service-role boundary, anon-key validation boundary, stop-condition acceptance, and validation-log capture process.
- Stage 4.2D-7 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-6 creates `LEVIO_STAGE_4_2D_6_MANUAL_SUPABASE_EXECUTION_GUIDE.md`, defining the owner/operator manual execution scope, environment checklist, exact migration execution order, per-file checks, stop conditions, validation log template, post-execution gate, and next-stage decision.
- Stage 4.2D-6 keeps execution scoped to isolated local/dev Supabase only. Production execution remains forbidden in this stage.
- Stage 4.2D-6 defines the validation log that must be returned before Stage 4.2E Persistence Runtime Foundation may begin.
- Stage 4.2D-6 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-5 creates `LEVIO_STAGE_4_2D_5_SUPABASE_EXECUTION_READINESS_PLAN.md`, defining execution target, pre-execution checklist, manual execution plan, post-execution validation plan, failure/rollback plan, Stage 4.2D-6 criteria, and readiness status.
- Stage 4.2D-5 recommends isolated local/dev Supabase execution first and keeps production execution unapproved until local/dev validation logs, RLS evidence, rollback posture, and environment separation are confirmed.
- Stage 4.2D-5 readiness status is `READY FOR MANUAL SUPABASE EXECUTION`, scoped only to a separately approved local/dev manual execution. It is not production approval and not runtime persistence launch.
- Stage 4.2D-5 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-4 creates `LEVIO_STAGE_4_2D_4_MIGRATION_STATIC_REVIEW.md`, documenting reviewed migration files, static review findings, fixes applied, remaining risks, and readiness status.
- Stage 4.2D-4 hardens `supabase/migrations/006_enable_rls_and_policies.sql` so direct authenticated client inserts/updates on `simulation_records` and `simulation_drafts` fail closed. Future writes must come from a server-only persistence runtime after owner resolution from the validated auth session.
- Stage 4.2D-4 updates `supabase/migrations/007_rollback_notes.sql` so commented rollback policy names match the hardened RLS policy names.
- Stage 4.2D-4 readiness status is `READY FOR SUPABASE EXECUTION REVIEW`, meaning a separate isolated Supabase execution review may be planned later. It does not approve production execution.
- Stage 4.2D-4 does not execute SQL, connect to Supabase, create tables in any real database, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-3 creates real migration files on disk under `supabase/migrations/`: `001_create_levio_principals.sql`, `002_create_simulation_records.sql`, `003_create_simulation_drafts.sql`, `004_create_simulation_history_entries.sql`, `005_indexes_and_constraints.sql`, `006_enable_rls_and_policies.sql`, and `007_rollback_notes.sql`.
- Stage 4.2D-3 creates `LEVIO_STAGE_4_2D_3_REAL_MIGRATION_FILES.md`, documenting the created files, schema summary, RLS summary, rollback summary, what was not applied, prerequisites before applying migrations, and QA required before Supabase execution.
- Stage 4.2D-3 creates migration files only. It does not execute SQL, connect to Supabase, create tables in any real database, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-2 creates `LEVIO_STAGE_4_2D_2_MIGRATION_SQL_REVIEW_HARDENING.md`, reviewing the D-1 draft across ownership correctness, principal immutability, provider-reference uniqueness, foreign keys, deletion, retention, export, RLS, rollback, and indexes.
- Stage 4.2D-2 hardens the D-1 review draft by adding required future database-level immutability for `principal_id` and owner fields, expanding active provider-reference uniqueness across non-terminal states, requiring composite history parent-owner alignment, and improving rollback order for constraints/triggers before table drops.
- Stage 4.2D-2 readiness decision is `READY FOR REAL MIGRATION FILES`, meaning the reviewed draft is ready to be converted into real migration files only in a later explicitly approved stage. It does not mean migrations are ready to apply to production.
- Stage 4.2D-2 is documentation-only. It does not create real SQL files, migration files, schema files, migration directories, Supabase tables, runtime code, persistence APIs, auth runtime changes, dashboard changes, simulator changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.
- Stage 4.2D-1 creates `LEVIO_STAGE_4_2D_1_MIGRATION_SQL_REVIEW_DRAFT.md`, containing review-only SQL draft blocks for future `001_create_levio_principals`, `002_create_simulation_records`, `003_create_simulation_drafts`, `004_create_simulation_history_entries`, `005_indexes_and_constraints`, `006_enable_rls_and_policies`, and `007_rollback_notes`.
- Stage 4.2D-1 keeps `levio_principals.principal_id` as the canonical owner anchor, stores Supabase `auth.users.id` only as `provider_reference`, requires future user-owned records to use `owner_principal_id`, and documents RLS drafts through `provider_reference -> principal_id` owner isolation.
- Stage 4.2D-1 is SQL review only. It does not create real SQL files, migration files, schema files, migration directories, Supabase tables, runtime code, persistence APIs, auth runtime changes, dashboard changes, simulator changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.
- Stage 4.2D-0 creates `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, defining only the future migration file list, per-file purpose/dependencies/rollback/review checklist, schema boundary, RLS review plan, cross-user isolation/forged-owner/guest/fail-closed test expectations, and Stage 4.2D-1 prerequisites.
- Stage 4.2D-0 proposes future migration units for `create_levio_principals`, `create_simulation_records`, `create_simulation_drafts`, `create_simulation_history_entries`, `indexes_and_constraints`, `enable_rls_and_policies`, and `rollback_notes`.
- Stage 4.2D-0 does not create SQL, migration files, schema files, Supabase tables, runtime code, persistence APIs, auth runtime changes, dashboard changes, simulator changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.
- Stage 4.2C creates `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, defining future schema planning, planned table columns, required/nullable fields, indexes, uniqueness constraints, foreign-key strategy, deletion/retention/export compatibility, RLS planning, migration readiness, data-integrity rules, environment requirements, Stage 4.2D prerequisites, and risk register.
- Stage 4.2C plans future `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries` tables without creating SQL, migrations, Supabase tables, schema files, runtime code, persistence APIs, storage buckets, auth runtime changes, simulator changes, dashboard/UI changes, package changes, AI, memory, subscriptions, billing, payments, Stage 4.3, or Stage 4.4.
- Stage 4.2C keeps `levio_principals.principal_id` as the canonical future owner anchor and requires future RLS/server authorization to fail closed when principal mapping cannot be proven.
- Stage 4.2B creates `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, defining the conceptual principal mapping model, ownership rules, persistence entities, SimulationResponse V2 payload policy, guest-to-authenticated transition boundaries, GDPR/data-rights compatibility, and Stage 4.2C prerequisites.
- Stage 4.2B confirms that `levio_principals.principal_id` is the canonical Levio owner anchor for future persisted user data, while Supabase `auth.users.id` remains a `provider_reference` and must not become the direct owner ID without a later architecture approval.
- Stage 4.2B specifies `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries` as conceptual entities only. It creates no SQL, migrations, Supabase tables, runtime code, persistence API, storage buckets, auth runtime changes, simulator changes, dashboard changes, package changes, AI, memory, subscriptions, billing, or payments.
- Stage 4.2A creates `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, defining persistence scope, ownership model, conceptual data lifecycle, security/RLS posture, Stage 4.2 breakdown, rollback strategy, and dependencies at architecture level only.
- Stage 4.2A starts Stage 4.2 as documentation-only. It does not implement persistence runtime, create database schemas, write SQL, create migrations, connect storage, change auth runtime, change simulator runtime, change public API, change UI, connect subscriptions, connect AI, or connect memory.
- Stage 4.1B-2 creates `LEVIO_STAGE_4_1_AUTH_RUNTIME_HARDENING.md`, documenting the completed auth-runtime scope, audit findings, fixed issues, known limitations, remaining blockers, rollback instructions, Stage 4.2 prerequisites, and readiness decision.
- Stage 4.1B-2 hardens the existing Supabase Auth runtime foundation with stricter redirect sanitization, visible auth error mapping, provider callback error handling, malformed auth config rejection, unsupported provider rejection, authenticated-user redirects away from auth entry pages, safer submit `try/finally` handling, and logout cleanup of the legacy mock session marker.
- Stage 4.1B-2 confirms the release readiness decision `READY FOR STAGE 4.2`, meaning the auth identity/session boundary is ready for a separately approved persistence stage. It does not mean ready for production users or real personal data.
- Stage 4.1B-2 does not create persistence, database schemas, user tables, saved simulations, drafts/history storage, subscriptions, payments, AI integration, memory, simulator changes, Decision Engine changes, runtime-integration changes, or `SimulationResponse` changes.
- Stage 4.1B-1 implemented the Auth Runtime foundation with Supabase Auth packages, `lib/auth` runtime boundary, normalized identity/session model, server-side dashboard guard, `/auth/callback`, login/register magic-link foundation, disabled password-reset posture, and mock-auth separation.
- Stage 4.1B created `LEVIO_STAGE_4_1B_AUTH_RUNTIME_IMPLEMENTATION_PLAN.md`, defining the implementation blueprint for the auth runtime foundation without writing runtime code in that step.
- Stage 4.1A creates `LEVIO_AUTH_PROVIDER_DECISION.md`, evaluating Auth.js / NextAuth, Supabase Auth, and Clerk against Levio architecture, Stage 4.2 persistence fit, user-data ownership, GDPR-oriented requirements, lock-in, cost, support burden, migration, AI, subscriptions, and ownership impact.
- Stage 4.1A approves Supabase Auth as the provider for the next auth implementation planning stage, with a strict Levio Auth Runtime Boundary, stable internal principal mapping requirement, Supabase anonymous sign-ins disabled by default, and no direct provider-native owner ID assumption.
- Stage 4.1A rejects Auth.js / NextAuth and Clerk as initial providers while preserving Auth.js as the preferred fallback if Supabase lock-in or persistence alignment becomes unacceptable.
- Stage 4.1A is documentation-only. It does not start Stage 4.1B, implement auth runtime, create routes, install dependencies, change UI/dashboard/simulator/runtime code, connect persistence, subscriptions, AI, or memory, or change deterministic brain / `SimulationResponse`.
- Stage 4.1 creates `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, defining the provider-neutral auth runtime boundary, identity states, session model, guest/authenticated transition boundary, protected route strategy, rollback/safety plan, and roadmap compliance for production auth foundation.
- Stage 4.1 is documentation/scope-lock only because provider integration requires an explicit provider decision and implementation plan. No Supabase, Auth.js, Clerk, Firebase, Auth0, NextAuth, database, auth SDK, middleware, route gate, provider callback, session runtime, or dependency is added.
- Stage 4.1 preserves the current mock auth boundary: `components/MockAuthGate.tsx`, `levio_es_mock_session`, and localStorage saved simulations remain demo-only and must never authorize production data.
- Stage 4.1 does not start persistence, subscriptions, payments, AI, memory runtime, Stage 4.2, Stage 4.3, Stage 4.4, or Stage 5. Public simulator V1/mock behavior, `/api/simulate`, deterministic brain code, and Stages 3.11-3.16 runtime-switch behavior remain unchanged.
- `848a108` locked Stage 2.8G Hero artwork fidelity.
- `9c7447d` completed Stage 2.8H homepage minimal premium reduction.
- `6adefd6` completed the Stage 2.8 homepage motion and brand polish checkpoint.
- Stage 2.9D preserves product architecture and changes only homepage presentation markup in `app/page.tsx` and final desktop-only motion/visual overrides in `app/globals.css`.
- Stage 2.9E changes only the final mobile navigation override in `app/globals.css` and synchronizes stage documentation; auth/dashboard/simulator business logic is untouched.
- Stage 2.9F adds only responsive presentation overrides in `app/globals.css`: tablet `01/02/03/04` cards share one internal grid, final CTA typography is balanced, and the desktop simulator form is lighter and more compact.
- `HomeSimulator`, simulator/API contracts, auth/dashboard logic, localStorage keys, production persistence and favicon/metadata remain unchanged in Stage 2.9F.
- Stage 2.10A aligns `/login`, `/register` and `/forgot-password` with the homepage premium black-gold system through scoped auth presentation overrides in `app/globals.css`.
- Mock auth logic, routing, localStorage keys and dashboard logic remain unchanged; desktop/mobile route QA and mock auth flows passed.
- Stage 2.10A UX follow-up synchronizes homepage anchor navigation with scroll-linked reveals so Safari anchor landings render their target sections immediately.
- `HomeSimulator` uses its existing submit path for Enter, preserves Shift+Enter newlines and softly follows active thinking stages and completed output.
- Stage 2.10B preserves already reached homepage sections before simulator auto-follow, preventing dynamic result height from moving Safari root-scroll timelines back into dimmed intermediate frames.
- `HomeSimulator` adds progressive browser-safe `SpeechRecognition` / `webkitSpeechRecognition` voice input with start/stop/listening states and Spanish fallback/error feedback; voice input never submits automatically.
- Stage 2.11 creates `LEVIO_DECISION_ENGINE.md`, defining the future decision pipeline, confidence and completeness concepts, clarification logic, scenario construction, and Stage 3 AI integration requirements.
- Stage 2.11 creates `LEVIO_MEMORY_MODEL.md`, defining short-term, long-term, project, and decision memory with consent, retention, and GDPR boundaries.
- Stage 2.11 creates `LEVIO_SUBSCRIPTION_MODEL.md`, defining the conceptual FREE, PREMIUM, and PROFESSIONAL foundations without final prices or production entitlements.
- Stage 2.11 creates `LEVIO_MULTILINGUAL_ARCHITECTURE.md`, defining language selection, persistence, dictionaries, RTL requirements, and future AI language behavior.
- Stage 2.11 is documentation-only: product code, UI, business logic, simulator, auth/dashboard routes, API, localStorage contracts, OpenAI integration, database, and payments remain unchanged.
- Stage 2.12A unifies the shared dashboard shell with the homepage premium black-gold identity: Levio mark, sidebar, compact navigation, headers, active/hover states, glass surfaces, borders, shadows, and spacing.
- `/dashboard`, simulations, decisions, memory, profile, security, and privacy use consistent graphite/black/gold/amber presentation primitives without visually active cyan, rainbow, green, or legacy coral states.
- Stage 2.12A changes only presentation in `components/DashboardShell.tsx` and the final scoped dashboard cascade in `app/globals.css`; dashboard data, business logic, routes, localStorage, and API contracts remain unchanged.
- Stage 2.12B establishes one scoped dashboard grid rhythm with consistent content gaps, column/row gaps, card padding, start lines, and equal-height paired cards.
- Stage 2.12B neutralizes the legacy adjacent-section margin only inside dashboard, aligns the sidebar with the header, and disciplines history, decisions, memory, profile, security, and privacy layouts.
- Stage 2.12B changes only layout/CSS in `app/globals.css`; JSX, dashboard data, business logic, routes, auth, simulator, localStorage, and API contracts remain unchanged.
- Stage 2.13 creates `LEVIO_PRODUCT_READINESS_AUDIT.md`, assessing homepage, dashboard, auth, simulator, Decision Engine, memory, multilingual, monetization, Stage 3 readiness, production risks, and priority fixes.
- Stage 2.13 assesses Levio as a strong controlled-demo frontend and PARTIALLY READY product, but NOT READY for production users, real personal data, monetization, or direct AI connection.
- Stage 2.13 is audit/documentation-only: product code and protected contracts remain unchanged.
- Stage 2.14 creates `LEVIO_DECISION_SCHEMAS.md`, defining provider-independent canonical schemas, provenance, deterministic validation, confidence/completeness, safety, scenario, and recommendation invariants.
- Stage 2.14 creates `LEVIO_SIMULATION_RESPONSE_V2.md`, defining a future major-version response contract with clarification, analysis, limited-analysis, withheld-recommendation, refusal, and controlled-failure states.
- Stage 2.14 creates `LEVIO_CLARIFICATION_ENGINE.md`, defining critical-gap detection, question information value, minimal-question selection, contradiction handling, safety behavior, and stop conditions.
- Stage 2.14 is documentation-only: the current `SimulationResponse`, simulator, UI, dashboard, product code, API, auth, localStorage, persistence, payments, and OpenAI integration remain unchanged.
- Stage 2.15 creates `LEVIO_USER_DATA_ARCHITECTURE.md`, defining user-owned data principles, anonymous/guest/registered boundaries, simulation/history/memory/preference ownership, consent, retention, export, deletion, and recovery boundaries.
- Stage 2.15 connects future user-owned persistence to Production Auth Stage 2.16, subscriptions, memory, and `SimulationResponse V2` without selecting an auth/database provider or implementing persistence.
- Stage 2.15 is documentation-only: product code, UI, homepage, dashboard, simulator, API routes, the current `SimulationResponse`, localStorage, OpenAI integration, auth, database, payments, and dependencies remain unchanged.
- Stage 2.16 creates `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, defining auth principles, identity and session states, optional and required auth, anonymous and guest claims, ownership authorization, provider strategy, security, abuse-prevention, and GDPR-oriented boundaries.
- Stage 2.16 follows the User Data Architecture: authentication, authorization, ownership, consent, and subscription remain separate concepts, while production provider choice is deferred until implementation.
- Stage 2.16 is documentation-only: auth routes/providers, database, dependencies, product code, UI, homepage, dashboard, simulator, API routes, the current `SimulationResponse`, persistence, payments, and OpenAI integration remain unchanged.
- Stage 2.17 creates `LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md`, defining provider-neutral model adapters, controlled request lifecycle, validation and failure boundaries, observability, traceability, retries and fallbacks, rate limits, and cost budgets.
- Stage 2.17 preserves the Decision Engine as product authority: an AI provider creates candidate output only and does not decide ownership, auth, consent, entitlement, safety gates, or `SimulationResponse V2` semantics.
- Stage 2.17 is documentation-only: OpenAI or other AI providers, real model calls, streaming, AI routes, `/api/simulate`, environment variables, dependencies, product code, UI, dashboard, simulator, and the current `SimulationResponse` remain unchanged.
- Stage 2.18 creates `LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md`, defining evaluation dataset structure, measurable quality gates, the minimum pre-integration dataset, human and regression review, and an initial catalog of 24 synthetic cases.
- Stage 2.18 establishes zero-tolerance gates for critical safety/privacy violations and recommendations with unresolved critical gaps, plus multilingual, traceability, cost-aware, and controlled-failure thresholds.
- Stage 2.18 is documentation-only: AI providers/models, eval/test runners, automated tests, executable fixtures, SDKs, dependencies, product code, UI, dashboard, simulator, API routes, and the current `SimulationResponse` remain unchanged.
- Stage 2.19 creates `LEVIO_TESTING_STRATEGY.md`, defining product, Decision Engine, SimulationResponse, user-data, auth, and security testing layers, release quality gates, regression strategy, metrics, and audit evidence.
- Stage 2.19 separates semantic evaluation from deterministic testing and establishes development, internal release, beta, and production gates with blocking safety, privacy, ownership, and access boundaries.
- Stage 2.19 is documentation-only: tests, test/eval runners, CI/CD, GitHub Actions, Playwright/Vitest/Jest, dependencies, product code, UI, dashboard, simulator, API routes, AI, and the current `SimulationResponse` remain unchanged.
- Stage 2.19A creates `LEVIO_DOCUMENTATION_LANGUAGE_AUDIT.md`, audits key and root project-level Markdown documentation, and aligns detected Russian or mixed-language documentation fragments with the English-first standard.
- Stage 2.19A establishes the explicit language policy: project documentation is English, owner-facing Codex reports are Russian, and product UI remains multilingual with Spanish as the current primary public UI language unless product strategy changes.
- Stage 2.19A is documentation-only: product code, UI, dashboard, simulator, API routes, dependencies, AI integration, tests, and CI/CD remain unchanged.
- Stage 2.20 creates `LEVIO_TRUST_LEGAL_LAYER.md`, defining product transparency, expectation management, simulation and recommendation limitations, high-risk boundaries, user autonomy, trust indicators, accountability, auditability, and future legal dependencies.
- Stage 2.20 connects existing safety, data, auth, AI, evaluation, and testing foundations into a production Trust Layer while explicitly deferring public legal documents and qualified legal review.
- Stage 2.20 is documentation-only: no Terms of Service, Privacy Policy, legal publication, product code, UI, dashboard, simulator, API routes, dependencies, AI integration, tests, or CI/CD are created or changed.
- The Stage 2 Final Architecture Closure Audit creates `LEVIO_STAGE_2_FINAL_ARCHITECTURE_CLOSURE_AUDIT.md`, confirms cross-document consistency, corrects historical stage-status terminology, and closes the Stage 2 architecture package.
- Stage 3.1 creates an isolated provider-independent contract layer in `lib/decision-engine/` with canonical TypeScript types, draft result/V2 contracts, stable exports, and lightweight deterministic shape validators.
- Stage 3.1 does not implement the Decision Engine, generate scenarios, connect AI, auth, database, or persistence, change UI or API behavior, or modify the current simulator and `SimulationResponse` runtime.
- Stage 3.2 adds the first executable Decision Engine layer through pure deterministic completeness, critical-gap, confidence, trace, and limited contradiction-analysis functions in `lib/decision-engine/`.
- Stage 3.2 supports `missing_goal`, `missing_context`, `missing_constraints`, `missing_time_horizon`, `critical_unknown`, `contradiction_detected`, and `safety_gap` without AI, auth, database, persistence, subscriptions, UI, API, or simulator runtime integration.
- Stage 3.3 adds pure deterministic clarification functions that prioritize gaps, select a minimal first-pass question set, and decide whether to ask, proceed with limitations, withhold, or refuse.
- Stage 3.3 provides stable English question templates for all seven Stage 3.2 gap codes and preserves safety-first behavior without AI, memory runtime, auth, database, persistence, subscriptions, UI, API, or simulator runtime integration.
- Stage 3.4 adds pure deterministic scenario construction for optimistic, realistic, and pessimistic perspectives mapped to canonical favorable, base-case, and adverse scenario types.
- Stage 3.4 keeps scenarios structural and traceable through explicit assumptions, dependencies, uncertainty markers, outcome indicators, confidence calculations, and clarification gates without narrative generation or runtime integration.
- Stage 3.5 adds pure deterministic scenario-risk assessment with low, medium, high, and critical levels plus structured comparative probability, impact severity, reversibility, uncertainty, cost-of-error, confidence, and traceability.
- Stage 3.5 marks probability as comparative and not calibrated, links risk assessments to scenario assumptions and uncertainties, and adds no narrative generation or runtime integration.
- Stage 3.6 adds pure deterministic recommendation reasoning with structured categories, priorities, preconditions, option comparison, confidence, rationale, and source traceability.
- Stage 3.6 enforces critical-gap, clarification, and safety withholding gates; a consequential preferred option is exposed only for eligible recommended or conditional outputs.
- Stage 3.7 adds `runDecisionEngine(...)`, a pure deterministic orchestrator that coordinates validation, completeness, critical gaps, contradictions, clarification, scenarios, risks, and recommendations in the required order.
- Stage 3.7 adds controlled pipeline stops, stage-level traceability, controlled failures, and a model-quality confidence summary without connecting the orchestrator to product runtime.
- Stage 3.8 adds a pure deterministic mapper from `DecisionEngineResult` to `SimulationResponseV2Draft`, including lifecycle status, availability, safety, controlled failure, confidence, and full pipeline traceability mapping.
- Stage 3.8 keeps the V2 runtime draft isolated from UI, API routes, simulator runtime, dashboard, and the current public `SimulationResponse`.
- Stage 3.9 adds `runSimulationPipeline(...)`, a single deterministic internal runtime entrypoint that runs the Decision Engine, maps the result to a V2 draft, validates the final lifecycle envelope, and returns controlled failure instead of an uncaught runtime error.
- Stage 3.9 preserves validation, completeness, gaps, contradictions, clarification, scenarios, risks, recommendations, orchestrator, response-mapping, and response-validation traceability without exposing the pipeline to product runtime.
- Stage 3.10 adds `runDecisionEngineRuntimeValidation()` and an internal catalog of ten synthetic deterministic cases covering successful, limited, clarification, safety, scenario, risk, withholding, and controlled-failure behavior.
- Stage 3.10 runtime validation passed `10/10` cases and is documented in `LEVIO_STAGE_3_RUNTIME_VALIDATION.md`; no test framework, CI/CD, dependency, or product-runtime integration was introduced.
- The Stage 3 Final Deterministic Brain Audit creates `LEVIO_STAGE_3_FINAL_DETERMINISTIC_BRAIN_AUDIT.md`, confirms that the Stage 3.1-3.10 package is coherent and internally validated, and records known deterministic limitations without changing code.
- The audit found no direct contract contradiction requiring a code change. AI, memory runtime, auth, database, persistence, subscriptions, UI, API routes, simulator runtime, and current public `SimulationResponse` remain unconnected and unchanged.
- Stage 3.11 creates `LEVIO_STAGE_3_11_INTERNAL_RUNTIME_INTEGRATION_PLANNING.md`, defining the controlled internal adapter boundary, raw-text and structured-context mapping rules, V1/V2 coexistence, feature-flag and rollback requirements, internal error mapping, observability/privacy limits, contract-validation requirements, deeper invariants, and approval gates through Stage 3.16.
- Stage 3.11 confirms that raw public simulator text cannot responsibly become structured deterministic context without a separately approved semantic extraction capability; Stage 3.12 must preserve missing context rather than invent it.
- Stage 3.11 is documentation-only. It does not connect the deterministic brain to the public simulator, `/api/simulate`, UI, dashboard, localStorage, AI, memory runtime, auth, persistence, subscriptions, or external services.
- Stage 3.12 adds a controlled internal runtime adapter in `lib/decision-engine/` with adapter contracts, canonical input construction, internal-mode validation, controlled error mapping, explicit no-coupling operational evidence, and deeper V2 invariant validation.
- Stage 3.12 adds `runInternalRuntimeAdapterValidation()` with twelve passing synthetic cases and revalidates the Stage 3.10 deterministic catalog at `10/10`.
- Stage 3.12 calls only `runSimulationPipeline(...)`. Public simulator behavior, `/api/simulate`, UI, dashboard, localStorage, AI, memory runtime, auth, database, persistence, subscriptions, dependencies, and external services remain unchanged and unconnected.
- Stage 3.13 adds a code-only simulator-shaped sandbox in `lib/decision-engine/` that requires an explicit deny-by-default `simulator_sandbox_v2` feature gate and invokes the deterministic brain only through the Stage 3.12 adapter.
- Stage 3.13 generates internal `SimulationResponseV2Draft` results for enabled valid sandbox requests; disabled and rejected requests execute neither the adapter nor the deterministic brain.
- Stage 3.13 adds `runSimulatorIntegrationSandboxValidation()` with nine passing smoke/isolation cases and revalidates Stage 3.12 at `12/12` and Stage 3.10 at `10/10`.
- Stage 3.13 creates no route, page, endpoint, navigation link, UI mapping, public runtime switch, persistence, auth, memory, subscription, AI, or external-service coupling.
- Stage 3.14 adds a pure internal `SimulationResponseV2Draft` to `SimulationResponseV2UiModel` mapping contract covering lifecycle, decision summary, model quality, clarification, scenarios, risks, consequences, recommendation, safety, notices, and traceability.
- Stage 3.14 defines loading, empty, clarification, ready, limited, cannot-recommend, refused, and controlled-failure presentation states without importing or executing the sandbox, adapter, pipeline, or public runtime.
- Stage 3.14 adds `runSimulationResponseV2UiMappingValidation()` with ten passing mapping-only cases and revalidates Stage 3.13 at `9/9`, Stage 3.12 at `12/12`, and Stage 3.10 at `10/10`.
- Stage 3.14 creates no component, route, rendering change, public runtime switch, V2-to-V1 coercion, persistence, auth, memory, subscription, AI, or external-service coupling.
- Stage 3.15 adds an internal/dev-only controlled switch boundary in `lib/runtime-integration/` with deny-by-default V1 selection, explicit dual-gated V2 execution through the sandbox, and discriminated V1, V2, or controlled-failure results.
- Stage 3.15 preserves `buildMockSimulation(...)` as the unchanged immediate rollback path and makes every runtime fallback explicit through reason and source-status metadata.
- Stage 3.15 adds `runControlledSimulatorSwitchValidation()` with ten passing switch/fallback/isolation cases and revalidates Stage 3.14 at `10/10`, Stage 3.13 at `9/9`, Stage 3.12 at `12/12`, and Stage 3.10 at `10/10`.
- Stage 3.15 creates no public route, public runtime switch, component, rendering change, public API contract change, persistence, auth, memory, subscription, AI, or external-service coupling.
- Stage 3.16 creates `LEVIO_STAGE_3_16_RUNTIME_QA_REGRESSION.md`, completing the runtime-integration QA checklist across static validation, runtime catalogs, public isolation, API, desktop, and mobile regression.
- Stage 3.16 revalidates Stage 3.15 at `10/10`, Stage 3.14 at `10/10`, Stage 3.13 at `9/9`, Stage 3.12 at `12/12`, and Stage 3.10 at `10/10`; TypeScript, ESLint, production build, public V1 API, desktop, and mobile checks pass.
- Stage 3.16 is documentation-only. Public UI, public API, public runtime, V1 behavior, deterministic V2 gating, dependencies, AI, memory runtime, auth runtime, persistence, database, and subscriptions remain unchanged.
- Simulator business logic, API and `SimulationResponse` contracts, auth logic, routing and localStorage keys remain unchanged.
- Desktop auth composition is more balanced and its edge accents are restricted to the black/graphite/gold/amber identity; desktop/mobile QA passed without console errors or horizontal overflow.
- The public homepage retains `public/hero-approved-network-bg.png`, rendered through `next/image` with `quality={100}` and `unoptimized`.
- Mobile navigation is one controlled horizontal row: `Inicio`, `Simulador`, `Mi espacio`, `Iniciar sesión`.
- Mobile navigation now uses readable `44px` premium glass controls, stronger typography/contrast/active/tap states and a distinct login CTA without horizontal overflow.
- Mobile root-scroll reveal ranges start later and run longer across hero feature, decision-system, process and capability blocks.
- Hero title scroll-exit starts earlier and the approved artwork breathing cycle is accelerated to `21s`.
- Desktop reveal timing for hero feature, decision-system, process and `01/02/03/04` blocks is aligned against the capability-card reference; accepted Stage 2.9C mobile timing remains unchanged.
- Simulator workspace has deeper black-gold composition and a premium input surface without changes to `HomeSimulator` business logic.
- The simulator workspace heading reveals by word around desktop viewport center; the final CTA arrives softly from the right and reveals its copy by letter on desktop only.
- `app/layout.tsx` defines consistent `Levio.es` title, application name, Spanish description, Apple Web App, Open Graph, Twitter, viewport and theme color metadata.
- The only declared favicon uses cache-busted `public/levio-favicon-v3.ico`; the Apple touch icon uses `public/levio-apple-touch-icon-v3.png`.
- The manifest is served through `public/levio-manifest-v3.webmanifest` and uses consistent `public/levio-icon-192-v3.png` and `public/levio-icon-512-v3.png`.
- Conflicting file-based `app/icon.png`, old `public/apple-icon.png`, `public/icon-192.png` and `public/manifest.webmanifest` are removed.
- No `xaz`, `xaz’` or `XAZ` source exists in the repository or Git history; that name belongs to Safari Favorites/History cache and may remain cached after source correction.
- Approved hero artwork breathing is slowed from `21s` to `22.75s`, while hero title scroll-exit is accelerated from `0-7%` to `0-6%`.
- Hero feature cards, decision heading, process heading/cards and capability cards have separately calibrated desktop and mobile ranges that complete around the viewport center.
- Timing for the `01/02/03/04` system cards remains unchanged; reduced-motion fallback remains active.
- Obsolete production visual assets and unused `components/SingularityVisual.tsx` are removed.

Current direction remains unchanged: Levio.es is a Decision Simulation Engine, not an AI chat, answer engine, AI playground, sci-fi showcase, WebGL experiment or visual-effects demo.

Stage 4.3 User Data Controls now includes authenticated API route foundation at
the foundation/runtime-boundary/QA level. UI, dashboard product workflows,
database runtime, Supabase read-provider route enablement, migrations, real
export generation, real deletion execution, simulator runtime, AI/OpenAI,
memory, subscriptions, billing, Stage 4.4, and Stage 5.x remain unstarted.

### Stage 2.10 Candidate - Secondary Product Surface Unification

- Start with shared auth shell and shared dashboard shell/navigation so a controlled primitive-level pass improves the widest route surface.
- Align auth mark, form hierarchy, input/label contrast and spacing with the homepage premium system.
- Align dashboard brand mark, active navigation, cards, controls, spacing/radius/borders and remove incompatible white/cyan/rainbow identity traces.
- Preserve auth/dashboard/mock logic, routing, simulator contracts, localStorage keys, API and production persistence boundaries.
- Keep `/visual-lab` isolated as a sandbox, not a production style target.

## 0. Historical Authoritative Strategy - 30 May 2026

This section supersedes older Stage 2.7.x visual-research notes below wherever they conflict with the current product direction.

- Historical active stage at that checkpoint: Stage 2.8 - documentation/current-state synchronization and MVP preparation after the strategic visual pivot.
- Current product direction: Premium Black-Gold AI Decision Intelligence System.
- Levio.es is not a chatbot, SaaS dashboard, visual-effects showcase, WebGL experiment or gaming interface.
- Levio.es helps users describe a situation, compare possible actions, evaluate risks, model consequences and understand likely strategic outcomes.
- Current production visual target: deep black / near-black foundation, bright premium gold accents, strong typography, clean layout, lightweight singularity symbol, minimal visual noise and fast Safari/iPhone performance.
- Stage 2.7.x is now historical research: cinematic, WebGL, shader and `/visual-lab` experiments informed the pivot, but they are no longer the primary production goal.
- Heavy production WebGL is rejected for the current MVP path. WebGL/canvas/Three.js/R3F must not be integrated into production without a new explicit approval.
- The accepted direction is disciplined black-gold product UI, not cinematic spectacle.
- Current production checkpoint: `78913da` - `Refocus Levio homepage toward premium black-gold product UI`.
- `HomeSimulator`, simulator/API contracts, auth/dashboard logic and Spanish visible UI remain protected unless a later approved stage explicitly touches them.
- Historical next safe work at that checkpoint: Stage 2.8 alignment, production QA, legacy visual CSS cleanup planning and MVP decision-flow polish. Do not start new visual experiments as a substitute for MVP work.

## 0.6 Superseded Transition State - 24 May 2026

Historical note: this was the handoff source of truth before the Stage 2.8 synchronization and the 30 May 2026 product pivot. Treat it as superseded by `Historical Authoritative Strategy - 30 May 2026` for the visual-direction decision and by the current confirmed checkpoint for stage status.

- Historical active stage at that time: Stage 2.7.3b - isolated lightweight shader cinematic-depth correction and validation.
- Historical status at that time: Stage 2.7.3b was not complete. Real iPhone Safari after `fa5dfd9` confirmed technical safety, but did not confirm enough perceived cinematic-depth improvement.
- Historical status at that time: Stage 2.7.4 was blocked until Stage 2.7.3b closed.
- Stage 2.7.5 is provisional only: existing mobile-safety work is useful but not a final validation stage and not a production-integration basis.
- Stage 2.7.6 and any Stage 2.7.7 escalation remain blocked/provisional until Stage 2.7.3b has a real visual-quality path forward.
- Current WebGL sandbox is isolated in `/visual-lab` and must stay isolated.
- Current sandbox is not yet premium cinematic quality. The `fa5dfd9` retest confirms more strongly that the current single-pass lightweight shader has a visual ceiling.
- Current engineering direction: preserve production `DecisionSingularity`, keep WebGL lab-only, and do not integrate production hero.
- Historical conclusion at that time: the lightweight shader path had a visual ceiling. The current Stage 2.8 direction is the Premium Black-Gold MVP path, not advanced rendering research.
- Strict stage discipline: no skipped stages, no retroactive completion, no production code changes during documentation-only work.
- Quota protection: before opening a new context, avoid rendering experiments, long browser QA loops, new builds, or broad analysis unless explicitly requested.
- Production protection: do not modify `components/DecisionSingularity.tsx`, `components/DecisionSingularity.module.css`, `components/HomeSimulator.tsx`, simulator logic, `SimulationResponse`, or `app/globals.css` without explicit approval.
- Stash protection: do not apply `stash@{0}` without explicit permission.

## 0.1 Stage 2.7.3b Direction Checkpoint - 26 May 2026

This checkpoint supersedes the previous hybrid static image direction for the active `/visual-lab` implementation.

- Active/checkpointed stage: Stage 2.7.3b - isolated CSS-only black-gold sphere/prognosis sandbox direction.
- The hybrid static image + lightweight overlays direction has been visually rejected and must not be continued as the current direction.
- `public/visual-lab/singularity-hybrid-reference.png` remains a tracked asset, but it is no longer the dominant base layer for `/visual-lab`.
- Current accepted sandbox direction: CSS-only black-gold living sphere with forecast/risk/value labels, soft orbit drift, breathing glow and calm premium cinematic motion.
- Current `/visual-lab` implementation uses no WebGL, no canvas, no Three.js, no React Three Fiber and no new dependencies.
- Production remains untouched: no production hero integration and no changes to `DecisionSingularity`, `HomeSimulator`, simulator logic, `app/page.tsx`, `app/layout.tsx` or `app/globals.css`.
- `/visual-lab` remains an isolated sandbox route and is not linked into production navigation.
- Stage 2.7.4 remains blocked and must not start from this checkpoint.

## 0.2 Historical transition checkpoint - 27 May 2026

Historical note: this block was the final handoff checkpoint before the repository/deployment migration and production homepage pivot. It is retained for history and superseded by the 30 May 2026 current strategy.

- Authoritative project path: `/Users/s3/Documents/New project`.
- Current Stage 2.7.3b checkpoint commit: `31d8902` - `Checkpoint Stage 2.7.3b sphere sandbox direction`.
- Current stage status: Stage 2.7.3b is checkpointed around the accepted isolated `/visual-lab` direction; Stage 2.7.4 has not started from this checkpoint and remains blocked.
- Accepted `/visual-lab` direction: CSS-only black-gold living sphere/prognosis sandbox with small forecast/risk/value labels, slow orbit/drift, soft breathing glow and premium calm motion.
- Blocked/provisional stages: Stage 2.7.4 blocked; Stage 2.7.5 provisional only; Stage 2.7.6 provisional only; Stage 2.7.7 blocked.
- Production protection rules remain active: do not change `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/DecisionSingularity.tsx`, `components/HomeSimulator.tsx`, simulator logic, dependencies, lockfiles, git remotes or deployment configuration without separate approval.
- `New project` is the current working source for this Codex thread and the accepted sandbox checkpoint.
- Older production/GitHub/Vercel source is presumed to be `/Users/s3/levio-app`; it requires a separate migration audit before any update to `levio.es`.
- `levio.es` currently shows the older production site state and must not be updated from this checkpoint without an approved migration/deployment plan.
- Historical next technical stage at that time: Stage 2.8 - repository/deployment migration preparation.

## 0.3 Historical next context recovery

Historical recovery instructions from the 27 May handoff:

- Read `PROJECT_CONTEXT.md`, `CURRENT_STAGE.md` and `LEVIO_CURRENT_STATE.md`.
- Run `git status --short`, `git branch --show-current` and `git log --oneline -10` from `/Users/s3/Documents/New project`.
- Confirm that Stage 2.7.3b is checkpointed, `/visual-lab` remains isolated, production files are untouched and Stage 2.7.4 remains blocked.
- Do not immediately start Stage 2.7.4, migration, deploy, push, remote changes, dependency changes, file copying between repositories or production integration.
- Next safe step: begin Stage 2.8 with a read-only repository/deployment migration preparation audit.

## 0.4 Historical Stage 2.8 first task

Historical first task for the original Stage 2.8 migration-preparation pass:

- Audit `/Users/s3/Documents/New project`.
- Audit `/Users/s3/levio-app`.
- Identify the GitHub remote(s) and branch relationships.
- Identify which local folder is connected to the current production/Vercel source.
- Prepare a backup and migration plan before any file transfer, remote change, push or deploy.
- Do not copy, delete, move, deploy, push or migrate anything without separate explicit approval.

## 0.5 Strategic visual pivot - 28 May 2026

This checkpoint records a controlled production homepage pivot away from heavy cinematic effects.

- New strategic direction: Premium Black-Gold Minimal AI Decision Intelligence UI.
- Levio.es should feel expensive, fast, calm, reliable, technological and serious, not like a visual-effects showcase.
- Heavy cinematic/WebGL/shader direction is not the production target; WebGL remains forbidden in production.
- Stage 2.7.3b is not closed by this pivot and the previous cinematic target must not be claimed as achieved.
- Production homepage now favors a lightweight black-gold product interface and a minimal SVG/CSS singularity mark.
- Removed from the production hero path: particle DOM layers, heavy sandbox sphere layers, large blur/glow stack and multi-layer orbit animation.
- Preserved: Spanish visible UI, `HomeSimulator`, simulator/API contracts, auth/dashboard logic, no new dependencies.
- `/visual-lab` remains available as a sandbox route, but its current visual is also refocused toward a lighter mark for consistency.
- Remaining caveat: `app/globals.css` still contains historical visual CSS sections; production homepage has scoped override rules, but a later CSS cleanup stage may remove legacy unused blocks after visual QA.

## 1. Project Summary

Levio.es is a Spanish-first AI Decision Intelligence System. It helps users describe complex situations, compare possible actions, understand scenarios, risks, advantages, delayed consequences, and a strategic recommendation before making a decision.

The current version follows the Premium Black-Gold product direction and retains a mock architecture: backend, production authentication, database, and real AI integration are not connected. Authentication and saved simulations use demo/localStorage flows.

Project documentation is written in English. Codex owner-facing reports are written in Russian. Product UI follows `LEVIO_MULTILINGUAL_ARCHITECTURE.md`, with Spanish as the current primary public UI language unless product strategy changes.

## 2. Current Development Stage

Stage 4.1A Auth Provider Decision - COMPLETED CHECKPOINT.

Stage 2.7.x is closed as a research and direction-discovery track. It must not be treated as the active production target, and the older cinematic/WebGL target must not be revived without a new approved stage.

Historical Stage 2.8 roadmap to MVP:

- synchronize context/state/identity documentation around the Premium Black-Gold AI Decision Intelligence System direction;
- verify the production homepage after the black-gold pivot and Vercel/GitHub synchronization;
- plan a controlled cleanup of legacy heavy visual CSS only after visual QA;
- preserve `HomeSimulator` while polishing the decision-intelligence flow and Spanish product copy;
- keep backend/auth/API/real AI integration as later approved stages, not implicit work during documentation sync.

Stage 1 stable baseline was completed earlier:

- `9e9bb08` - Safe CSS stabilization for Levio visual baseline.
- `652cd71` - Organize globals CSS into safe structural sections.
- `0e1e534` - Stage 1 QA regression fixes.
- `0777b7e` - Finalize Stage 1 stable baseline.

Stage 2 progress:

- Stage 2.1 completed: `8eeb150` - motion.css extraction.
- Stage 2.2 completed: `959ffe5` - dashboard.css extraction.
- Stage 2.3 completed: `7ea3e61` - auth.css extraction.
- Stage 2.4 completed: `c9a86da` - simulator.css extraction.
- Stage 2.5 completed: visual regression QA checkpoint.
- Stage 2.6 completed: `c81a9c8` - checkpoint documentation closure.
- Stage 2.7-prep completed: `0cec475` - visual engine baseline preparation.
- Stage 2.7.1 completed: `3d8ef6e` - Levio identity core and WebGL architecture research plan.
- Stage 2.7.2 completed: `0781b46` - isolated WebGL sandbox prototype.
- Stage 2.7.3 completed: `5553455` - isolated WebGL visual quality iteration.
- Stage 2.7.3 corrective closure status: isolated shader cinematic pass applied; local `/visual-lab` route QA passed; strict closure remains pending post-pass real iPhone Safari retest.
- Stage 2.7.3 corrective pass 2 status: real iPhone Safari retest after the first corrective pass stayed technically stable but did not improve perceived cinematic depth; second isolated shader depth pass applied; strict closure remains pending another real iPhone Safari visual-quality retest.
- `fa5dfd9` - Stage 2.7.3b controlled depth-contrast iteration committed; real iPhone Safari retest passed technical safety but visual improvement was almost not noticeable. This is now historical evidence for the later pivot, not an active-stage marker.
- Stage 2.7.3b direction checkpoint: hybrid static image direction rejected; `/visual-lab` now holds an isolated CSS-only black-gold living sphere/prognosis sandbox with forecast/risk/value labels and no WebGL/canvas/Three.js/R3F.
- Stage 2.7.4 completed: isolated WebGL performance profiling and stress testing; no file changes, no commit needed.
- Stage 2.7.5 completed: `89e534c` - isolated WebGL mobile safety optimization; this is not full Safari/iPhone validation.
- Stage 2.7.6 completed: formal integration decision - keep production `DecisionSingularity`, keep WebGL isolated in `/visual-lab`, no production replacement approved.
- Stage 2.8G Hero artwork fidelity completed: `848a108`.
- Stage 2.8H homepage minimal premium reduction completed: `9c7447d`.
- Stage 2.8 homepage motion and brand polish checkpoint completed: `6adefd6`.
- Stage 2.9A mobile navigation, scroll timing and simulator premium polish completed.
- Stage 2.9B Safari metadata and favicon identity fix completed.
- Stage 2.9C homepage scroll motion fine-tuning completed.
- Stage 2.9D desktop motion alignment and CTA polish completed.
- Stage 2.9E mobile navigation visibility polish and secondary-pages audit completed.
- Stage 2.9F tablet card alignment, final CTA typography polish and simulator form refinement completed.
- Stage 2.10A auth pages premium black-gold unification completed; auth logic and routes preserved.
- Stage 2.14 Decision Engine Specification completed through three provider-independent contract documents; Stage 3, OpenAI, auth, persistence, payments, product code, UI, simulator, dashboard, API, and current `SimulationResponse` remain unchanged.
- Stage 2.15 User Data Architecture completed through `LEVIO_USER_DATA_ARCHITECTURE.md`; Stage 2.16 Production Auth is prepared at architecture level only, while auth, database, persistence, subscriptions, OpenAI, product code, UI, simulator, dashboard, API, and current `SimulationResponse` remain unchanged.
- Stage 2.16 Production Auth Architecture completed through `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`; production auth, providers, database, persistence, subscriptions, OpenAI, product code, UI, simulator, dashboard, API, and current `SimulationResponse` remain unchanged.
- Stage 2.17 AI Abstraction / Observability / Cost Budgets completed through `LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md`; no AI provider, real model, streaming, AI route, dependency, environment variable, product code, UI, simulator, dashboard, API, or current `SimulationResponse` was changed.
- Stage 2.18 Evaluation Dataset / Quality Thresholds completed through `LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md` and its initial 24-case synthetic catalog; no AI provider/model, eval/test runner, automated test, executable fixture, dependency, product code, UI, simulator, dashboard, API, or current `SimulationResponse` was changed.
- Stage 2.19 Product / Security / Quality Test Architecture completed through `LEVIO_TESTING_STRATEGY.md`; no tests, test/eval runner, CI/CD, GitHub Actions, dependency, product code, UI, simulator, dashboard, API, AI provider, or current `SimulationResponse` was changed.
- Stage 2.19A Documentation Language Consistency Audit completed through `LEVIO_DOCUMENTATION_LANGUAGE_AUDIT.md`; key and root project-level documentation is English-first, owner-facing Codex reports remain Russian, product UI remains governed by the multilingual architecture, and no product code changed.
- Stage 2.20 Production Trust / Legal Layer completed through `LEVIO_TRUST_LEGAL_LAYER.md`; trust requirements and future legal dependencies are defined architecturally, while public legal documents, legal approval, product code, UI, simulator, dashboard, API, AI integration, tests, and CI/CD remain unchanged.
- Stage 2 Final Architecture Closure Audit completed through `LEVIO_STAGE_2_FINAL_ARCHITECTURE_CLOSURE_AUDIT.md`; Stage 2 architecture is closed, Stage 3 has not started, and product code remains unchanged.
- Stage 3.1 Deterministic Decision Engine Contract Foundation completed through isolated TypeScript contracts and lightweight shape validators in `lib/decision-engine/`; AI, auth, persistence, UI, API behavior, current `SimulationResponse`, and simulator runtime remain unchanged.
- Stage 3.2 Deterministic Completeness & Critical Gap Engine completed through pure functions in `lib/decision-engine/`; no AI, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.3 Deterministic Clarification & Question Selection Engine completed through pure functions in `lib/decision-engine/`; no AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.4 Deterministic Scenario Engine completed through pure structured scenario functions in `lib/decision-engine/`; no AI, narrative generation, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.5 Deterministic Risk Engine completed through pure structured scenario-risk functions in `lib/decision-engine/`; no AI, narrative generation, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.6 Deterministic Recommendation Engine completed through pure structured recommendation functions in `lib/decision-engine/`; no AI, advice prose, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.7 Decision Engine Orchestrator completed through pure deterministic pipeline coordination and controlled stop behavior in `lib/decision-engine/`; no AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.8 SimulationResponse V2 Runtime Integration completed through an isolated deterministic V2 draft mapper and lightweight validator in `lib/decision-engine/`; no AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current public `SimulationResponse`, or simulator runtime changed.
- Stage 3.9 End-to-End Deterministic Simulation Pipeline completed through a single validated internal runtime entrypoint in `lib/decision-engine/`; no AI, external service, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current public `SimulationResponse`, or simulator runtime changed.
- Stage 3.10 Runtime Validation & Internal Testing completed through `runDecisionEngineRuntimeValidation()` and `LEVIO_STAGE_3_RUNTIME_VALIDATION.md`; all ten synthetic deterministic cases passed, and no test framework, AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current public `SimulationResponse`, or simulator runtime changed.
- Stage 3 Final Deterministic Brain Audit completed through `LEVIO_STAGE_3_FINAL_DETERMINISTIC_BRAIN_AUDIT.md`; the isolated Stage 3.1-3.10 package is coherent and no direct contract contradiction required a code change.
- Stage 3.11 Internal Runtime Integration Planning completed through `LEVIO_STAGE_3_11_INTERNAL_RUNTIME_INTEGRATION_PLANNING.md`; Stage 3.12 Controlled Internal Runtime Adapter is the approved next block.
- Stage 3.12 Controlled Internal Runtime Adapter completed through isolated adapter contracts, invocation, validation, deeper invariants, and `LEVIO_STAGE_3_12_CONTROLLED_INTERNAL_RUNTIME_ADAPTER.md`.
- Stage 3.13 Simulator Integration Sandbox completed through code-only feature-gated sandbox wiring, adapter execution, V2 generation, smoke/isolation validation, and `LEVIO_STAGE_3_13_SIMULATOR_INTEGRATION_SANDBOX.md`.
- Stage 3.14 SimulationResponse V2 UI Mapping completed through isolated mapping contracts, lifecycle and section definitions, strict V1/V2 separation, mapping-only validation, and `LEVIO_STAGE_3_14_SIMULATION_RESPONSE_V2_UI_MAPPING.md`.
- Stage 3.15 Controlled Simulator Runtime Switch completed through an internal/dev-only deny-by-default switch, explicit V1 rollback and fallback evidence, sandbox-to-V2-to-UI-mapping execution, switch validation, and `LEVIO_STAGE_3_15_CONTROLLED_SIMULATOR_RUNTIME_SWITCH.md`.
- Stage 3.16 Runtime QA / Regression completed through `LEVIO_STAGE_3_16_RUNTIME_QA_REGRESSION.md`; all required runtime catalogs, static checks, production build, public isolation, API, desktop, and mobile regression checks passed.
- Stage 4.1 Auth Runtime Scope Lock completed through `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`; provider-neutral auth runtime boundary, identity states, session model, guest/authenticated separation, protected route strategy, and rollback/safety plan are fixed without changing runtime code, dependencies, public simulator behavior, persistence, subscriptions, AI, memory, or deterministic brain behavior.
- Stage 4.1A Auth Provider Decision completed through `LEVIO_AUTH_PROVIDER_DECISION.md`; Supabase Auth is approved for next-stage implementation planning under strict provider-boundary and principal-mapping conditions, while Auth.js / NextAuth and Clerk are rejected as initial providers.

Stage 2.1-2.7.4 result:

- motion keyframes moved to `app/styles/motion.css`;
- dashboard base styles moved to `app/styles/dashboard.css`;
- auth base styles moved to `app/styles/auth.css`;
- simulator base styles moved to `app/styles/simulator.css`;
- `app/globals.css` remains the canonical final dark-gold cascade layer;
- selector-bearing extracted CSS (`dashboard.css`, `auth.css`, `simulator.css`) is intentionally imported before `globals.css`;
- `motion.css` is keyframes-only and remains separate from selector cascade concerns;
- production visual baseline remains protected;
- stable frontend baseline backup branch created: `stable/stage-2-frontend-baseline`;
- `LEVIO_IDENTITY_CORE.md` added as the product/visual identity source of truth;
- `VISUAL_ENGINE_PLAN.md` added as the Stage 2.7.1 WebGL architecture research document;
- `/visual-lab` added as an isolated WebGL sandbox route;
- isolated WebGL mobile safety work stayed inside `components/DecisionSingularityWebGL.tsx` and `components/DecisionSingularityWebGL.module.css`;
- WebGL remains experimental-only and is not integrated into production.

## 3. Current Stable Status

Stable status after Stage 2.7.4:

- cinematic dark-gold baseline preserved;
- desktop QA stable;
- mobile `390px` QA stable;
- dashboard mobile navigation stable;
- auth routes stable;
- mock auth flow stable;
- home simulator interaction stable;
- no visual regressions detected in completed Stage 2.5 QA;
- Stage 2.6 context files synchronized;
- Stage 2.7-prep protective baseline completed;
- Stage 2.7.1 research-only documentation completed;
- Stage 2.7.2 isolated `/visual-lab` sandbox created;
- Stage 2.7.3 isolated WebGL visual quality iteration completed;
- Stage 2.7.3 corrective cinematic rendering pass improved glow, simulated bloom, layered fog, animated depth, volumetric feeling and living core motion inside the isolated sandbox;
- Stage 2.7.3 corrective pass 2 further strengthened central gravity/depth, layered atmospheric fog, amber/gold bloom, volumetric halo and internal energy illusion inside the isolated sandbox;
- `fa5dfd9` depth-contrast iteration passed real iPhone Safari technical safety, but did not produce enough perceived cinematic depth or emotional gravity improvement;
- Stage 2.7.4 isolated WebGL performance profiling completed with no file changes;
- Stage 2.7.5 isolated mobile safety optimization completed in `89e534c`;
- Stage 2.7.6 formal integration decision completed;
- mobile performance baseline stable at `390x844`;
- build-trace caveat did not reproduce during Stage 2.7-prep: `npm run build` completed successfully;
- Stage 2.7.1 checks passed: `npm run lint`, `npm run build`, `./node_modules/.bin/tsc --noEmit`;
- Stage 2.7.4 checks passed: `npm run lint`, `npm run build`, `./node_modules/.bin/tsc --noEmit`;
- no npm install was performed;
- no Three.js, React Three Fiber or WebGL dependency was installed;
- no hero redesign or production UI redesign was created;
- production code was not changed during Stage 2.7.1-2.7.6;
- Stage 2.7.5 changed only isolated experimental WebGL files:
  - `components/DecisionSingularityWebGL.tsx`;
  - `components/DecisionSingularityWebGL.module.css`;
- `stash@{0}: pre-stage-1.5-existing-changes` remains untouched and must not be applied without explicit permission.

Stage 2.7.4 performance notes:

- `/visual-lab` works as an isolated sandbox route;
- no file changes were made during profiling, so no Stage 2.7.4 implementation commit is needed;
- console errors were absent;
- horizontal overflow was absent;
- desktop FPS in Codex in-app browser was approximately `20-21`;
- mobile `390x844` FPS was approximately `26`;
- resize stress at `820x760` produced a low sample around `6 FPS`;
- DPR cap works with max `1.5`;
- First Load JS for `/visual-lab`: `90.9 kB`;
- post Stage 2.7.5 build output observed First Load JS for `/visual-lab`: `91.2 kB`;
- post Safari-safe motion fix build output observed First Load JS for `/visual-lab`: `91.4 kB`;
- post Stage 2.7.3 corrective cinematic pass build output observed First Load JS for `/visual-lab`: `91.7 kB`;
- cleanup/remount was checked through route transition;
- hidden-tab pause could not be fully verified because of in-app browser limitations;
- initial iPhone Safari real-device testing started: route opened, WebGL rendered, FPS was stable around `60`, layout/orientation/no-overflow/heat checks passed, but visible WebGL animation failed before the Safari-safe motion fix;
- iPhone Safari retest after Safari-safe motion fix passed: motion overlay exists, `Time` counter updates, visible animation is present, FPS remains around `60`, no heat observed and page stayed stable after `1-2` minutes;
- conclusion: WebGL sandbox remains experimental-only; do not integrate into production hero before further optimization and real-device Safari validation.

Stage 2.7.5 correction:

- current completed Stage 2.7.5 must be treated as mobile safety optimization, not full Safari validation;
- implemented safety measures include mobile-safe DPR cap `1.15`, mobile-safe quality state, lower-power WebGL context preference, reduced-motion handling, hidden-tab pause path and softer mobile shader intensity;
- initial iPhone/Safari validation found a blocker: FPS updated around `60`, but the singularity looked visually static before the Safari-safe motion fix;
- thermal behavior has not been measured on real devices;
- full adaptive quality tiers and reduced mobile mode remain future work if validation requires them.

Stage 2.7.5b Safari/iPhone validation checklist:

- status: prepared checklist only; Stage 2.7.5 is not complete until real Safari/iPhone validation is actually performed and documented;
- test scope: isolated `/visual-lab` WebGL sandbox only, no production hero integration;
- test URL: record exact URL used for real-device testing, for example `http://<local-network-ip>:3000/visual-lab` or deployed preview `/visual-lab`;
- device model: record exact iPhone model and chip generation if known;
- iOS version: record exact iOS version from Settings;
- Safari version: record Safari/WebKit version if available, otherwise record iOS version as proxy;
- viewport/orientation: test portrait and landscape, including Safari address bar collapsed/expanded states where possible;
- FPS observation: record visible debug-panel FPS after initial settle, after 60 seconds, after scroll, and after orientation changes;
- scroll/layout stability: verify no horizontal overflow, no clipped debug panel, no text overlap, stable canvas sizing and readable lab copy;
- resize/orientation behavior: rotate portrait to landscape and back at least 3 times, observe canvas resize, DPR cap, FPS recovery and visual continuity;
- memory/thermal behavior: run at least 5-10 minutes, watch for reloads, WebGL context loss, tab termination, jank increase or visible throttling;
- battery/heat notes: record starting/ending battery percentage if practical and subjective device heat level: cool, warm, hot;
- console errors: if connected to Mac Safari Web Inspector, record console errors, WebGL warnings, context loss/restore events and network errors;
- visual quality notes: evaluate whether the singularity remains cinematic, calm, premium, non-gaming and visually coherent in mobile-safe mode;
- pass criteria: no crash, no blank canvas unless graceful fallback appears, no console errors indicating runtime failure, no horizontal overflow, stable orientation recovery, readable UI, acceptable heat, and sustained FPS without severe degradation;
- fail criteria: repeated context loss, tab reload/termination, persistent blank canvas without fallback, severe FPS collapse after initial settle, layout overflow, unreadable UI, excessive heat, or Safari-specific runtime errors;
- decision gate for Stage 2.7.5c: proceed to adaptive quality / reduced mobile mode only if real-device results show FPS, heat, memory, orientation or Safari-specific instability that cannot be accepted for an experimental sandbox.

Stage 2.7.5b initial iPhone Safari result and blocker fix:

- real iPhone Safari opened `/visual-lab` correctly after confirming the server was running from the correct project root;
- WebGL rendered and the FPS overlay reported around `60 FPS`;
- layout stability passed;
- orientation change stability passed;
- horizontal overflow was absent;
- heat was not observed during the initial check;
- blocker: the visual WebGL singularity appeared static even though FPS was updating;
- likely technical cause: shader motion used absolute `requestAnimationFrame` time with mobile fragment precision risk, making subtle time-based changes visually collapse on iPhone Safari;
- fix applied only to the isolated sandbox: `components/DecisionSingularityWebGL.tsx` now uses bounded local shader time, fragment `highp` precision when available, Safari-safe motion diagnostics, and slightly clearer but still subtle cinematic breathing/depth/glow motion;
- production files were not changed and WebGL remains isolated in `/visual-lab`;
- retest result: `/visual-lab` opened on iPhone Safari, the motion overlay exists, the `Time` counter updates, visual animation is now visible as breathing zoom plus slight horizontal drift, FPS stayed around `60`, no heat was observed and the page remained stable after `1-2` minutes;
- previous animation blocker is resolved in the isolated sandbox;
- Stage 2.7.5b can be marked completed;
- Stage 2.7.5 overall is not fully complete until the adaptive quality / reduced mobile mode decision is made if required.

Stage 2.7.5c adaptive quality / reduced mobile mode decision:

- decision: no additional adaptive quality or reduced mobile mode implementation is required now;
- decision gate used: add stricter reduced mode only if real iPhone Safari data shows sustained FPS degradation, heat, memory pressure, context loss, orientation/layout instability, horizontal overflow or unreadable/failed motion;
- current iPhone Safari result after the Safari-safe motion fix does not trigger that gate: FPS stayed around `60`, motion is visible, no heat was observed, layout/orientation stayed stable and the page remained stable after `1-2` minutes;
- current sandbox already includes conservative mobile safeguards: small/mobile viewport detection, mobile-safe DPR cap `1.15`, lower-power WebGL context preference, reduced-motion path, hidden-tab pause path, softened mobile shader intensity and debug overlay with quality mode, DPR/pixel ratio, motion state and animation time;
- reduced mobile mode active: no, beyond the existing mobile-safe quality mode;
- no new WebGL code changes are needed for Stage 2.7.5c;
- Stage 2.7.5 can be considered complete for the current isolated sandbox validation scope;
- longer thermal profiling remains recommended before any production integration or formal Stage 2.7.6b integration decision, but it is not a blocker for the current Stage 2.7.5c decision.

Stage 2.7.6 formal integration decision:

- decision: keep the current production `DecisionSingularity`;
- do not replace the production hero;
- keep WebGL in `/visual-lab` only;
- no automatic production replacement is approved;
- future direction may be hybrid or partial integration later, but only after a separate approved stage;
- reason: isolated iPhone Safari sandbox validation passed, visible animation works, FPS stayed around `60`, no heat was observed in the short test and layout/orientation stayed stable;
- production integration is still blocked by stronger cinematic quality review, longer thermal profiling, production rollback plan and full visual regression QA;
- production files remain untouched.

Stage 2.7.3 corrective cinematic rendering audit:

- original Stage 2.7.3 goals: glow, bloom, layered fog, animated depth, volumetric feeling, living core effect and no gaming UI;
- achieved before corrective pass: dark-gold singularity direction, visible rings, event-horizon core, mobile-safe motion and non-gaming restraint;
- partially achieved before corrective pass: simulated bloom, atmospheric layering, volumetric depth and emotional gravity were present but still read closer to a technical prototype than a completed cinematic pass;
- missing before corrective pass: stronger layered fog, broader soft bloom, more depth perception, subtler volumetric veils and a more emotionally immersive gravity field;
- corrective pass applied only to `components/DecisionSingularityWebGL.tsx`: added soft fog veils, depth lensing, simulated horizon bloom, outer depth arc and calmer cinematic layering while preserving mobile-safe motion and avoiding particles/noise/gaming UI;
- achieved after corrective pass: glow, simulated bloom, layered fog, animated depth, initial volumetric feeling, living core effect and no gaming UI are satisfied for the isolated sandbox target;
- current feel after corrective pass: more cinematic, premium, singularity-like, alive and emotionally immersive than the previous technical prototype; still not production-ready and still lab-only;
- local QA: `npm run dev -- -p 3001` served `/visual-lab` from the correct repo and `curl` returned `200`;
- iPhone Safari safety note: previous iPhone Safari validation passed before this corrective visual pass, but real iPhone Safari has not yet been re-tested after the new fog/bloom/depth shader changes;
- strict Stage 2.7.3 closure: visually corrected, but final strict completion remains blocked until post-pass real iPhone Safari retest confirms FPS, heat, layout/orientation and visible motion remain safe.

Stage 2.7.3 corrective pass 2:

- real iPhone Safari retest after the first corrective pass: `/visual-lab` opened, animation was visible, breathing zoom plus slight horizontal drift worked, FPS stayed around `60`, no heat after `2-3` minutes, orientation was stable, vertical scroll existed, horizontal overflow was absent and there were no white screens, `404`, freezes or crashes;
- blocker remained: visual quality still did not feel deeper or more cinematic and still read as simple movement rather than a premium cinematic singularity;
- conclusion: Stage 2.7.3 remains blocked despite good technical stability;
- second isolated shader pass applied only to `components/DecisionSingularityWebGL.tsx`;
- pass 2 visual focus: stronger central gravity/depth, more visible layered atmospheric fog, richer amber/gold bloom, subtle volumetric halo, higher cinematic contrast and better internal energy illusion;
- mobile constraints preserved: no Three.js, no R3F, no npm install, existing DPR/mobile-safe behavior preserved, no particles overload, no gaming HUD, no chaotic neon and no aggressive motion;
- Stage 2.7.3 must not be marked completed until another real iPhone Safari retest confirms that the perceived cinematic depth is actually improved while FPS/heat/layout/orientation remain safe.

Stage 2.7.3b fa5dfd9 iPhone Safari retest:

- commit tested: `fa5dfd9` - controlled WebGL sandbox depth-contrast iteration;
- scope: isolated `/visual-lab` only, no production integration;
- technical result: pass;
- real iPhone Safari opened `/visual-lab`;
- WebGL stayed active;
- fallback did not appear;
- blank canvas did not occur;
- FPS stayed around `60`;
- DPR reported `1.15 / cap 1.15`;
- canvas reported `409x476`;
- motion stayed running;
- portrait and landscape orientation changes stayed stable;
- visible lag was not observed;
- visual result: warning/blocker;
- perceived cinematic depth improvement was almost not noticeable;
- center did not feel significantly deeper or heavier;
- visual appearance was almost the same as before `fa5dfd9`;
- conclusion: `fa5dfd9` is technically safe but visually insufficient;
- historical conclusion at that time: Stage 2.7.3b remained active and required explicit closure;
- current single-pass lightweight shader ceiling is now confirmed more strongly;
- current conclusion after the later pivot: do not continue micro-tweaks in the same shader path for MVP; advanced rendering would require a separate approved future stage.

Stage 2.7.3b research-gate boundary:

- current single-pass lightweight shader path is technically safe but visually insufficient;
- additional micro-tweaks are no longer approved as the default continuation path;
- next decision must be explicit before any next stage:
  - abandon the current shader path;
  - continue only as controlled research;
  - or approve a new isolated research branch;
- minimum information required before any future rendering experiment:
  - explicit approval;
  - one research direction only;
  - sandbox-only scope;
  - visual success criteria defined before implementation;
  - mobile Safari safety budget;
  - rollback checkpoint;
  - stop condition if visual gain is not validated;
  - dependency policy;
  - confirmation of no production imports, routes or navigation exposure;
- Stage 2.7.4 cannot start yet because Stage 2.7.3b has not closed and the visual-quality gate failed;
- Stage 2.7.3b should move toward documentation closure, not implementation.

Stage 2.7.3b reference-target visual gap:

- the uploaded reference screenshot is the current visual benchmark for the intended premium cinematic singularity direction;
- the current `/visual-lab` lightweight WebGL sandbox is technically safe, but does not match the benchmark;
- the gap is not only parameter tuning; it is a visual architecture gap;
- required target qualities:
  - dense orbital field;
  - black gravity core;
  - amber-gold accretion ring;
  - high optical density;
  - layered cinematic depth;
  - fine trajectory detail;
  - premium dark atmosphere;
- candidate future research directions:
  - hybrid static + animated architecture;
  - asset-backed visual layers;
  - multi-layer compositing;
  - controlled orbit/particle system;
  - multi-pass/post-processing research;
- no implementation is approved;
- production `DecisionSingularity` remains protected;
- `/visual-lab` remains isolated;
- Stage 2.7.4 remains blocked;
- future rendering work requires explicit approval.

Stage 2.7.3b preferred next research path:

- hybrid static + lightweight animated architecture is now the preferred next research path over additional lightweight shader micro-tuning;
- reason:
  - the current shader path is technically safe but visually insufficient;
  - the reference target depends on high-density detail that is better handled by a base visual asset;
- preferred direction:
  - static/reference-quality base layer;
  - lightweight overlays only;
- static candidates:
  - dense orbital field;
  - black gravity core;
  - amber-gold accretion ring;
  - fine trajectory detail;
  - cinematic dark atmosphere;
- animated candidates:
  - breathing glow;
  - subtle opacity pulse;
  - slow radial shimmer;
  - minimal orbit drift;
  - light atmospheric veil;
- constraints:
  - sandbox-only;
  - owned, licensed or generated asset required;
  - no production integration;
  - no dependency change by default;
  - reduced-motion fallback;
  - static fallback;
  - mobile Safari safety budget;
- Stage 2.7.4 remains blocked until Stage 2.7.3b documentation closure and explicit next-path approval.

Known content issue:

- part of the public UI still contains English text. This is a known localization/content pass item, not a Stage 2.1-2.7-prep regression.

## 4. Current CSS Architecture

Current global style entry order in `app/layout.tsx`:

```ts
import './styles/dashboard.css';
import './styles/auth.css';
import './styles/simulator.css';
import './globals.css';
import './styles/motion.css';
```

CSS responsibilities:

- `app/styles/dashboard.css` - base dashboard shell, navigation, dashboard content primitives, personal area modules, simulations/detail/privacy/security/loading dashboard styles.
- `app/styles/auth.css` - base auth shell/form styles for `/login`, `/register`, `/forgot-password`.
- `app/styles/simulator.css` - base home simulator/decision console styles.
- `app/styles/motion.css` - extracted animation keyframes/motion tokens.
- `app/globals.css` - canonical global layer and final dark-gold cascade locks. It still contains historical/final visual overrides and must remain authoritative for the active visual baseline.
- `components/DecisionSingularity.module.css` - scoped CSS module for production `DecisionSingularity`.

Cascade rule:

- selector-bearing extracted files are loaded before `globals.css` so the final dark-gold locks in `globals.css` keep priority;
- do not move final cascade locks out of `globals.css` without a dedicated visual regression plan;
- do not delete historical/final override blocks just because they look duplicated.

## 5. Critical Components - Do Not Rewrite Blindly

Do not fully rewrite or replace without explicit decision:

- `components/DecisionSingularity.tsx`
- `components/DecisionSingularity.module.css`
- `components/HomeSimulator.tsx`
- `components/DashboardShell.tsx`
- `lib/simulationEngine.ts`
- `SimulationResponse` contract
- `app/globals.css` canonical dark-gold layer
- localStorage keys:
  - `levio_es_mock_session`
  - `levio_es_saved_simulations`
  - `levio_es_language`

These parts hold the working MVP surface, black-gold product identity, mock simulation flow, dashboard structure and demo persistence.

## 6. Product And Visual Principles

Levio.es is not:

- a chatbot;
- a generic SaaS dashboard;
- a template AI assistant;
- a white clean corporate UI;
- a game UI.

Levio.es is:

- a Premium Black-Gold AI Decision Intelligence System;
- a strategic decision analysis interface;
- a consequence and risk modeling experience;
- a future-scenario simulation platform.

Mandatory visual rules:

- deep black / near-black foundation;
- deep black / graphite base;
- bright gold / amber / bronze highlights;
- high-contrast readable text;
- lightweight singularity symbol;
- restrained focus and active states;
- premium minimalism;
- fast Safari/iPhone performance;
- no gaming UI direction;
- no white redesign;
- no generic startup gradient direction;
- no heavy production WebGL/canvas/particle direction.

## 7. Implemented Product Surface

Implemented and currently stable:

- public home page with Premium Black-Gold Levio product UI;
- hero simulator and local fallback simulation flow;
- POST `/api/simulate` mock route;
- structured `SimulationResponse` mock contract;
- saved simulations through `levio_es_saved_simulations`;
- mock auth pages:
  - `/login`
  - `/register`
  - `/forgot-password`
- mock protected dashboard through `MockAuthGate`;
- dashboard overview;
- dashboard simulations list;
- simulation detail page;
- decisions page;
- memory page;
- profile page;
- privacy page;
- security page;
- desktop dashboard sidebar;
- mobile compact dashboard `<details>` navigation;
- demo feedback controls.

## 8. Technical Stack

- Next.js `14.2.5` with App Router.
- React `18.2.0`.
- TypeScript `6.0.3`.
- Main global CSS architecture:
  - `app/styles/dashboard.css`
  - `app/styles/auth.css`
  - `app/styles/simulator.css`
  - `app/globals.css`
  - `app/styles/motion.css`
- Scoped singularity CSS:
  - `components/DecisionSingularity.module.css`
- Mock API:
  - `app/api/simulate/route.ts`
- Mock simulation engine:
  - `lib/simulationEngine.ts`
- Demo/personal data:
  - `lib/mockSimulations.ts`
  - `lib/personalArea.ts`
- Mock auth:
  - `components/MockAuthGate.tsx`
- Scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `./node_modules/.bin/tsc --noEmit`

Important `AGENTS.md` note:

- the project warns that this is "not the Next.js you know";
- before Next.js code changes, read relevant guides in `node_modules/next/dist/docs/`;
- in the current install this directory has previously been absent, so document the absence if checked.

## 9. Roadmap

Stable frontend stabilization phase:

- Stage 2.1 - motion CSS stabilization - completed in `8eeb150`.
- Stage 2.2 - dashboard CSS stabilization - completed in `959ffe5`.
- Stage 2.3 - auth CSS stabilization - completed in `7ea3e61`.
- Stage 2.4 - simulator CSS stabilization - completed in `c9a86da`.
- Stage 2.5 - visual regression QA - completed.
- Stage 2.6 - checkpoint + context sync - completed in `c81a9c8`.
- Stage 2.7-prep - visual engine preparation - completed in `0cec475`.
- Stage 2.7.1 - WebGL architecture research - completed in `3d8ef6e`.

Experimental visual engine phase:

- Stage 2.7.2 - isolated WebGL sandbox prototype - completed in `0781b46`.
- Stage 2.7.3 - isolated WebGL visual quality iteration - completed in `5553455`.
- Stage 2.7.3b - `fa5dfd9` technical iPhone Safari safety passed, but visual depth improvement failed; stage remains active.
- Stage 2.7.4 - blocked until Stage 2.7.3b closes under strict stage discipline, despite older profiling notes.
- Stage 2.7.5 - provisional mobile safety work in `89e534c`; not a final validation stage or production-integration basis.
- Stage 2.7.6 - provisional/no-production decision only; production replacement remains blocked.
- Stage 2.7.7 - blocked; no escalation stage is approved.
- Stage 2.7.5b - real Safari/iPhone validation completed after Safari-safe motion retest.
- Stage 2.7.5c - adaptive quality / reduced mobile mode decision completed; no extra reduced mode required now.
- Stage 2.7.6b - reserved for a future production integration proposal only if hybrid or partial integration is explicitly requested later.

Locked until explicit later stages:

- real AI backend;
- OpenAI API integration;
- provider-specific production auth integration beyond the Stage 4.1 scope lock;
- database;
- payments;
- production persistence;
- production privacy/security implementation.

## 10. Critical Experimental Rules

These rules are mandatory:

- WebGL experiments are forbidden before Stage 2.7-prep.
- Production `DecisionSingularity` must not be directly replaced by WebGL.
- WebGL work must run through an isolated sandbox/experimental track.
- Simulator business logic is protected.
- `SimulationResponse` contract is protected.
- Mobile performance baseline is critical and must be measured/protected.
- No gaming UI direction.
- Premium black-gold product minimalism must remain.
- Experimental visual engine work must not contaminate the stable frontend stabilization phase.
- `VISUAL_ENGINE_PLAN.md` conclusion is binding for the current stage: do not implement WebGL now; preserve production baseline.
- Stage 2.8 pivot is binding: heavy `/visual-lab`/WebGL directions are historical-only and must not be integrated into production hero without a new approved stage.
- Stage 2.7.3b `fa5dfd9` result remains historical evidence: technical iPhone Safari safety passed, but perceived cinematic depth did not improve enough, which helped justify the later pivot away from heavy cinematic/WebGL production work.
- The single-pass lightweight shader visual ceiling is confirmed; do not spend more MVP effort on micro-tweaks in that direction.
- Any future advanced rendering research requires a separate approved stage and must not displace the current Premium Black-Gold MVP path.
- Stage 2.7.5 correction is binding: current mobile work is safety optimization only, not completed Safari validation.
- Stage 2.7.5b result is binding: iPhone Safari retest passed after the isolated Safari-safe motion fix; Stage 2.7.5 overall still awaits the Stage 2.7.5c adaptive-quality/reduced-mobile-mode decision if required.
- Stage 2.7.5c result is binding: current real-device data does not require additional adaptive quality or reduced mobile mode; Stage 2.7.5 is complete for the isolated sandbox scope, with longer thermal profiling still recommended before any production integration decision.
- Stage 2.7.6 formal decision is binding: keep current production `DecisionSingularity`, do not replace production hero, keep WebGL isolated in `/visual-lab`, and require separate approval before any hybrid or partial production integration.

## 11. Stage Separation

Stable frontend stabilization phase:

- focuses on CSS consolidation, route QA, layout stability, documentation sync and regression prevention;
- must preserve the current production visual system;
- must not introduce new product architecture or backend systems.

Experimental visual engine phase:

- starts only after Stage 2.7-prep;
- must be isolated from production routes/components until explicitly approved;
- may explore WebGL/advanced rendering only inside a sandbox path or clearly separated experimental module.

## 12. Workflow Rules

Before any meaningful change:

1. Check `git status`.
2. Confirm `stash@{0}: pre-stage-1.5-existing-changes` is not being applied.
3. Keep edits scoped to the current stage.
4. Do not modify production code during documentation-only tasks.

After every meaningful implementation stage:

1. Run:
   - `npm run lint`
   - `npm run build`
   - `npx tsc --noEmit`
2. Run browser QA for affected routes on desktop and mobile `390px`.
3. Check for console errors and horizontal overflow.
4. Review `git diff`.
5. Commit only after successful checks.
6. Do not push unless explicitly requested.
7. Update context docs when stage boundaries change:
   - `PROJECT_CONTEXT.md`
   - `LEVIO_CURRENT_STATE.md`
   - `CURRENT_STAGE.md`

## 13. Latest Verified QA Baseline

Stage 2.1:

- motion extraction completed;
- keyframes moved to `app/styles/motion.css`;
- lint/build/tsc passed;
- route QA showed no horizontal overflow or console errors.

Stage 2.2:

- dashboard CSS extraction completed;
- desktop and mobile `390px` dashboard routes stable:
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/privacy`
  - `/dashboard/security`
  - `/dashboard/simulations`
  - `/dashboard/simulations/oferta-premium`
  - `/dashboard/decisions`
  - `/dashboard/memory`
- dashboard mobile nav stable:
  - compact menu visible at `390px`;
  - sidebar nav hidden at mobile;
  - menu opens;
  - links visible;
  - click to `/dashboard/simulations` works.

Stage 2.3:

- auth CSS extraction completed;
- desktop and mobile `390px` auth routes stable:
  - `/login`
  - `/register`
  - `/forgot-password`
- Spanish labels/buttons/links preserved;
- mock login flow stable:
  - `/login?next=/dashboard` opens `/dashboard` after `Entrar`;
- no console errors;
- no horizontal overflow.

Stage 2.4:

- simulator CSS extraction completed in `c9a86da`;
- base home simulator/decision console styles moved to `app/styles/simulator.css`;
- `simulator.css` is imported before `globals.css`;
- `globals.css` remains the canonical final dark-gold cascade layer;
- production `HomeSimulator`, `DecisionSingularity`, WebGL and simulator business logic were not rewritten.

Stage 2.5:

- visual regression QA completed after Stage 2.4;
- desktop `1440x900` QA stable:
  - `/`
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/privacy`
  - `/dashboard/security`
  - `/dashboard/simulations`
  - `/dashboard/simulations/oferta-premium`
  - `/dashboard/decisions`
  - `/dashboard/memory`
- mobile `390x844` QA stable:
  - `/`
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/dashboard`
- mobile dashboard compact nav opens and shows 7 links;
- home simulator interaction stable:
  - textarea input accepted;
  - `POST /api/simulate` returned `200`;
  - result rendered with 4 scenario cards;
- no console errors observed;
- no horizontal overflow detected;
- cinematic dark-gold visual baseline preserved.

Build note:

- `npm run lint` passed;
- `./node_modules/.bin/tsc --noEmit` passed;
- `npm run build` compiled successfully, completed type/lint validation and generated `19/19` static pages, then stayed on `Collecting build traces` for several minutes and was stopped manually. Treat this as a local build-trace caveat, not a Stage 2.5 visual regression.

Stage 2.6:

- checkpoint + context sync completed in `aeace9f`;
- Stage 2 documentation closure completed in `c81a9c8`;
- `PROJECT_CONTEXT.md`, `LEVIO_CURRENT_STATE.md` and `CURRENT_STAGE.md` were synchronized after Stage 2.5 visual QA;
- no production code was changed;
- next planned stage is Stage 2.7-prep, visual engine preparation.

Stage 2.7-prep:

- visual engine preparation completed as a protective checkpoint before future experiments;
- backup branch created: `stable/stage-2-frontend-baseline`;
- `npm run build` passed successfully and the previous `Collecting build traces` caveat did not reproduce;
- `npm run lint` passed with no warnings or errors;
- `./node_modules/.bin/tsc --noEmit` passed;
- mobile performance baseline at `390x844` stable:
  - `/` rendered without horizontal overflow;
  - `/dashboard` rendered after mock login without horizontal overflow;
  - mobile dashboard compact nav opens and shows 7 links;
  - home simulator accepted input, called `POST /api/simulate`, rendered 5 thinking steps and 4 scenario cards;
  - console errors were empty;
  - animations were subjectively stable with no obvious jank or layout shift;
- stable frontend foundation is protected before Stage 2.7.1;
- no npm install was performed;
- no Three.js or React Three Fiber dependency was installed;
- no WebGL components were created;
- `/visual-lab` was not created;
- hero and production UI were not redesigned;
- production `DecisionSingularity` remains protected;
- production `HomeSimulator`, simulator logic and `SimulationResponse` contract remain protected;
- WebGL remains forbidden in production until isolated architecture approval.

## 14. Git State At This Context Update

Latest local commits before this documentation update:

```text
c81a9c8 Finalize Stage 2 checkpoint documentation
aeace9f Sync Stage 2 visual QA checkpoint
c9a86da Stabilize simulator CSS structure for Stage 2
41c34bc Update Levio project context after Stage 2 stabilization
7ea3e61 Stabilize auth CSS structure for Stage 2
959ffe5 Stabilize dashboard CSS structure for Stage 2
8eeb150 Begin safe CSS consolidation for Stage 2
0777b7e Finalize Stage 1 stable baseline
```

Stash:

```text
stash@{0}: On main: pre-stage-1.5-existing-changes
```

Backup branch:

```text
stable/stage-2-frontend-baseline
```

The stash was not applied during Stage 2.1-2.5 and must not be applied without explicit permission.

## 15. Instruction For New Codex Chat

Start the next chat with:

```text
Read `PROJECT_CONTEXT.md` in the Levio.es project root.
Use it as the primary current project context.
Continue strictly from the documented state.
Do not restart the project from scratch.
Do not apply the stash without separate permission.
Do not change production code during documentation-only tasks.
Write project documentation in English.
Write all owner-facing Codex reports in Russian.
Keep product UI multilingual under `LEVIO_MULTILINGUAL_ARCHITECTURE.md`, with Spanish as the current primary public UI language unless product strategy changes.
```

Critical reminder:

- stable frontend stabilization and experimental visual engine work are separate phases;
- WebGL is not allowed until Stage 2.7-prep;
- production `DecisionSingularity` remains protected;
- simulator logic and `SimulationResponse` contract remain protected.
