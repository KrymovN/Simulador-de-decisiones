# LEVIO STAGE 4.3 RUNTIME DEPENDENCY SCOPE LOCK AUDIT

## Document Status

- Stage: 4.3 Runtime Dependency & Scope Lock Audit.
- Status: audit / documentation-only.
- Date: 20 June 2026, Europe/Madrid.
- Trigger: Product Alignment Session completed and `LEVIO_PROJECT_PROGRESS.md` became the active progress tracker.
- Scope: dependency audit before any production User Data Controls runtime work.
- Runtime code: not changed.
- UI: not changed.
- API routes: not changed.
- AI Provider: not connected.
- Stripe / billing: not connected.
- Dependencies: not changed.

This document records the current dependency state before any User Data Controls
runtime implementation can be considered. It does not create runtime code,
connect UI, connect API routes, connect AI, connect Stripe, connect billing,
change product logic, or approve production data processing.

## Strategic Invariant

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is a Decision Simulation Engine.

The immutable target runtime architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Any runtime step that bypasses the Simulator, Decision Engine, Prompt Context,
or post-AI Decision Engine validation is outside the approved architecture.

## Audit Inputs

Reviewed project state sources:

- `PROJECT_CONTEXT.md`
- `LEVIO_CURRENT_STATE.md`
- `CURRENT_STAGE.md`
- `LEVIO_PROJECT_PROGRESS.md`
- `LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`
- Stage 4.x documents
- Stage 5.x documents available in the repository
- recent git history
- current runtime file layout under `lib/`, `app/`, `components/`, and `supabase/`

Runtime scan result:

- `lib/persistence-runtime` exists and contains Stage 4.2E through 4.2K runtime foundation modules.
- `lib/user-data-controls` exists and contains Stage 4.3 foundation/boundary/QA modules.
- `lib/subscriptions` exists and contains Stage 4.4 foundation/boundary/QA modules.
- `lib/ai-provider`, `lib/prompt-context`, and `lib/ai-quality` exist as isolated Stage 5 foundation packages.
- No application UI/API import of `lib/persistence-runtime`, `lib/user-data-controls`, `lib/subscriptions`, `lib/ai-provider`, `lib/prompt-context`, or `lib/ai-quality` was found outside their isolated packages.
- No OpenAI SDK, Stripe SDK, billing provider, checkout route, or model-call route is present in `package.json` or application runtime.
- Existing API routes are limited to `/api/simulate` and `/auth/callback`.

## Runtime State Table

| Stage | Planned | Implemented | Foundation Only | Production Ready | Open Items |
| --- | --- | --- | --- | --- | --- |
| Stage 4.2 | Persistence architecture, principal mapping, schema/migrations, dev execution, server-only persistence runtime, provider adapter, runtime wiring, simulation record/history/draft persistence. | Stage 4.2A-D documents and migrations exist. Dev execution intake is accepted. `lib/persistence-runtime` includes 4.2E-K foundation/provider/wiring/record/history/draft modules. | Partly. Runtime modules exist, but product runtime integration is still controlled/disabled and evidence flags show no UI/API/auth/simulator integration. | No. | No production Supabase/env validation, no UI/API save/list/read flows, no connected auth-to-principal product path, no production QA, no Stage 4.2E-K closure document, stale handoff references still say 4.2E had not started. |
| Stage 4.3 | Consent, retention, export, deletion, user-data-control boundary, QA, and future production workflows. | `lib/user-data-controls` foundation modules are present and Stage 4.3H closes foundation/runtime-boundary/QA. | Yes. | No. | No real export generation, no real deletion execution, no consent storage/UI, no dashboard/API integration, no jobs, depends on production-safe persistence and auth ownership. |
| Stage 4.4 | Subscription contracts, entitlement runtime, boundary, QA, future billing/commercial runtime. | `lib/subscriptions` foundation modules are present and Stage 4.4E closes foundation/runtime-boundary/QA. | Yes. | No. | No billing provider, no Stripe, no checkout/customer portal, no payment webhooks, no UI/API integration, no commercial entitlement persistence. |
| Stage 5.1 | AI Provider Adapter contracts/runtime/boundary/QA. | `lib/ai-provider` exists and Stage 5.1E closes contracts/runtime/boundary/QA. | Yes. | No. | No OpenAI SDK, no API keys/env reads, no API route, no model calls, no Decision Engine or Simulator runtime connection. |
| Stage 5.2 | Prompt / Context contracts/runtime/boundary/QA. | `lib/prompt-context` exists and Stage 5.2E closes contracts/runtime/boundary/QA. | Yes. | No. | No model calls, no AI Provider runtime connection, no Decision Engine runtime connection, no API/UI integration. |
| Stage 5.3A | AI quality/cost/safety contracts foundation. | `lib/ai-quality/contracts.ts` and `validation.ts` were added by commit `d91f999`. | Yes. | No. | No standalone Stage 5.3A document, no runtime integration, no model-call quality evaluation. |
| Stage 5.3B | AI quality/cost/safety runtime foundation. | `lib/ai-quality/runtime.ts` and `runtime-validation.ts` were added by commit `9d0274c`. | Yes. | No. | No standalone Stage 5.3B document, no AI Provider runtime connection, no real cost/safety enforcement against model calls. |
| Stage 5.3C | AI quality/cost/safety boundary. | `lib/ai-quality/boundary.ts` and `boundary-validation.ts` were added by commit `d47f901`. | Yes. | No. | No standalone Stage 5.3C closure document, no real AI runtime integration, Stage 5.3D not started. |

