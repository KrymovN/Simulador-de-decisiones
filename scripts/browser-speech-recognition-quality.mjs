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
  BROWSER_SPEECH_RECOGNITION_LANGUAGE,
  buildSpeechRecognitionTranscript,
  classifySpeechRecognitionError,
  collectSpeechRecognitionResults,
  collectFinalSpeechRecognitionResults,
  createSpeechRecognitionTranscriptState,
  getBrowserSpeechRecognitionConstructor,
  isAndroidChromiumBrowser,
  isIPhoneSafariBrowser,
  isMacSafariBrowser,
  joinAndroidChromiumFinalSpeechRecognitionResults,
  joinFinalSpeechRecognitionResults,
} = require(join(rootDir, "components", "browser-speech-recognition.ts"));
const { appendVoiceTranscript } = require(join(rootDir, "components", "home-simulator-voice.ts"));

const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

class StandardRecognition {}
class WebkitRecognition {}

check("Spanish recognition language is exact", BROWSER_SPEECH_RECOGNITION_LANGUAGE === "es-ES");
check(
  "Standard SpeechRecognition constructor has priority",
  getBrowserSpeechRecognitionConstructor({
    SpeechRecognition: StandardRecognition,
    webkitSpeechRecognition: WebkitRecognition,
  }) === StandardRecognition,
);
check(
  "webkitSpeechRecognition is used as compatibility fallback",
  getBrowserSpeechRecognitionConstructor({ webkitSpeechRecognition: WebkitRecognition }) === WebkitRecognition,
);
check("Unsupported browser returns a controlled null constructor", getBrowserSpeechRecognitionConstructor({}) === null);

const iphoneSafariUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
const macSafariUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";
const iphoneChromeUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.122 Mobile/15E148 Safari/604.1";
const desktopChromeUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const androidChromeUserAgent =
  "Mozilla/5.0 (Linux; Android 15; 23127PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const androidChromiumUserAgent =
  "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/140.0.0.0 Mobile Safari/537.36";
const ipadDesktopSafariUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

check(
  "iPhone Safari activates the one-shot compatibility target",
  isIPhoneSafariBrowser({ userAgent: iphoneSafariUserAgent }),
);
check(
  "Safari macOS remains outside the one-shot compatibility target",
  !isIPhoneSafariBrowser({ userAgent: macSafariUserAgent }),
);
check(
  "Safari macOS activates only the interim-snapshot compatibility target",
  isMacSafariBrowser({ userAgent: macSafariUserAgent }),
);
check(
  "Chrome on iPhone remains outside the one-shot compatibility target",
  !isIPhoneSafariBrowser({ userAgent: iphoneChromeUserAgent }),
);
check(
  "Desktop Chrome remains outside the one-shot compatibility target",
  !isIPhoneSafariBrowser({ userAgent: desktopChromeUserAgent }),
);
check(
  "Desktop Chrome remains outside the Safari interim-snapshot target",
  !isMacSafariBrowser({ userAgent: desktopChromeUserAgent }),
);
check(
  "iPhone Safari remains outside the macOS interim-snapshot target",
  !isMacSafariBrowser({ userAgent: iphoneSafariUserAgent }),
);
check(
  "iPad desktop-mode Safari remains outside the macOS interim-snapshot target",
  !isMacSafariBrowser({ userAgent: ipadDesktopSafariUserAgent }),
);
check(
  "Android Chrome activates the visual-capture exclusion target",
  isAndroidChromiumBrowser({ userAgent: androidChromeUserAgent }),
);
check(
  "Android Chromium activates the visual-capture exclusion target",
  isAndroidChromiumBrowser({ userAgent: androidChromiumUserAgent }),
);
check(
  "Desktop Chrome remains outside the visual-capture exclusion target",
  !isAndroidChromiumBrowser({ userAgent: desktopChromeUserAgent }),
);
check(
  "Safari macOS remains outside the visual-capture exclusion target",
  !isAndroidChromiumBrowser({ userAgent: macSafariUserAgent }),
);
check(
  "iPhone Safari remains outside the visual-capture exclusion target",
  !isAndroidChromiumBrowser({ userAgent: iphoneSafariUserAgent }),
);

