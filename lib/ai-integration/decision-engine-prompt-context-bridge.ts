import "server-only";

import type {
  Assumption,
  Constraint,
  DecisionContext,
  DecisionOption,
  DecisionVariable,
  Goal,
  KnownValue,
  SafetyBoundary,
  Stakeholder,
} from "../decision-engine/types";
import { createPromptContextBoundary } from "../prompt-context/boundary";
import {
  PROMPT_CONTEXT_LOCALES,
  type PromptContextDecisionFrame,
  type PromptContextInput,
  type PromptContextOutput,
} from "../prompt-context/contracts";
import { createPromptContextRuntime } from "../prompt-context/runtime";
import {
  DEFAULT_PROMPT_CONTEXT_POLICY,
  DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  createPromptContextContract,
} from "../prompt-context/validation";
import {
  DECISION_ENGINE_PROMPT_CONTEXT_BRIDGE_VERSION,
  type DecisionEnginePromptContextBridgeErrorCode,
  type DecisionEnginePromptContextBridgeEvidence,
  type DecisionEnginePromptContextBridgeRequest,
  type DecisionEnginePromptContextBridgeResult,
} from "./contracts";

const REQUEST_KEYS = [
  "bridgeId",
  "submittedAt",
  "locale",
  "decisionContext",
  "safety",
] as const;

const CONTEXT_KEYS = [
  "decisionId",
  "decisionTypes",
  "statement",
  "goals",
  "options",
  "constraints",
  "variables",
  "stakeholders",
  "timeHorizon",
  "assumptions",
  "evidence",
] as const;

const UNSAFE_FIELD_PATTERN = /^(?:provider|providerId|providerPayload|model|modelId|apiKey|credential|credentials|secret|env|environment|network|networkDestination|rawPrompt|systemPrompt|userSystemPrompt|providerExecution|modelCall)$/i;
const DECISION_TYPES = [
  "binary",
  "comparative",
  "timing",
  "resource_allocation",
  "strategic_direction",
  "risk_response",
  "interpersonal",
  "exploratory",
] as const;

const promptContextContract = createPromptContextContract({
  enabled: true,
  policy: DEFAULT_PROMPT_CONTEXT_POLICY,
  riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
});

const promptContextRuntime = createPromptContextRuntime({
  enabled: true,
  contract: promptContextContract,
});

const promptContextBoundary = createPromptContextBoundary({
  enabled: true,
  runtime: promptContextRuntime,
});

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasUnsafeField(value: unknown, depth = 0): boolean {
  if (depth > 8 || !record(value)) return false;
  return Object.entries(value).some(([key, nested]) =>
    UNSAFE_FIELD_PATTERN.test(key) ||
    (record(nested) && hasUnsafeField(nested, depth + 1)) ||
    (Array.isArray(nested) && nested.some((item) => record(item) && hasUnsafeField(item, depth + 1)))
  );
}

function knownValue(value: unknown): value is KnownValue<unknown> {
  if (!record(value) || !nonEmptyString(value.status)) return false;
  if (value.status === "known") {
    return "value" in value && stringArray(value.evidenceRefs);
  }
  if (value.status === "unknown") {
    return value.reason === undefined || typeof value.reason === "string";
  }
  return value.status === "not_applicable" && nonEmptyString(value.reason);
}

function goal(value: unknown): value is Goal {
  return record(value) &&
    exactKeys(value, ["id", "description", "priority", "successCriteria", "evidenceRefs"]) &&
    nonEmptyString(value.id) && nonEmptyString(value.description) &&
    (value.priority === "primary" || value.priority === "secondary") &&
    knownValue(value.successCriteria) && stringArray(value.evidenceRefs);
}

function option(value: unknown): value is DecisionOption {
  return record(value) &&
    exactKeys(value, ["id", "label", "description", "type", "userProposed", "feasible", "excludedReason", "evidenceRefs"]) &&
    nonEmptyString(value.id) && nonEmptyString(value.label) && nonEmptyString(value.description) &&
    ["action", "delay", "no_action", "information_gathering"].includes(String(value.type)) &&
    typeof value.userProposed === "boolean" && knownValue(value.feasible) &&
    (value.excludedReason === undefined || typeof value.excludedReason === "string") &&
    stringArray(value.evidenceRefs);
}

