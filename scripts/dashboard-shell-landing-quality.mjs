import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "9a6d6b7590c4e65cf06241462132eb630b254fef";
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const baselineFile = (path) => execFileSync("git", ["show", `${baseline}:${path}`], {
  cwd: rootDir,
  encoding: "utf8",
});
const shell = read("components", "DashboardShell.tsx");
const landing = read("app", "dashboard", "page.tsx");
const css = read("app", "styles", "dashboard-shell.css");
const layout = read("app", "layout.tsx");
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

function normalizeCopy(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractCopy(source, filename) {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const values = [];
  const attributes = new Set(["description", "eyebrow", "explanation", "label", "title"]);

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = normalizeCopy(node.getText(file));
      if (value) values.push(value);
    }
    if (
      ts.isJsxAttribute(node) &&
      attributes.has(node.name.text) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      values.push(normalizeCopy(node.initializer.text));
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return values;
}

function extractInitializer(source, filename, variableName) {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
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

function sourceBlock(source, startText, endText) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : "";
}

function hrefContracts(source) {
  return [...source.matchAll(/href=(?:"([^"]+)"|\{([^}]+)\})/g)].map((match) => match[1] ?? match[2]);
}

check(
  "Dashboard landing preserves exact visible copy",
  JSON.stringify(extractCopy(landing, "app/dashboard/page.tsx")) ===
    JSON.stringify(extractCopy(baselineFile("app/dashboard/page.tsx"), "app/dashboard/page.tsx")),
);
check(
  "Dashboard shell preserves exact visible copy and accessibility names",
  JSON.stringify(extractCopy(shell, "components/DashboardShell.tsx")) ===
    JSON.stringify(extractCopy(baselineFile("components/DashboardShell.tsx"), "components/DashboardShell.tsx")),
);

for (const variableName of ["summaryCards", "engineStages", "decisionRadar"]) {
  check(
    `Landing data/status contract remains exact: ${variableName}`,
    extractInitializer(landing, "app/dashboard/page.tsx", variableName) ===
      extractInitializer(baselineFile("app/dashboard/page.tsx"), "app/dashboard/page.tsx", variableName),
  );
}

check(
  "Dashboard navigation items and destinations remain byte-identical",
  sourceBlock(shell, "const navigationItems", "type DashboardShellProps") ===
    sourceBlock(baselineFile("components/DashboardShell.tsx"), "const navigationItems", "type DashboardShellProps"),
);
check(
  "Landing link destinations remain exact",
  JSON.stringify(hrefContracts(landing)) ===
    JSON.stringify(hrefContracts(baselineFile("app/dashboard/page.tsx"))),
);
check(
  "Logout behaviour remains byte-identical",
  sourceBlock(shell, "async function handleLogout", "function isActiveRoute") ===
    sourceBlock(baselineFile("components/DashboardShell.tsx"), "async function handleLogout", "function isActiveRoute"),
);
check(
  "Active-route behaviour remains byte-identical",
  sourceBlock(shell, "function isActiveRoute", "const activeItem") ===
    sourceBlock(baselineFile("components/DashboardShell.tsx"), "function isActiveRoute", "const activeItem"),
);
includes(shell, 'aria-current={isActiveRoute(item.href) ? "page" : undefined}', "Navigation preserves aria-current semantics");
check(
  "Both navigation presentations preserve aria-current",
  (shell.match(/aria-current=\{isActiveRoute\(item\.href\) \? "page" : undefined\}/g) ?? []).length === 2,
);
includes(shell, "account.accountState", "Shell keeps validated account state");
includes(shell, "account.email", "Shell keeps the account identifier");
includes(shell, "await auth.signOut()", "Shell keeps auth sign-out");
includes(shell, "clearMockSession()", "Shell keeps legacy marker cleanup");
includes(shell, 'router.replace("/login")', "Shell keeps the login destination");

check("DashboardShell owns one BrandLockup", (shell.match(/<BrandLockup(?:\s|>)/g) ?? []).length === 1);
excludes(shell, "<LevioMark", "DashboardShell does not duplicate the brand mark");
excludes(landing, "<BrandLockup", "Landing does not duplicate BrandLockup");
includes(landing, "<DashboardShell", "Dashboard landing uses the approved shared shell");
includes(shell, "dashboard-shell--landing", "Shared shell exposes a bounded landing variation");
excludes(landing, "engine-status-core", "Landing removes the animated decorative core");
excludes(landing, "section-frame", "Landing no longer consumes legacy decorative panels");
check(
  "Unavailable landing actions remain disabled",
  (landing.match(/<UnavailableAction/g) ?? []).length ===
    (baselineFile("app/dashboard/page.tsx").match(/<UnavailableAction/g) ?? []).length,
);

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
  "--levio-brand-hover",
  "--levio-focus-ring",
  "--levio-radius-sm",
  "--levio-font-sans",
  "--levio-content-max",
]) {
  includes(css, `var(${token})`, `Dashboard Batch 4 CSS consumes ${token}`);
}
check(
  "Dashboard Batch 4 CSS introduces no parallel color literals",
  !/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(css),
);
const effectCss = css.replace(
  /(?:box-shadow|text-shadow|backdrop-filter|filter|animation|transition):\s*none;/gi,
  "",
);
check(
  "Dashboard Batch 4 CSS has no gradients, glow, decorative shadows, filters, or animation",
  !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|filter\s*:|animation\s*:|@keyframes)/i.test(effectCss),
);
excludes(css, "!important", "Dashboard Batch 4 CSS requires no important overrides");
check(
  "Dashboard stylesheet stays scoped away from other migrated surfaces",
  !/(?:\.auth-|\.minimal-home|\.public-secondary|(?:^|[,{\s])body(?:[\s,{:]|$)|(?:^|[,{\s])html(?:[\s,{:]|$)|:root)/m.test(css),
);
includes(css, "border-radius: var(--levio-radius-sm);", "Shell and landing use restrained geometry");
includes(css, ":focus-visible", "Dashboard keyboard focus remains visible");
includes(css, "min-height: 44px", "Dashboard navigation and actions keep touch targets");
includes(css, "overflow-wrap: anywhere", "Long account identifiers cannot force overflow");
includes(css, "overflow-x: clip", "Dashboard shell contains horizontal overflow");
includes(css, "@media (max-width: 560px)", "Dashboard shell has a narrow mobile breakpoint");
includes(css, ".dashboard-nav-menu", "Existing compact navigation remains styled");
includes(css, ".dashboard-sidebar .dashboard-sidebar-nav", "Desktop navigation has a bounded mobile switch");

const designIndex = layout.indexOf("import './styles/design-system.css';");
const globalsIndex = layout.indexOf("import './globals.css';");
const dashboardIndex = layout.indexOf("import './styles/dashboard-shell.css';");
check(
  "Dashboard Batch 4 stylesheet loads after globals and canonical foundation",
  designIndex >= 0 && globalsIndex > designIndex && dashboardIndex > globalsIndex,
);
includes(
  packageJson,
  '"quality:dashboard-shell-landing": "node scripts/dashboard-shell-landing-quality.mjs"',
  "Dedicated Batch 4 gate is registered",
);

const visibleCopy = [
  ...extractCopy(shell, "DashboardShell.tsx"),
  ...extractCopy(landing, "dashboard-page.tsx"),
].join(" ");
check(
  "Migrated dashboard UI adds no forbidden AI/chat terminology",
  !/(?:\bopenai\b|\bchatgpt\b|\bchat\b|\bassistant\b|answer engine|ia real)/i.test(visibleCopy),
);

for (const path of [
  "app/dashboard/layout.tsx",
  "app/styles/dashboard.css",
  "components/dashboard/DashboardAccountProvider.tsx",
  "components/auth/AuthRuntimeProvider.tsx",
  "components/MockAuthGate.tsx",
  "lib/auth/dashboard-account.ts",
  "lib/auth/guards.ts",
  "lib/auth/session.ts",
]) {
  check(`${path} preserves dashboard/auth behaviour byte-for-byte`, read(path) === baselineFile(path));
}

const nestedDashboardPaths = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", baseline, "--", "app/dashboard"],
  { cwd: rootDir, encoding: "utf8" },
).trim().split("\n").filter((path) => path && path !== "app/dashboard/page.tsx");
check(
  "Nested dashboard routes remain byte-identical to baseline",
  nestedDashboardPaths.every(
    (path) => existsSync(join(rootDir, path)) && read(path) === baselineFile(path),
  ),
);

for (const directory of [
  "components/dashboard",
  "app/api",
  "supabase",
  "lib/persistence-runtime",
  "lib/saved-decision-simulations",
]) {
  const paths = execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", directory], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim().split("\n").filter(Boolean);
  check(
    `${directory} remains byte-identical to baseline`,
    paths.every((path) => existsSync(join(rootDir, path)) && read(path) === baselineFile(path)),
  );
}

for (const path of [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "app/privacy-policy/page.tsx",
  "app/terms/page.tsx",
  "app/not-found.tsx",
  "app/styles/auth.css",
  "app/styles/public-secondary.css",
  "components/AuthShell.tsx",
  "components/PublicSecondaryShell.tsx",
  "components/HomeSimulator.tsx",
]) {
  check(`${path} remains outside Batch 4`, read(path) === baselineFile(path));
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

const allowedScope = new Set([
  "app/dashboard/page.tsx",
  "app/layout.tsx",
  "app/styles/dashboard-shell.css",
  "components/DashboardShell.tsx",
  "package.json",
  "scripts/auth-access-surfaces-quality.mjs",
  "scripts/dashboard-shell-landing-quality.mjs",
  "scripts/public-secondary-surfaces-quality.mjs",
  "scripts/shared-visual-system-foundation-quality.mjs",
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
  "Diff stays inside the approved Batch 4 file set",
  actualScope.every((path) => allowedScope.has(path)),
  `Unexpected files: ${actualScope.filter((path) => !allowedScope.has(path)).join(", ")}`,
);

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
console.log(`\nDashboard shell and landing quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
