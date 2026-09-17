import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
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
includes(voiceHook, "segmentRecognition.continuous = true", "Every recognition segment requests continuous results");
includes(voiceHook, "segmentRecognition.interimResults = true", "Every recognition segment accepts interim results");
includes(voiceHook, "collectSpeechRecognitionResults(event, session.transcriptState)", "Final and latest interim recognition results enter the session accumulator");
includes(
  voiceHook,
  "session.safariMacInterimSnapshot\n      ? buildSpeechRecognitionTranscript(session.transcriptState, true, true)\n      : session.androidChromiumCumulativeResults",
  "Safari macOS retains priority over the Android cumulative-result path",
);
includes(voiceHook, "isMacSafariBrowser(window.navigator)", "Interim same-slot replacement is scoped to Safari on macOS");
includes(
  voiceHook,
  "androidChromiumCumulativeResults: isAndroidChromiumBrowser(window.navigator)",
  "Android cumulative-result normalization is scoped by the existing platform helper",
);
includes(
  voiceHook,
  "joinAndroidChromiumFinalSpeechRecognitionResults(\n        session.transcriptState.finalFragments",
  "Android Chromium finalizes cumulative result lists through prefix replacement",
);
includes(
  voiceHook,
  ": joinFinalSpeechRecognitionResults(session.transcriptState.finalFragments)",
  "Non-Android browsers retain the existing final-fragment join",
);
includes(voiceHook, "onTranscriptRef.current(transcript)", "Final transcript reaches the existing HomeSimulator callback");
check(
  "Logical voice completion has exactly one transcript commit call site",
  (voiceHook.match(/onTranscriptRef\.current\(transcript\)/g) ?? []).length === 1,
);
includes(
  voiceHook,
  "const VOICE_RECOGNITION_SAFARI_MAC_TAIL_GRACE_MS = 700",
  "Safari macOS normal confirmation has a bounded 700ms tail grace",
);
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
check(
  "Android Chromium skips visual capture while browser recognition still starts",
  /if \(!isAndroidChromiumBrowser\(window\.navigator\)\) \{\s*void startVisualAudio\(session\);\s*\}\s*recognition\.start\(\);/.test(
    voiceHook,
  ),
);
const visualAudioBlock = voiceHook.slice(
  voiceHook.indexOf("const startVisualAudio"),
  voiceHook.indexOf("const releaseSession"),
);
check(
  "Visual getUserMedia, AudioContext, and AnalyserNode creation remain isolated behind the Android guard",
  visualAudioBlock.includes("navigator.mediaDevices.getUserMedia") &&
    visualAudioBlock.includes("new AudioContext()") &&
    visualAudioBlock.includes("audioContext.createAnalyser()") &&
    (voiceHook.match(/startVisualAudio\(session\)/g) ?? []).length === 1,
);
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
excludes(voiceHook, "voiceNoAnalyser", "No-analyser query diagnostic is removed from product code");
excludes(voiceHook, "diagnosticEvents", "Voice lifecycle diagnostic event logging is removed");
excludes(voiceHook, "runtimeUnavailable", "Unaccepted runtime microphone disable is removed");
excludes(voiceHook, "isSpeechRecognitionRuntimeFailure", "Unaccepted analyser-driven runtime fallback is removed");
check(
  "Standalone browser probe route is removed",
  !existsSync(join(rootDir, "app", "voice-browser-probe")),
);

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
  "Normal confirmation keeps recognition handlers active while stopping",
  !voiceHook.slice(voiceHook.indexOf("const stop"), voiceHook.indexOf("const cancel")).includes("detachRecognitionHandlers"),
);
check(
  "Repeated confirmation is ignored after the logical session starts stopping",
  /if \(\s*!session \|\|\s*session\.cancelled \|\|\s*session\.failed \|\|\s*session\.stopRequested\s*\)/.test(
    voiceHook.slice(voiceHook.indexOf("const stop"), voiceHook.indexOf("const cancel")),
  ),
);
includes(voiceHook, "session.stopRequested = true", "Normal confirmation marks the logical session as stopping");
check(
  "Safari macOS confirmation schedules recognition stop after tail grace",
  /if \(session\.safariMacInterimSnapshot\) \{[\s\S]*?session\.tailGraceTimer = setTimeout\([\s\S]*?stopRecognition[\s\S]*?VOICE_RECOGNITION_SAFARI_MAC_TAIL_GRACE_MS[\s\S]*?\);/.test(
    voiceHook.slice(voiceHook.indexOf("const stop"), voiceHook.indexOf("const cancel")),
  ),
);
check(
  "Other browser paths keep immediate recognition stop",
  /if \(session\.safariMacInterimSnapshot\) \{[\s\S]*?return;[\s\S]*?\}\s*stopRecognition\(\);/.test(
    voiceHook.slice(voiceHook.indexOf("const stop"), voiceHook.indexOf("const cancel")),
  ),
);
includes(voiceHook, "VOICE_RECOGNITION_FINALIZATION_MS", "Normal confirmation has a bounded finalization timeout");
check(
  "Bounded finalization retires a recognition instance that never emits onend",
  voiceHook.slice(voiceHook.indexOf("session.finalizationTimer = setTimeout"), voiceHook.indexOf("VOICE_RECOGNITION_FINALIZATION_MS);", voiceHook.indexOf("session.finalizationTimer = setTimeout"))).includes("session.recognition.abort()"),
);
check(
  "Late onresult remains accepted after normal confirmation",
  !voiceHook.slice(voiceHook.indexOf("segmentRecognition.onresult"), voiceHook.indexOf("segmentRecognition.onerror")).includes("stopRequested"),
);
check(
  "Cancel bypasses tail grace and cannot commit a transcript",
  !voiceHook.slice(voiceHook.indexOf("const cancel"), voiceHook.indexOf("const start")).includes("tailGraceTimer = setTimeout") &&
    !voiceHook.slice(voiceHook.indexOf("const cancel"), voiceHook.indexOf("const start")).includes("onTranscriptRef"),
);
check(
  "Full listening state begins only after the browser onstart event",
  voiceHook.indexOf('setPhase("recording")') > voiceHook.indexOf("segmentRecognition.onstart"),
);
check(
  "Transcript callback only updates the existing input path",
  homeSimulator.indexOf("onTranscript(transcript)") < homeSimulator.indexOf("const nextInput = appendVoiceTranscript(") &&
    homeSimulator.slice(homeSimulator.indexOf("onTranscript(transcript)"), homeSimulator.indexOf("const isVoiceProcessing")).includes("setInput(nextInput)") &&
    !homeSimulator.slice(homeSimulator.indexOf("onTranscript(transcript)"), homeSimulator.indexOf("const isVoiceProcessing")).includes("handleSubmit"),
);
includes(homeSimulator, 'className={`voice-waveform${', "Existing listening visualization remains mounted");
check(
  "Android and Safari share the same 28-bar markup while Safari keeps real waveform levels",
  /\(voice\.androidVoiceActivity === "inactive"\s*\? voice\.waveformLevels\s*: ANDROID_VOICE_ACTIVITY_LEVELS\)\.map/.test(homeSimulator),
);
const androidBarProfile = homeSimulator.match(/const ANDROID_VOICE_ACTIVITY_LEVELS = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
check("Android activity profile has 28 deterministic, varied bars",
  (androidBarProfile.match(/0\.\d+/g) ?? []).length === 28 &&
  new Set(androidBarProfile.match(/0\.\d+/g) ?? []).size > 10);
includes(homeSimulator, 'animationDelay: `-${(index * 173) % 1300}ms`', "Android bar phases are deterministic and staggered");
includes(homeSimulator, 'className="voice-waveform-result-pulse"', "Recognition results can gently pulse without live announcements");
excludes(homeSimulator, 'className="voice-live-line-track"', "Android scanner line is removed");
excludes(homeSimulator, 'className="voice-live-line-flow"', "Android traveling beam is removed");
excludes(homeSimulator, 'className="voice-activity-label"', "Android indicator has no visible status label");
excludes(homeSimulator, "Diagnostic: visual analyser OFF", "No-analyser diagnostic UI is removed");
excludes(homeSimulator, "Voice no-analyser A/B trace", "Voice diagnostic event panel is removed");
includes(homeSimulator, 'className="voice-accessible-status"', "Voice lifecycle remains accessible");
includes(simulatorCss, "@media (max-width: 480px)", "Voice controls keep their mobile layout");
check(
  "Waveform uses narrow vertical bars rather than dots",
  /\.voice-waveform-bar\s*\{[\s\S]*?width:\s*3px;[\s\S]*?max-height:\s*34px;/.test(simulatorCss),
);
check(
  "Non-Android waveform bars have no independent CSS animation",
  !/(?:^|\n)\.voice-waveform-bar\s*\{[^}]*animation\s*:/s.test(simulatorCss),
);
check(
  "Android inherits the same rounded capsule, bar sizing, and spacing as iPhone",
  /\.voice-waveform\s*\{[^}]*gap:\s*clamp\(2px, 0\.7vw, 4px\);[^}]*border-radius:\s*var\(--voice-control-radius\);[^}]*background:/.test(simulatorCss) &&
  !/\.voice-waveform--android\s*\{[^}]*(?:border:|background:|padding:)/.test(simulatorCss),
);
check(
  "Android activity motion changes bar transforms, not measured amplitude",
  simulatorCss.includes('animation: voiceAndroidBarListening') &&
    simulatorCss.includes('transform: scaleY(') &&
    !simulatorCss.slice(simulatorCss.indexOf('@keyframes voiceAndroidBarListening'), simulatorCss.indexOf('@media (prefers-reduced-motion: reduce)')).includes('height:'),
);
check(
  "Listening, speech, and between-segment bars keep distinct motion without synchronized rhythm",
  simulatorCss.includes('--voice-bar-cycle: 1700ms') &&
    simulatorCss.includes('--voice-bar-cycle: 1050ms') &&
    simulatorCss.includes('--voice-bar-cycle: 2100ms') &&
    simulatorCss.includes('animation-name: voiceAndroidBarSpeech') &&
    simulatorCss.includes('animation-name: voiceAndroidBarBetween') &&
    simulatorCss.includes('.voice-waveform-bar:nth-child(3n)') &&
    simulatorCss.includes('.voice-waveform-bar:nth-child(4n + 1)'),
);
check(
  "Reduced motion keeps a static Android waveform shape",
  /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.voice-waveform--android \.voice-waveform-bar,[\s\S]*?animation: none;[\s\S]*?\.voice-waveform--android \.voice-waveform-bar\s*\{[^}]*transform:\s*scaleY\(0\.78\);/.test(simulatorCss),
);
excludes(simulatorCss, "voiceLineTravel", "No horizontal scanner animation remains");
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

function withVoiceHook(userAgent, test, deferContinuationStartEvent = false) {
  const originalWindow = globalThis.window;
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const timers = new Map();
  const instances = [];
  const transcripts = [];
  const stateSlots = [];
  let slot = 0;
  let nextTimerId = 0;
  let cleanup = null;
  let visualCaptureCalls = 0;

  const react = {
    useState(initialValue) {
      const index = slot++;
      if (!(index in stateSlots)) stateSlots[index] = initialValue;
      return [stateSlots[index], (value) => {
        stateSlots[index] = typeof value === "function" ? value(stateSlots[index]) : value;
      }];
    },
    useRef(initialValue) {
      const index = slot++;
      if (!(index in stateSlots)) stateSlots[index] = { current: initialValue };
      return stateSlots[index];
    },
    useCallback(callback) {
      slot++;
      return callback;
    },
    useEffect(effect) {
      const index = slot++;
      if (!(index in stateSlots)) {
        cleanup = effect();
        stateSlots[index] = true;
      }
    },
  };
  const loadedHook = { exports: {} };
  const output = ts.transpileModule(voiceHook, {
    fileName: "use-home-simulator-voice.ts",
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const hookRequire = (name) => name === "react" ? react : require(join(rootDir, "components", name));
  new Function("require", "module", "exports", output.outputText)(
    hookRequire,
    loadedHook,
    loadedHook.exports,
  );

  class MockRecognition {
    constructor() {
      this.startCalls = 0;
      this.stopCalls = 0;
      this.abortCalls = 0;
      instances.push(this);
    }
    start() {
      this.startCalls += 1;
      if (!deferContinuationStartEvent || instances.length === 1) this.onstart?.();
    }
    stop() { this.stopCalls += 1; }
    abort() { this.abortCalls += 1; }
  }
  const browserNavigator = {
    userAgent,
    mediaDevices: {
      getUserMedia() {
        visualCaptureCalls += 1;
        throw new Error("Visual capture is not needed by this test");
      },
    },
  };
  const schedule = (callback, delay, repeating) => {
    const id = ++nextTimerId;
    timers.set(id, { callback, delay, repeating });
    return id;
  };

  try {
    globalThis.window = { navigator: browserNavigator, SpeechRecognition: MockRecognition };
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: browserNavigator,
    });
    globalThis.setTimeout = (callback, delay) => schedule(callback, delay, false);
    globalThis.setInterval = (callback, delay) => schedule(callback, delay, true);
    globalThis.clearTimeout = (id) => timers.delete(id);
    globalThis.clearInterval = (id) => timers.delete(id);

    const harness = {
      instances,
      transcripts,
      render() {
        slot = 0;
        return loadedHook.exports.useHomeSimulatorVoice({
          onMessage() {},
          onTranscript(transcript) { transcripts.push(transcript); },
        });
      },
      emitFinal(recognition, fragments) {
        recognition.onresult?.({
          resultIndex: 0,
          results: fragments.map((transcript) => ({
            0: { confidence: 0.9, transcript },
            isFinal: true,
            length: 1,
          })),
        });
      },
      runTimer(delay) {
        const entry = [...timers.entries()].find(([, timer]) => timer.delay === delay);
        if (!entry) return false;
        const [id, timer] = entry;
        if (!timer.repeating) timers.delete(id);
        timer.callback();
        return true;
      },
      countTimers(delay) {
        return [...timers.values()].filter((timer) => timer.delay === delay).length;
      },
      get visualCaptureCalls() { return visualCaptureCalls; },
      unmount() { cleanup?.(); },
    };
    test(harness);
  } finally {
    globalThis.window = originalWindow;
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    } else {
      delete globalThis.navigator;
    }
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }
}

