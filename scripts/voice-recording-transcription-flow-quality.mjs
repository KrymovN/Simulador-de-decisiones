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

const {
  VOICE_MAX_AUDIO_BYTES,
  VOICE_MAX_RECORDING_MS,
  isVoiceTranscriptionApiResponse,
} = require(join(rootDir, "lib", "voice-transcription", "contracts.ts"));
const {
  createVoiceTranscriptionRequestHandler,
} = require(join(rootDir, "lib", "voice-transcription", "route-handler.ts"));
const {
  createPublicApiRateLimiter,
} = require(join(rootDir, "lib", "runtime-integration", "public-api-rate-limit.ts"));
const {
  appendVoiceTranscript,
  calculateVoiceAudioLevel,
  classifyMicrophoneError,
  formatVoiceRecordingTime,
  selectVoiceRecordingMimeType,
} = require(join(rootDir, "components", "home-simulator-voice.ts"));

const homeSimulator = readFileSync(join(rootDir, "components", "HomeSimulator.tsx"), "utf8");
const voiceHook = readFileSync(join(rootDir, "components", "use-home-simulator-voice.ts"), "utf8");
const voiceHelper = readFileSync(join(rootDir, "components", "home-simulator-voice.ts"), "utf8");
const route = readFileSync(join(rootDir, "app", "api", "transcribe", "route.ts"), "utf8");
const routeHandler = readFileSync(join(rootDir, "lib", "voice-transcription", "route-handler.ts"), "utf8");
const providerAdapter = readFileSync(
  join(rootDir, "lib", "voice-transcription", "openai-transcription-adapter.server.ts"),
  "utf8",
);
const simulatorCss = readFileSync(join(rootDir, "app", "styles", "simulator.css"), "utf8");
const homepage = readFileSync(join(rootDir, "app", "page.tsx"), "utf8");
const dashboard = readFileSync(join(rootDir, "app", "dashboard", "page.tsx"), "utf8");

const checks = [];
let providerOperations = 0;

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

function includes(source, value, name) {
  check(name, source.includes(value), `Expected source to include: ${value}`);
}

function excludes(source, value, name) {
  check(name, !source.includes(value), `Forbidden source value: ${value}`);
}

function testRateLimiter() {
  return createPublicApiRateLimiter({ maxBuckets: 20, maxRequests: 20, windowMs: 60_000 });
}

function audioRequest({
  bytes = new Uint8Array([1, 2, 3, 4]),
  fields,
  mimeType = "audio/webm",
  source = crypto.randomUUID(),
} = {}) {
  const formData = new FormData();
  formData.append("audio", new File([bytes], "untrusted-name.bin", { type: mimeType }));
  for (const [key, value] of fields ?? []) {
    formData.append(key, value);
  }
  return new Request("http://localhost/api/transcribe", {
    body: formData,
    headers: {
      "content-length": String(bytes.byteLength + 512),
      "x-forwarded-for": source,
    },
    method: "POST",
  });
}

async function responsePayload(response) {
  const payload = await response.json();
  check("Every route response satisfies the bounded public contract", isVoiceTranscriptionApiResponse(payload));
  return payload;
}

const syntheticTranscript = "Quiero cambiar de trabajo, pero necesito mantener unos ingresos estables.";
let transportCalls = 0;
const deterministicTransport = {
  async transcribe(input) {
    transportCalls += 1;
    check("Transport receives bounded Spanish audio", input.language === "es" && input.audio.size === 4);
    check("Transport receives a bounded abortable request", input.signal instanceof AbortSignal && input.timeoutMs === 25_000);
    return { transcript: syntheticTranscript };
  },
};

const successHandler = createVoiceTranscriptionRequestHandler({
  rateLimiter: testRateLimiter(),
  transport: deterministicTransport,
});
const successResponse = await successHandler(audioRequest());
const successPayload = await responsePayload(successResponse);
check(
  "Synthetic audio request reaches one deterministic transcription transport",
  successResponse.status === 200 && transportCalls === 1,
);
check(
  "Synthetic transcript returns through the endpoint contract",
  successPayload.status === "completed" && successPayload.data.transcript === syntheticTranscript,
);
check(
  "Transcript appends to the existing controlled input",
  appendVoiceTranscript("Texto existente.", successPayload.data.transcript, 1200) ===
    `Texto existente. ${syntheticTranscript}`,
);
check("Whitespace transcript cannot erase existing text", appendVoiceTranscript("Conservar", "   ", 1200) === "Conservar");

const quiet = new Uint8Array(32).fill(128);
const audible = new Uint8Array(32).fill(184);
check(
  "Synthetic analyser layer produces a real non-static level",
  calculateVoiceAudioLevel(quiet) === 0 && calculateVoiceAudioLevel(audible) > 0,
);
check(
  "MIME negotiation prefers a supported cross-browser candidate",
  selectVoiceRecordingMimeType((value) => value === "audio/mp4") === "audio/mp4",
);
check("Recording timer is bounded and formatted", formatVoiceRecordingTime(125.9) === "02:05");
check(
  "Permission denial and unavailable microphone are distinguished",
  classifyMicrophoneError({ name: "NotAllowedError" }) === "MIC_PERMISSION_DENIED" &&
    classifyMicrophoneError({ name: "NotFoundError" }) === "MIC_NOT_AVAILABLE",
);

