# Levio.es

Levio.es is a Decision Simulation Engine. It is not an AI Chat, not an Answer
Engine, and not a Generic AI Assistant.

The current confirmed runtime remains deterministic-preview only for the public
`/api/simulate` surface. The public contract is intentionally preserved:

- `contractVersion: "simulate-api-v1-mock"`
- `mockOnly=true`
- `safeRender=true`
- `apiReady=true`

Real AI Runtime, AI Provider execution, production auth, production
persistence, billing, subscriptions, Closed Beta, Production Release, Public
Launch, Commercial Launch, and Scale remain deferred until explicitly opened by
the roadmap. Stage 11 Legal & Trust Layer is closed. Stage 12.1 Market
Readiness Scope & Entry Lock and Stage 12.2 Market Readiness Surfaces
Definition are complete as documentation-only Market Readiness work. Stage
12.3 Market Readiness Dependencies & Execution Order is complete as
documentation-only Market Readiness work. Stage 12.4 Market Readiness
Evidence Inventory & Dependency Map is complete as documentation-only Market
Readiness work. Stage 12.5 Market Readiness Completion Criteria & Exit Gate
is complete as documentation-only Market Readiness work. Stage 12.6 Market
Readiness Closure Gate is complete as documentation-only Market Readiness
work. Stage 12 is closed. Stage 13.1 Closed Beta Scope & Entry Lock is
complete as documentation-only Closed Beta planning work. Stage 13.2 Closed
Beta Participants & Eligibility is complete as documentation-only Closed Beta
planning work. Stage 13.3 Closed Beta Operating Model & Support Boundaries is
complete as documentation-only Closed Beta planning work. Stage 13.4 Closed
Beta Test Scenarios & Success Criteria is complete as documentation-only
Closed Beta planning work. Stage 13.5 Closed Beta Feedback & Evidence
Collection is complete as documentation-only Closed Beta planning work.

## Active Project State

The canonical active state documents stay in the repository root:

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- [CURRENT_STAGE.md](CURRENT_STAGE.md)
- [LEVIO_CURRENT_STATE.md](LEVIO_CURRENT_STATE.md)
- [LEVIO_PROJECT_PROGRESS.md](LEVIO_PROJECT_PROGRESS.md)

`AGENTS.md` and `CLAUDE.md` also remain in the root as tooling instructions.

## Documentation

Long-lived project documentation is organized under [docs/](docs/README.md):

- `docs/architecture/` - architectural foundations and target runtime specs.
- `docs/stages/` - historical stage documents grouped by stage number.
- `docs/qa/` - quality, testing, readiness, and audit documents.
- `docs/decisions/` - explicit project decisions.
- `docs/archive/` - superseded or historical handoff material.

Stage 10 Product Quality Hardening is officially closed and baseline-locked.
Repository Structure Normalization is complete. Stage 11.10 Production Legal
Blockers Closure Gate is complete as documentation-only legal/trust closure
work. The closure verdict is Stage 11 Closed. Stage 12 may begin. Stage 12.1
Market Readiness Scope & Entry Lock is complete as documentation-only entry
work. Stage 12.2 Market Readiness Surfaces Definition is complete as
documentation-only work. Stage 12.3 Market Readiness Dependencies & Execution
Order is complete as documentation-only work. Stage 12.4 Market Readiness
Evidence Inventory & Dependency Map is complete as documentation-only work.
Stage 12.5 Market Readiness Completion Criteria & Exit Gate is complete as
documentation-only work. No further bounded Stage 12 subblock is required.
Stage 12.6 Market Readiness Closure Gate is complete as documentation-only
work. Stage 12 is closed. Stage 13 Closed Beta is the only next admissible
roadmap block. Stage 13.1 Closed Beta Scope & Entry Lock is complete as
documentation-only scope and entry-lock work. Closed Beta execution remains
unopened. Stage 13.2 Closed Beta Participants & Eligibility is complete as
documentation-only participant and eligibility work. Stage 13.3 Closed Beta
Operating Model & Support Boundaries is complete as documentation-only
operating/support work. Stage 13.4 Closed Beta Test Scenarios & Success
Criteria is complete as documentation-only scenario/success-criteria work.
Stage 13.5 Closed Beta Feedback & Evidence Collection is complete as
documentation-only feedback/evidence work. The next bounded Stage 13 subblock
is Stage 13.6 Closed Beta Completion Criteria & Exit Gate.
