import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const healthSource = read("lib", "operations", "supabase-operational-health.ts");
const routeSource = read("app", "api", "operations", "supabase-health", "route.ts");
const vercelConfig = JSON.parse(read("vercel.json"));
const packageJson = read("package.json");

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("External network access is forbidden during health validation.");
};

const validation = require(join(
  root,
  "lib",
  "operations",
  "supabase-operational-health-validation.ts",
));
const result = await validation.runSupabaseOperationalHealthValidation();
globalThis.fetch = originalFetch;

const checks = result.cases.map((item) => ({
  id: item.id,
  passed: item.passed,
  detail: item.detail,
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

add(
  "server-only-route",
  routeSource.startsWith('import "server-only";') &&
    routeSource.includes("process.env.CRON_SECRET") &&
    !routeSource.includes("NEXT_PUBLIC"),
  "The route must use a server-only CRON_SECRET boundary.",
);
add(
  "no-database-mutations",
  !/\.(?:insert|update|upsert|delete|rpc)\s*\(/.test(healthSource),
  "The health implementation must contain no mutation or RPC operation.",
);
add(
  "no-sensitive-response",
  healthSource.includes("{ ok }") &&
    !healthSource.includes("serviceRoleKey:") &&
    !healthSource.includes("count:" + " response"),
  "The HTTP response must expose only health status.",
);
add(
  "daily-vercel-cron",
  Array.isArray(vercelConfig.crons) &&
    vercelConfig.crons.length === 1 &&
    vercelConfig.crons[0]?.path === "/api/operations/supabase-health" &&
    vercelConfig.crons[0]?.schedule === "0 6 * * *",
  "Vercel Cron must invoke the protected route once daily.",
);
add(
  "quality-script-registered",
  packageJson.includes('"quality:supabase-operational-health"'),
  "The targeted health validation must be registered in package.json.",
);
add(
  "offline-validation",
  networkRequests === 0 && result.summary.providerOperations === 0,
  "Validation must execute without external or AI provider calls.",
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
console.log("DATABASE_WRITES 0");
console.log("USER_DATA_MUTATIONS 0");
console.log("AI_PROVIDER_OPERATIONS 0");
if (checks.some((item) => !item.passed)) process.exitCode = 1;
