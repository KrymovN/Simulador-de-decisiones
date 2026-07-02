# LEVIO SIMULATION RESPONSE V2

## 1. Purpose

This document defines the future provider-independent `SimulationResponse V2` contract.

V2 is the external decision-analysis response derived from the canonical schemas in `LEVIO_DECISION_SCHEMAS.md`. It is designed to support clarification, limited analysis, safety behavior, scenario comparison, traceable recommendation logic, and explicit uncertainty.

This is a specification only. The current implemented `SimulationResponse` remains unchanged.

## 2. Relationship to the Current Response

The current mock response contains:

```ts
type SimulationResponse = {
  input: string;
  lang: "es";
  generatedAt: string;
  simulation: MockSimulation;
  thinkingStages: ThinkingStage[];
};
```

V2 is not an in-place extension of that implemented contract. It is a future major-version contract because it changes the response lifecycle and introduces states in which no simulation or recommendation should be returned.

V2 must be introduced only through a separately approved implementation and migration stage.

## 3. Response Lifecycle

```text
request received
->
decision model drafted
->
safety and critical gaps evaluated
->
clarification required OR analysis permitted
->
scenarios evaluated
->
recommendation generated, limited, deferred, withheld, or refused
```

V2 response statuses:

- `clarification_required`: critical gaps prevent responsible analysis or recommendation.
- `analysis_ready`: model is sufficient for a normal conditional recommendation.
- `limited_analysis`: useful scenarios can be shown, but recommendation confidence or scope is materially limited.
- `cannot_recommend`: analysis may be summarized, but a recommendation is withheld.
- `refused`: requested assistance is unsafe or prohibited.
- `failed`: controlled technical or validation failure.

## 4. Top-Level Contract

```ts
type SimulationResponseV2 = {
  contractVersion: "2.0";
  responseId: string;
  requestId: string;
  generatedAt: string;
  status:
    | "clarification_required"
    | "analysis_ready"
    | "limited_analysis"
    | "cannot_recommend"
    | "refused"
    | "failed";
  language: {
    input: string;
    output: string;
  };
  decision: DecisionSummary;
  modelQuality: ModelQuality;
  gaps: GapSummary[];
  clarification?: ClarificationBlock;
  analysis?: AnalysisBlock;
  recommendation?: RecommendationBlock;
  safety: SafetyBlock;
  traceability: TraceabilityBlock;
  notices: ResponseNotice[];
};
```

## 5. Decision Summary

```ts
type DecisionSummary = {
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
```

Rules:

- The decision statement must describe the choice, not merely repeat the input.
- Goal and proposed action must remain separate.
- Infeasible or unknown options remain visible when they materially affect the analysis.
- The summary must not imply that missing information was supplied.

## 6. Model Quality

```ts
type ModelQuality = {
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
  };
};
```

Completeness and confidence must be shown separately.

Examples:

- High completeness with low confidence: all fields exist, but they rely on weak assumptions.
- Low completeness with high evidence reliability: supplied facts are reliable, but major decision dimensions are absent.

V2 must never label confidence as the probability that the recommendation will succeed.

## 7. Gap Summary

```ts
type GapSummary = {
  id: string;
  category: string;
  severity: "critical" | "important" | "optional";
  description: string;
  recommendationImpact:
    | "could_reverse"
    | "could_change"
    | "could_refine"
    | "no_material_change";
  resolution: "unresolved" | "question_pending" | "resolved" | "accepted_unknown";
};
```

Every unresolved critical gap must be visible in the response. Important gaps may remain unresolved only when the response status and recommendation limitations reflect them.

## 8. Clarification Block

```ts
type ClarificationBlock = {
  reason: string;
  questions: {
    id: string;
    text: string;
    answerType:
      | "free_text"
      | "single_select"
      | "multi_select"
      | "number"
      | "date"
      | "boolean";
    required: boolean;
    resolvesGapIds: string[];
    options?: { value: string; label: string }[];
    whyItMatters: string;
  }[];
  canProceedWithoutAnswers: boolean;
  proceedWithoutAnswersEffect?: string;
};
```

The clarification block is required when `status` is `clarification_required`.

Question rules:

- Ask only questions with material information value.
- Prefer one concise question per decision-changing uncertainty.
- Do not ask for information already supplied.
- Do not ask for sensitive information unless necessary, proportionate, and allowed.
- Explain why a question matters without pressuring the user.

## 9. Analysis Block

```ts
type AnalysisBlock = {
  assumptions: {
    id: string;
    statement: string;
    source: "user" | "engine";
    materiality: "critical" | "important" | "supporting";
    validationStatus: string;
  }[];
  scenarios: ScenarioResponse[];
  comparison: ComparisonCriterion[];
  uncertaintySummary: string;
};
```

### 9.1 Scenario Response

