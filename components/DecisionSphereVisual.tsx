import styles from "./DecisionSphereVisual.module.css";

const intelligenceSignals = [
  { label: "Riesgo", value: "42%" },
  { label: "Ventaja", value: "68%" },
  { label: "Latencia", value: "3 meses" },
];

type DecisionSphereVisualProps = {
  ariaLabel?: string;
};

export default function DecisionSphereVisual({
  ariaLabel = "Visual predictivo de esfera Levio",
}: DecisionSphereVisualProps) {
  return (
    <div className={styles.stage} aria-label={ariaLabel} role="img">
      <div className={styles.panel}>
        <svg className={styles.mark} viewBox="0 0 320 320" aria-hidden="true">
          <defs>
            <radialGradient id="levio-core" cx="50%" cy="50%" r="58%">
              <stop offset="0%" stopColor="#fff3c8" stopOpacity="0.92" />
              <stop offset="38%" stopColor="#d8a84a" stopOpacity="0.38" />
              <stop offset="74%" stopColor="#050403" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="levio-ring" x1="28%" x2="78%" y1="18%" y2="82%">
              <stop offset="0%" stopColor="#fff0bd" stopOpacity="0.88" />
              <stop offset="48%" stopColor="#d8a84a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7a5123" stopOpacity="0.42" />
            </linearGradient>
          </defs>
          <circle className={styles.outerRing} cx="160" cy="160" r="116" />
          <circle className={styles.midRing} cx="160" cy="160" r="86" />
          <ellipse className={styles.decisionPlane} cx="160" cy="160" rx="118" ry="38" />
          <circle className={styles.core} cx="160" cy="160" r="47" />
          <circle className={styles.innerCore} cx="160" cy="160" r="22" />
          <path
            className={styles.signalLine}
            d="M81 184c34 20 70 28 109 16 22-7 40-20 57-38"
          />
          <path
            className={styles.signalLineMuted}
            d="M91 131c37-16 78-17 121-2 17 6 31 14 44 25"
          />
        </svg>

        <div className={styles.signalGrid} aria-label="Señales de inteligencia">
          {intelligenceSignals.map((signal) => (
            <div className={styles.signalCard} key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
