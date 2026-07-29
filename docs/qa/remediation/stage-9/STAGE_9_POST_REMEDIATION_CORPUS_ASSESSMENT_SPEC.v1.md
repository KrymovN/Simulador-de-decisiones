# Stage 9 Post-Remediation Corpus Assessment Specification v1

Status: `IMPLEMENTATION_READY_NOT_STARTED`

Substep: `S9-FIX-09`

Kind: `full_corpus_assessment`

Candidate IDs: none

Prerequisite: `S9-FIX-08`

Future implementation commit:
`test(stage-9): assess post-remediation corpus`

## Purpose and boundary

Assess the reconciled post-remediation corpus exactly once using deterministic
offline evidence closure. The assessment covers the combined population of
`216`, records new findings and explicit residual risks, produces a closure
verdict, and completes the remediation sequence to `9/9`.

The assessment does not regenerate fixtures, rebuild the `97/97`
reconciliation, replay historical Pass A/B/C/D or R1/R2/R3/R4 review cycles,
declare release readiness, open runtime boundaries, or create `S9-FIX-10`.

## Source-of-truth hierarchy and exact inputs

The exact read-only inputs, in authority order, are:

1. `docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`
   at package version `stage-9-post-remediation-manifest.2`;
2. `docs/qa/remediation/stage-9/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json`;
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`
   through the completed `S9-FIX-08` event;
4. bounded result artifacts `S9-FIX-01` through `S9-FIX-08`;
5. the source-file and ordered-row hashes for
   `CANONICAL_OFFLINE_EVALUATION_CASES`,
   `SYNTHETIC_RISK_EVALUATION_FIXTURES`, and
   `RICH_DECISION_MATERIAL_FIXTURES` recorded by the complete manifest;
6. the manifest-bound frozen historical review hashes, the consolidated
   dispositions, and reinforced closure as immutable reference evidence.

Direct fixture content is not re-reviewed. Current fixture-source hashes must
equal the manifest hashes, so the assessment remains bound to canonical source
bytes without repeating semantic review. Generated FIX09 outputs are never
inputs to their own generation.

## Population and invariants

- canonical core: `160`;
- synthetic risk: `32`;
- rich decision material: `184`;
- combined unique population: `216`;
- version `1.1`: `63`;
- version `1.0`: `97`;
- actionable reconciliation: `97/97`;
- technical mapping unresolved: `0`;
- rejected claims preserved: `4/4`.

Version `1.0` is an accepted canonical baseline, not a defect or residual risk.

## Evidence model and human/AI boundary

The evidence model is `deterministic-offline-evidence-closure.1`. It combines
the complete manifest, immutable reconciliation, completed targeted result
artifacts, current source hashes, and frozen historical review references.

No new human or AI review is required. The original full-corpus semantic review
already covers `216/216`; FIX01…08 provide hash-bound terminal remediation
evidence. Replaying prior passes would duplicate closed work without adding an
independent evidence source. Any future new semantic review requires a separate
contract and is not implicit in this assessment.

## Closed assessment dimension set

The exact dimension order and coverage are:

1. `SCHEMA_CORRECTNESS` — synthetic risk, `32`;
2. `COVERAGE_PROVENANCE_INTEGRITY` — combined corpus, `216`;
3. `MULTILINGUAL_SEMANTIC_CONSISTENCY` — canonical core, `160`;
4. `CONTRADICTION_HANDLING` — canonical core, `160`;
5. `RISK_SOURCE_ENTAILMENT` — combined corpus, `216`;
6. `CLARIFICATION_REFUSAL_BEHAVIOR` — canonical core, `160`;
7. `LOCALIZATION_EQUIVALENCE` — canonical core, `160`;
8. `RICH_VALUE_PRESERVATION` — rich material, `184`;
9. `PRIVACY_REVIEW_REFERENCE_SAFETY` — combined corpus, `216`;
10. `REVISION_VERSION_INTEGRITY` — combined corpus, `216`;
11. `RECONCILIATION_CLOSURE` — actionable claims, `97`;
12. `DETERMINISTIC_SERIALIZATION` — combined corpus, `216`;
13. `RESIDUAL_FINDINGS` — combined corpus, `216`.

Every dimension record contains its population scope, expected and covered
count, ordered evidence references and hashes, exact checks, PASS criteria,
allowed finding classes, blocking conditions, status, and deterministic
evidence hash. Every dimension must cover its expected count and return `PASS`.

## Finding schema

New findings use version `stage-9-post-remediation-finding.1` and contain:

- stable `finding_id` in deterministic ordinal order;
- registered `assessment_dimension`;
- ordered affected fixture/case/claim IDs;
- repository-relative evidence references and SHA-256 values;
- severity;
- `blocking`;
- finding status;
- rationale;
- recommended next action;
- deterministic evidence hash.

Severity enum:
`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

