import { createRequire } from "node:module";
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
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const readProjectFile = (...segments) =>
  readFileSync(join(rootDir, ...segments), "utf8");
const checks = [];

function assertCheck(caseId, condition, issue) {
  checks.push({ caseId, passed: Boolean(condition), issue });
}

const exportSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-export-surface.ts",
);
const exportRoute = readProjectFile(
  "app",
  "dashboard",
  "privacy",
  "export",
  "route.ts",
);
const persistenceProvider = readProjectFile(
  "lib",
  "persistence-runtime",
  "supabase-provider.ts",
);
const privacyPanel = readProjectFile("components", "PrivacyPanel.tsx");
const packageJson = readProjectFile("package.json");

assertCheck(
  "account-export-has-product-facing-version",
  exportSurface.includes('"levio-account-data-export.1"') &&
    exportSurface.includes('format: "levio-account-data-export-json"'),
  "Account export must expose a stable product-facing version and JSON format.",
);

assertCheck(
  "saved-simulations-use-canonical-persisted-export-source",
  exportSurface.includes("listExportEligibleSimulationRecords") &&
    exportSurface.includes("mapSimulationRecordToDecisionSimulation") &&
    exportSurface.includes("mapDecisionSimulationToAccountExport") &&
    !exportSurface.includes("readSavedSimulationsHistorySurface"),
  "Saved simulations must use canonical persisted rows rather than the dashboard card projection.",
);

assertCheck(
  "saved-simulation-export-includes-complete-input-and-result",
  exportSurface.includes("userInputSnapshot:") &&
    exportSurface.includes("clarificationAnswers:") &&
    exportSurface.includes("decisionContext:") &&
    exportSurface.includes("deterministicOutputSnapshot") &&
    exportSurface.includes("generatedScenarios:") &&
    exportSurface.includes("confidenceSummary:") &&
    exportSurface.includes("parentSimulationId:") &&
    exportSurface.includes("resultFormatVersion:"),
  "Saved export must include the eligible persisted input, result, relationship, and version content.",
);

assertCheck(
  "saved-simulation-export-query-is-owner-scoped-and-eligible",
  persistenceProvider.includes("async listExportEligibleSimulationRecords(input)") &&
    persistenceProvider.includes('.from("simulation_records")') &&
    persistenceProvider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    persistenceProvider.includes('.eq("owner_principal_type", "registered_user")') &&
    persistenceProvider.includes('.in("record_status", ["active", "archived"])') &&
    persistenceProvider.includes('.eq("deletion_state", "active")') &&
    persistenceProvider.includes('.eq("export_eligible", true)'),
  "Persistence must select only eligible active/archived saved simulations for the resolved owner.",
);

assertCheck(
  "draft-and-history-export-remain-owner-scoped",
  exportSurface.includes('operation: "list_simulation_drafts"') &&
    exportSurface.includes('operation: "list_simulation_history"') &&
    exportSurface.includes("row.owner_principal_id !== preflight.principalId") &&
    exportSurface.includes("row.user_visible !== true") &&
    exportSurface.includes("row.export_eligible !== true") &&
    exportSurface.includes("row.deletion_state !== \"active\""),
  "Draft/history export must retain the existing owner, visibility, eligibility, and lifecycle checks.",
);

assertCheck(
  "account-export-rejects-internal-content-markers",
  exportSurface.includes("INTERNAL_CONTENT_KEYS") &&
    exportSurface.includes("INTERNAL_CONTENT_VALUE") &&
    exportSurface.includes("thinkingstages") &&
    exportSurface.includes("mock_recommendation_available") &&
    !exportSurface.includes("outside this Stage 7 export substep"),
  "Export mapping must remove internal stage/debug material and replace mock recommendation terminology.",
);

assertCheck(
  "account-export-has-no-client-owner-input",
  !exportRoute.includes("ownerPrincipalId") &&
    !exportRoute.includes("clientOwner") &&
    !exportSurface.includes("clientOwner"),
  "Account export must not accept owner identifiers from client-controlled input.",
);

assertCheck(
  "account-export-route-keeps-stable-download-contract",
  exportRoute.includes('export const dynamic = "force-dynamic"') &&
    exportRoute.includes("Content-Disposition") &&
    exportRoute.includes('filename="levio-account-data-export.json"') &&
    exportRoute.includes('"Content-Type": "application/json; charset=utf-8"') &&
    exportRoute.includes('"Cache-Control": "no-store"'),
  "Dashboard export route must remain dynamic, no-store JSON with the stable filename.",
);

assertCheck(
  "account-export-route-does-not-read-provider-directly",
  !exportRoute.includes("process.env") &&
    !exportRoute.includes("createSupabase") &&
    !exportRoute.includes("createClient"),
  "The route must delegate through the account export surface.",
);

assertCheck(
  "block-c-c1-privacy-panel-exposes-v1-export-without-placeholder-controls",
  privacyPanel.includes("/dashboard/privacy/export") &&
    privacyPanel.includes("Descargar JSON") &&
    privacyPanel.includes("Descarga una copia de los datos asociados a tu cuenta en formato JSON.") &&
    !privacyPanel.includes("/dashboard/privacy/deletion") &&
    !privacyPanel.includes("Descargar plan") &&
    !privacyPanel.includes("UnavailableAction"),
  "Privacy panel must expose the implemented export without staging or non-functional controls.",
);

assertCheck(
  "account-export-quality-script-remains-registered",
  packageJson.includes('"quality:block-c-user-data-export-surface"'),
  "The targeted account export quality gate must remain registered.",
);

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("Network access is forbidden in account export validation.");
};

try {
  const validation = require(
    join(
      rootDir,
      "lib",
      "user-data-controls",
      "account-data-export-surface-validation.ts",
    ),
  );
  const result = await validation.runAccountDataExportSurfaceValidation();
  assertCheck(
    "account-export-deterministic-regression",
    result.passed === true && result.failed === false,
    "Deterministic account export validation failed.",
  );
  for (const item of result.cases) {
    assertCheck(
      `account-export-${item.caseId}`,
      item.passed === true,
      item.issues?.join(" ") || "Validation case failed.",
    );
  }
} finally {
  globalThis.fetch = originalFetch;
}

assertCheck(
  "account-export-performs-zero-provider-network-operations",
  externalNetworkRequests === 0,
  "Account export regression must remain fully offline.",
);

for (const check of checks) {
  if (check.passed) {
    console.log(`PASS ${check.caseId}`);
  } else {
    console.error(`FAIL ${check.caseId}`);
    console.error(`  ${check.issue}`);
  }
}

const failed = checks.filter((check) => !check.passed);
console.log(`\nAccount export quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
