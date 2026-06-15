import type { DecisionEngineStatus, RuntimeAvailability } from "./contracts";
import type {
  RecommendationCategory,
  RecommendationPriority,
  RiskLevel,
  ScenarioPerspective,
} from "./types";

export const SIMULATION_RESPONSE_V2_UI_MAPPING_VERSION = "1.0" as const;
export const SIMULATION_RESPONSE_V2_UI_MAPPING_MODE = "internal_v2_ui_mapping" as const;

export type SimulationResponseV2UiMappingVersion =
  typeof SIMULATION_RESPONSE_V2_UI_MAPPING_VERSION;
export type SimulationResponseV2UiMappingMode =
  typeof SIMULATION_RESPONSE_V2_UI_MAPPING_MODE;

export type SimulationResponseV2UiRenderState =
  | "loading"
  | "empty"
  | "clarification"
  | "ready"
  | "limited"
  | "cannot_recommend"
  | "refused"
  | "controlled_failure";

export type SimulationResponseV2UiSectionId =
  | "status"
  | "decision_summary"
  | "model_quality"
  | "clarification"
  | "scenarios"
  | "risks"
  | "consequences"
  | "recommendation"
  | "safety"
  | "notices"
  | "traceability";

export type SimulationResponseV2UiSectionState =
  | RuntimeAvailability["status"]
  | "loading"
  | "empty";

export type SimulationResponseV2UiSection<T> = {
  id: SimulationResponseV2UiSectionId;
  state: SimulationResponseV2UiSectionState;
  reasons: string[];
  items: T[];
};

export type SimulationResponseV2UiStatus = {
  lifecycle: DecisionEngineStatus | "loading" | "empty";
  tone: "neutral" | "information" | "warning" | "restricted" | "failure";
  message: string;
};

export type SimulationResponseV2UiDecisionSummary = {
  statement: string;
  primaryGoal?: string;
  secondaryGoals: string[];
  options: {
    id: string;
    label: string;
    type: string;
    feasibility: string;
  }[];
  constraints: string[];
  timeHorizon?: string;
};

export type SimulationResponseV2UiModelQuality = {
  completeness: {
    score: number;
    band: string;
    explanation: string;
    blockingDimensions: string[];
  };
  confidence: {
    score: number;
    band: string;
    explanation: string;
    limitations: string[];
    calibration: "model_quality_not_probability";
  };
};

export type SimulationResponseV2UiClarification = {
  reason: string;
  canProceedWithoutAnswers: boolean;
  proceedWithoutAnswersEffect?: string;
  questions: {
    id: string;
    text: string;
    answerType: string;
    required: boolean;
    whyItMatters: string;
    resolvesGapIds: string[];
  }[];
};

export type SimulationResponseV2UiScenario = {
  id: string;
  optionId: string;
  optionLabel: string;
  perspective: ScenarioPerspective;
  canonicalType: string;
  assumptionIds: string[];
  triggerConditions: string[];
  uncertaintyReasons: string[];
  confidence: {
    score: number;
    band: string;
    explanation: string;
  };
};

export type SimulationResponseV2UiRisk = {
  id: string;
  scenarioId: string;
  optionId: string;
  level: RiskLevel;
  riskTypes: string[];
  comparativeProbability: {
    score: number;
    band: string;
    explanation: string;
    calibration: "comparative_not_calibrated";
  };
  impactSeverity: number;
  reversibility: string;
  uncertainty: number;
  costOfError: string;
  confidence: number;
};

export type SimulationResponseV2UiConsequence = {
  id: string;
  scenarioId: string;
  optionId: string;
  category: string;
  state: string;
  sourceEntityId: string;
};

export type SimulationResponseV2UiRecommendation = {
  id: string;
  status: "recommended" | "conditional" | "defer" | "withheld";
  category: RecommendationCategory;
  priority: RecommendationPriority;
  preferredOptionId?: string;
  preferredOptionLabel?: string;
  requiredConditions: string[];
  blockingConditions: string[];
  rationale: {
    criterion: string;
    priority: RecommendationPriority;
    score: number;
    explanation: string;
  }[];
  confidence: {
    score: number;
    band: string;
    explanation: string;
  };
};

export type SimulationResponseV2UiSafety = {
  level: string;
  domain: string;
  recommendationAllowed: boolean;
  message: string;
  suggestedSupport: string[];
};

export type SimulationResponseV2UiNotice = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type SimulationResponseV2UiTraceability = {
  policyVersion: string;
  evidenceCount: number;
  gapCount: number;
  contradictionCount: number;
};

export type SimulationResponseV2UiMappingEvidence = {
  sourceContract: "SimulationResponseV2Draft";
  targetContract: "SimulationResponseV2UiModel";
  v1CoercionUsed: false;
  deterministicRuntimeExecuted: false;
  sandboxExposed: false;
  publicRuntimeTouched: false;
  publicApiTouched: false;
  persistenceUsed: false;
};

export type SimulationResponseV2UiModel = {
  mappingVersion: SimulationResponseV2UiMappingVersion;
  mode: SimulationResponseV2UiMappingMode;
  renderState: SimulationResponseV2UiRenderState;
  requestId?: string;
  responseId?: string;
  generatedAt?: string;
  responseStatus?: DecisionEngineStatus;
  sections: {
    status: SimulationResponseV2UiSection<SimulationResponseV2UiStatus>;
    decisionSummary: SimulationResponseV2UiSection<SimulationResponseV2UiDecisionSummary>;
    modelQuality: SimulationResponseV2UiSection<SimulationResponseV2UiModelQuality>;
    clarification: SimulationResponseV2UiSection<SimulationResponseV2UiClarification>;
    scenarios: SimulationResponseV2UiSection<SimulationResponseV2UiScenario>;
    risks: SimulationResponseV2UiSection<SimulationResponseV2UiRisk>;
    consequences: SimulationResponseV2UiSection<SimulationResponseV2UiConsequence>;
    recommendation: SimulationResponseV2UiSection<SimulationResponseV2UiRecommendation>;
    safety: SimulationResponseV2UiSection<SimulationResponseV2UiSafety>;
    notices: SimulationResponseV2UiSection<SimulationResponseV2UiNotice>;
    traceability: SimulationResponseV2UiSection<SimulationResponseV2UiTraceability>;
  };
  mappingErrors: string[];
  evidence: SimulationResponseV2UiMappingEvidence;
};

export type SimulationResponseV2UiMappingValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualState: SimulationResponseV2UiRenderState;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SimulationResponseV2UiMappingValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SimulationResponseV2UiMappingValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
