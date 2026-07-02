# LEVIO STAGE 3.11 INTERNAL RUNTIME INTEGRATION PLANNING

## Document Status

- Stage: 3.11 - Internal Runtime Integration Planning.
- Status: completed planning and contract boundary.
- Date: 15 June 2026, Europe/Madrid.
- Depends on: completed Stage 3.1-3.10 deterministic brain and the Stage 3 Final Deterministic Brain Audit.
- Next approved stage: Stage 3.12 - Controlled Internal Runtime Adapter.
- Product-runtime status: unchanged.

## 1. Purpose

Stage 3.11 defines the controlled path from the isolated deterministic brain toward future simulator integration.

The current public simulator and deterministic runtime have materially different boundaries:

- the public simulator accepts free-form text and returns the current mock `SimulationResponse`;
- the deterministic brain accepts canonical `DecisionInput`, optional structured `DecisionContext`, and explicit safety information;
- the deterministic brain does not semantically parse raw text, invent structured context, or infer a safety domain;
- internal `SimulationResponseV2Draft` supports clarification, limited analysis, withheld recommendation, refusal, and controlled failure;
- the current public UI and API assume a successful mock V1 simulation shape.

Direct replacement would violate the approved architecture. Integration must proceed through isolated, reversible stages.

## 2. Confirmed Runtime Boundaries

### 2.1 Current Public Path

```text
HomeSimulator
->
POST /api/simulate
->
buildMockSimulation(input)
->
current SimulationResponse
->
current simulator UI and localStorage demo save
```

Binding rules:

- `/api/simulate` remains mock-only until Stage 3.15 is explicitly approved and completed.
- `HomeSimulator` remains unchanged through Stage 3.11-3.14.
- The current `SimulationResponse` remains the only public response contract through Stage 3.11-3.14.
- The current localStorage save contract remains V1/mock-only.
- Public failures must not silently fall through to an internal V2 response.

### 2.2 Isolated Deterministic Path

```text
DecisionInput + optional DecisionContext + explicit safety boundary
->
runSimulationPipeline(...)
->
validated SimulationResponseV2Draft
```

Binding rules:

- `runSimulationPipeline(...)` remains the sole deterministic pipeline entrypoint.
- Integration code must not call individual brain stages directly.
- The runtime remains provider-independent and AI-free.
- Missing structured context must remain visible as missing context.
- The runtime must not infer a safety domain.

## 3. Approved Internal Integration Shape

```text
Internal caller
->
Controlled Internal Runtime Adapter
->
Canonical DecisionInput construction
->
Optional explicitly supplied DecisionContext and SafetyBoundary
->
runSimulationPipeline(...)
->
Validated InternalRuntimeAdapterResult
->
Internal sandbox or fixture consumer only
```

The adapter is a boundary component, not a semantic reasoning engine.

It may:

- normalize and validate adapter-level request metadata;
- construct canonical `DecisionInput`;
- accept already structured `DecisionContext` from controlled internal callers;
- accept explicit `SafetyBoundary` and `safetyContextComplete`;
- invoke `runSimulationPipeline(...)`;
- preserve V2 lifecycle and controlled failures;
- expose minimum content-free operational metadata.

It must not:

- parse free-form text into fabricated structured context;
- infer goals, options, constraints, facts, safety domains, or user preferences;
- call AI or any external provider;
- read memory, auth, database, persistence, subscription, or localStorage state;
- call or modify `/api/simulate`;
- return V2 through the public simulator route;
- map V2 into the current `SimulationResponse`;
- create a hidden V1 fallback after deterministic failure;
- persist internal requests or responses;
- log raw decision content.

## 4. Planned Adapter Contracts

Stage 3.12 should introduce provider-independent contracts equivalent to:

```ts
type InternalRuntimeAdapterRequest = {
  adapterVersion: "1.0";
  requestId: string;
  originalText: string;
  inputLanguage: string;
  requestedOutputLanguage: string;
  userIntent: "explore" | "compare" | "recommend" | "review";
  context?: DecisionContext;
  safety?: SafetyBoundary;
  safetyContextComplete?: boolean;
};
```

```ts
type InternalRuntimeAdapterResult = {
  adapterVersion: "1.0";
  requestId: string;
  mode: "internal_deterministic_v2";
  status: DecisionEngineStatus;
  response: SimulationResponseV2Draft;
  adapterValidation: {
    valid: boolean;
    errors: string[];
  };
  operational: {
    publicRuntimeTouched: false;
    persistenceUsed: false;
    externalProviderUsed: false;
    rawContentLogged: false;
  };
};
```

