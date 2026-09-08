import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

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

const modulePath = join(
  rootDir,
  "lib",
  "voice-transcription",
  "native-local-stt.client.ts",
);
const moduleSource = readFileSync(modulePath, "utf8");
const {
  NATIVE_LOCAL_STT_LANGUAGE,
  createNativeLocalSttAdapter,
} = require(modulePath);

const checks = [];
let providerOperations = 0;
let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Network access is forbidden in native local STT validation.");
};

function check(name, condition, detail = "") {
  checks.push({ detail, name, passed: Boolean(condition) });
}

function createRecognitionHarness({
  availability = ["available"],
  installResult = true,
  installThrows = false,
} = {}) {
  const availabilityQueue = [...availability];
  const availabilityOptions = [];
  const installOptions = [];
  const instances = [];
  let constructorCalls = 0;
  let installCalls = 0;

  class MockRecognition {
    static async available(options) {
      availabilityOptions.push(options);
      return availabilityQueue.length > 1
        ? availabilityQueue.shift()
        : availabilityQueue[0];
    }

    static async install(options) {
      installCalls += 1;
      installOptions.push(options);
      if (installThrows) {
        throw new Error("vendor-install-detail");
      }
      return installResult;
    }

    constructor() {
      constructorCalls += 1;
      this.abortCalls = 0;
      this.continuous = true;
      this.interimResults = false;
      this.lang = "";
      this.maxAlternatives = 0;
      this.onend = null;
      this.onerror = null;
      this.onresult = null;
      this.startCalls = 0;
      instances.push(this);
    }

    abort() {
      this.abortCalls += 1;
    }

    start() {
      this.startCalls += 1;
    }

    emitEnd() {
      this.onend?.();
    }

    emitError(error) {
      this.onerror?.({ error });
    }

    emitResults(results, resultIndex = 0) {
      this.onresult?.({ resultIndex, results });
    }
  }

  Object.defineProperty(MockRecognition.prototype, "processLocally", {
    configurable: true,
    value: false,
    writable: true,
  });

  return {
    availabilityOptions,
    get constructorCalls() {
      return constructorCalls;
    },
    get installCalls() {
      return installCalls;
    },
    installOptions,
    instances,
    Recognition: MockRecognition,
  };
}

