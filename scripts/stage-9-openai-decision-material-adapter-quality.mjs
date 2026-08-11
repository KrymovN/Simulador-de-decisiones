import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
const adapter = read("lib", "ai-provider", "openai-decision-material-adapter.ts");
const validationSource = read("lib", "ai-provider", "openai-decision-material-adapter-validation.ts");
const acceptance = read("lib", "ai-decision-material", "acceptance.ts");
const providerIndex = read("lib", "ai-provider", "index.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during adapter validation.");
};
const validation = require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts"));
const result = await validation.runStage9OpenAIDecisionMaterialAdapterValidation();
globalThis.fetch = originalFetch;

const checks = result.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Adapter validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

const OPENAI_STRUCTURED_OUTPUT_KEYWORDS = new Set([
  "$defs",
  "$ref",
  "additionalProperties",
  "anyOf",
  "const",
  "description",
  "enum",
  "exclusiveMaximum",
  "exclusiveMinimum",
  "format",
  "items",
  "maxItems",
  "maxLength",
  "maximum",
  "minItems",
  "minLength",
  "minimum",
  "multipleOf",
  "pattern",
  "properties",
  "required",
  "type",
]);
const OPENAI_STRUCTURED_OUTPUT_TYPES = new Set([
  "array",
  "boolean",
  "integer",
  "null",
  "number",
  "object",
  "string",
]);
const OPENAI_STRUCTURED_OUTPUT_FORMATS = new Set([
  "date",
  "date-time",
  "duration",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "time",
  "uuid",
]);
const OPENAI_STRUCTURED_OUTPUT_LIMITS = {
  maxObjectProperties: 5000,
  maxNestingLevels: 10,
  maxTotalStringCharacters: 120000,
  maxEnumValues: 1000,
  maxLargeEnumStringCharacters: 15000,
  largeEnumThreshold: 250,
};

