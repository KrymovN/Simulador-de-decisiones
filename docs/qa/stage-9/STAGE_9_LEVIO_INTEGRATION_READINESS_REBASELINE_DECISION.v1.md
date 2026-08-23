# Stage 9 Levio Integration Readiness Rebaseline Decision v1

- Decision ID: `stage-9-levio-integration-readiness-rebaseline.1`
- Status: `OWNER_APPROVED_CANONICAL_DECISION`
- Selected provider: `openai / gpt-5.6-terra`
- Projection version: `canonical-levio-integration-readiness.1`

## 1. Rebased terminal question

`Is Levio integration-ready with the selected real provider under the frozen product architecture and safety/privacy/cost boundaries?`

Stage 9 no longer treats absolute semantic qualification of the selected
foundation model as its terminal product question. Provider semantic quality
remains observable diagnostic evidence. Levio integration behavior is the
product-gating subject.

## 2. Historical provider evidence

All Position 1–4 executions, matcher results, Human Reviews, accepted
projections, failure evidence, hashes and frozen aggregation inputs remain
immutable historical evidence. `canonical-provider-evaluation-aggregation.3`
continues to reproduce the historical provider result, including
`QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD`.

That result is not renamed, weakened or converted to `PASS`. Under this
decision it is retained as `PROVIDER_QUALITY_DIAGNOSTIC` and is no longer, by
itself, a Levio integration-readiness blocker.

## 3. Provider campaign disposition

The canonical disposition is:

`STOPPED_BY_OWNER_REBASELINE_EVIDENCE_RETAINED`

Position 5 and every later provider-qualification position are
`NOT_AUTHORIZED_OWNER_REBASELINE`. The campaign must not continue solely to
improve a provider semantic score. Existing candidate content remains governed
by the existing retention and access policy; this decision does not delete or
rewrite it.

## 4. Human Review disposition

Position 4 retains its historical `REVIEW_REQUIRED` status and zero Human
Review records. Existing ES/EN/RU Human Reviews remain historical evidence.
Position 4 ZH Human Review, a Chinese presentation and Chinese binary-token
mapping are not prerequisites for current Levio-owned remediation. No prior
review result is reclassified.

## 5. Gate classification

| Gate or result | Rebaseline category | Required current effect | Canonical source |
| --- | --- | --- | --- |
| hidden matcher and provider semantic score | `PROVIDER_QUALITY_DIAGNOSTIC` | retained, non-blocking by itself | `canonical-provider-evaluation-aggregation.ts` metrics and `exactMatcherDiagnostics` |
| multilingual semantic metrics | `PROVIDER_QUALITY_DIAGNOSTIC` | retained, non-blocking by itself | `CANONICAL_MULTILINGUAL_METRIC_MAPPINGS` |
| Human Review provider-quality scores | `PROVIDER_QUALITY_DIAGNOSTIC` | retained, not required for current remediation | `canonical-provider-review-policy.ts` |
| provider privacy review | `PROVIDER_QUALITY_DIAGNOSTIC` | retained as provider-quality evidence; it cannot replace Levio privacy enforcement | `canonical-provider-review-policy.ts` |
| `PROVIDER_QUALIFICATION_IMPOSSIBLE` | `PROVIDER_QUALITY_DIAGNOSTIC` | historical diagnostic blocker only; excluded from current integration readiness | `canonical-provider-evaluation-aggregation.ts` historical `overallStage9` |
| provider result contract validation | `LEVIO_INTEGRATION_GATE` | malformed/incomplete output must still be rejected | `provider_result_contract` and `structured_output_rejection` |
| candidate contract, safety and grounding | `LEVIO_INTEGRATION_GATE` | unacceptable material must not reach product output | evaluation validation plus `final_safety_enforcement` and `grounding_reference_validation` |
| oracle isolation | `LEVIO_INTEGRATION_GATE` | hidden oracle must remain outside provider requests/results | `oracle_isolation` |
| cost, token and runtime limits | `LEVIO_INTEGRATION_GATE` | limits and normalized evidence remain enforced | `approved_cost_budget` and `cost_record_enforcement` |
| all Levio guarantee definitions | `LEVIO_INTEGRATION_GATE` | every non-`PASS` Levio guarantee prevents integration readiness | `CANONICAL_LEVIO_GUARANTEE_DEFINITIONS` |

Provider imperfections are allowed input conditions only when the Levio-owned
contract, validation, grounding, safety, privacy, failure, cost and runtime
boundaries handle them deterministically. This decision does not weaken any
per-execution acceptance or fail-closed rule.

## 6. Minimal status projection

The historical aggregation remains unchanged. Current product readiness is the
separate `canonical-levio-integration-readiness.1` projection:

- evidence-integrity issues: `SYSTEM_EVIDENCE_INCOMPLETE`;
- any Levio guarantee `FAIL`: `STAGE9_BLOCKED`;
- any Levio guarantee `LEVIO_IMPLEMENTATION_GAP` or `REVIEW_REQUIRED`:
  `STAGE9_INCOMPLETE`;
- all Levio guarantees `PASS`: `STAGE9_QUALIFIED`.

Provider qualification, matcher results, multilingual metrics and provider
Human Review scores are copied into diagnostic history and do not decide this
projection.

## 7. Current Levio-owned blockers and order

All other currently supplied Levio guarantees are `PASS`. The remaining
integration-readiness blockers are:

1. `minimum_necessary_prompt_context` — prove minimum-necessary Prompt Context
   selection before provider invocation. Closure evidence must demonstrate the
   deterministic selection/filtering boundary without relying on provider
   behavior.
2. `controlled_failure_product_presentation` — prove a controlled public V2
   failure state when real provider execution is active. Closure evidence must
   demonstrate fail-closed product composition, a bounded human-readable
   failure and no mock-as-real presentation.
3. Recompute `canonical-levio-integration-readiness.1` and rerun the existing
   contract, safety, grounding, privacy, oracle, cost/token/runtime and
   integration regressions. No provider qualification continuation is part of
   this step.

This decision authorizes only Levio-owned remediation work. It does not
implement either gap, open production/runtime boundaries, execute a provider,
or declare release readiness.
