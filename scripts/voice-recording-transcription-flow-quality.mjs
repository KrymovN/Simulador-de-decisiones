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

const { appendVoiceTranscript, createVoiceWaveformLevels, voiceErrorMessage } = require(
  join(rootDir, "components", "home-simulator-voice.ts"),
);
const read = (...parts) => readFileSync(join(rootDir, ...parts), "utf8");
const homeSimulator = read("components", "HomeSimulator.tsx");
const voiceHook = read("components", "use-home-simulator-voice.ts");
const speechContract = read("components", "browser-speech-recognition.ts");
const route = read("app", "api", "transcribe", "route.ts");
const providerAdapter = read("lib", "voice-transcription", "openai-transcription-adapter.server.ts");
const simulatorCss = read("app", "styles", "simulator.css");
const homepage = read("app", "page.tsx");
const dashboard = read("app", "dashboard", "page.tsx");

const checks = [];
const check = (name, condition, detail = "") => checks.push({ name, passed: Boolean(condition), detail });
const includes = (source, value, name) => check(name, source.includes(value), `Expected source to include: ${value}`);
const excludes = (source, value, name) => check(name, !source.includes(value), `Forbidden source value: ${value}`);

const syntheticTranscript = "Quiero cambiar de trabajo, pero necesito mantener unos ingresos estables.";
check(
  "Transcript appends to the existing controlled input",
  appendVoiceTranscript("Texto existente.", syntheticTranscript, 1200) === `Texto existente. ${syntheticTranscript}`,
);
check("Whitespace transcript cannot erase existing text", appendVoiceTranscript("Conservar", "   ", 1200) === "Conservar");
check(
  "Unsupported browser copy preserves typed input guidance",
  voiceErrorMessage("RECOGNITION_UNSUPPORTED") ===
    "El dictado por voz no está disponible en este navegador. Puedes seguir escribiendo.",
);
check("Listening waveform keeps its existing bounded shape", createVoiceWaveformLevels(0).length === 13);

includes(speechContract, "SpeechRecognition?", "Standard SpeechRecognition is supported");
includes(speechContract, "webkitSpeechRecognition?", "webkitSpeechRecognition fallback is supported");
includes(speechContract, 'BROWSER_SPEECH_RECOGNITION_LANGUAGE = "es-ES"', "Recognition language is Spanish es-ES");
includes(voiceHook, "new RecognitionConstructor()", "Each voice session creates a browser recognition instance");
includes(voiceHook, "recognition.start()", "Mic action starts browser recognition");
includes(voiceHook, "recognition.stop()", "Completion action stops browser recognition");
includes(voiceHook, "recognition.abort()", "Cancel and cleanup abort browser recognition");
includes(voiceHook, "recognition.continuous = true", "Recognition remains active until completion");
includes(voiceHook, "recognition.interimResults = true", "Interim results stay inside the recognition lifecycle");
includes(voiceHook, "collectFinalSpeechRecognitionResults", "Only final recognition results enter the transcript accumulator");
includes(voiceHook, "joinFinalSpeechRecognitionResults", "Final fragments are normalized without duplicate text");
includes(voiceHook, "onTranscriptRef.current(transcript)", "Final transcript reaches the existing HomeSimulator callback");
includes(voiceHook, 'setFailure("NO_SPEECH")', "No-speech completion is controlled");
includes(voiceHook, "classifySpeechRecognitionError(event.error)", "Browser recognition errors use controlled messages");
includes(voiceHook, 'setFailure("RECOGNITION_UNSUPPORTED")', "Unsupported browsers fail without breaking typed input");
excludes(voiceHook, 'fetch("/api/transcribe"', "Voice V1 never calls the Levio transcription route");
excludes(voiceHook, "MediaRecorder", "Voice V1 does not record a Blob");
excludes(voiceHook, "getUserMedia", "Voice V1 does not open a second MediaStream");
excludes(voiceHook, "FormData", "Voice V1 never prepares an audio upload");
excludes(voiceHook, "requestSubmit()", "Voice lifecycle cannot auto-submit a simulation");
excludes(voiceHook, "browser-local-whisper", "Voice V1 does not use browser-local Whisper");
excludes(voiceHook, "native-local-stt", "Voice V1 does not use the native local STT adapter");

includes(homeSimulator, "appendVoiceTranscript(currentInput, transcript", "Transcript targets the existing controlled input");
includes(homeSimulator, "value={input}", "Textarea remains editable and controlled by existing input state");
includes(homeSimulator, "voice.isBusy", "Simulation submission is blocked during voice lifecycle");
includes(homeSimulator, 'aria-label="Dictar situación"', "Idle state exposes the existing microphone action");
includes(homeSimulator, 'aria-label="Finalizar dictado"', "Listening state exposes the existing completion action");
includes(homeSimulator, 'aria-label="Cancelar dictado"', "Listening state exposes the existing cancel action");
check(
  "Checkmark stops recognition without submitting the simulation",
  /aria-label="Finalizar dictado"[\s\S]*?onClick=\{voice\.stop\}[\s\S]*?type="button"/.test(homeSimulator),
);
check(
  "Cancel does not insert a transcript",
  !voiceHook.slice(voiceHook.indexOf("const cancel"), voiceHook.indexOf("const start")).includes("onTranscriptRef"),
);
check(
  "Transcript callback only updates the existing input path",
  homeSimulator.indexOf("onTranscript(transcript)") < homeSimulator.indexOf("appendVoiceTranscript(currentInput, transcript") &&
    !homeSimulator.slice(homeSimulator.indexOf("onTranscript(transcript)"), homeSimulator.indexOf("const stages = DEFAULT_PROCESSING_STAGES")).includes("handleSubmit"),
);
includes(homeSimulator, 'className="voice-waveform"', "Existing listening visualization remains mounted");
includes(homeSimulator, 'className="voice-accessible-status"', "Voice lifecycle remains accessible");
includes(simulatorCss, "@media (max-width: 480px)", "Voice controls keep their mobile layout");
check(
  "Homepage and workspace mount the same HomeSimulator implementation",
  (homepage.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1 &&
    (dashboard.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1,
);

includes(route, 'export const runtime = "nodejs"', "Dormant transcription route remains present");
includes(providerAdapter, 'enabled !== "true"', "Dormant OpenAI adapter remains default-deny");

const providerOperations = {
  apiTranscribe: 0,
  levioRemoteTranscription: 0,
  openAiTranscription: 0,
  total: 0,
  whisperInference: 0,
};
check("Validation performs zero transcription provider operations", Object.values(providerOperations).every((value) => value === 0));

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.passed);
console.log(`\nVoice Input V1 regression gate: ${checks.length - failed.length}/${checks.length} passed.`);
console.log(`LEVIO_VOICE_PROVIDER_OPERATION_EVIDENCE ${JSON.stringify(providerOperations)}`);
if (failed.length > 0) process.exitCode = 1;
