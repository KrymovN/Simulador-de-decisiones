# Stage 9 MATERIAL-006 Silent-Loss Specification v1

## Authority and boundary

- Substep: `S9-FIX-06 — Stage 9 MATERIAL-006 Silent-Loss Fixture Revision`
- Candidate: `S9-REM-FIXTURE-001`
- Issue: `B3-ISSUE-004` / `ACCEPTED_ITEM_SILENTLY_DROPPED`
- Canonical root cause: `ISOLATED_FIXTURE_EXPECTATION_SILENT_LOSS`
- Status at preparation: `IMPLEMENTATION_READY_NOT_STARTED`
- Required implementation commit count: exactly one.

The runtime does not silently lose this item. Acceptance already normalizes and
returns the unknown, emits `accepted_with_normalization`, preserves its `unknown`
type, creates traceability, and reports `silent_loss_count: 0`. The defect is
only the single fixture's expected future-composition projection: it accepts one
item while inheriting an empty `future_composition.items`.

## Exact ownership and source

Owned fixture count is exactly `1/1`:

- `S9-MATERIAL-006`

Authoritative source:

- file: `lib/ai-decision-material/fixtures.ts`
- fixture symbol: `RICH_DECISION_MATERIAL_FIXTURES[S9-MATERIAL-006]`
- stable source symbol introduced by implementation: `normalizationItem`

The named `normalizationItem` is the authoritative source representation. Its
generated `candidate_id` is currently `candidate_565`, but that generated value
is evidence, not the source-code authority. Future composition must reference
`normalizationItem.candidate_id`, never a standalone hard-coded generated ID.

## Exact before and after projection

Accepted normalized unknown:

`La capacidad futura no está confirmada.`

Before:

```json
{
  "items": [],
  "contains_raw_provider_answer": false,
  "personal_data_scope_opened": false
}
```

After:

```json
{
  "items": [
    {
      "composition_item_id": "composition_1",
      "source_candidate_ids": ["candidate_565"],
      "transformations": ["epistemic_classification", "traceability"],
      "authority": "decision_engine"
    }
  ],
  "contains_raw_provider_answer": false,
  "personal_data_scope_opened": false
}
```

The implementation declares the symbol locally at the existing
`S9-MATERIAL-006` item-construction position:

```ts
(() => {
  const normalizationItem = item(
    "unknown",
    "  La capacidad futura   no está confirmada.  ",
  );
  return fixture(/* exact owned fixture using normalizationItem */);
})()
```

`S9-MATERIAL-006` then uses `single(normalizationItem)` and:

```ts
future_composition: composition(
  [normalizationItem.candidate_id],
  ["epistemic_classification", "traceability"],
)
```

The local declaration must remain at the existing inline item-construction
position. This preserves evaluation order, the material projection, generated
ID evidence, and all `183/183` non-owned rows. A top-level declaration beside
the shared helper constants is prohibited because it shifts generated IDs.
The only fixture-data projection change is
`RICH_DECISION_MATERIAL_FIXTURES[S9-MATERIAL-006].future_composition`.

## Allowed and prohibited fields

Allowed source edits:

- local declaration of `normalizationItem` inside an immediately invoked
  expression at the existing `S9-MATERIAL-006` array position;
- replacement of the owned inline item expression with
  `single(normalizationItem)`;
- addition of owned `future_composition`.

Allowed data path:

- `RICH_DECISION_MATERIAL_FIXTURES[S9-MATERIAL-006].future_composition`

Prohibited changes include material content, normalized output, coverage ID,
expected status, dispositions, reasons, accepted count, risk-only flag, runtime
acceptance, runtime normalization, schema, generated IDs/order, or any other
fixture. All `183/183` non-owned rich fixtures remain byte-equivalent by
deterministic projection.

## Deterministic projection hashes

Hash input is canonical two-space JSON plus one trailing newline for the complete
`S9-MATERIAL-006` fixture projection.

- before SHA-256:
  `49ebb871f26f032d69edee3c8cd670dc7fe9e6b0dbc2becbd85c1852a47982e0`
