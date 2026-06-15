# LEVIO STAGE 3.14 SIMULATIONRESPONSE V2 UI MAPPING

## Document Status

- Stage: 3.14 - SimulationResponse V2 UI Mapping.
- Status: completed isolated internal implementation.
- Date: 15 June 2026, Europe/Madrid.
- Depends on: Stage 3.13 Simulator Integration Sandbox and `LEVIO_SIMULATION_RESPONSE_V2.md`.
- Public simulator status: unchanged.
- Next roadmap stage: Stage 3.15 - Controlled Simulator Runtime Switch.

## 1. Purpose

Stage 3.14 defines and implements an internal presentation mapping from an already generated `SimulationResponseV2Draft` into a V2-specific UI model.

The mapping is presentation preparation only. It does not render UI, execute the deterministic brain, call the sandbox or adapter, expose V2 publicly, or switch the simulator runtime.

The implemented path is:

```text
Existing validated SimulationResponseV2Draft
->
Pure V2 UI mapping
->
SimulationResponseV2UiModel
->
No public consumer
```

## 2. Files Created

- `lib/decision-engine/simulation-response-v2-ui-mapping-contracts.ts`
- `lib/decision-engine/simulation-response-v2-ui-mapping.ts`
- `lib/decision-engine/simulation-response-v2-ui-mapping-validation.ts`
- `LEVIO_STAGE_3_14_SIMULATION_RESPONSE_V2_UI_MAPPING.md`

## 3. Files Modified

- `lib/decision-engine/index.ts`
- `PROJECT_CONTEXT.md`
- `LEVIO_CURRENT_STATE.md`
- `CURRENT_STAGE.md`

No file under `app/`, `components/`, the public simulator runtime, public API, localStorage, dependency files, or configuration files was modified.

## 4. Mapping Boundary

The Stage 3.14 mapper:

- accepts only an existing `SimulationResponseV2Draft`;
- validates the V2 envelope before field mapping;
- returns only `SimulationResponseV2UiModel`;
- provides loading and empty models without fabricating a response;
- maps malformed V2 input to a controlled-failure presentation model;
- never calls the deterministic runtime, sandbox, adapter, pipeline, public API, or mock V1 builder;
- never converts V2 into the public V1 `SimulationResponse`.

The mapping result exposes fixed evidence that:

- the source contract is `SimulationResponseV2Draft`;
- the target contract is `SimulationResponseV2UiModel`;
- no V1 coercion was used;
- no deterministic runtime was executed;
- no sandbox was exposed;
- no public runtime, public API, or persistence was touched.

## 5. Existing UI Surface Mapping

The current `HomeSimulator` remains visually and behaviorally unchanged. Stage 3.14 defines how a future V2-specific consumer can represent the same broad product areas without forcing V2 into V1.

| Existing simulator output area | V2 UI mapping source |
| --- | --- |
| Console status | V2 lifecycle status, clarification reason, safety message, or controlled failure |
| Result heading | `decision.statement`, primary goal, options, constraints, time horizon |
| Confidence area | separate completeness and model-confidence fields |
| Scenario cards | `analysis.scenarios` with option, perspective, dependencies, uncertainty, and confidence |
| Risk output | `analysis.risks` with level, impact, reversibility, uncertainty, cost of error, and comparative score |
| Consequence output | scenario `outcomeIndicators`; no narrative consequence is invented |
| Strategic conclusion area | structured recommendation, conditions, rationale, and confidence |
| Warnings and limitations | notices, gaps, safety state, availability reasons |

This table is a contract map, not a public rendering change.

## 6. Section Contracts

`SimulationResponseV2UiModel` defines these presentation sections:

- `status`;
- `decisionSummary`;
- `modelQuality`;
- `clarification`;
- `scenarios`;
- `risks`;
- `consequences`;
- `recommendation`;
- `safety`;
- `notices`;
- `traceability`.

Every section has an explicit state:

- `available`;
- `unavailable`;
- `blocked`;
- `not_applicable`;
- `loading`;
- `empty`.

Availability reasons remain visible when V2 blocks or omits an output area.

## 7. Lifecycle Mapping

| V2 lifecycle | UI render state | Required behavior |
| --- | --- | --- |
| No response, request pending | `loading` | Show loading sections without executing runtime |
| No response available | `empty` | Show an empty state without fabricated output |
| `clarification_required` | `clarification` | Show decision summary, quality, questions, gaps, and safety; no normal recommendation |
| `analysis_ready` | `ready` | Show mapped scenarios, risks, consequences, and recommendation |
| `limited_analysis` | `limited` | Show useful mapped output with limitations and notices |
| `cannot_recommend` | `cannot_recommend` | Show allowed analysis and safety context; no normal recommendation |
| `refused` | `refused` | Show safe refusal and suggested support; no enabling analysis |
| `failed` | `controlled_failure` | Show controlled failure; no fabricated analysis or recommendation |
| Malformed V2 input | `controlled_failure` | Reject before field mapping |

