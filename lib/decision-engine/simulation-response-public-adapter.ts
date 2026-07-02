import type { SimulationResponseV2Draft } from "./contracts";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";

export const SIMULATION_RESPONSE_PUBLIC_ADAPTER_VERSION = "0.1.0-deterministic";
export const SIMULATE_API_CONTRACT_VERSION = "simulate-api-v1-mock";
export const SIMULATE_API_MAX_INPUT_LENGTH = 1200;
export const SIMULATE_API_MAX_BODY_LENGTH = 8192;
export const SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY = "deterministic-engine-preview";

export type SimulationResponsePublicAdapterTruthBoundary = typeof SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY;

export type SimulationResponsePublicAdapterRequest = {
  response: SimulationResponseV2Draft;
  requestId: string;
  generatedAt?: string;
  truthBoundary: SimulationResponsePublicAdapterTruthBoundary;
};

export type PublicSimulationThinkingStage = {
  title: string;
  detail: string;
};

export type PublicSimulationScenario = {
  label: string;
  title: string;
  copy: string;
  signal: string;
  score: string;
  probability?: string;
  riskLevel?: "Bajo" | "Medio" | "Alto";
  potentialBenefit?: string;
  consequences?: string[];
  warnings?: string[];
  recommendation?: string;
};

export type PublicSimulationImpact = {
  label: string;
  value: number;
  copy: string;
};

export type PublicSimulationTimelineItem = {
  period: string;
  title: string;
  copy: string;
};

export type PublicMockCompatibleSimulation = {
  id: string;
  date: string;
  category: string;
  decision: string;
  result: string;
  status: string;
  strategicConclusion: string;
  detailCopy: string;
  privacy: string;
  signals: {
    risk: number;
    advantage: number;
    latency: string;
    confidence: number;
  };
  tags: string[];
  scenarios: PublicSimulationScenario[];
  impacts: PublicSimulationImpact[];
  timeline: PublicSimulationTimelineItem[];
};

export type PublicSimulationResponse = {
  input: string;
  lang: "es";
  generatedAt: string;
  simulation: PublicMockCompatibleSimulation;
  thinkingStages: PublicSimulationThinkingStage[];
};

export type PublicSimulationError = {
  code: "CLARIFICATION_REQUIRED" | "CANNOT_RECOMMEND" | "REFUSED" | "SIMULATION_FAILED";
  message: string;
};

export type PublicSimulationEnvelopeMeta = {
  lang: "es";
  safeRender: true;
  mockOnly: true;
  apiReady: true;
  maxInputLength: typeof SIMULATE_API_MAX_INPUT_LENGTH;
  maxBodyLength: typeof SIMULATE_API_MAX_BODY_LENGTH;
  generatedAt: string;
  retryAfterSeconds?: number;
};

export type PublicSimulationEnvelope =
  | {
      contractVersion: typeof SIMULATE_API_CONTRACT_VERSION;
      requestId: string;
      status: "completed";
      data: PublicSimulationResponse;
      error: null;
      meta: PublicSimulationEnvelopeMeta;
    }
  | {
      contractVersion: typeof SIMULATE_API_CONTRACT_VERSION;
      requestId: string;
      status: "failed";
      data: null;
      error: PublicSimulationError;
      meta: PublicSimulationEnvelopeMeta;
    };

export type SimulationResponsePublicAdapterIsolationEvidence = {
  deterministicOnly: true;
  publicMockEnvelopeCreated: true;
  publicRouteWiringUsed: false;
  homeSimulatorImported: false;
  simulationEngineImported: false;
  mockSimulationsImported: false;
  builderUsed: false;
  pipelineRunnerUsed: false;
  modelCallsExecuted: false;
  providerSdkUsed: false;
  environmentRead: false;
  apiKeyRead: false;
  fetchUsed: false;
  persistenceUsed: false;
  authUsed: false;
  billingUsed: false;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function score(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 100) : fallback;
}

function meta(generatedAt: string): PublicSimulationEnvelopeMeta {
  return {
    lang: "es",
    safeRender: true,
    mockOnly: true,
    apiReady: true,
    maxInputLength: SIMULATE_API_MAX_INPUT_LENGTH,
    maxBodyLength: SIMULATE_API_MAX_BODY_LENGTH,
    generatedAt,
  };
}

