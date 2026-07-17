import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "47da75c0852cc9720ac827a24961cb9b18dd7ccc";
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const baselineFile = (path) => execFileSync("git", ["show", `${baseline}:${path}`], {
  cwd: rootDir,
  encoding: "utf8",
});
const routePaths = [
  "app/dashboard/decisions/page.tsx",
  "app/dashboard/memory/page.tsx",
  "app/dashboard/profile/page.tsx",
  "app/dashboard/security/page.tsx",
];
const componentPaths = [
  "components/dashboard/DashboardProfileAccountState.tsx",
  "components/SecurityPanel.tsx",
];
const sources = new Map([...routePaths, ...componentPaths].map((path) => [path, read(...path.split("/"))]));
const decisions = sources.get(routePaths[0]);
const memory = sources.get(routePaths[1]);
const profileRoute = sources.get(routePaths[2]);
const securityRoute = sources.get(routePaths[3]);
const profile = sources.get(componentPaths[0]);
const securityPanel = sources.get(componentPaths[1]);
const css = read("app", "styles", "workspace-surfaces.css");
const layout = read("app", "layout.tsx");
const shell = read("components", "DashboardShell.tsx");
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

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function sourceFile(source, filename) {
  return ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function extractCopy(source, filename) {
  const file = sourceFile(source, filename);
  const values = [];
  const attributes = new Set([
    "aria-label",
    "description",
    "eyebrow",
    "explanation",
    "label",
    "placeholder",
    "title",
  ]);

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = normalize(node.getText(file));
      if (value) values.push(value);
    }
    if (
      ts.isJsxAttribute(node) &&
      attributes.has(node.name.text) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      values.push(normalize(node.initializer.text));
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return values;
}

function extractImports(source, filename) {
  const file = sourceFile(source, filename);
  return file.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.getText(file));
}

