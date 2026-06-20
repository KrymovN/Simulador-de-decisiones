# LEVIO STAGE 4.3P USER DATA CONTROLS PRODUCT INTEGRATION SCOPE LOCK

## Document Status

- Stage: 4.3P - User Data Controls Product Integration Scope Lock.
- Status: scope lock / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `732dff6` - Stage 4.2L Persistence Runtime State Closure.
- Depends on: Stage 4.2L persistence runtime closure, Stage 4.3 Runtime Dependency & Scope Lock Audit, Stage 4.3A-H user data controls foundation, and immutable target runtime architecture.
- Runtime code: not changed.
- UI: not changed.
- API routes: not changed.
- Supabase production runtime: not connected.
- OpenAI / AI Provider: not connected.
- Billing / Subscription Runtime: not connected.
- Product behavior: not changed.

This document fixes how future user data controls may integrate with Levio's
product architecture. It does not approve implementation, expose product
workflows, connect database runtime, connect Supabase production runtime, create
export files, execute deletion, add UI, add API routes, connect OpenAI, connect
billing, or change the simulator.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

User data controls are support infrastructure around owner-scoped decision
simulation artifacts. They must not create a parallel product object based on AI
conversation history, prompt history, assistant logs, or generic chat memory.

## Audit Inputs

Reviewed sources for this scope lock:

- `PROJECT_CONTEXT.md`
- `LEVIO_CURRENT_STATE.md`
- `CURRENT_STAGE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_2L_PERSISTENCE_RUNTIME_STATE_CLOSURE.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3H_USER_DATA_CONTROLS_CLOSURE.md`
- current `lib/user-data-controls` runtime foundation package
- current `lib/persistence-runtime` owner-scoped persistence foundation package
- recent git history through `732dff6`

Runtime scan result:

- `lib/user-data-controls` exists as a Stage 4.3 foundation/runtime-boundary/QA package.
- Consent, retention, export, and deletion modules are preflight/foundation-only.
- The user data controls boundary is disabled by default.
- Safety evidence records no UI, API, Supabase, database, auth-runtime, simulator, subscription, memory, or AI integration.
- No application UI/API import of `lib/user-data-controls` was found outside the isolated package.
- Stage 4.2 persistence remains foundation / isolated runtime boundary complete, with product integration not started and production readiness not approved.

## Stage 4.3 Controls In Scope

Stage 4.3 user data controls cover only owner-scoped controls around decision
simulation artifacts:

- export;
- deletion;
- consent;
- retention;
- privacy visibility;
- ownership verification.

These controls are not a new product mode. They are lifecycle, privacy, and
ownership guardrails for artifacts created by the Decision Simulation Engine.

## Controlled Resources

Future Stage 4.3 product integration may apply to these resources only after a
separate implementation approval:

- simulations / saved simulation records;
- simulation drafts;
- saved decision artifacts derived from simulation output;
- simulation history entries when tied to parent simulation lifecycle;
- user-owned metadata needed to identify ownership and artifact provenance;
- future export packages;
- future deletion records;
- future consent records, if a durable consent ledger is separately approved;
- future retention policy state, if automated retention is separately approved.

The canonical owner anchor remains `levio_principals.principal_id`.

Supabase `auth.users.id` remains a provider reference only. It must not become
the product owner identifier without a separate architecture approval.

## Explicit Non-Product Objects

The following must not be treated as the primary product object for Levio:

- AI chat history;
- generic prompt history;
- assistant conversation logs;
- generic chat transcripts;
- raw AI provider prompts;
- raw AI provider responses;
- AI memory records;
- embeddings or vector memory;
- provider-side logs or model telemetry;
- billing records;
- security signals;
- service-role data.

If a future export or deletion workflow encounters these categories, they must
be excluded, separately reviewed, or handled only under a later approved
privacy/legal architecture. Stage 4.3P does not approve them as Levio product
data.

## Product Integration Boundary

Future user data controls may integrate only around decision simulation
artifacts produced or persisted through the approved Levio architecture.

Approved boundary:

- controls wrap owner-scoped decision simulation artifacts;
- controls use server-side ownership verification;
- controls preserve `levio_principals.principal_id` as the owner anchor;
- controls remain separate from subscription, billing, AI provider, memory, and generic assistant behavior;
- controls fail closed when ownership, auth/session, resource category, or policy cannot be proven;
- controls may become product-facing only after a later UI/API/workflow scope is approved.

