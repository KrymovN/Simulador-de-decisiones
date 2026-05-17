# CURRENT STAGE — LEVIO.ES

Date: 17 May 2026, Europe/Madrid.

Current stage:

Stage 1 — Technical stabilization and CSS consolidation.

Main goal:

Stabilize the current cinematic MVP before adding new functionality.

Current priorities:

- stabilize `app/globals.css`;
- preserve cinematic dark-gold identity;
- reduce architectural fragility;
- avoid visual regressions;
- keep public and private visible UI in Spanish;
- do not connect real backend/auth/database/AI yet;
- do not start new product features before stabilization is complete.

Locked for now:

- real AI backend;
- OpenAI API integration;
- Supabase/Auth.js/Clerk authentication;
- database;
- payments;
- production persistence;
- production privacy/security implementation.

Critical protection:

Do not fully rewrite without explicit decision:

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

Required checks after future technical changes:

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`, if lint script exists

Developer reporting language:

Russian.

Visible user interface language:

Spanish.
