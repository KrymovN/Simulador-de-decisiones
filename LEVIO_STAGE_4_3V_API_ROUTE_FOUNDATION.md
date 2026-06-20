# LEVIO STAGE 4.3V API ROUTE FOUNDATION

## Document Status

- Stage: 4.3V - User Data Controls API Route Foundation.
- Status: implementation complete / authenticated API route foundation only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `d8f3ecb` - Stage 4.3U User Data Controls API
  Scope & Product Exposure Gate.
- Owner approval: explicit approval to begin Stage 4.3V was provided before
  implementation.
- Runtime code: changed only for User Data Controls API route foundation.
- Product UI: not changed.
- Export UI: not created.
- Deletion UI: not created.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- Real export packages: not created.
- Export storage/download links: not created.
- Deletion writes: not executed.
- Hard delete: not executed.
- Account deletion orchestration: not implemented.
- Public unauthenticated endpoints: not created.
- Product behavior: public simulator behavior not changed.

Stage 4.3V implements narrow server-side API route foundation for future User
Data Controls. It creates authenticated, owner-scoped route handlers for export
request planning and deletion request planning, but keeps the routes feature
flagged and fail-closed by default.

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
- `LEVIO_STAGE_4_3S_SERVER_WORKFLOW_FOUNDATION.md`
- `LEVIO_STAGE_4_3T_PERSISTENCE_READ_ADAPTER_FOUNDATION.md`
- `LEVIO_STAGE_4_3U_API_SCOPE_AND_PRODUCT_EXPOSURE_GATE.md`
- all available Stage 4.3 documents
- current `lib/user-data-controls/*`
- existing Next route handlers under `app/api` and `app/auth/callback`
- recent git history through `d8f3ecb`

`AGENTS.md` requires reading `node_modules/next/dist/docs/` before writing Next
code. That directory is not present in the installed Next package in this
workspace. The implementation therefore followed the existing local route
handler patterns and installed Next 14.2.5 route-handler behavior.

## Implemented Files

Stage 4.3V adds:

- `lib/user-data-controls/api-route-foundation.ts`
- `lib/user-data-controls/api-route-foundation-validation.ts`
- `app/api/user-data-controls/export/route.ts`
- `app/api/user-data-controls/deletion/route.ts`

Stage 4.3V updates:

- `lib/user-data-controls/index.ts`

## Implemented Foundation

### API Route Foundation

Stage 4.3V creates two route handlers:

- `POST /api/user-data-controls/export`
- `POST /api/user-data-controls/deletion`

Both routes call the server-only foundation in
`lib/user-data-controls/api-route-foundation.ts`.

The routes are:

- Node runtime only;
- dynamic;
- `POST` only;
- authenticated-only;
- owner-scoped;
- fail-closed;
- response-sanitized;
- rollback-safe through route disablement;
- isolated from UI, simulator runtime, OpenAI, billing, subscriptions, memory,
  export file generation, storage links, deletion writes, and account deletion.

### Feature Flag And Rollback

Routes are disabled unless:

```text
LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED=true
```

When disabled, routes return a blocked response and do not execute workflow
planning.

Rollback posture:

- disable `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED`;
- remove the Stage 4.3V route files;
- remove Stage 4.3V exports from `lib/user-data-controls/index.ts`;
- no data rollback is required because no data is written;
- no schema rollback is required because no schema changed;
- no UI rollback is required because no UI changed.

### Authenticated Owner-Scoped Access

The route foundation depends on:

- `readServerAuthSession()`;
- Stage 4.3S canonical principal resolution;
- Stage 4.3S ownership verification;
- Stage 4.3S owner-scoped artifact access;
- Stage 4.3T owner-scoped persistence read adapter contract.

Routes reject:

- signed-out contexts;
- expired sessions;
- missing auth context;
- client-supplied owner fields;
- client-supplied principal fields;
- provider references from request bodies;
- email fields from request bodies;
- cross-owner artifact source output.

Canonical owner resolution remains:

```text
auth session -> provider reference -> levio_principals.principal_id -> owner-scoped workflow
```

### Export Request Foundation

The export route accepts a scope object for:

- principal metadata;
- saved simulations;
- simulation drafts;
- simulation history.

The route returns a sanitized manifest-only foundation summary:

- request ID;
- preflight execution;
- `manifest_only` package format;
- package generation `not_started`;
- included/excluded counts;
- included resource categories;
- excluded forbidden categories;
- safety evidence.

It does not return raw persistence rows, user payloads, prompts, AI responses,
provider logs, embeddings, memory, chat history, conversation logs, storage
links, files, archives, JSON export payloads, or CSV export payloads.

### Deletion Request Foundation

The deletion route accepts a scope object for decision simulation artifacts only:

- saved simulations;
- simulation drafts;
- simulation history.

The route requires `confirmationAcknowledged: true`.

The route explicitly blocks:

- `account_deletion_planning`;
- principal/account deletion scope;
- hard delete;
- deletion writes;
- background jobs;
- account deletion orchestration.

Allowed deletion responses are lifecycle-only summaries:

- request ID;
- preflight execution;
- resource deletion planning;
- planned entry count;
- blocked entry count;
- planned action counts;
- affected resource categories;
- hard delete `false`;
- database write `false`;
- safety evidence.

## Runtime Boundaries And Invariants

Stage 4.3V preserves these invariants:

- API routes do not call OpenAI or any AI Provider.
- API routes do not connect billing or Subscription Runtime.
- API routes do not change product UI.
- API routes do not change public simulator behavior.
- API routes do not expose generic assistant behavior.
- Persistence remains decision simulation artifact persistence only.
- The route foundation does not store chat history, conversation logs, generic
  prompt history, raw AI prompts, raw AI responses, embeddings, vectors, memory,
  billing records, service-role data, auth tokens, provider secrets, or
  other-user records.
- Client-supplied ownership is never accepted as authorization.
- Default production behavior remains fail-closed until explicitly enabled and
  backed by an approved server-only read provider.

## QA / Validation

Added deterministic validation catalog:

- `runUserDataControlsApiRouteFoundationValidation()`

Covered cases:

- disabled route fails closed;
- unsupported methods are rejected;
- export rejects client owner input;
- export requires authenticated context;
- export returns manifest-only sanitized summary;
- deletion requires confirmation;
- deletion blocks account scope;
- deletion rejects client owner input;
- deletion returns lifecycle-only sanitized summary;
- cross-owner artifact source output fails closed.

Local verification completed:

```text
npm run lint
npx tsc --noEmit
Stage 4.3V validation catalog: 10 passed / 0 failed
```

## What Remains Blocked

Still blocked after Stage 4.3V:

- route enablement in production;
- production Supabase read-provider connection for user data controls;
- production Supabase validation;
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
- OpenAI / Real AI Runtime;
- Billing / Subscription Runtime.

## Completion Decision

Stage 4.3V is complete as an authenticated, owner-scoped, server-only API route
foundation.

Production User Data Controls are not complete.

Public product exposure is not approved by this stage.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3W - User Data Controls API Route Validation & Production Read Provider Scope Gate
```

Purpose:

- validate the API route foundation against the current runtime boundary;
- decide whether production route enablement is allowed;
- decide whether a server-only Supabase read provider for route-backed user data
  controls may be connected;
- keep UI, real export packages, deletion writes, hard delete, account deletion,
  OpenAI, billing, and Subscription Runtime out of scope unless separately
  approved.
