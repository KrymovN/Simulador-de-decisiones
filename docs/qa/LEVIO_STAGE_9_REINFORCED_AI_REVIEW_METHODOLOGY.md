# LEVIO Stage 9 Reinforced AI Review Methodology

## Scope and invariants

Reinforced review adjudicates claims already produced by the completed primary
AI review. It does not alter fixtures, generators, templates, schemas,
references, runtime, UI, API behavior, or primary-review artifacts. Each batch
is selected from the immutable 73-fixture reinforced queue. No remediation is
authorized by this protocol.

## Deterministic priority selection

Batch 1 contains the first 25 fixtures after stable ordering by: disputed
verdict first; privacy or controlled-failure disagreement; safety sensitivity;
ascending primary confidence; descending issue-code count; and fixture ID.
Selection must retain broad source, locale, risk, contradiction, and domain
coverage where the priority order permits it.

## Isolated review passes

- R1 blind reassessment receives fixture evidence and review criteria but no
  primary conclusion. Its packet and output are frozen and hash-bound.
- R2 forensic diagnosis receives the frozen primary evidence and R1 output,
  but not the primary conclusion. It identifies whether each claimed defect is
  supported and assigns a candidate root-cause family.
- R3 counterargument receives the primary evidence and R1 output without R2's
  forensic findings. It constructs the strongest evidence-based challenge to
  the apparent result.
- R4 adjudication receives the frozen R1, R2, and R3 records and binds every
  primary issue claim to a final disposition and reinforced outcome.

The four passes use separate declared roles and context manifests. No pass may
claim human review or external model/provider execution; the process is an
offline repository-grounded AI review.

## Adjudication contract

Allowed reinforced outcomes are `DEFECT_CONFIRMED_MAJOR`,
`DEFECT_CONFIRMED_MINOR`, `PRIMARY_CLEARED`, `PARTIALLY_CONFIRMED`,
`REMAINS_DISPUTED`, and `ESCALATED_CRITICAL`. Every primary issue claim must be
mapped exactly once to `CONFIRMED`, `REJECTED`, `PARTIALLY_CONFIRMED`, or
`REMAINS_DISPUTED`. Root causes and remediation scopes are classifications for
future planning only; they do not authorize implementation.

Unresolved disputes enter a final adjudication queue. Batch arithmetic,
selection membership, source hashes, pass isolation, aggregate ledgers, and
byte identity of all primary-review artifacts are enforced by the dedicated
quality gate.
