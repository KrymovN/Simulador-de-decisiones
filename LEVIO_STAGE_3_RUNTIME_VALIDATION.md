# LEVIO STAGE 3 RUNTIME VALIDATION

## 1. Purpose

This document records the Stage 3.10 internal validation boundary for the deterministic Decision Engine runtime.

The validation catalog checks that the isolated end-to-end pipeline preserves lifecycle, safety, confidence, traceability, and controlled-failure invariants before any provider or product-runtime integration.

## 2. Scope

Stage 3.10 validates:

- `runSimulationPipeline(...)`;
- deterministic Decision Engine gates;
- `SimulationResponseV2Draft` mapping;
- lightweight V2 draft validation;
- lifecycle invariants;
- controlled failure propagation;
- trace and confidence preservation.

It does not connect the internal pipeline to UI, API routes, simulator runtime, dashboard, persistence, auth, subscriptions, memory, AI providers, or external services.

## 3. Internal Cases

The internal catalog contains ten synthetic cases:

| Case | Expected behavior |
| --- | --- |
| Complete input | Useful successful analysis with scenarios and risks |
| Partial input | Limited analysis with explicit important gaps |
| Missing goal | Clarification required; no normal analysis or recommendation |
| Contradiction | Clarification required; contradiction remains visible |
| Safety gap | Clarification or withholding behavior preserves the safety gap |
| Scenario generation allowed | Structured scenarios and trace are available |
| Scenario generation blocked | Critical gaps block scenarios |
| Risk coverage | Every generated scenario receives a structured risk assessment |
| Recommendation withheld | Restricted safety prevents normal recommendation |
| Validation failure | Malformed input returns controlled failure without an uncaught exception |

All case data is synthetic and contains no real user personal data.

## 4. Validation Rules

Every case checks:

1. The lifecycle status is supported.
2. `validateSimulationResponseV2DraftShape(...)` accepts the response.
3. Orchestrator and response-mapping trace exist where applicable.
4. Confidence remains marked `model_quality_not_probability`.
5. Blocked states do not fabricate normal recommendations.
6. `refused`, `failed`, and `clarification_required` do not contain normal analysis.
7. `cannot_recommend` contains no recommendation or only withheld recommendation behavior.
8. Case-specific gaps, availability, scenarios, risks, or failures match deterministic engine rules.

## 5. Validation Output

`runDecisionEngineRuntimeValidation()` returns:

- overall `passed` and `failed` flags;
- per-case identifiers, titles, expected behavior, actual status, and issues;
- total, passed, and failed counts.

Expected failure cases are represented as controlled pipeline results. The validation function catches unexpected case exceptions and reports them as failed validation cases.

## 6. Known Limits

- This validation is an internal executable catalog, not a formal automated test suite.
- It does not prove strategic usefulness, semantic quality, native-language quality, or real-world outcome accuracy.
- It does not replace the Evaluation Dataset, future unit/contract/integration tests, security testing, or human review.
- It does not validate UI rendering, API transport, persistence, authentication, subscriptions, memory, or provider adapters.
- It does not calibrate scenario probability or recommendation success probability.

## 7. Not AI Evaluation

Stage 3.10 does not evaluate AI output because no AI provider, model, prompt, SDK, or external service is connected.

The catalog validates deterministic contracts and invariants only. Future AI evaluation remains governed by `LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md`.

## 8. Not Public Product Testing

The runtime validation module is not connected to public product behavior. It does not execute through the current simulator, UI, dashboard, or API routes.

The current public `SimulationResponse` and simulator runtime remain unchanged.

## 9. Relation to Future Automated Tests

The Stage 3.10 catalog provides an initial source for future unit, contract, and integration tests described in `LEVIO_TESTING_STRATEGY.md`.

Before production integration, approved automated tests should convert these cases into stable fixtures, add negative reference validation, cover all lifecycle states, and run through an approved test runner and release gate.

## 10. Stage 3.10 Conclusion

Stage 3.10 establishes internal deterministic runtime validation without introducing a test framework, CI/CD, dependencies, or product integration.

The Stage 3.10 execution result is:

- total cases: `10`;
- passed cases: `10`;
- failed cases: `0`;
- uncaught expected-case exceptions: `0`.

Observed lifecycle results:

- complete, scenario-allowed, and risk-coverage cases: `limited_analysis`, with scenarios and risks available;
- partial input: `limited_analysis`;
- missing goal, contradiction, safety gap, and scenario-blocked cases: `clarification_required`;
- restricted-safety recommendation case: `cannot_recommend`;
- malformed input: controlled `failed`.

AI, memory runtime, auth, database, persistence, subscriptions, UI, API routes, dashboard, simulator runtime, and public behavior remain unchanged.
