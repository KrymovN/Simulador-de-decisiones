# CURRENT STAGE

## Active Checkpoint

Subscription Entitlement Persistence Foundation.

Status: implemented / foundation-only.

Date: 21 June 2026, Europe/Madrid.

Stage 4.3 remains closed as User Data Controls foundation/runtime-boundary
complete. Stage 4.4A is accepted. Subscription Entitlement Persistence
Foundation implements the first narrow Stage 4.4 runtime foundation after the
scope lock.

## Product Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat, not an Answer Engine, and not a Generic AI Assistant.

Immutable architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## What Is Closed

Subscription Entitlement Persistence Foundation is implemented as
foundation-only runtime.

It adds:

- owner-scoped entitlement snapshot model;
- FREE / PREMIUM / PROFESSIONAL entitlement snapshot support;
- server-only read/write provider contracts;
- fail-closed entitlement resolution;
- rejection of client-supplied tier, owner, customer, and billing identifiers;
- deterministic validation catalog.

## Current Non-Scope

The current foundation does not include Stripe, Billing provider, checkout,
customer portal, invoices, payment webhooks, pricing engine, payment UI,
subscription UI, OpenAI integration, API exposure, or product behavior changes.

## Production Readiness

Subscription Entitlement Persistence Foundation is not production billing.
Billing and production subscription behavior are not production-ready and not
approved.

Any future billing implementation requires separate owner approval and a
dedicated implementation plan.

## Next Allowed Roadmap Step

Owner-approved decision on the next Stage 4.4 implementation target.

The next logical target is billing provider integration scope, but it remains
blocked until provider/commercial/legal scope is approved.
Do not create a follow-up micro-stage automatically.
