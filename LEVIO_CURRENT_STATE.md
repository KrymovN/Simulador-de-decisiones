# LEVIO CURRENT STATE

## Confirmed Project Position

Date: 21 June 2026, Europe/Madrid.

Levio.es remains a Decision Simulation Engine.

The current confirmed state is Stage 4.4A Subscription Runtime Scope Lock.
Stage 4.3 remains closed after consolidation.

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

## Stage 4.4A Final State

Closed as documentation-only scope lock:

- Free, Premium, and Professional tier model fixed;
- entitlement definition fixed;
- subscription restriction categories fixed;
- Decision Simulation Engine invariants preserved;
- dependencies before billing implementation documented;
- deferred billing/product work documented.

The owner model remains anchored on `levio_principals.principal_id`.
Billing status, payment provider IDs, and client-supplied tier fields are not
ownership proof.

## Current Product Behavior

Public simulator behavior is unchanged.

There is no Stripe integration.

There is no Billing integration.

There is no checkout or customer portal.

There is no subscription API or billing UI.

There is no OpenAI runtime integration.

There is no product behavior change from Stage 4.4A.

## Production Status

Stage 4.4A is not production-ready.

Future billing implementation requires separate owner approval, provider scope,
legal/commercial terms, entitlement persistence, webhook security, QA, and
rollback planning.

## Next Roadmap Step

The next logical step is owner review of Stage 4.4A.

Do not create the next micro-stage automatically.
