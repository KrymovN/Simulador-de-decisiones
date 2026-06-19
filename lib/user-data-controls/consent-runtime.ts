import {
  CONSENT_RUNTIME_FOUNDATION_MODE,
  CONSENT_RUNTIME_FOUNDATION_VERSION,
  type ConsentPurpose,
  type ConsentPurposePolicy,
  type ConsentRecord,
  type ConsentRequirement,
  type ConsentRuntimeBlockedReason,
  type ConsentRuntimeConfig,
  type ConsentRuntimeEvaluationInput,
  type ConsentRuntimeEvaluationResult,
  type ConsentRuntimeFoundation,
  type ConsentRuntimeSafetyEvidence,
} from "./contracts";

export const DEFAULT_CONSENT_RUNTIME_POLICIES: ConsentPurposePolicy[] = [
  {
    purpose: "saved_simulation_persistence",
    requirement: "consent_not_required",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["simulation_records", "levio_principal_metadata"],
  },
  {
    purpose: "sensitive_decision_history",
    requirement: "consent_required",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["simulation_records", "simulation_history_entries", "sensitive_decision_context"],
  },
  {
    purpose: "cross_decision_reuse",
    requirement: "consent_required",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["cross_decision_patterns", "simulation_history_entries"],
  },
  {
    purpose: "memory_promotion",
    requirement: "out_of_scope",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["cross_decision_patterns"],
  },
  {
    purpose: "analytics_reuse",
    requirement: "out_of_scope",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["cross_decision_patterns"],
  },
  {
    purpose: "ai_training_reuse",
    requirement: "out_of_scope",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["cross_decision_patterns"],
  },
  {
    purpose: "workspace_sharing",
    requirement: "out_of_scope",
    policyVersion: "stage_4_3b_policy_v1",
    dataCategories: ["simulation_records", "simulation_drafts", "simulation_history_entries"],
  },
];

export function consentRuntimeSafetyEvidence(): ConsentRuntimeSafetyEvidence {
  return {
    stage: "4.3B",
    consentOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
    runtimeWritesEnabled: false,
    dbOperationsExecuted: false,
    exportRuntimeStarted: false,
    deletionRuntimeStarted: false,
    retentionRuntimeStarted: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    apiRouteIntegrated: false,
    authRuntimeChanged: false,
    simulatorIntegrated: false,
    persistenceSchemaChanged: false,
    migrationsChanged: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    aiIntegrated: false,
    stage43CStarted: false,
    stage44Started: false,
    rollback: "disable_consent_runtime_or_remove_user_data_controls_exports",
  };
}

function blocked(
  purpose: ConsentPurpose,
  reason: ConsentRuntimeBlockedReason,
  message: string,
): ConsentRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: CONSENT_RUNTIME_FOUNDATION_VERSION,
    purpose,
    reason,
    message,
    evidence: consentRuntimeSafetyEvidence(),
  };
}

function hasClientOwnerFields(input: ConsentRuntimeEvaluationInput): boolean {
  const fields = input.clientOwnerFields;

  if (!fields) {
    return false;
  }

  return Boolean(
    fields.principalId ||
      fields.ownerPrincipalId ||
      fields.ownerPrincipalType ||
      fields.providerReference,
  );
}

function findPolicy(
  policies: ConsentPurposePolicy[],
  purpose: ConsentPurpose,
): ConsentPurposePolicy | undefined {
  return policies.find((policy) => policy.purpose === purpose);
}

