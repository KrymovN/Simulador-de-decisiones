"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DecisionSingularityWebGL.module.css";

type DebugState = {
  animationTime: number;
  dpr: number;
  fps: number;
  mode: "initializing" | "webgl" | "fallback";
  motionState: "running" | "reduced" | "paused";
  quality: "desktop" | "mobile-safe";
  reducedMotion: boolean;
  size: string;
  status: string;
};

type WebGLResources = {
  buffer: WebGLBuffer | null;
  fragmentShader: WebGLShader | null;
  mobileModeLocation: WebGLUniformLocation | null;
  positionLocation: number;
  program: WebGLProgram | null;
  reducedLocation: WebGLUniformLocation | null;
  resolutionLocation: WebGLUniformLocation | null;
  timeLocation: WebGLUniformLocation | null;
  vertexShader: WebGLShader | null;
};

const DESKTOP_DPR_CAP = 1.5;
const MOBILE_DPR_CAP = 1.15;
const MOBILE_VIEWPORT_WIDTH = 700;

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_reducedMotion;
  uniform float u_mobileMode;
  varying vec2 v_uv;

  float ring(vec2 point, float radius, float width) {
    return 1.0 - smoothstep(width, width + 0.018, abs(length(point) - radius));
  }

  float ellipseRing(vec2 point, vec2 scale, float radius, float width) {
    return ring(point * scale, radius, width);
  }

  float softCore(vec2 point, float radius, float softness) {
    return 1.0 - smoothstep(radius, radius + softness, length(point));
  }

  void main() {
    vec2 uv = v_uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

    float mobileSoftness = mix(1.0, 0.82, u_mobileMode);
    float motion = 1.0 - u_reducedMotion;
    float time = u_time * motion * mix(1.0, 1.08, u_mobileMode);
    float breath = 0.84 + 0.16 * sin(time * 0.78);
    float safariPulse = 0.5 + 0.5 * sin(time * 1.12);
    float slowDrift = sin(time * 0.22) * mix(0.012, 0.018, u_mobileMode);
    vec2 core = vec2(slowDrift, 0.015 + sin(time * 0.31) * 0.006);
    vec2 point = uv - core;
    float radius = length(point);
    float angle = atan(point.y, point.x);

    vec3 voidBlack = vec3(0.001, 0.001, 0.001);
    vec3 deepGraphite = vec3(0.012, 0.011, 0.010);
    vec3 graphite = vec3(0.042, 0.036, 0.028);
    vec3 amber = vec3(1.0, 0.58, 0.18);
    vec3 gold = vec3(1.0, 0.78, 0.38);
    vec3 cream = vec3(1.0, 0.92, 0.68);
    vec3 ember = vec3(0.62, 0.18, 0.055);

    float grain =
      sin(uv.x * 34.0 + time * 0.07) *
      sin(uv.y * 29.0 - time * 0.05) * 0.5 + 0.5;

    float field = smoothstep(1.62, 0.12, radius);
    vec3 color = mix(voidBlack, graphite, field * 0.56);
    color += deepGraphite * smoothstep(1.42, 0.28, length(uv)) * 0.44;

    float gravityWell = pow(max(0.0, 1.0 - radius), 4.8);
    float outerHalo = smoothstep(1.22, 0.18, radius) * (0.085 + breath * 0.062 + safariPulse * 0.024);
    float amberMist = smoothstep(0.96, 0.2, radius) * (0.055 + grain * 0.035);
    color += gold * outerHalo * mobileSoftness;
    color += amber * amberMist * mobileSoftness;
    color += cream * gravityWell * 0.04;

    float diskWave = sin(point.x * 4.4 - time * mix(0.5, 0.74, u_mobileMode)) * mix(0.018, 0.026, u_mobileMode);
    float diskY = point.y + diskWave;
    float disk = exp(-abs(diskY) * 18.0) * smoothstep(0.98, 0.12, abs(point.x));
    float diskMask = smoothstep(0.17, 0.31, radius) * smoothstep(1.18, 0.42, radius);
    float diskLensing = 0.66 + 0.34 * sin(angle * 2.0 - time * 0.68);
    color += mix(ember, gold, diskLensing) * disk * diskMask * 0.62 * mobileSoftness;

    float backDisk = exp(-abs(point.y + 0.07) * 24.0) * smoothstep(0.92, 0.1, abs(point.x));
    color += ember * backDisk * diskMask * 0.12;

    float photonOne = ellipseRing(point, vec2(0.74, 2.05), 0.48, 0.025);
    float photonTwo = ellipseRing(point, vec2(0.86, 2.62), 0.34, 0.016);
    float photonThree = ellipseRing(point, vec2(0.68, 1.58), 0.74, 0.012);
    color += cream * photonOne * (0.18 + breath * 0.08) * mobileSoftness;
    color += gold * photonTwo * 0.21 * mobileSoftness;
    color += amber * photonThree * 0.1 * mobileSoftness;
    float energySweep = smoothstep(0.72, 1.0, sin(angle * 3.0 - time * 0.96));
    color += gold * photonOne * energySweep * 0.09 * mobileSoftness;

    float horizonRadius = 0.252 + sin(time * 0.72) * 0.012;
    float horizon = ring(point, horizonRadius, 0.032);
    float innerGravity = softCore(point, 0.225, 0.13);
    float eventShadow = smoothstep(0.36, 0.13, radius);
    color = mix(color, voidBlack, eventShadow * 0.94);
    color += cream * horizon * (0.24 + breath * 0.14) * mobileSoftness;
    color += amber * ring(point, 0.31, 0.022) * 0.11 * mobileSoftness;
    color -= vec3(0.18, 0.15, 0.12) * innerGravity;

    float lensTop = exp(-abs(point.y - 0.19) * 12.0) * smoothstep(0.72, 0.18, abs(point.x));
    float lensBottom = exp(-abs(point.y + 0.19) * 10.0) * smoothstep(0.76, 0.16, abs(point.x));
    color += gold * lensTop * 0.09;
    color += amber * lensBottom * 0.12;

    float dataArc = ellipseRing(point, vec2(0.88, 1.48), 0.72, 0.01);
    float arcGate = smoothstep(0.62, 0.98, sin(angle * 10.0 + time * 0.46));
    float arcBreath = 0.45 + 0.55 * breath;
    color += cream * dataArc * arcGate * arcBreath * 0.06 * mobileSoftness;

    float verticalDepth = smoothstep(1.05, -0.12, abs(uv.y)) * smoothstep(1.5, 0.32, length(uv));
    color += vec3(0.08, 0.055, 0.028) * verticalDepth * 0.22;

    float vignette = smoothstep(1.55, 0.32, length(uv));
    color *= vignette;
    color = pow(max(color, vec3(0.0)), vec3(0.92));

    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("No se pudo crear el shader WebGL.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compile error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLResources {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  const buffer = gl.createBuffer();

  if (!program || !buffer) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("No se pudo crear el programa WebGL.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Program link error.";
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(message);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  return {
    buffer,
    fragmentShader,
    mobileModeLocation: gl.getUniformLocation(program, "u_mobileMode"),
    positionLocation: gl.getAttribLocation(program, "a_position"),
    program,
    reducedLocation: gl.getUniformLocation(program, "u_reducedMotion"),
    resolutionLocation: gl.getUniformLocation(program, "u_resolution"),
    timeLocation: gl.getUniformLocation(program, "u_time"),
    vertexShader,
  };
}

function disposeResources(gl: WebGLRenderingContext | null, resources: WebGLResources) {
  if (!gl) {
    return;
  }

  if (resources.buffer) {
    gl.deleteBuffer(resources.buffer);
  }

  if (resources.program) {
    gl.deleteProgram(resources.program);
  }

  if (resources.vertexShader) {
    gl.deleteShader(resources.vertexShader);
  }

  if (resources.fragmentShader) {
    gl.deleteShader(resources.fragmentShader);
  }
}

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debug, setDebug] = useState<DebugState>({
    animationTime: 0,
    dpr: 1,
    fps: 0,
    mode: "initializing",
    motionState: "running",
    quality: "desktop",
    reducedMotion: false,
    size: "0x0",
    status: "Inicializando WebGL",
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let animationFrame = 0;
    let disposed = false;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let loopStartedAt = performance.now();
    let shaderTime = 0;
    let gl: WebGLRenderingContext | null = null;
    let resources: WebGLResources = {
      buffer: null,
      fragmentShader: null,
      mobileModeLocation: null,
      positionLocation: -1,
      program: null,
      reducedLocation: null,
      resolutionLocation: null,
      timeLocation: null,
      vertexShader: null,
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    let reducedMotion = motionQuery.matches;
    let mobileMode = false;
    let dpr = Math.min(window.devicePixelRatio || 1, DESKTOP_DPR_CAP);
    let canvasWidth = 1;
    let canvasHeight = 1;

    function updateDebug(next: Partial<DebugState>) {
      setDebug((current) => ({ ...current, ...next }));
    }

    function setFallback(status: string) {
      updateDebug({
        animationTime: shaderTime,
        dpr,
        fps: 0,
        mode: "fallback",
        motionState: "paused",
        quality: mobileMode ? "mobile-safe" : "desktop",
        reducedMotion,
        size: `${canvasWidth}x${canvasHeight}`,
        status,
      });
    }

    function getMobileMode() {
      return (
        window.innerWidth <= MOBILE_VIEWPORT_WIDTH ||
        (window.innerHeight <= MOBILE_VIEWPORT_WIDTH && window.innerWidth <= 1024) ||
        (coarsePointerQuery.matches && window.innerWidth <= 1024)
      );
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const previousWidth = canvasWidth;
      const previousHeight = canvasHeight;
      const previousDpr = dpr;
      const previousMobileMode = mobileMode;

      mobileMode = getMobileMode();
      dpr = Math.min(window.devicePixelRatio || 1, mobileMode ? MOBILE_DPR_CAP : DESKTOP_DPR_CAP);
      canvasWidth = Math.max(1, Math.floor(rect.width * dpr));
      canvasHeight = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      if (gl) {
        gl.viewport(0, 0, canvasWidth, canvasHeight);
      }

      if (
        previousWidth !== canvasWidth ||
        previousHeight !== canvasHeight ||
        previousDpr !== dpr ||
        previousMobileMode !== mobileMode
      ) {
        updateDebug({
          dpr,
          quality: mobileMode ? "mobile-safe" : "desktop",
          reducedMotion,
          size: `${canvasWidth}x${canvasHeight}`,
        });
      }
    }

    function render(time: number) {
      if (disposed || !gl || !resources.program) {
        return;
      }

      resize();
      shaderTime = Math.max(0, ((time - loopStartedAt) * 0.001) % 120);
      gl.useProgram(resources.program);

      gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
      gl.enableVertexAttribArray(resources.positionLocation);
      gl.vertexAttribPointer(resources.positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resources.resolutionLocation, canvasWidth, canvasHeight);
      gl.uniform1f(resources.timeLocation, shaderTime);
      gl.uniform1f(resources.reducedLocation, reducedMotion ? 1 : 0);
      gl.uniform1f(resources.mobileModeLocation, mobileMode ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frameCount += 1;

      if (time - lastFpsUpdate > 600) {
        const fps = Math.round((frameCount * 1000) / (time - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = time;
        updateDebug({
          animationTime: shaderTime,
          dpr,
          fps: reducedMotion ? 0 : fps,
          mode: "webgl",
          motionState: reducedMotion ? "reduced" : "running",
          quality: mobileMode ? "mobile-safe" : "desktop",
          reducedMotion,
          size: `${canvasWidth}x${canvasHeight}`,
          status: reducedMotion
            ? "WebGL listo · movimiento reducido"
            : mobileMode
              ? "WebGL activo · Safari-safe motion"
              : "WebGL activo",
        });
      }

      if (!document.hidden && !reducedMotion) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function startLoop() {
      window.cancelAnimationFrame(animationFrame);
      resize();
      frameCount = 0;
      lastFpsUpdate = performance.now();
      loopStartedAt = lastFpsUpdate;
      shaderTime = 0;

      updateDebug({
        animationTime: shaderTime,
        dpr,
        fps: 0,
        mode: gl ? "webgl" : "fallback",
        motionState: reducedMotion ? "reduced" : "running",
        quality: mobileMode ? "mobile-safe" : "desktop",
        reducedMotion,
        size: `${canvasWidth}x${canvasHeight}`,
        status: reducedMotion
          ? "WebGL listo · movimiento reducido"
          : mobileMode
            ? "WebGL activo · Safari-safe motion"
            : "WebGL activo",
      });

      if (document.hidden) {
        return;
      }

      if (reducedMotion) {
        render(performance.now());
      } else {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        updateDebug({ fps: 0, motionState: "paused", status: "Pausado por pestaña oculta" });
        return;
      }

      startLoop();
    }

    function handleMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      startLoop();
    }

    function handlePointerChange() {
      startLoop();
    }

    function handleContextLost(event: Event) {
      event.preventDefault();
      window.cancelAnimationFrame(animationFrame);
      setFallback("WebGL context lost · fallback activo");
    }

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        depth: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
        stencil: false,
      });

      if (!gl) {
        setFallback("WebGL no disponible · fallback activo");
        return;
      }

      resources = createProgram(gl);
      updateDebug({
        animationTime: shaderTime,
        dpr,
        fps: 0,
        mode: "webgl",
        motionState: reducedMotion ? "reduced" : "running",
        reducedMotion,
        status: "WebGL activo",
      });

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      canvas.addEventListener("webglcontextlost", handleContextLost);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      addMediaQueryListener(motionQuery, handleMotionChange);
      addMediaQueryListener(coarsePointerQuery, handlePointerChange);

      startLoop();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        removeMediaQueryListener(motionQuery, handleMotionChange);
        removeMediaQueryListener(coarsePointerQuery, handlePointerChange);
        disposeResources(gl, resources);
      };
    } catch (error) {
      setFallback(error instanceof Error ? error.message : "WebGL error · fallback activo");

      return () => {
        disposed = true;
        window.cancelAnimationFrame(animationFrame);
        disposeResources(gl, resources);
      };
    }
  }, []);

  const isFallback = debug.mode === "fallback";

  return (
    <main className={styles.labShell}>
      <section className={styles.hero} aria-labelledby="visual-lab-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Stage 2.7.5 · mobile safety validation</p>
          <h1 id="visual-lab-title">Levio Visual Lab</h1>
          <p>
            Prototipo WebGL aislado para observar una singularidad mas profunda,
            atmosferica y serena sin tocar el hero ni el flujo de produccion.
          </p>
        </div>

        <div className={styles.stage} aria-label="Sandbox WebGL de singularidad Levio">
          <canvas className={styles.canvas} ref={canvasRef} />

          {isFallback ? (
            <div className={styles.fallback} aria-live="polite">
              <span className={styles.fallbackCore} aria-hidden="true" />
              <strong>Fallback visual activo</strong>
              <span>La experiencia base permanece estable sin WebGL.</span>
            </div>
          ) : null}

          <div className={styles.debugPanel} aria-live="polite">
            <span>{debug.status}</span>
            <span>FPS: {debug.fps}</span>
            <span>
              DPR: {debug.dpr.toFixed(2)} / cap{" "}
              {debug.quality === "mobile-safe" ? MOBILE_DPR_CAP : DESKTOP_DPR_CAP}
            </span>
            <span>Canvas: {debug.size}</span>
            <span>Motion: {debug.motionState}</span>
            <span>Time: {debug.animationTime.toFixed(1)}s</span>
            <span>Quality: {debug.quality}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
