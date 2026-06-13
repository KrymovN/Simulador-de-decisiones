export type ContractVersion = "2.0";
export type EntityId = string;

export type ScoreBand = "very_low" | "low" | "medium" | "high" | "very_high";

export type Score = {
  value: number;
  band: ScoreBand;
  rationale: string;
  evidenceRefs: EntityId[];
};

export type KnownValue<T> =
  | { status: "known"; value: T; evidenceRefs: EntityId[] }
  | { status: "unknown"; reason?: string }
  | { status: "not_applicable"; reason: string };

export type EvidenceSource =
  | "user_statement"
  | "user_answer"
  | "user_confirmed_memory"
  | "engine_inference"
  | "external_source";

export type EvidenceRef = {
  id: EntityId;
  source: EvidenceSource;
  sourceRecordId?: EntityId;
  claim: string;
  reliability: "unverified" | "low" | "medium" | "high";
  userConfirmed: boolean;
};

export type DecisionIntent = "explore" | "compare" | "recommend" | "review";
export type DecisionType =
  | "binary"
  | "comparative"
  | "timing"
  | "resource_allocation"
  | "strategic_direction"
  | "risk_response"
  | "interpersonal"
  | "exploratory";

export type DecisionInput = {
  contractVersion: ContractVersion;
  requestId: EntityId;
  input: {
    originalText: string;
    inputLanguage: string;
    requestedOutputLanguage: string;
  };
  userIntent: DecisionIntent;
  suppliedContext?: EvidenceRef[];
  suppliedOptions?: DecisionOption[];
  preferences?: {
    riskTolerance?: "low" | "moderate" | "high";
    timePreference?: "short_term" | "balanced" | "long_term";
    excludedActions?: string[];
  };
};

export type Goal = {
  id: EntityId;
  description: string;
  priority: "primary" | "secondary";
  successCriteria: KnownValue<string[]>;
  evidenceRefs: EntityId[];
};

export type DecisionOption = {
  id: EntityId;
  label: string;
  description: string;
  type: "action" | "delay" | "no_action" | "information_gathering";
  userProposed: boolean;
  feasible: KnownValue<boolean>;
  excludedReason?: string;
  evidenceRefs: EntityId[];
};

export type Constraint = {
  id: EntityId;
  description: string;
  kind:
    | "non_negotiable"
    | "financial"
    | "time"
    | "legal"
    | "ethical"
    | "health"
    | "relationship"
    | "resource"
    | "other";
  severity: "blocking" | "material" | "preference";
  appliesToOptionIds: EntityId[];
  evidenceRefs: EntityId[];
};

export type DecisionVariable = {
  id: EntityId;
  name: string;
  description: string;
  value: KnownValue<string | number | boolean>;
  materiality: "critical" | "important" | "supporting";
  volatility: "stable" | "changeable" | "unknown";
  affectedOptionIds: EntityId[];
};

export type Stakeholder = {
  id: EntityId;
  role: string;
  interests: KnownValue<string[]>;
  influence: "low" | "medium" | "high" | "unknown";
  impactExposure: "low" | "medium" | "high" | "unknown";
  evidenceRefs: EntityId[];
};

export type TimeHorizon = {
  decisionDeadline: KnownValue<string>;
  shortTermWindow: KnownValue<string>;
  longTermWindow: KnownValue<string>;
  delayCost: KnownValue<string>;
  reversibilityWindow: KnownValue<string>;
};

export type Assumption = {
  id: EntityId;
  statement: string;
  source: "user" | "engine";
  materiality: "critical" | "important" | "supporting";
  validationStatus: "unvalidated" | "partially_validated" | "validated" | "contradicted";
  affectedEntityIds: EntityId[];
  evidenceRefs: EntityId[];
};

export type DecisionContext = {
  decisionId: EntityId;
  decisionTypes: DecisionType[];
  statement: string;
  goals: Goal[];
  options: DecisionOption[];
  constraints: Constraint[];
  variables: DecisionVariable[];
  stakeholders: Stakeholder[];
  timeHorizon: TimeHorizon;
  assumptions: Assumption[];
  evidence: EvidenceRef[];
};

export type CompletenessLevel = "insufficient" | "limited" | "usable" | "strong";

export type CompletenessAssessment = {
  level: CompletenessLevel;
  overall: Score;
  dimensions: {
    goal: Score;
    options: Score;
    constraints: Score;
    variables: Score;
    stakeholders: Score;
    timeHorizon: Score;
    risks: Score;
    benefits: Score;
    assumptions: Score;
  };
  blockingDimensions: string[];
};

export type GapSeverity = "critical" | "important" | "optional";

export type CriticalGap = {
  id: EntityId;
  category:
    | "goal"
    | "option"
    | "constraint"
    | "variable"
    | "stakeholder"
    | "time_horizon"
    | "risk"
    | "benefit"
    | "assumption"
    | "contradiction"
    | "safety";
  description: string;
  severity: GapSeverity;
  reason: string;
  affectedEntityIds: EntityId[];
  recommendationImpact: "could_reverse" | "could_change" | "could_refine" | "no_material_change";
  resolution: "unresolved" | "question_pending" | "resolved" | "accepted_unknown";
  questionId?: EntityId;
};

