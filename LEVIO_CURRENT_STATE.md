# LEVIO CURRENT STATE

## Confirmed Project Position

Date: 21 June 2026, Europe/Madrid.

Levio.es remains a Decision Simulation Engine.

The current confirmed state is Subscription Entitlement Persistence Foundation
implemented. Stage 4.3 remains closed after consolidation and Stage 4.4A remains
accepted.

Active closure document:

- `LEVIO_STAGE_4_4A_SUBSCRIPTION_RUNTIME_SCOPE_LOCK.md`

## Architecture Invariant

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Levio must not become:

- AI Chat;
- Answer Engine;
- Generic AI Assistant;
- generic prompt history system;
- assistant conversation log product.

## Subscription Entitlement Persistence State

Implemented as foundation-only runtime:

- owner-scoped entitlement snapshot model;
- FREE / PREMIUM / PROFESSIONAL entitlement snapshots;
- server-only read/write contracts;
- fail-closed entitlement resolution;
- rejection of client-supplied tier, owner, customer, and billing identifiers;
- deterministic validation catalog.

The foundation is isolated under `lib/subscriptions` and is not connected to UI,
API routes, Stripe, Billing provider, checkout, webhooks, pricing engine,
payment UI, subscription UI, OpenAI, or product behavior.

The owner model remains anchored on `levio_principals.principal_id`.
Billing status, payment provider IDs, and client-supplied tier fields are not
ownership proof.

## Current Product Behavior

Public simulator behavior is unchanged.

There is no Stripe integration.

There is no Billing integration.

There is no checkout or customer portal.

There is no subscription API, entitlement API, or billing UI.

There is no OpenAI runtime integration.

There is no product behavior change from Stage 4.4A.

## Production Status

Subscription Entitlement Persistence Foundation is not production-ready billing.

Future billing implementation requires separate owner approval, provider scope,
legal/commercial terms, entitlement sync/enforcement, webhook security, QA, and
rollback planning.

## Next Roadmap Step

The next logical step is an owner-approved decision on the next Stage 4.4
implementation target.

Billing provider integration remains blocked until provider/commercial/legal
scope is approved.
Do not create the next micro-stage automatically.
