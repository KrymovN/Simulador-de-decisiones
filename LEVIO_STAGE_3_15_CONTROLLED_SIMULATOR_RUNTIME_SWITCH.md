# LEVIO STAGE 3.15 CONTROLLED SIMULATOR RUNTIME SWITCH

## Document Status

- Stage: 3.15 - Controlled Simulator Runtime Switch.
- Status: completed controlled internal-dev implementation.
- Date: 15 June 2026, Europe/Madrid.
- Depends on: Stage 3.13 Simulator Integration Sandbox and Stage 3.14 SimulationResponse V2 UI Mapping.
- Public simulator status: unchanged and V1/mock-only.
- Next roadmap stage: Stage 3.16 - Runtime QA / Regression.

## 1. Purpose

Stage 3.15 creates a reversible controlled switch boundary between the existing simulator-shaped V1 mock path and the internal deterministic V2 path.

The implementation is internal/dev-only. It does not modify `/api/simulate`, `HomeSimulator`, the public response contract, public UI rendering, dashboard behavior, or localStorage.

The controlled paths are:

```text
Default or ungated request
->
Existing buildMockSimulation(...)
->
SimulationResponse V1
```

```text
Explicit internal-dev gate + explicit sandbox gate
->
Stage 3.13 Simulator Sandbox
->
Stage 3.12 Internal Runtime Adapter
->
Deterministic Brain
->
SimulationResponseV2Draft
->
Stage 3.14 UI Mapping
->
Controlled internal V2 result
```

## 2. Files Created

- `lib/runtime-integration/controlled-simulator-runtime-switch-contracts.ts`
- `lib/runtime-integration/controlled-simulator-runtime-switch.ts`
- `lib/runtime-integration/controlled-simulator-runtime-switch-validation.ts`
- `lib/runtime-integration/index.ts`
- `LEVIO_STAGE_3_15_CONTROLLED_SIMULATOR_RUNTIME_SWITCH.md`

## 3. Files Modified

- `PROJECT_CONTEXT.md`
- `LEVIO_CURRENT_STATE.md`
- `CURRENT_STAGE.md`

No file under `app/`, `components/`, the public simulator runtime, public API, localStorage, dependency files, or configuration files was modified.

## 4. Switch Boundary

`runControlledSimulatorRuntimeSwitch(...)` accepts:

- a controlled simulator-shaped request;
- explicit internal-dev execution context;
- explicit feature flags supplied by a trusted internal caller.

It returns exactly one discriminated result:

- `public_mock_v1` with the existing `SimulationResponse`;
- `controlled_internal_v2` with `SimulationResponseV2Draft`, sandbox evidence, and `SimulationResponseV2UiModel`;
- `controlled_failure` without a V1 or V2 response.

V1 and V2 fields never share one ambiguous response envelope.

## 5. Deny-by-Default Gates

V2 execution requires both:

```ts
{
  controlledInternalDevV2: true,
  simulatorSandboxV2: true
}
```

Rules:

- absent flags select the existing V1 mock path;
- partial flags select the existing V1 mock path;
- invalid or non-internal execution context returns controlled failure;
- request data cannot select a public deterministic mode;
- no environment variable, route parameter, client state, auth state, subscription, memory, or persistence state selects V2;
- public users are not eligible for the controlled V2 path.

## 6. V1 Preservation and Rollback

The existing `buildMockSimulation(...)` path remains unchanged and immediately available.

The switch imports and calls that existing function only from the new integration boundary. It does not modify the V1 implementation, response shape, public API response, UI consumer, or localStorage contract.

Rollback behavior is immediate: remove or disable either internal gate and the switch selects `public_mock_v1`.

## 7. Failure and Fallback Policy

Fallback is explicit, never silent.

When fallback is enabled:

- sandbox rejection or execution failure returns V1 with an explicit fallback reason;
- deterministic `failed` returns V1 with reason `deterministic_failed` and source status;
- UI mapping failure returns V1 with reason `ui_mapping_failed` and source status.

When fallback is explicitly disabled:

- the same failures return `controlled_failure`;
- no V1 or V2 response is fabricated;
- failure code, message, retryability, and source status remain visible.

The default V1 path is not labeled as a runtime fallback. It is the deny-by-default selected path.

## 8. V1 and V2 Separation

