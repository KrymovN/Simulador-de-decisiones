# LEVIO STAGE 4.3Q USER DATA CONTROLS READINESS PLAN

## Document Status

- Stage: 4.3Q - User Data Controls Product Integration Readiness Plan.
- Status: readiness plan / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Confirmed previous checkpoint: `f32d387` - Stage 4.3P User Data Controls Product Integration Scope Lock.
- Depends on: Stage 4.2L persistence runtime closure, Stage 4.3 dependency audit, Stage 4.3A-H user data controls foundation, Stage 4.3P product integration scope lock, and immutable target runtime architecture.
- Runtime code: not changed.
- UI: not changed.
- API routes: not changed.
- Supabase production runtime: not connected.
- OpenAI / AI Provider: not connected.
- Billing / Subscription Runtime: not connected.
- Product behavior: not changed.

This document defines the readiness plan for future Stage 4.3 product
implementation. It does not approve implementation. It does not connect user
data controls to product UI, API routes, database runtime, Supabase production
runtime, OpenAI, billing, subscriptions, simulator runtime, or product behavior.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a generic AI assistant.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

User data controls may support ownership, privacy, export, deletion, consent,
and retention only around decision simulation artifacts. They must not create AI
chat history, generic prompt history, assistant conversation logs, or generic AI
assistant behavior as product primitives.

## Audit Inputs

Reviewed sources for this readiness plan:

- `PROJECT_CONTEXT.md`
- `CURRENT_STAGE.md`
- `LEVIO_CURRENT_STATE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- `LEVIO_STAGE_4_2L_PERSISTENCE_RUNTIME_STATE_CLOSURE.md`
- `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `LEVIO_STAGE_4_3H_USER_DATA_CONTROLS_CLOSURE.md`
- `LEVIO_STAGE_4_3P_USER_DATA_CONTROLS_PRODUCT_INTEGRATION_SCOPE_LOCK.md`
- current `lib/user-data-controls` foundation package
- current git history through `f32d387`

Runtime scan result:

- no application UI/API import of `lib/user-data-controls` was found outside the isolated package;
- Stage 4.3 user data controls remain foundation/preflight/boundary/QA only;
- evidence flags in `lib/user-data-controls` confirm no runtime writes, database operations, Supabase connection, UI integration, API integration, auth-runtime connection, persistence-runtime connection, subscription integration, memory integration, or AI integration;
- Stage 4.2 persistence remains foundation / isolated runtime boundary complete, not product integrated and not production-ready;
- Stage 4.3 product integration has not started.

## Readiness Summary

Stage 4.3Q outcome:

```text
READINESS PLAN COMPLETE; IMPLEMENTATION NOT APPROVED
```

The project is ready to define a controlled implementation gate. It is not ready
to start product/runtime implementation immediately after Stage 4.3Q.

Reason:

- foundation modules exist;
- product integration boundary is locked;
- but auth, persistence, product workflow, legal/privacy copy, production
  Supabase validation, and implementation QA evidence remain incomplete.

## What Is Already Ready

The following are ready as foundations or planning inputs:

- Stage 4.3A-H user data controls foundation under `lib/user-data-controls`;
- consent, retention, export, and deletion preflight models;
- disabled-by-default user data controls runtime boundary;
- deterministic QA/regression catalogs for foundation behavior;
- fail-closed owner/session/resource-category checks inside foundation modules;
- explicit exclusion of AI prompts, raw AI responses, embeddings, vectors, memory data, billing records, service-role data, auth tokens, provider secrets, and other-user records;
- Stage 4.3P product integration boundary around decision simulation artifacts;
- owner-scoped model based on `levio_principals.principal_id`;
- Stage 4.2L persistence closure identifying simulations, drafts, history, future exports, and future deletions as decision simulation artifacts;
- immutable architecture governance preserving Levio as a Decision Simulation Engine.

Ready does not mean production-ready. These items are usable as design and
implementation inputs only after a later implementation gate is approved.

## What Remains Blocked

The following remain blockers before implementation:

