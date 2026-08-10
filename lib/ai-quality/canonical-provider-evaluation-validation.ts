import "server-only";

import {
  CANONICAL_OFFLINE_EVALUATION_CASES,
  type CanonicalOfflineEvaluationCase,
} from "../ai-decision-material/fixtures";
import {
  CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS,
  compileCanonicalProviderEvaluationInput,
} from "../ai-decision-material/canonical-provider-evaluation-input";
import type { CandidateDecisionMaterial } from "../ai-decision-material/contracts";
import type { DecisionMaterialProviderRequest } from "../ai-provider/openai-decision-material-adapter";
import {
  buildCanonicalProviderEvaluationRequest,
  runCanonicalProviderEvaluationOffline,
} from "./canonical-provider-evaluation";

export type CanonicalProviderEvaluationValidationCase = {
  caseId: string;
  passed: boolean;
  issue?: string;
};

export type CanonicalProviderEvaluationValidationResult = {
  version: "stage-9-canonical-provider-evaluation-boundary-validation.1";
  cases: CanonicalProviderEvaluationValidationCase[];
  passed: boolean;
  networkOperations: 0;
};

function fakeCandidate(request: DecisionMaterialProviderRequest): CandidateDecisionMaterial {
  const input = JSON.parse(request.input) as {
    input: { user_situation: string; user_intent: string };
  };
  const base = {
    provenance: { source: "provider_candidate" as const, source_ref: "case_situation" },
    confidence: "high" as const,
    evidence: "user_fact_reference" as const,
    option_refs: [], scenario_refs: [], criterion_refs: [],
    authority: "candidate_only" as const,
    capability: "candidate_decision_material_v1" as const,
    contract_version: "1.0" as const,
  };
  return {
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [
      { ...base, candidate_id: "evaluation_context_1", item_type: "context_factor", content: input.input.user_situation },
      { ...base, candidate_id: "evaluation_intent_1", item_type: "user_goal", content: input.input.user_intent, provenance: { source: "provider_candidate", source_ref: "case_intent" } },
      { ...base, candidate_id: "evaluation_risk_1", item_type: "risk_signal", content: "Candidate risk remains conditional on supplied facts and gaps.", provenance: { source: "provider_candidate", source_ref: "provider_inference" }, confidence: "unknown", evidence: "provider_inference" },
    ],
  };
}

function byLanguage(language: CanonicalOfflineEvaluationCase["language"]) {
  const found = CANONICAL_OFFLINE_EVALUATION_CASES.find((item) => item.language === language);
  if (!found) throw new Error(`Missing canonical ${language} case.`);
  return found;
}

