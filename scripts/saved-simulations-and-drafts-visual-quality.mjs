import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "4d4f58750cf0bbc95f7dbb162d9209c9e2ddc043";
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const before = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: rootDir, encoding: "utf8" });
const routes = [
  "app/dashboard/simulations/page.tsx",
  "app/dashboard/simulations/[id]/page.tsx",
  "app/dashboard/drafts/[id]/page.tsx",
];
const components = [
  "components/SavedSimulationsHistorySurface.tsx",
  "components/SimulationDraftResumeSurface.tsx",
];
const sources = new Map([...routes, ...components].map((path) => [path, read(path)]));
const css = read("app/styles/saved-records-surfaces.css");
const layout = read("app/layout.tsx");
const packageJson = read("package.json");
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

function includes(source, value, name) {
  check(name, source.includes(value), `Expected source to include: ${value}`);
}

function excludes(source, value, name) {
  check(name, !source.includes(value), `Expected source to exclude: ${value}`);
}

function file(source, path) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractCopy(source, path) {
  const ast = file(source, path);
  const values = [];
  const names = new Set(["aria-label", "description", "eyebrow", "label", "title"]);
  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = normalize(node.getText(ast));
      if (value) values.push(value);
    }
    if (ts.isJsxAttribute(node) && names.has(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) {
      values.push(normalize(node.initializer.text));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return values;
}

function extractImports(source, path) {
  const ast = file(source, path);
  return ast.statements.filter(ts.isImportDeclaration).map((node) => normalize(node.getText(ast)));
}

function extractInteractive(source, path) {
  const ast = file(source, path);
  const values = [];
  const tags = new Set(["DashboardShell", "Link", "form", "input", "button", "textarea"]);
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (tags.has(tag)) {
        const attrs = node.attributes.properties
          .filter((attribute) => !(ts.isJsxAttribute(attribute) && attribute.name.text === "className"))
          .map((attribute) => normalize(attribute.getText(ast)));
        values.push({ tag, attrs });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return values;
}

function extractConditions(source, path) {
  const ast = file(source, path);
  const values = [];
  function visit(node) {
    if (ts.isIfStatement(node)) values.push(normalize(node.expression.getText(ast)));
    if (ts.isConditionalExpression(node)) values.push(normalize(node.condition.getText(ast)));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return values;
}

function hrefs(source) {
  return [...source.matchAll(/href=(?:"([^"]+)"|\{([^}]+)\})/g)].map((match) => match[1] ?? match[2]);
}

function baselinePaths(directory) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", directory], { cwd: rootDir, encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
}

function directoryMatches(directory) {
  return baselinePaths(directory).every((path) => existsSync(join(rootDir, path)) && read(path) === before(path));
}

for (const [path, current] of sources) {
  check(`${path} preserves exact copy and accessibility names`, JSON.stringify(extractCopy(current, path)) === JSON.stringify(extractCopy(before(path), path)));
  check(`${path} preserves imports and dependencies`, JSON.stringify(extractImports(current, path)) === JSON.stringify(extractImports(before(path), path)));
  check(`${path} preserves links, forms, actions, fields and button contracts`, JSON.stringify(extractInteractive(current, path)) === JSON.stringify(extractInteractive(before(path), path)));
  check(`${path} preserves status and conditional branches`, JSON.stringify(extractConditions(current, path)) === JSON.stringify(extractConditions(before(path), path)));
  check(`${path} preserves route destinations`, JSON.stringify(hrefs(current)) === JSON.stringify(hrefs(before(path))));
  excludes(current, "section-frame", `${path} no longer consumes legacy decorative panels`);
}

for (const route of routes) {
  const source = sources.get(route);
  check(`${route} uses DashboardShell exactly once`, (source.match(/<DashboardShell\b/g) ?? []).length === 1);
  includes(source, "saved-records-surface", `${route} opts into the bounded Batch 6 scope`);
  excludes(source, "<BrandLockup", `${route} does not duplicate the shell brand`);
}

includes(sources.get(routes[0]), "readSavedSimulationsHistorySurface()", "Saved list keeps its owner-scoped reader");
includes(sources.get(routes[1]), "readSavedSimulationDetailSurface({ recordId: params.id })", "Saved detail keeps its record reader");
includes(sources.get(routes[2]), "readSimulationDraftResumeSurface({ draftId: params.id })", "Draft resume keeps its owner-scoped reader");
includes(sources.get(routes[0]), 'export const dynamic = "force-dynamic"', "Saved list remains dynamic");
includes(sources.get(routes[1]), 'export const dynamic = "force-dynamic"', "Saved detail remains dynamic");
includes(sources.get(routes[2]), 'export const dynamic = "force-dynamic"', "Draft detail remains dynamic");

for (const token of [
  "--levio-surface", "--levio-surface-elevated", "--levio-text", "--levio-text-secondary",
  "--levio-text-muted", "--levio-border", "--levio-border-strong", "--levio-brand",
  "--levio-brand-hover", "--levio-error", "--levio-warning", "--levio-focus-ring",
  "--levio-radius-sm", "--levio-font-sans",
]) includes(css, `var(${token})`, `Batch 6 CSS consumes ${token}`);

check("Batch 6 CSS introduces no parallel color literals", !/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(css));
const effectCss = css.replace(/(?:box-shadow|text-shadow|backdrop-filter|filter|animation|transition):\s*none;/gi, "");
check("Batch 6 CSS has no gradients, glow, decorative shadows, filters or animation", !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|filter\s*:|animation\s*:|@keyframes)/i.test(effectCss));
excludes(css, "!important", "Batch 6 CSS needs no important overrides");
check("Every Batch 6 selector is route-scoped", css.split("\n")
  .map((line) => line.trim())
  .filter((line) => (line.endsWith("{") || line.endsWith(",")) && !line.startsWith("@media"))
  .every((line) => line.startsWith(".saved-records-surface")));
includes(css, ":focus-visible", "Keyboard focus remains visible");
includes(css, "min-height: 44px", "Actions keep touch targets");
includes(css, "overflow-wrap: anywhere", "Long saved content can wrap");
includes(css, "overflow-x: clip", "Batch 6 roots contain horizontal overflow");
includes(css, "@media (max-width: 560px)", "Batch 6 has a narrow mobile breakpoint");
includes(css, ".saved-records-action--delete", "Saved deletion remains visually distinct");
includes(css, ".saved-records-form--delete", "Draft deletion remains visually distinct");

const designIndex = layout.indexOf("import './styles/design-system.css';");
const globalsIndex = layout.indexOf("import './globals.css';");
const workspaceIndex = layout.indexOf("import './styles/workspace-surfaces.css';");
const batchIndex = layout.indexOf("import './styles/saved-records-surfaces.css';");
check("Batch 6 stylesheet loads after foundation, legacy and completed dashboard styles", designIndex >= 0 && globalsIndex > designIndex && workspaceIndex > globalsIndex && batchIndex > workspaceIndex);
includes(packageJson, '"quality:saved-simulations-and-drafts-visual": "node scripts/saved-simulations-and-drafts-visual-quality.mjs"', "Dedicated Batch 6 gate is registered");

for (const directory of ["app/api", "supabase", "lib"]) check(`${directory} preserves API, persistence, owner and lifecycle contracts`, directoryMatches(directory));
for (const path of [
  "app/page.tsx", "components/HomeSimulator.tsx",
  "app/styles/dashboard-shell.css", "app/styles/workspace-surfaces.css", "app/styles/auth.css", "app/styles/public-secondary.css",
  "LEVIO_PROJECT_CONSTITUTION.md", "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md",
]) check(`${path} remains byte-identical to the approved baseline`, read(path) === before(path));

const allowed = new Set([
  "app/styles/motion.css", "components/DecisionSingularity.tsx", "components/DecisionSingularity.module.css",
  "components/DecisionSingularityWebGL.tsx", "components/DecisionSingularityWebGL.module.css",
  "components/DecisionSphereVisual.tsx", "components/DecisionSphereVisual.module.css",
  "components/SimulationDetailClient.tsx", "components/SimulationsList.tsx", "package.json",
  "scripts/dashboard-shell-landing-quality.mjs", "scripts/workspace-surfaces-quality.mjs",
  "scripts/homepage-one-time-assembly-refinement-quality.mjs",
  "scripts/saved-simulations-and-drafts-visual-quality.mjs", "scripts/privacy-data-controls-shared-states-visual-quality.mjs",
  "scripts/visual-migration-closure-quality.mjs",
]);
const tracked = execFileSync("git", ["diff", "--name-only", baseline], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const actual = Array.from(new Set([...tracked, ...untracked])).sort();
check("Completed Batch 6 stays closed during final cleanup", actual.every((path) => allowed.has(path)), `Unexpected files: ${actual.filter((path) => !allowed.has(path)).join(", ")}`);
check("Final cleanup does not rewrite globals.css", read("app/globals.css") === before("app/globals.css"));

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
console.log(`\nSaved simulations and drafts visual quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length) process.exitCode = 1;
