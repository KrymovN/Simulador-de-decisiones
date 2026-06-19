import { runSubscriptionContractsFoundationValidation } from "./validation";
import { runSubscriptionRuntimeFoundationValidation } from "./runtime-validation";
import { runSubscriptionRuntimeBoundaryValidation } from "./boundary-validation";
import type {
  SubscriptionContractsValidationResult,
  SubscriptionRuntimeBoundaryValidationResult,
  SubscriptionRuntimeValidationResult,
} from "./contracts";

type SubscriptionRuntimeQaRegressionArea =
  | "contracts"
  | "runtime"
  | "boundary"
  | "cross_catalog";

type ValidationCatalog =
  | SubscriptionContractsValidationResult
  | SubscriptionRuntimeValidationResult
  | SubscriptionRuntimeBoundaryValidationResult;

export type SubscriptionRuntimeQaRegressionCaseResult = {
  caseId: string;
  area: SubscriptionRuntimeQaRegressionArea;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionRuntimeQaRegressionResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionRuntimeQaRegressionCaseResult[];
  catalogs: {
    contracts: SubscriptionContractsValidationResult;
    runtime: SubscriptionRuntimeValidationResult;
    boundary: SubscriptionRuntimeBoundaryValidationResult;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    catalogCases: {
      contracts: number;
      runtime: number;
      boundary: number;
    };
  };
};

function qaCase(input: {
  caseId: string;
  area: SubscriptionRuntimeQaRegressionArea;
  title: string;
  expectedBehavior: string;
  issues: string[];
}): SubscriptionRuntimeQaRegressionCaseResult {
  return {
    caseId: input.caseId,
    area: input.area,
    title: input.title,
    expectedBehavior: input.expectedBehavior,
    passed: input.issues.length === 0,
    failed: input.issues.length > 0,
    issues: input.issues,
  };
}

function failingCaseIds(catalog: ValidationCatalog): string[] {
  return catalog.cases
    .filter((validationCase) => validationCase.failed)
    .map((validationCase) => validationCase.caseId);
}

function missingOrFailedCaseIds(
  catalog: ValidationCatalog,
  requiredCaseIds: string[],
): string[] {
  return requiredCaseIds.filter((caseId) => {
    const validationCase = catalog.cases.find((candidate) => candidate.caseId === caseId);

    return !validationCase || validationCase.failed;
  });
}

function expectCatalogPassed(input: {
  area: Exclude<SubscriptionRuntimeQaRegressionArea, "cross_catalog">;
  catalog: ValidationCatalog;
}): SubscriptionRuntimeQaRegressionCaseResult {
  const failures = failingCaseIds(input.catalog);

  return qaCase({
    caseId: `${input.area}_catalog_passes`,
    area: input.area,
    title: `${input.area} validation catalog passes`,
    expectedBehavior:
      "All deterministic subscription validation cases for this area pass.",
    issues:
      input.catalog.passed && failures.length === 0
        ? []
        : [`Failing validation case ids: ${failures.join(", ") || "unknown"}.`],
  });
}

function expectRequiredCases(input: {
  caseId: string;
  area: SubscriptionRuntimeQaRegressionArea;
  title: string;
  expectedBehavior: string;
  catalog: ValidationCatalog;
  requiredCaseIds: string[];
}): SubscriptionRuntimeQaRegressionCaseResult {
  const missingOrFailed = missingOrFailedCaseIds(
    input.catalog,
    input.requiredCaseIds,
  );

  return qaCase({
    caseId: input.caseId,
    area: input.area,
    title: input.title,
    expectedBehavior: input.expectedBehavior,
    issues:
      missingOrFailed.length === 0
        ? []
        : [`Missing or failed required case ids: ${missingOrFailed.join(", ")}.`],
  });
}

function expectCatalogSizes(input: {
  contracts: SubscriptionContractsValidationResult;
  runtime: SubscriptionRuntimeValidationResult;
  boundary: SubscriptionRuntimeBoundaryValidationResult;
}): SubscriptionRuntimeQaRegressionCaseResult {
  const minimums = {
    contracts: 11,
    runtime: 8,
    boundary: 8,
  };
  const issues = [
    input.contracts.summary.total >= minimums.contracts
      ? undefined
      : `Contracts catalog below minimum: ${input.contracts.summary.total}.`,
    input.runtime.summary.total >= minimums.runtime
      ? undefined
      : `Runtime catalog below minimum: ${input.runtime.summary.total}.`,
    input.boundary.summary.total >= minimums.boundary
      ? undefined
      : `Boundary catalog below minimum: ${input.boundary.summary.total}.`,
  ].filter((issue): issue is string => Boolean(issue));

  return qaCase({
    caseId: "subscription_catalog_minimum_coverage",
    area: "cross_catalog",
    title: "Subscription validation catalogs keep minimum regression breadth",
    expectedBehavior:
      "Stage 4.4D preserves deterministic coverage across contracts, runtime, and boundary.",
    issues,
  });
}

