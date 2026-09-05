import "server-only";

import {
  DecisionMaterialTransportFailure,
  OPENAI_DECISION_MATERIAL_MODEL,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
  type DecisionMaterialTransportGeneration,
} from "../ai-provider/openai-decision-material-adapter";
import { validCandidateDecisionMaterial } from "../ai-provider/openai-decision-material-adapter-validation";
import { validPostProviderBridgeRequest } from "../decision-engine/post-provider-boundary-validation";
import { validateSimulationResponseV2DraftShape } from "../decision-engine/simulation-response";
import {
  bindControlledProductionAiRuntimeSwitch,
  type ControlledProductionAiRuntimeEnvironment,
} from "./controlled-production-ai-runtime-switch.server";
import {
  CONTROLLED_SIMULATOR_SWITCH_MODE,
  CONTROLLED_SIMULATOR_SWITCH_VERSION,
  type ControlledProductionAiOperationalEvent,
  type ControlledProductionAiOperationalObserver,
  type ControlledServerRuntimeSelectionResult,
  type ControlledSimulatorSwitchRequest,
} from "./controlled-simulator-runtime-switch-contracts";

export type ControlledProductionAiRuntimeSwitchValidationCase = {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue?: string;
};

export type ControlledProductionAiRuntimeSwitchValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: ControlledProductionAiRuntimeSwitchValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    positive: number;
    negative: number;
    networkRequests: 0;
  };
};

type FakeTransportOptions = {
  countFailure?: Error;
  generation?: DecisionMaterialTransportGeneration;
};

function fakeTransport(options: FakeTransportOptions = {}) {
  let countCalls = 0;
  let generationCalls = 0;
  let observedModel: string | undefined;
  const transport: DecisionMaterialTransport = {
    async countInput(request: DecisionMaterialProviderRequest) {
      countCalls += 1;
      observedModel = request.model;
      if (options.countFailure) throw options.countFailure;
      return 1200;
    },
    async generate(request: DecisionMaterialProviderRequest) {
      generationCalls += 1;
      observedModel = request.model;
      return options.generation ?? {
        status: "completed",
        outputText: JSON.stringify(validCandidateDecisionMaterial()),
        usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 },
      };
    },
  };
  return {
    transport,
    stats: () => ({ countCalls, generationCalls, observedModel }),
  };
}

function observedEnvironment(values: Record<string, string | undefined>) {
  let credentialReads = 0;
  const environment = new Proxy(values, {
    get(target, property, receiver) {
      if (property === "OPENAI_API_KEY") credentialReads += 1;
      return Reflect.get(target, property, receiver);
    },
  }) as ControlledProductionAiRuntimeEnvironment;
  return { environment, credentialReads: () => credentialReads };
}

function runtime(
  environment: ControlledProductionAiRuntimeEnvironment,
  fake = fakeTransport(),
  throwDuringCreation = false,
  observer?: ControlledProductionAiOperationalObserver,
) {
  let factoryCalls = 0;
  let receivedKey: string | undefined;
  let currentTime = 1000;
  const events: ControlledProductionAiOperationalEvent[] = [];
  const bound = bindControlledProductionAiRuntimeSwitch(
    environment,
    (apiKey) => {
      factoryCalls += 1;
      receivedKey = apiKey;
      if (throwDuringCreation) throw new Error("raw secret from transport initialization");
      return fake.transport;
    },
    () => "2026-08-09T00:00:00.000Z",
    {
      observer: observer ?? ((event) => events.push(event)),
      now: () => {
        currentTime += 5;
        return currentTime;
      },
    },
  );
  return {
    bound,
    fake,
    events,
    stats: () => ({ factoryCalls, receivedKey }),
  };
}

function request(): ControlledSimulatorSwitchRequest {
  const bridge = validPostProviderBridgeRequest();
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    executionContext: "internal_dev",
    requestId: "stage9_ai_runtime",
    input: bridge.decisionContext.statement,
    lang: "es",
    requestedOutputLanguage: "es",
    userIntent: "compare",
    context: bridge.decisionContext,
    safety: bridge.safety,
    safetyContextComplete: true,
  };
}

function failureSource(result: ControlledServerRuntimeSelectionResult): string | undefined {
  return result.selectedPath === "controlled_failure" &&
    "runtimeSource" in result &&
    result.runtimeSource === "production_ai"
    ? result.failure.sourceCode
    : undefined;
}

