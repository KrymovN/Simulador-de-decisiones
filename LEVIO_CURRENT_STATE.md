# LEVIO.ES - АКТУАЛЬНОЕ СОСТОЯНИЕ ПРОЕКТА

## Дата обновления

30 мая 2026, Europe/Madrid.

Документ отражает локальное состояние проекта `/Users/s3/Documents/New project` после стратегического визуального pivot. Это основной актуальный handoff-файл. `LEVIO_CURRENT_STATE.md` должен оставаться синхронизированной копией этого документа.

## 0. Current Authoritative Strategy - 30 May 2026

This section supersedes older Stage 2.7.x visual-research notes below wherever they conflict with the current product direction.

- Active stage: Stage 2.8 - documentation/current-state synchronization and MVP preparation after the strategic visual pivot.
- Current product direction: Premium Black-Gold AI Decision Intelligence System.
- Levio.es is not a chatbot, SaaS dashboard, visual-effects showcase, WebGL experiment or gaming interface.
- Levio.es helps users describe a situation, compare possible actions, evaluate risks, model consequences and understand likely strategic outcomes.
- Current production visual target: deep black / near-black foundation, bright premium gold accents, strong typography, clean layout, lightweight singularity symbol, minimal visual noise and fast Safari/iPhone performance.
- Stage 2.7.x is now historical research: cinematic, WebGL, shader and `/visual-lab` experiments informed the pivot, but they are no longer the primary production goal.
- Heavy production WebGL is rejected for the current MVP path. WebGL/canvas/Three.js/R3F must not be integrated into production without a new explicit approval.
- The accepted direction is disciplined black-gold product UI, not cinematic spectacle.
- Current production checkpoint: `78913da` - `Refocus Levio homepage toward premium black-gold product UI`.
- `HomeSimulator`, simulator/API contracts, auth/dashboard logic and Spanish visible UI remain protected unless a later approved stage explicitly touches them.
- Next safe work: Stage 2.8 alignment, production QA, legacy visual CSS cleanup planning and MVP decision-flow polish. Do not start new visual experiments as a substitute for MVP work.

## 0.6 Superseded Transition State - 24 May 2026

Historical note: this was the handoff source of truth before the Stage 2.8 synchronization and the 30 May 2026 product pivot. Treat it as superseded by `Current Authoritative Strategy - 30 May 2026`.

- Historical active stage at that time: Stage 2.7.3b - isolated lightweight shader cinematic-depth correction and validation.
- Historical status at that time: Stage 2.7.3b was not complete. Real iPhone Safari after `fa5dfd9` confirmed technical safety, but did not confirm enough perceived cinematic-depth improvement.
- Historical status at that time: Stage 2.7.4 was blocked until Stage 2.7.3b closed.
- Stage 2.7.5 is provisional only: existing mobile-safety work is useful but not a final validation stage and not a production-integration basis.
- Stage 2.7.6 and any Stage 2.7.7 escalation remain blocked/provisional until Stage 2.7.3b has a real visual-quality path forward.
- Current WebGL sandbox is isolated in `/visual-lab` and must stay isolated.
- Current sandbox is not yet premium cinematic quality. The `fa5dfd9` retest confirms more strongly that the current single-pass lightweight shader has a visual ceiling.
- Current engineering direction: preserve production `DecisionSingularity`, keep WebGL lab-only, and do not integrate production hero.
- Historical conclusion at that time: the lightweight shader path had a visual ceiling. The current Stage 2.8 direction is the Premium Black-Gold MVP path, not advanced rendering research.
- Strict stage discipline: no skipped stages, no retroactive completion, no production code changes during documentation-only work.
- Quota protection: before opening a new context, avoid rendering experiments, long browser QA loops, new builds, or broad analysis unless explicitly requested.
- Production protection: do not modify `components/DecisionSingularity.tsx`, `components/DecisionSingularity.module.css`, `components/HomeSimulator.tsx`, simulator logic, `SimulationResponse`, or `app/globals.css` without explicit approval.
- Stash protection: do not apply `stash@{0}` without explicit permission.

## 0.1 Stage 2.7.3b Direction Checkpoint - 26 May 2026

This checkpoint supersedes the previous hybrid static image direction for the active `/visual-lab` implementation.

- Active/checkpointed stage: Stage 2.7.3b - isolated CSS-only black-gold sphere/prognosis sandbox direction.
- The hybrid static image + lightweight overlays direction has been visually rejected and must not be continued as the current direction.
- `public/visual-lab/singularity-hybrid-reference.png` remains a tracked asset, but it is no longer the dominant base layer for `/visual-lab`.
- Current accepted sandbox direction: CSS-only black-gold living sphere with forecast/risk/value labels, soft orbit drift, breathing glow and calm premium cinematic motion.
- Current `/visual-lab` implementation uses no WebGL, no canvas, no Three.js, no React Three Fiber and no new dependencies.
- Production remains untouched: no production hero integration and no changes to `DecisionSingularity`, `HomeSimulator`, simulator logic, `app/page.tsx`, `app/layout.tsx` or `app/globals.css`.
- `/visual-lab` remains an isolated sandbox route and is not linked into production navigation.
- Stage 2.7.4 remains blocked and must not start from this checkpoint.

## 0.2 Historical transition checkpoint - 27 May 2026

Historical note: this block was the final handoff checkpoint before the repository/deployment migration and production homepage pivot. It is retained for history and superseded by the 30 May 2026 current strategy.

