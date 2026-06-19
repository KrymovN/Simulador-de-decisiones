import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import { createDeletionRuntimeFoundation } from "./deletion-runtime";
import type {
  DeletionParentSnapshot,
  DeletionResourceSnapshot,
  DeletionRuntimeBlockedReason,
  DeletionRuntimeEvaluationResult,
  DeletionRuntimeValidationCaseResult,
  DeletionRuntimeValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => DeletionRuntimeEvaluationResult;
  assertions: ((result: DeletionRuntimeEvaluationResult) => string | undefined)[];
};

const principalId = "stage4_3e_registered_principal";
const requestedAt = "2026-06-19T14:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId,
    principalType: "registered_user",
    providerReference: "supabase:9f1e5a40-0a5f-4f76-8c9c-444444444444",
  },
  sessionId: "stage_4_3e_validation_session",
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

const principalRecord: DeletionResourceSnapshot = {
  resourceId: "principal_stage4_3e",
  resourceCategory: "levio_principal",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "principal_account_lifecycle",
  createdAt: "2026-06-18T09:00:00.000Z",
  updatedAt: "2026-06-18T09:10:00.000Z",
  deletedAt: null,
};

const savedSimulation: DeletionResourceSnapshot = {
  resourceId: "record_stage4_3e_saved",
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

const draft: DeletionResourceSnapshot = {
  resourceId: "draft_stage4_3e",
  resourceCategory: "simulation_draft",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "draft_short_lifecycle",
  createdAt: "2026-06-19T08:00:00.000Z",
  updatedAt: "2026-06-19T08:10:00.000Z",
  expiresAt: "2026-06-20T08:00:00.000Z",
  deletedAt: null,
};

const historyEntry: DeletionResourceSnapshot = {
  resourceId: "history_stage4_3e",
  resourceCategory: "simulation_history_entry",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "parent_simulation_lifecycle",
  parentRecordId: savedSimulation.resourceId,
  createdAt: "2026-06-18T10:20:00.000Z",
  updatedAt: "2026-06-18T10:20:00.000Z",
  deletedAt: null,
};

const parentRecord: DeletionParentSnapshot = {
  recordId: savedSimulation.resourceId,
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
};

function enabledRuntime() {
  return createDeletionRuntimeFoundation({
    enabled: true,
  });
}

function request(kind: "resource_deletion_planning" | "account_deletion_planning") {
  return {
    requestId: "deletion_stage4_3e_request",
    requestKind: kind,
    scope: {
      includePrincipalRecord: kind === "account_deletion_planning",
      includeSavedSimulations: true,
      includeSimulationDrafts: true,
      includeSimulationHistory: true,
    },
    requestedAt,
    confirmationAcknowledged: true,
  };
}

function expectBlocked(reason: DeletionRuntimeBlockedReason) {
  return (result: DeletionRuntimeEvaluationResult): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(result: DeletionRuntimeEvaluationResult): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only deletion result.";
}

function expectIsolation(result: DeletionRuntimeEvaluationResult): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.3E" &&
    evidence.deletionOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
    evidence.runtimeWritesEnabled === false &&
    evidence.hardDeleteExecuted === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.supabaseConnected === false &&
    evidence.migrationsChanged === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.cronJobsStarted === false &&
    evidence.exportRuntimeChanged === false &&
    evidence.retentionRuntimeChanged === false &&
    evidence.consentRuntimeChanged === false &&
    evidence.authRuntimeChanged === false &&
    evidence.simulatorIntegrated === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.aiIntegrated === false &&
    evidence.stage43FStarted === false &&
    evidence.stage44Started === false &&
    evidence.stage5Started === false
    ? undefined
    : "Deletion runtime isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled deletion runtime blocks by default",
      expectedBehavior: "Fail closed before any deletion request can be evaluated.",
      run: () =>
        createDeletionRuntimeFoundation().evaluate({
          authContext: authenticatedContext,
          request: request("resource_deletion_planning"),
          resources: [savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("deletion_runtime_disabled"), expectIsolation],
    },
    {
      id: "missing_auth_context_denied",
      title: "Missing auth context is denied",
      expectedBehavior: "Require auth context for every deletion evaluation.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: null,
          request: request("resource_deletion_planning"),
          resources: [savedSimulation],
          parentRecords: [parentRecord],
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
          request: request("resource_deletion_planning"),
          resources: [savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("auth_context_not_authenticated"), expectIsolation],
    },
    {
      id: "expired_session_denied",
      title: "Expired sessions are denied",
      expectedBehavior: "Require active session before deletion preflight can pass.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: {
            ...authenticatedContext,
            sessionStatus: "expired",
          },
          request: request("resource_deletion_planning"),
          resources: [savedSimulation],
          parentRecords: [parentRecord],
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
          request: request("resource_deletion_planning"),
          resources: [savedSimulation],
          parentRecords: [parentRecord],
          clientOwnerFields: {
            ownerPrincipalId: principalId,
          },
        }),
      assertions: [expectBlocked("client_owner_input_rejected"), expectIsolation],
    },
    {
      id: "missing_request_denied",
      title: "Missing deletion request is denied",
      expectedBehavior: "Require a request model before deletion scope can be evaluated.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: null,
          resources: [savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("deletion_request_missing"), expectIsolation],
    },
    {
      id: "empty_scope_denied",
      title: "Empty deletion scope is denied",
      expectedBehavior: "At least one approved deletion scope must be requested.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request("resource_deletion_planning"),
            scope: {
              includePrincipalRecord: false,
              includeSavedSimulations: false,
              includeSimulationDrafts: false,
              includeSimulationHistory: false,
            },
          },
          resources: [savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("deletion_scope_empty"), expectIsolation],
    },
    {
      id: "request_confirmation_missing",
      title: "Missing deletion confirmation is denied",
      expectedBehavior: "Require explicit confirmation evidence before planning deletion.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request("resource_deletion_planning"),
            confirmationAcknowledged: false,
          },
          resources: [savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("request_confirmation_missing"), expectIsolation],
    },
    {
      id: "resource_owner_mismatch_denied",
      title: "Resource owner mismatch is denied",
      expectedBehavior: "Every resource snapshot must belong to the authenticated principal.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request("resource_deletion_planning"),
          resources: [
            {
              ...savedSimulation,
              ownerPrincipalId: "another_principal",
            },
          ],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("resource_owner_mismatch"), expectIsolation],
    },
    {
      id: "legal_hold_blocks",
      title: "Legal hold blocks deletion planning",
      expectedBehavior: "Legal holds and legal exceptions fail closed.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request("resource_deletion_planning"),
          resources: [
            {
              ...savedSimulation,
              legalHoldReason: "pending_legal_review",
            },
          ],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("legal_hold_blocks_deletion"), expectIsolation],
    },
    {
      id: "active_subscription_blocks_account_deletion",
      title: "Active subscription blocks account deletion planning",
      expectedBehavior: "Account deletion planning is blocked until subscription handling is resolved.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request("account_deletion_planning"),
          accountState: {
            activeSubscription: true,
            subscriptionStatus: "active",
          },
          resources: [principalRecord, savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [
        expectBlocked("active_subscription_blocks_account_deletion"),
        expectIsolation,
      ],
    },
    {
      id: "parent_context_required",
      title: "History deletion requires parent context",
      expectedBehavior: "Simulation history cannot be planned without parent simulation evidence.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request("resource_deletion_planning"),
          resources: [historyEntry],
          parentRecords: [],
        }),
      assertions: [expectBlocked("parent_context_required"), expectIsolation],
    },
    {
      id: "invalid_timestamp_denied",
      title: "Invalid timestamp is denied",
      expectedBehavior: "Deletion evaluation fails closed on invalid temporal evidence.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request("resource_deletion_planning"),
            requestedAt: "not-a-date",
          },
          resources: [savedSimulation],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("timestamp_invalid"), expectIsolation],
    },
    {
      id: "no_deletable_resources_denied",
      title: "No deletable resources is denied",
      expectedBehavior: "A request with only terminal resources cannot pass preflight.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request("resource_deletion_planning"),
          resources: [
            {
              ...savedSimulation,
              deletionState: "deleted",
              lifecycleState: "deleted",
            },
          ],
          parentRecords: [parentRecord],
        }),
      assertions: [expectBlocked("no_deletable_resources"), expectIsolation],
    },
    {
      id: "resource_deletion_plan_allowed",
      title: "Resource deletion plan is allowed",
      expectedBehavior: "Eligible owner-scoped resources produce a lifecycle-only deletion plan.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: request("resource_deletion_planning"),
          resources: [savedSimulation, draft, historyEntry],
          parentRecords: [parentRecord],
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.deletionPlan.execution === "not_started" &&
          result.deletionPlan.hardDeleteExecuted === false &&
          result.deletionPlan.databaseWrite === false &&
          result.deletionPlan.supabaseConnected === false &&
          result.deletionPlan.lifecycleOnly &&
          result.deletionPlan.entries.length === 3
            ? undefined
            : "Expected lifecycle-only deletion plan with three resources.",
      ],
    },
    {
      id: "scope_exclusion_is_not_planned",
      title: "Scope exclusion is not planned",
      expectedBehavior: "Resources outside requested scope receive no execution action.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          request: {
            ...request("resource_deletion_planning"),
            scope: {
              includePrincipalRecord: false,
              includeSavedSimulations: true,
              includeSimulationDrafts: false,
              includeSimulationHistory: false,
            },
          },
          resources: [savedSimulation, draft, historyEntry],
          parentRecords: [parentRecord],
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.deletionPlan.entries.some(
            (entry) =>
              entry.resourceId === savedSimulation.resourceId &&
              entry.plannedAction === "mark_deletion_requested",
          ) &&
          result.deletionPlan.entries.filter(
            (entry) => entry.plannedAction === "no_action_scope_excluded",
          ).length === 2
            ? undefined
            : "Expected only requested resource categories in the deletion plan.",
      ],
    },
  ];
}

export function runDeletionRuntimeFoundationValidation(): DeletionRuntimeValidationResult {
  const results = cases().map((validationCase): DeletionRuntimeValidationCaseResult => {
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
