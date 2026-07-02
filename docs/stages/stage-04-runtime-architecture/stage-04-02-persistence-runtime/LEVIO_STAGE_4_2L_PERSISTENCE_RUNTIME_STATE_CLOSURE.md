# LEVIO STAGE 4.2L PERSISTENCE RUNTIME STATE CLOSURE

## Document Status

- Stage: 4.2L - Persistence Runtime State Closure & Product Integration Scope Lock.
- Status: closure / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Trigger: Stage 4.3 Runtime Dependency & Scope Lock Audit.
- Runtime code: not changed.
- UI: not changed.
- API routes: not changed.
- Supabase runtime: not connected by this stage.
- OpenAI: not connected.
- Billing: not connected.
- Subscription Runtime: not connected.
- Dependencies: not changed.

This document closes the current Stage 4.2 persistence runtime state at the
documentation and product-integration-boundary level. It does not create new
runtime code, modify existing runtime code, connect Supabase runtime, change UI,
change API routes, connect OpenAI, connect billing, connect subscription
runtime, or change product behavior.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is a Decision Simulation Engine.

Persistence exists to support user-owned decision simulation records, drafts,
and lifecycle controls. It must not create AI chat history as the core product
object, must not make conversations the primary product surface, and must not
replace the Simulator or Decision Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Persistence is supporting infrastructure around this flow. It is not a separate
answering layer and is not an AI memory system.

## Audit Inputs

Reviewed inputs:

- `../../../../PROJECT_CONTEXT.md`
- `../../../../LEVIO_CURRENT_STATE.md`
- `../../../../CURRENT_STAGE.md`
- `../../../../LEVIO_PROJECT_PROGRESS.md`
- `../../../architecture/LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `../stage-04-03-user-data-controls/LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- all available Stage 4.2 documents
- `lib/persistence-runtime/**`
- `supabase/migrations/**`
- application routes under `app/**`
- current git history

Current git checkpoint before this stage:

```text
bf2d6d1 Stage 4.3 runtime dependency audit
```

Relevant persistence git history:

```text
a311153 Stage 4.2K simulation draft runtime
b402dbc Stage 4.2J simulation history runtime
bc3b3e0 Stage 4.2I simulation record persistence
fd564a7 Stage 4.2H persistence runtime wiring
11eb343 Stage 4.2G supabase runtime provider
cd91921 Stage 4.2F persistence provider adapter foundation
f8753cf Stage 4.2E persistence runtime foundation
df3f897 Prepare Stage 4.2 persistence migrations
```

## Persistence Runtime Audit

### Implemented

Stage 4.2 has the following implemented repository artifacts:

- persistence architecture and ownership planning documents;
- principal mapping specification;
- schema and migration readiness documents;
- real migration files under `supabase/migrations`;
- accepted dev migration execution intake for an Empty Dev Supabase Project;
- isolated TypeScript runtime package under `lib/persistence-runtime`;
- foundation preflight contracts and row models;
- provider adapter abstraction;
- Supabase provider adapter implementation;
- runtime wiring composition;
- simulation record save service;
- simulation history append service;
- simulation draft save/update service;
- deterministic validation catalogs for the above modules.

The current persistence package exports:

- `contracts.ts`
- `foundation.ts`
- `foundation-validation.ts`
- `provider-adapter.ts`
- `provider-adapter-validation.ts`
- `runtime-wiring.ts`
- `runtime-wiring-validation.ts`
- `simulation-record-persistence.ts`
- `simulation-record-persistence-validation.ts`
- `simulation-history-persistence.ts`
- `simulation-history-persistence-validation.ts`
- `simulation-draft-persistence.ts`
- `simulation-draft-persistence-validation.ts`
- `supabase-provider.ts`
- `supabase-provider-validation.ts`
- `index.ts`

### Foundation Only

The following parts are foundation-only:

- persistence row and owner contracts;
- principal resolution preflight;
- owner mismatch rejection;
- client owner-field rejection;
- provider abstraction;
- runtime wiring;
- validation catalogs;
- migration evidence and dev execution intake;
- export/delete compatibility fields in persisted resource models.