function extractInteractiveContract(source, filename) {
  const file = sourceFile(source, filename);
  const values = [];
  const interactiveTags = new Set(["DashboardShell", "UnavailableAction", "input", "select", "option"]);

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(file);
      if (interactiveTags.has(tag)) {
        const attributes = node.attributes.properties
          .filter((attribute) => !(ts.isJsxAttribute(attribute) && attribute.name.text === "className"))
          .map((attribute) => normalize(attribute.getText(file)));
        values.push({ tag, attributes });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return values;
}

function extractInitializer(source, filename, variableName) {
  const file = sourceFile(source, filename);
  let initializer = "";

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      initializer = node.initializer.getText(file);
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return initializer;
}

function hrefContracts(source) {
  return [...source.matchAll(/href=(?:"([^"]+)"|\{([^}]+)\})/g)].map((match) => match[1] ?? match[2]);
}

function baselinePaths(directory) {
  return execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", directory], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim().split("\n").filter(Boolean);
}

function directoryMatchesBaseline(directory) {
  return baselinePaths(directory).every(
    (path) => existsSync(join(rootDir, path)) && read(...path.split("/")) === baselineFile(path),
  );
}

for (const [path, current] of sources) {
  const before = baselineFile(path);
  check(
    `${path} preserves exact visible copy and accessibility names`,
    JSON.stringify(extractCopy(current, path)) === JSON.stringify(extractCopy(before, path)),
  );
  check(
    `${path} preserves imports and data dependencies`,
    JSON.stringify(extractImports(current, path)) === JSON.stringify(extractImports(before, path)),
  );
  check(
    `${path} preserves forms, actions, disabled states, and shell props`,
    JSON.stringify(extractInteractiveContract(current, path)) ===
      JSON.stringify(extractInteractiveContract(before, path)),
  );
  check(
    `${path} preserves route destinations`,
    JSON.stringify(hrefContracts(current)) === JSON.stringify(hrefContracts(before)),
  );
  check(
    `${path} preserves unavailable action count`,
    (current.match(/<UnavailableAction\b/g) ?? []).length ===
      (before.match(/<UnavailableAction\b/g) ?? []).length,
  );
}

for (const [source, variant, name] of [
  [decisions, "decisions", "Decisions"],
  [memory, "memory", "Memory"],
  [profileRoute, "profile", "Profile"],
  [securityRoute, "security", "Security"],
]) {
  check(`${name} uses DashboardShell exactly once`, (source.match(/<DashboardShell\b/g) ?? []).length === 1);
  includes(source, `workspace-surface--${variant}`, `${name} opts into its bounded workspace variant`);
  excludes(source, "<BrandLockup", `${name} does not duplicate BrandLockup`);
  excludes(source, "<LevioMark", `${name} does not duplicate the brand mark`);
}

check(
  "DashboardShell remains byte-identical to the approved shared shell",
  shell === baselineFile("components/DashboardShell.tsx"),
);
check(
  "Workspace routes do not consume legacy decorative panels",
  [...sources.values()].every((source) => !source.includes("section-frame")),
);
excludes(memory, "memory-core", "Memory removes the animated decorative core");
excludes(profile, "profile-avatar", "Profile removes the decorative avatar core");
excludes(securityPanel, "<span></span>", "Security removes the decorative status orb");

for (const [source, filename, variableName] of [
  [decisions, routePaths[0], "decisionStats"],
  [memory, routePaths[1], "memoryActions"],
  [securityPanel, componentPaths[1], "sessions"],
]) {
  check(
    `${variableName} data contract remains exact`,
    extractInitializer(source, filename, variableName) ===
      extractInitializer(baselineFile(filename), filename, variableName),
  );
}

for (const token of [
  "--levio-bg",
  "--levio-surface",
  "--levio-surface-elevated",
  "--levio-text",
  "--levio-text-secondary",
  "--levio-text-muted",
  "--levio-border",
  "--levio-border-strong",
  "--levio-brand",
  "--levio-focus-ring",
  "--levio-radius-sm",
  "--levio-font-sans",
]) {
  includes(css, `var(${token})`, `Workspace CSS consumes ${token}`);
}

check(
  "Workspace CSS introduces no parallel color literals",
  !/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(css),
);
const effectCss = css.replace(
  /(?:box-shadow|text-shadow|backdrop-filter|filter|animation|transition):\s*none;/gi,
  "",
);
check(
  "Workspace CSS has no gradients, glow, decorative shadows, filters, or animation",
  !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|filter\s*:|animation\s*:|@keyframes)/i.test(effectCss),
);
excludes(css, "!important", "Workspace CSS requires no important overrides");
check(
  "Workspace CSS selectors remain route-scoped",
  css.split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("."))
    .every((line) => line.startsWith(".workspace-surface")),
);
check(
  "Workspace CSS does not target excluded surfaces",
  !/(?:\.auth-|\.minimal-home|\.public-secondary|\.dashboard-shell--landing|\.simulation-row|\.simulation-detail|\.privacy-layout|\.draft)/.test(css),
);
includes(css, "border-radius: var(--levio-radius-sm);", "Workspace cards use restrained geometry");
includes(css, ":focus-visible", "Workspace keyboard focus remains visible");
includes(css, "min-height: 44px", "Workspace actions keep touch targets");
includes(css, "overflow-wrap: anywhere", "Long workspace labels and account data can wrap");
includes(css, "overflow-x: clip", "Workspace roots contain horizontal overflow");
includes(css, "@media (max-width: 560px)", "Workspace CSS has a narrow mobile breakpoint");
includes(css, "button:disabled", "Unavailable actions keep explicit disabled styling");
includes(css, "input:disabled", "Disabled form and memory states remain explicit");
check(
  "Gold remains limited to active checkbox and focus tokens",
  (css.match(/var\(--levio-brand\)/g) ?? []).length === 1 &&
    (css.match(/var\(--levio-focus-ring\)/g) ?? []).length === 1,
);

const designIndex = layout.indexOf("import './styles/design-system.css';");
const globalsIndex = layout.indexOf("import './globals.css';");
const dashboardIndex = layout.indexOf("import './styles/dashboard-shell.css';");
const workspaceIndex = layout.indexOf("import './styles/workspace-surfaces.css';");
check(
  "Workspace stylesheet loads after legacy and dashboard shell styles",
  designIndex >= 0 &&
    globalsIndex > designIndex &&
    dashboardIndex > globalsIndex &&
    workspaceIndex > dashboardIndex,
);
includes(
  packageJson,
  '"quality:workspace-surfaces": "node scripts/workspace-surfaces-quality.mjs"',
  "Dedicated workspace surfaces gate is registered",
);