const finalResults = new Map();
const result = (transcript, isFinal) => ({ 0: { confidence: 0.9, transcript }, isFinal, length: 1 });
collectFinalSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("texto provisional", false),
    1: result("Necesito mantener unos ingresos estables.", true),
    2: result("Necesito mantener unos ingresos estables.", true),
    length: 3,
  },
}, finalResults);
check("Only final recognition results are retained", !finalResults.has(0) && finalResults.size === 2);
check(
  "Repeated final fragments are not duplicated",
  joinFinalSpeechRecognitionResults(finalResults) === "Necesito mantener unos ingresos estables.",
);
check(
  "Final transcript uses the existing append policy",
  appendVoiceTranscript(
    "Quiero cambiar de trabajo.",
    joinFinalSpeechRecognitionResults(finalResults),
    1200,
  ) === "Quiero cambiar de trabajo. Necesito mantener unos ingresos estables.",
);
check("Empty transcript preserves existing typed text", appendVoiceTranscript("Texto existente", "   ", 1200) === "Texto existente");

const finalTranscriptState = (transcripts) => {
  const state = createSpeechRecognitionTranscriptState();
  const results = { length: transcripts.length };
  transcripts.forEach((transcript, index) => {
    results[index] = result(transcript, true);
  });
  collectSpeechRecognitionResults({ resultIndex: 0, results }, state);
  return state;
};

const androidStaircaseState = finalTranscriptState([
  "a",
  "a ver",
  "a ver qué",
  "a ver qué tal funciona",
]);
check(
  "Android cumulative staircase keeps only the latest expanding hypothesis",
  joinAndroidChromiumFinalSpeechRecognitionResults(androidStaircaseState.finalFragments) ===
    "a ver qué tal funciona",
);

const androidLongCumulativeState = finalTranscriptState([
  "quiero",
  "quiero comprobar",
  "quiero comprobar si el dictado",
  "quiero comprobar si el dictado funciona correctamente",
  "quiero comprobar si el dictado funciona correctamente en mi teléfono Xiaomi",
]);
check(
  "Android long cumulative Spanish transcript keeps the latest complete hypothesis",
  joinAndroidChromiumFinalSpeechRecognitionResults(androidLongCumulativeState.finalFragments) ===
    "quiero comprobar si el dictado funciona correctamente en mi teléfono Xiaomi",
);

const androidIndependentSegmentsState = finalTranscriptState([
  "Quiero cambiar de trabajo.",
  "Necesito mantener unos ingresos estables.",
]);
check(
  "Android independent finalized segments remain in order",
  joinAndroidChromiumFinalSpeechRecognitionResults(androidIndependentSegmentsState.finalFragments) ===
    "Quiero cambiar de trabajo. Necesito mantener unos ingresos estables.",
);

const transcriptState = createSpeechRecognitionTranscriptState();
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("Quiero cambiar", false),
    length: 1,
  },
}, transcriptState);
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("Quiero cambiar de trabajo", false),
    length: 1,
  },
}, transcriptState);
check(
  "New interim hypothesis replaces the previous interim",
  transcriptState.latestInterim?.transcript === "Quiero cambiar de trabajo",
);
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("Quiero cambiar de trabajo", true),
    1: result("porque busco", false),
    length: 2,
  },
}, transcriptState);
collectSpeechRecognitionResults({
  resultIndex: 1,
  results: {
    0: result("Quiero cambiar de trabajo", true),
    1: result("porque busco más estabilidad", true),
    length: 2,
  },
}, transcriptState);
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("Quiero cambiar de trabajo", true),
    1: result("porque busco más estabilidad", true),
    2: result("porque busco más estabilidad", true),
    length: 3,
  },
}, transcriptState);
check(
  "Final fragments accumulate by resultIndex without duplication",
  buildSpeechRecognitionTranscript(transcriptState, false) ===
    "Quiero cambiar de trabajo porque busco más estabilidad",
);