export async function runCanonicalProviderEvaluationBoundaryValidation(): Promise<CanonicalProviderEvaluationValidationResult> {
  const cases: CanonicalProviderEvaluationValidationCase[] = [];
  const add = (caseId: string, passed: boolean, issue = "Validation failed.") => {
    cases.push({ caseId, passed, ...(passed ? {} : { issue }) });
  };

  for (const canonicalCase of (["en", "es", "ru", "zh"] as const).map(byLanguage)) {
    const compiledLocale = compileCanonicalProviderEvaluationInput(canonicalCase);
    add(`locale-${canonicalCase.language}-compiles`, compiledLocale.status === "ready" && compiledLocale.input.language === canonicalCase.language);
  }

  const source = CANONICAL_OFFLINE_EVALUATION_CASES.find((item) =>
    item.known_assumptions.length > 0 &&
    (item.critical_gaps.length > 0 || item.important_gaps.length > 0)
  );
  if (!source) throw new Error("Missing canonical preservation case.");
  const compiled = compileCanonicalProviderEvaluationInput(source);
  if (compiled.status !== "ready") throw new Error("Canonical preservation case did not compile.");
  const contents = (values: Array<{ content: string }>) => values.map((item) => item.content);
  add("facts-preserved", JSON.stringify(contents(compiled.input.input.known_facts)) === JSON.stringify(source.known_facts));
  add("assumptions-preserved", JSON.stringify(contents(compiled.input.input.known_assumptions)) === JSON.stringify(source.known_assumptions));
  add("critical-gaps-preserved", JSON.stringify(contents(compiled.input.input.critical_gaps)) === JSON.stringify(source.critical_gaps));
  add("important-gaps-preserved", JSON.stringify(contents(compiled.input.input.important_gaps)) === JSON.stringify(source.important_gaps));
  add("completeness-preserved", compiled.input.completeness_level === source.completeness_level);
  add("domain-preserved", compiled.input.domain === source.domain);
  add("intent-preserved", compiled.input.input.user_intent === source.user_intent);
  add("case-id-trace-only", compiled.input.trace.source_case_id === source.case_id && !Object.hasOwn(compiled.input.input, "case_id"));

  const built = buildCanonicalProviderEvaluationRequest(source);
  if (built.status !== "ready") throw new Error("Canonical provider request did not build.");
  add("oracle-keys-excluded", CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS.every((key) => !built.request.providerRequest.input.includes(`\"${key}\"`)));
  const changedOracle = structuredClone(source);
  changedOracle.expected_risk_behavior = ["oracle_value_must_not_reach_provider"];
  changedOracle.expected_scenario_behavior = ["second_oracle_value_must_not_reach_provider"];
  const changedBuilt = buildCanonicalProviderEvaluationRequest(changedOracle);
  add("oracle-values-cannot-influence-request", changedBuilt.status === "ready" && changedBuilt.request.providerRequest.input === built.request.providerRequest.input);
  add("production-provider-schema-reused", built.request.providerRequest.schemaName === "levio_candidate_decision_material_v1" && built.request.providerRequest.strict === true);
  add("production-provider-controls-reused", built.request.providerRequest.model === "gpt-5.6-terra" && built.request.providerRequest.store === false && built.request.providerRequest.tools.length === 0);
  add("evaluation-only-evidence", built.request.evidence.decisionContextBuilt === false && built.request.evidence.promptContextBuilt === false && built.request.evidence.productionRuntimeCalled === false);

  add("unknown-field-fails-closed", compileCanonicalProviderEvaluationInput({ ...source, unexpected_input: "forbidden" }).status === "blocked");
  add("unsupported-locale-fails-closed", compileCanonicalProviderEvaluationInput({ ...source, language: "de" }).status === "blocked");
  const missingLocale = structuredClone(source) as unknown as Record<string, unknown>;
  delete missingLocale.language;
  add("missing-locale-fails-closed", compileCanonicalProviderEvaluationInput(missingLocale).status === "blocked");
  add("malformed-case-fails-closed", compileCanonicalProviderEvaluationInput({ ...source, known_facts: "not-an-array" }).status === "blocked");
  const repeated = compileCanonicalProviderEvaluationInput(structuredClone(source));
  add("deterministic-compilation", repeated.status === "ready" && JSON.stringify(repeated.input) === JSON.stringify(compiled.input));

  let countCalls = 0;
  let generationCalls = 0;
  const offline = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { countCalls += 1; return 800; },
    async generate(request) {
      generationCalls += 1;
      return { status: "completed", outputText: JSON.stringify(fakeCandidate(request)), usage: { inputTokens: 800, outputTokens: 300, totalTokens: 1100 } };
    },
  });
  add("fake-transport-order-and-count", countCalls === 1 && generationCalls === 1);
  add("offline-candidate-evaluated", offline.status === "completed" && offline.quality.acceptedForEvaluation);
  add("existing-acceptance-boundary-used", offline.status === "completed" && offline.evidence.existingAcceptanceBoundaryUsed);
  add("oracle-read-after-result", offline.status === "completed" && offline.evidence.oracleReadAfterProviderResult && offline.oracle.expected_risk_behavior.length > 0);
  add("offline-network-operations-zero", offline.status === "completed" && offline.evidence.networkOperations === 0);

  const ungrounded = await runCanonicalProviderEvaluationOffline(source, {
    kind: "deterministic_fake_provider",
    async countInput() { return 800; },
    async generate(request) {
      const candidate = fakeCandidate(request);
      candidate.items[0].provenance.source_ref = "invented_ref";
      return { status: "completed", outputText: JSON.stringify(candidate), usage: { inputTokens: 800, outputTokens: 300, totalTokens: 1100 } };
    },
  });
  add("invented-reference-fails-closed", ungrounded.status === "blocked" && ungrounded.category === "candidate_grounding_invalid");

  return {
    version: "stage-9-canonical-provider-evaluation-boundary-validation.1",
    cases,
    passed: cases.every((item) => item.passed),
    networkOperations: 0,
  };
}