Final names and file placement may be refined in Stage 3.12. These invariants are binding:

- the request is not a public API request;
- the result is not the current public `SimulationResponse`;
- the result preserves deterministic lifecycle status;
- every result proves that public runtime, persistence, and external providers were not used;
- malformed adapter input returns controlled failure rather than an uncaught exception.

## 5. Input Mapping Rules

### 5.1 Raw Text Only

When only raw text and language metadata are supplied:

- construct a valid `DecisionInput`;
- do not create a `DecisionContext`;
- do not infer safety;
- run the deterministic pipeline honestly;
- preserve clarification, withholding, or limited lifecycle behavior caused by insufficient context.

Raw-text-only behavior validates the boundary. It is not evidence that Levio can semantically analyze arbitrary public simulator input.

### 5.2 Structured Internal Input

Structured context may be supplied only by:

- synthetic fixtures;
- deterministic contract validation;
- the controlled internal sandbox;
- a future separately approved semantic extraction stage.

The adapter must preserve provenance and unknown values. It must not upgrade incomplete or unverified data into known facts.

### 5.3 Safety Input

- Safety input must be explicit.
- No supplied safety boundary means only that the existing deterministic general default applies.
- The general default is not proof that a request is safe.
- High-stakes internal cases must supply explicit safety.
- Missing high-stakes safety context must remain a visible gap.

## 6. V1 and V2 Coexistence

| Concern | Current V1 mock path | Internal V2 path |
| --- | --- | --- |
| Consumer | Public simulator UI | Internal adapter, sandbox, fixtures |
| Entry point | `/api/simulate` | Controlled internal adapter |
| Response | `SimulationResponse` | `SimulationResponseV2Draft` |
| Persistence | Current localStorage demo save | None |
| Failure behavior | Existing public behavior | V2 controlled lifecycle and failure |
| Public availability | Active | Forbidden until controlled switch |

Coexistence invariants:

- V1 and V2 must never share an ambiguous response envelope.
- A consumer must know the contract before reading the result.
- V2 must not be coerced into V1 to satisfy the existing UI.
- V1 mock output must not be labeled as deterministic V2 output.
- V1 fallback must not hide an internal V2 failure.
- V2 storage is forbidden until a separately approved persistence stage.

## 7. Feature Flag and Isolation Plan

Conceptual runtime modes:

```text
public_mock_v1
internal_deterministic_v2
simulator_sandbox_v2
public_deterministic_v2
```

Rules:

- Stage 3.12 supports only `internal_deterministic_v2`.
- Stage 3.13 may add only `simulator_sandbox_v2`.
- `public_mock_v1` remains the public default through Stage 3.14.
- `public_deterministic_v2` is forbidden until Stage 3.15 approval and all prior gates pass.
- No mode may be selected from untrusted client input.
- Unknown or invalid public mode resolves to `public_mock_v1`; unknown internal mode returns controlled failure.
- The switch must not depend on auth, subscription, memory, or persistence.

## 8. Error Mapping

| Boundary failure | Required internal behavior |
| --- | --- |
| Adapter request invalid | Controlled `validation_failure` |
| Canonical `DecisionInput` invalid | Preserve deterministic `failed` response |
| Structured context absent | Preserve deterministic gap and lifecycle behavior |
| Explicit safety blocks analysis | Preserve `cannot_recommend` or `refused` |
| Deterministic pipeline throws | Preserve controlled `internal_error` |
| V2 draft validation fails | Preserve controlled validation failure |
| Unknown runtime mode | Deny internal execution with controlled failure |

No failure may call the public mock path as a hidden replacement, return successful V1 output, persist partial output, or expose raw stack traces or content.

## 9. Observability and Privacy

Stage 3.12 may expose only in-memory or caller-returned operational metadata required for deterministic validation.

Allowed:

- opaque request identifier;
- adapter and contract version;
- runtime mode and lifecycle status;
- adapter validation result;
- controlled failure code;
- flags proving that public runtime, persistence, raw-content logging, and external providers were not used.

Forbidden:

- raw decision text or clarification answers in logs;
- full V2 payload logging;
- auth, session, owner, entitlement, localStorage, or memory data;
- hidden reasoning;
- external-provider data.

Stage 3.11 does not approve an observability backend, durable logs, analytics, or tracing service.

