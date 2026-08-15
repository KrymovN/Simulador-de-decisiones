import "server-only";

import {
  CANONICAL_OFFLINE_EVALUATION_CASES,
  type CanonicalOfflineEvaluationCase,
} from "../ai-decision-material/fixtures";
import {
  CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS,
  compileCanonicalProviderEvaluationInput,
  extractCanonicalProviderEvaluationOracle,
} from "../ai-decision-material/canonical-provider-evaluation-input";
import type {
  CandidateDecisionMaterial,
  CandidateDecisionMaterialItem,
  DecisionMaterialItemType,
} from "../ai-decision-material/contracts";
import {
  CANONICAL_PROVIDER_EVALUATION_CATEGORIES,
  CANONICAL_PROVIDER_EVALUATION_TAXONOMY,
  CANONICAL_PROVIDER_EVALUATION_TAXONOMY_REGISTRY,
  canonicalOracleConceptsByCategory,
} from "./canonical-provider-evaluation-taxonomy";
import {
  CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
  CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA,
  CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS,
  CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS,
  CANONICAL_PROVIDER_EFFECTIVE_CONTRACT_INSTRUCTIONS,
  CANONICAL_PROVIDER_PRE_MATCHER_DIAGNOSTIC_MAX_ISSUES,
  inspectCanonicalProviderCandidateGrounding,
  matchCanonicalProviderEvaluationOracle,
  validateCanonicalProviderEvaluationResult,
  type CanonicalProviderEvaluationAnnotation,
  type CanonicalProviderEvaluationOutcome,
  type CanonicalProviderEvaluationResultV1,
} from "./canonical-provider-evaluation-result";
import {
  buildCanonicalProviderEvaluationRequest,
  CANONICAL_PROVIDER_ANNOTATION_RULES,
  CANONICAL_PROVIDER_EVALUATION_CANDIDATE,
  CANONICAL_PROVIDER_EVALUATION_LIMITS,
  runCanonicalProviderEvaluationOffline,
  type CanonicalProviderEvaluationProviderRequest,
} from "./canonical-provider-evaluation";

export type CanonicalProviderEvaluationValidationCase = {
  caseId: string;
  passed: boolean;
  issue?: string;
};

export type CanonicalProviderEvaluationValidationResult = {
  version: "stage-9-canonical-provider-evaluation-boundary-validation.2";
  cases: CanonicalProviderEvaluationValidationCase[];
  passed: boolean;
  networkOperations: 0;
};

function byLanguage(language: CanonicalOfflineEvaluationCase["language"]) {
  const found = CANONICAL_OFFLINE_EVALUATION_CASES.find((item) => item.language === language);
  if (!found) throw new Error(`Missing canonical ${language} case.`);
  return found;
}

function baseItem(
  candidateId: string,
  itemType: DecisionMaterialItemType,
  content: string,
): CandidateDecisionMaterialItem {
  return {
    candidate_id: candidateId,
    item_type: itemType,
    content,
    provenance: { source: "provider_candidate", source_ref: "case_situation" },
    confidence: "unknown",
    evidence: "provider_inference",
    option_refs: [],
    scenario_refs: [],
    criterion_refs: [],
    authority: "candidate_only",
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
  };
}

function standardCandidate(riskConcepts: readonly string[]): CandidateDecisionMaterial {
  return {
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [
      baseItem("evaluation_option_1", "option", "Candidate path A remains conditional on supplied evidence."),
      baseItem("evaluation_option_2", "option", "Candidate path B remains conditional on supplied evidence."),
      baseItem("evaluation_short_term_1", "short_term_consequence", "Short-term consequences differ between the candidate paths."),
      baseItem("evaluation_long_term_1", "long_term_consequence", "Long-term consequences remain uncertain across candidate paths."),
      baseItem("evaluation_clarification_1", "clarification_need", "A supplied information gap may require clarification before proceeding."),
      ...riskConcepts.map((concept, index) => baseItem(
        `evaluation_risk_${index + 1}`,
        "risk_signal",
        `Material risk concept selected by the evaluation candidate: ${concept.replaceAll("_", " ")}.`,
      )),
    ],
  };
}

function outcomeFor(source: CanonicalOfflineEvaluationCase): {
  kind: CanonicalProviderEvaluationOutcome;
  v2_status: CanonicalProviderEvaluationResultV1["outcome"]["v2_status"];
} {
  const v2Status = source.expected_v2_statuses[0] as
    CanonicalProviderEvaluationResultV1["outcome"]["v2_status"];
  if (source.expected_scenario_behavior.includes("refuse_harmful_request")) {
    return { kind: "safe_refusal", v2_status: "CANNOT_RECOMMEND" };
  }
  if (v2Status === "CLARIFICATION_REQUIRED") {
    return { kind: "clarification_required", v2_status: v2Status };
  }
  if (v2Status === "CANNOT_RECOMMEND") {
    return { kind: "recommendation_withheld", v2_status: v2Status };
  }
  return { kind: "candidate_material", v2_status: "SIMULATED" };
}

function candidateEvidence(
  category: string,
  concept: string,
  candidate: CandidateDecisionMaterial,
): Pick<CanonicalProviderEvaluationAnnotation, "evidence_kind" | "candidate_ids" | "source_refs"> {
  const outcomeOnly = [
    "recommendation", "safety", "privacy", "failure", "v2_status", "traceability", "rubric",
  ].includes(category);
  if (outcomeOnly) {
    return { evidence_kind: "execution_outcome", candidate_ids: [], source_refs: [] };
  }
  if (category === "risk") {
    const riskIndex = CANONICAL_PROVIDER_EVALUATION_TAXONOMY.risk.indexOf(concept);
    const localRisk = candidate.items.filter((item) => item.item_type === "risk_signal")[
      Math.max(0, riskIndex % Math.max(1, candidate.items.filter((item) => item.item_type === "risk_signal").length))
    ];
    return {
      evidence_kind: "candidate_material",
      candidate_ids: [localRisk.candidate_id],
      source_refs: [localRisk.provenance.source_ref],
    };
  }
  if (category === "clarification" && concept.startsWith("ask_")) {
    return {
      evidence_kind: "candidate_material",
      candidate_ids: ["evaluation_clarification_1"],
      source_refs: ["case_situation"],
    };
  }
  if (category === "scenario" && concept.startsWith("compare_")) {
    return {
      evidence_kind: "candidate_material",
      candidate_ids: [
        "evaluation_option_1", "evaluation_option_2",
        "evaluation_short_term_1", "evaluation_long_term_1",
      ],
      source_refs: ["case_situation"],
    };
  }
  if (category === "scenario" && concept.includes("information_first_path")) {
    return {
      evidence_kind: "candidate_material",
      candidate_ids: ["evaluation_option_1", "evaluation_clarification_1"],
      source_refs: ["case_situation"],
    };
  }
  return {
    evidence_kind: "candidate_material",
    candidate_ids: ["evaluation_short_term_1"],
    source_refs: ["case_situation"],
  };
}

