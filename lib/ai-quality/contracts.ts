export const AI_QUALITY_CONTRACTS_VERSION =
  "5.3A-ai-quality-cost-safety-contracts-foundation.1" as const;
export const AI_QUALITY_CONTRACTS_MODE =
  "ai_quality_cost_safety_contracts_foundation_only" as const;
export const AI_QUALITY_RUNTIME_VERSION =
  "5.3B-ai-quality-cost-safety-runtime-foundation.1" as const;
export const AI_QUALITY_RUNTIME_MODE =
  "ai_quality_cost_safety_runtime_foundation_only" as const;
export const AI_QUALITY_BOUNDARY_VERSION =
  "5.3C-ai-quality-cost-safety-runtime-boundary.1" as const;
export const AI_QUALITY_BOUNDARY_MODE =
  "ai_quality_cost_safety_runtime_boundary_only" as const;

export type AiQualityContractsVersion = typeof AI_QUALITY_CONTRACTS_VERSION;
export type AiQualityContractsMode = typeof AI_QUALITY_CONTRACTS_MODE;
export type AiQualityRuntimeVersion = typeof AI_QUALITY_RUNTIME_VERSION;
export type AiQualityRuntimeMode = typeof AI_QUALITY_RUNTIME_MODE;
export type AiQualityBoundaryVersion = typeof AI_QUALITY_BOUNDARY_VERSION;
export type AiQualityBoundaryMode = typeof AI_QUALITY_BOUNDARY_MODE;

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
  allowGenericAssistantMode?: false;
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
  genericAssistantModeAllowed?: false;
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
  | "output_contract_invalid"
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
  genericAssistantBehaviorAllowed: false;
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

export type AiQualityValidationOutputContract = AiQualityEvaluationResult;

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

export type AIQualityContractsVersion = AiQualityContractsVersion;
export type AIQualityContractsMode = AiQualityContractsMode;
export type AIQualityValidationScope = AiQualityValidationScope;
export type AIQualityEvaluationDimension = AiQualityEvaluationDimension;
export type AIQualityScoreBand = AiQualityScoreBand;
export type AIQualityFailureSeverity = AiQualityFailureSeverity;
export type AIQualityReleaseGateStatus = AiQualityReleaseGateStatus;
export type AIQualityCostCurrency = AiQualityCostCurrency;
export type AIQualityCostBudgetModel = AiQualityCostBudgetModel;
export type AIQualityCostEvidenceModel = AiQualityCostEvidenceModel;
export type AIQualityEvaluationCriterion = AiQualityEvaluationCriterion;
export type AIQualityEvaluationModel = AiQualityEvaluationModel;
export type AIQualityObservedMetric = AiQualityObservedMetric;
export type AIQualitySafetyValidationModel = AiQualitySafetyValidationModel;
export type AIQualitySafetyEvidenceModel = AiQualitySafetyEvidenceModel;
export type AIQualityReleaseGateModel = AiQualityReleaseGateModel;
export type AIQualityValidationEvidenceModel = AiQualityValidationEvidenceModel;
export type AIQualityValidationInputContract = AiQualityValidationInputContract;
export type AIQualityValidationOutputContract = AiQualityValidationOutputContract;
export type AIQualityErrorCode = AiQualityErrorCode;
export type AIQualityError = AiQualityError;
export type AIQualityContractsConfig = AiQualityContractsConfig;
export type AIQualityContractsSafetyEvidence = AiQualityContractsSafetyEvidence;
export type AIQualityAllowedEvaluation = AiQualityAllowedEvaluation;
export type AIQualityBlockedEvaluation = AiQualityBlockedEvaluation;
export type AIQualityEvaluationResult = AiQualityEvaluationResult;
export type AIQualityContractsFoundation = AiQualityContractsFoundation;
export type AIQualityValidationCaseResult = AiQualityValidationCaseResult;
export type AIQualityValidationResult = AiQualityValidationResult;

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

export type AiQualityRuntimeError = {
  code: AiQualityRuntimeBlockedReason;
  message: string;
  recoverable: false;
};

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
  genericAssistantBehaviorAllowed: false;
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
  error: AiQualityRuntimeError;
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

