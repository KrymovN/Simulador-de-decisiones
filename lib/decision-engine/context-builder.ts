import type {
  Assumption,
  Constraint,
  DecisionContext,
  DecisionInput,
  DecisionIntent,
  DecisionOption,
  DecisionType,
  DecisionVariable,
  EntityId,
  EvidenceRef,
  KnownValue,
  SafetyBoundary,
  Stakeholder,
  TimeHorizon,
} from "./types";

export const DECISION_CONTEXT_BUILDER_VERSION = "0.1.0-deterministic";
export const DECISION_CONTEXT_BUILDER_MAX_INPUT_LENGTH = 1200;

export type DecisionContextBuilderCategory =
  | "career_work"
  | "finance_purchase"
  | "relocation_travel"
  | "relationship_family"
  | "education"
  | "business_project"
  | "health_wellbeing"
  | "legal_administrative"
  | "generic_exploratory";

export type DecisionContextBuilderRequest = {
  requestId: string;
  rawInput: string;
  inputLanguage?: string;
  requestedOutputLanguage?: string;
  userIntent?: DecisionIntent;
};

export type DecisionContextBuilderStatus = "built" | "rejected";

export type DecisionContextBuilderErrorCode =
  | "invalid_request"
  | "input_required"
  | "input_too_long";

export type DecisionContextBuilderError = {
  code: DecisionContextBuilderErrorCode;
  message: string;
  recoverable: boolean;
};

export type DecisionContextBuilderMissingFieldKind =
  | "deadline"
  | "budget"
  | "stakeholders"
  | "constraints"
  | "reversibility"
  | "success_criteria"
  | "risk_tolerance"
  | "feasibility";

export type DecisionContextBuilderMissingField = {
  field: DecisionContextBuilderMissingFieldKind;
  reason: string;
  materiality: "critical" | "important" | "supporting";
  affectedEntityIds: EntityId[];
};

export type DecisionContextBuilderInferenceKind =
  | "intent"
  | "category"
  | "decision_type"
  | "goal"
  | "option"
  | "constraint"
  | "variable"
  | "stakeholder"
  | "time_horizon"
  | "safety";

export type DecisionContextBuilderInference = {
  kind: DecisionContextBuilderInferenceKind;
  value: string;
  reason: string;
  evidenceRefs: EntityId[];
};

export type DecisionContextBuilderClarificationQuestion = {
  id: EntityId;
  field: DecisionContextBuilderMissingFieldKind;
  text: string;
  required: boolean;
  reason: string;
};

export type DecisionContextBuilderIsolationEvidence = {
  deterministicOnly: true;
  modelCallsExecuted: false;
  providerSdkUsed: false;
  environmentRead: false;
  apiKeyRead: false;
  persistenceUsed: false;
  authUsed: false;
  billingUsed: false;
};

export type DecisionContextBuilderResult = {
  status: DecisionContextBuilderStatus;
  builderVersion: typeof DECISION_CONTEXT_BUILDER_VERSION;
  decisionInput?: DecisionInput;
  decisionContext?: DecisionContext;
  safety?: SafetyBoundary;
  safetyContextComplete: boolean;
  category?: DecisionContextBuilderCategory;
  inferred: DecisionContextBuilderInference[];
  missing: DecisionContextBuilderMissingField[];
  clarificationQuestions: DecisionContextBuilderClarificationQuestion[];
  evidence: EvidenceRef[];
  error?: DecisionContextBuilderError;
};

type KeywordRule<T extends string> = {
  value: T;
  keywords: string[];
};

const VALID_INTENTS: DecisionIntent[] = ["explore", "compare", "recommend", "review"];