function failedEnvelope(
  requestId: string,
  generatedAt: string,
  code: PublicSimulationError["code"],
  message: string,
): PublicSimulationEnvelope {
  return {
    contractVersion: SIMULATE_API_CONTRACT_VERSION,
    requestId,
    status: "failed",
    data: null,
    error: { code, message },
    meta: meta(generatedAt),
  };
}

function publicDate(generatedAt: string): string {
  return generatedAt.slice(0, 10) || "not_recorded";
}

function category(response: SimulationResponseV2Draft): string {
  const types = response.decision.decisionTypes;

  if (types.includes("resource_allocation")) return "Finanzas";
  if (types.includes("interpersonal")) return "Vida";
  if (types.includes("risk_response")) return "Riesgo";
  if (types.includes("comparative")) return "Comparacion";
  if (types.includes("timing")) return "Timing";
  return "Estrategia";
}

function riskValue(response: SimulationResponseV2Draft): number {
  const levels = response.analysis?.risks.map((risk) => risk.level) ?? [];

  if (levels.includes("critical")) return 90;
  if (levels.includes("high")) return 74;
  if (levels.includes("medium")) return 55;
  if (levels.includes("low")) return 28;
  if (response.notices.some((notice) => notice.severity === "critical")) return 76;
  if (response.notices.some((notice) => notice.severity === "warning")) return 58;
  return 42;
}

function riskLabel(value: number): "Bajo" | "Medio" | "Alto" {
  if (value >= 68) return "Alto";
  if (value >= 42) return "Medio";
  return "Bajo";
}

function scenarioRiskLabel(response: SimulationResponseV2Draft, scenarioId: string): "Bajo" | "Medio" | "Alto" {
  const scenarioRisk = response.analysis?.risks.find((risk) => risk.scenarioId === scenarioId);

  if (!scenarioRisk) {
    return riskLabel(riskValue(response));
  }

  if (scenarioRisk.level === "critical" || scenarioRisk.level === "high") return "Alto";
  if (scenarioRisk.level === "medium") return "Medio";
  return "Bajo";
}

function advantageValue(response: SimulationResponseV2Draft): number {
  const completeness = score(response.modelQuality.completeness.score, 50);
  const confidence = score(response.modelQuality.confidence.score, 50);
  return clamp((completeness + confidence) / 2, 20, 95);
}

function confidenceValue(response: SimulationResponseV2Draft): number {
  return score(response.modelQuality.confidence.score, 50);
}

function timelineLatency(response: SimulationResponseV2Draft): string {
  return response.decision.timeHorizonSummary ?? "Revision pendiente";
}

function thinkingStages(): PublicSimulationThinkingStage[] {
  return [
    {
      title: "Comprendiendo la decision",
      detail: "Separando objetivo, opciones, restricciones y contexto disponible.",
    },
    {
      title: "Estructurando incertidumbre",
      detail: "Preservando campos desconocidos sin inventar datos no suministrados.",
    },
    {
      title: "Simulando escenarios",
      detail: "Mapeando rutas deterministicas desde el Decision Engine.",
    },
    {
      title: "Evaluando riesgos",
      detail: "Trasladando riesgos, limites y avisos al formato publico seguro.",
    },
    {
      title: "Preservando el limite",
      detail: "Manteniendo el resultado como preview deterministico; Real AI sigue deferred.",
    },
  ];
}

function scenarioTitle(response: SimulationResponseV2Draft, optionId: string, fallback: string): string {
  return response.decision.optionSummaries.find((option) => option.id === optionId)?.label ?? fallback;
}

function scenarioSignal(perspective: string): string {
  if (perspective === "optimistic") return "Oportunidad";
  if (perspective === "pessimistic") return "Riesgo";
  return "Base";
}

