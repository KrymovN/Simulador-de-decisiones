import "server-only";

import type {
  CanonicalCampaignAggregationResult,
  CanonicalLevioGuaranteeId,
  CanonicalLevioGuaranteeStatus,
  CanonicalOverallStage9Status,
} from "./canonical-provider-evaluation-aggregation";

export const CANONICAL_LEVIO_INTEGRATION_READINESS_REBASELINE_DECISION_ID =
  "stage-9-levio-integration-readiness-rebaseline.1" as const;

export const CANONICAL_LEVIO_INTEGRATION_READINESS_VERSION =
  "canonical-levio-integration-readiness.1" as const;

export const CANONICAL_STAGE9_SELECTED_PROVIDER = {
  provider: "openai",
  model: "gpt-5.6-terra",
} as const;

export const CANONICAL_STAGE9_TERMINAL_QUESTION =
  "Is Levio integration-ready with the selected real provider under the frozen product architecture and safety/privacy/cost boundaries?" as const;

export const CANONICAL_PROVIDER_CAMPAIGN_REBASELINE_DISPOSITION =
  "STOPPED_BY_OWNER_REBASELINE_EVIDENCE_RETAINED" as const;

export const CANONICAL_PROVIDER_NEXT_POSITION_AUTHORIZATION =
  "NOT_AUTHORIZED_OWNER_REBASELINE" as const;

export const CANONICAL_STAGE9_GATE_DISPOSITIONS = [
  {
    gateId: "hidden_matcher",
    category: "PROVIDER_QUALITY_DIAGNOSTIC",
    productBlocking: false,
  },
  {
    gateId: "multilingual_semantic_metrics",
    category: "PROVIDER_QUALITY_DIAGNOSTIC",
    productBlocking: false,
  },
  {
    gateId: "human_review_provider_quality_scores",
    category: "PROVIDER_QUALITY_DIAGNOSTIC",
    productBlocking: false,
  },
  {
    gateId: "provider_privacy_review",
    category: "PROVIDER_QUALITY_DIAGNOSTIC",
    productBlocking: false,
  },
  {
    gateId: "provider_result_contract_validation",
    category: "LEVIO_INTEGRATION_GATE",
    productBlocking: true,
  },
  {
    gateId: "candidate_contract_safety_validation",
    category: "LEVIO_INTEGRATION_GATE",
    productBlocking: true,
  },
  {
    gateId: "candidate_grounding_validation",
    category: "LEVIO_INTEGRATION_GATE",
    productBlocking: true,
  },
  {
    gateId: "oracle_isolation",
    category: "LEVIO_INTEGRATION_GATE",
    productBlocking: true,
  },
  {
    gateId: "cost_token_runtime_limits",
    category: "LEVIO_INTEGRATION_GATE",
    productBlocking: true,
  },
] as const;

export type CanonicalHistoricalPosition4Status =
  | "REVIEW_REQUIRED"
  | "PASS"
  | "FAIL";

export type CanonicalLevioIntegrationBlocker = {
  guaranteeId: CanonicalLevioGuaranteeId;
  status: Exclude<CanonicalLevioGuaranteeStatus, "PASS">;
};

export type CanonicalLevioIntegrationReadinessProjection = {
  version: typeof CANONICAL_LEVIO_INTEGRATION_READINESS_VERSION;
  decisionId: typeof CANONICAL_LEVIO_INTEGRATION_READINESS_REBASELINE_DECISION_ID;
  terminalQuestion: typeof CANONICAL_STAGE9_TERMINAL_QUESTION;
  selectedProvider: typeof CANONICAL_STAGE9_SELECTED_PROVIDER;
  providerEvaluation: {
    disposition: typeof CANONICAL_PROVIDER_CAMPAIGN_REBASELINE_DISPOSITION;
    historicalQualification: CanonicalCampaignAggregationResult["providerQualification"]["status"];
    historicalOverallStage9: CanonicalCampaignAggregationResult["overallStage9"];
    retainedAsDiagnostic: true;
    productBlocking: false;
    furtherProviderPositionsAuthorized: false;
  };
  position4HumanReview: {
    historicalStatus: CanonicalHistoricalPosition4Status;
    retainedAsHistoricalEvidence: true;
    prerequisiteForCurrentLevioRemediation: false;
  };
  levioIntegrationReadiness: {
    status: CanonicalOverallStage9Status;
    ready: boolean;
    blockers: CanonicalLevioIntegrationBlocker[];
    evidenceIssues: string[];
  };
  workAuthorization: {
    levioOwnedRemediation: "AUTHORIZED" | "NOT_REQUIRED" | "BLOCKED_BY_SYSTEM_EVIDENCE";
    nextProviderPosition: typeof CANONICAL_PROVIDER_NEXT_POSITION_AUTHORIZATION;
  };
};

function levioIntegrationStatus(
  blockers: readonly CanonicalLevioIntegrationBlocker[],
  evidenceIssues: readonly string[],
): CanonicalOverallStage9Status {
  if (evidenceIssues.length > 0) return "SYSTEM_EVIDENCE_INCOMPLETE";
  if (blockers.some((item) => item.status === "FAIL")) return "STAGE9_BLOCKED";
  if (blockers.length > 0) return "STAGE9_INCOMPLETE";
  return "STAGE9_QUALIFIED";
}

export function projectCanonicalLevioIntegrationReadiness(
  aggregation: CanonicalCampaignAggregationResult,
  historicalPosition4Status: CanonicalHistoricalPosition4Status,
): CanonicalLevioIntegrationReadinessProjection {
  const blockers = aggregation.levioProductGuarantee.guarantees.flatMap((item) =>
    item.status === "PASS"
      ? []
      : [{ guaranteeId: item.guaranteeId, status: item.status }]
  ) as CanonicalLevioIntegrationBlocker[];
  const evidenceIssues = [...aggregation.evidenceIssues];
  const status = levioIntegrationStatus(blockers, evidenceIssues);
  return {
    version: CANONICAL_LEVIO_INTEGRATION_READINESS_VERSION,
    decisionId: CANONICAL_LEVIO_INTEGRATION_READINESS_REBASELINE_DECISION_ID,
    terminalQuestion: CANONICAL_STAGE9_TERMINAL_QUESTION,
    selectedProvider: CANONICAL_STAGE9_SELECTED_PROVIDER,
    providerEvaluation: {
      disposition: CANONICAL_PROVIDER_CAMPAIGN_REBASELINE_DISPOSITION,
      historicalQualification: aggregation.providerQualification.status,
      historicalOverallStage9: structuredClone(aggregation.overallStage9),
      retainedAsDiagnostic: true,
      productBlocking: false,
      furtherProviderPositionsAuthorized: false,
    },
    position4HumanReview: {
      historicalStatus: historicalPosition4Status,
      retainedAsHistoricalEvidence: true,
      prerequisiteForCurrentLevioRemediation: false,
    },
    levioIntegrationReadiness: {
      status,
      ready: status === "STAGE9_QUALIFIED",
      blockers,
      evidenceIssues,
    },
    workAuthorization: {
      levioOwnedRemediation: evidenceIssues.length > 0
        ? "BLOCKED_BY_SYSTEM_EVIDENCE"
        : blockers.length > 0 ? "AUTHORIZED" : "NOT_REQUIRED",
      nextProviderPosition: CANONICAL_PROVIDER_NEXT_POSITION_AUTHORIZATION,
    },
  };
}