Forbidden boundary crossings:

- do not turn saved simulations into AI chat history;
- do not expose prompt history as the primary user asset;
- do not create assistant conversation logs as a dashboard feature;
- do not make AI Provider output directly user-controlled outside the Decision Engine and Simulator flow;
- do not use user data controls to introduce generic AI assistant behavior;
- do not use export/delete/consent/retention as a backdoor for OpenAI, billing, subscriptions, memory, or production Supabase runtime.

## Runtime Dependencies

Stage 4.3P confirms these dependencies before any product integration work:

- owner-scoped persistence must provide eligible decision simulation artifacts;
- `levio_principals.principal_id` must be resolved before any control action;
- auth/session runtime must prove an active registered-user context;
- future export workflows must stay read-only until package generation is explicitly approved;
- future deletion workflows must use lifecycle planning before irreversible removal;
- future retention policy must be category-specific, testable, and separately approved;
- future privacy visibility must describe artifact control state without implying chat history or AI memory;
- future UI/API integration requires a separate scope lock and QA matrix.

## Ownership Dependencies

User data controls depend on the approved Levio ownership model:

- `registered_user` is the only current durable owner type.
- `levio_principals.principal_id` is the canonical owner anchor.
- Provider identifiers are not ownership proof.
- Client-supplied `principal_id`, `owner_id`, provider reference, email, record ID, or subscription state must not authorize data-control actions.
- Resource snapshots must match the resolved principal.
- Parent-child relationships, especially simulation history entries, must preserve parent simulation ownership.
- Future guest, workspace, internal operator, subscription, service, AI, memory, or admin scopes require separate scope locks.

## Persistence Dependencies

Stage 4.3P does not change persistence, but future product integration depends
on persistence being product-safe enough for user data controls:

- saved simulations must exist through a controlled server-only persistence path;
- drafts must have approved lifecycle semantics before export/delete inclusion;
- simulation history entries must remain tied to parent simulation lifecycle;
- list/read behavior must be owner-scoped before real export packaging;
- deletion targets must have lifecycle, rollback, and audit semantics;
- future export packages and deletion records must themselves be owner-scoped;
- production Supabase behavior remains unapproved until separately validated.

## Auth Dependencies

Future product integration depends on an auth/session boundary that can safely
prove the acting owner:

- authenticated session must be active and validated;
- provider reference must resolve to exactly one active Levio principal;
- session expiry and revocation must fail closed;
- logout must prevent further data-control actions;
- callback, redirect, magic-link, and production provider settings require separate validation;
- legal/privacy review remains required before public data-control workflows.

## User Data Control Dependencies

The current Stage 4.3 package is foundation-only. Product workflows need later
approval for:

- product copy for privacy visibility;
- export request UX and server workflow;
- export package format, storage, download, expiration, and audit boundaries;
- deletion request UX, confirmation, lifecycle transition, and rollback boundaries;
- consent purpose copy and durable consent ledger, if needed;
- retention policy publication and background retention jobs, if needed;
- QA for forged owner IDs, cross-principal access, disabled modules, expired sessions, restricted resources, and rollback behavior.

## User Data Ownership Invariants

- Every user data control action must be scoped to one resolved Levio principal.
- Ownership is proven server-side; it is never proven by client input.
- A resource ID alone never authorizes access.
- Cross-principal export, deletion, retention, consent, or privacy visibility must fail closed.
- Subscription status, billing status, AI provider state, and model output do not grant ownership.
- Saved decision artifacts remain artifacts of the Decision Simulation Engine.

## Export Invariants

- Export is a user data control, not a subscription feature.
- Export must remain owner-scoped and read-only until a later implementation stage approves package generation.
- Export may include only eligible decision simulation artifacts and required owner/provenance metadata.
- Export must exclude provider secrets, auth tokens, service-role data, other-user records, billing records, AI prompts, raw AI responses, embeddings, vectors, memory data, and generic conversation logs.
- Export package generation, storage, download links, expiration, and audit records require later approval.
- Export must fail closed if ownership, auth/session, resource eligibility, or category policy cannot be proven.

## Deletion Invariants

