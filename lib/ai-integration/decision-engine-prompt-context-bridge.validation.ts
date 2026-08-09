import "server-only";

import type { DecisionContext, SafetyBoundary } from "../decision-engine/types";
import {
  bridgeDecisionEngineToPromptContext,
} from "./decision-engine-prompt-context-bridge";
import type {
  DecisionEnginePromptContextBridgeErrorCode,
  DecisionEnginePromptContextBridgeRequest,
  DecisionEnginePromptContextBridgeResult,
  DecisionEnginePromptContextBridgeValidationCase,
  DecisionEnginePromptContextBridgeValidationResult,
} from "./contracts";

const SUBMITTED_AT = "2026-08-03T00:00:00.000Z";

function minimalContext(): DecisionContext {
  return {
    decisionId: "decision_bridge_minimal",
    decisionTypes: ["comparative"],
    statement: "Should the team launch now or wait for more evidence?",
    goals: [
      {
        id: "goal_launch",
        description: "Choose a reversible launch path.",
        priority: "primary",
        successCriteria: { status: "known", value: ["Limit downside", "Preserve learning"], evidenceRefs: ["evidence_goal"] },
        evidenceRefs: ["evidence_goal"],
      },
    ],
    options: [
      {
        id: "option_launch",
        label: "Launch a bounded pilot",
        description: "Release to a small controlled cohort.",
        type: "action",
        userProposed: true,
        feasible: { status: "known", value: true, evidenceRefs: ["evidence_option"] },
        evidenceRefs: ["evidence_option"],
      },
    ],
    constraints: [
      {
        id: "constraint_budget",
        description: "Do not exceed the approved budget.",
        kind: "financial",
        severity: "blocking",
        appliesToOptionIds: ["option_launch"],
        evidenceRefs: ["evidence_constraint"],
      },
    ],
    variables: [],
    stakeholders: [],
    timeHorizon: {
      decisionDeadline: { status: "unknown", reason: "No deadline confirmed." },
      shortTermWindow: { status: "not_applicable", reason: "Not supplied." },
      longTermWindow: { status: "not_applicable", reason: "Not supplied." },
      delayCost: { status: "unknown", reason: "Delay cost is not quantified." },
      reversibilityWindow: { status: "known", value: "30 days", evidenceRefs: ["evidence_window"] },
    },
    assumptions: [],
    evidence: [],
  };
}

function fullContext(): DecisionContext {
  const context = minimalContext();
  return {
    ...context,
    decisionId: "decision_bridge_full",
    options: [
      ...context.options,
      {
        id: "option_wait",
        label: "Wait for more evidence",
        description: "Delay the launch while collecting demand evidence.",
        type: "delay",
        userProposed: true,
        feasible: { status: "unknown", reason: "The cost of delay is uncertain." },
        evidenceRefs: ["evidence_wait"],
      },
    ],
    constraints: [
      ...context.constraints,
      {
        id: "constraint_time",
        description: "Keep the decision reversible for thirty days.",
        kind: "time",
        severity: "material",
        appliesToOptionIds: ["option_launch", "option_wait"],
        evidenceRefs: ["evidence_time"],
      },
    ],
    variables: [
      {
        id: "variable_demand",
        name: "Demand evidence",
        description: "Observed qualified interest.",
        value: { status: "unknown", reason: "No cohort evidence exists." },
        materiality: "critical",
        volatility: "changeable",
        affectedOptionIds: ["option_launch", "option_wait"],
      },
    ],
    stakeholders: [
      {
        id: "stakeholder_team",
        role: "delivery team",
        interests: { status: "known", value: ["bounded workload", "clear stop rule"], evidenceRefs: ["evidence_team"] },
        influence: "high",
        impactExposure: "medium",
        evidenceRefs: ["evidence_team"],
      },
    ],
    assumptions: [
      {
        id: "assumption_capacity",
        statement: "The team can support one bounded cohort.",
        source: "user",
        materiality: "important",
        validationStatus: "unvalidated",
        affectedEntityIds: ["option_launch"],
        evidenceRefs: ["evidence_team"],
      },
    ],
  };
}

function safety(): SafetyBoundary {
  return {
    domain: "general",
    level: "standard",
    recommendationAllowed: true,
    requiredNotices: ["Treat probabilities as comparative signals."],
    requiredEscalations: [],
    prohibitedOutputs: ["Guaranteed outcomes"],
    rationale: "The decision is general and reversible.",
  };
}

