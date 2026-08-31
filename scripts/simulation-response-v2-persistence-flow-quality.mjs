import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeModule = require(join(
  root,
  "lib/runtime-integration/controlled-production-ai-runtime-switch.server.ts",
));
const { bindControlledProductionAiRuntimeSwitch } = runtimeModule;
const {
  DecisionMaterialTransportFailure,
} = require(join(root, "lib/ai-provider/openai-decision-material-adapter.ts"));
const {
  validCandidateDecisionMaterial,
} = require(join(root, "lib/ai-provider/openai-decision-material-adapter-validation.ts"));
const {
  isPublicSimulationApiV2Envelope,
} = require(join(root, "lib/runtime-integration/public-simulation-api-v2-contracts.ts"));
const {
  initializePersistenceRuntimeWiring,
} = require(join(root, "lib/persistence-runtime/runtime-wiring.ts"));
const {
  readSavedSimulationDetailSurface,
  readSavedSimulationsHistorySurface,
  saveCompletedSimulationSurface,
} = require(join(root, "lib/saved-decision-simulations/product-surface.ts"));
const {
  presentScenarioTitle,
} = require(join(root, "lib/simulator-result-presentation.ts"));
const {
  deleteDecisionSimulation,
} = require(join(root, "lib/saved-decision-simulations/runtime.ts"));
const {
  createRetentionRuntimeFoundation,
  DEFAULT_RETENTION_RUNTIME_POLICIES,
} = require(join(root, "lib/user-data-controls/retention-runtime.ts"));

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden in V2 persistence proof.");
};

const originalFlag = process.env.LEVIO_REAL_AI_DEV_ENABLED;
const originalRuntimeCall = runtimeModule.runControlledProductionAiRuntimeSwitch;
let activeRuntime;
let runtimeCalls = 0;
runtimeModule.runControlledProductionAiRuntimeSwitch = async (request) => {
  runtimeCalls += 1;
  return activeRuntime.execute(request);
};
const { POST } = require(join(root, "app/api/simulate/route.ts"));

const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const fixedClock = () => "2026-08-24T08:00:00.000Z";
const enabledEnvironment = {
  LEVIO_REAL_AI_DEV_ENABLED: "true",
  LEVIO_AI_PROVIDER: "openai",
  OPENAI_API_KEY: "offline-proof-key",
};
const enabledPersistence = {
  enabled: true,
  simulationRecordPersistence: { enabled: true },
};
const publicInput =
  "Comparar Plan Norte o Plan Sur para un lanzamiento ficticio con menos de 5000 euros.";
const recordId = "6e93864d-d53e-48d5-b98b-b8a82e590d61";
const ownerAReference = "40720fc0-045e-439a-9c30-24772314a401";
const ownerBReference = "71ac44cb-f530-468c-b116-10607602b402";
const ownerAPrincipal = "db93f996-7eeb-4a8d-b776-c0866a8aa501";
const ownerBPrincipal = "9b8131cd-522b-4795-b82a-1458e0cac502";
const storedRecords = new Map();
let saveCalls = 0;

function publicRequest(source) {
  return new Request("http://localhost/api/simulate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": `v2-persistence-proof-${source}`,
      "x-forwarded-for": `198.51.100.${source}`,
    },
    body: JSON.stringify({ input: publicInput, lang: "es" }),
  });
}

function authContext(providerReference, principalId, suffix) {
  return {
    identityState: "authenticated",
    principal: {
      principalId,
      principalType: "registered_user",
      providerReference: `supabase:${providerReference}`,
    },
    sessionId: `v2-persistence-proof-${suffix}`,
    sessionStatus: "active",
    assuranceLevel: "authenticated",
    riskFlags: [],
  };
}

