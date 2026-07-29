# Stage 9 Reversible-Trial Localization Template Specification v1

## Authority and boundary

- Substep: `S9-FIX-05 — Stage 9 Reversible-Trial Localization Template Remediation`
- Candidate: `S9-REM-GENERATOR-001`
- Category: `GENERATOR_TEMPLATE_LEVEL`
- Cluster: `S9-CLUSTER-010`
- Canonical root cause: `GENERATOR_TEMPLATE_LOCALIZATION`
- Status at preparation: `IMPLEMENTATION_READY_NOT_STARTED`; implementation is not executed by this preparation commit.
- Required implementation commit count: exactly one.

The root cause is limited to mechanically literal or unnatural localization of the
English `reversible trial` meaning in the `study_abroad_trial` ES, RU, and ZH
template strings. English is the semantic reference. The separate gender-drift
interpretation was rejected by final adjudication and is prohibited from returning.
This contract does not authorize a general localization-system rewrite.

## Exact ownership and source

Owned rows are exactly `3/3`:

- `S9-CORE-010-ES` — issue `B1-ISSUE-011`
- `S9-CORE-010-RU` — issue `B1-ISSUE-014`
- `S9-CORE-010-ZH` — issue `B1-ISSUE-016`

`S9-CORE-010-EN` is the immutable protected semantic reference.

The only implementation source file is
`lib/ai-decision-material/fixtures.ts`, at:

- `SCENARIO_BLUEPRINTS[study_abroad_trial]`
- `CANONICAL_OFFLINE_EVALUATION_CASES`

## Exact localization semantics

The four-locale meaning is: a fictional student compares a semester abroad, a
local program, and a short, bounded trial study period for which returning to the
prior option remains possible. It does not promise zero risk, guaranteed return,
eligibility, credit transfer, housing, funding, or any other new fact.

Protected English reference (unchanged):

`A fictional student compares a semester abroad, a local program, and a short reversible trial.`

Approved replacements:

| Row | Before | After |
| --- | --- | --- |
| `S9-CORE-010-ES` | `Una estudiante ficticia compara semestre internacional, programa local y prueba corta reversible.` | `Una estudiante ficticia compara un semestre internacional, un programa local y una estancia académica breve de prueba que permite volver a la opción anterior.` |
| `S9-CORE-010-RU` | `Вымышленный студент сравнивает семестр за рубежом, местную программу и короткую обратимую пробу.` | `Вымышленный студент сравнивает семестр за рубежом, местную программу и короткий пробный учебный период с возможностью вернуться к прежнему варианту.` |
| `S9-CORE-010-ZH` | `一名虚构学生比较海外学期、本地项目和短期可逆试读。` | `一名虚构学生比较海外学期、本地项目和保留回到原方案选择的短期试学。` |

Only these field paths may change:

- `SCENARIO_BLUEPRINTS[study_abroad_trial].situations.es`
- `SCENARIO_BLUEPRINTS[study_abroad_trial].situations.ru`
- `SCENARIO_BLUEPRINTS[study_abroad_trial].situations.zh`
- `CANONICAL_OFFLINE_EVALUATION_CASES[S9-CORE-010-ES].user_situation`
- `CANONICAL_OFFLINE_EVALUATION_CASES[S9-CORE-010-RU].user_situation`
- `CANONICAL_OFFLINE_EVALUATION_CASES[S9-CORE-010-ZH].user_situation`
- the same three rows' `.case_version`

The generated row values must equal the approved source strings. No gender-based
normalization, gender claim, literal `prueba reversible`/`обратимая проба`/`可逆试读`
replacement, scenario change, new condition, or eligibility claim is allowed.

## Version profile

- `S9-CORE-010-ES`: `1.0 → 1.1`
- `S9-CORE-010-RU`: `1.0 → 1.1`
- `S9-CORE-010-ZH`: `1.0 → 1.1`
- `S9-CORE-010-EN`: retained `1.0`
- all 157 non-owned canonical rows: unchanged

## Write sets

Preparation write set:

1. `docs/qa/remediation/stage-9/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_SPEC.v1.md`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json`
3. `docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`
4. `scripts/stage-9-reversible-trial-localization-quality.mjs`
5. `scripts/stage-9-offline-dataset-coverage-quality.mjs`
6. `scripts/stage-9-remediation-revision-integrity-quality.mjs`
7. `scripts/stage-9-remediation-plan-quality.mjs`
8. `package.json`

Future implementation write set, exactly four files:

1. `lib/ai-decision-material/fixtures.ts`
2. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`
3. `docs/qa/remediation/stage-9/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json`
4. `PROJECT_CONTEXT.md`

No fifth file is permitted. Sequence, registry, specification, graph, package,
and all gate scripts are immutable during future implementation.

## Append-only ledger event

Exactly one event is appended after the immutable `S9-FIX-04` event:

```json
{
  "event_version": "stage-9-ai-remediation-revision-event.1",
  "substep_id": "S9-FIX-05",
  "remediation_entry_ids": ["S9-REM-GENERATOR-001"],
  "shared_rule_id": "reversible_trial_localization_preserves_bounded_reversibility",
  "owned_fixture_ids": ["S9-CORE-010-ES", "S9-CORE-010-RU", "S9-CORE-010-ZH"],
  "case_version_transitions": [
    {"fixture_id": "S9-CORE-010-ES", "from": "1.0", "to": "1.1"},
    {"fixture_id": "S9-CORE-010-RU", "from": "1.0", "to": "1.1"},
    {"fixture_id": "S9-CORE-010-ZH", "from": "1.0", "to": "1.1"}
  ],
  "protected_reference_fixture_id": "S9-CORE-010-EN",
  "multilingual_equivalence": "EN_REFERENCE_PRESERVED",
  "result_artifact_path": "docs/qa/remediation/stage-9/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json",
  "generated_at": null,
  "implementation_commit_message": "fix(stage-9): localize reversible trial template"
}
```

Existing ledger events through `S9-FIX-04` remain byte/order immutable.

## Result artifact

The sole result and multilingual-equivalence artifact is:

`docs/qa/remediation/stage-9/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json`

It uses artifact version
`stage-9-reversible-trial-localization-template-result.1`, status `PASS`, and
contains: substep/candidate/root/rule identifiers; exact owned IDs; protected EN
projection; the three before/after projections; semantic-equivalence assertions;
`gender_interpretation: "REJECTED_UNCHANGED"`; version transitions; `owned_count:
3`; `non_owned_preserved_count: 157`; the exact ledger append; the exact four-file
write set; the status boundary; mandatory gate results; deterministic projection
hashes; `historical_artifacts: "UNCHANGED"`; `runtime_boundaries: "CLOSED"`;
`network_provider_execution_count: 0`; and `visual_migration_remaining: 0`.
Serialization is canonical two-space JSON with one trailing newline and must be
identical on a repeated run.

## Status boundary

Future status editing is allowed only inside the existing heading:

`## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`

It must say: `S9-FIX-05` completed; completed `5/9`; remaining `4/9`; next
`S9-FIX-06`; Stage 9 `In Progress`; release readiness `NOT_DECLARED`; runtime
boundaries `CLOSED`; visual migration remaining `0`. No other heading or section
may change. This preparation does not edit `PROJECT_CONTEXT.md`.

## Mandatory gates and evidence

The same real four-file diff must pass, twice deterministically:

- `quality:stage-9-remediation-plan`
- `quality:stage-9-reversible-trial-localization -- --post-implementation`
- `quality:stage-9-offline-dataset-coverage`
- `quality:stage-9-remediation-revision-integrity`

All changed-gate machine self-tests, exact allowlist, projection, EN preservation,
ledger, result, status, historical/runtime/network protection, serialization, and
`git diff --check` are mandatory. Prospective mode proves only contract readiness
and must never claim remediation completion.

## Protection, atomicity, and rollback

Protected: EN row/text/version; all non-owned blueprints and 157 rows; rejected
gender theory; historical review corpus; legacy manifests; completed `S9-FIX-01`
through `S9-FIX-04` result artifacts and ledger events; runtime/API/UI/provider,
persistence/Supabase/auth; and all canonical preparation files during implementation.

Implementation is atomic: one exact four-file diff, one commit
`fix(stage-9): localize reversible trial template`, and no partial completion.
Rollback is one revert of that implementation commit, restoring the three source
strings/versions and removing its one ledger event, result artifact, and bounded
status update. Rollback never rewrites prior ledger history.
