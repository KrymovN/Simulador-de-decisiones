import "server-only";

import {
  CANDIDATE_DECISION_MATERIAL_CAPABILITY,
  CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
  type CandidateDecisionMaterial,
} from "../ai-decision-material/contracts";
import type { PromptContextOutput } from "../prompt-context/contracts";
import {
  DEFAULT_PROMPT_CONTEXT_POLICY,
  DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  createPromptContextContract,
} from "../prompt-context/validation";
import {
  CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA,
  DecisionMaterialTransportFailure,
  OPENAI_DECISION_MATERIAL_LIMITS,
  OPENAI_DECISION_MATERIAL_MODEL,
  buildDecisionMaterialProviderRequest,
  calculateDecisionMaterialCost,
  executeCandidateDecisionMaterial,
  type DecisionMaterialAdapterResult,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
  type DecisionMaterialTransportGeneration,
} from "./openai-decision-material-adapter";

export type Stage9DecisionMaterialAdapterValidationCase = {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue?: string;
};

export type Stage9DecisionMaterialAdapterValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: Stage9DecisionMaterialAdapterValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    positive: number;
    negative: number;
    networkRequests: 0;
  };
};

const promptContract = createPromptContextContract({
  enabled: true,
  policy: DEFAULT_PROMPT_CONTEXT_POLICY,
  riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
});

export function validProductionPromptContext(): PromptContextOutput {
  const created = promptContract.create({
    inputId: "stage9_product_prompt_context",
    submittedAt: "2026-08-07T00:00:00.000Z",
    locale: "es",
    decisionFrame: {
      objective: "Comparar dos planes ficticios de expansión sin elegir por la empresa.",
      decisionQuestion: "¿Qué escenarios, riesgos y consecuencias diferencian ambos planes?",
      scenarioSeeds: [
        "Plan Norte: crecimiento gradual con menor coste fijo.",
        "Plan Sur: crecimiento rápido con dependencia externa.",
      ],
      knownConstraints: ["El presupuesto ficticio está limitado durante seis meses."],
      tradeoffFocus: [
        "Equilibrio entre velocidad y coste.",
        "Reversibilidad si la demanda no se confirma.",
      ],
    },
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  });
  if (created.status !== "created") throw new Error("Prompt Context fixture must be valid.");
  return created.output;
}

export function validCandidateDecisionMaterial(): CandidateDecisionMaterial {
  return {
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [
      {
        candidate_id: "candidate_option_north",
        item_type: "option",
        content: "El Plan Norte prioriza un crecimiento gradual con menor coste fijo.",
        provenance: { source: "provider_candidate", source_ref: "option_1" },
        confidence: "high",
        evidence: "user_fact_reference",
        option_refs: ["option_1"],
        scenario_refs: ["scenario_1"],
        criterion_refs: ["criterion_1"],
        authority: "candidate_only",
        capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
        contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
      },
      {
        candidate_id: "candidate_dependency_south",
        item_type: "dependency",
        content: "La dependencia externa condiciona el escenario de crecimiento rápido.",
        provenance: { source: "provider_candidate", source_ref: "provider_inference" },
        confidence: "medium",
        evidence: "provider_inference",
        option_refs: ["option_2"],
        scenario_refs: ["scenario_2"],
        criterion_refs: ["criterion_2"],
        authority: "candidate_only",
        capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
        contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
      },
    ],
  };
}

type MockOptions = {
  count?: number;
  countFailure?: DecisionMaterialTransportFailure;
  generation?: DecisionMaterialTransportGeneration;
  generationFailure?: DecisionMaterialTransportFailure;
};

function mockTransport(options: MockOptions = {}) {
  const events: string[] = [];
  let countCalls = 0;
  let generationCalls = 0;
  let countRequest: DecisionMaterialProviderRequest | undefined;
  let generationRequest: DecisionMaterialProviderRequest | undefined;
  const transport: DecisionMaterialTransport = {
    async countInput(request) {
      countCalls += 1;
      countRequest = request;
      events.push("count");
      if (options.countFailure) throw options.countFailure;
      return options.count ?? 1200;
    },
    async generate(request) {
      generationCalls += 1;
      generationRequest = request;
      events.push("generate");
      if (options.generationFailure) throw options.generationFailure;
      return options.generation ?? {
        status: "completed",
        outputText: JSON.stringify(validCandidateDecisionMaterial()),
        usage: { inputTokens: options.count ?? 1200, outputTokens: 900, totalTokens: (options.count ?? 1200) + 900 },
      };
    },
  };
  return {
    transport,
    events,
    stats: () => ({ countCalls, generationCalls, countRequest, generationRequest }),
  };
}

