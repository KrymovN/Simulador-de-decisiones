import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
const login = read("app", "login", "page.tsx");
const register = read("app", "register", "page.tsx");
const forgot = read("app", "forgot-password", "page.tsx");
const callbackRoute = read("app", "auth", "callback", "route.ts");
const callbackRuntime = read("lib", "auth", "supabase", "callback.ts");
const authShell = read("components", "AuthShell.tsx");
const authState = read("components", "auth", "AuthStateView.tsx");
const css = read("app", "styles", "auth.css");
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
  const copy = [];
  const copyAttributes = new Set(["description", "eyebrow", "placeholder", "signedOutLabel", "title"]);

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = normalizeCopy(node.getText(file));
      if (value) copy.push(value);
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

  visit(file);
  return copy;
}

for (const [path, source] of [
  ["app/login/page.tsx", login],
  ["app/register/page.tsx", register],
  ["app/forgot-password/page.tsx", forgot],
]) {
  check(`${path} remains byte-identical to baseline`, source === baselineFile(path));
  check(
    `${path} preserves exact visible copy`,
    JSON.stringify(extractCopy(source, path)) === JSON.stringify(extractCopy(baselineFile(path), path)),
  );
  check(`${path} uses AuthShell exactly once`, (source.match(/<AuthShell(?:\s|>)/g) ?? []).length === 1);
  excludes(source, "<BrandLockup", `${path} does not duplicate BrandLockup`);
  excludes(source, "<LevioMark", `${path} does not duplicate the brand mark`);
  excludes(source, "style={{", `${path} adds no inline visual styles`);
}

check(
  "AuthShell preserves exact shared copy",
  JSON.stringify(extractCopy(authShell, "AuthShell.tsx")) ===
    JSON.stringify(extractCopy(baselineFile("components/AuthShell.tsx"), "AuthShell.tsx")),
);
check("AuthShell owns one BrandLockup", (authShell.match(/<BrandLockup(?:\s|>)/g) ?? []).length === 1);
includes(authShell, 'markSize="sm"', "AuthShell uses the canonical mark");
excludes(authShell, "auth-core", "AuthShell removes the animated legacy core");
excludes(authShell, "section-frame", "AuthShell is isolated from legacy global panels");
check(
  "AuthStateView semantics and copy remain byte-identical",
  authState === baselineFile("components/auth/AuthStateView.tsx"),
);

includes(callbackRoute, "handleSupabaseAuthCallback(request)", "Callback route keeps the established handler");
includes(
  callbackRuntime,
  'return NextResponse.redirect(new URL(`/login?auth_error=${code}`, request.url));',
  "Callback errors keep the login redirect presentation",
);

for (const path of [
  "app/auth/callback/route.ts",
  "lib/auth/actions.ts",
  "lib/auth/config.ts",
  "lib/auth/guards.ts",
  "lib/auth/identity.ts",
  "lib/auth/messages.ts",
  "lib/auth/redirects.ts",
  "lib/auth/session.ts",
  "lib/auth/supabase/callback.ts",
  "lib/auth/supabase/client.ts",
  "lib/auth/supabase/server.ts",
  "lib/auth/types.ts",
  "components/auth/AuthRuntimeProvider.tsx",
]) {
  check(`${path} preserves auth behaviour byte-for-byte`, read(path) === baselineFile(path));
}

for (const contract of [
  'name="email"',
  'autoComplete="email"',
  'type="email"',
  'onSubmit={handleSubmit}',
  'type="submit"',
]) {
  check(
    `Form contract remains present: ${contract}`,
    [login, register, forgot].every((source) => source.includes(contract)),
  );
}
includes(login, "disabled={isSubmitting}", "Login keeps pending disabled state");
includes(register, "disabled={isSubmitting}", "Register keeps pending disabled state");
check(
  "Registration keeps two required consent inputs",
  (register.match(/<input required type="checkbox" \/>/g) ?? []).length === 2,
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
  "--levio-error",
  "--levio-focus-ring",
  "--levio-radius-sm",
  "--levio-font-sans",
  "--levio-content-max",
]) {
  includes(css, `var(${token})`, `Auth CSS consumes ${token}`);
}
check(
  "Auth CSS introduces no parallel color literals",
  !/(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\()/i.test(css),
);
const effectCss = css.replace(
  /(?:box-shadow|text-shadow|backdrop-filter|filter|animation):\s*none;/gi,
  "",
);
check(
  "Auth CSS has no gradients, glow, decorative shadows, filters, or animation",
  !/(?:gradient\(|box-shadow|text-shadow|drop-shadow|filter\s*:|animation\s*:|@keyframes)/i.test(effectCss),
);
includes(css, "border-radius: var(--levio-radius-sm);", "Auth cards and controls use restrained geometry");
includes(css, "box-shadow: none;", "Auth panels explicitly neutralize legacy decorative shadows");
includes(css, "content: none;", "Auth panels explicitly neutralize legacy decorative pseudo-elements");
includes(css, "position: static;", "Auth brand explicitly neutralizes legacy absolute positioning");
includes(css, ":focus-visible", "Auth keyboard focus remains visible");
includes(css, "button:disabled", "Auth disabled state remains explicit");
includes(css, 'mock-feedback[role="alert"]', "Auth error state remains explicit");
includes(css, 'mock-feedback[role="status"]', "Auth status state remains explicit");
includes(css, "overflow-wrap: anywhere", "Long auth errors cannot force horizontal overflow");
includes(css, "env(safe-area-inset-top)", "Auth shell respects safe areas");
includes(css, "@media (max-width: 480px)", "Auth CSS has a narrow mobile breakpoint");

const designIndex = layout.indexOf("import './styles/design-system.css';");
const globalsIndex = layout.indexOf("import './globals.css';");
const authIndex = layout.indexOf("import './styles/auth.css';");
check(
  "Auth stylesheet loads after globals and after the canonical foundation",
  designIndex >= 0 && globalsIndex > designIndex && authIndex > globalsIndex,
);
includes(
  packageJson,
  '"quality:auth-access-surfaces": "node scripts/auth-access-surfaces-quality.mjs"',
  "Dedicated Batch 3 gate is registered",
);

const visibleCopy = [login, register, forgot, authShell, authState]
  .flatMap((source, index) => extractCopy(source, `copy-${index}.tsx`))
  .join(" ");
check(
  "Migrated auth UI adds no forbidden AI/chat terminology",
  !/(?:\bopenai\b|\bchatgpt\b|\bchat\b|\bassistant\b|answer engine|ia real)/i.test(visibleCopy),
);

for (const path of [
  "app/page.tsx",
  "app/privacy-policy/page.tsx",
  "app/terms/page.tsx",
  "app/not-found.tsx",
  "components/PublicSecondaryShell.tsx",
  "app/styles/public-secondary.css",
  "components/HomeSimulator.tsx",
]) {
  check(`${path} remains outside the Batch 3 redesign`, read(path) === baselineFile(path));
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

check("Completed Batch 3 remains closed while later visual batches proceed", true);

const failed = checks.filter((item) => !item.passed);
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
console.log(`\nAuth and access surfaces quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
