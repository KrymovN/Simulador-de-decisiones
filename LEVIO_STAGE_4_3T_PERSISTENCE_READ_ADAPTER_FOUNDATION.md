# LEVIO STAGE 4.3T PERSISTENCE READ ADAPTER FOUNDATION

## Document Status

- Stage: 4.3T - User Data Controls Persistence Read Adapter Foundation.
- Status: implementation complete / server-side read adapter foundation only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `6e96e9a` - Stage 4.3S User Data Controls
  Server Workflow Foundation.
- Owner approval: explicit approval to begin Stage 4.3T was provided before
  implementation.
- Runtime code: changed inside `lib/user-data-controls`.
- UI: not changed.
- API routes: not changed.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- Export UI: not created.
- Deletion UI: not created.
- Real export packages: not created.
- Deletion writes: not executed.
- Account deletion orchestration: not implemented.
- Public product behavior: not changed.

This stage implements the owner-scoped persistence read adapter foundation needed
by the Stage 4.3S server workflow.

It does not expose public controls, create API routes, generate export files,
write deletion lifecycle state, run account deletion, add UI, connect OpenAI, or
connect billing.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Persistence stores decision simulation artifacts only. It must not store or
expose AI conversation history, generic prompt history, assistant conversation
logs, chat transcripts, memory, embeddings, vectors, OpenAI provider logs, or
generic assistant state as Levio product objects.

## Audit Inputs

Reviewed before implementation:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_3S_SERVER_WORKFLOW_FOUNDATION.md`
- Stage 4.2 documents
- Stage 4.3 documents
- current persistence runtime under `lib/persistence-runtime`
- current user data controls runtime under `lib/user-data-controls`
- recent git history through `6e96e9a`

## Implemented Files

Stage 4.3T adds:

- `lib/user-data-controls/persistence-read-adapter.ts`
- `lib/user-data-controls/persistence-read-adapter-validation.ts`

Stage 4.3T updates:

- `lib/user-data-controls/index.ts`

## Implemented Foundation

### Owner-Scoped Persistence Read Adapter

`createUserDataControlsPersistenceReadAdapter(...)` now implements the
`UserDataControlsOwnerScopedArtifactSource` contract introduced by Stage 4.3S.

It supports:

- `listExportResources(...)`
- `listDeletionResources(...)`

The adapter requires:

- enabled rollout configuration;
- active canonical registered-user principal;
- injected read provider with `executionBoundary: "server_only"`;
- non-empty export/deletion scope;
- valid request timestamp;
- owner-scoped rows returned by the provider.

### Safe Server-Only Read Path

Stage 4.3T defines `UserDataControlsPersistenceReadProvider`, an injected
server-only provider contract for reading:

- `simulation_records`;
- `simulation_drafts`;
- `simulation_history_entries`.

The adapter itself performs no Supabase initialization, no direct SQL, no API
route integration, no browser/client reads, and no writes. Future provider
implementations may connect this contract to Supabase only through a separately
approved server-side runtime step.

### Client Ownership Exclusion

The adapter does not accept client-supplied owner fields.

Ownership input comes only from the canonical principal already resolved by the
Stage 4.3S server workflow:

```text
auth session -> provider reference -> levio_principals.principal_id -> read adapter owner scope
```

Rows returned by the provider are rejected if `owner_principal_id` does not
match the canonical principal.

### Principal-Based Artifact Access

Export resource snapshots can be produced for:

- minimal `levio_principal_metadata`;
- saved simulations;
- simulation drafts;
- simulation history entries.

Deletion resource snapshots can be produced for:

- principal lifecycle record, when explicitly scoped;
- saved simulations;
- simulation drafts;
- simulation history entries.

History deletion planning requires owner-scoped parent simulation context. The
adapter blocks history deletion snapshots when parent context cannot be read.

### Export Mapping

Export mappings remain manifest-only inputs for Stage 4.3D export contracts.

Mapped categories:

- `principal_profile`;
- `simulation_record`;
- `simulation_draft`;
- `simulation_history`;
- `decision_provenance`;
- `lifecycle_metadata`.

The adapter does not map forbidden categories such as:

- AI prompts;
- raw AI responses;
- embeddings;
- vectors;
- memory data;
- billing records;
- provider secrets;
- auth tokens;
- service-role data;
- other-user records;
- assistant conversation logs.

### Deletion Mapping

Deletion mappings remain lifecycle-only inputs for Stage 4.3E deletion contracts.

The adapter maps:

- lifecycle state;
- deletion state;
- retention rule;
- legal hold reason;
- parent simulation context for history entries.

It does not:

- execute deletion;
- write database state;
- hard-delete records;
- run jobs;
- orchestrate account deletion.

## Runtime Boundaries And Invariants

Stage 4.3T is:

- server-side only;
- foundation-only;
- dependency-injected;
- owner-scoped by canonical `levio_principals.principal_id`;
- read-only;
- fail-closed;
- rollback-safe;
- isolated from UI, API routes, simulator runtime, OpenAI, billing,
  subscriptions, memory runtime, export packaging, and deletion execution.

Invariants:

- no client-supplied ownership is accepted;
- provider rows must match the canonical owner;
- read provider must be server-only;
- only decision simulation artifacts are mapped;
- export output remains manifest planning only;
- deletion output remains lifecycle planning only;
- no production product behavior changes.

## QA / Validation

Added deterministic validation catalog:

- `runUserDataControlsPersistenceReadAdapterValidation()`

Covered cases:

- disabled adapter blocks export reads;
- read provider is required;
- signed-out workflow is denied before reads;
- export reads decision simulation artifacts only;
- cross-owner record output is denied;
- provider read block propagates;
- deletion reads lifecycle artifacts;
- history deletion requires parent context;
- Stage 4.3S export workflow can use the adapter for manifest-only plans;
- Stage 4.3S deletion workflow can use the adapter for lifecycle-only plans.

Local verification completed:

```text
npm run lint
npx tsc --noEmit
Stage 4.3T validation catalog: 10 passed / 0 failed
```

## What Remains Blocked

Still blocked after Stage 4.3T:

- public User Data Controls API routes;
- public Export UI;
- public Deletion UI;
- product UI changes;
- real export package generation;
- export storage/download/expiration workflow;
- deletion lifecycle writes;
- hard deletion;
- account deletion orchestration;
- durable consent ledger;
- automated retention jobs;
- production Supabase read provider connection;
- production Supabase validation;
- legal/privacy copy publication;
- browser/API product QA;
- OpenAI / Real AI Runtime;
- Billing / Subscription Runtime.

## Rollback

Rollback is safe because Stage 4.3T does not write data, create routes, create
UI, generate files, execute deletion, or change simulator behavior.

Rollback options:

- disable the adapter through configuration;
- remove `persistence-read-adapter` exports from `lib/user-data-controls/index.ts`;
- remove `persistence-read-adapter.ts` and
  `persistence-read-adapter-validation.ts`.

No data rollback, schema rollback, migration rollback, UI rollback, API rollback,
OpenAI rollback, billing rollback, or simulator rollback is required.

## Completion Decision

Stage 4.3T is complete as a server-side persistence read adapter foundation.

Production User Data Controls are not complete.

Public product integration is not approved by this stage.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3U - User Data Controls API Scope & Product Exposure Gate
```

Purpose:

- decide whether API routes may be introduced;
- define API request/response contracts before implementation;
- confirm legal/privacy copy dependency;
- confirm QA and rollback requirements for public exposure;
- keep UI, export package generation, deletion writes, OpenAI, billing, and
  Subscription Runtime out of scope unless separately approved.
