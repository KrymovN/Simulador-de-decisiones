import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  createExportRuntimeFoundation,
  DEFAULT_EXPORT_DATA_CATEGORIES,
  DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
} from "./export-runtime";
import type {
  ExportResourceSnapshot,
  ExportRuntimeBlockedReason,
  ExportRuntimeEvaluationResult,
  ExportRuntimeValidationCaseResult,
  ExportRuntimeValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => ExportRuntimeEvaluationResult;
  assertions: ((result: ExportRuntimeEvaluationResult) => string | undefined)[];
};

const principalId = "stage4_3d_registered_principal";
const requestedAt = "2026-06-19T13:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId,
    principalType: "registered_user",
    providerReference: "supabase:9f1e5a40-0a5f-4f76-8c9c-333333333333",
  },
  sessionId: "stage_4_3d_validation_session",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
};

const signedOutContext: LevioAuthRuntimeContext = {
  identityState: "signed_out",
  error: {
    code: "session_missing",
    message: "No validation session.",
  },
};

const principalMetadata: ExportResourceSnapshot = {
  resourceId: "principal_stage4_3d",
  resourceCategory: "levio_principal_metadata",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  exportEligible: true,
  deletionState: "active",
  lifecycleState: "active",
  dataCategories: ["principal_profile", "lifecycle_metadata"],
  createdAt: "2026-06-18T09:00:00.000Z",
  updatedAt: "2026-06-18T09:10:00.000Z",
  deletedAt: null,
  schemaVersion: 1,
};

const savedSimulation: ExportResourceSnapshot = {
  resourceId: "record_stage4_3d_saved",
  resourceCategory: "saved_simulation",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  exportEligible: true,
  deletionState: "active",
  lifecycleState: "active",
  dataCategories: ["simulation_record", "decision_provenance", "lifecycle_metadata"],
  createdAt: "2026-06-18T10:00:00.000Z",
  updatedAt: "2026-06-18T10:10:00.000Z",
  archivedAt: null,
  deletedAt: null,
  retentionRule: "saved_simulation_lifecycle",
  schemaVersion: 1,
};

const draft: ExportResourceSnapshot = {
  resourceId: "draft_stage4_3d",
  resourceCategory: "simulation_draft",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  exportEligible: true,
  deletionState: "active",
  lifecycleState: "active",
  dataCategories: ["simulation_draft", "lifecycle_metadata"],
  createdAt: "2026-06-19T08:00:00.000Z",
  updatedAt: "2026-06-19T08:10:00.000Z",
  expiresAt: "2026-06-20T08:00:00.000Z",
  deletedAt: null,
  retentionRule: "draft_short_lifecycle",
  schemaVersion: 1,
};

const historyEntry: ExportResourceSnapshot = {
  resourceId: "history_stage4_3d",
  resourceCategory: "simulation_history_entry",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  exportEligible: true,
  deletionState: "active",
  lifecycleState: "active",
  dataCategories: ["simulation_history", "lifecycle_metadata"],
  createdAt: "2026-06-18T10:20:00.000Z",
  updatedAt: "2026-06-18T10:20:00.000Z",
  deletedAt: null,
  retentionRule: "parent_simulation_lifecycle",
  schemaVersion: 1,
};

function enabledRuntime() {
  return createExportRuntimeFoundation({
    enabled: true,
    allowedDataCategories: DEFAULT_EXPORT_DATA_CATEGORIES,
    forbiddenDataCategories: DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
  });
}

function request() {
  return {
    requestId: "export_stage4_3d_request",
    scope: {
      includePrincipalMetadata: true,
      includeSavedSimulations: true,
      includeSimulationDrafts: true,
      includeSimulationHistory: true,
    },
    requestedAt,
    packageFormat: "manifest_only" as const,
  };
}

function expectBlocked(reason: ExportRuntimeBlockedReason) {
  return (result: ExportRuntimeEvaluationResult): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(result: ExportRuntimeEvaluationResult): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only export result.";
}

