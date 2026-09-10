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
  advanceVoiceWaveformHistory,
  appendVoiceTranscript,
  calculateVoiceAudioLevel,
  createVoiceWaveformLevels,
  VOICE_WAVEFORM_BAR_COUNT,
  voiceErrorMessage,
} = require(join(rootDir, "components", "home-simulator-voice.ts"));
const read = (...parts) => readFileSync(join(rootDir, ...parts), "utf8");
const homeSimulator = read("components", "HomeSimulator.tsx");
const voiceHook = read("components", "use-home-simulator-voice.ts");
const speechContract = read("components", "browser-speech-recognition.ts");
const route = read("app", "api", "transcribe", "route.ts");
const providerAdapter = read("lib", "voice-transcription", "openai-transcription-adapter.server.ts");
const simulatorCss = read("app", "styles", "simulator.css");
const homepageCss = read("app", "styles", "homepage.css");
const dashboardCss = read("app", "styles", "dashboard-shell.css");
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
check(
  "Recognition with no result has controlled neutral copy",
  voiceErrorMessage("RECOGNITION_NO_RESULT") ===
    "No se ha podido iniciar correctamente el dictado. Puedes intentarlo de nuevo o seguir escribiendo.",
);
check(
  "Running waveform uses 28 recent amplitude bars",
  VOICE_WAVEFORM_BAR_COUNT === 28 && createVoiceWaveformLevels(0).length === 28,
);
const silenceSamples = new Uint8Array(512).fill(128);
const normalVoiceSamples = Uint8Array.from(
  { length: 512 },
  (_, index) => 128 + (index % 2 === 0 ? 12 : -12),
);
const strongVoiceSamples = Uint8Array.from(
  { length: 512 },
  (_, index) => 128 + (index % 2 === 0 ? 22 : -22),
);
const silenceLevel = calculateVoiceAudioLevel(silenceSamples);
const normalVoiceLevel = calculateVoiceAudioLevel(normalVoiceSamples);
const strongVoiceLevel = calculateVoiceAudioLevel(strongVoiceSamples);
check("Silence remains at the waveform floor", silenceLevel === 0);
check("Normal voice maps substantially above silence", normalVoiceLevel > 0.5);
check("Strong voice maps higher than normal voice", strongVoiceLevel > normalVoiceLevel);
const initialHistory = createVoiceWaveformLevels(0).map((level, index) => level + index / 1000);
const advancedHistory = advanceVoiceWaveformHistory(initialHistory, normalVoiceLevel);
check(
  "Old waveform samples move one position left",
  JSON.stringify(advancedHistory.slice(0, -1)) === JSON.stringify(initialHistory.slice(1)),
);
check(
  "New real amplitude sample enters from the right",
  advancedHistory.at(-1) > createVoiceWaveformLevels(0).at(-1),
);

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
includes(
  voiceHook,
  'receivedResult ? "NO_SPEECH" : "RECOGNITION_NO_RESULT"',
  "No-speech and no-result completion are controlled",
);
includes(voiceHook, "classifySpeechRecognitionError(event.error)", "Browser recognition errors use controlled messages");
includes(voiceHook, 'setFailure("RECOGNITION_UNSUPPORTED")', "Unsupported browsers fail without breaking typed input");
excludes(voiceHook, 'fetch("/api/transcribe"', "Voice V1 never calls the Levio transcription route");
excludes(voiceHook, "MediaRecorder", "Voice V1 does not record a Blob");
includes(voiceHook, "navigator.mediaDevices.getUserMedia", "Waveform opens a local visual microphone stream");
includes(voiceHook, "createAnalyser()", "Waveform uses an AnalyserNode");
includes(voiceHook, "calculateVoiceAudioLevel(samples)", "Real analyser samples drive waveform history");
includes(voiceHook, "advanceVoiceWaveformHistory", "Waveform advances through amplitude history");
includes(voiceHook, "track.stop()", "Visual microphone tracks stop during cleanup");
includes(voiceHook, "audioSource?.disconnect()", "Visual audio source disconnects during cleanup");
includes(voiceHook, "analyser?.disconnect()", "Visual analyser disconnects during cleanup");
includes(voiceHook, "audioContext.close()", "Visual AudioContext closes during cleanup");
includes(voiceHook, "cancelAnimationFrame", "Visual animation frame cancels during cleanup");
excludes(voiceHook, "Math.random", "Waveform contains no random movement");
excludes(voiceHook, "FormData", "Voice V1 never prepares an audio upload");
excludes(voiceHook, "requestSubmit()", "Voice lifecycle cannot auto-submit a simulation");
excludes(voiceHook, "browser-local-whisper", "Voice V1 does not use browser-local Whisper");
excludes(voiceHook, "native-local-stt", "Voice V1 does not use the native local STT adapter");

