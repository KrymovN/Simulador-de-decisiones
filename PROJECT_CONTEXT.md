# PROJECT CONTEXT

## Current Confirmed State

Date: 21 June 2026, Europe/Madrid.

Levio.es is a Decision Simulation Engine.

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a Generic AI Assistant.

The active checkpoint is Subscription Entitlement Persistence Foundation
implemented. Stage 4.3 remains closed as User Data Controls
foundation/runtime-boundary complete after the excessive Stage 4.3
gate/audit/micro-stage chain was removed.

Active closure reference:

- `LEVIO_STAGE_4_4A_SUBSCRIPTION_RUNTIME_SCOPE_LOCK.md`

Supporting references:

- `LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3_USER_DATA_CONTROLS_FOUNDATION_CLOSURE.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`

## Immutable Runtime Architecture

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

No runtime or product step may bypass the Simulator, Decision Engine, Prompt
Context, or post-provider Decision Engine validation. User Data Controls are
supporting ownership and lifecycle infrastructure around decision simulation
artifacts only.

## Stage 4.4A Scope Lock Result

Stage 4.4A is closed and accepted as documentation-only subscription runtime
scope lock.

It defines:

- Free, Premium, and Professional tier vocabulary;
- entitlement meaning and owner boundary;
- allowed subscription restriction categories;
- subscription product invariants;
- dependencies before billing implementation;
- deferred billing/product work.

It does not create runtime code, connect Stripe, connect Billing, change UI,
change API, connect OpenAI, or approve production subscription behavior.

Stage 4.3 remains closed and must not restart as a micro-stage chain.

Owner review result:

- conforms to the roadmap;
- does not inflate subscription scope into billing implementation;
- keeps Free, Premium, and Professional as decision simulation access tiers;
- preserves Levio as Decision Simulation Engine;
- does not create AI Chat, Answer Engine, or Generic AI Assistant behavior.

## Subscription Entitlement Persistence Result

Subscription Entitlement Persistence Foundation is implemented as
foundation-only runtime under `lib/subscriptions`.

It provides:

- owner-scoped entitlement snapshot model;
- FREE / PREMIUM / PROFESSIONAL entitlement snapshot support;
- server-only read/write provider contracts;
- fail-closed entitlement resolution;
- rejection of client-supplied tier, owner, customer, and billing identifiers;
- deterministic validation catalog.

It does not connect Stripe, Billing provider, checkout, webhooks, pricing
engine, payment UI, subscription UI, API routes, OpenAI, or product behavior.

## Current Runtime Boundaries

Allowed at current closure:

- foundation-only evaluation;
- owner-scoped planning contracts;
- subscription scope reasoning;
- entitlement persistence foundation;
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
- Subscription Runtime product integration.
- Stripe integration;
- checkout/customer portal;
- subscription API routes;
- billing UI.

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

Stage 4.4 subscription scope does not change the product object. Entitlements
control access to decision simulation capabilities; they do not create AI chat
history or generic assistant behavior.

## Production Readiness

Subscription Entitlement Persistence Foundation is not production-ready billing.

Billing/product work remains blocked until a separately approved future stage
defines provider integration, entitlement sync/enforcement, webhooks, UI/API,
legal/commercial copy, QA, and rollback rehearsal.

## Next Roadmap Step

The next logical step is an owner-approved decision on the next Stage 4.4
implementation target.

Billing provider integration remains blocked until provider/commercial/legal
scope is approved.
No follow-up micro-stage is created automatically.
