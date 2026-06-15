import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import type { SimulationResponseV2UiModel } from "../decision-engine/simulation-response-v2-ui-mapping-contracts";
import type { SimulatorSandboxResult } from "../decision-engine/simulator-integration-sandbox-contracts";
import type { DecisionContext, DecisionIntent, SafetyBoundary } from "../decision-engine/types";
import type { SimulationResponse } from "../simulationEngine";

export const CONTROLLED_SIMULATOR_SWITCH_VERSION = "1.0" as const;
export const CONTROLLED_SIMULATOR_SWITCH_MODE = "controlled_internal_dev_v2" as const;

export type ControlledSimulatorSwitchVersion = typeof CONTROLLED_SIMULATOR_SWITCH_VERSION;
export type ControlledSimulatorSwitchMode = typeof CONTROLLED_SIMULATOR_SWITCH_MODE;
export type ControlledSimulatorExecutionContext = "internal_dev";

export type ControlledSimulatorSwitchFeatureFlags = {
  controlledInternalDevV2?: boolean;
  simulatorSandboxV2?: boolean;
  fallbackToPublicMockV1?: boolean;
};

export type ControlledSimulatorSwitchRequest = {
  switchVersion: ControlledSimulatorSwitchVersion;
  mode: ControlledSimulatorSwitchMode;
  executionContext: ControlledSimulatorExecutionContext;
  requestId: string;
  input: string;
  lang: "es";
  requestedOutputLanguage?: string;
  userIntent?: DecisionIntent;
  context?: DecisionContext;
  safety?: SafetyBoundary;
  safetyContextComplete?: boolean;
};

export type ControlledSimulatorFallbackReason =
  | "controlled_gate_disabled"
  | "sandbox_gate_disabled"
  | "sandbox_rejected"
  | "deterministic_failed"
  | "ui_mapping_failed";

export type ControlledSimulatorFailureCode =
  | "invalid_switch_request"
  | "sandbox_execution_failed"
  | "deterministic_execution_failed"
  | "ui_mapping_failed";

export type ControlledSimulatorSwitchEvidence = {
  denyByDefault: true;
  explicitInternalDevGateRequired: true;
  publicUserEligible: false;
  publicApiContractChanged: false;
  publicUiChanged: false;
  v1V2EnvelopeMixed: false;
  sandboxUsedForV2: boolean;
  uiMappingUsedForV2: boolean;
  persistenceUsed: false;
  externalProviderUsed: false;
  memoryUsed: false;
  authUsed: false;
  subscriptionUsed: false;
};

export type ControlledSimulatorV1Result = {
  switchVersion: ControlledSimulatorSwitchVersion;
  mode: ControlledSimulatorSwitchMode;
  requestId: string;
  selectedPath: "public_mock_v1";
  selectedContract: "SimulationResponse";
  response: SimulationResponse;
  fallback: {
    used: boolean;
    reason: ControlledSimulatorFallbackReason;
    sourceStatus?: SimulatorSandboxResult["status"];
  };
  evidence: ControlledSimulatorSwitchEvidence;
};

export type ControlledSimulatorV2Result = {
  switchVersion: ControlledSimulatorSwitchVersion;
  mode: ControlledSimulatorSwitchMode;
  requestId: string;
  selectedPath: "controlled_internal_v2";
  selectedContract: "SimulationResponseV2Draft";
  response: SimulationResponseV2Draft;
  uiModel: SimulationResponseV2UiModel;
  sandbox: SimulatorSandboxResult;
  fallback: {
    used: false;
  };
  evidence: ControlledSimulatorSwitchEvidence;
};

export type ControlledSimulatorFailureResult = {
  switchVersion: ControlledSimulatorSwitchVersion;
  mode: ControlledSimulatorSwitchMode;
  requestId: string;
  selectedPath: "controlled_failure";
  selectedContract: "none";
  failure: {
    code: ControlledSimulatorFailureCode;
    message: string;
    retryable: boolean;
    sourceStatus?: SimulatorSandboxResult["status"];
  };
  fallback: {
    used: false;
  };
  evidence: ControlledSimulatorSwitchEvidence;
};

export type ControlledSimulatorSwitchResult =
  | ControlledSimulatorV1Result
  | ControlledSimulatorV2Result
  | ControlledSimulatorFailureResult;

export type ControlledSimulatorSwitchValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualPath: ControlledSimulatorSwitchResult["selectedPath"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type ControlledSimulatorSwitchValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: ControlledSimulatorSwitchValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