function expectIsolation(result: ExportRuntimeEvaluationResult): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.3D" &&
    evidence.exportOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
    evidence.runtimeWritesEnabled === false &&
    evidence.fileCreated === false &&
    evidence.archiveCreated === false &&
    evidence.jsonCreated === false &&
    evidence.csvCreated === false &&
    evidence.storageConnected === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.supabaseConnected === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.cronJobsStarted === false &&
    evidence.deletionRuntimeStarted === false &&
    evidence.retentionRuntimeChanged === false &&
    evidence.consentRuntimeChanged === false &&
    evidence.authRuntimeChanged === false &&
    evidence.simulatorIntegrated === false &&
    evidence.persistenceSchemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.aiIntegrated === false &&
    evidence.stage43EStarted === false &&
    evidence.stage44Started === false &&
    evidence.stage5Started === false
    ? undefined
    : "Export runtime isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled export runtime blocks by default",
      expectedBehavior: "Fail closed before any export request can be evaluated.",
      run: () =>
        createExportRuntimeFoundation().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("export_runtime_disabled"), expectIsolation],
    },
    {
      id: "missing_auth_context_denied",
      title: "Missing auth context is denied",
      expectedBehavior: "Require auth context for every export evaluation.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: null,
          request: request(),
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("auth_context_missing"), expectIsolation],
    },
    {
      id: "signed_out_denied",
      title: "Signed-out context is denied",
      expectedBehavior: "Require authenticated registered-user context.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: signedOutContext,
          request: request(),
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("auth_context_not_authenticated"), expectIsolation],
    },
    {
      id: "expired_session_denied",
      title: "Expired sessions are denied",
      expectedBehavior: "Require active session before export preflight can pass.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: {
            ...authenticatedContext,
            sessionStatus: "expired",
          },
          request: request(),
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("session_not_active"), expectIsolation],
    },
    {
      id: "client_owner_injection_denied",
      title: "Client owner fields are rejected",
      expectedBehavior: "Reject caller-supplied owner or provider fields.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [principalMetadata],
          clientOwnerFields: {
            ownerPrincipalId: principalId,
          },
        }),
      assertions: [expectBlocked("client_owner_input_rejected"), expectIsolation],
    },
    {
      id: "missing_request_denied",
      title: "Missing export request is denied",
      expectedBehavior: "Require a request model before export scope can be evaluated.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: null,
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("export_request_missing"), expectIsolation],
    },
    {
      id: "empty_scope_denied",
      title: "Empty export scope is denied",
      expectedBehavior: "At least one approved export scope must be requested.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request(),
            scope: {
              includePrincipalMetadata: false,
              includeSavedSimulations: false,
              includeSimulationDrafts: false,
              includeSimulationHistory: false,
            },
          },
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("export_scope_empty"), expectIsolation],
    },
    {
      id: "resource_owner_mismatch_denied",
      title: "Resource owner mismatch is denied",
      expectedBehavior: "Every resource snapshot must belong to the authenticated principal.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [
            {
              ...savedSimulation,
              ownerPrincipalId: "another_principal",
            },
          ],
        }),
      assertions: [expectBlocked("resource_owner_mismatch"), expectIsolation],
    },
    {
      id: "forbidden_data_denied",
      title: "Forbidden data categories are denied",
      expectedBehavior: "Provider secrets, tokens, AI prompts, vectors, memory, and billing data fail closed.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [
            {
              ...savedSimulation,
              forbiddenDataCategories: ["ai_prompt"],
            },
          ],
        }),
      assertions: [expectBlocked("resource_forbidden_data_present"), expectIsolation],
    },
    {
      id: "unsupported_data_category_denied",
      title: "Unsupported data category is denied",
      expectedBehavior: "Only approved export data categories can enter the package plan.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [
            {
              ...savedSimulation,
              dataCategories: ["simulation_record", "billing_record" as never],
            },
          ],
        }),
      assertions: [expectBlocked("resource_data_category_not_allowed"), expectIsolation],
    },
    {
      id: "invalid_timestamp_denied",
      title: "Invalid timestamp is denied",
      expectedBehavior: "Export evaluation fails closed on invalid temporal evidence.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request(),
            requestedAt: "not-a-date",
          },
          resources: [principalMetadata],
        }),
      assertions: [expectBlocked("timestamp_invalid"), expectIsolation],
    },
    {
      id: "no_exportable_resources_denied",
      title: "No exportable resources is denied",
      expectedBehavior: "A request with only ineligible resources cannot pass preflight.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [
            {
              ...savedSimulation,
              exportEligible: false,
            },
          ],
        }),
      assertions: [expectBlocked("no_exportable_resources"), expectIsolation],
    },
    {
      id: "full_scope_manifest_allowed",
      title: "Full scope manifest is allowed",
      expectedBehavior: "Eligible owner-scoped resources produce a manifest-only package plan.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [principalMetadata, savedSimulation, draft, historyEntry],
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.packagePlan.packageFormat === "manifest_only" &&
          result.packagePlan.generation === "not_started" &&
          result.packagePlan.fileCreated === false &&
          result.packagePlan.storageWrite === false &&
          result.packagePlan.databaseRead === false &&
          result.packagePlan.includes.length === 4
            ? undefined
            : "Expected manifest-only package plan with four eligible resources.",
      ],
    },
    {
      id: "scope_exclusion_is_not_packaged",
      title: "Scope exclusion is not packaged",
      expectedBehavior: "Resources outside requested scope are excluded without file generation.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request(),
            scope: {
              includePrincipalMetadata: true,
              includeSavedSimulations: true,
              includeSimulationDrafts: false,
              includeSimulationHistory: false,
            },
          },
          resources: [principalMetadata, savedSimulation, draft, historyEntry],
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.packagePlan.includes.length === 2 &&
          result.packagePlan.excluded.length === 2
            ? undefined
            : "Expected only requested resource categories in package plan.",
      ],
    },
    {
      id: "deleted_resource_excluded_when_eligible_exists",
      title: "Deleted resource is excluded when eligible resource exists",
      expectedBehavior: "Deleted resources do not enter the package plan.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request(),
          resources: [
            principalMetadata,
            {
              ...savedSimulation,
              resourceId: "record_stage4_3d_deleted",
              deletionState: "deleted",
              lifecycleState: "deleted",
            },
          ],
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.packagePlan.includes.length === 1 &&
          result.packagePlan.excluded.some(
            (entry) =>
              entry.resourceId === "record_stage4_3d_deleted" &&
              entry.eligibility === "ineligible_deleted",
          )
            ? undefined
            : "Expected deleted resource exclusion evidence.",
      ],
    },
  ];
}

export function runExportRuntimeFoundationValidation(): ExportRuntimeValidationResult {
  const results = cases().map((validationCase): ExportRuntimeValidationCaseResult => {
    try {
      const result = validationCase.run();
      const issues = validationCase.assertions
        .map((assertion) => assertion(result))
        .filter((issue): issue is string => Boolean(issue));

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: result.status,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      };
    } catch (error) {
      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: "blocked",
        passed: false,
        failed: true,
        issues: [error instanceof Error ? error.message : "Unknown validation error."],
      };
    }
  });

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
