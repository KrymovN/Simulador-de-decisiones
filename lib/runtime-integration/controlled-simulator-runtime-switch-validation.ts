import type { Constraint, DecisionContext, DecisionOption } from "../decision-engine/types";
import {
  CONTROLLED_SIMULATOR_SWITCH_MODE,
  CONTROLLED_SIMULATOR_SWITCH_VERSION,
  type ControlledSimulatorSwitchRequest,
  type ControlledSimulatorSwitchResult,
  type ControlledSimulatorSwitchValidationCaseResult,
  type ControlledSimulatorSwitchValidationResult,
} from "./controlled-simulator-runtime-switch-contracts";
import {
  runControlledSimulatorRuntimeSwitch,
  validateControlledSimulatorSwitchRequest,
} from "./controlled-simulator-runtime-switch";

type SwitchValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => ControlledSimulatorSwitchResult;
  assertions: ((result: ControlledSimulatorSwitchResult) => string | undefined)[];
};

const enabledFlags = {
  controlledInternalDevV2: true,
  simulatorSandboxV2: true,
  fallbackToPublicMockV1: true,
};
const known = <T>(value: T) => ({ status: "known" as const, value, evidenceRefs: [] });

function option(id: string, type: DecisionOption["type"] = "action"): DecisionOption {
  return {
    id,
    label: id,
    description: `Controlled switch option ${id}`,
    type,
    userProposed: true,
    feasible: known(true),
    evidenceRefs: [],
  };
}

function constraint(id: string): Constraint {
  return {
    id,
    description: `Controlled switch constraint ${id}`,
    kind: "resource",
    severity: "preference",
    appliesToOptionIds: [],
    evidenceRefs: [],
  };
}

function completeContext(id: string): DecisionContext {
  return {
    decisionId: `switch_decision_${id}`,
    decisionTypes: ["comparative"],
    statement: "Choose between two controlled switch options.",
    goals: [{
      id: `switch_goal_${id}`,
      description: "Select the strongest controlled option.",
      priority: "primary",
      successCriteria: known(["Goal alignment"]),
      evidenceRefs: [],
    }],
    options: [option(`switch_option_${id}_a`), option(`switch_option_${id}_b`, "no_action")],
    constraints: [constraint(`switch_constraint_${id}`)],
    variables: [{
      id: `switch_variable_${id}`,
      name: "Capacity",
      description: "Known capacity.",
      value: known("sufficient"),
      materiality: "important",
      volatility: "stable",
      affectedOptionIds: [],
    }],
    stakeholders: [],
    timeHorizon: {
      decisionDeadline: known("30 days"),
      shortTermWindow: known("90 days"),
      longTermWindow: known("12 months"),
      delayCost: known("low"),
      reversibilityWindow: known("90 days"),
    },
    assumptions: [{
      id: `switch_assumption_${id}`,
      statement: "Capacity remains available.",
      source: "user",
      materiality: "important",
      validationStatus: "validated",
      affectedEntityIds: [],
      evidenceRefs: [],
    }],
    evidence: [],
  };
}

function request(id: string, context?: DecisionContext): ControlledSimulatorSwitchRequest {
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    executionContext: "internal_dev",
    requestId: `controlled_switch_${id}`,
    input: "Compare the controlled options.",
    lang: "es",
    requestedOutputLanguage: "en",
    userIntent: "recommend",
    context,
  };
}

function isV1(result: ControlledSimulatorSwitchResult): string | undefined {
  if (result.selectedPath !== "public_mock_v1") {
    return "Expected public_mock_v1 path.";
  }

  const response = result.response as unknown as Record<string, unknown>;
  return response.simulation !== undefined &&
    response.thinkingStages !== undefined &&
    response.contractVersion === undefined
    ? undefined
    : "V1 result must preserve the existing SimulationResponse envelope.";
}

