import {
  DEFAULT_AI_QUALITY_CONTRACTS_CONFIG,
  createAiQualityContractsFoundation,
} from "./validation";
import {
  AI_QUALITY_RUNTIME_MODE,
  AI_QUALITY_RUNTIME_VERSION,
  type AiQualityEvaluationResult,
  type AiQualityFailureSeverity,
  type AiQualityObservedMetric,
  type AiQualityRuntimeBlockedReason,
  type AiQualityRuntimeConfig,
  type AiQualityRuntimeEvaluationInput,
  type AiQualityRuntimeEvaluationResult,
  type AiQualityRuntimeFoundation,
  type AiQualityRuntimeSafetyEvidence,
  type AiQualitySeveritySummary,
  type AiQualityValidationInputContract,
} from "./contracts";

export const DEFAULT_AI_QUALITY_RUNTIME_CONFIG: AiQualityRuntimeConfig = {
  enabled: false,
  contracts: createAiQualityContractsFoundation({
    ...DEFAULT_AI_QUALITY_CONTRACTS_CONFIG,
    enabled: true,
  }),
  failClosedOnContractBlock: true,
};

const EMPTY_SEVERITY_SUMMARY: AiQualitySeveritySummary = {
  info: 0,
  warning: 0,
  blocking: 0,
  highestSeverity: "none",
};

export function aiQualityRuntimeSafetyEvidence(): AiQualityRuntimeSafetyEvidence {
  return {
    stage: "5.3B",
    aiQualityOnly: true,
    runtimeFoundationOnly: true,
    contractsFoundationUsed: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    qualityGateEvaluated: true,
    costBudgetEvaluated: true,
    safetyGateEvaluated: true,
    releaseGateEvaluated: true,
    severityAggregated: true,
    modelCallExecuted: false,
    openAiSdkConnected: false,
    apiKeysRead: false,
    envVariablesRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    aiProviderRuntimeConnected: false,
    promptContextRuntimeConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    stage53CStarted: false,
    rollback: "disable_ai_quality_runtime_or_remove_runtime_exports",
  };
}

function blocked(input: {
  reason: AiQualityRuntimeBlockedReason;
  message: string;
  severitySummary?: AiQualitySeveritySummary;
  contractResult?: AiQualityEvaluationResult;
}): AiQualityRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_QUALITY_RUNTIME_VERSION,
    releaseGateDecision: "blocked",
    reason: input.reason,
    message: input.message,
    severitySummary: input.severitySummary ?? EMPTY_SEVERITY_SUMMARY,
    contractResult: input.contractResult,
    evidence: aiQualityRuntimeSafetyEvidence(),
  };
}

function contractEvidenceIsIsolated(result: AiQualityEvaluationResult): boolean {
  const evidence = result.evidence;

  return evidence.stage === "5.3A" &&
    evidence.aiQualityOnly &&
    evidence.contractsOnly &&
    evidence.foundationOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.qualityEvaluationDefined &&
    evidence.costBudgetDefined &&
    evidence.safetyValidationDefined &&
    evidence.releaseGateDefined &&
    evidence.validationEvidenceDefined &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.aiProviderRuntimeConnected === false &&
    evidence.promptContextRuntimeConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false;
}

function metricScore(
  metrics: AiQualityObservedMetric[],
  dimension: AiQualityObservedMetric["dimension"],
): number | undefined {
  return metrics.find((metric) => metric.dimension === dimension)?.score;
}

function severityRank(severity: AiQualitySeveritySummary["highestSeverity"]): number {
  if (severity === "blocking") {
    return 3;
  }

  if (severity === "warning") {
    return 2;
  }

  if (severity === "info") {
    return 1;
  }

  return 0;
}

function incrementSeverity(
  summary: AiQualitySeveritySummary,
  severity: AiQualityFailureSeverity,
): AiQualitySeveritySummary {
  const next = {
    ...summary,
    [severity]: summary[severity] + 1,
  };

  return {
    ...next,
    highestSeverity:
      severityRank(severity) > severityRank(summary.highestSeverity)
        ? severity
        : summary.highestSeverity,
  };
}

