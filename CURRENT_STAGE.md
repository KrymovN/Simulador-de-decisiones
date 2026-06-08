# CURRENT STAGE - LEVIO.ES

Date: 8 June 2026, Europe/Madrid.

## Current Confirmed Checkpoint - 8 June 2026

Stage 2.9A - Mobile Navigation + Scroll Motion Timing + Simulator Premium Polish - is the current confirmed checkpoint.

Confirmed facts from the repository:

- `848a108` locked Stage 2.8G Hero artwork fidelity.
- `9c7447d` completed Stage 2.8H homepage minimal premium reduction.
- `6adefd6` completed the Stage 2.8 homepage motion and brand polish checkpoint.
- Stage 2.9A preserves product architecture and changes only the final homepage CSS cascade.
- The public homepage retains `public/hero-approved-network-bg.png`, rendered through `next/image` with `quality={100}` and `unoptimized`.
- Mobile navigation is one controlled horizontal row: `Inicio`, `Simulador`, `Mi espacio`, `Iniciar sesión`.
- Mobile root-scroll reveal ranges start later and run longer across hero feature, decision-system, process and capability blocks.
- Hero title scroll-exit starts earlier and the approved artwork breathing cycle is accelerated to `21s`.
- Simulator workspace has deeper black-gold composition, a premium input surface and stronger CTA without changes to `HomeSimulator` business logic.
- Brand/favicons are served through `app/icon.png`, `public/favicon.ico`, `public/icon-192.png`, `public/apple-icon.png` and `public/manifest.webmanifest`.
- Duplicate App Router metadata file `app/favicon.ico` is removed; `app/layout.tsx` explicitly points active favicon links to `public/favicon.ico`.
- Obsolete production visual assets and unused `components/SingularityVisual.tsx` are removed.

Current direction remains unchanged: Levio.es is an AI Decision Intelligence System, not a chatbot, AI playground, sci-fi showcase, WebGL experiment or visual-effects demo.

Stage 2.9A is complete. No next implementation stage is approved; any continuation requires separate explicit approval.

## Current Authoritative Stage - 30 May 2026

This section supersedes older Stage 2.7.x visual-research notes below wherever they conflict with the current plan.

- Active stage: Stage 2.8 - documentation/current-state synchronization, production state alignment and MVP preparation after strategic visual pivot.
- Current product direction: Premium Black-Gold AI Decision Intelligence System.
- Stage 2.7.x is completed as research and direction discovery. Its cinematic/WebGL/shader work remains historical context, not the current production target.
- Heavy production WebGL is rejected for the current MVP path. Do not integrate WebGL/canvas/Three.js/R3F into production without a new explicit approval.
- Current production checkpoint: `78913da` - `Refocus Levio homepage toward premium black-gold product UI`.
- Stage 2.8 priorities: synchronize documentation, verify production after the black-gold pivot, plan legacy heavy visual CSS cleanup, and prepare MVP decision-flow polish.
- Protected areas remain protected: simulator logic, API contracts, auth/dashboard logic, dependency files and deployment settings.

## Superseded Transition State - 24 May 2026

Historical note: this was the handoff source of truth before the Stage 2.8 synchronization and the 30 May 2026 product pivot. Treat it as superseded by `Current Authoritative Stage - 30 May 2026`.

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

## Stage 2.7.3b Direction Checkpoint - 26 May 2026

This checkpoint supersedes the previous hybrid static image direction for the active `/visual-lab` implementation.

- Active/checkpointed stage: Stage 2.7.3b - isolated CSS-only black-gold sphere/prognosis sandbox direction.
- The hybrid static image + lightweight overlays direction has been visually rejected and must not be continued as the current direction.
- `public/visual-lab/singularity-hybrid-reference.png` remains a tracked asset, but it is no longer the dominant base layer for `/visual-lab`.
- Current accepted sandbox direction: CSS-only black-gold living sphere with forecast/risk/value labels, soft orbit drift, breathing glow and calm premium cinematic motion.
- Current `/visual-lab` implementation uses no WebGL, no canvas, no Three.js, no React Three Fiber and no new dependencies.
- Production remains untouched: no production hero integration and no changes to `DecisionSingularity`, `HomeSimulator`, simulator logic, `app/page.tsx`, `app/layout.tsx` or `app/globals.css`.
- `/visual-lab` remains an isolated sandbox route and is not linked into production navigation.
- Stage 2.7.4 remains blocked and must not start from this checkpoint.