- Deletion is a lifecycle control, not a display toggle.
- Deletion must be owner-scoped and server-authorized.
- Deletion planning must precede irreversible removal.
- Simulation history deletion must respect parent simulation ownership and lifecycle.
- Legal hold, retained legal exception, active subscription dependency, or unclear retention state must block destructive execution until separately reviewed.
- Future deletion records must contain only minimal operational proof and must not become chat history or assistant logs.

## Consent Invariants

- Consent is purpose-specific.
- Registration, authentication, simulation saving, or subscription status is not blanket consent.
- Consent for memory, analytics, AI training, marketing, and workspace sharing remains out of scope unless separately approved.
- Consent checks must fail closed when purpose, owner, policy version, or status cannot be proven.
- Durable consent storage and legal copy require later schema/product/legal approval.

## Retention Invariants

- Retention must be category-specific, purpose-specific, documented, and testable.
- Indefinite silent retention is not an approved default.
- Drafts, saved simulations, and history entries may have different lifecycle rules.
- History retention must follow parent simulation semantics unless a later exception is approved.
- Retention jobs, background deletion, backup propagation, and legal exception handling require later implementation scope.

## Privacy Visibility Invariants

- Privacy visibility must show control state around decision simulation artifacts only.
- It must not imply that Levio stores generic AI chat history.
- It must not imply user access to provider logs, raw prompts, raw model responses, security signals, service-role data, or billing records through Stage 4.3 controls.
- Any user-facing privacy copy must be reviewed before production exposure.

## Rollback Invariants

- Stage 4.3P rollback is documentation-only: remove or supersede this document and state updates.
- No code rollback is required because no runtime code changed.
- No schema rollback is required because no migrations changed.
- No data rollback is required because no data was written or deleted.
- Future runtime rollback must disable controls fail-closed without exposing protected data or silently deleting user-owned data.
- Export rollback must not lose required user access obligations once public workflows are launched.
- Deletion rollback must preserve lifecycle/audit evidence and avoid irreversible surprise deletion.

## Non-Chat Product Invariants

- User data controls must not create AI chat history as the product center.
- Prompt history must not become a primary user-owned artifact.
- Assistant conversation logs must not become the dashboard history model.
- Future AI Provider integration must remain internal and mediated by Prompt Context, Decision Engine, and Simulator.
- UI must continue to present decision simulation process and results, not direct AI answers.
- User rights around data must attach to decision simulation artifacts, not to generic assistant conversations.

## Blockers

The following block product integration after Stage 4.3P:

- no approved UI/API workflow scope for user data controls;
- no production Supabase validation for owner-scoped persistence;
- no production auth/session validation for real user-data controls;
- no approved export package format, storage, expiration, or download workflow;
- no approved deletion lifecycle execution and rollback workflow;
- no durable consent ledger or legal copy approval;
- no published retention policy or automated retention execution scope;
- no legal/privacy review for user-facing data-control language.

## Risks

- Exposing controls before product-safe persistence could create false privacy guarantees.
- Treating foundation modules as production-ready could lead to incomplete export/delete behavior.
- Using provider IDs as owners would violate the approved principal model.
- Treating prompt history or AI logs as product data would drift Levio toward AI Chat.
- Starting UI/API integration before legal/privacy copy is reviewed could mislead users.
- Connecting AI, billing, or subscriptions through user data controls would bypass the roadmap.

## Scope Lock Decision

Decision:

```text
STAGE 4.3P USER DATA CONTROLS PRODUCT INTEGRATION SCOPE LOCKED
```

Stage 4.3P approves only the future product integration boundary. It does not
approve runtime implementation, UI, API routes, Supabase production runtime,
OpenAI, billing, Subscription Runtime, product behavior changes, real export
generation, real deletion execution, consent storage, or retention jobs.

## Next Approved Step

The next approved roadmap step after Stage 4.3P is:

```text
Stage 4.3Q User Data Controls Product Integration Readiness Plan
```

Purpose:

- define the exact future UI/API workflow surface for export, deletion, consent, retention, privacy visibility, and ownership verification;
- define legal/privacy copy dependencies before user-facing controls;
- define QA and rollback evidence required before implementation;
- decide which workflows remain planning-only and which may later become runtime work;
- preserve Levio as a Decision Simulation Engine.

Stage 4.3Q must remain documentation/planning-only unless the project owner
explicitly approves implementation.
