# CURRENT STAGE

## Active Checkpoint

Subscription Runtime Integration Foundation.

Status: implemented / foundation-only.

Date: 21 June 2026, Europe/Madrid.

Stage 4.3 remains closed as User Data Controls foundation/runtime-boundary
complete. Stage 4.4A is accepted. Subscription Entitlement Persistence
Foundation and Subscription Entitlement Enforcement Foundation are complete.
Subscription Runtime Integration Foundation adds a unified server-only facade
over trusted entitlement persistence and enforcement.

## Product Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat, not an Answer Engine, and not a Generic AI Assistant.

Immutable architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## What Is Closed

Subscription Runtime Integration Foundation is implemented as foundation-only
runtime.

It adds:

- unified server-only subscription runtime facade;
- integration of entitlement persistence and entitlement enforcement;
- Free / Premium / Professional capability model integration;
- fail-closed runtime resolution;
- disabled-by-default rollback-safe behavior;
- Decision Simulation Engine-safe runtime limits;
- rejection of client-supplied tier, owner, capability, customer, and billing fields;
- deterministic validation catalog.

## Current Non-Scope

The current foundations do not include Stripe, Billing provider, checkout,
customer portal, invoices, payment webhooks, pricing engine, payment UI,
subscription UI, OpenAI integration, API exposure, or product behavior changes.

## Production Readiness

Subscription Runtime Integration Foundation is not production billing. Billing
and production subscription behavior are not production-ready and not approved.

Any future billing implementation requires separate owner approval and a
dedicated implementation plan.

## Next Allowed Roadmap Step

Owner-approved decision on the next Stage 4.4 implementation target.

The next logical target is owner-approved billing provider integration, but it
remains blocked until provider/commercial/legal scope is approved.
Do not create a follow-up micro-stage automatically.
