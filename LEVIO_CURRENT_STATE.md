# LEVIO CURRENT STATE

## Confirmed Project Position

Date: 21 June 2026, Europe/Madrid.

Levio.es remains a Decision Simulation Engine.

The current confirmed state is Stage 5.3 AI Quality / Cost / Safety Validation
Foundation Complete. Real model calls and real AI provider integration are
deferred.

Stage 5.2 remains closed as Prompt / Context Layer Foundation Complete.

Stage 5.1 remains closed as AI Provider Abstraction / Real AI Integration
Foundation Complete.

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

## AI Quality Foundation State

Stage 5.3 is closed as contracts/runtime-boundary/QA complete.

Implemented as internal runtime-only foundation under `lib/ai-quality`:

- quality criteria, score-band, cost-budget, safety-policy, evidence, release
  gate, and fail-closed error contracts;
- contracts validation catalog covering chat, answer engine, generic assistant,
  model-call, env/API-key, and provider-payload rejection;
- disabled-by-default runtime foundation;
- fail-closed quality/cost/safety release-gate evaluation;
- structured runtime result/error contracts;
- controlled boundary/facade foundation;
- runtime evaluation before boundary-ready result;
- boundary-level rejection of unsafe mode, provider-payload, env/API-key, and
  model-call payload fields;
- Stage 5.3 QA/regression aggregation.

The foundation is isolated under `lib/ai-quality` and is not connected to UI,
API routes, OpenAI SDK, environment variables, API keys, fetch/network calls,
real model calls, Simulator runtime, Decision Engine runtime, Prompt Context
runtime, AI Provider runtime, database, Supabase, auth, persistence,
subscriptions, dashboard, or product behavior.

## Prompt Context Foundation State

Stage 5.2 remains closed as contracts/runtime-boundary/QA complete.

Implemented as internal runtime-only foundation under `lib/prompt-context`:

- provider-agnostic Prompt Context input, output, policy, evidence,
  risk-boundary, and error contracts;
- fail-closed input and output validation;
- disabled-by-default contract, runtime, and boundary behavior;
- rejection of raw chat messages, user-supplied system prompts, provider/model
  fields, env names, API keys, client runtime fields, direct answer mode, and
  generic assistant behavior;
- Runtime foundation that builds structured Decision Simulation context only;
- Controlled Boundary / Facade foundation that performs runtime build before a
  boundary-ready result;
- structured controlled result/error contracts;
- Stage 5.2 QA/regression aggregation.

## AI Provider Foundation State

Stage 5.1 remains closed as foundation/runtime-boundary/QA complete.

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

There is no AI Provider runtime call from Prompt Context or AI Quality.

There is no Prompt Context runtime call from AI Quality.

There is no Decision Engine runtime integration with AI Quality.

There is no Simulator, UI, or API integration with AI Quality.

There is no product behavior change from Stage 5.3.

## Production Status

Stage 5.3 is not production-ready real AI.

Future real AI implementation requires separate owner approval, provider scope,
SDK/env/key handling, Prompt Context to AI Provider connection, post-provider
Decision Engine validation, production safety/cost/quality enforcement,
observability, and rollback planning.

## Next Roadmap Step

Stage 5.4.

Stage 5.4 is not started. It must preserve Levio as a Decision Simulation
Engine and must not create AI Chat, Answer Engine, Generic Assistant, or direct
AI-to-user behavior.