function mapScenarios(response: SimulationResponseV2Draft): PublicSimulationScenario[] {
  const scenarios = response.analysis?.scenarios ?? [];

  if (scenarios.length > 0) {
    return scenarios.slice(0, 4).map((scenario, index) => {
      const title = scenarioTitle(response, scenario.optionId, `Opcion ${index + 1}`);
      const uncertainty = scenario.uncertaintyMarkers.map((marker) => marker.reason);
      const dependencies = scenario.dependencies.map((dependency) => dependency.description);
      const outcomeStates = scenario.outcomeIndicators.map((indicator) => `${indicator.category}: ${indicator.state}`);

      return {
        label: `Escenario ${index + 1}`,
        title,
        copy: `Ruta ${scenario.perspective} generada por el Decision Engine para una simulacion deterministica.`,
        signal: scenarioSignal(scenario.perspective),
        score: `${score(scenario.confidence.value, 50)}%`,
        probability: "No calibrada",
        riskLevel: scenarioRiskLabel(response, scenario.id),
        potentialBenefit: outcomeStates[0] ?? "Aprendizaje estructurado sin presentarse como prediccion.",
        consequences: dependencies.length > 0 ? dependencies.slice(0, 2) : ["El resultado depende de informacion todavia incompleta."],
        warnings: uncertainty.length > 0 ? uncertainty.slice(0, 2) : response.notices.map((notice) => notice.message).slice(0, 2),
        recommendation: response.recommendation && response.safety.recommendationAllowed
          ? "Marco deterministico: revisar condiciones y senales antes de actuar."
          : "Marco deterministico: usar este escenario como informacion, no como orden de accion.",
      };
    });
  }

  return response.decision.optionSummaries.slice(0, 4).map((option, index) => ({
    label: `Opcion ${index + 1}`,
    title: option.label,
    copy: `Opcion estructurada por el Decision Engine con factibilidad ${option.feasibility}.`,
    signal: option.type === "no_action" ? "Estado actual" : "Opcion",
    score: `${confidenceValue(response)}%`,
    probability: "No calibrada",
    riskLevel: riskLabel(riskValue(response)),
    potentialBenefit: "Permite comparar consecuencias sin convertir el resultado en prediccion.",
    consequences: response.decision.keyConstraints.slice(0, 2),
    warnings: response.notices.map((notice) => notice.message).slice(0, 2),
    recommendation: "Marco deterministico: comparar esta opcion contra restricciones y datos faltantes.",
  }));
}

function impacts(response: SimulationResponseV2Draft): PublicSimulationImpact[] {
  const risk = riskValue(response);
  const advantage = advantageValue(response);
  const confidence = confidenceValue(response);

  return [
    {
      label: "Exposicion al riesgo",
      value: risk,
      copy: response.safety.message,
    },
    {
      label: "Claridad del contexto",
      value: advantage,
      copy: response.modelQuality.completeness.explanation,
    },
    {
      label: "Confianza del modelo",
      value: confidence,
      copy: response.modelQuality.confidence.explanation,
    },
  ];
}

function timeline(response: SimulationResponseV2Draft): PublicSimulationTimelineItem[] {
  return [
    {
      period: "Ahora",
      title: "Revisar contexto",
      copy: response.decision.primaryGoal ?? response.decision.statement,
    },
    {
      period: timelineLatency(response),
      title: "Validar incertidumbre",
      copy: response.notices[0]?.message ?? "Identificar datos faltantes antes de tratar la simulacion como suficiente.",
    },
    {
      period: "Antes de actuar",
      title: "Comprobar limite de seguridad",
      copy: response.safety.message,
    },
  ];
}

function completedEnvelope(
  response: SimulationResponseV2Draft,
  requestId: string,
  generatedAt: string,
): PublicSimulationEnvelope {
  const risk = riskValue(response);
  const advantage = advantageValue(response);

  return {
    contractVersion: SIMULATE_API_CONTRACT_VERSION,
    requestId,
    status: "completed",
    data: {
      input: response.decision.statement,
      lang: "es",
      generatedAt,
      thinkingStages: thinkingStages(),
      simulation: {
        id: `deterministic-${response.responseId}`,
        date: publicDate(generatedAt),
        category: category(response),
        decision: response.decision.statement,
        result: response.status === "limited_analysis"
          ? "Simulacion deterministica limitada por contexto incompleto"
          : "Simulacion deterministica preparada para revision",
        status: "Preview deterministico",
        strategicConclusion: "Este resultado procede del Decision Engine deterministico y no de Real AI runtime.",
        detailCopy:
          "Preview interno adaptado al contrato publico mock-compatible. Mantiene mockOnly=true y no representa comportamiento production-grade ni Real AI.",
        privacy: "Preview sin persistencia",
        signals: {
          risk,
          advantage,
          latency: timelineLatency(response),
          confidence: confidenceValue(response),
        },
        tags: [category(response), response.status, "Deterministic preview"],
        scenarios: mapScenarios(response),
        impacts: impacts(response),
        timeline: timeline(response),
      },
    },
    error: null,
    meta: meta(generatedAt),
  };
}