## Historical transition checkpoint - 27 May 2026

Historical note: this block was the final handoff checkpoint before the repository/deployment migration and production homepage pivot. It is retained for history and superseded by the 30 May 2026 current stage.

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

## Historical next context recovery

Historical recovery instructions from the 27 May handoff:

- Read `PROJECT_CONTEXT.md`, `CURRENT_STAGE.md` and `LEVIO_CURRENT_STATE.md`.
- Run `git status --short`, `git branch --show-current` and `git log --oneline -10` from `/Users/s3/Documents/New project`.
- Confirm that Stage 2.7.3b is checkpointed, `/visual-lab` remains isolated, production files are untouched and Stage 2.7.4 remains blocked.
- Do not immediately start Stage 2.7.4, migration, deploy, push, remote changes, dependency changes, file copying between repositories or production integration.
- Next safe step: begin Stage 2.8 with a read-only repository/deployment migration preparation audit.

## Historical Stage 2.8 first task

Historical first task for the original Stage 2.8 migration-preparation pass:

- Audit `/Users/s3/Documents/New project`.
- Audit `/Users/s3/levio-app`.
- Identify the GitHub remote(s) and branch relationships.
- Identify which local folder is connected to the current production/Vercel source.
- Prepare a backup and migration plan before any file transfer, remote change, push or deploy.
- Do not copy, delete, move, deploy, push or migrate anything without separate explicit approval.

## Strategic visual pivot - 28 May 2026

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

## Current Stage

Stage 2.9A - mobile navigation, scroll motion timing and simulator premium polish - COMPLETED CHECKPOINT.

Roadmap from the current checkpoint:

- Stage 2.7.x: completed research track covering visual-engine exploration, `/visual-lab`, WebGL/shader testing, mobile safety checks and the final strategic pivot away from heavy cinematic production visuals.
- Stage 2.8: active documentation, production-state alignment and MVP preparation around the Premium Black-Gold AI Decision Intelligence System direction.
- Stage 2.9: provisional production QA, legacy visual CSS cleanup and homepage flow hardening after explicit approval.
- Stage 3: provisional backend/auth/storage/real AI integration planning after the frontend MVP direction is stable.

Completed Stage 2 stabilization commits:

- `8eeb150` - Stage 2.1, motion.css extraction.
- `959ffe5` - Stage 2.2, dashboard.css extraction.
- `7ea3e61` - Stage 2.3, auth.css extraction.
- `c9a86da` - Stage 2.4, simulator.css extraction.
- Stage 2.5 visual regression QA completed after `c9a86da`.
- `aeace9f` - Stage 2.6, checkpoint + context sync.
- `c81a9c8` - Stage 2.6 documentation closure.
- `0cec475` - Stage 2.7-prep visual engine preparation completed.
- `3d8ef6e` - Stage 2.7.1 WebGL architecture research completed.
- `0781b46` - Stage 2.7.2 isolated WebGL sandbox prototype completed.
- `5553455` - Stage 2.7.3 isolated WebGL visual quality iteration completed.
- Stage 2.7.3 corrective closure status: isolated shader cinematic pass applied; local `/visual-lab` route QA passed; strict closure remains pending post-pass real iPhone Safari retest.
- Stage 2.7.3 corrective pass 2 status: real iPhone Safari retest after the first corrective pass stayed technically stable but did not improve perceived cinematic depth; second isolated shader depth pass applied; strict closure remains pending another real iPhone Safari visual-quality retest.
- `fa5dfd9` - Stage 2.7.3b controlled depth-contrast iteration committed; real iPhone Safari retest passed technical safety but visual improvement was almost not noticeable. This is now historical evidence for the later pivot, not an active-stage marker.
- Stage 2.7.3b direction checkpoint: hybrid static image direction rejected; `/visual-lab` now holds an isolated CSS-only black-gold living sphere/prognosis sandbox with forecast/risk/value labels and no WebGL/canvas/Three.js/R3F.
- Stage 2.7.4 isolated WebGL performance profiling and stress testing completed with no file changes and no implementation commit needed.
- `89e534c` - Stage 2.7.5 isolated WebGL mobile safety optimization completed; this is not full Safari/iPhone validation.
- Stage 2.7.6 formal integration decision completed: keep production `DecisionSingularity`, keep WebGL isolated in `/visual-lab`, no production replacement approved.
- Stage 2.8G Hero artwork fidelity completed in `848a108`.
- Stage 2.8H homepage minimal premium reduction completed in `9c7447d`.
- Stage 2.8 homepage motion and brand polish checkpoint completed in `6adefd6`.
- Stage 2.9A mobile navigation, scroll timing and simulator premium polish completed.