export type AIQualityRuntimeVersion = AiQualityRuntimeVersion;
export type AIQualityRuntimeMode = AiQualityRuntimeMode;
export type AIQualityRuntimeConfig = AiQualityRuntimeConfig;
export type AIQualityRuntimeError = AiQualityRuntimeError;
export type AIQualityRuntimeBlockedReason = AiQualityRuntimeBlockedReason;
export type AIQualitySeveritySummary = AiQualitySeveritySummary;
export type AIQualityRuntimeSafetyEvidence = AiQualityRuntimeSafetyEvidence;
export type AIQualityRuntimeRequest = AiQualityRuntimeEvaluationInput;
export type AIQualityRuntimeResult = AiQualityRuntimeEvaluationResult;
export type AIQualityRuntimeEvaluationInput = AiQualityRuntimeEvaluationInput;
export type AIQualityRuntimeEvaluationResult = AiQualityRuntimeEvaluationResult;
export type AIQualityRuntimeAllowedDecision = AiQualityRuntimeAllowedDecision;
export type AIQualityRuntimeBlockedDecision = AiQualityRuntimeBlockedDecision;
export type AIQualityRuntimeFoundation = AiQualityRuntimeFoundation;
export type AIQualityRuntimeValidationCaseResult =
  AiQualityRuntimeValidationCaseResult;
export type AIQualityRuntimeValidationResult = AiQualityRuntimeValidationResult;

export type AiQualityBoundaryOperation = "ai_quality_runtime_preflight";

export type AiQualityBoundaryConfig = {
  enabled: boolean;
  allowedOperations: AiQualityBoundaryOperation[];
  runtime: AiQualityRuntimeFoundation;
};

export type AiQualityBoundaryBlockedReason =
  | AiQualityRuntimeBlockedReason
  | "ai_quality_boundary_disabled"
  | "operation_missing"
  | "operation_not_supported"
  | "operation_not_allowed"
  | "payload_missing"
  | "payload_mismatch"
  | "runtime_isolation_failed";

export type AiQualityBoundarySafetyEvidence = {
  stage: "5.3C";
  aiQualityOnly: true;
  boundaryOnly: true;
  facadeOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  allowedOperationsExplicit: true;
  payloadIsolationEnforced: true;
  runtimeIsolationEnforced: true;
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
  stage53DStarted: false;
  rollback: "disable_ai_quality_boundary_or_remove_boundary_exports";
};

export type AiQualityBoundaryEvaluationInput = {
  operation?: AiQualityBoundaryOperation | string;
  runtime?: AiQualityRuntimeEvaluationInput | null;
  unexpectedPayload?: unknown;
};

export type AiQualityBoundaryAllowedDecision = {
  status: "allowed";
  execution: "boundary_preflight_only";
  version: AiQualityBoundaryVersion;
  operation: AiQualityBoundaryOperation;
  runtimeResult: AiQualityRuntimeAllowedDecision;
  evidence: AiQualityBoundarySafetyEvidence;
};

export type AiQualityBoundaryBlockedDecision = {
  status: "blocked";
  execution: "none";
  version: AiQualityBoundaryVersion;
  operation?: AiQualityBoundaryOperation | string;
  reason: AiQualityBoundaryBlockedReason;
  message: string;
  runtimeResult?: AiQualityRuntimeEvaluationResult;
  evidence: AiQualityBoundarySafetyEvidence;
};

export type AiQualityBoundaryEvaluationResult =
  | AiQualityBoundaryAllowedDecision
  | AiQualityBoundaryBlockedDecision;

export type AiQualityBoundaryFoundation = {
  version: AiQualityBoundaryVersion;
  mode: AiQualityBoundaryMode;
  enabled: boolean;
  modelCallsEnabled: false;
  allowedOperations: AiQualityBoundaryOperation[];
  evaluate(
    input: AiQualityBoundaryEvaluationInput,
  ): AiQualityBoundaryEvaluationResult;
};

export type AiQualityBoundaryValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: AiQualityBoundaryEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiQualityBoundaryValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AiQualityBoundaryValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