## 8. Scenario, Risk, Consequence, and Recommendation Rules

Scenario mapping preserves:

- scenario and option identifiers;
- option labels;
- perspective and canonical type;
- assumptions;
- dependency descriptions as trigger conditions;
- uncertainty reasons;
- scenario-structure confidence.

Risk mapping preserves:

- scenario and option references;
- risk level and risk types;
- impact severity;
- reversibility;
- uncertainty;
- cost of error;
- risk-assessment confidence;
- comparative probability score with `comparative_not_calibrated`.

Consequence mapping uses only structured scenario outcome indicators. The mapper does not invent delayed effects, benefit prose, or narrative consequences that are absent from the deterministic V2 draft.

Recommendation mapping preserves:

- status, category, and priority;
- preferred option reference and label;
- required and blocking conditions;
- structured rationale;
- recommendation-reasoning confidence.

## 9. Strict V1 and V2 Boundaries

- The current public `SimulationResponse` remains the only active public simulator response.
- `HomeSimulator`, `/api/simulate`, `buildMockSimulation(...)`, and localStorage remain V1/mock-only.
- `SimulationResponseV2UiModel` is not a V1-compatible response.
- No `simulation`, `thinkingStages`, or public `lang` envelope is produced.
- No V2 result is persisted.
- No public consumer imports or renders the mapper.
- No silent V1 fallback or V2-to-V1 coercion exists.

## 10. Internal Validation Catalog

`runSimulationResponseV2UiMappingValidation()` executes ten synthetic mapping-only cases:

| Case | Observed UI state |
| --- | --- |
| Loading state | `loading` |
| Empty state | `empty` |
| Clarification required | `clarification` |
| Analysis ready | `ready` |
| Limited analysis | `limited` |
| Cannot recommend | `cannot_recommend` |
| Refused | `refused` |
| Failed | `controlled_failure` |
| Malformed V2 | `controlled_failure` |
| Strict V1/V2 boundary | `limited` |

Execution result:

- total Stage 3.14 cases: `10`;
- passed cases: `10`;
- failed cases: `0`;
- uncaught expected-case exceptions: `0`.

Regression results:

- Stage 3.13 sandbox validation: `9/9` passed;
- Stage 3.12 adapter validation: `12/12` passed;
- Stage 3.10 deterministic runtime validation: `10/10` passed.

## 11. Validation Performed

- `./node_modules/.bin/tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings or errors.
- Stage 3.14 UI mapping validation: passed `10/10`.
- Stage 3.13 sandbox regression validation: passed `9/9`.
- Stage 3.12 adapter regression validation: passed `12/12`.
- Stage 3.10 deterministic regression validation: passed `10/10`.
- `git diff --check`: passed.
- Static mapping isolation scan: no runtime invocation, sandbox, adapter, public API, UI, localStorage, provider, network, or environment coupling detected.
- Public protected-file diff check: no changes under `app/`, `components/`, `lib/simulationEngine.ts`, dependency files, or configuration files.

The executable catalogs were run from a temporary CommonJS compilation in `/private/tmp`; no generated artifact was added to the repository.

## 12. Architecture Compliance

Stage 3.14 introduces:

- V2 UI mapping documentation: yes;
- internal mapping types and helpers: yes;
- scenario, risk, consequence, and recommendation mapping: yes;
- loading, empty, and controlled-failure mapping: yes;
- V1/V2 contract separation: yes;
- public rendering or UI change: no;
- deterministic runtime execution from mapping: no;
- sandbox exposure: no;
- public simulator runtime switch: no;
- public API behavior change: no;
- persistence, auth, memory, or subscriptions: no;
- AI or external provider integration: no;
- dependency or configuration change: no;
- Stage 3.15 implementation: no.

## 13. Known Boundaries

- The mapping model is internal and has no public consumer.
- Existing UI labels, layout, styles, behavior, saving, and navigation remain unchanged.
- The deterministic V2 draft currently provides structured outcome indicators rather than full narrative consequence summaries.
- Localization and final public rendering behavior remain future controlled-switch concerns.
- The validation catalog is an internal executable function, not a formal test framework or CI gate.

## 14. Stage 3.14 Conclusion

Stage 3.14 is complete for its isolated mapping-first scope.

SimulationResponse V2 now has an explicit internal UI presentation contract covering lifecycle, decision summary, quality, clarification, scenarios, risks, consequences, recommendation, safety, notices, traceability, loading, empty, and controlled-failure states.

Stage 3.15 - Controlled Simulator Runtime Switch is the next roadmap stage, but it has not started and is not implemented by Stage 3.14.
