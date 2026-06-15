import type { SimulationResponseV2Draft } from "./contracts";
import {
  validateInternalRuntimeAdapterResult,
  validateSimulationResponseV2DeepInvariants,
} from "./internal-runtime-adapter-validation";
import type {
  Constraint,
  DecisionContext,
  DecisionOption,
  SafetyBoundary,
} from "./types";
import {
  SIMULATOR_SANDBOX_RUNTIME_MODE,
  SIMULATOR_SANDBOX_VERSION,
  type SimulatorSandboxRequest,
  type SimulatorSandboxResult,
  type SimulatorSandboxValidationCaseResult,
  type SimulatorSandboxValidationResult,
} from "./simulator-integration-sandbox-contracts";
import {
  runSimulatorIntegrationSandbox,
  validateSimulatorSandboxRequestShape,
} from "./simulator-integration-sandbox";

type SandboxValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => SimulatorSandboxResult;
  assertions: ((result: SimulatorSandboxResult) => string | undefined)[];
};

const enabledFlags = { simulatorSandboxV2: true };
const disabledFlags = { simulatorSandboxV2: false };
const known = <T>(value: T) => ({ status: "known" as const, value, evidenceRefs: [] });

function option(id: string, type: DecisionOption["type"] = "action"): DecisionOption {
  return {
    id,
    label: id,
    description: `Sandbox option ${id}`,
    type,
    userProposed: true,
    feasible: known(true),
    evidenceRefs: [],
  };
}

function constraint(id: string): Constraint {
  return {
    id,
    description: `Sandbox constraint ${id}`,
    kind: "resource",
    severity: "preference",
    appliesToOptionIds: [],
    evidenceRefs: [],
  };
}

function completeContext(id: string): DecisionContext {
  return {
    decisionId: `sandbox_decision_${id}`,
    decisionTypes: ["comparative"],
    statement: "Choose between two sandbox options.",
    goals: [
      {
        id: `sandbox_goal_${id}`,
        description: "Select the option with the strongest goal alignment.",
        priority: "primary",
        successCriteria: known(["Goal alignment"]),
        evidenceRefs: [],
      },
    ],
    options: [option(`sandbox_option_${id}_a`), option(`sandbox_option_${id}_b`, "no_action")],
    constraints: [constraint(`sandbox_constraint_${id}`)],
    variables: [
      {
        id: `sandbox_variable_${id}`,
        name: "Available capacity",
        description: "Known available capacity.",
        value: known("sufficient"),
        materiality: "important",
        volatility: "stable",
        affectedOptionIds: [],
      },
    ],
    stakeholders: [],
    timeHorizon: {
      decisionDeadline: known("30 days"),
      shortTermWindow: known("90 days"),
      longTermWindow: known("12 months"),
      delayCost: known("low"),
      reversibilityWindow: known("90 days"),
    },
    assumptions: [
      {
        id: `sandbox_assumption_${id}`,
        statement: "Current capacity remains available.",
        source: "user",
        materiality: "important",
        validationStatus: "validated",
        affectedEntityIds: [],
        evidenceRefs: [],
      },
    ],
    evidence: [],
  };
}

const restrictedSafety: SafetyBoundary = {
  domain: "financial",
  level: "restricted",
  recommendationAllowed: false,
  requiredNotices: ["Direct recommendation is restricted."],
  requiredEscalations: ["Use qualified financial review."],
  prohibitedOutputs: ["Consequential preferred path"],
  rationale: "The sandbox explicitly supplies a restricted safety boundary.",
};

function sandboxRequest(id: string, context?: DecisionContext): SimulatorSandboxRequest {
  return {
    sandboxVersion: SIMULATOR_SANDBOX_VERSION,
    mode: SIMULATOR_SANDBOX_RUNTIME_MODE,
    requestId: `sandbox_validation_${id}`,
    input: "Compare the available options against the stated goal.",
    lang: "en",
    requestedOutputLanguage: "en",
    userIntent: "recommend",
    context,
  };
}

function responseIsV2(result: SimulatorSandboxResult): string | undefined {
  return result.response?.contractVersion === "2.0" &&
    typeof result.response.responseId === "string"
    ? undefined
    : "Sandbox must generate SimulationResponse V2.";
}

function adapterExecuted(result: SimulatorSandboxResult): string | undefined {
  return result.enabled &&
    result.adapter?.requestId === result.requestId &&
    result.adapter.response === result.response
    ? undefined
    : "Sandbox must execute through the controlled internal adapter.";
}

