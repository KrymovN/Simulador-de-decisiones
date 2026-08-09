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
) {
  let factoryCalls = 0;
  let receivedKey: string | undefined;
  const bound = bindControlledProductionAiRuntimeSwitch(
    environment,
    (apiKey) => {
      factoryCalls += 1;
      receivedKey = apiKey;
      if (throwDuringCreation) throw new Error("raw secret from transport initialization");
      return fake.transport;
    },
    () => "2026-08-09T00:00:00.000Z",
  );
  return {
    bound,
    fake,
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
    countFailure: new DecisionMaterialTransportFailure("provider_unavailable"),
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
