import { DECISION_ENGINE_STATUSES, type SimulationResponseV2Draft } from "./contracts";
import {
  INTERNAL_DETERMINISTIC_RUNTIME_MODE,
  INTERNAL_RUNTIME_ADAPTER_VERSION,
  type InternalCanonicalRuntimeOptions,
  type InternalRuntimeAdapterRequest,
  type InternalRuntimeAdapterResult,
  type InternalRuntimeAdapterValidation,
  type InternalRuntimeIsolationEvidence,
  type InternalRuntimeMode,
} from "./internal-runtime-adapter-contracts";
import { runSimulationPipeline } from "./pipeline";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import type { DecisionInput } from "./types";
import { validateDecisionInputShape } from "./validation";

const DECISION_INTENTS = ["explore", "compare", "recommend", "review"] as const;

const ISOLATION_EVIDENCE: InternalRuntimeIsolationEvidence = {
  publicRuntimeTouched: false,
  publicApiTouched: false,
  persistenceUsed: false,
  externalProviderUsed: false,
  memoryUsed: false,
  authUsed: false,
  subscriptionUsed: false,
  rawContentLogged: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeRequestId(value: unknown): string {
  return isRecord(value) && isNonEmptyString(value.requestId)
    ? value.requestId
    : "invalid_internal_runtime_request";
}

function invalidDecisionInput(requestId: string): DecisionInput {
  return { requestId } as DecisionInput;
}

function adapterResult(
  requestId: string,
  response: SimulationResponseV2Draft,
  validation: InternalRuntimeAdapterValidation,
): InternalRuntimeAdapterResult {
  return {
    adapterVersion: INTERNAL_RUNTIME_ADAPTER_VERSION,
    requestId,
    mode: INTERNAL_DETERMINISTIC_RUNTIME_MODE,
    status: response.status,
    response,
    adapterValidation: validation,
    operational: { ...ISOLATION_EVIDENCE },
  };
}

function failureResult(requestId: string, errors: string[]): InternalRuntimeAdapterResult {
  return adapterResult(
    requestId,
    runSimulationPipeline(invalidDecisionInput(requestId)),
    { valid: false, errors },
  );
}

export function validateInternalRuntimeMode(value: unknown): value is InternalRuntimeMode {
  return value === INTERNAL_DETERMINISTIC_RUNTIME_MODE;
}

export function validateInternalRuntimeAdapterRequestShape(
  value: unknown,
): value is InternalRuntimeAdapterRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.adapterVersion === INTERNAL_RUNTIME_ADAPTER_VERSION &&
    isNonEmptyString(value.requestId) &&
    typeof value.originalText === "string" &&
    isNonEmptyString(value.inputLanguage) &&
    isNonEmptyString(value.requestedOutputLanguage) &&
    typeof value.userIntent === "string" &&
    DECISION_INTENTS.includes(value.userIntent as (typeof DECISION_INTENTS)[number]) &&
    (value.context === undefined || isRecord(value.context)) &&
    (value.safety === undefined || isRecord(value.safety)) &&
    (value.safetyContextComplete === undefined || typeof value.safetyContextComplete === "boolean")
  );
}

export function buildInternalDecisionInput(
  request: InternalRuntimeAdapterRequest,
): DecisionInput {
  return {
    contractVersion: "2.0",
    requestId: request.requestId,
    input: {
      originalText: request.originalText,
      inputLanguage: request.inputLanguage,
      requestedOutputLanguage: request.requestedOutputLanguage,
    },
    userIntent: request.userIntent,
  };
}

/**
 * Invokes the deterministic pipeline through the controlled internal boundary.
 * It validates canonical input and does not call any public or external runtime.
 */
export function runCanonicalInternalRuntime(
  decisionInput: unknown,
  options: InternalCanonicalRuntimeOptions = {},
  mode: unknown = INTERNAL_DETERMINISTIC_RUNTIME_MODE,
): InternalRuntimeAdapterResult {
  const requestId = safeRequestId(decisionInput);
  const errors: string[] = [];

  if (!validateInternalRuntimeMode(mode)) {
    errors.push("Unsupported internal runtime mode.");
  }

  if (!validateDecisionInputShape(decisionInput)) {
    errors.push("Canonical DecisionInput shape validation failed.");
  }

  if (errors.length > 0) {
    return failureResult(requestId, errors);
  }

  const response = runSimulationPipeline(decisionInput as DecisionInput, options);

  if (
    !validateSimulationResponseV2DraftShape(response) ||
    !DECISION_ENGINE_STATUSES.includes(response.status)
  ) {
    return failureResult(requestId, ["Deterministic pipeline returned an invalid V2 response."]);
  }

  return adapterResult(requestId, response, { valid: true, errors: [] });
}

/**
 * Builds canonical deterministic input from the internal adapter request and
 * preserves missing context instead of inventing semantic structure.
 */
export function runInternalRuntimeAdapter(
  request: unknown,
  mode: unknown = INTERNAL_DETERMINISTIC_RUNTIME_MODE,
): InternalRuntimeAdapterResult {
  if (!validateInternalRuntimeMode(mode)) {
    return failureResult(safeRequestId(request), ["Unsupported internal runtime mode."]);
  }

  if (!validateInternalRuntimeAdapterRequestShape(request)) {
    return failureResult(safeRequestId(request), ["Internal runtime adapter request shape validation failed."]);
  }

  return runCanonicalInternalRuntime(
    buildInternalDecisionInput(request),
    {
      context: request.context,
      safety: request.safety,
      safetyContextComplete: request.safetyContextComplete,
    },
    mode,
  );
}