function sandboxIsolationPreserved(result: SimulatorSandboxResult): string | undefined {
  const expectedFalse = [
    result.operational.publicRuntimeTouched,
    result.operational.publicApiTouched,
    result.operational.persistenceUsed,
    result.operational.externalProviderUsed,
    result.operational.memoryUsed,
    result.operational.authUsed,
    result.operational.subscriptionUsed,
    result.operational.rawContentLogged,
    result.operational.publicRouteExposed,
    result.operational.publicNavigationExposed,
  ];

  return result.operational.sandboxOnly === true &&
    expectedFalse.every((value) => value === false)
    ? undefined
    : "Sandbox isolation evidence changed.";
}

function noV1Envelope(result: SimulatorSandboxResult): string | undefined {
  if (!result.response) {
    return undefined;
  }

  const response = result.response as unknown as Record<string, unknown>;

  return response.simulation === undefined &&
    response.thinkingStages === undefined &&
    response.lang === undefined
    ? undefined
    : "Sandbox response must not expose the public V1 envelope.";
}

function scenariosAvailable(result: SimulatorSandboxResult): string | undefined {
  return result.response?.analysis?.scenarios.length &&
    result.response.availability.scenarios.status === "available"
    ? undefined
    : "Expected sandbox V2 scenarios.";
}

function recommendationAbsent(result: SimulatorSandboxResult): string | undefined {
  return result.response?.recommendation === undefined
    ? undefined
    : "Expected sandbox recommendation to be absent.";
}

function gapExists(code: SimulationResponseV2Draft["gaps"][number]["code"]) {
  return (result: SimulatorSandboxResult): string | undefined =>
    result.response?.gaps.some((gap) => gap.code === code)
      ? undefined
      : `Expected ${code} gap.`;
}

export function validateSimulatorSandboxResult(
  value: unknown,
): value is SimulatorSandboxResult {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("sandboxValidation" in value) ||
    !("operational" in value)
  ) {
    return false;
  }

  const result = value as SimulatorSandboxResult;

  return (
    result.sandboxVersion === SIMULATOR_SANDBOX_VERSION &&
    result.mode === SIMULATOR_SANDBOX_RUNTIME_MODE &&
    typeof result.requestId === "string" &&
    typeof result.enabled === "boolean" &&
    typeof result.sandboxValidation?.valid === "boolean" &&
    Array.isArray(result.sandboxValidation?.errors) &&
    (result.enabled
      ? result.status === result.response?.status &&
        validateInternalRuntimeAdapterResult(result.adapter) &&
        validateSimulationResponseV2DeepInvariants(result.response, result.requestId).length === 0
      : result.adapter === undefined &&
        result.response === undefined &&
        (result.status === "disabled" || result.status === "rejected")) &&
    sandboxIsolationPreserved(result) === undefined &&
    noV1Envelope(result) === undefined
  );
}

function commonIssues(result: SimulatorSandboxResult): string[] {
  const issues = result.response
    ? validateSimulationResponseV2DeepInvariants(result.response, result.requestId)
    : [];

  if (!validateSimulatorSandboxResult(result)) {
    issues.push("Simulator sandbox result validation failed.");
  }

  const isolationIssue = sandboxIsolationPreserved(result);
  const v1Issue = noV1Envelope(result);

  if (isolationIssue) issues.push(isolationIssue);
  if (v1Issue) issues.push(v1Issue);

  return issues;
}

