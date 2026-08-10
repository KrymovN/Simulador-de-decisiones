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
  matchCanonicalProviderEvaluationOracle,
  validateCanonicalProviderEvaluationResult,
  type CanonicalProviderEvaluationAnnotation,
  type CanonicalProviderEvaluationOutcome,
  type CanonicalProviderEvaluationResultV1,
} from "./canonical-provider-evaluation-result";
import {
  buildCanonicalProviderEvaluationRequest,
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
    provenance: { source: "provider_candidate", source_ref: "provider_inference" },
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
      source_refs: ["provider_inference"],
    };
  }
  if (category === "scenario" && concept.startsWith("compare_")) {
    return {
      evidence_kind: "candidate_material",
      candidate_ids: [
        "evaluation_option_1", "evaluation_option_2",
        "evaluation_short_term_1", "evaluation_long_term_1",
      ],
      source_refs: ["provider_inference"],
    };
  }
  if (category === "scenario" && concept.includes("information_first_path")) {
    return {
      evidence_kind: "candidate_material",
      candidate_ids: ["evaluation_option_1", "evaluation_clarification_1"],
      source_refs: ["provider_inference"],
    };
  }
  return {
    evidence_kind: "candidate_material",
    candidate_ids: ["evaluation_short_term_1"],
    source_refs: ["provider_inference"],
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
  add("production-provider-controls-reused", built.request.providerRequest.model === "gpt-5.6-terra" &&
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
  const missing = structuredClone(fakeComplete);
  missing.evaluation_annotations.risk = missing.evaluation_annotations.risk.slice(1);
  add("missing-concept-deterministic-fail", validateCanonicalProviderEvaluationResult(missing, compiled.input).status === "valid" &&
    !matchCanonicalProviderEvaluationOracle(missing, sourceOracle).passed);

  const invalidTaxonomy = structuredClone(fakeComplete);
  invalidTaxonomy.evaluation_annotations.risk[0].concept_id = "not_in_canonical_taxonomy";
  add("invalid-taxonomy-id-fails-closed", validateCanonicalProviderEvaluationResult(
    invalidTaxonomy,
    compiled.input,
  ).status === "invalid");
  const inventedRef = structuredClone(fakeComplete);
  inventedRef.evaluation_annotations.risk[0].candidate_ids = ["invented_candidate"];
  add("invented-candidate-ref-fails-closed", validateCanonicalProviderEvaluationResult(
    inventedRef,
    compiled.input,
  ).status === "invalid");
  const inventedSourceRef = structuredClone(fakeComplete);
  inventedSourceRef.evaluation_annotations.risk[0].source_refs = ["invented_source"];
  add("invented-source-ref-fails-closed", validateCanonicalProviderEvaluationResult(
    inventedSourceRef,
    compiled.input,
  ).status === "invalid");
  const riskTypeMismatch = structuredClone(fakeComplete);
  riskTypeMismatch.evaluation_annotations.risk[0].candidate_ids = ["evaluation_option_1"];
  add("risk-annotation-type-mismatch-fails-closed", validateCanonicalProviderEvaluationResult(
    riskTypeMismatch,
    compiled.input,
  ).status === "invalid");
  const scenarioEvidenceIncomplete = structuredClone(fakeComplete);
  const compareAnnotation = scenarioEvidenceIncomplete.evaluation_annotations.scenario.find(
    (annotation) => annotation.concept_id.startsWith("compare_"),
  );
  if (compareAnnotation) compareAnnotation.candidate_ids = ["evaluation_option_1", "evaluation_option_2"];
  add("scenario-path-requires-consequence-evidence", compareAnnotation !== undefined &&
    validateCanonicalProviderEvaluationResult(
      scenarioEvidenceIncomplete,
      compiled.input,
    ).status === "invalid");
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
        usage: { inputTokens: 800, outputTokens: 700, totalTokens: 1500 },
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
