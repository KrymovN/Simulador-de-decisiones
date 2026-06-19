import { createConsentRuntimeFoundation } from "./consent-runtime";
import { createDeletionRuntimeFoundation } from "./deletion-runtime";
import { createExportRuntimeFoundation } from "./export-runtime";
import { createRetentionRuntimeFoundation } from "./retention-runtime";
import {
  USER_DATA_CONTROLS_RUNTIME_BOUNDARY_MODE,
  USER_DATA_CONTROLS_RUNTIME_BOUNDARY_VERSION,
  type UserDataControlsBoundaryModule,
  type UserDataControlsBoundaryModuleResult,
  type UserDataControlsBoundaryOperation,
  type UserDataControlsRuntimeBoundaryBlockedReason,
  type UserDataControlsRuntimeBoundaryConfig,
  type UserDataControlsRuntimeBoundaryEvaluationInput,
  type UserDataControlsRuntimeBoundaryEvaluationResult,
  type UserDataControlsRuntimeBoundaryFoundation,
  type UserDataControlsRuntimeBoundarySafetyEvidence,
} from "./contracts";

export const USER_DATA_CONTROLS_BOUNDARY_ALLOWED_OPERATIONS: UserDataControlsBoundaryOperation[] =
  [
    "consent_evaluation",
    "retention_evaluation",
    "export_evaluation",
    "deletion_evaluation",
  ];

export const DEFAULT_USER_DATA_CONTROLS_RUNTIME_BOUNDARY_CONFIG: UserDataControlsRuntimeBoundaryConfig =
  {
    enabled: false,
    allowedOperations: USER_DATA_CONTROLS_BOUNDARY_ALLOWED_OPERATIONS,
    modules: {
      consent: createConsentRuntimeFoundation(),
      retention: createRetentionRuntimeFoundation(),
      export: createExportRuntimeFoundation(),
      deletion: createDeletionRuntimeFoundation(),
    },
  };

export function userDataControlsRuntimeBoundarySafetyEvidence(): UserDataControlsRuntimeBoundarySafetyEvidence {
  return {
    stage: "4.3F",
    boundaryOnly: true,
    facadeOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
    moduleIsolationEnforced: true,
    allowedOperationsExplicit: true,
    runtimeWritesEnabled: false,
    dbOperationsExecuted: false,
    supabaseConnected: false,
    migrationsChanged: false,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    cronJobsStarted: false,
    exportFilesCreated: false,
    deletionExecuted: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    simulatorIntegrated: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    aiIntegrated: false,
    stage43GStarted: false,
    stage44Started: false,
    stage5Started: false,
    rollback: "disable_user_data_controls_boundary_or_remove_boundary_exports",
  };
}

function blocked(input: {
  operation?: UserDataControlsBoundaryOperation;
  module?: UserDataControlsBoundaryModule;
  reason: UserDataControlsRuntimeBoundaryBlockedReason;
  message: string;
  moduleResult?: UserDataControlsBoundaryModuleResult;
}): UserDataControlsRuntimeBoundaryEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: USER_DATA_CONTROLS_RUNTIME_BOUNDARY_VERSION,
    operation: input.operation,
    module: input.module,
    reason: input.reason,
    message: input.message,
    moduleResult: input.moduleResult,
    evidence: userDataControlsRuntimeBoundarySafetyEvidence(),
  };
}

function allowed(input: {
  operation: UserDataControlsBoundaryOperation;
  module: UserDataControlsBoundaryModule;
  moduleResult: Extract<UserDataControlsBoundaryModuleResult, { status: "allowed" }>;
}): UserDataControlsRuntimeBoundaryEvaluationResult {
  return {
    status: "allowed",
    execution: "preflight_only",
    version: USER_DATA_CONTROLS_RUNTIME_BOUNDARY_VERSION,
    operation: input.operation,
    module: input.module,
    moduleResult: input.moduleResult,
    evidence: userDataControlsRuntimeBoundarySafetyEvidence(),
  };
}

function isSupportedOperation(
  operation: string,
): operation is UserDataControlsBoundaryOperation {
  return USER_DATA_CONTROLS_BOUNDARY_ALLOWED_OPERATIONS.includes(
    operation as UserDataControlsBoundaryOperation,
  );
}

function moduleForOperation(
  operation: UserDataControlsBoundaryOperation,
): UserDataControlsBoundaryModule {
  if (operation === "consent_evaluation") {
    return "consent";
  }

  if (operation === "retention_evaluation") {
    return "retention";
  }

  if (operation === "export_evaluation") {
    return "export";
  }

  return "deletion";
}

function payloadCount(input: UserDataControlsRuntimeBoundaryEvaluationInput): number {
  return [
    input.consent,
    input.retention,
    input.exportRequest,
    input.deletion,
  ].filter((payload) => payload != null).length;
}

function hasExpectedPayload(
  input: UserDataControlsRuntimeBoundaryEvaluationInput,
): boolean {
  if (input.operation === "consent_evaluation") {
    return Boolean(input.consent);
  }

  if (input.operation === "retention_evaluation") {
    return Boolean(input.retention);
  }

  if (input.operation === "export_evaluation") {
    return Boolean(input.exportRequest);
  }

  if (input.operation === "deletion_evaluation") {
    return Boolean(input.deletion);
  }

  return false;
}

