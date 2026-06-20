import type { MockSimulation, SimulationScenario } from "./mockSimulations";

export const LOCAL_SIMULATIONS_KEY = "levio_es_saved_simulations";

export type ThinkingStage = {
  title: string;
  detail: string;
};

export type SimulationResponse = {
  input: string;
  lang: "es";
  generatedAt: string;
  simulation: MockSimulation;
  thinkingStages: ThinkingStage[];
};

const thinkingStages: ThinkingStage[] = [
  {
    title: "Comprendiendo la situación",
    detail: "Separando objetivo, presión externa, urgencia y coste de no decidir.",
  },
  {
    title: "Detectando variables críticas",
    detail: "Identificando energía disponible, dinero, relaciones, timing y reversibilidad.",
  },
  {
    title: "Simulando escenarios",
    detail: "Abriendo rutas probables con oportunidad, tensión acumulada y alternativas.",
  },
  {
    title: "Evaluando riesgos y beneficios",
    detail: "Comparando exposición, ventaja potencial, latencia y consecuencias secundarias.",
  },
  {
    title: "Preparando marco de decisión",
    detail: "Construyendo un mapa de opciones sin presentar una certeza falsa.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashInput(input: string) {
  return Array.from(input).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function pickCategory(input: string) {
  const text = input.toLowerCase();

  if (/(trabajo|empleo|oferta|empresa|negocio|producto|cliente|precio|lanzar)/.test(text)) {
    return "Negocio";
  }

  if (/(invertir|dinero|capital|ahorro|finanzas|comprar|vender)/.test(text)) {
    return "Finanzas";
  }

  if (/(pareja|familia|mudanza|país|pais|ciudad|salud|vida|relación|relacion)/.test(text)) {
    return "Vida";
  }

  return "Estrategia";
}

function riskLabel(score: number): "Bajo" | "Medio" | "Alto" {
  if (score >= 68) {
    return "Alto";
  }

  if (score >= 42) {
    return "Medio";
  }

  return "Bajo";
}

function shortDecision(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (trimmed.length <= 92) {
    return trimmed;
  }

  return `${trimmed.slice(0, 89).trim()}...`;
}

function buildScenarios(input: string, risk: number, advantage: number): SimulationScenario[] {
  const category = pickCategory(input);
  const elevatedRisk = riskLabel(risk);
  const measuredRisk = riskLabel(clamp(risk - 18, 12, 82));

  return [
    {
      label: "Ruta de crecimiento",
      title: "Avanzar con una prueba controlada",
      copy:
        "La situación muestra una oportunidad real si el primer movimiento conserva margen de corrección y criterios claros de éxito.",
      signal: "Ventaja probable",
      score: `${advantage}%`,
      probability: `${clamp(advantage - 4, 46, 88)}%`,
      riskLevel: measuredRisk,
      potentialBenefit:
        category === "Vida"
          ? "Más claridad personal, energía renovada y aprendizaje rápido sin cerrar opciones."
          : "Mejora de posición, aprendizaje de mercado y una ventaja inicial sin comprometer todo el sistema.",
      consequences: [
        "Aumenta la información disponible antes de una decisión irreversible.",
        "Obliga a definir límites, señales de parada y una fecha de revisión.",
      ],
      warnings: [
        "La oportunidad pierde fuerza si el piloto no tiene métrica de salida.",
        "El entusiasmo inicial puede ocultar costes de mantenimiento.",
      ],
      recommendation: "Opción simulada: empezar en pequeño, medir pronto y escalar solo con señales reales.",
    },
    {
      label: "Ruta de exposición",
      title: "Acelerar demasiado eleva la presión",
      copy:
        "El camino rápido promete alivio o ventaja inmediata, pero concentra riesgo en timing, energía y recursos todavía no validados.",
      signal: "Riesgo visible",
      score: `${risk}%`,
      probability: `${clamp(risk + 2, 38, 86)}%`,
      riskLevel: elevatedRisk,
      potentialBenefit: "Puede capturar momentum y evitar una ventana perdida si las condiciones externas son favorables.",
      consequences: [
        "La decisión puede consumir capacidad antes de confirmar si el beneficio compensa.",
        "Una corrección tardía será más cara que una validación temprana.",
      ],
      warnings: [
        "No confundas urgencia emocional con urgencia estratégica.",
        "Si faltan datos críticos, el riesgo real será mayor que el riesgo percibido.",
      ],
      recommendation: "Criterio de decisión: reducir velocidad hasta tener una condición objetiva de avance.",
    },
    {
      label: "Consecuencia retrasada",
      title: "El impacto importante aparece después",
      copy:
        "La primera fase puede sentirse manejable, pero el sistema detecta efectos secundarios que suelen aparecer cuando ya existe compromiso.",
      signal: "Latencia sensible",
      score: "4-8 semanas",
      probability: `${clamp(Math.round((risk + advantage) / 2), 44, 82)}%`,
      riskLevel: riskLabel(clamp(risk + 8, 24, 90)),
      potentialBenefit: "Permite diseñar seguimiento y evitar que la consecuencia latente sorprenda al equipo o a la vida personal.",
      consequences: [
        "Aparecerán costes de coordinación, atención o estabilidad que hoy no pesan igual.",
        "La decisión necesitará una segunda revisión cuando baje el impulso inicial.",
      ],
      warnings: [
        "Lo que parece simple en el día cero puede volverse complejo por acumulación.",
        "La ausencia de problemas inmediatos no significa que la decisión esté validada.",
      ],
      recommendation: "Criterio de seguimiento: programar una revisión antes de que la inercia decida por ti.",
    },
    {
      label: "Alternativa estratégica",
      title: "Diseñar una opción reversible",
      copy:
        "La ruta más inteligente no es elegir sí o no, sino construir una versión que preserve aprendizaje, reputación y margen de maniobra.",
      signal: "Mapa de opciones",
      score: "Alta",
      probability: `${clamp(advantage + 7, 55, 91)}%`,
      riskLevel: "Bajo",
      potentialBenefit: "Maximiza aprendizaje con menor exposición y deja espacio para ajustar sin perder coherencia.",
      consequences: [
        "Convierte la decisión en experimento con retorno posible.",
        "Mejora la conversación con otras personas porque sustituye presión por criterios.",
      ],
      warnings: [
        "Una opción reversible también necesita compromiso real durante la prueba.",
        "Demasiada prudencia puede diluir la señal si el experimento queda indefinido.",
      ],
      recommendation: "Marco de decisión: prueba de 14 a 30 días con umbral claro de continuidad.",
    },
  ];
}

export function buildMockSimulation(input: string): SimulationResponse {
  const normalizedInput = shortDecision(input || "Decisión estratégica sin contexto suficiente");
  const seed = hashInput(normalizedInput);
  const category = pickCategory(normalizedInput);
  const risk = clamp(36 + (seed % 43), 24, 82);
  const advantage = clamp(52 + ((seed * 3) % 39), 48, 91);
  const confidence = clamp(64 + ((seed * 7) % 25), 62, 89);
  const latencyOptions = ["2 semanas", "4 semanas", "6 semanas", "3 meses"];
  const latency = latencyOptions[seed % latencyOptions.length];
  const now = new Date();
  const id = `local-${now.getTime()}-${seed}`;
  const scenarios = buildScenarios(normalizedInput, risk, advantage);
  const recommendedScenario = scenarios[3];
  const strategicConclusion = `Un marco prudente es convertir "${normalizedInput}" en una prueba reversible con límites, señales de avance y una revisión en ${latency}.`;

  return {
    input: normalizedInput,
    lang: "es",
    generatedAt: now.toISOString(),
    thinkingStages,
    simulation: {
      id,
      date: now.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      category,
      decision: normalizedInput,
      result: `${recommendedScenario.title} con riesgo ${riskLabel(risk).toLowerCase()} y ventaja estimada del ${advantage}%`,
      status: "Guardable en demo",
      strategicConclusion,
      detailCopy:
        "Este resultado es una simulación mock preparada para UI. No usa datos productivos ni API real, pero mantiene una estructura lista para sustituirse por análisis generado en backend.",
      privacy: "Local demo",
      signals: {
        risk,
        advantage,
        latency,
        confidence,
      },
      tags: [category, "Mock MVP", riskLabel(risk)],
      scenarios,
      impacts: [
        {
          label: "Impacto emocional",
          value: clamp(42 + (seed % 41), 35, 86),
          copy: "La decisión necesita energía sostenida y una revisión cuando baje la intensidad inicial.",
        },
        {
          label: "Impacto financiero",
          value: clamp(32 + ((seed * 5) % 52), 28, 88),
          copy: "La exposición económica se reduce si el compromiso avanza por hitos verificables.",
        },
        {
          label: "Impacto estratégico",
          value: advantage,
          copy: "El mapa de decisión preserva aprendizaje, reputación y capacidad de ajustar el rumbo.",
        },
      ],
      timeline: [
        {
          period: "0-48 horas",
          title: "Definir la hipótesis",
          copy: "Escribir qué tendría que ser cierto para que esta decisión merezca avanzar.",
        },
        {
          period: "14-30 días",
          title: "Ejecutar prueba reversible",
          copy: "Actuar con límites claros, señales observables y coste máximo aceptable.",
        },
        {
          period: latency,
          title: "Revisión estratégica",
          copy: "Decidir continuidad, ajuste o retirada usando señales reales, no solo sensación inicial.",
        },
      ],
    },
  };
}
