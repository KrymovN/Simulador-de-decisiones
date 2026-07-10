import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();

function readProjectFile(...segments) {
  return readFileSync(join(rootDir, ...segments), "utf8");
}

const privacyPanel = readProjectFile("components", "PrivacyPanel.tsx");
const packageJson = readProjectFile("package.json");
const checks = [];

function assertCheck(caseId, condition, issue) {
  checks.push({ caseId, passed: Boolean(condition), issue });
}

for (const [control, href, label] of [
  ["export", "/dashboard/privacy/export", "Descargar JSON"],
  ["deletion", "/dashboard/privacy/deletion", "Descargar plan"],
  ["retention", "/dashboard/privacy/retention", "Descargar estado"],
]) {
  assertCheck(
    `stage-7-privacy-${control}-action-remains-linked`,
    privacyPanel.includes(`href: "${href}"`) && privacyPanel.includes(`label: "${label}"`),
    `${control} must remain available through its authenticated dashboard download action.`,
  );
}

assertCheck(
  "stage-7-privacy-surface-describes-complete-read-only-scope",
  privacyPanel.includes("simulaciones guardadas, borradores e historial elegibles") &&
    privacyPanel.includes("simulaciones guardadas, borradores e historial sin ejecutar") &&
    privacyPanel.includes("simulaciones guardadas, borradores e historial sin iniciar"),
  "Privacy copy must describe saved simulations, drafts, and history across all three read-only controls.",
);

assertCheck(
  "stage-7-privacy-surface-removes-stale-history-deletion-mock",
  !privacyPanel.includes("Borrado futuro de historial") &&
    !privacyPanel.includes("Preparar el borrado de simulaciones"),
  "The completed history deletion-planning coverage must not remain represented as a future mock action.",
);

assertCheck(
  "stage-7-privacy-surface-keeps-destructive-copy-closed",
  privacyPanel.includes("sin ejecutar la eliminación") &&
    privacyPanel.includes("sin iniciar trabajos automáticos") &&
    !privacyPanel.includes("Eliminar ahora") &&
    !privacyPanel.includes("Ejecutar eliminación"),
  "Privacy actions must remain planning/status downloads without destructive execution claims.",
);

assertCheck(
  "stage-7-privacy-surface-gate-registered",
  packageJson.includes('"quality:stage-7-user-data-privacy-surface"'),
  "Package scripts must register the Stage 7 privacy-surface quality gate.",
);

for (const check of checks) {
  if (check.passed) {
    console.log(`PASS ${check.caseId}`);
  } else {
    console.error(`FAIL ${check.caseId}`);
    console.error(`  ${check.issue}`);
  }
}

const passed = checks.filter((check) => check.passed).length;
console.log(`${passed}/${checks.length} checks passed.`);

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
}
