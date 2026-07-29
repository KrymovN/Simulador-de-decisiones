# Stage 9 Invented Risk-Mechanism Reference Remediation — Implementation Spec v1

Substep: `S9-FIX-04`

Candidate: `S9-REM-EXPECTED-003`

Status: `IMPLEMENTATION_READY_NOT_STARTED`

Implementation executed: `false`

Required implementation commit count: exactly one

## Purpose and root cause

Correct expected risk mechanisms that are not entailed by the fixture's own
facts, assumptions, gaps, or explicitly stated situation. The exact root cause
is `EXPECTED_RISK_MECHANISM_NOT_SOURCE_ENTAILED`: the affected references
currently assert location retention, rate reset, mobility loss, double-housing
cost, non-refundable cost, or generic synthetic mechanisms without a matching
source evidence path.

This is an offline expected-reference correction. It does not authorize a
runtime risk engine, schema, adapter, prompt, provider, API, UI, persistence,
Supabase, or auth change.

## Exact ownership

`S9-REM-EXPECTED-003` owns exactly 21 fixtures and 21 issue claims:

1. `S9-EVAL-002`
2. `S9-CORE-002-ES`
3. `S9-CORE-002-EN`
4. `S9-CORE-002-RU`
5. `S9-CORE-002-ZH`
6. `S9-CORE-014-ES`
7. `S9-CORE-014-EN`
8. `S9-CORE-014-RU`
9. `S9-CORE-014-ZH`
10. `S9-CORE-016-ES`
11. `S9-CORE-016-EN`
12. `S9-CORE-016-RU`
13. `S9-CORE-016-ZH`
14. `S9-CORE-019-ES`
15. `S9-CORE-019-EN`
16. `S9-CORE-019-RU`
17. `S9-CORE-019-ZH`
18. `S9-CORE-024-ES`
19. `S9-CORE-024-EN`
20. `S9-CORE-024-RU`
21. `S9-CORE-024-ZH`

The owned multilingual clusters are exactly `S9-CLUSTER-002`,
`S9-CLUSTER-014`, `S9-CLUSTER-016`, `S9-CLUSTER-019`, and
`S9-CLUSTER-024`. No other fixture, cluster, or claim is owned by this substep.

## Source of truth and permitted semantic correction

The only implementation sources and symbols are:

- `lib/ai-decision-material/fixtures.ts`:
  `SCENARIO_BLUEPRINTS` and `CANONICAL_OFFLINE_EVALUATION_CASES`;
- `lib/ai-quality/synthetic-risk-evaluation-fixtures.ts`:
  `SYNTHETIC_RISK_EVALUATION_FIXTURES`.

For canonical rows, source entailment is limited to the row's
`user_situation`, `known_facts`, `known_assumptions`, `critical_gaps`, and
`important_gaps`. The only mutable semantic field is
`expected_risk_behavior`, inherited from the owned blueprint risk list.

For `S9-EVAL-002`, source entailment is limited to `input.decision_summary`,
`input.objective`, `input.known_facts`, and `input.known_uncertainties`. The
only mutable semantic fields are the three owned candidate-reference risk
entries under `candidate.output.risks`; input, provenance, case identity,
disposition, and failure-category expectations remain fixed.

The permitted correction may remove an unsupported mechanism or replace it
with a bounded uncertainty mechanism that points to an exact source field. It
must preserve uncertainty and must not convert a gap or assumption into a
fact. The post-implementation gate must prove that:

- `S9-EVAL-002` retains exactly three risks covering only demand,
  operational-capacity, and final-cost uncertainty, with no fact reference;
- cluster `002` no longer asserts location dependency or retention as fact;
- cluster `014` retains total-cost analysis but does not invent a rate reset;
- cluster `016` retains rate uncertainty but does not assert mobility loss;
- cluster `019` retains bounded reversibility analysis but does not assert
  double-housing cost;
- cluster `024` retains permit-delay analysis but does not assert a
  non-refundable cost;
- every replacement mechanism has a source evidence path and all four locales
  in each cluster remain semantically equivalent.

## Version and preservation contract

The 20 canonical rows remain the same fixture identities. The 12 rows in
clusters `002`, `014`, and `019` transition from `case_version` `1.0` to
`1.1`. The eight rows in clusters `016` and `024` are already `1.1` because of
`S9-FIX-02`; they remain `1.1` and receive only the owned expected-risk
correction. `S9-EVAL-002` has no in-object case version and receives one
append-only ledger event.

