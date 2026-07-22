# Stage 9 Post-Remediation Validation Strategy v1

Status: `PLANNING_ONLY`

Baseline: `eae42639c26445dd8ee8e437a6f73b31383c9c8b`

## Validation layers

1. **Per-substep targeted regression.** Each S9-FIX-01…07 commit proves only
   its owned claim IDs, fixture/cluster write set, source symbol, old/new hash
   entries, and explicit non-goals. The relevant existing dataset gates also
   run in that commit.
2. **Cross-candidate integrity.** After each commit, the revision-integrity gate
   checks unique claim ownership, candidate/substep mapping, stable IDs,
   append-only ledger order, no unplanned overlap, and historical artifact
   hashes.
3. **Single regeneration and reconciliation.** S9-FIX-08 regenerates the new
   post-remediation package only after all seven source/methodology commits. It
   must reconcile exactly 97 actionable claims, detect every changed row, prove
   deterministic output, and reject any unowned change.
4. **One full-corpus assessment.** S9-FIX-09 assesses the complete reconciled
   corpus once. It does not rewrite sources or declare release readiness.

## Targeted regression matrix

| Substep | Primary target | Mandatory existing coverage |
|---|---|---|
| S9-FIX-01 | six schema-oracle evidence paths | synthetic-risk evaluation; human-review readiness |
| S9-FIX-02 | contradiction entailment and cluster-020 parity | offline dataset coverage; value preservation |
| S9-FIX-03 | high-risk clarification/refusal/no-action behavior | offline coverage; controlled failure; value preservation |
| S9-FIX-04 | source-entailment for expected risks | synthetic-risk evaluation; offline coverage |
| S9-FIX-05 | four-locale semantic equivalence | offline coverage and cluster completeness |
| S9-FIX-06 | MATERIAL-006 accepted-item traceability | AI value preservation |
| S9-FIX-07 | privacy evidence-handling method | human-review readiness |
| S9-FIX-08 | hashes, deterministic regeneration, 97/97 mapping | every Stage 9 automated dataset gate |
| S9-FIX-09 | full post-remediation corpus | every Stage 9 gate, lint, build |

## When full assessment runs

The full 216-fixture corpus assessment runs once, only in S9-FIX-09. Running it
after every small fix would mix partial dataset states, multiply shared-model
review cost, and produce incomparable verdict families. Targeted deterministic
regressions provide immediate feedback; S9-FIX-08 then freezes one coherent
post-remediation corpus for the full assessment.

An emergency full-corpus rerun before S9-FIX-09 is permitted only if a targeted
gate detects an unbounded systemic effect. Such a rerun is diagnostic, gets a
new artifact version, and cannot substitute for the final assessment.

## Required invariants

- frozen primary/reinforced/final evidence and the legacy manifest remain
  byte-identical;
- stable fixture/case IDs never change; affected canonical versions advance,
  and non-versioned fixture revisions are ledgered;
- all 97 actionable claims have exactly one candidate owner and one terminal
  revision/validation mapping; four rejected claims are preserved, not fixed;
- every changed post-remediation row has an old hash, new hash, candidate,
  substep commit, reason, and regression result;
- no network use is required for deterministic gates;
- runtime, UI, API, provider, prompt, persistence, and mock-only boundaries stay
  closed throughout remediation and assessment.

## Assessment outputs and stopping rules

S9-FIX-09 must produce a hash-bound assessment package, before/after claim
matrix, residual-risk report, and a bounded assessment verdict. It fails if
coverage is incomplete, any historical hash moves, a changed row lacks an
owner, residual defects are hidden, or release readiness is asserted.

Even a clean post-remediation assessment leaves Stage 9 **In Progress** until a
separate `Stage 9 Release Readiness and Runtime Boundary Decision` is planned
and authorized. No remediation commit may open live provider execution or
change `/api/simulate` from `mockOnly=true`.