```ts
type ScenarioResponse = {
  id: string;
  optionId: string;
  type:
    | "base_case"
    | "favorable"
    | "adverse"
    | "delay"
    | "no_action"
    | "information_first";
  title: string;
  summary: string;
  triggerConditions: string[];
  shortTermEffects: EffectSummary[];
  delayedEffects: EffectSummary[];
  risks: RiskSummary[];
  benefits: BenefitSummary[];
  indicatorsToMonitor: IndicatorSummary[];
  reversibility: {
    level: "easy" | "moderate" | "difficult" | "irreversible" | "unknown";
    explanation: string;
  };
  plausibility: {
    score: number;
    explanation: string;
  };
  confidence: {
    score: number;
    explanation: string;
  };
};
```

`plausibility.score` is a comparative model score. It must not be displayed or interpreted as a calibrated probability unless a future approved calibration contract explicitly permits it.

### 9.2 Effect, Risk, Benefit, and Indicator Summaries

```ts
type EffectSummary = {
  description: string;
  domain: string;
  direction: "positive" | "negative" | "mixed";
  magnitude: "low" | "medium" | "high";
  evidenceRefs: string[];
};

type RiskSummary = {
  id: string;
  description: string;
  type: string;
  likelihood: number;
  impact: number;
  mitigationActions: string[];
  evidenceRefs: string[];
};

type BenefitSummary = {
  id: string;
  description: string;
  type: string;
  magnitude: number;
  likelihood: number;
  evidenceRefs: string[];
};

type IndicatorSummary = {
  description: string;
  signalType: "positive" | "warning" | "stop";
  observationWindow?: string;
};
```

### 9.3 Scenario Generation Logic

V2 scenario sets must:

1. Represent every feasible material option.
2. Include delay or no-action when relevant.
3. Include an information-first scenario when clarification has high expected value.
4. Include an adverse-condition scenario for a potentially preferred option.
5. Cover short-term and delayed effects.
6. Avoid cosmetic duplicates.
7. State trigger conditions and assumptions.
8. Keep risk, benefit, plausibility, and confidence conceptually separate.

### 9.4 Comparison Criteria

```ts
type ComparisonCriterion = {
  id: string;
  label: string;
  importance: "critical" | "high" | "medium" | "low";
  optionAssessments: {
    optionId: string;
    assessment: "strong" | "moderate" | "weak" | "unknown";
    explanation: string;
  }[];
};
```

Comparison criteria must derive from the user's goals, constraints, risk preference, time horizon, and reversibility needs.

## 10. Recommendation Block

```ts
type RecommendationBlock = {
  status: "recommended" | "conditional" | "defer" | "withheld";
  preferredOptionId?: string;
  summary: string;
  rationale: {
    criterion: string;
    importance: "critical" | "high" | "medium" | "low";
    explanation: string;
    evidenceRefs: string[];
  }[];
  keyAssumptionIds: string[];
  conditionsThatChangeRecommendation: string[];
  nextSteps: {
    action: string;
    purpose: string;
    urgency: "now" | "soon" | "later";
    reversibility: "reversible" | "partially_reversible" | "irreversible";
  }[];
  unresolvedGapIds: string[];
};
```

### 10.1 Recommendation Logic

A normal recommendation is eligible only when:

- a primary goal is clear;
- meaningful alternatives have been evaluated;
- blocking constraints are understood;
- no unresolved critical gap exists;
- the safety gate permits recommendation;
- the preferred path is feasible;
- material tradeoffs and assumptions are explicit.

Recommendation status rules:

| Condition | Required recommendation status |
| --- | --- |
| Model sufficient and preferred path supported | `recommended` or `conditional` |
| Information gathering has higher value than commitment | `defer` |
| Critical gap, restricted safety state, or inadequate basis | `withheld` |
| Response status `clarification_required` | recommendation block absent or `withheld` |
| Response status `refused` or `failed` | recommendation block absent |

No recommendation may be based only on scenario plausibility. Goal alignment, constraints, downside exposure, reversibility, and confidence must also be considered.

## 11. Safety Block

```ts
type SafetyBlock = {
  level: "standard" | "elevated" | "restricted" | "refuse";
  domain: string;
  recommendationAllowed: boolean;
  message: string;
  suggestedSupport: string[];
};
```

Safety behavior:

- Do not manufacture professional authority.
- Do not provide certainty in medical, legal, financial, or other high-stakes decisions.
- Do not select a harmful or illegal path.
- Provide safe information-gathering and qualified-support next steps when direct recommendation is restricted.
- Preserve the user's agency without abandoning them with an opaque refusal.

## 12. Traceability

```ts
type TraceabilityBlock = {
  evidence: {
    id: string;
    source:
      | "user_statement"
      | "user_answer"
      | "user_confirmed_memory"
      | "engine_inference"
      | "external_source";
    claim: string;
    reliability: "unverified" | "low" | "medium" | "high";
    userConfirmed: boolean;
  }[];
  modelVersion?: string;
  promptVersion?: string;
  policyVersion: string;
};
```

User-facing presentation may summarize traceability, but the structured response must preserve it.

## 13. Notices

