# PROJECT CONTEXT

## Current Confirmed State

Date: 23 June 2026, Europe/Madrid.

Levio.es is a Decision Simulation Engine.

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a Generic AI Assistant.

The active checkpoint is Stage 5.4 AI Integration Foundation Complete / Real AI
Runtime Deferred. Stage 5.4A-D are closed as foundation-only preflight, runtime
validation, boundary composition, and dry-run execution. Real model calls and
real AI provider integration remain deferred.

Product Quality Hardening is active. The first five bounded public simulator
hardening steps are complete: Public Simulator Failure & Input Boundary
Hardening, API Response Contract Hardening, API Abuse Boundary Hardening,
Public Simulator Mock Truth Boundary, and Manual QA Matrix Verification with
12/12 PASS. The full Product Quality Hardening block remains open.

Stage 5.3 remains closed as AI Quality / Cost / Safety Validation Foundation
Complete. Stage 5.2 remains closed as Prompt / Context Layer Foundation
Complete. Stage 5.1 remains closed as AI Provider Abstraction / Real AI
Integration Foundation Complete. Stage 4.4 remains closed as Subscription
Runtime Foundation Complete / Production Billing Deferred. Stage 4.3 remains
closed as User Data Controls foundation/runtime-boundary complete after the
excessive Stage 4.3 gate/audit/micro-stage chain was removed.

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
Context, AI Provider boundary, AI Quality validation, or post-provider Decision
Engine validation.

AI Quality / Cost / Safety Validation is an internal structured-evidence layer.
It evaluates quality, cost, safety, and release-gate evidence only. It must
never become a chat surface, answer engine, provider caller, or owner of final
decision semantics.

Prompt Context is an internal controlled context layer. It prepares structured
Decision Simulation context for future AI Provider use, but it must never become
raw chat prompt handling, user-controlled system prompting, an answer engine, or
the owner of final decision semantics.

AI Provider is an internal replaceable component. It supplies controlled
candidate material only and must never become the product, the direct respondent
to the user, or the owner of decision semantics.

Controlled AI Integration is an internal foundation layer. It validates and
composes existing Prompt Context, AI Provider, and AI Quality boundaries for
preflight and dry-run evidence only. It must never become a provider caller,
answer engine, chat surface, direct AI-to-user path, or owner of final decision
semantics.

## Stage 5.4 Implementation State

Stage 5.4A-D is closed as Controlled AI Integration Foundation under
`lib/ai-integration`.

Implemented:

- Stage 5.4A controlled AI integration preflight contracts foundation;
- Stage 5.4B controlled AI integration runtime validation foundation;
- Stage 5.4C controlled AI integration boundary composition foundation;
- Stage 5.4D controlled AI integration dry-run execution foundation;
- deterministic, fail-closed validation for Prompt Context Boundary, AI
  Provider Boundary, and AI Quality Boundary references;
- rejection of raw prompts, chat messages, user system prompts, provider
  payloads, model-call payloads, provider execution, streaming, env/API-key
  fields, API routes, Simulator runtime, Decision Engine runtime, and UI
  runtime fields.

Stage 5.4 does not connect OpenAI SDK, real provider SDKs, API keys,
environment variables, fetch/network calls, model execution, provider
execution, streaming, API routes, UI, Simulator runtime, Decision Engine
runtime, Prompt Context runtime calls, AI Provider runtime calls, database,
Supabase, auth, persistence, subscriptions, dashboard, or product behavior.

Stage 5.4 closure does not approve production model execution or user-facing AI
runtime.

## Product Quality Hardening State

Product Quality Hardening #1-#5 is complete for the public mock simulator
surface.

Completed:

- Public Simulator Failure & Input Boundary Hardening;
- API Response Contract Hardening;
- API Abuse Boundary Hardening;
- Public Simulator Mock Truth Boundary;
- Manual QA Matrix Verification, 12/12 PASS.

The public simulator remains mock-only. It explicitly presents preview/demo
state, uses a unified `/api/simulate` response contract, exposes controlled
error states, avoids local fallback simulation after API failure, applies
client/API input boundaries, and has a lightweight in-memory abuse boundary.

Product Quality Hardening #1-#5 did not add AI runtime integration, provider
execution, SDK/env/API keys, auth changes, billing changes, persistence changes,
subscription changes, analytics, telemetry, logging systems, or real AI product
behavior.

The next roadmap focus remains inside Product Quality Hardening. Legal & Trust
Layer, Market Readiness, Closed Beta, Public Launch, and Scale are not active.

## Stage 5.3 Closure Result

Stage 5.3 is closed as AI Quality / Cost / Safety Validation Foundation Complete
at the contracts/runtime-boundary/QA level.

Closed under `lib/ai-quality`:

- AI Quality / Cost / Safety contracts foundation;
- quality criteria, score-band, cost-budget, safety-policy, evidence,
  release-gate, and fail-closed error contracts;
- contracts validation catalog covering chat, answer engine, generic assistant,
  model-call, env/API-key, and provider-payload rejection;
