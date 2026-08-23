import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const originalLoad = Module._load;

Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};

require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
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

const presentation = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-human-review-presentation.ts",
));
const humanReview = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-provider-human-review-evidence.ts",
));
Module._load = originalLoad;

const live = join(root, "docs", "qa", "stage-9", "live-evidence");
const blindName = "STAGE_9_TERRA_POSITION_3_BLIND_REVIEW_PACKET.v1.json";
const artifactName = "STAGE_9_TERRA_POSITION_3_HUMAN_REVIEW_PRESENTATION.v1.json";
const blindJson = readFileSync(join(live, blindName), "utf8");
const blindPacket = JSON.parse(blindJson);
const rebuilt = presentation.buildCanonicalHumanReviewPresentationV1(blindJson);

if (process.argv.includes("--emit-artifact")) {
  process.stdout.write(`${JSON.stringify(rebuilt, null, 2)}\n`);
  process.exit(0);
}

const persisted = JSON.parse(readFileSync(join(live, artifactName), "utf8"));
const position3Evidence = JSON.parse(readFileSync(
  join(live, "STAGE_9_TERRA_POSITION_3_EVIDENCE.v2.json"),
  "utf8",
));
const position3ReviewRecordCount = [
  position3Evidence.reviewRecords.humanDimensionReviews,
  position3Evidence.reviewRecords.providerPrivacyReviews,
  position3Evidence.reviewRecords.multilingualClusterReviews,
  position3Evidence.reviewRecords.campaignRequirementReviews,
].reduce((count, records) => count + records.length, 0);
const checks = [];
const add = (id, passed, detail = "") =>
  checks.push({ id, passed: Boolean(passed), detail: passed ? "" : detail || "Check failed." });
const visible = persisted.reviewerVisible.content;
const candidateItems = blindPacket.validatedResult.candidate_material.items;
const occurrences = (source, target) => source.split(target).length - 1;

add("persisted-presentation-is-exact-deterministic-build",
  JSON.stringify(persisted) === JSON.stringify(rebuilt) &&
  JSON.stringify(rebuilt) === JSON.stringify(
    presentation.buildCanonicalHumanReviewPresentationV1(blindJson),
  ));
add("presentation-validates-against-source-packet",
  presentation.validateCanonicalHumanReviewPresentationV1(persisted, blindJson).valid);
add("all-candidate-content-is-verbatim-exactly-once",
  candidateItems.every((item) => occurrences(visible, item.content) === 1));
let previousIndex = -1;
add("candidate-item-order-is-preserved", candidateItems.every((item) => {
  const index = visible.indexOf(item.content);
  const ordered = index > previousIndex;
  previousIndex = index;
  return ordered;
}));
add("reviewer-visible-content-excludes-technical-identifiers",
  candidateItems.every((item) =>
    !visible.includes(item.candidate_id) && !visible.includes(item.item_type)) &&
  ![
    "evaluation_annotations",
    "candidate_material",
    "source_ref",
    "concept_id",
    "oracleIncluded",
    "matcherIncluded",
  ].some((identifier) => visible.includes(identifier)));
add("reviewer-visible-content-excludes-hidden-results-and-steering",
  !/(?:hidden oracle|matcher|expected verdict|automated PASS|automated FAIL|campaign threshold|Position 4)/i.test(
    visible,
  ));
add("source-blind-packet-physical-hash-linked",
  rebuilt.source.sourceBlindPacketSha256 ===
    createHash("sha256").update(blindJson).digest("hex") &&
  rebuilt.source.sourceBlindPacketSha256 ===
    "38d8caee2e1d452ce8a0c9d6680404ded6aa85519131b5a76d2d4cc53ab67061");
add("execution-and-case-identity-linked",
  rebuilt.source.reviewedExecutionHash ===
    "f843ae060ab89fe944996ab34e116b2118f96e72f56b348950203953be491e88" &&
  rebuilt.source.caseId === "S9-CORE-001-RU" && rebuilt.source.locale === "ru" &&
  rebuilt.source.semanticClusterId === "S9-CLUSTER-001");
add("visible-content-change-changes-presentation-hash",
  presentation.canonicalHumanReviewPresentationSha256(`${visible}\nизменение`) !==
    rebuilt.presentationSha256);
add("ru-binary-semantics-remain-exact",
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", "ДА") === "AFFIRMATIVE" &&
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", "НЕТ") === "NEGATIVE" &&
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", "Да") === null &&
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", "PARTLY") === null);
add("existing-es-en-semantics-remain-exact",
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("es", "SÍ") === "AFFIRMATIVE" &&
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("es", "NO") === "NEGATIVE" &&
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("en", "YES") === "AFFIRMATIVE" &&
  humanReview.normalizeCanonicalLocalizedHumanBinaryAnswer("en", "NO") === "NEGATIVE");
add("no-real-position3-review-record-created",
  position3ReviewRecordCount === 0);
add("position3-remains-review-required-and-position4-blocked",
  position3Evidence.executions[0].automatedEvidence.hardGates
    .critical_provider_privacy_violation === "REVIEW_PENDING");

for (const [id, mutate] of [
  ["identity-missing", (value) => { delete value.caseId; }],
  ["candidate-material-missing", (value) => { value.validatedResult.candidate_material = null; }],
  ["oracle-flag-exposed", (value) => { value.oracleIncluded = true; }],
  ["unsupported-item-mapping", (value) => {
    value.validatedResult.candidate_material.items[0].item_type = "unsupported_type";
  }],
]) {
  const invalid = structuredClone(blindPacket);
  mutate(invalid);
  let rejected = false;
  try {
    presentation.buildCanonicalHumanReviewPresentationV1(JSON.stringify(invalid));
  } catch {
    rejected = true;
  }
  add(`fail-closed-${id}`, rejected);
}

const executableImports = readFileSync(fileURLToPath(import.meta.url), "utf8")
  .split("\n").filter((line) => line.startsWith("import ") || line.includes("require("));
add("no-provider-or-network-operations",
  !executableImports.some((line) =>
    line.toLowerCase().includes("openai") || line.includes("node:http") ||
    line.includes("node:https")));

const failed = checks.filter((check) => !check.passed);
process.stdout.write(`${JSON.stringify({
  gate: "stage-9-human-review-presentation",
  status: failed.length === 0 ? "PASS" : "FAIL",
  providerOperations: 0,
  sourceBlindPacketSha256: rebuilt.source.sourceBlindPacketSha256,
  presentationSha256: rebuilt.presentationSha256,
  position3: {
    status: "REVIEW_REQUIRED",
    realReviewRecordCount: position3ReviewRecordCount,
    persistedHumanDimensionReviewCount:
      position3Evidence.reviewRecords.humanDimensionReviews.length,
    persistedPrivacyReviewCount: position3Evidence.reviewRecords.providerPrivacyReviews.length,
    nextPosition: 4,
    nextContinuationGate: "BLOCKED / REVIEW REQUIRED",
  },
  checks,
}, null, 2)}\n`);
if (failed.length > 0) process.exitCode = 1;
