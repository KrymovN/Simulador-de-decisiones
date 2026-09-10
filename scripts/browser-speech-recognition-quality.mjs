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
  classifySpeechRecognitionError,
  collectFinalSpeechRecognitionResults,
  getBrowserSpeechRecognitionConstructor,
  isIPhoneSafariBrowser,
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

check(
  "iPhone Safari activates the one-shot compatibility target",
  isIPhoneSafariBrowser({ userAgent: iphoneSafariUserAgent }),
);
check(
  "Safari macOS remains outside the one-shot compatibility target",
  !isIPhoneSafariBrowser({ userAgent: macSafariUserAgent }),
);
check(
  "Chrome on iPhone remains outside the one-shot compatibility target",
  !isIPhoneSafariBrowser({ userAgent: iphoneChromeUserAgent }),
);
check(
  "Desktop Chrome remains outside the one-shot compatibility target",
  !isIPhoneSafariBrowser({ userAgent: desktopChromeUserAgent }),
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
