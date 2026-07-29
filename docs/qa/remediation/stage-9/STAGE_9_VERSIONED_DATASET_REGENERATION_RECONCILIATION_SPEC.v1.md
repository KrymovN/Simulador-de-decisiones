# Stage 9 Versioned Dataset Regeneration and Reconciliation Specification v1

Status: `IMPLEMENTATION_READY_NOT_STARTED`

Substep: `S9-FIX-08`

Kind: `integration_regeneration`

Candidate: none

Implementation commit: `test(stage-9): reconcile remediated dataset revisions`

## Purpose and prerequisites

After, and only after, completed `S9-FIX-01` through `S9-FIX-07`, materialize
one complete deterministic post-remediation package, reconcile every actionable
claim to its terminal revision or validation evidence, and freeze the technical
input consumed by `S9-FIX-09`. This substep performs no semantic corpus
assessment and declares no release readiness.

The seven prerequisite implementation commits are:

1. `6b04c405a2a8aaba9e9c3e164413a9d954ee04af`
2. `18c8d6bffa422c46f4439b6b93c1076fc98a375c`
3. `82073c46d2f4568875bdbf51310ae75e35118de7`
4. `700d4ab1e562a211e73f2d3e59eb1ce232ff98aa`
5. `8fcf95241aa4ff5424a88b0c773771d5735b590d`
6. `2aa1cbb7dbff338fc434f8a72710af69affde3a7`
7. `ab8125e4d186dbab3ecc3df17ed4a12eba2bae5a`

## Source-of-truth hierarchy

1. Canonical fixture sources:
   - `CANONICAL_OFFLINE_EVALUATION_CASES` in
     `lib/ai-decision-material/fixtures.ts`;
   - `RICH_DECISION_MATERIAL_FIXTURES` in the same file;
   - `SYNTHETIC_RISK_EVALUATION_FIXTURES` in
     `lib/ai-quality/synthetic-risk-evaluation-fixtures.ts`.
2. `docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json` defines
   the actionable and rejected claim sets.
3. `AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json` defines unique actionable
   claim ownership and terminal substep assignment.
4. `AI_REMEDIATION_REVISION_LEDGER.json`, the seven bounded result artifacts,
   and the prerequisite commits define completed revision evidence.
5. Generated FIX08 artifacts are derived outputs and must never be read as
   sources for their own regeneration.
6. `docs/qa/review/**` and
   `docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json` are frozen
   historical hash anchors, not mutable generation inputs.

## Canonical counts and ordering

- canonical core: `160`;
- synthetic risk: `32`;
- rich decision material: `184`;
- combined offline population: `216`;
- frozen legacy manifest: `216` entries;
- canonical version `1.1`: `63`;
- canonical version `1.0`: `97`;
- non-owned synthetic preservation: `31`;
- non-owned rich preservation: `183`.

Source rows retain their exported array order. Manifest family order is
`canonical_core`, `synthetic_risk`, `rich_decision_material`. Within each
family the exported source order is authoritative. IDs are stable and unique.
Every row hash is SHA-256 over recursively key-sorted compact JSON encoded as
UTF-8 without a trailing newline.

The complete manifest replaces the existing FIX01 sibling projection at:

`docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`

Its exact package version is `stage-9-post-remediation-manifest.2`. The FIX01
schema-oracle evidence is preserved inside `completed_revision_evidence`;
historical FIX01 result and ledger evidence remain immutable.

## Complete manifest schema

The manifest contains, in this order:

1. `package_version`, `generated_at: null`, `substep_id`, `kind`;
2. `canonical_source_commit`;
3. `source_counts`, `version_distribution`, `preservation`;
4. `source_families`, each with source path/symbol, source-file hash, ordered
   IDs, ordered row hashes, count, and family projection hash;
5. `completed_revision_evidence` for FIX01…07 with commit, result path and hash;
6. `frozen_historical_evidence` with the recursively sorted repository-relative
   path and SHA-256 of every regular file under `docs/qa/review`;
7. `reconciliation_path`;
8. `network_provider_execution_count: 0`;
9. `runtime_api_ui_provider_persistence: "UNCHANGED"`.

No absolute path, wall-clock timestamp, filesystem iteration order, generated
UUID, locale-dependent sort, or network-derived value is allowed.

## 97/97 actionable-claim reconciliation

Output path:

`docs/qa/remediation/stage-9/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json`

The authoritative left set is the 88 `CONFIRMED` plus 9
`PARTIALLY_CONFIRMED` consolidated `primary_issue_id` values. The authoritative
right set is the 97 unique registry `owned_issue_ids`. Matching is exact string
equality. Unresolved threshold is `0`.

Mapping order is candidate-registry order, then the stored `owned_issue_ids`
order. Closed terminal categories are:

- `SCHEMA_ORACLE_PROJECTION` for `S9-REM-SCHEMA-001`;
- `REFERENCE_REVISION` for `S9-REM-EXPECTED-001`,
  `S9-REM-EXPECTED-002`, and `S9-REM-EXPECTED-003`;
