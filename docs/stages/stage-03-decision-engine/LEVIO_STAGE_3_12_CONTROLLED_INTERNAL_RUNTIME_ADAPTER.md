# LEVIO STAGE 3.12 CONTROLLED INTERNAL RUNTIME ADAPTER

## Document Status

- Stage: 3.12 - Controlled Internal Runtime Adapter.
- Status: completed isolated internal implementation.
- Date: 15 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_3_11_INTERNAL_RUNTIME_INTEGRATION_PLANNING.md`.
- Public product-runtime status: unchanged.
- Next roadmap stage: Stage 3.13 - Simulator Integration Sandbox.

## 1. Purpose

Stage 3.12 implements the controlled internal boundary defined by Stage 3.11.

The adapter connects an internal caller to the completed deterministic pipeline without connecting the public simulator, public API, UI, dashboard, localStorage, persistence, auth, memory, subscriptions, AI providers, or external services.

The implemented internal path is:

```text
Internal adapter request or canonical DecisionInput
->
Controlled Internal Runtime Adapter
->
runSimulationPipeline(...)
->
Validated SimulationResponseV2Draft
->
InternalRuntimeAdapterResult
```

## 2. Files Created

- `lib/decision-engine/internal-runtime-adapter-contracts.ts`
- `lib/decision-engine/internal-runtime-adapter.ts`
- `lib/decision-engine/internal-runtime-adapter-validation.ts`
- `LEVIO_STAGE_3_12_CONTROLLED_INTERNAL_RUNTIME_ADAPTER.md`

## 3. Files Modified

- `lib/decision-engine/index.ts`
- `../../../PROJECT_CONTEXT.md`
- `../../../LEVIO_CURRENT_STATE.md`
- `../../../CURRENT_STAGE.md`

No public runtime, API, simulator, UI, dashboard, localStorage, dependency, or configuration file was modified.

## 4. Adapter Contracts

The adapter introduces:

- `InternalRuntimeAdapterRequest`;
- `InternalCanonicalRuntimeOptions`;
- `InternalRuntimeAdapterResult`;
- `InternalRuntimeIsolationEvidence`;
- adapter validation result and catalog result contracts;
- adapter version `1.0`;
- the only Stage 3.12 runtime mode: `internal_deterministic_v2`.

The result preserves:

- adapter and request identifiers;
- deterministic lifecycle status;
- the validated `SimulationResponseV2Draft`;
- adapter-boundary validation errors;
- explicit evidence that public runtime, public API, persistence, external providers, memory, auth, subscriptions, and raw-content logging were not used.

## 5. Adapter Entry Points

### `runInternalRuntimeAdapter(...)`

This entrypoint:

- validates the internal adapter request;
- validates that the only allowed mode is `internal_deterministic_v2`;
- builds canonical `DecisionInput`;
- passes only explicitly supplied `DecisionContext` and safety information;
- invokes `runSimulationPipeline(...)`;
- preserves missing context rather than inventing semantic structure;
- returns controlled failure for invalid request or mode.

### `runCanonicalInternalRuntime(...)`

This entrypoint:

- validates a canonical `DecisionInput`;
- supports direct deterministic contract validation;
- invokes only `runSimulationPipeline(...)`;
- returns controlled failure for malformed canonical input;
- does not bypass the adapter isolation result envelope.

## 6. Feature Routing

Stage 3.12 implements only:

```text
internal_deterministic_v2
```

Unsupported modes are denied with controlled failure.

The adapter cannot select:

- `public_mock_v1`;
- `simulator_sandbox_v2`;
- `public_deterministic_v2`.

No client-controlled or public feature switch was introduced.

## 7. Input and Error Behavior

- Raw text creates canonical `DecisionInput` without fabricated `DecisionContext`.
- Missing context remains a deterministic gap.
- Explicit structured context is passed through without semantic enrichment.
- Explicit safety boundaries are passed through without inference.
- Malformed adapter request returns controlled `failed`.
- Malformed canonical input returns controlled `failed`.
- Unsupported mode returns controlled `failed`.
- Deterministic pipeline lifecycle and failure semantics remain authoritative.
- No error falls back to public V1 output.

## 8. Deeper Invariant Validation

Stage 3.12 adds internal V2 checks for:

- V2 envelope validity;
- adapter, pipeline, and V2 request-ID consistency;
- scenario references to existing options;
- risk references to existing scenarios;
- preferred recommendation references to existing feasible options;
- no normal recommendation with unresolved critical gaps;
- no normal recommendation in blocked lifecycle or safety states;
- confidence calibration `model_quality_not_probability`;
- risk probability calibration `comparative_not_calibrated`;
- no normal analysis or recommendation with controlled failures;
- V1/V2 response-envelope isolation;
- explicit no-coupling operational evidence.

## 9. Internal Validation Catalog

`runInternalRuntimeAdapterValidation()` executes twelve synthetic cases:

| Case | Observed status |
| --- | --- |
| Raw text only | `clarification_required` |
| Complete structured context | `limited_analysis` |
| Partial structured context | `limited_analysis` |
| Missing primary goal | `clarification_required` |
| Explicit contradiction | `clarification_required` |
| Elevated safety with incomplete context | `clarification_required` |
| Restricted safety | `cannot_recommend` |
| Malformed adapter request | `failed` |
| Malformed canonical input | `failed` |
| Unsupported runtime mode | `failed` |
| Repeated deterministic invocation | `limited_analysis` |
| V1/V2 contract isolation | `limited_analysis` |

Execution result:

- total cases: `12`;
- passed cases: `12`;
- failed cases: `0`;
- uncaught expected-case exceptions: `0`.

The existing Stage 3.10 deterministic runtime catalog was also re-executed:

- total cases: `10`;
- passed cases: `10`;
- failed cases: `0`.

## 10. Validation Performed

- `./node_modules/.bin/tsc --noEmit`: passed.
- Stage 3.12 adapter validation catalog: passed `12/12`.
- Stage 3.10 deterministic runtime validation catalog: passed `10/10`.
- `git diff --check`: passed.
- Static internal-adapter isolation scan: no public API, UI, simulator, localStorage, provider, network, or environment coupling detected.

The validation catalogs were executed from a temporary CommonJS compilation in `/private/tmp`; no generated validation artifact was added to the repository.

## 11. Architecture Compliance

Stage 3.12 introduces:

- controlled internal deterministic invocation: yes;
- adapter contracts and validation: yes;
- deeper internal invariants: yes;
- internal feature-mode denial: yes;
- public runtime coupling: no;
- public API change: no;
- simulator behavior change: no;
- UI or dashboard change: no;
- localStorage or persistence use: no;
- memory runtime use: no;
- auth runtime use: no;
- subscription use: no;
- AI or external provider use: no;
- dependency change: no;
- Stage 3.13 sandbox work: no.

## 12. Known Boundaries

- The adapter does not semantically parse raw text.
- The adapter does not infer `DecisionContext`.
- The adapter does not infer safety.
- Complete structured cases still conservatively resolve to `limited_analysis`.
- The executable catalog remains an internal validation function, not a formal test framework or CI gate.
- Public V1 behavior remains the active product path.

## 13. Stage 3.12 Conclusion

Stage 3.12 is complete for its isolated internal scope.

The controlled adapter can invoke the deterministic brain and preserve V2 lifecycle, failures, deeper invariants, and explicit isolation evidence without touching public product behavior.

Stage 3.13 - Simulator Integration Sandbox is the next roadmap stage, but it has not started and is not implemented by Stage 3.12.
