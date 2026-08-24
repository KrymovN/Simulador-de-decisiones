import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import type { SimulationResponseV2UiModel } from "../decision-engine/simulation-response-v2-ui-mapping-contracts";

export const PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION = "simulate-api-v2" as const;
export const PUBLIC_SIMULATION_API_V2_RESPONSE_MODE = "production_v2" as const;
export const PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE = "production_ai" as const;

export type PublicSimulationApiV2Meta = {
  lang: "es";
  safeRender: true;
  mockOnly: false;
  apiReady: true;
  maxInputLength: number;
  maxBodyLength: number;
  generatedAt: string;
  responseContractVersion: "2.0";
};

export type PublicSimulationApiV2Envelope =
  | {
      contractVersion: typeof PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION;
      responseMode: typeof PUBLIC_SIMULATION_API_V2_RESPONSE_MODE;
      runtimeSource: typeof PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE;
      requestId: string;
      status: "completed";
      data: SimulationResponseV2Draft;
      uiModel: SimulationResponseV2UiModel;
      error: null;
      meta: PublicSimulationApiV2Meta;
    }
  | {
      contractVersion: typeof PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION;
      responseMode: typeof PUBLIC_SIMULATION_API_V2_RESPONSE_MODE;
      runtimeSource: typeof PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE;
      requestId: string;
      status: "failed";
      data: null;
      uiModel: SimulationResponseV2UiModel;
      error: {
        code: "SIMULATION_FAILED";
        message: string;
      };
      meta: PublicSimulationApiV2Meta;
    };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validUiModel(value: unknown, expectedFailure: boolean): value is SimulationResponseV2UiModel {
  if (
    !record(value) ||
    value.mappingVersion !== "1.0" ||
    value.mode !== "internal_v2_ui_mapping" ||
    !record(value.sections) ||
    !record(value.sections.status) ||
    !Array.isArray(value.sections.status.items)
  ) {
    return false;
  }

  if (expectedFailure) {
    return value.renderState === "controlled_failure";
  }

  return ["clarification", "ready", "limited", "cannot_recommend", "refused"]
    .includes(String(value.renderState));
}

export function isPublicSimulationApiV2Envelope(
  value: unknown,
): value is PublicSimulationApiV2Envelope {
  if (
    !record(value) ||
    value.contractVersion !== PUBLIC_SIMULATION_API_V2_CONTRACT_VERSION ||
    value.responseMode !== PUBLIC_SIMULATION_API_V2_RESPONSE_MODE ||
    value.runtimeSource !== PUBLIC_SIMULATION_API_V2_RUNTIME_SOURCE ||
    typeof value.requestId !== "string" ||
    !record(value.meta) ||
    value.meta.lang !== "es" ||
    value.meta.safeRender !== true ||
    value.meta.mockOnly !== false ||
    value.meta.apiReady !== true ||
    typeof value.meta.maxInputLength !== "number" ||
    typeof value.meta.maxBodyLength !== "number" ||
    typeof value.meta.generatedAt !== "string" ||
    value.meta.responseContractVersion !== "2.0"
  ) {
    return false;
  }

  if (value.status === "failed") {
    return value.data === null &&
      record(value.error) &&
      value.error.code === "SIMULATION_FAILED" &&
      typeof value.error.message === "string" &&
      validUiModel(value.uiModel, true);
  }

  return value.status === "completed" &&
    value.error === null &&
    record(value.data) &&
    value.data.contractVersion === "2.0" &&
    value.data.requestId === value.requestId &&
    validUiModel(value.uiModel, false);
}