- `VALIDATION_ONLY` for `S9-REM-CLUSTER-001`;
- `FIXTURE_REVISION` for `S9-REM-GENERATOR-001` and
  `S9-REM-FIXTURE-001`;
- `METHODOLOGY_CLARIFICATION` for `S9-REM-FIXTURE-002`.

Each mapping contains `primary_issue_id`, `consolidated_status`,
`registry_owner_candidate_id`, `registry_owner_substep_id`,
`terminal_mapping_category`, a repository-relative `source_evidence_path`,
`source_evidence_sha256`, `revision_result_path`,
`revision_result_sha256`, and `terminal_validation_status: "PASS"`.

The four consolidated `REJECTED` claims are excluded from the 97 mappings and
preserved separately, in consolidated order, with their source-evidence hashes
and `preserved_unchanged: true`.

## Deterministic generator

Generator:

`scripts/generate-stage-9-post-remediation-package.mjs`

Command:

`npm run generate:stage-9-post-remediation-package`

`--dry-run-json` builds all artifacts without writes. `--write` writes only the
five execution files below. Generation is offline and source-only.

## Exact preparation write set

1. `docs/qa/remediation/stage-9/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_SPEC.v1.md`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json`
3. `scripts/generate-stage-9-post-remediation-package.mjs`
4. `scripts/stage-9-post-remediation-regeneration-quality.mjs`
5. `scripts/stage-9-remediation-plan-quality.mjs`
6. `scripts/stage-9-remediation-revision-integrity-quality.mjs`
7. `scripts/stage-9-schema-oracle-evidence-projection-quality.mjs`
8. `scripts/stage-9-human-review-readiness-quality.mjs`
9. `scripts/stage-9-risk-entailment-reference-quality.mjs`
10. `scripts/stage-9-offline-dataset-coverage-quality.mjs`
11. `package.json`

The dependency graph and candidate registry remain unchanged. FIX08 is an
integration node and no fictitious candidate may be created.

## Exact future execution write set

1. `docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`
2. `docs/qa/remediation/stage-9/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json`
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`
4. `docs/qa/remediation/stage-9/results/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_RESULT.v1.json`
5. `PROJECT_CONTEXT.md`

Generator, gate, package, specification, sequence, registry, graph, fixtures,
and historical review artifacts are forbidden in the execution diff.

## Future append-only ledger event

Exactly one event is appended after S9-FIX-07. It contains:

- `event_version: "stage-9-ai-remediation-revision-event.1"`;
- `substep_id: "S9-FIX-08"`;
- `kind: "integration_regeneration"`;
- prerequisites FIX01…07;
- canonical input hashes;
- the manifest and reconciliation paths and hashes;
- `actionable_claim_reconciliation: "97/97"`;
- `unresolved_claim_count: 0`;
- `rejected_claims_preserved: 4`;
- result path;
- `validation_status: "PASS"`;
- `generated_at: null`;
- implementation commit message.

Existing ledger bytes and event order are immutable.

## Result artifact

Path:

`docs/qa/remediation/stage-9/results/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_RESULT.v1.json`

Version: `stage-9-versioned-dataset-regeneration-reconciliation-result.1`.
It records source/output hashes, exact counts and versions, 97/97 reconciliation,
four preserved rejected claims, ledger append, exact write set, mandatory gate
contract, status boundary, historical/runtime preservation, deterministic
serialization, and network/provider count zero.

## PROJECT_CONTEXT boundary

Only:

`## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`

may change. After execution it states completed `8/9`, remaining `1/9`, next
`S9-FIX-09`, Stage 9 `In Progress`, release `NOT_DECLARED`, runtime boundaries
`CLOSED`, `/api/simulate` `mockOnly=true`, and visual migration remaining `0`.

## Mandatory enumerable gate union

1. `quality:stage-9-remediation-plan`
2. `quality:stage-9-post-remediation-regeneration` in post mode
3. `quality:stage-9-remediation-revision-integrity`
4. `quality:stage-9-schema-oracle-evidence-projection`
5. `quality:stage-9-human-review-readiness`
6. `quality:stage-9-risk-entailment-reference`
7. `quality:stage-9-offline-dataset-coverage`
8. `git diff --check`

The dedicated gate also proves exact allowlist, frozen historical hashes,
counts, versions, mappings, rejected claims, no absolute paths/timestamps,
runtime boundary, deterministic repeat, and network/provider zero.

## Atomicity, rollback, and S9-FIX-09 boundary

Execution is exactly one commit:

`test(stage-9): reconcile remediated dataset revisions`

Any failure outside the five-file execution set aborts and restores the
pre-execution commit. FIX08 performs no semantic 216-fixture review, residual
risk assessment, readiness recommendation, adjudication rewrite, runtime
opening, or release declaration. Those assessment concerns remain exclusively
in future S9-FIX-09.
