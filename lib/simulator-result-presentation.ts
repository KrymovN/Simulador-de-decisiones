const TAXONOMY_LABELS: Record<string, string> = {
  decisionDeadline: "Plazo de decisión",
  shortTermWindow: "Impacto a corto plazo",
  longTermWindow: "Impacto a largo plazo",
  delayCost: "Coste de aplazar la decisión",
  reversibilityWindow: "Ventana de reversibilidad",
};

const OUTCOME_CATEGORY_LABELS: Record<string, string> = {
  opportunity: "Oportunidad",
  constraint: "Restricción",
  resource: "Recursos",
  timeline: "Horizonte temporal",
};

const OUTCOME_STATE_LABELS: Record<string, string> = {
  favorable: "Favorable",
  stable: "Estable",
  uncertain: "Incierto",
  adverse: "Desfavorable",
};

const KNOWN_TEXT_LABELS: Record<string, string> = {
  "Delay and gather more information": "posponer y reunir más información",
  "Maintain current state for now": "mantener la situación actual",
  "No explicit deadline was supplied.": "No se ha indicado un plazo de decisión.",
  "No explicit short-term window was supplied.": "No se ha indicado un horizonte a corto plazo.",
  "No explicit long-term window was supplied.": "No se ha indicado un horizonte a largo plazo.",
  "No explicit delay cost was supplied.": "No se ha indicado el coste de aplazar la decisión.",
  "No explicit reversibility window was supplied.":
    "No se ha indicado una ventana de reversibilidad.",
  "The user did not state measurable success criteria.":
    "No se han indicado criterios de éxito medibles.",
  "The user did not provide explicit success criteria.":
    "No se han indicado criterios de éxito explícitos.",
  "The user did not provide explicit decision constraints.":
    "No se han indicado restricciones de decisión explícitas.",
  "No explicit budget or monetary boundary was supplied.":
    "No se ha indicado un presupuesto o límite económico.",
  "The user did not state risk tolerance.": "No se ha indicado la tolerancia al riesgo.",
  "The user did not state whether the decision is reversible.":
    "No se ha indicado si la decisión es reversible.",
  "No explicit affected stakeholder was supplied.":
    "No se han indicado personas afectadas de forma explícita.",
  "No explicit deadline or decision window was supplied.":
    "No se ha indicado un plazo o ventana de decisión.",
  "Feasibility was not explicitly stated.": "No se ha indicado la viabilidad de forma explícita.",
  "Option feasibility was not explicitly supplied and must not be guessed.":
    "No se ha indicado la viabilidad de la opción y no debe darse por supuesta.",
  "Budget is material for this category but was not supplied.":
    "El presupuesto es relevante para esta decisión, pero no se ha indicado.",
  "Explicit monetary value supplied by the user.":
    "Valor monetario indicado en la descripción.",
  "Risk tolerance explicitly supplied by the user.":
    "Tolerancia al riesgo indicada en la descripción.",
  "The user supplied reversibility language.":
    "La descripción incluye información sobre reversibilidad.",
  "Only the supplied user statement is available; unstated conditions remain unknown.":
    "Solo se dispone de la información indicada; las demás condiciones siguen siendo inciertas.",
  family: "Familia",
  partner: "Pareja",
  team: "Equipo",
  client: "Cliente",
  manager: "Responsable",
  business_partner: "Socio o socia",
  "Not supplied.": "No indicado.",
};

const PERSPECTIVE_LABELS: Record<string, string> = {
  optimistic: "Condiciones favorables",
  realistic: "Escenario de referencia",
  pessimistic: "Condiciones adversas",
  Oportunidad: "Condiciones favorables",
  Base: "Escenario de referencia",
  Riesgo: "Condiciones adversas",
};

const PERSPECTIVE_BADGES: Record<string, string> = {
  optimistic: "Perspectiva favorable",
  realistic: "Perspectiva de referencia",
  pessimistic: "Perspectiva adversa",
};

const CANONICAL_TYPE_LABELS: Record<string, string> = {
  favorable: "Favorable",
  base_case: "De referencia",
  adverse: "Adverso",
};

const RENDER_STATE_LABELS: Record<string, string> = {
  ready: "Disponible",
  limited: "Limitado por el contexto",
  clarification: "Necesita más contexto",
  cannot_recommend: "Sin recomendación",
  refused: "No disponible",
};

const SCENARIO_DESCRIPTION_FALLBACKS: Record<string, string> = {
  optimistic:
    "Este escenario muestra cómo podría evolucionar la opción si se cumplen condiciones favorables.",
  realistic:
    "Este escenario sirve como referencia con la información y las condiciones disponibles.",
  pessimistic:
    "Este escenario muestra cómo podría evolucionar la opción si aparecen condiciones adversas.",
  Oportunidad:
    "Este escenario muestra cómo podría evolucionar la opción si se cumplen condiciones favorables.",
  Base:
    "Este escenario sirve como referencia con la información y las condiciones disponibles.",
  Riesgo:
    "Este escenario muestra cómo podría evolucionar la opción si aparecen condiciones adversas.",
};

