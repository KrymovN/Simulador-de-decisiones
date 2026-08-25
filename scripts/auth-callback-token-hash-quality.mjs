import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const callbackPath = join(rootDir, "lib", "auth", "supabase", "callback.ts");
const redirectsPath = join(rootDir, "lib", "auth", "redirects.ts");
const messagesPath = join(rootDir, "lib", "auth", "messages.ts");
const serverClientPath = join(rootDir, "lib", "auth", "supabase", "server.ts");
const callbackSource = readFileSync(callbackPath, "utf8");
const redirectsSource = readFileSync(redirectsPath, "utf8");
const messagesSource = readFileSync(messagesPath, "utf8");
const serverClientSource = readFileSync(serverClientPath, "utf8");
const checks = [];

function assertCheck(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);

  if (!condition && detail) {
    console.error(`  ${detail}`);
  }
}

function transpile(source, filename) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
}

function loadCommonJs(source, filename, requireModule) {
  const module = { exports: {} };
  const script = new vm.Script(transpile(source, filename), { filename });
  const context = vm.createContext({
    URL,
    exports: module.exports,
    module,
    require: requireModule,
  });

  script.runInContext(context);
  return module.exports;
}

const redirects = loadCommonJs(redirectsSource, redirectsPath, () => {
  throw new Error("redirects.ts has no runtime imports");
});

class MockResponse {
  constructor(url) {
    this.status = 307;
    this.url = String(url);
    this.cookies = {
      values: new Map(),
      set: (name, value) => this.cookies.values.set(name, value),
    };
  }
}

let activeClientFactory = () => null;

const callbackModule = loadCommonJs(callbackSource, callbackPath, (specifier) => {
  if (specifier === "next/server") {
    return {
      NextResponse: {
        redirect(url) {
          return new MockResponse(url);
        },
      },
    };
  }

  if (specifier === "../redirects") {
    return redirects;
  }

  if (specifier === "./server") {
    return {
      createSupabaseRouteHandlerClient(request, response) {
        return activeClientFactory(request, response);
      },
    };
  }

  throw new Error(`Unexpected callback dependency: ${specifier}`);
});

const { handleSupabaseAuthCallback } = callbackModule;

function createRequest(query = "") {
  return { url: `https://levio.es/auth/callback${query}` };
}

function configureMockClient({ exchangeError = null, verifyError = null } = {}) {
  const calls = {
    clientResponses: [],
    exchangeCodes: [],
    verifyParams: [],
  };

  activeClientFactory = (_request, response) => {
    calls.clientResponses.push(response);

    return {
      auth: {
        async exchangeCodeForSession(code) {
          calls.exchangeCodes.push(code);

          if (!exchangeError) {
            response.cookies.set("sb-session", "pkce-session");
          }

          return { error: exchangeError };
        },
        async verifyOtp(params) {
          calls.verifyParams.push(params);

          if (!verifyError) {
            response.cookies.set("sb-session", "token-hash-session");
          }

          return { error: verifyError };
        },
      },
    };
  };

  return calls;
}

const pkceCalls = configureMockClient();
const pkceResponse = await handleSupabaseAuthCallback(createRequest("?code=pkce-secret&next=/dashboard"));

assertCheck(
  "valid PKCE code keeps the canonical exchange path",
  pkceCalls.exchangeCodes.length === 1 &&
    pkceCalls.exchangeCodes[0] === "pkce-secret" &&
    pkceCalls.verifyParams.length === 0 &&
    pkceResponse.url === "https://levio.es/dashboard",
);

const tokenHashCalls = configureMockClient();
const tokenHashResponse = await handleSupabaseAuthCallback(
  createRequest("?token_hash=token-hash-secret&type=email&next=/dashboard"),
);

assertCheck(
  "valid token_hash and email type call verifyOtp",
  tokenHashCalls.exchangeCodes.length === 0 &&
    tokenHashCalls.verifyParams.length === 1 &&
    tokenHashCalls.verifyParams[0].token_hash === "token-hash-secret" &&
    tokenHashCalls.verifyParams[0].type === "email" &&
    tokenHashResponse.url === "https://levio.es/dashboard",
);
assertCheck(
  "token-hash success uses the callback response cookie channel",
  pkceCalls.clientResponses.length === 1 &&
    pkceCalls.clientResponses[0] === pkceResponse &&
    pkceResponse.cookies.values.get("sb-session") === "pkce-session" &&
    tokenHashCalls.clientResponses.length === 1 &&
    tokenHashCalls.clientResponses[0] === tokenHashResponse &&
    tokenHashResponse.cookies.values.get("sb-session") === "token-hash-session" &&
    serverClientSource.includes("response.cookies.set(name, value, options)"),
);

const invalidTokenCalls = configureMockClient({ verifyError: { message: "Token has expired or is invalid" } });
const invalidTokenResponse = await handleSupabaseAuthCallback(
  createRequest("?token_hash=expired-token-secret&type=email&next=/dashboard"),
);

assertCheck(
  "invalid token hash produces a controlled Spanish auth failure code",
  invalidTokenCalls.verifyParams.length === 1 &&
    invalidTokenResponse.url === "https://levio.es/login?auth_error=callback_expired" &&
    messagesSource.includes('callback_expired: "El enlace de acceso ha caducado. Solicita uno nuevo."'),
);

const missingCalls = configureMockClient();
const missingResponse = await handleSupabaseAuthCallback(createRequest());

assertCheck(
  "missing callback parameters fail closed without creating a client",
  missingCalls.clientResponses.length === 0 &&
  missingResponse.url === "https://levio.es/login?auth_error=callback_missing_code",
);

const partialCalls = configureMockClient();
const partialResponse = await handleSupabaseAuthCallback(createRequest("?token_hash=token-hash-secret"));

assertCheck(
  "partial token-hash parameters fail closed",
  partialCalls.clientResponses.length === 0 &&
    partialResponse.url === "https://levio.es/login?auth_error=callback_invalid",
);

const unsupportedTypeCalls = configureMockClient();
const unsupportedTypeResponse = await handleSupabaseAuthCallback(
  createRequest("?token_hash=token-hash-secret&type=recovery&next=/dashboard"),
);

assertCheck(
  "token-hash callback accepts only the current email OTP type",
  unsupportedTypeCalls.verifyParams.length === 0 &&
    unsupportedTypeResponse.url === "https://levio.es/login?auth_error=callback_invalid",
);

const unsafeNextCalls = configureMockClient();
const unsafeNextResponse = await handleSupabaseAuthCallback(
  createRequest("?token_hash=token-hash-secret&type=email&next=https://attacker.example/steal"),
);

assertCheck(
  "unsafe next values cannot redirect externally",
  unsafeNextCalls.verifyParams.length === 1 && unsafeNextResponse.url === "https://levio.es/dashboard",
);
assertCheck(
  "token and code values are never surfaced in callback responses or logs",
  ![pkceResponse.url, tokenHashResponse.url, invalidTokenResponse.url, unsafeNextResponse.url].some(
    (value) => value.includes("pkce-secret") || value.includes("token-hash-secret") || value.includes("expired-token-secret"),
  ) &&
    !callbackSource.includes("console.") &&
    !callbackSource.includes("error_description=${"),
);

const failed = checks.filter((check) => !check.passed);

console.log(`\nAuth callback token-hash quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
