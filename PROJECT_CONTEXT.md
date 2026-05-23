# LEVIO.ES - АКТУАЛЬНОЕ СОСТОЯНИЕ ПРОЕКТА

## Дата обновления

23 мая 2026, Europe/Madrid.

Документ отражает локальное состояние проекта `/Users/s3/Documents/New project` после Stage 2.7.5 isolated WebGL mobile safety optimization и Stage 2.7.6 read-only verification / no-integration confirmation. Это основной актуальный handoff-файл. `LEVIO_CURRENT_STATE.md` должен оставаться синхронизированной копией этого документа.

## 1. Краткое описание проекта

Levio.es - испаноязычная cinematic MVP/demo платформа симуляции решений. Продукт помогает пользователю описать сложную ситуацию и увидеть возможные сценарии, риски, преимущества, отложенные последствия и стратегическую рекомендацию до принятия решения.

Текущая версия сохраняет премиальную dark-gold visual identity и mock-архитектуру: backend, авторизация, база данных и реальная AI-интеграция пока не подключены. Авторизация и сохранение симуляций работают через demo/localStorage flows.

Публичный UI и личный кабинет должны оставаться на испанском языке. Технические отчеты для разработчика пишутся на русском.

## 2. Current Development Stage

Stage 2 - frontend CSS stabilization and architectural sync - IN PROGRESS.

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
- Stage 2.7.4 completed: isolated WebGL performance profiling and stress testing; no file changes, no commit needed.
- Stage 2.7.5 completed: `89e534c` - isolated WebGL mobile safety optimization; this is not full Safari/iPhone validation.
- Stage 2.7.6 completed: read-only sandbox state verification / no-integration confirmation; this is not a full production integration decision.

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
- Stage 2.7.4 isolated WebGL performance profiling completed with no file changes;
- Stage 2.7.5 isolated mobile safety optimization completed in `89e534c`;
- Stage 2.7.6 read-only verification / no-integration confirmation completed;
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
- cleanup/remount was checked through route transition;
- hidden-tab pause could not be fully verified because of in-app browser limitations;
- Mobile Safari real-device testing has not been performed yet;
- conclusion: WebGL sandbox remains experimental-only; do not integrate into production hero before further optimization and real-device Safari validation.

Stage 2.7.5 correction:

- current completed Stage 2.7.5 must be treated as mobile safety optimization, not full Safari validation;
- implemented safety measures include mobile-safe DPR cap `1.15`, mobile-safe quality state, lower-power WebGL context preference, reduced-motion handling, hidden-tab pause path and softer mobile shader intensity;
- real iPhone/Safari validation has not been performed yet;
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

Stage 2.7.6 correction:

- current completed Stage 2.7.6 must be treated as read-only verification / no-integration confirmation, not a full integration decision;
- production replacement is not approved;
- existing production `DecisionSingularity` remains active;
- WebGL remains isolated in `/visual-lab`;
- possible future direction is hybrid or partial integration only after real-device validation and a formal integration decision.

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

These parts hold the working cinematic MVP, visual identity, mock simulation flow, dashboard structure and demo persistence.

## 6. Product And Visual Principles

Levio.es is not:

- a chatbot;
- a generic SaaS dashboard;
- a template AI assistant;
- a white clean corporate UI;
- a game UI.

Levio.es is:

- a cinematic AI decision simulator;
- a visual thinking engine;
- a premium minimal decision-simulation experience;
- a future-consequence simulation platform.

Mandatory visual rules:

- dark cinematic atmosphere;
- deep black / graphite base;
- gold / amber / bronze highlights;
- cream text tones;
- glowing energy effects;
- event-horizon / black-hole / singularity metaphor;
- glass-like panels;
- premium minimalism;
- no gaming UI direction;
- no white redesign;
- no generic startup gradient direction;
- no replacement of production `DecisionSingularity` with a static image.

## 7. Implemented Product Surface

Implemented and currently stable:

- public home page with cinematic Levio visual system;
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
- Stage 2.7.4 - isolated WebGL performance profiling and stress testing - completed, no file changes/commit needed.
- Stage 2.7.5 - isolated WebGL mobile safety optimization - completed in `89e534c`; not full Safari/iPhone validation.
- Stage 2.7.6 - read-only verification / no-integration confirmation - completed; not a full integration decision.
- Stage 2.7.5b - real Safari/iPhone validation checklist prepared; validation results still need to be executed and documented.
- Stage 2.7.5c - adaptive quality / reduced mobile mode if validation requires it.
- Stage 2.7.6b - formal integration decision after real-device data.

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
- Cinematic premium minimalism must remain.
- Experimental visual engine work must not contaminate the stable frontend stabilization phase.
- `VISUAL_ENGINE_PLAN.md` conclusion is binding for the current stage: do not implement WebGL now; preserve production baseline.
- Stage 2.7.4 result is binding: `/visual-lab` is experimental-only and must not be integrated into production hero before performance optimization and real-device Mobile Safari validation.
- Stage 2.7.5 correction is binding: current mobile work is safety optimization only, not completed Safari validation.
- Stage 2.7.5b is binding as a real-device checklist only: it does not complete Safari/iPhone validation until results are recorded.
- Stage 2.7.6 correction is binding: current verification is no-integration confirmation only, not approval for production replacement.

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
