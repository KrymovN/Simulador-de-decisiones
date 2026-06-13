# VISUAL_ENGINE_PLAN.md

# Levio.es - Stage 2.7.1: WebGL Architecture Research

Current stable baseline: `0cec475 Prepare visual engine baseline`.

Stage status: research only. This document is not an immediate implementation specification and does not authorize WebGL integration into the production hero, `DecisionSingularity`, `HomeSimulator`, simulator logic, or the `SimulationResponse` contract.

## 1. Three.js: Advantages, Disadvantages, And Risks

### Advantages

- Provides low-level control over the WebGL scene, camera, materials, post-processing, particles, and shaders.
- Supports a cinematic Levio.es metaphor through depth, light, gravity, soft motion, and volumetric atmosphere.
- Can operate without a React wrapper, providing greater control over lifecycle, bundle size, and initialization points.
- Fits an isolated prototype approach: build a separate scene, measure FPS, memory pressure, and shader cost, and only then decide whether integration is justified.

### Disadvantages

- Adds a separate rendering runtime alongside React and Next.js, requiring manual management of canvas, renderer, resize, pixel ratio, animation loop, and cleanup.
- A WebGL scene can compete with the DOM for CPU and GPU resources, especially in a hero where first paint, input responsiveness, and mobile layout stability already matter.
- Requires strict asset budgets because textures, geometry, post-processing, and shader complexity can quickly create a heavy initial load.
- Requires the team to maintain a separate visual architecture, debugging process, and regression QA surface beyond CSS and React UI.

### Risks

- GPU resource leaks when materials, geometry, render targets, and textures are not disposed correctly.
- Unstable frame pacing on weaker devices and during tab changes.
- WebGL context failures, including context loss, context restoration, and browser limits on active canvas contexts.
- Difficult graceful fallback: production UI must not degrade into an empty or broken hero when WebGL is unavailable.

## 2. React Three Fiber: Advantages, Disadvantages, And Risks

### Advantages

- Provides a declarative React approach to Three.js scenes, making scene composition, state, and props easier to align with the React model.
- Makes it easier to separate visual elements into components, test scene composition, and reuse primitives.
- The surrounding ecosystem can accelerate prototyping through controls, helpers, post-processing, and asset loading.
- Could suit future App Router integration if WebGL is placed behind a strict client-only boundary.

### Disadvantages

- Adds another runtime layer: a React reconciler for Three.js on top of Three.js itself.
- Increases dependency surface and bundle size, especially when additional helper libraries are included.
- The abstraction can hide real GPU costs; a scene may look component-oriented while still running as a heavy real-time renderer.
- Requires an especially careful boundary between Server Components and Client Components.

### Risks

- Hydration or SSR failures when browser-only APIs are accidentally used outside a client-only area.
- Performance regressions caused by React state updates affecting the scene more often than required.
- Difficulty guaranteeing a deterministic visual baseline when the scene depends on time, viewport dimensions, `devicePixelRatio`, and asynchronous asset loading.
- Risk of prematurely turning the production hero into an experimental laboratory instead of preserving a stable cinematic baseline.

## 3. Compatibility With Next.js App Router

At the time of this research, the project used Next.js `14.2.5` and the `app/` structure. In that architecture, WebGL cannot be treated as an ordinary Server Component because canvas, WebGL context, `window`, `document`, `ResizeObserver`, `requestAnimationFrame`, and device APIs are available only in the browser.

A safe future model would require:

- WebGL to live inside a separate Client Component with explicit `"use client"`.
- Heavy WebGL dependency imports to be deferred and isolated so the renderer does not enter the server path.
- The production route to retain an SSR-friendly DOM/CSS fallback baseline.
- Any future WebGL integration to be disableable through a feature flag or runtime guard.
- The scene to remain independent from the simulator API contract and `SimulationResponse`.

Historical note: project instructions required reading `node_modules/next/dist/docs/` before changing Next.js code, but that directory was not present in the installation used during Stage 2.7.1. No Next.js code changed during that stage; the conclusions above were based on the project structure, installed Next.js package and types, and App Router requirements for client-only browser APIs.

## 4. Hydration And SSR Risks

Direct WebGL integration into the production hero carries a high hydration-mismatch risk:

- The server cannot render the real state of a WebGL canvas.
- Viewport dimensions, DPR, and GPU capabilities are known only on the client.
- Animation state is not deterministic between SSR and client hydration.
- Asynchronous asset loading can alter DOM dimensions after hydration.
- Browser-only API calls during server rendering cause build or runtime failures.

Minimum future architecture rule: the server must return a stable DOM/CSS fallback, and WebGL may connect only after client mount and successful runtime checks.

## 5. Mobile Safari Risks