- AI Quality Runtime foundation;
- disabled-by-default runtime evaluation;
- fail-closed quality/cost/safety release-gate evaluation;
- structured runtime result/error contracts;
- AI Quality Boundary / Facade foundation;
- boundary-level runtime evaluation before boundary-ready result;
- boundary-level rejection of unsafe mode, provider-payload, env/API-key, and
  model-call payload fields;
- Stage 5.3 runtime QA/regression aggregation;
- exports through `lib/ai-quality/index.ts`.

Stage 5.3 does not connect OpenAI SDK, real provider SDKs, API keys,
environment variables, fetch/network calls, model execution, API routes, UI,
Simulator runtime, Decision Engine runtime, Prompt Context runtime, AI Provider
runtime, database, Supabase, auth, persistence, subscriptions, dashboard, or
product behavior.

## Stage 5.2 Closure Result

Stage 5.2 remains closed as Prompt / Context Layer Foundation Complete at the
contracts/runtime-boundary/QA level.

Closed under `lib/prompt-context`:

- provider-agnostic Prompt Context input, output, policy, evidence,
  risk-boundary, and error contracts;
- fail-closed input and output validation;
- disabled-by-default contract, runtime, and boundary behavior;
- rejection of raw chat messages, user-supplied system prompts, provider/model
  fields, env names, API keys, client runtime fields, direct answer mode, and
  generic assistant behavior;
- Prompt Context Runtime foundation;
- structured Decision Simulation context construction;
- runtime validation before and after context creation;
- Controlled Prompt Context Boundary / Facade foundation;
- boundary-level runtime build before boundary-ready result;
- structured controlled result/error contracts;
- Stage 5.2 runtime QA/regression aggregation;
- exports through `lib/prompt-context/index.ts`.

## Stage 5.1 Closure Result

Stage 5.1 remains closed as AI Provider Abstraction / Real AI Integration
Foundation Complete at the foundation/runtime-boundary/QA level.

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
- Prompt Context contracts foundation;
- Prompt Context runtime foundation;
- Prompt Context controlled boundary/facade foundation;
- Prompt Context runtime QA/regression aggregation;
- AI Quality / Cost / Safety contracts foundation;
- AI Quality / Cost / Safety runtime foundation;
- AI Quality / Cost / Safety boundary/facade foundation;
- AI Quality / Cost / Safety runtime QA/regression aggregation;
- Controlled AI Integration preflight contracts foundation;
- Controlled AI Integration runtime validation foundation;
- Controlled AI Integration boundary composition foundation;
- Controlled AI Integration dry-run execution foundation;
- public simulator failure/input boundary hardening;
- `/api/simulate` response contract hardening;
- lightweight public simulator abuse boundary hardening;
- public simulator mock/preview truth boundary;
- public simulator manual QA matrix verification, 12/12 PASS;
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
- provider execution;
- streaming;
- AI API routes;
- AI UI;
- Simulator integration with Prompt Context, AI Provider, or AI Quality;
- Simulator integration with Controlled AI Integration;
- Decision Engine integration with Prompt Context, AI Provider, or AI Quality;
- Decision Engine integration with Controlled AI Integration;
- Prompt Context runtime calls from AI Quality;
- AI Provider runtime calls from Prompt Context, AI Quality, or Controlled AI
  Integration;
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

Stage 5.2 Prompt Context scope does not change the product object. Prompt
Context foundation prepares internal structured Decision Simulation context only;
it does not create chat prompts, answer-mode output, assistant memory, or user
prompt history.

Stage 5.3 AI Quality scope does not change the product object. AI Quality
foundation validates internal structured quality/cost/safety evidence only; it
does not call providers, execute models, generate answers, or present UI.

Stage 5.4 Controlled AI Integration scope does not change the product object.
Controlled AI Integration composes internal foundation boundaries for preflight
and dry-run evidence only; it does not execute providers, execute models,
generate answers, present UI, or connect product runtime.

## Production Readiness

Stage 5.4 is not production-ready real AI.

Real AI work remains blocked until a separately approved future stage defines
provider integration, SDK/env/key handling, Prompt Context to AI Provider
connection, post-provider Decision Engine validation, production
safety/cost/quality enforcement, observability, and rollback.

Stage 4.4 is not production-ready billing.

Billing/product work remains blocked until a separately approved future stage
defines provider integration, pricing/legal/tax scope, entitlement sync,
webhooks, UI/API, QA, and rollback rehearsal.

## Next Roadmap Step

Product Quality Hardening is the next roadmap focus.

Product Quality Hardening may proceed only as QA/security/privacy/performance
hardening. The immutable Decision Simulation Engine architecture remains
mandatory, and the next step must not create AI Chat, Answer Engine, Generic
Assistant, direct AI-to-user behavior, model calls, provider execution, API
keys/env/SDKs, AI API routes, UI AI runtime, Simulator runtime integration, or
Decision Engine runtime integration.