Foundation-only means these parts are suitable as internal building blocks and
audit evidence, but they are not product-ready user workflows.

### Runtime Boundary

The current runtime boundary consists of isolated server-oriented services:

- `createPersistenceRuntimeFoundation(...)`
- `createPersistenceProviderAdapter(...)`
- `createSupabasePersistenceProviderAdapter(...)`
- `initializePersistenceRuntimeWiring(...)`
- `saveSimulationRecordFromSimulationResponse(...)`
- `saveSimulationHistoryEntry(...)`
- `saveSimulationDraft(...)`
- `updateSimulationDraft(...)`

These exports form a runtime boundary because they:

- require authenticated runtime context for save paths;
- require provider-reference to principal resolution;
- reject client-supplied owner fields in preflight;
- use `levio_principals.principal_id` as the owner anchor;
- keep provider access server-only;
- expose controlled blocked states;
- keep feature-controlled write services isolated from the product UI/API.

They are not product integration. No application route or UI surface currently
calls them.

### Not Production Ready

Persistence cannot be considered production-ready because:

- there is no application UI integration for save/list/read/update/archive/delete;
- there is no API route integration for persistence operations;
- there is no production Supabase environment validation in this stage;
- there is no recorded production service-role deployment boundary;
- there is no complete product QA across auth, persistence, RLS, and browser flows;
- list/read/archive/delete product services are not implemented as user flows;
- export/delete workflows are only future-compatible, not executable;
- existing save services are controlled isolated exports, not public product behavior;
- Stage 4.3 and Stage 4.4 production workflows still depend on later approved scopes.

## Owner-Scoped Model

### Simulations

Persisted simulations are modeled as `simulation_records`.

Owner model:

- owner field: `owner_principal_id`;
- owner type: `registered_user`;
- canonical owner source: `levio_principals.principal_id`;
- provider reference: Supabase auth user ID stored only as provider reference;
- source type: explicit save or later approved account/import source.

Product meaning:

- a saved simulation is a decision simulation artifact;
- it may contain user input snapshot and deterministic output snapshot;
- it must not become an AI chat transcript;
- it must not store raw AI provider output by default;
- it must remain compatible with future export/deletion controls.

### Drafts

Persisted drafts are modeled as `simulation_drafts`.

Owner model:

- owner field: `owner_principal_id`;
- owner type: `registered_user`;
- draft lifecycle: active, saved, converted, discarded, expired, restricted, deleted;
- default retention posture: short draft lifecycle.

Product meaning:

- a draft is an unfinished decision simulation input/context artifact;
- it may support future autosave or explicit draft save;
- it must not become a chat thread;
- it must not imply AI memory or conversational continuity.

### Future Exports

Future exports must be generated from owner-scoped resources only:

- `simulation_records`;
- eligible `simulation_drafts`;
- eligible `simulation_history_entries`;
- associated lifecycle metadata required for auditability.

Future exports must exclude:

- service-role keys;
- auth tokens;
- provider secrets;
- other-user records;
- raw AI provider responses unless explicitly approved later;
- AI prompts unless explicitly approved later;
- billing records unless a later billing export scope is approved;
- memory/embedding/vector data unless a later memory scope is approved.

### Future Deletions

Future deletions must be lifecycle-aware and owner-scoped:

- deletion must target resources owned by the resolved principal;
- deletion may use soft-delete/restricted/deletion-requested states before hard delete;
- legal hold, retention rules, and active subscription blockers must be respected;
- history entries must preserve required audit semantics unless a later deletion
  policy explicitly approves removal or anonymization;
- deletion must not run from client-supplied owner identifiers.

## Product Integration Boundary

Persistence may support product workflows only inside this boundary:

- explicit save/list/read/update/archive/delete behavior for decision simulation
  artifacts;
- authenticated registered-user ownership;
- server-only provider access;
- principal resolution before owner-scoped operations;
- UI copy that presents saved simulations and drafts, not AI conversations;
- future User Data Controls over saved simulations, drafts, and history entries.

Persistence must not:

- turn Levio into a chat product;
- introduce AI conversation history as the primary product object;
- create an answer engine memory layer;
- bypass the Simulator;
- bypass the Decision Engine;
- store direct AI answers as final product authority;
- connect OpenAI or any model provider;
- connect billing or subscription entitlement checks;
- expose service-role behavior to the client;
- allow client-supplied owner IDs.

## Persistence Invariants

- Persistence is owner-scoped.
- Persistence is server-boundary controlled.
- Persistence is explicit-save oriented unless a later autosave scope is approved.
- Persistence records decision simulation artifacts, not conversations.
- Persistence must preserve export/delete/retention compatibility.
- Persistence must fail closed when auth context, provider reference, principal
  resolution, provider adapter, or ownership is invalid.
- Persistence must not be considered product-ready until UI/API/product QA is
  separately approved and completed.

## Ownership Invariants

- `levio_principals.principal_id` is the canonical owner anchor.
- Supabase `auth.users.id` remains a provider reference only.
- Durable persistence currently supports `registered_user` only.
- Guest persistence and guest-to-account import remain deferred.
- Client-provided owner fields are rejected.
- Resource owner and resolved principal must match.
- Cross-user access must fail closed at server logic and RLS layers.

## Integration Invariants

- No application UI may call persistence services without a separate approved
  product integration scope.
- No API route may expose persistence services without a separate approved API
  scope and QA plan.
- `/api/simulate` must remain behaviorally stable unless a later approved stage
  changes it.
- Persistence must not connect Stage 4.3 User Data Controls automatically.
- Persistence must not connect Stage 4.4 subscriptions automatically.
- Persistence must not connect AI Provider, Prompt Context, OpenAI, or model
  calls.
- Any future integration must preserve Levio as a Decision Simulation Engine.

## Rollback Invariants

- Isolated persistence exports can be disabled by removing product imports or
  feature flags.
- Simulation record persistence can be rolled back by disabling
  `LEVIO_SIMULATION_RECORD_PERSISTENCE_ENABLED`.
- Simulation history persistence can be rolled back by disabling
  `LEVIO_SIMULATION_HISTORY_PERSISTENCE_ENABLED`.
- Simulation draft persistence can be rolled back by disabling
  `LEVIO_SIMULATION_DRAFT_PERSISTENCE_ENABLED`.
- Supabase provider creation remains disabled unless
  `LEVIO_PERSISTENCE_SUPABASE_PROVIDER_ENABLED` and server-only config are
  present.
- No UI/API rollback is required for Stage 4.2L because this stage changes no
  UI/API.
- No data rollback is required for Stage 4.2L because this stage writes no data.
- No migration rollback is required for Stage 4.2L because this stage changes no
  schema or migration file.

## Production Readiness Decision

Decision:

```text
PERSISTENCE PRODUCT INTEGRATION NOT PRODUCTION READY
```

Reason:

- persistence runtime modules exist and are valuable foundation/runtime-boundary
  work;
- the product does not yet expose persistence UI/API behavior;
- production Supabase/auth/persistence validation is not recorded in this stage;
- Stage 4.3 user-data workflows still require explicit product integration
  planning and QA before execution.

## Scope Lock Decision

Stage 4.2L closes the current persistence state as:

```text
FOUNDATION / ISOLATED RUNTIME BOUNDARY COMPLETE
PRODUCT INTEGRATION NOT STARTED
PRODUCTION READINESS NOT APPROVED
```

No runtime code, UI, API route, Supabase runtime connection, OpenAI connection,
billing connection, subscription runtime connection, dependency change, or
product behavior change is approved by this document.

## Next Approved Step

The next approved roadmap step after Stage 4.2L is:

```text
Stage 4.3P User Data Controls Product Integration Scope Lock
```

Purpose:

- define the first production-safe user-data-control product scope;
- decide whether the next work is still preflight-only or may include UI/API
  planning;
- map export/delete/privacy workflows to owner-scoped persistence resources;
- define required legal/privacy copy and QA evidence;
- keep Stage 4.3 from becoming a broad product-data rewrite.

Stage 4.3P must remain documentation/planning-only unless the project owner
explicitly approves implementation. It must not connect OpenAI, billing,
subscription runtime, or AI conversation history.