Mobile Safari is a critical Levio.es risk because mobile stability takes priority over experimental visuals.

Primary risks:

- Aggressive memory management and resource eviction under pressure.
- WebGL context loss during heavy scenes, tab changes, screen locking, or background restoration.
- Unstable `devicePixelRatio` and canvas resizing during viewport, address-bar, or orientation changes.
- Thermal pressure and throttling during long animation loops.
- Device- and iOS-version-specific limitations on video, textures, and post-processing.
- Reduced touch responsiveness when an animation loop consumes the main-thread budget.

For Levio.es, cinematic character must never compromise readability, input latency, scroll stability, or premium calmness.

## 6. GPU And Performance Risks On Weaker Devices

A hero WebGL scene may be visually strong, but weaker devices expose its cost first:

- FPS drops create a cheap, unstable motion impression.
- High `devicePixelRatio` sharply increases fill-rate cost.
- Bloom, blur, noise, volumetric effects, and particles can overload fragment shaders.
- Parallel CSS effects, shadows, filters, and WebGL post-processing compete for GPU resources.
- A larger initial JavaScript bundle can damage LCP and TTI.
- A permanent render loop consumes battery without user interaction.
- Missing adaptive quality creates unequal experiences across devices.

Any future engine must include low, medium, and high quality tiers; hard DPR caps; pause and resume logic; reduced-motion handling; canvas teardown; and a non-WebGL fallback.

## 7. Why WebGL Must Not Be Integrated Directly Into The Production Hero

The production baseline had just been stabilized in commit `0cec475`. Direct hero WebGL integration at that point would have violated the controlled, incremental architecture principle.

Reasons not to integrate:

- Stage 2.7.1 was defined as research only, not an implementation stage.
- The project had no WebGL dependencies, and installing packages was prohibited during the stage.
- There was no isolated prototype, performance data, or Mobile Safari validation.
- Fallback states, quality tiers, lifecycle cleanup, and context-loss handling were undefined.
- The production hero defines the first Levio.es impression; an experimental renderer could damage the stable baseline.
- Hydration or client-boundary errors could affect the homepage.
- The existing singularity metaphor already had product value and should not be replaced without demonstrated benefit.

Conclusion: WebGL must not enter the production hero without a separate prototype and measurements.

## 8. Recommended Safe Future Integration Strategy

Any future strategy should remain conservative:

1. Preserve the current CSS/DOM production baseline as the canonical fallback.
2. Research Three.js and React Three Fiber separately from production UI.
3. Create an isolated visual prototype outside `HomeSimulator`, `DecisionSingularity`, and the simulator API.
4. Define performance budgets before integration: bundle impact, FPS, memory, GPU time, LCP/TTI, and battery and thermal behavior.
5. Validate Mobile Safari on real devices or the closest practical device matrix.
6. Add runtime capability detection for WebGL support, reduced motion, memory or device class, and context loss.
7. Permit production integration only after demonstrating a clear advantage over the current baseline.

Core principle: WebGL must be a progressive enhancement, not a required dependency of the primary user experience.

## 9. Proposed Staged Approach

### Stage A - Research Only

- Record architecture risks.
- Compare Three.js and React Three Fiber.
- Do not install packages.
- Do not change production UI.
- Do not change the simulator contract.

### Stage B - Isolated Visual Prototype Later

- Create an isolated prototype route or lab area only after a separate decision.
- Do not connect the prototype to the production hero.
- Do not change `DecisionSingularity` or `HomeSimulator`.
- Compare raw Three.js and React Three Fiber against the same visual brief.

### Stage C - Performance Tests

- Measure FPS, dropped frames, memory, GPU pressure, and bundle size.
- Validate adaptive DPR and quality tiers.
- Validate pause on hidden tab, reduced motion, and cleanup.
- Compare results with the current CSS/DOM baseline.

### Stage D - Mobile Safari Validation

- Validate iPhone Safari in portrait and landscape.
- Validate scroll, touch latency, orientation changes, and address-bar resize.
- Validate context loss and restoration.
- Validate thermal throttling during a long session.

### Stage E - Possible Production Integration

- Proceed only after successful Stage B-D results.
- Integrate as progressive enhancement.
- Preserve the CSS/DOM fallback.
- Retain a feature flag and kill switch.
- Do not change the simulator API without a separate architecture stage.

## 10. Clear Conclusion

Do not integrate WebGL now.

Preserve the production baseline.

Stage 2.7.1 must end with a research document and stability checks, without installing dependencies, adding Three.js, React Three Fiber, WebGL components, or `/visual-lab`, and without changing production UI, `DecisionSingularity`, `HomeSimulator`, simulator logic, `SimulationResponse`, or `app/globals.css`.
