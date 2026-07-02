# LEVIO STAGE 3.13 SIMULATOR INTEGRATION SANDBOX

## Document Status

- Stage: 3.13 - Simulator Integration Sandbox.
- Status: completed isolated internal implementation.
- Date: 15 June 2026, Europe/Madrid.
- Depends on: Stage 3.12 Controlled Internal Runtime Adapter.
- Public simulator status: unchanged.
- Next roadmap stage: Stage 3.14 - SimulationResponse V2 UI Mapping.

## 1. Purpose

Stage 3.13 creates an internal simulator-shaped execution path that invokes the deterministic brain through the Stage 3.12 Controlled Internal Runtime Adapter.

The sandbox is code-only. It does not create a route, page, public endpoint, navigation link, UI surface, or public runtime switch.

The implemented path is:

```text
Internal simulator-shaped sandbox request
->
Explicit simulator_sandbox_v2 feature gate
->
Controlled Internal Runtime Adapter
->
runSimulationPipeline(...)
->
SimulationResponseV2Draft
->
SimulatorSandboxResult
```

## 2. Files Created

- `lib/decision-engine/simulator-integration-sandbox-contracts.ts`
- `lib/decision-engine/simulator-integration-sandbox.ts`
- `lib/decision-engine/simulator-integration-sandbox-validation.ts`
- `LEVIO_STAGE_3_13_SIMULATOR_INTEGRATION_SANDBOX.md`

## 3. Files Modified

- `lib/decision-engine/index.ts`
- `../../../PROJECT_CONTEXT.md`
- `../../../LEVIO_CURRENT_STATE.md`
- `../../../CURRENT_STAGE.md`

No file under `app/`, `components/`, or the current public simulator runtime was modified.

## 4. Sandbox Contracts

Stage 3.13 introduces:

- sandbox version `1.0`;
- sandbox-only runtime mode `simulator_sandbox_v2`;
- `SimulatorSandboxFeatureFlags`;
- `SimulatorSandboxRequest`;
- `SimulatorSandboxResult`;
- `SimulatorSandboxStatus`;
- sandbox smoke-validation result contracts.

The sandbox request uses a simulator-shaped boundary:

- `input`;
- `lang`;
- optional requested output language and user intent;
- optional explicitly supplied structured context;
- optional explicitly supplied safety boundary.

It does not semantically parse raw simulator input or infer missing context.

## 5. Feature Flag Isolation

The sandbox requires:

```ts
{ simulatorSandboxV2: true }
```

Isolation behavior:

- the feature flag is deny-by-default;
- disabled flag returns sandbox status `disabled`;
- malformed request or non-sandbox mode returns sandbox status `rejected`;
- disabled or rejected requests do not execute the adapter;
- disabled or rejected requests do not execute the deterministic brain;
- disabled or rejected requests do not generate V2;
- only a valid enabled sandbox request may invoke the Stage 3.12 adapter;
- no environment variable, public client flag, route parameter, auth state, subscription, or persistence state controls the sandbox.

The sandbox cannot select public runtime modes.

## 6. Adapter and V2 Execution

For an enabled valid request, `runSimulatorIntegrationSandbox(...)`:

1. validates the internal sandbox feature flag;
2. validates the simulator-shaped sandbox request;
3. maps the request to `InternalRuntimeAdapterRequest`;
4. invokes `runInternalRuntimeAdapter(...)`;
5. preserves the adapter lifecycle status;
6. returns the generated `SimulationResponseV2Draft`;
7. exposes explicit sandbox and public-isolation evidence.

The sandbox never calls `runSimulationPipeline(...)` or individual deterministic brain stages directly.

## 7. Isolation Evidence

Every sandbox result exposes fixed internal evidence:

- `sandboxOnly: true`;
- `publicRouteExposed: false`;
- `publicNavigationExposed: false`;
- `publicRuntimeTouched: false`;
- `publicApiTouched: false`;
- `persistenceUsed: false`;
- `externalProviderUsed: false`;
- `memoryUsed: false`;
- `authUsed: false`;
- `subscriptionUsed: false`;
- `rawContentLogged: false`.

The sandbox response remains V2-only and cannot expose the public V1 `SimulationResponse` envelope.

## 8. Smoke and Isolation Validation

`runSimulatorIntegrationSandboxValidation()` executes nine synthetic cases:

| Case | Observed sandbox status |
| --- | --- |
| Feature flag disabled | `disabled` |
| Feature flag enabled | `limited_analysis` |
| Raw simulator-shaped input | `clarification_required` |
| End-to-end structured analysis | `limited_analysis` |
| Restricted safety | `cannot_recommend` |
| Malformed request | `rejected` |
| Invalid runtime mode | `rejected` |
| Repeated deterministic execution | `limited_analysis` |
| Public runtime isolation | `limited_analysis` |

Execution result:

- total Stage 3.13 cases: `9`;
- passed cases: `9`;
- failed cases: `0`;
- uncaught expected-case exceptions: `0`.

Regression results:

- Stage 3.12 adapter validation: `12/12` passed;
- Stage 3.10 deterministic runtime validation: `10/10` passed.

## 9. Validation Performed

- `./node_modules/.bin/tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings or errors.
- Stage 3.13 sandbox validation: passed `9/9`.
- Stage 3.12 adapter regression validation: passed `12/12`.
- Stage 3.10 deterministic regression validation: passed `10/10`.
- Malformed sandbox-result validator safety: passed.
- `git diff --check`: passed.
- Static sandbox isolation scan: no public API, UI, simulator, localStorage, provider, network, or environment coupling detected.
- Public protected-file diff check: no changes under `app/`, `components/`, `lib/simulationEngine.ts`, dependency files, or configuration files.

The executable catalogs were run from a temporary CommonJS compilation in `/private/tmp`; no generated artifact was added to the repository.

## 10. Architecture Compliance

Stage 3.13 introduces:

- internal simulator-shaped sandbox request: yes;
- feature-gated sandbox execution: yes;
- adapter execution from sandbox: yes;
- end-to-end deterministic brain execution: yes;
- sandbox V2 generation: yes;
- internal smoke and isolation validation: yes;
- public route or endpoint: no;
- public simulator behavior change: no;
- homepage, dashboard, or UI change: no;
- public API behavior change: no;
- V2 UI mapping: no;
- persistence, auth, memory, or subscriptions: no;
- AI or external provider integration: no;
- dependency or configuration change: no;
- Stage 3.14 implementation: no.

## 11. Known Boundaries

- The sandbox is callable only as an internal code module.
- The sandbox has no UI or route.
- Raw input without structured context correctly resolves to clarification behavior.
- Complete structured cases still conservatively resolve to `limited_analysis`.
- The feature flag is an internal function argument, not a production feature-flag service.
- The smoke catalog is an internal executable validation function, not a formal test framework or CI gate.

## 12. Stage 3.13 Conclusion

Stage 3.13 is complete for its isolated internal scope.

The simulator-shaped sandbox can execute the deterministic brain end to end through the Controlled Internal Runtime Adapter and generate `SimulationResponseV2Draft` while remaining fully isolated from public behavior.

Stage 3.14 - SimulationResponse V2 UI Mapping is the next roadmap stage, but it has not started and is not implemented by Stage 3.13.
