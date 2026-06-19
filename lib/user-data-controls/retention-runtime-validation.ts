import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  createRetentionRuntimeFoundation,
  DEFAULT_RETENTION_RUNTIME_POLICIES,
} from "./retention-runtime";
import type {
  RetentionResourceSnapshot,
  RetentionRuntimeBlockedReason,
  RetentionRuntimeEvaluationResult,
  RetentionRuntimeValidationCaseResult,
  RetentionRuntimeValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => RetentionRuntimeEvaluationResult;
  assertions: ((result: RetentionRuntimeEvaluationResult) => string | undefined)[];
};

const principalId = "stage4_3c_registered_principal";
const now = "2026-06-19T12:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId,
    principalType: "registered_user",
    providerReference: "supabase:9f1e5a40-0a5f-4f76-8c9c-222222222222",
  },
  sessionId: "stage_4_3c_validation_session",
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

const savedSimulation: RetentionResourceSnapshot = {
  resourceId: "record_stage4_3c_saved",
  resourceCategory: "saved_simulation",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "saved_simulation_lifecycle",
  createdAt: "2026-06-18T10:00:00.000Z",
  updatedAt: "2026-06-18T10:10:00.000Z",
  archivedAt: null,
  deletedAt: null,
  expiresAt: null,
  legalHoldReason: null,
  exportEligible: true,
};

const activeDraft: RetentionResourceSnapshot = {
  resourceId: "draft_stage4_3c_active",
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
  legalHoldReason: null,
  exportEligible: true,
};

const expiredDraft: RetentionResourceSnapshot = {
  ...activeDraft,
  resourceId: "draft_stage4_3c_expired",
  lifecycleState: "expired",
  expiresAt: "2026-06-18T08:00:00.000Z",
};

const historyEntry: RetentionResourceSnapshot = {
  resourceId: "history_stage4_3c_entry",
  resourceCategory: "simulation_history_entry",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "parent_simulation_lifecycle",
  createdAt: "2026-06-18T10:20:00.000Z",
  updatedAt: "2026-06-18T10:20:00.000Z",
  deletedAt: null,
  legalHoldReason: null,
  exportEligible: true,
};

function enabledRuntime() {
  return createRetentionRuntimeFoundation({
    enabled: true,
    policies: DEFAULT_RETENTION_RUNTIME_POLICIES,
  });
}

function expectBlocked(reason: RetentionRuntimeBlockedReason) {
  return (result: RetentionRuntimeEvaluationResult): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(result: RetentionRuntimeEvaluationResult): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only retention result.";
}

