import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
const originalTs = require.extensions[".ts"];
const originalFetch = globalThis.fetch;
const originalEnv = process.env;
const restores = [];
const attempts = { network: 0, credentials: 0, providerSdk: 0, databaseClient: 0 };
const blocked = (kind) => () => {
  attempts[kind]++;
  throw new Error(`Offline shadow evaluator forbids ${kind} access.`);
};
// Node otherwise copies every environment value when spawning Git.
const readGit = (args) => execFileSync("git", args, {
  cwd: root, encoding: "utf8", env: { PATH: originalEnv.PATH, LANG: "C" }, stdio: ["ignore", "pipe", "pipe"],
});
// Guard before importing any project module; never read a credential value.
const credentialKeys = /^(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|AI_GATEWAY_API_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY)$/;
process.env = new Proxy(originalEnv, {
  get(target, key) {
    if (typeof key === "string" && credentialKeys.test(key)) return blocked("credentials")();
    return Reflect.get(target, key);
  },
});
globalThis.fetch = blocked("network");
for (const [name, methods] of [
  ["node:http", ["request", "get"]], ["node:https", ["request", "get"]],
  ["node:net", ["connect", "createConnection"]], ["node:tls", ["connect"]],
]) {
  const networkModule = require(name);
  for (const method of methods) {
    const original = networkModule[method];
    networkModule[method] = blocked("network");
    restores.push(() => { networkModule[method] = original; });
  }
}
Module._load = function loadOffline(request, parent, isMain) {
  if (request === "server-only") return {};
  if (request === "openai" || request.includes("openai-synthetic-risk-adapter.server")) return blocked("providerSdk")();
  const loaded = originalLoad.call(this, request, parent, isMain);
  if (request === "@supabase/supabase-js") return { ...loaded, createClient: blocked("databaseClient") };
  return loaded;
};
require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: {
      esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(output.outputText, filename);
};

