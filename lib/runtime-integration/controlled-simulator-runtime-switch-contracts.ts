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

export type ControlledProductionAiFailureCode =
  | "production_ai_input_invalid"
  | "production_ai_configuration_invalid"
  | "production_ai_execution_failed";

export type ControlledProductionAiEvidence = {
  serverOnly: true;
  denyByDefault: true;
  existingControlledSwitchUsed: true;
  productionCompositionRootUsed: boolean;
  decisionEngineAuthorityPreserved: boolean;
  clientRuntimeSelectionAllowed: false;
  providerControlledByServer: true;
  modelControlledByAdapter: true;
  credentialsExposed: false;
  directProviderToSimulatorAllowed: false;
  publicApiContractChanged: false;
  publicUiChanged: false;
  persistenceUsed: false;
};

export type ControlledProductionAiV2Result = {
  switchVersion: ControlledSimulatorSwitchVersion;
  mode: ControlledSimulatorSwitchMode;
  requestId: string;
  selectedPath: "controlled_production_ai_v2";
  selectedContract: "SimulationResponseV2Draft";
  runtimeSource: "production_ai";
  response: SimulationResponseV2Draft;
  fallback: { used: false };
  evidence: ControlledProductionAiEvidence;
};

export type ControlledProductionAiFailureResult = {
  switchVersion: ControlledSimulatorSwitchVersion;
  mode: ControlledSimulatorSwitchMode;
  requestId: string;
  selectedPath: "controlled_failure";
  selectedContract: "none";
  runtimeSource: "production_ai";
  failure: {
    code: ControlledProductionAiFailureCode;
    message: string;
    retryable: false;
    sourceCode?: string;
  };
  fallback: { used: false };
  evidence: ControlledProductionAiEvidence;
};

export type ControlledServerRuntimeSelectionResult =
  | ControlledSimulatorSwitchResult
  | ControlledProductionAiV2Result
  | ControlledProductionAiFailureResult;

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