- production Supabase/auth/persistence validation is not recorded;
- persistence product integration for save/list/read/update/archive/delete is not approved;
- real owner-scoped list/read services for export sources are not product-ready;
- real deletion lifecycle execution policy is not approved;
- export package format, generation, storage, download, expiration, and audit posture are not approved;
- durable consent ledger and consent copy are not approved;
- retention policy publication and automated retention job scope are not approved;
- privacy visibility UX and copy are not approved;
- legal/privacy review is not complete;
- UI/API workflow scope is not approved;
- production QA matrix for data-control execution is not approved;
- rollback evidence for public user-facing data controls is not defined.

## What Must Be Implemented First

The first implementation area must not be UI. It must not be OpenAI, billing,
subscriptions, memory, or production export file generation.

When implementation becomes approved later, the first implementation stage
should be:

```text
Stage 4.3S User Data Controls Server Workflow Foundation
```

Purpose:

- connect the existing Stage 4.3 foundation to server-only workflow orchestration;
- require authenticated owner resolution through `levio_principals.principal_id`;
- operate only over already approved owner-scoped persistence resources;
- keep export as preflight/package-plan first, not file generation;
- keep deletion as lifecycle-plan first, not hard delete;
- preserve disabled-by-default rollout controls;
- expose no public UI until API and product copy are separately approved.

Stage 4.3S is not approved by this document. It is the first plausible
implementation stage only after the mandatory gates below are completed.

## Dependencies Required Before Implementation

Before Stage 4.3S or any other implementation stage can begin, these dependencies
must exist:

- approved implementation gate document;
- production-safe auth/session validation evidence;
- provider-reference to Levio-principal resolution evidence;
- owner-scoped persistence product-readiness evidence;
- server-only control workflow architecture;
- exact controlled resource list for export/delete/retention/visibility;
- product copy and privacy-language scope;
- legal/privacy review path;
- rollback plan;
- QA matrix with pass/fail evidence requirements;
- explicit owner approval for implementation.

## Go Criteria

Implementation may be considered only when all Go Criteria are met:

- `CURRENT_STAGE.md`, `LEVIO_CURRENT_STATE.md`, `PROJECT_CONTEXT.md`, and `LEVIO_PROJECT_PROGRESS.md` agree on the active checkpoint and next step;
- Stage 4.3Q readiness plan is accepted;
- Stage 4.3R implementation gate is completed and accepted;
- auth/session validation proves active registered-user ownership can be resolved;
- `levio_principals.principal_id` ownership resolution is proven server-side;
- persistence resources eligible for controls are product-readable server-side;
- export, deletion, consent, retention, privacy visibility, and ownership verification workflow surfaces are explicitly scoped;
- legal/privacy copy dependencies are either approved or explicitly blocked from public exposure;
- QA matrix covers owner mismatch, forged client owner fields, expired session, cross-principal access, disabled modules, restricted resources, rollback, and non-chat invariants;
- rollback can disable controls fail-closed without data exposure or surprise deletion;
- implementation scope explicitly excludes OpenAI, billing, Subscription Runtime, memory runtime, and generic assistant behavior.

## No-Go Criteria

Implementation must not start if any No-Go criterion is present:

- auth/session behavior is not production-validated;
- principal resolution is ambiguous, missing, or client-controlled;
- persistence product list/read behavior is not owner-scoped and server-safe;
- UI/API scope is vague or implies direct client ownership decisions;
- export includes AI prompts, raw AI responses, embeddings, memory, billing records, provider secrets, auth tokens, service-role data, other-user records, or assistant logs;
- deletion would hard-delete data before lifecycle planning and rollback are proven;
- legal/privacy copy is missing for user-facing controls;
- retention behavior is indefinite, implicit, or untestable;
- controls would imply AI chat history, generic prompt history, or assistant conversation logs as primary product data;
- implementation requires OpenAI, billing, Subscription Runtime, or memory runtime coupling;
- rollback cannot safely disable the workflow.

## Runtime Readiness Criteria

Runtime readiness requires:

- server-only workflow boundary;
- disabled-by-default rollout posture;
- no client-supplied owner authorization;
- authenticated registered-user context;
- provider reference resolved to exactly one active `levio_principals.principal_id`;
- owner-scoped persistence resources available through controlled services;
- no direct Supabase client writes from UI;
- no real export file generation until package/storage/download boundaries are approved;
- no hard deletion until lifecycle/audit/rollback evidence is approved;
- deterministic validation for every allowed operation and blocked state;
- no OpenAI, billing, subscription, memory, or generic assistant coupling.

