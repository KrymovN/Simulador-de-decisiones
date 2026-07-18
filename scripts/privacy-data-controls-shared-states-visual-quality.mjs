import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "75b56411cb6d7b9e246478736524260c4706284c";
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const before = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: rootDir, encoding: "utf8" });
const pagePath = "app/dashboard/privacy/page.tsx";
const panelPath = "components/PrivacyPanel.tsx";
const page = read(pagePath);
const panel = read(panelPath);
const css = read("app/styles/privacy-data-controls.css");
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

function ast(source, path) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function copy(source, path) {
  const file = ast(source, path);
  const values = [];
  const names = new Set(["aria-label", "description", "eyebrow", "explanation", "label", "title"]);
  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = normalize(node.getText(file));
      if (value) values.push(value);
    }
    if (ts.isJsxAttribute(node) && names.has(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) values.push(normalize(node.initializer.text));
    ts.forEachChild(node, visit);
  }
  visit(file);
  return values;
}

function imports(source, path) {
  const file = ast(source, path);
  return file.statements.filter(ts.isImportDeclaration).map((node) => normalize(node.getText(file)));
}

function interactive(source, path) {
  const file = ast(source, path);
  const values = [];
  const tags = new Set(["MockAuthGate", "DashboardShell", "PrivacyPanel", "UnavailableAction", "a", "button", "input", "form"]);
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(file);
      if (tags.has(tag)) {
        values.push({
          tag,
          attributes: node.attributes.properties
            .filter((attribute) => !(ts.isJsxAttribute(attribute) && attribute.name.text === "className"))
            .map((attribute) => normalize(attribute.getText(file))),
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return values;
}

function initializers(source, path, names) {
  const file = ast(source, path);
  const values = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && names.includes(node.name.text) && node.initializer) values[node.name.text] = normalize(node.initializer.getText(file));
    ts.forEachChild(node, visit);
  }
  visit(file);
  return values;
}

function conditions(source, path) {
  const file = ast(source, path);
  const values = [];
  function visit(node) {
    if (ts.isIfStatement(node)) values.push(normalize(node.expression.getText(file)));
    if (ts.isConditionalExpression(node)) values.push(normalize(node.condition.getText(file)));
    ts.forEachChild(node, visit);
  }
  visit(file);
  return values;
}

function baselinePaths(directory) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", directory], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
}

function directoryMatches(directory) {
  return baselinePaths(directory).every((path) => existsSync(join(rootDir, path)) && read(path) === before(path));
}

for (const [path, source] of [[pagePath, page], [panelPath, panel]]) {
  check(`${path} preserves exact copy and accessibility names`, JSON.stringify(copy(source, path)) === JSON.stringify(copy(before(path), path)));
  check(`${path} preserves imports and dependencies`, JSON.stringify(imports(source, path)) === JSON.stringify(imports(before(path), path)));
  check(`${path} preserves shell, links, fields, disabled and submit contracts`, JSON.stringify(interactive(source, path)) === JSON.stringify(interactive(before(path), path)));
  check(`${path} preserves runtime branches`, JSON.stringify(conditions(source, path)) === JSON.stringify(conditions(before(path), path)));
  excludes(source, "section-frame", `${path} no longer consumes legacy decorative panels`);
}

check("Privacy rights and actions remain exact", JSON.stringify(initializers(panel, panelPath, ["privacyRights", "privacyActions"])) === JSON.stringify(initializers(before(panelPath), panelPath, ["privacyRights", "privacyActions"])));
check("Privacy route uses DashboardShell exactly once", (page.match(/<DashboardShell\b/g) ?? []).length === 1);
check("Privacy route keeps MockAuthGate compatibility wrapper", (page.match(/<MockAuthGate\b/g) ?? []).length === 1);
includes(page, "privacy-controls-surface", "Privacy route opts into the bounded Batch 7 scope");
excludes(page, "<BrandLockup", "Privacy route does not duplicate shell branding");
includes(page, 'role="status"', "Existing completion state keeps its status announcement");
includes(panel, "<UnavailableAction", "Existing unavailable state is reused");
check("No fabricated state or destructive execution component was added", !/(?:LoadingState|EmptyState|ErrorState|ConfirmationDialog|deleteAccount|executeDeletion)/.test(page + panel));