- Authoritative project path: `/Users/s3/Documents/New project`.
- Current Stage 2.7.3b checkpoint commit: `31d8902` - `Checkpoint Stage 2.7.3b sphere sandbox direction`.
- Current stage status: Stage 2.7.3b is checkpointed around the accepted isolated `/visual-lab` direction; Stage 2.7.4 has not started from this checkpoint and remains blocked.
- Accepted `/visual-lab` direction: CSS-only black-gold living sphere/prognosis sandbox with small forecast/risk/value labels, slow orbit/drift, soft breathing glow and premium calm motion.
- Blocked/provisional stages: Stage 2.7.4 blocked; Stage 2.7.5 provisional only; Stage 2.7.6 provisional only; Stage 2.7.7 blocked.
- Production protection rules remain active: do not change `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/DecisionSingularity.tsx`, `components/HomeSimulator.tsx`, simulator logic, dependencies, lockfiles, git remotes or deployment configuration without separate approval.
- `New project` is the current working source for this Codex thread and the accepted sandbox checkpoint.
- Older production/GitHub/Vercel source is presumed to be `/Users/s3/levio-app`; it requires a separate migration audit before any update to `levio.es`.
- `levio.es` currently shows the older production site state and must not be updated from this checkpoint without an approved migration/deployment plan.
- Historical next technical stage at that time: Stage 2.8 - repository/deployment migration preparation.

## 0.3 Historical next context recovery

Historical recovery instructions from the 27 May handoff:

- Read `PROJECT_CONTEXT.md`, `CURRENT_STAGE.md` and `LEVIO_CURRENT_STATE.md`.
- Run `git status --short`, `git branch --show-current` and `git log --oneline -10` from `/Users/s3/Documents/New project`.
- Confirm that Stage 2.7.3b is checkpointed, `/visual-lab` remains isolated, production files are untouched and Stage 2.7.4 remains blocked.
- Do not immediately start Stage 2.7.4, migration, deploy, push, remote changes, dependency changes, file copying between repositories or production integration.
- Next safe step: begin Stage 2.8 with a read-only repository/deployment migration preparation audit.

## 0.4 Historical Stage 2.8 first task

Historical first task for the original Stage 2.8 migration-preparation pass:

- Audit `/Users/s3/Documents/New project`.
- Audit `/Users/s3/levio-app`.
- Identify the GitHub remote(s) and branch relationships.
- Identify which local folder is connected to the current production/Vercel source.
- Prepare a backup and migration plan before any file transfer, remote change, push or deploy.
- Do not copy, delete, move, deploy, push or migrate anything without separate explicit approval.

## 0.5 Strategic visual pivot - 28 May 2026

This checkpoint records a controlled production homepage pivot away from heavy cinematic effects.

- New strategic direction: Premium Black-Gold Minimal AI Decision Intelligence UI.
- Levio.es should feel expensive, fast, calm, reliable, technological and serious, not like a visual-effects showcase.
- Heavy cinematic/WebGL/shader direction is not the production target; WebGL remains forbidden in production.
- Stage 2.7.3b is not closed by this pivot and the previous cinematic target must not be claimed as achieved.
- Production homepage now favors a lightweight black-gold product interface and a minimal SVG/CSS singularity mark.
- Removed from the production hero path: particle DOM layers, heavy sandbox sphere layers, large blur/glow stack and multi-layer orbit animation.
- Preserved: Spanish visible UI, `HomeSimulator`, simulator/API contracts, auth/dashboard logic, no new dependencies.
- `/visual-lab` remains available as a sandbox route, but its current visual is also refocused toward a lighter mark for consistency.
- Remaining caveat: `app/globals.css` still contains historical visual CSS sections; production homepage has scoped override rules, but a later CSS cleanup stage may remove legacy unused blocks after visual QA.

## 1. Краткое описание проекта

Levio.es - испаноязычная AI Decision Intelligence System. Продукт помогает пользователю описать сложную ситуацию, сравнить потенциальные шаги, увидеть возможные сценарии, риски, преимущества, отложенные последствия и стратегическую рекомендацию до принятия решения.

Текущая версия следует Premium Black-Gold product direction и сохраняет mock-архитектуру: backend, авторизация, база данных и реальная AI-интеграция пока не подключены. Авторизация и сохранение симуляций работают через demo/localStorage flows.

Публичный UI и личный кабинет должны оставаться на испанском языке. Технические отчеты для разработчика пишутся на русском.

## 2. Current Development Stage

Stage 2.8 - documentation/current-state synchronization, production state alignment and MVP preparation after strategic visual pivot - ACTIVE.

Stage 2.7.x is closed as a research and direction-discovery track. It must not be treated as the active production target, and the older cinematic/WebGL target must not be revived without a new approved stage.

Stage 2.8 roadmap to MVP:

- synchronize context/state/identity documentation around the Premium Black-Gold AI Decision Intelligence System direction;
- verify the production homepage after the black-gold pivot and Vercel/GitHub synchronization;
- plan a controlled cleanup of legacy heavy visual CSS only after visual QA;
- preserve `HomeSimulator` while polishing the decision-intelligence flow and Spanish product copy;
- keep backend/auth/API/real AI integration as later approved stages, not implicit work during documentation sync.

Stage 1 stable baseline завершен ранее:

- `9e9bb08` - Safe CSS stabilization for Levio visual baseline.
- `652cd71` - Organize globals CSS into safe structural sections.
- `0e1e534` - Stage 1 QA regression fixes.
- `0777b7e` - Finalize Stage 1 stable baseline.

Stage 2 progress:

- Stage 2.1 completed: `8eeb150` - motion.css extraction.
- Stage 2.2 completed: `959ffe5` - dashboard.css extraction.
- Stage 2.3 completed: `7ea3e61` - auth.css extraction.
- Stage 2.4 completed: `c9a86da` - simulator.css extraction.
- Stage 2.5 completed: visual regression QA checkpoint.
- Stage 2.6 completed: `c81a9c8` - checkpoint documentation closure.
- Stage 2.7-prep completed: `0cec475` - visual engine baseline preparation.
- Stage 2.7.1 completed: `3d8ef6e` - Levio identity core and WebGL architecture research plan.
- Stage 2.7.2 completed: `0781b46` - isolated WebGL sandbox prototype.
- Stage 2.7.3 completed: `5553455` - isolated WebGL visual quality iteration.
- Stage 2.7.3 corrective closure status: isolated shader cinematic pass applied; local `/visual-lab` route QA passed; strict closure remains pending post-pass real iPhone Safari retest.
- Stage 2.7.3 corrective pass 2 status: real iPhone Safari retest after the first corrective pass stayed technically stable but did not improve perceived cinematic depth; second isolated shader depth pass applied; strict closure remains pending another real iPhone Safari visual-quality retest.
- `fa5dfd9` - Stage 2.7.3b controlled depth-contrast iteration committed; real iPhone Safari retest passed technical safety but visual improvement was almost not noticeable. This is now historical evidence for the later pivot, not an active-stage marker.
- Stage 2.7.3b direction checkpoint: hybrid static image direction rejected; `/visual-lab` now holds an isolated CSS-only black-gold living sphere/prognosis sandbox with forecast/risk/value labels and no WebGL/canvas/Three.js/R3F.
- Stage 2.7.4 completed: isolated WebGL performance profiling and stress testing; no file changes, no commit needed.
- Stage 2.7.5 completed: `89e534c` - isolated WebGL mobile safety optimization; this is not full Safari/iPhone validation.
- Stage 2.7.6 completed: formal integration decision - keep production `DecisionSingularity`, keep WebGL isolated in `/visual-lab`, no production replacement approved.

Stage 2.1-2.7.4 result:

- motion keyframes moved to `app/styles/motion.css`;
- dashboard base styles moved to `app/styles/dashboard.css`;
- auth base styles moved to `app/styles/auth.css`;
- simulator base styles moved to `app/styles/simulator.css`;
- `app/globals.css` remains the canonical final dark-gold cascade layer;
- selector-bearing extracted CSS (`dashboard.css`, `auth.css`, `simulator.css`) is intentionally imported before `globals.css`;
- `motion.css` is keyframes-only and remains separate from selector cascade concerns;
- production visual baseline remains protected;
- stable frontend baseline backup branch created: `stable/stage-2-frontend-baseline`;
- `LEVIO_IDENTITY_CORE.md` added as the product/visual identity source of truth;
- `VISUAL_ENGINE_PLAN.md` added as the Stage 2.7.1 WebGL architecture research document;
- `/visual-lab` added as an isolated WebGL sandbox route;
- isolated WebGL mobile safety work stayed inside `components/DecisionSingularityWebGL.tsx` and `components/DecisionSingularityWebGL.module.css`;
- WebGL remains experimental-only and is not integrated into production.

## 3. Current Stable Status

Stable status after Stage 2.7.4:

- cinematic dark-gold baseline preserved;
- desktop QA stable;
- mobile `390px` QA stable;
- dashboard mobile navigation stable;
- auth routes stable;
- mock auth flow stable;
- home simulator interaction stable;
- no visual regressions detected in completed Stage 2.5 QA;
- Stage 2.6 context files synchronized;
- Stage 2.7-prep protective baseline completed;
- Stage 2.7.1 research-only documentation completed;
- Stage 2.7.2 isolated `/visual-lab` sandbox created;
- Stage 2.7.3 isolated WebGL visual quality iteration completed;
- Stage 2.7.3 corrective cinematic rendering pass improved glow, simulated bloom, layered fog, animated depth, volumetric feeling and living core motion inside the isolated sandbox;
- Stage 2.7.3 corrective pass 2 further strengthened central gravity/depth, layered atmospheric fog, amber/gold bloom, volumetric halo and internal energy illusion inside the isolated sandbox;
- `fa5dfd9` depth-contrast iteration passed real iPhone Safari technical safety, but did not produce enough perceived cinematic depth or emotional gravity improvement;
- Stage 2.7.4 isolated WebGL performance profiling completed with no file changes;
- Stage 2.7.5 isolated mobile safety optimization completed in `89e534c`;
- Stage 2.7.6 formal integration decision completed;
- mobile performance baseline stable at `390x844`;
- build-trace caveat did not reproduce during Stage 2.7-prep: `npm run build` completed successfully;
- Stage 2.7.1 checks passed: `npm run lint`, `npm run build`, `./node_modules/.bin/tsc --noEmit`;
- Stage 2.7.4 checks passed: `npm run lint`, `npm run build`, `./node_modules/.bin/tsc --noEmit`;
- no npm install was performed;
- no Three.js, React Three Fiber or WebGL dependency was installed;
- no hero redesign or production UI redesign was created;
- production code was not changed during Stage 2.7.1-2.7.6;
- Stage 2.7.5 changed only isolated experimental WebGL files:
  - `components/DecisionSingularityWebGL.tsx`;
  - `components/DecisionSingularityWebGL.module.css`;
- `stash@{0}: pre-stage-1.5-existing-changes` remains untouched and must not be applied without explicit permission.

Stage 2.7.4 performance notes:

- `/visual-lab` works as an isolated sandbox route;
- no file changes were made during profiling, so no Stage 2.7.4 implementation commit is needed;
- console errors were absent;
- horizontal overflow was absent;
- desktop FPS in Codex in-app browser was approximately `20-21`;
- mobile `390x844` FPS was approximately `26`;
- resize stress at `820x760` produced a low sample around `6 FPS`;
- DPR cap works with max `1.5`;
- First Load JS for `/visual-lab`: `90.9 kB`;
- post Stage 2.7.5 build output observed First Load JS for `/visual-lab`: `91.2 kB`;
- post Safari-safe motion fix build output observed First Load JS for `/visual-lab`: `91.4 kB`;
- post Stage 2.7.3 corrective cinematic pass build output observed First Load JS for `/visual-lab`: `91.7 kB`;
- cleanup/remount was checked through route transition;
- hidden-tab pause could not be fully verified because of in-app browser limitations;
- initial iPhone Safari real-device testing started: route opened, WebGL rendered, FPS was stable around `60`, layout/orientation/no-overflow/heat checks passed, but visible WebGL animation failed before the Safari-safe motion fix;
- iPhone Safari retest after Safari-safe motion fix passed: motion overlay exists, `Time` counter updates, visible animation is present, FPS remains around `60`, no heat observed and page stayed stable after `1-2` minutes;
- conclusion: WebGL sandbox remains experimental-only; do not integrate into production hero before further optimization and real-device Safari validation.

