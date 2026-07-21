import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "4d4f58750cf0bbc95f7dbb162d9209c9e2ddc043";
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const before = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: rootDir, encoding: "utf8" });
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

function includes(source, value, name) {
  check(name, source.includes(value), `Expected source to include: ${value}`);
}

function filesUnder(directory, extensions = null) {
  const output = [];
  function visit(absolute) {
    for (const name of readdirSync(absolute)) {
      const path = join(absolute, name);
      if (statSync(path).isDirectory()) visit(path);
      else if (!extensions || extensions.has(extname(path))) output.push(relative(rootDir, path));
    }
  }
  visit(join(rootDir, directory));
  return output;
}

function baselinePaths(directory) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", directory], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
}

function directoryMatches(directory) {
  return baselinePaths(directory).every((path) => existsSync(join(rootDir, path)) && read(path) === before(path));
}

const layout = read("app/layout.tsx");
const imports = [...layout.matchAll(/^import ['"]([^'"]+\.css)['"];$/gm)].map((match) => match[1]);
const expectedImports = [
  "./styles/design-system.css", "./styles/dashboard.css", "./styles/simulator.css", "./globals.css",
  "./styles/motion.css", "./styles/auth.css", "./styles/dashboard-shell.css", "./styles/workspace-surfaces.css",
  "./styles/saved-records-surfaces.css", "./styles/privacy-data-controls.css", "./styles/public-secondary.css", "./styles/homepage.css",
];
check("Final stylesheet import order is exact", JSON.stringify(imports) === JSON.stringify(expectedImports));
check("Foundation stylesheet remains first", imports[0] === "./styles/design-system.css");
check("Layout, metadata and URLs remain byte-identical", layout === before("app/layout.tsx"));

const scopedStyles = [
  ["app/styles/auth.css", ".auth-"], ["app/styles/public-secondary.css", ".public-secondary"],
  ["app/styles/dashboard-shell.css", ".dashboard-shell"], ["app/styles/workspace-surfaces.css", ".workspace-surface"],
  ["app/styles/saved-records-surfaces.css", ".saved-records-surface"], ["app/styles/privacy-data-controls.css", ".privacy-controls-surface"],
];
for (const [path, scope] of scopedStyles) {
  const css = read(path);
  includes(css, scope, `${path} retains its approved scope`);
  const effects = css.replace(/(?:box-shadow|text-shadow|backdrop-filter|filter|animation|transition):\s*none(?:\s*!important)?;/gi, "");
  check(`${path} has no migrated-surface gradients, glow, decorative shadows or animation`, !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|animation\s*:|@keyframes)/i.test(effects));
}

const sourcePaths = [...filesUnder("app", new Set([".ts", ".tsx"])), ...filesUnder("components", new Set([".ts", ".tsx"]))];
const sourceText = sourcePaths.map(read).join("\n");
check("BrandLockup is the only LevioMark importer", sourcePaths.filter((path) => read(path).includes('from "./LevioMark"')).every((path) => path === "components/BrandLockup.tsx"));
check("Approved shared shells own BrandLockup markup", ["app/page.tsx", "components/AuthShell.tsx", "components/DashboardShell.tsx", "components/PublicSecondaryShell.tsx"].every((path) => read(path).includes("<BrandLockup")));

const removedFiles = [
  "components/DecisionSingularity.tsx", "components/DecisionSingularity.module.css",
  "components/DecisionSingularityWebGL.tsx", "components/DecisionSingularityWebGL.module.css",
  "components/DecisionSphereVisual.tsx", "components/DecisionSphereVisual.module.css",
  "components/SimulationDetailClient.tsx", "components/SimulationsList.tsx",
];
for (const path of removedFiles) check(`${path} proven legacy file is removed`, !existsSync(join(rootDir, path)));
for (const name of ["DecisionSingularity", "DecisionSingularityWebGL", "DecisionSphereVisual", "SimulationDetailClient", "SimulationsList"]) {
  const imported = sourcePaths.some((path) => {
    const file = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    return file.statements.filter(ts.isImportDeclaration).some((node) => node.moduleSpecifier.getText(file).includes(name));
  });
  check(`${name} has no remaining source import`, !imported);
}
check("Orphan pulseExpand keyframe is removed", !read("app/styles/motion.css").includes("pulseExpand"));
check("No migrated route consumes section-frame or animated cores", !/(?:section-frame|engine-status-core|memory-core|profile-avatar)/.test(sourceText));