function isV2(result: ControlledSimulatorSwitchResult): string | undefined {
  if (result.selectedPath !== "controlled_internal_v2") {
    return "Expected controlled_internal_v2 path.";
  }

  const response = result.response as unknown as Record<string, unknown>;
  return response.contractVersion === "2.0" &&
    response.simulation === undefined &&
    result.uiModel.requestId === result.requestId
    ? undefined
    : "V2 result must preserve the V2 envelope and UI mapping.";
}

function isolation(result: ControlledSimulatorSwitchResult): string | undefined {
  const evidence = result.evidence;

  return evidence.denyByDefault &&
    evidence.explicitInternalDevGateRequired &&
    evidence.publicUserEligible === false &&
    evidence.publicApiContractChanged === false &&
    evidence.publicUiChanged === false &&
    evidence.v1V2EnvelopeMixed === false &&
    evidence.persistenceUsed === false &&
    evidence.externalProviderUsed === false &&
    evidence.memoryUsed === false &&
    evidence.authUsed === false &&
    evidence.subscriptionUsed === false
    ? undefined
    : "Controlled switch isolation evidence changed.";
}

function cases(): SwitchValidationCase[] {
  const invalidContext = {} as DecisionContext;

  return [
    {
      id: "deny_by_default",
      title: "Switch selects V1 when all gates are absent",
      expectedBehavior: "Preserve existing simulator behavior without V2 execution.",
      run: () => runControlledSimulatorRuntimeSwitch(request("default"), {}),
      assertions: [
        isV1,
        (result) => result.fallback.used ? "Default V1 selection is not a runtime fallback." : undefined,
        (result) => result.evidence.sandboxUsedForV2 ? "Default path must not execute sandbox." : undefined,
      ],
    },
    {
      id: "sandbox_gate_required",
      title: "Switch requires both controlled and sandbox gates",
      expectedBehavior: "Preserve V1 when the sandbox gate is absent.",
      run: () => runControlledSimulatorRuntimeSwitch(request("sandbox_gate"), { controlledInternalDevV2: true }),
      assertions: [isV1],
    },
    {
      id: "raw_internal_dev_v2",
      title: "Explicit internal-dev gate executes raw-input V2",
      expectedBehavior: "Run sandbox and map clarification V2.",
      run: () => runControlledSimulatorRuntimeSwitch(request("raw_v2"), enabledFlags),
      assertions: [
        isV2,
        (result) =>
          result.selectedPath === "controlled_internal_v2" &&
          result.response.status === "clarification_required" &&
          result.uiModel.renderState === "clarification"
            ? undefined
            : "Expected clarification V2 and UI mapping.",
      ],
    },
    {
      id: "structured_internal_dev_v2",
      title: "Explicit internal-dev gate executes structured V2",
      expectedBehavior: "Run the full sandbox, adapter, brain, and UI mapping chain.",
      run: () => runControlledSimulatorRuntimeSwitch(
        request("structured_v2", completeContext("structured_v2")),
        enabledFlags,
      ),
      assertions: [
        isV2,
        (result) =>
          result.evidence.sandboxUsedForV2 && result.evidence.uiMappingUsedForV2
            ? undefined
            : "Expected sandbox and UI mapping evidence.",
      ],
    },
    {
      id: "invalid_request",
      title: "Malformed switch request returns controlled failure",
      expectedBehavior: "Return controlled failure without selecting V1 or V2.",
      run: () => runControlledSimulatorRuntimeSwitch({ requestId: "invalid" }, enabledFlags),
      assertions: [
        (result) => result.selectedPath === "controlled_failure" ? undefined : "Expected controlled failure.",
        (result) => result.selectedPath === "controlled_failure" && result.failure.code === "invalid_switch_request"
          ? undefined
          : "Expected invalid_switch_request.",
      ],
    },
    {
      id: "invalid_internal_mode",
      title: "Unknown internal mode returns controlled failure",
      expectedBehavior: "Deny internal execution rather than selecting a public mode.",
      run: () => runControlledSimulatorRuntimeSwitch(
        { ...request("invalid_mode"), mode: "public_deterministic_v2" },
        enabledFlags,
      ),
      assertions: [
        (result) => result.selectedPath === "controlled_failure" ? undefined : "Expected controlled failure.",
      ],
    },
    {
      id: "deterministic_failure_fallback",
      title: "Deterministic controlled failure visibly falls back to V1",
      expectedBehavior: "Return V1 with explicit fallback reason and source status.",
      run: () => runControlledSimulatorRuntimeSwitch(
        request("failure_fallback", invalidContext),
        enabledFlags,
      ),
      assertions: [
        isV1,
        (result) =>
          result.selectedPath === "public_mock_v1" &&
          result.fallback.used &&
          result.fallback.reason === "deterministic_failed" &&
          result.fallback.sourceStatus === "failed"
            ? undefined
            : "Expected explicit deterministic failure fallback.",
      ],
    },
    {
      id: "deterministic_failure_no_fallback",
      title: "Fallback policy can preserve controlled failure",
      expectedBehavior: "Return controlled failure when V1 fallback is explicitly disabled.",
      run: () => runControlledSimulatorRuntimeSwitch(
        request("failure_no_fallback", invalidContext),
        { ...enabledFlags, fallbackToPublicMockV1: false },
      ),
      assertions: [
        (result) =>
          result.selectedPath === "controlled_failure" &&
          result.failure.code === "deterministic_execution_failed"
            ? undefined
            : "Expected deterministic controlled failure.",
      ],
    },
    {
      id: "strict_v1_v2_boundary",
      title: "Switch result keeps V1 and V2 envelopes separate",
      expectedBehavior: "Return one discriminated contract without mixed fields.",
      run: () => runControlledSimulatorRuntimeSwitch(
        request("boundary", completeContext("boundary")),
        enabledFlags,
      ),
      assertions: [isV2, isolation],
    },
    {
      id: "public_isolation",
      title: "Controlled switch remains internal and dependency-free",
      expectedBehavior: "Expose no public eligibility or forbidden runtime coupling.",
      run: () => runControlledSimulatorRuntimeSwitch(request("isolation"), {}),
      assertions: [isV1, isolation],
    },
  ];
}

