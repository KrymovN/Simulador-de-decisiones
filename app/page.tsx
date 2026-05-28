import Link from "next/link";
import DecisionSphereVisual from "../components/DecisionSphereVisual";
import HomeSimulator from "../components/HomeSimulator";
import LevioMark from "../components/LevioMark";

const engineSteps = [
  "Situación",
  "Análisis",
  "Escenarios",
  "Riesgos",
  "Conclusión estratégica",
];

const scenarioCards = [
  {
    label: "Escenario de oportunidad",
    title: "La decisión abre crecimiento",
    copy: "El motor detecta una ruta con tracción si proteges el timing, la energía disponible y los puntos sensibles.",
    signal: "Ventaja alta",
    tone: "opportunity",
  },
  {
    label: "Escenario de riesgo",
    title: "La presión se acumula",
    copy: "levio.es separa señales de tensión, costes invisibles y fricciones que pueden aparecer cuando ya estás dentro.",
    signal: "Riesgo medio",
    tone: "risk",
  },
  {
    label: "Consecuencia retrasada",
    title: "El efecto real llega después",
    copy: "Algunas decisiones no fallan de inmediato. El mapa revela impactos que emergen semanas o meses más tarde.",
    signal: "Latencia crítica",
    tone: "amber",
  },
  {
    label: "Alternativa estratégica",
    title: "Una ruta más inteligente",
    copy: "La simulación propone un movimiento menos obvio, con menor exposición y una posición futura más fuerte.",
    signal: "Ventaja oculta",
    tone: "emerald",
  },
];

const heroMetrics = [
  { label: "Escenarios", value: "24", trend: "Rutas futuras" },
  { label: "Riesgos", value: "7", trend: "Señales ocultas" },
  { label: "Hallazgos", value: "18", trend: "Lectura estratégica" },
  { label: "Claridad", value: "87%", trend: "Confianza del mapa" },
];

const heroFeatures = [
  {
    title: "Modela cualquier decisión",
    copy: "Describe una situación y Levio construye un mapa dinámico de futuros posibles.",
    icon: "model",
  },
  {
    title: "Explora escenarios",
    copy: "Compara resultados y entiende cómo una elección puede mover todo el sistema.",
    icon: "paths",
  },
  {
    title: "Detecta riesgos",
    copy: "Separa amenazas, fricciones y señales débiles antes de que aparezcan.",
    icon: "risk",
  },
  {
    title: "Encuentra oportunidades",
    copy: "Descubre ventajas ocultas, rutas fuertes y alternativas con mejor exposición.",
    icon: "target",
  },
  {
    title: "Decide con criterio",
    copy: "Elige desde análisis y consecuencia, no desde ruido o intuición aislada.",
    icon: "check",
  },
];

const analysisBlocks = [
  { label: "Riesgos", tone: "risk" },
  { label: "Ventajas", tone: "opportunity" },
  { label: "Impacto emocional", tone: "amber" },
  { label: "Impacto financiero", tone: "emerald" },
  { label: "Impacto estratégico", tone: "lime" },
];

const accountFeatures = [
  "Mis simulaciones",
  "Perfil personal",
  "Configurar idioma",
  "Decisiones guardadas",
  "Memoria personalizada de IA",
  "Consecuencias en vigilancia",
];

