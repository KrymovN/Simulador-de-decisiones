import Link from "next/link";
import HomeSimulator from "../components/HomeSimulator";
import HomepageAnchorLink from "../components/HomepageAnchorLink";
import HomepageAssemblyController from "../components/HomepageAssemblyController";
import HomepageNavigation from "../components/HomepageNavigation";
import BrandLockup from "../components/BrandLockup";

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
  "Riesgos y consecuencias",
];

const finalHeadlineClusters = [
  "Empieza",
  "con una",
  "decisión real.",
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
        <BrandLockup ariaLabel="levio.es" markSize="lg" nameClassName="brand-name" priority />
        <HomepageNavigation />
        <Link className="minimal-home__header-login" href="/login">
          Iniciar sesión
        </Link>
      </header>

      <section
        className="minimal-home__hero"
        id="inicio"
        aria-labelledby="hero-title"
      >
        <div className="minimal-home__hero-copy">
          <div>
            <div className="minimal-home__hero-title-wrap">
              <h1 id="hero-title">
                Decide antes
                <span>de actuar.</span>
              </h1>
            </div>
            <p className="minimal-home__hero-description">
              Explora escenarios, compara alternativas y entiende sus posibles consecuencias antes de tomar una decisión.
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
            className="minimal-home__preview-block"
            data-home-assembly-group="preview"
            data-home-assembly-settle-ms="1200"
            data-home-assembly-settle-mobile-ms="1080"
            data-home-assembly-trigger="preview"
            data-home-motion-vector="right-to-left"
          >
            <div className="minimal-home__preview-note">
              <strong>Preview público</strong>
              <ul aria-label="Señales del producto" data-home-preview-phrases>
                {trustSignals.map((signal) => (
                  <li data-home-assembly-item key={signal}>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="minimal-home__simulator" id="simulador">
          <HomeSimulator />
        </div>
      </section>

      <section
        className="minimal-home__section"
        id="como-funciona"
        aria-labelledby="process-title"
        data-home-assembly-group="process-section"
        data-home-assembly-settle-ms="2280"
        data-home-assembly-settle-mobile-ms="680"
        data-home-assembly-trigger="section"
        data-home-motion-vector="right-to-left"
      >
        <div className="minimal-home__section-heading" data-home-process-narrative>
          <h2 data-home-process-narrative-item id="process-title">Cómo piensa Levio</h2>
          <p data-home-process-narrative-item>
            Levio analiza la situación, identifica la información relevante, compara escenarios, evalúa riesgos y organiza criterios de decisión.
          </p>
        </div>

        <div className="minimal-home__process-grid">
          {processSteps.map((step, index) => (
            <article
              className="minimal-home__process-card"
              data-home-assembly-item
              data-home-mobile-card="process"
              data-home-assembly-settle-mobile-ms="640"
              key={step.title}
            >
              <span className="minimal-home__step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="minimal-home__section minimal-home__capabilities"
        id="criterios"
        aria-labelledby="capabilities-title"
        data-home-assembly-group="capabilities-section"
        data-home-assembly-settle-ms="1120"
        data-home-assembly-settle-mobile-ms="680"
        data-home-assembly-trigger="section"
        data-home-motion-vector="right-to-left"
      >
        <div className="minimal-home__section-heading" data-home-assembly-item>
          <h2 id="capabilities-title">Qué obtienes con Levio</h2>
        </div>

        <div className="minimal-home__capability-grid">
          {capabilities.map((capability) => (
            <article
              className="minimal-home__capability-card"
              data-home-assembly-item
              data-home-mobile-card="capability"
              data-home-assembly-settle-mobile-ms="640"
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
        data-home-assembly-settle-ms="820"
        data-home-assembly-settle-mobile-ms="680"
        data-home-assembly-trigger="final-cta"
        data-home-motion-vector="right-to-left"
      >
        <div>
          <h2 id="final-cta-title" aria-label="Empieza con una decisión real.">
            {finalHeadlineClusters.map((cluster) => (
              <span
                aria-hidden="true"
                className="minimal-home__cta-cluster"
                key={cluster}
              >
                {cluster}
              </span>
            ))}
          </h2>
          <p>
            Explora escenarios, riesgos y consecuencias antes de actuar.
          </p>
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
          <BrandLockup ariaLabel="levio.es" nameClassName="brand-name" />
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