## Cross-Document Consistency Check

`CURRENT_STAGE.md`, `LEVIO_CURRENT_STATE.md`, and `PROJECT_CONTEXT.md` now agree
at the top-level checkpoint that this Stage 4.3 Runtime Dependency & Scope Lock
Audit is the current confirmed checkpoint. They also preserve Stage 5.3C as the
latest confirmed foundation checkpoint before this audit and confirm that real
AI runtime integration has not started.

`LEVIO_PROJECT_PROGRESS.md` is the active progress tracker after Product
Alignment Session. It correctly warns that foundation-ready does not mean
production-ready and redirects the roadmap focus toward runtime completion.

The documents are directionally consistent on the strategic invariant:

- Levio remains a Decision Simulation Engine.
- AI Provider is internal infrastructure.
- UI must not present direct AI answers.
- Real AI runtime is not connected.

## Contradictions and Stale State

The audit found these conflicts between roadmap, tracker, runtime, and git
history:

1. `CURRENT_STAGE.md`, `LEVIO_CURRENT_STATE.md`, and `PROJECT_CONTEXT.md`
   contain superseded Stage 4.2D language saying Stage 4.2E had not started.
   Git history and `lib/persistence-runtime` show Stage 4.2E-K runtime
   foundation modules exist.

2. The same handoff documents include an older line stating Stage 4.3 User Data
   Controls is complete while Stage 4.4 and Stage 5.x remain unstarted. Git
   history shows Stage 4.4, Stage 5.1, Stage 5.2, and Stage 5.3A-C foundation
   work now exists.

3. Stage closure documents correctly described the state at their own time, but
   later stages make some "next stage not started" statements historical:
   Stage 4.3H predates Stage 4.4, Stage 4.4E predates Stage 5.1, Stage 5.1E
   predates Stage 5.2, and Stage 5.2E predates Stage 5.3A-C.

4. `LEVIO_PROJECT_PROGRESS.md` states the current roadmap focus as
   `Stage 4.3 -> Stage 4.4 -> Real AI Integration`. That is valid as product
   runtime focus, but it must not be read as saying Stage 4.4/5 foundation work
   is absent.

5. Stage 5.3A-C have git commits and code modules, but no standalone
   `LEVIO_STAGE_5_3*.md` stage documents. This is a documentation gap.

6. Stage 4.2E-K have git commits and runtime modules, but no dedicated
   Stage 4.2E-K closure handoff document. This is a documentation gap.

7. Runtime evidence objects inside some foundation modules record facts such as
   `stage43Started: false` or `stage44Started: false`. Those values are local
   non-coupling evidence for the stage when the module was created, not a
   current global project-state source.

## What Is Really Complete

Complete at foundation or contract level:

- Stage 4.2 architecture, principal mapping, migration planning, migration
  files, accepted dev migration execution, and isolated persistence runtime
  foundation modules.
- Stage 4.3 user-data-control foundation, runtime boundary, and deterministic
  QA.
- Stage 4.4 subscription foundation, runtime boundary, and deterministic QA.
- Stage 5.1 AI Provider Adapter foundation.
- Stage 5.2 Prompt / Context foundation.
- Stage 5.3A-C AI quality/cost/safety foundation and boundary.
- Product presentation alignment toward Decision Simulation Engine.
- Immutable target runtime architecture governance.

Complete at product/production runtime level:

- None of Stage 4.3, Stage 4.4, Stage 5.1, Stage 5.2, or Stage 5.3 is
  production-ready.
- Stage 4.2 has runtime modules, but there is no product UI/API/auth/simulator
  integration proving production readiness.

## What Cannot Be Considered Production Ready

The following must not be described as production-ready:

- User Data Controls export/delete/privacy workflows.
- Subscription runtime, billing, payments, Stripe, checkout, or entitlements.
- Real AI integration or model-call runtime.
- AI quality/cost/safety enforcement against real model calls.
- Prompt Context runtime connected to an AI Provider.
- AI Provider runtime connected to OpenAI or any other external model provider.
- Persistence product workflows for save/list/read/update/archive/delete in UI
  or API.