## Current CSS Architecture

Current style files:

- `app/styles/motion.css`
- `app/styles/dashboard.css`
- `app/styles/auth.css`
- `app/styles/simulator.css`
- `app/globals.css`

Import/cascade policy:

- `dashboard.css`, `auth.css` and `simulator.css` are intentionally imported before `globals.css`.
- `globals.css` remains the canonical final dark-gold cascade layer.
- `motion.css` is keyframes-only and separate from selector cascade concerns.
- Do not remove or relocate final dark-gold cascade locks without a dedicated visual regression plan.

## Current Stable Status

Stable after Stage 2.7.4:

- cinematic dark-gold baseline preserved;
- desktop stable;
- mobile `390px` stable;
- dashboard mobile navigation stable;
- auth routes stable;
- mock auth flow stable;
- home simulator interaction stable;
- no visual regressions detected;
- context files synchronized after Stage 2.5 QA;
- stable frontend baseline backup branch created: `stable/stage-2-frontend-baseline`;
- mobile performance baseline stable at `390x844`;
- build-trace caveat did not reproduce: `npm run build` completed successfully;
- Stage 2.7.1 research documentation completed in `VISUAL_ENGINE_PLAN.md`;
- Levio product/visual identity source of truth added in `LEVIO_IDENTITY_CORE.md`;
- Stage 2.7.1 checks passed: `npm run lint`, `npm run build`, `./node_modules/.bin/tsc --noEmit`;
- Stage 2.7.2 isolated `/visual-lab` sandbox created in `0781b46`;
- Stage 2.7.3 isolated WebGL visual quality iteration completed in `5553455`;
- Stage 2.7.3 corrective cinematic rendering pass improved glow, simulated bloom, layered fog, animated depth, volumetric feeling and living core motion inside the isolated sandbox;
- Stage 2.7.3 corrective pass 2 further strengthened central gravity/depth, layered atmospheric fog, amber/gold bloom, volumetric halo and internal energy illusion inside the isolated sandbox;
- `fa5dfd9` depth-contrast iteration passed real iPhone Safari technical safety, but did not produce enough perceived cinematic depth or emotional gravity improvement;
- Stage 2.7.4 profiling completed: `/visual-lab` works, no console errors, no horizontal overflow;
- Stage 2.7.4 performance samples: desktop `20-21 FPS`, mobile `390x844` about `26 FPS`, resize `820x760` low sample about `6 FPS`;
- DPR cap works with max `1.5`;
- First Load JS for `/visual-lab`: `90.9 kB`;
- post Stage 2.7.5 build output observed First Load JS for `/visual-lab`: `91.2 kB`;
- post Safari-safe motion fix build output observed First Load JS for `/visual-lab`: `91.4 kB`;
- post Stage 2.7.3 corrective cinematic pass build output observed First Load JS for `/visual-lab`: `91.7 kB`;
- cleanup/remount checked through route transition;
- hidden-tab pause not fully verified because of in-app browser limitations;
- initial iPhone Safari real-device testing started: `/visual-lab` opened, WebGL rendered, FPS was stable around `60`, layout/orientation/no-overflow/heat checks passed, but visible WebGL animation failed before the Safari-safe motion fix;
- iPhone Safari retest after Safari-safe motion fix passed: motion overlay exists, `Time` counter updates, visual animation is visible as breathing zoom plus slight horizontal drift, FPS stayed around `60`, no heat was observed and the page remained stable after `1-2` minutes;
- Stage 2.7.5c adaptive quality / reduced mobile mode decision completed: no additional reduced mode is required now because current real-device data does not trigger the decision gate;
- Stage 2.7.5 mobile safety optimization completed only inside isolated WebGL sandbox files;
- Stage 2.7.5 implemented mobile-safe DPR cap, mobile-safe quality state, lower-power WebGL context preference, reduced-motion handling, hidden-tab pause path and softer mobile shader intensity;
- Stage 2.7.6 formal integration decision completed: current production `DecisionSingularity` remains active, production hero is not replaced, `/visual-lab` remains isolated and no automatic production replacement is approved;
- no npm install was performed;
- no Three.js, React Three Fiber or WebGL dependency was installed;
- no hero redesign or production UI redesign was created;
- production code was not changed during Stage 2.7.1-2.7.6;
- Stage 2.7.5 changed only `components/DecisionSingularityWebGL.tsx` and `components/DecisionSingularityWebGL.module.css`;
- `stash@{0}: pre-stage-1.5-existing-changes` exists and has not been applied.

