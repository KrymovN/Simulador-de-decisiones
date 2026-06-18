import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  createPersistenceRuntimeFoundation,
  evaluatePersistenceRuntimePreflight,
} from "./foundation";
import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  PersistenceRuntimeBlockedReason,
  PersistenceRuntimePreflightResult,
  PersistenceRuntimeValidationCaseResult,
  PersistenceRuntimeValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => PersistenceRuntimePreflightResult;
  assertions: ((result: PersistenceRuntimePreflightResult) => string | undefined)[];
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: "stage4_1b_registered:9f1e5a40-0a5f-4f76-8c9c-111111111111",
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_2e_validation_session",
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

const resolvedPrincipal: LevioPrincipalRow = {
  principal_id: principalId,
  principal_type: "registered_user",
  principal_status: "active",
  provider_name: "supabase",
  provider_reference: providerReference,
  provider_reference_status: "active",
  provider_subject_type: "user",
  provider_email_snapshot: null,
  provider_email_verified: false,
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
  verified_at: null,
  disabled_at: null,
  deleted_at: null,
  deletion_requested_at: null,
  last_authenticated_at: null,
  last_provider_sync_at: null,
  deletion_state: "active",
  retention_rule: "account_lifecycle",
  recovery_state: null,
  locale_preference: null,
  metadata_version: null,
  legal_hold_reason: null,
  schema_version: 1,
};

const adapter: PersistenceProviderAdapter = {
  providerId: "supabase",
  executionBoundary: "server_only",
  async resolvePrincipalByProviderReference() {
    return resolvedPrincipal;
  },
};

function expectBlocked(reason: PersistenceRuntimeBlockedReason) {
  return (result: PersistenceRuntimePreflightResult): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(result: PersistenceRuntimePreflightResult): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only result.";
}

function expectIsolation(result: PersistenceRuntimePreflightResult): string | undefined {
  const evidence = result.evidence;

  return evidence.foundationOnly &&
    evidence.providerIsolated &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.authRuntimeReadByFoundation === false &&
    evidence.supabaseClientCreated === false &&
    evidence.sqlExecuted === false &&
    evidence.userOperationExecuted === false &&
    evidence.uiIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.aiIntegrated === false &&
    evidence.memoryIntegrated === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? undefined
    : "Persistence foundation isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "signed_out_denied",
      title: "Signed-out context is denied",
      expectedBehavior: "Fail closed without executing persistence.",
      run: () =>
        evaluatePersistenceRuntimePreflight({
          operation: "read_simulation_record",
          authContext: signedOutContext,
        }),
      assertions: [expectBlocked("auth_context_not_authenticated"), expectIsolation],
    },
    {
      id: "expired_session_denied",
      title: "Expired sessions are denied",
      expectedBehavior: "Require active session before any persistence preflight can pass.",
      run: () =>
        evaluatePersistenceRuntimePreflight({
          operation: "read_simulation_record",
          authContext: {
            ...authenticatedContext,
            sessionStatus: "expired",
          },
        }),
      assertions: [expectBlocked("session_not_active"), expectIsolation],
    },
    {
      id: "invalid_provider_reference_denied",
      title: "Invalid provider reference is denied",
      expectedBehavior: "Require a Supabase UUID provider reference.",
      run: () =>
        evaluatePersistenceRuntimePreflight({
          operation: "read_simulation_record",
          authContext: {
            ...authenticatedContext,
            principal: {
              ...authenticatedContext.principal,
              providerReference: "supabase:not-a-uuid",
            },
          },
        }),
      assertions: [expectBlocked("provider_reference_invalid"), expectIsolation],
    },
    {
      id: "client_owner_injection_denied",
      title: "Client owner fields are rejected",
      expectedBehavior: "Reject owner/provider fields supplied by the caller.",
      run: () =>
        evaluatePersistenceRuntimePreflight({
          operation: "read_simulation_record",
          authContext: authenticatedContext,
          clientOwnerFields: {
            ownerPrincipalId: principalId,
          },
        }),
      assertions: [expectBlocked("client_owner_input_rejected"), expectIsolation],
    },
    {
      id: "write_operation_disabled",
      title: "Writes are disabled in foundation mode",
      expectedBehavior: "Keep create/update/archive/delete operations blocked.",
      run: () =>
        evaluatePersistenceRuntimePreflight({
          operation: "create_simulation_record",
          authContext: authenticatedContext,
        }),
      assertions: [expectBlocked("foundation_only_write_disabled"), expectIsolation],
    },
    {
      id: "adapter_required",
      title: "Read preflight requires provider adapter configuration",
      expectedBehavior: "Do not pretend to read data without an adapter boundary.",
      run: () =>
        evaluatePersistenceRuntimePreflight({
          operation: "read_simulation_record",
          authContext: authenticatedContext,
        }),
      assertions: [expectBlocked("provider_adapter_not_configured"), expectIsolation],
    },
    {
      id: "owner_mismatch_denied",
      title: "Resolved owner mismatch is denied",
      expectedBehavior: "Record IDs alone do not authorize cross-owner access.",
      run: () =>
        evaluatePersistenceRuntimePreflight(
          {
            operation: "read_simulation_record",
            authContext: authenticatedContext,
            resolvedPrincipal,
            resourceOwnerPrincipalId: "aafaa42d-f7f0-4e8d-9ed9-333333333333",
          },
          adapter,
        ),
      assertions: [expectBlocked("owner_mismatch"), expectIsolation],
    },
    {
      id: "owner_read_preflight_allowed",
      title: "Owner read preflight can pass with server-only adapter evidence",
      expectedBehavior: "Allow only preflight, not a real user data operation.",
      run: () =>
        evaluatePersistenceRuntimePreflight(
          {
            operation: "read_simulation_record",
            authContext: authenticatedContext,
            resolvedPrincipal,
            resourceOwnerPrincipalId: principalId,
          },
          adapter,
        ),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" && result.principalId === principalId
            ? undefined
            : "Expected resolved principal evidence.",
      ],
    },
    {
      id: "runtime_factory_remains_disabled",
      title: "Runtime factory exposes write-disabled foundation",
      expectedBehavior: "Factory reports configured adapter without enabling writes.",
      run: () =>
        createPersistenceRuntimeFoundation(adapter).preflight({
          operation: "list_simulation_records",
          authContext: authenticatedContext,
          resolvedPrincipal,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        () =>
          createPersistenceRuntimeFoundation(adapter).writesEnabled === false
            ? undefined
            : "Foundation factory must not enable writes.",
      ],
    },
  ];
}

export function runPersistenceRuntimeFoundationValidation(): PersistenceRuntimeValidationResult {
  const results = cases().map((validationCase): PersistenceRuntimeValidationCaseResult => {
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
    } catch {
      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: "blocked",
        passed: false,
        failed: true,
        issues: ["Persistence runtime foundation validation case threw an uncaught exception."],
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
