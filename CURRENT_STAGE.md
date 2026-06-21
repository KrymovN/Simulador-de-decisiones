# CURRENT STAGE

## Active Checkpoint

Stage 5.1 AI Provider Abstraction / Real AI Integration Foundation Complete.

Status: foundation/runtime-boundary complete; real model calls deferred.

Date: 21 June 2026, Europe/Madrid.

Stage 4.4 remains closed as Subscription Runtime Foundation Complete /
Production Billing Deferred. Stage 5.1 is closed as internal AI Provider
foundation only.

## Product Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat, not an Answer Engine, and not a Generic AI Assistant.

Immutable architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

AI Provider remains an internal replaceable component. It does not answer the
user directly and does not own final decision semantics.

## What Is Closed

Stage 5.1 foundation/runtime-boundary is closed.

It includes:

- AI Provider Adapter contracts foundation;
- provider-agnostic request/response/capability/error contracts;
- fail-closed contract validation;
- AI Provider Runtime Selection / Preflight foundation;
- provider availability and capability preflight;
- disabled-by-default runtime behavior;
- safe errors for missing, disabled, unavailable, and unsupported providers;
- Controlled Adapter Boundary / Facade foundation;
- boundary-level rejection of raw prompts, secrets, API keys, env names, and
  client runtime fields;
- structured controlled result/error contracts;
- Stage 5.1 runtime QA/regression aggregation;
- exports through `lib/ai-provider/index.ts`.

## Deferred Real AI Scope

Real AI integration is explicitly deferred.

The current foundation does not include:

- OpenAI SDK;
- real AI provider SDK;
- API keys;
- environment variable reads;
- fetch/network model calls;
- model execution;
- API routes;
- UI integration;
- Simulator integration;
- Decision Engine runtime integration;
- Prompt Context runtime integration;
- product behavior changes.

## Production Readiness

Stage 5.1 is not production-ready real AI.

Any future model-call implementation requires separate owner approval and a
dedicated integration step covering provider scope, SDK/env/key handling,
Prompt Context connection, post-provider Decision Engine validation, quality,
cost, safety, QA, observability, and rollback.

## Next Allowed Roadmap Step

Stage 5.2 Prompt / Context Layer.

Stage 5.2 is not started by this checkpoint. It must preserve the immutable
Decision Simulation Engine architecture and must not turn Levio into AI Chat,
Answer Engine, Generic Assistant, or direct AI-to-user behavior.