Stage 2.7.5 correction:

- current completed Stage 2.7.5 must be treated as mobile safety optimization, not full Safari validation;
- implemented safety measures include mobile-safe DPR cap `1.15`, mobile-safe quality state, lower-power WebGL context preference, reduced-motion handling, hidden-tab pause path and softer mobile shader intensity;
- initial iPhone/Safari validation found a blocker: FPS updated around `60`, but the singularity looked visually static before the Safari-safe motion fix;
- thermal behavior has not been measured on real devices;
- full adaptive quality tiers and reduced mobile mode remain future work if validation requires them.

Stage 2.7.5b Safari/iPhone validation checklist:

- status: prepared checklist only; Stage 2.7.5 is not complete until real Safari/iPhone validation is actually performed and documented;
- test scope: isolated `/visual-lab` WebGL sandbox only, no production hero integration;
- test URL: record exact URL used for real-device testing, for example `http://<local-network-ip>:3000/visual-lab` or deployed preview `/visual-lab`;
- device model: record exact iPhone model and chip generation if known;
- iOS version: record exact iOS version from Settings;
- Safari version: record Safari/WebKit version if available, otherwise record iOS version as proxy;
- viewport/orientation: test portrait and landscape, including Safari address bar collapsed/expanded states where possible;
- FPS observation: record visible debug-panel FPS after initial settle, after 60 seconds, after scroll, and after orientation changes;
- scroll/layout stability: verify no horizontal overflow, no clipped debug panel, no text overlap, stable canvas sizing and readable lab copy;
- resize/orientation behavior: rotate portrait to landscape and back at least 3 times, observe canvas resize, DPR cap, FPS recovery and visual continuity;
- memory/thermal behavior: run at least 5-10 minutes, watch for reloads, WebGL context loss, tab termination, jank increase or visible throttling;
- battery/heat notes: record starting/ending battery percentage if practical and subjective device heat level: cool, warm, hot;
- console errors: if connected to Mac Safari Web Inspector, record console errors, WebGL warnings, context loss/restore events and network errors;
- visual quality notes: evaluate whether the singularity remains cinematic, calm, premium, non-gaming and visually coherent in mobile-safe mode;
- pass criteria: no crash, no blank canvas unless graceful fallback appears, no console errors indicating runtime failure, no horizontal overflow, stable orientation recovery, readable UI, acceptable heat, and sustained FPS without severe degradation;
- fail criteria: repeated context loss, tab reload/termination, persistent blank canvas without fallback, severe FPS collapse after initial settle, layout overflow, unreadable UI, excessive heat, or Safari-specific runtime errors;
- decision gate for Stage 2.7.5c: proceed to adaptive quality / reduced mobile mode only if real-device results show FPS, heat, memory, orientation or Safari-specific instability that cannot be accepted for an experimental sandbox.

Stage 2.7.5b initial iPhone Safari result and blocker fix:

- real iPhone Safari opened `/visual-lab` correctly after confirming the server was running from the correct project root;
- WebGL rendered and the FPS overlay reported around `60 FPS`;
- layout stability passed;
- orientation change stability passed;
- horizontal overflow was absent;
- heat was not observed during the initial check;
- blocker: the visual WebGL singularity appeared static even though FPS was updating;
- likely technical cause: shader motion used absolute `requestAnimationFrame` time with mobile fragment precision risk, making subtle time-based changes visually collapse on iPhone Safari;
- fix applied only to the isolated sandbox: `components/DecisionSingularityWebGL.tsx` now uses bounded local shader time, fragment `highp` precision when available, Safari-safe motion diagnostics, and slightly clearer but still subtle cinematic breathing/depth/glow motion;
- production files were not changed and WebGL remains isolated in `/visual-lab`;
- retest result: `/visual-lab` opened on iPhone Safari, the motion overlay exists, the `Time` counter updates, visual animation is now visible as breathing zoom plus slight horizontal drift, FPS stayed around `60`, no heat was observed and the page remained stable after `1-2` minutes;
- previous animation blocker is resolved in the isolated sandbox;
- Stage 2.7.5b can be marked completed;
- Stage 2.7.5 overall is not fully complete until the adaptive quality / reduced mobile mode decision is made if required.

Stage 2.7.5c adaptive quality / reduced mobile mode decision:

- decision: no additional adaptive quality or reduced mobile mode implementation is required now;
- decision gate used: add stricter reduced mode only if real iPhone Safari data shows sustained FPS degradation, heat, memory pressure, context loss, orientation/layout instability, horizontal overflow or unreadable/failed motion;
- current iPhone Safari result after the Safari-safe motion fix does not trigger that gate: FPS stayed around `60`, motion is visible, no heat was observed, layout/orientation stayed stable and the page remained stable after `1-2` minutes;
- current sandbox already includes conservative mobile safeguards: small/mobile viewport detection, mobile-safe DPR cap `1.15`, lower-power WebGL context preference, reduced-motion path, hidden-tab pause path, softened mobile shader intensity and debug overlay with quality mode, DPR/pixel ratio, motion state and animation time;
- reduced mobile mode active: no, beyond the existing mobile-safe quality mode;
- no new WebGL code changes are needed for Stage 2.7.5c;
- Stage 2.7.5 can be considered complete for the current isolated sandbox validation scope;
- longer thermal profiling remains recommended before any production integration or formal Stage 2.7.6b integration decision, but it is not a blocker for the current Stage 2.7.5c decision.