export function simulationResponsePublicAdapterIsolationEvidence(): SimulationResponsePublicAdapterIsolationEvidence {
  return {
    deterministicOnly: true,
    publicMockEnvelopeCreated: true,
    publicRouteWiringUsed: false,
    homeSimulatorImported: false,
    simulationEngineImported: false,
    mockSimulationsImported: false,
    builderUsed: false,
    pipelineRunnerUsed: false,
    modelCallsExecuted: false,
    providerSdkUsed: false,
    environmentRead: false,
    apiKeyRead: false,
    fetchUsed: false,
    persistenceUsed: false,
    authUsed: false,
    billingUsed: false,
  };
}

export function adaptSimulationResponseV2ToPublicSimulatorEnvelope(
  request: SimulationResponsePublicAdapterRequest,
): PublicSimulationEnvelope {
  const requestId = request.requestId || request.response?.requestId || "public_adapter_request";
  const generatedAt = request.generatedAt ?? request.response?.generatedAt ?? "not_recorded";

  if (request.truthBoundary !== SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY) {
    return failedEnvelope(
      requestId,
      generatedAt,
      "SIMULATION_FAILED",
      "SimulationResponse public adapter requires deterministic-engine-preview truth boundary.",
    );
  }

  if (!validateSimulationResponseV2DraftShape(request.response)) {
    return failedEnvelope(
      requestId,
      generatedAt,
      "SIMULATION_FAILED",
      "SimulationResponse V2 draft validation failed before public adaptation.",
    );
  }

  if (request.response.status === "analysis_ready" || request.response.status === "limited_analysis") {
    return completedEnvelope(request.response, requestId, generatedAt);
  }

  if (request.response.status === "clarification_required") {
    return failedEnvelope(
      requestId,
      generatedAt,
      "CLARIFICATION_REQUIRED",
      request.response.clarification?.reason ?? "Clarification is required before a public simulation preview.",
    );
  }

  if (request.response.status === "cannot_recommend") {
    return failedEnvelope(
      requestId,
      generatedAt,
      "CANNOT_RECOMMEND",
      request.response.safety.message,
    );
  }

  if (request.response.status === "refused") {
    return failedEnvelope(
      requestId,
      generatedAt,
      "REFUSED",
      request.response.safety.message,
    );
  }

  return failedEnvelope(
    requestId,
    generatedAt,
    "SIMULATION_FAILED",
    request.response.failure?.message ?? "Simulation pipeline failed before public adaptation.",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePublicSimulationEnvelopeShape(value: unknown): value is PublicSimulationEnvelope {
  if (!isRecord(value) || !isRecord(value.meta)) {
    return false;
  }

  if (
    value.contractVersion !== SIMULATE_API_CONTRACT_VERSION ||
    typeof value.requestId !== "string" ||
    value.meta.lang !== "es" ||
    value.meta.safeRender !== true ||
    value.meta.mockOnly !== true ||
    value.meta.apiReady !== true ||
    value.meta.maxInputLength !== SIMULATE_API_MAX_INPUT_LENGTH ||
    value.meta.maxBodyLength !== SIMULATE_API_MAX_BODY_LENGTH ||
    typeof value.meta.generatedAt !== "string"
  ) {
    return false;
  }

  if (value.status === "failed") {
    return value.data === null &&
      isRecord(value.error) &&
      typeof value.error.code === "string" &&
      typeof value.error.message === "string";
  }

  return value.status === "completed" &&
    value.error === null &&
    isRecord(value.data) &&
    Array.isArray(value.data.thinkingStages) &&
    isRecord(value.data.simulation) &&
    Array.isArray(value.data.simulation.scenarios) &&
    Array.isArray(value.data.simulation.impacts) &&
    Array.isArray(value.data.simulation.timeline);
}
