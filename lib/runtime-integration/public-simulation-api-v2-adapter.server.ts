import "server-only";

import { validateSimulationResponseV2DraftShape } from "../decision-engine/simulation-response";
import {
  createSimulationResponseV2UiEmptyModel,
  mapSimulationResponseV2ToUiModel,
} from "../decision-engine/simulation-response-v2-ui-mapping";
import type { SimulationResponseV2UiModel } from "../decision-engine/simulation-response-v2-ui-mapping-contracts";
import type { ControlledServerRuntimeSelectionResult } from "./controlled-simulator-runtime-switch-contracts";
import {
  PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION,
  PUBLIC_SIMULATION_API_V2_RESPONSE_MODE,
  PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE,
  type PublicSimulationApiV2Envelope,
} from "./public-simulation-api-v2-contracts";

export const PUBLIC_SIMULATION_API_V2_FAILURE_MESSAGE =
  "No se pudo completar la simulación de forma segura." as const;

type PublicSimulationApiV2AdapterMeta = {
  requestId: string;
  generatedAt: string;
  maxInputLength: number;
  maxBodyLength: number;
};

function meta(input: PublicSimulationApiV2AdapterMeta) {
  return {
    lang: "es" as const,
    safeRender: true as const,
    mockOnly: false as const,
    apiReady: true as const,
    maxInputLength: input.maxInputLength,
    maxBodyLength: input.maxBodyLength,
    generatedAt: input.generatedAt,
    responseContractVersion: "2.0" as const,
  };
}

function safeControlledFailureUiModel(
  requestId: string,
  generatedAt: string,
): SimulationResponseV2UiModel {
  const model = createSimulationResponseV2UiEmptyModel();
  model.renderState = "controlled_failure";
  model.requestId = requestId;
  model.generatedAt = generatedAt;
  model.responseStatus = "failed";
  model.sections.status = {
    id: "status",
    state: "available",
    reasons: [],
    items: [{
      lifecycle: "failed",
      tone: "failure",
      message: PUBLIC_SIMULATION_API_V2_FAILURE_MESSAGE,
    }],
  };
  return model;
}

export function createPublicSimulationApiV2FailureEnvelope(
  input: PublicSimulationApiV2AdapterMeta,
): PublicSimulationApiV2Envelope {
  return {
    contractVersion: PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION,
    responseMode: PUBLIC_SIMULATION_API_V2_RESPONSE_MODE,
    runtimeSource: PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE,
    requestId: input.requestId,
    status: "failed",
    data: null,
    uiModel: safeControlledFailureUiModel(input.requestId, input.generatedAt),
    error: {
      code: "SIMULATION_FAILED",
      message: PUBLIC_SIMULATION_API_V2_FAILURE_MESSAGE,
    },
    meta: meta(input),
  };
}

export function adaptControlledProductionAiResultToPublicV2Envelope(
  result: ControlledServerRuntimeSelectionResult,
  input: PublicSimulationApiV2AdapterMeta,
): PublicSimulationApiV2Envelope {
  if (
    result.selectedPath === "controlled_production_ai_v2" &&
    result.runtimeSource === "production_ai" &&
    result.fallback.used === false &&
    validateSimulationResponseV2DraftShape(result.response)
  ) {
    const uiModel = mapSimulationResponseV2ToUiModel(result.response);

    if (uiModel.renderState !== "controlled_failure") {
      return {
        contractVersion: PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION,
        responseMode: PUBLIC_SIMULATION_API_V2_RESPONSE_MODE,
        runtimeSource: PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE,
        requestId: input.requestId,
        status: "completed",
        data: result.response,
        uiModel,
        error: null,
        meta: meta(input),
      };
    }
  }

  if (
    result.selectedPath === "controlled_failure" &&
    "runtimeSource" in result &&
    result.runtimeSource === "production_ai" &&
    "uiModel" in result
  ) {
    return createPublicSimulationApiV2FailureEnvelope(input);
  }

  return createPublicSimulationApiV2FailureEnvelope(input);
}