function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inspectActualProviderSchema(schema) {
  const keywordsFound = new Set();
  const unsupportedKeywords = new Set();
  const issues = [];
  const metrics = {
    objectProperties: 0,
    maxNestingLevels: 0,
    totalStringCharacters: 0,
    enumValues: 0,
    serializedCharacters: JSON.stringify(schema).length,
  };

  const issue = (path, message) => issues.push(`${path}: ${message}`);
  const visit = (node, path, level) => {
    if (!record(node)) {
      issue(path, "schema node must be an object");
      return;
    }

    metrics.maxNestingLevels = Math.max(metrics.maxNestingLevels, level);
    for (const keyword of Object.keys(node)) {
      keywordsFound.add(keyword);
      if (!OPENAI_STRUCTURED_OUTPUT_KEYWORDS.has(keyword)) unsupportedKeywords.add(keyword);
    }

    const declaredTypes = Array.isArray(node.type) ? node.type : [node.type];
    if (node.type !== undefined && (
      declaredTypes.length === 0 ||
      declaredTypes.some((type) => typeof type !== "string" || !OPENAI_STRUCTURED_OUTPUT_TYPES.has(type))
    )) {
      issue(path, `unsupported type declaration ${JSON.stringify(node.type)}`);
    }

    if (node.pattern !== undefined) {
      if (typeof node.pattern !== "string") issue(path, "pattern must be a string");
      else {
        try {
          new RegExp(node.pattern);
        } catch {
          issue(path, "pattern must be a valid regular expression");
        }
      }
    }
    if (node.format !== undefined && !OPENAI_STRUCTURED_OUTPUT_FORMATS.has(node.format)) {
      issue(path, `unsupported string format ${JSON.stringify(node.format)}`);
    }
    for (const keyword of ["minLength", "maxLength", "minItems", "maxItems"]) {
      if (node[keyword] !== undefined && (!Number.isInteger(node[keyword]) || node[keyword] < 0)) {
        issue(path, `${keyword} must be a non-negative integer`);
      }
    }
    if (Number.isInteger(node.minLength) && Number.isInteger(node.maxLength) && node.minLength > node.maxLength) {
      issue(path, "minLength must not exceed maxLength");
    }
    if (Number.isInteger(node.minItems) && Number.isInteger(node.maxItems) && node.minItems > node.maxItems) {
      issue(path, "minItems must not exceed maxItems");
    }
    for (const keyword of ["multipleOf", "maximum", "exclusiveMaximum", "minimum", "exclusiveMinimum"]) {
      if (node[keyword] !== undefined && typeof node[keyword] !== "number") {
        issue(path, `${keyword} must be numeric`);
      }
    }

    if (node.enum !== undefined) {
      if (!Array.isArray(node.enum) || node.enum.length === 0) {
        issue(path, "enum must be a non-empty array");
      } else {
        metrics.enumValues += node.enum.length;
        const stringCharacters = node.enum.reduce(
          (total, value) => total + (typeof value === "string" ? value.length : 0),
          0,
        );
        metrics.totalStringCharacters += stringCharacters;
        if (
          node.enum.length > OPENAI_STRUCTURED_OUTPUT_LIMITS.largeEnumThreshold &&
          stringCharacters > OPENAI_STRUCTURED_OUTPUT_LIMITS.maxLargeEnumStringCharacters
        ) {
          issue(path, "large enum exceeds the supported total string-character limit");
        }
      }
    }
    if (typeof node.const === "string") metrics.totalStringCharacters += node.const.length;

    const isObject = declaredTypes.includes("object");
    if (isObject) {
      if (!record(node.properties)) issue(path, "object schemas require properties");
      if (node.additionalProperties !== false) issue(path, "object schemas require additionalProperties:false");
      if (!Array.isArray(node.required)) issue(path, "object schemas require required");
      if (record(node.properties)) {
        const propertyNames = Object.keys(node.properties);
        metrics.objectProperties += propertyNames.length;
        metrics.totalStringCharacters += propertyNames.reduce((total, name) => total + name.length, 0);
        const required = Array.isArray(node.required) ? node.required : [];
        const requiredSet = new Set(required);
        if (
          required.length !== propertyNames.length ||
          requiredSet.size !== required.length ||
          propertyNames.some((name) => !requiredSet.has(name))
        ) {
          issue(path, "required must contain every property exactly once");
        }
        for (const [name, child] of Object.entries(node.properties)) {
          visit(child, `${path}.properties.${name}`, level + 1);
        }
      }
    }

    if (declaredTypes.includes("array")) {
      if (!record(node.items)) issue(path, "array schemas require one object-valued items schema");
      else visit(node.items, `${path}.items`, level + 1);
    }
    if (node.anyOf !== undefined) {
      if (!Array.isArray(node.anyOf) || node.anyOf.length === 0) issue(path, "anyOf must contain schemas");
      else node.anyOf.forEach((child, index) => visit(child, `${path}.anyOf[${index}]`, level + 1));
    }
    if (node.$defs !== undefined) {
      if (!record(node.$defs)) issue(path, "$defs must be an object");
      else {
        metrics.totalStringCharacters += Object.keys(node.$defs).reduce((total, name) => total + name.length, 0);
        for (const [name, child] of Object.entries(node.$defs)) {
          visit(child, `${path}.$defs.${name}`, level + 1);
        }
      }
    }
    if (node.$ref !== undefined && (
      typeof node.$ref !== "string" ||
      (node.$ref !== "#" && !node.$ref.startsWith("#/$defs/"))
    )) {
      issue(path, "$ref must be a local root or $defs reference");
    }
  };

  visit(schema, "$", 1);
  if (!record(schema) || schema.type !== "object") issue("$", "root schema must be an object");
  if (record(schema) && Object.hasOwn(schema, "anyOf")) issue("$", "root schema must not use anyOf");
  if (metrics.objectProperties > OPENAI_STRUCTURED_OUTPUT_LIMITS.maxObjectProperties) {
    issue("$", "object-property count exceeds the supported limit");
  }
  if (metrics.maxNestingLevels > OPENAI_STRUCTURED_OUTPUT_LIMITS.maxNestingLevels) {
    issue("$", "nesting depth exceeds the supported limit");
  }
  if (metrics.totalStringCharacters > OPENAI_STRUCTURED_OUTPUT_LIMITS.maxTotalStringCharacters) {
    issue("$", "property/definition/enum/const strings exceed the supported limit");
  }
  if (metrics.enumValues > OPENAI_STRUCTURED_OUTPUT_LIMITS.maxEnumValues) {
    issue("$", "enum-value count exceeds the supported limit");
  }
  if (unsupportedKeywords.size > 0) {
    issue("$", `unsupported keywords: ${[...unsupportedKeywords].sort().join(", ")}`);
  }

  return {
    compatible: issues.length === 0,
    keywordsFound: [...keywordsFound].sort(),
    unsupportedKeywords: [...unsupportedKeywords].sort(),
    issues,
    metrics,
  };
}