function costBudgetExceeded(input: AiQualityValidationInputContract): boolean {
  return input.evidence.cost.estimatedCostMinorUnits >
    input.costBudget.maxEstimatedCostMinorUnits ||
    input.evidence.cost.estimatedTokens > input.costBudget.maxEstimatedTokens ||
    input.evidence.cost.billingConnected !== false;
}

function safetyGateFailed(input: AiQualityValidationInputContract): boolean {
  return input.safety.allowChatMode ||
    input.safety.allowAnswerEngineMode ||
    input.safety.allowUnsafeAdvice ||
    input.safety.allowSensitivePersonalData ||
    input.safety.allowPromptInjection ||
    input.safety.allowRawPromptPersistence ||
    input.safety.allowModelCalls ||
    input.evidence.safety.modelCallExecuted ||
    !input.evidence.safety.decisionSimulationInvariantPreserved ||
    !input.evidence.safety.failClosedPosturePreserved;
}

function aggregateSeverity(
  input: AiQualityValidationInputContract,
  contractResult?: AiQualityEvaluationResult,
): AiQualitySeveritySummary {
  let summary = EMPTY_SEVERITY_SUMMARY;

  for (const criterion of input.evaluation.criteria) {
    const score = metricScore(input.evidence.quality, criterion.dimension);

    if (score != null && score < criterion.minScore) {
      summary = incrementSeverity(summary, criterion.severityOnFail);
    }
  }

  if (costBudgetExceeded(input)) {
    summary = incrementSeverity(summary, "blocking");
  }

  if (safetyGateFailed(input)) {
    summary = incrementSeverity(summary, "blocking");
  }

  if (contractResult?.status === "blocked") {
    summary = incrementSeverity(summary, contractResult.error.severity);
  }

  return summary;
}

export function evaluateAiQualityRuntime(
  config: AiQualityRuntimeConfig,
  input: AiQualityRuntimeEvaluationInput,
): AiQualityRuntimeEvaluationResult {
  if (!config.enabled) {
    return blocked({
      reason: "ai_quality_runtime_disabled",
      message: "AI quality/cost/safety runtime foundation is disabled by default.",
    });
  }

  if (!input.validation) {
    return blocked({
      reason: "validation_missing",
      message: "AI quality/cost/safety runtime requires validation input.",
    });
  }

  const contractResult = config.contracts.evaluateValidation(input.validation);
  const severitySummary = aggregateSeverity(input.validation, contractResult);

  if (!contractEvidenceIsIsolated(contractResult)) {
    return blocked({
      reason: "contracts_isolation_failed",
      message:
        "AI quality/cost/safety contracts result did not preserve isolation evidence.",
      severitySummary,
      contractResult,
    });
  }

  if (contractResult.status === "blocked") {
    return blocked({
      reason: contractResult.error.code,
      message: contractResult.error.message,
      severitySummary,
      contractResult,
    });
  }

  if (contractResult.releaseGateStatus !== "approved_for_foundation_preflight") {
    return blocked({
      reason: "release_gate_decision_failed",
      message: "AI quality/cost/safety release gate did not approve preflight.",
      severitySummary,
      contractResult,
    });
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: AI_QUALITY_RUNTIME_VERSION,
    releaseGateDecision: "approved_for_foundation_preflight",
    weightedQualityScore: contractResult.weightedQualityScore,
    severitySummary,
    contractResult,
    evidence: aiQualityRuntimeSafetyEvidence(),
  };
}

export function createAiQualityRuntimeFoundation(
  config: AiQualityRuntimeConfig = DEFAULT_AI_QUALITY_RUNTIME_CONFIG,
): AiQualityRuntimeFoundation {
  return {
    version: AI_QUALITY_RUNTIME_VERSION,
    mode: AI_QUALITY_RUNTIME_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    evaluate: (input) => evaluateAiQualityRuntime(config, input),
  };
}