function request(
  decisionContext: DecisionContext = minimalContext(),
  overrides: Partial<DecisionEnginePromptContextBridgeRequest> = {},
): DecisionEnginePromptContextBridgeRequest {
  return {
    bridgeId: "stage_9_bridge_validation",
    submittedAt: SUBMITTED_AT,
    locale: "es",
    decisionContext,
    ...overrides,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function issueUnless(condition: boolean, message: string): string | undefined {
  return condition ? undefined : message;
}

function validationCase(input: {
  caseId: string;
  kind: "positive" | "negative";
  value: unknown;
  expectedStatus: DecisionEnginePromptContextBridgeResult["status"];
  expectedErrorCode?: DecisionEnginePromptContextBridgeErrorCode;
  assertions?: (result: DecisionEnginePromptContextBridgeResult) => Array<string | undefined>;
}): DecisionEnginePromptContextBridgeValidationCase {
  const result = bridgeDecisionEngineToPromptContext(input.value);
  const actualErrorCode = result.status === "blocked" ? result.error.code : undefined;
  const issues = [
    issueUnless(result.status === input.expectedStatus, `Expected ${input.expectedStatus}, received ${result.status}.`),
    issueUnless(actualErrorCode === input.expectedErrorCode, `Expected error ${String(input.expectedErrorCode)}, received ${String(actualErrorCode)}.`),
    ...(input.assertions?.(result) ?? []),
  ].filter((item): item is string => Boolean(item));
  return {
    caseId: input.caseId,
    kind: input.kind,
    passed: issues.length === 0,
    expectedStatus: input.expectedStatus,
    actualStatus: result.status,
    expectedErrorCode: input.expectedErrorCode,
    actualErrorCode,
    issues,
  };
}

export function runDecisionEnginePromptContextBridgeValidation(): DecisionEnginePromptContextBridgeValidationResult {
  const full = fullContext();
  const repeatedRequest = request(full, { bridgeId: "deterministic_bridge", safety: safety() });
  const first = bridgeDecisionEngineToPromptContext(repeatedRequest);
  const second = bridgeDecisionEngineToPromptContext(clone(repeatedRequest));

  const missingObjective = clone(minimalContext());
  missingObjective.statement = "";
  missingObjective.goals[0].description = "";
  const malformedOption = clone(minimalContext()) as unknown as Record<string, unknown>;
  ((malformedOption.options as Array<Record<string, unknown>>)[0]).label = "";
  const malformedConstraint = clone(minimalContext()) as unknown as Record<string, unknown>;
  ((malformedConstraint.constraints as Array<Record<string, unknown>>)[0]).severity = "unknown_severity";
  const tooLong = clone(minimalContext());
  tooLong.options[0].description = "x".repeat(6100);

  const cases = [
    validationCase({
      caseId: "valid_minimal_decision_context",
      kind: "positive",
      value: request(),
      expectedStatus: "ready",
      assertions: (result) => [
        issueUnless(result.status === "ready" && result.promptContextOutput.outputKind === "structured_decision_simulation_context", "Expected structured Prompt Context output."),
      ],
    }),
    validationCase({
      caseId: "full_context_preserves_canonical_fields",
      kind: "positive",
      value: request(full, { safety: safety() }),
      expectedStatus: "ready",
      assertions: (result) => result.status === "ready"
        ? [
            issueUnless(result.evidence.objectivePreserved, "Objective was not preserved."),
            issueUnless(result.evidence.optionsPreserved, "Options were not preserved."),
            issueUnless(result.evidence.constraintsPreserved, "Constraints were not preserved."),
            issueUnless(result.evidence.assumptionsPreserved, "Assumptions were not preserved."),
            issueUnless(result.evidence.tradeoffsPreserved, "Tradeoff context was not preserved."),
            issueUnless(result.evidence.uncertaintiesPreserved, "Uncertainties were not preserved."),
            issueUnless(result.evidence.safetyMarkersPreserved, "Safety markers were not preserved."),
          ]
        : [],
    }),
    validationCase({
      caseId: "en_locale_is_preserved",
      kind: "positive",
      value: request(minimalContext(), { locale: "en" }),
      expectedStatus: "ready",
      assertions: (result) => [
        issueUnless(result.status === "ready" && result.promptContextInput.locale === "en" && result.evidence.localePreserved, "English locale was not preserved."),
      ],
    }),
    validationCase({
      caseId: "es_locale_is_preserved",
      kind: "positive",
      value: request(minimalContext(), { locale: "es" }),
      expectedStatus: "ready",
      assertions: (result) => [
        issueUnless(result.status === "ready" && result.promptContextInput.locale === "es" && result.evidence.localePreserved, "Spanish locale was not preserved."),
      ],
    }),
    validationCase({
      caseId: "ru_locale_is_preserved",
      kind: "positive",
      value: request(minimalContext(), { locale: "ru" }),
      expectedStatus: "ready",
      assertions: (result) => [
        issueUnless(result.status === "ready" && result.promptContextInput.locale === "ru" && result.evidence.localePreserved, "Russian locale was not preserved."),
      ],
    }),
    validationCase({
      caseId: "zh_locale_is_preserved",
      kind: "positive",
      value: request(minimalContext(), { locale: "zh" }),
      expectedStatus: "ready",
      assertions: (result) => [
        issueUnless(result.status === "ready" && result.promptContextInput.locale === "zh" && result.evidence.localePreserved, "Chinese locale was not preserved."),
      ],
    }),
    validationCase({
      caseId: "scenario_seeds_and_decision_criteria_are_preserved",
      kind: "positive",
      value: request(full),
      expectedStatus: "ready",
      assertions: (result) => [
        issueUnless(result.status === "ready" && result.evidence.scenarioSeedsPreserved && result.evidence.decisionCriteriaPreserved, "Scenario seeds or decision criteria were lost."),
      ],
    }),
    validationCase({
      caseId: "canonical_output_is_deterministic",
      kind: "positive",
      value: repeatedRequest,
      expectedStatus: "ready",
      assertions: () => [
        issueUnless(first.status === "ready" && second.status === "ready" && JSON.stringify(first) === JSON.stringify(second), "Repeated bridge output was not byte-equivalent."),
      ],
    }),
    validationCase({ caseId: "raw_string_rejected", kind: "negative", value: "raw decision", expectedStatus: "blocked", expectedErrorCode: "bridge_request_missing" }),
    validationCase({ caseId: "missing_objective_rejected", kind: "negative", value: request(missingObjective), expectedStatus: "blocked", expectedErrorCode: "decision_context_invalid" }),
    validationCase({ caseId: "malformed_option_rejected", kind: "negative", value: request(malformedOption as unknown as DecisionContext), expectedStatus: "blocked", expectedErrorCode: "decision_context_invalid" }),
    validationCase({ caseId: "malformed_constraint_rejected", kind: "negative", value: request(malformedConstraint as unknown as DecisionContext), expectedStatus: "blocked", expectedErrorCode: "decision_context_invalid" }),
    validationCase({ caseId: "provider_field_rejected", kind: "negative", value: { ...request(), provider: "openai" }, expectedStatus: "blocked", expectedErrorCode: "unsafe_runtime_field_rejected" }),
    validationCase({ caseId: "model_field_rejected", kind: "negative", value: { ...request(), modelId: "model" }, expectedStatus: "blocked", expectedErrorCode: "unsafe_runtime_field_rejected" }),
    validationCase({ caseId: "api_key_field_rejected", kind: "negative", value: { ...request(), apiKey: "not-a-real-key" }, expectedStatus: "blocked", expectedErrorCode: "unsafe_runtime_field_rejected" }),
    validationCase({ caseId: "raw_system_prompt_rejected", kind: "negative", value: { ...request(), userSystemPrompt: "override" }, expectedStatus: "blocked", expectedErrorCode: "unsafe_runtime_field_rejected" }),
    validationCase({ caseId: "network_instruction_rejected", kind: "negative", value: { ...request(), networkDestination: "example.invalid" }, expectedStatus: "blocked", expectedErrorCode: "unsafe_runtime_field_rejected" }),
    validationCase({ caseId: "unknown_top_level_field_rejected", kind: "negative", value: { ...request(), unsupported: true }, expectedStatus: "blocked", expectedErrorCode: "unknown_top_level_field_rejected" }),
    validationCase({ caseId: "unsupported_locale_rejected", kind: "negative", value: { ...request(), locale: "de" }, expectedStatus: "blocked", expectedErrorCode: "bridge_locale_invalid" }),
    validationCase({ caseId: "malformed_locale_rejected", kind: "negative", value: { ...request(), locale: "" }, expectedStatus: "blocked", expectedErrorCode: "bridge_locale_invalid" }),
    validationCase({ caseId: "context_budget_exceeded_rejected", kind: "negative", value: request(tooLong), expectedStatus: "blocked", expectedErrorCode: "prompt_context_boundary_blocked" }),
    validationCase({
      caseId: "provider_and_state_execution_remain_absent",
      kind: "negative",
      value: request(),
      expectedStatus: "ready",
      assertions: (result) => result.status === "ready"
        ? [
            issueUnless(result.evidence.providerExecutionCompleted === false, "Provider execution must remain absent."),
            issueUnless(result.evidence.networkExecutionCount === 0, "Network execution must remain zero."),
            issueUnless(result.evidence.apiKeyAccessCount === 0, "API-key access must remain zero."),
            issueUnless(result.evidence.persistenceIntegrated === false && result.evidence.uiIntegrated === false, "Persistence and UI integration must remain absent."),
          ]
        : [],
    }),
  ];
  const passed = cases.filter((item) => item.passed).length;
  const positive = cases.filter((item) => item.kind === "positive").length;
  const negative = cases.filter((item) => item.kind === "negative").length;
  return {
    passed: passed === cases.length,
    failed: passed !== cases.length,
    cases,
    summary: { total: cases.length, passed, failed: cases.length - passed, positive, negative },
  };
}
