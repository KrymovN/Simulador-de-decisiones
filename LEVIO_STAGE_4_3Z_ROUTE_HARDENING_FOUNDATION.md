# LEVIO STAGE 4.3Z ROUTE HARDENING FOUNDATION

## Document Status

- Stage: 4.3Z - Route Hardening Foundation.
- Status: implementation complete / route hardening foundation only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `f027d89` - Stage 4.3Y Blocker Reality Audit.
- Owner approval: explicit approval to address implementation blockers was
  provided before this stage.
- Runtime code: changed only for User Data Controls route hardening foundation.
- Production route enablement: not approved and not changed.
- Product UI: not changed.
- API surface: not changed.
- New endpoints: not created.
- OpenAI / Real AI Runtime: not connected.
- Billing / Subscription Runtime: not connected.
- Real export packages: not created.
- Storage/download links: not created.
- Deletion writes: not executed.
- Hard delete: not executed.
- Account deletion orchestration: not implemented.
- Product behavior: public simulator behavior not changed.

Stage 4.3Z implements the server-side route hardening foundation needed before a
future route enablement gate can be reconsidered.

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
simulation artifacts. They do not expose AI chat history, generic prompt
history, assistant conversation logs, memory data, AI provider logs, billing
records, subscription internals, or generic assistant state as product objects.

## Audit Inputs

Reviewed before implementation:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_3Y_READ_PROVIDER_INTEGRATION_VALIDATION_AND_ROUTE_ENABLEMENT_GATE.md`
- `LEVIO_STAGE_4_3Y_BLOCKER_REALITY_AUDIT.md`
- all available Stage 4.3 documents
- `app/api/user-data-controls/*`
- `lib/user-data-controls/*`
- recent git history through `f027d89`

## Implemented Files

Stage 4.3Z adds:

- `lib/user-data-controls/api-route-hardening.ts`

Stage 4.3Z updates:

- `lib/user-data-controls/api-route-foundation.ts`
- `lib/user-data-controls/api-route-foundation-validation.ts`
- `lib/user-data-controls/index.ts`
- `lib/auth/types.ts`
- `lib/auth/messages.ts`

## Implemented Foundation

### Route-Specific Rate Limiting Foundation

`createUserDataControlsApiRouteHardeningFoundation(...)` adds route-specific
rate limiting for User Data Controls operations.

Properties:

- operation-scoped keying for export/deletion route planning;
- origin and client-address keying;
- deterministic in-memory store for foundation validation;
- fail-closed `rate_limit_exceeded` response;
- no database write;
- no storage write;
- no product UI integration.

This is foundation-level rate limiting. A future production enablement gate may
still require durable, distributed, or platform-level rate limiting evidence.

### Abuse Protection Foundation

The hardening foundation blocks:

- oversized request bodies;
- explicit abuse signals;
- method override headers.

It complements existing Stage 4.3V controls:

- `POST` only;
- feature flag protection;
- JSON scope validation;
- client owner field rejection;
- no export files;
- no deletion writes.

### CSRF Protection Foundation

The hardening foundation adds double-submit CSRF validation:

- `x-levio-csrf-token` header;
- `levio_csrf` cookie;
- exact token match;
- token length sanity check;
- fail-closed `csrf_failed` response.

Stage 4.3Z does not add UI token generation. Product exposure remains blocked
until a later product/UI scope explicitly approves how users receive CSRF
tokens.

### Origin / Referer Validation Foundation

The hardening foundation requires origin evidence:

- `Origin` header; or
- `Referer` fallback.

The origin must match the configured allowlist:

```text
LEVIO_APP_URL
NEXT_PUBLIC_SITE_URL
LEVIO_USER_DATA_CONTROLS_ALLOWED_ORIGINS
```

Missing origin evidence fails closed as `origin_missing`. Disallowed origin
evidence fails closed as `origin_invalid`.

### Explicit Revoked-Session Handling Foundation

Stage 4.3Z adds explicit route hardening behavior for revoked sessions:

- `LevioSessionContext.sessionStatus` now supports `revoked`;
- `LevioAuthErrorCode` now supports `session_revoked`;
- route hardening blocks authenticated contexts with `sessionStatus:
  "revoked"`;
- route hardening blocks signed-out auth contexts with `session_revoked`;
- Spanish auth copy includes a `session_revoked` message.

This does not connect a new auth provider behavior. It adds the explicit
foundation path required by Stage 4.3Y.

### Integration With API Route Foundation

`api-route-foundation.ts` now composes hardening before JSON parsing and before
export/deletion workflow planning:

```text
method check
  -> route feature flag
  -> route hardening checks
  -> auth context
  -> revoked-session hardening
  -> JSON parsing
  -> Stage 4.3S workflow
  -> Stage 4.3T adapter
  -> Stage 4.3X provider
  -> sanitized response
```

Rollback remains first-class:

- when `LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED` is disabled, route behavior
  blocks before hardening;
- provider rollback remains controlled separately by
  `LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED`;
- no data rollback is required because Stage 4.3Z writes no data.

## Fail-Closed Behavior

New fail-closed reasons:

- `route_hardening_unavailable`;
- `rate_limit_exceeded`;
- `abuse_detected`;
- `origin_missing`;
- `origin_invalid`;
- `csrf_failed`;
- `session_revoked`.

HTTP status mapping:

- `429` for `rate_limit_exceeded`;
- `403` for abuse/origin/CSRF/hardening unavailable;
- `401` for `session_revoked`.

## Validation

Updated deterministic validation catalog:

- `runUserDataControlsApiRouteFoundationValidation()`

Stage 4.3Z validation covers:

- rate limit exceeded;
- abuse detection;
- missing origin;
- invalid origin;
- CSRF failure;
- revoked session;
- normal authenticated request;
- feature flag disabled;
- malformed request;
- rollback behavior.

Local validation result:

```text
Stage 4.3V/4.3Z API route foundation validation: 18 passed / 0 failed
```

Local verification completed:

```text
npm run lint
npx tsc --noEmit
```

## Blockers Closed

Closed at foundation level:

- route-specific rate limiting foundation;
- abuse protection foundation;
- CSRF protection foundation;
- Origin / Referer validation foundation;
- explicit revoked-session handling foundation;
- hardening fail-closed response mapping;
- route rollback behavior preserving disabled-route preemption;
- deterministic hardening validation catalog.

## What Remains Blocked

Still blocked after Stage 4.3Z:

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
- browser/API product QA for enabled routes;
- route-through-provider validation against an approved production-like target;
- production rate limiter durability / platform evidence;
- rollback rehearsal against enabled route/provider flags;
- OpenAI / Real AI Runtime;
- Billing / Subscription Runtime.

## Completion Decision

Stage 4.3Z is complete as a route hardening foundation.

Production route enablement remains `NO-GO`.

Production User Data Controls are not complete.

## Next Roadmap Step

Next allowable roadmap step after separate owner approval:

```text
Stage 4.3Z-1 - Route Hardening Integration Evidence & Route Enablement Re-Gate
```

Purpose:

- validate hardening through the route foundation;
- validate route-through-provider behavior against an approved target;
- run rollback rehearsal;
- run browser/API QA for enabled route foundation;
- decide whether route enablement can move from `NO-GO` to a controlled
  limited rollout gate.

Stage 4.3Z-1 should remain a governance/evidence validation gate unless the
owner separately approves additional implementation work.