const dashboardSignals = [
  { label: "Oportunidad", value: "68%", tone: "opportunity" },
  { label: "Riesgo", value: "42%", tone: "risk" },
  { label: "Latencia", value: "3 meses", tone: "amber" },
];

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header section-frame">
        <Link className="brand-lockup" href="/" aria-label="levio.es">
          <LevioMark size="lg" />
          <span className="brand-name">LEVIO<span>.ES</span></span>
        </Link>
        <nav className="site-nav" aria-label="Acceso principal">
          <Link href="/dashboard">Panel</Link>
          <Link href="/dashboard/simulations">Simulaciones</Link>
          <Link href="/dashboard/decisions">Decisiones</Link>
          <Link href="/dashboard/security">Riesgos</Link>
          <Link href="/dashboard/memory">Memoria</Link>
          <Link className="nav-cta" href="/register">
            Mi espacio
          </Link>
        </nav>
      </header>

      <section className="hero-section section-frame" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow brand-mark">Sistema de inteligencia de decisiones con IA</p>
          <h1 id="hero-title">
            Simula. Entiende. Decide con <span>claridad.</span>
          </h1>
          <p className="hero-subtitle">
            Levio modela escenarios futuros, revela consecuencias ocultas,
            riesgos y oportunidades, y te ayuda a elegir la ruta más fuerte
            antes de actuar.
          </p>

          <div className="hero-actions" aria-label="Accesos principales">
            <a className="button-link" href="#decision-input">
              Iniciar simulación
            </a>
            <Link className="button-link secondary-button" href="/dashboard/simulations">
              Ver escenarios
            </Link>
          </div>

          <div className="hero-trust-row" aria-label="Estado del motor">
            <span className="engine-online">Motor IA en línea</span>
            <span>Tus datos permanecen privados y seguros</span>
          </div>
        </div>

        <div className="ai-core-stage" aria-label="Visual predictivo de Levio">
          <DecisionSphereVisual ariaLabel="Esfera predictiva con señales de decisión" />
        </div>

        <aside className="singularity-metrics" aria-label="Métricas del sistema">
          {heroMetrics.map((metric) => (
            <div className="core-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.trend}</small>
            </div>
          ))}
        </aside>

        <div className="hero-feature-strip" aria-label="Capacidades principales">
          {heroFeatures.map((feature) => (
            <article className={`hero-feature-card feature-${feature.icon}`} key={feature.title}>
              <span aria-hidden="true"></span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="hero-console-slot">
          <HomeSimulator />
        </div>
      </section>

      <section className="story-section two-column section-frame" aria-labelledby="what-title">
        <div>
          <p className="eyebrow">Qué es la plataforma</p>
          <h2 id="what-title">Un mapa vivo para decisiones que importan.</h2>
        </div>
        <div className="text-stack">
          <p>
            No es un chatbot. levio.es descompone una situación, modela futuros
            posibles y separa oportunidad, tensión, coste emocional y efecto
            estratégico.
          </p>
          <p>
            Cada simulación muestra qué puedes ganar, qué conviene proteger y
            qué consecuencia puede llegar tarde si decides sin ver el sistema
            completo.
          </p>
        </div>
      </section>

      <section className="engine-section section-frame" aria-labelledby="engine-title">
        <div className="section-heading">
          <p className="eyebrow">Cómo funciona el motor</p>
          <h2 id="engine-title">De una situación confusa a una conclusión estratégica.</h2>
        </div>

        <div className="engine-flow" aria-label="Flujo del motor levio.es">
          {engineSteps.map((step, index) => (
            <div className="flow-node" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="scenario-section section-frame" aria-labelledby="scenario-title">
        <div className="section-heading">
          <p className="eyebrow">Simulación de escenarios</p>
          <h2 id="scenario-title">El futuro no aparece como una respuesta. Aparece como un mapa.</h2>
        </div>

        <div className="scenario-grid">
          {scenarioCards.map((card) => (
            <article className={`scenario-card tone-${card.tone}`} key={card.label}>
              <p>{card.label}</p>
              <h3>{card.title}</h3>
              <span>{card.signal}</span>
              <small>{card.copy}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="analysis-section section-frame" aria-labelledby="analysis-title">
        <div className="analysis-visual" aria-hidden="true">
          <span className="brand-logo brand-logo-analysis"></span>
          <div className="analysis-bars">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div>
          <p className="eyebrow">Riesgo y beneficio</p>
          <h2 id="analysis-title">No basta con saber si algo conviene. Hay que saber qué transforma.</h2>
          <div className="analysis-grid">
            {analysisBlocks.map((block) => (
              <div className={`analysis-chip tone-${block.tone}`} key={block.label}>
                {block.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ecosystem-section section-frame" aria-labelledby="account-title">
        <div className="section-heading">
          <p className="eyebrow">Ecosistema personal</p>
          <h2 id="account-title">Tu historial de decisiones, tus simulaciones y tu evolución en un solo lugar.</h2>
        </div>

        <div className="ecosystem-layout">
          <div className="dashboard-preview-panel">
            <div className="dashboard-preview-top">
              <span className="brand-logo brand-logo-panel" aria-hidden="true"></span>
              <div>
                <strong>Mi espacio</strong>
                <span>Panel privado de simulación</span>
              </div>
            </div>
            <div className="dashboard-preview-grid">
              {dashboardSignals.map((signal) => (
                <div className={`dashboard-preview-card tone-${signal.tone}`} key={signal.label}>
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="feature-list">
            {accountFeatures.map((feature) => (
              <div key={feature}>{feature}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mobile-section section-frame" aria-labelledby="mobile-title">
        <div className="phone-visual" aria-hidden="true">
          <div className="phone-screen">
            <span className="brand-logo brand-logo-phone"></span>
            <strong>Continuidad</strong>
            <p>Simulación sincronizada</p>
          </div>
        </div>
        <div>
          <p className="eyebrow">Ecosistema móvil</p>
          <h2 id="mobile-title">Decisiones complejas, disponibles donde ocurre la vida.</h2>
          <p>
            levio.es conecta escritorio, móvil y cuenta personal con continuidad
            entre dispositivos, preferencias de idioma y una memoria estratégica
            preparada para evolucionar contigo.
          </p>
        </div>
      </section>

      <section className="final-cta section-frame" aria-labelledby="final-title">
        <span className="brand-logo brand-logo-final" aria-hidden="true"></span>
        <p className="eyebrow">Antes de actuar</p>
        <h2 id="final-title">Explora escenarios, riesgos, beneficios y consecuencias antes de decidir.</h2>
        <div className="final-actions">
          <a href="#decision-input">Iniciar una simulación</a>
          <Link className="secondary-button" href="/dashboard">
            Mi espacio
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <Link className="brand-lockup" href="/" aria-label="levio.es">
          <LevioMark size="md" />
          <span className="brand-name">LEVIO<span>.ES</span></span>
        </Link>
        <div>
          <Link href="/login">Entrar</Link>
          <Link href="/register">Crear cuenta</Link>
          <Link href="/dashboard">Acceder al panel</Link>
        </div>
      </footer>
    </main>
  );
}
