# LEVIO STAGE 4.3S SERVER WORKFLOW FOUNDATION

## Document Status

- Stage: 4.3S - User Data Controls Server Workflow Foundation.
- Status: implementation complete / server-side foundation only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `9c02ae5` - Stage 4.3R Blocker Reality Audit.
- Owner approval: explicit approval to begin implementation was provided before
  this stage.
- Runtime code: changed inside `lib/user-data-controls`.
- UI: not changed.
- API routes: not changed.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- Export UI: not created.
- Deletion UI: not created.
- Product behavior: public simulator behavior not changed.

This stage implements the minimum server-side workflow foundation needed before
future User Data Controls can become product workflows.

It does not expose public controls, create export files, execute deletion, add
routes, add UI, connect OpenAI, connect billing, or change simulator behavior.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

User Data Controls remain support infrastructure around owner-scoped decision
simulation artifacts. They do not create AI chat history, generic prompt
history, assistant conversation logs, memory runtime, OpenAI coupling, billing
coupling, or generic assistant behavior.

## Audit Inputs

Reviewed before implementation:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_2L_PERSISTENCE_RUNTIME_STATE_CLOSURE.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3P_USER_DATA_CONTROLS_PRODUCT_INTEGRATION_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3Q_USER_DATA_CONTROLS_READINESS_PLAN.md`
- `LEVIO_STAGE_4_3R_USER_DATA_CONTROLS_IMPLEMENTATION_GATE.md`
- `LEVIO_STAGE_4_3R_BLOCKER_REALITY_AUDIT.md`
- all available Stage 4.3 documents
- runtime auth layer under `lib/auth`
- persistence runtime under `lib/persistence-runtime`
- user data controls runtime under `lib/user-data-controls`

## Implemented Files

Stage 4.3S adds:

- `lib/user-data-controls/server-workflow.ts`
- `lib/user-data-controls/server-workflow-validation.ts`

Stage 4.3S updates:

- `lib/user-data-controls/index.ts`

## Implemented Foundation

### Canonical Principal Resolution Path

`createUserDataControlsServerWorkflowFoundation(...)` now provides:

- `resolveCanonicalPrincipal(...)`
- server-side auth context validation;
- Supabase provider-reference validation;
- persistence runtime principal resolution through
  `PersistenceRuntimeWiring.resolvePrincipal(...)`;
- conversion from provider-derived auth principal ID to canonical
  `levio_principals.principal_id`;
- downstream canonical auth context for existing Stage 4.3 contracts.

Important boundary:

- Supabase `auth.users.id` remains provider reference only.
- `levio_principals.principal_id` is the only accepted owner anchor for data
  control workflows.

### Ownership Verification Workflow

The server workflow now provides:

- `verifyOwnership(...)`
- fail-closed rejection of client-supplied owner/provider fields;
- optional resource owner verification;
- persistence preflight validation before control planning.

Ownership is never proven by:

- client-supplied `principalId`;
- client-supplied `ownerPrincipalId`;
- client-supplied provider reference;
- record ID alone;
- subscription status;
- AI provider state.

### Owner-Scoped Artifact Access Workflow

The server workflow now provides:

- `accessOwnerScopedArtifacts(...)`
- server-only injected artifact source contract;
- export artifact access path;
- deletion artifact access path;
- owner-scope verification for every returned resource and parent record.

This is foundation only. It defines the server workflow and adapter contract for
future persistence read adapters. It does not create product API routes, UI, or
production Supabase read integration.

### Export Workflow Foundation Contracts

The server workflow now provides:

- `planExport(...)`
- canonical owner resolution before export planning;
- owner-scoped artifact discovery through the injected server-only source;
- existing Stage 4.3 export foundation evaluation;
- manifest-only export package planning.

Export remains:

- preflight-only;
- read-only at the workflow contract level;
- no file generation;
- no archive generation;
- no storage write;
- no download URL;
- no public UI/API.

### Deletion Workflow Foundation Contracts

The server workflow now provides:

- `planDeletion(...)`
- canonical owner resolution before deletion planning;
- server-side owner-scoped artifact discovery;
- existing Stage 4.3 deletion foundation evaluation;
- lifecycle-only deletion planning.

Deletion remains:

- preflight-only;
- no hard delete;
- no database write;
- no background job;
- no account deletion orchestration;
- no public UI/API.

## Runtime Boundaries And Invariants

The Stage 4.3S server workflow is:

- disabled by explicit configuration when configured that way;
- fail-closed by default;
- server-side only;
- dependency-injected for persistence runtime and artifact source;
- rollback-safe by export removal or disabling the workflow foundation;
- isolated from UI, dashboard, API routes, simulator runtime, OpenAI, billing,
  subscriptions, memory runtime, and product behavior.

Runtime invariants:

- canonical principal resolution is required before any control planning;
- owner-scoped artifact access requires server-only source execution;
- export workflow can only produce manifest-only preflight plans;
- deletion workflow can only produce lifecycle-only preflight plans;
- client owner fields are rejected before principal resolution or control
  planning;
- cross-owner resource output from an artifact source is blocked.

## QA / Validation

Added deterministic validation catalog:

- `runUserDataControlsServerWorkflowValidation()`

Covered cases:

- disabled workflow blocks;
- signed-out context is denied;
- provider reference resolves to canonical Levio principal;
- client owner fields are rejected;
- owner mismatch is denied;
- artifact source is required;
- artifact source owner mismatch is denied;
- export plan is manifest-only and creates no files/storage;
- forbidden export categories are blocked;
- deletion plan is lifecycle-only and executes no hard delete;
- deletion confirmation is required.

Local verification completed:

```text
npm run lint
npx tsc --noEmit
Stage 4.3S validation catalog: 11 passed / 0 failed
```

## What Remains Blocked

Still blocked after Stage 4.3S:

- public Export UI;
- public Deletion UI;
- API routes for user data controls;
- real export package generation;
- export storage/download/expiration workflow;
- real deletion lifecycle transition writes;
- hard deletion;
- account deletion orchestration;
- durable consent ledger;
- automated retention jobs;
- production Supabase validation;
- legal/privacy copy publication;
- product QA across browser/API flows;
- billing/subscription coupling;
- OpenAI or Real AI Runtime coupling.

## Rollback

Rollback is safe because Stage 4.3S does not write data, create routes, create UI,
generate files, execute deletion, or change simulator behavior.

Rollback options:

- disable the server workflow foundation through configuration;
- remove `server-workflow` exports from `lib/user-data-controls/index.ts`;
- remove `server-workflow.ts` and `server-workflow-validation.ts`.

No data rollback, schema rollback, migration rollback, UI rollback, API rollback,
OpenAI rollback, billing rollback, or simulator rollback is required.

## Completion Decision

Stage 4.3S is complete as a server-side workflow foundation.

Production User Data Controls are not complete.

Public product integration is not approved by this stage.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3T - User Data Controls Persistence Read Adapter Foundation
```

Purpose:

- implement a real server-only owner-scoped artifact source adapter for export
  and deletion planning;
- keep UI/API out of scope unless separately approved;
- preserve `levio_principals.principal_id` as the canonical owner anchor;
- keep export as manifest-only until package generation is separately approved;
- keep deletion lifecycle-only until write execution is separately approved.
