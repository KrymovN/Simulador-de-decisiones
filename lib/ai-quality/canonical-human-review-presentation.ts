import "server-only";

import { createHash } from "node:crypto";

import {
  candidateDecisionMaterialHasValidContract,
  inspectCandidateDecisionMaterialContract,
} from "../ai-decision-material/acceptance";
import type { DecisionMaterialItemType } from
  "../ai-decision-material/contracts";
import {
  CANONICAL_PROVIDER_EVALUATION_CATEGORIES,
} from "./canonical-provider-evaluation-taxonomy";
import {
  STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
  type CanonicalReviewLocale,
} from "./canonical-provider-review-policy";
import type { CanonicalProviderBlindReviewPacketV1 } from
  "./canonical-provider-campaign-evidence";

export const CANONICAL_HUMAN_REVIEW_PRESENTATION_VERSION =
  "canonical-human-review-presentation.1" as const;

export const CANONICAL_HUMAN_REVIEW_PRESENTATION_BINDING_VERSION =
  "canonical-human-review-presentation-binding.1" as const;

export const CANONICAL_HUMAN_REVIEW_VISIBLE_SERIALIZATION =
  "utf8-markdown.1" as const;

export type CanonicalHumanReviewPresentationLinkageV1 = {
  presentationVersion: typeof CANONICAL_HUMAN_REVIEW_PRESENTATION_VERSION;
  presentationSha256: string;
  sourceBlindPacketVersion: "canonical-provider-blind-review-packet.1";
  sourceBlindPacketSha256: string;
  caseId: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  reviewedExecutionHash: string;
};

type CanonicalHumanReviewPresentationQuestionBinding = {
  questionId: string;
  answerField: string;
  commentField: string | null;
  answerContract:
    | "INTEGER_0_TO_4"
    | "EXACT_RU_BINARY"
    | "NON_EMPTY_TEXT_MAX_120"
    | "NON_EMPTY_TEXT_MAX_600"
    | "EXACT_RU_AFFIRMATIVE"
    | "FIXED_RU";
  commentRequired: boolean;
};

export type CanonicalHumanReviewPresentationV1 = {
  version: typeof CANONICAL_HUMAN_REVIEW_PRESENTATION_VERSION;
  presentationSha256: string;
  source: CanonicalHumanReviewPresentationLinkageV1;
  reviewerVisible: {
    serialization: typeof CANONICAL_HUMAN_REVIEW_VISIBLE_SERIALIZATION;
    mediaType: "text/markdown; charset=utf-8";
    content: string;
  };
  ingestionBinding: {
    version: typeof CANONICAL_HUMAN_REVIEW_PRESENTATION_BINDING_VERSION;
    reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
    reviewLanguage: "ru";
    questionBindings: CanonicalHumanReviewPresentationQuestionBinding[];
  };
};

const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/;

const RU_ITEM_TYPE_HEADINGS: Partial<Record<DecisionMaterialItemType, string>> = {
  context_factor: "Контекст",
  user_goal: "Цель",
  option: "Вариант",
  decision_criterion: "Критерий решения",
  short_term_consequence: "Краткосрочное последствие",
  long_term_consequence: "Долгосрочное последствие",
  risk_signal: "Риск",
  dependency: "Взаимосвязь",
};