Stage 2.7.6 formal integration decision:

- decision: keep the current production `DecisionSingularity`;
- do not replace the production hero;
- keep WebGL in `/visual-lab` only;
- no automatic production replacement is approved;
- future direction may be hybrid or partial integration later, but only after a separate approved stage;
- reason: isolated iPhone Safari sandbox validation passed, visible animation works, FPS stayed around `60`, no heat was observed in the short test and layout/orientation stayed stable;
- production integration is still blocked by stronger cinematic quality review, longer thermal profiling, production rollback plan and full visual regression QA;
- production files remain untouched.

Stage 2.7.3 corrective cinematic rendering audit:

- original Stage 2.7.3 goals: glow, bloom, layered fog, animated depth, volumetric feeling, living core effect and no gaming UI;
- achieved before corrective pass: dark-gold singularity direction, visible rings, event-horizon core, mobile-safe motion and non-gaming restraint;
- partially achieved before corrective pass: simulated bloom, atmospheric layering, volumetric depth and emotional gravity were present but still read closer to a technical prototype than a completed cinematic pass;
- missing before corrective pass: stronger layered fog, broader soft bloom, more depth perception, subtler volumetric veils and a more emotionally immersive gravity field;
- corrective pass applied only to `components/DecisionSingularityWebGL.tsx`: added soft fog veils, depth lensing, simulated horizon bloom, outer depth arc and calmer cinematic layering while preserving mobile-safe motion and avoiding particles/noise/gaming UI;
- achieved after corrective pass: glow, simulated bloom, layered fog, animated depth, initial volumetric feeling, living core effect and no gaming UI are satisfied for the isolated sandbox target;
- current feel after corrective pass: more cinematic, premium, singularity-like, alive and emotionally immersive than the previous technical prototype; still not production-ready and still lab-only;
- local QA: `npm run dev -- -p 3001` served `/visual-lab` from the correct repo and `curl` returned `200`;
- iPhone Safari safety note: previous iPhone Safari validation passed before this corrective visual pass, but real iPhone Safari has not yet been re-tested after the new fog/bloom/depth shader changes;
- strict Stage 2.7.3 closure: visually corrected, but final strict completion remains blocked until post-pass real iPhone Safari retest confirms FPS, heat, layout/orientation and visible motion remain safe.

Stage 2.7.3 corrective pass 2:

- real iPhone Safari retest after the first corrective pass: `/visual-lab` opened, animation was visible, breathing zoom plus slight horizontal drift worked, FPS stayed around `60`, no heat after `2-3` minutes, orientation was stable, vertical scroll existed, horizontal overflow was absent and there were no white screens, `404`, freezes or crashes;
- blocker remained: visual quality still did not feel deeper or more cinematic and still read as simple movement rather than a premium cinematic singularity;
- conclusion: Stage 2.7.3 remains blocked despite good technical stability;
- second isolated shader pass applied only to `components/DecisionSingularityWebGL.tsx`;
- pass 2 visual focus: stronger central gravity/depth, more visible layered atmospheric fog, richer amber/gold bloom, subtle volumetric halo, higher cinematic contrast and better internal energy illusion;
- mobile constraints preserved: no Three.js, no R3F, no npm install, existing DPR/mobile-safe behavior preserved, no particles overload, no gaming HUD, no chaotic neon and no aggressive motion;
- Stage 2.7.3 must not be marked completed until another real iPhone Safari retest confirms that the perceived cinematic depth is actually improved while FPS/heat/layout/orientation remain safe.

Stage 2.7.3b fa5dfd9 iPhone Safari retest:

- commit tested: `fa5dfd9` - controlled WebGL sandbox depth-contrast iteration;
- scope: isolated `/visual-lab` only, no production integration;
- technical result: pass;
- real iPhone Safari opened `/visual-lab`;
- WebGL stayed active;
- fallback did not appear;
- blank canvas did not occur;
- FPS stayed around `60`;
- DPR reported `1.15 / cap 1.15`;
- canvas reported `409x476`;
- motion stayed running;
- portrait and landscape orientation changes stayed stable;
- visible lag was not observed;
- visual result: warning/blocker;
- perceived cinematic depth improvement was almost not noticeable;
- center did not feel significantly deeper or heavier;
- visual appearance was almost the same as before `fa5dfd9`;
- conclusion: `fa5dfd9` is technically safe but visually insufficient;
- historical conclusion at that time: Stage 2.7.3b remained active and required explicit closure;
- current single-pass lightweight shader ceiling is now confirmed more strongly;
- current conclusion after the later pivot: do not continue micro-tweaks in the same shader path for MVP; advanced rendering would require a separate approved future stage.

Stage 2.7.3b research-gate boundary:

- current single-pass lightweight shader path is technically safe but visually insufficient;
- additional micro-tweaks are no longer approved as the default continuation path;
- next decision must be explicit before any next stage:
  - abandon the current shader path;
  - continue only as controlled research;
  - or approve a new isolated research branch;
- minimum information required before any future rendering experiment:
  - explicit approval;
  - one research direction only;
  - sandbox-only scope;
  - visual success criteria defined before implementation;
  - mobile Safari safety budget;
  - rollback checkpoint;
  - stop condition if visual gain is not validated;
  - dependency policy;
  - confirmation of no production imports, routes or navigation exposure;
- Stage 2.7.4 cannot start yet because Stage 2.7.3b has not closed and the visual-quality gate failed;
- Stage 2.7.3b should move toward documentation closure, not implementation.