## QA Baseline From Stage 2.1-2.7-prep

Stage 2.1:

- motion extraction completed in `8eeb150`;
- lint/build/tsc passed;
- route QA found no console errors or horizontal overflow.

Stage 2.2:

- dashboard extraction completed in `959ffe5`;
- desktop and mobile `390px` dashboard routes stable:
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/privacy`
  - `/dashboard/security`
  - `/dashboard/simulations`
  - `/dashboard/simulations/oferta-premium`
  - `/dashboard/decisions`
  - `/dashboard/memory`
- mobile dashboard nav stable.

Stage 2.3:

- auth extraction completed in `7ea3e61`;
- desktop and mobile `390px` auth routes stable:
  - `/login`
  - `/register`
  - `/forgot-password`
- Spanish UI preserved;
- mock login flow stable.

Stage 2.4:

- simulator extraction completed in `c9a86da`;
- simulator base styles moved to `app/styles/simulator.css`;
- `simulator.css` is imported before `globals.css`;
- production `HomeSimulator`, `DecisionSingularity`, WebGL and simulator business logic were not rewritten.

Stage 2.5:

- visual regression QA completed;
- desktop `1440x900` public/auth/dashboard routes stable;
- mobile `390x844` home/auth/dashboard checks stable;
- mobile dashboard compact nav opens and shows 7 links;
- home simulator interaction stable:
  - textarea input accepted;
  - `POST /api/simulate` returned `200`;
  - result rendered with 4 scenario cards;
- no console errors observed;
- no horizontal overflow detected;
- `npm run lint` passed;
- `./node_modules/.bin/tsc --noEmit` passed;
- `npm run build` compiled successfully, completed type/lint validation and generated `19/19` static pages, then stayed on `Collecting build traces` for several minutes and was stopped manually. This is a local build-trace caveat, not a visual regression.

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

Stage 2.7.1:

- WebGL architecture research completed in `3d8ef6e`;
- `VISUAL_ENGINE_PLAN.md` created as the research artifact;
- Three.js and React Three Fiber were evaluated at architecture level only;
- Next.js App Router, hydration/SSR, Mobile Safari and weak-device GPU risks were documented;
- conclusion is explicit: do not implement WebGL now, preserve production baseline;
- no npm install was performed;
- no dependencies were added;
- no production code was changed;
- `npm run lint` passed with no warnings or errors;
- `npm run build` passed;
- `./node_modules/.bin/tsc --noEmit` passed;
- next possible stage is only an isolated experimental WebGL track, not production hero integration.

Stage 2.7.2:

- isolated `/visual-lab` route created in `0781b46`;
- raw WebGL sandbox component created without Three.js or React Three Fiber;
- fallback, cleanup, resize handling, DPR cap, hidden-tab pause path, prefers-reduced-motion path and FPS/debug overlay were implemented;
- route was not connected to production navigation;
- production hero and simulator flow were not changed.

Stage 2.7.3:

- isolated WebGL singularity visuals refined in `5553455`;
- visual iteration stayed inside `components/DecisionSingularityWebGL.tsx` and `components/DecisionSingularityWebGL.module.css`;
- production code was not changed;
- dependencies were not added.

Stage 2.7.3 corrective cinematic rendering audit:

- original visual goals:
  - glow;
  - bloom;
  - layered fog;
  - animated depth;
  - volumetric feeling;
  - living core effect;
  - no gaming UI.
- achieved before corrective pass:
  - dark-gold singularity direction;
  - event-horizon core;
  - ring structure;
  - mobile-safe motion;
  - restrained non-gaming behavior.
- partially achieved before corrective pass:
  - simulated bloom;
  - atmospheric layering;
  - volumetric depth;
  - emotional gravity.
- missing cinematic qualities before corrective pass:
  - stronger layered fog;
  - broader soft bloom;
  - deeper atmospheric stacking;
  - subtler volumetric veils;
  - more immersive gravity field.
- corrective improvement applied only inside `components/DecisionSingularityWebGL.tsx`:
  - soft fog veils;
  - depth lensing;
  - simulated horizon bloom;
  - outer depth arc;
  - calmer cinematic atmospheric layering.
- current feel after corrective pass:
  - more cinematic;
  - more premium;
  - more singularity-like;
  - more alive;
  - more emotionally immersive than the previous technical prototype;
  - still lab-only and not production-ready.
- local QA:
  - `npm run dev -- -p 3001` served `/visual-lab` from the correct repo;
  - `curl` returned `200`;
  - dev server was stopped after QA.
- iPhone Safari safety note:
  - previous iPhone Safari validation passed before this corrective visual pass;
  - real iPhone Safari has not yet been re-tested after the new fog/bloom/depth shader changes.
- strict closure status:
  - visually corrected;
  - still blocked until post-pass real iPhone Safari retest confirms FPS, heat, layout/orientation and visible motion remain safe.

Stage 2.7.3 corrective pass 2:

- real iPhone Safari retest after the first corrective pass:
  - `/visual-lab` opened;
  - animation was visible;
  - breathing zoom plus slight horizontal drift worked;
  - FPS stayed around `60`;
  - no heat after `2-3` minutes;
  - orientation was stable;
  - vertical scroll existed;
  - horizontal overflow was absent;
  - no white screen, `404`, freeze or crash occurred.
- blocker remained:
  - visual quality did not feel deeper or more cinematic;
  - sandbox still read as simple motion instead of a premium cinematic singularity.
- conclusion:
  - Stage 2.7.3 remains blocked despite good technical stability.
- second isolated shader pass applied only to `components/DecisionSingularityWebGL.tsx`;
- pass 2 visual focus:
  - stronger central gravity/depth;
  - more visible layered atmospheric fog;
  - richer amber/gold bloom;
  - subtle volumetric halo;
  - more premium cinematic contrast;
  - better internal energy illusion.
- constraints preserved:
  - no Three.js;
  - no R3F;
  - no npm install;
  - existing DPR/mobile-safe behavior preserved;
  - no particle overload;
  - no gaming HUD;
  - no chaotic neon;
  - no aggressive motion.
- strict closure status:
  - Stage 2.7.3 must not be marked completed until another real iPhone Safari retest confirms perceived cinematic depth improvement while FPS, heat, layout/orientation and visible motion remain safe.

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

Stage 2.7.4:

- isolated WebGL performance profiling and stress testing completed;
- no files were changed during profiling, so no implementation commit is needed;
- `/visual-lab` worked in the Codex in-app browser;
- console errors were absent;
- horizontal overflow was absent on desktop and mobile;
- desktop FPS was approximately `20-21` in Codex in-app browser;
- mobile `390x844` FPS was approximately `26`;
- resize stress at `820x760` produced a low sample around `6 FPS`;
- DPR cap worked with max `1.5`;
- First Load JS for `/visual-lab` was `90.9 kB`;
- cleanup/remount was checked through route transition;
- hidden-tab pause could not be fully verified because of in-app browser limitations;
- Mobile Safari real-device testing has not been performed yet;
- conclusion: WebGL sandbox remains experimental-only; do not integrate into production hero before performance optimization and real-device Safari validation.

Stage 2.7.5 correction:

- current completed Stage 2.7.5 is mobile safety optimization, not full Safari validation;
- already done:
  - mobile-safe DPR cap lowered to `1.15` for mobile mode;
  - mobile-safe quality state added to the debug/status surface;
  - WebGL context now requests lower-power preference;
  - reduced-motion and hidden-tab pause paths remain part of the sandbox;
  - mobile shader intensity was softened;
  - changes stayed inside isolated `DecisionSingularityWebGL` files;
- not done:
  - completed real-device iPhone Safari validation after the Safari-safe motion fix;
  - thermal/throttling measurement on real devices;
  - formal device matrix;
  - full adaptive quality tiers beyond the current mobile-safe mode;
  - production integration.

Stage 2.7.5b Safari/iPhone validation checklist:

- status: checklist prepared only; Stage 2.7.5 is not complete until real Safari/iPhone validation is actually performed and results are documented;
- scope:
  - test only isolated `/visual-lab`;
  - do not test or integrate production hero as part of this stage;
  - do not modify WebGL code during the observation pass.
- environment fields to record:
  - device model;
  - iOS version;
  - Safari version if available, otherwise iOS/WebKit proxy;
  - test URL, such as `http://<local-network-ip>:3000/visual-lab` or deployed preview `/visual-lab`;
  - network mode: local Wi-Fi, preview deployment or other.