function isExpired(record: ConsentRecord, now: string): boolean {
  if (!record.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(record.expiresAt);
  const nowTime = Date.parse(now);

  return Number.isFinite(expiresAt) && Number.isFinite(nowTime) && expiresAt <= nowTime;
}

function validateRequiredConsent(input: {
  policy: ConsentPurposePolicy;
  record: ConsentRecord | null | undefined;
  ownerPrincipalId: string;
  now: string;
}): ConsentRuntimeEvaluationResult | undefined {
  const { policy, record, ownerPrincipalId } = input;

  if (!record) {
    return blocked(
      policy.purpose,
      "consent_required_missing",
      "Consent is required for this purpose but no consent record was provided.",
    );
  }

  if (
    record.ownerPrincipalId !== ownerPrincipalId ||
    record.ownerPrincipalType !== "registered_user"
  ) {
    return blocked(
      policy.purpose,
      "consent_record_owner_mismatch",
      "Consent record owner does not match the authenticated registered user.",
    );
  }

  if (record.purpose !== policy.purpose) {
    return blocked(
      policy.purpose,
      "consent_record_purpose_mismatch",
      "Consent record purpose does not match the requested purpose.",
    );
  }

  if (record.policyVersion !== policy.policyVersion) {
    return blocked(
      policy.purpose,
      "consent_record_policy_mismatch",
      "Consent record policy version does not match the active consent policy.",
    );
  }

  if (record.status !== "granted") {
    return blocked(
      policy.purpose,
      "consent_record_not_granted",
      "Consent record is not in granted state.",
    );
  }

  if (isExpired(record, input.now)) {
    return blocked(
      policy.purpose,
      "consent_record_expired",
      "Consent record has expired for this purpose.",
    );
  }

  return undefined;
}

function evaluateRequirement(
  input: {
    policy: ConsentPurposePolicy;
    requirement: ConsentRequirement;
    ownerPrincipalId: string;
    evaluationInput: ConsentRuntimeEvaluationInput;
  },
): ConsentRuntimeEvaluationResult {
  const { policy, requirement, ownerPrincipalId, evaluationInput } = input;

  if (requirement === "out_of_scope") {
    return blocked(
      policy.purpose,
      "purpose_out_of_scope",
      "Requested consent purpose is outside Stage 4.3B consent foundation scope.",
    );
  }

  if (requirement === "consent_required") {
    const consentIssue = validateRequiredConsent({
      policy,
      record: evaluationInput.consentRecord,
      ownerPrincipalId,
      now: evaluationInput.now ?? new Date(0).toISOString(),
    });

    if (consentIssue) {
      return consentIssue;
    }
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: CONSENT_RUNTIME_FOUNDATION_VERSION,
    purpose: policy.purpose,
    requirement,
    principalId: ownerPrincipalId,
    policyVersion: policy.policyVersion,
    consentId:
      requirement === "consent_required"
        ? evaluationInput.consentRecord?.consentId
        : undefined,
    evidence: consentRuntimeSafetyEvidence(),
  };
}

export function createConsentRuntimeFoundation(
  config: ConsentRuntimeConfig = {
    enabled: false,
    policies: DEFAULT_CONSENT_RUNTIME_POLICIES,
  },
): ConsentRuntimeFoundation {
  const policies = [...config.policies];

  return {
    version: CONSENT_RUNTIME_FOUNDATION_VERSION,
    mode: CONSENT_RUNTIME_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    supportedPurposes: policies.map((policy) => policy.purpose),
    evaluate(input) {
      if (!config.enabled) {
        return blocked(
          input.purpose,
          "consent_runtime_disabled",
          "Consent runtime foundation is disabled by controlled rollout configuration.",
        );
      }

      if (!input.authContext) {
        return blocked(
          input.purpose,
          "auth_context_missing",
          "Consent runtime evaluation requires an auth context.",
        );
      }

      if (input.authContext.identityState !== "authenticated") {
        return blocked(
          input.purpose,
          "auth_context_not_authenticated",
          "Consent runtime evaluation requires an authenticated registered-user context.",
        );
      }

      if (input.authContext.sessionStatus !== "active") {
        return blocked(
          input.purpose,
          "session_not_active",
          "Consent runtime evaluation requires an active session.",
        );
      }

      if (input.authContext.principal.principalType !== "registered_user") {
        return blocked(
          input.purpose,
          "principal_type_not_supported",
          "Only registered_user principals are eligible for Stage 4.3B consent evaluation.",
        );
      }

      if (hasClientOwnerFields(input)) {
        return blocked(
          input.purpose,
          "client_owner_input_rejected",
          "Client-supplied owner or provider fields are rejected by the consent foundation.",
        );
      }

      const ownerPrincipalId = input.authContext.principal.principalId;

      if (input.ownerPrincipalId && input.ownerPrincipalId !== ownerPrincipalId) {
        return blocked(
          input.purpose,
          "owner_mismatch",
          "Requested owner does not match the authenticated registered user.",
        );
      }

      const policy = findPolicy(policies, input.purpose);

      if (!policy) {
        return blocked(
          input.purpose,
          "purpose_not_supported",
          "Requested consent purpose is not configured in the consent foundation.",
        );
      }

      return evaluateRequirement({
        policy,
        requirement: policy.requirement,
        ownerPrincipalId,
        evaluationInput: input,
      });
    },
  };
}