Stage 2.7.3b reference-target visual gap:

- the uploaded reference screenshot is the current visual benchmark for the intended premium cinematic singularity direction;
- the current `/visual-lab` lightweight WebGL sandbox is technically safe, but does not match the benchmark;
- the gap is not only parameter tuning; it is a visual architecture gap;
- required target qualities:
  - dense orbital field;
  - black gravity core;
  - amber-gold accretion ring;
  - high optical density;
  - layered cinematic depth;
  - fine trajectory detail;
  - premium dark atmosphere;
- candidate future research directions:
  - hybrid static + animated architecture;
  - asset-backed visual layers;
  - multi-layer compositing;
  - controlled orbit/particle system;
  - multi-pass/post-processing research;
- no implementation is approved;
- production `DecisionSingularity` remains protected;
- `/visual-lab` remains isolated;
- Stage 2.7.4 remains blocked;
- future rendering work requires explicit approval.

Stage 2.7.3b preferred next research path:

- hybrid static + lightweight animated architecture is now the preferred next research path over additional lightweight shader micro-tuning;
- reason:
  - the current shader path is technically safe but visually insufficient;
  - the reference target depends on high-density detail that is better handled by a base visual asset;
- preferred direction:
  - static/reference-quality base layer;
  - lightweight overlays only;
- static candidates:
  - dense orbital field;
  - black gravity core;
  - amber-gold accretion ring;
  - fine trajectory detail;
  - cinematic dark atmosphere;
- animated candidates:
  - breathing glow;
  - subtle opacity pulse;
  - slow radial shimmer;
  - minimal orbit drift;
  - light atmospheric veil;
- constraints:
  - sandbox-only;
  - owned, licensed or generated asset required;
  - no production integration;
  - no dependency change by default;
  - reduced-motion fallback;
  - static fallback;
  - mobile Safari safety budget;
- Stage 2.7.4 remains blocked until Stage 2.7.3b documentation closure and explicit next-path approval.

Known content issue:

- part of the public UI still contains English text. This is a known localization/content pass item, not a Stage 2.1-2.7-prep regression.

## 4. Current CSS Architecture

Current global style entry order in `app/layout.tsx`:

```ts
import './styles/dashboard.css';
import './styles/auth.css';
import './styles/simulator.css';
import './globals.css';
import './styles/motion.css';
```

CSS responsibilities:

- `app/styles/dashboard.css` - base dashboard shell, navigation, dashboard content primitives, personal area modules, simulations/detail/privacy/security/loading dashboard styles.
- `app/styles/auth.css` - base auth shell/form styles for `/login`, `/register`, `/forgot-password`.
- `app/styles/simulator.css` - base home simulator/decision console styles.
- `app/styles/motion.css` - extracted animation keyframes/motion tokens.
- `app/globals.css` - canonical global layer and final dark-gold cascade locks. It still contains historical/final visual overrides and must remain authoritative for the active visual baseline.
- `components/DecisionSingularity.module.css` - scoped CSS module for production `DecisionSingularity`.

Cascade rule:

- selector-bearing extracted files are loaded before `globals.css` so the final dark-gold locks in `globals.css` keep priority;
- do not move final cascade locks out of `globals.css` without a dedicated visual regression plan;
- do not delete historical/final override blocks just because they look duplicated.

## 5. Critical Components - Do Not Rewrite Blindly

Do not fully rewrite or replace without explicit decision:

- `components/DecisionSingularity.tsx`
- `components/DecisionSingularity.module.css`
- `components/HomeSimulator.tsx`
- `components/DashboardShell.tsx`
- `lib/simulationEngine.ts`
- `SimulationResponse` contract
- `app/globals.css` canonical dark-gold layer
- localStorage keys:
  - `levio_es_mock_session`
  - `levio_es_saved_simulations`
  - `levio_es_language`

These parts hold the working MVP surface, black-gold product identity, mock simulation flow, dashboard structure and demo persistence.

## 6. Product And Visual Principles

Levio.es is not:

- a chatbot;
- a generic SaaS dashboard;
- a template AI assistant;
- a white clean corporate UI;
- a game UI.

Levio.es is:

- a Premium Black-Gold AI Decision Intelligence System;
- a strategic decision analysis interface;
- a consequence and risk modeling experience;
- a future-scenario simulation platform.

Mandatory visual rules:

- deep black / near-black foundation;
- deep black / graphite base;
- bright gold / amber / bronze highlights;
- high-contrast readable text;
- lightweight singularity symbol;
- restrained focus and active states;
- premium minimalism;
- fast Safari/iPhone performance;
- no gaming UI direction;
- no white redesign;
- no generic startup gradient direction;
- no heavy production WebGL/canvas/particle direction.

## 7. Implemented Product Surface

Implemented and currently stable:

- public home page with Premium Black-Gold Levio product UI;
- hero simulator and local fallback simulation flow;
- POST `/api/simulate` mock route;
- structured `SimulationResponse` mock contract;
- saved simulations through `levio_es_saved_simulations`;
- mock auth pages:
  - `/login`
  - `/register`
  - `/forgot-password`
- mock protected dashboard through `MockAuthGate`;
- dashboard overview;
- dashboard simulations list;
- simulation detail page;
- decisions page;
- memory page;
- profile page;
- privacy page;
- security page;
- desktop dashboard sidebar;
- mobile compact dashboard `<details>` navigation;
- demo feedback controls.

## 8. Technical Stack

- Next.js `14.2.5` with App Router.
- React `18.2.0`.
- TypeScript `6.0.3`.
- Main global CSS architecture:
  - `app/styles/dashboard.css`
  - `app/styles/auth.css`
  - `app/styles/simulator.css`
  - `app/globals.css`
  - `app/styles/motion.css`
