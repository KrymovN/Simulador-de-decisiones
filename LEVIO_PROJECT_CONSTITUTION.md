# LEVIO PROJECT CONSTITUTION

Date: 6 July 2026, Europe/Madrid.

Status: Highest-level canonical governance authority for Levio.es.

## Purpose

This Constitution consolidates the existing project rules for Levio.es into one
top-level source of truth. It does not create a new product, change the roadmap,
open a new stage, approve implementation work, or modify runtime behavior.

Its purpose is to govern:

- product identity;
- immutable architecture;
- roadmap discipline;
- implementation discipline;
- engineering rules;
- documentation hierarchy;
- decision-making rules;
- quality rules;
- completion rules;
- amendment and change rules.

## Authority

`LEVIO_PROJECT_CONSTITUTION.md` is the highest-level canonical authority for
the Levio project.

All active project state documents, implementation plans, architecture
documents, stage documents, QA documents, legal/trust documents, readiness
documents, README files, and future governance documents must defer to this
Constitution.

This Constitution does not replace detailed specifications. It defines the
highest-level rules that detailed specifications must obey.

## Documentation Hierarchy

The canonical documentation hierarchy is:

1. `LEVIO_PROJECT_CONSTITUTION.md`
2. `PROJECT_CONTEXT.md`
3. `LEVIO_IMPLEMENTATION_PLAN.md`
4. `CURRENT_STAGE.md`
5. `LEVIO_CURRENT_STATE.md`
6. `LEVIO_PROJECT_PROGRESS.md`
7. Stage, architecture, QA, legal, readiness, README, decision, and archive
   documents

If project documents conflict, the higher-level document in this hierarchy
prevails unless it has been explicitly amended through the approved amendment
process.

Lower-level documents may add detail, evidence, status, implementation plans,
or historical context. They must not weaken, rename, bypass, or reinterpret
higher-level rules.

Archived documents are retained for traceability only. They are not active
source of truth unless a higher-level active document explicitly restores them.

## Core Product Identity

Levio.es is a Decision Simulation Engine.

Levio is not:

- AI Chat;
- an Answer Engine;
- a Generic AI Assistant;
- a direct AI-to-user wrapper;
- a generic prompt history system;
- an assistant conversation log product.

The Simulator and Decision Engine define the product. The AI Provider, auth,
persistence, subscriptions, monitoring, legal/trust surfaces, and user data
controls are supporting systems around the Decision Simulation Engine.

## Immutable Product Principles

The product must preserve these principles:

- Levio simulates decisions through scenarios, risks, tradeoffs, consequences,
  outcomes, uncertainty, and structured decision reasoning.
- User-facing output must be a decision simulation, not a direct AI answer.
- The Decision Engine owns decision semantics, validation, safety gates,
  recommendation state, normalization, and public response meaning.
- The AI Provider may supply candidate material only after approved integration.
- AI Provider behavior must not become the product surface, product identity,
  product authority, or final decision owner.
- Persistence exists to store owner-scoped Decision Simulation artifacts, not
  AI chat history or hidden generic prompt history.
- Subscriptions may control access to approved capabilities, but must not define
  the product center or remove ownership, privacy, export, or deletion rights.

## Immutable Runtime Architecture

The immutable product runtime architecture is:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

No runtime or product step may bypass the Simulator, Decision Engine, Prompt
Context, AI Provider boundary, post-provider Decision Engine validation, return
through the Simulator, or UI presentation as a simulation.

Forbidden architecture drift includes:

- `USER -> AI PROVIDER -> UI`;
- `USER -> PROMPT CONTEXT -> AI PROVIDER -> UI`;
- `SIMULATOR -> AI PROVIDER -> UI` without post-AI Decision Engine validation;
- raw AI provider output presented as authoritative product output;
- AI-generated final answers that bypass scenario, risk, tradeoff, consequence,
  and outcome modeling;
- provider-specific behavior that makes Levio a wrapper over one AI provider.

Any proposed exception requires explicit architectural and product governance
approval before code, configuration, public copy, or roadmap changes.

## Product Development Principles

Project work must follow this order:

- foundation before implementation;
- implementation before production;
- production before commercial scale.

Planning documents, foundations, readiness inventories, and closure gates do
not equal production readiness unless the relevant higher-level document and
approved stage criteria explicitly say so.

No project task may create governance for governance, artificial documentation
loops, or micro-stage proliferation. Governance exists to protect product,
runtime, legal, quality, and roadmap decisions, not to inflate progress.

## Engineering Rules

Engineering work must obey these rules:

- Use existing approved boundaries before adding new ones.
- Preserve server-only boundaries for auth, owner resolution, persistence,
  subscriptions, user data controls, AI Provider execution, and any future
  billing or production runtime.
- Do not bypass approved Auth, Persistence, Decision Engine, Prompt Context,
  AI Provider, User Data Controls, or Subscription boundaries.
- Keep provider SDKs, secrets, API keys, raw provider payloads, and provider
  identity details out of product logic and client surfaces.
- Fail closed when identity, ownership, entitlement, consent, provider,
  validation, safety, or policy state cannot be proven.
- Do not turn UI state, localStorage, mock sessions, public input fields, or
  client-supplied metadata into trusted authorization or ownership evidence.
- Do not change public contracts, runtime architecture, database schema,
  migrations, UI, API behavior, product behavior, or roadmap state unless the
  task explicitly approves that scope.

## Ownership and Data Rules

Ownership rules are immutable unless explicitly amended:

- User-owned data requires a stable owner or an explicit temporary guest scope.
- Durable user-owned records must be owner-scoped.
- Ownership must be resolved by server-side runtime.
- Client-supplied owner fields must never be trusted.
- Supabase `auth.users.id` is a provider reference, not the product owner.
- The canonical owner anchor is the Levio principal model, including
  `levio_principals.principal_id` where persistence applies.
- Authenticated actor, owner principal, provider reference, entitlement,
  consent, retention, export eligibility, and deletion state are separate
  concepts and must not be collapsed into one flag.
- Export, deletion, retention, and privacy rights must not be blocked or
  weakened by subscription tier, downgrade, cancellation, UI state, or provider
  implementation detail.
- Persistence, account, user-data, AI, billing, analytics, and tracking
  boundaries must remain isolated until an approved integration joins them.

## AI Integration Rules

Real AI execution remains deferred unless explicitly approved.

Before Real AI execution can be enabled, the project must have explicit approval
for provider scope, SDK/env/key handling, Prompt Context -> AI Provider
connection, provider data processing, cost controls, safety controls, quality
validation, observability, rollback, and post-provider Decision Engine
validation.

AI integration must preserve:

- provider neutrality;
- internal-only AI Provider role;
- no raw AI answer as final product output;
- no raw prompt, secret, API key, provider token, hidden chain-of-thought, raw
  provider response, embedding, or vector stored or exposed by default;
- no AI Chat, Answer Engine, Generic AI Assistant, professional-advice, or
  direct AI-to-user positioning.

Dry-run, preflight, adapter, Prompt Context, AI Quality, and boundary
foundation work is not Real AI execution.

## Roadmap Rules

The roadmap must remain evidence-based and bounded.

The project must not open or execute any of the following without explicit
approval:

- Production Release;
- Commercial Launch;
- Scale Execution;
- Real AI execution;
- production billing or commercial runtime;
- analytics, marketing, tracking, session replay, or similar measurement;
- new public contracts;
- new roadmap branches;
- new stages outside the approved roadmap.

Closed documentation/readiness stages do not automatically authorize the next
execution step. Each major execution step requires its own approved gate.

Stage 15.4 aggregate Scale verdict remains NOT READY until a later approved
gate changes it with evidence.

## Implementation Rules

Implementation work must start by comparing the current canonical sources in
the hierarchy and identifying:

- current block;
- completed work;
- remaining work;
- blockers;
- next implementation step;
- whether the step is product implementation, runtime implementation, QA,
  documentation, legal/trust readiness, or commercial readiness.

Implementation must not inflate progress percentages, treat foundation modules
as production completion, or use readiness documentation as evidence of runtime
completion.

The current canonical V1 implementation comparator is
`LEVIO_IMPLEMENTATION_PLAN.md`, subordinate to this Constitution.

## Quality and Verification Rules

Quality evidence must match the work performed.

For runtime, UI, API, database, architecture, or product behavior changes,
relevant quality gates must run and their results must be recorded in canonical
documents when the change is meaningful to project state.

For documentation-only governance changes, `git diff --check` is the minimum
required repository check unless the project convention or the change itself
requires a broader gate.

Stage 10 baseline quality gates remain accepted historical evidence for the
deterministic-preview public surface. They do not replace current validation
when later implementation work changes the relevant surface.

## Legal / Trust / Public Promise Rules

Public surfaces must reflect actual runtime state.

Levio must not make premature promises about:

- Real AI;
- production AI provider execution;
- real accounts;
- production persistence;
- export/delete execution;
- permanent memory;
- billing, paid plans, subscriptions, checkout, invoices, or commercial access;
- analytics, tracking, marketing, or production monitoring;
- Closed Beta execution;
- Public Launch execution;
- Production Release;
- Commercial Launch;
- Scale;
- legal-grade, financial, medical, professional, or high-stakes advice;
- guaranteed correct decisions or guaranteed outcomes;
- compliance claims not approved by legal/owner review.

Legal, trust, privacy, cookie/consent, AI transparency, public launch, and
commercial claims must remain bounded by approved source documents and actual
runtime evidence.

## Completion Rules

A stage, block, or task is complete only when:

- its approved scope is satisfied;
- its explicit non-scope remains untouched;
- required evidence exists;
- relevant quality and verification checks are complete or explicitly deferred
  by an approved rule;
- canonical documents reflect actual runtime and roadmap state;
- contradictions are resolved or documented with a safe resolution;
- completion does not imply later execution gates unless explicitly approved.

Foundation-ready does not mean production-ready.

Readiness-ready does not mean execution-ready.

Documentation closure does not mean runtime completion.

## Decision-Making Rules

When a project decision is required:

- preserve the Constitution first;
- use the documentation hierarchy to resolve source-of-truth conflicts;
- prefer the smallest bounded action that preserves product identity and
  architecture;
- stop before code changes if a proposed change would violate immutable
  architecture or product identity;
- record unresolved contradictions rather than silently implementing through
  them;
- require explicit approval for architecture exceptions, roadmap expansion,
  Real AI execution, production billing, Production Release, Commercial Launch,
  Scale execution, public-contract changes, or compliance/public promise
  expansion.

If documents conflict, the higher-level document in the hierarchy prevails
unless it has been explicitly amended.

## Amendment Rules

`LEVIO_PROJECT_CONSTITUTION.md` cannot be changed as part of normal
implementation work.

It may only be changed through explicit architectural/product governance
approval.

Any amendment must:

- identify the rule being changed;
- state why existing lower-level documents are insufficient;
- assess product identity, architecture, roadmap, legal/trust, quality, and
  implementation consequences;
- update affected canonical documents after approval;
- avoid using the amendment to smuggle runtime, UI, API, database, Real AI,
  billing, launch, commercial, or scale execution into an unrelated task.

Until an amendment is approved, this Constitution prevails.