try {
  check("Spanish locale is fixed to es-ES", NATIVE_LOCAL_STT_LANGUAGE === "es-ES");

  let remoteConstructorCalls = 0;
  class RemoteOnlyRecognition {
    static async available() {
      throw new Error("Remote-only availability must not be queried.");
    }

    static async install() {
      throw new Error("Remote-only install must not be queried.");
    }

    constructor() {
      remoteConstructorCalls += 1;
    }
  }
  const unsupportedAdapter = createNativeLocalSttAdapter({
    recognition: RemoteOnlyRecognition,
    supportsDictationQuality: false,
  });
  const unsupported = await unsupportedAdapter.checkAvailability();
  check(
    "Browser without processLocally fails closed as unsupported",
    unsupported.state === "unsupported" &&
      unsupported.reason === "unsupported" &&
      unsupported.localOnly === true,
  );
  check(
    "Remote-only SpeechRecognition is never instantiated",
    remoteConstructorCalls === 0 && unsupportedAdapter.createSession().status === "failed",
  );

  const availableHarness = createRecognitionHarness();
  const availableAdapter = createNativeLocalSttAdapter({
    recognition: availableHarness.Recognition,
    supportsDictationQuality: true,
  });
  const available = await availableAdapter.checkAvailability();
  check(
    "Available Spanish pack makes the local adapter usable",
    available.state === "available" && available.reason === null,
  );
  check(
    "Availability is scoped to local Spanish dictation",
    JSON.stringify(availableHarness.availabilityOptions[0]) ===
      JSON.stringify({ langs: ["es-ES"], processLocally: true, quality: "dictation" }),
  );

  const downloadableHarness = createRecognitionHarness({
    availability: ["downloadable", "available"],
  });
  const downloadableAdapter = createNativeLocalSttAdapter({
    recognition: downloadableHarness.Recognition,
    supportsDictationQuality: false,
  });
  const installed = await downloadableAdapter.installLanguagePack();
  check(
    "Downloadable Spanish pack installs and is rechecked",
    downloadableHarness.installCalls === 1 &&
      downloadableHarness.availabilityOptions.length === 2 &&
      installed.state === "available",
  );
  check(
    "Install remains local-only and omits unproven quality",
    JSON.stringify(downloadableHarness.installOptions[0]) ===
      JSON.stringify({ langs: ["es-ES"], processLocally: true }),
  );

  const failedInstallHarness = createRecognitionHarness({
    availability: ["downloadable"],
    installResult: false,
  });
  const failedInstall = await createNativeLocalSttAdapter({
    recognition: failedInstallHarness.Recognition,
    supportsDictationQuality: false,
  }).installLanguagePack();
  check(
    "Language-pack installation failure is bounded",
    failedInstall.state === "error" &&
      failedInstall.reason === "language_pack_install_failed",
  );

  const unavailableHarness = createRecognitionHarness({ availability: ["unavailable"] });
  const unavailableAdapter = createNativeLocalSttAdapter({
    recognition: unavailableHarness.Recognition,
    supportsDictationQuality: false,
  });
  const unavailable = await unavailableAdapter.installLanguagePack();
  check(
    "Unavailable Spanish fails locally without installation or fallback",
    unavailable.state === "unavailable" &&
      unavailable.reason === "language_pack_unavailable" &&
      unavailableHarness.installCalls === 0 &&
      unavailableAdapter.createSession().status === "failed",
  );

  const downloadingHarness = createRecognitionHarness({ availability: ["downloading"] });
  const downloading = await createNativeLocalSttAdapter({
    recognition: downloadingHarness.Recognition,
    supportsDictationQuality: false,
  }).installLanguagePack();
  check(
    "Browser-managed download remains a deterministic downloading state",
    downloading.state === "downloading" && downloadingHarness.installCalls === 0,
  );

  const invalidAvailabilityHarness = createRecognitionHarness({ availability: ["vendor-state"] });
  const invalidAvailability = await createNativeLocalSttAdapter({
    recognition: invalidAvailabilityHarness.Recognition,
    supportsDictationQuality: false,
  }).checkAvailability();
  check(
    "Unknown vendor availability fails closed as a bounded error",
    invalidAvailability.state === "error" &&
      invalidAvailability.reason === "recognition_failed",
  );

  const sessionHarness = createRecognitionHarness();
  const sessionAdapter = createNativeLocalSttAdapter({
    recognition: sessionHarness.Recognition,
    supportsDictationQuality: false,
  });
  await sessionAdapter.checkAvailability();
  const sessionCreation = sessionAdapter.createSession();
  check("Available adapter creates a bounded session", sessionCreation.status === "ready");
  if (sessionCreation.status === "ready") {
    const sessionResultPromise = sessionCreation.session.start();
    const recognition = sessionHarness.instances[0];
    check(
      "Session enforces local Spanish recognition",
      recognition.processLocally === true &&
        recognition.lang === "es-ES" &&
        recognition.continuous === false &&
        recognition.interimResults === true &&
        recognition.maxAlternatives === 1 &&
        recognition.startCalls === 1,
    );
    recognition.emitResults([
      { 0: { transcript: "texto provisional" }, isFinal: false },
      { 0: { transcript: "Texto final confirmado." }, isFinal: true },
    ]);
    recognition.emitEnd();
    const sessionResult = await sessionResultPromise;
    check(
      "Interim transcript is isolated and final transcript is returned",
      sessionResult.status === "completed" &&
        sessionResult.transcript === "Texto final confirmado." &&
        !sessionResult.transcript.includes("provisional"),
    );
  }

  const cancelHarness = createRecognitionHarness();
  const cancelAdapter = createNativeLocalSttAdapter({
    recognition: cancelHarness.Recognition,
    supportsDictationQuality: false,
  });
  await cancelAdapter.checkAvailability();
  const cancelledCreation = cancelAdapter.createSession();
  check("Cancelable local session is created", cancelledCreation.status === "ready");
  if (cancelledCreation.status === "ready") {
    const cancelledResultPromise = cancelledCreation.session.start();
    const cancelledRecognition = cancelHarness.instances[0];
    cancelledCreation.session.abort();
    cancelledRecognition.emitResults([
      { 0: { transcript: "Resultado obsoleto" }, isFinal: true },
    ]);
    cancelledRecognition.emitEnd();
    const cancelledResult = await cancelledResultPromise;
    check(
      "Abort settles once and rejects stale results",
      cancelledRecognition.abortCalls === 1 &&
        cancelledResult.status === "failed" &&
        cancelledResult.reason === "aborted" &&
        cancelledResult.transcript === null,
    );

    const nextCreation = cancelAdapter.createSession();
    check("A cancelled session cannot poison the next session", nextCreation.status === "ready");
    if (nextCreation.status === "ready") {
      const nextResultPromise = nextCreation.session.start();
      const nextRecognition = cancelHarness.instances[1];
      nextRecognition.emitResults([
        { 0: { transcript: "Nueva sesión limpia." }, isFinal: true },
      ]);
      nextRecognition.emitEnd();
      const nextResult = await nextResultPromise;
      check(
        "Next session returns only its own final transcript",
        nextResult.status === "completed" && nextResult.transcript === "Nueva sesión limpia.",
      );
    }
  }

  const errorHarness = createRecognitionHarness();
  const errorAdapter = createNativeLocalSttAdapter({
    recognition: errorHarness.Recognition,
    supportsDictationQuality: false,
  });
  await errorAdapter.checkAvailability();
  const errorCreation = errorAdapter.createSession();
  check("Error-normalization session is created", errorCreation.status === "ready");
  if (errorCreation.status === "ready") {
    const errorResultPromise = errorCreation.session.start();
    errorHarness.instances[0].emitError("not-allowed");
    const errorResult = await errorResultPromise;
    check(
      "Vendor permission error is normalized without message leakage",
      errorResult.status === "failed" && errorResult.reason === "permission_denied",
    );
  }

  check(
    "Native adapter contains no network or provider fallback",
    fetchCalls === 0 &&
      !moduleSource.includes("fetch(") &&
      !moduleSource.includes("/api/transcribe") &&
      !moduleSource.includes("OpenAI") &&
      !moduleSource.includes("webkitSpeechRecognition"),
  );
} finally {
  globalThis.fetch = originalFetch;
}

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) {
    console.log(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nNative local STT adapter gate: ${checks.length - failed.length}/${checks.length} passed.`);
console.log(
  `LEVIO_NATIVE_LOCAL_STT_PROVIDER_OPERATION_EVIDENCE ${JSON.stringify({
    transcription: providerOperations,
    total: providerOperations,
  })}`,
);
if (failed.length > 0) {
  process.exitCode = 1;
}