- Scoped singularity CSS:
  - `components/DecisionSingularity.module.css`
- Mock API:
  - `app/api/simulate/route.ts`
- Mock simulation engine:
  - `lib/simulationEngine.ts`
- Demo/personal data:
  - `lib/mockSimulations.ts`
  - `lib/personalArea.ts`
- Mock auth:
  - `components/MockAuthGate.tsx`
- Scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `./node_modules/.bin/tsc --noEmit`

Important `AGENTS.md` note:

- the project warns that this is "not the Next.js you know";
- before Next.js code changes, read relevant guides in `node_modules/next/dist/docs/`;
- in the current install this directory has previously been absent, so document the absence if checked.

## 9. Roadmap

Stable frontend stabilization phase:

- Stage 2.1 - motion CSS stabilization - completed in `8eeb150`.
- Stage 2.2 - dashboard CSS stabilization - completed in `959ffe5`.
- Stage 2.3 - auth CSS stabilization - completed in `7ea3e61`.
- Stage 2.4 - simulator CSS stabilization - completed in `c9a86da`.
- Stage 2.5 - visual regression QA - completed.
- Stage 2.6 - checkpoint + context sync - completed in `c81a9c8`.
- Stage 2.7-prep - visual engine preparation - completed in `0cec475`.
- Stage 2.7.1 - WebGL architecture research - completed in `3d8ef6e`.

Experimental visual engine phase:

- Stage 2.7.2 - isolated WebGL sandbox prototype - completed in `0781b46`.
- Stage 2.7.3 - isolated WebGL visual quality iteration - completed in `5553455`.
- Stage 2.7.3b - `fa5dfd9` technical iPhone Safari safety passed, but visual depth improvement failed; stage remains active.
- Stage 2.7.4 - blocked until Stage 2.7.3b closes under strict stage discipline, despite older profiling notes.
- Stage 2.7.5 - provisional mobile safety work in `89e534c`; not a final validation stage or production-integration basis.
- Stage 2.7.6 - provisional/no-production decision only; production replacement remains blocked.
- Stage 2.7.7 - blocked; no escalation stage is approved.
- Stage 2.7.5b - real Safari/iPhone validation completed after Safari-safe motion retest.
- Stage 2.7.5c - adaptive quality / reduced mobile mode decision completed; no extra reduced mode required now.
- Stage 2.7.6b - reserved for a future production integration proposal only if hybrid or partial integration is explicitly requested later.

Locked until explicit later stages:

- real AI backend;
- OpenAI API integration;
- Supabase/Auth.js/Clerk authentication;
- database;
- payments;
- production persistence;
- production privacy/security implementation.

## 10. Critical Experimental Rules

These rules are mandatory:

- WebGL experiments are forbidden before Stage 2.7-prep.
- Production `DecisionSingularity` must not be directly replaced by WebGL.
- WebGL work must run through an isolated sandbox/experimental track.
- Simulator business logic is protected.
- `SimulationResponse` contract is protected.
- Mobile performance baseline is critical and must be measured/protected.
- No gaming UI direction.
- Premium black-gold product minimalism must remain.
- Experimental visual engine work must not contaminate the stable frontend stabilization phase.
- `VISUAL_ENGINE_PLAN.md` conclusion is binding for the current stage: do not implement WebGL now; preserve production baseline.
- Stage 2.8 pivot is binding: heavy `/visual-lab`/WebGL directions are historical-only and must not be integrated into production hero without a new approved stage.
- Stage 2.7.3b `fa5dfd9` result remains historical evidence: technical iPhone Safari safety passed, but perceived cinematic depth did not improve enough, which helped justify the later pivot away from heavy cinematic/WebGL production work.
- The single-pass lightweight shader visual ceiling is confirmed; do not spend more MVP effort on micro-tweaks in that direction.
- Any future advanced rendering research requires a separate approved stage and must not displace the current Premium Black-Gold MVP path.
- Stage 2.7.5 correction is binding: current mobile work is safety optimization only, not completed Safari validation.
- Stage 2.7.5b result is binding: iPhone Safari retest passed after the isolated Safari-safe motion fix; Stage 2.7.5 overall still awaits the Stage 2.7.5c adaptive-quality/reduced-mobile-mode decision if required.
- Stage 2.7.5c result is binding: current real-device data does not require additional adaptive quality or reduced mobile mode; Stage 2.7.5 is complete for the isolated sandbox scope, with longer thermal profiling still recommended before any production integration decision.
- Stage 2.7.6 formal decision is binding: keep current production `DecisionSingularity`, do not replace production hero, keep WebGL isolated in `/visual-lab`, and require separate approval before any hybrid or partial production integration.

## 11. Stage Separation

Stable frontend stabilization phase:

- focuses on CSS consolidation, route QA, layout stability, documentation sync and regression prevention;
- must preserve the current production visual system;
- must not introduce new product architecture or backend systems.

Experimental visual engine phase:

- starts only after Stage 2.7-prep;
- must be isolated from production routes/components until explicitly approved;
- may explore WebGL/advanced rendering only inside a sandbox path or clearly separated experimental module.

## 12. Workflow Rules

Before any meaningful change:

1. Check `git status`.
2. Confirm `stash@{0}: pre-stage-1.5-existing-changes` is not being applied.
3. Keep edits scoped to the current stage.
4. Do not modify production code during documentation-only tasks.

After every meaningful implementation stage:

1. Run:
   - `npm run lint`
   - `npm run build`
   - `npx tsc --noEmit`
2. Run browser QA for affected routes on desktop and mobile `390px`.
3. Check for console errors and horizontal overflow.
4. Review `git diff`.
5. Commit only after successful checks.
6. Do not push unless explicitly requested.
7. Update context docs when stage boundaries change:
   - `PROJECT_CONTEXT.md`
   - `LEVIO_CURRENT_STATE.md`
   - `CURRENT_STAGE.md`