Finding-status enum:
`OPEN`, `RESOLVED`, `ACCEPTED_BOUNDARY`, `REJECTED`.

Every `HIGH` or `CRITICAL` finding is blocking. A PASS closure permits no open
or blocking finding and no unresolved new defect.

## Residual-risk taxonomy

Closed categories:

- `HISTORICAL_REVIEW_LIMITATION`;
- `OFFLINE_EVIDENCE_BOUNDARY`;
- `RELEASE_RUNTIME_UNASSESSED`;
- `ACCEPTED_VERSION_BASELINE`.

Residual risks contain stable ID, category, severity, blocking status, status,
rationale, evidence paths/hashes, recommended next action, and evidence hash.
They are not new defects. Non-blocking `INFO` or `LOW` risks with
`ACCEPTED_BOUNDARY` status are allowed when explicit.

## Thresholds, aggregation, and closure

Required thresholds:

- technical mapping unresolved: exactly `0`;
- new unresolved findings: exactly `0`;
- blocking findings: exactly `0`;
- open findings: exactly `0`;
- hidden confirmed defects: exactly `0`;
- non-blocking accepted residual risks: allowed and counted explicitly.

Closure-verdict enum:

- `PASS_NO_RESIDUAL_RISKS`;
- `PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS`;
- `FAIL_BLOCKING_FINDINGS`.

Readiness-recommendation enum:

- `RECOMMEND_SEPARATE_RELEASE_READINESS_DECISION`;
- `DEFER_SEPARATE_RELEASE_READINESS_DECISION`;
- `DO_NOT_PROCEED_TO_RELEASE_READINESS_DECISION`.

A PASS verdict completes the remediation sequence to `9/9`. It may recommend
the separate decision but is never a release-readiness declaration.

## Exact outputs

The four sequence artifact categories are combined into one assessment package:

`docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json`

Version: `stage-9-post-remediation-corpus-assessment.1`.

It contains input inventory, population, evidence model, dimension coverage,
before/after disposition matrix, finding schema and findings, residual-risk
taxonomy and risks, aggregation, closure verdict, readiness recommendation,
release/runtime boundaries, and network/provider count zero.

The bounded result envelope is:

`docs/qa/remediation/stage-9/results/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_RESULT.v1.json`

Version: `stage-9-post-remediation-corpus-assessment-result.1`. It binds the
assessment package hash, ledger append, exact execution set, status boundary,
mandatory gates, preservation claims, and deterministic serialization.

No output contains absolute paths, wall-clock timestamps, locale-dependent
ordering, generated UUIDs, or network-derived values.

## Exact preparation write set