function fakeEvaluationResult(
  source: CanonicalOfflineEvaluationCase,
): CanonicalProviderEvaluationResultV1 {
  const oracle = canonicalOracleConceptsByCategory(source);
  const outcome = outcomeFor(source);
  const candidate = outcome.kind === "safe_refusal"
    ? null
    : standardCandidate(oracle.risk);
  const evaluationAnnotations = Object.fromEntries(
    CANONICAL_PROVIDER_EVALUATION_CATEGORIES.map((category) => [
      category,
      (category === "v2_status" ? [outcome.v2_status] : oracle[category]).map((concept) => ({
        concept_id: concept,
        ...(candidate === null
          ? { evidence_kind: "execution_outcome" as const, candidate_ids: [], source_refs: [] }
          : candidateEvidence(category, concept, candidate)),
      })),
    ]),
  ) as CanonicalProviderEvaluationResultV1["evaluation_annotations"];
  return {
    evaluation_contract_version: CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
    candidate_material: candidate,
    evaluation_annotations: evaluationAnnotations,
    outcome,
  };
}

function changedOracleCase(source: CanonicalOfflineEvaluationCase): CanonicalOfflineEvaluationCase {
  return {
    ...structuredClone(source),
    expected_clarification_behavior: ["ask_critical_gap"],
    expected_scenario_behavior: ["compare_trial_city_paths"],
    expected_risk_behavior: ["weather_disruption"],
    expected_recommendation_behavior: ["recommendation_withheld"],
    safety_expectations: ["elevated"],
    privacy_expectations: ["data_minimization", "no_identifiers"],
    failure_expectations: ["controlled_failure_required"],
    expected_v2_statuses: ["CANNOT_RECOMMEND"],
    traceability_expectations: ["preserve_case_id"],
    review_rubric: ["semantic_fidelity"],
    cost_profile: { profile: "standard", max_relative_units: 100 },
    dataset_split: "challenge",
    provenance: { kind: "purpose_written_synthetic", semantic_cluster_id: "S9-CLUSTER-040" },
    coverage_flags: {
      high_risk_or_safety_sensitive: true,
      privacy_boundary: true,
      controlled_failure_or_malformed_output: true,
      cost_profile: true,
    },
  };
}

