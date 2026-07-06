# Levio Documentation Index

This directory holds long-lived Levio project documentation. The root keeps only
active project state documents and tooling instructions.

## Active Project State

Canonical active state remains in the repository root:

- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)
- [CURRENT_STAGE.md](../CURRENT_STAGE.md)
- [LEVIO_CURRENT_STATE.md](../LEVIO_CURRENT_STATE.md)
- [LEVIO_PROJECT_PROGRESS.md](../LEVIO_PROJECT_PROGRESS.md)

Tooling exceptions that intentionally remain in the root:

- [AGENTS.md](../AGENTS.md)
- [CLAUDE.md](../CLAUDE.md)

## Architecture

`docs/architecture/` contains foundation and target architecture documents:

- AI abstraction, observability, and costs
- Clarification Engine
- Decision Engine and schemas
- Identity, memory, user data, auth, subscription, trust/legal foundations
- Multilingual architecture
- Simulation Response V2
- Target Runtime Architecture
- Visual Engine research plan

## Stage Documents

`docs/stages/` contains historical stage material grouped by stable stage
folder:

- `stage-02-visual-mvp/`
- `stage-03-decision-engine/`
- `stage-04-runtime-architecture/`
  - `stage-04-01-auth-runtime/`
  - `stage-04-02-persistence-runtime/`
  - `stage-04-03-user-data-controls/`
  - `stage-04-04-subscription-runtime/`
- `stage-05-ai-integration/`
- `stage-11-legal-trust/`
- `stage-12-market-readiness/`
- `stage-13-closed-beta/`
- `stage-14-public-launch/`
- `stage-15-scale/`

Stage 10 Product Quality Hardening is baseline-locked in the active state
documents. Repository Structure Normalization is complete. Stage 11.10
Production Legal Blockers Closure Gate is complete as documentation-only
legal/trust closure work. The closure verdict is Stage 11 Closed. Stage 12 may
begin. Stage 12.1 Market Readiness Scope & Entry Lock and Stage 12.2 Market
Readiness Surfaces Definition are complete as documentation-only Market
Readiness work. Stage 12.3 Market Readiness Dependencies & Execution Order is
complete as documentation-only Market Readiness work. Stage 12.4 Market
Readiness Evidence Inventory & Dependency Map is complete as documentation-only
Market Readiness work. Stage 12.5 Market Readiness Completion Criteria & Exit
Gate is complete as documentation-only Market Readiness work. Stage 12.6
Market Readiness Closure Gate is complete as documentation-only Market
Readiness work. Stage 12 is closed. Stage 13.1 Closed Beta Scope & Entry Lock
is complete as documentation-only Closed Beta planning work. Stage 13.2 Closed
Beta Participants & Eligibility is complete as documentation-only Closed Beta
planning work. Stage 13.3 Closed Beta Operating Model & Support Boundaries is
complete as documentation-only Closed Beta planning work. Stage 13.4 Closed
Beta Test Scenarios & Success Criteria is complete as documentation-only
Closed Beta planning work. Stage 13.5 Closed Beta Feedback & Evidence
Collection is complete as documentation-only Closed Beta planning work. Stage
13.6 Closed Beta Completion Criteria & Exit Gate is complete as
documentation-only Closed Beta planning work. Stage 13.7 Closed Beta Closure
Gate is complete as documentation-only Closed Beta closure work. Stage 13 is
closed. Stage 14.1-14.9 are complete and Stage 14 is closed as a Public Launch
readiness block. Stage 15.1 Scale Scope & Entry Lock is complete as
documentation-only Scale planning work. Stage 15.2 Scale Preconditions &
Evidence Inventory is complete as documentation-only prerequisite/evidence
inventory work. Stage 15.3 Scale Readiness Evidence Validation is complete as
documentation-only validation framework work. Stage 15.4 Scale Readiness
Evidence Assessment is complete as documentation-only assessment work with
aggregate verdict NOT READY.

## QA / Quality

`docs/qa/` contains readiness, testing, dataset threshold, and documentation
audit material.

## Decisions

`docs/decisions/` contains explicit project decisions, including provider or
runtime choices that were made as foundation decisions.

## Archive

`docs/archive/` contains superseded historical handoff material. Archived
documents are retained for traceability, not as active project state.

## Current Invariants

- Levio remains a Decision Simulation Engine.
- Public `/api/simulate` keeps the approved deterministic-preview envelope.
- Stage 10 Product Quality Hardening is closed.
- Repository Structure Normalization is complete.
- Real AI Runtime and AI Provider execution remain deferred.
- Stage 11 Legal & Trust Layer is closed.
- Stage 12.1 Market Readiness Scope & Entry Lock is complete as
  documentation-only entry work.
- Stage 12.2 Market Readiness Surfaces Definition is complete as
  documentation-only surfaces-definition work.
- Stage 12.3 Market Readiness Dependencies & Execution Order is complete as
  documentation-only dependency/order work.
- Stage 12.4 Market Readiness Evidence Inventory & Dependency Map is complete
  as documentation-only evidence-inventory work.
- Stage 12.5 Market Readiness Completion Criteria & Exit Gate is complete as
  documentation-only exit-gate work.
- Stage 12.6 Market Readiness Closure Gate is complete as documentation-only
  closure-gate work.
- Stage 12 is closed.
- No further bounded Stage 12 subblock is required.
- Stage 13.1 Closed Beta Scope & Entry Lock is complete as documentation-only
  scope/entry-lock work.
- Stage 13.2 Closed Beta Participants & Eligibility is complete as
  documentation-only participant/eligibility work.
- Stage 13.3 Closed Beta Operating Model & Support Boundaries is complete as
  documentation-only operating/support-boundary work.
- Stage 13.4 Closed Beta Test Scenarios & Success Criteria is complete as
  documentation-only scenario/success-criteria work.
- Stage 13.5 Closed Beta Feedback & Evidence Collection is complete as
  documentation-only feedback/evidence work.
- Stage 13.6 Closed Beta Completion Criteria & Exit Gate is complete as
  documentation-only completion/exit-gate work.
- Stage 13.7 Closed Beta Closure Gate is complete as documentation-only closure
  work.
- Stage 13 is closed.
- Stage 14.1-14.9 are complete.
- Stage 14 is closed as a Public Launch readiness block.
- Stage 15.1 Scale Scope & Entry Lock is complete as documentation-only
  scope/entry-lock work.
- Stage 15.2 Scale Preconditions & Evidence Inventory is complete as
  documentation-only prerequisite/evidence inventory work.
- Stage 15.3 Scale Readiness Evidence Validation is complete as
  documentation-only validation framework work.
- Stage 15.4 Scale Readiness Evidence Assessment is complete as
  documentation-only assessment work.
- Stage 15.4 aggregate verdict is NOT READY.
- Stage 15 is open only as bounded Scale planning.
- Closed Beta execution remains unopened.
- Public Launch execution, Production Release, Commercial Launch, and Scale
  execution remain closed.
