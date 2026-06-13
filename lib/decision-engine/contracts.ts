import type {
  ClarificationDecision,
  CompletenessAssessment,
  ConfidenceAssessment,
  ContractVersion,
  ControlledFailure,
  CriticalGap,
  DecisionContext,
  DecisionEngineTrace,
  DecisionInput,
  EvidenceRef,
  Recommendation,
  SafetyBoundary,
  Scenario,
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
  completeness: CompletenessAssessment;
  confidence: ConfidenceAssessment;
  gaps: CriticalGap[];
  clarification: ClarificationDecision;
  scenarios: Scenario[];
  recommendation?: Recommendation;
  safety: SafetyBoundary;
  trace: DecisionEngineTrace;
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
    primaryGoal?: string;
    optionSummaries: {
      id: string;
      label: string;
      type: "action" | "delay" | "no_action" | "information_gathering";
      feasibility: "feasible" | "infeasible" | "unknown";
    }[];
  };
  modelQuality: {
    completeness: CompletenessAssessment;
    confidence: ConfidenceAssessment;
  };
  gaps: CriticalGap[];
  clarification?: ClarificationDecision;
  analysis?: {
    scenarios: Scenario[];
    uncertaintySummary: string;
  };
  recommendation?: Recommendation;
  safety: SafetyBoundary;
  traceability: {
    evidence: EvidenceRef[];
    policyVersion: string;
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
  failure?: ControlledFailure;
};
