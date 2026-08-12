import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const inputSource = read("lib", "ai-decision-material", "canonical-provider-evaluation-input.ts");
const boundarySource = read("lib", "ai-quality", "canonical-provider-evaluation.ts");
const validationSource = read("lib", "ai-quality", "canonical-provider-evaluation-validation.ts");
const taxonomySource = read("lib", "ai-quality", "canonical-provider-evaluation-taxonomy.ts");
const resultSource = read("lib", "ai-quality", "canonical-provider-evaluation-result.ts");
const adapterSource = read("lib", "ai-provider", "openai-decision-material-adapter.ts");
const routeSource = read("app", "api", "simulate", "route.ts");

function filesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...filesUnder(path));
    else if (/\.(?:ts|tsx)$/.test(entry)) files.push(path);
  }
  return files;
}

const checks = [];
const add = (id, passed, detail = "Check failed.") => checks.push({ id, passed: Boolean(passed), detail });

let networkOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkOperations += 1;
  throw new Error("Network access is forbidden in the canonical provider evaluation boundary gate.");
};
const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const evaluation = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation.ts"));
const evaluationResult = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-result.ts"));
const evaluationTaxonomy = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-taxonomy.ts"));
const validation = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-validation.ts"));
const result = await validation.runCanonicalProviderEvaluationBoundaryValidation();
globalThis.fetch = originalFetch;