export function validateControlledSimulatorSwitchResult(
  value: unknown,
): value is ControlledSimulatorSwitchResult {
  if (!isRecord(value)) {
    return false;
  }

  const result = value as ControlledSimulatorSwitchResult;
  return (
    result.switchVersion === CONTROLLED_SIMULATOR_SWITCH_VERSION &&
    result.mode === CONTROLLED_SIMULATOR_SWITCH_MODE &&
    typeof result.requestId === "string" &&
    isolation(result) === undefined &&
    (result.selectedPath === "public_mock_v1"
      ? result.selectedContract === "SimulationResponse" && isV1(result) === undefined
      : result.selectedPath === "controlled_internal_v2"
        ? result.selectedContract === "SimulationResponseV2Draft" && isV2(result) === undefined
        : result.selectedPath === "controlled_failure" &&
          result.selectedContract === "none" &&
          typeof result.failure.message === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function runControlledSimulatorSwitchValidation(): ControlledSimulatorSwitchValidationResult {
  const results = cases().map((validationCase): ControlledSimulatorSwitchValidationCaseResult => {
    try {
      const result = validationCase.run();
      const issues = [
        ...(validateControlledSimulatorSwitchResult(result)
          ? []
          : ["Controlled simulator switch result validation failed."]),
        ...validationCase.assertions
          .map((assertion) => assertion(result))
          .filter((issue): issue is string => Boolean(issue)),
      ];

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualPath: result.selectedPath,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      };
    } catch {
      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualPath: "controlled_failure",
        passed: false,
        failed: true,
        issues: ["Controlled simulator switch validation case threw an uncaught exception."],
      };
    }
  });
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