const interimFallbackState = createSpeechRecognitionTranscriptState();
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("Necesito mantener unos ingresos", true),
    1: result("unos ingresos estables durante el cambio", false),
    length: 2,
  },
}, interimFallbackState);
check(
  "Latest interim fallback preserves only non-duplicating trailing words",
  buildSpeechRecognitionTranscript(interimFallbackState, true) ===
    "Necesito mantener unos ingresos estables durante el cambio",
);

const interimOnlyState = createSpeechRecognitionTranscriptState();
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("Primeras y últimas palabras", false),
    length: 1,
  },
}, interimOnlyState);
check(
  "Meaningful interim can be the bounded terminal fallback when final is empty",
  buildSpeechRecognitionTranscript(interimOnlyState, true) ===
    "Primeras y últimas palabras",
);

const safariCumulativeState = createSpeechRecognitionTranscriptState();
for (const transcript of [
  "quiero",
  "quiero cambiar",
  "quiero cambiar de trabajo",
]) {
  collectSpeechRecognitionResults({
    resultIndex: 0,
    results: {
      0: result(transcript, false),
      length: 1,
    },
  }, safariCumulativeState);
}
check(
  "Safari cumulative interim stream commits only the latest browser hypothesis",
  buildSpeechRecognitionTranscript(safariCumulativeState, true) ===
    "quiero cambiar de trabajo",
);

const safariLateResultState = createSpeechRecognitionTranscriptState();
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("quiero cambiar de trabajo porque", true),
    length: 1,
  },
}, safariLateResultState);
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("quiero cambiar de trabajo porque necesito estabilidad", false),
    length: 1,
  },
}, safariLateResultState);
check(
  "Late interim in the same result slot supersedes an earlier final snapshot",
  buildSpeechRecognitionTranscript(safariLateResultState, true, true) ===
    "quiero cambiar de trabajo porque necesito estabilidad",
);
check(
  "Non-Safari paths keep the existing final result priority for the same slot",
  buildSpeechRecognitionTranscript(safariLateResultState, true, false) ===
    "quiero cambiar de trabajo porque",
);

const safariRevisionState = createSpeechRecognitionTranscriptState();
for (const transcript of [
  "quiero cambiar de trabajo y necesito estabilidad durante varios meses ahora",
  "quiero cambiar de empleo y necesito estabilidad durante meses",
  "quiero cambiar de empleo y necesito estabilidad durante los próximos meses sin perder ingresos",
]) {
  collectSpeechRecognitionResults({
    resultIndex: 0,
    results: {
      0: result(transcript, false),
      length: 1,
    },
  }, safariRevisionState);
}
check(
  "Latest valid Safari hypothesis wins by event order rather than maximum prior length",
  buildSpeechRecognitionTranscript(safariRevisionState, true) ===
    "quiero cambiar de empleo y necesito estabilidad durante los próximos meses sin perder ingresos",
);

const finalWithTrailingInterimState = createSpeechRecognitionTranscriptState();
collectSpeechRecognitionResults({
  resultIndex: 0,
  results: {
    0: result("quiero cambiar de trabajo", true),
    1: result("de trabajo sin perder estabilidad", false),
    length: 2,
  },
}, finalWithTrailingInterimState);
check(
  "Final transcript plus trailing interim keeps only the additional non-duplicating tail",
  buildSpeechRecognitionTranscript(finalWithTrailingInterimState, true) ===
    "quiero cambiar de trabajo sin perder estabilidad",
);

for (const [error, expected] of [
  ["not-allowed", "MIC_PERMISSION_DENIED"],
  ["service-not-allowed", "MIC_PERMISSION_DENIED"],
  ["audio-capture", "MIC_NOT_AVAILABLE"],
  ["no-speech", "NO_SPEECH"],
  ["aborted", "RECOGNITION_ABORTED"],
  ["network", "RECOGNITION_FAILED"],
]) {
  check(`Speech recognition error ${error} is controlled`, classifySpeechRecognitionError(error) === expected);
}

for (const item of checks) console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
const failed = checks.filter((item) => !item.passed);
console.log(`\nBrowser speech recognition quality gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