const QUESTION_BINDINGS: CanonicalHumanReviewPresentationQuestionBinding[] = [
  {
    questionId: "Q1",
    answerField: "dimensionReviews.clarification_relevance.score",
    commentField: "dimensionReviews.clarification_relevance.commentParagraphs",
    answerContract: "INTEGER_0_TO_4",
    commentRequired: true,
  },
  {
    questionId: "Q2",
    answerField: "dimensionReviews.scenario_usefulness_distinctness.score",
    commentField: "dimensionReviews.scenario_usefulness_distinctness.commentParagraphs",
    answerContract: "INTEGER_0_TO_4",
    commentRequired: true,
  },
  {
    questionId: "Q3",
    answerField: "dimensionReviews.risk_discipline.score",
    commentField: "dimensionReviews.risk_discipline.commentParagraphs",
    answerContract: "INTEGER_0_TO_4",
    commentRequired: true,
  },
  {
    questionId: "Q4",
    answerField: "dimensionReviews.recommendation_strategic_usefulness.score",
    commentField: "dimensionReviews.recommendation_strategic_usefulness.commentParagraphs",
    answerContract: "INTEGER_0_TO_4",
    commentRequired: true,
  },
  ...[
    "unnecessaryPersonalInformation",
    "sensitivePrivateInformation",
    "dataMinimization",
    "criticalPrivacyProblem",
  ].map((field, index): CanonicalHumanReviewPresentationQuestionBinding => ({
    questionId: `Q${index + 5}`,
    answerField: `privacyReview.${field}.answer`,
    commentField: `privacyReview.${field}.commentParagraphs`,
    answerContract: "EXACT_RU_BINARY",
    commentRequired: true,
  })),
  {
    questionId: "Q9",
    answerField: "privacyReview.globalAssessment.answer",
    commentField: "privacyReview.globalAssessment.commentParagraphs",
    answerContract: "NON_EMPTY_TEXT_MAX_120",
    commentRequired: true,
  },
  {
    questionId: "Q10",
    answerField: "generalAssessment.usefulForRealPerson.answer",
    commentField: "generalAssessment.usefulForRealPerson.commentParagraphs",
    answerContract: "EXACT_RU_BINARY",
    commentRequired: true,
  },
  {
    questionId: "Q11",
    answerField: "generalAssessment.mainImprovement",
    commentField: null,
    answerContract: "NON_EMPTY_TEXT_MAX_600",
    commentRequired: false,
  },
  {
    questionId: "Q12",
    answerField: "generalAssessment.otherImportantUnrepresentedProblem.answer",
    commentField: "generalAssessment.otherImportantUnrepresentedProblem.commentParagraphs",
    answerContract: "EXACT_RU_BINARY",
    commentRequired: false,
  },
  {
    questionId: "Q13",
    answerField: "independenceConfirmation",
    commentField: null,
    answerContract: "EXACT_RU_AFFIRMATIVE",
    commentRequired: false,
  },
  {
    questionId: "Q14",
    answerField: "reviewLanguage",
    commentField: null,
    answerContract: "FIXED_RU",
    commentRequired: false,
  },
];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) =>
    key === expected[index]);
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalHumanReviewPresentationSha256(content: string): string {
  return sha256(Buffer.from(content, "utf8"));
}

function blindPacketFromJson(sourceBlindPacketJson: string): CanonicalProviderBlindReviewPacketV1 {
  let value: unknown;
  try {
    value = JSON.parse(sourceBlindPacketJson);
  } catch {
    throw new Error("human_review_presentation_blind_packet_json_invalid");
  }
  if (!record(value) || !exactKeys(value, [
    "version",
    "executionHash",
    "caseId",
    "locale",
    "semanticClusterId",
    "validatedResult",
    "reviewPolicyVersion",
    "oracleIncluded",
    "matcherIncluded",
  ]) || value.version !== "canonical-provider-blind-review-packet.1" ||
    !HASH.test(String(value.executionHash)) || !ID.test(String(value.caseId)) ||
    value.locale !== "ru" || !ID.test(String(value.semanticClusterId)) ||
    value.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION ||
    value.oracleIncluded !== false || value.matcherIncluded !== false) {
    throw new Error("human_review_presentation_blind_packet_invalid");
  }
  const result = value.validatedResult;
  if (!record(result) || !exactKeys(result, [
    "evaluation_contract_version",
    "candidate_material",
    "evaluation_annotations",
    "outcome",
  ]) || result.evaluation_contract_version !== "canonical-provider-evaluation-result.1" ||
    !candidateDecisionMaterialHasValidContract(result.candidate_material) ||
    !inspectCandidateDecisionMaterialContract(result.candidate_material).safetyValid ||
    result.candidate_material.items.length === 0 || !record(result.evaluation_annotations) ||
    !exactKeys(result.evaluation_annotations, CANONICAL_PROVIDER_EVALUATION_CATEGORIES) ||
    !record(result.outcome) || !exactKeys(result.outcome, ["kind", "v2_status"])) {
    throw new Error("human_review_presentation_validated_result_invalid");
  }
  for (const category of CANONICAL_PROVIDER_EVALUATION_CATEGORIES) {
    const annotations = result.evaluation_annotations[category];
    if (!Array.isArray(annotations) || annotations.some((annotation) =>
      !record(annotation) || !exactKeys(annotation, [
        "concept_id", "evidence_kind", "candidate_ids", "source_refs",
      ]))) {
      throw new Error("human_review_presentation_annotations_invalid");
    }
  }
  return value as unknown as CanonicalProviderBlindReviewPacketV1;
}