- V1 result contract: `SimulationResponse`.
- V2 result contract: `SimulationResponseV2Draft` plus `SimulationResponseV2UiModel`.
- Controlled failure contract: no response.
- V2 is never converted into V1.
- V1 is never labeled as deterministic analysis.
- A fallback result records that fallback occurred and why.
- No V2 result is returned through the public API or persisted.

## 9. Isolation Evidence

Every result exposes fixed evidence for:

- deny-by-default routing;
- explicit internal-dev gate requirement;
- public user ineligibility;
- unchanged public API contract;
- unchanged public UI;
- no V1/V2 envelope mixing;
- whether sandbox and UI mapping were used;
- no persistence, external provider, memory, auth, or subscription use.

## 10. Internal Validation Catalog

`runControlledSimulatorSwitchValidation()` executes ten controlled-switch cases:

| Case | Observed selected path |
| --- | --- |
| Gates absent | `public_mock_v1` |
| Sandbox gate absent | `public_mock_v1` |
| Raw internal-dev V2 | `controlled_internal_v2` |
| Structured internal-dev V2 | `controlled_internal_v2` |
| Malformed switch request | `controlled_failure` |
| Invalid internal mode | `controlled_failure` |
| Deterministic failure with fallback | `public_mock_v1` |
| Deterministic failure without fallback | `controlled_failure` |
| Strict V1/V2 boundary | `controlled_internal_v2` |
| Public isolation | `public_mock_v1` |

Execution result:

- total Stage 3.15 cases: `10`;
- passed cases: `10`;
- failed cases: `0`;
- uncaught expected-case exceptions: `0`.

Regression results:

- Stage 3.14 UI mapping validation: `10/10` passed;
- Stage 3.13 sandbox validation: `9/9` passed;
- Stage 3.12 adapter validation: `12/12` passed;
- Stage 3.10 deterministic runtime validation: `10/10` passed.

## 11. Validation Performed

- `./node_modules/.bin/tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings or errors.
- Stage 3.15 controlled switch validation: passed `10/10`.
- Stage 3.14 mapping regression validation: passed `10/10`.
- Stage 3.13 sandbox regression validation: passed `9/9`.
- Stage 3.12 adapter regression validation: passed `12/12`.
- Stage 3.10 deterministic regression validation: passed `10/10`.
- `git diff --check`: passed.
- Static switch isolation scan: no route, component, public API, localStorage, provider, network, environment, auth, memory, persistence, or subscription coupling detected.
- Public protected-file diff check: no changes under `app/`, `components/`, `lib/simulationEngine.ts`, dependency files, or configuration files.

The executable catalogs were run from a temporary CommonJS compilation in `/private/tmp`; no generated artifact was added to the repository.

## 12. Architecture Compliance

Stage 3.15 introduces:

- controlled runtime switch boundary: yes;
- deny-by-default feature gates: yes;
- internal-dev-only V2 selection: yes;
- Stage 3.13 sandbox use: yes;
- Stage 3.12 adapter and deterministic brain use through sandbox: yes;
- Stage 3.14 UI mapping use: yes;
- existing V1 path preservation: yes;
- explicit safe fallback or controlled failure: yes;
- full public simulator replacement: no;
- public API contract change: no;
- public UI, homepage, or dashboard change: no;
- persistence, auth, memory, or subscriptions: no;
- AI or external provider integration: no;
- dependency or configuration change: no;
- Stage 3.16 implementation: no.

## 13. Known Boundaries

- The switch is an internal code module with no public route or public consumer.
- The public simulator continues to call `/api/simulate` and receive V1 mock output.
- The controlled switch does not define production feature-flag infrastructure.
- The controlled switch does not authorize public deterministic V2 exposure.
- Full browser, mobile, accessibility, public-path, and rollback QA belongs to Stage 3.16.

## 14. Stage 3.15 Conclusion

Stage 3.15 is complete for its controlled internal-dev scope.

The controlled switch can select the full sandbox, adapter, deterministic brain, V2, and UI mapping chain only behind explicit trusted gates, while preserving the existing V1 path as the deny-by-default behavior and immediate rollback path.

Stage 3.16 - Runtime QA / Regression is the next roadmap stage, but it has not started and is not implemented by Stage 3.15.
