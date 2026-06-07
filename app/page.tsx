import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import HomeSimulator from "../components/HomeSimulator";
import LevioMark from "../components/LevioMark";

const processSteps = [
  {
    title: "Describe tu situación",
    copy: "Cuéntanos tu decisión, dilema o situación actual con tus propias palabras.",
  },
  {
    title: "Levio analiza",
    copy: "Levio detecta contexto, señales clave y variables que pueden cambiar el resultado.",
  },
  {
    title: "Simulación de escenarios",
    copy: "Generamos rutas posibles con consecuencias, riesgos y oportunidades.",
  },
  {
    title: "Decide con claridad",
    copy: "Recibe una recomendación estratégica y elige el camino más sólido.",
  },
];

const navItems = [
  { label: "Inicio", href: "/", active: true },
  { label: "Simulador", href: "#decision-input" },
  { label: "Escenarios", href: "#escenarios" },
  { label: "Riesgos", href: "#motor" },
  { label: "Ventajas", href: "#producto" },
  { label: "Mi espacio", href: "/dashboard" },
];

const heroFeatures = [
  {
    title: "Análisis profundo",
    copy: "Contexto, objetivos, presión emocional y señales que pueden cambiar el resultado.",
  },
  {
    title: "Escenarios múltiples",
    copy: "Compara rutas posibles antes de comprometer tiempo, dinero o reputación.",
  },
  {
    title: "Evaluación de riesgos",
    copy: "Distingue riesgos visibles, riesgos ocultos y consecuencias aplazadas.",
  },
  {
    title: "Decisiones estratégicas",
    copy: "Convierte el análisis en una recomendación sobria, clara y accionable.",
  },
];

const lowerCapabilities = [
  {
    title: "Inteligencia contextual",
    copy: "Lee la situación completa: intereses, restricciones, personas afectadas y momento de decisión.",
  },
  {
    title: "Análisis emocional",
    copy: "Evalúa presión, coste emocional y posibles efectos en relaciones, energía y confianza.",
  },
  {
    title: "Riesgos ocultos",
    copy: "Señala fricciones, dependencias y costes futuros que suelen aparecer demasiado tarde.",
  },
  {
    title: "Ventajas estratégicas",
    copy: "Detecta caminos con mejor relación entre oportunidad, exposición y capacidad real de ejecución.",
  },
];

const trustSignals = [
  "Sin conversación vacía",
  "Escenarios comparables",
  "Riesgo y consecuencia",
];

const decisionIntelligence = [
  {
    label: "Escenarios",
    title: "No una respuesta. Un mapa de futuros posibles.",
    copy: "Levio organiza alternativas y muestra cómo puede evolucionar cada ruta si actúas ahora, esperas o cambias de estrategia.",
  },
  {
    label: "Consecuencias",
    title: "Efectos inmediatos y efectos que llegan después.",
    copy: "Cada decisión puede abrir beneficios rápidos y costes diferidos. El sistema ayuda a ver ambos antes de decidir.",
  },
  {
    label: "Riesgo",
    title: "Señales débiles antes de que se conviertan en problemas.",
    copy: "Identifica incertidumbre, dependencia de terceros, presión emocional y puntos donde una decisión puede volverse frágil.",
  },
  {
    label: "Criterio",
    title: "Una recomendación que no sustituye tu juicio.",
    copy: "La salida está pensada para ayudarte a pensar con más claridad, no para empujarte a una respuesta automática.",
  },
];

const footerColumns = [
  {
    title: "Producto",
    links: [
      { label: "Simulador", href: "#decision-input" },
      { label: "Escenarios", href: "#escenarios" },
      { label: "Riesgos", href: "#motor" },
    ],
  },
  {
    title: "Acceso",
    links: [
      { label: "Iniciar sesión", href: "/login" },
      { label: "Mi espacio", href: "/dashboard" },
    ],
  },
  {
    title: "Confianza",
    links: [
      { label: "Privacidad", href: "/dashboard/privacy" },
      { label: "Contacto", href: "mailto:hola@levio.es" },
    ],
  },
];