const CATEGORY_RULES: KeywordRule<DecisionContextBuilderCategory>[] = [
  {
    value: "career_work",
    keywords: ["trabajo", "empleo", "oferta laboral", "jefe", "salario", "career", "job"],
  },
  {
    value: "finance_purchase",
    keywords: ["invertir", "inversion", "dinero", "ahorro", "comprar", "vender", "precio", "presupuesto", "deuda", "finanzas", "coste", "costo"],
  },
  {
    value: "relocation_travel",
    keywords: ["mudanza", "mudar", "relocation", "relocate", "move to", "pais", "ciudad", "viaje", "viajar"],
  },
  {
    value: "relationship_family",
    keywords: ["pareja", "familia", "amigo", "relacion", "hijo", "hija", "madre", "padre"],
  },
  {
    value: "education",
    keywords: ["estudiar", "curso", "universidad", "master", "aprender", "escuela", "education"],
  },
  {
    value: "business_project",
    keywords: ["lanzar", "producto", "cliente", "negocio", "proyecto", "startup", "empresa"],
  },
  {
    value: "health_wellbeing",
    keywords: ["salud", "medico", "tratamiento", "ansiedad", "depresion", "bienestar", "terapia"],
  },
  {
    value: "legal_administrative",
    keywords: ["contrato", "demanda", "abogado", "legal", "visado", "impuestos", "administrativo"],
  },
];

const STAKEHOLDER_RULES: KeywordRule<string>[] = [
  { value: "family", keywords: ["familia", "madre", "padre", "hijo", "hija"] },
  { value: "partner", keywords: ["pareja", "esposo", "esposa"] },
  { value: "team", keywords: ["equipo", "companeros", "empleados"] },
  { value: "client", keywords: ["cliente", "clientes"] },
  { value: "manager", keywords: ["jefe", "manager"] },
  { value: "business_partner", keywords: ["socio", "socios"] },
];

function known<T>(value: T, evidenceRefs: EntityId[]): KnownValue<T> {
  return { status: "known", value, evidenceRefs };
}

function unknown<T>(reason: string): KnownValue<T> {
  return { status: "unknown", reason };
}

