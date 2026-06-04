import Link from "next/link";
import Image from "next/image";
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
    copy: "Levio detecta contexto, señales clave y variables que pueden cambiar el resultado.",
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
  { label: "Inicio", href: "/", active: true, icon: "home" },
  { label: "Simulador", href: "#decision-input", icon: "simulator" },
  { label: "Escenarios", href: "#escenarios", icon: "scenarios" },
  { label: "Riesgos", href: "#motor", icon: "risk" },
  { label: "Ventajas", href: "#producto", icon: "advantage" },
  { label: "Mi espacio", href: "/dashboard", icon: "space" },
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
    title: "Inteligencia contextual",
    copy: "Comprende tu situación más allá de las palabras y detecta factores que realmente importan.",
    icon: "deep",
  },
  {
    title: "Riesgos invisibles",
    copy: "Identifica riesgos que no aparecen a simple vista antes de comprometer tiempo o recursos.",
    icon: "risk",
  },
  {
    title: "Escenarios futuros",
    copy: "Compara rutas posibles y observa cómo puede evolucionar cada decisión.",
    icon: "future",
  },
  {
    title: "Recomendación accionable",
    copy: "Convierte el análisis en una conclusión clara, sobria y aplicable.",
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
      { label: "Sobre Levio.es", href: "#producto" },
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

type HeroFeatureIconName = "analysis" | "paths" | "risk" | "target";

function HeroFeatureIcon({ name }: { name: HeroFeatureIconName }) {
  const sharedProps = {
    "aria-hidden": true,
    className: "hero-feature-icon",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 64 64",
  };

  if (name === "analysis") {
    return (
      <svg {...sharedProps}>
        <circle cx="32" cy="32" r="21" strokeWidth="1.4" />
        <circle cx="32" cy="32" r="13" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="5" strokeWidth="2.2" />
        <path d="M32 8v7M32 49v7M8 32h7M49 32h7" strokeWidth="1.4" />
        <path d="m45 17 4-4M15 49l4-4" strokeWidth="1.4" />
      </svg>
    );
  }

  if (name === "paths") {
    return (
      <svg {...sharedProps}>
        <path d="M17 32h13M30 32l15-14M30 32l15 14" strokeWidth="1.8" />
        <circle cx="15" cy="32" r="5" strokeWidth="2" />
        <circle cx="47" cy="17" r="5" strokeWidth="2" />
        <circle cx="47" cy="47" r="5" strokeWidth="2" />
        <path d="M45 22v20" strokeWidth="1.2" opacity="0.72" />
      </svg>
    );
  }

  if (name === "risk") {
    return (
      <svg {...sharedProps}>
        <path d="M32 8c6.6 4.4 13.1 6.4 19 7.4v14.2c0 13.4-7.2 21.3-19 26.4-11.8-5.1-19-13-19-26.4V15.4C18.9 14.4 25.4 12.4 32 8Z" strokeWidth="1.8" />
        <path d="m23 32 6.2 6.2L42 25.8" strokeWidth="2.4" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M13 50h39" strokeWidth="1.6" />
      <path d="M18 45V33M29 45V26M40 45V20" strokeWidth="2.4" />
      <path d="m17 35 12-11 8 6 15-17" strokeWidth="2.2" />
      <path d="M44 13h8v8" strokeWidth="2.2" />
    </svg>
  );
}

function ReferenceIcon({ name }: { name: ReferenceIconName }) {
  const sharedProps = {
    "aria-hidden": true,
    className: "reference-line-icon",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.65,
    viewBox: "0 0 64 64",
  };

  if (name === "describe") {
    return (
      <svg {...sharedProps}>
        <path d="M14 15.5h34v24H29.2L18.5 49v-9.5H14z" />
        <path d="M22 23.5h17.5M22 30h13" />
        <circle cx="44.5" cy="37.5" r="4.8" />
        <path d="m48 41 4.8 4.8" />
        <path d="M47.5 16.5 52 12M52 12v6M52 12h-6" opacity="0.68" />
      </svg>
    );
  }

  if (name === "analyze") {
    return (
      <svg {...sharedProps}>
        <path d="M19 13h-6v8M45 13h6v8M19 51h-6v-8M45 51h6v-8" />
        <circle cx="32" cy="32" r="15.5" opacity="0.82" />
        <circle cx="32" cy="32" r="8.5" opacity="0.72" />
        <circle cx="32" cy="32" r="3.2" />
        <path d="M32 17v6M32 41v6M17 32h6M41 32h6" opacity="0.6" />
      </svg>
    );
  }

  if (name === "scenarios") {
    return (
      <svg {...sharedProps}>
        <path d="M17 32h12M29 32l13-15M29 32l13 15M42 17h8M42 47h8" />
        <circle cx="15" cy="32" r="4.7" />
        <circle cx="43" cy="17" r="4.7" />
        <circle cx="43" cy="47" r="4.7" />
        <path d="M50 17c3.6 3.8 5.5 8.7 5.5 15s-1.9 11.2-5.5 15" opacity="0.52" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg {...sharedProps}>
        <circle cx="30" cy="34" r="18.5" />
        <circle cx="30" cy="34" r="10" opacity="0.78" />
        <circle cx="30" cy="34" r="3" />
        <path d="m32 32 18-18M43.5 14H50v6.5" />
        <path d="M47 11.5 52.5 6M52.5 6v8M52.5 6h-8" opacity="0.55" />
      </svg>
    );
  }

  if (name === "deep") {
    return (
      <svg {...sharedProps}>
        <circle cx="32" cy="32" r="20.5" />
        <circle cx="32" cy="32" r="12.2" opacity="0.78" />
        <circle cx="32" cy="32" r="3.4" />
        <path d="M32 8v7M32 49v7M8 32h7M49 32h7" />
        <path d="m46 18 4-4M14 50l4-4" opacity="0.54" />
      </svg>
    );
  }

  if (name === "risk") {
    return (
      <svg {...sharedProps}>
        <path d="M32 7.5c6.7 4.8 13.4 6.8 20 7.8v14.8c0 13.8-7.7 21.7-20 27.4-12.3-5.7-20-13.6-20-27.4V15.3c6.6-1 13.3-3 20-7.8Z" />
        <path d="m23 31.2 6.2 6.2L42.5 24" />
        <path d="M22 17.5c3.7-1 7-2.4 10-4.3 3 1.9 6.3 3.3 10 4.3" opacity="0.48" />
      </svg>
    );
  }

  if (name === "future") {
    return (
      <svg {...sharedProps}>
        <path d="M15 32h14M29 32l12-14M29 32l12 14M41 18h9M41 46h9" />
        <circle cx="14" cy="32" r="4.4" />
        <circle cx="45" cy="18" r="4.4" />
        <circle cx="45" cy="46" r="4.4" />
        <path d="M15 23.5c6.7-8 17.3-10.6 26.8-6.3M15 40.5c6.7 8 17.3 10.6 26.8 6.3" opacity="0.5" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M11 48 24 34l9 7 18-24" />
      <path d="M40 17h11v11M12 54h40" />
      <path d="M16 43h-5M25 36h-7M36 40h-7" opacity="0.62" />
      <path d="M13 28h11M18.5 22.5v11" opacity="0.46" />
    </svg>
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
              <span className={`nav-glyph nav-glyph-${item.icon}`} aria-hidden="true"></span>
              {item.label}
            </Link>
          ))}
          <Link className="nav-cta" href="/login">
            <span className="nav-glyph nav-glyph-login" aria-hidden="true"></span>
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
          <h1 id="hero-title">
            Simula.<br />
            Entiende.
            <span>Decide con claridad.</span>
          </h1>
          <p className="hero-subtitle">
            Simula futuros posibles.<br />
            Detecta riesgos ocultos.<br />
            Elige con más claridad.
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

        <aside className="hero-intelligence-panel" aria-hidden="true">
          <div className="ai-core-stage"></div>
        </aside>

        <div className="hero-feature-strip" aria-label="Capacidades principales">
          {heroFeatures.map((feature) => (
            <article className={`hero-feature-card feature-${feature.icon}`} key={feature.title}>
              <span className="hero-feature-icon-shell" aria-hidden="true">
                <HeroFeatureIcon name={feature.icon as HeroFeatureIconName} />
              </span>
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
          <p className="eyebrow">¿Cómo funciona Levio.es?</p>
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

      <section className="reference-workspace" id="escenarios" aria-labelledby="workspace-title">
        <div className="reference-workspace-heading">
          <p className="eyebrow">Workspace levio.es</p>
          <h2 id="workspace-title">Simula una decisión cuando estés listo.</h2>
          <p>El motor de escenarios permanece disponible como área de trabajo separada del landing.</p>
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

        <div className="reference-footer-social" aria-label="Redes sociales">
          <span aria-label="X">X</span>
          <span aria-label="Instagram">◎</span>
          <span aria-label="Correo">✉</span>
        </div>
      </footer>
    </main>
  );
}
