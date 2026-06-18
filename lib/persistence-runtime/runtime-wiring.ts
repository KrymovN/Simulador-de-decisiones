import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  PersistenceProviderSubjectType,
  PersistenceRuntimeFoundation,
  PersistenceRuntimePreflightInput,
  PersistenceRuntimePreflightResult,
} from "./contracts";
import { createPersistenceRuntimeFoundation } from "./foundation";
import {
  createPersistenceProviderAdapter,
  type PersistenceProviderAdapterFactoryInput,
  type PersistenceProviderAdapterFactoryResult,
} from "./provider-adapter";

export const PERSISTENCE_RUNTIME_WIRING_VERSION =
  "4.2H-runtime-wiring.1" as const;

export type PersistenceRuntimeWiringProviderSource =
  | "factory_supabase"
  | "factory_noop"
  | "injected_adapter";

export type PersistenceRuntimeWiringBlockedReason =
  | "provider_adapter_unavailable"
  | "provider_resolution_failed";

export type PersistenceRuntimeWiringEvidence = {
  stage: "4.2H";
  foundationComposed: true;
  providerAdapterComposed: boolean;
  supabaseProviderEligible: boolean;
  dependencyInjectionSupported: true;
  runtimeInitializationOnly: true;
  principalResolutionOnly: true;
  preflightOnly: true;
  writesEnabled: false;
  simulationCrudEnabled: false;
  draftOperationsEnabled: false;
  historyOperationsEnabled: false;
  uiIntegrated: false;
  apiRouteIntegrated: false;
  authIntegrated: false;
  simulatorIntegrated: false;
  schemaChanged: false;
  migrationsChanged: false;
  stage42IStarted: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "remove_persistence_runtime_wiring_exports";
};

export type PersistenceRuntimeResolvePrincipalInput = {
  providerReference: string;
  providerSubjectType?: PersistenceProviderSubjectType;
};

export type PersistenceRuntimeResolvedPrincipal = {
  status: "resolved";
  principal: LevioPrincipalRow;
  evidence: PersistenceRuntimeWiringEvidence;
};

export type PersistenceRuntimeBlockedPrincipalResolution = {
  status: "blocked";
  reason: PersistenceRuntimeWiringBlockedReason;
  message: string;
  evidence: PersistenceRuntimeWiringEvidence;
};

export type PersistenceRuntimeResolvePrincipalResult =
  | PersistenceRuntimeResolvedPrincipal
  | PersistenceRuntimeBlockedPrincipalResolution;

export type PersistenceRuntimeWiringInput = {
  providerSource?: PersistenceRuntimeWiringProviderSource;
  providerAdapter?: PersistenceProviderAdapter;
  providerFactoryInput?: PersistenceProviderAdapterFactoryInput;
};

export type PersistenceRuntimeWiringReady = {
  status: "ready";
  version: typeof PERSISTENCE_RUNTIME_WIRING_VERSION;
  providerSource: PersistenceRuntimeWiringProviderSource;
  providerAdapterConfigured: true;
  providerFactoryResult?: PersistenceProviderAdapterFactoryResult;
  foundation: PersistenceRuntimeFoundation;
  writesEnabled: false;
  evidence: PersistenceRuntimeWiringEvidence;
  resolvePrincipal(input: PersistenceRuntimeResolvePrincipalInput): Promise<PersistenceRuntimeResolvePrincipalResult>;
  preflight(input: PersistenceRuntimePreflightInput): Promise<PersistenceRuntimePreflightResult>;
};

export type PersistenceRuntimeWiringBlocked = {
  status: "blocked";
  version: typeof PERSISTENCE_RUNTIME_WIRING_VERSION;
  providerSource: PersistenceRuntimeWiringProviderSource;
  providerAdapterConfigured: false;
  providerFactoryResult: PersistenceProviderAdapterFactoryResult;
  foundation: PersistenceRuntimeFoundation;
  writesEnabled: false;
  reason: PersistenceRuntimeWiringBlockedReason;
  message: string;
  evidence: PersistenceRuntimeWiringEvidence;
  resolvePrincipal(input: PersistenceRuntimeResolvePrincipalInput): Promise<PersistenceRuntimeResolvePrincipalResult>;
  preflight(input: PersistenceRuntimePreflightInput): Promise<PersistenceRuntimePreflightResult>;
};

export type PersistenceRuntimeWiring =
  | PersistenceRuntimeWiringReady
  | PersistenceRuntimeWiringBlocked;

function evidence(input: {
  providerAdapterComposed: boolean;
  supabaseProviderEligible: boolean;
}): PersistenceRuntimeWiringEvidence {
  return {
    stage: "4.2H",
    foundationComposed: true,
    providerAdapterComposed: input.providerAdapterComposed,
    supabaseProviderEligible: input.supabaseProviderEligible,
    dependencyInjectionSupported: true,
    runtimeInitializationOnly: true,
    principalResolutionOnly: true,
    preflightOnly: true,
    writesEnabled: false,
    simulationCrudEnabled: false,
    draftOperationsEnabled: false,
    historyOperationsEnabled: false,
    uiIntegrated: false,
    apiRouteIntegrated: false,
    authIntegrated: false,
    simulatorIntegrated: false,
    schemaChanged: false,
    migrationsChanged: false,
    stage42IStarted: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "remove_persistence_runtime_wiring_exports",
  };
}

