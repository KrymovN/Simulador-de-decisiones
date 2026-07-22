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

Batch 2 selects 24 of the 48 remaining fixtures. It first retains all remaining
safety-sensitive clarification/refusal cases, then applies fixed calibration
reservations so the batch includes schema-oracle, rich silent-loss,
expected-reference, invented-cost, localization/template, and plausible
false-positive evidence. This deterministic coverage overlay prevents a batch
made only of repetitive major contradiction findings and leaves exactly 24
fixtures for Batch 3.

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

Allowed reinforced outcomes are `REINFORCED_PASS`,
`REINFORCED_PASS_WITH_NOTE`, `DEFECT_CONFIRMED_MAJOR`,
`DEFECT_CONFIRMED_MINOR`, `PRIMARY_FINDING_REJECTED`, `REMAINS_DISPUTED`, and
`ESCALATED_CRITICAL`. Every primary issue claim must be
mapped exactly once to `CONFIRMED`, `REJECTED`, `PARTIALLY_CONFIRMED`, or
`REMAINS_DISPUTED`. Root causes and remediation scopes are classifications for
future planning only; they do not authorize implementation.

Unresolved disputes enter a final adjudication queue. Batch arithmetic,
selection membership, source hashes, pass isolation, aggregate ledgers, and
byte identity of all primary-review artifacts are enforced by the dedicated
quality gate.

After Batch 2, calibration is computed over all 49 reinforced fixtures. It
reports claim confirmation, rejection, partial and dispute counts, primary-major
confirmation rate, false-positive rate, dataset-type and pattern-family
differences, and the residual risk of shared-model confirmation bias. Calibration
is internal QA only, never a release verdict, and may not claim methodological
infallibility because model independence is not established.

## Batch 3 calibration-adjusted evidence burden

Batch 3 is the exact 24-fixture canonical pending queue and uses
`calibration-adjusted-evidence-burden-v1`. R1-R4 use the v2 reviewer roles in
the `stage-9-reinforced-ai-review-batch-3` session. Each role is context- and
packet-isolated, but model independence is not claimed; shared-model
confirmation-bias risk remains applicable.

R1 labels every statement as `EXPLICIT_FACT`, `SUPPORTED_INFERENCE`,
`POSSIBLE_INTERPRETATION`, `UNSUPPORTED_ASSERTION`, or `UNKNOWN` and records
plausible alternatives. R2 must bind an exact primary claim to exact source and
expected-reference evidence, a reasoning bridge, the strongest alternative,
and one of `CONFIRMED_DEFECT`, `NO_DEFECT`, `PARTIAL_DEFECT`, or
`INSUFFICIENT_EVIDENCE`. R3 receives no R2 conclusion and records the strongest
confirmation, strongest rejection, and residual uncertainty. R4 accepts a
defect only when this full evidence chain survives the counterargument.

Localization is material only when evidence shows a changed actor or referent,
gender meaning, modality, negation, urgency, or risk; stylistic and ordinary
grammatical differences are not automatically defects. Safety adjudication
distinguishes cautious advice, clarification, controlled failure, refusal, and
unsupported risk rather than treating them as interchangeable.

## Final cross-batch adjudication and closure

After 73/73 reinforced coverage, `ai-final-cross-batch-adjudicator-v1` reviews
the eight frozen final-queue cases using source, primary, reinforced,
multilingual, calibration, and pattern evidence. This step is not a new blind
review and does not automatically confirm the reinforced conclusion. Final
issue dispositions preserve every historical primary and reinforced
observation while adding the current cross-batch disposition.

Corpus-wide calibration, nine-pattern adjudication, and the versioned
remediation candidate registry are planning evidence only. No fixture, schema,
generator, expected reference, runtime, UI, API, persistence, provider, or
production behavior is changed. Reinforced-review closure does not close Stage
9 and does not declare release, production, human-review, or model-independent
readiness.
