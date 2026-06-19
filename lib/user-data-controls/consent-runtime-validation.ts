import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  createConsentRuntimeFoundation,
  DEFAULT_CONSENT_RUNTIME_POLICIES,
} from "./consent-runtime";
import type {
  ConsentRecord,
  ConsentRuntimeBlockedReason,
  ConsentRuntimeEvaluationResult,
  ConsentRuntimeValidationCaseResult,
  ConsentRuntimeValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => ConsentRuntimeEvaluationResult;
  assertions: ((result: ConsentRuntimeEvaluationResult) => string | undefined)[];
};

const principalId = "stage4_3b_registered_principal";
const now = "2026-06-18T12:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId,
    principalType: "registered_user",
    providerReference: "supabase:9f1e5a40-0a5f-4f76-8c9c-111111111111",
  },
  sessionId: "stage_4_3b_validation_session",
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

const grantedSensitiveConsent: ConsentRecord = {
  consentId: "stage_4_3b_sensitive_consent",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  purpose: "sensitive_decision_history",
  dataCategories: ["simulation_records", "simulation_history_entries", "sensitive_decision_context"],
  status: "granted",
  policyVersion: "stage_4_3b_policy_v1",
  grantedAt: "2026-06-18T10:00:00.000Z",
  expiresAt: "2026-12-18T10:00:00.000Z",
  captureContext: "owner_action",
};

function enabledRuntime() {
  return createConsentRuntimeFoundation({
    enabled: true,
    policies: DEFAULT_CONSENT_RUNTIME_POLICIES,
  });
}

function expectBlocked(reason: ConsentRuntimeBlockedReason) {
  return (result: ConsentRuntimeEvaluationResult): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(result: ConsentRuntimeEvaluationResult): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only result.";
}

function expectIsolation(result: ConsentRuntimeEvaluationResult): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.3B" &&
    evidence.consentOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
    evidence.runtimeWritesEnabled === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.exportRuntimeStarted === false &&
    evidence.deletionRuntimeStarted === false &&
    evidence.retentionRuntimeStarted === false &&
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
    evidence.stage43CStarted === false &&
    evidence.stage44Started === false
    ? undefined
    : "Consent runtime isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled consent runtime blocks by default",
      expectedBehavior: "Fail closed before any consent decision is allowed.",
      run: () =>
        createConsentRuntimeFoundation().evaluate({
          authContext: authenticatedContext,
          purpose: "saved_simulation_persistence",
        }),
      assertions: [expectBlocked("consent_runtime_disabled"), expectIsolation],
    },
    {
      id: "missing_auth_context_denied",
      title: "Missing auth context is denied",
      expectedBehavior: "Require auth context for every consent evaluation.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: null,
          purpose: "saved_simulation_persistence",
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
          purpose: "saved_simulation_persistence",
        }),
      assertions: [expectBlocked("auth_context_not_authenticated"), expectIsolation],
    },
    {
      id: "expired_session_denied",
      title: "Expired sessions are denied",
      expectedBehavior: "Require active session before consent preflight can pass.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: {
            ...authenticatedContext,
            sessionStatus: "expired",
          },
          purpose: "saved_simulation_persistence",
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
          purpose: "saved_simulation_persistence",
          clientOwnerFields: {
            ownerPrincipalId: principalId,
          },
        }),
      assertions: [expectBlocked("client_owner_input_rejected"), expectIsolation],
    },
    {
      id: "owner_mismatch_denied",
      title: "Owner mismatch is denied",
      expectedBehavior: "A requested owner must match the authenticated registered user.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "saved_simulation_persistence",
          ownerPrincipalId: "another_principal",
        }),
      assertions: [expectBlocked("owner_mismatch"), expectIsolation],
    },
    {
      id: "unsupported_policy_denied",
      title: "Unsupported purpose policy is denied",
      expectedBehavior: "A purpose absent from runtime policy configuration fails closed.",
      run: () =>
        createConsentRuntimeFoundation({
          enabled: true,
          policies: [],
        }).evaluate({
          authContext: authenticatedContext,
          purpose: "saved_simulation_persistence",
        }),
      assertions: [expectBlocked("purpose_not_supported"), expectIsolation],
    },
    {
      id: "out_of_scope_purpose_denied",
      title: "Out-of-scope purpose is denied",
      expectedBehavior: "Stage 4.3B does not start memory, analytics, AI, or workspace runtime.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "memory_promotion",
        }),
      assertions: [expectBlocked("purpose_out_of_scope"), expectIsolation],
    },
    {
      id: "required_consent_missing_denied",
      title: "Missing required consent is denied",
      expectedBehavior: "Sensitive decision history requires an active granted consent record.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "sensitive_decision_history",
          now,
        }),
      assertions: [expectBlocked("consent_required_missing"), expectIsolation],
    },
    {
      id: "withdrawn_consent_denied",
      title: "Withdrawn consent is denied",
      expectedBehavior: "A withdrawn consent record cannot authorize processing.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "sensitive_decision_history",
          consentRecord: {
            ...grantedSensitiveConsent,
            status: "withdrawn",
            withdrawnAt: "2026-06-18T11:00:00.000Z",
          },
          now,
        }),
      assertions: [expectBlocked("consent_record_not_granted"), expectIsolation],
    },
    {
      id: "expired_consent_denied",
      title: "Expired consent is denied",
      expectedBehavior: "An expired consent record cannot authorize processing.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "sensitive_decision_history",
          consentRecord: {
            ...grantedSensitiveConsent,
            expiresAt: "2026-06-18T11:00:00.000Z",
          },
          now,
        }),
      assertions: [expectBlocked("consent_record_expired"), expectIsolation],
    },
    {
      id: "consent_owner_mismatch_denied",
      title: "Consent owner mismatch is denied",
      expectedBehavior: "Consent records must belong to the authenticated registered user.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "sensitive_decision_history",
          consentRecord: {
            ...grantedSensitiveConsent,
            ownerPrincipalId: "another_principal",
          },
          now,
        }),
      assertions: [expectBlocked("consent_record_owner_mismatch"), expectIsolation],
    },
    {
      id: "required_consent_allowed",
      title: "Granted required consent can pass preflight",
      expectedBehavior: "A matching active consent record allows preflight only.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "sensitive_decision_history",
          consentRecord: grantedSensitiveConsent,
          now,
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" &&
          result.requirement === "consent_required" &&
          result.consentId === grantedSensitiveConsent.consentId
            ? undefined
            : "Expected granted consent evidence.",
      ],
    },
    {
      id: "non_required_consent_allowed",
      title: "Non-required consent purpose can pass preflight",
      expectedBehavior: "Normal saved simulation persistence does not imply memory or analytics consent.",
      run: () =>
        enabledRuntime().evaluate({
          authContext: authenticatedContext,
          purpose: "saved_simulation_persistence",
        }),
      assertions: [
        expectAllowed,
        expectIsolation,
        (result) =>
          result.status === "allowed" && result.requirement === "consent_not_required"
            ? undefined
            : "Expected consent-not-required evidence.",
      ],
    },
  ];
}

export function runConsentRuntimeFoundationValidation(): ConsentRuntimeValidationResult {
  const results = cases().map((validationCase): ConsentRuntimeValidationCaseResult => {
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