```ts
type ResponseNotice = {
  code:
    | "uncertainty"
    | "limited_context"
    | "high_stakes"
    | "professional_review"
    | "accepted_unknown"
    | "technical_limitation";
  severity: "info" | "warning" | "critical";
  message: string;
};
```

Notices must be specific to the response. Generic disclaimers must not be used to conceal weak analysis or bypass a safety restriction.

## 14. Status Invariants

### `clarification_required`

- At least one unresolved critical gap exists.
- `clarification.questions` is non-empty.
- Normal recommendation is absent.
- The response explains what can and cannot be assessed.

### `analysis_ready`

- No unresolved critical gap exists.
- Safety allows recommendation.
- Scenarios and comparison are present.
- Recommendation is present.

### `limited_analysis`

- Useful analysis is possible.
- Important unresolved gaps or low confidence remain.
- Limitations are explicit.
- Recommendation is conditional, deferred, or withheld.

### `cannot_recommend`

- Recommendation is withheld due to insufficient basis or safety restriction.
- Safe analysis or information-gathering next steps may still be present.

### `refused`

- Unsafe or prohibited assistance was requested.
- No enabling analysis or recommendation is included.
- Safe redirect or support information is provided where appropriate.

### `failed`

- Schema validation, processing, or service execution failed.
- No fabricated fallback analysis is presented as successful.
- The failure is observable and retry behavior is explicit.

## 15. Controlled Failure Behavior

Future V2 implementation must not silently replace a failed remote or AI-assisted response with a mock response that appears equivalent.

Failure behavior must:

- distinguish validation failure, timeout, unavailable service, and unsafe output;
- preserve the user's original input where permitted;
- avoid returning partially invalid structured output;
- state whether retry is appropriate;
- avoid duplicate consequential actions;
- record a human-readable audit event.

## 16. Example: Clarification Required

```json
{
  "contractVersion": "2.0",
  "responseId": "resp_example",
  "requestId": "req_example",
  "generatedAt": "2026-06-13T10:00:00Z",
  "status": "clarification_required",
  "language": { "input": "es", "output": "es" },
  "decision": {
    "statement": "Decide whether to accept a new job offer",
    "decisionTypes": ["comparative", "strategic_direction"],
    "primaryGoal": "Improve career position without creating unacceptable family instability",
    "secondaryGoals": [],
    "optionSummaries": [
      { "id": "opt_accept", "label": "Accept offer", "type": "action", "feasibility": "unknown" },
      { "id": "opt_decline", "label": "Decline offer", "type": "no_action", "feasibility": "feasible" }
    ],
    "keyConstraints": [],
    "timeHorizonSummary": null
  },
  "modelQuality": {
    "completeness": {
      "score": 42,
      "band": "limited",
      "blockingDimensions": ["constraints", "time_horizon"],
      "explanation": "The offer is known, but relocation and deadline constraints are missing."
    },
    "confidence": {
      "score": 38,
      "band": "insufficient",
      "explanation": "A recommendation could reverse after the missing constraints are known.",
      "limitations": ["Relocation requirement unknown", "Decision deadline unknown"]
    }
  },
  "gaps": [
    {
      "id": "gap_relocation",
      "category": "constraint",
      "severity": "critical",
      "description": "Whether the role requires relocation is unknown.",
      "recommendationImpact": "could_reverse",
      "resolution": "question_pending"
    }
  ],
  "clarification": {
    "reason": "A relocation requirement could reverse the recommendation.",
    "questions": [
      {
        "id": "q_relocation",
        "text": "Does accepting the offer require relocation, and is relocation acceptable to you?",
        "answerType": "free_text",
        "required": true,
        "resolvesGapIds": ["gap_relocation"],
        "whyItMatters": "Relocation may be a non-negotiable constraint."
      }
    ],
    "canProceedWithoutAnswers": false
  },
  "safety": {
    "level": "standard",
    "domain": "general",
    "recommendationAllowed": false,
    "message": "Clarification is required before a responsible recommendation.",
    "suggestedSupport": []
  },
  "traceability": {
    "evidence": [],
    "policyVersion": "decision-policy-2.0"
  },
  "notices": [
    {
      "code": "limited_context",
      "severity": "warning",
      "message": "The current model is not sufficient for a recommendation."
    }
  ]
}
```

## 17. Compatibility and Migration Requirements

Before V2 implementation:

1. Define runtime validation schemas.
2. Define an explicit V1-to-V2 presentation migration plan.
3. Decide whether V1 and V2 coexist behind separate endpoints or feature flags.
4. Add contract fixtures for every response status.
5. Add tests for invalid references, critical-gap gating, safety gating, and recommendation invariants.
6. Define logging, retry, timeout, and cost behavior.
7. Confirm that current UI is not expected to render V2 without an approved UI stage.

## 18. Current Implementation Boundary

Stage 2.14 does not implement V2 and does not modify:

- `lib/simulationEngine.ts`;
- the current `SimulationResponse`;
- `HomeSimulator`;
- `/api/simulate`;
- simulator result rendering;
- dashboard simulations;
- localStorage;
- OpenAI or any other AI provider.
