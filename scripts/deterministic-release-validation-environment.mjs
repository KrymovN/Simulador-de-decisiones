const PROVIDER_ENVIRONMENT_KEYS = new Set([
  "LEVIO_AI_PROVIDER",
  "LEVIO_VOICE_TRANSCRIPTION_MODEL",
  "LEVIO_VOICE_TRANSCRIPTION_PROVIDER",
]);

const PROVIDER_ENVIRONMENT_PREFIXES = [
  "OPENAI_",
  "AZURE_OPENAI_",
];

export const DETERMINISTIC_RELEASE_VALIDATION_FLAG =
  "LEVIO_DETERMINISTIC_RELEASE_VALIDATION";

export function createDeterministicReleaseValidationEnvironment(source) {
  const environment = { ...source };

  for (const key of Object.keys(environment)) {
    if (
      PROVIDER_ENVIRONMENT_KEYS.has(key) ||
      PROVIDER_ENVIRONMENT_PREFIXES.some((prefix) => key.startsWith(prefix))
    ) {
      delete environment[key];
    }
  }

  environment.LEVIO_REAL_AI_DEV_ENABLED = "false";
  environment.LEVIO_VOICE_TRANSCRIPTION_ENABLED = "false";
  environment[DETERMINISTIC_RELEASE_VALIDATION_FLAG] = "true";

  return environment;
}

export function inspectDeterministicReleaseValidationEnvironment(environment) {
  const providerKeys = Object.keys(environment).filter((key) =>
    PROVIDER_ENVIRONMENT_KEYS.has(key) ||
    PROVIDER_ENVIRONMENT_PREFIXES.some((prefix) => key.startsWith(prefix))
  );

  return {
    realAiExplicitlyOff: environment.LEVIO_REAL_AI_DEV_ENABLED === "false",
    voiceTranscriptionExplicitlyOff:
      environment.LEVIO_VOICE_TRANSCRIPTION_ENABLED === "false",
    deterministicReleaseValidation:
      environment[DETERMINISTIC_RELEASE_VALIDATION_FLAG] === "true",
    providerEnvironmentKeysPresent: providerKeys,
  };
}
