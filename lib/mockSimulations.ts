export type SimulationScenario = {
  label: string;
  title: string;
  copy: string;
  signal: string;
  score: string;
  probability?: string;
  riskLevel?: "Bajo" | "Medio" | "Alto";
  potentialBenefit?: string;
  consequences?: string[];
  warnings?: string[];
  recommendation?: string;
};

export type SimulationImpact = {
  label: string;
  value: number;
  copy: string;
};

export type SimulationTimelineItem = {
  period: string;
  title: string;
  copy: string;
};

export type MockSimulation = {
  id: string;
  date: string;
  category: string;
  decision: string;
  result: string;
  status: string;
  strategicConclusion: string;
  detailCopy: string;
  privacy: string;
  signals: {
    risk: number;
    advantage: number;
    latency: string;
    confidence: number;
  };
  tags: string[];
  scenarios: SimulationScenario[];
  impacts: SimulationImpact[];
  timeline: SimulationTimelineItem[];
};

/*
 * MOCK PERSONAL AREA DATA ONLY.
 * These examples let the protected UI feel complete before real database,
 * user-owned simulations, consent records, and server-side auth exist.
 */
export const mockSimulations: MockSimulation[] = [
  {
    id: "oferta-premium",
    date: "11 mayo 2026",
    category: "Negocio",
    decision: "Lanzar una nueva oferta premium",
    result: "Alta oportunidad con riesgo operativo moderado",
    status: "Preparada para revisión",
    strategicConclusion: "Avanzar con una fase limitada antes del lanzamiento completo.",
    detailCopy:
      "La simulación detecta una ventana comercial favorable, pero recomienda validar capacidad operativa, soporte y presión de marca antes de escalar.",
    privacy: "Privada",
    signals: {
      risk: 42,
      advantage: 76,
      latency: "6 semanas",
      confidence: 81,
    },
    tags: ["Oferta", "Precio", "Operaciones"],
    scenarios: [
      {
        label: "Escenario optimista",
        title: "La oferta eleva percepción de marca",
        copy: "El nuevo posicionamiento atrae clientes de mayor valor y mejora margen sin aumentar demasiado la fricción de venta.",
        signal: "Ventaja alta",
        score: "76%",
      },
      {
        label: "Escenario de riesgo",
        title: "La promesa supera la capacidad real",
        copy: "El volumen inicial puede tensionar soporte, entregas y experiencia si no existe una fase de control previa.",
        signal: "Riesgo medio",
        score: "42%",
      },
      {
        label: "Consecuencia retrasada",
        title: "La presión aparece después del primer pico",
        copy: "El coste oculto surge cuando los clientes premium empiezan a exigir continuidad, velocidad y atención más precisa.",
        signal: "Latencia crítica",
        score: "6 semanas",
      },
      {
        label: "Alternativa estratégica",
        title: "Lanzar como invitación privada",
        copy: "Una apertura por cohortes reduce exposición pública y permite ajustar el servicio con clientes de confianza.",
        signal: "Ruta recomendada",
        score: "Alta",
      },
    ],
    impacts: [
      {
        label: "Impacto emocional",
        value: 58,
        copy: "Exige energía de liderazgo y tolerancia a incertidumbre durante la validación.",
      },
      {
        label: "Impacto financiero",
        value: 74,
        copy: "Puede elevar margen, pero necesita presupuesto para soporte y refinamiento inicial.",
      },
      {
        label: "Impacto estratégico",
        value: 82,
        copy: "Refuerza posicionamiento si la experiencia se mantiene consistente.",
      },
    ],
    timeline: [
      {
        period: "0-7 días",
        title: "Definir límites de la prueba",
        copy: "Seleccionar audiencia, precio inicial, criterios de éxito y umbral de cancelación.",
      },
      {
        period: "2-4 semanas",
        title: "Observar fricción real",
        copy: "Medir objeciones, carga operativa, velocidad de respuesta y calidad percibida.",
      },
      {
        period: "6 semanas",
        title: "Decidir expansión o pausa",
        copy: "Escalar solo si soporte, margen y satisfacción permanecen dentro del rango previsto.",
      },
    ],
  },
  {
    id: "cambio-pais",
    date: "08 mayo 2026",
    category: "Vida",
    decision: "Cambiar de país durante seis meses",
    result: "Impacto emocional alto con ventaja estratégica diferida",
    status: "En observación",
    strategicConclusion: "Convertir la mudanza en experimento reversible, no en ruptura total.",
    detailCopy:
      "La decisión puede abrir claridad personal y nuevas oportunidades, pero necesita un marco de retorno, finanzas protegidas y continuidad laboral.",
    privacy: "Privada",
    signals: {
      risk: 57,
      advantage: 69,
      latency: "3 meses",
      confidence: 73,
    },
    tags: ["Vida", "Trabajo", "Continuidad"],
    scenarios: [
      {
        label: "Escenario optimista",
        title: "El cambio desbloquea energía y foco",
        copy: "La distancia reduce ruido, amplía perspectiva y permite reordenar prioridades personales y profesionales.",
        signal: "Ventaja media-alta",
        score: "69%",
      },
      {
        label: "Escenario de riesgo",
        title: "La novedad oculta desgaste",
        copy: "La primera etapa puede sentirse estimulante, pero la logística y soledad pueden acumular presión.",
        signal: "Riesgo sensible",
        score: "57%",
      },
      {
        label: "Consecuencia retrasada",
        title: "El coste emocional emerge tarde",
        copy: "La decisión puede afectar vínculos, rutina y estabilidad después de que termine el impulso inicial.",
        signal: "Latencia alta",
        score: "3 meses",
      },
      {
        label: "Alternativa estratégica",
        title: "Diseñar una salida con retorno",
        copy: "Mantener base, presupuesto de regreso y revisión mensual reduce presión y conserva libertad.",
        signal: "Ruta flexible",
        score: "Alta",
      },
    ],
    impacts: [
      {
        label: "Impacto emocional",
        value: 84,
        copy: "La decisión toca identidad, relaciones y sensación de pertenencia.",
      },
      {
        label: "Impacto financiero",
        value: 62,
        copy: "Requiere colchón claro para vivienda, desplazamientos y cambios de ritmo laboral.",
      },
      {
        label: "Impacto estratégico",
        value: 71,
        copy: "Puede ampliar red y foco si se gestiona como prueba con límites.",
      },
    ],
    timeline: [
      {
        period: "Antes de salir",
        title: "Cerrar condiciones reversibles",
        copy: "Presupuesto, contrato, alojamiento y plan de retorno deben quedar definidos antes de actuar.",
      },
      {
        period: "30 días",
        title: "Medir energía real",
        copy: "Evaluar foco, soledad, productividad y coste de adaptación sin dramatizar la primera impresión.",
      },
      {
        period: "3 meses",
        title: "Revisión profunda",
        copy: "Decidir si extender, modificar o volver con datos emocionales y financieros reales.",
      },
    ],
  },
  {
    id: "nueva-linea-producto",
    date: "03 mayo 2026",
    category: "Finanzas",
    decision: "Invertir en una nueva línea de producto",
    result: "Retorno potencial gradual con exposición inicial elevada",
    status: "Requiere validación",
    strategicConclusion: "Invertir por tramos y desbloquear capital solo al superar señales de demanda.",
    detailCopy:
      "El motor encuentra potencial estratégico, pero advierte que la inversión completa demasiado pronto aumentaría exposición sin suficiente aprendizaje.",
    privacy: "Privada",
    signals: {
      risk: 64,
      advantage: 72,
      latency: "4 meses",
      confidence: 77,
    },
    tags: ["Capital", "Demanda", "Producto"],
    scenarios: [
      {
        label: "Escenario optimista",
        title: "La línea abre una segunda fuente de ingresos",
        copy: "Si existe demanda real, el producto diversifica ingresos y mejora posición competitiva.",
        signal: "Ventaja alta",
        score: "72%",
      },
      {
        label: "Escenario de riesgo",
        title: "El capital queda atrapado demasiado pronto",
        copy: "La inversión inicial puede comprometer caja antes de validar precio, canal y recurrencia.",
        signal: "Riesgo alto",
        score: "64%",
      },
      {
        label: "Consecuencia retrasada",
        title: "La complejidad crece en operaciones",
        copy: "El coste real puede aparecer meses después en soporte, inventario, foco interno y coordinación.",
        signal: "Latencia crítica",
        score: "4 meses",
      },
      {
        label: "Alternativa estratégica",
        title: "Activar inversión por hitos",
        copy: "Separar prototipo, preventa y escalado reduce exposición y mejora aprendizaje antes del gasto mayor.",
        signal: "Ruta prudente",
        score: "Alta",
      },
    ],
    impacts: [
      {
        label: "Impacto emocional",
        value: 49,
        copy: "La tensión principal viene de incertidumbre financiera y foco dividido.",
      },
      {
        label: "Impacto financiero",
        value: 86,
        copy: "Puede generar retorno relevante, pero concentra riesgo al inicio.",
      },
      {
        label: "Impacto estratégico",
        value: 78,
        copy: "Fortalece la empresa si se valida sin agotar recursos centrales.",
      },
    ],
    timeline: [
      {
        period: "0-14 días",
        title: "Validar demanda mínima",
        copy: "Confirmar interés pagado o señales fuertes antes de comprometer inversión completa.",
      },
      {
        period: "45 días",
        title: "Construir prototipo vendible",
        copy: "Probar propuesta, precio, canal y objeciones con una versión limitada.",
      },
      {
        period: "4 meses",
        title: "Escalar solo con tracción",
        copy: "Aumentar capital únicamente si margen, demanda y operación sostienen la expansión.",
      },
    ],
  },
];

export function getMockSimulation(id: string) {
  return mockSimulations.find((simulation) => simulation.id === id);
}
