# LEVIO STAGE 4.4A SUBSCRIPTION RUNTIME SCOPE LOCK

## Document Status

- Stage: 4.4A - Subscription Runtime Scope Lock.
- Status: scope lock / documentation-only.
- Date: 21 June 2026, Europe/Madrid.
- Runtime code: not changed.
- Billing code: not created.
- Stripe: not connected.
- API: not changed.
- UI: not changed.
- OpenAI: not connected.
- Micro-stage continuation: not created.

This document defines the allowed Stage 4.4 subscription scope after Stage 4.3
User Data Controls foundation closure. It does not implement billing, payments,
Stripe, entitlement persistence, product UI, API routes, checkout, customer
portal, invoices, webhooks, or production subscription behavior.

## Strategic Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a Generic AI Assistant.

The immutable runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Subscription logic may decide whether a user is entitled to a Levio decision
simulation capability. It must not become the product center, bypass the
Simulator, bypass the Decision Engine, or expose generic AI assistant behavior.

## Existing Repository Context

The repository already contains isolated subscription foundation code under
`lib/subscriptions` and a historical Stage 4.4E closure document. This 4.4A
scope lock does not remove or extend that code. It fixes the current roadmap
scope before any future billing implementation can be considered.

Existing foundation references:

- `lib/subscriptions/contracts.ts`
- `lib/subscriptions/validation.ts`
- `lib/subscriptions/runtime.ts`
- `lib/subscriptions/runtime-validation.ts`
- `lib/subscriptions/boundary.ts`
- `lib/subscriptions/boundary-validation.ts`
- `lib/subscriptions/runtime-qa-regression.ts`
- `lib/subscriptions/index.ts`
- `LEVIO_STAGE_4_4E_SUBSCRIPTION_RUNTIME_CLOSURE.md`

Those artifacts remain foundation-only and not production billing.

## What Enters Stage 4.4

Stage 4.4 may define and validate:

- subscription tier vocabulary;
- entitlement vocabulary;
- capability vocabulary;
- usage-limit vocabulary;
- deterministic entitlement evaluation;
- fail-closed subscription access decisions;
- owner-scoped entitlement assumptions;
- subscription runtime boundary contracts;
- QA/regression catalogs for subscription foundation behavior;
- rollback posture for disabling subscription checks.

Stage 4.4 may describe how future billing data will map into Levio-owned
entitlement snapshots, but it must not implement billing provider integration in
this scope lock.

## What Does Not Enter Stage 4.4

Stage 4.4A does not include:

- Stripe integration;
- checkout;
- customer portal;
- invoices;
- taxes;
- payment methods;
- webhooks;
- billing database writes;
- entitlement persistence;
- subscription API routes;
- pricing UI;
- paywall UI;
- dashboard billing pages;
- account management UI;
- OpenAI integration;
- model-call limits enforced against real AI calls;
- commercial launch;
- legal billing copy publication;
- production billing QA.

Any of those requires a future explicitly approved implementation stage.

## Tier Model

Stage 4.4 uses three product tiers:

| Tier | Product Meaning | Scope |
| --- | --- | --- |
| Free | Entry-level decision simulation access | Basic simulations with strict usage limits and no durable library by default |
| Premium | Individual paid decision simulation workflow | Extended simulations, saved simulation library, and simulation history within configured limits |
| Professional | Advanced / professional decision simulation workflow | Higher limits, advanced tradeoff modeling, and professional archive capability |

Tier names are commercial/product labels. They are not owner identities.

## Possible Tier Restrictions

Allowed restriction categories:

- monthly decision simulation count;
- total saved simulation count;
- total simulation history entries;
- professional decision archive count;
- access to basic vs extended simulation modes;
- access to advanced tradeoff modeling;
- access to professional archive features;
- future retention or history depth by tier, if separately approved.

Current foundation defaults in `lib/subscriptions/validation.ts` are:

| Tier | Monthly Simulations | Saved Simulations | History Entries | Decision Archives |
| --- | ---: | ---: | ---: | ---: |
| Free | 10 | 0 | not included | not included |
| Premium | 250 | 500 | 1000 | not included |
| Professional | 2000 | 5000 | 10000 | 1000 |

These numbers are foundation defaults, not final public pricing commitments.

## Entitlement Definition

An entitlement is a trusted Levio-side access decision input that connects:

- a canonical owner principal;
- a subscription tier;
- an allowed subscription status;
- allowed capabilities;
- usage limits;
- an effective time window;
- a trusted source.

An entitlement is not:

- a payment provider customer object;
- a Stripe subscription object;
- an invoice;
- an auth session;
- a user data owner ID by itself;
- an AI capability to answer directly;
- a right to bypass Decision Engine validation.

The canonical owner remains `levio_principals.principal_id`. Provider IDs,
payment IDs, and email addresses must not become the Levio owner anchor.

## Subscription Product Invariants

Subscription runtime must preserve these invariants:

- entitlement checks control access to decision simulation capabilities only;
- subscription tier must not change the meaning of Levio into chat or answer generation;
- higher tiers may unlock richer simulation structure, history, archive, or tradeoff tools;
- higher tiers must not allow raw AI answers to bypass the Decision Engine;
- subscription data must not become AI memory;
- billing status must not become ownership proof;
- client-supplied tier, owner, customer, or provider fields must not authorize access;
- failed or unknown entitlement state must fail closed for paid capabilities.

## Dependencies Before Billing Implementation

Before billing implementation can begin, the project needs:

- confirmed owner approval for billing implementation scope;
- provider decision and rollback plan;
- legal/commercial pricing terms;
- tax/VAT handling decision for target markets;
- billing customer ownership mapping to `levio_principals.principal_id`;
- entitlement persistence model;
- webhook security model;
- idempotency strategy;
- failed payment and cancellation semantics;
- refund/dispute operational policy;
- production secret management;
- billing QA plan;
- support/account recovery policy;
- user-facing copy for plans, cancellation, renewal, and data access.

## Deferred To Future Stages

Deferred after 4.4A:

- Stripe or other billing provider integration;
- real subscription checkout;
- customer portal;
- webhook ingestion;
- persistent entitlement tables;
- entitlement sync jobs;
- pricing page changes;
- dashboard billing UI;
- billing-related emails;
- invoice access;
- subscription cancellation flow;
- production entitlement enforcement;
- real AI cost or usage enforcement;
- market launch packaging.

## Rollback Posture

At this scope-lock level rollback is documentation-only:

- remove this document if the scope is rejected;
- keep billing disconnected;
- keep API unchanged;
- keep UI unchanged;
- no data rollback is required;
- no payment rollback is required;
- no Stripe rollback is required.

Future billing rollback must be designed before implementation and must include
provider disconnect, webhook disablement, entitlement freeze, customer support
handling, and no silent loss of user-owned decision simulation artifacts.

## Closure Decision

Stage 4.4A is closed as a Subscription Runtime Scope Lock.

It defines the Stage 4.4 subscription boundary but does not approve billing
implementation.

## Next Logical Step

The next logical step is owner review of this scope lock and, if accepted,
approval of a separate billing/subscription implementation plan.

No next micro-stage is created by this document.
