# LEVIO.ES - АКТУАЛЬНОЕ СОСТОЯНИЕ ПРОЕКТА

## Дата обновления

23 мая 2026, Europe/Madrid.

Документ отражает локальное состояние проекта `/Users/s3/Documents/New project` после завершения Stage 2.5 visual regression QA. Это основной актуальный handoff-файл. `LEVIO_CURRENT_STATE.md` должен оставаться синхронизированной копией этого документа.

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

Stage 2.1-2.5 result:

- motion keyframes moved to `app/styles/motion.css`;
- dashboard base styles moved to `app/styles/dashboard.css`;
- auth base styles moved to `app/styles/auth.css`;
- simulator base styles moved to `app/styles/simulator.css`;
- `app/globals.css` remains the canonical final dark-gold cascade layer;
- selector-bearing extracted CSS (`dashboard.css`, `auth.css`, `simulator.css`) is intentionally imported before `globals.css`;
- `motion.css` is keyframes-only and remains separate from selector cascade concerns;
- production visual baseline remains protected.

## 3. Current Stable Status

Stable status after Stage 2.5:

- cinematic dark-gold baseline preserved;
- desktop QA stable;
- mobile `390px` QA stable;
- dashboard mobile navigation stable;
- auth routes stable;
- mock auth flow stable;
- home simulator interaction stable;
- no visual regressions detected in completed Stage 2.5 QA;
- working tree was clean before this documentation update;
- `stash@{0}: pre-stage-1.5-existing-changes` remains untouched and must not be applied without explicit permission.

Known content issue:

- part of the public UI still contains English text. This is a known localization/content pass item, not a Stage 2.1-2.3 regression.

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
  - `npx tsc --noEmit`

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
- Stage 2.6 - checkpoint + context sync.
- Stage 2.7-prep - visual engine preparation.

Experimental visual engine phase:

- Stage 2.7.1-2.7.6 - isolated experimental WebGL track.

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

## 14. Git State At This Context Update

Latest local commits before this documentation update:

```text
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