function sandboxCases(): SandboxValidationCase[] {
  const repeatRequest = sandboxRequest("deterministic_repeat", completeContext("deterministic_repeat"));

  return [
    {
      id: "feature_flag_disabled",
      title: "Sandbox denies execution when its flag is disabled",
      expectedBehavior: "Return controlled failure without enabling sandbox execution.",
      run: () => runSimulatorIntegrationSandbox(sandboxRequest("flag_disabled"), disabledFlags),
      assertions: [
        (result) => result.enabled ? "Disabled sandbox must not report enabled execution." : undefined,
        (result) => result.status === "disabled" ? undefined : "Disabled sandbox must return disabled.",
        (result) => result.adapter === undefined ? undefined : "Disabled sandbox must not execute the adapter.",
        (result) => result.response === undefined ? undefined : "Disabled sandbox must not generate V2.",
      ],
    },
    {
      id: "feature_flag_enabled",
      title: "Sandbox executes the adapter when explicitly enabled",
      expectedBehavior: "Execute through the adapter and generate V2.",
      run: () => runSimulatorIntegrationSandbox(sandboxRequest("flag_enabled", completeContext("flag_enabled")), enabledFlags),
      assertions: [adapterExecuted, responseIsV2, scenariosAvailable],
    },
    {
      id: "raw_simulator_input",
      title: "Simulator-shaped raw input preserves missing context",
      expectedBehavior: "Generate clarification V2 without semantic invention.",
      run: () => runSimulatorIntegrationSandbox(sandboxRequest("raw_input"), enabledFlags),
      assertions: [
        adapterExecuted,
        responseIsV2,
        gapExists("missing_context"),
        (result) => result.status === "clarification_required" ? undefined : "Expected clarification_required.",
      ],
    },
    {
      id: "end_to_end_analysis",
      title: "Sandbox executes deterministic analysis end to end",
      expectedBehavior: "Generate scenarios and risks through the adapter and deterministic brain.",
      run: () => runSimulatorIntegrationSandbox(sandboxRequest("end_to_end", completeContext("end_to_end")), enabledFlags),
      assertions: [adapterExecuted, responseIsV2, scenariosAvailable],
    },
    {
      id: "restricted_safety",
      title: "Sandbox preserves restricted safety behavior",
      expectedBehavior: "Generate cannot_recommend V2 without normal recommendation.",
      run: () =>
        runSimulatorIntegrationSandbox(
          {
            ...sandboxRequest("restricted_safety", completeContext("restricted_safety")),
            safety: restrictedSafety,
            safetyContextComplete: true,
          },
          enabledFlags,
        ),
      assertions: [
        (result) => result.status === "cannot_recommend" ? undefined : "Expected cannot_recommend.",
        recommendationAbsent,
      ],
    },
    {
      id: "malformed_request",
      title: "Malformed sandbox request fails safely",
      expectedBehavior: "Return controlled failure without uncaught exception.",
      run: () => runSimulatorIntegrationSandbox({ requestId: "sandbox_validation_malformed" }, enabledFlags),
      assertions: [
        (result) => result.status === "rejected" ? undefined : "Malformed request must be rejected.",
        (result) => result.enabled ? "Malformed request must not enable sandbox execution." : undefined,
        (result) => result.adapter === undefined ? undefined : "Rejected request must not execute the adapter.",
      ],
    },
    {
      id: "invalid_mode",
      title: "Sandbox rejects non-sandbox runtime modes",
      expectedBehavior: "Return controlled failure without selecting public runtime.",
      run: () =>
        runSimulatorIntegrationSandbox(
          { ...sandboxRequest("invalid_mode"), mode: "public_deterministic_v2" },
          enabledFlags,
        ),
      assertions: [
        (result) => result.status === "rejected" ? undefined : "Invalid mode must be rejected.",
        recommendationAbsent,
      ],
    },
    {
      id: "deterministic_repeat",
      title: "Repeated sandbox execution remains deterministic",
      expectedBehavior: "Return byte-equivalent results for identical requests.",
      run: () => {
        const first = runSimulatorIntegrationSandbox(repeatRequest, enabledFlags);
        const second = runSimulatorIntegrationSandbox(repeatRequest, enabledFlags);

        if (JSON.stringify(first) !== JSON.stringify(second)) {
          return {
            ...first,
            sandboxValidation: {
              valid: false,
              errors: ["Repeated sandbox execution changed deterministic output."],
            },
          };
        }

        return first;
      },
      assertions: [
        (result) =>
          result.sandboxValidation.valid
            ? undefined
            : "Repeated sandbox execution changed deterministic output.",
      ],
    },
    {
      id: "public_isolation",
      title: "Sandbox remains isolated from public runtime",
      expectedBehavior: "Expose only V2 and explicit sandbox isolation evidence.",
      run: () => runSimulatorIntegrationSandbox(sandboxRequest("public_isolation", completeContext("public_isolation")), enabledFlags),
      assertions: [sandboxIsolationPreserved, noV1Envelope],
    },
  ];
}

/**
 * Executes Stage 3.13 simulator sandbox smoke and isolation validation.
 */
export function runSimulatorIntegrationSandboxValidation(): SimulatorSandboxValidationResult {
  const cases = sandboxCases().map((validationCase): SimulatorSandboxValidationCaseResult => {
    try {
      const result = validationCase.run();
      const issues = [
        ...commonIssues(result),
        ...validationCase.assertions
          .map((assertion) => assertion(result))
          .filter((issue): issue is string => Boolean(issue)),
      ];

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: result.status,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      };
    } catch {
      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: "rejected",
        passed: false,
        failed: true,
        issues: ["Simulator sandbox validation case threw an uncaught exception."],
      };
    }
  });
  const passed = cases.filter((validationCase) => validationCase.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed,
    },
  };
}