function providerSourceFromInput(
  input: PersistenceRuntimeWiringInput,
): PersistenceRuntimeWiringProviderSource {
  if (input.providerAdapter) {
    return "injected_adapter";
  }

  return input.providerFactoryInput?.adapterKind === "noop" ? "factory_noop" : "factory_supabase";
}

function blockedPrincipalResolution(
  message: string,
  runtimeEvidence: PersistenceRuntimeWiringEvidence,
): PersistenceRuntimeBlockedPrincipalResolution {
  return {
    status: "blocked",
    reason: "provider_resolution_failed",
    message,
    evidence: runtimeEvidence,
  };
}

async function resolvePrincipalWithAdapter(
  adapter: PersistenceProviderAdapter | undefined,
  input: PersistenceRuntimeResolvePrincipalInput,
  runtimeEvidence: PersistenceRuntimeWiringEvidence,
): Promise<PersistenceRuntimeResolvePrincipalResult> {
  if (!adapter) {
    return {
      status: "blocked",
      reason: "provider_adapter_unavailable",
      message: "Persistence runtime wiring has no configured provider adapter.",
      evidence: runtimeEvidence,
    };
  }

  const principal = await adapter.resolvePrincipalByProviderReference({
    providerReference: input.providerReference,
    providerSubjectType: input.providerSubjectType ?? "user",
  });

  if (!principal) {
    return blockedPrincipalResolution(
      "Persistence provider did not resolve an active Levio principal.",
      runtimeEvidence,
    );
  }

  return {
    status: "resolved",
    principal,
    evidence: runtimeEvidence,
  };
}

async function preflightWithOptionalResolution(input: {
  foundation: PersistenceRuntimeFoundation;
  adapter?: PersistenceProviderAdapter;
  preflightInput: PersistenceRuntimePreflightInput;
  runtimeEvidence: PersistenceRuntimeWiringEvidence;
}): Promise<PersistenceRuntimePreflightResult> {
  const { authContext } = input.preflightInput;

  if (!input.adapter || authContext?.identityState !== "authenticated") {
    return input.foundation.preflight(input.preflightInput);
  }

  const resolvedPrincipal =
    input.preflightInput.resolvedPrincipal ??
    (await resolvePrincipalWithAdapter(
      input.adapter,
      {
        providerReference: authContext.principal.providerReference,
        providerSubjectType: "user",
      },
      input.runtimeEvidence,
    ));

  return input.foundation.preflight({
    ...input.preflightInput,
    resolvedPrincipal:
      "status" in resolvedPrincipal && resolvedPrincipal.status === "resolved"
        ? resolvedPrincipal.principal
        : input.preflightInput.resolvedPrincipal,
  });
}

export function initializePersistenceRuntimeWiring(
  input: PersistenceRuntimeWiringInput = {},
): PersistenceRuntimeWiring {
  const providerSource = providerSourceFromInput(input);
  const supabaseProviderEligible = providerSource === "factory_supabase";

  if (input.providerAdapter) {
    const runtimeEvidence = evidence({
      providerAdapterComposed: true,
      supabaseProviderEligible,
    });
    const foundation = createPersistenceRuntimeFoundation(input.providerAdapter);

    return {
      status: "ready",
      version: PERSISTENCE_RUNTIME_WIRING_VERSION,
      providerSource,
      providerAdapterConfigured: true,
      foundation,
      writesEnabled: false,
      evidence: runtimeEvidence,
      resolvePrincipal(resolveInput) {
        return resolvePrincipalWithAdapter(input.providerAdapter, resolveInput, runtimeEvidence);
      },
      preflight(preflightInput) {
        return preflightWithOptionalResolution({
          foundation,
          adapter: input.providerAdapter,
          preflightInput,
          runtimeEvidence,
        });
      },
    };
  }

  const providerFactoryResult = createPersistenceProviderAdapter(
    input.providerFactoryInput ?? { adapterKind: "supabase" },
  );

  if (providerFactoryResult.status === "blocked") {
    const runtimeEvidence = evidence({
      providerAdapterComposed: false,
      supabaseProviderEligible,
    });
    const foundation = createPersistenceRuntimeFoundation();

    return {
      status: "blocked",
      version: PERSISTENCE_RUNTIME_WIRING_VERSION,
      providerSource,
      providerAdapterConfigured: false,
      providerFactoryResult,
      foundation,
      writesEnabled: false,
      reason: "provider_adapter_unavailable",
      message: providerFactoryResult.message,
      evidence: runtimeEvidence,
      resolvePrincipal(resolveInput) {
        return resolvePrincipalWithAdapter(undefined, resolveInput, runtimeEvidence);
      },
      preflight(preflightInput) {
        return preflightWithOptionalResolution({
          foundation,
          preflightInput,
          runtimeEvidence,
        });
      },
    };
  }

  const runtimeEvidence = evidence({
    providerAdapterComposed: true,
    supabaseProviderEligible,
  });
  const foundation = createPersistenceRuntimeFoundation(providerFactoryResult.adapter);

  return {
    status: "ready",
    version: PERSISTENCE_RUNTIME_WIRING_VERSION,
    providerSource,
    providerAdapterConfigured: true,
    providerFactoryResult,
    foundation,
    writesEnabled: false,
    evidence: runtimeEvidence,
    resolvePrincipal(resolveInput) {
      return resolvePrincipalWithAdapter(providerFactoryResult.adapter, resolveInput, runtimeEvidence);
    },
    preflight(preflightInput) {
      return preflightWithOptionalResolution({
        foundation,
        adapter: providerFactoryResult.adapter,
        preflightInput,
        runtimeEvidence,
      });
    },
  };
}
