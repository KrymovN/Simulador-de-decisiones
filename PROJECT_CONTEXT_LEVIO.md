# Levio.es Project Context Summary

Last updated: 2026-05-14

This document is a handoff summary for a new Codex chat. It captures the current local state, product philosophy, architecture, implemented features, verification status, open issues, and next roadmap for Levio.es.

## 1. What Levio.es Is

Levio.es is a cinematic AI decision simulation platform.

The product is designed to help people simulate important decisions before acting. It maps possible future scenarios, delayed consequences, strategic risks, benefits, emotional impact, financial impact, and alternative routes. The UX should feel like a living thinking system, not a chatbot or a generic SaaS dashboard.

Core sentence:

> Levio.es simulates decisions, models consequences, and visualizes strategic thinking before the user acts.

## 2. Core Concept

Levio.es is:

- Not an AI chat interface.
- Not a generic SaaS landing page.
- Not a template dashboard.
- A living thinking system for complex decisions.
- A visual simulation of decision analysis.
- A cinematic product experience around consequence, risk, strategy, and intelligence.
- A premium AI product with emotional and intellectual UX.

The interface should communicate that the system is thinking, weighing futures, and revealing hidden consequences.

## 3. Technologies

Current stack:

- Next.js 14.2.5 with App Router.
- React 18.2.0.
- TypeScript 6.0.3.
- Global CSS in `app/globals.css`.
- No CSS modules currently.
- Local mock simulation engine in `lib/simulationEngine.ts`.
- Local mock personal-area data in `lib/mockSimulations.ts` and `lib/personalArea.ts`.
- Mock auth through `localStorage` in `components/MockAuthGate.tsx`.
- Intended deployment target: Vercel.
- Git remote: `git@github.com:KrymovN/Simulador-de-decisiones.git`.

Current dependencies from `package.json`:

```json
{
  "next": "14.2.5",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "@types/node": "25.6.0",
  "@types/react": "19.2.14",
  "typescript": "6.0.3"
}
```

Scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

There is no `lint` script at the time of this summary.

## 4. Project Structure

Important files and folders:

```text
app/
  layout.tsx
  page.tsx
  globals.css
  api/simulate/route.ts
  login/page.tsx
  register/page.tsx
  forgot-password/page.tsx
  dashboard/page.tsx
  dashboard/decisions/page.tsx
  dashboard/memory/page.tsx
  dashboard/privacy/page.tsx
  dashboard/profile/page.tsx
  dashboard/security/page.tsx
  dashboard/simulations/page.tsx
  dashboard/simulations/[id]/page.tsx

components/
  AuthShell.tsx
  DashboardShell.tsx
  HomeSimulator.tsx
  MockAuthGate.tsx
  MockFeedbackButton.tsx
  PrivacyPanel.tsx
  SecurityPanel.tsx
  SimulationDetailClient.tsx
  SimulationsList.tsx
  SingularityVisual.tsx

lib/
  simulationEngine.ts
  mockSimulations.ts
  personalArea.ts

public/
  favicon.ico
  icon.png
  icon-192.png
  apple-icon.png
  singularity-reference.jpg
```

Notes:

- `public/singularity-reference.jpg` is currently untracked before this handoff commit, but should be committed if the repository references or needs it.
- `components/SingularityVisual.tsx` currently renders a code-native black-hole/event-horizon visual using DOM layers and a canvas particle field. It no longer relies on the image directly in the current component code.
- `app/layout.tsx` defines metadata, favicon/icon setup, background layers, and global shell.

## 5. Implemented Features

Implemented:

- Home page with cinematic hero.
- Hero decision singularity visual.
- Main decision simulator on the home page.
- Local `/api/simulate` route returning mock structured simulation output.
- Thinking-stage animation flow in the simulator.
- Scenario cards with probability, risk, benefit, consequences, warnings, and recommendation.
- Local save flow using `localStorage`.
- Demo session creation.
- Login page.
- Register page.
- Forgot password page.
- Auth visual shell.
- Protected dashboard via mock auth gate.
- Dashboard shell with desktop sidebar and compact mobile details nav.
- Dashboard overview.
- Simulations list.
- Simulation detail page.
- Decisions page.
- Memory page.
- Profile page.
- Privacy page.
- Security page.
- Mock feedback buttons for non-production actions.
- Metadata and icons for `levio.es`.

Current auth model:

- `MockAuthGate` checks `localStorage` key `levio_es_mock_session`.
- `createMockSession()` writes a mock session with provider, createdAt, and privacy mode.
- `clearMockSession()` removes the session.
- This is explicitly demo-only and not production authentication.

## 6. Routing

Routes verified locally on `localhost:3000`:

```text
/                         200
/login                    200
/register                 200
/dashboard                200
/dashboard/profile        200
/dashboard/privacy        200
/dashboard/security       200
/dashboard/simulations    200
/dashboard/decisions      200
/dashboard/memory         200
```

Dynamic simulation detail routes generated at build time:

```text
/dashboard/simulations/oferta-premium
/dashboard/simulations/cambio-pais
/dashboard/simulations/nueva-linea-producto
```

API route:

```text
POST /api/simulate
```

The API route is local mock-only. It does not call OpenAI or any external provider.

## 7. AI Simulation Flow

Current simulation pipeline:

1. User enters a decision situation in `HomeSimulator`.
2. `HomeSimulator` sends a POST request to `/api/simulate`.
3. `app/api/simulate/route.ts` validates input.
4. The route calls `buildMockSimulation(input)` from `lib/simulationEngine.ts`.
5. The response includes:
   - input
   - language
   - generatedAt
   - thinking stages
   - mock simulation object
   - metadata indicating `mockOnly: true`
6. UI renders thinking stages and scenario map.
7. User can save the simulation locally.
8. User can create a demo session and continue into dashboard simulations.

Fallback behavior:

- If `/api/simulate` fails, `HomeSimulator` falls back to local `buildMockSimulation()`.

Current scenario categories:

- Negocio
- Finanzas
- Vida
- Estrategia

Current scenario types:

- Ruta de crecimiento.
- Ruta de exposicion.
- Consecuencia retrasada.
- Alternativa estrategica.

## 8. Current UI State

Current UI is in a bright premium cosmic phase with layered glass, cyan/blue/magenta accents, and an event-horizon singularity. Earlier CSS layers include dark cinematic and champagne/gold experiments; the final cascade currently includes a `Bright premium Levio visual refresh` section after the warm champagne palette.

Important visual facts:

- The home hero uses a large event-horizon/singularity visual.
- The old eye hero-symbol is not present.
- The logo is a small circular brand mark, not the main hero symbol.
- The product is visually atmospheric, animated, and non-generic.
- The main body is not a plain white screen, but it is currently brighter than the requested final dark-gold cinematic direction.
- Cards use glass-like panels, soft gradients, borders, shadows, and backdrop blur.
- Dashboard uses the same bright premium glass system.
- Typography is large, editorial, and high-impact, especially in hero and dashboard headings.
- Animations include background breathing, floating particles, singularity float/breath/spin, flowing accretion disks, card appearances, bar movement, and status pulses.

## 9. Current Visual Issues

Known visual and responsive issues from browser QA:

- Mobile home `390x844`: the `Riesgo 42%` hero metric partially overflows to the right.
- Mobile home: the hero is tall and the headline starts low in the first viewport.
- Mobile dashboard `390x844`: the `Nivel de privacidad / Alto` card is partially clipped on the right.
- Some CSS history is layered rather than consolidated; `app/globals.css` contains multiple visual refresh sections, with later sections overriding earlier ones.
- The current visual style is brighter and more cyan/magenta than the intended final dark-gold cinematic direction.
- The visual identity should be consolidated to avoid competing palettes.
- The logo/brand mark is functional but may need a more premium identity system.
- Dashboard cards are structurally complete but can still become more bespoke and less dashboard-template-like.

