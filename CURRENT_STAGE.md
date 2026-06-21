# CURRENT STAGE

## Active Checkpoint

Stage 4.4 Subscription Runtime Foundation Complete.

Status: foundation/runtime-boundary complete; production billing deferred.

Date: 21 June 2026, Europe/Madrid.

Stage 4.3 remains closed as User Data Controls foundation/runtime-boundary
complete. Stage 4.4 is closed as Subscription Runtime Foundation Complete.
Subscription Entitlement Persistence Foundation, Subscription Entitlement
Enforcement Foundation, and Subscription Runtime Integration Foundation are
complete on a foundation-only runtime-boundary level.

## Product Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat, not an Answer Engine, and not a Generic AI Assistant.

Immutable architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## What Is Closed

Stage 4.4 foundation/runtime-boundary is closed.

It includes:

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

## Deferred Production Billing Scope

Production billing is explicitly deferred because:

- billing provider is not approved;
- Stripe is not approved;
- pricing, legal, and tax scope are not approved;
- checkout, webhooks, and customer portal are not ready.

The current foundations do not include Stripe, Billing provider, checkout,
customer portal, invoices, payment webhooks, pricing engine, payment UI,
subscription UI, OpenAI integration, API exposure, or product behavior changes.

## Production Readiness

Stage 4.4 is not production billing. Billing and production subscription
behavior are not production-ready and not approved.

Any future billing implementation requires separate owner approval and a
dedicated implementation plan.

## Next Allowed Roadmap Step

Stage 5.1 AI Provider Abstraction / Real AI Integration Foundation.

AI Provider must remain an internal replaceable component inside the immutable
Decision Simulation Engine architecture. Stage 5.1 must not turn Levio into AI
Chat, Answer Engine, or Generic Assistant.
