import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const designSystem = read("app", "styles", "design-system.css");
const homepage = read("app", "styles", "homepage.css");
const layout = read("app", "layout.tsx");
const brand = read("components", "BrandLockup.tsx");
const home = read("app", "page.tsx");
const authShell = read("components", "AuthShell.tsx");
const dashboardShell = read("components", "DashboardShell.tsx");
const notFound = read("app", "not-found.tsx");
const auth = read("app", "styles", "auth.css");
const dashboard = read("app", "styles", "dashboard.css");
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, condition: Boolean(condition), detail });
}
function includes(source, value, name) {
  check(name, source.includes(value), `Expected source to include: ${value}`);
}

function collectTsxFiles(relativeDirectory) {
  return readdirSync(join(rootDir, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      return collectTsxFiles(relativePath);
    }
    return entry.isFile() && entry.name.endsWith(".tsx") ? [relativePath] : [];
  });
}

const palette = {
  "--levio-bg": "#050505",
  "--levio-surface": "#090909",
  "--levio-surface-elevated": "#101010",
  "--levio-text": "#f4f4f4",
  "--levio-text-secondary": "#b8b8b8",
  "--levio-text-muted": "#999999",
  "--levio-border": "#292929",
  "--levio-border-strong": "#444444",
  "--levio-brand": "#e4ad35",
  "--levio-brand-hover": "#f0c052",
  "--levio-error": "#ff7b72",
  "--levio-success": "#7bcf9b",
  "--levio-warning": "#d7b56d",
  "--levio-focus-ring": "rgba(240, 192, 82, 0.38)",
};

for (const [token, value] of Object.entries(palette)) {
  includes(designSystem, `${token}: ${value};`, `${token} keeps the canonical visual baseline`);
}

const importIndex = layout.indexOf("import './styles/design-system.css';");
const legacyImportIndex = layout.indexOf("import './styles/dashboard.css';");
check(
  "Shared foundation loads before legacy surface styles",
  importIndex >= 0 && legacyImportIndex > importIndex,
);

for (const [homeToken, sharedToken] of [
  ["--home-bg", "--levio-bg"],
  ["--home-surface", "--levio-surface"],
  ["--home-surface-raised", "--levio-surface-elevated"],
  ["--home-text", "--levio-text"],
  ["--home-muted", "--levio-text-muted"],
  ["--home-muted-strong", "--levio-text-secondary"],
  ["--home-line", "--levio-border"],
  ["--home-line-strong", "--levio-border-strong"],
  ["--home-brand", "--levio-brand"],
  ["--home-brand-highlight", "--levio-brand-hover"],
]) {
  includes(homepage, `${homeToken}: var(${sharedToken});`, `${homeToken} aliases ${sharedToken}`);
}

includes(brand, '<Link aria-label={ariaLabel} className={classes} href="/">', "Shared brand keeps the canonical destination and optional accessible name");
includes(brand, "{mark ?? <LevioMark size={markSize} priority={priority} />}", "Shared brand preserves custom and canonical marks");
includes(brand, '<span className={nameClassName}>levio.es</span>', "Shared brand keeps the canonical public name");
check(
  "Homepage consumes the shared brand without changing its two lockup positions",
  (home.match(/<BrandLockup(?:\s|\/|>)/g) ?? []).length === 2,
);
check("AuthShell consumes BrandLockup once", (authShell.match(/<BrandLockup(?:\s|\/|>)/g) ?? []).length === 1);
check("DashboardShell consumes BrandLockup once", (dashboardShell.match(/<BrandLockup(?:\s|\/|>)/g) ?? []).length === 1);
check("not-found consumes BrandLockup once", (notFound.match(/<BrandLockup(?:\s|\/|>)/g) ?? []).length === 1);
includes(authShell, 'mark={<span className="brand-logo brand-logo-mini" aria-hidden="true"></span>}', "AuthShell preserves its existing mark variant");
includes(dashboardShell, 'className="dashboard-brand" markSize="sm"', "DashboardShell preserves its existing brand classes and mark size");
includes(notFound, 'ariaLabel="levio.es" className="auth-brand"', "not-found preserves its existing brand class and accessible name");
const brandUsers = [...collectTsxFiles("app"), ...collectTsxFiles("components")]
  .filter((file) => file !== "components/BrandLockup.tsx" && readFileSync(join(rootDir, file), "utf8").includes("<BrandLockup"))
  .sort();
check(
  "BrandLockup is limited to the four approved surfaces",
  JSON.stringify(brandUsers) === JSON.stringify([
    "app/not-found.tsx",
    "app/page.tsx",
    "components/AuthShell.tsx",
    "components/DashboardShell.tsx",
  ]),
  `Actual BrandLockup users: ${brandUsers.join(", ")}`,
);
check(
  "Superseded foundation files are absent",
  !existsSync(join(rootDir, "app", "styles", "visual-foundation.css")) &&
    !existsSync(join(rootDir, "components", "LevioBrand.tsx")),
);
check(
  "Auth and dashboard styles remain outside this migration batch",
  !auth.includes("--levio-") && !dashboard.includes("--levio-"),
);

const failed = checks.filter((item) => !item.condition);
for (const item of checks) {
  console.log(`${item.condition ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.condition && item.detail) {
    console.log(`  ${item.detail}`);
  }
}

console.log(`\nShared visual-system foundation quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