function constraint(value: unknown): value is Constraint {
  return record(value) &&
    exactKeys(value, ["id", "description", "kind", "severity", "appliesToOptionIds", "evidenceRefs"]) &&
    nonEmptyString(value.id) && nonEmptyString(value.description) &&
    ["non_negotiable", "financial", "time", "legal", "ethical", "health", "relationship", "resource", "other"].includes(String(value.kind)) &&
    ["blocking", "material", "preference"].includes(String(value.severity)) &&
    stringArray(value.appliesToOptionIds) && stringArray(value.evidenceRefs);
}

function variable(value: unknown): value is DecisionVariable {
  return record(value) &&
    exactKeys(value, ["id", "name", "description", "value", "materiality", "volatility", "affectedOptionIds"]) &&
    nonEmptyString(value.id) && nonEmptyString(value.name) && nonEmptyString(value.description) &&
    knownValue(value.value) && ["critical", "important", "supporting"].includes(String(value.materiality)) &&
    ["stable", "changeable", "unknown"].includes(String(value.volatility)) && stringArray(value.affectedOptionIds);
}

function stakeholder(value: unknown): value is Stakeholder {
  return record(value) &&
    exactKeys(value, ["id", "role", "interests", "influence", "impactExposure", "evidenceRefs"]) &&
    nonEmptyString(value.id) && nonEmptyString(value.role) && knownValue(value.interests) &&
    ["low", "medium", "high", "unknown"].includes(String(value.influence)) &&
    ["low", "medium", "high", "unknown"].includes(String(value.impactExposure)) &&
    stringArray(value.evidenceRefs);
}

function assumption(value: unknown): value is Assumption {
  return record(value) &&
    exactKeys(value, ["id", "statement", "source", "materiality", "validationStatus", "affectedEntityIds", "evidenceRefs"]) &&
    nonEmptyString(value.id) && nonEmptyString(value.statement) &&
    ["user", "engine"].includes(String(value.source)) &&
    ["critical", "important", "supporting"].includes(String(value.materiality)) &&
    ["unvalidated", "partially_validated", "validated", "contradicted"].includes(String(value.validationStatus)) &&
    stringArray(value.affectedEntityIds) && stringArray(value.evidenceRefs);
}

function safetyBoundary(value: unknown): value is SafetyBoundary {
  return record(value) &&
    exactKeys(value, ["domain", "level", "recommendationAllowed", "requiredNotices", "requiredEscalations", "prohibitedOutputs", "rationale"]) &&
    nonEmptyString(value.domain) && nonEmptyString(value.level) &&
    typeof value.recommendationAllowed === "boolean" && stringArray(value.requiredNotices) &&
    stringArray(value.requiredEscalations) && stringArray(value.prohibitedOutputs) && typeof value.rationale === "string";
}

function decisionContext(value: unknown): value is DecisionContext {
  if (!record(value) || !exactKeys(value, CONTEXT_KEYS)) return false;
  if (!nonEmptyString(value.decisionId) || !nonEmptyString(value.statement)) return false;
  if (!Array.isArray(value.decisionTypes) || !value.decisionTypes.every((item) => DECISION_TYPES.includes(item))) return false;
  if (!Array.isArray(value.goals) || !value.goals.every(goal)) return false;
  if (!Array.isArray(value.options) || !value.options.every(option)) return false;
  if (!Array.isArray(value.constraints) || !value.constraints.every(constraint)) return false;
  if (!Array.isArray(value.variables) || !value.variables.every(variable)) return false;
  if (!Array.isArray(value.stakeholders) || !value.stakeholders.every(stakeholder)) return false;
  if (!Array.isArray(value.assumptions) || !value.assumptions.every(assumption)) return false;
  if (!Array.isArray(value.evidence)) return false;
  if (!record(value.timeHorizon) || !exactKeys(value.timeHorizon, ["decisionDeadline", "shortTermWindow", "longTermWindow", "delayCost", "reversibilityWindow"])) return false;
  return Object.values(value.timeHorizon).every(knownValue);
}

