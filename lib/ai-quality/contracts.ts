export const AI_QUALITY_CONTRACTS_VERSION =
  "5.3A-ai-quality-cost-safety-contracts-foundation.1" as const;
export const AI_QUALITY_CONTRACTS_MODE =
  "ai_quality_cost_safety_contracts_foundation_only" as const;
export const AI_QUALITY_RUNTIME_VERSION =
  "5.3B-ai-quality-cost-safety-runtime-foundation.1" as const;
export const AI_QUALITY_RUNTIME_MODE =
  "ai_quality_cost_safety_runtime_foundation_only" as const;

export type AiQualityContractsVersion = typeof AI_QUALITY_CONTRACTS_VERSION;
export type AiQualityContractsMode = typeof AI_QUALITY_CONTRACTS_MODE;
export type AiQualityRuntimeVersion = typeof AI_QUALITY_RUNTIME_VERSION;
export type AiQualityRuntimeMode = typeof AI_QUALITY_RUNTIME_MODE;

export type AiQualityValidationScope =
  "decision_simulation_ai_quality_cost_safety";

export type AiQualityEvaluationDimension =
  | "decision_simulation_fidelity"
  | "scenario_tradeoff_coverage"
  | "risk_consequence_coverage"
  | "uncertainty_calibration"
  | "structured_output_integrity";

export type AiQualityScoreBand =
  | "pass"
  | "warning"
  | "fail";

export type AiQualityFailureSeverity =
  | "info"
  | "warning"
  | "blocking";

export type AiQualityReleaseGateStatus =
  | "approved_for_foundation_preflight"
  | "blocked";

export type AiQualityCostCurrency = "USD" | "EUR";

export type AiQualityCostBudgetModel = {
  currency: AiQualityCostCurrency;
  maxEstimatedCostMinorUnits: number;
  maxEstimatedTokens: number;
  requireCostEvidence: true;
  enforcement: "foundation_validation_only";
};

export type AiQualityCostEvidenceModel = {
  currency: AiQualityCostCurrency;
  estimatedCostMinorUnits: number;
  maxEstimatedCostMinorUnits: number;
  estimatedTokens: number;
  maxEstimatedTokens: number;
  costLimitEnforced: true;
  billingConnected: false;
};

export type AiQualityEvaluationCriterion = {
  dimension: AiQualityEvaluationDimension;
  minScore: number;
  weight: number;
  severityOnFail: AiQualityFailureSeverity;
};

export type AiQualityEvaluationModel = {
  evaluationId: string;
  scope: AiQualityValidationScope;
  criteria: AiQualityEvaluationCriterion[];
  requireStructuredOutput: true;
  requireDecisionSimulationFrame: true;
  requireScenarioTradeoffRiskFrame: true;
};

export type AiQualityObservedMetric = {
  dimension: AiQualityEvaluationDimension;
  score: number;
  evidenceFingerprint: string;
};

export type AiQualitySafetyValidationModel = {
  allowChatMode: false;
  allowAnswerEngineMode: false;
  allowUnsafeAdvice: false;
  allowSensitivePersonalData: false;
  allowPromptInjection: false;
  allowRawPromptPersistence: false;
  allowModelCalls: false;
  requireDecisionSimulationInvariant: true;
  requireFailClosedPosture: true;
};

export type AiQualitySafetyEvidenceModel = {
  chatModeAllowed: false;
  answerEngineModeAllowed: false;
  unsafeAdviceAllowed: false;
  sensitivePersonalDataAllowed: false;
  promptInjectionAllowed: false;
  rawPromptPersistenceAllowed: false;
  modelCallExecuted: false;
  decisionSimulationInvariantPreserved: true;
  failClosedPosturePreserved: true;
};

export type AiQualityReleaseGateModel = {
  gateId: string;
  scope: AiQualityValidationScope;
  minWeightedQualityScore: number;
  blockOnAnyBlockingFailure: true;
  blockOnCostBudgetFailure: true;
  blockOnSafetyFailure: true;
  allowWarnings: true;
};

export type AiQualityValidationEvidenceModel = {
  evidenceId: string;
  evaluatedAt: string;
  source: "foundation_validation_catalog";
  quality: AiQualityObservedMetric[];
  cost: AiQualityCostEvidenceModel;
  safety: AiQualitySafetyEvidenceModel;
};

export type AiQualityValidationInputContract = {
  validationId: string;
  evaluation: AiQualityEvaluationModel;
  costBudget: AiQualityCostBudgetModel;
  safety: AiQualitySafetyValidationModel;
  releaseGate: AiQualityReleaseGateModel;
  evidence: AiQualityValidationEvidenceModel;
  clientRuntimeFields?: {
    apiKey?: string;
    envVarName?: string;
    rawPrompt?: string;
    providerPayload?: string;
    modelCallPayload?: string;
  };
};

export type AiQualityErrorCode =
  | "ai_quality_contracts_disabled"
  | "validation_id_missing"
  | "evaluation_scope_invalid"
  | "criteria_missing"
  | "criteria_invalid"
  | "quality_metric_missing"
  | "quality_score_invalid"
  | "quality_threshold_failed"
  | "cost_budget_invalid"
  | "cost_budget_exceeded"
  | "safety_model_invalid"
  | "safety_evidence_invalid"
  | "release_gate_invalid"
  | "release_gate_blocked"
  | "timestamp_invalid"
  | "client_runtime_field_rejected";

