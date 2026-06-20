# LEVIO STAGE 4.3W API ROUTE VALIDATION AND READ PROVIDER SCOPE GATE

## Document Status

- Stage: 4.3W - User Data Controls API Route Validation & Production Read
  Provider Scope Gate.
- Status: governance gate complete / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `2171861` - Stage 4.3V User Data Controls API
  Route Foundation.
- Runtime code: not changed.
- Production read-provider code: not written.
- Supabase runtime: not connected.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- UI: not changed.
- New public endpoints: not created.
- Product behavior: not changed.

This stage validates the current API route foundation and defines the scope for a
future production read provider. It does not enable production routes, connect
Supabase runtime reads, generate export packages, execute deletion writes, create
UI, or expose new product behavior.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

User Data Controls may operate only around owner-scoped decision simulation
artifacts. They must not create or expose AI chat history, generic prompt
history, assistant conversation logs, memory data, AI provider logs, or generic
assistant state as product objects.

## Audit Inputs

Reviewed before this gate:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_3S_SERVER_WORKFLOW_FOUNDATION.md`
- `LEVIO_STAGE_4_3T_PERSISTENCE_READ_ADAPTER_FOUNDATION.md`
- `LEVIO_STAGE_4_3U_API_SCOPE_AND_PRODUCT_EXPOSURE_GATE.md`
- `LEVIO_STAGE_4_3V_API_ROUTE_FOUNDATION.md`
- all available Stage 4.3 documents
- `app/api/user-data-controls/*`
- `lib/user-data-controls/*`
- recent git history through `2171861`

## Current API Route Foundation Audit

Implemented API route foundation:

- `POST /api/user-data-controls/export`
- `POST /api/user-data-controls/deletion`

The route foundation is implemented through:

- `app/api/user-data-controls/export/route.ts`
- `app/api/user-data-controls/deletion/route.ts`
- `lib/user-data-controls/api-route-foundation.ts`
- `lib/user-data-controls/api-route-foundation-validation.ts`

Validated properties:

| Area | Current Evidence | Gate Result |
| --- | --- | --- |
| Authenticated access | Routes call server-only auth context through the route foundation and Stage 4.3S workflow | Sufficient for foundation |
| Owner-scoped guarantees | Client owner fields are rejected; Stage 4.3S canonical principal and ownership checks are used | Sufficient for foundation |
| Principal resolution path | `auth session -> provider reference -> levio_principals.principal_id -> owner-scoped workflow` | Sufficient for foundation |
| Fail-closed behavior | Disabled flag, invalid JSON, empty scope, forged owner input, signed-out auth, workflow block, cross-owner source output all block | Sufficient for foundation |
| Feature flag protection | `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED` disables route behavior by default | Sufficient for foundation |
| Response sanitization | Responses expose request/status/count/category metadata only | Sufficient for foundation |
| Export planning path | Export response is `manifest_only`, generation `not_started`, no file or storage write | Sufficient for foundation |
| Deletion planning path | Deletion response is lifecycle-only, hard delete false, database write false | Sufficient for foundation |
| Production read provider | Not implemented; no Supabase read connection exists for route-backed artifacts | Still blocked |
| Production route enablement | Not approved; route foundation must remain disabled unless separately approved | Still blocked |

## Owner-Scoped Guarantees

The current foundation provides these guarantees:

- routes are `POST` only;
- route handlers are server-only route handlers;
- public unauthenticated access is blocked;
- client-supplied owner, principal, provider, and email fields are rejected;
- Stage 4.3S resolves canonical `levio_principals.principal_id`;
- Stage 4.3S verifies ownership before artifact planning;
- Stage 4.3T adapter requires a server-only read provider;
- artifact source owner mismatch fails closed;
- response payloads do not contain raw persistence rows.

Production read-provider implementation must preserve these guarantees without
relaxation.

## Principal Resolution Path

The approved path remains:

```text
readServerAuthSession()
  -> Supabase provider reference
  -> PersistenceRuntimeWiring.resolvePrincipal(...)
  -> levio_principals.principal_id
  -> Stage 4.3S owner-scoped workflow
  -> Stage 4.3T read adapter
  -> sanitized route response
```

The future production read provider must not:

- accept `principal_id` from request body;
- accept `owner_id` from request body;
- accept email as owner proof;
- accept record ID as authorization;
- use Supabase `auth.users.id` as the product owner ID;
- bypass `levio_principals.principal_id`.

## Data Allowed To Read

Future production read provider may read only the minimum fields needed to
produce Stage 4.3T snapshots for the resolved owner:

| Resource | Allowed Read Scope | Purpose |
| --- | --- | --- |
| `levio_principals` | Canonical principal metadata needed for active owner verification and optional export/deletion planning | Principal resolution and owner metadata snapshot |
| `simulation_records` | Owner-scoped decision simulation artifact metadata and approved snapshot fields already modeled by Stage 4.2/4.3T | Export planning and deletion planning |
| `simulation_drafts` | Owner-scoped draft artifact metadata and approved snapshot fields already modeled by Stage 4.2/4.3T | Export planning and deletion planning |
| `simulation_history_entries` | Owner-scoped user-visible history metadata plus parent context required for deletion planning | Export planning and deletion planning |

Allowed read fields must map only to existing Stage 4.3T row contracts and
snapshot contracts. Any additional field requires separate approval.

## Data Forbidden To Read

Future production read provider must not read:

- auth tokens;
- session cookies;
- provider secrets;
- service-role data beyond server-side connection credentials;
- other-user rows;
- unrestricted database rows;
- billing records;
- subscription internals;
- raw AI prompts;
- raw AI responses;
- AI provider logs;
- embeddings;
- vectors;
- memory data;
- AI chat history;
- generic prompt history;
- assistant conversation logs;
- internal operational logs;
- backup contents;
- legal/internal operator notes;
- storage objects;
- export package files;
- deletion execution records not separately approved.

## Mandatory Checks Before Read Access

Before any production read provider returns rows, it must prove:

- the API route feature flag is enabled only in the approved environment;
- route method is `POST`;
- server auth context is authenticated and active;
- canonical principal resolution succeeded;
- `levio_principals.principal_id` is active and registered-user scoped;
- provider reference status is active;
- principal deletion state is active;
- requested scope is non-empty and supported;
- no client-supplied owner field is accepted;
- every query is constrained by `owner_principal_id`;
- every returned row has `owner_principal_id` equal to the canonical principal;
- every returned row has `owner_principal_type = registered_user`;
- history deletion planning includes owner-scoped parent context;
- legal hold / deletion state / retention rule fields are read for planning but
  not mutated;
- no write, storage, export file, deletion, billing, subscription, OpenAI, or UI
  side effect occurs.

## Production Read Provider Scope Matrix

| Provider Area | In Scope For Next Foundation | Out Of Scope | Required Evidence |
| --- | --- | --- | --- |
| Execution boundary | Server-only provider implementing `UserDataControlsPersistenceReadProvider` | Browser/client provider, public direct DB reads | `executionBoundary: "server_only"` validation |
| Principal dependency | Uses resolved `levio_principals.principal_id` as input | Client owner input, provider ID as product owner | Principal resolution test |
| Saved simulations | Read owner-scoped `simulation_records` rows only | Writes, cross-owner reads, full-table reads | Owner filter and returned-row ownership test |
| Drafts | Read owner-scoped `simulation_drafts` rows only | Draft writes, autosave changes, cross-owner reads | Owner filter and returned-row ownership test |
| History entries | Read owner-scoped `simulation_history_entries` rows only | Non-user-visible operational logs, cross-owner reads | Owner filter and parent context test |
| Parent context | Read parent `simulation_records` only for same owner when history deletion planning needs it | Parent rows from another owner | Parent-owner validation |
| Export planning | Supply Stage 4.3T export snapshots | Generate files, storage writes, download URLs | Manifest-only route validation |
| Deletion planning | Supply Stage 4.3T deletion snapshots | Lifecycle writes, hard delete, jobs, account deletion | Lifecycle-only route validation |
| Error handling | Return blocked provider result fail-closed | Throw raw DB errors to route response | Sanitized block response test |
| Observability | Minimal non-payload diagnostics if later approved | Raw artifact payload logs | Logging boundary review |

## Validation Matrix

| Validation Area | Required Cases Before Production Read Provider Merge | Status After 4.3W |
| --- | --- | --- |
| Route disabled | Disabled flag blocks route execution | Covered by 4.3V |
| Method guard | Non-POST requests blocked | Covered by 4.3V |
| Auth guard | Signed-out and expired contexts blocked | Partially covered; expired session case still required |
| Owner injection | Request body owner/principal/provider/email fields rejected | Covered by 4.3V |
| Principal resolution | Provider reference resolves to exactly one active Levio principal | Covered by 4.3S foundation; production provider evidence required |
| Read provider boundary | Provider is server-only | Covered by 4.3T contract; production provider evidence required |
| Owner filter | Queries are constrained by canonical principal | Required for next implementation |
| Returned-row ownership | Cross-owner returned rows fail closed | Covered by 4.3V for artifact source; production provider test required |
| Export route | Manifest-only sanitized summary | Covered by 4.3V |
| Deletion route | Lifecycle-only sanitized summary | Covered by 4.3V |
| History parent context | History deletion planning requires same-owner parent context | Covered by 4.3T foundation; production provider test required |
| Forbidden data | AI/chat/billing/secrets/storage data not read or returned | Required for next implementation |
| Provider failures | DB/provider errors produce sanitized blocked responses | Required for next implementation |
| No side effects | No writes, files, storage links, deletion execution, UI, OpenAI, billing | Required for next implementation |

## Rollback Matrix

| Failure Mode | Rollback Action | Data Rollback Needed | Notes |
| --- | --- | --- | --- |
| Route foundation regression | Disable `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED` | No | Routes fail closed |
| Production read provider returns blocked results | Disable provider or route flag | No | No writes should have occurred |
| Cross-owner read evidence appears | Disable provider immediately | No if no writes occurred | Treat as security blocker before production enablement |
| Response exposes disallowed fields | Disable route flag and remove provider exposure | No if no writes occurred | Requires response contract fix before re-enable |
| Provider reads forbidden table/category | Disable provider and reject implementation | No if read-only and no logs retained | Requires scope correction |
| Export package side effect appears | Disable route/provider and stop stage | Yes, if file/storage object was created | Out of scope for provider foundation |
| Deletion write side effect appears | Disable route/provider and stop stage | Yes, if mutation occurred | Out of scope for provider foundation |
| Supabase config invalid | Provider must fail closed | No | No fallback to client reads |
| Legal/privacy scope changes | Keep route disabled | No | Requires governance update |

## Gate Decision

Gate status:

```text
GO for Stage 4.3X Production Read Provider Foundation.
NO-GO for production route enablement.
NO-GO for public UI exposure.
NO-GO for real export package generation.
NO-GO for deletion writes, hard delete, or account deletion orchestration.
```

Rationale:

- Stage 4.3V API route foundation is implemented and validated at the foundation
  level.
- Owner-scoped, principal-based, fail-closed and sanitized response boundaries
  are sufficient to scope a production read-provider foundation.
- The actual production read provider is still missing and must be implemented
  before any route-backed user artifact reads can become production-capable.
- Production route enablement requires additional validation after the provider
  exists.

## Remaining Blockers

The following remain blocked after Stage 4.3W:

- production read provider implementation;
- production Supabase read-provider connection;
- production Supabase validation;
- route enablement in production;
- rate limiting / abuse protection review;
- CSRF/session-hardening review for public deployment;
- legal/privacy copy publication;
- browser/API product QA;
- public product UI;
- real export package generation;
- export storage/download/expiration workflow;
- deletion lifecycle writes;
- hard deletion;
- account deletion orchestration;
- durable consent ledger;
- retention jobs;
- OpenAI / Real AI Runtime;
- Billing / Subscription Runtime.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3X - User Data Controls Production Read Provider Foundation
```

This is an implementation stage, not another governance stage, if the owner
explicitly approves read-provider foundation work. It must remain read-only,
server-only, owner-scoped, fail-closed, and limited to decision simulation
artifacts.