- viewport/orientation matrix:
  - portrait initial load;
  - portrait after Safari address bar collapse/expand;
  - landscape initial load;
  - landscape after address bar collapse/expand where possible;
  - portrait to landscape to portrait repeated at least 3 times.
- observations to record:
  - FPS from the visible debug panel after initial settle;
  - FPS after 60 seconds;
  - FPS after scroll;
  - FPS after each orientation change;
  - debug-panel DPR and quality mode;
  - scroll/layout stability;
  - horizontal overflow presence or absence;
  - canvas resize behavior;
  - visual continuity during orientation changes;
  - memory pressure symptoms: reloads, tab termination, context loss, progressive jank;
  - thermal behavior after 5-10 minutes;
  - battery/heat notes, including starting/ending battery percentage if practical;
  - console errors if connected to Mac Safari Web Inspector;
  - WebGL warnings or context loss/restore events;
  - visual quality notes: cinematic, calm, premium, non-gaming, readable.
- pass criteria:
  - no crash, tab termination or unexpected reload;
  - no persistent blank canvas unless graceful fallback appears;
  - no console errors indicating runtime failure;
  - no horizontal overflow;
  - orientation changes recover layout and canvas sizing;
  - debug panel remains readable;
  - heat remains acceptable for an experimental sandbox;
  - FPS remains usable without severe sustained degradation.