export type ClarificationAnswerType =
  | "free_text"
  | "single_select"
  | "multi_select"
  | "number"
  | "date"
  | "boolean";

export type ClarificationQuestion = {
  id: EntityId;
  text: string;
  answerType: ClarificationAnswerType;
  required: boolean;
  resolvesGapIds: EntityId[];
  options?: { value: string; label: string }[];
  whyItMatters: string;
};

export type ClarificationDecision = {
  action: "not_required" | "ask" | "proceed_limited" | "withhold" | "refuse";
  reason: string;
  questions: ClarificationQuestion[];
  canProceedWithoutAnswers: boolean;
  proceedWithoutAnswersEffect?: string;
};

export type ScenarioType =
  | "base_case"
  | "favorable"
  | "adverse"
  | "delay"
  | "no_action"
  | "information_first";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ConfidenceAssessment = {
  overall: Score;
  factors: {
    goalClarity: Score;
    evidenceQuality: Score;
    variableCoverage: Score;
    assumptionReliability: Score;
    contradictionLevel: Score;
    externalUncertainty: Score;
  };
  limitations: string[];
};

export type Consequence = {
  id: EntityId;
  description: string;
  domain:
    | "financial"
    | "career"
    | "health"
    | "relationship"
    | "time"
    | "emotional"
    | "strategic"
    | "operational"
    | "other";
  direction: "positive" | "negative" | "mixed";
  magnitude: "low" | "medium" | "high";
  evidenceRefs: EntityId[];
};

export type RiskAssessment = {
  id: EntityId;
  description: string;
  type: "direct" | "indirect" | "dependency" | "delayed" | "execution" | "emotional";
  level: RiskLevel;
  likelihood: Score;
  impact: Score;
  reversibility: Score;
  detectability: Score;
  exposureDuration: KnownValue<string>;
  mitigationActions: string[];
  evidenceRefs: EntityId[];
};

export type BenefitAssessment = {
  id: EntityId;
  description: string;
  type: "immediate" | "long_term" | "optionality" | "learning" | "reversibility" | "goal_alignment";
  magnitude: Score;
  likelihood: Score;
  durability: Score;
  evidenceRefs: EntityId[];
};

export type Scenario = {
  id: EntityId;
  title: string;
  optionId: EntityId;
  scenarioType: ScenarioType;
  summary: string;
  triggerConditions: string[];
  assumptionIds: EntityId[];
  shortTermEffects: Consequence[];
  delayedEffects: Consequence[];
  risks: RiskAssessment[];
  benefits: BenefitAssessment[];
  indicatorsToMonitor: {
    id: EntityId;
    description: string;
    signalType: "positive" | "warning" | "stop";
    observationWindow: KnownValue<string>;
  }[];
  reversibility: {
    level: "easy" | "moderate" | "difficult" | "irreversible" | "unknown";
    exitConditions: string[];
    estimatedExitCost: KnownValue<string>;
  };
  plausibility: Score;
  confidence: Score;
};

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export type Recommendation = {
  id: EntityId;
  status: "recommended" | "conditional" | "defer" | "withheld";
  preferredOptionId?: EntityId;
  summary: string;
  rationale: {
    criterion: string;
    importance: RecommendationPriority;
    favoredOptionId?: EntityId;
    explanation: string;
    evidenceRefs: EntityId[];
  }[];
  keyAssumptionIds: EntityId[];
  conditionsThatChangeRecommendation: string[];
  nextSteps: {
    action: string;
    purpose: string;
    urgency: "now" | "soon" | "later";
    reversibility: "reversible" | "partially_reversible" | "irreversible";
  }[];
  unresolvedGapIds: EntityId[];
  confidence: ConfidenceAssessment;
};

export type SafetyBoundary = {
  domain:
    | "general"
    | "medical"
    | "legal"
    | "financial"
    | "self_harm"
    | "violence"
    | "illegal_activity"
    | "other_high_stakes";
  level: "standard" | "elevated" | "restricted" | "refuse";
  recommendationAllowed: boolean;
  requiredNotices: string[];
  requiredEscalations: string[];
  prohibitedOutputs: string[];
  rationale: string;
};

export type DecisionEngineTrace = {
  contractVersion: ContractVersion;
  traceId: EntityId;
  requestId: EntityId;
  decisionId?: EntityId;
  createdAt: string;
  pipelineStatus:
    | "received"
    | "clarification_required"
    | "analysis_ready"
    | "limited_analysis"
    | "cannot_recommend"
    | "refused"
    | "failed";
  schemaValidation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  policyVersion: string;
  processingNotices: string[];
};

export type ControlledFailure = {
  code: "validation_failure" | "timeout" | "unavailable" | "unsafe_output" | "internal_error";
  message: string;
  retryable: boolean;
  retryGuidance?: string;
};
