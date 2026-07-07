import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
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

const listPage = read("app", "dashboard", "simulations", "page.tsx");
const detailPage = read("app", "dashboard", "simulations", "[id]", "page.tsx");
const surfaceComponent = read("components", "SavedSimulationsHistorySurface.tsx");
const productSurface = read("lib", "saved-decision-simulations", "product-surface.ts");
const uiAction = read("lib", "saved-decision-simulations", "ui-save-action.ts");
const savedRuntime = read("lib", "saved-decision-simulations", "runtime.ts");
const supabaseProvider = read("lib", "persistence-runtime", "supabase-provider.ts");
const packageJson = read("package.json");

const dashboardSimulationSources = [
  listPage,
  detailPage,
  surfaceComponent,
];

assertCheck(
  "dashboard simulations routes use server product surface boundary",
  listPage.includes('export const dynamic = "force-dynamic"') &&
    listPage.includes("readSavedSimulationsHistorySurface()") &&
    listPage.includes("<SavedSimulationsHistorySurface state={state} />") &&
    detailPage.includes('export const dynamic = "force-dynamic"') &&
    detailPage.includes("readSavedSimulationDetailSurface({ recordId: params.id })") &&
    detailPage.includes("<SavedSimulationDetailSurface state={state} />") &&
    !listPage.includes("localStorage") &&
    !detailPage.includes("localStorage"),
  "Expected dashboard simulation routes to be dynamic server surfaces over the saved-simulation product boundary.",
);

assertCheck(
  "dashboard simulation UI renders only controlled surface states",
  surfaceComponent.includes('state.status === "auth_required"') &&
    surfaceComponent.includes('state.status === "empty"') &&
    surfaceComponent.includes('state.status === "error"') &&
    surfaceComponent.includes('state.status === "invalid_id" || state.status === "not_found"') &&
    surfaceComponent.includes("Archivar") &&
    surfaceComponent.includes("archiveSavedSimulationFromDashboard") &&
    !surfaceComponent.includes("owner_principal_id") &&
    !surfaceComponent.includes("principal_id") &&
    !surfaceComponent.includes("providerReference") &&
    !surfaceComponent.includes("@supabase/") &&
    !surfaceComponent.includes("createSupabase") &&
    !surfaceComponent.includes("localStorage"),
  "Expected dashboard UI to render account-scoped states without local/demo owner filtering or provider internals.",
);

assertCheck(
  "product surface maps list detail and archive through account-owned runtime",
  productSurface.includes("readServerAuthSession") &&
    productSurface.includes("listDecisionSimulations") &&
    productSurface.includes("reopenDecisionSimulation") &&
    productSurface.includes("archiveDecisionSimulation") &&
    productSurface.includes("archiveSavedSimulationSurface") &&
    productSurface.includes("La simulación no existe, está archivada o no pertenece a esta cuenta.") &&
    productSurface.includes("No se pudieron cargar las simulaciones guardadas de forma controlada.") &&
    productSurface.includes("No se pudo abrir la simulación guardada de forma controlada.") &&
    productSurface.includes("No se pudo archivar la simulación de forma controlada.") &&
    !productSurface.includes("@supabase/") &&
    !productSurface.includes("owner_principal_id") &&
    !productSurface.includes("providerReference"),
  "Expected product surface to own auth, list, reopen, archive, and controlled error state mapping.",
);

assertCheck(
  "dashboard archive action remains server-only and revalidates active history",
  uiAction.startsWith('"use server";') &&
    uiAction.includes("archiveSavedSimulationSurface") &&
    uiAction.includes("FormData") &&
    uiAction.includes('formData.get("recordId")') &&
    uiAction.includes('revalidatePath("/dashboard/simulations")') &&
    uiAction.includes("redirect(result.historyHref)") &&
    !uiAction.includes("@supabase/") &&
    !uiAction.includes("owner_principal_id") &&
    !uiAction.includes("providerReference"),
  "Expected dashboard archive to use a server action over the product surface without client owner data.",
);

assertCheck(
  "saved simulation runtime and provider enforce owner-scoped active dashboard data",
  savedRuntime.includes("ownerPrincipalId: preflight.principalId") &&
    savedRuntime.includes("recordIsOwnerScoped") &&
    savedRuntime.includes("archivedRecordIsOwnerScoped") &&
    savedRuntime.includes("client_owner_input_rejected") &&
    savedRuntime.includes('record.record_status === "active"') &&
    savedRuntime.includes('record.deletion_state === "active"') &&
    supabaseProvider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    supabaseProvider.includes('.eq("record_status", "active")') &&
    supabaseProvider.includes('.eq("deletion_state", "active")') &&
    supabaseProvider.includes('record_status: "archived"') &&
    !savedRuntime.includes("createSupabase"),
  "Expected runtime/provider to enforce owner scope, active list/detail filters, and archive through resolved principal.",
);

assertCheck(
  "dashboard simulations surface does not import legacy local simulation components",
  !dashboardSimulationSources.some(
    (source) =>
      source.includes("SimulationsList") ||
      source.includes("SimulationDetailClient") ||
      source.includes("mockSimulations") ||
      source.includes("LOCAL_SIMULATIONS_KEY"),
  ),
  "Expected account-owned dashboard simulations routes to avoid legacy local/demo simulation data sources.",
);

assertCheck(
  "Block B7 dashboard simulation surface quality gate is registered",
  packageJson.includes('"quality:block-b-dashboard-simulation-surface": "node scripts/block-b-dashboard-simulation-surface-quality.mjs"'),
  "Expected package.json to expose the Block B7 dashboard simulation surface quality gate.",
);

const failed = checks.filter((check) => !check.passed);

console.log(`\nBlock B dashboard simulation surface quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