function principal(providerReference, principalId) {
  return {
    principal_id: principalId,
    principal_type: "registered_user",
    principal_status: "active",
    provider_name: "supabase",
    provider_reference: providerReference,
    provider_reference_status: "active",
    provider_subject_type: "user",
    provider_email_snapshot: null,
    provider_email_verified: false,
    created_at: fixedClock(),
    updated_at: fixedClock(),
    verified_at: null,
    disabled_at: null,
    deleted_at: null,
    deletion_requested_at: null,
    last_authenticated_at: fixedClock(),
    last_provider_sync_at: fixedClock(),
    deletion_state: "active",
    retention_rule: "account_lifecycle",
    recovery_state: null,
    locale_preference: "es",
    metadata_version: 1,
    legal_hold_reason: null,
    schema_version: 1,
  };
}

const principals = new Map([
  [ownerAReference, principal(ownerAReference, ownerAPrincipal)],
  [ownerBReference, principal(ownerBReference, ownerBPrincipal)],
]);

const persistenceProvider = {
  providerId: "supabase",
  executionBoundary: "server_only",
  async resolvePrincipalByProviderReference({ providerReference }) {
    return principals.get(providerReference.replace(/^supabase:/, "")) ?? null;
  },
  async saveSimulationRecord(payload) {
    saveCalls += 1;
    const row = {
      ...payload,
      record_id: recordId,
      originating_draft_id: null,
      parent_record_id: null,
      revision_label: null,
      created_at: fixedClock(),
      updated_at: fixedClock(),
      archived_at: null,
      deleted_at: null,
      last_exported_at: null,
      legal_hold_reason: null,
    };
    storedRecords.set(recordId, row);
    return row;
  },
  async readSimulationRecord({ recordId: requestedId, ownerPrincipalId }) {
    const row = storedRecords.get(requestedId);
    return row?.owner_principal_id === ownerPrincipalId && row.record_status === "active" &&
      row.deletion_state === "active" ? row : null;
  },
  async listSimulationRecords({ ownerPrincipalId, limit }) {
    return [...storedRecords.values()]
      .filter((row) => row.owner_principal_id === ownerPrincipalId &&
        row.record_status === "active" && row.deletion_state === "active")
      .slice(0, limit);
  },
  async deleteSimulationRecord({ recordId: requestedId, ownerPrincipalId, deletedAt }) {
    const row = storedRecords.get(requestedId);
    if (!row || row.owner_principal_id !== ownerPrincipalId || row.record_status !== "active") {
      return { status: "not_found" };
    }
    const deleted = {
      ...row,
      record_status: "deleted",
      deletion_state: "deleted",
      title: null,
      user_note: null,
      user_input_snapshot: {},
      deterministic_output_snapshot: {},
      metadata: {},
      safety_flags: {},
      clarification_snapshot: null,
      decision_model_snapshot: null,
      confidence_summary: null,
      deleted_at: deletedAt,
      updated_at: deletedAt,
      export_eligible: false,
    };
    storedRecords.set(requestedId, deleted);
    return { status: "deleted", record: deleted };
  },
};

function boundRuntime(transport) {
  return bindControlledProductionAiRuntimeSwitch(
    enabledEnvironment,
    () => transport,
    fixedClock,
  );
}

function collectKeys(value, keys = new Set()) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }
  Object.entries(value).forEach(([key, nested]) => {
    keys.add(key);
    collectKeys(nested, keys);
  });
  return keys;
}