## 13. Latest Verified QA Baseline

Stage 2.1:

- motion extraction completed;
- keyframes moved to `app/styles/motion.css`;
- lint/build/tsc passed;
- route QA showed no horizontal overflow or console errors.

Stage 2.2:

- dashboard CSS extraction completed;
- desktop and mobile `390px` dashboard routes stable:
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/privacy`
  - `/dashboard/security`
  - `/dashboard/simulations`
  - `/dashboard/simulations/oferta-premium`
  - `/dashboard/decisions`
  - `/dashboard/memory`
- dashboard mobile nav stable:
  - compact menu visible at `390px`;
  - sidebar nav hidden at mobile;
  - menu opens;
  - links visible;
  - click to `/dashboard/simulations` works.

Stage 2.3:

- auth CSS extraction completed;
- desktop and mobile `390px` auth routes stable:
  - `/login`
  - `/register`
  - `/forgot-password`
- Spanish labels/buttons/links preserved;
- mock login flow stable:
  - `/login?next=/dashboard` opens `/dashboard` after `Entrar`;
- no console errors;
- no horizontal overflow.

Stage 2.4:

- simulator CSS extraction completed in `c9a86da`;
- base home simulator/decision console styles moved to `app/styles/simulator.css`;
- `simulator.css` is imported before `globals.css`;
- `globals.css` remains the canonical final dark-gold cascade layer;
- production `HomeSimulator`, `DecisionSingularity`, WebGL and simulator business logic were not rewritten.

Stage 2.5:

- visual regression QA completed after Stage 2.4;
- desktop `1440x900` QA stable:
  - `/`
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/privacy`
  - `/dashboard/security`
  - `/dashboard/simulations`
  - `/dashboard/simulations/oferta-premium`
  - `/dashboard/decisions`
  - `/dashboard/memory`
- mobile `390x844` QA stable:
  - `/`
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/dashboard`
- mobile dashboard compact nav opens and shows 7 links;
- home simulator interaction stable:
  - textarea input accepted;
  - `POST /api/simulate` returned `200`;
  - result rendered with 4 scenario cards;
- no console errors observed;
- no horizontal overflow detected;
- cinematic dark-gold visual baseline preserved.

Build note:

- `npm run lint` passed;
- `./node_modules/.bin/tsc --noEmit` passed;
- `npm run build` compiled successfully, completed type/lint validation and generated `19/19` static pages, then stayed on `Collecting build traces` for several minutes and was stopped manually. Treat this as a local build-trace caveat, not a Stage 2.5 visual regression.

Stage 2.6:

- checkpoint + context sync completed in `aeace9f`;
- Stage 2 documentation closure completed in `c81a9c8`;
- `PROJECT_CONTEXT.md`, `LEVIO_CURRENT_STATE.md` and `CURRENT_STAGE.md` were synchronized after Stage 2.5 visual QA;
- no production code was changed;
- next planned stage is Stage 2.7-prep, visual engine preparation.

Stage 2.7-prep:

- visual engine preparation completed as a protective checkpoint before future experiments;
- backup branch created: `stable/stage-2-frontend-baseline`;
- `npm run build` passed successfully and the previous `Collecting build traces` caveat did not reproduce;
- `npm run lint` passed with no warnings or errors;
- `./node_modules/.bin/tsc --noEmit` passed;
- mobile performance baseline at `390x844` stable:
  - `/` rendered without horizontal overflow;
  - `/dashboard` rendered after mock login without horizontal overflow;
  - mobile dashboard compact nav opens and shows 7 links;
  - home simulator accepted input, called `POST /api/simulate`, rendered 5 thinking steps and 4 scenario cards;
  - console errors were empty;
  - animations were subjectively stable with no obvious jank or layout shift;
- stable frontend foundation is protected before Stage 2.7.1;
- no npm install was performed;
- no Three.js or React Three Fiber dependency was installed;
- no WebGL components were created;
- `/visual-lab` was not created;
- hero and production UI were not redesigned;
- production `DecisionSingularity` remains protected;
- production `HomeSimulator`, simulator logic and `SimulationResponse` contract remain protected;
- WebGL remains forbidden in production until isolated architecture approval.

## 14. Git State At This Context Update

Latest local commits before this documentation update:

```text
c81a9c8 Finalize Stage 2 checkpoint documentation
aeace9f Sync Stage 2 visual QA checkpoint
c9a86da Stabilize simulator CSS structure for Stage 2
41c34bc Update Levio project context after Stage 2 stabilization
7ea3e61 Stabilize auth CSS structure for Stage 2
959ffe5 Stabilize dashboard CSS structure for Stage 2
8eeb150 Begin safe CSS consolidation for Stage 2
0777b7e Finalize Stage 1 stable baseline
```

Stash:

```text
stash@{0}: On main: pre-stage-1.5-existing-changes
```

Backup branch:

```text
stable/stage-2-frontend-baseline
```

The stash was not applied during Stage 2.1-2.5 and must not be applied without explicit permission.

## 15. Instruction For New Codex Chat

Start the next chat with:

```text
Прочитай PROJECT_CONTEXT.md в корне проекта Levio.es.
Используй его как основной актуальный контекст проекта.
Продолжай строго от описанного состояния.
Не начинай проект заново.
Не применяй stash без отдельного разрешения.
Не меняй production code во время documentation-only задач.
Все технические отчеты пиши на русском.
Видимый UI должен оставаться на испанском.
```

Critical reminder:

- stable frontend stabilization and experimental visual engine work are separate phases;
- WebGL is not allowed until Stage 2.7-prep;
- production `DecisionSingularity` remains protected;
- simulator logic and `SimulationResponse` contract remain protected.
