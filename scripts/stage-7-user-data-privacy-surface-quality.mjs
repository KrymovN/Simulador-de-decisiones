import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const startingHead = "9fef8043f72915f3195b6ada3d70eb969d7d08e3";
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const before = (path) => execFileSync(
  "git",
  ["show", `${startingHead}:${path}`],
  { cwd: rootDir, encoding: "utf8" },
);
const page = read("app/dashboard/privacy/page.tsx");
const panel = read("components/PrivacyPanel.tsx");
const css = read("app/styles/privacy-data-controls.css");
const savedSimulationDetail = read("components/SavedSimulationsHistorySurface.tsx");
const packageJson = read("package.json");
const visibleSource = `${page}\n${panel}`;
const checks = [];

function check(caseId, passed, issue) {
  checks.push({ caseId, passed: Boolean(passed), issue });
}

check(
  "production-v1-privacy-hierarchy-is-stable",
  page.includes('eyebrow="LEVIO.ES / CENTRO DE PRIVACIDAD"') &&
    page.includes('title="Privacidad y datos"') &&
    page.includes('description="Revisa, exporta y gestiona los datos personales asociados a tu cuenta."'),
  "Privacy Center must use the approved production V1 hierarchy and introduction.",
);

for (const forbidden of [
  "preparado",
  "preparada",
  "pendiente de activación productiva",
  "memoria futura",
  "preparar pausa",
  "controles preparados",
  "descargar plan",
]) {
  check(
    `production-v1-removes-${forbidden.replaceAll(" ", "-")}`,
    !visibleSource.toLocaleLowerCase("es").includes(forbidden),
    `Production Privacy Center still exposes staging/future copy: ${forbidden}`,
  );
}

check(
  "implemented-account-export-remains-actionable",
  panel.includes("Exportar datos de la cuenta") &&
    panel.includes("Descarga una copia de los datos asociados a tu cuenta en formato JSON.") &&
    panel.includes('href="/dashboard/privacy/export"') &&
    panel.includes("Descargar JSON"),
  "The implemented account export must remain available with present-tense user-facing copy.",
);

check(
  "implemented-saved-simulation-deletion-remains-reachable",
  panel.includes("Gestionar simulaciones guardadas") &&
    panel.includes('href="/dashboard/simulations"') &&
    panel.includes("Abrir simulaciones") &&
    savedSimulationDetail.includes("deleteSavedSimulationFromDashboard") &&
    savedSimulationDetail.includes("Eliminar simulación guardada") &&
    savedSimulationDetail === before("components/SavedSimulationsHistorySurface.tsx"),
  "Privacy Center must route to the existing deletion control without changing its action or semantics.",
);

check(
  "retention-is-readable-and-semantically-unchanged",
  panel.includes("Conservación de datos") &&
    panel.includes("Las simulaciones guardadas se conservan mientras permanezcan en tu cuenta o hasta que las elimines.") &&
    panel.includes("Los borradores tienen una fecha de caducidad configurada; esa fecha determina cuándo pueden eliminarse.") &&
    !panel.includes("/dashboard/privacy/retention") &&
    !panel.includes("Descargar estado"),
  "Retention must be readable before any technical download and preserve the saved-simulation/draft lifecycle meaning.",
);

check(
  "future-and-technical-controls-are-absent",
  !panel.includes("UnavailableAction") &&
    !panel.includes("/dashboard/privacy/deletion") &&
    !panel.includes("/dashboard/privacy/consent") &&
    !panel.includes("Pausa no disponible") &&
    !/(?:stage-7|planning|ledger|runtime|enforcement)/i.test(visibleSource),
  "Future memory, technical planning/status downloads, or internal contract language remains visible.",
);

const rightsStart = panel.indexOf('className="dashboard-card privacy-controls-card privacy-controls-rights"');
const rightsEnd = panel.indexOf("</section>", rightsStart);
const rightsSection = panel.slice(rightsStart, rightsEnd);
check(
  "rights-are-informational-and-mapped-to-real-controls",
  rightsStart >= 0 &&
    rightsEnd > rightsStart &&
    panel.includes('title: "Acceso y portabilidad"') &&
    panel.includes('title: "Supresión"') &&
    !rightsSection.includes("<a") &&
    !rightsSection.includes("<button") &&
    !rightsSection.includes("onClick"),
  "Rights must remain informational and correspond only to the export and saved-simulation deletion mechanisms.",
);

for (const path of [
  "app/dashboard/privacy/export/route.ts",
  "app/dashboard/privacy/deletion/route.ts",
  "app/dashboard/privacy/retention/route.ts",
  "app/dashboard/privacy/consent/route.ts",
  "lib/user-data-controls/account-data-export-surface.ts",
  "lib/user-data-controls/account-data-deletion-surface.ts",
  "lib/user-data-controls/account-data-retention-surface.ts",
  "lib/user-data-controls/account-consent-status-surface.ts",
]) {
  check(
    `${path}-remains-byte-identical`,
    read(path) === before(path),
    `${path} changed during a presentation-only task.`,
  );
}

check(
  "privacy-layout-remains-responsive-and-overflow-safe",
  css.includes("overflow-x: clip") &&
    css.includes("overflow-wrap: anywhere") &&
    css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") &&
    css.includes("@media (max-width: 900px)") &&
    css.includes("@media (max-width: 560px)") &&
    css.includes("grid-template-columns: 1fr") &&
    css.includes("width: 100%"),
  "Privacy Center must remain readable without clipping or horizontal overflow on desktop and mobile.",
);

check(
  "privacy-quality-gate-remains-registered",
  packageJson.includes('"quality:stage-7-user-data-privacy-surface"'),
  "Package scripts must keep the Privacy Center quality gate registered.",
);

const changed = [
  ...execFileSync("git", ["diff", "--name-only", startingHead], { cwd: rootDir, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: rootDir, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  "app/dashboard/privacy/page.tsx",
  "app/styles/privacy-data-controls.css",
  "components/PrivacyPanel.tsx",
  "scripts/block-c-user-data-deletion-surface-quality.mjs",
  "scripts/block-c-user-data-export-surface-quality.mjs",
  "scripts/stage-7-user-data-consent-status-surface-quality.mjs",
  "scripts/stage-7-user-data-privacy-surface-quality.mjs",
  "scripts/stage-7-user-data-retention-surface-quality.mjs",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowed.has(path));
check(
  "privacy-center-write-set-is-bounded",
  unexpected.length === 0,
  `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`,
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.caseId}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}

const passed = checks.filter((item) => item.passed).length;
console.log(`${passed}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
