import { runConsentRuntimeFoundationValidation } from "./consent-runtime-validation";
import { runDeletionRuntimeFoundationValidation } from "./deletion-runtime-validation";
import { runExportRuntimeFoundationValidation } from "./export-runtime-validation";
import { runRetentionRuntimeFoundationValidation } from "./retention-runtime-validation";
import { runUserDataControlsRuntimeBoundaryValidation } from "./runtime-boundary-validation";
import type {
  ConsentRuntimeValidationResult,
  DeletionRuntimeValidationResult,
  ExportRuntimeValidationResult,
  RetentionRuntimeValidationResult,
  UserDataControlsRuntimeBoundaryValidationResult,
} from "./contracts";

type QaRegressionArea =
  | "consent"
  | "retention"
  | "export"
  | "deletion"
  | "runtime_boundary"
  | "cross_module";

type ValidationCatalog =
  | ConsentRuntimeValidationResult
  | RetentionRuntimeValidationResult
  | ExportRuntimeValidationResult
  | DeletionRuntimeValidationResult
  | UserDataControlsRuntimeBoundaryValidationResult;

export type UserDataControlsRuntimeQaRegressionCaseResult = {
  caseId: string;
  area: QaRegressionArea;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type UserDataControlsRuntimeQaRegressionResult = {
  passed: boolean;
  failed: boolean;
  cases: UserDataControlsRuntimeQaRegressionCaseResult[];
  catalogs: {
    consent: ConsentRuntimeValidationResult;
    retention: RetentionRuntimeValidationResult;
    export: ExportRuntimeValidationResult;
    deletion: DeletionRuntimeValidationResult;
    runtimeBoundary: UserDataControlsRuntimeBoundaryValidationResult;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    catalogCases: {
      consent: number;
      retention: number;
      export: number;
      deletion: number;
      runtimeBoundary: number;
    };
  };
};

function qaCase(input: {
  caseId: string;
  area: QaRegressionArea;
  title: string;
  expectedBehavior: string;
  issues: string[];
}): UserDataControlsRuntimeQaRegressionCaseResult {
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
  area: Exclude<QaRegressionArea, "cross_module">;
  catalog: ValidationCatalog;
}): UserDataControlsRuntimeQaRegressionCaseResult {
  const failures = failingCaseIds(input.catalog);

  return qaCase({
    caseId: `${input.area}_catalog_passes`,
    area: input.area,
    title: `${input.area} validation catalog passes`,
    expectedBehavior:
      "All deterministic foundation validation cases for this user-data-control module pass.",
    issues:
      input.catalog.passed && failures.length === 0
        ? []
        : [`Failing validation case ids: ${failures.join(", ") || "unknown"}.`],
  });
}

function expectRequiredCases(input: {
  caseId: string;
  area: QaRegressionArea;
  title: string;
  expectedBehavior: string;
  catalog: ValidationCatalog;
  requiredCaseIds: string[];
}): UserDataControlsRuntimeQaRegressionCaseResult {
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
  consent: ConsentRuntimeValidationResult;
  retention: RetentionRuntimeValidationResult;
  export: ExportRuntimeValidationResult;
  deletion: DeletionRuntimeValidationResult;
  runtimeBoundary: UserDataControlsRuntimeBoundaryValidationResult;
}): UserDataControlsRuntimeQaRegressionCaseResult {
  const minimums = {
    consent: 12,
    retention: 13,
    export: 13,
    deletion: 16,
    runtimeBoundary: 11,
  };
  const issues = [
    input.consent.summary.total >= minimums.consent
      ? undefined
      : `Consent catalog below minimum: ${input.consent.summary.total}.`,
    input.retention.summary.total >= minimums.retention
      ? undefined
      : `Retention catalog below minimum: ${input.retention.summary.total}.`,
    input.export.summary.total >= minimums.export
      ? undefined
      : `Export catalog below minimum: ${input.export.summary.total}.`,
    input.deletion.summary.total >= minimums.deletion
      ? undefined
      : `Deletion catalog below minimum: ${input.deletion.summary.total}.`,
    input.runtimeBoundary.summary.total >= minimums.runtimeBoundary
      ? undefined
      : `Runtime boundary catalog below minimum: ${input.runtimeBoundary.summary.total}.`,
  ].filter((issue): issue is string => Boolean(issue));

  return qaCase({
    caseId: "validation_catalog_minimum_coverage",
    area: "cross_module",
    title: "Validation catalogs keep minimum regression breadth",
    expectedBehavior:
      "Stage 4.3G preserves broad deterministic coverage across all user data control modules.",
    issues,
  });
}

