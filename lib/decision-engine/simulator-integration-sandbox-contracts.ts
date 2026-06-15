import type { DecisionEngineStatus, SimulationResponseV2Draft } from "./contracts";
import type {
  InternalRuntimeAdapterResult,
  InternalRuntimeAdapterValidation,
  InternalRuntimeIsolationEvidence,
} from "./internal-runtime-adapter-contracts";
import type {
  DecisionContext,
  DecisionIntent,
  SafetyBoundary,
} from "./types";

export const SIMULATOR_SANDBOX_VERSION = "1.0" as const;
export const SIMULATOR_SANDBOX_RUNTIME_MODE = "simulator_sandbox_v2" as const;

export type SimulatorSandboxVersion = typeof SIMULATOR_SANDBOX_VERSION;
export type SimulatorSandboxRuntimeMode = typeof SIMULATOR_SANDBOX_RUNTIME_MODE;
export type SimulatorSandboxStatus = DecisionEngineStatus | "disabled" | "rejected";

export type SimulatorSandboxFeatureFlags = {
  simulatorSandboxV2: boolean;
};

export type SimulatorSandboxRequest = {
  sandboxVersion: SimulatorSandboxVersion;
  mode: SimulatorSandboxRuntimeMode;
  requestId: string;
  input: string;
  lang: string;
  requestedOutputLanguage?: string;
  userIntent?: DecisionIntent;
  context?: DecisionContext;
  safety?: SafetyBoundary;
  safetyContextComplete?: boolean;
};

export type SimulatorSandboxResult = {
  sandboxVersion: SimulatorSandboxVersion;
  mode: SimulatorSandboxRuntimeMode;
  requestId: string;
  enabled: boolean;
  status: SimulatorSandboxStatus;
  response?: SimulationResponseV2Draft;
  adapter?: InternalRuntimeAdapterResult;
  sandboxValidation: InternalRuntimeAdapterValidation;
  operational: InternalRuntimeIsolationEvidence & {
    sandboxOnly: true;
    publicRouteExposed: false;
    publicNavigationExposed: false;
  };
};

export type SimulatorSandboxValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: SimulatorSandboxStatus;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SimulatorSandboxValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SimulatorSandboxValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