- fail criteria:
  - repeated WebGL context loss;
  - tab reload or termination;
  - persistent blank canvas without fallback;
  - severe FPS collapse after initial settle or orientation changes;
  - layout overflow, clipped controls or unreadable text;
  - excessive heat or rapid battery drain;
  - Safari-specific runtime errors.
- decision gate for Stage 2.7.5c:
  - proceed to adaptive quality / reduced mobile mode only if real-device data shows FPS, heat, memory, orientation or Safari-specific instability;
  - if results pass, keep `/visual-lab` isolated and continue to Stage 2.7.6b formal integration decision only after documented real-device data;
  - production replacement remains not approved.

Stage 2.7.5b initial iPhone Safari result and blocker fix:

- real iPhone Safari opened `/visual-lab` correctly after the earlier local-server-root blocker was resolved;
- WebGL rendered;
- FPS overlay reported approximately `60 FPS`;
- layout stability passed;
- orientation change stability passed;
- horizontal overflow was absent;
- no heat was observed in the initial check;
- blocker found: the visual WebGL singularity appeared static even though FPS was updating;
- likely technical cause: shader motion used absolute `requestAnimationFrame` time with mobile fragment precision risk, so subtle time-based shader changes could visually collapse on iPhone Safari;
- fix applied only inside `components/DecisionSingularityWebGL.tsx`:
  - bounded local shader time instead of absolute RAF timestamp;
  - fragment `highp` precision when available;
  - Safari-safe motion status and animation time diagnostics;
  - slightly clearer but still subtle cinematic breathing, depth, glow and energy-flow motion;
