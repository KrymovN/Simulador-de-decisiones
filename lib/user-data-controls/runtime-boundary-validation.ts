import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  createConsentRuntimeFoundation,
  DEFAULT_CONSENT_RUNTIME_POLICIES,
} from "./consent-runtime";
import { createDeletionRuntimeFoundation } from "./deletion-runtime";
import {
  createExportRuntimeFoundation,
  DEFAULT_EXPORT_DATA_CATEGORIES,
  DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
} from "./export-runtime";
import {
  createRetentionRuntimeFoundation,
  DEFAULT_RETENTION_RUNTIME_POLICIES,
} from "./retention-runtime";
import {
  createUserDataControlsRuntimeBoundary,
  USER_DATA_CONTROLS_BOUNDARY_ALLOWED_OPERATIONS,
} from "./runtime-boundary";
import type {
  ConsentRecord,
  DeletionParentSnapshot,
  DeletionResourceSnapshot,
  ExportResourceSnapshot,
  RetentionParentSnapshot,
  RetentionResourceSnapshot,
  UserDataControlsBoundaryOperation,
  UserDataControlsRuntimeBoundaryBlockedReason,
  UserDataControlsRuntimeBoundaryEvaluationResult,
  UserDataControlsRuntimeBoundaryValidationCaseResult,
  UserDataControlsRuntimeBoundaryValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => UserDataControlsRuntimeBoundaryEvaluationResult;
  assertions: ((
    result: UserDataControlsRuntimeBoundaryEvaluationResult,
  ) => string | undefined)[];
};

const principalId = "stage4_3f_registered_principal";
const requestedAt = "2026-06-19T15:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId,
    principalType: "registered_user",
    providerReference: "supabase:9f1e5a40-0a5f-4f76-8c9c-555555555555",
  },
  sessionId: "stage_4_3f_validation_session",
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

const consentRecord: ConsentRecord = {
  consentId: "consent_stage4_3f_history",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  purpose: "sensitive_decision_history",
  dataCategories: ["simulation_records", "simulation_history_entries"],
  status: "granted",
  policyVersion: "stage_4_3b_policy_v1",
  grantedAt: "2026-06-18T09:00:00.000Z",
  captureContext: "owner_action",
};

const retentionResource: RetentionResourceSnapshot = {
  resourceId: "draft_stage4_3f_retention",
  resourceCategory: "simulation_draft",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "expired",
  deletionState: "active",
  retentionRule: "draft_short_lifecycle",
  createdAt: "2026-06-18T08:00:00.000Z",
  updatedAt: "2026-06-18T08:10:00.000Z",
  expiresAt: "2026-06-19T08:00:00.000Z",
  deletedAt: null,
};

const savedRetentionParent: RetentionParentSnapshot = {
  recordId: "record_stage4_3f_saved_parent",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "saved_simulation_lifecycle",
};

const exportResource: ExportResourceSnapshot = {
  resourceId: "record_stage4_3f_export",
  resourceCategory: "saved_simulation",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  exportEligible: true,
  deletionState: "active",
  lifecycleState: "active",
  dataCategories: ["simulation_record", "decision_provenance", "lifecycle_metadata"],
  createdAt: "2026-06-18T10:00:00.000Z",
  updatedAt: "2026-06-18T10:10:00.000Z",
  deletedAt: null,
  retentionRule: "saved_simulation_lifecycle",
  schemaVersion: 1,
};

const deletionResource: DeletionResourceSnapshot = {
  resourceId: "record_stage4_3f_deletion",
  resourceCategory: "saved_simulation",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "saved_simulation_lifecycle",
  createdAt: "2026-06-18T10:00:00.000Z",
  updatedAt: "2026-06-18T10:10:00.000Z",
  deletedAt: null,
};

const deletionParent: DeletionParentSnapshot = {
  recordId: deletionResource.resourceId,
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
};

function enabledBoundary() {
  return createUserDataControlsRuntimeBoundary({
    enabled: true,
    allowedOperations: USER_DATA_CONTROLS_BOUNDARY_ALLOWED_OPERATIONS,
    modules: {
      consent: createConsentRuntimeFoundation({
        enabled: true,
        policies: DEFAULT_CONSENT_RUNTIME_POLICIES,
      }),
      retention: createRetentionRuntimeFoundation({
        enabled: true,
        policies: DEFAULT_RETENTION_RUNTIME_POLICIES,
      }),
      export: createExportRuntimeFoundation({
        enabled: true,
        allowedDataCategories: DEFAULT_EXPORT_DATA_CATEGORIES,
        forbiddenDataCategories: DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
      }),
      deletion: createDeletionRuntimeFoundation({
        enabled: true,
      }),
    },
  });
}

