"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./DecisionSingularityWebGL.module.css";

type LabState = {
  assetStatus: "loading" | "loaded" | "missing";
  motionState: "running" | "reduced";
  size: string;
};

const VISUAL_ASSET_SRC = "/visual-lab/singularity-hybrid-reference.png";

function addMediaQueryListener(
  query: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return;
  }

  query.addListener(listener);
}

function removeMediaQueryListener(
  query: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  if (typeof query.removeEventListener === "function") {
    query.removeEventListener("change", listener);
    return;
  }

  query.removeListener(listener);
}

export default function DecisionSingularityWebGL() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [labState, setLabState] = useState<LabState>({
    assetStatus: "loading",
    motionState: "running",
    size: "0x0",
  });

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateSize() {
      const rect = stage.getBoundingClientRect();
      setLabState((current) => ({
        ...current,
        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      }));
    }

    function updateMotion(reducedMotion: boolean) {
      setLabState((current) => ({
        ...current,
        motionState: reducedMotion ? "reduced" : "running",
      }));
    }

    function handleMotionChange(event: MediaQueryListEvent) {
      updateMotion(event.matches);
    }

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(stage);
    updateSize();
    updateMotion(motionQuery.matches);
    addMediaQueryListener(motionQuery, handleMotionChange);

    return () => {
      resizeObserver.disconnect();
      removeMediaQueryListener(motionQuery, handleMotionChange);
    };
  }, []);

  return (
    <main className={styles.labShell}>
      <section className={styles.hero} aria-labelledby="visual-lab-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Stage 2.7.3b · hybrid sandbox</p>
          <h1 id="visual-lab-title">Levio Visual Lab</h1>
          <p>
            Prototipo aislado con base visual estatica y capas ligeras de movimiento.
            Requiere un asset final propio, licenciado o generado antes de validacion.
          </p>
        </div>

        <div
          className={styles.stage}
          ref={stageRef}
          aria-label="Sandbox hibrido de singularidad Levio"
          data-asset-status={labState.assetStatus}
        >
          <div className={styles.staticBase} aria-hidden="true">
            <Image
              alt=""
              className={styles.visualAsset}
              draggable={false}
              fill
              onError={() =>
                setLabState((current) => ({
                  ...current,
                  assetStatus: "missing",
                }))
              }
              onLoad={() =>
                setLabState((current) => ({
                  ...current,
                  assetStatus: "loaded",
                }))
              }
              priority
              sizes="(max-width: 840px) 100vw, 54vw"
              src={VISUAL_ASSET_SRC}
            />
          </div>

          <div className={styles.motionOverlays} aria-hidden="true">
            <span className={styles.breathingGlow} />
            <span className={styles.opacityPulse} />
            <span className={styles.radialShimmer} />
            <span className={styles.minimalOrbit} />
            <span className={styles.atmosphericVeil} />
          </div>

          <div className={styles.staticFallback} aria-hidden="true">
            <span className={styles.fallbackCore} />
          </div>

          <div className={styles.debugPanel} aria-label="Estado del sandbox hibrido">
            <span>Modo: hybrid static + light overlays</span>
            <span>Asset: uploaded sandbox reference · {labState.assetStatus}</span>
            <span>Movimiento: {labState.motionState}</span>
            <span>Fallback: imagen estatica sin canvas</span>
            <span>Viewport: {labState.size}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