function expectIsolation(result: RetentionRuntimeEvaluationResult): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.3C" &&
    evidence.retentionOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
    evidence.runtimeWritesEnabled === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.retentionJobsStarted === false &&
    evidence.exportRuntimeStarted === false &&
    evidence.deletionRuntimeStarted === false &&
    evidence.consentRuntimeChanged === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.authRuntimeChanged === false &&
    evidence.simulatorIntegrated === false &&
    evidence.persistenceSchemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.aiIntegrated === false &&
    evidence.stage43DStarted === false &&
    evidence.stage44Started === false &&
    evidence.stage5Started === false
    ? undefined
    : "Retention runtime isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled retention runtime blocks by default",
      expectedBehavior: "Fail closed before any retention decision is evaluated.",
      run: () =>
        createRetentionRuntimeFoundation().evaluate({
          authContext: authenticatedContext,
          resource: savedSimulation,
        }),
      assertions: [expectBlocked("retention_runtime_disabled"), expectIsolation],
    },
    {
      id: "missing_auth_context_denied",
      title: "Missing auth context is denied",
      expectedBehavior: "Require auth context for every retention evaluation.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: null,
          resource: savedSimulation,
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
          resource: savedSimulation,
        }),
      assertions: [expectBlocked("auth_context_not_authenticated"), expectIsolation],
    },
    {
      id: "expired_session_denied",
      title: "Expired sessions are denied",
      expectedBehavior: "Require active session before retention evaluation can pass.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: {
            ...authenticatedContext,
            sessionStatus: "expired",
          },
          resource: savedSimulation,
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
          resource: savedSimulation,
          clientOwnerFields: {
            ownerPrincipalId: principalId,
          },
        }),
      assertions: [expectBlocked("client_owner_input_rejected"), expectIsolation],
    },
    {
      id: "resource_owner_mismatch_denied",
      title: "Resource owner mismatch is denied",
      expectedBehavior: "Resource ownership must match the authenticated principal.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: {
            ...savedSimulation,
            ownerPrincipalId: "another_principal",
          },
        }),
      assertions: [expectBlocked("resource_owner_mismatch"), expectIsolation],
    },
    {
      id: "unknown_retention_rule_denied",
      title: "Unknown retention rule is denied",
      expectedBehavior: "Unsupported retention rules fail closed.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: {
            ...savedSimulation,
            retentionRule: "forever_by_default",
          },
        }),
      assertions: [expectBlocked("retention_rule_mismatch"), expectIsolation],
    },
    {
      id: "missing_policy_denied",
      title: "Missing configured policy is denied",
      expectedBehavior: "Known rules still require an active policy entry.",
      run: () =>
        createRetentionRuntimeFoundation({
          enabled: true,
          policies: [],
        }).evaluate({
          authContext: authenticatedContext,
          resource: savedSimulation,
        }),
      assertions: [expectBlocked("retention_policy_missing"), expectIsolation],
    },
    {
      id: "invalid_timestamp_denied",
      title: "Invalid timestamp is denied",
      expectedBehavior: "Retention evaluation fails closed on invalid temporal evidence.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: {
            ...savedSimulation,
            createdAt: "not-a-date",
          },
          now,
        }),
      assertions: [expectBlocked("timestamp_invalid"), expectIsolation],
    },
    {
      id: "saved_simulation_retained",
      title: "Saved simulation is retained",
      expectedBehavior: "Active saved simulations are retained until deletion or restriction lifecycle changes.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: savedSimulation,
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.decision === "retain" &&
          result.lifecycleAction === "none" &&
          result.eligibleForDeletionDecision === false
            ? undefined
            : "Expected saved simulation retention decision.",
      ],
    },
    {
      id: "deletion_requested_simulation_is_planning_eligible",
      title: "Deletion-requested simulation is planning eligible",
      expectedBehavior: "Retention can mark deletion planning eligibility without executing deletion.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: {
            ...savedSimulation,
            lifecycleState: "deletion_pending",
            deletionState: "deletion_requested",
          },
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.decision === "eligible_for_deletion_planning" &&
          result.lifecycleAction === "deletion_planning" &&
          result.eligibleForDeletionDecision
            ? undefined
            : "Expected deletion planning eligibility only.",
      ],
    },
    {
      id: "active_draft_retained_until_expiration",
      title: "Active draft is retained until expiration",
      expectedBehavior: "Short-lifecycle drafts are retained while not expired.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: activeDraft,
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.decision === "retain_until_expiration" &&
          result.eligibleForDeletionDecision === false
            ? undefined
            : "Expected active draft retention until expiration.",
      ],
    },
    {
      id: "expired_draft_is_planning_eligible",
      title: "Expired draft is planning eligible",
      expectedBehavior: "Expired drafts can become eligible for deletion planning only.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: expiredDraft,
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.decision === "eligible_for_deletion_planning" &&
          result.lifecycleAction === "deletion_planning"
            ? undefined
            : "Expected expired draft deletion planning eligibility.",
      ],
    },
    {
      id: "history_without_parent_denied",
      title: "History without parent context is denied",
      expectedBehavior: "History retention must follow parent simulation lifecycle.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: historyEntry,
          now,
        }),
      assertions: [expectBlocked("parent_context_required"), expectIsolation],
    },
    {
      id: "history_parent_owner_mismatch_denied",
      title: "History parent owner mismatch is denied",
      expectedBehavior: "Parent simulation ownership must match authenticated principal.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: historyEntry,
          parentRecord: {
            recordId: savedSimulation.resourceId,
            ownerPrincipalId: "another_principal",
            ownerPrincipalType: "registered_user",
            lifecycleState: "active",
            deletionState: "active",
            retentionRule: "saved_simulation_lifecycle",
          },
          now,
        }),
      assertions: [expectBlocked("parent_owner_mismatch"), expectIsolation],
    },
    {
      id: "history_follows_active_parent",
      title: "History follows active parent",
      expectedBehavior: "User-visible history is retained while the parent simulation remains active.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: historyEntry,
          parentRecord: {
            recordId: savedSimulation.resourceId,
            ownerPrincipalId: principalId,
            ownerPrincipalType: "registered_user",
            lifecycleState: "active",
            deletionState: "active",
            retentionRule: "saved_simulation_lifecycle",
          },
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.decision === "retain_until_parent_lifecycle_changes" &&
          result.lifecycleAction === "none"
            ? undefined
            : "Expected history to follow active parent lifecycle.",
      ],
    },
    {
      id: "legal_hold_retains_without_action",
      title: "Legal hold retains without lifecycle action",
      expectedBehavior: "Legal exception evidence prevents deletion planning in foundation.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          resource: {
            ...savedSimulation,
            deletionState: "retained_legal_exception",
            legalHoldReason: "owner_request_review",
          },
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.decision === "retain_legal_exception" &&
          result.lifecycleAction === "none" &&
          result.eligibleForDeletionDecision === false
            ? undefined
            : "Expected legal exception retention without lifecycle action.",
      ],
    },
  ];
}

export function runRetentionRuntimeFoundationValidation(): RetentionRuntimeValidationResult {
  const results = cases().map((validationCase): RetentionRuntimeValidationCaseResult => {
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