function consentPayload(authContext: LevioAuthRuntimeContext | null = authenticatedContext) {
  return {
    authContext,
    purpose: "sensitive_decision_history" as const,
    consentRecord,
    now: requestedAt,
  };
}

function retentionPayload(
  authContext: LevioAuthRuntimeContext | null = authenticatedContext,
) {
  return {
    authContext,
    resource: retentionResource,
    parentRecord: savedRetentionParent,
    now: requestedAt,
  };
}

function exportPayload(authContext: LevioAuthRuntimeContext | null = authenticatedContext) {
  return {
    authContext,
    request: {
      requestId: "export_stage4_3f_request",
      scope: {
        includePrincipalMetadata: false,
        includeSavedSimulations: true,
        includeSimulationDrafts: false,
        includeSimulationHistory: false,
      },
      requestedAt,
      packageFormat: "manifest_only" as const,
    },
    resources: [exportResource],
  };
}

function deletionPayload(
  authContext: LevioAuthRuntimeContext | null = authenticatedContext,
) {
  return {
    authContext,
    request: {
      requestId: "deletion_stage4_3f_request",
      requestKind: "resource_deletion_planning" as const,
      scope: {
        includePrincipalRecord: false,
        includeSavedSimulations: true,
        includeSimulationDrafts: false,
        includeSimulationHistory: false,
      },
      requestedAt,
      confirmationAcknowledged: true,
    },
    resources: [deletionResource],
    parentRecords: [deletionParent],
  };
}

