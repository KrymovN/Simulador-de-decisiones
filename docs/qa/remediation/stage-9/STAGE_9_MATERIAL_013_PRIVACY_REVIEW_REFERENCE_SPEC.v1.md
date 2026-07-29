# Stage 9 MATERIAL-013 Privacy Review-Reference Specification v1

## Authority and boundary

- Substep: `S9-FIX-07 — MATERIAL-013 Privacy Review-Reference Clarification`
- Candidate: `S9-REM-FIXTURE-002`
- Issue: `B1-ISSUE-006` / `PASS_A_PERSONAL_DATA_REPRODUCTION`
- Canonical root cause: `REVIEW_METHODOLOGY`
- Ownership/reference: `S9-MATERIAL-013`, exactly `1/1`
- Status at preparation: `IMPLEMENTATION_READY_NOT_STARTED`
- Required implementation commit count: exactly one.

The purpose-written fixture and runtime privacy behavior are correct. The
historical Pass A review artifact unnecessarily reproduced a synthetic email
identifier in display text. This substep clarifies future review-evidence
display and references; it does not repair the fixture, runtime, or frozen
historical artifacts.

## Normative privacy-display rule

Future review artifacts must not unnecessarily reproduce personal identifiers.
The exact human-readable email display is `[REDACTED_EMAIL]`. The exact
machine-readable category is `personal_email_identifier`.

Every privacy-safe structural evidence reference contains exactly:

```json
{
  "fixture_id": "S9-MATERIAL-013",
  "issue_id": "B1-ISSUE-006",
  "evidence_pointer": "docs/qa/review/ai-batches/batch-1/pass-a.json#results[fixture_id=S9-MATERIAL-013]",
  "source_fixture_sha256": "e4983e9ad8ca0c2ee5fe8d046bfe562c05f5ad050528267169dcfc608687026b"
}
```

Authorized forensic inspection may use the frozen source evidence. Ordinary
review display uses the redacted token and category and does not reproduce the
identifier. Purpose-written synthetic identifiers follow the same display rule.
Historical review artifacts remain byte-identical.

## Exact methodology boundaries

Future implementation adds one bounded subsection under each existing heading:

1. `docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md`
   - parent: `## 3. Blind semantic reconstruction — Pass A`
   - added: `### Privacy-safe evidence display`
2. `docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md`
   - parent: `## Isolated review passes`
   - added: `### Privacy-safe reinforced evidence references`

The additions state the exact display token, category, structural-reference
fields, forensic-access distinction, synthetic-identifier rule, and historical
immutability boundary. No other methodology section may change.

## Addendum contract

Future implementation creates:

`docs/qa/remediation/stage-9/MATERIAL_013_PRIVACY_REFERENCE_ADDENDUM.md`

It contains heading `# MATERIAL-013 Privacy Review-Reference Addendum`;
`S9-MATERIAL-013`; `B1-ISSUE-006`; root `REVIEW_METHODOLOGY`; the exact display
token and category; the exact structural reference; frozen source hash; and
statements that historical evidence is not rewritten and fixture/runtime
privacy behavior is unchanged. The raw email identifier is forbidden.

## Historical evidence and fixture protection

Frozen source fixture SHA-256:

`e4983e9ad8ca0c2ee5fe8d046bfe562c05f5ad050528267169dcfc608687026b`

Protected historical artifact hashes:

| Artifact | SHA-256 |
| --- | --- |
| `docs/qa/review/ai-batches/batch-1/pass-a.json` | `d6870e7dfe0923c8d4e7d40cb877efca751fabd0e15f5d52509876cf3fde07b8` |
| `docs/qa/review/ai-batches/batch-1/adjudication.json` | `2610cbb4e374a39b1c5f93c66359c134d566304534a238a3f45f2067109c5480` |
| `docs/qa/review/ai-reinforced-batches/batch-1/pass-r1.json` | `371ede69d927f561c9ad84431418114e819ac938f4ecdf70b60f0f2b2d283dac` |
| `docs/qa/review/ai-reinforced-batches/batch-1/pass-r2.json` | `0d5077e69e10ea127d90c55bb56f61617ebf4695187765ee2d9476457244f78a` |
| `docs/qa/review/ai-reinforced-batches/batch-1/pass-r3.json` | `d8213369449f6c2263ef462c82e5ce797bbe524e6ffec0d5d66e6aff7b560870` |
| `docs/qa/review/ai-reinforced-batches/batch-1/adjudication.json` | `e46f38648b90e71c3191948765df6d1d26c1d828fb348a5a27d9b92bb5f4c2fb` |
| `docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json` | `ce6c2439d5d3ade88902fdce93269da58ff5e905f0c25d6cc7b66291399621a8` |
| `docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json` | `5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b` |

