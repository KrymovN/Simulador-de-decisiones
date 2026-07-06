import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2020,
    },
  });

  module._compile(output.outputText, filename);
};

const checks = [];

function pathFromRoot(...parts) {
  return join(rootDir, ...parts);
}

function read(...parts) {
  return readFileSync(pathFromRoot(...parts), "utf8");
}

function pass(name) {
  checks.push({ name, passed: true });
  console.log(`PASS ${name}`);
}

function fail(name, message) {
  checks.push({ name, passed: false, message });
  console.error(`FAIL ${name}`);
  console.error(`  ${message}`);
}

function assertCheck(name, condition, message) {
  if (condition) {
    pass(name);
  } else {
    fail(name, message);
  }
}

function countOccurrences(source, marker) {
  return source.split(marker).length - 1;
}

async function runValidationModule(label, relativePath, exportName) {
  const modulePath = pathFromRoot(...relativePath);
  const validationModule = require(modulePath);
  const result = await validationModule[exportName]();

  assertCheck(
    `${label} validation passes`,
    result.passed === true && result.failed === false,
    `${label} validation failed.`,
  );

  for (const validationCase of result.cases) {
    assertCheck(
      `${label} case ${validationCase.caseId}`,
      validationCase.passed === true,
      validationCase.issues?.join(" ") || "Validation case failed.",
    );
  }
}

await runValidationModule(
  "persistence-foundation",
  ["lib", "persistence-runtime", "foundation-validation.ts"],
  "runPersistenceRuntimeFoundationValidation",
);
await runValidationModule(
  "persistence-provider-adapter",
  ["lib", "persistence-runtime", "provider-adapter-validation.ts"],
  "runPersistenceProviderAdapterFoundationValidation",
);
await runValidationModule(
  "persistence-runtime-wiring",
  ["lib", "persistence-runtime", "runtime-wiring-validation.ts"],
  "runPersistenceRuntimeWiringValidation",
);
await runValidationModule(
  "supabase-persistence-provider",
  ["lib", "persistence-runtime", "supabase-provider-validation.ts"],
  "runSupabasePersistenceProviderValidation",
);
await runValidationModule(
  "simulation-record-persistence",
  ["lib", "persistence-runtime", "simulation-record-persistence-validation.ts"],
  "runSimulationRecordPersistenceValidation",
);
await runValidationModule(
  "saved-decision-simulations-runtime",
  ["lib", "saved-decision-simulations", "runtime-validation.ts"],
  "runSavedDecisionSimulationsRuntimeValidation",
);
await runValidationModule(
  "saved-simulations-product-surface",
  ["lib", "saved-decision-simulations", "product-surface-validation.ts"],
  "runSavedSimulationsProductSurfaceValidation",
);

const supabaseProvider = read("lib", "persistence-runtime", "supabase-provider.ts");
const rlsMigration = read("supabase", "migrations", "006_enable_rls_and_policies.sql");
const constraintsMigration = read("supabase", "migrations", "005_indexes_and_constraints.sql");
const serverAction = read("lib", "saved-decision-simulations", "ui-save-action.ts");
const productSurface = read("lib", "saved-decision-simulations", "product-surface.ts");
const homeSimulator = read("components", "HomeSimulator.tsx");
const historyPage = read("app", "dashboard", "simulations", "page.tsx");
const detailPage = read("app", "dashboard", "simulations", "[id]", "page.tsx");

assertCheck(
  "Supabase record reads are owner/status scoped",
  countOccurrences(supabaseProvider, '.eq("owner_principal_id", input.ownerPrincipalId)') >= 3 &&
    countOccurrences(supabaseProvider, '.eq("owner_principal_type", "registered_user")') >= 3 &&
    countOccurrences(supabaseProvider, '.eq("record_status", "active")') >= 3 &&
    countOccurrences(supabaseProvider, '.eq("deletion_state", "active")') >= 3,
  "Expected read/list/archive provider operations to filter by owner, registered_user, active record_status, and active deletion_state.",
);

assertCheck(
  "Supabase save uses server-provided insert payload",
  supabaseProvider.includes("async saveSimulationRecord(") &&
    supabaseProvider.includes('.from("simulation_records")') &&
    supabaseProvider.includes(".insert(payload)") &&
    !supabaseProvider.includes("window."),
  "Expected save provider to insert a server-built simulation_records payload without browser runtime access.",
);

assertCheck(
  "RLS enables owner-scoped tables",
  [
    "alter table public.levio_principals enable row level security;",
    "alter table public.simulation_records enable row level security;",
    "alter table public.simulation_drafts enable row level security;",
    "alter table public.simulation_history_entries enable row level security;",
    "auth.uid()",
    "simulation_records_select_own",
    "with check (false)",
  ].every((marker) => rlsMigration.includes(marker)),
  "Expected RLS migration to enable RLS, use auth.uid owner mapping, and deny direct authenticated writes.",
);

assertCheck(
  "Schema keeps owner immutable and history owner-aligned",
  [
    "simulation_history_parent_owner_match_fk",
    "levio_reject_owner_principal_update",
    "simulation_records_reject_owner_update",
    "simulation_drafts_reject_owner_update",
    "simulation_history_reject_owner_update",
  ].every((marker) => constraintsMigration.includes(marker)),
  "Expected owner immutability triggers and parent-owner history constraint.",
);

assertCheck(
  "UI save action remains server-only",
  serverAction.startsWith('"use server";') &&
    serverAction.includes("saveCompletedSimulationSurface") &&
    serverAction.includes("revalidatePath") &&
    !serverAction.includes("@supabase/"),
  "Expected saved simulation UI action to be server-only and not import Supabase directly.",
);

assertCheck(
  "Product surface resolves auth server-side",
  productSurface.includes("readServerAuthSession") &&
    productSurface.includes("saveDecisionSimulation") &&
    productSurface.includes("readSavedSimulationsHistorySurface") &&
    productSurface.includes("readSavedSimulationDetailSurface") &&
    !productSurface.includes("@supabase/"),
  "Expected product surface to use auth/runtime boundaries and no direct Supabase client.",
);

assertCheck(
  "HomeSimulator save flow avoids local owner or Supabase access",
  homeSimulator.includes("saveCompletedSimulationFromUi") &&
    homeSimulator.includes("Guardar simulación") &&
    homeSimulator.includes("/api/simulate") &&
    !homeSimulator.includes("LOCAL_SIMULATIONS_KEY") &&
    !homeSimulator.includes("localStorage") &&
    !homeSimulator.includes("@supabase/"),
  "Expected HomeSimulator to save via server action without localStorage owner state or Supabase client access.",
);

assertCheck(
  "Dashboard simulations routes use product surface",
  historyPage.includes("readSavedSimulationsHistorySurface") &&
    detailPage.includes("readSavedSimulationDetailSurface") &&
    historyPage.includes('dynamic = "force-dynamic"') &&
    detailPage.includes('dynamic = "force-dynamic"'),
  "Expected dashboard history/detail routes to use server product surface and dynamic rendering.",
);

const failed = checks.filter((check) => !check.passed);

console.log(
  `\nBlock A decision simulation persistence closure quality gate: ${
    checks.length - failed.length
  }/${checks.length} passed.`,
);

if (failed.length > 0) {
  process.exitCode = 1;
}
