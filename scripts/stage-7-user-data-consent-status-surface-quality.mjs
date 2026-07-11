import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (...segments) => readFileSync(join(process.cwd(), ...segments), "utf8");
const surface = read("lib", "user-data-controls", "account-consent-status-surface.ts");
const route = read("app", "dashboard", "privacy", "consent", "route.ts");
const panel = read("components", "PrivacyPanel.tsx");
const packageJson = read("package.json");
const checks = [];

function check(caseId, passed, issue) {
  checks.push({ caseId, passed: Boolean(passed), issue });
}

check(
  "stage-7-consent-status-is-versioned-and-read-only",
  surface.includes("stage-7-account-consent-status-surface.1") &&
    surface.includes("levio-account-consent-status-json") &&
    surface.includes('consent: "policy_status_only_no_ledger"'),
  "Consent status must be a stable read-only policy surface.",
);
check(
  "stage-7-consent-status-validates-authenticated-canonical-owner",
  surface.includes("readServerAuthSession") &&
    surface.includes("initializePersistenceRuntimeWiring") &&
    surface.includes('operation: "list_simulation_records"') &&
    surface.includes("persistenceRuntime.preflight"),
  "Consent status must validate auth and canonical principal server-side.",
);
check(
  "stage-7-consent-status-uses-approved-policy-catalog",
  surface.includes("DEFAULT_CONSENT_RUNTIME_POLICIES.map") &&
    surface.includes('currentStatus: "not_required" | "not_recorded" | "not_available"'),
  "Consent status must report the approved policy catalog without inventing consent records.",
);
check(
  "stage-7-consent-status-keeps-writes-and-future-runtimes-closed",
  surface.includes('consentLedger: "not_implemented"') &&
    surface.includes('consentCapture: "not_executed"') &&
    surface.includes('consentWithdrawal: "not_executed"') &&
    surface.includes('databaseWrites: "not_executed"') &&
    surface.includes('memoryRuntime: "not_started"') &&
    surface.includes('analyticsReuse: "not_started"') &&
    surface.includes('aiTrainingReuse: "not_started"'),
  "Consent status must not open ledger writes, withdrawal, memory, analytics, or AI training.",
);
check(
  "stage-7-consent-route-rejects-client-owner-input",
  !route.includes("ownerPrincipalId") &&
    !route.includes("principalId") &&
    !route.includes("searchParams") &&
    !route.includes("Request"),
  "Consent route must not accept client owner authority.",
);
check(
  "stage-7-consent-route-is-protected-download-boundary",
  route.includes('export const dynamic = "force-dynamic"') &&
    route.includes("readAccountConsentStatusSurface") &&
    route.includes("Content-Disposition") &&
    route.includes("no-store") &&
    !route.includes("process.env") &&
    !route.includes("createClient"),
  "Consent route must delegate through the no-store server surface.",
);
check(
  "stage-7-consent-privacy-action-is-accurate",
  panel.includes('href: "/dashboard/privacy/consent"') &&
    panel.includes("sin registrar, modificar ni retirar consentimiento") &&
    !panel.includes("Gestión futura del consentimiento"),
  "Privacy panel must expose status without promising consent management.",
);
check(
  "stage-7-consent-quality-gate-is-registered",
  packageJson.includes('"quality:stage-7-user-data-consent-status-surface"'),
  "Package scripts must register the consent status quality gate.",
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.caseId}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}

if (checks.some((item) => !item.passed)) process.exitCode = 1;
