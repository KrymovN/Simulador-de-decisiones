# PROJECT CONTEXT

## Current Confirmed State

Date: 21 June 2026, Europe/Madrid.

Levio.es is a Decision Simulation Engine.

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a Generic AI Assistant.

The active checkpoint is Stage 4.3 User Data Controls Foundation Closure. The
project has deliberately removed the excessive Stage 4.3 gate/audit/micro-stage
chain and returned Stage 4.3 to a bounded roadmap state.

Active closure reference:

- `LEVIO_STAGE_4_3_USER_DATA_CONTROLS_FOUNDATION_CLOSURE.md`

Supporting references:

- `LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`

## Immutable Runtime Architecture

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

No runtime or product step may bypass the Simulator, Decision Engine, Prompt
Context, or post-provider Decision Engine validation. User Data Controls are
supporting ownership and lifecycle infrastructure around decision simulation
artifacts only.

## Stage 4.3 Consolidation Result

Stage 4.3 is closed as foundation/runtime-boundary complete.

Retained:

- User Data Controls contracts;
- consent runtime foundation;
- retention runtime foundation;
- export planning foundation;
- deletion planning foundation;
- runtime boundary and deterministic QA catalogs;
- server workflow foundation for canonical principal resolution and ownership verification;
- persistence read adapter foundation for owner-scoped artifact reads through injected server-only providers.

Removed from active Stage 4.3:

- `app/api/user-data-controls/*` route files;
- API route foundation handlers;
- route hardening foundation;
- production read-provider foundation;
- Stage 4.3P through Stage 4.3Z micro-stage documents;
- Stage 4.3Z-1 follow-up path.

Reason: those items converted Stage 4.3 into a continuing API exposure and
production route enablement program. That is beyond what is needed to close User
Data Controls foundation.

## Current Runtime Boundaries

Allowed at Stage 4.3 closure:

- foundation-only evaluation;
- owner-scoped planning contracts;
- canonical owner model based on `levio_principals.principal_id`;
- fail-closed behavior;
- deterministic validation functions;
- no public product behavior change.

Not allowed or not present:

- public User Data Controls API;
- Export UI;
- Deletion UI;
- dashboard data-control workflows;
- real export package generation;
- storage/download links;
- deletion writes;
- hard delete;
- account deletion orchestration;
- production Supabase read provider for User Data Controls;
- OpenAI integration;
- Billing;
- Subscription Runtime integration.

## Ownership Model

The canonical owner anchor is `levio_principals.principal_id`.

Supabase `auth.users.id` remains a provider reference and must not become the
product owner ID.

Client-supplied owner fields are never authorization proof.

Stage 4.3 protects decision simulation artifacts:

- saved simulations;
- simulation drafts;
- simulation history entries;
- owner metadata needed to control those artifacts.

Stage 4.3 does not create or protect generic AI chat history as a primary
product object.

## Production Readiness

Stage 4.3 is not production-ready.

Production/product work remains blocked until a separately approved future stage
defines scope for UI, API exposure, production read provider wiring, real export
packages, deletion writes, legal/privacy copy, QA, and rollback rehearsal.

## Next Roadmap Step

The next normal roadmap step after Stage 4.3 closure is Stage 4.4
commercial/subscription/billing scope review, or another owner-approved roadmap
block after Stage 4.3.

The next step must not implicitly restart Stage 4.3 gate/audit fragmentation.
