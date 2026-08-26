import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const startingHead = "921f432a9e2c08ecd5652ca834659fbe7e6a93ed";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const before = (path) => execFileSync(
  "git",
  ["show", `${startingHead}:${path}`],
  { cwd: root, encoding: "utf8" },
);

const pagePath = "app/dashboard/simulations/[id]/page.tsx";
const componentPath = "components/SavedSimulationsHistorySurface.tsx";
const cssPath = "app/styles/saved-records-surfaces.css";
const page = read(pagePath);
const component = read(componentPath);
const css = read(cssPath);
const productSurface = read("lib/saved-decision-simulations/product-surface.ts");
const designSystem = read("app/styles/design-system.css");
const route = read("app/api/simulate/route.ts");
const checks = [];

function add(id, passed, detail) {
  checks.push({ id, passed: Boolean(passed), detail });
}

const contentBlockIndex = component.indexOf('aria-label="Situación simulada"');
const resultBlockIndex = component.indexOf('className="simulation-detail-hero');
const inputExpression = "{simulation.userInputSummary}";

add(
  "stable-display-heading",
  page.includes('title="Simulación guardada"') &&
    !page.includes("state.simulation.title") &&
    !page.includes("title={title}"),
  "Saved detail must use the stable product title instead of persisted user content.",
);
add(
  "canonical-eyebrow-preserved",
  page.includes('eyebrow="levio.es / Simulación guardada"'),
  "Saved detail eyebrow changed.",
);
add(
  "full-original-input-rendered-once",
  component.includes('<p className="saved-records-input__content">{simulation.userInputSummary}</p>') &&
    component.split(inputExpression).length === 2 &&
    !component.includes("userInputSummary.slice(") &&
    !component.includes("userInputSummary.substring(") &&
    !component.includes("userInputSummary.substr("),
  "The complete mapped user input must render without truncation or summarization.",
);
add(
  "input-precedes-reopened-result",
  contentBlockIndex >= 0 && resultBlockIndex > contentBlockIndex,
  "Original input content block must precede the existing reopened result content.",
);
add(
  "user-input-not-used-as-heading",
  !component.includes("<h1>{simulation.") &&
    !component.includes("<h2>{simulation.title}</h2>") &&
    !component.includes(`<h2>${inputExpression}</h2>`),
  "User-generated input remains in a heading element.",
);
add(
  "body-typography-is-local-and-readable",
  css.includes(".saved-records-surface .saved-records-input__content") &&
    css.includes("font-size: 1rem;") &&
    css.includes("font-weight: 400;") &&
    css.includes("line-height: 1.7;") &&
    css.includes("max-width: 76ch;") &&
    css.includes("white-space: pre-wrap;") &&
    !css.includes(".saved-records-input__content {\n  font-size: clamp("),
  "User input must use local body/content typography.",
);
add(
  "desktop-mobile-overflow-protection",
  css.includes("min-width: 0;") &&
    css.includes("overflow-wrap: anywhere;") &&
    css.includes("overflow-x: clip;") &&
    css.includes("@media (max-width: 560px)"),
  "Saved input lacks bounded wrapping or responsive overflow protection.",
);
add(
  "persistence-and-reopen-contracts-unchanged",
  [
    "lib/saved-decision-simulations/runtime.ts",
    "lib/saved-decision-simulations/contracts.ts",
    "lib/persistence-runtime/simulation-record-persistence.ts",
    "lib/persistence-runtime/contracts.ts",
    "lib/persistence-runtime/supabase-provider.ts",
  ].every((path) => read(path) === before(path)) &&
    productSurface.includes(
      "userInputSummary: sentenceFromUserInput(simulation.simulationInput.userInputSnapshot)",
    ),
  "Saved/reopen/persistence contract files changed.",
);
add(
  "reopened-result-component-contract-preserved",
  component.includes("simulation.decisionSummary") &&
    component.includes("simulation.scenarios.map") &&
    component.includes("simulation.notices.map") &&
    component.includes("simulation.confidenceLabel") &&
    component.includes("simulation.riskLabel") &&
    component.includes("simulation.resultTypeLabel"),
  "Existing reopened result content was removed.",
);
add(
  "shared-display-typography-unchanged",
  designSystem === before("app/styles/design-system.css") &&
    designSystem.includes("--levio-display-heading-weight: 650;") &&
    designSystem.includes("--levio-display-heading-tracking: -0.015em;") &&
    designSystem.includes("--levio-display-heading-leading: 0.98;"),
  "Shared display typography tokens changed.",
);
add(
  "public-simulator-contract-unchanged",
  route === before("app/api/simulate/route.ts") && route.includes("mockOnly: true"),
  "Public simulator contract changed.",
);

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  pagePath,
  componentPath,
  cssPath,
  "scripts/saved-simulation-detail-hierarchy-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowed.has(path));
add(
  "exact-bounded-write-set",
  unexpected.length === 0,
  `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`,
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
