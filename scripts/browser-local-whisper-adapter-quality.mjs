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

const protocolPath = join(
  rootDir,
  "lib",
  "voice-transcription",
  "browser-local-whisper.protocol.ts",
);
const corePath = join(
  rootDir,
  "lib",
  "voice-transcription",
  "browser-local-whisper-core.client.ts",
);
const clientPath = join(
  rootDir,
  "lib",
  "voice-transcription",
  "browser-local-whisper.client.ts",
);
const workerPath = join(
  rootDir,
  "lib",
  "voice-transcription",
  "browser-local-whisper.worker.ts",
);
const packagePath = join(rootDir, "package.json");
const packageLockPath = join(rootDir, "package-lock.json");
const clientSource = readFileSync(clientPath, "utf8");
const coreSource = readFileSync(corePath, "utf8");
const workerSource = readFileSync(workerPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const packageLock = JSON.parse(readFileSync(packageLockPath, "utf8"));
const {
  BROWSER_LOCAL_WHISPER_DTYPE,
  BROWSER_LOCAL_WHISPER_ESTIMATED_ASSET_BYTES,
  BROWSER_LOCAL_WHISPER_MODEL_ID,
  BROWSER_LOCAL_WHISPER_MODEL_REVISION,
  BROWSER_LOCAL_WHISPER_ONNX_RUNTIME_VERSION,
  BROWSER_LOCAL_WHISPER_SAMPLE_RATE,
  BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION,
  isAllowedWhisperAssetRequest,
  resolveWhisperAssetRequest,
} = require(protocolPath);
const {
  createBrowserLocalWhisperAdapter,
  preprocessBrowserLocalWhisperAudio,
} = require(corePath);

const checks = [];
let providerOperations = 0;
let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Network access is forbidden in deterministic local Whisper validation.");
};

function check(name, condition, detail = "") {
  checks.push({ detail, name, passed: Boolean(condition) });
}

function createAudioContextHarness({
  channels = [new Float32Array([0.2, 0.4, 0.6, 0.8])],
  sampleRate = BROWSER_LOCAL_WHISPER_SAMPLE_RATE,
} = {}) {
  let closeCalls = 0;
  let decodeCalls = 0;
  const contexts = [];
  return {
    createAudioContext() {
      const context = {
        async close() {
          closeCalls += 1;
        },
        async decodeAudioData(audioData) {
          decodeCalls += 1;
          if (!(audioData instanceof ArrayBuffer) || audioData.byteLength === 0) {
            throw new Error("Expected encoded audio bytes.");
          }
          return {
            getChannelData(index) {
              return channels[index];
            },
            length: channels[0].length,
            numberOfChannels: channels.length,
            sampleRate,
          };
        },
      };
      contexts.push(context);
      return context;
    },
    contexts,
    get closeCalls() {
      return closeCalls;
    },
    get decodeCalls() {
      return decodeCalls;
    },
  };
}

function createWorkerHarness({ initializationFailure = null } = {}) {
  const instances = [];

  class MockWorker {
    constructor() {
      this.messages = [];
      this.onerror = null;
      this.onmessage = null;
      this.terminated = false;
      this.transfers = [];
      instances.push(this);
    }

    postMessage(message, transfer = []) {
      this.messages.push(message);
      this.transfers.push(transfer);
      if (message.type === "initialize") {
        this.emit(initializationFailure
          ? {
              reason: initializationFailure,
              requestId: message.requestId,
              type: "failed",
            }
          : {
              backend: message.backend,
              requestId: message.requestId,
              type: "initialized",
            });
      }
      if (message.type === "dispose") {
        this.emit({ requestId: message.requestId, type: "disposed" });
      }
    }

    emit(data) {
      this.onmessage?.({ data });
    }

    terminate() {
      this.terminated = true;
    }
  }

  return {
    createWorker: () => new MockWorker(),
    instances,
  };
}

function environment({
  audio = createAudioContextHarness(),
  hasWebAssembly = true,
  hasWebGpu = false,
  workers = createWorkerHarness(),
} = {}) {
  return {
    audio,
    adapterEnvironment: {
      createAudioContext: () => audio.createAudioContext(),
      createWorker: () => workers.createWorker(),
      hasWebAssembly,
      hasWebGpu,
    },
    workers,
  };
}

async function startSession(adapter, worker, blob = new Blob(
  [new Uint8Array([1, 2, 3, 4])],
  { type: "audio/webm" },
)) {
  const messageStart = worker.messages.length;
  const creation = adapter.createSession(blob);
  if (creation.status !== "ready") {
    return { creation, generation: null, promise: null };
  }
  const promise = creation.session.start();
  let request;
  for (let attempt = 0; attempt < 20 && !request; attempt += 1) {
    await Promise.resolve();
    request = worker.messages
      .slice(messageStart)
      .find((message) => message.type === "transcribe");
  }
  return {
    creation,
    generation: request?.generation ?? null,
    promise,
    request,
  };
}