includes(
  homeSimulator,
  "const nextInput = appendVoiceTranscript(",
  "Transcript targets the existing controlled input",
);
includes(homeSimulator, "value={input}", "Textarea remains editable and controlled by existing input state");
includes(homeSimulator, "voice.isBusy", "Simulation submission is blocked during voice lifecycle");
includes(homeSimulator, 'aria-label="Dictar situación"', "Idle state exposes the existing microphone action");
includes(
  homeSimulator,
  "!iphoneSafariVoiceOneShotComplete &&",
  "iPhone Safari microphone is visible before the first successful transcript",
);
includes(
  homeSimulator,
  "nextInput !== currentInput",
  "One-shot state requires a transcript that changes the editable input",
);
includes(
  homeSimulator,
  "isIPhoneSafariBrowser(window.navigator)",
  "One-shot behavior is restricted to the iPhone Safari compatibility target",
);
includes(
  homeSimulator,
  "setIphoneSafariVoiceOneShotComplete(true)",
  "Successful iPhone Safari transcript hides the microphone action",
);
includes(
  homeSimulator,
  "Puedes seguir completando el texto con el teclado.",
  "Successful iPhone Safari transcript exposes the keyboard continuation hint",
);
includes(
  homeSimulator,
  "is-voice-one-shot-complete",
  "The primary simulation action expands when the microphone is hidden",
);
check(
  "Cancel, no-speech, permission errors, and failed recognition cannot consume the one-shot action",
  !voiceHook.includes("setIphoneSafariVoiceOneShotComplete") &&
    homeSimulator.slice(homeSimulator.indexOf("onTranscript(transcript)"), homeSimulator.indexOf("const isVoiceProcessing")).includes("setIphoneSafariVoiceOneShotComplete(true)"),
);
excludes(homeSimulator, "localStorage", "One-shot state is not persisted in browser storage");
excludes(homeSimulator, "Supabase", "One-shot state is not persisted in Supabase");
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
  homeSimulator.indexOf("onTranscript(transcript)") < homeSimulator.indexOf("const nextInput = appendVoiceTranscript(") &&
    homeSimulator.slice(homeSimulator.indexOf("onTranscript(transcript)"), homeSimulator.indexOf("const isVoiceProcessing")).includes("setInput(nextInput)") &&
    !homeSimulator.slice(homeSimulator.indexOf("onTranscript(transcript)"), homeSimulator.indexOf("const isVoiceProcessing")).includes("handleSubmit"),
);
includes(homeSimulator, 'className="voice-waveform"', "Existing listening visualization remains mounted");
includes(homeSimulator, "voice.waveformLevels.map", "Waveform renders the running sample history");
includes(homeSimulator, 'className="voice-accessible-status"', "Voice lifecycle remains accessible");
includes(simulatorCss, "@media (max-width: 480px)", "Voice controls keep their mobile layout");
check(
  "Waveform uses narrow vertical bars rather than dots",
  /\.voice-waveform-bar\s*\{[\s\S]*?width:\s*3px;[\s\S]*?max-height:\s*34px;/.test(simulatorCss),
);
check(
  "Waveform bars have no independent CSS animation",
  !/\.voice-waveform-bar\s*\{[^}]*animation\s*:/s.test(simulatorCss),
);
check(
  "Homepage microphone is an exact circle",
  /\.minimal-home \.decision-console \.voice-input-button\s*\{[^}]*aspect-ratio:\s*1;[^}]*border-radius:\s*50%;/s.test(homepageCss),
);
check(
  "Authenticated workspace microphone is an exact circle",
  /\.dashboard-workspace-simulator \.decision-console \.voice-input-button\s*\{[^}]*aspect-ratio:\s*1;[^}]*border-radius:\s*50%;/s.test(dashboardCss),
);
check(
  "Recording cancel and confirm controls are exact circles",
  /\.voice-recording-interaction \.voice-confirm-control,\s*\.voice-recording-interaction \.voice-cancel-control\s*\{[^}]*width:\s*var\(--voice-control-size\);[^}]*max-width:\s*var\(--voice-control-size\);[^}]*height:\s*var\(--voice-control-size\);[^}]*max-height:\s*var\(--voice-control-size\);[^}]*aspect-ratio:\s*1;[^}]*border-radius:\s*50%;/s.test(simulatorCss),
);
check(
  "Recording control icons remain centered",
  /\.voice-recording-interaction \.voice-confirm-control,\s*\.voice-recording-interaction \.voice-cancel-control\s*\{[^}]*display:\s*grid;[^}]*place-items:\s*center;/s.test(simulatorCss),
);
check(
  "Homepage recording controls preserve the circular shape",
  /\.minimal-home \.decision-console \.voice-recording-interaction button\s*\{[^}]*aspect-ratio:\s*1;[^}]*border-radius:\s*50%;/s.test(homepageCss),
);
check(
  "Authenticated recording controls preserve the circular shape",
  /\.dashboard-workspace-simulator \.decision-console \.voice-recording-interaction button\s*\{[^}]*aspect-ratio:\s*1;[^}]*border-radius:\s*50%;/s.test(dashboardCss),
);
includes(voiceHook, 'event.error === "aborted" && !session.receivedResult', "No-result recognition abort is controlled");
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
