# Stage 9 Schema-Oracle Evidence Projection Revision — Implementation Spec v1

Substep: `S9-FIX-01`

Candidate: `S9-REM-SCHEMA-001`

Status: `IMPLEMENTATION_READY_NOT_STARTED`

Required commit count: exactly one

## Purpose and exact defect

Six synthetic-risk fixtures contain deliberate negative mutations, but the
frozen human-review projection reduces candidate output to risk category,
statement, mechanism, and uncertainty. It therefore drops the actual invalid
field/value that the expected rejection names. The result is an unauditable
schema oracle even though the source fixture already contains the mutation.

The root is limited to `candidateRisks`, `riskEntry`, and
`buildHumanReviewManifest` in
`scripts/generate-stage-9-human-review-package.mjs`. It is not a missing runtime
validation rule and does not authorize a change to
`lib/ai-quality/synthetic-risk-evaluation.ts`.

## Exact fixture and claim scope

| Fixture | Claim | Evidence that must become visible |
|---|---|---|
| `S9-EVAL-006` | `B5-ISSUE-001` | exact unknown-field path and value |
| `S9-EVAL-007` | `B6-ISSUE-027` | exact invalid severity path and value |
| `S9-EVAL-009` | `B6-ISSUE-029` | exact invalid likelihood path and value |
| `S9-EVAL-010` | `B6-ISSUE-030` | exact nested unknown-field path and value |
| `S9-EVAL-011` | `B2-ISSUE-001` | nonexistent affected-option reference and candidate option IDs |
| `S9-EVAL-012` | `B3-ISSUE-002` | nonexistent affected-fact reference and candidate/source fact IDs |

No other fixture is in the write set.

## Allowed implementation

Add sibling, versioned projection behavior (proposed symbols:
`candidateEvidenceV2`, `riskEntryV2`, `buildPostRemediationManifest`) that:

1. preserves the complete candidate fragment needed to evaluate the expected
   failure category, including unknown fields and invalid enum values;
2. emits deterministic JSON paths and values for affected option/fact
   references and the available candidate/source ID sets;
3. hashes the retained evidence fragment and binds the legacy manifest SHA-256;
4. creates `LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json` under the remediation
   artifact family without writing the legacy manifest;
5. creates the first append-only `AI_REMEDIATION_REVISION_LEDGER.json` entries;
6. adds `quality:stage-9-schema-oracle-evidence-projection` and a revision
   integrity gate.

The exact implementation may choose equivalent symbol names, but it must keep
the legacy `buildHumanReviewManifest` serialization byte-identical.

## Forbidden implementation

- no change to the six source fixture candidate mutations or expectations;
- no runtime schema, adapter, validator, API, UI, provider, prompt, persistence,
  or execution-boundary change;
- no overwrite or regeneration of
  `docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json`;
- no change to primary, reinforced, final-adjudication, calibration, pattern, or
  closure artifacts;
- no remediation of expected-reference, generator, cluster, or rich-fixture
  candidates;
- no network request.

## Exact files

Permitted planned writes are:

- `scripts/generate-stage-9-human-review-package.mjs`;
- `docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`;
- `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`;
- `scripts/stage-9-schema-oracle-evidence-projection-quality.mjs`;
- `scripts/stage-9-remediation-revision-integrity-quality.mjs`;
- `package.json`;
- a bounded substep result artifact and the current canonical status paragraph.

Any additional file requires a new planning decision.

## Required tests and gate contract

The dedicated gate must fail unless:

- all six fixture IDs and six owned issue IDs are present exactly once;
- each expected negative oracle has a retained JSON path, exact value, and
  candidate/source comparison set where applicable;
- v2 generation is deterministic across two in-process builds;
- the legacy manifest bytes and SHA-256 match the pre-substep baseline;
- source fixture hashes are unchanged;
- runtime/UI/API diff is empty and `/api/simulate` remains `mockOnly=true`;
- network request count is zero;
- the diff is restricted to the approved files;
- `quality:stage-9-synthetic-risk-evaluation`,
  `quality:stage-9-human-review-readiness`, and
  `quality:stage-9-remediation-revision-integrity` pass.

Completion means the evidence oracle is auditable, not that the six runtime
cases have been semantically changed. Failure rolls back the single commit; the
frozen v1 package remains authoritative.