try {
  const evaluator = require(join(root, "lib/ai-quality/shadow-semantic-delta-evaluator.ts"));
  const validator = require(join(root, "lib/ai-quality/shadow-semantic-delta-validation.ts"));
  const report = await evaluator.runShadowSemanticDeltaEvaluation();
  const repeated = await evaluator.runShadowSemanticDeltaEvaluation();
  const validation = validator.runShadowSemanticDeltaValidation(report, repeated);
  const regressionEntries = [
    ["information-gap-foundation", "lib/decision-engine/information-gap-observations-validation.ts", "runInformationGapObservationsValidation"],
    ["deterministic-clarification-round-trip", "lib/decision-engine/deterministic-clarification-round-trip-validation.ts", "runDeterministicClarificationRoundTripValidation"],
    ["core-gap-completeness-clarification", "lib/decision-engine/runtime-validation.ts", "runDecisionEngineRuntimeValidation"],
    ["context-builder", "lib/decision-engine/context-builder-validation.ts", "runDecisionContextBuilderValidation"],
    ["canonical-prompt-bridge", "lib/ai-integration/decision-engine-prompt-context-bridge.validation.ts", "runDecisionEnginePromptContextBridgeValidation"],
    ["production-orchestrator-offline", "lib/ai-integration/production-decision-simulation-orchestrator.validation.ts", "runProductionDecisionSimulationOrchestratorValidation"],
    ["deterministic-simulation", "lib/decision-engine/simulation-pipeline-runner-validation.ts", "runSimulationPipelineRunnerValidation"],
    ["provider-adapter", "lib/ai-provider/openai-decision-material-adapter-validation.ts", "runStage9OpenAIDecisionMaterialAdapterValidation"],
    ["post-provider-boundary", "lib/decision-engine/post-provider-boundary-validation.ts", "runPostProviderDecisionEngineBoundaryValidation"],
    ["dependency-and-risk-composition", "lib/decision-engine/post-provider-simulation-composition-validation.ts", "runPostProviderSimulationCompositionValidation"],
    ["consequence-foundation", "lib/decision-engine/consequence-foundation-validation.ts", "runConsequenceFoundationValidation"],
    ["consequence-durability", "lib/persistence-runtime/consequence-durability-validation.ts", "runConsequenceDurabilityValidation"],
    ["saved-simulation-reopen", "lib/saved-decision-simulations/runtime-validation.ts", "runSavedDecisionSimulationsRuntimeValidation"],
    ["saved-simulation-surface", "lib/saved-decision-simulations/product-surface-validation.ts", "runSavedSimulationsProductSurfaceValidation"],
    ["supabase-provider-guards", "lib/persistence-runtime/supabase-provider-validation.ts", "runSupabasePersistenceProviderValidation"],
    ["public-adapter", "lib/decision-engine/simulation-response-public-adapter-validation.ts", "runSimulationResponsePublicAdapterValidation"],
    ["v2-ui-mapping", "lib/decision-engine/simulation-response-v2-ui-mapping-validation.ts", "runSimulationResponseV2UiMappingValidation"],
    ["persistence-projection", "lib/persistence-runtime/simulation-record-persistence-validation.ts", "runSimulationRecordPersistenceValidation"],
  ];
  const regressions = [];
  for (const [id, path, name] of regressionEntries) {
    const result = await require(join(root, path))[name]();
    regressions.push({ id, entryPoint: `${path}#${name}`, passed: result.passed,
      total: result.cases.length, passedCases: result.cases.filter((item) => item.passed).length,
      failures: result.cases.filter((item) => !item.passed) });
  }
  const read = (path) => readFileSync(join(root, path), "utf8");
  const allowed = new Set([
    "lib/decision-engine/information-gap-observations.ts", "lib/decision-engine/information-gap-observations-validation.ts",
    "lib/ai-quality/information-gap-shadow-fixtures.ts", "lib/ai-decision-material/acceptance.ts",
    "lib/ai-integration/decision-engine-prompt-context-bridge.ts", "lib/ai-integration/production-decision-simulation-orchestrator.ts",
    "lib/ai-provider/openai-decision-material-adapter.ts", "lib/decision-engine/post-provider-boundary.ts",
    "lib/decision-engine/post-provider-simulation-composition.ts",
    "lib/ai-quality/shadow-semantic-delta-evaluator.ts", "lib/ai-quality/shadow-semantic-delta-validation.ts",
    "scripts/controlled-ai-shadow-semantic-delta-quality.mjs",
  ]);
  const changed = [
    ...readGit(["diff", "--name-only", "HEAD"]).trim().split("\n"),
    ...readGit(["ls-files", "--others", "--exclude-standard"]).trim().split("\n"),
  ].filter(Boolean);
  const headPackage = JSON.parse(readGit(["show", "HEAD:package.json"]));
  const currentPackage = JSON.parse(read("package.json"));
  delete headPackage.scripts["quality:controlled-ai-shadow-semantic-delta"];
  delete currentPackage.scripts["quality:controlled-ai-shadow-semantic-delta"];
  const boundary = read("lib/decision-engine/post-provider-boundary.ts");
  const adapter = read("lib/ai-provider/openai-decision-material-adapter.ts");
  const home = read("components/HomeSimulator.tsx");
  const fixturePath = "lib/ai-quality/shadow-semantic-delta-fixtures.ts";
  const checkpointFixtures = new Module(join(root, fixturePath));
  checkpointFixtures.filename = join(root, fixturePath);
  checkpointFixtures.paths = Module._nodeModulePaths(dirname(checkpointFixtures.filename));
  checkpointFixtures._compile(ts.transpileModule(readGit(["show", `HEAD:${fixturePath}`]), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, checkpointFixtures.filename);
  const fixtures = require(join(root, fixturePath));
  const corpusInputs = (source) => source.createShadowSemanticDeltaCorpus().map(({ caseId, group, candidateType, packet }) =>
    ({ caseId, group, candidateType, packet }));
  const unchanged = (paths) => paths.every((path) => read(path) === readGit(["show", `HEAD:${path}`]));
  const providerDefinitions = (source) => {
    const ast = ts.createSourceFile("adapter.ts", source, ts.ScriptTarget.ES2022, true);
    const names = new Set(["providerContext", "CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA", "CANDIDATE_DECISION_MATERIAL_PROVIDER_INSTRUCTIONS",
      "OPENAI_DECISION_MATERIAL_MODEL", "OPENAI_DECISION_MATERIAL_LIMITS", "buildCandidateDecisionMaterialProviderRequest", "buildDecisionMaterialProviderRequest"]);
    return ast.statements.flatMap((node) => {
      if (ts.isFunctionDeclaration(node) && names.has(node.name?.text)) return [node.getText(ast)];
      if (ts.isVariableStatement(node)) return node.declarationList.declarations.filter((entry) => names.has(entry.name.getText(ast))).map((entry) => entry.getText(ast));
      return [];
    });
  };
  const invariants = [
    { id: "offline-guards-zero-attempts", passed: Object.values(attempts).every((count) => count === 0) },
    { id: "client-safe-consequence-present-field-guard", passed: !/\brequire\s*\(/.test(ts.transpileModule(
      read("lib/decision-engine/consequence-validation.ts"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText) },
    { id: "authorized-write-set-only", passed: changed.every((path) => allowed.has(path)), paths: changed },
    { id: "package-script-only-change", passed: evaluator.normalizedShadowJson(currentPackage) === evaluator.normalizedShadowJson(headPackage) },
    { id: "same-corpus-packets-and-canonical-input-as-checkpoint", passed:
      evaluator.normalizedShadowJson(corpusInputs(fixtures)) === evaluator.normalizedShadowJson(corpusInputs(checkpointFixtures.exports)) &&
      evaluator.normalizedShadowJson(fixtures.shadowCanonicalRequest()) === evaluator.normalizedShadowJson(checkpointFixtures.exports.shadowCanonicalRequest()) },
    { id: "home-rendering-scope-matches-current-component", passed:
      home.includes("productionResult.uiModel.sections.scenarios.items.map") &&
      !/productionResult\.uiModel\.sections\.(?:notices|risks|consequences|recommendation|traceability)/.test(home) },
    { id: "bounded-contradiction-destination-without-general-detector", passed: boundary.includes("contradictory_candidate_ids: []") &&
      report.cases.find((item) => item.limitation === "bounded_contradiction_destination")?.structuredContradictionIds.length === 1 &&
      report.cases.find((item) => item.limitation === "bounded_contradiction_destination")?.simulationDelta.substantive === true },
    { id: "consequence-durability-with-UI-DEFERRED", passed:
      report.consequencePersistence === "VALIDATED SNAPSHOT DURABILITY" &&
      ["short_term_consequence", "long_term_consequence"].every((type) => {
        const cases = report.cases.filter((item) => item.candidateType === type);
        return cases.some((item) => item.structuredConsequenceIds.length === 1 && item.simulationDelta.substantive) &&
          cases.every((item) => item.consequenceFoundation.uiMappingUnchanged === true &&
            item.consequenceFoundation.saveAuthorityUnchanged === true && item.consequenceFoundation.storedConsequencesPreserved === true &&
            !item.uiVisibility.homeRendered && item.saveRetention.materialRetained === Boolean(item.structuredConsequenceIds.length));
      }) && regressions.find((item) => item.id === "consequence-foundation")?.passed === true &&
        regressions.find((item) => item.id === "consequence-durability")?.passed === true },
    { id: "unknown-grounding-narrow-canonical-target-exception", passed:
      adapter.includes("use a concrete allowed gap reference when one exists") &&
      adapter.includes('item.evidence === "unknown" && item.provenance.source_ref !== "unknown"') &&
      report.cases.find((item) => item.limitation === "unknown_grounding_mismatch")?.packetFailure?.reason === "unknown_evidence_requires_unknown_source" &&
      report.informationGapCases.find((item) => item.caseId === "gap_unknown_grounded")?.informationGaps.observations.length === 1 &&
      report.informationGapCases.find((item) => item.caseId === "gap_clarification_grounded")?.informationGaps.observations.length === 1 },
    { id: "provider-payload-instructions-schema-model-limits-unchanged", passed:
      providerDefinitions(adapter).length === 7 && evaluator.normalizedShadowJson(providerDefinitions(adapter)) ===
        evaluator.normalizedShadowJson(providerDefinitions(readGit(["show", "HEAD:lib/ai-provider/openai-decision-material-adapter.ts"]))) },
    { id: "public-core-clarification-ui-persistence-platform-unchanged", passed: unchanged([
      "lib/decision-engine/types.ts", "lib/decision-engine/contracts.ts", "lib/decision-engine/gaps.ts",
      "lib/decision-engine/completeness.ts", "lib/decision-engine/clarification.ts", "lib/decision-engine/context-builder.ts",
      "lib/decision-engine/deterministic-clarification-round-trip.ts", "app/api/simulate/route.ts", "components/HomeSimulator.tsx",
      "lib/runtime-integration/public-simulation-api-v2-contracts.ts", "lib/ai-decision-material/contracts.ts",
      "lib/persistence-runtime/consequence-snapshot.ts", "lib/persistence-runtime/simulation-record-persistence.ts",
      "lib/persistence-runtime/supabase-provider.ts", "lib/saved-decision-simulations/runtime.ts", "vercel.json", "package.json",
    ]) },
    { id: "gap-lifecycle-authority-zero-deltas", passed: report.informationGapCases.every((item) =>
      item.informationGaps.questionsCreated === 0 && item.informationGaps.lifecycleTransitions === 0 &&
      (item.packetFailure || (item.clarificationLifecycleUnchanged && !item.recommendationDelta.changed &&
        !item.numericMetricDelta.changed && item.protectedInvariants.safetyPreserved))) },
  ];
  const passed = validation.passed && regressions.every((item) => item.passed) && invariants.every((item) => item.passed);
  const result = {
    passed, normalizedReportSha256: evaluator.shadowFingerprint(report),
    determinism: "two_sequential_runs_compared", validation, regressions, invariants, offlineGuardAttempts: attempts,
    ...(!process.argv.includes("--report") ? { summary: report.summary, matrix: report.matrix,
      informationGapMatrix: report.informationGapMatrix } : { report }),
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!passed) process.exitCode = 1;
} finally {
  Module._load = originalLoad;
  if (originalTs) require.extensions[".ts"] = originalTs;
  else delete require.extensions[".ts"];
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
  for (const restore of restores.reverse()) restore();
}
