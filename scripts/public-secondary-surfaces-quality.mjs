import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "bb771ffe613368d7a5d30565f483f8da19cce1da";
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const privacy = read("app", "privacy-policy", "page.tsx");
const terms = read("app", "terms", "page.tsx");
const notFound = read("app", "not-found.tsx");
const shell = read("components", "PublicSecondaryShell.tsx");
const brand = read("components", "BrandLockup.tsx");
const css = read("app", "styles", "public-secondary.css");
const layout = read("app", "layout.tsx");
const simulator = read("components", "HomeSimulator.tsx");
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

function baselineFile(path) {
  return execFileSync("git", ["show", `${baseline}:${path}`], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

function normalizeCopy(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractRouteCopy(source, filename) {
  const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const copy = [];
  const copyAttributes = new Set(["description", "eyebrow", "title"]);

  function visit(node) {
    if (ts.isJsxText(node)) {
      const text = normalizeCopy(node.getText(sourceFile));
      if (text) {
        copy.push(text);
      }
    }
    if (
      ts.isJsxAttribute(node) &&
      copyAttributes.has(node.name.text) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      copy.push(normalizeCopy(node.initializer.text));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return copy;
}

function metadataBlock(source) {
  const start = source.indexOf("export const metadata");
  const end = source.indexOf("\n};", start);
  return start >= 0 && end >= 0 ? source.slice(start, end + 3) : "";
}

for (const [path, current] of [
  ["app/privacy-policy/page.tsx", privacy],
  ["app/terms/page.tsx", terms],
  ["app/not-found.tsx", notFound],
]) {
  const before = baselineFile(path);
  check(
    `${path} preserves exact visible route copy`,
    JSON.stringify(extractRouteCopy(current, path)) === JSON.stringify(extractRouteCopy(before, path)),
    `Before: ${JSON.stringify(extractRouteCopy(before, path))}\nAfter: ${JSON.stringify(extractRouteCopy(current, path))}`,
  );
}

const baselineAuthShellCopy = [
  ...extractRouteCopy(
    baselineFile("components/BrandLockup.tsx"),
    "components/BrandLockup.tsx",
  ),
  ...extractRouteCopy(
    baselineFile("components/AuthShell.tsx"),
    "components/AuthShell.tsx",
  ),
];
const currentSharedCopy = [
  ...extractRouteCopy(brand, "components/BrandLockup.tsx"),
  ...extractRouteCopy(shell, "components/PublicSecondaryShell.tsx"),
];
check(
  "Legal shared brand and security copy remains exact",
  JSON.stringify(currentSharedCopy) === JSON.stringify(baselineAuthShellCopy),
  `Before: ${JSON.stringify(baselineAuthShellCopy)}\nAfter: ${JSON.stringify(currentSharedCopy)}`,
);

for (const [path, current] of [
  ["app/privacy-policy/page.tsx", privacy],
  ["app/terms/page.tsx", terms],
]) {
  check(
    `${path} preserves metadata byte-for-byte`,
    metadataBlock(current) === metadataBlock(baselineFile(path)),
  );
}

for (const [source, variant, name] of [
  [privacy, "legal", "Privacy"],
  [terms, "legal", "Terms"],
  [notFound, "system", "not-found"],
]) {
  includes(source, "<PublicSecondaryShell", `${name} uses the shared public shell`);
  includes(source, `variant="${variant}"`, `${name} uses the approved ${variant} variation`);
  excludes(source, "<BrandLockup", `${name} does not duplicate BrandLockup markup`);
  excludes(source, "<LevioMark", `${name} does not duplicate the brand mark`);
  excludes(source, "style={{", `${name} adds no inline visual styles`);
}

includes(shell, "<BrandLockup", "Shared shell owns the single BrandLockup composition");
check(
  "Shared shell is reused by exactly the three Batch 2 surfaces",
  [privacy, terms, notFound].every((source) => source.includes("PublicSecondaryShell")),
);
includes(layout, "import './styles/public-secondary.css';", "Root layout mounts the scoped Batch 2 stylesheet");
check(
  "Design system loads before the Batch 2 stylesheet",
  layout.indexOf("import './styles/design-system.css';") <
    layout.indexOf("import './styles/public-secondary.css';"),
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
  "--levio-radius-sm",
  "--levio-font-sans",
  "--levio-content-max",
]) {
  includes(css, `var(${token})`, `Batch 2 CSS consumes ${token}`);
}
check(
  "Batch 2 CSS introduces no parallel color literals",
  !/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(css),
);
check(
  "Batch 2 CSS has no gradients, glow, decorative shadows, filters, or animation",
  !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|filter\s*:|animation\s*:|@keyframes)/i.test(css),
);
includes(css, "border-radius: var(--levio-radius-sm);", "Cards use the canonical restrained radius");
includes(css, ":focus-visible", "Keyboard focus remains visible");
includes(css, "outline: 3px solid var(--levio-text);", "Focus treatment remains high contrast and neutral");
includes(css, "overflow-x: clip;", "Shared shell contains horizontal overflow");
includes(css, "env(safe-area-inset-top)", "Mobile shell respects the top safe area");
includes(css, "@media (max-width: 480px)", "Narrow iPhone layout has an explicit breakpoint");
excludes(shell, '"use client"', "Legal and system content does not depend on client JavaScript");

const visibleCopy = [
  ...extractRouteCopy(privacy, "privacy.tsx"),
  ...extractRouteCopy(terms, "terms.tsx"),
  ...extractRouteCopy(notFound, "not-found.tsx"),
  ...currentSharedCopy,
].join(" ");
check(
  "Migrated public UI adds no forbidden AI/chat terminology",
  !/(?:\bopenai\b|\bchatgpt\b|\bchat\b|\bassistant\b|answer engine|ia real)/i.test(visibleCopy),
);

for (const path of [
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "components/AuthShell.tsx",
  "components/DashboardShell.tsx",
  "components/HomeSimulator.tsx",
  "app/styles/auth.css",
  "app/styles/dashboard.css",
]) {
  check(`${path} remains byte-identical to baseline`, readFileSync(join(rootDir, path), "utf8") === baselineFile(path));
}

for (const directory of ["app/dashboard", "components/auth", "components/dashboard"]) {
  const paths = execFileSync("git", ["ls-tree", "-r", "--name-only", baseline, "--", directory], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim().split("\n").filter(Boolean);
  check(
    `${directory} remains byte-identical to baseline`,
    paths.every((path) => existsSync(join(rootDir, path)) && readFileSync(join(rootDir, path), "utf8") === baselineFile(path)),
  );
}

for (const path of [
  "LEVIO_PROJECT_CONSTITUTION.md",
  "PROJECT_CONTEXT.md",
  "LEVIO_IMPLEMENTATION_PLAN.md",
  "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md",
  "LEVIO_PROJECT_PROGRESS.md",
]) {
  check(`${path} has no canonical drift`, readFileSync(join(rootDir, path), "utf8") === baselineFile(path));
}

for (const invariant of [
  "MAX_SIMULATION_INPUT_LENGTH = 1200",
  'fetch("/api/simulate"',
  "safeRender !== true",
  "mockOnly !== true",
  "apiReady !== true",
  "saveCompletedSimulationFromUi",
]) {
  includes(simulator, invariant, `HomeSimulator contract remains: ${invariant}`);
}

const allowedScope = new Set([
  "app/layout.tsx",
  "app/not-found.tsx",
  "app/privacy-policy/page.tsx",
  "app/styles/public-secondary.css",
  "app/terms/page.tsx",
  "components/PublicSecondaryShell.tsx",
  "package.json",
  "scripts/public-secondary-surfaces-quality.mjs",
  "scripts/rendered-public-surface-regression-quality.mjs",
  "scripts/shared-visual-system-foundation-quality.mjs",
]);
const trackedDiff = execFileSync("git", ["diff", "--name-only", baseline], {
  cwd: rootDir,
  encoding: "utf8",
}).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  cwd: rootDir,
  encoding: "utf8",
}).trim().split("\n").filter(Boolean);
const actualScope = Array.from(new Set([...trackedDiff, ...untracked])).sort();
check(
  "Diff stays inside the approved Batch 2 file set",
  actualScope.every((path) => allowedScope.has(path)),
  `Unexpected files: ${actualScope.filter((path) => !allowedScope.has(path)).join(", ")}`,
);

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) {
    console.log(`  ${item.detail}`);
  }
}
console.log(`\nPublic secondary surfaces quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
