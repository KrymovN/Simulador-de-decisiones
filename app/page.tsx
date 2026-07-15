import Link from "next/link";
import HomeSimulator from "../components/HomeSimulator";
import HomepageAnchorLink from "../components/HomepageAnchorLink";
import HomepageAssemblyController from "../components/HomepageAssemblyController";
import HomepageNavigation from "../components/HomepageNavigation";
import LevioMark from "../components/LevioMark";

const processSteps = [
  {
    title: "Analiza la situación",
    copy: "Separa objetivo, contexto, presión y restricciones antes de construir el mapa.",
  },
  {
    title: "Detecta información faltante",
    copy: "Marca datos ausentes, supuestos débiles y señales que conviene revisar.",
  },
  {
    title: "Identifica contradicciones",
    copy: "Contrasta objetivos, límites y tensiones que pueden hacer frágil una opción.",
  },
  {
    title: "Simula escenarios",
    copy: "Levio organiza alternativas y muestra rutas demostrativas con consecuencias, riesgos y trade-offs.",
  },
  {
    title: "Evalúa riesgos",
    copy: "Compara exposición, reversibilidad, impacto diferido y señales de alerta.",
  },
  {
    title: "Organiza criterios de decisión",
    copy: "Convierte el mapa en criterios claros para comparar opciones antes de actuar.",
  },
];

const capabilities = [
  {
    title: "Contexto de decisión",
    copy: "Ordena intereses, restricciones, personas afectadas y momento de decisión.",
  },
  {
    title: "Presión y coste",
    copy: "Sitúa presión, coste emocional y posibles efectos en relaciones, energía y confianza.",
  },
  {
    title: "Riesgos ocultos",
    copy: "Señala fricciones, dependencias y costes futuros que suelen aparecer demasiado tarde.",
  },
  {
    title: "Trade-offs estratégicos",
    copy: "Compara oportunidad, exposición y capacidad real de ejecución antes de avanzar.",
  },
];

const trustSignals = [
  { copy: "Preview público con respuestas de ejemplo", direction: "left" },
  { copy: "Escenarios comparables", direction: "rise" },
  { copy: "Riesgo y consecuencia", direction: "right" },
];

const finalHeadlineClusters = [
  { copy: "Empieza", direction: "left" },
  { copy: "con una", direction: "rise" },
  { copy: "decisión real.", direction: "right" },
];

const footerColumns = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Criterios", href: "#criterios" },
      { label: "Simulador", href: "#simulador" },
    ],
  },
  {
    title: "Acceso",
    links: [
      { label: "Iniciar sesión", href: "/login" },
      { label: "Espacio local", href: "/dashboard" },
    ],
  },
  {
    title: "Confianza",
    links: [
      { label: "Privacidad", href: "/privacy-policy" },
      { label: "Términos", href: "/terms" },
      { label: "Contacto", href: "mailto:hola@levio.es" },
    ],
  },
];

