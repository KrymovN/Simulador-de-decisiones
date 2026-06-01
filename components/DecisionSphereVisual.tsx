import styles from "./DecisionSphereVisual.module.css";

type DecisionSphereVisualProps = {
  ariaLabel?: string;
};

export default function DecisionSphereVisual({
  ariaLabel = "Visual predictivo de esfera Levio",
}: DecisionSphereVisualProps) {
  return (
    <div className={styles.stage} aria-label={ariaLabel} role="img">
      <svg className={styles.mark} viewBox="0 0 360 360" aria-hidden="true">
        <defs>
          <radialGradient id="levio-core" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="8%" stopColor="#fff8d0" />
            <stop offset="23%" stopColor="#ffc400" stopOpacity="0.98" />
            <stop offset="54%" stopColor="#d98700" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#120a00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="levio-focus" cx="47%" cy="42%" r="64%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#fff4ba" />
            <stop offset="68%" stopColor="#ffc400" />
            <stop offset="100%" stopColor="#d78300" />
          </radialGradient>
          <linearGradient id="levio-ring" x1="18%" x2="84%" y1="14%" y2="86%">
            <stop offset="0%" stopColor="#fff4a3" stopOpacity="0.98" />
            <stop offset="48%" stopColor="#ffc400" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#c97500" stopOpacity="0.68" />
          </linearGradient>
        </defs>
        <circle className={styles.halo} cx="180" cy="180" r="88" />
        <circle className={styles.outerTrace} cx="180" cy="180" r="168" />
        <circle className={styles.outerTraceDense} cx="180" cy="180" r="158" />
        <circle className={styles.outerRing} cx="180" cy="180" r="148" />
        <circle className={styles.ringDotted} cx="180" cy="180" r="138" />
        <circle className={styles.secondaryRing} cx="180" cy="180" r="127" />
        <circle className={styles.segmentedRing} cx="180" cy="180" r="116" />
        <circle className={styles.midRing} cx="180" cy="180" r="105" />
        <circle className={styles.precisionRing} cx="180" cy="180" r="95" />
        <circle className={styles.nearRing} cx="180" cy="180" r="82" />
        <circle className={styles.innerTrace} cx="180" cy="180" r="69" />
        <circle className={styles.microTrace} cx="180" cy="180" r="58" />
        <path
          className={styles.axisLines}
          d="M180 12v336M12 180h336M61 61l238 238M61 299 299 61M112 25l136 310M25 112l310 136M248 25 112 335M25 248l310-136"
        />
        <ellipse className={styles.decisionPlane} cx="180" cy="180" rx="164" ry="75" />
        <ellipse className={styles.decisionPlaneTilted} cx="180" cy="180" rx="151" ry="61" />
        <path className={styles.signalLine} d="M68 143c42-42 104-62 166-47 27 7 49 19 68 36" />
        <path className={styles.signalLineMuted} d="M61 219c48 39 105 53 164 38 28-7 52-21 73-42" />
        <path className={styles.trajectoryFine} d="M92 292c25-42 64-75 113-94 40-15 80-28 116-58" />
        <circle className={styles.primaryRing} cx="180" cy="180" r="95" />
        <circle className={styles.coreBoundary} cx="180" cy="180" r="70" />
        <circle className={styles.core} cx="180" cy="180" r="48" />
        <circle className={styles.coreRing} cx="180" cy="180" r="39" />
        <circle className={styles.innerCore} cx="180" cy="180" r="15" />
        <circle className={styles.focus} cx="180" cy="180" r="5.5" />
        <path className={styles.focusRay} d="M180 145v70M145 180h70M158 158l44 44M158 202l44-44" />
        <g className={styles.nodeRays}>
          <path d="M180 43v22M169 54h22" />
          <path d="M292 79v20M282 89h20" />
          <path d="M302 259v18M293 268h18" />
          <path d="M67 243v18M58 252h18" />
        </g>
        <g className={styles.sparkNodes}>
          <circle cx="180" cy="54" r="3.1" />
          <circle cx="292" cy="89" r="2.8" />
          <circle cx="320" cy="180" r="2.2" />
          <circle cx="302" cy="268" r="2.6" />
          <circle cx="180" cy="326" r="2" />
          <circle cx="67" cy="252" r="2.6" />
          <circle cx="42" cy="180" r="2" />
          <circle cx="76" cy="88" r="2.4" />
          <circle cx="240" cy="105" r="2.3" />
          <circle cx="267" cy="193" r="2" />
          <circle cx="130" cy="107" r="1.8" />
          <circle cx="113" cy="222" r="2.1" />
        </g>
      </svg>
    </div>
  );
}
