# CURRENT STAGE - LEVIO.ES

Date: 23 May 2026, Europe/Madrid.

## Current Stage

Stage 2 - frontend CSS stabilization and architectural sync - IN PROGRESS.

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
- Stage 2.7.4 isolated WebGL performance profiling and stress testing completed with no file changes and no implementation commit needed.
- `89e534c` - Stage 2.7.5 isolated WebGL mobile safety optimization completed; this is not full Safari/iPhone validation.
- Stage 2.7.6 read-only sandbox state verification / no-integration confirmation completed; this is not a full production integration decision.

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
- Stage 2.7.4 profiling completed: `/visual-lab` works, no console errors, no horizontal overflow;
- Stage 2.7.4 performance samples: desktop `20-21 FPS`, mobile `390x844` about `26 FPS`, resize `820x760` low sample about `6 FPS`;
- DPR cap works with max `1.5`;
- First Load JS for `/visual-lab`: `90.9 kB`;
- post Stage 2.7.5 build output observed First Load JS for `/visual-lab`: `91.2 kB`;
- cleanup/remount checked through route transition;
- hidden-tab pause not fully verified because of in-app browser limitations;
- Mobile Safari real-device testing has not been performed yet;
- Stage 2.7.5 mobile safety optimization completed only inside isolated WebGL sandbox files;
- Stage 2.7.5 implemented mobile-safe DPR cap, mobile-safe quality state, lower-power WebGL context preference, reduced-motion handling, hidden-tab pause path and softer mobile shader intensity;
- Stage 2.7.6 verified the no-integration state: `/visual-lab` remains isolated and production replacement is not approved;
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
  - real-device iPhone Safari validation;
  - thermal/throttling measurement on real devices;
  - formal device matrix;
  - full adaptive quality tiers beyond the current mobile-safe mode;
  - production integration.

Stage 2.7.6 correction:

- current completed Stage 2.7.6 is read-only verification / no-integration confirmation, not a full integration decision;
- already done:
  - working tree cleanliness and stash presence were checked;
  - `/visual-lab` existence was confirmed;
  - `DecisionSingularityWebGL` sandbox files were confirmed;
  - current production baseline remains active;
- not done:
  - formal choice between old singularity, hybrid, partial integration or future replacement;
  - production feature flag / kill switch design;
  - production integration approval.
- conclusion: production replacement is not approved; existing production `DecisionSingularity` remains active; WebGL remains isolated in `/visual-lab`.

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
- Stage 2.7.4 - isolated WebGL performance profiling and stress testing - completed, no file changes/commit needed.
- Stage 2.7.5 - isolated WebGL mobile safety optimization - completed in `89e534c`; not full Safari/iPhone validation.
- Stage 2.7.6 - read-only verification / no-integration confirmation - completed; not a full integration decision.
- Stage 2.7.5b - real Safari/iPhone validation checklist:
  - test iPhone Safari portrait/landscape;
  - test scroll, touch latency, resize/address bar behavior and orientation changes;
  - observe FPS stability, context loss/restore and console errors;
  - document thermal/throttling behavior during longer sessions.
- Stage 2.7.5c - adaptive quality / reduced mobile mode if validation requires it:
  - add stricter quality tiers only if real-device data justifies them;
  - keep all work isolated from production hero;
  - preserve CSS/DOM production fallback.
- Stage 2.7.6b - formal integration decision after real-device data:
  - keep old singularity;
  - hybrid;
  - partial integration;
  - future replacement;
  - no automatic production replacement.

## Critical Experimental Rules

- WebGL is forbidden in production until isolated architecture approval.
- `VISUAL_ENGINE_PLAN.md` conclusion is binding for the current stage: do not implement WebGL now; preserve production baseline.
- Stage 2.7.4 result is binding: `/visual-lab` is experimental-only and must not be integrated into production hero before performance optimization and real-device Mobile Safari validation.
- Stage 2.7.5 correction is binding: current mobile work is safety optimization only, not completed Safari validation.
- Stage 2.7.6 correction is binding: current verification is no-integration confirmation only, not approval for production replacement.
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