export async function runCanonicalProviderEvaluationBoundaryValidation(): Promise<CanonicalProviderEvaluationValidationResult> {
  const cases: CanonicalProviderEvaluationValidationCase[] = [];
  const add = (caseId: string, passed: boolean, issue = "Validation failed.") => {
    cases.push({ caseId, passed, ...(passed ? {} : { issue }) });
  };

  for (const canonicalCase of (["en", "es", "ru", "zh"] as const).map(byLanguage)) {
    const compiledLocale = compileCanonicalProviderEvaluationInput(canonicalCase);
    add(`locale-${canonicalCase.language}-compiles`, compiledLocale.status === "ready" &&
      compiledLocale.input.language === canonicalCase.language);
  }

  const taxonomyCoversCorpus = CANONICAL_OFFLINE_EVALUATION_CASES.every((source) => {
    const oracle = canonicalOracleConceptsByCategory(source);
    return CANONICAL_PROVIDER_EVALUATION_CATEGORIES.every((category) =>
      oracle[category].every((id) => CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category].includes(id))
    );
  });
  add("taxonomy-covers-frozen-core", taxonomyCoversCorpus);
  add("taxonomy-ids-unique", CANONICAL_PROVIDER_EVALUATION_CATEGORIES.every((category) =>
    new Set(CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category]).size ===
      CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category].length));
  let representationIssue = "";
  const allFrozenCasesRepresentable = CANONICAL_OFFLINE_EVALUATION_CASES.every((canonicalCase) => {
    const compiledCase = compileCanonicalProviderEvaluationInput(canonicalCase);
    const oracle = extractCanonicalProviderEvaluationOracle(canonicalCase);
    if (compiledCase.status !== "ready" || oracle === null) {
      representationIssue = `${canonicalCase.case_id}:compile_or_oracle`;
      return false;
    }
    const fakeResult = fakeEvaluationResult(canonicalCase);
    const validated = validateCanonicalProviderEvaluationResult(fakeResult, compiledCase.input);
    if (validated.status !== "valid") {
      representationIssue = `${canonicalCase.case_id}:${validated.category}`;
      return false;
    }
    const matched = matchCanonicalProviderEvaluationOracle(validated.result, oracle);
    if (!matched.passed) {
      representationIssue = `${canonicalCase.case_id}:oracle_match`;
      return false;
    }
    return true;
  });
  add(
    "all-160-oracles-structurally-representable",
    allFrozenCasesRepresentable,
    representationIssue || "Frozen oracle representation failed.",
  );

  const source = CANONICAL_OFFLINE_EVALUATION_CASES[0];
  const compiled = compileCanonicalProviderEvaluationInput(source);
  if (compiled.status !== "ready") throw new Error("Canonical preservation case did not compile.");
  const contents = (values: Array<{ content: string }>) => values.map((item) => item.content);
  add("facts-preserved", JSON.stringify(contents(compiled.input.input.known_facts)) === JSON.stringify(source.known_facts));
  add("assumptions-preserved", JSON.stringify(contents(compiled.input.input.known_assumptions)) === JSON.stringify(source.known_assumptions));
  add("task-profile-present", compiled.input.evaluation_task_profile.global_requirements.includes("identify_material_risks") &&
    compiled.input.evaluation_task_profile.global_requirements.includes("identify_materially_distinct_paths"));
  add("global-taxonomy-present", compiled.input.global_taxonomy.version ===
    CANONICAL_PROVIDER_EVALUATION_TAXONOMY_REGISTRY.version);

  const built = buildCanonicalProviderEvaluationRequest(source);
  if (built.status !== "ready") throw new Error("Canonical provider request did not build.");
  add("oracle-keys-excluded", CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS.every((key) =>
    !built.request.providerRequest.input.includes(`\"${key}\"`)));
  const changedBuilt = buildCanonicalProviderEvaluationRequest(changedOracleCase(source));
  add("all-oracle-fields-cannot-influence-request", changedBuilt.status === "ready" &&
    changedBuilt.request.providerRequest.input === built.request.providerRequest.input &&
    changedBuilt.request.providerRequest.instructions === built.request.providerRequest.instructions &&
    JSON.stringify(changedBuilt.request.providerRequest.schema) === JSON.stringify(built.request.providerRequest.schema));
  add("evaluation-result-schema-used", built.request.providerRequest.schemaName ===
    "levio_canonical_provider_evaluation_result_v1" && built.request.providerRequest.strict === true);
  const serializedSchema = JSON.stringify(CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA);
  const resultSchema = CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA as {
    properties: {
      candidate_material: {
        anyOf: Array<{
          properties?: {
            items?: { items?: { properties?: Record<string, { maxItems?: number }> } };
          };
        }>;
      };
    };
  };
  const evaluationCandidateProperties = resultSchema.properties.candidate_material.anyOf[0]
    .properties?.items?.items?.properties;
  add("annotation-uniqueness-provider-facing", serializedSchema.includes(
    "Each concept_id may appear at most once",
  ) && serializedSchema.includes("no duplicate value is allowed") &&
    !serializedSchema.includes('"uniqueItems"'));
  add("annotation-runtime-rules-provider-facing", CANONICAL_PROVIDER_ANNOTATION_RULES.length === 12 &&
    CANONICAL_PROVIDER_ANNOTATION_RULES.every((rule) =>
      built.request.providerRequest.instructions.includes(rule)));
  add("effective-contract-invariants-provider-facing",
    CANONICAL_PROVIDER_EFFECTIVE_CONTRACT_INSTRUCTIONS.every((instruction) =>
      built.request.providerRequest.instructions.includes(instruction)) &&
    Object.values(CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS).every(
      (invariant) => built.request.providerRequest.instructions.includes(
        invariant.providerInstruction,
      ),
    ) && Object.values(CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS).every(
      (invariant) => built.request.providerRequest.instructions.includes(
        invariant.providerInstruction,
      ),
    ));
  add("evaluation-candidate-reference-arrays-schema-empty",
    evaluationCandidateProperties?.option_refs?.maxItems === 0 &&
    evaluationCandidateProperties?.scenario_refs?.maxItems === 0 &&
    evaluationCandidateProperties?.criterion_refs?.maxItems === 0);
  add("runtime-refinements-described-with-supported-schema",
    serializedSchema.includes("candidate_id values must be unique") &&
    serializedSchema.includes("Non-whitespace candidate content") &&
    serializedSchema.includes("outcome.kind=candidate_material") &&
    !serializedSchema.includes('"uniqueItems"'));
  add("evaluation-output-limit-is-4000", built.request.providerRequest.maxOutputTokens === 4000 &&
    CANONICAL_PROVIDER_EVALUATION_LIMITS.maxOutputTokens === 4000 &&
    built.request.providerRequest.reasoningEffort === "low");
  add("evaluation-conservative-ceiling-is-006", CANONICAL_PROVIDER_EVALUATION_LIMITS.maxCostUsd === 0.06);
  add("evaluation-generation-timeout-is-120000",
    CANONICAL_PROVIDER_EVALUATION_LIMITS.generationTimeoutMs === 120000);
  add("evaluation-candidate-is-terra", built.request.providerRequest.model === "gpt-5.6-terra" &&
    CANONICAL_PROVIDER_EVALUATION_CANDIDATE.model === "gpt-5.6-terra");
  add("evaluation-provider-controls-profile-owned", CANONICAL_PROVIDER_EVALUATION_CANDIDATE.provider === "openai" &&
    built.request.providerRequest.store === false && built.request.providerRequest.tools.length === 0);
  add("evaluation-only-evidence", built.request.evidence.decisionContextBuilt === false &&
    built.request.evidence.promptContextBuilt === false &&
    built.request.evidence.productionRuntimeCalled === false);

  const fakeComplete = fakeEvaluationResult(source);
  const validatedComplete = validateCanonicalProviderEvaluationResult(fakeComplete, compiled.input);
  const sourceOracle = extractCanonicalProviderEvaluationOracle(source);
  if (!sourceOracle) throw new Error("Canonical oracle unavailable.");
  add("fake-complete-result-valid", validatedComplete.status === "valid");
  add("deterministic-exact-oracle-match", validatedComplete.status === "valid" &&
    matchCanonicalProviderEvaluationOracle(validatedComplete.result, sourceOracle).passed);

  const groundingCode = (material: CandidateDecisionMaterial) =>
    inspectCanonicalProviderCandidateGrounding(material, compiled.input)
      .diagnostic?.issues[0]?.code;
  const validGroundingCandidate = standardCandidate([]);
  add("candidate-grounding-allowed-provenance", inspectCanonicalProviderCandidateGrounding(
    validGroundingCandidate,
    compiled.input,
  ).valid);
  const disallowedProvenance = structuredClone(validGroundingCandidate);
  disallowedProvenance.items[0].provenance.source_ref = "invented_source";
  add("candidate-grounding-disallowed-provenance-diagnostic",
    groundingCode(disallowedProvenance) === "source_ref_not_allowed");
  const providerInferenceSituation = structuredClone(validGroundingCandidate);
  providerInferenceSituation.items[0].evidence = "provider_inference";
  providerInferenceSituation.items[0].provenance.source_ref = "case_situation";
  add("candidate-grounding-provider-inference-case-situation", inspectCanonicalProviderCandidateGrounding(
    providerInferenceSituation,
    compiled.input,
  ).valid);
  const providerInferenceFact = structuredClone(providerInferenceSituation);
  providerInferenceFact.items[0].provenance.source_ref = "fact_2";
  add("candidate-grounding-provider-inference-fact-2", compiled.input.allowed_refs.source_refs.includes(
    "fact_2",
  ) && inspectCanonicalProviderCandidateGrounding(providerInferenceFact, compiled.input).valid);
  const providerInferenceAssumption = structuredClone(providerInferenceSituation);
  providerInferenceAssumption.items[0].provenance.source_ref = "assumption_1";
  add("candidate-grounding-provider-inference-assumption-1",
    compiled.input.allowed_refs.source_refs.includes("assumption_1") &&
    inspectCanonicalProviderCandidateGrounding(providerInferenceAssumption, compiled.input).valid);
  const providerInferenceFabricated = structuredClone(providerInferenceSituation);
  providerInferenceFabricated.items[0].provenance.source_ref = "made_up_fact";
  add("candidate-grounding-provider-inference-fabricated-diagnostic",
    groundingCode(providerInferenceFabricated) === "source_ref_not_allowed");
  const providerInferenceSentinel = structuredClone(providerInferenceSituation);
  providerInferenceSentinel.items[0].provenance.source_ref = "provider_inference";
  add("candidate-grounding-provider-inference-sentinel-diagnostic",
    groundingCode(providerInferenceSentinel) === "provider_inference_source_ref_not_concrete");
  const unknownCorrect = structuredClone(validGroundingCandidate);
  unknownCorrect.items[0].evidence = "unknown";
  unknownCorrect.items[0].provenance.source_ref = "unknown";
  add("candidate-grounding-unknown-correct", inspectCanonicalProviderCandidateGrounding(
    unknownCorrect,
    compiled.input,
  ).valid);
  const gapSource = CANONICAL_OFFLINE_EVALUATION_CASES.find((item) =>
    item.critical_gaps.length > 0 || item.important_gaps.length > 0);
  if (!gapSource) throw new Error("Canonical gap source unavailable.");
  const gapCompiled = compileCanonicalProviderEvaluationInput(gapSource);
  if (gapCompiled.status !== "ready") throw new Error("Canonical gap source did not compile.");
  const concreteGapRef = gapCompiled.input.input.critical_gaps[0]?.source_ref ??
    gapCompiled.input.input.important_gaps[0]?.source_ref;
  if (!concreteGapRef) throw new Error("Canonical concrete gap reference unavailable.");
  const unknownConcreteGap = structuredClone(unknownCorrect);
  unknownConcreteGap.items[0].provenance.source_ref = concreteGapRef;
  add("candidate-grounding-unknown-concrete-gap", concreteGapRef !== undefined &&
    inspectCanonicalProviderCandidateGrounding(unknownConcreteGap, gapCompiled.input).valid);
  const unknownSentinelWithGap = structuredClone(unknownCorrect);
  add("candidate-grounding-unknown-sentinel-rejected-when-gap-exists",
    inspectCanonicalProviderCandidateGrounding(unknownSentinelWithGap, gapCompiled.input)
      .diagnostic?.issues[0]?.code === "unknown_source_ref_mismatch");
  const unknownWrong = structuredClone(unknownCorrect);
  unknownWrong.items[0].provenance.source_ref = "fact_1";
  add("candidate-grounding-unknown-mismatch-diagnostic",
    groundingCode(unknownWrong) === "unknown_source_ref_mismatch");
  const unknownFabricated = structuredClone(unknownCorrect);
  unknownFabricated.items[0].provenance.source_ref = "made_up_gap";
  add("candidate-grounding-unknown-fabricated-diagnostic",
    groundingCode(unknownFabricated) === "source_ref_not_allowed");
  for (const [field, expectedCode] of [
    ["option_refs", "option_refs_must_be_empty"],
    ["scenario_refs", "scenario_refs_must_be_empty"],
    ["criterion_refs", "criterion_refs_must_be_empty"],
  ] as const) {
    const nonEmptyReferences = structuredClone(validGroundingCandidate);
    nonEmptyReferences.items[0][field] = ["bounded_reference_1"];
    add(`candidate-grounding-${field}-diagnostic`,
      groundingCode(nonEmptyReferences) === expectedCode);
  }
  const manyGroundingIssues = structuredClone(validGroundingCandidate);
  manyGroundingIssues.items = Array.from({ length: 12 }, (_, index) => ({
    ...structuredClone(validGroundingCandidate.items[0]),
    candidate_id: `bounded_candidate_${index + 1}`,
    provenance: { source: "provider_candidate", source_ref: `invented_source_${index + 1}` },
    option_refs: ["bounded_reference_1"],
  }));
  const boundedGrounding = inspectCanonicalProviderCandidateGrounding(
    manyGroundingIssues,
    compiled.input,
  );
  add("candidate-grounding-diagnostic-hard-bound", !boundedGrounding.valid &&
    boundedGrounding.diagnostic?.issues.length ===
      CANONICAL_PROVIDER_PRE_MATCHER_DIAGNOSTIC_MAX_ISSUES &&
    boundedGrounding.diagnostic.truncated);
  const missing = structuredClone(fakeComplete);
  missing.evaluation_annotations.risk = missing.evaluation_annotations.risk.slice(1);
  add("missing-concept-deterministic-fail", validateCanonicalProviderEvaluationResult(missing, compiled.input).status === "valid" &&
    !matchCanonicalProviderEvaluationOracle(missing, sourceOracle).passed);

  const invalidTaxonomy = structuredClone(fakeComplete);
  invalidTaxonomy.evaluation_annotations.risk[0].concept_id = "not_in_canonical_taxonomy";
  const invalidTaxonomyValidation = validateCanonicalProviderEvaluationResult(
    invalidTaxonomy,
    compiled.input,
  );
  add("invalid-taxonomy-id-fails-closed", invalidTaxonomyValidation.status === "invalid" &&
    invalidTaxonomyValidation.annotationDiagnostic?.reason === "concept_id_invalid");
  const duplicateMaterialCandidateId = structuredClone(fakeComplete);
  if (duplicateMaterialCandidateId.candidate_material) {
    duplicateMaterialCandidateId.candidate_material.items[1].candidate_id =
      duplicateMaterialCandidateId.candidate_material.items[0].candidate_id;
  }
  const duplicateMaterialCandidateValidation = validateCanonicalProviderEvaluationResult(
    duplicateMaterialCandidateId,
    compiled.input,
  );
  add("result-contract-duplicate-candidate-id-diagnostic",
    duplicateMaterialCandidateValidation.status === "invalid" &&
    duplicateMaterialCandidateValidation.category === "evaluation_result_contract_invalid" &&
    duplicateMaterialCandidateValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "duplicate_candidate_id");
  const whitespaceContent = structuredClone(fakeComplete);
  if (whitespaceContent.candidate_material) {
    whitespaceContent.candidate_material.items[0].content = "   ";
  }
  const whitespaceContentValidation = validateCanonicalProviderEvaluationResult(
    whitespaceContent,
    compiled.input,
  );
  add("result-contract-whitespace-content-diagnostic",
    whitespaceContentValidation.status === "invalid" &&
    whitespaceContentValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "candidate_content_whitespace_only" &&
    whitespaceContentValidation.preMatcherDiagnostic.issues[0].receivedLength === 3);
  const duplicateCandidateReference = structuredClone(fakeComplete);
  if (duplicateCandidateReference.candidate_material) {
    duplicateCandidateReference.candidate_material.items[0].option_refs = [
      "option_reference_1", "option_reference_1",
    ];
  }
  const duplicateCandidateReferenceValidation = validateCanonicalProviderEvaluationResult(
    duplicateCandidateReference,
    compiled.input,
  );
  add("result-contract-duplicate-reference-diagnostic",
    duplicateCandidateReferenceValidation.status === "invalid" &&
    duplicateCandidateReferenceValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "duplicate_reference_identifier");
  const unsafeContent = structuredClone(fakeComplete);
  const unsafeContentSentinel = "I recommend the best option.";
  if (unsafeContent.candidate_material) {
    unsafeContent.candidate_material.items[0].content = unsafeContentSentinel;
  }
  const unsafeContentValidation = validateCanonicalProviderEvaluationResult(
    unsafeContent,
    compiled.input,
  );
  add("result-contract-safety-diagnostic-excludes-content",
    unsafeContentValidation.status === "invalid" &&
    unsafeContentValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "direct_recommendation_forbidden" &&
    !JSON.stringify(unsafeContentValidation.preMatcherDiagnostic).includes(unsafeContentSentinel));
  const invalidOutcomeRelationship = structuredClone(fakeComplete);
  invalidOutcomeRelationship.outcome = {
    kind: "candidate_material",
    v2_status: "CANNOT_RECOMMEND",
  };
  const invalidOutcomeValidation = validateCanonicalProviderEvaluationResult(
    invalidOutcomeRelationship,
    compiled.input,
  );
  add("outcome-cross-field-diagnostic",
    invalidOutcomeValidation.status === "invalid" &&
    invalidOutcomeValidation.category === "evaluation_outcome_invalid" &&
    invalidOutcomeValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "candidate_material_v2_status_mismatch");
  const inventedRef = structuredClone(fakeComplete);
  inventedRef.evaluation_annotations.risk[0].candidate_ids = ["invented_candidate"];
  const inventedRefValidation = validateCanonicalProviderEvaluationResult(
    inventedRef,
    compiled.input,
  );
  add("invented-candidate-ref-fails-closed", inventedRefValidation.status === "invalid" &&
    inventedRefValidation.category === "evaluation_annotation_grounding_invalid" &&
    inventedRefValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "annotation_candidate_id_not_found");
  const inventedSourceRef = structuredClone(fakeComplete);
  inventedSourceRef.evaluation_annotations.risk[0].source_refs = ["invented_source"];
  const inventedSourceRefValidation = validateCanonicalProviderEvaluationResult(
    inventedSourceRef,
    compiled.input,
  );
  add("invented-source-ref-fails-closed", inventedSourceRefValidation.status === "invalid" &&
    inventedSourceRefValidation.category === "evaluation_annotation_grounding_invalid" &&
    inventedSourceRefValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "annotation_source_ref_not_allowed");
  const annotationProvenanceMismatch = structuredClone(fakeComplete);
  annotationProvenanceMismatch.evaluation_annotations.risk[0].source_refs = ["fact_1"];
  const annotationProvenanceValidation = validateCanonicalProviderEvaluationResult(
    annotationProvenanceMismatch,
    compiled.input,
  );
  add("annotation-source-candidate-provenance-diagnostic",
    annotationProvenanceValidation.status === "invalid" &&
    annotationProvenanceValidation.category === "evaluation_annotation_grounding_invalid" &&
    annotationProvenanceValidation.preMatcherDiagnostic?.issues[0]?.code ===
      "annotation_source_ref_not_in_selected_candidate_provenance");
  const riskTypeMismatch = structuredClone(fakeComplete);
  riskTypeMismatch.evaluation_annotations.risk[0].candidate_ids = ["evaluation_option_1"];
  const riskTypeMismatchValidation = validateCanonicalProviderEvaluationResult(
    riskTypeMismatch,
    compiled.input,
  );
  add("risk-annotation-type-mismatch-fails-closed", riskTypeMismatchValidation.status === "invalid" &&
    riskTypeMismatchValidation.annotationDiagnostic?.reason === "risk_candidate_type_incompatible" &&
    riskTypeMismatchValidation.annotationDiagnostic.actualCandidateItemTypes.join(",") === "option");
  const duplicateCandidate = structuredClone(fakeComplete);
  duplicateCandidate.evaluation_annotations.risk[0].candidate_ids = [
    duplicateCandidate.evaluation_annotations.risk[0].candidate_ids[0],
    duplicateCandidate.evaluation_annotations.risk[0].candidate_ids[0],
  ];
  const duplicateCandidateValidation = validateCanonicalProviderEvaluationResult(
    duplicateCandidate,
    compiled.input,
  );
  add("duplicate-candidate-diagnostic", duplicateCandidateValidation.status === "invalid" &&
    duplicateCandidateValidation.annotationDiagnostic?.reason === "duplicate_candidate_id");
  const duplicateSource = structuredClone(fakeComplete);
  duplicateSource.evaluation_annotations.risk[0].source_refs = [
    "provider_inference", "provider_inference",
  ];
  const duplicateSourceValidation = validateCanonicalProviderEvaluationResult(
    duplicateSource,
    compiled.input,
  );
  add("duplicate-source-diagnostic", duplicateSourceValidation.status === "invalid" &&
    duplicateSourceValidation.annotationDiagnostic?.reason === "duplicate_source_ref");
  const duplicateConcept = structuredClone(fakeComplete);
  duplicateConcept.evaluation_annotations.risk.push(
    structuredClone(duplicateConcept.evaluation_annotations.risk[0]),
  );
  const duplicateConceptValidation = validateCanonicalProviderEvaluationResult(
    duplicateConcept,
    compiled.input,
  );
  add("duplicate-concept-diagnostic", duplicateConceptValidation.status === "invalid" &&
    duplicateConceptValidation.annotationDiagnostic?.reason === "duplicate_concept_id");
  const emptyCandidateGrounding = structuredClone(fakeComplete);
  emptyCandidateGrounding.evaluation_annotations.risk[0].candidate_ids = [];
  emptyCandidateGrounding.evaluation_annotations.risk[0].source_refs = [];
  const emptyCandidateValidation = validateCanonicalProviderEvaluationResult(
    emptyCandidateGrounding,
    compiled.input,
  );
  add("candidate-material-references-diagnostic", emptyCandidateValidation.status === "invalid" &&
    emptyCandidateValidation.annotationDiagnostic?.reason === "candidate_material_references_empty");
  const executionReferences = structuredClone(fakeComplete);
  executionReferences.evaluation_annotations.v2_status[0].candidate_ids = ["evaluation_option_1"];
  executionReferences.evaluation_annotations.v2_status[0].source_refs = ["case_situation"];
  const executionReferencesValidation = validateCanonicalProviderEvaluationResult(
    executionReferences,
    compiled.input,
  );
  add("execution-outcome-empty-references-diagnostic", executionReferencesValidation.status === "invalid" &&
    executionReferencesValidation.annotationDiagnostic?.reason ===
      "execution_outcome_references_not_empty");
  const invalidEvidenceKind = structuredClone(fakeComplete) as unknown as Record<string, unknown>;
  const invalidEvidenceAnnotations = invalidEvidenceKind.evaluation_annotations as
    CanonicalProviderEvaluationResultV1["evaluation_annotations"];
  (invalidEvidenceAnnotations.risk[0] as unknown as Record<string, unknown>).evidence_kind =
    "unsupported_evidence";
  const invalidEvidenceValidation = validateCanonicalProviderEvaluationResult(
    invalidEvidenceKind,
    compiled.input,
  );
  add("invalid-evidence-kind-diagnostic", invalidEvidenceValidation.status === "invalid" &&
    invalidEvidenceValidation.annotationDiagnostic?.reason === "evidence_kind_invalid");
  const v2Mismatch = structuredClone(fakeComplete);
  const alternateV2Status = CANONICAL_PROVIDER_EVALUATION_TAXONOMY.v2_status.find(
    (concept) => concept !== v2Mismatch.outcome.v2_status,
  );
  if (alternateV2Status) {
    v2Mismatch.evaluation_annotations.v2_status[0].concept_id = alternateV2Status;
  }
  const v2MismatchValidation = validateCanonicalProviderEvaluationResult(v2Mismatch, compiled.input);
  add("v2-outcome-mismatch-diagnostic", alternateV2Status !== undefined &&
    v2MismatchValidation.status === "invalid" &&
    v2MismatchValidation.annotationDiagnostic?.reason === "v2_status_outcome_mismatch");
  const riskExecutionOutcome = structuredClone(fakeComplete);
  riskExecutionOutcome.evaluation_annotations.risk[0] = {
    ...riskExecutionOutcome.evaluation_annotations.risk[0],
    evidence_kind: "execution_outcome",
    candidate_ids: [],
    source_refs: [],
  };
  const riskExecutionValidation = validateCanonicalProviderEvaluationResult(
    riskExecutionOutcome,
    compiled.input,
  );
  add("risk-execution-outcome-diagnostic", riskExecutionValidation.status === "invalid" &&
    riskExecutionValidation.annotationDiagnostic?.reason === "risk_execution_outcome_incompatible");
  const v2CandidateMaterial = structuredClone(fakeComplete);
  v2CandidateMaterial.evaluation_annotations.v2_status[0] = {
    ...v2CandidateMaterial.evaluation_annotations.v2_status[0],
    evidence_kind: "candidate_material",
    candidate_ids: ["evaluation_option_1"],
    source_refs: ["case_situation"],
  };
  const v2CandidateValidation = validateCanonicalProviderEvaluationResult(
    v2CandidateMaterial,
    compiled.input,
  );
  add("v2-candidate-material-diagnostic", v2CandidateValidation.status === "invalid" &&
    v2CandidateValidation.annotationDiagnostic?.reason === "v2_status_candidate_material_forbidden");
  const scenarioEvidenceIncomplete = structuredClone(fakeComplete);
  const compareAnnotation = scenarioEvidenceIncomplete.evaluation_annotations.scenario.find(
    (annotation) => annotation.concept_id.startsWith("compare_"),
  );
  if (compareAnnotation) compareAnnotation.candidate_ids = ["evaluation_option_1", "evaluation_option_2"];
  const scenarioEvidenceValidation = validateCanonicalProviderEvaluationResult(
      scenarioEvidenceIncomplete,
      compiled.input,
    );
  add("scenario-path-requires-consequence-evidence", compareAnnotation !== undefined &&
    scenarioEvidenceValidation.status === "invalid" &&
    scenarioEvidenceValidation.annotationDiagnostic?.reason === "scenario_compare_consequence_missing");
  const scenarioCompareExecution = structuredClone(fakeComplete);
  const scenarioCompareExecutionAnnotation = scenarioCompareExecution.evaluation_annotations.scenario.find(
    (annotation) => annotation.concept_id.startsWith("compare_"),
  );
  if (scenarioCompareExecutionAnnotation) {
    scenarioCompareExecutionAnnotation.evidence_kind = "execution_outcome";
    scenarioCompareExecutionAnnotation.candidate_ids = [];
    scenarioCompareExecutionAnnotation.source_refs = [];
  }
  const scenarioCompareExecutionValidation = validateCanonicalProviderEvaluationResult(
    scenarioCompareExecution,
    compiled.input,
  );
  add("scenario-compare-evidence-diagnostic", scenarioCompareExecutionAnnotation !== undefined &&
    scenarioCompareExecutionValidation.status === "invalid" &&
    scenarioCompareExecutionValidation.annotationDiagnostic?.reason ===
      "scenario_compare_requires_candidate_material");
  const scenarioOptionCount = structuredClone(fakeComplete);
  const scenarioOptionCountAnnotation = scenarioOptionCount.evaluation_annotations.scenario.find(
    (annotation) => annotation.concept_id.startsWith("compare_"),
  );
  if (scenarioOptionCountAnnotation) {
    scenarioOptionCountAnnotation.candidate_ids = [
      "evaluation_option_1", "evaluation_short_term_1",
    ];
  }
  const scenarioOptionCountValidation = validateCanonicalProviderEvaluationResult(
    scenarioOptionCount,
    compiled.input,
  );
  add("scenario-compare-option-count-diagnostic", scenarioOptionCountAnnotation !== undefined &&
    scenarioOptionCountValidation.status === "invalid" &&
    scenarioOptionCountValidation.annotationDiagnostic?.reason ===
      "scenario_compare_option_count_insufficient");
  const askConcept = CANONICAL_PROVIDER_EVALUATION_TAXONOMY.clarification.find(
    (concept) => concept.startsWith("ask_"),
  );
  const clarificationTypeMissing = structuredClone(fakeComplete);
  if (askConcept) {
    clarificationTypeMissing.evaluation_annotations.clarification = [{
      concept_id: askConcept,
      evidence_kind: "candidate_material",
      candidate_ids: ["evaluation_option_1"],
      source_refs: ["case_situation"],
    }];
  }
  const clarificationTypeValidation = validateCanonicalProviderEvaluationResult(
    clarificationTypeMissing,
    compiled.input,
  );
  add("clarification-item-type-diagnostic", askConcept !== undefined &&
    clarificationTypeValidation.status === "invalid" &&
    clarificationTypeValidation.annotationDiagnostic?.reason ===
      "clarification_candidate_type_missing");
  const informationFirstConcept = CANONICAL_PROVIDER_EVALUATION_TAXONOMY.scenario.find(
    (concept) => concept === "include_information_first_path" ||
      concept === "include_no_action_or_information_first_path",
  );
  const informationFirstGrounding = structuredClone(fakeComplete);
  if (informationFirstConcept) {
    informationFirstGrounding.evaluation_annotations.scenario = [{
      concept_id: informationFirstConcept,
      evidence_kind: "candidate_material",
      candidate_ids: ["evaluation_short_term_1"],
      source_refs: ["case_situation"],
    }];
  }
  const informationFirstValidation = validateCanonicalProviderEvaluationResult(
    informationFirstGrounding,
    compiled.input,
  );
  add("information-first-grounding-diagnostic", informationFirstConcept !== undefined &&
    informationFirstValidation.status === "invalid" &&
    informationFirstValidation.annotationDiagnostic?.reason ===
      "information_first_grounding_missing");
  const invalidCategory = structuredClone(fakeComplete) as unknown as Record<string, unknown>;
  (invalidCategory.evaluation_annotations as Record<string, unknown>).unexpected = [];
  add("invalid-category-fails-closed", validateCanonicalProviderEvaluationResult(
    invalidCategory,
    compiled.input,
  ).status === "invalid");

  const refusalSource = CANONICAL_OFFLINE_EVALUATION_CASES.find((item) =>
    item.expected_scenario_behavior.includes("refuse_harmful_request"));
  if (!refusalSource) throw new Error("Canonical refusal case unavailable.");
  const refusalCompiled = compileCanonicalProviderEvaluationInput(refusalSource);
  if (refusalCompiled.status !== "ready") throw new Error("Canonical refusal case did not compile.");
  const refusalResult = fakeEvaluationResult(refusalSource);
  const refusalOracle = extractCanonicalProviderEvaluationOracle(refusalSource);
  add("structured-safe-refusal-valid", refusalOracle !== null &&
    validateCanonicalProviderEvaluationResult(refusalResult, refusalCompiled.input).status === "valid" &&
    matchCanonicalProviderEvaluationOracle(refusalResult, refusalOracle).passed);

  let countCalls = 0;
  let generationCalls = 0;
  const offline = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { countCalls += 1; return 800; },
    async generate() {
      generationCalls += 1;
      return {
        status: "completed",
        outputText: JSON.stringify(fakeComplete),
        usage: { inputTokens: 800, cachedInputTokens: 600, outputTokens: 700, totalTokens: 1500 },
      };
    },
  });
  add("fake-transport-order-and-count", countCalls === 1 && generationCalls === 1);
  add("offline-candidate-evaluated", offline.status === "completed" &&
    offline.quality.acceptedForEvaluation && offline.quality.canonicalOracleMatched);
  add("existing-acceptance-boundary-used", offline.status === "completed" &&
    offline.evidence.existingAcceptanceBoundaryUsed);
  add("oracle-read-after-result", offline.status === "completed" &&
    offline.evidence.oracleReadAfterProviderResult);
  add("offline-network-operations-zero", offline.status === "completed" &&
    offline.evidence.networkOperations === 0);
  add("completed-usage-preserves-cached-tokens", offline.status === "completed" &&
    offline.usage.cachedInputTokens === 600);
  add("conservative-and-cache-adjusted-cost-separated", offline.status === "completed" &&
    offline.usage.conservativeUncachedCostUsd === 0.01 &&
    offline.usage.cacheAdjustedCalculatedCostUsd === 0.00892 &&
    offline.usage.cacheAdjustedFallbackToConservative === false &&
    offline.usage.calculatedCostUsd === offline.usage.cacheAdjustedCalculatedCostUsd);

  const runAcceptedProjectionFixture = (result: unknown) =>
    runCanonicalProviderEvaluationOffline(source, {
      kind: "deterministic_fake_provider",
      async countInput() { return 800; },
      async generate() {
        return {
          status: "completed" as const,
          outputText: JSON.stringify(result),
          usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
        };
      },
    });
  const mixedImperative = structuredClone(fakeComplete);
  const imperativeCandidate = baseItem(
    "evaluation_imperative_rejected",
    "option",
    "Choose this option immediately.",
  );
  mixedImperative.candidate_material?.items.push(imperativeCandidate);
  const rejectedAnnotationConcept = mixedImperative.evaluation_annotations.scenario[0]?.concept_id;
  if (mixedImperative.evaluation_annotations.scenario[0]) {
    mixedImperative.evaluation_annotations.scenario[0] = {
      ...mixedImperative.evaluation_annotations.scenario[0],
      evidence_kind: "candidate_material",
      candidate_ids: [imperativeCandidate.candidate_id],
      source_refs: [imperativeCandidate.provenance.source_ref],
    };
  }
  const mixedImperativeOffline = await runAcceptedProjectionFixture(mixedImperative);
  const imperativeLedger = mixedImperativeOffline.status === "completed"
    ? mixedImperativeOffline.acceptance?.ledger.find(
        (entry) => entry.candidate_id === imperativeCandidate.candidate_id)
    : undefined;
  add("mixed-imperative-outer-result-survives", mixedImperativeOffline.status === "completed");
  add("mixed-imperative-item-rejected", imperativeLedger?.disposition ===
    "rejected_unsupported_authority" && imperativeLedger.reason ===
      "imperative_instruction_forbidden");
  add("mixed-imperative-valid-items-preserved", mixedImperativeOffline.status === "completed" &&
    mixedImperativeOffline.candidateMaterial?.items.some(
      (item) => item.candidate_id === "evaluation_option_1") === true &&
    !mixedImperativeOffline.candidateMaterial.items.some(
      (item) => item.candidate_id === imperativeCandidate.candidate_id));
  add("mixed-imperative-no-silent-loss", mixedImperativeOffline.status === "completed" &&
    mixedImperativeOffline.acceptance?.silent_drop_count === 0 &&
    mixedImperativeOffline.acceptance.ledger.length ===
      mixedImperativeOffline.acceptance.observed_candidate_count);
  add("mixed-imperative-dependent-annotation-pruned", mixedImperativeOffline.status === "completed" &&
    mixedImperativeOffline.acceptedProjection.annotationProjection.prunedAnnotationCount >= 1 &&
    !mixedImperativeOffline.evaluationResult.evaluation_annotations.scenario.some(
      (annotation) => annotation.candidate_ids.includes(imperativeCandidate.candidate_id)));
  add("mixed-imperative-rejected-material-no-matcher-credit",
    mixedImperativeOffline.status === "completed" && rejectedAnnotationConcept !== undefined &&
    mixedImperativeOffline.oracleMatch.categories.scenario.missing.includes(
      rejectedAnnotationConcept));
  add("mixed-imperative-content-not-in-accepted-projection",
    mixedImperativeOffline.status === "completed" &&
    !JSON.stringify(mixedImperativeOffline.acceptedProjection).includes(
      imperativeCandidate.content));

  const mixedRecommendation = structuredClone(fakeComplete);
  const recommendationCandidate = baseItem(
    "evaluation_recommendation_rejected", "option", "I recommend the best option.",
  );
  mixedRecommendation.candidate_material?.items.push(recommendationCandidate);
  const mixedRecommendationOffline = await runAcceptedProjectionFixture(mixedRecommendation);
  add("mixed-direct-recommendation-rejected", mixedRecommendationOffline.status === "completed" &&
    mixedRecommendationOffline.acceptance?.ledger.some((entry) =>
      entry.candidate_id === recommendationCandidate.candidate_id &&
      entry.disposition === "rejected_unsupported_authority" &&
      entry.reason === "direct_recommendation_forbidden"));

  const mixedCertainty = structuredClone(fakeComplete);
  const certaintyCandidate = baseItem(
    "evaluation_certainty_rejected", "risk_signal", "This outcome is guaranteed.",
  );
  mixedCertainty.candidate_material?.items.push(certaintyCandidate);
  const mixedCertaintyOffline = await runAcceptedProjectionFixture(mixedCertainty);
  add("mixed-unsupported-certainty-rejected", mixedCertaintyOffline.status === "completed" &&
    mixedCertaintyOffline.acceptance?.ledger.some((entry) =>
      entry.candidate_id === certaintyCandidate.candidate_id &&
      entry.disposition === "rejected_unsupported_authority" &&
      entry.reason === "unsupported_certainty_forbidden"));

  const normalizationAndDuplicate = structuredClone(fakeComplete);
  const normalizedCandidate = baseItem(
    "evaluation_normalized_candidate", "unknown", "  A bounded unknown remains open.  ",
  );
  const projectionDuplicateCandidate = baseItem(
    "evaluation_duplicate_candidate", "unknown", "A bounded unknown remains open.",
  );
  normalizationAndDuplicate.candidate_material?.items.push(
    normalizedCandidate,
    projectionDuplicateCandidate,
  );
  const normalizationAndDuplicateOffline = await runAcceptedProjectionFixture(
    normalizationAndDuplicate,
  );
  add("accepted-projection-normalization-and-merge-deterministic",
    normalizationAndDuplicateOffline.status === "completed" &&
    normalizationAndDuplicateOffline.acceptance?.ledger.some((entry) =>
      entry.candidate_id === normalizedCandidate.candidate_id &&
      entry.disposition === "accepted_with_normalization") &&
    normalizationAndDuplicateOffline.acceptance.ledger.some((entry) =>
      entry.candidate_id === projectionDuplicateCandidate.candidate_id &&
      entry.disposition === "merged_as_duplicate" &&
      entry.normalized_or_merged_item_id === normalizedCandidate.candidate_id));

  const structurallyIncompatible = structuredClone(fakeComplete) as unknown as Record<string, unknown>;
  structurallyIncompatible.evaluation_contract_version = "incompatible-result-version";
  const structurallyIncompatibleOffline = await runAcceptedProjectionFixture(
    structurallyIncompatible,
  );
  add("incompatible-top-level-contract-remains-hard-failure",
    structurallyIncompatibleOffline.status === "blocked" &&
    structurallyIncompatibleOffline.category === "evaluation_result_contract_invalid");

  const excessiveItems = structuredClone(fakeComplete);
  if (excessiveItems.candidate_material) {
    excessiveItems.candidate_material.items = Array.from({ length: 65 }, (_, index) =>
      baseItem(
        `evaluation_excessive_${index + 1}`,
        "context_factor",
        `Bounded excessive candidate ${index + 1}.`,
      ));
  }
  const excessiveItemsOffline = await runAcceptedProjectionFixture(excessiveItems);
  add("excessive-item-count-remains-hard-failure", excessiveItemsOffline.status === "blocked" &&
    excessiveItemsOffline.category === "evaluation_result_contract_invalid" &&
    excessiveItemsOffline.preMatcherDiagnostic?.issues[0]?.code ===
      "candidate_item_count_exceeded");

  const allRejected = structuredClone(fakeComplete);
  if (allRejected.candidate_material) allRejected.candidate_material.items = [imperativeCandidate];
  const allRejectedOffline = await runAcceptedProjectionFixture(allRejected);
  add("all-rejected-uses-existing-empty-material-semantics", allRejectedOffline.status === "completed" &&
    allRejectedOffline.candidateMaterial?.items.length === 0 &&
    allRejectedOffline.acceptance?.observed_candidate_count === 1 &&
    allRejectedOffline.acceptance.ledger.length === 1 &&
    allRejectedOffline.acceptance.silent_drop_count === 0 &&
    !allRejectedOffline.oracleMatch.passed);

  const offlineAnnotationInvalid = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate() {
      return {
        status: "completed",
        outputText: JSON.stringify(riskTypeMismatch),
        usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
      };
    },
  });
  add("annotation-invalid-pruned-before-matcher", offlineAnnotationInvalid.status === "completed" &&
    offlineAnnotationInvalid.acceptedProjection.annotationProjection.prunedAnnotationCount >= 1 &&
    !offlineAnnotationInvalid.evaluationResult.evaluation_annotations.risk.some(
      (annotation) => annotation.candidate_ids.includes("evaluation_option_1")));
  add("annotation-projection-excludes-raw-output", offlineAnnotationInvalid.status === "completed" &&
    !JSON.stringify(offlineAnnotationInvalid.acceptedProjection.annotationProjection).includes(
      riskTypeMismatch.candidate_material?.items[0].content ?? "candidate-content-sentinel",
    ) && !JSON.stringify(offlineAnnotationInvalid.acceptedProjection.annotationProjection).includes(
      "reasoning"));

  const candidateGroundingFailure = structuredClone(fakeComplete);
  if (candidateGroundingFailure.candidate_material) {
    candidateGroundingFailure.candidate_material.items[0].option_refs = ["bounded_reference_1"];
  }
  const offlineCandidateGrounding = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate() {
      return {
        status: "completed",
        outputText: JSON.stringify(candidateGroundingFailure),
        usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
      };
    },
  });
  add("candidate-invalid-reference-rejected-before-grounding",
    offlineCandidateGrounding.status === "completed" &&
    offlineCandidateGrounding.acceptance?.ledger.some((entry) =>
      entry.candidate_id === "evaluation_option_1" &&
      entry.disposition === "rejected_invalid" && entry.reason === "invalid_reference") &&
    !offlineCandidateGrounding.candidateMaterial?.items.some(
      (item) => item.candidate_id === "evaluation_option_1"));

  const offlineResultContract = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate() {
      return {
        status: "completed",
        outputText: JSON.stringify(whitespaceContent),
        usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
      };
    },
  });
  add("item-schema-defect-rejected-without-result-hard-fail",
    offlineResultContract.status === "completed" &&
    offlineResultContract.acceptance?.ledger.some((entry) =>
      entry.candidate_id === "evaluation_option_1" &&
      entry.disposition === "rejected_invalid" && entry.reason === "schema_invalid"));

  const offlineAnnotationGrounding = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate() {
      return {
        status: "completed",
        outputText: JSON.stringify(annotationProvenanceMismatch),
        usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
      };
    },
  });
  add("annotation-grounding-defect-pruned-before-matcher",
    offlineAnnotationGrounding.status === "completed" &&
    offlineAnnotationGrounding.acceptedProjection.annotationProjection.prunedAnnotationCount >= 1 &&
    !offlineAnnotationGrounding.evaluationResult.evaluation_annotations.risk.some(
      (annotation) => annotation.source_refs.includes("fact_1")));
  add("pre-matcher-diagnostics-exclude-natural-language-content", [
    offlineCandidateGrounding,
    offlineResultContract,
    offlineAnnotationGrounding,
  ].every((result) => !JSON.stringify(
    result.status === "blocked" ? result.preMatcherDiagnostic : null,
  ).includes(fakeComplete.candidate_material?.items[0].content ?? "candidate-content-sentinel")));

  const noCacheOffline = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate() {
      return {
        status: "completed",
        outputText: JSON.stringify(fakeComplete),
        usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
      };
    },
  });
  add("missing-cache-usage-falls-back-conservatively", noCacheOffline.status === "completed" &&
    noCacheOffline.usage.cachedInputTokens === null &&
    noCacheOffline.usage.cacheAdjustedFallbackToConservative &&
    noCacheOffline.usage.cacheAdjustedCalculatedCostUsd ===
      noCacheOffline.usage.conservativeUncachedCostUsd);

  const malformed = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate() {
      return {
        status: "completed",
        outputText: "not-json",
        usage: { inputTokens: 800, outputTokens: 1, totalTokens: 801 },
      };
    },
  });
  add("malformed-result-fails-closed", malformed.status === "blocked" &&
    malformed.category === "evaluation_result_contract_invalid");

  return {
    version: "stage-9-canonical-provider-evaluation-boundary-validation.2",
    cases,
    passed: cases.every((item) => item.passed),
    networkOperations: 0,
  };
}