const androidChromeUserAgent =
  "Mozilla/5.0 (Linux; Android 15; 23127PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const macSafariUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";
const iphoneSafariUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

withVoiceHook(androidChromeUserAgent, (voice) => {
  check("Android visual activity starts inactive", voice.render().androidVoiceActivity === "inactive");
  voice.render().start();
  const recognition = voice.instances[0];
  check("Android onstart enters listening visual state", voice.render().androidVoiceActivity === "listening");
  recognition.onaudiostart?.();
  recognition.onsoundstart?.();
  check("Android audiostart and soundstart retain listening", voice.render().androidVoiceActivity === "listening");
  recognition.onspeechstart?.();
  check("Android speechstart strengthens visual state", voice.render().androidVoiceActivity === "speechActive");
  recognition.onsoundstart?.();
  recognition.onstart?.();
  check("Late start/soundstart cannot weaken detected speech", voice.render().androidVoiceActivity === "speechActive");
  const pulseBeforeResult = voice.render().androidResultPulse;
  recognition.onresult?.({
    resultIndex: 0,
    results: [{ 0: { confidence: 0.9, transcript: "Una" }, isFinal: false, length: 1 }],
  });
  check("Android interim result pulses without committing or altering recognition timers",
    voice.render().androidResultPulse === pulseBeforeResult + 1 &&
    voice.render().phase === "recording" && voice.transcripts.length === 0 &&
    voice.instances.length === 1 && voice.countTimers(120000) === 1);
  recognition.onspeechend?.();
  check("Android speechend returns to listening", voice.render().androidVoiceActivity === "listening");
  recognition.onspeechstart?.();
  recognition.onsoundend?.();
  check("Android soundend safely returns to listening when speechend is absent",
    voice.render().androidVoiceActivity === "listening");
  recognition.onspeechstart?.();
  recognition.onaudioend?.();
  check("Android audioend is visual-only and keeps the logical session recording",
    voice.render().androidVoiceActivity === "listening" && voice.render().phase === "recording");
  check("Android visual events never start extra microphone capture", voice.visualCaptureCalls === 0);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  const first = voice.instances[0];
  first.onspeechstart?.();
  const staleSpeechStart = first.onspeechstart;
  const staleAudioStart = first.onaudiostart;
  const staleResult = first.onresult;
  voice.emitFinal(first, ["Primera frase."]);
  first.onend();
  check("Android browser onend shows betweenSegments without transcript commit",
    voice.render().androidVoiceActivity === "betweenSegments" &&
    voice.render().phase === "recording" && voice.transcripts.length === 0);
  check("Missing speechend/soundend/audioend does not prevent visual continuation",
    voice.runTimer(0) && voice.render().androidVoiceActivity === "listening");
  const pulseAfterContinuation = voice.render().androidResultPulse;
  staleSpeechStart();
  staleAudioStart();
  staleResult({ resultIndex: 0, results: [{ 0: { transcript: "stale" }, isFinal: true }] });
  check("Previous-generation visual callbacks cannot change next-segment activity or pulse",
    voice.render().androidVoiceActivity === "listening" &&
    voice.render().androidResultPulse === pulseAfterContinuation);
  const second = voice.instances[1];
  second.onspeechstart?.();
  check("New Android segment can detect speech independently", voice.render().androidVoiceActivity === "speechActive");
  voice.emitFinal(second, ["Segunda frase."]);
  voice.render().stop();
  check("Android manual stop resets visual activity before finalization",
    voice.render().androidVoiceActivity === "inactive" && voice.render().phase === "stopping");
  second.onend();
  check("Android multi-segment transcript still commits exactly once",
    voice.transcripts.length === 1 && voice.transcripts[0] === "Primera frase. Segunda frase.");
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.instances[0].onspeechstart?.();
  voice.render().cancel();
  check("Android cancel resets visual state without transcript commit",
    voice.render().androidVoiceActivity === "inactive" &&
    voice.render().phase === "idle" && voice.transcripts.length === 0);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.instances[0].onspeechstart?.();
  voice.instances[0].onerror({ error: "network" });
  check("Android error resets visual state without continuation",
    voice.render().androidVoiceActivity === "inactive" &&
    voice.render().phase === "error" && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  const recognition = voice.instances[0];
  recognition.onspeechstart?.();
  const lateVisualEvent = recognition.onspeechstart;
  voice.emitFinal(recognition, ["Hasta el límite."]);
  const limitFired = voice.runTimer(120000);
  lateVisualEvent();
  check("Android 120-second limit resets activity and rejects late visual callbacks",
    limitFired && voice.render().androidVoiceActivity === "inactive" &&
    voice.render().phase === "stopping");
  recognition.onend();
  check("Android 120-second limit keeps existing single transcript commit",
    voice.transcripts.length === 1 && voice.transcripts[0] === "Hasta el límite.");
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  const recognition = voice.instances[0];
  const lateVisualEvent = recognition.onspeechstart;
  voice.unmount();
  lateVisualEvent();
  check("Unmount detaches Android visual callbacks and cannot continue or commit",
    recognition.onspeechstart === null && voice.transcripts.length === 0 &&
    voice.instances.length === 1 && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  const first = voice.instances[0];
  const staleResult = first.onresult;
  const staleEnd = first.onend;
  voice.emitFinal(first, ["a", "a ver", "a ver qué tal funciona"]);
  first.onend();
  check("Successful Android onend keeps one recording session without transcript commit",
    voice.render().phase === "recording" && voice.transcripts.length === 0 && voice.instances.length === 1);
  check("Android visual capture stays disabled during recognition", voice.visualCaptureCalls === 0);
  check("Android continuation creates a fresh configured recognition instance",
    voice.runTimer(0) && voice.instances.length === 2 &&
    voice.instances[1] !== first && voice.instances[1].lang === "es-ES" &&
    voice.instances[1].continuous === true && voice.instances[1].interimResults === true &&
    voice.instances[1].maxAlternatives === 1 && voice.instances[1].startCalls === 1);
  const second = voice.instances[1];
  staleResult({ resultIndex: 0, results: [{ 0: { transcript: "stale" }, isFinal: true }] });
  staleEnd();
  check("Stale Android callbacks cannot create another segment", voice.instances.length === 2);
  voice.emitFinal(second, ["Necesito mantener unos ingresos estables."]);
  voice.render().stop();
  second.onend();
  check("Fresh resultIndex zero preserves earlier segment and commits once",
    voice.transcripts.length === 1 &&
    voice.transcripts[0] === "a ver qué tal funciona Necesito mantener unos ingresos estables.");
  check("Old callbacks cannot mutate the committed transcript", voice.transcripts.length === 1);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Primera frase."]);
  voice.instances[0].onend();
  voice.runTimer(0);
  voice.render().stop();
  voice.instances[1].onerror({ error: "no-speech" });
  voice.instances[1].onend();
  check("No-speech during manual stop preserves completed Android segments",
    voice.transcripts[0] === "Primera frase." && voice.transcripts.length === 1);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Repito esta frase."]);
  voice.instances[0].onend();
  voice.runTimer(0);
  voice.emitFinal(voice.instances[1], ["Repito esta frase."]);
  voice.render().stop();
  voice.instances[1].onend();
  check("Intentional repeated phrases in separate Android segments are retained",
    voice.transcripts[0] === "Repito esta frase. Repito esta frase.");
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Primera frase."]);
  voice.instances[0].onend();
  voice.render().stop();
  check("Manual stop between Android segments commits without creating another instance",
    voice.transcripts[0] === "Primera frase." && !voice.runTimer(0) && voice.instances.length === 1);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Primera frase."]);
  voice.instances[0].onend();
  voice.runTimer(0);
  voice.render().stop();
  voice.instances[1].onstart?.();
  voice.instances[1].onend();
  check("Manual stop while next Android segment starts prevents recording reset and continuation",
    voice.transcripts[0] === "Primera frase." && voice.render().phase === "completed" &&
    voice.instances.length === 2 && !voice.runTimer(0));
}, true);

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Primera frase."]);
  voice.instances[0].onend();
  voice.runTimer(0);
  check("Android continuation retains exactly one 120-second deadline", voice.countTimers(120000) === 1);
  voice.emitFinal(voice.instances[1], ["Segunda frase."]);
  const limitFired = voice.runTimer(120000);
  voice.instances[1].onend();
  check("120-second limit terminates Android session with one combined commit",
    limitFired && voice.instances[1].stopCalls === 1 &&
    voice.transcripts[0] === "Primera frase. Segunda frase." &&
    voice.transcripts.length === 1 && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Primera frase."]);
  voice.instances[0].onend();
  const limitFired = voice.runTimer(120000);
  check("120-second limit between Android segments commits without another instance",
    limitFired && voice.transcripts[0] === "Primera frase." &&
    voice.instances.length === 1 && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Texto final."]);
  voice.render().stop();
  const boundedFinalizationFired = voice.runTimer(1200);
  check("Android manual stop still commits once after bounded finalization without onend",
    boundedFinalizationFired && voice.transcripts[0] === "Texto final." &&
    voice.transcripts.length === 1 && voice.instances[0].abortCalls === 1);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.instances[0].onend();
  check("Empty Android segment fails without a continuation loop",
    voice.render().phase === "error" && voice.instances.length === 1 && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Texto previo."]);
  voice.instances[0].onend();
  voice.runTimer(0);
  voice.instances[1].onend();
  check("Empty continued Android segment fails without retry or partial commit",
    voice.render().phase === "error" && voice.transcripts.length === 0 &&
    voice.instances.length === 2 && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Texto previo."]);
  voice.instances[0].onend();
  voice.runTimer(0);
  voice.instances[1].onerror({ error: "network" });
  check("Android recognition error does not retry or commit partial text",
    voice.render().phase === "error" && voice.transcripts.length === 0 && !voice.runTimer(0));
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Texto previo."]);
  voice.instances[0].onend();
  voice.render().cancel();
  check("Cancel during Android transition blocks continuation and commit",
    voice.transcripts.length === 0 && !voice.runTimer(0) && voice.instances.length === 1);
});

withVoiceHook(androidChromeUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Texto previo."]);
  voice.instances[0].onend();
  voice.unmount();
  check("Unmount during Android transition blocks continuation and commit",
    voice.transcripts.length === 0 && !voice.runTimer(0) && voice.instances.length === 1);
});

for (const [name, userAgent] of [
  ["Safari Mac", macSafariUserAgent],
  ["Safari iPhone", iphoneSafariUserAgent],
]) {
  withVoiceHook(userAgent, (voice) => {
    voice.render().start();
    voice.emitFinal(voice.instances[0], ["Dictado Safari."]);
    voice.instances[0].onend();
    check(`${name} still completes on browser onend without continuation`,
      voice.transcripts[0] === "Dictado Safari." && voice.instances.length === 1 && !voice.runTimer(0));
    check(`${name} never enters Android visual activity states`,
      voice.render().androidVoiceActivity === "inactive" && voice.render().androidResultPulse === 0);
  });
}

withVoiceHook(macSafariUserAgent, (voice) => {
  voice.render().start();
  voice.emitFinal(voice.instances[0], ["Dictado Safari."]);
  voice.render().stop();
  const stopBeforeGrace = voice.instances[0].stopCalls;
  const graceFired = voice.runTimer(700);
  voice.instances[0].onend();
  check("Safari Mac retains 700 ms pre-stop grace and normal completion",
    stopBeforeGrace === 0 && graceFired && voice.instances[0].stopCalls === 1 &&
    voice.transcripts[0] === "Dictado Safari.");
});

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
