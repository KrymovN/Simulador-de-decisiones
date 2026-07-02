# LEVIO DECISION ENGINE SCHEMAS

## 1. Purpose

This document defines the provider-independent canonical schemas for the future Levio Decision Engine.

It formalizes the architecture foundation in `LEVIO_DECISION_ENGINE.md`. It does not implement the schemas, change the current simulator contract, connect an AI provider, create persistence, or authorize Stage 3.

The schemas are designed to make every material conclusion traceable, validate generated structures deterministically, and prevent a recommendation from being produced when the decision model is unsafe or materially incomplete.

## 2. Contract Principles

- Structured values are authoritative; prose is explanatory.
- Unknown information remains unknown. It must not be invented or silently defaulted.
- User-provided facts, user assumptions, engine inferences, and external evidence must remain distinguishable.
- Confidence measures the quality of the model, not certainty about the future.
- Completeness measures field coverage, not truth or reliability.
- A recommendation is conditional on goals, constraints, evidence, and unresolved uncertainty.
- Every material scenario, risk, benefit, and recommendation claim must reference supporting evidence or an explicit assumption.
- Safety and critical-gap gates take precedence over recommendation generation.
- Stable identifiers and enum values are locale-independent.
- Generated prose may be localized, but canonical structured meaning must remain stable.

## 3. Shared Conventions

### 3.1 Versioning

Every top-level contract must include:

```ts
type ContractVersion = "2.0";
```

Breaking structural or semantic changes require a new major version. Additive optional fields may use a minor version only after compatibility review.

### 3.2 Identifiers

All addressable records use opaque stable identifiers.

```ts
type EntityId = string;
```

Identifiers must not encode private data, display text, list position, or locale.

Recommended prefixes:

- `goal_`
- `opt_`
- `var_`
- `con_`
- `stake_`
- `asm_`
- `gap_`
- `q_`
- `scn_`
- `risk_`
- `ben_`
- `rec_`
- `ev_`

### 3.3 Evidence and Provenance

```ts
type EvidenceSource =
  | "user_statement"
  | "user_answer"
  | "user_confirmed_memory"
  | "engine_inference"
  | "external_source";

type EvidenceRef = {
  id: EntityId;
  source: EvidenceSource;
  sourceRecordId?: EntityId;
  claim: string;
  reliability: "unverified" | "low" | "medium" | "high";
  userConfirmed: boolean;
};
```

`external_source` is reserved for a separately approved future capability. It must include source attribution and freshness metadata when implemented.

### 3.4 Missing and Unknown Values

Missing values must be represented explicitly. Empty strings, fabricated defaults, and ambiguous zero values are invalid substitutes.

```ts
type KnownValue<T> =
  | { status: "known"; value: T; evidenceRefs: EntityId[] }
  | { status: "unknown"; reason?: string }
  | { status: "not_applicable"; reason: string };
```

### 3.5 Scores

All normalized scores use an integer `0-100` range and require an explanation.

```ts
type Score = {
  value: number;
  band: "very_low" | "low" | "medium" | "high" | "very_high";
  rationale: string;
  evidenceRefs: EntityId[];
};
```

Score bands are presentation-independent. Future calibration may change numeric thresholds without changing their meaning.

## 4. Decision Request Schema

`DecisionRequest` is the input boundary for decision analysis.

```ts
type DecisionRequest = {
  contractVersion: "2.0";
  requestId: EntityId;
  input: {
    originalText: string;
    inputLanguage: string;
    requestedOutputLanguage: string;
  };
  userIntent: "explore" | "compare" | "recommend" | "review";
  suppliedContext?: EvidenceRef[];
  suppliedOptions?: Option[];
  preferences?: {
    riskTolerance?: "low" | "moderate" | "high";
    timePreference?: "short_term" | "balanced" | "long_term";
    excludedActions?: string[];
  };
};
```

Validation requirements:

- `originalText` must contain meaningful decision context.
- `inputLanguage` and `requestedOutputLanguage` must be explicit locale-independent codes.
- Supplied context must identify provenance.
- User preferences must never be inferred from language, demographic assumptions, or subscription tier.

## 5. Decision Model Schema

`DecisionModel` is the canonical internal representation built before scenario generation.

```ts
type DecisionModel = {
  decisionId: EntityId;
  decisionType: DecisionType[];
  statement: string;
  goals: Goal[];
  options: Option[];
  constraints: Constraint[];
  variables: DecisionVariable[];
  stakeholders: Stakeholder[];
  timeHorizon: TimeHorizon;
  assumptions: Assumption[];
  evidence: EvidenceRef[];
  gaps: InformationGap[];
  completeness: CompletenessAssessment;
  confidence: ConfidenceAssessment;
  safety: SafetyAssessment;
};
```

### 5.1 Decision Types