const emptyHandler = createVoiceTranscriptionRequestHandler({
  rateLimiter: testRateLimiter(),
  transport: { transcribe: async () => ({ transcript: "   " }) },
});
const emptyPayload = await responsePayload(await emptyHandler(audioRequest()));
check(
  "Empty transcript fails closed with controlled semantics",
  emptyPayload.status === "failed" && emptyPayload.error.code === "empty_transcript",
);

const failureHandler = createVoiceTranscriptionRequestHandler({
  rateLimiter: testRateLimiter(),
  transport: { transcribe: async () => { throw new Error("internal-provider-detail"); } },
});
const failurePayload = await responsePayload(await failureHandler(audioRequest()));
check(
  "Transcription failure is controlled without internal error leakage",
  failurePayload.status === "failed" &&
    failurePayload.error.code === "transcription_failed" &&
    !JSON.stringify(failurePayload).includes("internal-provider-detail"),
);

const disabledHandler = createVoiceTranscriptionRequestHandler({
  rateLimiter: testRateLimiter(),
  transport: null,
});
const disabledPayload = await responsePayload(await disabledHandler(audioRequest()));
check(
  "Live transcription is default-deny when no server transport is configured",
  disabledPayload.status === "failed" && disabledPayload.error.code === "transcription_unavailable",
);

const invalidMimePayload = await responsePayload(
  await successHandler(audioRequest({ mimeType: "application/octet-stream" })),
);
check(
  "Non-audio upload is rejected before transport",
  invalidMimePayload.status === "failed" && invalidMimePayload.error.code === "unsupported_audio_type",
);

const emptyAudioPayload = await responsePayload(
  await successHandler(audioRequest({ bytes: new Uint8Array(0) })),
);
check(
  "Empty audio upload fails closed before transport",
  emptyAudioPayload.status === "failed" && emptyAudioPayload.error.code === "empty_audio",
);

const methodPayload = await responsePayload(
  await successHandler(new Request("http://localhost/api/transcribe", { method: "GET" })),
);
check(
  "Non-POST request fails closed with an Allow header",
  methodPayload.status === "failed" && methodPayload.error.code === "invalid_method",
);

const extraFieldPayload = await responsePayload(
  await successHandler(audioRequest({ fields: [["unexpected", "value"]] })),
);
check(
  "Unexpected multipart fields fail closed",
  extraFieldPayload.status === "failed" && extraFieldPayload.error.code === "invalid_payload",
);

const oversizedRequest = audioRequest();
oversizedRequest.headers.set("content-length", String(VOICE_MAX_AUDIO_BYTES + 64 * 1024 + 1));
const oversizedPayload = await responsePayload(await successHandler(oversizedRequest));
check(
  "Oversized request is rejected before multipart parsing",
  oversizedPayload.status === "failed" && oversizedPayload.error.code === "body_too_large",
);

let limitedTransportCalls = 0;
const oneRequestLimiter = createPublicApiRateLimiter({ maxBuckets: 20, maxRequests: 1, windowMs: 60_000 });
const limitedHandler = createVoiceTranscriptionRequestHandler({
  rateLimiter: oneRequestLimiter,
  transport: {
    transcribe: async () => {
      limitedTransportCalls += 1;
      return { transcript: syntheticTranscript };
    },
  },
});
await limitedHandler(audioRequest({ source: "198.51.100.8" }));
const limitedResponse = await limitedHandler(audioRequest({ source: "198.51.100.8" }));
const limitedPayload = await responsePayload(limitedResponse);
check(
  "Anonymous transcription relay has bounded rate protection",
  limitedResponse.status === 429 &&
    limitedPayload.status === "failed" &&
    limitedPayload.error.code === "rate_limited" &&
    limitedTransportCalls === 1 &&
    Boolean(limitedResponse.headers.get("retry-after")),
);