All unrelated canonical rows, all other synthetic fixtures, scenario inputs,
candidate identities, coverage totals, historical manifests, prior result
artifacts, and the complete `S9-FIX-01..03` ledger boundary must remain
byte-identical or projection-identical as applicable.

## Exact preparation write set

This planning/quality-control preparation may write only:

1. `docs/qa/remediation/stage-9/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_SPEC.v1.md`;
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json`;
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`;
4. `scripts/stage-9-risk-entailment-reference-quality.mjs`;
5. `scripts/stage-9-offline-dataset-coverage-quality.mjs`;
6. `scripts/stage-9-remediation-revision-integrity-quality.mjs`;
7. `scripts/stage-9-remediation-plan-quality.mjs`;
8. `package.json`.

Preparation must not edit a fixture, ledger, result artifact,
`PROJECT_CONTEXT.md`, historical artifact, or runtime path and does not count
as remediation completion.

## Exact future implementation write set

The future atomic `S9-FIX-04` implementation may write only:

1. `lib/ai-decision-material/fixtures.ts`;
2. `lib/ai-quality/synthetic-risk-evaluation-fixtures.ts`;
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`;
4. `docs/qa/remediation/stage-9/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json`;
5. `PROJECT_CONTEXT.md`, restricted to the section headed
   `## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`.

The bounded result artifact is exactly
`docs/qa/remediation/stage-9/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json`.
No gate, package command, specification, sequence, registry, graph, or other
status document is writable during the future implementation.

## Exact protected paths

Preparation protects the entire future implementation write set. Both
preparation and implementation protect:

- `docs/qa/review/`;
- `docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`;
- the three existing `S9-FIX-01..03` result artifacts;
- `app/`;
- `components/`;
- `supabase/`;
- `lib/ai-provider/`;
- `lib/prompt-context/`;
- `lib/decision-engine/`;
- `lib/runtime-integration/`;
- `lib/persistence-runtime/`.

Within the two future fixture-source files, every non-owned fixture projection
is protected. The dependency graph is protected because its topology already
expresses `S9-FIX-02 → S9-FIX-04 → S9-FIX-08`.

## Future ledger append profile

The future ledger event is exactly:

- `event_version`: `stage-9-ai-remediation-revision-event.1`;
- `substep_id`: `S9-FIX-04`;
- `remediation_entry_ids`: `["S9-REM-EXPECTED-003"]`;
- `shared_rule_id`: `risk_mechanism_requires_source_entailment`;
- `result_artifact_path`:
  `docs/qa/remediation/stage-9/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json`;
- `generated_at`: `null`;
- `implementation_commit_message`:
  `fix(stage-9): align risk references with source`.

It must follow the existing `S9-FIX-02` and `S9-FIX-03` events without
modifying either event or the six original `S9-FIX-01` revisions.

## Mandatory implementation gates

The exact gate list is:

- `quality:stage-9-risk-entailment-reference`;
- `quality:stage-9-synthetic-risk-evaluation`;
- `quality:stage-9-offline-dataset-coverage`;
- `quality:stage-9-remediation-revision-integrity`.

Before fixture edits, the dedicated gate must pass in prospective mode and the
offline-coverage and revision-integrity gates must expose a deterministic
`S9-FIX-04` prospective profile. Post-implementation mode must validate exact
ownership `21/21`, source entailment, case-version routing, append-only ledger
order, bounded result schema, status-section routing, unrelated fixture
preservation, protected historical/runtime paths, and zero network/provider
execution.

## Prohibited changes

The implementation must not change contradiction or high-risk rules,
unrelated risk lists, source situations/facts/assumptions/gaps, runtime
candidate generation, runtime validation, schemas, adapters, Prompt Context,
Decision Engine, `/api/simulate`, `HomeSimulator`, provider/OpenAI
integration, UI, API, persistence, Supabase, auth, legacy manifests,
historical adjudication/evidence, `S9-FIX-05+`, regeneration, `97/97`
reconciliation, or full-corpus assessment.

## Atomicity, rollback, and status boundary

The future implementation uses exactly one commit:

`fix(stage-9): align risk references with source`

The only future canonical status write is the paragraph under
`## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`
in `PROJECT_CONTEXT.md`. Stage 9 must remain `In Progress`; release readiness
must not be declared and all runtime boundaries remain closed.

Any gate failure requires rollback of the exact five-file future
implementation write set as one unit. The preparation commit remains valid and
does not itself complete `S9-FIX-04`.