function expectCrossCatalogFailClosedCoverage(input: {
  contracts: SubscriptionContractsValidationResult;
  runtime: SubscriptionRuntimeValidationResult;
  boundary: SubscriptionRuntimeBoundaryValidationResult;
}): SubscriptionRuntimeQaRegressionCaseResult {
  const requiredByCatalog = [
    ...missingOrFailedCaseIds(input.contracts, [
      "disabled_foundation_blocks",
      "missing_entitlement_blocks",
      "client_tier_override_blocks",
      "client_owner_fields_block",
      "past_due_status_blocks",
      "expired_entitlement_blocks",
    ]),
    ...missingOrFailedCaseIds(input.runtime, [
      "disabled_runtime_blocks",
      "trusted_owner_missing_blocks",
      "missing_entitlements_blocks",
      "owner_mismatch_blocks",
    ]),
    ...missingOrFailedCaseIds(input.boundary, [
      "disabled_boundary_blocks",
      "missing_operation_blocks",
      "unsupported_operation_blocks",
      "disallowed_operation_blocks",
      "missing_payload_blocks",
      "payload_mismatch_blocks",
    ]),
  ];

  return qaCase({
    caseId: "fail_closed_coverage_preserved",
    area: "cross_catalog",
    title: "Fail-closed coverage is preserved",
    expectedBehavior:
      "Contracts, runtime, and boundary each retain required deny-by-default and invalid-input checks.",
    issues:
      requiredByCatalog.length === 0
        ? []
        : [`Missing or failed fail-closed coverage: ${requiredByCatalog.join(", ")}.`],
  });
}

export function runSubscriptionRuntimeQaRegression(): SubscriptionRuntimeQaRegressionResult {
  const contracts = runSubscriptionContractsFoundationValidation();
  const runtime = runSubscriptionRuntimeFoundationValidation();
  const boundary = runSubscriptionRuntimeBoundaryValidation();

  const cases: SubscriptionRuntimeQaRegressionCaseResult[] = [
    expectCatalogPassed({ area: "contracts", catalog: contracts }),
    expectCatalogPassed({ area: "runtime", catalog: runtime }),
    expectCatalogPassed({ area: "boundary", catalog: boundary }),
    expectRequiredCases({
      caseId: "entitlement_resolution_coverage",
      area: "runtime",
      title: "Entitlement resolution coverage",
      expectedBehavior:
        "Runtime QA confirms missing entitlement, owner mismatch, and highest trusted entitlement resolution.",
      catalog: runtime,
      requiredCaseIds: [
        "missing_entitlements_blocks",
        "owner_mismatch_blocks",
        "highest_tier_resolves",
      ],
    }),
    expectRequiredCases({
      caseId: "tier_resolution_coverage",
      area: "runtime",
      title: "Tier resolution coverage",
      expectedBehavior:
        "Runtime QA confirms FREE, PREMIUM, and PROFESSIONAL resolution paths.",
      catalog: runtime,
      requiredCaseIds: [
        "highest_tier_resolves",
        "free_tier_capability_blocks",
        "active_premium_allows_preflight",
      ],
    }),
    expectRequiredCases({
      caseId: "capability_access_coverage",
      area: "contracts",
      title: "Capability access coverage",
      expectedBehavior:
        "Contracts QA confirms denied and allowed capability decisions.",
      catalog: contracts,
      requiredCaseIds: [
        "free_tier_advanced_capability_blocks",
        "missing_entitlement_capability_blocks",
        "premium_capability_allows_preflight",
      ],
    }),
    expectRequiredCases({
      caseId: "usage_limit_coverage",
      area: "contracts",
      title: "Usage-limit coverage",
      expectedBehavior:
        "Contracts and runtime QA preserve missing and exceeded usage-limit checks.",
      catalog: contracts,
      requiredCaseIds: [
        "missing_usage_limit_blocks",
        "usage_limit_exceeded_blocks",
      ],
    }),
    expectRequiredCases({
      caseId: "runtime_usage_limit_coverage",
      area: "runtime",
      title: "Runtime usage-limit coverage",
      expectedBehavior:
        "Runtime QA confirms selected entitlement usage limits are enforced fail-closed.",
      catalog: runtime,
      requiredCaseIds: ["usage_limit_blocks"],
    }),
    expectRequiredCases({
      caseId: "boundary_isolation_coverage",
      area: "boundary",
      title: "Boundary isolation coverage",
      expectedBehavior:
        "Boundary QA confirms routing isolation, payload isolation, propagation, and allowed preflight.",
      catalog: boundary,
      requiredCaseIds: [
        "payload_mismatch_blocks",
        "runtime_block_propagates",
        "allowed_runtime_result_passes",
      ],
    }),
    expectCrossCatalogFailClosedCoverage({ contracts, runtime, boundary }),
    expectCatalogSizes({ contracts, runtime, boundary }),
  ];

  const passed = cases.filter((qaCaseResult) => qaCaseResult.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases,
    catalogs: {
      contracts,
      runtime,
      boundary,
    },
    summary: {
      total: cases.length,
      passed,
      failed,
      catalogCases: {
        contracts: contracts.summary.total,
        runtime: runtime.summary.total,
        boundary: boundary.summary.total,
      },
    },
  };
}