## 10. Contract Validation and Deeper Invariants

Stage 3.12 must add focused deterministic adapter validation.

Minimum cases:

1. Raw-text-only request preserves missing-context behavior.
2. Complete structured context reaches useful deterministic analysis.
3. Partial structured context remains limited.
4. Missing primary goal requires clarification.
5. Explicit contradiction remains visible.
6. Elevated safety with incomplete context creates a safety gap.
7. Restricted safety withholds normal recommendation.
8. Malformed adapter request returns controlled failure.
9. Malformed canonical input returns controlled failure.
10. Identical input and options produce identical deterministic output.
11. V1 and V2 shapes cannot be confused.
12. No public route, UI, localStorage, persistence, auth, memory, subscription, or external provider is touched.

Required deeper invariants before Stage 3.13:

- scenario option IDs exist;
- risk scenario IDs exist;
- preferred recommendation option IDs exist and are eligible;
- critical unresolved gaps cannot coexist with normal recommendation;
- restricted, refused, and failed states cannot expose normal recommendation;
- confidence calibration remains `model_quality_not_probability`;
- comparative risk probability remains `comparative_not_calibrated`;
- request IDs remain consistent across adapter, pipeline, and V2 draft;
- controlled failures never contain normal analysis;
- all internal cases pass without uncaught exceptions.

## 11. Approved Staged Roadmap

### Stage 3.12 - Controlled Internal Runtime Adapter

Implement only the isolated adapter, its validators, synthetic cases, deeper invariants, and documentation.

Forbidden:

- public API, UI, simulator, dashboard, or localStorage changes;
- AI, memory, auth, persistence, subscriptions, or external services;
- public runtime switch.

### Stage 3.13 - Simulator Integration Sandbox

Create an isolated, non-public sandbox consumer for the adapter using synthetic data only. It must not modify `/api/simulate`, replace V1, or appear in production navigation.

### Stage 3.14 - SimulationResponse V2 UI Mapping

Define and implement V2-specific presentation in isolation. It must render all lifecycle states, preserve confidence/completeness distinction, and avoid V2-to-V1 coercion.

### Stage 3.15 - Controlled Simulator Runtime Switch

Only after explicit approval, introduce a reversible server-controlled public switch. Current V1 rollback must remain immediately available and no mixed or silent fallback contract is allowed.

### Stage 3.16 - Runtime QA / Regression

Validate public and rollback paths across contract, lifecycle, browser, mobile, accessibility, and regression boundaries.

## 12. Approval Gates

### Gate A - Stage 3.12 Entry

Passed by this plan when adapter scope is internal only, V1/V2 coexistence is explicit, raw-text limitations are accepted, and no premature production coupling is approved.

### Gate B - Stage 3.13 Entry

Requires all Stage 3.12 adapter cases and deeper invariants to pass, with no public runtime import, AI, memory, auth, persistence, subscription, external-service, or raw-content logging coupling.

### Gate C - Stage 3.14 Entry

Requires stable isolated sandbox behavior, deterministic fixtures for every lifecycle state, documented V2 presentation requirements, and unchanged public behavior.

### Gate D - Stage 3.15 Entry

Requires explicit owner approval after V2 UI mapping, rollback proof, public contract review, failure review, and defined simulator regression scope.

### Gate E - Stage 4.x Entry

Production auth, persistence, user data controls, and subscriptions remain blocked until runtime integration completes through Stage 3.16.

### Gate F - Stage 5.x Entry

AI providers remain blocked until production runtime prerequisites, evaluation requirements, quality thresholds, safety validation, privacy controls, and cost controls are implemented and approved.

## 13. Premature Coupling Assessment

Stage 3.11 introduces:

- AI coupling: no;
- memory runtime coupling: no;
- auth coupling: no;
- database or persistence coupling: no;
- subscription coupling: no;
- public simulator coupling: no;
- public API coupling: no;
- runtime implementation: no;
- dependency changes: no.

Stage 3.12 must preserve all of these `no` decisions except for isolated internal deterministic-runtime invocation.

## 14. Stage 3.11 Conclusion

Stage 3.11 is completed as a documentation-only integration-planning stage.

The approved next stage is **Stage 3.12 - Controlled Internal Runtime Adapter**.

Stage 3.12 may connect only an isolated internal adapter to `runSimulationPipeline(...)`. It may not connect the deterministic brain to the public simulator, public API, UI, dashboard, localStorage, AI, memory, auth, persistence, subscriptions, or external services.