for (const state of [
  "idle",
  "requesting_permission",
  "recording",
  "stopping",
  "transcribing",
  "completed",
  "error",
]) {
  includes(voiceHelper, `| "${state}"`, `Voice state machine includes ${state}`);
}
includes(voiceHook, "navigator.mediaDevices.getUserMedia({ audio: true, video: false })", "Recording starts from an app-owned microphone stream");
includes(voiceHook, "new MediaRecorder(stream", "App owns the MediaRecorder lifecycle");
includes(voiceHook, "audioContext.createMediaStreamSource(stream)", "Web Audio source uses the recording stream");
includes(voiceHook, "audioContext.createAnalyser()", "Live indicator uses an AnalyserNode");
includes(voiceHook, "getByteTimeDomainData(samples)", "Live level reads real time-domain samples");
includes(voiceHook, "recorder.start(250)", "Recorder emits bounded chunks");
includes(voiceHook, "VOICE_MAX_RECORDING_MS", "Client recording duration is bounded");
includes(voiceHook, "VOICE_MAX_AUDIO_BYTES", "Client audio size is bounded");
includes(voiceHook, "stopTracks(session.stream)", "Media tracks are stopped during capture cleanup");
check(
  "Stop releases capture before transcription starts",
  voiceHook.indexOf("releaseCapture(session);", voiceHook.indexOf("const finalizeRecording")) <
    voiceHook.indexOf("await transcribe(session, audio)"),
);
check(
  "Error and unmount paths both release capture resources",
  (voiceHook.match(/releaseCapture\(/g) ?? []).length >= 4 &&
    voiceHook.includes("session.transcriptionAbort?.abort()"),
);
includes(voiceHook, "recorder.onstop = () =>", "Stop completion owns final Blob creation");
includes(voiceHook, 'setPhase("transcribing")', "Stop transitions to transcribing");
includes(voiceHook, 'fetch("/api/transcribe"', "Browser uses one same-origin transcription endpoint");
includes(homeSimulator, "appendVoiceTranscript(currentInput, transcript", "Transcript targets the existing controlled input");
includes(homeSimulator, "value={input}", "Textarea remains controlled by existing input state");
includes(homeSimulator, "voice.isBusy", "Simulation submission is blocked during voice lifecycle");
check("Recording exposes an explicit visible Stop action", />\s*Detener\s*</.test(homeSimulator));
check("Recording exposes an explicit visible Cancel action", />\s*Cancelar\s*</.test(homeSimulator));
includes(homeSimulator, "Nivel de audio en directo", "Live audio level has an accessible label");
includes(homeSimulator, "Transcribiendo…", "Transcribing state is visible in Spanish");
excludes(`${homeSimulator}\n${voiceHook}`, "SpeechRecognition", "Legacy browser SpeechRecognition primary path is removed");
excludes(voiceHook, "requestSubmit()", "Voice lifecycle cannot auto-submit a simulation");
check(
  "Transcript callback only updates the existing input path",
  homeSimulator.indexOf("onTranscript(transcript)") < homeSimulator.indexOf("appendVoiceTranscript(currentInput, transcript") &&
    !homeSimulator.slice(
      homeSimulator.indexOf("onTranscript(transcript)"),
      homeSimulator.indexOf("const stages = DEFAULT_PROCESSING_STAGES"),
    ).includes("handleSubmit"),
);
excludes(`${homeSimulator}\n${voiceHook}\n${routeHandler}`, "localStorage", "Raw audio is not persisted in browser storage");
excludes(`${voiceHook}\n${routeHandler}`, "supabase", "Raw audio is not sent to Supabase");
excludes(`${voiceHook}\n${routeHandler}`, "console.", "Raw audio and transcript are not logged");
includes(route, 'export const runtime = "nodejs"', "Transcription provider boundary uses the server Node runtime");
includes(routeHandler, "VOICE_ALLOWED_AUDIO_MEDIA_TYPES", "Server validates a bounded audio MIME allowlist");
includes(routeHandler, "audio.size > VOICE_MAX_AUDIO_BYTES", "Server validates maximum Blob size");
includes(routeHandler, "getPublicRequestSource(req)", "Transcription reuses the public API rate-limit boundary");
includes(providerAdapter, 'enabled !== "true"', "Voice provider gate defaults closed before credential use");
check(
  "Voice provider gate is evaluated before the credential",
  providerAdapter.indexOf('enabled !== "true"') < providerAdapter.indexOf("environment.OPENAI_API_KEY"),
);
includes(providerAdapter, "maxRetries: 0", "Future live transport cannot retry silently");
includes(providerAdapter, "client.audio.transcriptions.create", "Server adapter uses the installed SDK transcription API");
check(
  "Homepage and workspace mount the same HomeSimulator implementation",
  (homepage.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1 &&
    (dashboard.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1,
);
includes(simulatorCss, "@media (max-width: 480px)", "Voice controls include a mobile layout breakpoint");
includes(simulatorCss, "min-height: 44px", "Mobile Stop and Cancel keep bounded touch targets");
includes(simulatorCss, ".voice-live-meter progress", "Shared simulator CSS renders the live meter");
check("Recording limits match the endpoint contract", VOICE_MAX_RECORDING_MS === 120_000 && VOICE_MAX_AUDIO_BYTES === 10 * 1024 * 1024);
check("Validation performs zero provider operations", providerOperations === 0);

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) {
    console.log(`  ${item.detail}`);
  }
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nVoice recording/transcription gate: ${checks.length - failed.length}/${checks.length} passed.`);
console.log(`LEVIO_VOICE_PROVIDER_OPERATION_EVIDENCE ${JSON.stringify({ transcription: providerOperations, total: providerOperations })}`);
if (failed.length > 0) {
  process.exitCode = 1;
}