export type AiQualityError = {
  code: AiQualityErrorCode;
  message: string;
  severity: AiQualityFailureSeverity;
  recoverable: false;
};

export type AiQualityContractsConfig = {
  enabled: boolean;
  defaultReleaseGate: AiQualityReleaseGateModel;
};

export type AiQualityContractsSafetyEvidence = {
  stage: "5.3A";
  aiQualityOnly: true;
  contractsOnly: true;
  foundationOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  qualityEvaluationDefined: true;
  costBudgetDefined: true;
  safetyValidationDefined: true;
  releaseGateDefined: true;
  validationEvidenceDefined: true;
  modelCallExecuted: false;
  openAiSdkConnected: false;
  apiKeysRead: false;
  envVariablesRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  aiProviderRuntimeConnected: false;
  promptContextRuntimeConnected: false;
  databaseConnected: false;
  supabaseConnected: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  subscriptionsRuntimeConnected: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  rollback: "disable_ai_quality_contracts_or_remove_ai_quality_exports";
};

export type AiQualityAllowedEvaluation = {
  status: "allowed";
  execution: "contract_validation_only";
  version: AiQualityContractsVersion;
  releaseGateStatus: "approved_for_foundation_preflight";
  weightedQualityScore: number;
  evidence: AiQualityContractsSafetyEvidence;
};

export type AiQualityBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: AiQualityContractsVersion;
  releaseGateStatus: "blocked";
  error: AiQualityError;
  evidence: AiQualityContractsSafetyEvidence;
};

export type AiQualityEvaluationResult =
  | AiQualityAllowedEvaluation
  | AiQualityBlockedEvaluation;

export type AiQualityContractsFoundation = {
  version: AiQualityContractsVersion;
  mode: AiQualityContractsMode;
  enabled: boolean;
  modelCallsEnabled: false;
  evaluateValidation(
    input: AiQualityValidationInputContract,
  ): AiQualityEvaluationResult;
};

export type AiQualityValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: AiQualityEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiQualityValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AiQualityValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type AiQualityRuntimeConfig = {
  enabled: boolean;
  contracts: AiQualityContractsFoundation;
  failClosedOnContractBlock: true;
};

export type AiQualityRuntimeBlockedReason =
  | AiQualityErrorCode
  | "ai_quality_runtime_disabled"
  | "validation_missing"
  | "contracts_isolation_failed"
  | "release_gate_decision_failed";

export type AiQualitySeveritySummary = {
  info: number;
  warning: number;
  blocking: number;
  highestSeverity: AiQualityFailureSeverity | "none";
};

export type AiQualityRuntimeSafetyEvidence = {
  stage: "5.3B";
  aiQualityOnly: true;
  runtimeFoundationOnly: true;
  contractsFoundationUsed: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  qualityGateEvaluated: true;
  costBudgetEvaluated: true;
  safetyGateEvaluated: true;
  releaseGateEvaluated: true;
  severityAggregated: true;
  modelCallExecuted: false;
  openAiSdkConnected: false;
  apiKeysRead: false;
  envVariablesRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  aiProviderRuntimeConnected: false;
  promptContextRuntimeConnected: false;
  databaseConnected: false;
  supabaseConnected: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  subscriptionsRuntimeConnected: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  stage53CStarted: false;
  rollback: "disable_ai_quality_runtime_or_remove_runtime_exports";
};

export type AiQualityRuntimeEvaluationInput = {
  validation?: AiQualityValidationInputContract | null;
};

export type AiQualityRuntimeAllowedDecision = {
  status: "allowed";
  execution: "preflight_only";
  version: AiQualityRuntimeVersion;
  releaseGateDecision: "approved_for_foundation_preflight";
  weightedQualityScore: number;
  severitySummary: AiQualitySeveritySummary;
  contractResult: AiQualityAllowedEvaluation;
  evidence: AiQualityRuntimeSafetyEvidence;
};

export type AiQualityRuntimeBlockedDecision = {
  status: "blocked";
  execution: "none";
  version: AiQualityRuntimeVersion;
  releaseGateDecision: "blocked";
  reason: AiQualityRuntimeBlockedReason;
  message: string;
  severitySummary: AiQualitySeveritySummary;
  contractResult?: AiQualityEvaluationResult;
  evidence: AiQualityRuntimeSafetyEvidence;
};

export type AiQualityRuntimeEvaluationResult =
  | AiQualityRuntimeAllowedDecision
  | AiQualityRuntimeBlockedDecision;

export type AiQualityRuntimeFoundation = {
  version: AiQualityRuntimeVersion;
  mode: AiQualityRuntimeMode;
  enabled: boolean;
  modelCallsEnabled: false;
  evaluate(
    input: AiQualityRuntimeEvaluationInput,
  ): AiQualityRuntimeEvaluationResult;
};

export type AiQualityRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: AiQualityRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiQualityRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AiQualityRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