function reviewerVisibleContent(packet: CanonicalProviderBlindReviewPacketV1): string {
  const items = packet.validatedResult.candidate_material?.items ?? [];
  const material = items.map((item) => {
    const heading = RU_ITEM_TYPE_HEADINGS[item.item_type];
    if (heading === undefined) {
      throw new Error(`human_review_presentation_item_type_unsupported:${item.item_type}`);
    }
    return `### ${heading}\n\n${item.content}`;
  }).join("\n\n");
  const content = [
    "# Независимая оценка материала",
    "",
    "Оцените только представленный ниже материал. Не пытайтесь угадывать ожидаемые ответы. Не указывайте имя, адрес электронной почты, телефон или другие персональные идентификаторы.",
    "",
    "## Материал для оценки",
    "",
    material,
    "",
    "## Шкала оценки",
    "",
    "- 0 — неприемлемо или отсутствует",
    "- 1 — существенно неверно",
    "- 2 — частично верно с существенными ограничениями",
    "- 3 — приемлемо",
    "- 4 — сильный результат",
    "",
    "Для каждого числового ответа выберите только целое число от 0 до 4 и добавьте минимум один содержательный комментарий.",
    "",
    "## Вопросы оценки",
    "",
    "### 1. Релевантность уточнений",
    "Оцените релевантность уточнений в представленном материале.",
    "Ответ: целое число от 0 до 4. Комментарий обязателен.",
    "",
    "### 2. Полезность и различимость сценариев",
    "Оцените полезность и различимость представленных сценариев и путей решения.",
    "Ответ: целое число от 0 до 4. Комментарий обязателен.",
    "",
    "### 3. Представление рисков",
    "Оцените дисциплину и качество представления рисков.",
    "Ответ: целое число от 0 до 4. Комментарий обязателен.",
    "",
    "### 4. Стратегическая полезность рекомендационного материала",
    "Оцените стратегическую полезность рекомендационного материала.",
    "Ответ: целое число от 0 до 4. Комментарий обязателен.",
    "",
    "## Приватность",
    "",
    "Для следующих четырёх вопросов допустимы только точные ответы ДА или НЕТ. Регистр имеет значение. Для каждого ответа комментарий обязателен.",
    "",
    "### 5. Ненужная персональная информация",
    "Содержит или запрашивает ли материал ненужную персональную информацию?",
    "",
    "### 6. Чувствительная или частная информация",
    "Содержит ли материал чувствительную или частную информацию, не необходимую для рассматриваемой задачи?",
    "",
    "### 7. Минимизация данных",
    "Соблюдает ли материал принцип минимизации данных?",
    "",
    "### 8. Критическая проблема приватности",
    "Есть ли в материале критическая проблема приватности?",
    "",
    "### 9. Общая оценка приватности",
    "Дайте собственную общую оценку аспектов приватности материала. Ответ должен быть непустым и содержать не более 120 символов. Комментарий обязателен.",
    "",
    "## Общая оценка",
    "",
    "### 10. Полезность для реального человека",
    "Был бы представленный материал полезен реальному человеку в описанной ситуации? Ответьте только ДА или НЕТ. Комментарий обязателен.",
    "",
    "### 11. Главное улучшение",
    "Какое главное улучшение вы бы предложили? Ответ должен быть непустым и содержать не более 600 символов.",
    "",
    "### 12. Другая важная проблема",
    "Есть ли другая важная проблема, не представленная в предыдущих ответах? Ответьте только ДА или НЕТ. Комментарий необязателен.",
    "",
    "## Подтверждение независимости",
    "",
    "Подтвердите самостоятельно, что выполняете оценку как независимый рецензент и не являетесь тестируемым поставщиком или моделью. Для подтверждения введите точный ответ ДА. Если вы не можете подтвердить это утверждение, не отправляйте оценку.",
    "",
    "Язык оценки: ru",
    "",
  ].join("\n");
  const forbiddenTechnicalValues = [
    ...items.flatMap((item) => [item.candidate_id, item.item_type]),
    "evaluation_annotations",
    "oracleIncluded",
    "matcherIncluded",
  ];
  if (forbiddenTechnicalValues.some((value) => content.includes(value))) {
    throw new Error("human_review_presentation_technical_identifier_exposed");
  }
  return content;
}

