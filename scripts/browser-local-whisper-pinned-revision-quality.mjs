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
const {
  BROWSER_LOCAL_WHISPER_DTYPE,
  BROWSER_LOCAL_WHISPER_ESTIMATED_ASSET_BYTES,
  BROWSER_LOCAL_WHISPER_MODEL_ID,
  BROWSER_LOCAL_WHISPER_MODEL_REVISION,
  BROWSER_LOCAL_WHISPER_ONNX_RUNTIME_VERSION,
  BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION,
  isAllowedWhisperAssetRequest,
  resolveWhisperAssetRequest,
} = require(protocolPath);

const applicationOrigin = "https://levio.es";
const previousTinyModel = "onnx-community/whisper-tiny";
const previousTinyRevision = "ff4177021cc41f7db950912b73ea4fdf7d01d8e7";
const mutableBase =
  `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/main/`;
const pinnedBase =
  `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/` +
  `${BROWSER_LOCAL_WHISPER_MODEL_REVISION}/`;
const checks = [];

function check(name, condition) {
  checks.push({ name, passed: Boolean(condition) });
}

function resolvesMutableAssetToPinned(path) {
  const resolved = resolveWhisperAssetRequest(
    `${mutableBase}${path}`,
    "GET",
    applicationOrigin,
  );
  return resolved?.normalized === true &&
    resolved.url === `${pinnedBase}${path}` &&
    !resolved.url.includes("/resolve/main/") &&
    isAllowedWhisperAssetRequest(resolved.url, "GET", applicationOrigin);
}

check(
  "The active multilingual q4 contract is Whisper base at the approved revision",
  BROWSER_LOCAL_WHISPER_MODEL_ID === "onnx-community/whisper-base" &&
    !BROWSER_LOCAL_WHISPER_MODEL_ID.endsWith(".en") &&
    BROWSER_LOCAL_WHISPER_MODEL_REVISION ===
      "1846881b6b3a3024392c1eea3ad983695bc23925" &&
    BROWSER_LOCAL_WHISPER_DTYPE === "q4" &&
    BROWSER_LOCAL_WHISPER_ESTIMATED_ASSET_BYTES === 145_144_432,
);

check(
  "Preliminary config discovery resolves only to the immutable revision",
  resolvesMutableAssetToPinned("config.json"),
);

check(
  "Tokenizer and preprocessor discovery resolve only to the immutable revision",
  [
    "tokenizer.json",
    "tokenizer_config.json",
    "preprocessor_config.json",
    "generation_config.json",
  ].every(resolvesMutableAssetToPinned),
);

check(
  "q4 encoder and decoder paths resolve only to the immutable revision",
  [
    "onnx/encoder_model_q4.onnx",
    "onnx/decoder_model_merged_q4.onnx",
  ].every(resolvesMutableAssetToPinned),
);

check(
  "An already pinned model URL is allowed without changing its semantic target",
  (() => {
    const url = `${pinnedBase}config.json`;
    const resolved = resolveWhisperAssetRequest(url, "GET", applicationOrigin);
    return resolved?.normalized === false && resolved.url === url;
  })(),
);

check(
  "Every required pinned base q4 asset is allowed",
  [
    "config.json",
    "generation_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "preprocessor_config.json",
    "onnx/encoder_model_q4.onnx",
    "onnx/decoder_model_merged_q4.onnx",
  ].every((path) =>
    isAllowedWhisperAssetRequest(`${pinnedBase}${path}`, "GET", applicationOrigin)
  ),
);

check(
  "The previous tiny model is rejected for mutable and pinned asset requests",
  resolveWhisperAssetRequest(
    `https://huggingface.co/${previousTinyModel}/resolve/main/config.json`,
    "GET",
    applicationOrigin,
  ) === null &&
    resolveWhisperAssetRequest(
      `https://huggingface.co/${previousTinyModel}/resolve/${previousTinyRevision}/config.json`,
      "GET",
      applicationOrigin,
    ) === null,
);

check(
  "Arbitrary models and revisions remain rejected",
  resolveWhisperAssetRequest(
    `https://huggingface.co/other/model/resolve/main/config.json`,
    "GET",
    applicationOrigin,
  ) === null &&
    resolveWhisperAssetRequest(
      `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/master/config.json`,
      "GET",
      applicationOrigin,
    ) === null &&
    resolveWhisperAssetRequest(
      "https://huggingface.co/onnx-community/whisper-base.en/resolve/main/config.json",
      "GET",
      applicationOrigin,
    ) === null &&
    resolveWhisperAssetRequest(
      `https://huggingface.co/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/another-revision/config.json`,
      "GET",
      applicationOrigin,
    ) === null,
);

check(
  "Inference endpoints and provider endpoints remain rejected",
  resolveWhisperAssetRequest(
    `https://api-inference.huggingface.co/models/${BROWSER_LOCAL_WHISPER_MODEL_ID}`,
    "GET",
    applicationOrigin,
  ) === null &&
    resolveWhisperAssetRequest(
      "https://api.openai.com/v1/audio/transcriptions",
      "GET",
      applicationOrigin,
    ) === null &&
    resolveWhisperAssetRequest("/api/transcribe", "GET", applicationOrigin) === null,
);

check(
  "POST, PUT, and PATCH requests remain rejected",
  ["POST", "PUT", "PATCH"].every((method) =>
    resolveWhisperAssetRequest(
      `${mutableBase}config.json`,
      method,
      applicationOrigin,
    ) === null
  ),
);

check(
  "Only exact versioned runtime assets remain allowed",
  resolveWhisperAssetRequest(
    `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION}/dist/ort-wasm-simd-threaded.wasm`,
    "GET",
    applicationOrigin,
  )?.normalized === false &&
    resolveWhisperAssetRequest(
      `https://cdn.jsdelivr.net/npm/onnxruntime-web@${BROWSER_LOCAL_WHISPER_ONNX_RUNTIME_VERSION}/dist/ort-wasm-simd-threaded.wasm`,
      "GET",
      applicationOrigin,
    )?.normalized === false &&
    resolveWhisperAssetRequest(
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@latest/dist/ort-wasm-simd-threaded.wasm",
      "GET",
      applicationOrigin,
    ) === null,
);

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nPinned revision discovery gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
