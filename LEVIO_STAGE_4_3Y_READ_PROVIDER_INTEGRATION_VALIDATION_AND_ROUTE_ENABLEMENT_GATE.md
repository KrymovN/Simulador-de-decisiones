# LEVIO STAGE 4.3Y READ PROVIDER INTEGRATION VALIDATION AND ROUTE ENABLEMENT GATE

## Document Status

- Stage: 4.3Y - User Data Controls Read Provider Integration Validation &
  Route Enablement Gate.
- Status: governance gate complete / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `1588323` - Stage 4.3X User Data Controls
  Production Read Provider Foundation.
- Runtime code: not changed.
- Production route enablement: not approved and not changed.
- Product UI: not changed.
- API routes: not changed.
- New endpoints: not created.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- Real export packages: not created.
- Storage/download links: not created.
- Deletion writes: not executed.
- Hard delete: not executed.
- Account deletion orchestration: not implemented.
- Product behavior: public simulator behavior not changed.

Stage 4.3Y audits the integration chain from Stage 4.3S, Stage 4.3T, Stage
4.3V, and Stage 4.3X and decides whether future route enablement is ready.

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
simulation artifacts. They must not create or expose AI chat history, generic
prompt history, assistant conversation logs, memory data, AI provider logs, or
generic assistant state as product objects.

## Audit Inputs

Reviewed before this gate:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- all available Stage 4.3 documents
- `LEVIO_STAGE_4_3X_PRODUCTION_READ_PROVIDER_FOUNDATION.md`
- `app/api/user-data-controls/*`
- `lib/user-data-controls/*`
- recent git history through `1588323`

## Integration Audit

| Stage | Implemented Foundation | Integration Evidence | Route Enablement Impact |
| --- | --- | --- | --- |
| Stage 4.3S | Canonical principal resolution, ownership verification, owner-scoped artifact workflow, manifest-only export planning, lifecycle-only deletion planning | `server-workflow.ts` requires authenticated active session, resolves provider reference through persistence runtime, rejects client owner fields, blocks cross-owner artifact output | Necessary and structurally present |
| Stage 4.3T | Server-only persistence read adapter and owner-scoped artifact mapping | `persistence-read-adapter.ts` requires canonical active registered-user principal, server-only provider, returned-row owner checks, parent context for history deletion planning | Necessary and structurally present |
| Stage 4.3V | Authenticated export/deletion API route foundation | Route foundation is POST-only, feature-flagged, fail-closed, sanitized, rejects client owner fields, creates no files and performs no writes | Necessary and structurally present, but route enablement remains disabled |
| Stage 4.3X | Production read provider foundation | Provider is server-only, disabled by default, owner-scoped by canonical `levio_principals.principal_id`, reads minimal planning columns, sanitizes row contracts, fails closed | Necessary and structurally present, but not route-enabled in production |

## Principal Resolution Chain

Approved chain:

```text
readServerAuthSession()
  -> authenticated active Supabase session context
  -> provider reference validation
  -> PersistenceRuntimeWiring.resolvePrincipal(...)
  -> canonical levio_principals.principal_id
  -> Stage 4.3S ownership verification
  -> Stage 4.3T owner-scoped artifact adapter
  -> Stage 4.3X production read provider
  -> Stage 4.3V sanitized route response
```

Current assessment:

- The chain is implemented as foundation.
- Client-supplied ownership is rejected before planning.
- Supabase `auth.users.id` remains provider reference only.
- `levio_principals.principal_id` remains the only product owner anchor.
- Production route enablement still lacks end-to-end evidence with the route
  flag and provider flag enabled together in an approved target environment.

## Ownership Guarantees

Current guarantees:

- request bodies cannot provide owner, principal, provider, or email fields;
- Stage 4.3S verifies the authenticated principal before artifact planning;
- Stage 4.3T rejects non-server providers and cross-owner rows;
- Stage 4.3X constrains provider queries by `owner_principal_id` and
  `owner_principal_type`;
- Stage 4.3X checks returned rows again before handing them to the adapter;
- Stage 4.3V exposes sanitized summary/count/category responses, not raw rows.

Remaining evidence gap:

- route-level integration has not been validated against a real configured
  production-like Supabase read provider target with both rollout flags enabled.

## Read Provider Boundaries

Allowed read boundary:

- `simulation_records`;
- `simulation_drafts`;
- `simulation_history_entries`;
- minimum planning fields needed for manifest-only export planning and
  lifecycle-only deletion planning.

Forbidden read boundary:

- AI chat history;
- generic prompt history;
- assistant conversation logs;
- raw AI prompts;
- raw AI responses;
- AI provider logs;
- embeddings;
- vectors;
- memory data;
- billing records;
- subscription internals;
- auth tokens;
- provider secrets;
- service-role data in responses;
- other-user rows;
- storage objects;
- export package files;
- deletion execution records not separately approved.

Stage 4.3X satisfies the foundation boundary by selecting minimal columns and
sanitizing row contracts, but route enablement still requires real target
validation before public use.

## API Route Protection

Current route protection:

- routes are `POST` only;
- route handlers run on Node runtime;
- route behavior is disabled unless
  `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED=true`;
- route planning depends on authenticated server auth context;
- invalid JSON and invalid scopes fail closed;
- owner/principal/provider/email fields in the request body fail closed;
- export output is manifest-only and sanitized;
- deletion output is lifecycle-only and sanitized;
- no route writes, file generation, storage link creation, hard delete, or
  account deletion orchestration exist.

Route enablement blockers:

- no route-level rate limiting or abuse-protection evidence;
- no CSRF/origin/session-hardening evidence for public deployment;
- no route-through-provider validation against an approved production-like
  target with both flags enabled;
- no rollback rehearsal evidence for route/provider flag disablement after
  partial rollout.

## Feature Flag Behavior

| Flag | Current Role | Current Status | Enablement Note |
| --- | --- | --- | --- |
| `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED` | Enables route foundation behavior | Disabled by default | Must remain disabled until a later gate approves route enablement |
| `LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED` | Enables production read provider | Disabled by default | May not be treated as route enablement by itself |

Both flags must be independently controlled. Enabling the provider without the
route flag must keep public route behavior blocked. Enabling the route flag
without a ready provider must fail closed.

## Sanitization Guarantees

Current response guarantees:

- route responses include request IDs, status, counts, category lists, planned
  action counts, and safety evidence;
- route responses do not expose raw persistence rows;
- route responses do not expose raw simulation payloads;
- route responses do not expose AI prompts, AI responses, chat logs, generic
  prompt history, embeddings, vectors, memory, billing records, provider
  secrets, auth tokens, storage links, export package content, or deletion
  execution internals;
- provider row contracts use neutral placeholders for raw payload fields before
  Stage 4.3T mapping.

Remaining validation needed:

- route-through-provider sanitized response checks in an approved integration
  target, including provider error cases and malformed-row cases.

## Fail-Closed Guarantees

Implemented fail-closed states:

- disabled route flag;
- disabled provider flag;
- missing provider configuration;
- invalid provider URL;
- non-server provider boundary;
- invalid JSON;
- empty or unsupported scope;
- client owner input;
- missing auth context;
- signed-out context;
- inactive session;
- invalid provider reference;
- unresolved canonical principal;
- inactive principal;
- provider mismatch;
- owner mismatch;
- non-server artifact source;
- provider read error;
- malformed provider rows;
- cross-owner returned rows;
- missing parent context for history deletion planning;
- deletion request without confirmation;
- principal/account deletion scope from public deletion route.

Remaining fail-closed validation needed:

- expired/revoked session evidence through the public route foundation;
- production-like provider outage evidence through route responses;
- flag rollback evidence after a simulated partial enablement.

## Route Enablement Readiness Matrix

| Requirement | Current Evidence | Gate Status |
| --- | --- | --- |
| Route foundation exists | Stage 4.3V implemented export/deletion route foundation | Ready |
| Production read provider exists | Stage 4.3X implemented disabled-by-default provider foundation | Ready |
| Canonical principal chain exists | Stage 4.3S resolves through persistence runtime to `levio_principals.principal_id` | Ready as foundation |
| Owner-scoped reads | Stage 4.3T and 4.3X both validate owner scope | Ready as foundation |
| Sanitized route responses | Stage 4.3V response contract is summary-only | Ready as foundation |
| Fail-closed route flag | Route flag blocks route behavior by default | Ready |
| Fail-closed provider flag | Provider flag blocks reads by default | Ready |
| Real route-through-provider validation | No approved production-like run with both flags enabled is recorded | Blocker |
| Rate limiting / abuse protection | No route-specific evidence is recorded | Blocker |
| CSRF/origin/session hardening | No public-deployment evidence is recorded | Blocker |
| Browser/API product QA | Not recorded for enabled route workflow | Blocker |
| Rollback rehearsal | Flag rollback is designed but not rehearsed with route/provider integration | Blocker |

## Integration Validation Matrix