function moduleEvidenceIsIsolated(
  operation: UserDataControlsBoundaryOperation,
  result: UserDataControlsBoundaryModuleResult,
): boolean {
  const evidence = result.evidence;

  if (!evidence.foundationOnly || !evidence.failClosedByDefault) {
    return false;
  }

  if (
    evidence.uiIntegrated ||
    evidence.dashboardIntegrated ||
    evidence.apiRouteIntegrated ||
    evidence.authRuntimeChanged ||
    evidence.simulatorIntegrated ||
    evidence.subscriptionsIntegrated ||
    evidence.memoryRuntimeIntegrated ||
    evidence.aiIntegrated
  ) {
    return false;
  }

  if (operation === "consent_evaluation") {
    return (
      evidence.stage === "4.3B" &&
      evidence.runtimeWritesEnabled === false &&
      evidence.dbOperationsExecuted === false &&
      evidence.exportRuntimeStarted === false &&
      evidence.deletionRuntimeStarted === false &&
      evidence.retentionRuntimeStarted === false
    );
  }

  if (operation === "retention_evaluation") {
    return (
      evidence.stage === "4.3C" &&
      evidence.runtimeWritesEnabled === false &&
      evidence.dbOperationsExecuted === false &&
      evidence.retentionJobsStarted === false &&
      evidence.exportRuntimeStarted === false &&
      evidence.deletionRuntimeStarted === false &&
      evidence.consentRuntimeChanged === false &&
      evidence.stage44Started === false &&
      evidence.stage5Started === false
    );
  }

  if (operation === "export_evaluation") {
    return (
      evidence.stage === "4.3D" &&
      evidence.runtimeWritesEnabled === false &&
      evidence.fileCreated === false &&
      evidence.archiveCreated === false &&
      evidence.jsonCreated === false &&
      evidence.csvCreated === false &&
      evidence.storageConnected === false &&
      evidence.dbOperationsExecuted === false &&
      evidence.supabaseConnected === false &&
      evidence.deletionRuntimeStarted === false &&
      evidence.stage44Started === false &&
      evidence.stage5Started === false
    );
  }

  return (
    evidence.stage === "4.3E" &&
    evidence.runtimeWritesEnabled === false &&
    evidence.hardDeleteExecuted === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.supabaseConnected === false &&
    evidence.exportRuntimeChanged === false &&
    evidence.retentionRuntimeChanged === false &&
    evidence.consentRuntimeChanged === false &&
    evidence.stage44Started === false &&
    evidence.stage5Started === false
  );
}

export function createUserDataControlsRuntimeBoundary(
  config: UserDataControlsRuntimeBoundaryConfig =
    DEFAULT_USER_DATA_CONTROLS_RUNTIME_BOUNDARY_CONFIG,
): UserDataControlsRuntimeBoundaryFoundation {
  const allowedOperations = [...config.allowedOperations];

  return {
    version: USER_DATA_CONTROLS_RUNTIME_BOUNDARY_VERSION,
    mode: USER_DATA_CONTROLS_RUNTIME_BOUNDARY_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    allowedOperations,
    evaluate(input) {
      if (!config.enabled) {
        return blocked({
          operation: isSupportedOperation(input.operation) ? input.operation : undefined,
          reason: "boundary_disabled",
          message:
            "User data controls runtime boundary is disabled by controlled rollout configuration.",
        });
      }

      if (!isSupportedOperation(input.operation)) {
        return blocked({
          reason: "operation_not_supported",
          message:
            "Requested user data control operation is outside Stage 4.3F boundary scope.",
        });
      }

      const operation = input.operation;
      const targetModule = moduleForOperation(operation);

      if (!allowedOperations.includes(operation)) {
        return blocked({
          operation,
          module: targetModule,
          reason: "operation_not_allowed",
          message:
            "Requested user data control operation is not enabled in the boundary allowed-operation list.",
        });
      }

      const suppliedPayloads = payloadCount(input);

      if (suppliedPayloads === 0) {
        return blocked({
          operation,
          module: targetModule,
          reason: "module_payload_missing",
          message:
            "Boundary evaluation requires the payload for the selected foundation module.",
        });
      }

      if (suppliedPayloads !== 1 || !hasExpectedPayload(input)) {
        return blocked({
          operation,
          module: targetModule,
          reason: "module_payload_mismatch",
          message:
            "Boundary evaluation requires exactly one payload matching the selected operation.",
        });
      }

      if (!config.modules[targetModule]) {
        return blocked({
          operation,
          module: targetModule,
          reason: "module_unavailable",
          message:
            "Selected user data controls foundation module is not available inside the boundary.",
        });
      }

      if (!config.modules[targetModule]?.enabled) {
        return blocked({
          operation,
          module: targetModule,
          reason: "module_disabled",
          message:
            "Selected user data controls foundation module is disabled by controlled rollout configuration.",
        });
      }

      try {
        let moduleResult: UserDataControlsBoundaryModuleResult;

        if (operation === "consent_evaluation") {
          moduleResult = config.modules.consent!.evaluate(input.consent!);
        } else if (operation === "retention_evaluation") {
          moduleResult = config.modules.retention!.evaluate(input.retention!);
        } else if (operation === "export_evaluation") {
          moduleResult = config.modules.export!.evaluate(input.exportRequest!);
        } else {
          moduleResult = config.modules.deletion!.evaluate(input.deletion!);
        }

        if (!moduleEvidenceIsIsolated(operation, moduleResult)) {
          return blocked({
            operation,
            module: targetModule,
            reason: "module_isolation_violation",
            message:
              "Selected module evidence violates Stage 4.3F isolation rules.",
            moduleResult,
          });
        }

        if (moduleResult.status === "blocked") {
          return blocked({
            operation,
            module: targetModule,
            reason: "module_blocked",
            message: "Selected foundation module failed closed.",
            moduleResult,
          });
        }

        return allowed({
          operation,
          module: targetModule,
          moduleResult,
        });
      } catch (error) {
        return blocked({
          operation,
          module: targetModule,
          reason: "module_exception",
          message:
            error instanceof Error
              ? error.message
              : "Selected foundation module raised an unknown exception.",
        });
      }
    },
  };
}
