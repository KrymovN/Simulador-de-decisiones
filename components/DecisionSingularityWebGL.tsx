"use client";

import styles from "./DecisionSingularityWebGL.module.css";

const forecastCards = [
  {
    className: styles.forecastOpportunity,
    label: "Ventaja",
    value: "68%",
  },
  {
    className: styles.forecastRisk,
    label: "Riesgo",
    value: "42%",
  },
  {
    className: styles.forecastLatency,
    label: "Latencia",
    value: "3 meses",
  },
  {
    className: styles.forecastOutcome,
    label: "Ruta",
    value: "Alta claridad",
  },
];

const orbitMarkers = [
  styles.marker0,
  styles.marker1,
  styles.marker2,
  styles.marker3,
  styles.marker4,
  styles.marker5,
  styles.marker6,
  styles.marker7,
  styles.marker8,
  styles.marker9,
];

export default function DecisionSingularityWebGL() {
  return (
    <main className={styles.labShell}>
      <section className={styles.hero} aria-labelledby="visual-lab-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Stage 2.7.3b · sandbox visual</p>
          <h1 id="visual-lab-title">Levio Visual Lab</h1>
          <p>
            Prototipo aislado con esfera viva, señales de pronóstico y movimiento
            calmado sobre una identidad black-gold.
          </p>
        </div>

        <div className={styles.stage} aria-label="Sandbox visual de esfera predictiva Levio">
          <div className={styles.field} aria-hidden="true">
            <span className={styles.outerHalo} />
            <span className={styles.deepOrbit} />
            <span className={styles.midOrbit} />
            <span className={styles.innerOrbit} />
            <span className={styles.lightPlane} />
            <span className={styles.livingSphere} />
            <span className={styles.coreGlow} />
            <span className={styles.blackCore} />
            <span className={styles.energyBreath} />
            <span className={styles.softSweep} />
            {orbitMarkers.map((markerClass) => (
              <span className={`${styles.orbitMarker} ${markerClass}`} key={markerClass} />
            ))}
          </div>

          <div className={styles.forecastLayer} aria-label="Señales de pronóstico">
            {forecastCards.map((card) => (
              <article className={`${styles.forecastCard} ${card.className}`} key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
