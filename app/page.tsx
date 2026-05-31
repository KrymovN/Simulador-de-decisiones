import Link from "next/link";
import DecisionSphereVisual from "../components/DecisionSphereVisual";
import HomeSimulator from "../components/HomeSimulator";
import LevioMark from "../components/LevioMark";

const processSteps = [
  {
    title: "Describe tu situación",
    copy: "Cuéntanos tu decisión, dilema o situación actual con tus propias palabras.",
    icon: "describe",
  },
  {
    title: "Levio analiza",
    copy: "La IA interpreta factores, contexto y variables relevantes.",
    icon: "analyze",
  },
  {
    title: "Simulación de escenarios",
    copy: "Generamos rutas posibles con consecuencias, riesgos y oportunidades.",
    icon: "scenarios",
  },
  {
    title: "Decide con claridad",
    copy: "Recibe una recomendación estratégica y elige el camino más sólido.",
    icon: "target",
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
    copy: "IA que entiende contexto, emociones y objetivos.",
    icon: "analysis",
  },
  {
    title: "Escenarios múltiples",
    copy: "Simula distintos futuros posibles y sus resultados.",
    icon: "paths",
  },
  {
    title: "Evaluación de riesgos",
    copy: "Detecta riesgos ocultos y oportunidades reales.",
    icon: "risk",
  },
  {
    title: "Decisiones estratégicas",
    copy: "Recomendaciones claras para cada escenario.",
    icon: "target",
  },
];

const lowerCapabilities = [
  {
    title: "Análisis profundo",
    copy: "Comprende tu situación más allá de las palabras y detecta los factores que realmente importan.",
    icon: "deep",
  },
  {
    title: "Evaluación de riesgos",
    copy: "Identifica riesgos visibles y ocultos antes de comprometer tiempo, recursos o energía.",
    icon: "risk",
  },
  {
    title: "Escenarios futuros",
    copy: "Compara rutas posibles y observa cómo puede evolucionar cada decisión.",
    icon: "future",
  },
  {
    title: "Recomendación estratégica",
    copy: "Convierte el análisis en una conclusión clara, sobria y accionable.",
    icon: "strategy",
  },
];

