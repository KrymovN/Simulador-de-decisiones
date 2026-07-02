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
persistence, billing, subscriptions, Market Readiness, Closed Beta, and Public
Launch remain deferred until explicitly opened by the roadmap. Stage 11 Legal &
Trust Layer is open only for documentation-only legal/trust architecture work.

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
Repository Structure Normalization is complete. Stage 11.8 Regulatory
Readiness Matrix is complete as documentation-only legal/trust architecture
work. The next implementation subblock is Stage 11.9 Legal Review Packet &
Drafting Handoff.