try {
  check(
    "Runtime and multilingual model are immutable-pinned",
    BROWSER_LOCAL_WHISPER_MODEL_ID === "onnx-community/whisper-base" &&
      !BROWSER_LOCAL_WHISPER_MODEL_ID.endsWith(".en") &&
      BROWSER_LOCAL_WHISPER_MODEL_REVISION ===
        "1846881b6b3a3024392c1eea3ad983695bc23925" &&
      BROWSER_LOCAL_WHISPER_DTYPE === "q4" &&
      BROWSER_LOCAL_WHISPER_ESTIMATED_ASSET_BYTES === 145_144_432 &&
      packageJson.dependencies["@huggingface/transformers"] ===
        BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION &&
      packageLock.packages["node_modules/onnxruntime-web"].version ===
        BROWSER_LOCAL_WHISPER_ONNX_RUNTIME_VERSION,
  );

  const webGpu = environment({ hasWebGpu: true });
  const webGpuCapability = createBrowserLocalWhisperAdapter(
    webGpu.adapterEnvironment,
  ).checkCapability();
  check(
    "WebGPU capability is preferred",
    webGpuCapability.state === "ready" &&
      webGpuCapability.backend === "webgpu" &&
      webGpuCapability.localOnly === true,
  );

  const wasm = environment({ hasWebGpu: false, hasWebAssembly: true });
  const wasmCapability = createBrowserLocalWhisperAdapter(
    wasm.adapterEnvironment,
  ).checkCapability();
  check(
    "WASM is selected when WebGPU is unavailable",
    wasmCapability.state === "ready" && wasmCapability.backend === "wasm",
  );

  const unsupported = createBrowserLocalWhisperAdapter({
    createAudioContext: null,
    createWorker: null,
    hasWebAssembly: false,
    hasWebGpu: false,
  });
  check(
    "Missing worker, decoder, and execution backends fail closed",
    unsupported.checkCapability().state === "unsupported" &&
      (await unsupported.initialize()).reason === "unsupported",
  );

  const initialization = environment({ hasWebGpu: true });
  const initializationAdapter = createBrowserLocalWhisperAdapter(
    initialization.adapterEnvironment,
  );
  const initializationResult = await initializationAdapter.initialize();
  const initializationWorker = initialization.workers.instances[0];
  const initializationMessage = initializationWorker.messages[0];
  check(
    "Worker initializes the pinned local model on the selected backend",
    initializationAdapter.getState() === "ready" &&
      initializationResult.state === "ready" &&
      initializationResult.backend === "webgpu" &&
      initializationMessage.type === "initialize" &&
      initializationMessage.model === BROWSER_LOCAL_WHISPER_MODEL_ID &&
      initializationMessage.revision === BROWSER_LOCAL_WHISPER_MODEL_REVISION &&
      initializationMessage.dtype === BROWSER_LOCAL_WHISPER_DTYPE,
  );

  const failedWorkers = createWorkerHarness({
    initializationFailure: "model_load_failed",
  });
  const failedInitialization = environment({ workers: failedWorkers });
  const failedInitializationAdapter = createBrowserLocalWhisperAdapter(
    failedInitialization.adapterEnvironment,
  );
  const failedInitializationResult = await failedInitializationAdapter.initialize();
  check(
    "Model load failure is normalized without vendor detail",
    failedInitializationResult.state === "failed" &&
      failedInitializationResult.reason === "model_load_failed" &&
      failedInitializationAdapter.getState() === "model_load_failed",
  );

  const resampleAudio = createAudioContextHarness({
    channels: [
      new Float32Array([1, 0.8, 0.6, 0.4, 0.2, 0]),
      new Float32Array([0, 0.2, 0.4, 0.6, 0.8, 1]),
    ],
    sampleRate: 48_000,
  });
  const resampled = await preprocessBrowserLocalWhisperAudio(
    new Blob([new Uint8Array([9, 8, 7])], { type: "audio/webm" }),
    () => resampleAudio.createAudioContext(),
  );
  check(
    "Valid Blob is decoded, downmixed to mono, and resampled to 16 kHz",
    resampleAudio.decodeCalls === 1 &&
      resampleAudio.closeCalls === 1 &&
      resampled.length === 2 &&
      Math.abs(resampled[0] - 0.5) < 0.0001 &&
      Math.abs(resampled[1] - 0.5) < 0.0001,
  );
  resampled.fill(0);

  const local = environment();
  const localAdapter = createBrowserLocalWhisperAdapter(local.adapterEnvironment);
  await localAdapter.initialize();
  const localWorker = local.workers.instances[0];
  const localSession = await startSession(localAdapter, localWorker);
  check(
    "One active transcription owns a transferable 16 kHz local audio buffer",
    localSession.creation.status === "ready" &&
      localAdapter.getState() === "transcribing" &&
      localSession.request?.sampleRate === BROWSER_LOCAL_WHISPER_SAMPLE_RATE &&
      localSession.request?.language === "spanish" &&
      localWorker.transfers.at(-1)?.length === 1 &&
      localAdapter.createSession(new Blob(["second"], { type: "audio/webm" })).reason ===
        "resource_unavailable",
  );
  localWorker.emit({
    generation: localSession.generation,
    transcript: "  Quiero mantener ingresos estables.  ",
    type: "transcribed",
  });
  const localResult = await localSession.promise;
  check(
    "Local worker transcript returns through the bounded adapter result",
    localResult.status === "completed" &&
      localResult.transcript === "Quiero mantener ingresos estables." &&
      localAdapter.getState() === "ready",
  );

  const abortSession = await startSession(localAdapter, localWorker);
  abortSession.creation.session.abort();
  const abortedResult = await abortSession.promise;
  localWorker.emit({
    generation: abortSession.generation,
    transcript: "Resultado obsoleto",
    type: "transcribed",
  });
  check(
    "Abort returns a bounded result and ignores stale worker output",
    abortedResult.status === "failed" &&
      abortedResult.reason === "aborted" &&
      abortedResult.transcript === null &&
      localAdapter.getState() === "aborted" &&
      localWorker.messages.some((message) =>
        message.type === "abort" && message.generation === abortSession.generation
      ),
  );

  const nextSession = await startSession(localAdapter, localWorker);
  localWorker.emit({
    generation: nextSession.generation,
    transcript: "Nueva sesión aislada.",
    type: "transcribed",
  });
  const nextResult = await nextSession.promise;
  check(
    "Session after abort is isolated from the stale generation",
    nextSession.generation !== abortSession.generation &&
      nextResult.status === "completed" &&
      nextResult.transcript === "Nueva sesión aislada.",
  );

  const closeCallsBeforeDispose = local.audio.closeCalls;
  await localAdapter.dispose();
  check(
    "Audio contexts close and worker disposal terminates local resources",
    closeCallsBeforeDispose === 3 &&
      localWorker.messages.some((message) => message.type === "dispose") &&
      localWorker.terminated === true &&
      localAdapter.getState() === "resource_unavailable" &&
      localAdapter.checkCapability().state === "unsupported",
  );

  const applicationOrigin = "https://levio.es";
  const pinnedModelAsset =
    `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/` +
    `${BROWSER_LOCAL_WHISPER_MODEL_REVISION}/onnx/encoder_model_q4.onnx`;
  check(
    "Network guard allows only version-pinned static runtime/model GETs",
    isAllowedWhisperAssetRequest(pinnedModelAsset, "GET", applicationOrigin) &&
      isAllowedWhisperAssetRequest(
        `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION}/dist/ort-wasm-simd-threaded.wasm`,
        "GET",
        applicationOrigin,
      ) &&
      !isAllowedWhisperAssetRequest(
        `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/main/config.json`,
        "GET",
        applicationOrigin,
      ) &&
      !isAllowedWhisperAssetRequest("https://api.openai.com/v1/audio/transcriptions", "POST", applicationOrigin) &&
      !isAllowedWhisperAssetRequest("https://api-inference.huggingface.co/models/whisper", "POST", applicationOrigin) &&
      !isAllowedWhisperAssetRequest("/api/transcribe", "POST", applicationOrigin),
  );
  check(
    "Adapter path performs no remote audio transcription or provider fallback",
    fetchCalls === 0 &&
      providerOperations === 0 &&
      !clientSource.includes("/api/transcribe") &&
      !coreSource.includes("/api/transcribe") &&
      !workerSource.includes("/api/transcribe") &&
      !workerSource.includes("api.openai.com") &&
      !workerSource.includes("api-inference.huggingface.co") &&
      workerSource.includes("resolveWhisperAssetRequest") &&
      workerSource.includes("language: BROWSER_LOCAL_WHISPER_LANGUAGE") &&
      workerSource.includes('task: "transcribe"') &&
      !workerSource.includes("return_timestamps: true") &&
      resolveWhisperAssetRequest(
        `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/main/config.json`,
        "GET",
        applicationOrigin,
      )?.url.includes(`/resolve/${BROWSER_LOCAL_WHISPER_MODEL_REVISION}/config.json`) &&
      workerSource.includes("audio.fill(0)"),
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
console.log(`\nBrowser-local Whisper adapter gate: ${checks.length - failed.length}/${checks.length} passed.`);
console.log(
  `LEVIO_BROWSER_LOCAL_WHISPER_PROVIDER_OPERATION_EVIDENCE ${JSON.stringify({
    transcription: providerOperations,
    total: providerOperations,
  })}`,
);
if (failed.length > 0) {
  process.exitCode = 1;
}
