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
          <radialGradient id="levio-core" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="9%" stopColor="#fff8d0" />
            <stop offset="25%" stopColor="#ffc400" stopOpacity="0.98" />
            <stop offset="56%" stopColor="#d98700" stopOpacity="0.5" />
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
        <circle className={styles.halo} cx="180" cy="180" r="98" />
        <circle className={styles.outerTrace} cx="180" cy="180" r="164" />
        <circle className={styles.outerTraceDense} cx="180" cy="180" r="151" />
        <circle className={styles.outerRing} cx="180" cy="180" r="137" />
        <circle className={styles.secondaryRing} cx="180" cy="180" r="122" />
        <circle className={styles.midRing} cx="180" cy="180" r="105" />
        <circle className={styles.nearRing} cx="180" cy="180" r="84" />
        <circle className={styles.innerTrace} cx="180" cy="180" r="67" />
        <ellipse className={styles.outerDecisionPlane} cx="180" cy="180" rx="168" ry="61" />
        <ellipse className={styles.decisionPlane} cx="180" cy="180" rx="145" ry="47" />
        <ellipse className={styles.innerDecisionPlane} cx="180" cy="180" rx="115" ry="32" />
        <ellipse className={styles.trajectoryTilted} cx="180" cy="180" rx="159" ry="58" />
        <ellipse className={styles.trajectoryTiltedReverse} cx="180" cy="180" rx="157" ry="53" />
        <path className={styles.axisLines} d="M180 18v324M18 180h324M66 66l228 228M66 294 294 66" />
        <path className={styles.signalLine} d="M77 208c43 25 89 35 139 19 27-8 50-25 71-49" />
        <path className={styles.signalLineMuted} d="M89 139c46-20 98-21 151-3 22 8 40 18 56 31" />
        <path className={styles.trajectory} d="M31 238c43-68 104-111 181-128 42-9 83-9 121-2" />
        <path className={styles.trajectoryMuted} d="M50 87c51 22 99 63 141 123 25 34 45 65 65 91" />
        <path className={styles.trajectoryFine} d="M85 308c32-39 72-69 119-93 31-15 60-29 89-49" />
        <circle className={styles.core} cx="180" cy="180" r="58" />
        <circle className={styles.coreRing} cx="180" cy="180" r="54" />
        <circle className={styles.innerCore} cx="180" cy="180" r="21" />
        <circle className={styles.focus} cx="180" cy="180" r="8" />
        <path className={styles.focusRay} d="M180 154v52M154 180h52M162 162l36 36M162 198l36-36" />
        <g className={styles.sparkNodes}>
          <circle cx="80" cy="93" r="2.8" />
          <circle cx="288" cy="87" r="3.2" />
          <circle cx="314" cy="205" r="2.3" />
          <circle cx="88" cy="263" r="2.5" />
          <circle cx="270" cy="282" r="2.1" />
          <circle cx="49" cy="180" r="1.9" />
        </g>
      </svg>
    </div>
  );
}
