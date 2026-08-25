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
const publicSecondaryShell = read("components", "PublicSecondaryShell.tsx");
const auth = read("app", "styles", "auth.css");
const dashboard = read("app", "styles", "dashboard.css");
const dashboardShellCss = read("app", "styles", "dashboard-shell.css");
const publicSecondary = read("app", "styles", "public-secondary.css");
const simulator = read("app", "styles", "simulator.css");
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, condition: Boolean(condition), detail });
}
function includes(source, value, name) {
  check(name, source.includes(value), `Expected source to include: ${value}`);
}

function cssBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  const end = source.indexOf("}", start);
  return start >= 0 && end > start ? source.slice(start, end + 1) : "";
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

const displayHeadingContract = {
  "--levio-display-heading-weight": "650",
  "--levio-display-heading-tracking": "-0.015em",
  "--levio-display-heading-leading": "0.98",
};

includes(
  designSystem,
  '--levio-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;',
  "Display refinement preserves the existing font family",
);

for (const [token, value] of Object.entries(displayHeadingContract)) {
  includes(designSystem, `${token}: ${value};`, `${token} defines the shared display-heading contract`);
}

const displayHeadingBlocks = [
  ["Homepage hero", homepage, ".minimal-home__hero h1"],
  ["Auth hero", auth, ".auth-visual h1"],
  ["Auth completion", auth, ".auth-completed-state h2"],
  ["Dashboard and account surfaces", dashboardShellCss, ".dashboard-shell__header h1"],
  ["Public secondary surfaces", publicSecondary, ".public-secondary h1"],
  ["Simulator result", simulator, ".simulation-output-header h2"],
];

for (const [surface, source, selector] of displayHeadingBlocks) {
  const block = cssBlock(source, selector);
  check(`${surface} display heading selector exists`, block.length > 0, `Missing CSS block: ${selector}`);
  for (const token of Object.keys(displayHeadingContract)) {
    includes(block, `var(${token})`, `${surface} consumes ${token}`);
  }
}

const typographySources = [designSystem, homepage, auth, dashboardShellCss, publicSecondary, simulator].join("\n");
for (const token of Object.keys(displayHeadingContract)) {
  check(
    `${token} remains limited to the shared definition and approved display headings`,
    (typographySources.match(new RegExp(token, "g")) ?? []).length === 7,
  );
}

includes(homepage, "font-size: clamp(3.4rem, 5.3vw, 5rem);", "Homepage display size remains unchanged");
includes(homepage, "font-size: clamp(2.85rem, 15vw, 4rem);", "Homepage mobile display size remains unchanged");
includes(auth, "font-size: clamp(2.6rem, 5.5vw, 5rem);", "Auth display size remains unchanged");
includes(auth, "font-size: clamp(2.25rem, 11vw, 3rem);", "Auth mobile display size remains unchanged");
includes(dashboardShellCss, "font-size: clamp(2.4rem, 4.8vw, 4.4rem);", "Dashboard display size remains unchanged");
includes(dashboardShellCss, "font-size: clamp(2.2rem, 11vw, 3.1rem);", "Dashboard mobile display size remains unchanged");
includes(publicSecondary, "font-size: clamp(2.4rem, 5.5vw, 5rem);", "Public secondary display size remains unchanged");
includes(publicSecondary, "font-size: clamp(2.2rem, 11vw, 3.1rem);", "Public secondary mobile display size remains unchanged");
includes(cssBlock(auth, ".auth-visual h1"), "text-wrap: balance;", "Auth display keeps its wrapping safeguard");
includes(cssBlock(dashboardShellCss, ".dashboard-shell__header h1"), "overflow-wrap: anywhere;", "Dashboard display keeps its overflow safeguard");
includes(cssBlock(publicSecondary, ".public-secondary h1,\n.public-secondary h2"), "text-wrap: balance;", "Public secondary display keeps balanced wrapping");

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
check("PublicSecondaryShell consumes BrandLockup once", (publicSecondaryShell.match(/<BrandLockup(?:\s|\/|>)/g) ?? []).length === 1);
includes(authShell, 'markSize="sm"', "AuthShell uses the canonical shared mark at the restrained size");
includes(authShell, 'nameClassName="auth-brand__name"', "AuthShell exposes the canonical name for scoped styling");
includes(dashboardShell, 'className="dashboard-brand" markSize="sm"', "DashboardShell preserves its existing brand classes and mark size");
includes(notFound, "<PublicSecondaryShell", "not-found reaches BrandLockup through the approved shared shell");
const brandUsers = [...collectTsxFiles("app"), ...collectTsxFiles("components")]
  .filter((file) => file !== "components/BrandLockup.tsx" && readFileSync(join(rootDir, file), "utf8").includes("<BrandLockup"))
  .sort();
check(
  "BrandLockup is limited to the four approved surfaces",
  JSON.stringify(brandUsers) === JSON.stringify([
    "app/page.tsx",
    "components/AuthShell.tsx",
    "components/DashboardShell.tsx",
    "components/PublicSecondaryShell.tsx",
  ]),
  `Actual BrandLockup users: ${brandUsers.join(", ")}`,
);
check(
  "Superseded foundation files are absent",
  !existsSync(join(rootDir, "app", "styles", "visual-foundation.css")) &&
    !existsSync(join(rootDir, "components", "LevioBrand.tsx")),
);
check("Auth styles consume the shared foundation", auth.includes("--levio-"));
check("Legacy dashboard styles remain isolated from the shared foundation", !dashboard.includes("--levio-"));
check("Dashboard shell styles consume the shared foundation", dashboardShellCss.includes("--levio-"));

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