- Auth provider production behavior until redirects, magic links, callback
  exchange, session restore, logout, and legal/privacy provider settings are
  validated.

## Runtime Dependencies

Before Stage 4.3 production runtime work can start, the project needs a clear
runtime dependency chain:

- Auth runtime must provide a validated authenticated session.
- Persistence runtime must resolve the authenticated provider reference to a
  canonical `levio_principals.principal_id`.
- User Data Controls must operate over persisted, owner-scoped resources only.
- Export, deletion, retention, and consent must not accept client-supplied owner
  fields.
- UI/API must not be introduced until the server-only ownership boundary is
  ready and tested.

## Ownership Dependencies

Stage 4.3 depends on ownership being proven by Levio, not by client input:

- `levio_principals.principal_id` remains the canonical owner anchor.
- Supabase `auth.users.id` remains a provider reference only.
- Registered-user persistence is the only currently eligible durable owner path.
- Guest-to-account claim/import behavior remains deferred unless separately
  approved.
- Any data-control request must fail closed when the principal cannot be
  resolved or does not own the target resource.

## Persistence Dependencies

Stage 4.3 production runtime is blocked until persistence is product-ready
enough to support data-control operations:

- owner-scoped saved simulation records must exist through a controlled
  server-only path;
- draft and history persistence semantics must be approved for export/delete
  inclusion;
- production-safe list/read behavior must exist before export planning can
  produce real packages;
- deletion must have a real lifecycle target and rollback/audit posture;
- persistence QA must cover forged owner IDs, cross-user access, session
  expiration, direct client writes, RLS, and rollback.

## Auth Dependencies

Stage 4.3 production runtime depends on auth behavior that is not yet fully
production-validated:

- Supabase project settings and redirect allowlist;
- real magic-link delivery;
- callback exchange on production/preview URLs;
- session restoration and logout against a real provider project;
- provider-side email templates;
- session expiry/revocation behavior;
- legal/privacy review of region, DPA, subprocessors, and retention.

## User Data Control Dependencies

The existing Stage 4.3 package is preflight/foundation only. Production user data
controls require:

- explicit UI/API scope approval;
- real export package design and storage/download boundaries;
- real deletion lifecycle execution policy;
- consent storage and legal-copy scope if consent becomes user-facing;
- retention job/background process scope if automated retention is introduced;
- audit evidence that no forbidden categories are exported or deleted
  incorrectly;
- privacy/legal review before public availability.

## Blockers

Blocking items before Stage 4.3 production runtime:

- no current Stage 4.2E-K closure document consolidates the persistence runtime
  state;
- no production Supabase/auth/persistence environment validation is recorded;
- no product UI/API integration scope for persistence save/list/read exists;
- no real export/delete workflow scope exists;
- no legal/privacy copy and review for user-facing data controls exists;
- no production QA matrix exists for Stage 4.3 data-control execution.

## Risks

- Overstating foundation modules as production readiness could expose privacy
  workflows without real data lifecycle guarantees.
- Starting export/delete UI before persistence readiness could create false user
  expectations.
- Treating Supabase user IDs as canonical owner IDs would violate the approved
  principal model.
- Connecting AI before Stage 4.3/4.4 production boundaries are understood could
  drift Levio toward an AI answer engine.
- Connecting billing before entitlement persistence and legal/commercial scope
  is approved could create inconsistent commercial access behavior.
- Leaving stale handoff text unresolved increases the chance of starting the
  wrong roadmap step.

## Next Approved Step

The next approved roadmap step is:

```text
Stage 4.2L Persistence Runtime State Closure & Product Integration Scope Lock
```

Purpose:

- reconcile Stage 4.2E-K runtime modules with handoff documentation;
- document exactly what persistence runtime can and cannot do now;
- decide the safe product integration boundary for save/list/read operations;
- define the minimum QA evidence required before Stage 4.3 production User Data
  Controls runtime can begin.

Stage 4.3 production runtime remains blocked until this Stage 4.2L closure and
scope lock is completed or the project owner explicitly approves a narrower
non-production Stage 4.3 preflight-only step.

## Audit Decision

Decision:

```text
STAGE 4.3 PRODUCTION RUNTIME NOT APPROVED
```

Reason:

- Stage 4.3 is complete only at foundation/runtime-boundary/QA level.
- Stage 4.2 persistence runtime modules exist, but product integration and
  closure documentation are not yet aligned.
- Auth and persistence production validation remain incomplete.
- Real User Data Controls workflows depend on owner-scoped persisted resources
  and production-safe lifecycle semantics.

No runtime code, UI, API route, AI Provider, Stripe, billing, dependency, or
product logic change is approved by this audit.
