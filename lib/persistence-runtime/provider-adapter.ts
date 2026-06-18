import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  PersistenceProviderId,
  PersistenceProviderSubjectType,
} from "./contracts";

export const PERSISTENCE_PROVIDER_ADAPTER_FOUNDATION_VERSION =
  "4.2F-provider-adapter.1" as const;

export type PersistenceProviderAdapterKind = "noop";

export type PersistenceProviderAdapterFactoryInput = {
  providerId?: PersistenceProviderId | string;
  adapterKind?: PersistenceProviderAdapterKind | string;
  enabled?: boolean;
};

export type PersistenceProviderAdapterBlockedReason =
  | "provider_disabled"
  | "provider_not_supported"
  | "adapter_kind_not_supported";

export type PersistenceProviderAdapterEvidence = {
  stage: "4.2F";
  providerAbstractionOnly: true;
  providerContractValidated: true;
  noopProviderOnly: true;
  serverOnlyBoundaryRequired: true;
  supabaseSdkImported: false;
  dbOperationExecuted: false;
  sqlExecuted: false;
  userOperationExecuted: false;
  uiIntegrated: false;
  apiRouteIntegrated: false;
  authIntegrated: false;
  simulatorIntegrated: false;
  schemaChanged: false;
  migrationsChanged: false;
  stage42GStarted: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "remove_persistence_provider_adapter_foundation_exports";
};

export type PersistenceProviderAdapterAvailableResult = {
  status: "available";
  version: typeof PERSISTENCE_PROVIDER_ADAPTER_FOUNDATION_VERSION;
  providerId: PersistenceProviderId;
  adapterKind: PersistenceProviderAdapterKind;
  adapter: PersistenceProviderAdapter;
  writesEnabled: false;
  realOperationsEnabled: false;
  evidence: PersistenceProviderAdapterEvidence;
};

export type PersistenceProviderAdapterBlockedResult = {
  status: "blocked";
  version: typeof PERSISTENCE_PROVIDER_ADAPTER_FOUNDATION_VERSION;
  providerId: PersistenceProviderId | string;
  adapterKind: PersistenceProviderAdapterKind | string;
  reason: PersistenceProviderAdapterBlockedReason;
  message: string;
  writesEnabled: false;
  realOperationsEnabled: false;
  evidence: PersistenceProviderAdapterEvidence;
};

export type PersistenceProviderAdapterFactoryResult =
  | PersistenceProviderAdapterAvailableResult
  | PersistenceProviderAdapterBlockedResult;

export type PersistenceProviderAdapterValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type PersistenceProviderAdapterValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PersistenceProviderAdapterValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

type ResolverInput = {
  providerReference: string;
  providerSubjectType: PersistenceProviderSubjectType;
};

function evidence(): PersistenceProviderAdapterEvidence {
  return {
    stage: "4.2F",
    providerAbstractionOnly: true,
    providerContractValidated: true,
    noopProviderOnly: true,
    serverOnlyBoundaryRequired: true,
    supabaseSdkImported: false,
    dbOperationExecuted: false,
    sqlExecuted: false,
    userOperationExecuted: false,
    uiIntegrated: false,
    apiRouteIntegrated: false,
    authIntegrated: false,
    simulatorIntegrated: false,
    schemaChanged: false,
    migrationsChanged: false,
    stage42GStarted: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "remove_persistence_provider_adapter_foundation_exports",
  };
}

function blocked(
  input: Required<Pick<PersistenceProviderAdapterFactoryInput, "providerId" | "adapterKind">>,
  reason: PersistenceProviderAdapterBlockedReason,
  message: string,
): PersistenceProviderAdapterBlockedResult {
  return {
    status: "blocked",
    version: PERSISTENCE_PROVIDER_ADAPTER_FOUNDATION_VERSION,
    providerId: input.providerId,
    adapterKind: input.adapterKind,
    reason,
    message,
    writesEnabled: false,
    realOperationsEnabled: false,
    evidence: evidence(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function persistenceProviderAdapterEvidence(): PersistenceProviderAdapterEvidence {
  return evidence();
}

export function createNoopPersistenceProviderAdapter(): PersistenceProviderAdapter {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference(
      _input: ResolverInput,
    ): Promise<LevioPrincipalRow | null> {
      return null;
    },
  };
}

export function validatePersistenceProviderAdapter(
  adapter: unknown,
): adapter is PersistenceProviderAdapter {
  if (!isRecord(adapter)) {
    return false;
  }

  return (
    adapter.providerId === "supabase" &&
    adapter.executionBoundary === "server_only" &&
    typeof adapter.resolvePrincipalByProviderReference === "function"
  );
}

export function createPersistenceProviderAdapter(
  input: PersistenceProviderAdapterFactoryInput = {},
): PersistenceProviderAdapterFactoryResult {
  const providerId = input.providerId ?? "supabase";
  const adapterKind = input.adapterKind ?? "noop";
  const normalizedInput = { providerId, adapterKind };

  if (input.enabled === false) {
    return blocked(
      normalizedInput,
      "provider_disabled",
      "Persistence provider adapter is disabled by configuration.",
    );
  }

  if (providerId !== "supabase") {
    return blocked(
      normalizedInput,
      "provider_not_supported",
      "Stage 4.2F only accepts the Supabase provider contract.",
    );
  }

  if (adapterKind !== "noop") {
    return blocked(
      normalizedInput,
      "adapter_kind_not_supported",
      "Stage 4.2F exposes only the no-op provider adapter foundation.",
    );
  }

  return {
    status: "available",
    version: PERSISTENCE_PROVIDER_ADAPTER_FOUNDATION_VERSION,
    providerId,
    adapterKind,
    adapter: createNoopPersistenceProviderAdapter(),
    writesEnabled: false,
    realOperationsEnabled: false,
    evidence: evidence(),
  };
}
