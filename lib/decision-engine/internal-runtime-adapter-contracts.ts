import type { DecisionEngineStatus, SimulationResponseV2Draft } from "./contracts";
import type {
  DecisionContext,
  DecisionInput,
  DecisionIntent,
  SafetyBoundary,
} from "./types";

export const INTERNAL_RUNTIME_ADAPTER_VERSION = "1.0" as const;
export const INTERNAL_DETERMINISTIC_RUNTIME_MODE = "internal_deterministic_v2" as const;

export type InternalRuntimeAdapterVersion = typeof INTERNAL_RUNTIME_ADAPTER_VERSION;
export type InternalRuntimeMode = typeof INTERNAL_DETERMINISTIC_RUNTIME_MODE;

export type InternalRuntimeAdapterRequest = {
  adapterVersion: InternalRuntimeAdapterVersion;
  requestId: string;
  originalText: string;
  inputLanguage: string;
  requestedOutputLanguage: string;
  userIntent: DecisionIntent;
  context?: DecisionContext;
  safety?: SafetyBoundary;
  safetyContextComplete?: boolean;
};

export type InternalCanonicalRuntimeOptions = {
  context?: DecisionContext;
  safety?: SafetyBoundary;
  safetyContextComplete?: boolean;
};

export type InternalRuntimeIsolationEvidence = {
  publicRuntimeTouched: false;
  publicApiTouched: false;
  persistenceUsed: false;
  externalProviderUsed: false;
  memoryUsed: false;
  authUsed: false;
  subscriptionUsed: false;
  rawContentLogged: false;
};

export type InternalRuntimeAdapterValidation = {
  valid: boolean;
  errors: string[];
};

export type InternalRuntimeAdapterResult = {
  adapterVersion: InternalRuntimeAdapterVersion;
  requestId: string;
  mode: InternalRuntimeMode;
  status: DecisionEngineStatus;
  response: SimulationResponseV2Draft;
  adapterValidation: InternalRuntimeAdapterValidation;
  operational: InternalRuntimeIsolationEvidence;
};

export type InternalRuntimeAdapterValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: DecisionEngineStatus;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type InternalRuntimeAdapterValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: InternalRuntimeAdapterValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type CanonicalDecisionInputBuilder = (
  request: InternalRuntimeAdapterRequest,
) => DecisionInput;
