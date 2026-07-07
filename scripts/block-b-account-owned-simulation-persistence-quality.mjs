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

const authTypes = read("lib", "auth", "types.ts");
const authIdentity = read("lib", "auth", "identity.ts");
const persistenceContracts = read("lib", "persistence-runtime", "contracts.ts");
const runtimeWiring = read("lib", "persistence-runtime", "runtime-wiring.ts");
const supabaseProvider = read("lib", "persistence-runtime", "supabase-provider.ts");
const savedRuntime = read("lib", "saved-decision-simulations", "runtime.ts");
const savedSurface = read("lib", "saved-decision-simulations", "product-surface.ts");
const saveAction = read("lib", "saved-decision-simulations", "ui-save-action.ts");
const historySurface = read("components", "SavedSimulationsHistorySurface.tsx");
const dashboardLayout = read("app", "dashboard", "layout.tsx");
const dashboardAccountRuntime = read("lib", "auth", "dashboard-account.ts");
const principalMigration = read("supabase", "migrations", "001_create_levio_principals.sql");
const rlsMigration = read("supabase", "migrations", "006_enable_rls_and_policies.sql");
const packageJson = read("package.json");

const dashboardUiSources = [
  historySurface,
  dashboardLayout,
  dashboardAccountRuntime,
];

assertCheck(
  "auth runtime carries account email verification as session metadata",
  authTypes.includes("emailVerified?: boolean") &&
    authIdentity.includes("readEmailVerified") &&
    authIdentity.includes("user.email_confirmed_at") &&
    authIdentity.includes("emailVerified: readEmailVerified(user)"),
  "Expected normalized auth session to expose bounded email verification metadata for principal sync.",
);

assertCheck(
  "persistence adapter contract exposes optional server-only principal provisioning",
  persistenceContracts.includes("resolveOrProvisionPrincipalByProviderReference?") &&
    persistenceContracts.includes("emailVerified?: boolean") &&
    persistenceContracts.includes("authenticatedAt?: string") &&
    persistenceContracts.includes('executionBoundary: "server_only"'),
  "Expected provider adapter contract to support optional server-only principal provisioning without making it a UI concern.",
);

assertCheck(
  "runtime wiring provisions principal before owner-scoped preflight",
  runtimeWiring.includes("resolveOrProvisionPrincipalWithAdapter") &&
    runtimeWiring.includes("adapter.resolveOrProvisionPrincipalByProviderReference") &&
    runtimeWiring.includes("authContext.principal.providerReference") &&
    runtimeWiring.includes("authContext.principal.email") &&
    runtimeWiring.includes("authContext.principal.emailVerified") &&
    runtimeWiring.includes("authContext.authTime") &&
    runtimeWiring.includes("input.foundation.preflight"),
  "Expected persistence preflight to derive canonical owner through the provider adapter before data reaches UI.",
);

assertCheck(
  "Supabase provider provisions and syncs levio_principals only on server boundary",
  supabaseProvider.includes("SupabasePrincipalProvisionPayload") &&
    supabaseProvider.includes("SupabasePrincipalSyncPayload") &&
    supabaseProvider.includes('from("levio_principals")') &&
    supabaseProvider.includes(".insert(payload)") &&
    supabaseProvider.includes(".update(payload)") &&
    supabaseProvider.includes("normalizeProviderReference") &&
    supabaseProvider.includes("serviceRoleKey") &&
    supabaseProvider.includes("resolveOrProvisionPrincipalByProviderReference") &&
    supabaseProvider.includes("isServerRuntime()") &&
    !supabaseProvider.includes("owner_principal_id: providerReference"),
  "Expected principal provisioning/sync to remain inside the service-role server provider and never use provider ids as owners.",
);

assertCheck(
  "saved simulation operations remain owner-scoped by preflight principal",
  savedRuntime.includes("input.runtime.preflight") &&
    savedRuntime.includes('operation: "list_simulation_records"') &&
    savedRuntime.includes('operation: "read_simulation_record"') &&
    savedRuntime.includes('operation: "resolve_principal"') &&
    savedRuntime.includes("ownerPrincipalId: preflight.principalId") &&
    savedRuntime.includes('"providerReference"') &&
    savedRuntime.includes("client_owner_input_rejected") &&
    !savedRuntime.includes("createSupabase"),
  "Expected saved simulation runtime to keep owner validation server-side and reject client owner input.",
);

assertCheck(
  "saved simulation product surface and server action do not expose provider persistence",
  savedSurface.includes("readServerAuthSession") &&
    savedSurface.includes("saveDecisionSimulation") &&
    saveAction.startsWith('"use server";') &&
    saveAction.includes("saveCompletedSimulationSurface") &&
    !savedSurface.includes("@supabase/") &&
    !saveAction.includes("@supabase/") &&
    !saveAction.includes("owner_principal_id") &&
    !saveAction.includes("providerReference"),
  "Expected UI save flow to use approved server surface without Supabase/client owner data.",
);

assertCheck(
  "dashboard simulation UI does not filter owners or touch provider internals",
  !dashboardUiSources.some(
    (source) =>
      source.includes("@supabase/") ||
      source.includes("createSupabase") ||
      source.includes("owner_principal_id") ||
      source.includes("principal_id") ||
      source.includes("providerReference") ||
      source.includes("auth.users"),
  ),
  "Expected dashboard UI to receive already owner-scoped simulations instead of filtering or reading provider internals.",
);

assertCheck(
  "database contract preserves canonical principal ownership and denies client writes",
  principalMigration.includes("principal_id uuid primary key default gen_random_uuid()") &&
    principalMigration.includes("provider_reference uuid not null") &&
    rlsMigration.includes("create policy levio_principals_insert_none") &&
    rlsMigration.includes("with check (false)") &&
    rlsMigration.includes("create policy simulation_records_insert_none") &&
    rlsMigration.includes("provider_reference = auth.uid()"),
  "Expected schema/RLS to keep provider references separate from canonical owner ids and deny direct client writes.",
);

assertCheck(
  "Block B6 quality gate is registered",
  packageJson.includes('"quality:block-b-account-owned-simulation-persistence": "node scripts/block-b-account-owned-simulation-persistence-quality.mjs"'),
  "Expected package.json to expose the B6 account-owned simulation persistence quality gate.",
);

const failed = checks.filter((check) => !check.passed);

console.log(`\nBlock B account-owned simulation persistence quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
