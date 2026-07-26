# Stage 9 High-Risk Clarification and Refusal Reference Remediation — Implementation Spec v1

Substep: `S9-FIX-03`

Candidate: `S9-REM-EXPECTED-002`

Status: `PLANNED_NOT_STARTED`

Implementation executed: `false`

Required commit count: exactly one

## Purpose

Исправить expected-reference поведение в high-risk scenarios, где безопасный
эталон обязан запросить критически недостающие данные либо отказаться от
небезопасного продолжения.

Clarification is required when the approved evidence identifies a
safety-material missing rule, warning-sign gap, qualified interpretation, or
other critical information that must be narrowed before a normal
recommendation. Information-first behavior must be an active, bounded
clarification path rather than literal no action.

Refusal is required when the approved evidence establishes explicit harmful or
illegal intent and continuing with an actionable recommendation would be
unsafe. In those cases, refusal or cannot-recommend behavior takes priority
over asking a nonexistent important-gap question.

Controlled failure is correct for those same explicit harmful-intent cases when
the system withholds the unsafe recommendation and returns a bounded,
human-readable refusal or cannot-recommend result. This contract records the
already adjudicated boundary and creates no new safety policy.

## Ownership

`S9-REM-EXPECTED-002` owns exactly 17 locale rows:

1. `S9-CORE-012-ES`
2. `S9-CORE-012-EN`
3. `S9-CORE-012-RU`
4. `S9-CORE-012-ZH`
5. `S9-CORE-036-ZH`
6. `S9-CORE-037-ES`
7. `S9-CORE-037-EN`
8. `S9-CORE-037-RU`
9. `S9-CORE-037-ZH`
10. `S9-CORE-038-ES`
11. `S9-CORE-038-EN`
12. `S9-CORE-038-RU`
13. `S9-CORE-038-ZH`
14. `S9-CORE-040-ES`
15. `S9-CORE-040-EN`
16. `S9-CORE-040-RU`
17. `S9-CORE-040-ZH`

It owns exactly five safety clusters:

1. `S9-CLUSTER-012`
2. `S9-CLUSTER-036`
3. `S9-CLUSTER-037`
4. `S9-CLUSTER-038`
5. `S9-CLUSTER-040`

The locale-equivalence groups are:

- `S9-CLUSTER-012`: `S9-CORE-012-ES`, `S9-CORE-012-EN`,
  `S9-CORE-012-RU`, `S9-CORE-012-ZH`;
- `S9-CLUSTER-036`: `S9-CORE-036-ZH`;
- `S9-CLUSTER-037`: `S9-CORE-037-ES`, `S9-CORE-037-EN`,
  `S9-CORE-037-RU`, `S9-CORE-037-ZH`;
- `S9-CLUSTER-038`: `S9-CORE-038-ES`, `S9-CORE-038-EN`,
  `S9-CORE-038-RU`, `S9-CORE-038-ZH`;
- `S9-CLUSTER-040`: `S9-CORE-040-ES`, `S9-CORE-040-EN`,
  `S9-CORE-040-RU`, `S9-CORE-040-ZH`.

Clarification ownership is exactly the 13 rows in `S9-CLUSTER-012`,
`S9-CORE-036-ZH`, `S9-CLUSTER-037`, and `S9-CLUSTER-040`. Refusal ownership is
exactly `S9-CORE-038-ES`, `S9-CORE-038-EN`, `S9-CORE-038-RU`, and
`S9-CORE-038-ZH`. Controlled-failure ownership is exactly those same four
`S9-CLUSTER-038` refusal rows.

## Dependency and order

`S9-FIX-01` is completed. `S9-FIX-02` is completed by commit
`18c8d6bffa422c46f4439b6b93c1076fc98a375c`. `S9-FIX-03` is the next
implementation substep in the unchanged topological order.

`S9-FIX-04` is outside this contract. Regeneration in `S9-FIX-08`,
reconciliation, and corpus assessment in `S9-FIX-09` remain future work. No
dependency or topological-order change is authorized.

## Implementation status

`S9-FIX-03` is `PLANNED_NOT_STARTED` and `implementation_executed = false`.
This specification is planning control only; it does not execute the future
implementation.

## Exact implementation source

The only implementation source is
`lib/ai-decision-material/fixtures.ts`, at the existing symbols:

- `SCENARIO_BLUEPRINTS`;
- `completenessClarification`;
- `completenessRecommendation`;
- `CANONICAL_OFFLINE_EVALUATION_CASES`.

## Future implementation write allowlist

The future `S9-FIX-03` implementation may write only:

1. `lib/ai-decision-material/fixtures.ts`;
2. `scripts/stage-9-high-risk-reference-quality.mjs`;
3. `package.json`;
4. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`;
5. `docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json`;
6. `PROJECT_CONTEXT.md`, restricted to the section headed
   `## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`.

The bounded result artifact path is exactly
`docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json`.
No historical review artifact, runtime file, unrelated fixture, or other
canonical status document is writable.

## Mandatory gates

The exact mandatory implementation gates are:

- `quality:stage-9-high-risk-reference`;
- `quality:stage-9-offline-dataset-coverage`;
- `quality:stage-9-ai-value-preservation`;
- `quality:stage-9-remediation-revision-integrity`.

The dedicated command is `quality:stage-9-high-risk-reference`, backed by
`scripts/stage-9-high-risk-reference-quality.mjs`. There is no separate
controlled-failure package command in the approved union:
`quality:stage-9-offline-dataset-coverage` owns the mandatory
controlled-failure coverage assertion. Implementation gates must not run
during this planning-control commit.

## Acceptance criteria

The future implementation must:

- correct exactly 17/17 owned locale rows and 5/5 owned safety clusters;
- require clarification for safety-material missing information;
- require refusal or cannot-recommend behavior for unsafe continuation;
- preserve controlled-failure coverage and prevent a confident unsafe answer;
- invent no risk evidence and preserve locale-equivalent safety semantics;
- leave unrelated rows and candidate payloads unchanged;
- produce the bounded result deterministically;
- append only the current revision-ledger event;
- preserve `S9-FIX-01`, `S9-FIX-02`, and all historical review evidence;
- produce no runtime diff and execute zero network/provider requests;
- use exactly one commit, push only after full PASS, and fully roll back on
  failure.

## Prohibited scope

The implementation must not include `S9-FIX-04` invented risk-mechanism
remediation, `S9-FIX-05` reversible-trial localization, fixture remediation in
`S9-FIX-06` or `S9-FIX-07`, schema-oracle rework, contradiction-reference
rework, new fixtures, review-disposition changes, runtime schema or validators,
Prompt Context runtime, Decision Engine runtime, `/api/simulate`, UI/API,
provider/OpenAI, persistence, Supabase, auth, `97/97` reconciliation, full
corpus assessment, or unrelated refactoring.

## Commit message

The exact future implementation commit message is:

`fix(stage-9): correct high-risk references`

Exactly one implementation commit is allowed. Any implementation failure
requires rollback of only the exact future implementation allowlist.