- after SHA-256:
  `fe7ddf3acd20aed9ddc7d6d1a62efd91346958759faa7a716ecb91769f4529c0`

Rich fixtures do not have `case_version`; implementation must not add one.

## Write sets

Permanent preparation write set:

1. `docs/qa/remediation/stage-9/STAGE_9_MATERIAL_006_SILENT_LOSS_SPEC.v1.md`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json`
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`
4. `scripts/stage-9-material-006-silent-loss-quality.mjs`
5. `scripts/stage-9-ai-value-preservation-quality.mjs`
6. `scripts/stage-9-remediation-plan-quality.mjs`
7. `scripts/stage-9-remediation-revision-integrity-quality.mjs`
8. `package.json`

Future implementation write set, exactly four files:

1. `lib/ai-decision-material/fixtures.ts`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`
3. `docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json`
4. `PROJECT_CONTEXT.md`

No fifth file is permitted. Specification, sequence, registry, graph, package,
and gates are immutable during implementation.

## Append-only ledger event

Exactly one event is appended after the immutable `S9-FIX-05` event:

```json
{
  "event_version": "stage-9-ai-remediation-revision-event.1",
  "substep_id": "S9-FIX-06",
  "remediation_entry_ids": ["S9-REM-FIXTURE-001"],
  "issue_ids": ["B3-ISSUE-004"],
  "shared_rule_id": "accepted_normalized_unknown_requires_future_composition",
  "owned_fixture_ids": ["S9-MATERIAL-006"],
  "affected_json_paths": ["RICH_DECISION_MATERIAL_FIXTURES[S9-MATERIAL-006].future_composition"],
  "old_projection_sha256": "49ebb871f26f032d69edee3c8cd670dc7fe9e6b0dbc2becbd85c1852a47982e0",
  "new_projection_sha256": "fe7ddf3acd20aed9ddc7d6d1a62efd91346958759faa7a716ecb91769f4529c0",
  "runtime_acceptance_preserved": true,
  "normalized_unknown": "La capacidad futura no está confirmada.",
  "result_artifact_path": "docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json",
  "generated_at": null,
  "implementation_commit_message": "fix(stage-9): preserve MATERIAL-006 accepted unknown"
}
```

All earlier events and their order are immutable.

## Result artifact

The sole regression report and bounded result is:

`docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json`

Artifact version is `stage-9-material-006-silent-loss-result.1`, status `PASS`.
It contains: substep/candidate/issue/root/rule; owned fixture; normalized unknown;
stable source symbol and generated evidence ID; exact before/after composition;
transformations and authority; false flags; affected paths; old/new hashes;
owned count `1`; non-owned preservation `183`; runtime acceptance before/after
projection; exact ledger append; exact four-file write set; bounded status;
mandatory gates; historical/runtime/network preservation. Serialization is
canonical two-space JSON with one trailing newline and must repeat identically.

## Status boundary

Future `PROJECT_CONTEXT.md` editing is allowed only inside:

`## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`

It must record: FIX06 completed; completed `6/9`; remaining `3/9`; next
`S9-FIX-07`; Stage 9 `In Progress`; release `NOT_DECLARED`; runtime boundaries
`CLOSED`; visual migration remaining `0`. Preparation does not edit context.

## Mandatory gates

The same real four-file diff must pass twice:

- `quality:stage-9-remediation-plan`
- `quality:stage-9-material-006-silent-loss -- --post-implementation`
- `quality:stage-9-ai-value-preservation`
- `quality:stage-9-remediation-revision-integrity`
- `quality:stage-9-offline-dataset-coverage`

Exact allowlist, owned/non-owned projection, runtime acceptance preservation,
ledger/result/status validation, historical/runtime/network protection,
deterministic self-tests/serialization, and `git diff --check` are mandatory.
Prospective mode proves readiness only and cannot claim completion.

## Atomicity and rollback

Implementation is one exact four-file diff and one commit:

`fix(stage-9): preserve MATERIAL-006 accepted unknown`

Rollback is one revert of that commit, restoring the empty expectation and
removing its one ledger event, result artifact, and bounded status update.
Rollback does not rewrite historical evidence or prior ledger events.