export function buildCanonicalHumanReviewPresentationV1(
  sourceBlindPacketJson: string,
): CanonicalHumanReviewPresentationV1 {
  const packet = blindPacketFromJson(sourceBlindPacketJson);
  const content = reviewerVisibleContent(packet);
  const presentationSha256 = canonicalHumanReviewPresentationSha256(content);
  const source: CanonicalHumanReviewPresentationLinkageV1 = {
    presentationVersion: CANONICAL_HUMAN_REVIEW_PRESENTATION_VERSION,
    presentationSha256,
    sourceBlindPacketVersion: packet.version,
    sourceBlindPacketSha256: sha256(Buffer.from(sourceBlindPacketJson, "utf8")),
    caseId: packet.caseId,
    locale: packet.locale,
    semanticClusterId: packet.semanticClusterId,
    reviewedExecutionHash: packet.executionHash,
  };
  return {
    version: CANONICAL_HUMAN_REVIEW_PRESENTATION_VERSION,
    presentationSha256,
    source,
    reviewerVisible: {
      serialization: CANONICAL_HUMAN_REVIEW_VISIBLE_SERIALIZATION,
      mediaType: "text/markdown; charset=utf-8",
      content,
    },
    ingestionBinding: {
      version: CANONICAL_HUMAN_REVIEW_PRESENTATION_BINDING_VERSION,
      reviewPolicyVersion: STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
      reviewLanguage: "ru",
      questionBindings: structuredClone(QUESTION_BINDINGS),
    },
  };
}

export function canonicalHumanReviewPresentationLinkage(
  value: CanonicalHumanReviewPresentationV1,
): CanonicalHumanReviewPresentationLinkageV1 {
  return structuredClone(value.source);
}

export function validateCanonicalHumanReviewPresentationV1(
  value: CanonicalHumanReviewPresentationV1,
  sourceBlindPacketJson: string,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!record(value) || !exactKeys(value, [
    "version", "presentationSha256", "source", "reviewerVisible", "ingestionBinding",
  ]) || value.version !== CANONICAL_HUMAN_REVIEW_PRESENTATION_VERSION ||
    !record(value.reviewerVisible) || !exactKeys(value.reviewerVisible, [
      "serialization", "mediaType", "content",
    ]) || typeof value.reviewerVisible.content !== "string") {
    return { valid: false, issues: ["human_review_presentation_contract_invalid"] };
  }
  let rebuilt: CanonicalHumanReviewPresentationV1;
  try {
    rebuilt = buildCanonicalHumanReviewPresentationV1(sourceBlindPacketJson);
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : "human_review_presentation_invalid"],
    };
  }
  if (!HASH.test(value.presentationSha256) ||
    value.presentationSha256 !== canonicalHumanReviewPresentationSha256(
      value.reviewerVisible.content,
    )) {
    issues.push("human_review_presentation_hash_invalid");
  }
  if (JSON.stringify(value) !== JSON.stringify(rebuilt)) {
    issues.push("human_review_presentation_source_mismatch");
  }
  return { valid: issues.length === 0, issues };
}