function normalize(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function readableKnownValue(label: string, value: KnownValue<unknown>): string {
  if (value.status === "known") {
    const rendered = Array.isArray(value.value) ? value.value.join(", ") : String(value.value);
    return `${label}: ${rendered}`;
  }
  if (value.status === "unknown") return `${label}: unknown${value.reason ? ` (${value.reason})` : ""}`;
  return `${label}: not applicable (${value.reason})`;
}

function unknownMarkers(context: DecisionContext): string[] {
  const markers: string[] = [];
  const add = (label: string, value: KnownValue<unknown>) => {
    if (value.status === "unknown") markers.push(readableKnownValue(label, value));
  };
  context.goals.forEach((item) => add(`Goal ${item.id} success criteria`, item.successCriteria));
  context.options.forEach((item) => add(`Option ${item.id} feasibility`, item.feasible));
  context.variables.forEach((item) => add(`Variable ${item.id}`, item.value));
  context.stakeholders.forEach((item) => add(`Stakeholder ${item.id} interests`, item.interests));
  Object.entries(context.timeHorizon).forEach(([key, value]) => add(`Time horizon ${key}`, value));
  return markers;
}

function mapDecisionFrame(
  context: DecisionContext,
  safety: SafetyBoundary | undefined,
): PromptContextDecisionFrame {
  const primaryGoal = context.goals.find((item) => item.priority === "primary");
  const objective = normalize(primaryGoal?.description || context.statement);
  const scenarioSeeds = unique(context.options.map((item) =>
    `Option ${item.id}: ${item.label} — ${item.description}`
  ));
  const safetyConstraints = safety
    ? [
        `Safety domain: ${safety.domain}; level: ${safety.level}; recommendation allowed: ${String(safety.recommendationAllowed)}`,
        ...safety.requiredNotices.map((item) => `Required notice: ${item}`),
        ...safety.requiredEscalations.map((item) => `Required escalation: ${item}`),
        ...safety.prohibitedOutputs.map((item) => `Prohibited output: ${item}`),
      ]
    : [];
  const knownConstraints = unique([
    ...context.constraints.map((item) =>
      `Constraint ${item.id} [${item.kind}/${item.severity}]: ${item.description}`
    ),
    ...safetyConstraints,
  ]);
  const decisionCriteria = context.goals.flatMap((item) =>
    item.successCriteria.status === "known"
      ? item.successCriteria.value.map((criterion) => `Decision criterion for ${item.id}: ${criterion}`)
      : []
  );
  const tradeoffFocus = unique([
    ...context.goals.map((item) => `Goal ${item.id} [${item.priority}]: ${item.description}`),
    ...decisionCriteria,
    ...context.variables.map((item) =>
      `${readableKnownValue(`Variable ${item.id} (${item.name})`, item.value)}; materiality: ${item.materiality}; volatility: ${item.volatility}`
    ),
    ...context.assumptions.map((item) =>
      `Assumption ${item.id} [${item.materiality}/${item.validationStatus}]: ${item.statement}`
    ),
    ...context.stakeholders.map((item) =>
      `${readableKnownValue(`Stakeholder ${item.id} (${item.role}) interests`, item.interests)}; influence: ${item.influence}; exposure: ${item.impactExposure}`
    ),
    ...Object.entries(context.timeHorizon).map(([key, value]) =>
      readableKnownValue(`Time horizon ${key}`, value)
    ),
    ...unknownMarkers(context),
  ]);
  return {
    objective,
    decisionQuestion: normalize(context.statement),
    scenarioSeeds,
    knownConstraints,
    tradeoffFocus,
  };
}

function evidence(input: {
  context?: DecisionContext;
  frame?: PromptContextDecisionFrame;
  localePreserved?: boolean;
  safetyPreserved?: boolean;
  promptContextUsed?: boolean;
} = {}): DecisionEnginePromptContextBridgeEvidence {
  const context = input.context;
  const frame = input.frame;
  const joinedScenarios = frame?.scenarioSeeds.join("\n") ?? "";
  const joinedConstraints = frame?.knownConstraints.join("\n") ?? "";
  const joinedTradeoffs = frame?.tradeoffFocus.join("\n") ?? "";
  return {
    deterministicOnly: true,
    serverOnly: true,
    decisionEngineContractUsed: true,
    promptContextRuntimeUsed: input.promptContextUsed === true,
    promptContextBoundaryUsed: input.promptContextUsed === true,
    objectivePreserved: Boolean(context && frame?.objective),
    goalsPreserved: Boolean(context && context.goals.every((item) => joinedTradeoffs.includes(item.description))),
    optionsPreserved: Boolean(context && context.options.every((item) => joinedScenarios.includes(item.label) && joinedScenarios.includes(item.description))),
    constraintsPreserved: Boolean(context && context.constraints.every((item) => joinedConstraints.includes(item.description))),
    assumptionsPreserved: Boolean(context && context.assumptions.every((item) => joinedTradeoffs.includes(item.statement))),
    tradeoffsPreserved: Boolean(frame?.tradeoffFocus.length),
    uncertaintiesPreserved: Boolean(context && unknownMarkers(context).every((item) => joinedTradeoffs.includes(item))),
    scenarioSeedsPreserved: Boolean(context && context.options.length === frame?.scenarioSeeds.length),
    decisionCriteriaPreserved: Boolean(context && context.goals.every((item) =>
      item.successCriteria.status !== "known" || item.successCriteria.value.every((criterion) => joinedTradeoffs.includes(criterion))
    )),
    localePreserved: input.localePreserved === true,
    safetyMarkersPreserved: input.safetyPreserved === true,
    modelCallExecuted: false,
    providerExecutionCompleted: false,
    networkExecutionCount: 0,
    apiKeyAccessCount: 0,
    environmentAccessCount: 0,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    persistenceIntegrated: false,
  };
}

function blocked(input: {
  bridgeId?: string;
  code: DecisionEnginePromptContextBridgeErrorCode;
  message: string;
  promptContextErrorCode?: string;
  context?: DecisionContext;
  frame?: PromptContextDecisionFrame;
}): Extract<DecisionEnginePromptContextBridgeResult, { status: "blocked" }> {
  return {
    status: "blocked",
    execution: "none",
    version: DECISION_ENGINE_PROMPT_CONTEXT_BRIDGE_VERSION,
    bridgeId: input.bridgeId,
    error: {
      code: input.code,
      message: input.message,
      recoverable: false,
      promptContextErrorCode: input.promptContextErrorCode,
    },
    evidence: evidence({ context: input.context, frame: input.frame }),
  };
}

function promptOutputIsValid(output: PromptContextOutput, input: PromptContextInput): boolean {
  return output.inputId === input.inputId &&
    output.outputKind === "structured_decision_simulation_context" &&
    JSON.stringify(output.contextFrame) === JSON.stringify(input.decisionFrame) &&
    output.directAnswerMode === false && output.genericAssistantMode === false &&
    output.chatMode === false && output.modelCallExecuted === false &&
    output.aiProviderRuntimeCalled === false;
}

export function bridgeDecisionEngineToPromptContext(
  value: unknown,
): DecisionEnginePromptContextBridgeResult {
  if (!record(value)) {
    return blocked({ code: "bridge_request_missing", message: "Decision Engine Prompt Context bridge requires a structured request." });
  }
  if (hasUnsafeField(value)) {
    return blocked({ code: "unsafe_runtime_field_rejected", message: "Bridge request contains a prohibited runtime-control field." });
  }
  if (!exactKeys(value, REQUEST_KEYS)) {
    return blocked({ code: "unknown_top_level_field_rejected", message: "Bridge request contains an unsupported top-level field." });
  }
  if (!nonEmptyString(value.bridgeId)) {
    return blocked({ code: "bridge_id_missing", message: "Bridge request requires bridgeId." });
  }
  const bridgeId = normalize(value.bridgeId);
  if (!nonEmptyString(value.submittedAt) || !Number.isFinite(Date.parse(value.submittedAt))) {
    return blocked({ bridgeId, code: "bridge_timestamp_invalid", message: "Bridge request requires a valid submittedAt timestamp." });
  }
  if (!PROMPT_CONTEXT_LOCALES.includes(value.locale as never)) {
    return blocked({ bridgeId, code: "bridge_locale_invalid", message: "Bridge locale must be en, es, ru, or zh." });
  }
  if (!value.decisionContext) {
    return blocked({ bridgeId, code: "decision_context_missing", message: "Bridge request requires a Decision Context." });
  }
  if (!decisionContext(value.decisionContext)) {
    return blocked({ bridgeId, code: "decision_context_invalid", message: "Decision Context does not satisfy the canonical contract." });
  }
  const context = value.decisionContext;
  if (value.safety !== undefined && !safetyBoundary(value.safety)) {
    return blocked({ bridgeId, code: "decision_context_invalid", message: "Safety boundary does not satisfy the canonical contract.", context });
  }
  if (!context.statement.trim() && !context.goals.some((item) => item.description.trim())) {
    return blocked({ bridgeId, code: "objective_missing", message: "Decision Context requires an objective.", context });
  }
  if (context.options.length === 0) {
    return blocked({ bridgeId, code: "options_missing", message: "Decision Context requires at least one option for scenario framing.", context });
  }
  if (context.constraints.length === 0) {
    return blocked({ bridgeId, code: "constraints_missing", message: "Decision Context requires at least one known constraint.", context });
  }
  if (context.goals.length === 0 && context.variables.length === 0 && context.assumptions.length === 0) {
    return blocked({ bridgeId, code: "tradeoff_context_missing", message: "Decision Context requires goal, variable, or assumption context for tradeoff framing.", context });
  }

  const safety = value.safety as SafetyBoundary | undefined;
  const frame = mapDecisionFrame(context, safety);
  const promptContextInput: PromptContextInput = {
    inputId: bridgeId,
    submittedAt: value.submittedAt,
    locale: value.locale as DecisionEnginePromptContextBridgeRequest["locale"],
    decisionFrame: frame,
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  };
  const boundary = promptContextBoundary.evaluate({
    requestId: bridgeId,
    runtime: { requestId: bridgeId, input: promptContextInput },
  });
  if (boundary.status === "blocked") {
    return {
      ...blocked({
        bridgeId,
        code: "prompt_context_boundary_blocked",
        message: "Existing Prompt Context boundary rejected the mapped Decision Context.",
        promptContextErrorCode: boundary.error.runtimeError?.contractError?.code ?? boundary.error.code,
        context,
        frame,
      }),
      promptContextBoundary: boundary,
    };
  }
  if (!promptOutputIsValid(boundary.output, promptContextInput)) {
    return {
      ...blocked({
        bridgeId,
        code: "prompt_context_output_invalid",
        message: "Prompt Context output did not preserve the mapped Decision Context.",
        context,
        frame,
      }),
      promptContextBoundary: boundary,
    };
  }
  return {
    status: "ready",
    execution: "decision_engine_prompt_context_bridge_only",
    version: DECISION_ENGINE_PROMPT_CONTEXT_BRIDGE_VERSION,
    bridgeId,
    promptContextInput,
    promptContextOutput: boundary.output,
    promptContextBoundary: boundary,
    evidence: evidence({
      context,
      frame,
      localePreserved: boundary.output.inputId === bridgeId && promptContextInput.locale === value.locale,
      safetyPreserved: safety === undefined || frame.knownConstraints.some((item) => item.includes(`Safety domain: ${safety.domain}`)),
      promptContextUsed: true,
    }),
  };
}