const productionAdapter = require(join(root, "lib", "ai-provider", "openai-decision-material-adapter.ts"));
const actualProductionRequest = productionAdapter.buildDecisionMaterialProviderRequest(
  validation.validProductionPromptContext(),
);
const schemaCompatibility = inspectActualProviderSchema(actualProductionRequest.schema);
add(
  "actual-provider-schema-supported-subset",
  schemaCompatibility.compatible,
  schemaCompatibility.issues.join("; ") || "Actual production provider schema matches the supported Structured Outputs subset.",
);
add(
  "actual-provider-schema-root-restrictions",
  actualProductionRequest.schema.type === "object" && !Object.hasOwn(actualProductionRequest.schema, "anyOf"),
  "Actual provider schema must have an object root without root anyOf.",
);
add(
  "actual-provider-schema-required-and-closed-objects",
  !schemaCompatibility.issues.some((value) => value.includes("required") || value.includes("additionalProperties")),
  "Every actual provider object must require all declared fields and set additionalProperties:false.",
);
add(
  "actual-provider-schema-size-and-nesting-limits",
  schemaCompatibility.metrics.objectProperties <= OPENAI_STRUCTURED_OUTPUT_LIMITS.maxObjectProperties &&
    schemaCompatibility.metrics.maxNestingLevels <= OPENAI_STRUCTURED_OUTPUT_LIMITS.maxNestingLevels &&
    schemaCompatibility.metrics.totalStringCharacters <= OPENAI_STRUCTURED_OUTPUT_LIMITS.maxTotalStringCharacters &&
    schemaCompatibility.metrics.enumValues <= OPENAI_STRUCTURED_OUTPUT_LIMITS.maxEnumValues,
  "Actual provider schema must remain within published property, nesting, string, and enum limits.",
);

