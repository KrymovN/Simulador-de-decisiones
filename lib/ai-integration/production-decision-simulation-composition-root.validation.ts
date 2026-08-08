import "server-only";

import {
  OPENAI_DECISION_MATERIAL_MODEL,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
} from "../ai-provider/openai-decision-material-adapter";
import { validCandidateDecisionMaterial } from "../ai-provider/openai-decision-material-adapter-validation";
import { validPostProviderBridgeRequest } from "../decision-engine/post-provider-boundary-validation";
import {
  bindProductionDecisionSimulationCompositionRoot,
  type OpenAIDecisionMaterialTransportFactory,
  type ProductionDecisionSimulationEnvironment,
} from "./production-decision-simulation-composition-root.server";
import type { ProductionDecisionSimulationOrchestratorResult } from "./production-decision-simulation-orchestrator";

export type ProductionDecisionSimulationCompositionRootValidationCase = {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue?: string;
};

export type ProductionDecisionSimulationCompositionRootValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: ProductionDecisionSimulationCompositionRootValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    positive: number;
    negative: number;
    networkRequests: 0;
  };
};

const readyEnvironment: ProductionDecisionSimulationEnvironment = {
  LEVIO_REAL_AI_DEV_ENABLED: "true",
  LEVIO_AI_PROVIDER: "openai",
  OPENAI_API_KEY: "offline-composition-root-key",
};

function request(): Record<string, unknown> {
  return {
    orchestrationId: "stage9_production_root",
    bridgeRequest: validPostProviderBridgeRequest(),
  };
}