const INTERNAL_SCENARIO_DESCRIPTION =
  /\bDecision Engine\b|simulaci[oó]n determin[ií]stica|ruta\s+(?:optimistic|realistic|pessimistic)\s+generada|opci[oó]n estructurada por/i;

export const RESULT_PRESENTATION_COPY = {
  eyebrow: "Resultado orientativo",
  heading: "Comparación de escenarios",
  summaryTitle:
    "Esta simulación compara escenarios a partir de la información que has proporcionado.",
  summaryBody:
    "La utilidad del resultado depende del contexto disponible. Revisa los riesgos, las condiciones y los datos que todavía faltan antes de actuar.",
  guidanceTitle: "Utiliza este resultado como apoyo para comparar alternativas.",
  guidanceBody:
    "No es una predicción ni una garantía. Si faltan datos relevantes, contrástalos antes de tomar una decisión.",
} as const;

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .replace(/\.\.\.$/, "")
    .replace(/\s+/g, " ");
}

function startsWithSubmittedInput(optionLabel: string, submittedInput: string): boolean {
  const option = normalize(optionLabel);
  const input = normalize(submittedInput);

  return option.length > 0 && input.length > 0 && (option === input || input.startsWith(option));
}

function capitalize(value: string): string {
  return value ? `${value.charAt(0).toLocaleUpperCase("es")}${value.slice(1)}` : value;
}

export function presentSimulationText(value: string): string {
  const trimmed = value.trim();
  const knownText = KNOWN_TEXT_LABELS[trimmed];

  if (knownText) {
    return knownText;
  }

  const outcome = trimmed.match(/^(opportunity|constraint|resource|timeline):\s*(favorable|stable|uncertain|adverse)$/);

  if (outcome) {
    return `${OUTCOME_CATEGORY_LABELS[outcome[1]]} · ${OUTCOME_STATE_LABELS[outcome[2]]}`;
  }

  return Object.entries(TAXONOMY_LABELS).reduce(
    (presented, [token, label]) => presented.replaceAll(token, label),
    trimmed,
  );
}

export function presentScenarioContextItems(context: string[]): string[] {
  return [...new Set(
    context
      .map(presentSimulationText)
      .filter((item) => item && !INTERNAL_SCENARIO_DESCRIPTION.test(item)),
  )];
}

function presentOptionLabel(optionLabel: string, submittedInput: string): string {
  if (startsWithSubmittedInput(optionLabel, submittedInput)) {
    return "la opción planteada";
  }

  return presentSimulationText(optionLabel);
}

export function presentScenarioTitle({
  optionLabel,
  perspective,
  submittedInput,
}: {
  optionLabel: string;
  perspective: string;
  submittedInput: string;
}): string {
  const presentedOption = presentOptionLabel(optionLabel, submittedInput);
  const presentedPerspective = PERSPECTIVE_LABELS[perspective];

  if (!presentedPerspective) {
    return capitalize(presentedOption);
  }

  return `${presentedPerspective}: ${presentedOption}`;
}

export function presentScenarioDescription({
  description,
  perspective,
  context = [],
}: {
  description?: string;
  perspective: string;
  context?: string[];
}): string {
  const presentedDescription = description ? presentSimulationText(description) : "";

  if (presentedDescription && !INTERNAL_SCENARIO_DESCRIPTION.test(presentedDescription)) {
    return presentedDescription;
  }

  const presentedContext = presentScenarioContextItems(context).slice(0, 2);

  if (presentedContext.length > 0) {
    return presentedContext.join(" ");
  }

  return SCENARIO_DESCRIPTION_FALLBACKS[perspective] ??
    "Este escenario permite comparar consecuencias, condiciones e incertidumbres de la opción.";
}

export function presentPerspectiveBadge(perspective: string): string {
  return PERSPECTIVE_BADGES[perspective] ?? "Perspectiva del escenario";
}

export function presentCanonicalScenarioType(canonicalType: string): string {
  return CANONICAL_TYPE_LABELS[canonicalType] ?? "Escenario comparativo";
}

export function presentRenderState(renderState: string): string {
  return RENDER_STATE_LABELS[renderState] ?? "Disponible con límites";
}

export function shouldShowAnonymousResultActions(identityState: string): boolean {
  return ["guest", "signed_out", "auth_error"].includes(identityState);
}

export function presentScenarioRecommendation(recommendation?: string): string {
  if (!recommendation || recommendation.startsWith("Marco deterministico")) {
    return "Compara este escenario con tus límites, los datos disponibles y la posibilidad de corregir el rumbo.";
  }

  return presentSimulationText(recommendation);
}