function MotionLetters({ text }: { text: string }) {
  return (
    <span className="motion-letters" aria-hidden="true">
      {text.split(" ").map((word, wordIndex) => (
        <span className="motion-word" key={`${word}-${wordIndex}`}>
          {Array.from(word).map((character, characterIndex) => (
            <span
              className={(wordIndex + characterIndex) % 2 === 0 ? "motion-letter motion-letter-left" : "motion-letter motion-letter-right"}
              key={`${character}-${characterIndex}`}
              style={{ "--motion-index": characterIndex } as CSSProperties}
            >
              {character}
            </span>
          ))}
          {wordIndex < text.split(" ").length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header section-frame reference-header">
        <Link className="brand-lockup" href="/" aria-label="levio.es">
          <LevioMark size="lg" />
          <span className="brand-name">levio.es</span>
        </Link>
        <nav className="site-nav reference-nav" aria-label="Acceso principal">
          {navItems.map((item) => (
            <Link className={item.active ? "nav-active" : undefined} href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
          <Link className="nav-cta" href="/login">
            Iniciar sesión
          </Link>
        </nav>
      </header>

      <section className="hero-section section-frame home-hero reference-hero" aria-labelledby="hero-title">
        <div className="hero-approved-background" aria-hidden="true">
          <Image
            className="hero-approved-background-image"
            src="/hero-approved-network-bg.png"
            alt=""
            fill
            priority
            quality={100}
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="hero-approved-pulse-layer" aria-hidden="true">
          <svg focusable="false" viewBox="0 0 160 160">
            <defs>
              <radialGradient id="hero-approved-core-gradient" cx="50%" cy="48%" r="58%">
                <stop offset="0%" stopColor="#fff1bd" />
                <stop offset="36%" stopColor="#d8a84a" stopOpacity="0.92" />
                <stop offset="70%" stopColor="#ffb23e" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#8a5a24" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hero-approved-breath-gradient" cx="50%" cy="50%" r="62%">
                <stop offset="0%" stopColor="#fff1bd" stopOpacity="0.32" />
                <stop offset="42%" stopColor="#d8a84a" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#8a5a24" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle className="hero-approved-wave-ring hero-approved-wave-primary" cx="80" cy="80" r="31" />
            <circle className="hero-approved-wave-ring hero-approved-wave-secondary" cx="80" cy="80" r="48" />
            <ellipse className="hero-approved-distortion-ring hero-approved-distortion-a" cx="80" cy="80" rx="43" ry="22" />
            <ellipse className="hero-approved-distortion-ring hero-approved-distortion-b" cx="80" cy="80" rx="24" ry="40" />
            <circle className="hero-approved-core-breath" cx="80" cy="80" fill="url(#hero-approved-breath-gradient)" r="38" />
            <g className="hero-approved-core-pulse">
              <circle cx="80" cy="80" fill="url(#hero-approved-core-gradient)" r="20" />
              <circle className="hero-approved-core-ring" cx="80" cy="80" r="13" />
              <circle className="hero-approved-core-center" cx="80" cy="80" r="5.2" />
              <circle className="hero-approved-inner-spark" cx="80" cy="80" r="2.4" />
            </g>
          </svg>
        </div>

        <div className="hero-copy home-hero-copy">
          <div className="hero-intro">
            <h1 className="hero-motion-title" id="hero-title">
              Decide antes
              <span>de actuar.</span>
            </h1>
            <p className="hero-subtitle">
              Analiza escenarios, riesgos y consecuencias antes de tomar una decisión.
            </p>
          </div>

          <div className="hero-actions home-hero-actions" aria-label="Accesos principales">
            <a className="button-link" href="#decision-input">
              Comenzar simulación
            </a>
            <a className="button-link secondary-button" href="#producto">
              Ver cómo funciona
            </a>
          </div>

          <ul className="hero-proof-list" aria-label="Señales del producto">
            {trustSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>

        <div className="hero-feature-strip" aria-label="Capacidades principales">
          {heroFeatures.map((feature, index) => (
            <article
              className="hero-feature-card"
              key={feature.title}
              style={{ "--card-index": index } as CSSProperties}
            >
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            </article>
          ))}
        </div>

      </section>

      <section className="reference-decision-system" aria-labelledby="decision-system-title">
        <div className="reference-section-heading">
          <p className="eyebrow motion-heading-line" aria-label="Inteligencia de decisión con IA">
            <MotionLetters text="Inteligencia de decisión con IA" />
          </p>
          <h2
            className="motion-heading-line"
            id="decision-system-title"
            aria-label="Pensado para decisiones con consecuencias reales."
          >
            <MotionLetters text="Pensado para decisiones con consecuencias reales." />
          </h2>
          <span aria-hidden="true"></span>
        </div>

        <div className="reference-system-grid">
          {decisionIntelligence.map((item, index) => (
            <article
              className="reference-system-card"
              key={item.title}
              style={{ "--card-index": index } as CSSProperties}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{item.label}</strong>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reference-process" id="motor" aria-labelledby="process-title">
        <div className="reference-section-heading">
          <p className="eyebrow motion-heading-line" aria-label="¿Cómo funciona Levio.es?">
            <MotionLetters text="¿Cómo funciona Levio.es?" />
          </p>
          <h2 className="motion-heading-line" id="process-title" aria-label="Un proceso inteligente en 4 pasos">
            <MotionLetters text="Un proceso inteligente en 4 pasos" />
          </h2>
          <span aria-hidden="true"></span>
        </div>

        <div className="reference-process-grid">
          {processSteps.map((step, index) => (
            <article
              className="reference-process-card"
              key={step.title}
              style={{ "--card-index": index } as CSSProperties}
            >
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reference-capabilities" id="producto" aria-labelledby="capabilities-title">
        <div className="reference-section-heading compact-heading">
          <p className="eyebrow" id="capabilities-title">Inteligencia que ve lo que otros no ven</p>
        </div>

        <div className="reference-capability-grid">
          {lowerCapabilities.map((capability, index) => (
            <article
              className="reference-capability-card"
              key={capability.title}
              style={{ "--card-index": index } as CSSProperties}
            >
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reference-workspace" id="escenarios" aria-labelledby="workspace-title">
        <div className="reference-workspace-heading">
          <p className="eyebrow">Área de trabajo levio.es</p>
          <h2 id="workspace-title">Simula una decisión cuando estés listo.</h2>
          <p>El motor de escenarios permanece disponible como área de análisis separada de la presentación principal.</p>
        </div>
        <HomeSimulator />
      </section>

      <section className="reference-cta-banner" aria-labelledby="reference-cta-title">
        <div>
          <h2 id="reference-cta-title">Empieza con una decisión real.</h2>
          <p>Levio.es simulará escenarios, riesgos y consecuencias antes de que actúes.</p>
        </div>
        <a href="#decision-input">
          Comenzar ahora
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="reference-footer">
        <div className="reference-footer-brand">
          <Link className="brand-lockup" href="/" aria-label="levio.es">
            <LevioMark size="md" />
            <span className="brand-name">levio.es</span>
          </Link>
          <p>Inteligencia estratégica para decisiones con consecuencias reales.</p>
          <small>© 2026 Levio.es. Todos los derechos reservados.</small>
        </div>

        {footerColumns.map((column) => (
          <div className="reference-footer-column" key={column.title}>
            <strong>{column.title}</strong>
            {column.links.map((link) => (
              <Link href={link.href} key={link.label}>{link.label}</Link>
            ))}
          </div>
        ))}
      </footer>
    </main>
  );
}
