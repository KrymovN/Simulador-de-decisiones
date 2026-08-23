import "server-only";

import { createHash } from "node:crypto";

import {
  buildDecisionMaterialProviderRequest,
  OPENAI_DECISION_MATERIAL_LIMITS,
  OPENAI_DECISION_MATERIAL_MODEL,
  validateProductionPromptContext,
} from "../ai-provider/openai-decision-material-adapter";
import type { PromptContextOutput } from "../prompt-context/contracts";
import { bridgeDecisionEngineToPromptContext } from
  "./decision-engine-prompt-context-bridge";
import { runDecisionEnginePromptContextBridgeValidation } from
  "./decision-engine-prompt-context-bridge.validation";

export const MINIMUM_NECESSARY_PROMPT_CONTEXT_PROOF_VERSION =
  "stage-9-minimum-necessary-prompt-context-proof.1" as const;

export type MinimumNecessaryPromptContextProofCheck = {
  checkId: string;
  passed: boolean;
};

export type MinimumNecessaryPromptContextProofResult = {
  version: typeof MINIMUM_NECESSARY_PROMPT_CONTEXT_PROOF_VERSION;
  guaranteeId: "minimum_necessary_prompt_context";
  canonicalObligation:
    "Prove minimum-necessary Prompt Context selection before provider invocation.";
  rootCause: "PROOF_MISSING";
  status: "PASS" | "FAIL";
  checks: MinimumNecessaryPromptContextProofCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    providerOperations: 0;
    apiOperations: 0;
    humanReviewOperations: 0;
  };
};

