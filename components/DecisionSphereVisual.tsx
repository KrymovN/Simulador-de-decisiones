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
            <radialGradient id="levio-core" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#fffdf0" />
              <stop offset="12%" stopColor="#fff0aa" stopOpacity="0.98" />
              <stop offset="36%" stopColor="#ffca55" stopOpacity="0.86" />
              <stop offset="68%" stopColor="#8a501c" stopOpacity="0.54" />
              <stop offset="100%" stopColor="#120b04" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="levio-focus" cx="47%" cy="42%" r="64%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="22%" stopColor="#fff4c9" />
              <stop offset="58%" stopColor="#ffd36a" />
              <stop offset="100%" stopColor="#c77b25" />
            </radialGradient>
            <linearGradient id="levio-ring" x1="28%" x2="78%" y1="18%" y2="82%">
              <stop offset="0%" stopColor="#fff5c9" stopOpacity="0.98" />
              <stop offset="48%" stopColor="#ffd36a" stopOpacity="0.86" />
              <stop offset="100%" stopColor="#b56d27" stopOpacity="0.54" />
            </linearGradient>
          </defs>
          <circle className={styles.halo} cx="160" cy="160" r="101" />
          <circle className={styles.outerTrace} cx="160" cy="160" r="136" />
          <circle className={styles.outerRing} cx="160" cy="160" r="116" />
          <circle className={styles.secondaryRing} cx="160" cy="160" r="100" />
          <circle className={styles.midRing} cx="160" cy="160" r="86" />
          <circle className={styles.nearRing} cx="160" cy="160" r="68" />
          <ellipse className={styles.outerDecisionPlane} cx="160" cy="160" rx="139" ry="51" />
          <ellipse className={styles.decisionPlane} cx="160" cy="160" rx="118" ry="38" />
          <ellipse className={styles.innerDecisionPlane} cx="160" cy="160" rx="91" ry="26" />
          <circle className={styles.core} cx="160" cy="160" r="61" />
          <circle className={styles.coreRing} cx="160" cy="160" r="43" />
          <circle className={styles.innerCore} cx="160" cy="160" r="18" />
          <circle className={styles.focus} cx="160" cy="160" r="8" />
          <path
            className={styles.signalLine}
            d="M81 184c34 20 70 28 109 16 22-7 40-20 57-38"
          />
          <path
            className={styles.signalLineMuted}
            d="M91 131c37-16 78-17 121-2 17 6 31 14 44 25"
          />
          <path
            className={styles.trajectory}
            d="M42 206c34-54 82-88 143-101 34-8 66-8 96-2"
          />
          <path
            className={styles.trajectoryMuted}
            d="M57 93c41 17 79 50 113 98 20 27 36 52 52 73"
          />
          <path
            className={styles.trajectoryFine}
            d="M84 253c26-31 57-55 95-74 24-12 48-23 71-39"
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
