# LEVIO STAGE 4.3X PRODUCTION READ PROVIDER FOUNDATION

## Document Status

- Stage: 4.3X - User Data Controls Production Read Provider Foundation.
- Status: implementation complete / read-only provider foundation.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `79bf8d5` - Stage 4.3W User Data Controls API
  Route Validation & Production Read Provider Scope Gate.
- Owner approval: explicit approval to begin Stage 4.3X was provided before
  implementation.
- Runtime code: changed only inside User Data Controls foundation.
- Production route enablement: not approved and not changed.
- Product UI: not changed.
- Export UI: not created.
- Deletion UI: not created.
- Real export packages: not created.
- Storage/download links: not created.
- Deletion writes: not executed.
- Hard delete: not executed.
- Account deletion orchestration: not implemented.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- Product behavior: public simulator behavior not changed.

Stage 4.3X implements a server-only, owner-scoped, fail-closed production read
provider foundation for User Data Controls. It gives the existing Stage 4.3T
read adapter a production-capable provider contract for decision simulation
artifact reads, while keeping API routes disabled unless a later stage approves
route enablement.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Persistence stores decision simulation artifacts only. Stage 4.3X does not read
or expose AI chat history, generic prompt history, assistant conversation logs,
memory data, AI provider logs, embeddings, vectors, billing records, provider
secrets, auth tokens, or other-user records as Levio product objects.

## Audit Inputs

Reviewed before implementation:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_3S_SERVER_WORKFLOW_FOUNDATION.md`
- `LEVIO_STAGE_4_3T_PERSISTENCE_READ_ADAPTER_FOUNDATION.md`
- `LEVIO_STAGE_4_3U_API_SCOPE_AND_PRODUCT_EXPOSURE_GATE.md`
- `LEVIO_STAGE_4_3V_API_ROUTE_FOUNDATION.md`
- `LEVIO_STAGE_4_3W_API_ROUTE_VALIDATION_AND_READ_PROVIDER_SCOPE_GATE.md`
- all available Stage 4.3 documents
- `app/api/user-data-controls/*`
- `lib/user-data-controls/*`
- persistence runtime under `lib/persistence-runtime/*`
- recent git history through `79bf8d5`

## Implemented Files

Stage 4.3X adds:

- `lib/user-data-controls/production-read-provider.ts`
- `lib/user-data-controls/production-read-provider-validation.ts`

Stage 4.3X updates:

- `lib/user-data-controls/api-route-foundation.ts`
- `lib/user-data-controls/index.ts`

## Implemented Foundation

### Production Read Provider Foundation

`createUserDataControlsProductionReadProvider(...)` implements the existing
Stage 4.3T `UserDataControlsPersistenceReadProvider` contract.

It supports:

- `listSimulationRecords(...)`
- `listSimulationDrafts(...)`
- `listSimulationHistoryEntries(...)`

The provider is:

- server-only;
- read-only;
- owner-scoped by canonical `levio_principals.principal_id`;
- disabled by default;
- service-role based when configured;
- dependency-injected for deterministic validation;
- fail-closed on disabled config, missing principal, malformed rows, provider
  errors, and cross-owner returned rows.

### Controlled Configuration

The provider is disabled unless:

```text
LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED=true
```

It requires server-side Supabase configuration:

```text
LEVIO_PERSISTENCE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
LEVIO_PERSISTENCE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY
```

This does not enable production API routes. Route enablement remains controlled
separately by Stage 4.3V:

```text
LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED
```

Stage 4.3X does not set, change, or approve either flag in production.

### Owner-Scoped Persistence Read Model

Every provider query must include:

- `owner_principal_id = canonical principal id`;
- `owner_principal_type = registered_user`.

History reads additionally require:

- `user_visible = true`.

Returned rows are checked again in memory. If any returned row does not belong to
the canonical owner, the provider returns a blocked result.

### Safe Read Access

The provider reads only the minimal planning columns required for:

- manifest-only export planning;
- lifecycle-only deletion planning.

The provider intentionally does not select raw payload columns such as:

- `user_input_snapshot`;
- `deterministic_output_snapshot`;
- `draft_payload`;
- `draft_text_snapshot`;
- `clarification_answers_snapshot`;
- `structured_context_snapshot`;
- `event_payload`;
- `outcome_snapshot`.

Returned row contracts are sanitized with neutral placeholders for raw payload
fields so the Stage 4.3T read adapter can continue to consume stable row shapes
without exposing raw artifact content to API route responses.

### Integration With Existing Foundation

Stage 4.3X integrates with:

- Stage 4.3S server workflow foundation;
- Stage 4.3T persistence read adapter foundation;
- Stage 4.3V API route foundation.

`api-route-foundation.ts` now composes the production read provider into the
default Stage 4.3T read adapter. The provider remains disabled by default, so
route behavior stays fail-closed unless both provider and route flags are
separately approved and configured.

## Runtime Boundaries And Invariants

Stage 4.3X preserves these invariants:

- no client-supplied ownership is accepted;
- no route is enabled by this stage;
- no UI is changed;
- no export file is generated;
- no storage object or download link is created;
- no deletion write is performed;
- no hard delete is performed;
- no account deletion orchestration is performed;
- no OpenAI or AI Provider integration is added;
- no Billing or Subscription Runtime is added;
- no product behavior changes;
- provider output is limited to decision simulation artifact planning rows;
- route responses remain sanitized by Stage 4.3V.

## QA / Validation

Added deterministic validation catalog:

- `runUserDataControlsProductionReadProviderValidation()`

Covered cases:

- disabled feature flag blocks reads;
- missing principal blocks reads;
- successful owner-scoped read;
- wrong owner fails closed;
- empty artifacts return ready empty rows;
- malformed persistence rows fail closed;
- selected columns are sanitized;
- provider errors fail closed;
- export planning read path works without file/storage generation;
- deletion planning read path works without writes/hard delete.

Local verification completed:

```text
npm run lint
npx tsc --noEmit
Stage 4.3X validation catalog: 10 passed / 0 failed
```

## What Remains Blocked

Still blocked after Stage 4.3X:

- production route enablement;
- public product UI;
- Export UI;
- Deletion UI;
- real export package generation;
- export storage/download/expiration workflow;
- deletion lifecycle writes;
- hard deletion;
- account deletion orchestration;
- durable consent ledger;
- retention jobs;
- legal/privacy copy publication;
- browser/API product QA;
- route rate limiting / abuse protection review;
- CSRF/session-hardening review for public deployment;
- OpenAI / Real AI Runtime;
- Billing / Subscription Runtime.

## Completion Decision

Stage 4.3X is complete as a production read provider foundation.

Production User Data Controls are not complete.

Production route enablement is not approved by this stage.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3Y - User Data Controls Read Provider Integration Validation & Route Enablement Gate
```

Purpose:

- validate the production read provider through the route foundation;
- decide whether production route enablement can be approved;
- keep UI, real export packages, deletion writes, hard delete, account deletion,
  OpenAI, billing, and Subscription Runtime out of scope unless separately
  approved.