- retest result:
  - `/visual-lab` opened on iPhone Safari;
  - motion overlay exists;
  - `Time` counter updates;
  - visual animation is now visible;
  - motion reads as breathing zoom plus slight horizontal drift;
  - FPS remained stable around `60`;
  - no heat was observed;
  - page remained stable after `1-2` minutes;
- no production files were changed;
- WebGL remains isolated in `/visual-lab`;
- previous animation blocker is resolved in the isolated sandbox;
- Stage 2.7.5b can be marked completed;
- Stage 2.7.5 overall is not fully complete until the adaptive quality / reduced mobile mode decision is made if required.

Stage 2.7.5c adaptive quality / reduced mobile mode decision:

- inspected current isolated WebGL sandbox implementation;
- current sandbox already includes:
  - mobile/small viewport detection;
  - mobile-safe DPR cap `1.15`;
  - lower-power WebGL context preference;
  - reduced-motion path;
  - hidden-tab pause path;
  - softened mobile shader intensity;
  - debug overlay with quality mode, DPR/pixel ratio, motion state and animation time.
- decision gate:
  - add stricter adaptive quality or reduced mobile mode only if real iPhone Safari data shows sustained FPS degradation, heat, memory pressure, context loss, orientation/layout instability, horizontal overflow, unreadable UI or failed visible motion.
- observed real-device result after Safari-safe motion fix:
  - FPS around `60`;
  - visible cinematic motion;
  - no heat after `1-2` minutes;
  - stable layout and orientation;
  - no horizontal overflow.
- decision:
  - no additional adaptive quality or reduced mobile mode implementation is required now;
  - reduced mobile mode active: no, beyond the existing mobile-safe quality mode;
  - do not over-engineer the sandbox while the current mobile-safe path is passing.
- Stage 2.7.5 can be considered complete for the current isolated sandbox validation scope;
- longer thermal profiling remains recommended before any production integration or formal Stage 2.7.6b integration decision, but it is not a blocker for the current Stage 2.7.5c decision.

Stage 2.7.6 formal integration decision:

- decision:
  - keep current production `DecisionSingularity`;
  - do not replace the production hero;
  - keep WebGL in `/visual-lab` only;
  - no automatic production replacement.
- reason:
  - iPhone Safari isolated sandbox validation passed;
  - visual animation is visible;
  - FPS stayed around `60`;
  - no heat was observed in the short test;
  - layout and orientation stayed stable.
- production integration still requires:
  - stronger cinematic quality review;
  - longer thermal profiling;
  - production rollback plan;
  - visual regression QA.
- future direction:
  - possible hybrid or partial integration later;
  - any such work needs a separate explicit approval stage;
  - production `DecisionSingularity` remains protected until then.

## Roadmap

Stable frontend stabilization phase:

- Stage 2.4 - simulator CSS stabilization - completed in `c9a86da`.
- Stage 2.5 - visual regression QA - completed.
- Stage 2.6 - checkpoint + context sync - completed in `c81a9c8`.
- Stage 2.7-prep - visual engine preparation - completed in `0cec475`.
- Stage 2.7.1 - WebGL architecture research - completed in `3d8ef6e`.

Experimental visual engine phase:

- Stage 2.7.2 - isolated WebGL sandbox prototype - completed in `0781b46`.
- Stage 2.7.3 - isolated WebGL visual quality iteration - completed in `5553455`.
- Stage 2.7.3 corrective closure - visually corrected, pending post-pass iPhone Safari retest.
- Stage 2.7.3 corrective pass 2 - applied after failed cinematic-depth retest, pending another real iPhone Safari visual-quality retest.
- Stage 2.7.3b - `fa5dfd9` technical iPhone Safari safety passed, but visual depth improvement failed; stage remains active.
- Stage 2.7.4 - blocked until Stage 2.7.3b closes under strict stage discipline, despite older profiling notes.
- Stage 2.7.5 - provisional mobile safety work in `89e534c`; not a final validation stage or production-integration basis.
- Stage 2.7.6 - provisional/no-production decision only; production replacement remains blocked.
- Stage 2.7.7 - blocked; no escalation stage is approved.
- Stage 2.7.5b - real Safari/iPhone validation completed after Safari-safe motion retest:
  - test iPhone Safari portrait/landscape;
  - test scroll, touch latency, resize/address bar behavior and orientation changes;
  - observe FPS stability, context loss/restore and console errors;
  - document thermal/throttling behavior during longer sessions.
- Stage 2.7.5c - adaptive quality / reduced mobile mode decision completed:
  - no extra reduced mobile mode is required now;
  - current mobile-safe sandbox path is sufficient for observed iPhone Safari data;
  - keep all work isolated from production hero;
  - preserve CSS/DOM production fallback.
- Stage 2.7.6b - reserved for a future production integration proposal only if hybrid or partial integration is explicitly requested later:
  - current production singularity remains active;
  - WebGL stays isolated;
  - no automatic production replacement.

## Critical Experimental Rules

- WebGL/canvas/Three.js/R3F are forbidden in production for the current MVP path unless a future explicit approval creates a new rendering stage.
- `VISUAL_ENGINE_PLAN.md` remains historical research context; it must not override the current Premium Black-Gold AI Decision Intelligence System direction.
- Stage 2.7.x visual-engine findings are historical evidence for the pivot: `/visual-lab` remains experimental-only and heavy rendering must not be integrated into production hero.
- Stage 2.7.3/2.7.3b corrective passes remain documented as research outcomes, not active blockers for Stage 2.8.
- The single-pass lightweight shader visual ceiling is confirmed; do not spend MVP effort on more micro-tweaks in that direction.
- Any future advanced rendering research requires a separate approved stage and must not displace the current Premium Black-Gold MVP path.
- Stage 2.7.5 correction is binding: current mobile work is safety optimization only, not completed Safari validation.
- Stage 2.7.5b result is binding: iPhone Safari retest passed after the isolated Safari-safe motion fix; Stage 2.7.5 overall still awaits the Stage 2.7.5c adaptive-quality/reduced-mobile-mode decision if required.
- Stage 2.7.5c result is binding: current real-device data does not require additional adaptive quality or reduced mobile mode; Stage 2.7.5 is complete for the isolated sandbox scope, with longer thermal profiling still recommended before any production integration decision.
- Stage 2.7.6 formal decision is binding: keep current production `DecisionSingularity`, do not replace production hero, keep WebGL isolated in `/visual-lab`, and require separate approval before any hybrid or partial production integration.
- Production `DecisionSingularity` must not be directly replaced.
- WebGL must run through an isolated sandbox/experimental track.
- Simulator business logic is protected.
- `SimulationResponse` contract is protected.
- Mobile performance baseline is critical.
- No gaming UI direction.
- Cinematic premium minimalism must remain.

## Locked Areas

Do not start without explicit approval:

- real AI backend;
- OpenAI API integration;
- Supabase/Auth.js/Clerk authentication;
- database;
- payments;
- production persistence;
- production privacy/security implementation.

Do not rewrite blindly:

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

## Reporting

- Developer reports: Russian.
- Visible UI: Spanish.
- Do not push unless explicitly requested.
- Do not apply `stash@{0}` without explicit permission.
