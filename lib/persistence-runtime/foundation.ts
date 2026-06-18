import {
  PERSISTENCE_RUNTIME_FOUNDATION_MODE,
  PERSISTENCE_RUNTIME_FOUNDATION_VERSION,
  type LevioPrincipalRow,
  type PersistenceProviderAdapter,
  type PersistenceRuntimeBlockedReason,
  type PersistenceRuntimeFoundation,
  type PersistenceRuntimeOperation,
  type PersistenceRuntimePreflightInput,
  type PersistenceRuntimePreflightResult,
  type PersistenceRuntimeSafetyEvidence,
} from "./contracts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MUTATING_OPERATIONS: PersistenceRuntimeOperation[] = [
  "create_simulation_record",
  "update_simulation_record",
  "archive_simulation_record",
  "delete_simulation_record",
  "create_simulation_draft",
  "update_simulation_draft",
  "delete_simulation_draft",
  "append_simulation_history_entry",
];

export function persistenceRuntimeSafetyEvidence(): PersistenceRuntimeSafetyEvidence {
  return {
    foundationOnly: true,
    providerIsolated: true,
    serverOnlyBoundaryRequired: true,
    authRuntimeReadByFoundation: false,
    supabaseClientCreated: false,
    sqlExecuted: false,
    userOperationExecuted: false,
    uiIntegrated: false,
    simulatorIntegrated: false,
    aiIntegrated: false,
    memoryIntegrated: false,
    subscriptionsIntegrated: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "remove_persistence_runtime_foundation_exports",
  };
}

function blocked(
  operation: PersistenceRuntimeOperation,
  reason: PersistenceRuntimeBlockedReason,
  message: string,
): PersistenceRuntimePreflightResult {
  return {
    status: "blocked",
    execution: "none",
    operation,
    reason,
    message,
    evidence: persistenceRuntimeSafetyEvidence(),
  };
}

function hasClientOwnerFields(input: PersistenceRuntimePreflightInput): boolean {
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

function normalizeProviderReference(value: string): string | undefined {
  const trimmed = value.trim();
  const withoutProviderPrefix = trimmed.startsWith("supabase:")
    ? trimmed.slice("supabase:".length)
    : trimmed;

  return UUID_PATTERN.test(withoutProviderPrefix) ? withoutProviderPrefix : undefined;
}

function isMutatingOperation(operation: PersistenceRuntimeOperation): boolean {
  return MUTATING_OPERATIONS.includes(operation);
}

function activeResolvedPrincipal(row: LevioPrincipalRow | null | undefined): row is LevioPrincipalRow {
  return Boolean(
    row &&
      row.principal_type === "registered_user" &&
      row.principal_status === "active" &&
      row.provider_name === "supabase" &&
      row.provider_reference_status === "active" &&
      row.deletion_state === "active",
  );
}

export function evaluatePersistenceRuntimePreflight(
  input: PersistenceRuntimePreflightInput,
  providerAdapter?: PersistenceProviderAdapter,
): PersistenceRuntimePreflightResult {
  const { operation, authContext } = input;

  if (!authContext) {
    return blocked(operation, "auth_context_missing", "Persistence preflight requires an auth context.");
  }

  if (authContext.identityState !== "authenticated") {
    return blocked(
      operation,
      "auth_context_not_authenticated",
      "Persistence preflight requires an authenticated registered-user context.",
    );
  }

  if (authContext.sessionStatus !== "active") {
    return blocked(operation, "session_not_active", "Persistence preflight requires an active session.");
  }

  if (authContext.principal.principalType !== "registered_user") {
    return blocked(
      operation,
      "principal_type_not_supported",
      "Only registered_user principals are eligible for Stage 4.2E persistence preflight.",
    );
  }

  const providerReference = normalizeProviderReference(authContext.principal.providerReference);

  if (!providerReference) {
    return blocked(
      operation,
      "provider_reference_invalid",
      "Stage 4.2E requires a Supabase UUID provider reference.",
    );
  }

  if (hasClientOwnerFields(input)) {
    return blocked(
      operation,
      "client_owner_input_rejected",
      "Client-supplied owner or provider fields are rejected by the persistence foundation.",
    );
  }

  if (isMutatingOperation(operation)) {
    return blocked(
      operation,
      "foundation_only_write_disabled",
      "Stage 4.2E foundation keeps write operations disabled until a later server-only provider adapter is approved.",
    );
  }

  if (!providerAdapter) {
    return blocked(
      operation,
      "provider_adapter_not_configured",
      "No persistence provider adapter is configured in the foundation stage.",
    );
  }

  if (providerAdapter.providerId !== "supabase" || providerAdapter.executionBoundary !== "server_only") {
    return blocked(
      operation,
      "provider_not_supported",
      "Persistence provider adapter must be Supabase and server-only.",
    );
  }

  if (!input.resolvedPrincipal) {
    return blocked(
      operation,
      "resolved_principal_missing",
      "Preflight requires a resolved Levio principal from the provider adapter boundary.",
    );
  }

  if (!activeResolvedPrincipal(input.resolvedPrincipal)) {
    return blocked(
      operation,
      "resolved_principal_not_active",
      "Resolved Levio principal must be active registered_user with active provider mapping.",
    );
  }

  if (input.resolvedPrincipal.provider_reference !== providerReference) {
    return blocked(
      operation,
      "provider_reference_invalid",
      "Resolved principal provider reference does not match the authenticated context.",
    );
  }

  if (
    input.resourceOwnerPrincipalId &&
    input.resourceOwnerPrincipalId !== input.resolvedPrincipal.principal_id
  ) {
    return blocked(
      operation,
      "owner_mismatch",
      "Resource owner does not match the resolved Levio principal.",
    );
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    operation,
    principalId: input.resolvedPrincipal.principal_id,
    provider: "supabase",
    providerReference,
    evidence: persistenceRuntimeSafetyEvidence(),
  };
}

export function createPersistenceRuntimeFoundation(
  providerAdapter?: PersistenceProviderAdapter,
): PersistenceRuntimeFoundation {
  return {
    version: PERSISTENCE_RUNTIME_FOUNDATION_VERSION,
    mode: PERSISTENCE_RUNTIME_FOUNDATION_MODE,
    providerAdapterConfigured: Boolean(providerAdapter),
    writesEnabled: false,
    preflight(input) {
      return evaluatePersistenceRuntimePreflight(input, providerAdapter);
    },
  };
}
