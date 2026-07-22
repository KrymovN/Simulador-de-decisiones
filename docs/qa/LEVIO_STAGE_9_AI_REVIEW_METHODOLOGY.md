# Levio Stage 9 Independent AI Review Methodology

- Date: 22 July 2026, Europe/Madrid.
- Protocol version: `stage-9-independent-ai-review.1`.
- Active review status: `In Progress — Batch 5 of 6 complete; Batch 6 planning candidate`.
- Scope: versioned offline fixtures and QA artifacts only.
- Runtime status: closed.

## 1. Owner-approved project boundary

The Levio owner has approved a formal independent AI-assisted multi-pass review
as the active internal Stage 9 QA process. It is not human review, does not use
or imply human reviewer identities, and does not claim equivalence to legally,
scientifically, professionally, or regulatorily required human review outside
this project.

The protocol reviews only the repository's 216 versioned offline fixtures. Its
results are versioned QA artifacts. It does not connect a production provider,
open live OpenAI execution, change fixtures, authorize release, or modify any
runtime, API, UI, persistence, authentication, or user-data boundary.

The prior human-review readiness package remains immutable historical evidence
of the completed package-preparation substep. It is not the active review
procedure after this owner decision.

## 2. Reviewer roles and independence

Each selected fixture receives four distinct passes:

| Pass | Technical role ID | Input boundary | Output purpose |
| --- | --- | --- | --- |
| A | `ai-semantic-reviewer-v1` | Blind packet only | Independent reconstruction of facts, constraints, uncertainty, risks, gaps, and allowed conclusions |
| B | `ai-comparative-reviewer-v1` | Source fixture, expected material, frozen Pass A | Completeness, silent loss, grounding, priority, uncertainty, contradiction, and controlled-failure validation |
| C | `ai-adversarial-reviewer-v1` | Source fixture and cluster/duplicate context; no Pass A/B result | Language, equivalence, culture, duplication, privacy, adversarial pressure, directiveness, and scenario quality |
| D | `ai-adjudicator-v1` | Frozen A, B, and C artifacts | Evidence-based consolidated verdict, disagreement, confidence, remediation, and reinforced-review decision |

Every role uses the neutral environment identifier `codex-current-session`.
This identifier does not assert an unavailable exact model name.

Pass A must not receive expected risk signals, expected decision material,
preservation expectations, previous verdicts, or other pass results. Pass B
must not modify Pass A. Pass C is stored separately and must not overwrite A or
B. Pass D runs only after A, B, and C are fixed.

## 3. Blind semantic reconstruction — Pass A

For each blind packet, independently record:

- decision under review;
- material facts and constraints;
- assumptions and uncertainty;
- contradictions;
- risks and irreversibility;
- missing information;
- allowed conclusions;
- forbidden conclusions;
- confidence, rationale, evidence references, and issue codes.

The reviewer must distinguish absent information from negative facts and must
not invent expected behavior from a technical case name.

## 4. Comparative semantic validation — Pass B

Compare the source, declared expectations, and frozen blind reconstruction for:

- completeness of expected behavior;
- silent loss;
- unsupported inference;
- incorrect risk priority;
- uncertainty loss;
- input/expectation contradiction;
- controlled-failure correctness;
- preservation of useful decision material.

Pass B records a provisional AI verdict, severity, confidence, rationale,
evidence, issue codes, and remediation requirement without editing the source.

## 5. Linguistic and adversarial validation — Pass C

Review language naturalness, semantic correctness, multilingual equivalence,
cultural or regional distortion, disguised paraphrases, semantic duplicates,
privacy leakage, hallucination incentives, excessive directiveness,
unsupported certainty, and weak or artificial scenarios.

For fixtures without a multilingual cluster, `equivalence_status` must be
`NOT_APPLICABLE`. The reviewer must not synthesize an equivalence judgment from
missing data. Complete clusters are reviewed as four-member units while each
member retains its own evidence and verdict.

## 6. AI adjudication — Pass D

The adjudicator evaluates the reasoning and evidence from all three passes; it
does not choose a simple majority. Every final record contains:

- consolidated verdict and severity;
- confidence from 0 to 1;
- rationale;
- confirmed and disputed issues;
- evidence references;
- remediation requirement;
- all four technical reviewer role IDs;
- review timestamp and prompt version;
- source fixture hash;
- reinforced-review decision and reasons.

The adjudicator explains why each disputed observation is accepted, rejected,
or left unresolved.

## 7. Verdicts and severity

Allowed consolidated verdicts:

- `AI_PASS`;
- `AI_PASS_WITH_NOTE`;
- `AI_FAIL_MINOR`;
- `AI_FAIL_MAJOR`;
- `AI_DISPUTED`;
- `AI_NOT_REVIEWED`.

