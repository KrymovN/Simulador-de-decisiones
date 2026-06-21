import {
  runAiQualityBoundaryValidation,
} from "./boundary-validation";
import {
  runAiQualityRuntimeValidation,
} from "./runtime-validation";
import {
  runAiQualityContractsValidation,
} from "./validation";
import type {
  AiQualityBoundaryValidationResult,
  AiQualityRuntimeValidationResult,
  AiQualityValidationResult,
} from "./contracts";

export type AiQualityStage53RegressionArea =
  | "contracts"
  | "runtime"
  | "boundary";

export type AiQualityStage53RegressionCase = {
  caseId: string;
  area: AiQualityStage53RegressionArea;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiQualityStage53RegressionResult = {
  passed: boolean;
  failed: boolean;
  contracts: AiQualityValidationResult;
  runtime: AiQualityRuntimeValidationResult;
  boundary: AiQualityBoundaryValidationResult;
  cases: AiQualityStage53RegressionCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

function caseResult(input: {
  caseId: string;
  area: AiQualityStage53RegressionArea;
  issues: string[];
}): AiQualityStage53RegressionCase {
  return {
    caseId: input.caseId,
    area: input.area,
    passed: input.issues.length === 0,
    failed: input.issues.length > 0,
    issues: input.issues,
  };
}

function issueUnless(condition: boolean, issue: string): string[] {
  return condition ? [] : [issue];
}

function hasCases(
  result:
    | AiQualityValidationResult
    | AiQualityRuntimeValidationResult
    | AiQualityBoundaryValidationResult,
  caseIds: string[],
): boolean {
  const existing = new Set(result.cases.map((item) => item.caseId));

  return caseIds.every((caseId) => existing.has(caseId));
}

export function runAiQualityStage53Regression(): AiQualityStage53RegressionResult {
  const contracts = runAiQualityContractsValidation();
  const runtime = runAiQualityRuntimeValidation();
  const boundary = runAiQualityBoundaryValidation();
  const cases: AiQualityStage53RegressionCase[] = [
    caseResult({
      caseId: "contracts_catalog_passes",
      area: "contracts",
      issues: issueUnless(
        contracts.passed && contracts.summary.failed === 0,
        "AI quality contracts validation catalog should pass.",
      ),
    }),
    caseResult({
      caseId: "contracts_forbidden_modes_covered",
      area: "contracts",
      issues: issueUnless(
        hasCases(contracts, [
          "chat_mode_blocks",
          "answer_engine_mode_blocks",
          "generic_assistant_mode_blocks",
          "model_call_mode_blocks",
          "env_runtime_field_blocks",
          "api_key_runtime_field_blocks",
          "provider_payload_runtime_field_blocks",
        ]),
        "AI quality contracts catalog should cover forbidden modes and payloads.",
      ),
    }),
    caseResult({
      caseId: "runtime_catalog_passes",
      area: "runtime",
      issues: issueUnless(
        runtime.passed && runtime.summary.failed === 0,
        "AI quality runtime validation catalog should pass.",
      ),
    }),
    caseResult({
      caseId: "runtime_forbidden_modes_covered",
      area: "runtime",
      issues: issueUnless(
        hasCases(runtime, [
          "disabled_runtime_blocks",
          "chat_mode_blocks",
          "answer_engine_mode_blocks",
          "generic_assistant_mode_blocks",
          "model_call_mode_blocks",
          "env_runtime_field_blocks",
          "api_key_runtime_field_blocks",
          "provider_payload_runtime_field_blocks",
        ]),
        "AI quality runtime catalog should cover disabled runtime, forbidden modes, and payloads.",
      ),
    }),
    caseResult({
      caseId: "boundary_catalog_passes",
      area: "boundary",
      issues: issueUnless(
        boundary.passed && boundary.summary.failed === 0,
        "AI quality boundary validation catalog should pass.",
      ),
    }),
    caseResult({
      caseId: "boundary_forbidden_modes_covered",
      area: "boundary",
      issues: issueUnless(
        hasCases(boundary, [
          "disabled_boundary_blocks",
          "boundary_chat_mode_blocks",
          "boundary_answer_engine_mode_blocks",
          "boundary_generic_assistant_mode_blocks",
          "boundary_model_call_payload_blocks",
          "boundary_env_field_blocks",
          "boundary_api_key_field_blocks",
          "boundary_provider_payload_blocks",
        ]),
        "AI quality boundary catalog should cover disabled boundary, forbidden modes, and payloads.",
      ),
    }),
  ];
  const passed = cases.filter((item) => item.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    contracts,
    runtime,
    boundary,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed,
    },
  };
}

export const runAIQualityStage53Regression =
  runAiQualityStage53Regression;
