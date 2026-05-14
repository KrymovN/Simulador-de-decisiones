"use client";

import { useEffect, useRef } from "react";
import styles from "./DecisionSingularity.module.css";

function drawParticleField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height);

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < 240; i += 1) {
    const lane = i % 6;
    const orbit = (i % 48) / 48;
    const radius = scale * (0.18 + orbit * 0.44 + lane * 0.012);
    const speed = 0.00008 + lane * 0.000026;
    const angle = time * speed + i * 0.42;
    const spiral = Math.sin(time * 0.00018 + i * 0.17) * scale * 0.026;
    const pull = 1 - orbit * 0.16;
    const x = centerX + Math.cos(angle) * (radius + spiral) * pull;
    const y = centerY + Math.sin(angle) * radius * (0.27 + lane * 0.018);
    const size = 0.55 + orbit * 1.9;
    const alpha = 0.18 + Math.sin(time * 0.0012 + i) * 0.12;

    const particle = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
    particle.addColorStop(0, `rgba(255, 243, 208, ${alpha})`);
    particle.addColorStop(0.28, `rgba(255, 211, 106, ${alpha * 0.88})`);
    particle.addColorStop(0.54, `rgba(255, 178, 62, ${alpha * 0.62})`);
    particle.addColorStop(0.78, `rgba(184, 106, 43, ${alpha * 0.34})`);
    particle.addColorStop(1, "rgba(255, 211, 106, 0)");

    ctx.fillStyle = particle;
    ctx.beginPath();
    ctx.arc(x, y, size * 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

export default function DecisionSingularity() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) {
      return;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width * pixelRatio));
      height = Math.max(1, Math.floor(rect.height * pixelRatio));
      canvas.width = width;
      canvas.height = height;
      drawParticleField(ctx as CanvasRenderingContext2D, width, height, performance.now());
    }

    function render(time: number) {
      drawParticleField(ctx as CanvasRenderingContext2D, width, height, time);

      if (!reduceMotion) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    resize();
    window.addEventListener("resize", resize);

    if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(render);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={styles.stage} aria-hidden="true">
      <canvas className={styles.particleCanvas} ref={canvasRef} />
      <div className={styles.depthGlow} />
      <div className={styles.microGrid} />
      <div className={styles.dataOrbit} />
      <div className={styles.outerOrbit} />
      <div className={styles.innerOrbit} />
      <div className={styles.accretionPlane}>
        <span className={styles.backLens} />
        <span className={styles.diskBack} />
        <span className={styles.topLight} />
        <span className={styles.voidCore} />
        <span className={styles.horizon} />
        <span className={styles.diskFront} />
        <span className={styles.bottomLight} />
        <span className={styles.photonRingOne} />
        <span className={styles.photonRingTwo} />
        <span className={styles.frontLens} />
      </div>
      <span className={`${styles.flare} ${styles.flareOne}`} />
      <span className={`${styles.flare} ${styles.flareTwo}`} />
      <span className={`${styles.flare} ${styles.flareThree}`} />
      <span className={styles.trajectoryOne} />
      <span className={styles.trajectoryTwo} />
      <span className={styles.trajectoryThree} />
    </div>
  );
}