function buildRegressionCases(input: {
  consent: ConsentRuntimeValidationResult;
  retention: RetentionRuntimeValidationResult;
  export: ExportRuntimeValidationResult;
  deletion: DeletionRuntimeValidationResult;
  runtimeBoundary: UserDataControlsRuntimeBoundaryValidationResult;
}): UserDataControlsRuntimeQaRegressionCaseResult[] {
  return [
    expectCatalogPassed({ area: "consent", catalog: input.consent }),
    expectCatalogPassed({ area: "retention", catalog: input.retention }),
    expectCatalogPassed({ area: "export", catalog: input.export }),
    expectCatalogPassed({ area: "deletion", catalog: input.deletion }),
    expectCatalogPassed({
      area: "runtime_boundary",
      catalog: input.runtimeBoundary,
    }),
    expectRequiredCases({
      caseId: "fail_closed_runtime_disabled_coverage",
      area: "cross_module",
      title: "Disabled runtimes and boundary fail closed",
      expectedBehavior:
        "Every foundation module and the integration boundary keep disabled-by-default regression coverage.",
      catalog: {
        passed: true,
        failed: false,
        cases: [
          ...input.consent.cases,
          ...input.retention.cases,
          ...input.export.cases,
          ...input.deletion.cases,
          ...input.runtimeBoundary.cases,
        ],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
        },
      },
      requiredCaseIds: [
        "disabled_runtime_blocks",
        "disabled_boundary_blocks",
      ],
    }),
    expectRequiredCases({
      caseId: "consent_regression_required_cases",
      area: "consent",
      title: "Consent runtime covers purpose and owner isolation",
      expectedBehavior:
        "Consent QA covers session denial, client-owner rejection, owner mismatch, out-of-scope purpose, withdrawn/expired consent, and granted consent.",
      catalog: input.consent,
      requiredCaseIds: [
        "signed_out_denied",
        "expired_session_denied",
        "client_owner_injection_denied",
        "owner_mismatch_denied",
        "out_of_scope_purpose_denied",
        "withdrawn_consent_denied",
        "expired_consent_denied",
        "consent_owner_mismatch_denied",
        "required_consent_allowed",
      ],
    }),
    expectRequiredCases({
      caseId: "retention_regression_required_cases",
      area: "retention",
      title: "Retention runtime covers lifecycle and parent isolation",
      expectedBehavior:
        "Retention QA covers session denial, client-owner rejection, resource owner mismatch, unknown rules, parent mismatch, legal hold, and lifecycle outcomes.",
      catalog: input.retention,
      requiredCaseIds: [
        "signed_out_denied",
        "expired_session_denied",
        "client_owner_injection_denied",
        "resource_owner_mismatch_denied",
        "unknown_retention_rule_denied",
        "missing_policy_denied",
        "history_without_parent_denied",
        "history_parent_owner_mismatch_denied",
        "legal_hold_retains_without_action",
      ],
    }),
    expectRequiredCases({
      caseId: "export_regression_required_cases",
      area: "export",
      title: "Export runtime covers owner and forbidden data isolation",
      expectedBehavior:
        "Export QA covers session denial, client-owner rejection, resource owner mismatch, forbidden categories, unsupported categories, scope exclusion, and manifest-only output.",
      catalog: input.export,
      requiredCaseIds: [
        "signed_out_denied",
        "expired_session_denied",
        "client_owner_injection_denied",
        "empty_scope_denied",
        "resource_owner_mismatch_denied",
        "forbidden_data_denied",
        "unsupported_data_category_denied",
        "full_scope_manifest_allowed",
        "scope_exclusion_is_not_packaged",
      ],
    }),
    expectRequiredCases({
      caseId: "deletion_regression_required_cases",
      area: "deletion",
      title: "Deletion runtime covers lifecycle-only planning and blockers",
      expectedBehavior:
        "Deletion QA covers session denial, client-owner rejection, owner mismatch, legal hold, active subscription, parent context, terminal resources, and no hard delete.",
      catalog: input.deletion,
      requiredCaseIds: [
        "signed_out_denied",
        "expired_session_denied",
        "client_owner_injection_denied",
        "empty_scope_denied",
        "resource_owner_mismatch_denied",
        "legal_hold_blocks",
        "active_subscription_blocks_account_deletion",
        "parent_context_required",
        "no_deletable_resources_denied",
        "resource_deletion_plan_allowed",
      ],
    }),
    expectRequiredCases({
      caseId: "runtime_boundary_regression_required_cases",
      area: "runtime_boundary",
      title: "Runtime boundary covers routing and module isolation",
      expectedBehavior:
        "Boundary QA covers unsupported/disallowed operations, missing or mismatched payloads, disabled modules, module-blocked normalization, and all four module routes.",
      catalog: input.runtimeBoundary,
      requiredCaseIds: [
        "unsupported_operation_denied",
        "operation_not_allowed_denied",
        "missing_payload_denied",
        "cross_module_payload_denied",
        "disabled_module_denied",
        "module_blocked_normalized",
        "consent_route_allowed",
        "retention_route_allowed",
        "export_route_allowed",
        "deletion_route_allowed",
      ],
    }),
    expectCatalogSizes(input),
  ];
}

export function runUserDataControlsRuntimeQaRegression(): UserDataControlsRuntimeQaRegressionResult {
  const consent = runConsentRuntimeFoundationValidation();
  const retention = runRetentionRuntimeFoundationValidation();
  const exportValidation = runExportRuntimeFoundationValidation();
  const deletion = runDeletionRuntimeFoundationValidation();
  const runtimeBoundary = runUserDataControlsRuntimeBoundaryValidation();
  const cases = buildRegressionCases({
    consent,
    retention,
    export: exportValidation,
    deletion,
    runtimeBoundary,
  });
  const passed = cases.filter((result) => result.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases,
    catalogs: {
      consent,
      retention,
      export: exportValidation,
      deletion,
      runtimeBoundary,
    },
    summary: {
      total: cases.length,
      passed,
      failed,
      catalogCases: {
        consent: consent.summary.total,
        retention: retention.summary.total,
        export: exportValidation.summary.total,
        deletion: deletion.summary.total,
        runtimeBoundary: runtimeBoundary.summary.total,
      },
    },
  };
}