| Validation Area | Required Result | Current Status |
| --- | --- | --- |
| Stage 4.3S -> Stage 4.3T | Canonical principal is the only owner input into adapter | Passed as foundation |
| Stage 4.3T -> Stage 4.3X | Adapter receives server-only provider and canonical principal | Passed as foundation |
| Stage 4.3X -> Stage 4.3V | Default route workflow composes production provider into adapter | Structurally present |
| Route disabled | Public route behavior is blocked when route flag is off | Passed as foundation |
| Provider disabled | Route planning fails closed when provider flag is off | Passed as foundation through provider/adapter behavior |
| Export planning | Manifest-only, no file/storage generation | Passed as foundation |
| Deletion planning | Lifecycle-only, no writes/hard delete | Passed as foundation |
| Malformed rows | Provider blocks malformed rows before mapping | Passed as foundation |
| Cross-owner rows | Provider/adapter/workflow block owner mismatch | Passed as foundation |
| Real target end-to-end | Enabled route + enabled provider + authenticated session + seeded owner artifacts | Missing |

## Security Validation Matrix

| Security Area | Expected Control | Current Status |
| --- | --- | --- |
| Authentication | Active authenticated session required | Foundation present |
| Authorization | Canonical `levio_principals.principal_id` required | Foundation present |
| Client owner injection | Owner/principal/provider/email request fields rejected | Foundation present |
| Server-only DB access | Provider uses server-only service-role configuration | Foundation present |
| Least data read | Provider selects minimal planning columns | Foundation present |
| Response sanitization | Summary-only responses, no raw rows/payloads | Foundation present |
| Abuse protection | Rate limit or equivalent route protection | Missing |
| CSRF/origin hardening | Public deployment review for route POSTs | Missing |
| Session edge cases | Expired/revoked session route evidence | Missing |
| Error disclosure | Provider failures produce sanitized blocked responses | Foundation present; route-through-provider evidence missing |
| Secret exposure | Service role key never leaves server responses | Foundation present |
| Product boundary | No chat, prompt history, assistant logs, OpenAI, billing, subscriptions | Foundation present |

## Rollback Validation Matrix

| Scenario | Required Rollback | Current Status |
| --- | --- | --- |
| Route enablement causes blocked responses | Disable `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED` | Designed, not rehearsed |
| Provider readiness fails | Disable `LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED` or route flag | Designed, not rehearsed |
| Cross-owner evidence appears | Disable provider and route flags immediately | Designed, not rehearsed |
| Sanitization regression appears | Disable route flag and fix response contract | Designed, not rehearsed |
| Provider reads forbidden data | Disable provider flag and reject provider scope | Designed, not rehearsed |
| Supabase config invalid | Provider fails closed | Foundation present |
| Export side effect appears | Disable route/provider; remove generated file/storage if any | Out of scope, should not occur |
| Deletion side effect appears | Disable route/provider; stop stage and perform data rollback if mutation occurred | Out of scope, should not occur |

## Gate Decision

Gate status:

```text
NO-GO for production route enablement.
GO for a dedicated route enablement blocker closure / evidence validation stage.
NO-GO for public UI exposure.
NO-GO for real export package generation.
NO-GO for deletion writes, hard delete, or account deletion orchestration.
NO-GO for OpenAI, Billing, or Subscription Runtime.
```

Rationale:

- The Stage 4.3S/T/V/X foundation chain is structurally coherent.
- Owner-scoped, canonical-principal based read planning is implemented.
- Route and provider flags are fail-closed by default.
- Responses are designed to remain sanitized and manifest/lifecycle-only.
- Production route enablement would create a public control surface, and the
  project does not yet have recorded evidence for route-through-provider
  validation in an approved target environment, route-specific abuse protection,
  CSRF/origin/session hardening, browser/API product QA, or rollback rehearsal.

## Technical Blockers

Production route enablement remains blocked by these technical blockers:

1. No recorded end-to-end validation of enabled API routes using the Stage 4.3X
   production read provider against an approved production-like Supabase target.
2. No route-specific rate limiting or abuse-protection evidence for export and
   deletion planning endpoints.
3. No CSRF/origin/session-hardening evidence for public POST route deployment.
4. No expired/revoked-session route validation evidence through the enabled
   route foundation.
5. No route-through-provider sanitized error validation for provider outage,
   malformed rows, and cross-owner returned rows in an integration target.
6. No rollback rehearsal evidence for independently disabling route and provider
   flags after partial enablement.
7. No browser/API product QA evidence for the enabled foundation workflow.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3Z - User Data Controls Route Enablement Blocker Closure & Integration Evidence
```

Stage 4.3Z should remain a governance/evidence validation stage unless the
owner explicitly approves narrowly scoped route-hardening implementation. It
must not enable production routes, create UI, generate export packages, execute
deletion writes, connect OpenAI, connect billing, or connect Subscription
Runtime without a separate gate.
