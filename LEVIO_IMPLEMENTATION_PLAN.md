# LEVIO IMPLEMENTATION PLAN

Date: 6 July 2026, Europe/Madrid.

Status: Canonical V1 implementation comparison document.

This document defines the final implemented target for Levio V1 and provides a
stable comparison model between the current project state and the completed
product state. It does not open Production Release, Commercial Launch, Scale
Execution, Real AI execution, billing execution, analytics, tracking, or a new
roadmap branch.

## 1. Final Implementation Target

Final target:

**Levio V1 Complete** - a production-ready Decision Simulation Engine where
users can:

- create and manage real accounts;
- run decision simulations;
- save simulations;
- reopen saved simulations;
- manage ownership-bound simulation data;
- export and delete their data;
- use a real AI Provider as an internal component of the Decision Engine;
- use the product through stable production runtime;
- access commercial subscription flows if enabled;
- rely on monitoring, logging, support, rollback, security, legal, privacy, and
  operational readiness.

Production Release and Commercial Launch are milestones. They are not the
definition of final implementation by themselves.

The final implementation target is the complete product state above: real
runtime, real account ownership, persistent decision simulation objects, user
data controls, internal Real AI execution, validation, operations, and optional
commercial production capability.

## 2. Immutable Product Architecture

Levio is a Decision Simulation Engine.

Levio is not:

- an AI Chat;
- an Answer Engine;
- a generic assistant.

The immutable product architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

AI Provider is internal only. It must not become the product surface, the user
interface model, or the primary product object.

Persistence, auth, subscriptions, monitoring, legal/trust surfaces, and user
data controls are supporting systems around the Decision Simulation Engine.
They must not bypass the Simulator, Decision Engine, Prompt Context, or AI
Provider boundaries.

## 3. Implementation Blocks

### A. Decision Simulation Persistence Implementation

Goal:

Make decision simulations persistent product objects.

Scope:

- save simulations;
- list saved simulations;
- load/reopen simulations;
- connect simulations to persistence boundary;
- connect simulations to account/user ownership;
- prepare dashboard/history integration.

Exit criteria:

- user-owned simulations can be stored and retrieved through approved runtime
  boundaries;
- saved simulation list is available through product surface or approved
  dashboard boundary;
- no mock ownership is used for production paths;
- existing persistence architecture is not bypassed.

### B. Real User Account Runtime

Goal:

Complete the real user account lifecycle.

Scope:

- registration;
- email confirmation;
- login;
- logout;
- password reset;
- session recovery;
- protected routes;
- dashboard connected to real account state;
- Supabase settings, redirects, email delivery, session behavior.

Exit criteria:

- real user session behavior works end-to-end;
- dashboard reflects real account state;
- protected areas are not accessible without valid session;
- account ownership works with saved simulations.

### C. User Data Management

Goal:

Give users control over their account-bound data.

Scope:

- export data;
- delete data;
- retention handling;
- privacy/data-control flows;
- saved simulation data inclusion;
- ownership validation;
- account data lifecycle boundaries.

Exit criteria:

- users can export relevant account data;
- users can delete relevant account data;
- retention behavior is documented and enforced;
- privacy/data-control blockers are closed.

### D. Production AI Integration

Goal:

Connect the real AI Provider as an internal Decision Engine component.

Scope:

- real provider integration;
- prompt context runtime path;
- Decision Engine pre/post AI processing;
- simulation output normalization;
- cost/safety/error controls;
- fallback behavior;
- no chat-like product drift.

Exit criteria:

- real AI Provider works through approved internal architecture;
- AI never becomes the product surface;
- simulation output remains structured as decision simulation;
- provider errors are controlled and user-safe.

### E. Product Validation & Production Readiness

Goal:

Validate that Levio is reliable, secure, explainable, and production-ready.

Scope:

- regression testing;
- decision simulation quality validation;
- consistency testing;
- evidence/traceability;
- observability;
- security review;
- performance validation;
- production hardening;
- runtime QA.

Exit criteria:

- build/typecheck/lint pass;
- core user flows pass;
- simulation quality is validated;
- observability and error tracking are ready;
- security/privacy risks are reviewed;
- production blockers are documented or closed.

### F. Commercial Production

Goal:

Move from completed product runtime to commercial operation.

Scope:

- billing;
- subscriptions;
- plan limits;
- monitoring/logging/support;
- rollback procedures;
- final legal documents;
- Production Release;
- Commercial Launch;
- Scale Execution.

Exit criteria:

- commercial flows are functional;
- legal/trust surface is final;
- operational support process exists;
- production release is approved;
- commercial launch is approved;
- scale execution can begin.

## 4. Current State Mapping

This mapping is evidence-based and conservative. It does not treat a foundation
module, planning document, or readiness checklist as production completion.

| Block | Current status | Evidence | Remaining work |
| --- | --- | --- | --- |
| A. Decision Simulation Persistence Implementation | In Progress | Stage 4.2 persistence runtime foundation is closed. `lib/persistence-runtime` exists with owner contracts, Supabase provider, runtime wiring, simulation record save, history append, and draft save/update services. The recent `Saved Decision Simulations Runtime Foundation` commit adds an internal `lib/saved-decision-simulations` runtime boundary for save/load/list over owner-scoped simulation records. | Product surface or approved dashboard boundary for saved simulation list/load is not complete. Real account ownership must be connected end-to-end. Production Supabase environment/RLS/service boundary and user-flow QA remain incomplete. |
| B. Real User Account Runtime | Foundation Complete | Stage 4.1 auth runtime hardening exists. Supabase Auth boundary, server session validation, auth callback, protected dashboard layout, redirects, and fail-closed protected access are implemented at foundation level. | Real Supabase project settings, email delivery, redirect allowlist, session behavior, password reset policy, production validation, and account-to-persistence ownership path are not complete. |
| C. User Data Management | Foundation Complete | Stage 4.3 User Data Controls foundation is closed. Export, deletion, retention, consent, server workflow, runtime boundary, and persistence read adapter modules exist as internal foundations. | User-facing export/delete flows are not product-executable. Stored decision artifact controls are not integrated with account-bound product flows. Privacy/data-control legal blockers remain open for production. |
| D. Production AI Integration | Deferred | Stage 5.1, 5.2, 5.3, and 5.4 foundation work is closed. AI provider abstraction, Prompt Context foundation, quality/cost/safety validation, controlled integration preflight, boundary composition, and dry-run foundation exist. | Real provider SDK/env/key execution, model calls, Prompt Context -> AI Provider runtime path, Decision Engine post-provider validation, cost controls, error controls, and user-safe AI output path remain deferred. |
| E. Product Validation & Production Readiness | In Progress | Stage 10 Product Quality Hardening is closed with deterministic preview gates for public simulator, public home, DecisionContext Builder, simulation pipeline runner, public adapter, observability, security, contract regression, HomeSimulator integration, trust readiness, and rendered public surface. Stage 15.4 aggregate verdict is NOT READY. | Full production user-flow QA, current pre-release gate reruns, observability/error tracking, infrastructure readiness, support readiness, incident/rollback decision authority, security/privacy review, and performance validation remain incomplete. |
| F. Commercial Production | Foundation Complete / Deferred | Stage 4.4 subscription runtime foundation is closed. Stage 11 legal/trust layer, Stage 12 market readiness, Stage 13 closed beta planning, Stage 14 public launch readiness, and Stage 15 scale readiness planning are documented. | Billing provider, checkout, customer portal, webhooks, pricing/tax/legal approval, final legal documents, monitoring/logging/support, Production Release, Commercial Launch, and Scale Execution remain unopened or blocked. |

## 5. Progress Model

Percentages below are estimated, conservative, and evidence-based. They measure
Levio V1 Complete, not documentation volume and not roadmap-stage count.

Overall Levio V1 Completion: **38% estimated**

Block A: In Progress, **30% estimated**, remaining work:

- connect saved simulation runtime to an approved product surface or dashboard
  boundary;
- complete list/load/reopen product behavior;
- connect ownership to real account sessions;
- validate production persistence boundary and owner scope;
- verify no mock ownership is used for production paths.

Block B: Foundation Complete, **35% estimated**, remaining work:

- configure and validate real Supabase auth settings;
- validate magic-link/email delivery and callback redirects;
- complete session recovery/logout/password reset policy;
- connect dashboard state to real account state;
- prove protected route behavior in production-like runtime.

Block C: Foundation Complete, **25% estimated**, remaining work:

- implement user-facing export/delete flows;
- include saved simulations, drafts, and history where approved;
- enforce retention and deletion lifecycle behavior;
- close privacy/data-control blockers;
- validate ownership and account lifecycle boundaries.

Block D: Deferred, **20% estimated**, remaining work:

- connect real AI Provider internally;
- execute Prompt Context -> AI Provider -> Decision Engine path;
- normalize outputs as decision simulations;
- implement cost, safety, fallback, and error controls;
- prevent AI Chat / Answer Engine drift.

Block E: In Progress, **45% estimated**, remaining work:

- rerun and expand validation for production runtime;
- validate core account, persistence, data-control, AI, and commercial flows;
- establish observability/error tracking;
- complete security/privacy/performance review;
- close or document production blockers with owners.

Block F: Foundation Complete / Deferred, **15% estimated**, remaining work:

- implement commercial billing/subscription flows if enabled;
- finalize legal/trust documents and approvals;
- establish support, monitoring, logging, rollback, and operations;
- approve Production Release;
- approve Commercial Launch;
- approve Scale Execution.

## 6. Next Action Rule

At the start of every future implementation block, compare:

- `CURRENT_STAGE.md`;
- `LEVIO_CURRENT_STATE.md`;
- `LEVIO_PROJECT_PROGRESS.md`;
- `LEVIO_IMPLEMENTATION_PLAN.md`.

Then identify:

- current block;
- completed work;
- remaining work;
- blockers;
- next implementation step;
- whether the step is product implementation, runtime implementation, QA,
  documentation, or commercial readiness.

The comparison must preserve the immutable architecture and must not convert
Levio into AI Chat, an Answer Engine, or a generic assistant.

## 7. Current Next Correct Implementation Step

Current implementation block: **Block A - Decision Simulation Persistence
Implementation**.

Current evidence:

- Stage 4.2 persistence runtime foundation exists;
- Stage 4.1 auth runtime foundation exists;
- Stage 4.3 user data controls foundation exists;
- `Saved Decision Simulations Runtime Foundation` adds an internal save/load/list
  runtime boundary for saved decision simulations;
- Stage 15.4 aggregate Scale verdict remains NOT READY;
- Stage 15.5 blocker framework remains relevant for production/scale blockers.

Next correct implementation step:

Continue Block A by connecting saved decision simulation persistence to an
approved product surface or dashboard boundary for authenticated users, without
bypassing the existing Auth/Persistence foundations and without changing the
public `/api/simulate` contract.

This next step is **product implementation** with server/runtime integration
and UI/dashboard boundary work only if separately approved.

It must not open:

- Production Release;
- Commercial Launch;
- Scale Execution;
- Real AI execution;
- billing;
- analytics;
- tracking;
- roadmap expansion.

## 8. Levio V1 Complete Criteria

Levio V1 Complete requires all of the following:

- Decision Simulation Engine identity remains intact.
- Immutable architecture remains intact.
- Users can create and manage real accounts.
- Users can run decision simulations.
- Users can save decision simulations as user-owned product objects.
- Users can list and reopen saved simulations.
- Saved simulations are owner-scoped through the approved persistence boundary.
- Users can export and delete relevant account-bound data.
- Retention and deletion lifecycle behavior is implemented and validated.
- Real AI Provider works only as an internal Decision Engine component.
- Simulation output remains structured decision simulation output.
- Public and internal contracts are stable and validated.
- Core user flows pass production-level QA.
- Observability, error handling, logging, support, rollback, and incident
  response are ready.
- Security, privacy, legal, trust, and operational blockers are closed or
  explicitly accepted by the correct owner for the intended release scope.
- Commercial subscription flows are functional if enabled for V1.
- Production Release is approved.
- Commercial Launch is approved if commercial operation is in scope.
- Scale Execution is approved only after readiness evidence supports it.

## 9. Non-Changes

This document does not change:

- runtime code;
- UI;
- API;
- public contract;
- architecture;
- roadmap;
- simulator behavior;
- Decision Engine behavior;
- Prompt Context behavior;
- AI Provider behavior;
- auth runtime;
- persistence runtime;
- billing;
- analytics;
- tracking;
- logging;
- infrastructure.

This document does not by itself complete any implementation block. It is the
canonical comparison plan for deciding what remains before Levio V1 Complete.