for (const directory of ["app/api", "supabase", "lib"]) check(`${directory} preserves runtime, API, owner and privacy contracts`, directoryMatches(directory));
for (const path of [
  "app/page.tsx", "components/HomeSimulator.tsx", "components/AuthShell.tsx", "components/DashboardShell.tsx",
  "components/PublicSecondaryShell.tsx", "components/BrandLockup.tsx", "components/PrivacyPanel.tsx",
  "app/globals.css", "app/styles/homepage.css", "app/styles/design-system.css",
  "LEVIO_PROJECT_CONSTITUTION.md",
]) check(`${path} remains byte-identical to baseline`, read(path) === before(path));

const canonicalState = [
  "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md",
].map(read).join("\n").replace(/\s+/g, " ");
check("Stage 9 remains In Progress without completion drift", canonicalState.includes("Stage 9 remains **In Progress**") && !canonicalState.includes("Stage 9 is complete") && !canonicalState.includes("Stage 9 is **Complete**") && !canonicalState.includes("Stage 9 Closed"));
check("Stage 15 remains documentation and planning only", canonicalState.includes("Stage 15 remains a bounded documentation and scale-readiness planning stage") && !canonicalState.includes("Stage 15 is an implementation Stage"));
check("Visual migration remains closed with zero remaining substeps", canonicalState.includes("Visual migration remains fully closed with 0 remaining substeps") && !canonicalState.includes("Visual migration is reopened") && !canonicalState.includes("Visual migration has reopened"));
check("Stage 9 continuation remains planning only", canonicalState.includes("No next Stage 9 implementation substep is open") && canonicalState.includes("planning candidate, not In Progress work") && !canonicalState.includes("Stage 9 Offline Evaluation Dataset Expansion is In Progress") && !canonicalState.includes("Stage 9 Offline Evaluation Dataset Expansion is **In Progress**"));
check("Dataset and human-review gates remain open", canonicalState.includes("canonical minimum of 160 reviewed cases is not reached") && !canonicalState.includes("canonical minimum of 160 reviewed cases is reached") && !canonicalState.includes("canonical minimum of 160 reviewed cases has been reached") && canonicalState.includes("Human review is not complete") && !canonicalState.includes("Human review is complete") && !canonicalState.includes("Human review has been completed"));

for (const directory of [
  "app/login", "app/register", "app/forgot-password", "app/privacy-policy", "app/terms",
  "app/dashboard", "app/auth", "app/api",
]) check(`${directory} preserves copy, routes, accessibility and behaviour`, directoryMatches(directory));
check("not-found copy and route remain exact", read("app/not-found.tsx") === before("app/not-found.tsx"));

const packageJson = read("package.json");
includes(packageJson, '"quality:visual-migration-closure": "node scripts/visual-migration-closure-quality.mjs"', "Final closure gate is registered");
check("No new Stage or Batch is introduced", canonicalState.includes("No new Stage is created") && !/\bStage (?:1[6-9]|[2-9]\d)\b/.test(canonicalState));

const allowed = new Set([
  "docs/architecture/LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md",
  "docs/architecture/LEVIO_DECISION_ENGINE.md", "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md",
  "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md",
  "lib/ai-decision-material/acceptance.ts", "lib/ai-decision-material/contracts.ts",
  "lib/ai-decision-material/evaluation.ts", "lib/ai-decision-material/fixtures.ts",
  ...removedFiles, "app/styles/motion.css", "package.json", "scripts/dashboard-shell-landing-quality.mjs",
  "scripts/homepage-one-time-assembly-refinement-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/workspace-surfaces-quality.mjs", "scripts/saved-simulations-and-drafts-visual-quality.mjs",
  "scripts/privacy-data-controls-shared-states-visual-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
]);
const tracked = execFileSync("git", ["diff", "--name-only", baseline], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const actual = Array.from(new Set([...tracked, ...untracked])).sort();
check("Final cleanup diff stays inside the approved file set", actual.every((path) => allowed.has(path)), `Unexpected files: ${actual.filter((path) => !allowed.has(path)).join(", ")}`);
const reconciliationAllowed = new Set([
  "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
  "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md",
]);
const reconciliationTracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const reconciliationDiff = Array.from(new Set([...reconciliationTracked, ...untracked])).sort();
check("Reconciliation changes no visual application or UI file", reconciliationDiff.every((path) => reconciliationAllowed.has(path)), `Unexpected current reconciliation files: ${reconciliationDiff.filter((path) => !reconciliationAllowed.has(path)).join(", ")}`);

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
console.log(`\nVisual migration closure quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length) process.exitCode = 1;