for (const token of [
  "--levio-bg", "--levio-surface", "--levio-surface-elevated", "--levio-text", "--levio-text-secondary",
  "--levio-text-muted", "--levio-border", "--levio-border-strong", "--levio-brand", "--levio-brand-hover",
  "--levio-error", "--levio-success", "--levio-warning", "--levio-focus-ring", "--levio-radius-sm", "--levio-font-sans",
]) includes(css, `var(${token})`, `Batch 7 CSS consumes ${token}`);

check("Batch 7 CSS introduces no parallel color literals", !/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(css));
const effectCss = css.replace(/(?:box-shadow|text-shadow|backdrop-filter|filter|animation|transition):\s*none;/gi, "");
check("Batch 7 CSS has no gradients, glow, decorative shadows, filters or animation", !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|filter\s*:|animation\s*:|@keyframes)/i.test(effectCss));
excludes(css, "!important", "Batch 7 CSS needs no important overrides");
check("Every Batch 7 selector is route-scoped", css.split("\n").map((line) => line.trim()).filter((line) => (line.endsWith("{") || line.endsWith(",")) && !line.startsWith("@media")).every((line) => line.startsWith(".privacy-controls-surface")));
includes(css, ":focus-visible", "Keyboard focus remains visible");
includes(css, "min-height: 44px", "Controls keep touch targets");
includes(css, "overflow-wrap: anywhere", "Long legal and warning copy can wrap");
includes(css, "overflow-x: clip", "Privacy root contains horizontal overflow");
includes(css, "button:disabled", "Unavailable action keeps explicit disabled styling");
includes(css, "@media (max-width: 560px)", "Batch 7 has a narrow mobile breakpoint");

const designIndex = layout.indexOf("import './styles/design-system.css';");
const savedIndex = layout.indexOf("import './styles/saved-records-surfaces.css';");
const privacyIndex = layout.indexOf("import './styles/privacy-data-controls.css';");
check("Batch 7 stylesheet loads after foundation, legacy and prior dashboard batches", designIndex >= 0 && savedIndex > designIndex && privacyIndex > savedIndex);
check("Root metadata and non-style layout contracts remain exact", layout.replace("import './styles/privacy-data-controls.css';\n", "") === before("app/layout.tsx"));
includes(packageJson, '"quality:privacy-data-controls-shared-states-visual": "node scripts/privacy-data-controls-shared-states-visual-quality.mjs"', "Dedicated Batch 7 gate is registered");

for (const path of [
  "app/dashboard/privacy/export/route.ts", "app/dashboard/privacy/deletion/route.ts",
  "app/dashboard/privacy/retention/route.ts", "app/dashboard/privacy/consent/route.ts",
  "components/UnavailableAction.tsx", "components/MockAuthGate.tsx", "components/DashboardShell.tsx",
]) check(`${path} preserves its server, state or shared-shell contract byte-for-byte`, read(path) === before(path));

for (const directory of ["app/api", "supabase", "lib"]) check(`${directory} preserves API, Supabase, owner and lifecycle contracts`, directoryMatches(directory));
for (const path of [
  "app/page.tsx", "components/HomeSimulator.tsx", "app/styles/dashboard-shell.css", "app/styles/workspace-surfaces.css",
  "app/styles/saved-records-surfaces.css", "app/styles/auth.css", "app/styles/public-secondary.css", "app/globals.css",
  "LEVIO_PROJECT_CONSTITUTION.md", "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md",
]) check(`${path} remains byte-identical to the approved baseline`, read(path) === before(path));

for (const directory of ["app/dashboard/simulations", "app/dashboard/drafts", "app/dashboard/decisions", "app/dashboard/memory", "app/dashboard/profile", "app/dashboard/security"]) check(`${directory} remains outside Batch 7`, directoryMatches(directory));

const allowed = new Set([
  pagePath, panelPath, "app/layout.tsx", "app/styles/privacy-data-controls.css", "package.json",
  "scripts/dashboard-shell-landing-quality.mjs", "scripts/workspace-surfaces-quality.mjs",
  "scripts/saved-simulations-and-drafts-visual-quality.mjs", "scripts/privacy-data-controls-shared-states-visual-quality.mjs",
]);
const tracked = execFileSync("git", ["diff", "--name-only", baseline], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: rootDir, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const actual = Array.from(new Set([...tracked, ...untracked])).sort();
check("Diff stays inside the approved Batch 7 file set", actual.every((path) => allowed.has(path)), `Unexpected files: ${actual.filter((path) => !allowed.has(path)).join(", ")}`);
check("Batch 8 remains closed", read("app/globals.css") === before("app/globals.css"));

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
console.log(`\nPrivacy data controls and shared states visual quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length) process.exitCode = 1;
