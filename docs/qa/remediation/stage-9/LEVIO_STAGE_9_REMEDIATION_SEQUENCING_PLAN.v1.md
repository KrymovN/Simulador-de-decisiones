# LEVIO Stage 9 Remediation Sequencing Plan v1

Date: 22 July 2026

Baseline: `eae42639c26445dd8ee8e437a6f73b31383c9c8b`

Status: `PLAN_ACCEPTED_IMPLEMENTATION_NOT_STARTED`

Implementation performed in this substep: **none**

## Frozen baseline and authority

The plan consumes the completed primary review (`216/216`), reinforced review
(`73/73`), final cross-batch adjudication (`8/8`), final pattern adjudication,
calibration `AI_REVIEW_CALIBRATION_ACCEPTABLE_WITH_LIMITATIONS`, closure
`REINFORCED_AI_REVIEW_COMPLETE_REMEDIATION_REQUIRED`, and the eight-entry
planning registry. Those artifacts are evidence, not editable inputs.

The machine-readable authorities for future remediation work are:

- `AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json` — exact candidate roots, fixture
  and cluster scope, symbols, 97 unique actionable-claim owners, gates, hash
  policy, risk, and one-commit feasibility;
- `AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json` — acyclic dependencies and the
  justified candidate consolidation;
- `AI_REMEDIATION_SEQUENCE.v1.json` — exact one-commit implementation contract
  for each bounded substep.

Registry v2 supersedes the planning interpretation in the frozen registry v1;
it does not rewrite it. It adds five claims omitted from v1 candidate scope:
`B3-ISSUE-015` through `B3-ISSUE-018` (`S9-CORE-014-*`) and `B3-ISSUE-001`
(`S9-EVAL-002`). All 88 confirmed plus 9 partially confirmed claims now have
exactly one owning candidate. Rejected claims remain historical evidence and
are not remediation work.

## Root-cause and sequencing decision

The upstream sequence remains valid with one refinement:

1. make schema-oracle evidence auditable;
2. correct systemic expected-reference rules;
3. correct safety/refusal references after the shared contradiction rule;
4. correct risk-entailment references after the shared contradiction rule;
5. correct the localized generator/template phrase at its source;
6. correct the isolated rich fixture expectation;
7. clarify the isolated review-methodology rule;
8. regenerate the versioned dataset once after every source correction;
9. assess the full reconciled corpus once.

This is upstream-first because source rules precede regenerated rows, and
regeneration precedes corpus assessment. It avoids manual edits that a later
generator run would overwrite. Small fixture and methodology fixes remain
separate because they have independent roots, rollback boundaries, and gates.

`S9-REM-EXPECTED-001` and `S9-REM-CLUSTER-001` are intentionally consolidated
in `S9-FIX-02`. Final adjudication partially confirms only the unsupported
contradiction component of the combined Spanish claim; it rejects the gender
interpretation, and final calibration reports no independent
`CLUSTER_LOCALIZATION` root. Both valid components therefore change the same
contradiction rule and use the same cluster-equivalence regression. A separate
cluster commit would duplicate ownership and risk incompatible generated rows.

## Final bounded order

| Order | Substep | Candidate scope | Dependency | Commit boundary |
|---:|---|---|---|---|
| 1 | `Stage 9 Schema-Oracle Evidence Projection Revision` | `S9-REM-SCHEMA-001` | none | exactly one commit |
| 2 | `Stage 9 Systemic Contradiction Reference Remediation` | `S9-REM-EXPECTED-001`, `S9-REM-CLUSTER-001` | none | exactly one commit |
| 3 | `Stage 9 High-Risk Clarification and Refusal Reference Remediation` | `S9-REM-EXPECTED-002` | S9-FIX-02 | exactly one commit |
| 4 | `Stage 9 Invented Risk-Mechanism Reference Remediation` | `S9-REM-EXPECTED-003` | S9-FIX-02 | exactly one commit |
| 5 | `Stage 9 Reversible-Trial Localization Template Remediation` | `S9-REM-GENERATOR-001` | none | exactly one commit |
| 6 | `Stage 9 MATERIAL-006 Silent-Loss Fixture Revision` | `S9-REM-FIXTURE-001` | none | exactly one commit |
| 7 | `Stage 9 MATERIAL-013 Privacy Review-Reference Clarification` | `S9-REM-FIXTURE-002` | none | exactly one commit |
| 8 | `Stage 9 Versioned Dataset Regeneration and Reconciliation` | integration only | S9-FIX-01…07 | exactly one commit |
| 9 | `Stage 9 Post-Remediation Corpus Assessment` | assessment only | S9-FIX-08 | exactly one commit |

No large aggregate remediation commit is allowed. In particular, S9-FIX-08
may materialize and reconcile already accepted source changes but may not
silently repair them, and S9-FIX-09 may assess but may not alter the corpus.

The one-commit messages are fixed in order:

1. `fix(stage-9): expose schema oracle evidence`;
2. `fix(stage-9): correct contradiction references`;
3. `fix(stage-9): correct high-risk references`;
4. `fix(stage-9): align risk references with source`;
5. `fix(stage-9): localize reversible trial template`;
6. `test(stage-9): preserve material normalization value`;
7. `docs(stage-9): clarify privacy review evidence`;
8. `test(stage-9): reconcile remediated dataset revisions`;
9. `test(stage-9): assess post-remediation corpus`.

## Historical reproducibility and versioning

The versioning mechanism extends the existing repository model rather than
creating a parallel review system:

- primary batches, reinforced batches, final adjudication, calibration,
  patterns, closure, and `LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json` remain
  immutable and byte-identical;
- canonical core records keep stable `case_id`; only affected future records
  increment `case_version` from `1.0` to `1.1`;
- synthetic-risk and rich fixtures keep stable fixture IDs. Because their
  current object shapes have no version field, history is not retrofitted;
  `AI_REMEDIATION_REVISION_LEDGER.json` records fixture ID, old/new SHA-256,
  baseline commit, candidate, owned issue IDs, substep commit, and validation;
- a new `LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json` gets its own package
  version and binds both the frozen v1 manifest hash and current source hashes;
- all revision-ledger entries are append-only. Corrections create a new ledger
  event rather than overwriting an earlier one.

This preserves the exact evidence used for the original verdicts while making
post-remediation outputs independently reproducible.

## Validation and release boundaries

Every implementation substep must run its targeted regression and the relevant
existing automated dataset gates. The full 216-fixture AI assessment is **not**
repeated after each small fix: it runs once in S9-FIX-09 after every source
change and the single deterministic regeneration have passed. S9-FIX-08 must
prove 97/97 actionable-claim mapping, old/new hash completeness, deterministic
regeneration, and byte identity of every historical artifact.

This planning substep does not close Stage 9. Release readiness is not declared,
live AI/provider execution remains closed, `/api/simulate` remains
`mockOnly=true`, and UI/API/runtime/persistence boundaries remain closed. After
S9-FIX-09, `Stage 9 Release Readiness and Runtime Boundary Decision` is a
separate future planning candidate; it is not authorized by this plan.

## Selected first implementation-ready candidate

Exactly one candidate is selected: `Stage 9 Schema-Oracle Evidence Projection
Revision` (`S9-FIX-01`, `S9-REM-SCHEMA-001`). It is dependency-free, fixes the
review oracle before any dataset regeneration, and has a six-fixture target
with a closed runtime boundary. The implementation contract is frozen in
`STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_SPEC.v1.md`. No implementation was
performed here.
