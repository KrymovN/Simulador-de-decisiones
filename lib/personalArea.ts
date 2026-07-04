export type SavedDecision = {
  id: string;
  title: string;
  category: string;
  status: string;
  nextAction: string;
  scheduledReview: string;
  linkedSimulationId: string;
  riskLevel: string;
  tags: string[];
  signals: {
    clarity: number;
    exposure: number;
  };
};

export type MemoryScope = {
  label: string;
  state: string;
  copy: string;
  active: boolean;
};

export const futureLanguages = [
  "Español",
  "English",
  "Українська",
  "Русский",
  "العربية",
  "中文",
  "Français",
  "Deutsch",
  "Português",
  "Italiano",
];

export const userProfile = {
  name: "Usuario levio.es",
  email: "usuario@levio.es",
  language: "Español",
  country: "España",
  timezone: "Europe/Madrid",
  privacyLevel: "Preparada",
  accountState: "Demo protegido",
  strategicMode: "Decisiones complejas",
};

export const accountSignals = [
  {
    label: "Contexto personal",
    value: "Preparado",
    copy: "Perfil, idioma y preferencias preparados para una futura persistencia aprobada.",
  },
  {
    label: "Privacidad",
    value: "Preparada",
    copy: "Consentimiento, exportación y supresión preparados como base GDPR.",
  },
  {
    label: "Continuidad",
    value: "Preparada",
    copy: "Historial local, decisiones y memoria futura preparados para una etapa posterior.",
  },
];

export const savedDecisions: SavedDecision[] = [
  {
    id: "oferta-premium-privada",
    title: "Lanzar oferta premium como invitación privada",
    category: "Negocio",
    status: "En seguimiento",
    nextAction: "Definir cohorte inicial y límite de plazas",
    scheduledReview: "18 mayo 2026",
    linkedSimulationId: "oferta-premium",
    riskLevel: "Moderado",
    tags: ["Oferta", "Marca", "Operaciones"],
    signals: {
      clarity: 82,
      exposure: 42,
    },
  },
  {
    id: "mudanza-reversible",
    title: "Probar cambio de país con retorno planificado",
    category: "Vida",
    status: "Revisión mensual",
    nextAction: "Cerrar presupuesto, vivienda temporal y fecha de revisión",
    scheduledReview: "08 junio 2026",
    linkedSimulationId: "cambio-pais",
    riskLevel: "Sensible",
    tags: ["Vida", "Energía", "Trabajo"],
    signals: {
      clarity: 68,
      exposure: 57,
    },
  },
  {
    id: "inversion-por-hitos",
    title: "Invertir en nueva línea solo por hitos",
    category: "Finanzas",
    status: "Pendiente de validación",
    nextAction: "Conseguir señales de demanda antes de liberar capital",
    scheduledReview: "24 mayo 2026",
    linkedSimulationId: "nueva-linea-producto",
    riskLevel: "Alto",
    tags: ["Capital", "Producto", "Demanda"],
    signals: {
      clarity: 73,
      exposure: 64,
    },
  },
  {
    id: "pausa-estrategica",
    title: "Pausar una decisión hasta observar nuevas señales",
    category: "Estrategia",
    status: "En espera",
    nextAction: "Revisar indicadores externos antes de comprometer recursos",
    scheduledReview: "31 mayo 2026",
    linkedSimulationId: "oferta-premium",
    riskLevel: "Bajo",
    tags: ["Timing", "Riesgo", "Foco"],
    signals: {
      clarity: 76,
      exposure: 28,
    },
  },
];

export const memorySettings = {
  state: "Pausable",
  mode: "Personalización controlada",
  consent: "Consentimiento preparado",
  lastUpdated: "11 mayo 2026",
};

export const memoryScopes: MemoryScope[] = [
  {
    label: "Patrones de decisión",
    state: "Preparado",
    copy: "Ejemplo de cómo Levio podría reconocer si el usuario prefiere validar, esperar, invertir por tramos o actuar rápido.",
    active: true,
  },
  {
    label: "Sensibilidad al riesgo",
    state: "Preparado",
    copy: "Ejemplo de cómo la tolerancia al riesgo podría ajustar exposición, timing y alternativas estratégicas.",
    active: true,
  },
  {
    label: "Contexto regional e idioma",
    state: "Preparado",
    copy: "Preparar idioma, zona horaria y región como base de futuras simulaciones.",
    active: true,
  },
  {
    label: "Datos altamente sensibles",
    state: "Desactivado",
    copy: "No preparar información sensible sin consentimiento explícito y trazabilidad real.",
    active: false,
  },
];

export const rememberedPatterns = [
  {
    title: "Prefiere decisiones reversibles",
    copy: "Las simulaciones recientes favorecen pilotos, cohortes y puntos de salida antes de compromisos totales.",
    source: "3 simulaciones",
  },
  {
    title: "Riesgo financiero vigilado",
    copy: "El sistema marca capital inicial, caja y validación de demanda como variables sensibles.",
    source: "2 decisiones",
  },
  {
    title: "Impacto emocional relevante",
    copy: "Las decisiones personales necesitan revisión diferida para detectar desgaste después del impulso inicial.",
    source: "1 simulación",
  },
];

export const activityLog = [
  {
    date: "11 mayo 2026",
    title: "Simulación prioritaria actualizada",
    copy: "Oferta premium marcada para revisión estratégica.",
  },
  {
    date: "10 mayo 2026",
    title: "Privacidad revisada",
    copy: "Consentimiento preparado como base de producto.",
  },
  {
    date: "08 mayo 2026",
    title: "Decisión preparada",
    copy: "Cambio de país añadido al seguimiento mensual.",
  },
];
