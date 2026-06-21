# PROJECT CONTEXT

## Current Confirmed State

Date: 21 June 2026, Europe/Madrid.

Levio.es is a Decision Simulation Engine.

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a Generic AI Assistant.

The active checkpoint is Stage 5.1 AI Provider Abstraction / Real AI Integration
Foundation Complete. Real model calls are deferred.

Stage 4.4 remains closed as Subscription Runtime Foundation Complete /
Production Billing Deferred. Stage 4.3 remains closed as User Data Controls
foundation/runtime-boundary complete after the excessive Stage 4.3
gate/audit/micro-stage chain was removed.

Supporting references:

- `LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3_USER_DATA_CONTROLS_FOUNDATION_CLOSURE.md`
- `LEVIO_STAGE_4_4A_SUBSCRIPTION_RUNTIME_SCOPE_LOCK.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`

## Immutable Runtime Architecture

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

No runtime or product step may bypass the Simulator, Decision Engine, Prompt
Context, or post-provider Decision Engine validation.

AI Provider is an internal replaceable component. It supplies controlled
candidate material only and must never become the product, the direct respondent
to the user, or the owner of decision semantics.

## Stage 5.1 Closure Result

Stage 5.1 is closed as AI Provider Abstraction / Real AI Integration Foundation
Complete at the foundation/runtime-boundary/QA level.

Closed under `lib/ai-provider`:

- provider-agnostic AI Provider Adapter contracts;
- AI Provider request, response, capability, and error models;
- fail-closed contract validation;
- disabled-by-default adapter behavior;
- Runtime Selection / Preflight foundation;
- provider availability and capability preflight;
- fail-closed provider resolution;
- safe missing, disabled, unavailable, and unsupported provider errors;
- Controlled Adapter Boundary / Facade foundation;
- boundary rejection of raw prompts, secrets, API keys, env names, and client
  runtime fields;
- structured controlled result/error contracts;
- Stage 5.1 runtime QA/regression aggregation;
- exports through `lib/ai-provider/index.ts`.

Stage 5.1 does not connect OpenAI SDK, real provider SDKs, API keys,
environment variables, fetch/network calls, model execution, API routes, UI,
Simulator runtime, Decision Engine runtime, Prompt Context runtime, database,
Supabase, auth, persistence, subscriptions, dashboard, or product behavior.

## Stage 4.4 Closure Result

Stage 4.4 remains closed as Subscription Runtime Foundation Complete /
Production Billing Deferred.

Closed at foundation/runtime-boundary level:

- subscription tier contracts for Free, Premium, and Professional;
- entitlement meaning and owner boundary;
- owner-scoped entitlement snapshot persistence foundation;
- server-only entitlement read/write provider contracts;
- server-only entitlement enforcement contracts;
- unified server-only subscription runtime facade;
- fail-closed entitlement and capability resolution;
- disabled-by-default rollback-safe behavior;
- Decision Simulation Engine-safe capability limits;
- rejection of client-supplied tier, owner, capability, customer, and billing fields;
- deterministic validation catalogs.

Production billing is deferred because:

- billing provider is not approved;
- Stripe is not approved;
- pricing, legal, and tax scope are not approved;
- checkout, webhooks, and customer portal are not ready.

## Current Runtime Boundaries

Allowed at current closure:

- foundation-only evaluation;
- owner-scoped planning contracts;
- subscription scope reasoning;
- entitlement persistence foundation;
- entitlement enforcement foundation;
- subscription runtime integration foundation;
- AI Provider adapter contracts foundation;
- AI Provider runtime selection/preflight foundation;
- AI Provider controlled boundary/facade foundation;
- canonical owner model based on `levio_principals.principal_id`;
- fail-closed behavior;
- deterministic validation functions;
- no public product behavior change.

Not allowed or not present:

- public User Data Controls API;
- Export UI;
- Deletion UI;
- dashboard data-control workflows;
- real export package generation;
- storage/download links;
- deletion writes;
- hard delete;
- account deletion orchestration;
- production Supabase read provider for User Data Controls;
- OpenAI SDK;
- real AI provider SDK;
- environment variable reads for AI;
- API keys for AI;
- model calls;
- AI API routes;
- AI UI;
- Simulator integration with AI Provider;
- Decision Engine integration with AI Provider;
- Prompt Context integration with AI Provider;
- Billing;
- production Subscription Runtime product integration;
- Stripe integration;
- checkout/customer portal;
- subscription API routes;
- billing UI.

## Ownership Model

The canonical owner anchor is `levio_principals.principal_id`.

Supabase `auth.users.id` remains a provider reference and must not become the
product owner ID.

Client-supplied owner fields are never authorization proof.

Stage 4.3 protects decision simulation artifacts:

- saved simulations;
- simulation drafts;
- simulation history entries;
- owner metadata needed to control those artifacts.

Stage 4.4 subscription scope does not change the product object. Entitlements
control access to decision simulation capabilities; they do not create AI chat
history or generic assistant behavior.

Stage 5.1 AI Provider scope does not change the product object. AI Provider
foundation controls internal candidate-material infrastructure only; it does not
create assistant memory, chat history, direct answers, or generic prompt logs.

## Production Readiness

Stage 5.1 is not production-ready real AI.

Real AI work remains blocked until a separately approved future stage defines
provider integration, SDK/env/key handling, Prompt Context connection,
post-provider Decision Engine validation, safety/cost/quality QA, observability,
and rollback.

Stage 4.4 is not production-ready billing.

Billing/product work remains blocked until a separately approved future stage
defines provider integration, pricing/legal/tax scope, entitlement sync,
webhooks, UI/API, QA, and rollback rehearsal.

## Next Roadmap Step

Stage 5.2 Prompt / Context Layer is the next roadmap step.

Stage 5.2 is not started by this checkpoint. It must preserve the immutable
Decision Simulation Engine architecture and must not create AI Chat, Answer
Engine, Generic Assistant, or direct AI-to-user behavior.