const providerRegression = require(join(root, "lib", "ai-provider", "runtime-qa-regression.ts")).runAIProviderStage51Regression();
const promptRegression = require(join(root, "lib", "prompt-context", "runtime-qa-regression.ts")).runPromptContextStage52Regression();
const bridgeRegression = require(join(root, "lib", "ai-integration", "decision-engine-prompt-context-bridge.validation.ts")).runDecisionEnginePromptContextBridgeValidation();
const postProviderRegression = require(join(root, "lib", "decision-engine", "post-provider-boundary-validation.ts")).runPostProviderDecisionEngineBoundaryValidation();
add("existing-provider-abstraction-pass", providerRegression.passed && !providerRegression.failed, "Existing provider abstraction must remain valid.");
add("existing-prompt-context-pass", promptRegression.passed && !promptRegression.failed, "Existing Prompt Context contracts/runtime/boundary must remain valid.");
add("existing-decision-prompt-bridge-pass", bridgeRegression.passed && !bridgeRegression.failed, "Existing Decision Engine to Prompt Context bridge must remain valid.");
add("existing-post-provider-decision-engine-pass", postProviderRegression.passed && !postProviderRegression.failed, "Post-provider Decision Engine authority must remain valid.");

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowedWriteSet = new Set([
  "lib/ai-decision-material/acceptance.ts",
  "lib/ai-provider/openai-decision-material-adapter.ts",
  "lib/ai-provider/openai-decision-material-adapter-validation.ts",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts",
  "lib/ai-quality/canonical-provider-evaluation-result.ts",
  "lib/ai-quality/canonical-provider-evaluation.ts",
  "lib/ai-quality/canonical-provider-evaluation-validation.ts",
  "scripts/stage-9-canonical-provider-evaluation-boundary-quality.mjs",
  "scripts/stage-9-openai-decision-material-adapter-quality.mjs",
  "scripts/stage-9-openai-synthetic-risk-adapter-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "openai-decision-material-adapter", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

add("server-only-boundary", adapter.startsWith('import "server-only";'), "Production-oriented adapter must be server-only.");
add("canonical-prompt-context-used", adapter.includes('from "../prompt-context/validation"') && adapter.includes("validateOutput(input)"), "Adapter must validate the existing Prompt Context output contract.");
add("existing-provider-abstraction-used", adapter.includes("createAIProviderAdapter") && adapter.includes("createAIProviderRuntimeSelection") && adapter.includes("createAIProviderBoundary"), "Adapter must pass through the existing provider abstraction.");
add("canonical-material-contract-used", adapter.includes('from "../ai-decision-material/contracts"') && adapter.includes("candidateDecisionMaterialHasValidContract"), "Adapter must use candidate_decision_material_v1 and its canonical validator.");
add("strict-output-schema", adapter.includes('schemaName: "levio_candidate_decision_material_v1"') && adapter.includes("additionalProperties: false") && adapter.includes("strict: true"), "Provider request must require strict Structured Outputs.");
add("provider-schema-compatible-array-keywords", !adapter.includes("uniqueItems") && validationSource.includes("provider-schema-excludes-unsupported-unique-items"), "Provider-facing Structured Outputs schema must exclude unsupported uniqueItems keywords.");
add("local-reference-uniqueness-preserved", acceptance.includes("new Set(value).size === value.length") && validationSource.includes("duplicate-option-references-rejected-locally"), "Duplicate option references must remain locally rejected after provider schema compatibility normalization.");
add("fixed-provider-model", adapter.includes('OPENAI_DECISION_MATERIAL_PROVIDER = "openai"') && adapter.includes('OPENAI_DECISION_MATERIAL_MODEL = "gpt-5.6-terra"'), "Provider and model must be internal fixed configuration.");
add("no-client-runtime-override", adapter.includes("hasForbiddenRuntimeField") && validationSource.includes("client-provider-model-key-rejected"), "Client provider/model/key controls must fail closed.");
add("controlled-schema-safety-grounding", adapter.includes("provider_schema_invalid") && adapter.includes("provider_safety_invalid") && adapter.includes("provider_grounding_invalid"), "Provider output must pass schema, safety, and reference grounding validation.");
add("bounded-cost-and-operations", adapter.includes("maxProviderRequests: 2") && adapter.includes("maxCostUsd: 0.05") && adapter.includes("calculateDecisionMaterialCost"), "Cost and provider-operation budgets must be explicit.");
add("cache-aware-cost-evidence", adapter.includes("cachedInputUsdPerMillion: 0.2") && adapter.includes("conservativeUncachedCostUsd") && adapter.includes("cacheAdjustedCalculatedCostUsd") && validationSource.includes("cached-token-cost-evidence-separated"), "Completed usage must preserve cached tokens and separate conservative from cache-adjusted calculated cost.");
add("no-new-credential-egress-executor", !adapter.includes("process.env") && !adapter.includes('from "openai"') && !adapter.includes("fetch("), "This substep must not add credential reads, SDK execution, or direct egress.");
add("transport-seam-only", adapter.includes("DecisionMaterialTransport") && adapter.includes("config.transport.countInput") && adapter.includes("config.transport.generate"), "Provider operations must remain behind the injected server-only transport seam.");
add("no-barrel-export", !providerIndex.includes("openai-decision-material-adapter"), "Live-capable adapter code must not be exported through the shared provider barrel.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "App and component code must not import the adapter.");
add("public-api-still-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public /api/simulate must remain mock-only and provider-free.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
add("no-persistence-or-post-provider-composition", !adapter.includes("persistence-runtime") && !adapter.includes("supabase") && !adapter.includes("acceptCandidateDecisionMaterial("), "Adapter must not persist or perform post-provider Decision Engine composition.");
add("canonical-contract-validator-added", acceptance.includes("candidateDecisionMaterialHasValidContract") && acceptance.includes("inspectCandidateDecisionMaterialContract"), "Canonical material must expose strict contract/safety inspection without composition.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-openai-decision-material-adapter"'), "Dedicated quality gate must be registered.");
add("external-network-zero", externalNetworkRequests === 0 && result.summary.networkRequests === 0, "Offline validation must execute zero external network requests.");
add("exact-bounded-write-set", unexpected.length === 0, `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
console.log(`SCHEMA KEYWORDS ${schemaCompatibility.keywordsFound.join(",")}`);
console.log(`SCHEMA UNSUPPORTED ${schemaCompatibility.unsupportedKeywords.join(",") || "NONE"}`);
console.log(`SCHEMA PROPERTIES ${schemaCompatibility.metrics.objectProperties}/${OPENAI_STRUCTURED_OUTPUT_LIMITS.maxObjectProperties}`);
console.log(`SCHEMA NESTING ${schemaCompatibility.metrics.maxNestingLevels}/${OPENAI_STRUCTURED_OUTPUT_LIMITS.maxNestingLevels}`);
console.log(`SCHEMA STRING CHARACTERS ${schemaCompatibility.metrics.totalStringCharacters}/${OPENAI_STRUCTURED_OUTPUT_LIMITS.maxTotalStringCharacters}`);
console.log(`SCHEMA ENUM VALUES ${schemaCompatibility.metrics.enumValues}/${OPENAI_STRUCTURED_OUTPUT_LIMITS.maxEnumValues}`);
console.log(`SCHEMA SERIALIZED CHARACTERS ${schemaCompatibility.metrics.serializedCharacters}`);
const positive = result.cases.filter((item) => item.kind === "positive");
const negative = result.cases.filter((item) => item.kind === "negative");
console.log(`POSITIVE ${positive.filter((item) => item.passed).length}/${positive.length} PASS`);
console.log(`NEGATIVE ${negative.filter((item) => item.passed).length}/${negative.length} PASS`);
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