try {
  const authA = authContext(ownerAReference, ownerAPrincipal, "owner-a");
  const authB = authContext(ownerBReference, ownerBPrincipal, "owner-b");
  const persistenceRuntime = initializePersistenceRuntimeWiring({
    providerAdapter: persistenceProvider,
  });
  const providerRequests = [];
  activeRuntime = boundRuntime({
    async countInput(request) {
      providerRequests.push(request);
      return 1200;
    },
    async generate(request) {
      providerRequests.push(request);
      return {
        status: "completed",
        outputText: JSON.stringify(validCandidateDecisionMaterial()),
        usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 },
      };
    },
  });
  process.env.LEVIO_REAL_AI_DEV_ENABLED = "true";
  const successResponse = await POST(publicRequest(91));
  const success = await successResponse.json();

  add(
    "route-produces-completed-v2-for-ui",
    successResponse.status === 200 && isPublicSimulationApiV2Envelope(success) &&
      success.status === "completed" && success.uiModel.renderState !== "controlled_failure",
    "Expected completed canonical V2 envelope and renderable UI model.",
  );

  const signedOutSave = await saveCompletedSimulationSurface({
    authContext: {
      identityState: "signed_out",
      error: { code: "session_missing", message: "No proof session." },
    },
    simulation: success,
    runtime: persistenceRuntime,
    saveProvider: persistenceProvider,
    config: enabledPersistence,
  });
  add(
    "v2-keeps-existing-unauthenticated-save-contract",
    signedOutSave.status === "auth_required" && saveCalls === 0,
    "V2 must reuse the existing login-required behavior without touching persistence.",
  );

  const saved = await saveCompletedSimulationSurface({
    authContext: authA,
    simulation: success,
    runtime: persistenceRuntime,
    saveProvider: persistenceProvider,
    config: enabledPersistence,
  });
  const stored = storedRecords.get(recordId);
  add(
    "authenticated-owner-saves-v2",
    saved.status === "saved" && saved.recordId === recordId && saveCalls === 1 &&
      stored?.owner_principal_id === ownerAPrincipal,
    "Existing authenticated save surface must derive and preserve owner scope.",
  );
  add(
    "v2-contract-and-runtime-provenance-persisted",
    stored?.simulation_response_version === "simulation_response_v2" &&
      stored?.decision_contract_version === "2.0" &&
      stored?.metadata.runtimeSource === "production_ai" &&
      stored?.metadata.responseMode === "production_v2" &&
      stored?.safety_flags.aiProviderUsed === true && stored?.safety_flags.mockOnly === false,
    "Persisted V2 discriminator and controlled production provenance must be truthful.",
  );

  const persistedKeys = collectKeys({
    output: stored?.deterministic_output_snapshot,
    metadata: stored?.metadata,
  });
  const forbiddenKeys = [
    "requestId",
    "traceability",
    "evidence",
    "evidenceRefs",
    "controlledFailures",
    "decisionContext",
    "promptContext",
    "candidateMaterial",
    "rawProviderPayload",
    "matcher",
    "oracle",
  ];
  add(
    "persisted-v2-is-minimum-user-visible-projection",
    forbiddenKeys.every((key) => !persistedKeys.has(key)) &&
      persistedKeys.has("decision") && persistedKeys.has("scenarios") &&
      persistedKeys.has("recommendation") && persistedKeys.has("notices"),
    `Forbidden persisted keys: ${forbiddenKeys.filter((key) => persistedKeys.has(key)).join(", ")}`,
  );

  const history = await readSavedSimulationsHistorySurface({
    authContext: authA,
    runtime: persistenceRuntime,
    readProvider: persistenceProvider,
    config: enabledPersistence,
  });
  const reopened = await readSavedSimulationDetailSurface({
    authContext: authA,
    recordId,
    runtime: persistenceRuntime,
    readProvider: persistenceProvider,
    config: enabledPersistence,
  });
  const expectedReopenedTitles = success.uiModel.sections.scenarios.items.map((scenario) =>
    presentScenarioTitle({
      optionLabel: scenario.optionLabel,
      perspective: scenario.perspective,
      submittedInput: success.uiModel.sections.decisionSummary.items[0]?.statement ?? "",
    }),
  );
  const reopenedTitles = reopened.status === "loaded"
    ? reopened.simulation.scenarios.map((scenario) => scenario.title)
    : [];
  const reopenedDescriptions = reopened.status === "loaded"
    ? reopened.simulation.scenarios.map((scenario) => scenario.copy)
    : [];
  const storedOptionLabels = stored.deterministic_output_snapshot.analysis.scenarios
    .map((scenario) => scenario.optionLabel);
  add(
    "owner-list-and-reopen-preserve-v2-result",
    history.status === "ready" && history.simulations.length === 1 &&
      history.simulations[0].sourceLabel === "Resultado orientativo" &&
      reopened.status === "loaded" && reopened.simulation.sourceLabel === "Resultado orientativo" &&
      reopened.simulation.decisionSummary === success.uiModel.sections.decisionSummary.items[0]?.statement &&
      stored.deterministic_output_snapshot.analysis.scenarios.length ===
        success.uiModel.sections.scenarios.items.length &&
      reopened.simulation.scenarios.length ===
        Math.min(4, success.uiModel.sections.scenarios.items.length) &&
      JSON.stringify(reopenedTitles) === JSON.stringify(expectedReopenedTitles.slice(0, 4)) &&
      reopenedTitles.every((title) => !title.includes("Delay and gather more information")) &&
      reopenedDescriptions.every((description) =>
        !/Decision Engine|simulaci[oó]n determin[ií]stica/i.test(description)
      ) &&
      JSON.stringify(storedOptionLabels) === JSON.stringify(
        success.uiModel.sections.scenarios.items.map((scenario) => scenario.optionLabel),
      ),
    `history=${JSON.stringify(history)} reopened=${JSON.stringify(reopened)} expectedDecision=${JSON.stringify(success.uiModel.sections.decisionSummary.items[0]?.statement)} expectedScenarios=${success.uiModel.sections.scenarios.items.length}`,
  );

  const crossOwner = await readSavedSimulationDetailSurface({
    authContext: authB,
    recordId,
    runtime: persistenceRuntime,
    readProvider: persistenceProvider,
    config: enabledPersistence,
  });
  add(
    "cross-owner-reopen-denied",
    crossOwner.status === "not_found",
    "A second authenticated owner must not reopen the first owner's V2 record.",
  );

  const exported = history.status === "ready" ? history.simulations[0] : null;
  const exportKeys = exported ? Object.keys(exported).sort() : [];
  const permittedExportKeys = [
    "confidenceLabel", "createdLabel", "href", "id", "recommendationLabel", "riskLabel",
    "sourceLabel", "statusLabel", "summary", "title",
  ].sort();
  add(
    "export-remains-existing-permitted-history-representation",
    JSON.stringify(exportKeys) === JSON.stringify(permittedExportKeys) &&
      !JSON.stringify(exported).includes("traceability") &&
      !JSON.stringify(exported).includes("providerRequest"),
    `Observed export keys: ${exportKeys.join(", ")}`,
  );

  const retention = createRetentionRuntimeFoundation({
    enabled: true,
    policies: DEFAULT_RETENTION_RUNTIME_POLICIES,
  }).evaluate({
    authContext: authA,
    resource: {
      resourceId: recordId,
      resourceCategory: "saved_simulation",
      ownerPrincipalId: ownerAPrincipal,
      ownerPrincipalType: "registered_user",
      lifecycleState: "active",
      deletionState: stored.deletion_state,
      retentionRule: stored.retention_rule,
      createdAt: stored.created_at,
      updatedAt: stored.updated_at,
      exportEligible: stored.export_eligible,
    },
    now: fixedClock(),
  });
  add(
    "existing-retention-contract-covers-v2-generically",
    retention.status === "allowed" && retention.decision === "retain" &&
      retention.retentionRule === "saved_simulation_lifecycle",
    "V2 must remain under the existing saved-simulation lifecycle rule.",
  );

  activeRuntime = boundRuntime({
    async countInput() {
      throw new DecisionMaterialTransportFailure("provider_unavailable");
    },
    async generate() {
      throw new Error("Generation must not run after controlled transport failure.");
    },
  });
  const failureResponse = await POST(publicRequest(92));
  const failure = await failureResponse.json();
  const savesBeforeFailure = saveCalls;
  const blockedFailureSave = await saveCompletedSimulationSurface({
    authContext: authA,
    simulation: failure,
    runtime: persistenceRuntime,
    saveProvider: persistenceProvider,
    config: enabledPersistence,
  });
  add(
    "controlled-failure-cannot-be-saved-as-success",
    failureResponse.status === 502 && isPublicSimulationApiV2Envelope(failure) &&
      failure.status === "failed" && failure.data === null &&
      blockedFailureSave.status === "error" && saveCalls === savesBeforeFailure,
    "Existing no-result persistence rule must block controlled V2 failure before provider save.",
  );

  const homeSource = readFileSync(join(root, "components/HomeSimulator.tsx"), "utf8");
  const exportSource = readFileSync(
    join(root, "lib/user-data-controls/account-data-export-surface.ts"),
    "utf8",
  );
  add(
    "home-connects-only-completed-production-envelope-to-save",
    homeSource.includes("const simulation = result ?? productionResult") &&
      homeSource.includes("saveCompletedSimulationFromUi({ simulation })") &&
      homeSource.includes("production: payload") &&
      exportSource.includes("savedSimulations.simulations"),
    "Home must retain the completed public envelope and reuse the existing save/export chain.",
  );

  const deleted = await deleteDecisionSimulation({
    authContext: authA,
    recordId,
    runtime: persistenceRuntime,
    deleteProvider: persistenceProvider,
    config: enabledPersistence,
    deletedAt: "2026-08-24T09:00:00.000Z",
  });
  const historyAfterDelete = await readSavedSimulationsHistorySurface({
    authContext: authA,
    runtime: persistenceRuntime,
    readProvider: persistenceProvider,
    config: enabledPersistence,
  });
  const reopenedAfterDelete = await readSavedSimulationDetailSurface({
    authContext: authA,
    recordId,
    runtime: persistenceRuntime,
    readProvider: persistenceProvider,
    config: enabledPersistence,
  });
  const terminal = storedRecords.get(recordId);
  add(
    "existing-deletion-contract-removes-v2-user-data",
    deleted.status === "deleted" && historyAfterDelete.status === "empty" &&
      reopenedAfterDelete.status === "not_found" && terminal.record_status === "deleted" &&
      terminal.export_eligible === false &&
      Object.keys(terminal.deterministic_output_snapshot).length === 0,
    "V2 deletion must use the existing terminal sanitization and disappear from list/reopen.",
  );

  const callsBeforeDisabled = runtimeCalls;
  process.env.LEVIO_REAL_AI_DEV_ENABLED = "false";
  const disabledResponse = await POST(publicRequest(93));
  const disabled = await disabledResponse.json();
  add(
    "real-ai-remains-disabled-by-default",
    disabledResponse.status === 200 && disabled.contractVersion === "simulate-api-v1-mock" &&
      disabled.meta?.mockOnly === true && runtimeCalls === callsBeforeDisabled,
    "Disabled default must remain the deterministic preview and skip production runtime.",
  );
  add(
    "deterministic-provider-fixture-only-no-network",
    providerRequests.length === 2 && externalNetworkRequests === 0,
    `Provider fixture calls ${providerRequests.length}; external network ${externalNetworkRequests}.`,
  );
} finally {
  runtimeModule.runControlledProductionAiRuntimeSwitch = originalRuntimeCall;
  globalThis.fetch = originalFetch;
  if (originalFlag === undefined) delete process.env.LEVIO_REAL_AI_DEV_ENABLED;
  else process.env.LEVIO_REAL_AI_DEV_ENABLED = originalFlag;
}

for (const check of checks) {
  console[check.passed ? "log" : "error"](
    `${check.passed ? "PASS" : "FAIL"} ${check.id}${check.passed ? "" : ` - ${check.detail}`}`,
  );
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
