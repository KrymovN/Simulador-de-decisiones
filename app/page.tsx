const engineSteps = [
  "Situación",
  "Análisis",
  "Escenarios",
  "Riesgos",
  "Conclusión estratégica",
];

const scenarioCards = [
  {
    label: "Escenario optimista",
    title: "La decisión abre tracción",
    copy: "El sistema proyecta una cadena de ventajas si actúas en el momento adecuado y proteges los puntos sensibles.",
    signal: "Probabilidad alta",
  },
  {
    label: "Escenario de riesgo",
    title: "La presión se acumula",
    copy: "levio.es detecta fricción operativa, desgaste emocional y costes invisibles que pueden aparecer tarde.",
    signal: "Riesgo medio",
  },
  {
    label: "Consecuencia retrasada",
    title: "El efecto real llega después",
    copy: "Algunas decisiones no fallan de inmediato. El motor revela impactos que emergen semanas o meses después.",
    signal: "Latencia crítica",
  },
  {
    label: "Alternativa estratégica",
    title: "Una ruta más inteligente",
    copy: "La simulación propone un movimiento menos obvio, con menor exposición y mejor posición futura.",
    signal: "Ventaja oculta",
  },
];

const analysisBlocks = [
  "Riesgos",
  "Ventajas",
  "Impacto emocional",
  "Impacto financiero",
  "Impacto estratégico",
];

const accountFeatures = [
  "Historial de simulaciones",
  "Decisiones guardadas",
  "Perfil del usuario",
  "Patrones de decisiones",
  "Memoria personalizada de IA",
];

const futureLanguages = [
  "Español",
  "English",
  "Ucraniano",
  "Ruso",
  "Árabe",
  "Chino",
  "Francés",
  "Alemán",
  "Portugués",
  "Italiano",
];

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero-section section-frame" aria-labelledby="hero-title">
        <div className="hero-atmosphere" aria-hidden="true">
          <span className="particle particle-a"></span>
          <span className="particle particle-b"></span>
          <span className="particle particle-c"></span>
          <span className="particle particle-d"></span>
        </div>

        <div className="hero-copy">
          <p className="eyebrow brand-mark">levio.es / Motor de simulación estratégica</p>
          <h1 id="hero-title">Simula tu decisión antes de vivir sus consecuencias.</h1>
          <p className="hero-subtitle">
            No es un chat. Es un motor de IA que modela escenarios futuros,
            riesgos, beneficios, consecuencias retrasadas y rutas estratégicas
            antes de actuar.
          </p>

          <div className="decision-console" aria-label="Simulador inicial de decisión">
            <label htmlFor="decision-input">Describe la situación que quieres simular</label>
            <div className="input-row">
              <textarea
                id="decision-input"
                placeholder="Ejemplo: aceptar una oferta, lanzar un producto, cambiar de país, invertir en una nueva dirección..."
              />
              <button type="button">Simular decisión</button>
            </div>
            <div className="console-status" aria-hidden="true">
              <span></span>
              <p>Motor preparando escenarios, riesgos y consecuencias latentes</p>
            </div>
          </div>
        </div>

        <div className="ai-core-stage" aria-label="Visualización del núcleo de decisión">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="orbit orbit-three"></div>
          <div className="core-ring">
            <div className="core-pulse"></div>
            <div className="core-eye"></div>
          </div>
          <div className="core-metric metric-one">
            <span>Riesgo</span>
            <strong>42%</strong>
          </div>
          <div className="core-metric metric-two">
            <span>Ventaja</span>
            <strong>68%</strong>
          </div>
          <div className="core-metric metric-three">
            <span>Latencia</span>
            <strong>3 meses</strong>
          </div>
        </div>
      </section>

      <section className="story-section two-column section-frame" aria-labelledby="what-title">
        <div>
          <p className="eyebrow">Qué es la plataforma</p>
          <h2 id="what-title">Pensamiento visual para decisiones que importan.</h2>
        </div>
        <div className="text-stack">
          <p>
            levio.es no responde como un chatbot. No intenta sonar humano ni
            improvisar consejos. Observa una situación, la descompone y proyecta
            caminos posibles.
          </p>
          <p>
            Cada simulación muestra cómo una decisión puede evolucionar: lo que
            ganas, lo que arriesgas, lo que se retrasa y lo que tal vez no estás
            viendo todavía.
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
            <article className="scenario-card" key={card.label}>
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
          <h2 id="analysis-title">No basta con saber si algo conviene. Hay que saber que transforma.</h2>
          <div className="analysis-grid">
            {analysisBlocks.map((block) => (
              <div className="analysis-chip" key={block}>
                {block}
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
          <div className="profile-panel">
            <div className="profile-orb"></div>
            <h3>Cuenta personal levio.es</h3>
            <p>
              Los futuros usuarios podrán crear su perfil, elegir idioma,
              guardar simulaciones y construir una memoria estratégica propia.
            </p>
          </div>
          <div className="feature-list">
            {accountFeatures.map((feature) => (
              <div key={feature}>{feature}</div>
            ))}
          </div>
        </div>

        <div className="language-strip" aria-label="Idiomas preparados para futuras cuentas">
          {futureLanguages.map((language) => (
            <span key={language}>{language}</span>
          ))}
        </div>
      </section>

      <section className="mobile-section section-frame" aria-labelledby="mobile-title">
        <div className="phone-visual" aria-hidden="true">
          <div className="phone-screen">
            <span></span>
            <strong>Continuidad</strong>
            <p>Simulación sincronizada</p>
          </div>
        </div>
        <div>
          <p className="eyebrow">Ecosistema móvil</p>
          <h2 id="mobile-title">Decisiones complejas, disponibles donde ocurre la vida.</h2>
          <p>
            La evolución natural de levio.es conecta escritorio, móvil y cuenta
            personal con sincronización multiplataforma, continuidad entre
            dispositivos y futuras apps para App Store y Google Play.
          </p>
        </div>
      </section>

      <section className="final-cta section-frame" aria-labelledby="final-title">
        <p className="eyebrow">Antes de actuar</p>
        <h2 id="final-title">Explora escenarios, riesgos, beneficios y consecuencias antes de decidir.</h2>
        <a href="#decision-input">Iniciar una simulación</a>
      </section>
    </main>
  );
}
