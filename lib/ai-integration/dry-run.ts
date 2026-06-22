import {
  AI_INTEGRATION_DRY_RUN_MODE,
  AI_INTEGRATION_DRY_RUN_VERSION,
  type AIIntegrationBoundaryCompositionFoundation,
  type AIIntegrationBoundaryCompositionResult,
  type AIIntegrationDryRunConfig,
  type AIIntegrationDryRunEvidence,
  type AIIntegrationDryRunFoundation,
  type AIIntegrationDryRunRequest,
  type AIIntegrationDryRunResult,
  type AIIntegrationError,
  type AIIntegrationErrorCode,
  type AIIntegrationForbiddenClientFields,
} from "./contracts";
import {
  DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG,
  createAIIntegrationBoundaryCompositionFoundation,
} from "./boundary-composition";

export const DEFAULT_AI_INTEGRATION_DRY_RUN_CONFIG: AIIntegrationDryRunConfig = {
  enabled: false,
  composition: createAIIntegrationBoundaryCompositionFoundation({
    ...DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG,
    enabled: true,
  }),
};

function evidence(): AIIntegrationDryRunEvidence {
  return {
    stage: "5.4D",
    controlledAIIntegrationOnly: true,
    dryRunOnly: true,
    boundaryCompositionUsed: true,
    foundationOnly: true,
    preflightOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    aiCallConfirmedAbsent: true,
    envConfirmedUntouched: true,
    apiConfirmedUntouched: true,
    uiConfirmedUntouched: true,
    simulatorConfirmedUntouched: true,
    decisionEngineRuntimeConfirmedUntouched: true,
    promptContextRuntimeExecutedByDryRun: false,
    aiProviderExecutedByDryRun: false,
    aiQualityRealEnforcementExecuted: false,
    providerExecutionAllowed: false,
    streamingAllowed: false,
    rawPromptAllowed: false,
    providerPayloadAllowed: false,
    modelCallPayloadAllowed: false,
    modelCallExecuted: false,
    providerExecutionCompleted: false,
    openAiSdkConnected: false,
    aiSdkConnected: false,
    apiKeyRead: false,
    envRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    uiIntegrated: false,
  };
}

function error(
  code: AIIntegrationErrorCode,
  message: string,
): AIIntegrationError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(input: {
  reason: AIIntegrationErrorCode;
  message: string;
  dryRunId?: string;
  inputFingerprint?: string;
  composition?: AIIntegrationBoundaryCompositionResult;
}): AIIntegrationDryRunResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_INTEGRATION_DRY_RUN_VERSION,
    dryRunId: input.dryRunId,
    inputFingerprint: input.inputFingerprint,
    reason: input.reason,
    error: error(input.reason, input.message),
    composition: input.composition,
    evidence: evidence(),
  };
}