const footerColumns = [
  {
    title: "Producto",
    links: [
      { label: "Simulador", href: "#decision-input" },
      { label: "Escenarios", href: "#escenarios" },
      { label: "Riesgos", href: "#motor" },
      { label: "Ventajas", href: "#producto" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Levio", href: "#producto" },
      { label: "Privacidad", href: "/dashboard/privacy" },
      { label: "Términos", href: "/dashboard/privacy" },
      { label: "Contacto", href: "mailto:hola@levio.es" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { label: "Iniciar sesión", href: "/login" },
      { label: "Mi espacio", href: "/dashboard" },
      { label: "Configuración", href: "/dashboard/profile" },
    ],
  },
];

type ReferenceIconName =
  | "describe"
  | "analyze"
  | "scenarios"
  | "target"
  | "deep"
  | "risk"
  | "future"
  | "strategy";

function ReferenceIcon({ name }: { name: ReferenceIconName }) {
  const sharedProps = {
    "aria-hidden": true,
    className: "reference-line-icon",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 64 64",
  };

  if (name === "describe") {
    return (
      <svg {...sharedProps}>
        <path d="M14 14h36v26H29L18 50V40h-4z" />
        <path d="M22 23h20M22 30h14" />
        <circle cx="42" cy="38" r="5" />
        <path d="m45.5 41.5 5 5" />
      </svg>
    );
  }

  if (name === "analyze") {
    return (
      <svg {...sharedProps}>
        <path d="M19 13h-6v8M45 13h6v8M19 51h-6v-8M45 51h6v-8" />
        <circle cx="32" cy="32" r="14" />
        <circle cx="32" cy="32" r="5" />
      </svg>
    );
  }

  if (name === "scenarios") {
    return (
      <svg {...sharedProps}>
        <path d="M14 32h14M28 32l11-16M28 32l11 16M39 16h11M39 48h11" />
        <circle cx="12" cy="32" r="5" />
        <circle cx="44" cy="16" r="5" />
        <circle cx="44" cy="48" r="5" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg {...sharedProps}>
        <circle cx="30" cy="34" r="19" />
        <circle cx="30" cy="34" r="10" />
        <circle cx="30" cy="34" r="3" />
        <path d="m32 32 18-18M43 14h7v7" />
      </svg>
    );
  }

  if (name === "deep") {
    return (
      <svg {...sharedProps}>
        <circle cx="32" cy="32" r="22" />
        <circle cx="32" cy="32" r="12" />
        <circle cx="32" cy="32" r="3" />
        <path d="M32 6v7M32 51v7M6 32h7M51 32h7" />
      </svg>
    );
  }

  if (name === "risk") {
    return (
      <svg {...sharedProps}>
        <path d="M32 7c7 5 14 7 21 8v15c0 14-8 22-21 28C19 52 11 44 11 30V15c7-1 14-3 21-8Z" />
        <path d="m23 31 6 6 13-14" />
      </svg>
    );
  }

  if (name === "future") {
    return (
      <svg {...sharedProps}>
        <path d="M12 32h18M30 32l12-16M30 32l12 16M42 16h10M42 48h10" />
        <circle cx="12" cy="32" r="4" />
        <circle cx="48" cy="16" r="4" />
        <circle cx="48" cy="48" r="4" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M11 48 24 34l9 7 18-24" />
      <path d="M40 17h11v11M12 54h40" />
      <path d="M16 43h-5M25 36h-7M36 40h-7" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header section-frame reference-header">
        <Link className="brand-lockup" href="/" aria-label="levio.es">
          <LevioMark size="lg" />
          <span className="brand-name">LEVIO</span>
        </Link>
        <nav className="site-nav reference-nav" aria-label="Acceso principal">
          {navItems.map((item) => (
            <Link className={item.active ? "nav-active" : undefined} href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
          <Link className="nav-cta" href="/login">Iniciar sesión</Link>
        </nav>
      </header>

      <section className="hero-section section-frame home-hero reference-hero" aria-labelledby="hero-title">
        <div className="hero-copy home-hero-copy">
          <p className="eyebrow brand-mark">LEVIO</p>
          <h1 id="hero-title">
            Simula.<br />
            Entiende.
            <span>Decide con claridad.</span>
          </h1>
          <p className="hero-subtitle">
            Levio es un sistema de inteligencia que simula escenarios, analiza
            riesgos, evalúa consecuencias y te ayuda a tomar mejores decisiones.
          </p>

          <div className="hero-actions home-hero-actions" aria-label="Accesos principales">
            <a className="button-link" href="#decision-input">
              Comenzar simulación
            </a>
            <a className="button-link secondary-button" href="#producto">
              Ver cómo funciona
            </a>
          </div>
        </div>

        <aside className="hero-intelligence-panel" aria-label="Modelo visual de inteligencia de decisión">
          <div className="ai-core-stage" aria-label="Visual predictivo de Levio">
            <DecisionSphereVisual ariaLabel="Símbolo visual de inteligencia de decisión Levio" />
          </div>
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

      </section>

      <section className="reference-process" id="motor" aria-labelledby="process-title">
        <div className="reference-section-heading">
          <p className="eyebrow">¿Cómo funciona Levio?</p>
          <h2 id="process-title">Un proceso inteligente en 4 pasos</h2>
          <span aria-hidden="true"></span>
        </div>

        <div className="reference-process-grid">
          {processSteps.map((step, index) => (
            <article className="reference-process-card" key={step.title}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <ReferenceIcon name={step.icon as ReferenceIconName} />
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              {index < processSteps.length - 1 && <span className="reference-process-connector" aria-hidden="true"></span>}
            </article>
          ))}
        </div>
      </section>

      <section className="reference-capabilities" id="producto" aria-labelledby="capabilities-title">
        <div className="reference-section-heading compact-heading">
          <p className="eyebrow" id="capabilities-title">Inteligencia que ve lo que otros no ven</p>
        </div>

        <div className="reference-capability-grid">
          {lowerCapabilities.map((capability) => (
            <article className="reference-capability-card" key={capability.title}>
              <ReferenceIcon name={capability.icon as ReferenceIconName} />
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reference-cta-banner" aria-labelledby="reference-cta-title">
        <div className="reference-cta-orbit" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div>
          <h2 id="reference-cta-title">¿Listo para tomar mejores decisiones?</h2>
          <p>Comienza tu primera simulación ahora.</p>
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
            <span className="brand-name">LEVIO</span>
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

        <div className="reference-footer-social" aria-label="Redes sociales">
          <span aria-label="X">X</span>
          <span aria-label="Instagram">◎</span>
          <span aria-label="Correo">✉</span>
        </div>
      </footer>

      <section className="reference-workspace" id="escenarios" aria-labelledby="workspace-title">
        <div className="reference-workspace-heading">
          <p className="eyebrow">Workspace Levio</p>
          <h2 id="workspace-title">Simula una decisión cuando estés listo.</h2>
          <p>El motor de escenarios permanece disponible como área de trabajo separada del landing.</p>
        </div>
        <HomeSimulator />
      </section>
    </main>
  );
}
