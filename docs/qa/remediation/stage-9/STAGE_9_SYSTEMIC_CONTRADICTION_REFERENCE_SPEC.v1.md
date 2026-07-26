# Stage 9 Systemic Contradiction Reference Remediation — Implementation Spec v1

Substep: `S9-FIX-02`

Candidates: `S9-REM-EXPECTED-001`, `S9-REM-CLUSTER-001`

Status: `IMPLEMENTATION_READY_NOT_STARTED`

Implementation executed: `false`

Required commit count: exactly one

## Purpose

Correct one shared expected-reference rule for systemic contradictions, jointly
owned by `S9-REM-EXPECTED-001` and `S9-REM-CLUSTER-001`. Consolidation is
permitted only because both entries share the same implementation rule. No
other remediation root cause belongs to this substep.

## Exact ownership

`S9-REM-EXPECTED-001` owns exactly 39 confirmed claims:

1. `B1-ISSUE-033`
2. `B1-ISSUE-034`
3. `B1-ISSUE-022`
4. `B1-ISSUE-024`
5. `B1-ISSUE-019`
6. `B1-ISSUE-021`
7. `B1-ISSUE-025`
8. `B1-ISSUE-027`
9. `B1-ISSUE-028`
10. `B1-ISSUE-030`
11. `B6-ISSUE-017`
12. `B6-ISSUE-018`
13. `B6-ISSUE-015`
14. `B6-ISSUE-016`
15. `B6-ISSUE-019`
16. `B6-ISSUE-020`
17. `B3-ISSUE-011`
18. `B3-ISSUE-012`
19. `B3-ISSUE-013`
20. `B3-ISSUE-014`
21. `B4-ISSUE-002`
22. `B4-ISSUE-003`
23. `B4-ISSUE-004`
24. `B4-ISSUE-005`
25. `B4-ISSUE-007`
26. `B4-ISSUE-008`
27. `B4-ISSUE-009`
28. `B5-ISSUE-013`
29. `B5-ISSUE-014`
30. `B5-ISSUE-015`
31. `B5-ISSUE-016`
32. `B5-ISSUE-017`
33. `B5-ISSUE-018`
34. `B5-ISSUE-019`
35. `B5-ISSUE-020`
36. `B6-ISSUE-007`
37. `B6-ISSUE-009`
38. `B6-ISSUE-011`
39. `B6-ISSUE-013`

`S9-REM-CLUSTER-001` owns exactly one consolidated partial case:

- claim: `B4-ISSUE-006`;
- fixture: `S9-CORE-020-ES`;
- final disposition: `PARTIALLY_CONFIRMED`;
- accepted component: the expected reference asserts a contradiction not
  entailed by the renewal deadline, expected alternative offer, and missing
  response date.

The shared rule owns exactly eight clusters:

1. `S9-CLUSTER-004`
2. `S9-CLUSTER-008`
3. `S9-CLUSTER-016`
4. `S9-CLUSTER-020`
5. `S9-CLUSTER-024`
6. `S9-CLUSTER-028`
7. `S9-CLUSTER-032`
8. `S9-CLUSTER-036`

The rejected gender interpretation remains excluded: “Grammatical gender is
non-material unless actor, modality, negation, urgency, or risk changes.” It
must not become a defect, owned claim, remediation branch, or acceptance
condition.

## Dependency and order

`S9-FIX-01` was completed by commit
`6b04c405a2a8aaba9e9c3e164413a9d954ee04af`. `S9-FIX-02` is the next
implementation substep in the unchanged topological order. `S9-FIX-03`,
regeneration in `S9-FIX-08`, reconciliation, and final corpus assessment remain
future work. Existing prerequisites and registry dependencies remain unchanged.

## Exact implementation source

The only implementation source is
`lib/ai-decision-material/fixtures.ts`, at the existing symbols:

- `SCENARIO_BLUEPRINTS`;
- `SCENARIO_BLUEPRINTS[contract_renewal]`;
- `completenessClarification`;
- `CANONICAL_OFFLINE_EVALUATION_CASES`.

## Exact future implementation write allowlist

The future `S9-FIX-02` implementation may write only:

1. `lib/ai-decision-material/fixtures.ts`;
2. `scripts/stage-9-systemic-contradiction-reference-quality.mjs`;
3. `package.json`;
4. `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json`;
5. `docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json`;
6. `PROJECT_CONTEXT.md`, restricted to the section headed
   `## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026`.

The bounded result path is exactly
`docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json`.
No post-remediation manifest, unrelated source fixture, historical artifact, or
other canonical status document is writable.

## Mandatory gates

The exact mandatory implementation gates are:

- `quality:stage-9-systemic-contradiction-reference`;
- `quality:stage-9-offline-dataset-coverage`;
- `quality:stage-9-remediation-revision-integrity`.

The dedicated package command is
`quality:stage-9-systemic-contradiction-reference`, backed by
`scripts/stage-9-systemic-contradiction-reference-quality.mjs`. Implementation
gates must not run during this planning-control commit.

## Acceptance criteria

The future implementation must:

- correct all 39 owned claims, the consolidated partial case, and all eight
  owned clusters;
- keep the rejected gender interpretation excluded and prove contradiction
  entailment from two incompatible source claims;
- preserve unrelated references and generate the bounded result
  deterministically;
- append only the current ledger revision while preserving the `S9-FIX-01`
  ledger event and evidence;
- preserve historical review artifacts;
- produce no runtime diff and zero application/provider network requests;
- use exactly one commit, push only after full PASS, and fully roll back on
  failure.

## Prohibited scope

The implementation must not include `S9-FIX-03` or later remediation,
clarification/refusal, invented risk mechanisms, localization or fixture
remediation, schema-oracle rework, historical disposition changes, restoration
of the rejected gender interpretation, runtime/UI/API/provider/persistence/
Supabase/auth changes, `97/97` reconciliation, full corpus assessment, or
unrelated refactoring.

## Commit message and atomicity

The exact implementation commit message is:

`fix(stage-9): correct contradiction references`

Exactly one implementation commit is allowed. Any failure requires rollback of
only the exact implementation allowlist.
