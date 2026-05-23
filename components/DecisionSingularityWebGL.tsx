"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DecisionSingularityWebGL.module.css";

type DebugState = {
  dpr: number;
  fps: number;
  mode: "initializing" | "webgl" | "fallback";
  reducedMotion: boolean;
  size: string;
  status: string;
};

type WebGLResources = {
  buffer: WebGLBuffer | null;
  fragmentShader: WebGLShader | null;
  program: WebGLProgram | null;
  vertexShader: WebGLShader | null;
};

const DPR_CAP = 1.5;

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_reducedMotion;
  varying vec2 v_uv;

  float ring(vec2 point, float radius, float width) {
    return 1.0 - smoothstep(width, width + 0.018, abs(length(point) - radius));
  }

  void main() {
    vec2 uv = v_uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

    float motion = 1.0 - u_reducedMotion;
    float time = u_time * motion;
    vec2 core = vec2(0.0, 0.02);
    vec2 point = uv - core;
    float radius = length(point);
    float angle = atan(point.y, point.x);

    vec3 deepSpace = vec3(0.006, 0.005, 0.004);
    vec3 graphite = vec3(0.028, 0.025, 0.022);
    vec3 amber = vec3(1.0, 0.66, 0.22);
    vec3 gold = vec3(1.0, 0.82, 0.46);
    vec3 ember = vec3(0.74, 0.24, 0.08);

    float subtleNoise =
      sin((uv.x * 28.0) + time * 0.18) *
      sin((uv.y * 22.0) - time * 0.16) * 0.5 + 0.5;

    vec3 color = mix(deepSpace, graphite, smoothstep(1.36, 0.08, radius) * 0.44);
    color += amber * pow(max(0.0, 1.0 - radius), 5.2) * 0.18;

    float diskY = point.y + sin(point.x * 2.4 + time * 0.16) * 0.025;
    float disk = exp(-abs(diskY) * 15.0) * smoothstep(0.86, 0.14, abs(point.x));
    float diskMask = smoothstep(0.16, 0.28, radius) * smoothstep(1.08, 0.42, radius);
    float diskPulse = 0.72 + 0.28 * sin(angle * 3.0 - time * 0.75);
    color += mix(ember, gold, diskPulse) * disk * diskMask * 0.54;

    float photonOne = ring(point * vec2(0.78, 2.2), 0.48, 0.028);
    float photonTwo = ring(point * vec2(0.82, 2.7), 0.34, 0.018);
    color += gold * photonOne * 0.22;
    color += amber * photonTwo * 0.2;

    float horizon = ring(point, 0.255 + sin(time * 0.28) * 0.006, 0.035);
    float coreShadow = smoothstep(0.32, 0.14, radius);
    color = mix(color, vec3(0.0, 0.0, 0.0), coreShadow * 0.92);
    color += gold * horizon * 0.36;

    float lens = smoothstep(0.96, 0.24, radius) * (0.08 + subtleNoise * 0.035);
    color += amber * lens;

    float dataArc = ring(point * vec2(0.9, 1.55), 0.72, 0.012);
    float gate = step(0.72, sin(angle * 18.0 + time * 0.36));
    color += gold * dataArc * gate * 0.09;

    float vignette = smoothstep(1.54, 0.36, radius);
    color *= vignette;

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

  return { buffer, fragmentShader, program, vertexShader };
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

export default function DecisionSingularityWebGL() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debug, setDebug] = useState<DebugState>({
    dpr: 1,
    fps: 0,
    mode: "initializing",
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
    let gl: WebGLRenderingContext | null = null;
    let resources: WebGLResources = {
      buffer: null,
      fragmentShader: null,
      program: null,
      vertexShader: null,
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    let canvasWidth = 1;
    let canvasHeight = 1;

    function updateDebug(next: Partial<DebugState>) {
      setDebug((current) => ({ ...current, ...next }));
    }

    function setFallback(status: string) {
      updateDebug({
        dpr,
        fps: 0,
        mode: "fallback",
        reducedMotion,
        size: `${canvasWidth}x${canvasHeight}`,
        status,
      });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const previousWidth = canvasWidth;
      const previousHeight = canvasHeight;
      const previousDpr = dpr;

      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
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
        previousDpr !== dpr
      ) {
        updateDebug({
          dpr,
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
      gl.useProgram(resources.program);

      const position = gl.getAttribLocation(resources.program, "a_position");
      const resolution = gl.getUniformLocation(resources.program, "u_resolution");
      const currentTime = gl.getUniformLocation(resources.program, "u_time");
      const reduced = gl.getUniformLocation(resources.program, "u_reducedMotion");

      gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvasWidth, canvasHeight);
      gl.uniform1f(currentTime, time * 0.001);
      gl.uniform1f(reduced, reducedMotion ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frameCount += 1;

      if (time - lastFpsUpdate > 600) {
        const fps = Math.round((frameCount * 1000) / (time - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = time;
        updateDebug({
          dpr,
          fps: reducedMotion ? 0 : fps,
          mode: "webgl",
          reducedMotion,
          size: `${canvasWidth}x${canvasHeight}`,
          status: reducedMotion ? "WebGL listo · movimiento reducido" : "WebGL activo",
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

      updateDebug({
        dpr,
        fps: 0,
        mode: gl ? "webgl" : "fallback",
        reducedMotion,
        size: `${canvasWidth}x${canvasHeight}`,
        status: reducedMotion ? "WebGL listo · movimiento reducido" : "WebGL activo",
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
        updateDebug({ fps: 0, status: "Pausado por pestaña oculta" });
        return;
      }

      startLoop();
    }

    function handleMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
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
        dpr,
        fps: 0,
        mode: "webgl",
        reducedMotion,
        status: "WebGL activo",
      });

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      canvas.addEventListener("webglcontextlost", handleContextLost);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.addEventListener("change", handleMotionChange);

      startLoop();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        motionQuery.removeEventListener("change", handleMotionChange);
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
          <p className={styles.eyebrow}>Stage 2.7.2 · isolated sandbox</p>
          <h1 id="visual-lab-title">Levio Visual Lab</h1>
          <p>
            Prototipo WebGL aislado para explorar una singularidad cinematica sin
            tocar el hero, el simulador ni el flujo de produccion.
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
            <span>DPR: {debug.dpr.toFixed(2)} / cap {DPR_CAP}</span>
            <span>Canvas: {debug.size}</span>
            <span>Motion: {debug.reducedMotion ? "reducido" : "normal"}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