```ts
type DecisionType =
  | "binary"
  | "comparative"
  | "timing"
  | "resource_allocation"
  | "strategic_direction"
  | "risk_response"
  | "interpersonal"
  | "exploratory";
```

A decision may have multiple types. A single forced category is not required.

### 5.2 Goal

```ts
type Goal = {
  id: EntityId;
  description: string;
  priority: "primary" | "secondary";
  successCriteria: KnownValue<string[]>;
  evidenceRefs: EntityId[];
};
```

At least one primary goal is required before a recommendation can be generated.

### 5.3 Option

```ts
type Option = {
  id: EntityId;
  label: string;
  description: string;
  type: "action" | "delay" | "no_action" | "information_gathering";
  userProposed: boolean;
  feasible: KnownValue<boolean>;
  excludedReason?: string;
  evidenceRefs: EntityId[];
};
```

The engine should add delay, no-action, or information-gathering options only when they are meaningful and must label them as engine-proposed.

### 5.4 Constraint

```ts
type Constraint = {
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
```

A blocking constraint that invalidates an option must be reflected in option feasibility and recommendation logic.

### 5.5 Decision Variable

```ts
type DecisionVariable = {
  id: EntityId;
  name: string;
  description: string;
  value: KnownValue<string | number | boolean>;
  materiality: "critical" | "important" | "supporting";
  volatility: "stable" | "changeable" | "unknown";
  affectedOptionIds: EntityId[];
};
```

### 5.6 Stakeholder

```ts
type Stakeholder = {
  id: EntityId;
  role: string;
  interests: KnownValue<string[]>;
  influence: "low" | "medium" | "high" | "unknown";
  impactExposure: "low" | "medium" | "high" | "unknown";
  evidenceRefs: EntityId[];
};
```

The engine must not infer sensitive stakeholder attributes that are not relevant and supplied.

### 5.7 Time Horizon

```ts
type TimeHorizon = {
  decisionDeadline: KnownValue<string>;
  shortTermWindow: KnownValue<string>;
  longTermWindow: KnownValue<string>;
  delayCost: KnownValue<string>;
  reversibilityWindow: KnownValue<string>;
};
```

### 5.8 Assumption

```ts
type Assumption = {
  id: EntityId;
  statement: string;
  source: "user" | "engine";
  materiality: "critical" | "important" | "supporting";
  validationStatus: "unvalidated" | "partially_validated" | "validated" | "contradicted";
  affectedEntityIds: EntityId[];
  evidenceRefs: EntityId[];
};
```

An engine assumption must never be presented as a user fact.

## 6. Information Gap Schema

```ts
type InformationGap = {
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
  severity: "critical" | "important" | "optional";
  reason: string;
  affectedEntityIds: EntityId[];
  recommendationImpact:
    | "could_reverse"
    | "could_change"
    | "could_refine"
    | "no_material_change";
  resolution: "unresolved" | "question_pending" | "resolved" | "accepted_unknown";
  questionId?: EntityId;
};
```

Critical-gap rules:

- A critical unresolved gap blocks a normal recommendation.
- Contradictory high-impact facts are critical until reconciled.
- Missing information that could make an option unsafe is critical.
- A high-stakes domain with insufficient safety context is critical.
- `accepted_unknown` may support a limited analysis, but it cannot bypass a safety gate.

## 7. Completeness Model

Completeness measures whether required decision-model components are present.

```ts
type CompletenessAssessment = {
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
```

Completeness is calculated from deterministic required-field and coverage checks. Generated prose must not determine completeness.

Minimum recommendation eligibility:

- primary goal is present;
- at least two meaningful options are present, including no-action or delay when relevant;
- no unresolved blocking constraint ambiguity;
- no unresolved critical gap;
- safety status permits recommendation.

## 8. Confidence Model

Confidence measures reliability of the current analysis.

```ts
type ConfidenceAssessment = {
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
```

Conceptual confidence bands:

- `0-39`: insufficient model; clarification required or recommendation withheld;
- `40-59`: limited model; only cautious conditional guidance;
- `60-79`: usable model; material uncertainty must remain visible;
- `80-100`: strong model; uncertainty still exists and must be stated.

Confidence must be reduced by unresolved important gaps, weak evidence, material engine assumptions, contradictions, and volatile external conditions.

## 9. Scenario Schema

```ts
type Scenario = {
  id: EntityId;
  title: string;
  optionId: EntityId;
  scenarioType:
    | "base_case"
    | "favorable"
    | "adverse"
    | "delay"
    | "no_action"
    | "information_first";
  summary: string;
  triggerConditions: string[];
  assumptionIds: EntityId[];
  shortTermEffects: Consequence[];
  delayedEffects: Consequence[];
  risks: RiskAssessment[];
  benefits: BenefitAssessment[];
  indicatorsToMonitor: Indicator[];
  reversibility: ReversibilityAssessment;
  plausibility: Score;
  confidence: Score;
};
```