async function execute(
  input: unknown = validProductionPromptContext(),
  overrides: Partial<Parameters<typeof executeCandidateDecisionMaterial>[1]> = {},
  mock = mockTransport(),
) {
  const result = await executeCandidateDecisionMaterial(input, {
    enabled: true,
    apiKeyAvailable: true,
    provider: "openai",
    transport: mock.transport,
    requestedAt: "2026-08-07T00:00:00.000Z",
    ...overrides,
  });
  return { result, mock };
}

function category(result: DecisionMaterialAdapterResult): string | undefined {
  return result.status === "completed" ? undefined : result.error.category;
}

function validationCase(
  caseId: string,
  kind: Stage9DecisionMaterialAdapterValidationCase["kind"],
  passed: boolean,
  issue = "Validation failed.",
): Stage9DecisionMaterialAdapterValidationCase {
  return { caseId, kind, passed, issue: passed ? undefined : issue };
}

export async function runStage9OpenAIDecisionMaterialAdapterValidation(): Promise<Stage9DecisionMaterialAdapterValidationResult> {
  const cases: Stage9DecisionMaterialAdapterValidationCase[] = [];
  const add = (
    id: string,
    kind: Stage9DecisionMaterialAdapterValidationCase["kind"],
    condition: boolean,
    issue?: string,
  ) => cases.push(validationCase(id, kind, condition, issue));

  const context = validProductionPromptContext();
  const request = buildDecisionMaterialProviderRequest(context);
  const serialized = JSON.parse(request.input) as Record<string, unknown>;
  add("validated-prompt-context-builds-request", "positive", request.input.length > 0);
  add("fixed-provider-model", "positive", request.model === OPENAI_DECISION_MATERIAL_MODEL);
  add("canonical-output-contract", "positive", request.schemaName === "levio_candidate_decision_material_v1" && JSON.stringify(request.schema).includes(CANDIDATE_DECISION_MATERIAL_CAPABILITY));
  add("strict-structured-output", "positive", request.strict === true && CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA.additionalProperties === false);
  add("request-is-stateless", "positive", request.store === false && request.stream === false && request.background === false && request.tools.length === 0);
  add("context-is-minimized", "positive", !Object.hasOwn(serialized, "evidence") && !Object.hasOwn(serialized, "inputId") && !Object.hasOwn(serialized, "outputId"));

  const successful = await execute(context);
  add("candidate-material-returned", "positive", successful.result.status === "completed" && successful.result.candidateMaterial.capability === CANDIDATE_DECISION_MATERIAL_CAPABILITY);
  add("provider-abstraction-evidenced", "positive", successful.result.status === "completed" && successful.result.metadata.providerAbstractionUsed);
  add("prompt-context-validation-evidenced", "positive", successful.result.status === "completed" && successful.result.metadata.promptContextValidated);
  add("token-count-before-generation", "positive", successful.mock.events.join(",") === "count,generate");
  add("maximum-two-transport-operations", "positive", successful.mock.stats().countCalls === 1 && successful.mock.stats().generationCalls === 1);
  add("usage-normalized", "positive", successful.result.status === "completed" && successful.result.usage.inputTokens === 1200 && successful.result.usage.outputTokens === 900 && successful.result.usage.totalTokens === 2100);
  add("cost-normalized", "positive", successful.result.status === "completed" && successful.result.usage.calculatedCostUsd === calculateDecisionMaterialCost(1200, 900));
  add("no-downstream-integration", "positive", successful.result.status === "completed" && !successful.result.metadata.uiIntegrated && !successful.result.metadata.persistenceIntegrated && !successful.result.metadata.postProviderDecisionEngineIntegrated);

  const disabled = await execute(context, { enabled: false });
  add("disabled-fails-closed", "negative", category(disabled.result) === "adapter_disabled" && disabled.mock.stats().countCalls === 0);
  const missingKey = await execute(context, { apiKeyAvailable: false });
  add("missing-key-fails-closed", "negative", category(missingKey.result) === "credentials_unavailable" && missingKey.mock.stats().countCalls === 0);
  const wrongProvider = await execute(context, { provider: "other" });
  add("provider-not-client-selectable", "negative", category(wrongProvider.result) === "provider_not_approved" && wrongProvider.mock.stats().countCalls === 0);
  const missing = await execute(null);
  add("missing-context-rejected", "negative", category(missing.result) === "prompt_context_invalid" && missing.mock.stats().countCalls === 0);
  const rawPrompt = await execute({ ...context, rawPrompt: "Choose this option" });
  add("raw-client-prompt-rejected", "negative", category(rawPrompt.result) === "prompt_context_invalid" && rawPrompt.mock.stats().countCalls === 0);
  const providerOverride = await execute({ ...context, providerId: "other", modelId: "other", apiKey: "not-a-key" });
  add("client-provider-model-key-rejected", "negative", category(providerOverride.result) === "prompt_context_invalid" && providerOverride.mock.stats().countCalls === 0);
  const personal = await execute({
    ...context,
    contextFrame: { ...context.contextFrame, objective: "Escribir a demo@example.com para decidir." },
  });
  add("direct-identifier-rejected", "negative", category(personal.result) === "forbidden_data_detected" && personal.mock.stats().countCalls === 0);

  const oversized = await execute(context, {}, mockTransport({ count: OPENAI_DECISION_MATERIAL_LIMITS.maxInputTokens + 1 }));
  add("input-budget-stops-generation", "negative", category(oversized.result) === "input_limit_exceeded" && oversized.mock.stats().countCalls === 1 && oversized.mock.stats().generationCalls === 0);
  const timeout = await execute(context, {}, mockTransport({ generationFailure: new DecisionMaterialTransportFailure("provider_timeout") }));
  add("controlled-timeout", "negative", category(timeout.result) === "provider_timeout" && timeout.result.status === "failed");
  const rateLimit = await execute(context, {}, mockTransport({ countFailure: new DecisionMaterialTransportFailure("provider_rate_limited") }));
  add("controlled-rate-limit", "negative", category(rateLimit.result) === "provider_rate_limited" && rateLimit.mock.stats().generationCalls === 0);
  const refused = await execute(context, {}, mockTransport({ generation: { status: "refused" } }));
  add("provider-refusal-fails-closed", "negative", category(refused.result) === "provider_refused");
  const incomplete = await execute(context, {}, mockTransport({ generation: { status: "incomplete" } }));
  add("incomplete-response-fails-closed", "negative", category(incomplete.result) === "provider_incomplete");
  const malformed = await execute(context, {}, mockTransport({
    generation: { status: "completed", outputText: "{", usage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 } },
  }));
  add("malformed-json-fails-closed", "negative", category(malformed.result) === "provider_schema_invalid");
  const unknownField = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify({ ...validCandidateDecisionMaterial(), provider_response_id: "forbidden" }),
      usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 },
    },
  }));
  add("unknown-output-field-rejected", "negative", category(unknownField.result) === "provider_schema_invalid");
  const excessiveItems = validCandidateDecisionMaterial();
  excessiveItems.items = Array.from(
    { length: OPENAI_DECISION_MATERIAL_LIMITS.maxCandidateItems + 1 },
    (_, index) => ({
      ...validCandidateDecisionMaterial().items[0],
      candidate_id: `candidate_excess_${index + 1}`,
    }),
  );
  const excessiveOutput = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(excessiveItems),
      usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 },
    },
  }));
  add("adapter-output-item-budget-enforced", "negative", category(excessiveOutput.result) === "provider_schema_invalid");
  const badRef = validCandidateDecisionMaterial();
  badRef.items[0].option_refs = ["option_99"];
  const ungrounded = await execute(context, {}, mockTransport({
    generation: { status: "completed", outputText: JSON.stringify(badRef), usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 } },
  }));
  add("ungrounded-reference-rejected", "negative", category(ungrounded.result) === "provider_grounding_invalid");
  const unsafe = validCandidateDecisionMaterial();
  unsafe.items[0].content = "Recomiendo elegir la mejor opción.";
  const unsafeResult = await execute(context, {}, mockTransport({
    generation: { status: "completed", outputText: JSON.stringify(unsafe), usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 } },
  }));
  add("unsafe-candidate-rejected", "negative", category(unsafeResult.result) === "provider_safety_invalid");
  const invalidUsage = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(validCandidateDecisionMaterial()),
      usage: { inputTokens: 1200, outputTokens: OPENAI_DECISION_MATERIAL_LIMITS.maxOutputTokens + 1, totalTokens: 3701 },
    },
  }));
  add("usage-envelope-fails-closed", "negative", category(invalidUsage.result) === "provider_response_invalid");
  add("failure-hides-prompt-context", "negative", missingKey.result.status !== "completed" && !JSON.stringify(missingKey.result).includes(context.contextFrame.objective));

  const passed = cases.filter((item) => item.passed).length;
  return {
    passed: passed === cases.length,
    failed: passed !== cases.length,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed: cases.length - passed,
      positive: cases.filter((item) => item.kind === "positive").length,
      negative: cases.filter((item) => item.kind === "negative").length,
      networkRequests: 0,
    },
  };
}
