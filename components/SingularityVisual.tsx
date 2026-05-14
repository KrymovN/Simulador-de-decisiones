"use client";

import { useEffect, useRef } from "react";

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

  for (let i = 0; i < 170; i += 1) {
    const orbit = (i % 42) / 42;
    const lane = Math.floor(i / 42);
    const radius = scale * (0.2 + orbit * 0.34 + lane * 0.015);
    const speed = 0.00011 + (lane + 1) * 0.000043;
    const angle = time * speed + i * 0.69;
    const warp = Math.sin(angle * 2.4 + time * 0.00028) * scale * 0.024;
    const x = centerX + Math.cos(angle) * (radius + warp);
    const y = centerY + Math.sin(angle) * radius * (0.22 + lane * 0.032);
    const size = 0.8 + orbit * 2.25;
    const alpha = 0.2 + Math.sin(time * 0.001 + i) * 0.16;

    const particle = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
    particle.addColorStop(0, `rgba(247, 248, 255, ${alpha})`);
    particle.addColorStop(0.3, `rgba(76, 201, 240, ${alpha * 0.78})`);
    particle.addColorStop(0.58, `rgba(247, 37, 133, ${alpha * 0.5})`);
    particle.addColorStop(0.78, `rgba(255, 190, 11, ${alpha * 0.34})`);
    particle.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = particle;
    ctx.beginPath();
    ctx.arc(x, y, size * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

export default function SingularityVisual() {
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

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width * pixelRatio));
      height = Math.max(1, Math.floor(rect.height * pixelRatio));
      canvas.width = width;
      canvas.height = height;
    }

    function render(time: number) {
      drawParticleField(ctx, width, height, time);
      animationFrame = window.requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="singularity-stage" aria-hidden="true">
      <canvas className="singularity-canvas" ref={canvasRef} />
      <div className="singularity-glow singularity-glow-a" />
      <div className="singularity-glow singularity-glow-b" />
      <div className="singularity-plane">
        <span className="gravity-lens lens-back" />
        <span className="accretion-disk disk-back" />
        <span className="light-arc arc-top" />
        <span className="singularity-shadow" />
        <span className="event-horizon" />
        <span className="accretion-disk disk-front" />
        <span className="light-arc arc-bottom" />
        <span className="photon-ring ring-one" />
        <span className="photon-ring ring-two" />
        <span className="gravity-lens lens-front" />
      </div>
      <span className="singularity-flare flare-one" />
      <span className="singularity-flare flare-two" />
      <span className="singularity-flare flare-three" />
    </div>
  );
}