Scenario generation invariants:

- Scenarios must represent materially distinct paths or conditions.
- Each feasible option must receive adequate analysis before ranking.
- At least one adverse-condition path must be considered for a preferred option.
- No scenario may be described as guaranteed.
- Scenario plausibility is not a calibrated probability unless a future approved model explicitly supports calibrated probability.

### 9.1 Consequence

```ts
type Consequence = {
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
```

### 9.2 Risk

```ts
type RiskAssessment = {
  id: EntityId;
  description: string;
  type: "direct" | "indirect" | "dependency" | "delayed" | "execution" | "emotional";
  likelihood: Score;
  impact: Score;
  reversibility: Score;
  detectability: Score;
  exposureDuration: KnownValue<string>;
  mitigationActions: string[];
  evidenceRefs: EntityId[];
};
```

### 9.3 Benefit

```ts
type BenefitAssessment = {
  id: EntityId;
  description: string;
  type: "immediate" | "long_term" | "optionality" | "learning" | "reversibility" | "goal_alignment";
  magnitude: Score;
  likelihood: Score;
  durability: Score;
  evidenceRefs: EntityId[];
};
```

### 9.4 Indicators and Reversibility

```ts
type Indicator = {
  id: EntityId;
  description: string;
  signalType: "positive" | "warning" | "stop";
  observationWindow: KnownValue<string>;
};

type ReversibilityAssessment = {
  level: "easy" | "moderate" | "difficult" | "irreversible" | "unknown";
  exitConditions: string[];
  estimatedExitCost: KnownValue<string>;
};
```

## 10. Recommendation Schema

```ts
type Recommendation = {
  id: EntityId;
  status: "recommended" | "conditional" | "defer" | "withheld";
  preferredOptionId?: EntityId;
  summary: string;
  rationale: RecommendationCriterion[];
  keyAssumptionIds: EntityId[];
  conditionsThatChangeRecommendation: string[];
  nextSteps: NextStep[];
  unresolvedGapIds: EntityId[];
  confidence: ConfidenceAssessment;
};
```

```ts
type RecommendationCriterion = {
  criterion: string;
  importance: "critical" | "high" | "medium" | "low";
  favoredOptionId?: EntityId;
  explanation: string;
  evidenceRefs: EntityId[];
};

type NextStep = {
  action: string;
  purpose: string;
  urgency: "now" | "soon" | "later";
  reversibility: "reversible" | "partially_reversible" | "irreversible";
};
```

Recommendation rules:

- A recommendation must optimize for the user's stated goal and constraints, not generic desirability.
- An infeasible option cannot be preferred.
- A preferred option must be compared against meaningful alternatives.
- Material tradeoffs and conditions that change the recommendation must be explicit.
- Low confidence cannot be hidden behind strong prose.
- `withheld` is required when safety or critical gaps prevent a responsible recommendation.
- `defer` is valid when information gathering has greater expected value than immediate commitment.

## 11. Safety Assessment Schema

```ts
type SafetyAssessment = {
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
```

Safety behavior:

- `standard`: normal analysis rules apply.
- `elevated`: cautious conditional analysis with explicit limitations and professional-review guidance where appropriate.
- `restricted`: do not select a consequential path; provide safe information-gathering or professional-support next steps.
- `refuse`: do not provide assistance that enables harm or illegal activity; provide an appropriate safe redirect.

## 12. Processing and Audit Schema

```ts
type DecisionAudit = {
  contractVersion: "2.0";
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
  modelVersion?: string;
  promptVersion?: string;
  policyVersion: string;
  processingNotices: string[];
};
```

Future model and prompt version fields must not imply that an AI provider is approved or connected now.

## 13. Deterministic Validation Rules

Before accepting any generated structure, future implementation must verify:

1. Required fields and enum values are valid.
2. Scores are integers in the `0-100` range.
3. Referenced entity and evidence IDs exist.
4. Every scenario references a valid option.
5. Every material claim has evidence or an explicit assumption.
6. User facts and engine inferences are not merged.
7. Critical unresolved gaps block `recommended` and normal `conditional` outputs.
8. Safety status and recommendation status are compatible.
9. An infeasible option is not preferred.
10. Contradictions are surfaced, not silently resolved.
11. Unknown values are not converted into certainty.
12. Localized prose does not alter canonical structured values.

Invalid generated structures must be rejected, repaired through a bounded validation process, or returned as a controlled failure. They must not be silently passed to the user.

## 14. Current Implementation Boundary

These schemas are specifications only.

Stage 2.14 does not:

- change the current `SimulationResponse`;
- change `lib/simulationEngine.ts`;
- change the simulator, dashboard, UI, routes, or localStorage;
- implement schema validators;
- connect OpenAI or another AI provider;
- create auth, persistence, memory, payments, or production safety infrastructure.