Allowed severity values are `NONE`, `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.
No AI verdict is described as a human verdict.

## 8. Reinforced-review rule

A case is automatically marked `reinforced_review_required=true` when any of
these conditions applies:

- final verdict is `AI_FAIL_MAJOR` or `AI_DISPUTED`;
- severity is `HIGH` or `CRITICAL`;
- confidence is below `0.75`;
- reviewers disagree about silent loss, privacy, or controlled failure;
- a multilingual equivalence disagreement exists.
- high-risk ground truth remains unsupported after adjudication.

These cases are not closed by the current batch. The issue ledger preserves the
disagreement and exact evidence references for a later intensified AI pass.

## 9. Batch artifacts and immutability

Every batch stores deterministic JSON artifacts for selection, blind packets,
Pass A, Pass B, Pass C, adjudication, summary, issue ledger, and its separate
reinforced-review queue. Aggregate progress preserves batch provenance. Each
result is linked to a SHA-256 source fixture hash. Reviewer role IDs are
technical; no human identities, secrets, real personal data, or production
credentials are allowed.

Stored intermediate artifacts are append-only review evidence for the batch.
Discovered fixture defects are recorded with remediation recommendations but
are not repaired in the same bounded substep.

## 10. Stage and release status

Batch completion means only that its selected fixtures received the four-pass
protocol. It does not mean all 216 fixtures are reviewed or closed. Stage 9
remains `In Progress`; release readiness, production readiness, live provider
integration, and runtime approval remain unclaimed.

## 11. Batch 3 and cross-batch pattern assessment

Batch 3 applies the unchanged four-pass protocol to 36 new fixtures: 4
synthetic-risk, 4 rich decision-material baseline, and 28 canonical core records
forming seven complete four-language clusters. The batch selection is disjoint
from Batches 1 and 2; their artifacts and all fixture sources remain immutable.

Cross-batch pattern assessment is stored separately in
`docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json`. A pattern is at least
`POTENTIALLY_SYSTEMIC` when it is confirmed in three or more independent core
clusters, occurs with high severity in at least two domains, or recurs across
dataset types. `SYSTEMIC_BLOCKER` requires stronger evidence that a significant
portion of unreviewed fixtures is affected or that ground truth is unreliable as
a class. Batch 3 meets several potentially-systemic thresholds but does not
establish that stronger blocker condition. Reinforced review and remediation
remain separate, unexecuted substeps.

## 12. Batch 4 challenge sample and pattern saturation

Batch 4 applies the unchanged four-pass protocol to 36 new fixtures: 4
synthetic-risk, 4 rich decision-material baseline, and 28 canonical core records
forming seven complete ES/EN/RU/ZH clusters. It is disjoint from Batches 1–3,
whose artifacts remain append-only and byte-identical.

The selection explicitly challenges five prior pattern hypotheses: unsupported
contradiction ground truth, unsupported high-risk ground truth, localization or
gender drift, invented cost/deadline/irreversibility, and reference behavior not
supported by input. Both confirming fixtures and counterexamples are required;
absence of recurrence is evidence and must not be silently converted into a
failure. Batch-level evidence dispositions and cumulative occurrence counts are
stored in `AI_REVIEW_CROSS_BATCH_PATTERNS.json`.

`AI_REVIEW_PATTERN_SATURATION.json` records whether each challenged pattern has
enough multi-batch confirmations and counterevidence for later remediation
design. Saturation does not authorize fixture changes, reinforced-review
execution, early termination of the remaining primary review, or a
`SYSTEMIC_BLOCKER`. Batch 4 leaves 72 fixtures for primary review and preserves
Batch 5 as a planning candidate only when `CRITICAL=0` and no systemic blocker
is established.

## 13. Batch 5 final-pool feasibility and expanded pattern challenge

Batch 5 applies the unchanged protocol to 36 new fixtures: 4 synthetic-risk, 4
rich baseline, and 28 canonical core records in seven complete four-language
clusters. Its selection is disjoint from Batches 1–4 and preserves their
append-only artifacts and every fixture source byte-for-byte.

The deficit matrix records an explicit source-catalog constraint: the eleven
owner-listed untouched cluster candidates span six, not seven, distinct core
domains because none belongs to `high_risk_and_safety_sensitive`. The selected
seven clusters therefore use the achievable six-domain maximum without making
a false coverage claim. Privacy handling is challenged through consent-policy,
personal-classification, caregiving, and data-minimization contexts even though
the selected manifest entries have no positive privacy marker.

Batch 5 expands the pattern challenge to all nine registered families and stores
new confirmations, counterexamples, cumulative occurrence counts, generator or
template linkage hypotheses, locality, and future remediation scope. Saturation
does not authorize fixture remediation or reinforced-review execution.

The final-batch feasibility gate derives the remaining source set after Batches
1–5 and requires exactly 28 core, 7 synthetic-risk, and 1 rich baseline fixture.
Batch 6 remains only a planning candidate when `CRITICAL=0` and
`SYSTEMIC_BLOCKER=false`; Stage 9 remains `In Progress`.