`lib/ai-decision-material/fixtures.ts` is byte-protected. All `184/184` rich
fixtures remain projection-equivalent. Fixture content, coverage, status,
disposition, reason, accepted count, schema, runtime, API, UI, provider,
persistence, Supabase, and auth are immutable.

## Write sets

Permanent preparation write set, exactly eight files:

1. `docs/qa/remediation/stage-9/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_SPEC.v1.md`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json`
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`
4. `scripts/stage-9-material-013-privacy-reference-quality.mjs`
5. `scripts/stage-9-human-review-readiness-quality.mjs`
6. `scripts/stage-9-remediation-plan-quality.mjs`
7. `scripts/stage-9-remediation-revision-integrity-quality.mjs`
8. `package.json`

Future implementation write set, exactly six files:

1. `docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md`
2. `docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md`
3. `docs/qa/remediation/stage-9/MATERIAL_013_PRIVACY_REFERENCE_ADDENDUM.md`
4. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`
5. `docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json`
6. `PROJECT_CONTEXT.md`

No seventh file is permitted. Preparation artifacts and protected sources are
immutable during future implementation.

## Append-only ledger event

Exactly one event is appended after the immutable `S9-FIX-06` event:

```json
{
  "event_version": "stage-9-ai-remediation-revision-event.1",
  "substep_id": "S9-FIX-07",
  "remediation_entry_ids": ["S9-REM-FIXTURE-002"],
  "issue_ids": ["B1-ISSUE-006"],
  "root_cause": "REVIEW_METHODOLOGY",
  "shared_rule_id": "privacy_review_display_redacts_identifiers_preserves_hash_bound_reference",
  "fixture_reference_ids": ["S9-MATERIAL-013"],
  "frozen_source_fixture_sha256": "e4983e9ad8ca0c2ee5fe8d046bfe562c05f5ad050528267169dcfc608687026b",
  "methodology_paths": [
    "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
    "docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md"
  ],
  "addendum_path": "docs/qa/remediation/stage-9/MATERIAL_013_PRIVACY_REFERENCE_ADDENDUM.md",
  "display_representation": "[REDACTED_EMAIL]",
  "machine_category": "personal_email_identifier",
  "structural_reference_fields": ["fixture_id", "issue_id", "evidence_pointer", "source_fixture_sha256"],
  "historical_evidence_immutable": true,
  "result_artifact_path": "docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json",
  "generated_at": null,
  "implementation_commit_message": "fix(stage-9): clarify MATERIAL-013 privacy references"
}
```

All earlier events and their order are immutable.

## Result artifact

The bounded result is:

`docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json`

Artifact version is `stage-9-material-013-privacy-review-reference-result.1`,
status `PASS`. It contains IDs/root; fixture reference; display/category;
methodology headings; addendum path; structural reference; frozen source and
historical hashes; `184/184` fixture preservation; exact ledger append;
six-file write set; bounded status; mandatory gates; historical/runtime/network
preservation; deterministic hashes; and visual migration `0`. Raw email display
is forbidden. Serialization is two-space JSON with one trailing newline.

## Status boundary

Future `PROJECT_CONTEXT.md` editing is allowed only inside:

`## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`

It records: FIX07 completed; completed `7/9`; remaining `2/9`; next
`S9-FIX-08`; Stage 9 `In Progress`; release `NOT_DECLARED`; runtime boundaries
`CLOSED`; `/api/simulate` `mockOnly=true`; visual migration remaining `0`.
Preparation does not edit context.

## Mandatory gates

The same real six-file diff must pass twice:

- `quality:stage-9-remediation-plan`
- `quality:stage-9-material-013-privacy-reference -- --post-implementation`
- `quality:stage-9-human-review-readiness`
- `quality:stage-9-remediation-revision-integrity`

Exact allowlist, methodology sections, raw-identifier absence, `184/184`
fixtures, frozen hashes, ledger/result/status validation, runtime/API/UI
protection, deterministic tests/serialization, network `0`, and
`git diff --check` are mandatory.

## Atomicity and rollback

Implementation is one exact six-file diff and one commit:

`fix(stage-9): clarify MATERIAL-013 privacy references`

Rollback is one revert removing the methodology additions, addendum, one ledger
event, result, and bounded status update. Fixtures, frozen evidence, and prior
ledger events remain unchanged.
