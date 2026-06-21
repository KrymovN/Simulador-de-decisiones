# CURRENT STAGE

## Active Checkpoint

Stage 4.4A Subscription Runtime Scope Lock Owner Review.

Status: accepted / documentation-only readiness check complete.

Date: 21 June 2026, Europe/Madrid.

Stage 4.3 remains closed as User Data Controls foundation/runtime-boundary
complete. Stage 4.4A defines the subscription runtime scope without billing
implementation and has passed owner review/readiness check.

## Product Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat, not an Answer Engine, and not a Generic AI Assistant.

Immutable architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## What Is Closed

Stage 4.4A is closed as a Subscription Runtime Scope Lock.

Owner review result: accepted.

It fixes:

- Free, Premium, and Professional tier vocabulary;
- entitlement meaning in Levio;
- allowed subscription restriction categories;
- subscription invariants for Decision Simulation Engine behavior;
- dependencies required before billing implementation;
- deferred billing/product work.

No runtime code, API, UI, Stripe, Billing, OpenAI, or Subscription Runtime
implementation was added by Stage 4.4A.

Review findings:

- Stage 4.4A matches the roadmap subscription/commercial scope.
- Scope is not inflated into billing provider integration or product launch.
- Free, Premium, and Professional remain decision simulation access tiers.
- Commercial layer does not turn Levio into AI Chat, Answer Engine, or Generic AI Assistant.

## Current Non-Scope

Stage 4.4A does not include Stripe, checkout, customer portal, invoices,
payment webhooks, entitlement persistence, subscription API routes, pricing UI,
paywall UI, dashboard billing UI, OpenAI integration, or product behavior
changes.

## Production Readiness

Stage 4.4A is a scope lock only. Billing and production subscription behavior
are not production-ready and not approved.

Any future billing implementation requires separate owner approval and a
dedicated implementation plan.

## Next Allowed Roadmap Step

Owner-approved billing/subscription implementation plan.

This next logical step is documentation/readiness work, not implementation.
Do not create a follow-up micro-stage automatically.
