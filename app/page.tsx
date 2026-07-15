import Link from "next/link";
import HomeSimulator from "../components/HomeSimulator";
import HomepageAnchorLink from "../components/HomepageAnchorLink";
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
  "Preview público con respuestas de ejemplo",
  "Escenarios comparables",
  "Riesgo y consecuencia",
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
            <h1 id="hero-title">
              Decide antes
              <span>de actuar.</span>
            </h1>
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

          <div className="minimal-home__preview-note">
            <strong>Preview público</strong>
            <ul aria-label="Señales del producto">
              {trustSignals.map((signal) => (
                <li key={signal}>{signal}</li>
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
        <div className="minimal-home__section-heading">
          <h2 id="process-title">Cómo piensa Levio</h2>
          <p>Un motor de simulación de decisiones, no un asistente de IA. No una respuesta. Una simulación de futuros posibles.</p>
        </div>

        <div className="minimal-home__process-grid">
          {processSteps.map((step, index) => (
            <article className="minimal-home__process-card" key={step.title}>
              <span className="minimal-home__step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="minimal-home__section minimal-home__capabilities" id="criterios" aria-labelledby="capabilities-title">
        <div className="minimal-home__section-heading">
          <h2 id="capabilities-title">Qué obtienes con Levio</h2>
        </div>

        <div className="minimal-home__capability-grid">
          {capabilities.map((capability) => (
            <article className="minimal-home__capability-card" key={capability.title}>
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="minimal-home__final-cta" aria-labelledby="final-cta-title">
        <div>
          <h2 id="final-cta-title">Empieza con una decisión real.</h2>
          <p>Explora escenarios, riesgos y consecuencias antes de actuar.</p>
        </div>
        <div className="minimal-home__final-actions">
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
          <p>Motor de simulación para decisiones con consecuencias reales.</p>
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