function normalizeText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeForMatching(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function safeId(value: string, fallback: string): string {
  const normalized = normalizeForMatching(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized.slice(0, 64) || fallback;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value;
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function addUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function validIntent(value: unknown): value is DecisionIntent {
  return typeof value === "string" && VALID_INTENTS.includes(value as DecisionIntent);
}

function makeRejectedResult(error: DecisionContextBuilderError): DecisionContextBuilderResult {
  return {
    status: "rejected",
    builderVersion: DECISION_CONTEXT_BUILDER_VERSION,
    safetyContextComplete: false,
    inferred: [],
    missing: [],
    clarificationQuestions: [],
    evidence: [],
    error,
  };
}

function detectIntent(text: string, suppliedIntent?: DecisionIntent): { intent: DecisionIntent; reason: string } {
  if (validIntent(suppliedIntent)) {
    return { intent: suppliedIntent, reason: "Caller supplied a valid DecisionIntent." };
  }

  if (/\b(vs|versus|comparar|compare|entre)\b/.test(text) || /\s(o|or)\s/.test(text)) {
    return { intent: "compare", reason: "The input contains comparison markers." };
  }

  if (/\b(revisar|review|validar|ya decidi|ya tome|decidi|decision tomada)\b/.test(text)) {
    return { intent: "review", reason: "The input asks to review an existing or tentative decision." };
  }

  if (/\b(explorar|explore|escenarios|riesgos|analizar|que pasaria|what if)\b/.test(text)) {
    return { intent: "explore", reason: "The input asks for exploration or scenario analysis." };
  }

  if (/\b(deberia|conviene|recomienda|que hago|decidir si|should|recommend)\b/.test(text)) {
    return { intent: "recommend", reason: "The input asks for decision support." };
  }

  return { intent: "explore", reason: "No explicit intent marker was found; defaulting to exploratory simulation." };
}

function detectCategory(text: string): { category: DecisionContextBuilderCategory; reason: string } {
  for (const rule of CATEGORY_RULES) {
    if (includesAny(text, rule.keywords)) {
      return { category: rule.value, reason: `Matched category keyword for ${rule.value}.` };
    }
  }

  return {
    category: "generic_exploratory",
    reason: "No supported category keyword was found.",
  };
}

function extractTimeMarker(text: string): string | undefined {
  const match = text.match(
    /\b(hoy|manana|esta semana|proxima semana|este mes|proximo mes|deadline|fecha limite|antes de [^,.!?;]+|en \d+ (dias|semanas|meses|anos)|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/,
  );

  return match?.[0];
}

function extractExplicitOptions(input: string): string[] {
  const normalized = normalizeText(input);
  const betweenMatch = normalized.match(/\bentre\s+(.{2,90}?)\s+y\s+(.{2,90})(?:[.?!,;]|$)/i);

  if (betweenMatch) {
    return [betweenMatch[1], betweenMatch[2]].map((part) => truncate(normalizeText(part), 90));
  }

  const parts = normalized
    .split(/\s+(?:vs|versus|or|o)\s+/i)
    .map((part) => part.replace(/^[,;:?.!\s]+|[,;:?.!\s]+$/g, ""))
    .filter((part) => part.length >= 3);

  return parts.length > 1 ? parts.slice(0, 4).map((part) => truncate(part, 90)) : [];
}

function detectSafety(text: string): { safety: SafetyBoundary; complete: boolean; reasonEvidence: string } {
  if (/\b(suicidio|suicidarme|matarme|self harm|kill myself)\b/.test(text)) {
    return {
      complete: false,
      reasonEvidence: "Detected self-harm language.",
      safety: {
        domain: "self_harm",
        level: "refuse",
        recommendationAllowed: false,
        requiredNotices: ["Self-harm language requires crisis-oriented support outside the decision simulator."],
        requiredEscalations: ["Encourage immediate local emergency or crisis support."],
        prohibitedOutputs: ["Do not provide instructions, optimization, or decision recommendations."],
        rationale: "The deterministic builder classified the request as self-harm related.",
      },
    };
  }

  if (/\b(matar|herir|arma|violencia|hacer dano|kill|hurt someone)\b/.test(text)) {
    return {
      complete: false,
      reasonEvidence: "Detected violence language.",
      safety: {
        domain: "violence",
        level: "refuse",
        recommendationAllowed: false,
        requiredNotices: ["Violence-related requests are outside the decision simulator boundary."],
        requiredEscalations: [],
        prohibitedOutputs: ["Do not assist with violence or harmful action planning."],
        rationale: "The deterministic builder classified the request as violence related.",
      },
    };
  }

  if (/\b(robar|fraude|evadir impuestos|hackear|estafa|illegal activity)\b/.test(text)) {
    return {
      complete: false,
      reasonEvidence: "Detected illegal-activity language.",
      safety: {
        domain: "illegal_activity",
        level: "refuse",
        recommendationAllowed: false,
        requiredNotices: ["Illegal activity is outside the supported simulation boundary."],
        requiredEscalations: [],
        prohibitedOutputs: ["Do not assist with illegal planning or evasion."],
        rationale: "The deterministic builder classified the request as illegal activity.",
      },
    };
  }

  if (/\b(tratamiento|medicamento|diagnostico|cirugia|diagnosis|medication)\b/.test(text)) {
    return highStakeSafety("medical", "restricted", "Detected medical treatment or diagnosis language.");
  }

  if (/\b(demanda|juicio|abogado|lawsuit|court case)\b/.test(text)) {
    return highStakeSafety("legal", "restricted", "Detected legal proceeding language.");
  }

  if (/\b(invertir todos|todos mis ahorros|hipoteca|quiebra|bankruptcy|large debt)\b/.test(text)) {
    return highStakeSafety("financial", "restricted", "Detected high-stakes financial language.");
  }

  if (/\b(salud|medico|ansiedad|depresion|terapia|bienestar)\b/.test(text)) {
    return highStakeSafety("medical", "elevated", "Detected health or wellbeing language.");
  }

  if (/\b(contrato|legal|visado|impuestos|administrativo)\b/.test(text)) {
    return highStakeSafety("legal", "elevated", "Detected legal or administrative language.");
  }

  if (/\b(invertir|inversion|deuda|prestamo|loan)\b/.test(text)) {
    return highStakeSafety("financial", "elevated", "Detected financial advisory language.");
  }

  return {
    complete: true,
    reasonEvidence: "No supported high-stakes safety marker was detected.",
    safety: {
      domain: "general",
      level: "standard",
      recommendationAllowed: true,
      requiredNotices: [],
      requiredEscalations: [],
      prohibitedOutputs: [],
      rationale: "The deterministic builder found no explicit high-stakes safety marker.",
    },
  };
}

function highStakeSafety(
  domain: Extract<SafetyBoundary["domain"], "medical" | "legal" | "financial">,
  level: Extract<SafetyBoundary["level"], "elevated" | "restricted">,
  reasonEvidence: string,
): { safety: SafetyBoundary; complete: boolean; reasonEvidence: string } {
  return {
    complete: false,
    reasonEvidence,
    safety: {
      domain,
      level,
      recommendationAllowed: level === "elevated",
      requiredNotices: ["This request may require qualified professional review."],
      requiredEscalations: level === "restricted" ? ["Do not provide a final recommendation without professional context."] : [],
      prohibitedOutputs: level === "restricted" ? ["Do not provide prescriptive professional advice."] : [],
      rationale: `The deterministic builder classified the request as ${domain}/${level}.`,
    },
  };
}

function detectDecisionTypes(
  intent: DecisionIntent,
  category: DecisionContextBuilderCategory,
  explicitOptions: string[],
  timeMarker: string | undefined,
  safety: SafetyBoundary,
): DecisionType[] {
  const types: DecisionType[] = [];

  if (intent === "compare" || explicitOptions.length > 1) addUnique(types, "comparative");
  if (timeMarker) addUnique(types, "timing");
  if (category === "finance_purchase" || category === "business_project") addUnique(types, "resource_allocation");
  if (category === "relationship_family") addUnique(types, "interpersonal");
  if (safety.domain !== "general") addUnique(types, "risk_response");
  if (intent === "explore" || category === "generic_exploratory") addUnique(types, "exploratory");

  if (types.length === 0) {
    addUnique(types, "strategic_direction");
  }

  return types;
}

function detectRiskTolerance(text: string): DecisionInput["preferences"] | undefined {
  if (/\b(riesgo bajo|low risk|conservador)\b/.test(text)) {
    return { riskTolerance: "low" };
  }

  if (/\b(riesgo alto|high risk|agresivo)\b/.test(text)) {
    return { riskTolerance: "high" };
  }

  if (/\b(riesgo moderado|moderate risk|balanceado)\b/.test(text)) {
    return { riskTolerance: "moderate" };
  }

  return undefined;
}

function extractMoney(text: string): { raw: string; numericValue?: number } | undefined {
  const match = text.match(/(?:€|\$)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:eur|euros|usd|dolares|dollars|€|\$)/i);

  if (!match) {
    return undefined;
  }

  const numeric = Number(match[0].replace(",", ".").replace(/[^0-9.]/g, ""));
  return { raw: match[0], numericValue: Number.isFinite(numeric) ? numeric : undefined };
}

function constraintKind(description: string): Constraint["kind"] {
  if (/\b(presupuesto|precio|dinero|budget|cost|coste|costo)\b/.test(description)) return "financial";
  if (/\b(deadline|fecha|semana|mes|dia|tiempo)\b/.test(description)) return "time";
  if (/\b(legal|contrato|visado|impuestos)\b/.test(description)) return "legal";
  if (/\b(salud|medico|terapia)\b/.test(description)) return "health";
  if (/\b(familia|pareja|cliente|equipo)\b/.test(description)) return "relationship";
  if (/\b(recurso|capacidad|equipo)\b/.test(description)) return "resource";
  if (/\b(etico|ethical)\b/.test(description)) return "ethical";
  return "other";
}

function constraintSeverity(description: string): Constraint["severity"] {
  if (/\b(no puedo|no podemos|cannot|can't|prohibido|sin)\b/.test(description)) return "blocking";
  if (/\b(debo|tenemos que|tengo que|must|required|obligatorio)\b/.test(description)) return "material";
  return "preference";
}

function extractConstraints(text: string): string[] {
  const matches = text.match(/\b(?:sin|menos de|no puedo|no podemos|debo|tenemos que|tengo que|must|cannot|can't|without|under|required|obligatorio)\b[^,.!?;]*/g);
  return (matches ?? []).map((match) => truncate(normalizeText(match), 120)).slice(0, 4);
}

function buildClarificationQuestions(
  missing: DecisionContextBuilderMissingField[],
  safety: SafetyBoundary | undefined,
): DecisionContextBuilderClarificationQuestion[] {
  const questions: DecisionContextBuilderClarificationQuestion[] = [];
  const importantMissing = missing.filter((field) => field.materiality !== "supporting").slice(0, 5);

  for (const field of importantMissing) {
    questions.push({
      id: `builder_question_${field.field}`,
      field: field.field,
      text: questionText(field.field, safety),
      required: field.materiality === "critical",
      reason: field.reason,
    });
  }

  return questions;
}

function questionText(field: DecisionContextBuilderMissingFieldKind, safety: SafetyBoundary | undefined): string {
  if (field === "deadline") return "What deadline or decision window should the simulation use?";
  if (field === "budget") return "What budget or financial limit is explicitly available for this decision?";
  if (field === "stakeholders") return "Who is materially affected by this decision?";
  if (field === "constraints") return "What constraints are non-negotiable for this decision?";
  if (field === "reversibility") return "How reversible is the decision if the outcome is unfavorable?";
  if (field === "success_criteria") return "What outcome would make this decision successful?";
  if (field === "risk_tolerance") return "What level of risk tolerance should be assumed?";
  if (safety?.level === "restricted") return "What qualified professional context is available for this request?";
  return "What information is needed to assess feasibility?";
}

export function decisionContextBuilderIsolationEvidence(): DecisionContextBuilderIsolationEvidence {
  return {
    deterministicOnly: true,
    modelCallsExecuted: false,
    providerSdkUsed: false,
    environmentRead: false,
    apiKeyRead: false,
    persistenceUsed: false,
    authUsed: false,
    billingUsed: false,
  };
}

export function buildDecisionContext(request: DecisionContextBuilderRequest): DecisionContextBuilderResult {
  if (!request || typeof request !== "object") {
    return makeRejectedResult({
      code: "invalid_request",
      message: "DecisionContext Builder requires a request object.",
      recoverable: false,
    });
  }

  if (typeof request.rawInput !== "string") {
    return makeRejectedResult({
      code: "input_required",
      message: "DecisionContext Builder requires rawInput as a string.",
      recoverable: true,
    });
  }

  const originalText = normalizeText(request.rawInput);

  if (!originalText) {
    return makeRejectedResult({
      code: "input_required",
      message: "DecisionContext Builder requires non-empty raw input.",
      recoverable: true,
    });
  }

  if (originalText.length > DECISION_CONTEXT_BUILDER_MAX_INPUT_LENGTH) {
    return makeRejectedResult({
      code: "input_too_long",
      message: `DecisionContext Builder input exceeds ${DECISION_CONTEXT_BUILDER_MAX_INPUT_LENGTH} characters.`,
      recoverable: true,
    });
  }

  const requestId = normalizeText(request.requestId || `builder_request_${safeId(originalText, "input")}`);
  const matchText = normalizeForMatching(originalText);
  const evidence: EvidenceRef[] = [];
  const inferred: DecisionContextBuilderInference[] = [];
  const missing: DecisionContextBuilderMissingField[] = [];

  function addEvidence(
    kind: string,
    source: EvidenceRef["source"],
    claim: string,
    reliability: EvidenceRef["reliability"],
    userConfirmed: boolean,
  ): EntityId {
    const id = `builder_evidence_${evidence.length + 1}_${safeId(kind, "item")}`;
    evidence.push({ id, source, claim, reliability, userConfirmed });
    return id;
  }

  function addInference(
    kind: DecisionContextBuilderInferenceKind,
    value: string,
    reason: string,
    evidenceRefs: EntityId[],
  ): void {
    inferred.push({ kind, value, reason, evidenceRefs });
  }

  function addMissing(
    field: DecisionContextBuilderMissingFieldKind,
    reason: string,
    materiality: DecisionContextBuilderMissingField["materiality"],
    affectedEntityIds: EntityId[] = [],
  ): void {
    if (!missing.some((candidate) => candidate.field === field)) {
      missing.push({ field, reason, materiality, affectedEntityIds });
    }
  }

  const rawEvidenceId = addEvidence(
    "raw_user_statement",
    "user_statement",
    originalText,
    "medium",
    true,
  );
  const intentDetection = detectIntent(matchText, request.userIntent);
  const categoryDetection = detectCategory(matchText);
  const explicitOptions = extractExplicitOptions(originalText);
  const timeMarker = extractTimeMarker(matchText);
  const safetyDetection = detectSafety(matchText);
  const decisionTypes = detectDecisionTypes(
    intentDetection.intent,
    categoryDetection.category,
    explicitOptions,
    timeMarker,
    safetyDetection.safety,
  );
  const preferences = detectRiskTolerance(matchText);
  const categoryEvidenceId = addEvidence(
    "category",
    "engine_inference",
    `Detected category: ${categoryDetection.category}.`,
    "low",
    false,
  );
  const intentEvidenceId = addEvidence(
    "intent",
    "engine_inference",
    `Detected intent: ${intentDetection.intent}.`,
    "low",
    false,
  );
  const safetyEvidenceId = addEvidence(
    "safety",
    "engine_inference",
    safetyDetection.reasonEvidence,
    safetyDetection.safety.level === "standard" ? "medium" : "low",
    false,
  );

  addInference("category", categoryDetection.category, categoryDetection.reason, [categoryEvidenceId, rawEvidenceId]);
  addInference("intent", intentDetection.intent, intentDetection.reason, [intentEvidenceId, rawEvidenceId]);
  addInference("safety", `${safetyDetection.safety.domain}/${safetyDetection.safety.level}`, safetyDetection.reasonEvidence, [
    safetyEvidenceId,
    rawEvidenceId,
  ]);

  for (const decisionType of decisionTypes) {
    addInference("decision_type", decisionType, "Mapped deterministic intent/category/time/safety signals to DecisionType.", [
      categoryEvidenceId,
      intentEvidenceId,
    ]);
  }

  const goal: DecisionContext["goals"][number] = {
    id: "goal_primary",
    description: `Evaluate decision: ${truncate(originalText, 160)}`,
    priority: "primary",
    successCriteria: unknown("The user did not provide explicit success criteria."),
    evidenceRefs: [rawEvidenceId],
  };
  addInference("goal", goal.description, "Derived a primary evaluation goal from the raw user statement.", [rawEvidenceId]);
  addMissing("success_criteria", "The user did not state measurable success criteria.", "important", [goal.id]);

  const options: DecisionOption[] = [];

  if (explicitOptions.length > 1) {
    explicitOptions.forEach((label, index) => {
      const optionEvidenceId = addEvidence(
        `explicit_option_${index + 1}`,
        "user_statement",
        `Explicit option: ${label}`,
        "medium",
        true,
      );
      const option: DecisionOption = {
        id: `option_explicit_${index + 1}`,
        label,
        description: `User-supplied option ${index + 1}.`,
        type: "action",
        userProposed: true,
        feasible: unknown("Feasibility was not explicitly stated."),
        evidenceRefs: [optionEvidenceId],
      };
      options.push(option);
      addInference("option", option.label, "Extracted an explicit user option from comparison wording.", [optionEvidenceId]);
    });
  } else {
    const proposedOption: DecisionOption = {
      id: "option_proposed_action",
      label: truncate(originalText, 90),
      description: "The action implied by the user statement.",
      type: "action",
      userProposed: true,
      feasible: unknown("Feasibility was not explicitly stated."),
      evidenceRefs: [rawEvidenceId],
    };
    const delayOption: DecisionOption = {
      id: "option_delay_gather_information",
      label: "Delay and gather more information",
      description: "Postpone the decision while reducing missing context.",
      type: "information_gathering",
      userProposed: false,
      feasible: unknown("Feasibility was not explicitly stated."),
      evidenceRefs: [rawEvidenceId],
    };
    const noActionOption: DecisionOption = {
      id: "option_maintain_current_state",
      label: "Maintain current state for now",
      description: "Do not take the proposed action yet.",
      type: "no_action",
      userProposed: false,
      feasible: unknown("Feasibility was not explicitly stated."),
      evidenceRefs: [rawEvidenceId],
    };

    options.push(proposedOption, delayOption, noActionOption);
    addInference("option", proposedOption.label, "Created the proposed-action option from the raw user statement.", [rawEvidenceId]);
    addInference("option", delayOption.label, "Added the standard delay/information option.", [rawEvidenceId]);
    addInference("option", noActionOption.label, "Added the standard maintain-current-state option.", [rawEvidenceId]);
  }

  addMissing(
    "feasibility",
    "Option feasibility was not explicitly supplied and must not be guessed.",
    "important",
    options.map((option) => option.id),
  );

  const constraintDescriptions = extractConstraints(matchText);
  const constraints: Constraint[] = constraintDescriptions.map((description, index) => {
    const constraintEvidenceId = addEvidence(
      `explicit_constraint_${index + 1}`,
      "user_statement",
      `Explicit constraint: ${description}`,
      "medium",
      true,
    );
    const constraint: Constraint = {
      id: `constraint_explicit_${index + 1}`,
      description,
      kind: constraintKind(description),
      severity: constraintSeverity(description),
      appliesToOptionIds: [],
      evidenceRefs: [constraintEvidenceId],
    };
    addInference("constraint", constraint.description, "Extracted an explicit constraint marker.", [constraintEvidenceId]);
    return constraint;
  });

  if (constraints.length === 0) {
    addMissing("constraints", "The user did not provide explicit decision constraints.", "important");
  }

  const variables: DecisionVariable[] = [];
  const money = extractMoney(originalText);

  if (money) {
    const budgetEvidenceId = addEvidence(
      "budget",
      "user_statement",
      `Explicit budget or monetary value: ${money.raw}`,
      "medium",
      true,
    );
    variables.push({
      id: "variable_budget",
      name: "Budget",
      description: "Explicit monetary value supplied by the user.",
      value: known(money.numericValue ?? money.raw, [budgetEvidenceId]),
      materiality: "important",
      volatility: "changeable",
      affectedOptionIds: options.map((option) => option.id),
    });
    addInference("variable", "Budget", "Extracted an explicit monetary value.", [budgetEvidenceId]);
  } else {
    addMissing("budget", "No explicit budget or monetary boundary was supplied.", categoryDetection.category === "finance_purchase" ? "important" : "supporting");

    if (categoryDetection.category === "finance_purchase" || categoryDetection.category === "business_project") {
      variables.push({
        id: "variable_budget",
        name: "Budget",
        description: "Budget is material for this category but was not supplied.",
        value: unknown("No explicit budget or monetary boundary was supplied."),
        materiality: "important",
        volatility: "unknown",
        affectedOptionIds: options.map((option) => option.id),
      });
    }
  }

  if (preferences?.riskTolerance) {
    const riskEvidenceId = addEvidence(
      "risk_tolerance",
      "user_statement",
      `Explicit risk tolerance: ${preferences.riskTolerance}`,
      "medium",
      true,
    );
    variables.push({
      id: "variable_risk_tolerance",
      name: "Risk tolerance",
      description: "Risk tolerance explicitly supplied by the user.",
      value: known(preferences.riskTolerance, [riskEvidenceId]),
      materiality: "important",
      volatility: "stable",
      affectedOptionIds: options.map((option) => option.id),
    });
    addInference("variable", "Risk tolerance", "Extracted explicit risk tolerance wording.", [riskEvidenceId]);
  } else {
    addMissing("risk_tolerance", "The user did not state risk tolerance.", "supporting");
  }

  if (/\b(reversible|irreversible|no hay vuelta|volver atras|cancelar)\b/.test(matchText)) {
    const reversibilityEvidenceId = addEvidence(
      "reversibility",
      "user_statement",
      "Explicit reversibility marker was supplied.",
      "medium",
      true,
    );
    variables.push({
      id: "variable_reversibility",
      name: "Reversibility",
      description: "The user supplied reversibility language.",
      value: known("explicitly_mentioned", [reversibilityEvidenceId]),
      materiality: "important",
      volatility: "stable",
      affectedOptionIds: options.map((option) => option.id),
    });
    addInference("variable", "Reversibility", "Detected explicit reversibility wording.", [reversibilityEvidenceId]);
  } else {
    addMissing("reversibility", "The user did not state whether the decision is reversible.", "important");
  }

  const stakeholders: Stakeholder[] = [];

  for (const rule of STAKEHOLDER_RULES) {
    if (includesAny(matchText, rule.keywords)) {
      const stakeholderEvidenceId = addEvidence(
        `stakeholder_${rule.value}`,
        "user_statement",
        `Explicit stakeholder marker: ${rule.value}`,
        "medium",
        true,
      );
      stakeholders.push({
        id: `stakeholder_${rule.value}`,
        role: rule.value,
        interests: unknown("Stakeholder interests were not explicitly stated."),
        influence: "unknown",
        impactExposure: "unknown",
        evidenceRefs: [stakeholderEvidenceId],
      });
      addInference("stakeholder", rule.value, "Detected a stakeholder keyword.", [stakeholderEvidenceId]);
    }
  }

  if (stakeholders.length === 0) {
    addMissing("stakeholders", "No explicit affected stakeholder was supplied.", "important");
  }

  const timeHorizon: TimeHorizon = {
    decisionDeadline: timeMarker ? known(timeMarker, [rawEvidenceId]) : unknown("No explicit deadline was supplied."),
    shortTermWindow: unknown("No explicit short-term window was supplied."),
    longTermWindow: unknown("No explicit long-term window was supplied."),
    delayCost: unknown("No explicit delay cost was supplied."),
    reversibilityWindow: unknown("No explicit reversibility window was supplied."),
  };

  if (timeMarker) {
    const timeEvidenceId = addEvidence(
      "time_marker",
      "user_statement",
      `Explicit time marker: ${timeMarker}`,
      "medium",
      true,
    );
    timeHorizon.decisionDeadline = known(timeMarker, [timeEvidenceId]);
    addInference("time_horizon", timeMarker, "Extracted an explicit time marker.", [timeEvidenceId]);
  } else {
    addMissing("deadline", "No explicit deadline or decision window was supplied.", "important");
  }

  const assumption: Assumption = {
    id: "assumption_input_only",
    statement: "Only the supplied user statement is available; unstated conditions remain unknown.",
    source: "engine",
    materiality: "important",
    validationStatus: "unvalidated",
    affectedEntityIds: [goal.id, ...options.map((option) => option.id)],
    evidenceRefs: [rawEvidenceId],
  };

  const decisionInput: DecisionInput = {
    contractVersion: "2.0",
    requestId,
    input: {
      originalText,
      inputLanguage: request.inputLanguage ?? "und",
      requestedOutputLanguage: request.requestedOutputLanguage ?? request.inputLanguage ?? "und",
    },
    userIntent: intentDetection.intent,
    suppliedContext: evidence,
    ...(explicitOptions.length > 1 ? { suppliedOptions: options } : {}),
    ...(preferences ? { preferences } : {}),
  };

  const decisionContext: DecisionContext = {
    decisionId: `decision_${safeId(requestId, "request")}`,
    decisionTypes,
    statement: originalText,
    goals: [goal],
    options,
    constraints,
    variables,
    stakeholders,
    timeHorizon,
    assumptions: [assumption],
    evidence,
  };

  return {
    status: "built",
    builderVersion: DECISION_CONTEXT_BUILDER_VERSION,
    decisionInput,
    decisionContext,
    safety: safetyDetection.safety,
    safetyContextComplete: safetyDetection.complete,
    category: categoryDetection.category,
    inferred,
    missing,
    clarificationQuestions: buildClarificationQuestions(missing, safetyDetection.safety),
    evidence,
  };
}