export default function Home() {
  return (
    <main className="site-shell minimal-home">
      <HomepageAssemblyController />

      <header className="minimal-home__header reference-header">
        <Link className="brand-lockup" href="/" aria-label="levio.es">
          <LevioMark size="lg" />
          <span className="brand-name">levio.es</span>
        </Link>
        <HomepageNavigation />
      </header>

      <section className="minimal-home__hero" id="inicio" aria-labelledby="hero-title">
        <div className="minimal-home__hero-copy">
          <div>
            <div
              data-home-assembly-group="hero-title"
              data-home-assembly-trigger="first-scroll"
            >
              <h1 id="hero-title" data-home-assembly-item>
                Decide antes
                <span>de actuar.</span>
              </h1>
            </div>
            <p className="minimal-home__hero-description">
              Explora escenarios, riesgos y consecuencias en un preview demostrativo antes de tomar una decisión.
            </p>
          </div>

          <div className="minimal-home__hero-actions" aria-label="Accesos principales">
            <HomepageAnchorLink className="minimal-home__primary-cta" href="#simulador">
              Comenzar simulación
            </HomepageAnchorLink>
            <HomepageAnchorLink className="minimal-home__text-link" href="#como-funciona">
              Cómo funciona <span aria-hidden="true">→</span>
            </HomepageAnchorLink>
          </div>

          <div
            className="minimal-home__preview-note"
            data-home-assembly-group="preview-signals"
            data-home-assembly-trigger="first-scroll"
          >
            <strong>Preview público</strong>
            <ul aria-label="Señales del producto">
              {trustSignals.map((signal) => (
                <li
                  data-home-assembly-direction={signal.direction}
                  data-home-assembly-item
                  key={signal.copy}
                >
                  {signal.copy}
                </li>
              ))}
            </ul>
            <p>La conexión con IA real todavía no está activada.</p>
          </div>
        </div>

        <div className="minimal-home__simulator" id="simulador">
          <HomeSimulator />
        </div>
      </section>

      <section className="minimal-home__section" id="como-funciona" aria-labelledby="process-title">
        <div className="minimal-home__section-heading" data-home-assembly-group="process-heading">
          <h2 id="process-title" data-home-assembly-direction="left" data-home-assembly-item>
            Cómo piensa Levio
          </h2>
          <p data-home-assembly-direction="rise" data-home-assembly-item>
            Un sistema de simulación de decisiones, no un asistente de IA. No una respuesta. Una simulación de futuros posibles.
          </p>
        </div>

        <div className="minimal-home__process-grid" data-home-assembly-group="process-cards">
          {processSteps.map((step, index) => (
            <article
              className="minimal-home__process-card"
              data-home-assembly-direction="right"
              data-home-assembly-item
              data-home-assembly-order={processSteps.length - index - 1}
              key={step.title}
            >
              <span className="minimal-home__step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="minimal-home__section minimal-home__capabilities" id="criterios" aria-labelledby="capabilities-title">
        <div className="minimal-home__section-heading" data-home-assembly-group="capabilities-heading">
          <h2 id="capabilities-title" data-home-assembly-direction="right" data-home-assembly-item>
            Qué obtienes con Levio
          </h2>
        </div>

        <div className="minimal-home__capability-grid" data-home-assembly-group="capability-cards">
          {capabilities.map((capability, index) => (
            <article
              className="minimal-home__capability-card"
              data-home-assembly-direction={index % 2 === 0 ? "left-soft" : "right-soft"}
              data-home-assembly-item
              key={capability.title}
            >
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="minimal-home__final-cta"
        aria-labelledby="final-cta-title"
        data-home-assembly-group="final-cta"
      >
        <div>
          <h2 id="final-cta-title" aria-label="Empieza con una decisión real.">
            {finalHeadlineClusters.map((cluster) => (
              <span
                aria-hidden="true"
                className="minimal-home__cta-cluster"
                data-home-assembly-direction={cluster.direction}
                data-home-assembly-item
                key={cluster.copy}
              >
                {cluster.copy}
              </span>
            ))}
          </h2>
          <p data-home-assembly-direction="rise" data-home-assembly-item>
            Explora escenarios, riesgos y consecuencias antes de actuar.
          </p>
        </div>
        <div className="minimal-home__final-actions" data-home-assembly-direction="right-soft" data-home-assembly-item>
          <HomepageAnchorLink className="minimal-home__primary-cta" href="#simulador">
            Comenzar simulación
          </HomepageAnchorLink>
          <HomepageAnchorLink className="minimal-home__text-link" href="#como-funciona">
            Ver cómo funciona <span aria-hidden="true">→</span>
          </HomepageAnchorLink>
        </div>
      </section>

      <footer className="minimal-home__footer">
        <div className="minimal-home__footer-brand">
          <Link className="brand-lockup" href="/" aria-label="levio.es">
            <LevioMark size="md" />
            <span className="brand-name">levio.es</span>
          </Link>
          <p>Sistema de simulación de decisiones para explorar escenarios, riesgos y consecuencias antes de actuar.</p>
          <small>© 2026 Levio.es. Todos los derechos reservados.</small>
        </div>

        {footerColumns.map((column) => (
          <div className="minimal-home__footer-column" key={column.title}>
            <strong>{column.title}</strong>
            {column.links.map((link) =>
              link.href.startsWith("#") ? (
                <HomepageAnchorLink href={link.href as `#${string}`} key={link.label}>
                  {link.label}
                </HomepageAnchorLink>
              ) : (
                <Link href={link.href} key={link.label}>
                  {link.label}
                </Link>
              ),
            )}
          </div>
        ))}
      </footer>
    </main>
  );
}
