# LEVIO CURRENT STATE

## Confirmed Project Position

Date: 21 June 2026, Europe/Madrid.

Levio.es remains a Decision Simulation Engine.

The current confirmed state is Stage 5.1 AI Provider Abstraction / Real AI
Integration Foundation Complete. Real model calls are deferred.

Stage 4.4 remains closed as Subscription Runtime Foundation Complete /
Production Billing Deferred.

## Architecture Invariant

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Levio must not become:

- AI Chat;
- Answer Engine;
- Generic AI Assistant;
- generic prompt history system;
- assistant conversation log product;
- direct AI-to-user wrapper.

## AI Provider Foundation State

Stage 5.1 is closed as foundation/runtime-boundary complete.

Implemented as internal runtime-only foundation under `lib/ai-provider`:

- provider-agnostic AI Provider Adapter contracts;
- AI Provider request, response, capability, and error models;
- fail-closed contract validation;
- disabled-by-default adapter behavior;
- Runtime Selection / Preflight foundation;
- provider availability and capability preflight;
- fail-closed provider resolution;
- safe unavailable, disabled, unsupported, and missing provider errors;
- Controlled Adapter Boundary / Facade foundation;
- boundary-level rejection of raw prompts, secrets, API keys, env names, and
  client runtime fields;
- structured controlled result/error contracts;
- Stage 5.1 QA/regression aggregation.

The foundation is isolated under `lib/ai-provider` and is not connected to UI,
API routes, OpenAI SDK, environment variables, API keys, fetch/network calls,
real model calls, Simulator runtime, Decision Engine runtime, Prompt Context
runtime, database, Supabase, auth, persistence, subscriptions, dashboard, or
product behavior.

## Subscription Runtime State

Stage 4.4 remains closed as foundation/runtime-boundary complete.

Production billing remains deferred because:

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

There are no real AI provider calls.

There is no product behavior change from Stage 5.1.

## Production Status

Stage 5.1 is not production-ready real AI.

Future real AI implementation requires separate owner approval, provider scope,
SDK/env/key handling, Prompt Context connection, post-provider Decision Engine
validation, safety/cost/quality QA, observability, and rollback planning.

## Next Roadmap Step

Stage 5.2 Prompt / Context Layer.

Stage 5.2 is not started. Prompt/context work must preserve Levio as a Decision
Simulation Engine and must not create AI Chat, Answer Engine, Generic Assistant,
or direct AI-to-user behavior.