1. `docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_SPEC.v1.md`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json`
3. `scripts/stage-9-post-remediation-corpus-assessment-quality.mjs`
4. `scripts/stage-9-remediation-plan-quality.mjs`
5. `scripts/stage-9-remediation-revision-integrity-quality.mjs`
6. `scripts/stage-9-human-review-readiness-quality.mjs`
7. `scripts/stage-9-offline-dataset-coverage-quality.mjs`
8. `scripts/stage-9-schema-oracle-evidence-projection-quality.mjs`
9. `scripts/stage-9-risk-entailment-reference-quality.mjs`
10. `scripts/stage-9-ai-value-preservation-quality.mjs`
11. `package.json`

The candidate registry and dependency graph remain unchanged.

## Exact future execution write set

1. `docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`
3. `docs/qa/remediation/stage-9/results/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_RESULT.v1.json`
4. `PROJECT_CONTEXT.md`

Fixtures, FIX08 manifest/reconciliation/result, specification, sequence,
registry, graph, runner, gates, package, and frozen review evidence are
forbidden in the execution diff.

## Future append-only ledger event

Exactly one `stage-9-ai-remediation-revision-event.1` event is appended after
FIX08. It contains substep/kind/prerequisite, exact input paths and hashes,
population, ordered dimensions, assessment package path/hash, finding and
residual-risk counts, unresolved/blocking counts, closure verdict, readiness
recommendation, release `NOT_DECLARED`, runtime `CLOSED`, result path,
validation `PASS`, `generated_at: null`, and the future commit message.
Previous ledger bytes and event order remain immutable.

## PROJECT_CONTEXT boundary

Only:

`## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`

may change. After successful future execution it states FIX09 completed,
completed remediation `9/9`, remaining `0/9`, remediation sequence completed,
Stage 9 `In Progress`, release readiness `NOT_DECLARED`, runtime boundaries
`CLOSED`, `/api/simulate` `mockOnly=true`, visual migration remaining `0`, and
next action `Stage 9 Release Readiness and Runtime Boundary Decision`. The next
action is not `S9-FIX-10`.

## Dual-mode runner and commands

Runner/gate:
`scripts/stage-9-post-remediation-corpus-assessment-quality.mjs`

- `npm run generate:stage-9-post-remediation-corpus-assessment` writes only the
  four future execution files;
- `npm run quality:stage-9-post-remediation-corpus-assessment` auto-selects the
  prospective or strict post-assessment profile;
- `--dry-run-json` generates without writes;
- `--self-test-json` runs deterministic positive/negative tests.

Execution is offline and provider/network count must remain zero.

## Mandatory enumerable gate union

1. `quality:stage-9-remediation-plan`
2. `quality:stage-9-post-remediation-corpus-assessment`
3. `quality:stage-9-remediation-revision-integrity`
4. `quality:stage-9-human-review-readiness`
5. `quality:stage-9-offline-dataset-coverage`
6. `quality:stage-9-schema-oracle-evidence-projection`
7. `quality:stage-9-risk-entailment-reference`
8. `quality:stage-9-ai-value-preservation`
9. `git diff --check`

The dedicated profile owns exact allowlist, input hashes, dimension coverage,
findings, risks, verdict, recommendation, ledger/status, historical/fixture/
runtime preservation, timestamp/path rejection, determinism, and network zero.

`npm run lint` and `npm run build` are explicitly excluded from FIX09 closure:
they validate application source/build surfaces, while the execution diff is
JSON/status-only and runtime is protected. Syntax checks plus the enumerable
assessment gates cover the only changed preparation code. This narrows the
broad pre-specification sequence wording without weakening assessment evidence.

## Self-tests, atomicity, and rollback

Positive self-test total is `1`. Negative tests reject every required mutation:
short corpus, bad counts, FIX01 manifest, broken reconciliation, technical
unresolved, rejected mutation, unknown dimension, evidence-less finding,
unknown severity, PASS with blocking finding, unresolved overflow, readiness
declaration, runtime opening, `mockOnly` change, Stage 9 Complete, S9-FIX-10,
fixture/FIX08/historical changes, timestamp, absolute path, network execution,
extra file, and out-of-bound context update.

Future execution is exactly one commit:
`test(stage-9): assess post-remediation corpus`.

Any failure outside the four-file execution set aborts and restores the
pre-execution commit. The completed FIX08 package remains intact.
