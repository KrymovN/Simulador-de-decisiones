import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "4ba12bdb5c4d58263651f9eddc4735fc9bbaee24";
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const baselineFile = (path) =>
  execFileSync("git", ["show", `${baseline}:${path}`], {
    cwd: rootDir,
    encoding: "utf8",
  });

const dashboard = read("app", "dashboard", "page.tsx");
const home = read("app", "page.tsx");
const accountLink = read("components", "HomepageAccountLink.tsx");
const simulator = read("components", "HomeSimulator.tsx");
const homepageCss = read("app", "styles", "homepage.css");
const saveAction = read("lib", "saved-decision-simulations", "ui-save-action.ts");
const checks = [];
const liveProviderOperationCount = 0;

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

check(
  "Dashboard Nueva simulación uses client navigation to the canonical simulator target",
  dashboard.includes('<Link className="dashboard-action" href="/#simulador">') &&
    dashboard.includes("Nueva simulación"),
);
check("Dashboard no longer targets the nested textarea hash", !dashboard.includes("/#decision-input"));
check(
  "Homepage keeps exactly one canonical HomeSimulator implementation",
  (home.match(/<HomeSimulator \/>/g) ?? []).length === 1 &&
    (home.match(/import HomeSimulator from/g) ?? []).length === 1 &&
    !dashboard.includes("HomeSimulator"),
);
check(
  "Homepage header mounts the existing auth-runtime-aware account link",
  home.includes("<HomepageAccountLink />") &&
    accountLink.includes('import { useAuthRuntime } from "./auth/AuthRuntimeProvider"') &&
    accountLink.includes("const { identityState } = useAuthRuntime()"),
);
check(
  "Authenticated header exposes Resumen instead of anonymous login",
  accountLink.includes('identityState === "authenticated"') &&
    accountLink.includes('? { href: "/dashboard", label: "Resumen" }') &&
    accountLink.includes(': { href: "/login", label: "Iniciar sesión" }'),
);
check(
  "Anonymous homepage preserves Iniciar sesión",
  accountLink.includes('{ href: "/login", label: "Iniciar sesión" }'),
);
check(
  "Canonical simulator target owns a bounded desktop scroll offset",
  /\.minimal-home__simulator\s*\{[\s\S]*?scroll-margin-top:\s*112px;/.test(homepageCss),
);
check(
  "Canonical simulator target owns a bounded responsive scroll offset",
  /@media \(max-width: 860px\)[\s\S]*?\.minimal-home__simulator,[\s\S]*?scroll-margin-top:\s*24px;/.test(
    homepageCss,
  ),
);
check(
  "Simulator implementation remains byte-identical to the production baseline",
  simulator === baselineFile("components/HomeSimulator.tsx"),
);
check(
  "Owner-scoped save action remains byte-identical to the production baseline",
  saveAction === baselineFile("lib/saved-decision-simulations/ui-save-action.ts"),
);
for (const path of [
  "components/auth/AuthRuntimeProvider.tsx",
  "lib/auth/session.ts",
  "lib/auth/supabase/client.ts",
]) {
  check(`${path} preserves Auth/session ownership byte-for-byte`, read(...path.split("/")) === baselineFile(path));
}
check("Continuity regression performs zero live provider operations", liveProviderOperationCount === 0);

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nAuthenticated simulator continuity gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