## 10. New Visual Direction

Target direction for next work:

- Golden cinematic AI style.
- Event horizon / black hole / decision singularity inspiration.
- Deep black and warm graphite backgrounds.
- Amber, gold, bronze, and cream light.
- Glowing particles and gravitational lensing.
- Premium futuristic interface.
- Apple-like polish without becoming sterile.
- No white-sheet site.
- No generic dark SaaS.
- No cyberpunk/gaming UI.
- A sense of depth, intelligence, and consequence.

The singularity should feel like the center of the decision engine. It should not look like a simple icon, flat logo, eye, orb, or generic AI mark.

## 11. How Levio Should Feel

Levio should feel like:

- An expensive AI product.
- A strategic thinking engine.
- Cinematic and intelligent.
- Emotional but controlled.
- Dark-gold sci-fi, not neon cyberpunk.
- Human decision intelligence, not chat automation.
- A system that reveals invisible consequences.
- A premium product where every panel, glow, and animation supports the metaphor of thinking.

Avoid:

- Generic SaaS template sections.
- Plain white backgrounds.
- Basic AI icons.
- Chatbot-first layouts.
- Decorative blobs without meaning.
- Cheap futuristic styling.
- Overly playful gaming UI.

## 12. Build, TypeScript, Localhost, and Deployment Status

Local checks performed on 2026-05-14:

```bash
npx tsc --noEmit
npm run build
```

Status:

- TypeScript: passing.
- Production build: passing.
- `npm run lint`: not available because no `lint` script exists.
- `npm install`: not run because `node_modules` exists and project builds.

Build output includes 18 app routes and successful static generation.

Localhost status after diagnostics:

- Working dev URL: `http://localhost:3000`.
- `localhost:3001`: no listener.
- Active app dev process:
  - `node /Users/s3/Documents/New project/node_modules/.bin/next dev`
  - `next-server (v14.2.5)`

Important operational rule:

- Do not run `npm run build` while `npm run dev` is actively serving. This previously caused `.next` dev/runtime mismatch and 500 errors such as `Cannot find module './948.js'`.
- For safe build verification, stop dev first, run build, then restart dev.

Git status before this context-summary work:

- Branch: `main`.
- Remote: `origin git@github.com:KrymovN/Simulador-de-decisiones.git`.
- Recent commits:

```text
b4218eb Refresh Levio visual front
dfa72de Develop personal account dashboard
4c57761 Expand personal dashboard simulation flow
e6199a1 Add protected personal dashboard foundation
5fa9538 Refine levio.es cinematic visual identity
7bf2dd0 Stabilize Levio app router architecture
f9a3539 isolate webpack css issue
8e7f35e test render change
```

Vercel status:

- No local `.vercel/` directory found.
- No `vercel.json` found.
- Vercel CLI is not installed locally.
- Deployment state cannot be confirmed from this local workspace without Vercel access or GitHub/Vercel dashboard access.
- Metadata in `app/layout.tsx` uses `metadataBase: https://levio.es`, so the project is intended for the `levio.es` domain.

## 13. Browser QA Status

Verified in browser on `localhost:3000`:

- Home page renders.
- Singularity is visible.
- No white/blank screen.
- Old eye hero-symbol is absent.
- Logo is not used as the main hero symbol.
- Mock simulator runs.
- `/api/simulate` returns `200`.
- Dashboard renders after demo session is created.
- Login and register pages render.
- Browser console has no application errors.

Browser console notes:

- Only standard React development info appears:

```text
Download the React DevTools for a better development experience
```

No production-impacting console errors were observed during this QA pass.

## 14. Dashboard State

Dashboard is implemented as a protected personal area.

Current dashboard pages:

- Overview: `/dashboard`
- Decisions: `/dashboard/decisions`
- Simulations: `/dashboard/simulations`
- Simulation detail: `/dashboard/simulations/[id]`
- Memory: `/dashboard/memory`
- Profile: `/dashboard/profile`
- Privacy: `/dashboard/privacy`
- Security: `/dashboard/security`

Dashboard features:

- Sidebar navigation.
- Mobile compact navigation through `<details>`.
- Privacy status card.
- Saved simulations.
- Decision radar.
- Active simulation panel.
- Consequences timeline.
- Saved decisions.
- Memory personalization panels.
- Privacy rights/actions.
- Security score/session list.

Data is currently mock-only and local. No database or production auth exists.

## 15. Roadmap

### Stage 1: Visual Cinematic MVP

- Consolidate final dark-gold cinematic visual system.
- Fix mobile overflow in hero metrics and dashboard privacy card.
- Make hero singularity more premium and central.
- Reduce CSS cascade history by consolidating final palette.
- Improve logo and brand identity.
- Tighten dashboard visual hierarchy.
- Add a `lint` script if desired.

### Stage 2: Real AI Backend + Streaming

- Replace `buildMockSimulation()` with real backend orchestration.
- Add streaming thinking stages.
- Add structured model output validation.
- Preserve the current scenario schema or migrate it carefully.
- Add error boundaries and safe fallback rendering.
- Do not expose private user data to client-only mocks.

### Stage 3: Memory, Accounts, History, Personalization

- Replace mock auth with production auth.
- Add database persistence for simulations and decisions.
- Implement user-owned memory controls.
- Add consent records, export, delete, and audit trails.
- Support account settings, region, language, and personal risk preferences.

### Stage 4: Mobile Apps + Ecosystem

- Mobile-first decision simulation experience.
- Push reminders for delayed consequences.
- Cross-device sync.
- Personal strategic timeline.
- Native app or PWA shell.
- Long-term memory and continuous decision monitoring.

## 16. Important Project Rules

Non-negotiables:

- No white blank pages.
- No generic SaaS templates.
- No primitive AI icons.
- No chatbot-first product framing.
- No cyberpunk/gaming UI.
- No OpenAI API integration unless explicitly requested.
- No production auth claims while auth is mock-only.
- Keep Levio as a thinking simulator, not a chat assistant.
- Preserve cinematic premium quality.
- Every visual layer should support the decision-simulation metaphor.

Engineering rules:

- Respect `AGENTS.md`: this repo warns that Next.js behavior may differ and relevant docs should be checked before code changes.
- Prefer existing app patterns.
- Do not rewrite architecture without a specific task.
- Do not run `next build` while a dev server is serving from the same `.next`.
- Keep mock-flow intact unless the user asks to replace it.

## 17. Quick Start For New Codex Chat

Levio.es is a cinematic AI decision simulation platform. It helps users model future scenarios, risks, delayed consequences, benefits, and strategic alternatives before acting.

Current stack: Next.js App Router, React, TypeScript, global CSS, mock local simulation API, mock local auth, GitHub remote, intended Vercel deployment.

Current state:

- Home page exists with hero, singularity, simulator, scenario sections, ecosystem preview, and CTA.
- Dashboard exists with protected mock auth and multiple personal-area pages.
- Simulator works locally through `/api/simulate`.
- TypeScript and production build pass.
- Current localhost should be `http://localhost:3000`.
- Vercel deployment cannot be confirmed from local files.

Most important next work:

1. Fix mobile overflow:
   - hero metric card on home mobile,
   - privacy card on dashboard mobile.
2. Consolidate `app/globals.css` into one final visual system.
3. Move from bright cosmic/cyan-magenta toward dark-gold cinematic AI.
4. Strengthen singularity/event-horizon as the core product symbol.
5. Keep dashboard functional while making it less generic.

Visual rules:

- Levio is not a chatbot.
- Levio is not a generic SaaS dashboard.
- Levio is a living thinking engine.
- The final look should be premium, cinematic, deep, intelligent, black/gold/amber, and emotionally serious.

