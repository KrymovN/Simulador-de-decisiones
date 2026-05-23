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

Stable after Stage 2.6:

- cinematic dark-gold baseline preserved;
- desktop stable;
- mobile `390px` stable;
- dashboard mobile navigation stable;
- auth routes stable;
- mock auth flow stable;
- home simulator interaction stable;
- no visual regressions detected;
- context files synchronized after Stage 2.5 QA;
- working tree was clean before this documentation update;
- `stash@{0}: pre-stage-1.5-existing-changes` exists and has not been applied.

## QA Baseline From Stage 2.1-2.6

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
- `PROJECT_CONTEXT.md`, `LEVIO_CURRENT_STATE.md` and `CURRENT_STAGE.md` were synchronized after Stage 2.5 visual QA;
- no production code was changed;
- next planned stage is Stage 2.7-prep, visual engine preparation.

## Roadmap

Stable frontend stabilization phase:

- Stage 2.4 - simulator CSS stabilization - completed in `c9a86da`.
- Stage 2.5 - visual regression QA - completed.
- Stage 2.6 - checkpoint + context sync - completed in `aeace9f`.
- Stage 2.7-prep - visual engine preparation.

Experimental visual engine phase:

- Stage 2.7.1-2.7.6 - isolated experimental WebGL track.

## Critical Experimental Rules

- WebGL experiments are forbidden before Stage 2.7-prep.
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
