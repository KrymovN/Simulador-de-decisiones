import type {
  ClarificationEngineResult,
  CompletenessAssessment,
  CompletenessTraceEntry,
  ConfidenceAssessment,
  ContractVersion,
  ControlledFailure,
  DecisionEngineConfidenceSummary,
  DecisionEngineInputValidation,
  DecisionEngineOrchestratorTraceEntry,
  DecisionContext,
  DecisionEngineTrace,
  DecisionInput,
  DetectedCriticalGap,
  DeterministicRecommendation,
  DeterministicRiskAssessment,
  DeterministicScenario,
  EvidenceRef,
  SafetyBoundary,
  SimulationResponseMappingTraceEntry,
} from "./types";

export const CONTRACT_VERSION: ContractVersion = "2.0";

export const DECISION_ENGINE_STATUSES = [
  "clarification_required",
  "analysis_ready",
  "limited_analysis",
  "cannot_recommend",
  "refused",
  "failed",
] as const;

export type DecisionEngineStatus = (typeof DECISION_ENGINE_STATUSES)[number];

export type DecisionEngineResult = {
  contractVersion: ContractVersion;
  resultId: string;
  requestId: string;
  status: DecisionEngineStatus;
  input: DecisionInput;
  context?: DecisionContext;
  inputValidation: DecisionEngineInputValidation;
  completeness: CompletenessAssessment;
  completenessTrace: CompletenessTraceEntry[];
  confidence: ConfidenceAssessment;
  confidenceSummary: DecisionEngineConfidenceSummary;
  gaps: DetectedCriticalGap[];
  contradictions: DetectedCriticalGap[];
  clarification: ClarificationEngineResult;
  scenarios: DeterministicScenario[];
  risks: DeterministicRiskAssessment[];
  recommendations: DeterministicRecommendation[];
  safety: SafetyBoundary;
  trace: DecisionEngineTrace;
  orchestratorTrace: DecisionEngineOrchestratorTraceEntry[];
  controlledFailures: ControlledFailure[];
  failure?: ControlledFailure;
};

export type SimulationResponseV2Draft = {
  contractVersion: ContractVersion;
  responseId: string;
  requestId: string;
  generatedAt: string;
  status: DecisionEngineStatus;
  language: {
    input: string;
    output: string;
  };
  decision: {
    statement: string;
    decisionTypes: string[];
    primaryGoal?: string;
    secondaryGoals: string[];
    optionSummaries: {
      id: string;
      label: string;
      type: "action" | "delay" | "no_action" | "information_gathering";
      feasibility: "feasible" | "infeasible" | "unknown";
    }[];
    keyConstraints: string[];
    timeHorizonSummary?: string;
  };
  modelQuality: {
    completeness: {
      score: number;
      band: string;
      blockingDimensions: string[];
      explanation: string;
    };
    confidence: {
      score: number;
      band: string;
      explanation: string;
      limitations: string[];
      calibration: "model_quality_not_probability";
      stages: DecisionEngineConfidenceSummary;
    };
  };
  gaps: DetectedCriticalGap[];
  contradictions: DetectedCriticalGap[];
  clarification?: ClarificationEngineResult["decision"];
  analysis?: {
    assumptions: NonNullable<DecisionContext["assumptions"]>;
    scenarios: DeterministicScenario[];
    risks: DeterministicRiskAssessment[];
  };
  recommendation?: DeterministicRecommendation;
  safety: {
    level: SafetyBoundary["level"];
    domain: SafetyBoundary["domain"];
    recommendationAllowed: boolean;
    message: string;
    suggestedSupport: string[];
    prohibitedOutputs: string[];
  };
  availability: {
    scenarios: RuntimeAvailability;
    risks: RuntimeAvailability;
    recommendation: RuntimeAvailability;
  };
  traceability: {
    evidence: EvidenceRef[];
    policyVersion: string;
    inputValidation: DecisionEngineInputValidation;
    completeness: CompletenessTraceEntry[];
    gaps: DetectedCriticalGap[];
    contradictions: DetectedCriticalGap[];
    clarification: ClarificationEngineResult["traceEntries"];
    scenarios: DeterministicScenario["traceEntries"];
    risks: DeterministicRiskAssessment["traceEntries"];
    recommendations: DeterministicRecommendation["traceEntries"];
    orchestrator: DecisionEngineOrchestratorTraceEntry[];
    responseMapping: SimulationResponseMappingTraceEntry[];
  };
  notices: {
    code:
      | "uncertainty"
      | "limited_context"
      | "high_stakes"
      | "professional_review"
      | "accepted_unknown"
      | "technical_limitation";
    severity: "info" | "warning" | "critical";
    message: string;
  }[];
  controlledFailures: ControlledFailure[];
  failure?: ControlledFailure;
};

export type RuntimeAvailability = {
  status: "available" | "unavailable" | "blocked" | "not_applicable";
  reasons: string[];
};
