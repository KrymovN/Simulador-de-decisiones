# LEVIO STAGE 4.3R USER DATA CONTROLS IMPLEMENTATION GATE

## Document Status

- Stage: 4.3R - User Data Controls Implementation Gate & Evidence Closure.
- Status: implementation gate / evidence closure / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `43cf892` - Stage 4.3Q User Data Controls Readiness Plan.
- Runtime code: not changed.
- UI: not changed.
- API routes: not changed.
- Supabase production runtime: not connected.
- OpenAI / AI Provider: not connected.
- Billing / Subscription Runtime: not connected.
- Product behavior: not changed.

This document decides whether Levio may start the first User Data Controls
implementation stage. It does not implement user data controls, connect runtime
services, expose API routes, change UI, connect Supabase production runtime,
connect OpenAI, connect billing, connect Subscription Runtime, or change product
behavior.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

User data controls may operate only around owner-scoped decision simulation
artifacts. They must not introduce AI chat history, generic prompt history,
assistant conversation logs, memory runtime, OpenAI coupling, billing coupling,
or generic assistant behavior.

## Audit Inputs

Reviewed sources:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_2L_PERSISTENCE_RUNTIME_STATE_CLOSURE.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3H_USER_DATA_CONTROLS_CLOSURE.md`
- `LEVIO_STAGE_4_3P_USER_DATA_CONTROLS_PRODUCT_INTEGRATION_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3Q_USER_DATA_CONTROLS_READINESS_PLAN.md`
- current `lib/auth`
- current `lib/persistence-runtime`
- current `lib/user-data-controls`
- `package.json`
- recent git history through `43cf892`

Repository scan result:

- `lib/user-data-controls` remains isolated from product UI/API.
- No application UI/API imports of `lib/user-data-controls` or `lib/persistence-runtime` were found.
- Existing application API routes remain `/api/simulate` and `/auth/callback`.
- `package.json` contains Supabase and Next/React dependencies only; no OpenAI,
  Stripe, billing, or model-call SDK is present.
- Working tree was clean before this documentation stage.

## Gate Verdict

Gate decision:

```text
NO-GO FOR IMPLEMENTATION
```

Stage 4.3S User Data Controls Server Workflow Foundation must not start yet.

Reason:

- foundation evidence exists;
- implementation readiness evidence is incomplete;
- auth/session, principal resolution, owner-scoped persistence, product workflow,
  legal/privacy, QA, rollback, and owner approval are not all closed at the
  production/product gate level.

## Evidence Summary

| Evidence Area | Evidence Found | Gate Status | Notes |
| --- | --- | --- | --- |
| Auth/session boundary | `lib/auth` defines normalized Supabase session context and server session reading. | Partial / blocked | Production provider behavior, redirects, magic-link delivery, session restore/revocation, and data-control-specific session QA are not recorded. |
| Principal resolution | Persistence runtime wiring can resolve a provider reference through a provider adapter and preflight against a resolved principal. | Partial / blocked | Product path from authenticated session to canonical `levio_principals.principal_id` is not proven in production. Auth normalization still exposes provider-derived context, while Stage 4.2 requires canonical principal resolution. |
| Owner-scoped persistence | Stage 4.2L documents owner-scoped simulations, drafts, history, future exports, and future deletions; runtime modules reject owner mismatch and client owner fields. | Partial / blocked | Persistence product integration for save/list/read/update/archive/delete is not approved or product-tested. |
| User ownership model | `levio_principals.principal_id` remains the canonical owner anchor; registered user is the only current durable owner type. | Foundation accepted | Guest, workspace, admin, service, subscription, memory, AI, and internal-operator scopes remain out of Stage 4.3. |
| Export eligibility | Stage 4.3 export foundation defines owner-scoped preflight, manifest-only package planning, and forbidden categories. | Partial / blocked | No real package format, generation, storage, download, expiration, audit, or UI/API workflow is approved. |
| Deletion eligibility | Stage 4.3 deletion foundation defines owner-scoped lifecycle-only deletion planning and blockers. | Partial / blocked | No real deletion execution, lifecycle transition workflow, account deletion orchestration, backup propagation, or irreversible-action rollback evidence is approved. |
| Retention model | Stage 4.3 retention foundation defines category-specific evaluation for saved simulations, drafts, and history entries. | Partial / blocked | No published retention policy, legal exception workflow, background job/no-job decision, backup boundary, or production execution scope is approved. |
| Consent model | Stage 4.3 consent foundation defines purpose-specific policy checks and out-of-scope purposes. | Partial / blocked | No durable consent ledger, user-facing copy, legal review, withdrawal workflow, or product UX is approved. |

## Auth / Session Evidence

Accepted evidence:

- `lib/auth/types.ts` defines authenticated and signed-out runtime contexts.
- `lib/auth/session.ts` reads Supabase server session and validates the user.
- `lib/auth/identity.ts` normalizes a Supabase session into a registered-user context.
- Expired or invalid sessions are returned as signed-out/error contexts.

Not accepted as implementation-ready evidence:

- production Supabase project settings;
- redirect allowlist evidence;
- magic-link email delivery evidence;
- preview/production callback exchange evidence;
- session restoration and logout QA evidence;
- revocation/expiry behavior against a real provider project;
- data-control-specific session validation.

Gate result:

```text
AUTH / SESSION BOUNDARY PARTIAL; IMPLEMENTATION BLOCKED
```

## Principal Resolution Evidence

Accepted evidence:

- Stage 4.2L confirms `levio_principals.principal_id` is the canonical owner anchor.
- `lib/persistence-runtime/runtime-wiring.ts` supports provider-reference to principal resolution through a provider adapter.
- Persistence preflight can block when a resolved principal is missing or mismatched.
- Stage 4.3 controls require server-side owner resolution.

Not accepted as implementation-ready evidence:

- production proof that Supabase `auth.users.id` maps to exactly one active `levio_principals.principal_id`;
- product path proof from `readServerAuthSession()` to persistence runtime principal resolution;
- proof that client-provided principal IDs cannot enter future user data controls;
- production RLS + server boundary evidence for control operations.

Gate result:

```text
PRINCIPAL RESOLUTION PARTIAL; IMPLEMENTATION BLOCKED
```

## Owner-Scoped Persistence Evidence

Accepted evidence:

- Stage 4.2L closes persistence as foundation / isolated runtime boundary complete.
- `simulation_records`, `simulation_drafts`, and `simulation_history_entries` are modeled as owner-scoped decision simulation artifacts.
- Persistence runtime modules include validation catalogs for authenticated context, resolved principal, owner mismatch, and client owner-field rejection.
- No product UI/API integration is currently importing persistence runtime services.

Not accepted as implementation-ready evidence:

- product-ready save/list/read/update/archive/delete workflows;
- owner-scoped list/read services for export source discovery;
- production Supabase validation for persistence operations;
- production service-role deployment boundary;
- browser/API QA for real user data controls.

Gate result:

```text
OWNER-SCOPED PERSISTENCE PARTIAL; IMPLEMENTATION BLOCKED
```

## User Ownership Model Evidence

Accepted evidence:

- canonical owner anchor: `levio_principals.principal_id`;
- provider reference: Supabase `auth.users.id`, not the product owner ID;
- initial durable owner type: `registered_user`;
- resource owner must match resolved principal;
- client-supplied owner identifiers must not authorize actions.

Remaining gaps:

- no approved expansion for guest, workspace, admin, service, subscription,
  memory, AI, or internal-operator scopes;
- no production proof that future UI/API cannot bypass server-side owner
  resolution;
- no owner approval for implementation surfaces.

Gate result:

```text
OWNERSHIP MODEL ACCEPTED AS FOUNDATION; PRODUCT IMPLEMENTATION STILL BLOCKED
```

## Export Eligibility Evidence

Accepted evidence:

- export is scoped to owner-controlled decision simulation artifacts;
- export foundation excludes provider secrets, auth tokens, service-role data,
  other-user records, billing records, AI prompts, raw AI responses, embeddings,
  vectors, memory data, and generic conversation logs;
- export remains manifest-only/preflight in current Stage 4.3 foundation.

Remaining blockers:

- no real package format;
- no package generation;
- no storage or download boundary;
- no expiration or audit posture;
- no legal/privacy copy;
- no API/UI request workflow;
- no production QA for export source discovery.

Gate result:

```text
EXPORT ELIGIBILITY FOUNDATION ACCEPTED; IMPLEMENTATION BLOCKED
```

## Deletion Eligibility Evidence

Accepted evidence:

- deletion is lifecycle-oriented, not hard-delete-first;
- deletion foundation supports owner-scoped planning and blockers;
- terminal, restricted, legal-hold, parent-context, and active-subscription
  concepts are represented at foundation level.

Remaining blockers:

- no real lifecycle transition workflow;
- no deletion request confirmation model;
- no backup/log propagation boundary;
- no irreversible-action policy;
- no legal exception handling workflow;
- no production rollback evidence.

Gate result:

```text
DELETION ELIGIBILITY FOUNDATION ACCEPTED; IMPLEMENTATION BLOCKED
```

## Retention Model Evidence

Accepted evidence:

- retention foundation defines saved simulation, draft, and history-entry
  categories;
- drafts can have short lifecycle semantics;
- history retention remains tied to parent simulation lifecycle;
- indefinite silent retention is not an approved default.

Remaining blockers:

- no published product retention policy;
- no legal/privacy approval;
- no background job/no-job decision;
- no backup or operational log boundary;
- no production retention execution scope.

Gate result:

```text
RETENTION MODEL FOUNDATION ACCEPTED; IMPLEMENTATION BLOCKED
```

## Consent Model Evidence

Accepted evidence:

- consent is purpose-specific;
- registration, authentication, simulation saving, and subscription status are
  not blanket consent;
- memory, analytics, AI training, marketing, and workspace sharing are out of
  scope unless separately approved;
- foundation checks fail closed for missing/invalid consent when required.

Remaining blockers:

- no durable consent ledger;
- no user-facing consent copy;
- no legal review;
- no withdrawal workflow;
- no schema approval for persistent consent records.

Gate result:

```text
CONSENT MODEL FOUNDATION ACCEPTED; IMPLEMENTATION BLOCKED
```

## QA Matrix For Future Implementation

| Area | Required Case | Expected Result | Evidence Required Before Go |
| --- | --- | --- | --- |
| Auth | Missing session requests export/delete/visibility. | Fail closed. | Automated server validation plus manual route QA. |
| Auth | Expired/revoked session requests control action. | Fail closed. | Provider-backed session expiry/revocation evidence. |
| Principal resolution | Provider reference resolves to no Levio principal. | Fail closed. | Server validation and audit log proof. |
| Principal resolution | Provider reference resolves ambiguously. | Fail closed. | Database uniqueness/RLS proof. |
| Ownership | Client supplies forged `principal_id` or `owner_id`. | Ignored/rejected; fail closed. | Automated test and route-level validation. |
| Ownership | Record ID belongs to another principal. | Fail closed. | Cross-principal test with real persisted records. |
| Export | Eligible simulation export request. | Read-only package planning succeeds. | Owner-scoped list/read evidence. |
| Export | Export tries forbidden categories. | Excluded or blocked. | Forbidden-category assertion. |
| Export | Restricted/deleted/legal-exception record included. | Excluded or reviewed, not silently exported. | Lifecycle eligibility test. |
| Deletion | Eligible draft deletion request. | Lifecycle plan only, no hard delete. | Deletion plan evidence. |
| Deletion | Parent simulation ownership mismatch for history entry. | Fail closed. | Parent-owner test. |
| Deletion | Legal hold / retained legal exception. | Block deletion. | Legal exception fixture. |
| Retention | Draft expired. | Eligible for deletion planning, not hard delete. | Retention evaluation proof. |
| Retention | Unknown retention rule. | Fail closed. | Unsupported-rule test. |
| Consent | Required consent missing. | Fail closed. | Purpose policy test. |
| Consent | Withdrawn/expired consent. | Fail closed. | Consent status test. |
| Boundary | User data controls boundary disabled. | No operation executes. | Disabled boundary test. |
| Non-chat | Export/deletion references chat/prompt/assistant logs. | Excluded or blocked. | Non-chat invariant test. |
| Rollback | Feature disabled during rollout. | Controls fail closed without data exposure. | Rollback drill. |
| Product | User-facing copy promises unsupported control. | Block release. | Product copy review. |

## Rollback Matrix

| Failure Mode | Rollback Action | Data Safety Requirement | Owner Approval Required |
| --- | --- | --- | --- |
| Control workflow misroutes owner context. | Disable user data controls feature flag / server workflow. | No cross-principal data exposed. | Yes before re-enable. |
| Principal resolution fails in production. | Disable control actions requiring persisted resources. | Export/delete remain blocked. | Yes. |
| Export package includes forbidden category. | Disable export generation and invalidate packages. | Preserve audit evidence; notify owner path. | Yes. |
| Deletion lifecycle transition is wrong. | Stop deletion workflow, restrict affected resources, review audit. | No hard delete without verified eligibility. | Yes. |
| Consent policy mismatch. | Disable consent-dependent workflows. | Do not process restricted purposes. | Yes. |
| Retention policy mismatch. | Stop retention jobs / planning execution. | Do not delete silently. | Yes. |
| UI/API exposes unsupported control. | Remove route/surface or disable action. | Keep user data inaccessible until fixed. | Yes. |
| Legal/privacy copy rejected. | Block public release of user-facing controls. | Keep controls internal/disabled. | Yes. |
| Stage 4.4/AI/Billing coupling appears. | Revert coupling and disable affected workflow. | Preserve Decision Simulation Engine invariant. | Yes. |

## Implementation Gate Checklist

All checklist items must be complete before implementation may start:

- [x] Stage 4.3Q readiness plan exists.
- [x] Stage 4.3P product integration boundary exists.
- [x] Stage 4.3 foundation/boundary/QA exists.
- [x] Non-chat product invariant is documented.
- [x] Forbidden categories are documented.
- [ ] Production auth/session validation evidence exists.
- [ ] Provider-reference to `levio_principals.principal_id` production evidence exists.
- [ ] Owner-scoped persistence product list/read evidence exists.
- [ ] Export package/download/storage/audit scope is approved.
- [ ] Deletion lifecycle execution/rollback scope is approved.
- [ ] Retention policy and execution/no-execution decision are approved.
- [ ] Consent copy/ledger/withdrawal scope is approved.
- [ ] Legal/privacy copy path is approved.
- [ ] QA matrix is converted into executable or owner-accepted validation evidence.
- [ ] Rollback drill/evidence exists.
- [ ] Project owner explicitly approves Stage 4.3S implementation.

## Blocker Status

All blockers removed:

```text
NO.
```

Remaining blockers:

- production auth/session validation not recorded;
- canonical principal resolution not proven on the product path;
- owner-scoped persistence list/read product readiness not proven;
- export workflow package/download/storage/audit scope not approved;
- deletion lifecycle execution and rollback scope not approved;
- retention policy and execution boundary not approved;
- consent ledger/copy/withdrawal scope not approved;
- legal/privacy copy and review path not approved;
- QA matrix not yet converted into accepted validation evidence;
- rollback drill/evidence not completed;
- explicit owner approval for Stage 4.3S not provided.

## Required Project Owner Confirmations

Before implementation can start, the project owner must confirm:

- production/dev target for auth and persistence evidence;
- whether Stage 4.3S may be server-only implementation;
- exact allowed files/surfaces for Stage 4.3S;
- no UI/API exposure unless separately approved;
- no OpenAI, billing, Subscription Runtime, memory, or generic chat behavior;
- export remains package-plan/preflight first;
- deletion remains lifecycle-plan first;
- legal/privacy copy path before user-facing release;
- rollback procedure and owner notification path;
- acceptance of QA matrix as the minimum implementation test plan.

## Final Gate Decision

Decision:

```text
NO-GO
```

Stage 4.3R closes the implementation gate with a failed Go decision. The
project must not proceed to Stage 4.3S yet.

This is not a rejection of the Stage 4.3 foundation. It is a refusal to begin
implementation before production/product evidence is sufficient.

## Next Approved Step

The next approved roadmap step is:

```text
Stage 4.3R-1 User Data Controls Gate Blocker Closure Plan
```

Purpose:

- close the remaining auth/session evidence gap;
- close the canonical principal-resolution evidence gap;
- close owner-scoped persistence product-readiness evidence;
- prepare owner-confirmable export, deletion, retention, consent, legal/privacy,
  QA, and rollback evidence;
- decide whether a later Stage 4.3R re-gate may produce a Go decision.

Stage 4.3R-1 must remain documentation/validation-only unless the project owner
explicitly changes scope.

## Non-Changes Confirmed

This stage changed no runtime code, UI, API routes, Supabase runtime, OpenAI,
billing, Subscription Runtime, package dependencies, migrations, simulator
runtime, or product behavior.