function fakeTransport() {
  let countCalls = 0;
  let generationCalls = 0;
  let observedModel: string | undefined;
  const transport: DecisionMaterialTransport = {
    async countInput(providerRequest: DecisionMaterialProviderRequest) {
      countCalls += 1;
      observedModel = providerRequest.model;
      return 1200;
    },
    async generate(providerRequest: DecisionMaterialProviderRequest) {
      generationCalls += 1;
      observedModel = providerRequest.model;
      return {
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

function factory() {
  const fake = fakeTransport();
  let calls = 0;
  let receivedKey: string | undefined;
  const transportFactory: OpenAIDecisionMaterialTransportFactory = (apiKey) => {
    calls += 1;
    receivedKey = apiKey;
    return fake.transport;
  };
  return {
    fake,
    transportFactory,
    stats: () => ({ calls, receivedKey }),
  };
}

function sourceCode(result: ProductionDecisionSimulationOrchestratorResult): string | undefined {
  return result.status === "failed" ? result.error.sourceCode : undefined;
}

function stages(result: ProductionDecisionSimulationOrchestratorResult): string {
  return result.trace.map((item) => `${item.stage}:${item.status}`).join(",");
}

function validationCase(input: {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue: string;
}): ProductionDecisionSimulationCompositionRootValidationCase {
  return {
    caseId: input.caseId,
    kind: input.kind,
    passed: input.passed,
    ...(input.passed ? {} : { issue: input.issue }),
  };
}

export async function runProductionDecisionSimulationCompositionRootValidation():
  Promise<ProductionDecisionSimulationCompositionRootValidationResult> {
  const readyFactory = factory();
  const root = bindProductionDecisionSimulationCompositionRoot(
    readyEnvironment,
    readyFactory.transportFactory,
  );
  const completed = await root.execute(request());

  const disabledFactory = factory();
  const disabledRoot = bindProductionDecisionSimulationCompositionRoot(
    { ...readyEnvironment, LEVIO_REAL_AI_DEV_ENABLED: "false" },
    disabledFactory.transportFactory,
  );
  const disabled = await disabledRoot.execute(request());

  const missingKeyFactory = factory();
  const missingKeyRoot = bindProductionDecisionSimulationCompositionRoot(
    { LEVIO_REAL_AI_DEV_ENABLED: "true", LEVIO_AI_PROVIDER: "openai" },
    missingKeyFactory.transportFactory,
  );
  const missingKey = await missingKeyRoot.execute(request());

  const emptyKeyFactory = factory();
  const emptyKeyRoot = bindProductionDecisionSimulationCompositionRoot(
    { ...readyEnvironment, OPENAI_API_KEY: "   " },
    emptyKeyFactory.transportFactory,
  );
  const emptyKey = await emptyKeyRoot.execute(request());

  const wrongProviderFactory = factory();
  const wrongProviderRoot = bindProductionDecisionSimulationCompositionRoot(
    { ...readyEnvironment, LEVIO_AI_PROVIDER: "other" },
    wrongProviderFactory.transportFactory,
  );
  const wrongProvider = await wrongProviderRoot.execute(request());

  const clientOverrideFactory = factory();
  const clientOverrideRoot = bindProductionDecisionSimulationCompositionRoot(
    readyEnvironment,
    clientOverrideFactory.transportFactory,
  );
  const clientOverride = await clientOverrideRoot.execute({
    ...request(),
    provider: "other",
    model: "other",
    apiKey: "client-key",
    transport: {},
    runtimeControls: { enabled: true },
  });

  const throwingFactory: OpenAIDecisionMaterialTransportFactory = () => {
    throw new Error("offline transport construction failure with secret material");
  };
  const initializationRoot = bindProductionDecisionSimulationCompositionRoot(
    readyEnvironment,
    throwingFactory,
  );
  const initializationFailure = await initializationRoot.execute(request());

  const cases = [
    validationCase({
      caseId: "ready_environment_binds_existing_orchestrator",
      kind: "positive",
      passed: root.binding.status === "ready" && completed.status === "completed",
      issue: "A valid server environment did not reach the existing production orchestrator.",
    }),
    validationCase({
      caseId: "existing_adapter_model_remains_fixed",
      kind: "positive",
      passed: readyFactory.fake.stats().observedModel === OPENAI_DECISION_MATERIAL_MODEL,
      issue: "Composition binding changed or exposed the adapter-owned model.",
    }),
    validationCase({
      caseId: "offline_transport_drives_complete_chain",
      kind: "positive",
      passed: completed.status === "completed" &&
        readyFactory.fake.stats().countCalls === 1 &&
        readyFactory.fake.stats().generationCalls === 1 &&
        stages(completed).endsWith("simulation_composition:completed"),
      issue: "Injected fake transport did not drive the complete orchestrator offline.",
    }),
    validationCase({
      caseId: "credential_reaches_transport_factory_only",
      kind: "positive",
      passed: readyFactory.stats().calls === 1 &&
        readyFactory.stats().receivedKey === readyEnvironment.OPENAI_API_KEY &&
        !JSON.stringify(root).includes(String(readyEnvironment.OPENAI_API_KEY)) &&
        !JSON.stringify(completed).includes(String(readyEnvironment.OPENAI_API_KEY)),
      issue: "Credential binding was missing or leaked beyond the server transport factory.",
    }),
    validationCase({
      caseId: "binding_metadata_keeps_runtime_closed",
      kind: "positive",
      passed: root.binding.credentialsExposed === false &&
        root.binding.providerControlledByServer &&
        root.binding.modelControlledByAdapter &&
        !root.binding.publicRuntimeIntegrated,
      issue: "Composition-root metadata opened a credential or public runtime boundary.",
    }),
    validationCase({
      caseId: "disabled_environment_fails_closed_before_transport",
      kind: "negative",
      passed: disabledRoot.binding.status === "blocked" &&
        disabledRoot.binding.error.code === "runtime_disabled" &&
        sourceCode(disabled) === "adapter_disabled" &&
        disabledFactory.stats().calls === 0,
      issue: "Disabled runtime environment did not fail closed before transport creation.",
    }),
    validationCase({
      caseId: "missing_credential_fails_closed_before_transport",
      kind: "negative",
      passed: missingKeyRoot.binding.status === "blocked" &&
        missingKeyRoot.binding.error.code === "credentials_unavailable" &&
        sourceCode(missingKey) === "credentials_unavailable" &&
        missingKeyFactory.stats().calls === 0,
      issue: "Missing credential did not fail closed before transport creation.",
    }),
    validationCase({
      caseId: "empty_credential_is_invalid",
      kind: "negative",
      passed: emptyKeyRoot.binding.status === "blocked" &&
        emptyKeyRoot.binding.error.code === "credentials_unavailable" &&
        sourceCode(emptyKey) === "credentials_unavailable" &&
        emptyKeyFactory.stats().calls === 0,
      issue: "Whitespace-only credential was treated as available.",
    }),
    validationCase({
      caseId: "unapproved_provider_fails_closed_before_transport",
      kind: "negative",
      passed: wrongProviderRoot.binding.status === "blocked" &&
        wrongProviderRoot.binding.error.code === "provider_not_approved" &&
        sourceCode(wrongProvider) === "provider_not_approved" &&
        wrongProviderFactory.stats().calls === 0,
      issue: "Unapproved server provider reached transport creation.",
    }),
    validationCase({
      caseId: "client_runtime_controls_are_rejected",
      kind: "negative",
      passed: clientOverride.status === "failed" &&
        clientOverride.error.code === "orchestration_input_invalid" &&
        clientOverrideFactory.fake.stats().countCalls === 0 &&
        clientOverrideFactory.fake.stats().generationCalls === 0,
      issue: "Client input influenced provider, model, credential, transport, or runtime controls.",
    }),
    validationCase({
      caseId: "transport_initialization_failure_is_controlled",
      kind: "negative",
      passed: initializationRoot.binding.status === "blocked" &&
        initializationRoot.binding.error.code === "transport_initialization_failed" &&
        sourceCode(initializationFailure) === "provider_unavailable" &&
        !JSON.stringify(initializationFailure).includes("secret material"),
      issue: "Transport initialization failure did not become a safe controlled result.",
    }),
    validationCase({
      caseId: "downstream_stages_skip_after_binding_failure",
      kind: "negative",
      passed: stages(missingKey) === [
        "decision_prompt_context:completed",
        "provider_adapter:failed",
        "post_provider_decision_engine:skipped",
        "simulation_composition:skipped",
      ].join(","),
      issue: "A blocked environment allowed downstream execution.",
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
