# LEVIO CURRENT STATE

## Confirmed Project Position

Date: 21 June 2026, Europe/Madrid.

Levio.es remains a Decision Simulation Engine.

The current confirmed state is Stage 4.4 Subscription Runtime Foundation
Complete / Production Billing Deferred. Stage 4.3 remains closed after
consolidation.

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

## Subscription Runtime State

Stage 4.4 is closed as foundation/runtime-boundary complete.

Implemented as foundation-only runtime:

- Free / Premium / Professional subscription tier contracts;
- entitlement meaning and owner boundary;
- owner-scoped entitlement snapshot persistence foundation;
- server-only entitlement read/write provider contracts;
- server-only entitlement enforcement contracts;
- unified server-only subscription runtime facade;
- integration of entitlement persistence and entitlement enforcement;
- Free / Premium / Professional capability model integration;
- fail-closed runtime resolution;
- disabled-by-default rollback-safe behavior;
- Decision Simulation Engine-safe runtime limits;
- rejection of client-supplied tier, owner, capability, customer, and billing fields;
- deterministic validation catalogs.

The foundation is isolated under `lib/subscriptions` and is not connected to UI,
API routes, Stripe, Billing provider, checkout, webhooks, pricing engine,
payment UI, subscription UI, OpenAI, or product behavior.

The owner model remains anchored on `levio_principals.principal_id`.
Billing status, payment provider IDs, and client-supplied tier fields are not
ownership proof.

## Deferred Production Billing

Production billing is deferred because:

- billing provider is not approved;
- Stripe is not approved;
- pricing, legal, and tax scope are not approved;
- checkout, webhooks, and customer portal are not ready.

## Current Product Behavior

Public simulator behavior is unchanged.

There is no Stripe integration.

There is no Billing integration.

There is no checkout or customer portal.

There is no subscription API, entitlement API, or billing UI.

There is no OpenAI runtime integration.

There is no product behavior change from Stage 4.4A.

## Production Status

Stage 4.4 is not production-ready billing.

Future billing implementation requires separate owner approval, provider scope,
legal/commercial terms, entitlement sync/enforcement, webhook security, QA, and
rollback planning.

## Next Roadmap Step

Stage 5.1 AI Provider Abstraction / Real AI Integration Foundation.

AI Provider is an internal component only. It must remain behind Simulator,
Decision Engine, and Prompt Context boundaries and must not become AI Chat,
Answer Engine, or Generic Assistant behavior.
