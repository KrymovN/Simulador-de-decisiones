import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDeterministicReleaseValidationEnvironment,
  inspectDeterministicReleaseValidationEnvironment,
} from "./deterministic-release-validation-environment.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const recordPath = join(rootDir, ".next", "deterministic-release-validation-record.json");
const validationEnvironment = createDeterministicReleaseValidationEnvironment(process.env);
const environmentInspection = inspectDeterministicReleaseValidationEnvironment(validationEnvironment);

const steps = [
  { id: "production-build", command: npmCommand, args: ["run", "build"] },
  { id: "simulation-pipeline-runner", command: npmCommand, args: ["run", "quality:simulation-pipeline-runner"] },
  { id: "simulation-response-public-adapter", command: npmCommand, args: ["run", "quality:simulation-response-public-adapter"] },
  { id: "provider-proof-public-simulator", command: npmCommand, args: ["run", "quality:public-simulator"], providerEvidence: true },
  { id: "typescript", command: join(rootDir, "node_modules", ".bin", "tsc"), args: ["--noEmit"] },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: rootDir,
      env: validationEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";

    const forward = (target) => (chunk) => {
      const text = chunk.toString();
      output += text;
      target.write(text);
    };
    child.stdout.on("data", forward(process.stdout));
    child.stderr.on("data", forward(process.stderr));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`${step.id} exited with ${code ?? signal ?? "unknown status"}.`));
    });
  });
}

function parseProviderEvidence(output) {
  const line = output.split("\n").find((value) =>
    value.startsWith("LEVIO_PROVIDER_OPERATION_EVIDENCE ")
  );
  if (!line) {
    throw new Error("Provider operation evidence is missing from the public simulator gate.");
  }
  return JSON.parse(line.slice("LEVIO_PROVIDER_OPERATION_EVIDENCE ".length));
}

const results = [];
let providerOperations;

try {
  if (
    !environmentInspection.realAiExplicitlyOff ||
    !environmentInspection.deterministicReleaseValidation ||
    environmentInspection.providerEnvironmentKeysPresent.length !== 0
  ) {
    throw new Error("Deterministic release-validation environment isolation failed.");
  }

  for (const step of steps) {
    console.log(`\n[release-validation] ${step.id}`);
    const output = await runStep(step);
    results.push({ id: step.id, result: "PASS" });
    if (step.providerEvidence) {
      providerOperations = parseProviderEvidence(output);
    }
  }

  if (
    !providerOperations ||
    Object.values(providerOperations).some((value) => value !== 0)
  ) {
    throw new Error("Deterministic release validation observed a provider operation.");
  }

  const repositoryHead = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
  const workingTreeClean = execFileSync("git", ["status", "--porcelain"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim() === "";
  const record = {
    recordVersion: "levio-deterministic-release-validation.1",
    repositoryHead,
    validationCommand: "npm run release:validate:deterministic",
    generatedAt: new Date().toISOString(),
    environment: {
      realAi: "OFF",
      deterministicReleaseValidation: true,
      providerEnvironmentIsolated: true,
    },
    providerOperations,
    deterministicGates: results,
    build: "PASS",
    workingTreeClean,
    result: "PASS",
  };

  mkdirSync(dirname(recordPath), { recursive: true });
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`\n[release-validation] record: ${recordPath}`);
  console.log(JSON.stringify(record, null, 2));
} catch (error) {
  console.error(`\n[release-validation] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