## Product Readiness Criteria

Product readiness requires:

- product copy that describes data controls around decision simulation artifacts;
- privacy visibility that does not imply AI chat history storage;
- export UX scope that describes what can and cannot be exported;
- deletion UX scope with confirmation, consequences, restrictions, and rollback limits;
- consent copy that remains purpose-specific and does not bundle registration, saving, subscription, AI training, analytics, or memory;
- retention copy that is category-specific and testable;
- support/escalation posture for blocked export or deletion requests;
- no dashboard language that turns simulations into chat threads;
- no UI promise that exceeds foundation/runtime capability.

## Ownership Readiness Criteria

Ownership readiness requires:

- canonical owner anchor remains `levio_principals.principal_id`;
- Supabase `auth.users.id` remains a provider reference only;
- every controlled resource has an owner field or approved parent-owner mapping;
- simulation history entries preserve parent simulation ownership;
- export packages and deletion records are owner-scoped if created later;
- client-provided IDs, emails, provider references, subscription state, or record IDs never authorize actions;
- cross-principal access fails closed;
- guest, workspace, admin, subscription, AI, memory, and service-owner scopes remain out of Stage 4.3 implementation unless separately approved.

## Product Workflow Readiness

Before implementation, each future workflow must have a one-page scope:

- Export: request source, included categories, excluded categories, package shape, download boundary, expiration, audit evidence, retry behavior, and rollback.
- Deletion: request source, confirmation model, lifecycle states, restricted/legal exception states, deletion record, irreversible-action boundary, and rollback.
- Consent: purpose list, copy, ledger need, withdrawal behavior, and non-scope categories.
- Retention: resource categories, default retention, expiration behavior, job/no-job decision, backup/operational log boundary, and legal exception handling.
- Privacy visibility: dashboard/account surface, visible fields, unavailable categories, copy constraints, and support escalation.
- Ownership verification: server-only resolution flow, failure states, forged-owner tests, and cross-principal tests.

## Required Mandatory Stages Before Implementation

Stage 4.3Q does not approve implementation. The following stages are mandatory
before implementation may start:

1. `Stage 4.3R User Data Controls Implementation Gate & Evidence Closure`
   - documentation/validation-only;
   - proves auth/session, principal resolution, persistence product-readiness,
     legal/privacy copy path, QA matrix, and rollback readiness;
   - ends with explicit Go / No-Go.

2. Explicit owner approval for the first implementation stage.
   - must name the exact files/surfaces allowed;
   - must confirm no OpenAI, billing, Subscription Runtime, memory, generic chat,
     or unrelated UI/API work.

Only after those are complete may the first implementation stage be considered.

## First Implementation Stage After Gates

The first implementation stage after the mandatory gates should be:

```text
Stage 4.3S User Data Controls Server Workflow Foundation
```

Allowed direction for Stage 4.3S, if later approved:

- server-only orchestration;
- owner-scoped registered-user controls;
- no UI;
- no public API route unless separately scoped inside the implementation gate;
- no real export file generation;
- no hard deletion;
- no retention jobs;
- no durable consent ledger unless separately approved;
- no OpenAI;
- no billing;
- no Subscription Runtime;
- no product behavior outside decision simulation artifacts.

## Implementation Permission Answer

Question:

```text
Can implementation start immediately after Stage 4.3Q?
```

Answer:

```text
NO.
```

Reason:

Stage 4.3Q is a readiness plan. It confirms that the project has enough
foundation to define an implementation gate, but it does not close the required
auth, persistence, product, legal/privacy, QA, and rollback evidence.

Implementation is allowed only after Stage 4.3R is completed with a Go decision
and the project owner explicitly approves Stage 4.3S.

## Next Approved Step

The next approved roadmap step after Stage 4.3Q is:

```text
Stage 4.3R User Data Controls Implementation Gate & Evidence Closure
```

Stage 4.3R must remain documentation/validation-only unless the project owner
explicitly changes scope. Its purpose is to decide whether implementation may
start, not to implement it.

## Readiness Decision

Decision:

```text
STAGE 4.3Q READINESS PLAN COMPLETE; IMPLEMENTATION BLOCKED
```

No runtime code, UI, API route, Supabase production runtime, OpenAI, billing,
Subscription Runtime, dependency, or product behavior change is approved by this
document.