includes(profile, "useDashboardAccount()", "Profile keeps validated account runtime data");
includes(profile, "account.displayName", "Profile keeps runtime display name");
includes(profile, "account.email", "Profile keeps runtime email");
includes(profile, 'readOnly type="email"', "Profile email remains read-only");
includes(profile, 'disabled type="text"', "Profile editing remains unavailable");
includes(securityPanel, "useDashboardAccount()", "Security keeps validated account runtime data");
includes(securityPanel, "account.sessionStatus", "Security keeps real session status");
includes(securityRoute, "input disabled", "Security password fields remain disabled");
includes(memory, 'checked={scope.active} disabled type="checkbox"', "Memory availability remains informational");
check(
  "Workspace UI adds no forbidden AI/chat terminology",
  !/(?:\bopenai\b|\bchatgpt\b|\bassistant\b|answer engine|ia real)/i.test(
    [...sources.values()].flatMap((source, index) => extractCopy(source, `workspace-${index}.tsx`)).join(" "),
  ),
);

for (const path of [
  "app/dashboard/layout.tsx",
  "app/dashboard/page.tsx",
  "components/dashboard/DashboardAccountProvider.tsx",
  "components/auth/AuthRuntimeProvider.tsx",
  "components/MockAuthGate.tsx",
  "components/UnavailableAction.tsx",
  "lib/auth/dashboard-account.ts",
  "lib/auth/guards.ts",
  "lib/auth/session.ts",
  "lib/personalArea.ts",
]) {
  check(`${path} preserves auth, session, data, and state contracts byte-for-byte`, read(...path.split("/")) === baselineFile(path));
}

for (const directory of [
  "app/api",
  "supabase",
  "lib/persistence-runtime",
  "lib/saved-decision-simulations",
]) {
  check(`${directory} remains byte-identical to baseline`, directoryMatchesBaseline(directory));
}

for (const path of [
  "app/dashboard/simulations/page.tsx",
  "app/dashboard/simulations/[id]/page.tsx",
  "app/dashboard/drafts/[id]/page.tsx",
  "app/dashboard/privacy/page.tsx",
  "components/SavedSimulationsHistorySurface.tsx",
  "components/SimulationDraftResumeSurface.tsx",
  "components/PrivacyPanel.tsx",
]) {
  check(`${path} remains outside workspace migration`, read(...path.split("/")) === baselineFile(path));
}

for (const path of [
  "app/page.tsx",
  "components/HomeSimulator.tsx",
  "app/styles/auth.css",
  "app/styles/public-secondary.css",
  "app/styles/dashboard-shell.css",
]) {
  check(`${path} remains outside workspace migration`, read(...path.split("/")) === baselineFile(path));
}

for (const path of [
  "LEVIO_PROJECT_CONSTITUTION.md",
  "PROJECT_CONTEXT.md",
  "LEVIO_IMPLEMENTATION_PLAN.md",
  "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md",
  "LEVIO_PROJECT_PROGRESS.md",
]) {
  check(`${path} has no canonical drift`, read(path) === baselineFile(path));
}

for (const routeDirectory of [
  "app/dashboard/decisions",
  "app/dashboard/memory",
  "app/dashboard/profile",
  "app/dashboard/security",
]) {
  check(
    `${routeDirectory} adds no loading or error behaviour`,
    !existsSync(join(rootDir, routeDirectory, "loading.tsx")) &&
      !existsSync(join(rootDir, routeDirectory, "error.tsx")),
  );
}

const allowedScope = new Set([
  ...routePaths,
  ...componentPaths,
  "app/layout.tsx",
  "app/styles/workspace-surfaces.css",
  "package.json",
  "scripts/dashboard-shell-landing-quality.mjs",
  "scripts/workspace-surfaces-quality.mjs",
]);
const tracked = execFileSync("git", ["diff", "--name-only", baseline], {
  cwd: rootDir,
  encoding: "utf8",
}).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  cwd: rootDir,
  encoding: "utf8",
}).trim().split("\n").filter(Boolean);
const actualScope = Array.from(new Set([...tracked, ...untracked])).sort();
check(
  "Diff stays inside the approved workspace migration file set",
  actualScope.every((path) => allowedScope.has(path)),
  `Unexpected files: ${actualScope.filter((path) => !allowedScope.has(path)).join(", ")}`,
);
check("Batch 6 remains closed", directoryMatchesBaseline("app/dashboard/simulations"));

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
console.log(`\nWorkspace surfaces quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
