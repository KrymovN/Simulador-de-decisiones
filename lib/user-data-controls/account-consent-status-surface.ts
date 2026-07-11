import { readServerAuthSession } from "../auth/session";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import type { ConsentPurpose, ConsentRequirement } from "./contracts";
import { DEFAULT_CONSENT_RUNTIME_POLICIES } from "./consent-runtime";

export const ACCOUNT_CONSENT_STATUS_SURFACE_VERSION =
  "stage-7-account-consent-status-surface.1" as const;

type AccountConsentPolicyStatus = {
  purpose: ConsentPurpose;
  requirement: ConsentRequirement;
  policyVersion: string;
  dataCategories: string[];
  currentStatus: "not_required" | "not_recorded" | "not_available";
  management: "read_only_status";
};

export type AccountConsentStatusDocument = {
  consentStatusVersion: typeof ACCOUNT_CONSENT_STATUS_SURFACE_VERSION;
  format: "levio-account-consent-status-json";
  generatedAt: string;
  scope: {
    account: "authenticated_registered_user";
    consent: "policy_status_only_no_ledger";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  policies: AccountConsentPolicyStatus[];
  safety: {
    consentLedger: "not_implemented";
    consentCapture: "not_executed";
    consentWithdrawal: "not_executed";
    databaseWrites: "not_executed";
    memoryRuntime: "not_started";
    analyticsReuse: "not_started";
    aiTrainingReuse: "not_started";
  };
};

export type AccountConsentStatusSurfaceResult =
  | { status: "ready"; document: AccountConsentStatusDocument }
  | {
      status: "blocked";
      reason: "auth_required" | "read_failed";
      message: string;
    };

function currentStatus(requirement: ConsentRequirement): AccountConsentPolicyStatus["currentStatus"] {
  if (requirement === "consent_not_required") {
    return "not_required";
  }

  if (requirement === "consent_required") {
    return "not_recorded";
  }

  return "not_available";
}

export async function readAccountConsentStatusSurface(): Promise<AccountConsentStatusSurfaceResult> {
  const authContext = await readServerAuthSession();

  if (authContext.identityState !== "authenticated") {
    return {
      status: "blocked",
      reason: "auth_required",
      message: "Inicia sesión para consultar el estado de consentimiento de esta cuenta.",
    };
  }

  const persistenceRuntime = initializePersistenceRuntimeWiring();

  if (persistenceRuntime.status !== "ready") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar el estado de consentimiento de forma controlada.",
    };
  }

  const preflight = await persistenceRuntime.preflight({
    operation: "list_simulation_records",
    authContext,
  });

  if (preflight.status === "blocked") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo validar el propietario de la cuenta de forma controlada.",
    };
  }

  return {
    status: "ready",
    document: {
      consentStatusVersion: ACCOUNT_CONSENT_STATUS_SURFACE_VERSION,
      format: "levio-account-consent-status-json",
      generatedAt: new Date().toISOString(),
      scope: {
        account: "authenticated_registered_user",
        consent: "policy_status_only_no_ledger",
      },
      account: {
        identityState: "authenticated",
        sessionStatus: "active",
      },
      policies: DEFAULT_CONSENT_RUNTIME_POLICIES.map((policy) => ({
        purpose: policy.purpose,
        requirement: policy.requirement,
        policyVersion: policy.policyVersion,
        dataCategories: [...policy.dataCategories],
        currentStatus: currentStatus(policy.requirement),
        management: "read_only_status",
      })),
      safety: {
        consentLedger: "not_implemented",
        consentCapture: "not_executed",
        consentWithdrawal: "not_executed",
        databaseWrites: "not_executed",
        memoryRuntime: "not_started",
        analyticsReuse: "not_started",
        aiTrainingReuse: "not_started",
      },
    },
  };
}