function expectBlocked(reason: UserDataControlsRuntimeBoundaryBlockedReason) {
  return (
    result: UserDataControlsRuntimeBoundaryEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked boundary result with reason ${String(reason)}.`;
}

function expectAllowed(
  operation: UserDataControlsBoundaryOperation,
  module: UserDataControlsRuntimeBoundaryEvaluationResult["module"],
) {
  return (
    result: UserDataControlsRuntimeBoundaryEvaluationResult,
  ): string | undefined =>
    result.status === "allowed" &&
    result.operation === operation &&
    result.module === module &&
    result.execution === "preflight_only" &&
    result.moduleResult.status === "allowed"
      ? undefined
      : `Expected allowed ${String(operation)} routed to ${String(module)}.`;
}

function expectBoundaryIsolation(
  result: UserDataControlsRuntimeBoundaryEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.3F" &&
    evidence.boundaryOnly &&
    evidence.facadeOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
    evidence.moduleIsolationEnforced &&
    evidence.allowedOperationsExplicit &&
    evidence.runtimeWritesEnabled === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.supabaseConnected === false &&
    evidence.migrationsChanged === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.cronJobsStarted === false &&
    evidence.exportFilesCreated === false &&
    evidence.deletionExecuted === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.simulatorIntegrated === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.aiIntegrated === false &&
    evidence.stage43GStarted === false &&
    evidence.stage44Started === false &&
    evidence.stage5Started === false
    ? undefined
    : "User data controls boundary isolation evidence changed.";
}

function expectModulePreflightOnly(
  result: UserDataControlsRuntimeBoundaryEvaluationResult,
): string | undefined {
  if (result.status !== "allowed") {
    return "Expected allowed boundary result before checking module execution.";
  }

  return result.moduleResult.execution === "preflight_only"
    ? undefined
    : "Expected routed module to remain preflight-only.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_boundary_blocks",
      title: "Disabled boundary blocks by default",
      expectedBehavior: "Fail closed before any foundation module is routed.",
      run: () =>
        createUserDataControlsRuntimeBoundary().evaluate({
          operation: "consent_evaluation",
          consent: consentPayload(),
        }),
      assertions: [expectBlocked("boundary_disabled"), expectBoundaryIsolation],
    },
    {
      id: "unsupported_operation_denied",
      title: "Unsupported operation is denied",
      expectedBehavior: "Reject operations outside the Stage 4.3F allowed model.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "billing_evaluation" as UserDataControlsBoundaryOperation,
          consent: consentPayload(),
        }),
      assertions: [expectBlocked("operation_not_supported"), expectBoundaryIsolation],
    },
    {
      id: "operation_not_allowed_denied",
      title: "Disallowed operation is denied",
      expectedBehavior: "Reject supported operations not present in the explicit allowlist.",
      run: () =>
        createUserDataControlsRuntimeBoundary({
          enabled: true,
          allowedOperations: ["consent_evaluation"],
          modules: {
            consent: createConsentRuntimeFoundation({
              enabled: true,
              policies: DEFAULT_CONSENT_RUNTIME_POLICIES,
            }),
          },
        }).evaluate({
          operation: "export_evaluation",
          exportRequest: exportPayload(),
        }),
      assertions: [expectBlocked("operation_not_allowed"), expectBoundaryIsolation],
    },
    {
      id: "missing_payload_denied",
      title: "Missing module payload is denied",
      expectedBehavior: "Require payload evidence for the selected foundation module.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "retention_evaluation",
        }),
      assertions: [expectBlocked("module_payload_missing"), expectBoundaryIsolation],
    },
    {
      id: "cross_module_payload_denied",
      title: "Cross-module payload is denied",
      expectedBehavior: "Reject mixed payloads to preserve module isolation.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "deletion_evaluation",
          deletion: deletionPayload(),
          exportRequest: exportPayload(),
        }),
      assertions: [expectBlocked("module_payload_mismatch"), expectBoundaryIsolation],
    },
    {
      id: "disabled_module_denied",
      title: "Disabled selected module is denied",
      expectedBehavior: "Boundary does not route into a disabled foundation module.",
      run: () =>
        createUserDataControlsRuntimeBoundary({
          enabled: true,
          allowedOperations: ["consent_evaluation"],
          modules: {
            consent: createConsentRuntimeFoundation(),
          },
        }).evaluate({
          operation: "consent_evaluation",
          consent: consentPayload(),
        }),
      assertions: [expectBlocked("module_disabled"), expectBoundaryIsolation],
    },
    {
      id: "module_blocked_normalized",
      title: "Module blocked result is normalized",
      expectedBehavior: "Boundary returns module_blocked when the routed foundation fails closed.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "consent_evaluation",
          consent: consentPayload(signedOutContext),
        }),
      assertions: [
        expectBlocked("module_blocked"),
        expectBoundaryIsolation,
        (result) =>
          result.status === "blocked" &&
          result.moduleResult?.status === "blocked" &&
          result.moduleResult.evidence.stage === "4.3B"
            ? undefined
            : "Expected blocked consent module result to remain attached.",
      ],
    },
    {
      id: "consent_route_allowed",
      title: "Consent route is allowed",
      expectedBehavior: "Consent evaluation routes only to the consent foundation.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "consent_evaluation",
          consent: consentPayload(),
        }),
      assertions: [
        expectAllowed("consent_evaluation", "consent"),
        expectBoundaryIsolation,
        expectModulePreflightOnly,
        (result) =>
          result.status === "allowed" && result.moduleResult.evidence.stage === "4.3B"
            ? undefined
            : "Expected consent foundation evidence.",
      ],
    },
    {
      id: "retention_route_allowed",
      title: "Retention route is allowed",
      expectedBehavior: "Retention evaluation routes only to the retention foundation.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "retention_evaluation",
          retention: retentionPayload(),
        }),
      assertions: [
        expectAllowed("retention_evaluation", "retention"),
        expectBoundaryIsolation,
        expectModulePreflightOnly,
        (result) =>
          result.status === "allowed" && result.moduleResult.evidence.stage === "4.3C"
            ? undefined
            : "Expected retention foundation evidence.",
      ],
    },
    {
      id: "export_route_allowed",
      title: "Export route is allowed",
      expectedBehavior: "Export evaluation remains manifest-only with no file/storage/database work.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "export_evaluation",
          exportRequest: exportPayload(),
        }),
      assertions: [
        expectAllowed("export_evaluation", "export"),
        expectBoundaryIsolation,
        expectModulePreflightOnly,
        (result) =>
          result.status === "allowed" &&
          result.moduleResult.evidence.stage === "4.3D" &&
          "packagePlan" in result.moduleResult &&
          result.moduleResult.packagePlan.fileCreated === false &&
          result.moduleResult.packagePlan.storageWrite === false &&
          result.moduleResult.packagePlan.databaseRead === false
            ? undefined
            : "Expected export foundation to remain manifest-only and non-executing.",
      ],
    },
    {
      id: "deletion_route_allowed",
      title: "Deletion route is allowed",
      expectedBehavior: "Deletion evaluation remains lifecycle-only with no hard delete/database work.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "deletion_evaluation",
          deletion: deletionPayload(),
        }),
      assertions: [
        expectAllowed("deletion_evaluation", "deletion"),
        expectBoundaryIsolation,
        expectModulePreflightOnly,
        (result) =>
          result.status === "allowed" &&
          result.moduleResult.evidence.stage === "4.3E" &&
          "deletionPlan" in result.moduleResult &&
          result.moduleResult.deletionPlan.hardDeleteExecuted === false &&
          result.moduleResult.deletionPlan.databaseWrite === false &&
          result.moduleResult.deletionPlan.supabaseConnected === false
            ? undefined
            : "Expected deletion foundation to remain lifecycle-only and non-executing.",
      ],
    },
  ];
}

export function runUserDataControlsRuntimeBoundaryValidation(): UserDataControlsRuntimeBoundaryValidationResult {
  const results = cases().map(
    (validationCase): UserDataControlsRuntimeBoundaryValidationCaseResult => {
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
          issues: [
            error instanceof Error ? error.message : "Unknown validation error.",
          ],
        };
      }
    },
  );

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