function validationCase(input: {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue: string;
}): ControlledProductionAiRuntimeSwitchValidationCase {
  return {
    caseId: input.caseId,
    kind: input.kind,
    passed: input.passed,
    ...(input.passed ? {} : { issue: input.issue }),
  };
}

export async function runControlledProductionAiRuntimeSwitchValidation():
  Promise<ControlledProductionAiRuntimeSwitchValidationResult> {
  const disabledEnvironment = observedEnvironment({
    LEVIO_REAL_AI_DEV_ENABLED: "false",
    LEVIO_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "must-not-be-read",
  });
  const disabledRuntime = runtime(disabledEnvironment.environment);
  const disabled = await disabledRuntime.bound.execute(request());

  const enabledEnvironment = observedEnvironment({
    LEVIO_REAL_AI_DEV_ENABLED: "true",
    LEVIO_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "offline-runtime-key",
  });
  const enabledRuntime = runtime(enabledEnvironment.environment);
  const completed = await enabledRuntime.bound.execute(request());

  const missingKeyEnvironment = observedEnvironment({
    LEVIO_REAL_AI_DEV_ENABLED: "true",
    LEVIO_AI_PROVIDER: "openai",
  });
  const missingKeyRuntime = runtime(missingKeyEnvironment.environment);
  const missingKey = await missingKeyRuntime.bound.execute(request());

  const wrongProviderEnvironment = observedEnvironment({
    LEVIO_REAL_AI_DEV_ENABLED: "true",
    LEVIO_AI_PROVIDER: "other",
    OPENAI_API_KEY: "must-not-be-read",
  });
  const wrongProviderRuntime = runtime(wrongProviderEnvironment.environment);
  const wrongProvider = await wrongProviderRuntime.bound.execute(request());

  const clientControlRuntime = runtime(disabledEnvironment.environment);
  const clientControl = await clientControlRuntime.bound.execute({
    ...request(),
    provider: "openai",
    model: OPENAI_DECISION_MATERIAL_MODEL,
    apiKey: "client-key",
    runtimeSwitch: true,
    transport: {},
    reasoning: "high",
  });

  const missingContextRuntime = runtime(enabledEnvironment.environment);
  const missingContextRequest = request();
  delete missingContextRequest.context;
  const missingContext = await missingContextRuntime.bound.execute(missingContextRequest);

  const initializationRuntime = runtime(enabledEnvironment.environment, fakeTransport(), true);
  const initializationFailure = await initializationRuntime.bound.execute(request());

  const unavailableFake = fakeTransport({
    countFailure: new DecisionMaterialTransportFailure(
      "provider_unavailable",
      undefined,
      {
        providerFailureType: "connection_error",
        httpStatus: null,
        providerCode: null,
        providerErrorType: null,
      },
    ),
  });
  const unavailableRuntime = runtime(enabledEnvironment.environment, unavailableFake);
  const unavailable = await unavailableRuntime.bound.execute(request());

  const invalidSchemaFake = fakeTransport({
    generation: {
      status: "completed",
      outputText: "{}",
      usage: { inputTokens: 1200, outputTokens: 10, totalTokens: 1210 },
    },
  });
  const invalidSchemaRuntime = runtime(enabledEnvironment.environment, invalidSchemaFake);
  const invalidSchema = await invalidSchemaRuntime.bound.execute(request());

  const groundingContentSentinel = "GROUNDING_RAW_CONTENT_MUST_NOT_LEAK";
  const groundingMaterial = structuredClone(validCandidateDecisionMaterial());
  groundingMaterial.items[0].content = groundingContentSentinel;
  groundingMaterial.items[0].scenario_refs = ["scenario_99"];
  const groundingFake = fakeTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(groundingMaterial),
      usage: { inputTokens: 1200, outputTokens: 100, totalTokens: 1300 },
    },
  });
  const groundingRuntime = runtime(enabledEnvironment.environment, groundingFake);
  const grounding = await groundingRuntime.bound.execute(request());

  const observerFailureRuntime = runtime(
    enabledEnvironment.environment,
    fakeTransport(),
    false,
    () => {
      throw new Error("operational sink unavailable");
    },
  );
  const observerFailure = await observerFailureRuntime.bound.execute(request());

  const rollbackValues: Record<string, string | undefined> = {
    LEVIO_REAL_AI_DEV_ENABLED: "true",
    LEVIO_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "rollback-key-must-not-leak",
  };
  const rollbackEnvironment = observedEnvironment(rollbackValues);
  const rollbackEnabledRuntime = runtime(rollbackEnvironment.environment);
  const beforeRollback = await rollbackEnabledRuntime.bound.execute(request());
  const credentialReadsBeforeRollback = rollbackEnvironment.credentialReads();
  rollbackValues.LEVIO_REAL_AI_DEV_ENABLED = "false";
  const rollbackRuntime = runtime(rollbackEnvironment.environment);
  const rolledBack = await rollbackRuntime.bound.execute(request());

  const completedProviderEvents = enabledRuntime.events.filter((event) =>
    event.event === "provider_operation_completed"
  );
  const generationEvent = completedProviderEvents.find((event) =>
    event.providerOperation === "generation"
  );
  const serializedOperationalEvidence = JSON.stringify(enabledRuntime.events);
  const unavailableProviderFailureEvent = unavailableRuntime.events.find((event) =>
    event.event === "provider_operation_failed"
  );
  const unavailableOrchestrationFailureEvent = unavailableRuntime.events.find((event) =>
    event.event === "orchestration_failed"
  );
  const groundingOrchestrationFailureEvent = groundingRuntime.events.find((event) =>
    event.event === "orchestration_failed"
  );

  const cases = [
    validationCase({
      caseId: "disabled_default_selects_existing_mock_path",
      kind: "positive",
      passed: disabled.selectedPath === "public_mock_v1" &&
        disabled.selectedContract === "SimulationResponse" &&
        disabled.evidence.externalProviderUsed === false,
      issue: "Disabled production AI did not preserve the existing mock-only path.",
    }),
    validationCase({
      caseId: "disabled_default_does_not_read_credentials_or_create_transport",
      kind: "positive",
      passed: disabledEnvironment.credentialReads() === 0 &&
        disabledRuntime.stats().factoryCalls === 0 &&
        disabledRuntime.fake.stats().countCalls === 0 &&
        disabledRuntime.fake.stats().generationCalls === 0,
      issue: "Disabled selection accessed credentials or created/executed provider transport.",
    }),
    validationCase({
      caseId: "enabled_server_configuration_selects_production_composition_root",
      kind: "positive",
      passed: completed.selectedPath === "controlled_production_ai_v2" &&
        completed.selectedContract === "SimulationResponseV2Draft" &&
        completed.runtimeSource === "production_ai" &&
        completed.evidence.productionCompositionRootUsed,
      issue: "Enabled server configuration did not select the production composition root.",
    }),
    validationCase({
      caseId: "full_internal_ai_path_returns_existing_v2_draft",
      kind: "positive",
      passed: completed.selectedPath === "controlled_production_ai_v2" &&
        validateSimulationResponseV2DraftShape(completed.response) &&
        completed.evidence.decisionEngineAuthorityPreserved &&
        !completed.evidence.directProviderToSimulatorAllowed,
      issue: "Full internal AI path did not return a Decision Engine-controlled V2 draft.",
    }),
    validationCase({
      caseId: "provider_model_and_credential_remain_server_controlled",
      kind: "positive",
      passed: enabledEnvironment.credentialReads() > 0 &&
        enabledRuntime.stats().factoryCalls === 1 &&
        enabledRuntime.stats().receivedKey === "offline-runtime-key" &&
        enabledRuntime.fake.stats().observedModel === OPENAI_DECISION_MATERIAL_MODEL &&
        !JSON.stringify(completed).includes("offline-runtime-key") &&
        !JSON.stringify(completed).toLowerCase().includes("openai") &&
        !JSON.stringify(completed).toLowerCase().includes("gpt-"),
      issue: "Server-controlled credential/provider/model boundary was not preserved.",
    }),
    validationCase({
      caseId: "missing_credentials_fail_closed",
      kind: "negative",
      passed: missingKey.selectedPath === "controlled_failure" &&
        failureSource(missingKey) === "credentials_unavailable" &&
        missingKeyRuntime.stats().factoryCalls === 0,
      issue: "Missing server credentials did not produce a controlled configuration failure.",
    }),
    validationCase({
      caseId: "invalid_provider_fails_before_credential_access",
      kind: "negative",
      passed: wrongProvider.selectedPath === "controlled_failure" &&
        failureSource(wrongProvider) === "provider_not_approved" &&
        wrongProviderEnvironment.credentialReads() === 0 &&
        wrongProviderRuntime.stats().factoryCalls === 0,
      issue: "Invalid provider read credentials or escaped controlled failure.",
    }),
    validationCase({
      caseId: "client_cannot_activate_or_configure_ai_runtime",
      kind: "negative",
      passed: clientControl.selectedPath === "controlled_failure" &&
        !("runtimeSource" in clientControl) &&
        clientControlRuntime.stats().factoryCalls === 0,
      issue: "Client-controlled runtime/provider/model/key fields influenced AI selection.",
    }),
    validationCase({
      caseId: "missing_canonical_decision_context_fails_before_provider",
      kind: "negative",
      passed: missingContext.selectedPath === "controlled_failure" &&
        failureSource(missingContext) === "decision_context_missing" &&
        missingContextRuntime.fake.stats().countCalls === 0,
      issue: "Missing canonical Decision Context reached provider transport.",
    }),
    validationCase({
      caseId: "composition_root_initialization_failure_is_controlled",
      kind: "negative",
      passed: initializationFailure.selectedPath === "controlled_failure" &&
        failureSource(initializationFailure) === "transport_initialization_failed" &&
        !JSON.stringify(initializationFailure).includes("raw secret"),
      issue: "Composition-root initialization failure leaked or escaped control.",
    }),
    validationCase({
      caseId: "provider_unavailable_fails_closed_without_fallback",
      kind: "negative",
      passed: unavailable.selectedPath === "controlled_failure" &&
        failureSource(unavailable) === "provider_unavailable" &&
        unavailable.fallback.used === false &&
        unavailableFake.stats().countCalls === 1 &&
        unavailableFake.stats().generationCalls === 0,
      issue: "Provider unavailability triggered an uncontrolled or hidden fallback.",
    }),
    validationCase({
      caseId: "orchestration_schema_failure_fails_closed",
      kind: "negative",
      passed: invalidSchema.selectedPath === "controlled_failure" &&
        failureSource(invalidSchema) === "provider_schema_invalid" &&
        invalidSchema.fallback.used === false,
      issue: "Invalid provider material escaped controlled orchestration failure.",
    }),
    validationCase({
      caseId: "grounding_failure_emits_bounded_operational_diagnostic",
      kind: "negative",
      passed: groundingOrchestrationFailureEvent?.failureCategory ===
          "provider_grounding_invalid" &&
        groundingOrchestrationFailureEvent.groundingItemType === "option" &&
        groundingOrchestrationFailureEvent.groundingItemIndex === 0 &&
        groundingOrchestrationFailureEvent.groundingField === "scenario_refs" &&
        groundingOrchestrationFailureEvent.groundingPredicate === "unknown_scenario_ref" &&
        groundingOrchestrationFailureEvent.groundingReferenceToken === "scenario_99" &&
        groundingOrchestrationFailureEvent.sensitiveDataIncluded === false,
      issue: "Grounding failure did not reach the bounded internal operational event.",
    }),
    validationCase({
      caseId: "grounding_diagnostic_is_not_exposed_by_runtime_result",
      kind: "negative",
      passed: grounding.selectedPath === "controlled_failure" &&
        failureSource(grounding) === "provider_grounding_invalid" &&
        grounding.fallback.used === false &&
        !JSON.stringify(grounding).includes("groundingPredicate") &&
        !JSON.stringify(grounding).includes("scenario_99") &&
        !JSON.stringify(grounding).includes(groundingContentSentinel) &&
        groundingFake.stats().countCalls === 1 &&
        groundingFake.stats().generationCalls === 1,
      issue: "Grounding metadata or raw provider content escaped the internal failure boundary.",
    }),
    validationCase({
      caseId: "production_failure_exposes_bounded_v2_ui_state",
      kind: "negative",
      passed: unavailable.selectedPath === "controlled_failure" &&
        unavailable.selectedContract === "SimulationResponseV2UiModel" &&
        unavailable.uiModel.renderState === "controlled_failure" &&
        unavailable.uiModel.responseStatus === "failed" &&
        unavailable.uiModel.mappingErrors.length === 0 &&
        unavailable.uiModel.sections.status.items.length === 1 &&
        Object.entries(unavailable.uiModel.sections).every(([id, section]) =>
          id === "status" || section.items.length === 0
        ) &&
        !JSON.stringify(unavailable.uiModel).includes("provider_unavailable"),
      issue: "Production failure did not expose the bounded V2 UI failure state.",
    }),
    validationCase({
      caseId: "operational_evidence_covers_selection_orchestration_and_provider",
      kind: "positive",
      passed: [
        "runtime_selected",
        "orchestration_started",
        "provider_operation_completed",
        "orchestration_completed",
      ].every((eventName) => enabledRuntime.events.some((event) => event.event === eventName)) &&
        completedProviderEvents.length === 2 &&
        enabledRuntime.events.every((event) =>
          event.sensitiveDataIncluded === false &&
          event.latencyMs >= 0 &&
          event.rollbackState === "available"
        ),
      issue: "Operational evidence did not cover the controlled runtime lifecycle.",
    }),
    validationCase({
      caseId: "operational_usage_and_cost_are_normalized",
      kind: "positive",
      passed: generationEvent?.usage?.inputTokens === 1200 &&
        generationEvent.usage.outputTokens === 700 &&
        generationEvent.usage.totalTokens === 1900 &&
        generationEvent.usage.calculatedCostUsd === 0.0108,
      issue: "Provider token usage or calculated cost was not normalized safely.",
    }),
    validationCase({
      caseId: "operational_evidence_excludes_sensitive_and_raw_content",
      kind: "negative",
      passed: !serializedOperationalEvidence.includes("offline-runtime-key") &&
        !serializedOperationalEvidence.includes("Authorization") &&
        !serializedOperationalEvidence.includes(request().input) &&
        !serializedOperationalEvidence.includes("outputText") &&
        !serializedOperationalEvidence.includes("apiKey"),
      issue: "Operational evidence included credentials, request content, or raw output.",
    }),
    validationCase({
      caseId: "provider_failure_records_controlled_fail_closed_state",
      kind: "negative",
      passed: unavailableProviderFailureEvent?.failureCategory === "provider_unavailable" &&
        unavailableProviderFailureEvent.providerFailureType === "connection_error" &&
        unavailableProviderFailureEvent.httpStatus === null &&
        unavailableProviderFailureEvent.providerCode === null &&
        unavailableProviderFailureEvent.providerErrorType === null &&
        unavailableProviderFailureEvent.fallbackState === "fail_closed" &&
        unavailableOrchestrationFailureEvent?.failureCategory === "provider_unavailable" &&
        unavailableOrchestrationFailureEvent.fallbackState === "fail_closed" &&
        unavailableOrchestrationFailureEvent.rollbackState === "available",
      issue: "Provider failure operational evidence did not preserve fail-closed semantics.",
    }),
    validationCase({
      caseId: "server_switch_rollback_restores_mock_without_credentials_or_provider",
      kind: "positive",
      passed: beforeRollback.selectedPath === "controlled_production_ai_v2" &&
        rolledBack.selectedPath === "public_mock_v1" &&
        credentialReadsBeforeRollback > 0 &&
        rollbackEnvironment.credentialReads() === credentialReadsBeforeRollback &&
        rollbackRuntime.stats().factoryCalls === 0 &&
        rollbackRuntime.fake.stats().countCalls === 0 &&
        rollbackRuntime.fake.stats().generationCalls === 0 &&
        rollbackRuntime.events.some((event) =>
          event.event === "runtime_selected" &&
          event.runtimePath === "deterministic_mock" &&
          event.rollbackState === "active"
        ),
      issue: "Existing server switch did not provide credential-free deterministic rollback.",
    }),
    validationCase({
      caseId: "operational_sink_failure_does_not_change_runtime_result",
      kind: "negative",
      passed: observerFailure.selectedPath === "controlled_production_ai_v2" &&
        observerFailureRuntime.fake.stats().countCalls === 1 &&
        observerFailureRuntime.fake.stats().generationCalls === 1,
      issue: "Operational sink failure changed the controlled runtime outcome.",
    }),
  ];
  const passed = cases.filter((item) => item.passed).length;
  return {
    passed: passed === cases.length,
    failed: passed !== cases.length,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed: cases.length - passed,
      positive: cases.filter((item) => item.kind === "positive").length,
      negative: cases.filter((item) => item.kind === "negative").length,
      networkRequests: 0,
    },
  };
}