for (const item of result.cases) add(`validation-${item.caseId}`, item.passed, item.issue);
add("validation-suite-pass", result.passed, "Evaluation boundary validation suite must pass.");
add("network-operations-zero", networkOperations === 0 && result.networkOperations === 0, `${networkOperations} network operations observed.`);
add("frozen-core-size-unchanged", fixtures.CANONICAL_OFFLINE_EVALUATION_CASES.length === 160, "Frozen canonical core must remain 160 cases.");
add("all-frozen-cases-compile", fixtures.CANONICAL_OFFLINE_EVALUATION_CASES.every((item) => evaluation.buildCanonicalProviderEvaluationRequest(item).status === "ready"), "Every frozen core case must compile without production semantics.");
add("server-only-boundary", [inputSource, boundarySource, taxonomySource, resultSource].every((source) => source.startsWith('import "server-only";')), "Evaluation contracts and boundary must be server-only.");
add("no-decision-context-or-prompt-context", !/DecisionContext|PromptContext|decision-context|prompt-context/.test(inputSource + boundarySource), "Evaluation boundary must not create production DecisionContext or PromptContext.");
add("no-openai-sdk-or-env", !/from\s+["']openai["']|OPENAI_API_KEY|process\.env|createOpenAIDecisionMaterialTransport/.test(inputSource + boundarySource + validationSource + taxonomySource + resultSource), "Evaluation boundary must not access SDK, credentials, env, or live transport.");
add("shared-provider-controls-production-schema-isolated", boundarySource.includes("buildCandidateDecisionMaterialProviderRequest") && resultSource.includes("CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA") && resultSource.includes("levio_canonical_provider_evaluation_result_v1") && adapterSource.includes("levio_candidate_decision_material_v1"), "Evaluation result must reuse provider controls and embed, not change, the production candidate schema.");
add("oracle-exclusion-explicit", inputSource.includes("CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS") && boundarySource.includes("requestContainsOracle"), "Oracle exclusion must be explicit and executable.");
add("global-taxonomy-derived-from-frozen-core", taxonomySource.includes("CANONICAL_OFFLINE_EVALUATION_CASES.flatMap") && inputSource.includes("CANONICAL_PROVIDER_EVALUATION_TAXONOMY_REGISTRY"), "Global taxonomy must be deterministic and derived from the frozen core.");
add("exact-id-matcher-no-free-text-judge", resultSource.includes("matchCanonicalProviderEvaluationOracle") && !/embedding|fuzzy|semanticSimilarity|judgeModel/i.test(resultSource), "Matcher must compare canonical IDs without network or fuzzy model judging.");
const schemaText = JSON.stringify(evaluationResult.CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA);
const forbiddenSchemaKeywords = ["uniqueItems", "allOf", "not", "dependentRequired", "dependentSchemas", "if", "then", "else"];
add("evaluation-result-schema-provider-compatible-keywords", forbiddenSchemaKeywords.every((keyword) => !schemaText.includes(`\"${keyword}\"`)), "Evaluation-only provider schema must exclude unsupported Structured Outputs keywords.");
add("annotation-uniqueness-described-without-unsupported-keyword", schemaText.includes("Each concept_id may appear at most once") && schemaText.includes("no duplicate value is allowed") && !schemaText.includes('"uniqueItems"'), "Provider-facing schema must explain uniqueness without unsupported uniqueItems.");
add("annotation-runtime-rules-provider-facing", evaluation.CANONICAL_PROVIDER_ANNOTATION_RULES.length === 12 && evaluation.CANONICAL_PROVIDER_ANNOTATION_RULES.every((rule) => evaluation.CANONICAL_PROVIDER_EVALUATION_INSTRUCTIONS.includes(rule)), "Every annotation post-response invariant must be explicit in provider-facing instructions.");
add("annotation-invalid-diagnostics-bounded", resultSource.includes("CANONICAL_PROVIDER_ANNOTATION_INVALID_REASONS") && resultSource.includes("actualCandidateItemTypes") && !resultSource.includes("rawOutput") && !resultSource.includes("reasoningText"), "Annotation failures must expose bounded machine-readable metadata without raw output or reasoning.");
add("effective-grounding-contract-single-source", resultSource.includes("CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS") && resultSource.includes("CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS") && boundarySource.includes("CANONICAL_PROVIDER_EFFECTIVE_CONTRACT_INSTRUCTIONS") && boundarySource.includes("inspectCanonicalProviderCandidateGrounding"), "Provider instructions and candidate grounding diagnostics must share evaluation-only invariant definitions.");
add("pre-matcher-field-diagnostics-bounded", resultSource.includes("CANONICAL_PROVIDER_PRE_MATCHER_DIAGNOSTIC_MAX_ISSUES = 8") && resultSource.includes("candidate_content_whitespace_only") && resultSource.includes("annotation_source_ref_not_in_selected_candidate_provenance") && !resultSource.includes("receivedContent"), "Pre-matcher diagnostics must be field-level, bounded, and content-free.");
add("evaluation-reference-arrays-schema-empty", (schemaText.match(/\"maxItems\":0/g) ?? []).length >= 3, "Evaluation-only candidate reference arrays must be schema-bounded to empty.");
add("production-candidate-schema-unchanged-by-evaluation", !JSON.stringify(require(join(root, "lib", "ai-provider", "openai-decision-material-adapter.ts")).CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA).includes('"maxItems":0'), "Evaluation-only schema restrictions must not mutate the production candidate schema.");
add("evaluation-specific-output-budget", evaluation.CANONICAL_PROVIDER_EVALUATION_LIMITS.maxOutputTokens === 4000 && evaluation.CANONICAL_PROVIDER_EVALUATION_LIMITS.maxCostUsd === 0.16, "Evaluation-only output and conservative cost ceilings must be 4000 tokens and $0.16.");
add("evaluation-candidate-sol-production-terra", evaluation.CANONICAL_PROVIDER_EVALUATION_CANDIDATE.model === "gpt-5.6-sol" && require(join(root, "lib", "ai-provider", "openai-decision-material-adapter.ts")).OPENAI_DECISION_MATERIAL_MODEL === "gpt-5.6-terra", "Evaluation must select Sol without changing the production Terra model.");
add("evaluation-sol-pricing", evaluation.CANONICAL_PROVIDER_EVALUATION_CANDIDATE.inputUsdPerMillion === 5 && evaluation.CANONICAL_PROVIDER_EVALUATION_CANDIDATE.cachedInputUsdPerMillion === 0.5 && evaluation.CANONICAL_PROVIDER_EVALUATION_CANDIDATE.outputUsdPerMillion === 30, "Evaluation-only Sol pricing must remain $5/$0.50/$30 per million tokens.");
add("evaluation-result-schema-object-root", evaluationResult.CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA.type === "object" && !Object.hasOwn(evaluationResult.CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA, "anyOf"), "Evaluation result schema must retain an object root.");
add("fake-only-transport", boundarySource.includes('kind: "deterministic_fake_provider"') && !boundarySource.includes("DecisionMaterialTransportFailure"), "Current execution boundary must accept only the bounded fake transport contract.");
add("public-route-remains-mock-only", routeSource.includes("mockOnly: true") && !routeSource.toLowerCase().includes("openai"), "Public API must remain mock-only and OpenAI-free.");

const publicSources = [
  ...filesUnder(join(root, "app")),
  ...filesUnder(join(root, "components")),
  ...filesUnder(join(root, "lib", "runtime-integration")),
  ...filesUnder(join(root, "lib", "ai-integration")),
];
const leakedImports = publicSources.filter((path) => {
  const source = readFileSync(path, "utf8");
  return source.includes("canonical-provider-evaluation") || source.includes("canonical-provider-evaluation-input");
}).map((path) => relative(root, path));
add("no-production-or-public-callsite", leakedImports.length === 0, `Unexpected callsites: ${leakedImports.join(", ")}`);

const failed = checks.filter((item) => !item.passed);
const report = {
  gate: "quality:stage-9-canonical-provider-evaluation-boundary",
  passed: failed.length === 0,
  passed_checks: checks.length - failed.length,
  total_checks: checks.length,
  network_operations: networkOperations,
  frozen_core_cases: fixtures.CANONICAL_OFFLINE_EVALUATION_CASES.length,
  taxonomy_counts: Object.fromEntries(Object.entries(
    evaluationTaxonomy.CANONICAL_PROVIDER_EVALUATION_TAXONOMY,
  ).map(([category, concepts]) => [category, concepts.length])),
  failed,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exit(1);