function isTimestampValid(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function hasUnsafeClientFields(
  fields: AIIntegrationForbiddenClientFields | undefined,
): boolean {
  return Boolean(
    fields?.apiKey ||
      fields?.envVarName ||
      fields?.providerSecret ||
      fields?.rawPrompt ||
      fields?.rawChatMessages?.length ||
      fields?.userSystemPrompt ||
      fields?.providerPayload !== undefined ||
      fields?.modelCallPayload !== undefined ||
      fields?.modelId ||
      fields?.providerExecution ||
      fields?.modelCall ||
      fields?.streaming ||
      fields?.apiRoute ||
      fields?.simulatorRuntime ||
      fields?.decisionEngineRuntime ||
      fields?.uiRuntime,
  );
}

function compositionFoundationIsSafe(
  composition: AIIntegrationBoundaryCompositionFoundation,
): boolean {
  return composition.modelCallsEnabled === false &&
    composition.providerExecutionEnabled === false &&
    composition.streamingEnabled === false &&
    composition.apiRoutesEnabled === false &&
    composition.simulatorRuntimeEnabled === false &&
    composition.decisionEngineRuntimeEnabled === false &&
    composition.uiRuntimeEnabled === false;
}

function compositionResultIsSafe(
  composition: AIIntegrationBoundaryCompositionResult,
): composition is Extract<
  AIIntegrationBoundaryCompositionResult,
  { status: "allowed" }
> {
  return composition.status === "allowed" &&
    composition.evidence.modelCallExecuted === false &&
    composition.evidence.openAiSdkConnected === false &&
    composition.evidence.envRead === false &&
    composition.evidence.apiRouteIntegrated === false &&
    composition.evidence.simulatorIntegrated === false &&
    composition.evidence.decisionEngineRuntimeConnected === false &&
    composition.evidence.uiIntegrated === false &&
    composition.evidence.promptContextRuntimeExecutedByComposition === false &&
    composition.evidence.aiProviderExecutedByComposition === false &&
    composition.evidence.aiQualityRealEnforcementExecuted === false &&
    composition.evidence.providerExecutionCompleted === false &&
    composition.evidence.aiSdkConnected === false &&
    composition.evidence.apiKeyRead === false;
}

export function executeAIIntegrationDryRun(
  config: AIIntegrationDryRunConfig,
  request: Partial<AIIntegrationDryRunRequest> | null | undefined,
): AIIntegrationDryRunResult {
  if (!config.enabled) {
    return blocked({
      reason: "dry_run_disabled",
      message: "Controlled AI integration dry-run is disabled by default.",
    });
  }

  if (!request) {
    return blocked({
      reason: "dry_run_request_missing",
      message: "Controlled AI integration dry-run requires a request.",
    });
  }

  if (!request.dryRunId) {
    return blocked({
      reason: "dry_run_id_missing",
      message: "Controlled AI integration dry-run requires dryRunId.",
    });
  }

  if (!isTimestampValid(request.requestedAt)) {
    return blocked({
      reason: "dry_run_timestamp_invalid",
      message: "Controlled AI integration dry-run requires a valid timestamp.",
      dryRunId: request.dryRunId,
    });
  }

  if (!request.inputFingerprint?.trim()) {
    return blocked({
      reason: "dry_run_input_fingerprint_missing",
      message: "Controlled AI integration dry-run requires input fingerprint.",
      dryRunId: request.dryRunId,
    });
  }

  if (!request.composition) {
    return blocked({
      reason: "dry_run_composition_missing",
      message: "Controlled AI integration dry-run requires composition input.",
      dryRunId: request.dryRunId,
      inputFingerprint: request.inputFingerprint,
    });
  }

  if (hasUnsafeClientFields(request.clientRuntimeFields)) {
    return blocked({
      reason: "unsafe_client_field_rejected",
      message:
        "Controlled AI integration dry-run rejects prompt, provider, key, streaming, and product runtime fields.",
      dryRunId: request.dryRunId,
      inputFingerprint: request.inputFingerprint,
    });
  }

  if (!compositionFoundationIsSafe(config.composition)) {
    return blocked({
      reason: "dry_run_composition_disabled",
      message:
        "Controlled AI integration dry-run requires execution-free boundary composition foundation.",
      dryRunId: request.dryRunId,
      inputFingerprint: request.inputFingerprint,
    });
  }

  const composition = config.composition.compose(request.composition);

  if (composition.status === "blocked") {
    return blocked({
      reason: "dry_run_composition_blocked",
      message:
        "Controlled AI integration dry-run blocked after boundary composition.",
      dryRunId: request.dryRunId,
      inputFingerprint: request.inputFingerprint,
      composition,
    });
  }

  if (!compositionResultIsSafe(composition)) {
    return blocked({
      reason: "dry_run_isolation_failed",
      message:
        "Controlled AI integration dry-run composition did not preserve isolation evidence.",
      dryRunId: request.dryRunId,
      inputFingerprint: request.inputFingerprint,
      composition,
    });
  }

  return {
    status: "completed",
    execution: "dry_run_preflight_only",
    version: AI_INTEGRATION_DRY_RUN_VERSION,
    dryRunId: request.dryRunId,
    inputFingerprint: request.inputFingerprint,
    composition,
    evidence: evidence(),
  };
}

export function createAIIntegrationDryRunFoundation(
  config: AIIntegrationDryRunConfig = DEFAULT_AI_INTEGRATION_DRY_RUN_CONFIG,
): AIIntegrationDryRunFoundation {
  return {
    version: AI_INTEGRATION_DRY_RUN_VERSION,
    mode: AI_INTEGRATION_DRY_RUN_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    providerExecutionEnabled: false,
    streamingEnabled: false,
    apiRoutesEnabled: false,
    simulatorRuntimeEnabled: false,
    decisionEngineRuntimeEnabled: false,
    uiRuntimeEnabled: false,
    execute: (request) => executeAIIntegrationDryRun(config, request),
  };
}