function canonicalBridgeRequest(): Record<string, unknown> {
  return {
    bridgeId: "minimum_prompt_context_proof",
    submittedAt: "2026-08-23T00:00:00.000Z",
    locale: "es",
    decisionContext: {
      decisionId: "decision_minimum_prompt_context",
      decisionTypes: ["comparative"],
      statement: "Should the team run a bounded pilot or wait for more evidence?",
      goals: [{
        id: "goal_reversible",
        description: "Choose a reversible learning path.",
        priority: "primary",
        successCriteria: {
          status: "known",
          value: ["Limit downside", "Preserve learning"],
          evidenceRefs: ["evidence_goal"],
        },
        evidenceRefs: ["evidence_goal"],
      }],
      options: [{
        id: "option_pilot",
        label: "Run a bounded pilot",
        description: "Use a small controlled cohort.",
        type: "action",
        userProposed: true,
        feasible: {
          status: "known",
          value: true,
          evidenceRefs: ["evidence_option"],
        },
        evidenceRefs: ["evidence_option"],
      }],
      constraints: [{
        id: "constraint_budget",
        description: "Do not exceed the approved pilot budget.",
        kind: "financial",
        severity: "blocking",
        appliesToOptionIds: ["option_pilot"],
        evidenceRefs: ["evidence_constraint"],
      }],
      variables: [],
      stakeholders: [],
      timeHorizon: {
        decisionDeadline: { status: "unknown", reason: "No deadline confirmed." },
        shortTermWindow: { status: "not_applicable", reason: "Not supplied." },
        longTermWindow: { status: "not_applicable", reason: "Not supplied." },
        delayCost: { status: "unknown", reason: "Delay cost is not quantified." },
        reversibilityWindow: {
          status: "known",
          value: "30 days",
          evidenceRefs: ["evidence_window"],
        },
      },
      assumptions: [],
      evidence: [],
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function exactKeys(value: unknown, expected: readonly string[]): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value).sort();
  return JSON.stringify(keys) === JSON.stringify([...expected].sort());
}

function expectedProviderContext(input: PromptContextOutput) {
  const frame = input.contextFrame;
  const options = frame.scenarioSeeds.map((content, index) => ({
    option_ref: `option_${index + 1}`,
    scenario_ref: `scenario_${index + 1}`,
    content,
  }));
  const constraints = frame.knownConstraints.map((content, index) => ({
    source_ref: `constraint_${index + 1}`,
    content,
  }));
  const criteria = frame.tradeoffFocus.map((content, index) => ({
    criterion_ref: `criterion_${index + 1}`,
    content,
  }));
  return {
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
    classification: "synthetic_non_personal",
    context_fingerprint: createHash("sha256")
      .update(JSON.stringify(frame)).digest("hex"),
    objective: { source_ref: "objective_1", content: frame.objective },
    decision_question: {
      source_ref: "question_1",
      content: frame.decisionQuestion,
    },
    options,
    constraints,
    criteria,
    policy: {
      mode: input.policy.mode,
      allow_final_advice: input.riskBoundary.allowFinalAdvice,
      allow_direct_answer: input.riskBoundary.allowDirectAnswer,
      require_scenarios: input.riskBoundary.requireScenarioFrame,
      require_risks: input.riskBoundary.requireRiskFrame,
      require_tradeoffs: input.riskBoundary.requireTradeoffFrame,
      require_consequences: input.riskBoundary.requireConsequenceFrame,
      require_uncertainty: input.riskBoundary.requireUncertaintyFrame,
    },
    allowed_refs: {
      source_refs: [
        "objective_1",
        "question_1",
        ...constraints.map((item) => item.source_ref),
        ...options.map((item) => item.option_ref),
        ...options.map((item) => item.scenario_ref),
        ...criteria.map((item) => item.criterion_ref),
        "unknown",
      ],
      option_refs: options.map((item) => item.option_ref),
      scenario_refs: options.map((item) => item.scenario_ref),
      criterion_refs: criteria.map((item) => item.criterion_ref),
    },
  };
}

export function runMinimumNecessaryPromptContextProof():
MinimumNecessaryPromptContextProofResult {
  const checks: MinimumNecessaryPromptContextProofCheck[] = [];
  const add = (checkId: string, passed: boolean) => {
    checks.push({ checkId, passed });
  };

  const sourceRequest = canonicalBridgeRequest();
  const bridge = bridgeDecisionEngineToPromptContext(sourceRequest);
  const promptOutput = bridge.status === "ready"
    ? bridge.promptContextOutput
    : undefined;
  const validated = validateProductionPromptContext(promptOutput);
  const providerRequest = promptOutput
    ? buildDecisionMaterialProviderRequest(promptOutput)
    : undefined;
  const serialized = providerRequest
    ? JSON.parse(providerRequest.input) as Record<string, unknown>
    : undefined;

  add("canonical-allowed-prompt-context-passes",
    bridge.status === "ready" && validated.status === "valid");
  add("provider-input-originates-from-canonical-prompt-context",
    bridge.status === "ready" &&
    bridge.evidence.promptContextBoundaryUsed === true &&
    validated.status === "valid" &&
    validated.value === bridge.promptContextOutput);
  add("provider-payload-is-exactly-reconstructable",
    Boolean(promptOutput && providerRequest &&
      providerRequest.input === JSON.stringify(expectedProviderContext(promptOutput))));
  add("only-explicit-provider-context-fields-are-serialized",
    exactKeys(serialized, [
      "capability",
      "contract_version",
      "classification",
      "context_fingerprint",
      "objective",
      "decision_question",
      "options",
      "constraints",
      "criteria",
      "policy",
      "allowed_refs",
    ]) &&
    exactKeys(serialized?.objective, ["source_ref", "content"]) &&
    exactKeys(serialized?.decision_question, ["source_ref", "content"]) &&
    exactKeys(serialized?.policy, [
      "mode",
      "allow_final_advice",
      "allow_direct_answer",
      "require_scenarios",
      "require_risks",
      "require_tradeoffs",
      "require_consequences",
      "require_uncertainty",
    ]) &&
    exactKeys(serialized?.allowed_refs, [
      "source_refs", "option_refs", "scenario_refs", "criterion_refs",
    ]));

  const unrelatedSentinel = "UNRELATED_ACCOUNT_DRAFT_USER_STATE";
  const unrelatedRequest = clone(sourceRequest);
  const unrelatedContext = unrelatedRequest.decisionContext as Record<string, unknown>;
  unrelatedContext.evidence = [{
    accountState: unrelatedSentinel,
    draftState: unrelatedSentinel,
    userState: unrelatedSentinel,
  }];
  const unrelatedBridge = bridgeDecisionEngineToPromptContext(unrelatedRequest);
  const unrelatedProviderRequest = unrelatedBridge.status === "ready"
    ? buildDecisionMaterialProviderRequest(unrelatedBridge.promptContextOutput)
    : undefined;
  add("unrelated-source-state-is-excluded-and-invariant",
    bridge.status === "ready" && unrelatedBridge.status === "ready" &&
    JSON.stringify(bridge.promptContextOutput.contextFrame) ===
      JSON.stringify(unrelatedBridge.promptContextOutput.contextFrame) &&
    providerRequest?.input === unrelatedProviderRequest?.input &&
    !providerRequest?.input.includes(unrelatedSentinel));
  add("omitted-optional-safety-context-remains-omitted",
    bridge.status === "ready" &&
    !(bridge.promptContextInput as unknown as Record<string, unknown>).safety &&
    !providerRequest?.input.includes("Safety domain:") &&
    !providerRequest?.input.includes("requiredEscalations"));

  const malformedRequest = clone(sourceRequest);
  const malformedContext = malformedRequest.decisionContext as Record<string, unknown>;
  const malformedGoals = malformedContext.goals as Array<Record<string, unknown>>;
  malformedGoals[0].unapproved = unrelatedSentinel;
  const malformed = bridgeDecisionEngineToPromptContext(malformedRequest);
  add("malformed-unapproved-source-context-fails-closed",
    malformed.status === "blocked" &&
    malformed.error.code === "decision_context_invalid");

  const unknownBridgeField = bridgeDecisionEngineToPromptContext({
    ...sourceRequest,
    accountState: unrelatedSentinel,
  });
  add("unrelated-top-level-bypass-fails-closed",
    unknownBridgeField.status === "blocked" &&
    unknownBridgeField.error.code === "unknown_top_level_field_rejected");
  add("direct-decision-context-provider-bypass-is-rejected",
    validateProductionPromptContext(sourceRequest.decisionContext).status === "blocked");
  add("unapproved-prompt-output-field-fails-closed",
    Boolean(promptOutput && validateProductionPromptContext({
      ...promptOutput,
      accountState: unrelatedSentinel,
    }).status === "blocked"));

  const repeatedBridge = bridgeDecisionEngineToPromptContext(clone(sourceRequest));
  const repeatedProviderRequest = repeatedBridge.status === "ready"
    ? buildDecisionMaterialProviderRequest(repeatedBridge.promptContextOutput)
    : undefined;
  add("identical-input-produces-identical-provider-bound-context",
    bridge.status === "ready" && repeatedBridge.status === "ready" &&
    JSON.stringify(bridge.promptContextOutput) ===
      JSON.stringify(repeatedBridge.promptContextOutput) &&
    providerRequest?.input === repeatedProviderRequest?.input);

  add("provider-configuration-cost-runtime-boundaries-unchanged",
    providerRequest?.model === OPENAI_DECISION_MATERIAL_MODEL &&
    providerRequest.model === "gpt-5.6-terra" &&
    providerRequest.store === false && providerRequest.stream === false &&
    providerRequest.background === false && providerRequest.strict === true &&
    providerRequest.tools.length === 0 &&
    providerRequest.maxOutputTokens === 2500 &&
    OPENAI_DECISION_MATERIAL_LIMITS.maxInputTokens === 6000 &&
    OPENAI_DECISION_MATERIAL_LIMITS.maxTotalTokens === 8500 &&
    OPENAI_DECISION_MATERIAL_LIMITS.maxCostUsd === 0.05 &&
    OPENAI_DECISION_MATERIAL_LIMITS.maxProviderRequests === 2);
  add("existing-prompt-context-bridge-regression-remains-valid",
    runDecisionEnginePromptContextBridgeValidation().passed);

  const passed = checks.filter((item) => item.passed).length;
  const failed = checks.length - passed;
  return {
    version: MINIMUM_NECESSARY_PROMPT_CONTEXT_PROOF_VERSION,
    guaranteeId: "minimum_necessary_prompt_context",
    canonicalObligation:
      "Prove minimum-necessary Prompt Context selection before provider invocation.",
    rootCause: "PROOF_MISSING",
    status: failed === 0 ? "PASS" : "FAIL",
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      providerOperations: 0,
      apiOperations: 0,
      humanReviewOperations: 0,
    },
  };
}
