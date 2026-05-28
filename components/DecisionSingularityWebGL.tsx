"use client";

import DecisionSphereVisual from "./DecisionSphereVisual";
import styles from "./DecisionSingularityWebGL.module.css";

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

        <DecisionSphereVisual ariaLabel="Sandbox visual de esfera predictiva Levio" />
      </section>
    </main>
  );
}
