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
  calculateDecisionMaterialCostEvidence,
  executeCandidateDecisionMaterial,
  validateMaterialGrounding,
  type DecisionMaterialAdapterResult,
  type DecisionMaterialProviderIncompleteOperationalMetadata,
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
        provenance: { source: "provider_candidate", source_ref: "scenario_2" },
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
  add("provider-schema-excludes-unsupported-unique-items", "positive", !JSON.stringify(request.schema).includes('"uniqueItems"'));
  add("request-is-stateless", "positive", request.store === false && request.stream === false && request.background === false && request.tools.length === 0);
  add("context-is-minimized", "positive", !Object.hasOwn(serialized, "evidence") && !Object.hasOwn(serialized, "inputId") && !Object.hasOwn(serialized, "outputId"));
  const serializedRefs = (serialized.allowed_refs as { source_refs: string[] }).source_refs;
  add("provider-inference-contract-is-explicit", "positive",
    request.instructions.includes("concrete allowed input provenance reference") &&
    request.instructions.includes("do not use provider_inference as a replacement") &&
    !serializedRefs.includes("provider_inference"));

  const successful = await execute(context);
  add("candidate-material-returned", "positive", successful.result.status === "completed" && successful.result.candidateMaterial.capability === CANDIDATE_DECISION_MATERIAL_CAPABILITY);
  add("completed-success-path-unchanged", "positive", successful.result.status === "completed" &&
    !JSON.stringify(successful.result).includes("providerIncompleteMetadata"));
  add("unique-option-references-accepted", "positive", successful.result.status === "completed" && successful.result.candidateMaterial.items.every((item) => new Set(item.option_refs).size === item.option_refs.length));
  add("provider-abstraction-evidenced", "positive", successful.result.status === "completed" && successful.result.metadata.providerAbstractionUsed);
  add("prompt-context-validation-evidenced", "positive", successful.result.status === "completed" && successful.result.metadata.promptContextValidated);
  add("token-count-before-generation", "positive", successful.mock.events.join(",") === "count,generate");
  add("maximum-two-transport-operations", "positive", successful.mock.stats().countCalls === 1 && successful.mock.stats().generationCalls === 1);
  add("usage-normalized", "positive", successful.result.status === "completed" && successful.result.usage.inputTokens === 1200 && successful.result.usage.outputTokens === 900 && successful.result.usage.totalTokens === 2100);
  add("cost-normalized", "positive", successful.result.status === "completed" && successful.result.usage.calculatedCostUsd === calculateDecisionMaterialCost(1200, 900));
  add("missing-cache-cost-falls-back-conservatively", "positive", successful.result.status === "completed" &&
    successful.result.usage.cachedInputTokens === null &&
    successful.result.usage.cacheAdjustedFallbackToConservative &&
    successful.result.usage.cacheAdjustedCalculatedCostUsd ===
      successful.result.usage.conservativeUncachedCostUsd);
  const cachedCost = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(validCandidateDecisionMaterial()),
      usage: { inputTokens: 1200, cachedInputTokens: 1000, outputTokens: 900, totalTokens: 2100 },
    },
  }));
  const expectedCachedCost = calculateDecisionMaterialCostEvidence(1200, 1000, 900);
  add("cached-token-cost-evidence-separated", "positive", cachedCost.result.status === "completed" &&
    cachedCost.result.usage.cachedInputTokens === 1000 &&
    cachedCost.result.usage.conservativeUncachedCostUsd ===
      expectedCachedCost.conservativeUncachedCostUsd &&
    cachedCost.result.usage.cacheAdjustedCalculatedCostUsd ===
      expectedCachedCost.cacheAdjustedCalculatedCostUsd &&
    cachedCost.result.usage.cacheAdjustedFallbackToConservative === false &&
    cachedCost.result.usage.calculatedCostUsd === expectedCachedCost.cacheAdjustedCalculatedCostUsd);
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
  const incompleteMetadata: DecisionMaterialProviderIncompleteOperationalMetadata = {
    responseStatus: "incomplete",
    incompleteReason: "max_output_tokens",
    providerError: null,
    responseId: "resp_stage9_incomplete",
    responseModel: "gpt-5.6-terra",
    serviceTier: "default",
    maxOutputTokens: 2500,
    usage: {
      inputTokens: 3432,
      cachedInputTokens: 0,
      outputTokens: 2500,
      reasoningTokens: 1700,
      totalTokens: 5932,
    },
    costEvidence: calculateDecisionMaterialCostEvidence(3432, 0, 2500),
    visibleOutputPresent: true,
    visibleOutputLength: 128,
    outputItemCount: 2,
    outputItemsTruncated: false,
    outputItems: [
      { type: "reasoning", status: null, contentTypes: [] },
      { type: "message", status: "incomplete", contentTypes: ["output_text"] },
    ],
  };
  const incomplete = await execute(context, {}, mockTransport({
    generation: { status: "incomplete", operationalMetadata: incompleteMetadata },
  }));
  add("incomplete-response-fails-closed", "negative", category(incomplete.result) === "provider_incomplete");
  add("incomplete-operational-metadata-preserved", "positive", incomplete.result.status === "failed" &&
    incomplete.result.error.providerIncompleteMetadata?.incompleteReason === "max_output_tokens" &&
    incomplete.result.error.providerIncompleteMetadata.usage?.reasoningTokens === 1700 &&
    incomplete.result.error.providerIncompleteMetadata.costEvidence?.conservativeUncachedCostUsd ===
      calculateDecisionMaterialCost(3432, 2500));
  const incompleteWithoutMetadata = await execute(context, {}, mockTransport({
    generation: { status: "incomplete" },
  }));
  add("incomplete-optional-metadata-safe", "negative", category(incompleteWithoutMetadata.result) ===
    "provider_incomplete" && incompleteWithoutMetadata.result.status === "failed" &&
    incompleteWithoutMetadata.result.error.providerIncompleteMetadata === undefined);
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
  const grounded = validateMaterialGrounding(validCandidateDecisionMaterial(), context);
  add("fully-grounded-material-has-no-failure-metadata", "positive", grounded.valid);

  async function groundingFailure(material: CandidateDecisionMaterial) {
    const execution = await execute(context, {}, mockTransport({
      generation: {
        status: "completed",
        outputText: JSON.stringify(material),
        usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 },
      },
    }));
    return execution.result.status === "failed" &&
        execution.result.error.category === "provider_grounding_invalid"
      ? execution.result.error.groundingFailure
      : undefined;
  }

  const unknownSource = validCandidateDecisionMaterial();
  unknownSource.items[0].provenance.source_ref = "invented_source";
  const unknownSourceFailure = await groundingFailure(unknownSource);
  add("unknown-source-ref-diagnostic", "negative",
    unknownSourceFailure?.itemType === "option" &&
    unknownSourceFailure.itemIndex === 0 &&
    unknownSourceFailure.field === "provenance.source_ref" &&
    unknownSourceFailure.predicate === "unknown_source_ref" &&
    unknownSourceFailure.referenceToken === "invented_source");

  const unknownOption = validCandidateDecisionMaterial();
  unknownOption.items[0].option_refs = ["option_99"];
  const unknownOptionFailure = await groundingFailure(unknownOption);
  add("unknown-option-ref-diagnostic", "negative",
    unknownOptionFailure?.itemIndex === 0 &&
    unknownOptionFailure.field === "option_refs" &&
    unknownOptionFailure.predicate === "unknown_option_ref" &&
    unknownOptionFailure.referenceToken === "option_99");

  const unknownScenario = validCandidateDecisionMaterial();
  unknownScenario.items[0].scenario_refs = ["scenario_99"];
  const unknownScenarioFailure = await groundingFailure(unknownScenario);
  add("unknown-scenario-ref-diagnostic", "negative",
    unknownScenarioFailure?.itemIndex === 0 &&
    unknownScenarioFailure.field === "scenario_refs" &&
    unknownScenarioFailure.predicate === "unknown_scenario_ref" &&
    unknownScenarioFailure.referenceToken === "scenario_99");

  const unknownCriterion = validCandidateDecisionMaterial();
  unknownCriterion.items[0].criterion_refs = ["criterion_99"];
  const unknownCriterionFailure = await groundingFailure(unknownCriterion);
  add("unknown-criterion-ref-diagnostic", "negative",
    unknownCriterionFailure?.itemIndex === 0 &&
    unknownCriterionFailure.field === "criterion_refs" &&
    unknownCriterionFailure.predicate === "unknown_criterion_ref" &&
    unknownCriterionFailure.referenceToken === "criterion_99");

  const inferenceWithoutConcreteSource = validCandidateDecisionMaterial();
  inferenceWithoutConcreteSource.items[1].provenance.source_ref = "unknown";
  const inferenceWithoutConcreteSourceFailure = await groundingFailure(
    inferenceWithoutConcreteSource,
  );
  add("provider-inference-requires-concrete-source-diagnostic", "negative",
    inferenceWithoutConcreteSourceFailure?.itemIndex === 1 &&
    inferenceWithoutConcreteSourceFailure.field === "provenance.source_ref" &&
    inferenceWithoutConcreteSourceFailure.predicate ===
      "provider_inference_requires_concrete_source" &&
    inferenceWithoutConcreteSourceFailure.referenceToken === "unknown");

  const unknownEvidenceWithConcreteSource = validCandidateDecisionMaterial();
  unknownEvidenceWithConcreteSource.items[0].evidence = "unknown";
  const unknownEvidenceWithConcreteSourceFailure = await groundingFailure(
    unknownEvidenceWithConcreteSource,
  );
  add("unknown-evidence-requires-unknown-source-diagnostic", "negative",
    unknownEvidenceWithConcreteSourceFailure?.itemIndex === 0 &&
    unknownEvidenceWithConcreteSourceFailure.field === "provenance.source_ref" &&
    unknownEvidenceWithConcreteSourceFailure.predicate ===
      "unknown_evidence_requires_unknown_source" &&
    unknownEvidenceWithConcreteSourceFailure.referenceToken === "option_1");

  const rawContentSentinel = "RAW_PROVIDER_CONTENT_MUST_NOT_BE_STORED";
  unknownOption.items[0].content = rawContentSentinel;
  const rawContentFailure = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(unknownOption),
      usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 },
    },
  }));
  add("grounding-diagnostic-excludes-raw-content", "negative",
    category(rawContentFailure.result) === "provider_grounding_invalid" &&
    !JSON.stringify(rawContentFailure.result).includes(rawContentSentinel) &&
    !JSON.stringify(rawContentFailure.result).includes("outputText"));
  const inferenceConcrete = validCandidateDecisionMaterial();
  inferenceConcrete.items[1].provenance.source_ref = "objective_1";
  const inferenceConcreteResult = await execute(context, {}, mockTransport({
    generation: { status: "completed", outputText: JSON.stringify(inferenceConcrete), usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 } },
  }));
  add("provider-inference-concrete-reference-accepted", "positive",
    inferenceConcreteResult.result.status === "completed");
  const duplicateOptionRef = validCandidateDecisionMaterial();
  duplicateOptionRef.items[0].option_refs = ["option_1", "option_1"];
  const duplicateOptionRefResult = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(duplicateOptionRef),
      usage: { inputTokens: 1200, outputTokens: 900, totalTokens: 2100 },
    },
  }));
  add(
    "duplicate-option-references-rejected-locally",
    "negative",
    category(duplicateOptionRefResult.result) === "provider_schema_invalid",
  );
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
  const invalidCachedUsage = await execute(context, {}, mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(validCandidateDecisionMaterial()),
      usage: { inputTokens: 1200, cachedInputTokens: 1201, outputTokens: 900, totalTokens: 2100 },
    },
  }));
  add("invalid-cached-usage-fails-closed", "negative", category(invalidCachedUsage.result) ===
    "provider_response_invalid");
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
