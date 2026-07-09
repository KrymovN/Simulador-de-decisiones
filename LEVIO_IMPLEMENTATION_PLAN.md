# LEVIO IMPLEMENTATION PLAN

Date: 6 July 2026, Europe/Madrid.

Status: Canonical V1 implementation comparison document.

## Constitutional Authority

`LEVIO_PROJECT_CONSTITUTION.md` is the highest-level canonical authority for
Levio.es. This document is subordinate to the Constitution and
`PROJECT_CONTEXT.md`, and it is the canonical V1 implementation comparator only
within that higher-level governance frame.

Documentation hierarchy:

1. `LEVIO_PROJECT_CONSTITUTION.md`
2. `PROJECT_CONTEXT.md`
3. `LEVIO_IMPLEMENTATION_PLAN.md`
4. `CURRENT_STAGE.md`
5. `LEVIO_CURRENT_STATE.md`
6. `LEVIO_PROJECT_PROGRESS.md`
7. Stage, architecture, QA, legal, readiness, README, decision, and archive
   documents

If project documents conflict, the higher-level document in the hierarchy
prevails unless it has been explicitly amended.

This document defines the final implemented target for Levio V1 and provides a
stable comparison model between the current project state and the completed
product state. It does not open Production Release, Commercial Launch, Scale
Execution, Real AI execution, billing execution, analytics, tracking, or a new
roadmap branch.

## 1. Final Implementation Target

Final target:

**Levio V1 Complete** - a production-ready Decision Simulation Engine where
users can:

- create and manage real accounts;
- run decision simulations;
- save simulations;
- reopen saved simulations;
- manage ownership-bound simulation data;
- export and delete their data;
- use a real AI Provider as an internal component of the Decision Engine;
- use the product through stable production runtime;
- access commercial subscription flows if enabled;
- rely on monitoring, logging, support, rollback, security, legal, privacy, and
  operational readiness.

Production Release and Commercial Launch are milestones. They are not the
definition of final implementation by themselves.

The final implementation target is the complete product state above: real
runtime, real account ownership, persistent decision simulation objects, user
data controls, internal Real AI execution, validation, operations, and optional
commercial production capability.

## 2. Immutable Product Architecture

Levio is a Decision Simulation Engine.

Levio is not:

- an AI Chat;
- an Answer Engine;
- a generic assistant.

The immutable product architecture remains:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

AI Provider is internal only. It must not become the product surface, the user
interface model, or the primary product object.

Persistence, auth, subscriptions, monitoring, legal/trust surfaces, and user
data controls are supporting systems around the Decision Simulation Engine.
They must not bypass the Simulator, Decision Engine, Prompt Context, or AI
Provider boundaries.

## 3. Implementation Blocks

### A. Decision Simulation Persistence Implementation

Goal:

Make decision simulations persistent product objects.

Scope:

- save simulations;
- list saved simulations;
- load/reopen simulations;
- connect simulations to persistence boundary;
- connect simulations to account/user ownership;
- prepare dashboard/history integration.

Exit criteria:

- user-owned simulations can be stored and retrieved through approved runtime
  boundaries;
- saved simulation list is available through product surface or approved
  dashboard boundary;
- no mock ownership is used for production paths;
- existing persistence architecture is not bypassed.

### B. Real User Account Runtime

Goal:

Complete the real user account lifecycle.

Scope:

- registration;
- email confirmation;
- login;
- logout;
- password reset;
- session recovery;
- protected routes;
- dashboard connected to real account state;
- Supabase settings, redirects, email delivery, session behavior.

Exit criteria:

- real user session behavior works end-to-end;
- dashboard reflects real account state;
- protected areas are not accessible without valid session;
- account ownership works with saved simulations.

### C. User Data Management

Goal:

Give users control over their account-bound data.

Scope:

- export data;
- delete data;
- retention handling;
- privacy/data-control flows;
- saved simulation data inclusion;
- ownership validation;
- account data lifecycle boundaries.

Exit criteria:

- users can export relevant account data;
- users can delete relevant account data;
- retention behavior is documented and enforced;
- privacy/data-control blockers are closed.

### D. Production AI Integration

Goal:

Connect the real AI Provider as an internal Decision Engine component.

Scope:

- real provider integration;
- prompt context runtime path;
- Decision Engine pre/post AI processing;
- simulation output normalization;
- cost/safety/error controls;
- fallback behavior;
- no chat-like product drift.

Exit criteria:

- real AI Provider works through approved internal architecture;
- AI never becomes the product surface;
- simulation output remains structured as decision simulation;
- provider errors are controlled and user-safe.

### E. Product Validation & Production Readiness

Goal:

Validate that Levio is reliable, secure, explainable, and production-ready.

Scope:

- regression testing;
- decision simulation quality validation;
- consistency testing;
- evidence/traceability;
- observability;
- security review;
- performance validation;
- production hardening;
- runtime QA.

Exit criteria:

- build/typecheck/lint pass;
- core user flows pass;
- simulation quality is validated;
- observability and error tracking are ready;
- security/privacy risks are reviewed;
- production blockers are documented or closed.

### F. Commercial Production

Goal:

Move from completed product runtime to commercial operation.

Scope:

- billing;
- subscriptions;
- plan limits;
- monitoring/logging/support;
- rollback procedures;
- final legal documents;
- Production Release;
- Commercial Launch;
- Scale Execution.

Exit criteria:

- commercial flows are functional;
- legal/trust surface is final;
- operational support process exists;
- production release is approved;
- commercial launch is approved;
- scale execution can begin.

## 4. Current State Mapping

This mapping is evidence-based and conservative. It does not treat a foundation
module, planning document, or readiness checklist as production completion.

| Block | Current status | Evidence | Remaining work |
| --- | --- | --- | --- |
| A. Decision Simulation Persistence Implementation | Completed | Stage 4.2 persistence runtime foundation is closed. `lib/persistence-runtime` exists with owner contracts, Supabase provider, runtime wiring, simulation record save, history append, and draft save/update services. The recent `Saved Decision Simulations Runtime Foundation` commit adds an internal `lib/saved-decision-simulations` runtime boundary for save/load/list over owner-scoped simulation records. `docs/architecture/LEVIO_DECISION_SIMULATION_DOMAIN_MODEL.md` defines the final Decision Simulation product domain model for A1. A2 Persistence Runtime Mapping is complete: internal runtime maps saved `simulation_records` into canonical Decision Simulation domain objects and supports owner-scoped save/list/load/reopen/archive through existing server-only Auth/Persistence boundaries. A3 Saved Decision Simulation History / Product Surface Integration is implemented through `/dashboard/simulations`, `/dashboard/simulations/[id]`, and the server-only saved simulations product-surface boundary. The bounded completed-simulation save-from-UI flow is implemented on the HomeSimulator completed result surface through the same server-only runtime boundary, with owner identity resolved from Auth -> `levio_principals`. Block A Closure Validation is accepted through `npm run quality:block-a-decision-simulation-persistence-closure`, 79/79 PASS. | No remaining Block A implementation work for the approved persistence scope. Export/delete integration belongs to Block C. Block B real-account runtime is closed for its approved scope. Separately approved history/revision lifecycle events remain deferred until explicitly scoped. |
| B. Real User Account Runtime | Completed / Closure Accepted | Stage 4.1 auth runtime hardening exists. Supabase Auth boundary, browser auth boundary, server session validation, auth callback, protected dashboard layout, dashboard-only redirects, fail-closed protected access, magic-link login/register initiation, and client logout cleanup are implemented at foundation level. Block A already consumes authenticated session state through the approved saved-simulation product surface and resolves durable owners through `levio_principals`. B1 Supabase Auth Configuration Lock is complete in `docs/stages/stage-04-runtime-architecture/stage-04-01-auth-runtime/LEVIO_BLOCK_B1_SUPABASE_AUTH_CONFIGURATION_LOCK.md`. B2 Auth Action Boundary Completion is implemented and covered by `npm run quality:block-b-auth-action-boundary`. B3 Email Confirmation and Recovery Flow Validation is implemented and covered by `npm run quality:block-b-email-flow`. B4 Session Lifecycle and Protected Route Validation, B5 Real Account State in Dashboard, B6 Account-Owned Simulation Persistence Boundary, and B7 Account-Owned Dashboard Simulation Surface Validation are implemented and covered by their dedicated quality gates. Block B Closure evidence confirms real Supabase project validation, production email delivery, callback success, Supabase user creation, dashboard access after email confirmation, logout, and repeat sign-in reaching Supabase. The temporary Supabase diagnostic patch was removed. The final observed `over_email_send_rate_limit` / HTTP 429 response is a Supabase provider rate limit and not a Block B blocker. | No remaining Block B implementation or closure work for the approved real-account runtime scope. Export/delete integration belongs to Block C. Broader production readiness, operations, observability, security/privacy review, and release readiness belong to Block E/F. |
| C. User Data Management | Foundation Complete | Stage 4.3 User Data Controls foundation is closed. Export, deletion, retention, consent, server workflow, runtime boundary, and persistence read adapter modules exist as internal foundations. | User-facing export/delete flows are not product-executable. Stored decision artifact controls are not integrated with account-bound product flows. Privacy/data-control legal blockers remain open for production. |
| D. Production AI Integration | Deferred | Stage 5.1, 5.2, 5.3, and 5.4 foundation work is closed. AI provider abstraction, Prompt Context foundation, quality/cost/safety validation, controlled integration preflight, boundary composition, and dry-run foundation exist. | Real provider SDK/env/key execution, model calls, Prompt Context -> AI Provider runtime path, Decision Engine post-provider validation, cost controls, error controls, and user-safe AI output path remain deferred. |
| E. Product Validation & Production Readiness | In Progress | Stage 10 Product Quality Hardening is closed with deterministic preview gates for public simulator, public home, DecisionContext Builder, simulation pipeline runner, public adapter, observability, security, contract regression, HomeSimulator integration, trust readiness, and rendered public surface. Stage 15.4 aggregate verdict is NOT READY. | Full production user-flow QA, current pre-release gate reruns, observability/error tracking, infrastructure readiness, support readiness, incident/rollback decision authority, security/privacy review, and performance validation remain incomplete. |
| F. Commercial Production | Foundation Complete / Deferred | Stage 4.4 subscription runtime foundation is closed. Stage 11 legal/trust layer, Stage 12 market readiness, Stage 13 closed beta planning, Stage 14 public launch readiness, and Stage 15 scale readiness planning are documented. | Billing provider, checkout, customer portal, webhooks, pricing/tax/legal approval, final legal documents, monitoring/logging/support, Production Release, Commercial Launch, and Scale Execution remain unopened or blocked. |

## 5. Progress Model

Percentages below are estimated, conservative, and evidence-based. They measure
Levio V1 Complete, not documentation volume and not roadmap-stage count.

Overall Levio V1 Completion: **45% estimated**

Block A: Completed, **100% for approved persistence scope**, closed work:

- Decision Simulation Domain Model;
- Persistence Runtime Mapping;
- Saved Simulations History / Product Surface;
- Save-from-UI for completed Decision Simulations;
- Block A Closure Validation.

Block B: Completed / Closure Accepted, **100% for approved real-account runtime scope**, closed work:

- Supabase Auth configuration contract locked for Site URL, callback URL,
  redirect allowlist, env boundaries, email delivery expectations, current-code
  compatibility, and B2/B3 gaps.
- Auth Action Boundary Completion implemented for login/register redirect
  initiation through a server-only auth action and approved auth redirect
  helper; password recovery remains controlled inactive; logout behavior remains
  controlled; `npm run quality:block-b-auth-action-boundary` added.
- Email Confirmation and Recovery Flow Validation implemented at
  runtime/source-validation level: callback failures map to controlled invalid,
  expired, cancelled, missing-code, exchange-failed, or provider-error states;
  login/register show email-pending copy; password recovery remains inactive;
  `npm run quality:block-b-email-flow` added.
- Session Lifecycle and Protected Route Validation implemented at
  runtime/source-validation level: server sessions are checked with
  `getSession()` and confirmed with `getUser()`, stale/invalid/expired/revoked
  states are controlled, dashboard descendants are protected by the
  force-dynamic layout guard, middleware is not required for the current route
  shape, browser refresh remains in Supabase `onAuthStateChange`, logout is
  idempotent, and `npm run quality:block-b-session-lifecycle` added.
- Real Account State in Dashboard implemented: dashboard layout remains the
  single authenticated-account boundary, normalized session state is mapped to
  dashboard account state and provided through `DashboardAccountProvider`, and
  dashboard shell/profile/security consume that common runtime without direct
  Supabase calls or provider/internal identifiers; `npm run
  quality:block-b-dashboard-account-state` added.
- Account-Owned Simulation Persistence Boundary implemented: authenticated
  Supabase users are resolved/provisioned/synchronized to
  `levio_principals` through the server-only persistence provider before
  saved-simulation preflight, and saved simulation save/list/load/reopen/
  archive remain owner-scoped to canonical `levio_principals.principal_id`
  without exposing provider ids or Supabase clients to dashboard UI; `npm run
  quality:block-b-account-owned-simulation-persistence` added.
- Account-Owned Dashboard Simulation Surface Validation implemented:
  `/dashboard/simulations` and `/dashboard/simulations/[id]` use the
  saved-simulation product surface for list/detail/reopen/error states, expose
  archive only through a server action over the same account-owned runtime, and
  do not receive Supabase clients, raw sessions, provider references, owner
  ids, or raw database/provider errors; `npm run
  quality:block-b-dashboard-simulation-surface` added.

Block B closure evidence:

- real remote Supabase project settings and email delivery evidence are
  validated against the approved production environment;
- production-like runtime evidence confirms Magic Link delivery, callback
  success, Supabase user creation, dashboard access after email confirmation,
  logout, and repeat sign-in reaching Supabase;
- the temporary Supabase diagnostic patch was removed after provider evidence
  capture;
- Supabase `over_email_send_rate_limit` / HTTP 429 is classified as an external
  provider limit, not a Block B blocker;
- `npm run quality:block-b-email-flow` and
  `npm run quality:block-b-auth-action-boundary` pass.

Block C: Foundation Complete, **25% estimated**, remaining work:

- implement user-facing export/delete flows;
- include saved simulations, drafts, and history where approved;
- enforce retention and deletion lifecycle behavior;
- close privacy/data-control blockers;
- validate ownership and account lifecycle boundaries.

Block D: Deferred, **20% estimated**, remaining work:

- connect real AI Provider internally;
- execute Prompt Context -> AI Provider -> Decision Engine path;
- normalize outputs as decision simulations;
- implement cost, safety, fallback, and error controls;
- prevent AI Chat / Answer Engine drift.

Block E: In Progress, **45% estimated**, remaining work:

- rerun and expand validation for production runtime;
- validate core account, persistence, data-control, AI, and commercial flows;
- establish observability/error tracking;
- complete security/privacy/performance review;
- close or document production blockers with owners.

Block F: Foundation Complete / Deferred, **15% estimated**, remaining work:

- implement commercial billing/subscription flows if enabled;
- finalize legal/trust documents and approvals;
- establish support, monitoring, logging, rollback, and operations;
- approve Production Release;
- approve Commercial Launch;
- approve Scale Execution.

## 6. Next Action Rule

At the start of every future implementation block, compare:

- `CURRENT_STAGE.md`;
- `LEVIO_CURRENT_STATE.md`;
- `LEVIO_PROJECT_PROGRESS.md`;
- `LEVIO_IMPLEMENTATION_PLAN.md`.

Then identify:

- current block;
- completed work;
- remaining work;
- blockers;
- next implementation step;
- whether the step is product implementation, runtime implementation, QA,
  documentation, or commercial readiness.

The comparison must preserve the immutable architecture and must not convert
Levio into AI Chat, an Answer Engine, or a generic assistant.

## 7. Current Next Correct Implementation Step

Most recent implementation block: **Block A - Decision Simulation Persistence
Implementation**.

Block A status: **Completed** for the approved persistence scope.

Current evidence:

- Stage 4.2 persistence runtime foundation exists;
- Stage 4.1 auth runtime foundation exists;
- Stage 4.3 user data controls foundation exists;
- `Saved Decision Simulations Runtime Foundation` adds an internal save/load/list
  runtime boundary for saved decision simulations;
- `docs/architecture/LEVIO_DECISION_SIMULATION_DOMAIN_MODEL.md` completes A1 by
  defining the final Decision Simulation product object, lifecycle, fields,
  ownership model, constraints, and persistence requirements;
- the first A2 runtime mapping subblock maps saved `simulation_records` into
  canonical Decision Simulation domain objects and adds owner-scoped
  save/list/load/reopen/archive capabilities without schema changes;
- A3 connects the existing dashboard simulations routes to the server-only
  saved simulations product-surface boundary for runtime-backed list,
  detail/reopen, empty, auth, invalid-id, not-found, and controlled error
  states;
- the completed HomeSimulator result surface can now save completed Decision
  Simulations through the server-only saved simulations action/runtime and
  return users to `/dashboard/simulations`;
- Block A Closure Validation is accepted through
  `npm run quality:block-a-decision-simulation-persistence-closure`, 79/79
  PASS;
- Stage 15.4 aggregate Scale verdict remains NOT READY;
- Stage 15.5 blocker framework remains relevant for production/scale blockers.

Next correct implementation step:

No further Block A or Block B implementation task is currently required for
their approved scopes. Future work requires separate approval and should remain
bounded to the relevant block: Block C for export/delete over saved simulation
records, Block E for broader production readiness validation, and Block F for
commercial production readiness if later approved. Separately approved
history/revision lifecycle events remain deferred until explicitly scoped.

Any next step must continue using the approved server-only boundaries and must
not change the public `/api/simulate` contract unless separately approved.

It must not open:

- Production Release;
- Commercial Launch;
- Scale Execution;
- Real AI execution;
- billing;
- analytics;
- tracking;
- roadmap expansion.

## 7.1 Block B Audit and Decomposition

Audit verdict:

**Block B Closure is complete for the approved real-account runtime scope.**
Production evidence confirms the real account lifecycle required for Block B:
real Supabase project validation, production email delivery, callback success,
Supabase user creation, dashboard access after email confirmation, logout, and
repeat sign-in reaching Supabase. The final observed
`over_email_send_rate_limit` / HTTP 429 response is a Supabase provider rate
limit and not a Block B blocker.

Confirmed existing foundation:

- Supabase Auth is the approved provider behind Levio-owned auth modules.
- `lib/auth` validates runtime config, creates server/browser Supabase clients,
  normalizes sessions, sanitizes dashboard-only redirects, handles
  `/auth/callback`, and fails closed when auth is disabled, missing, invalid,
  expired, revoked, provider-rejected, invalid, cancelled, or
  callback-expired.
- `app/dashboard/layout.tsx` protects dashboard descendants through the
  server-side auth guard and forces dynamic session validation.
- `/login` and `/register` initiate Supabase email OTP/magic-link flows through
  the browser auth boundary and redirect authenticated users to dashboard.
- Dashboard logout clears Supabase browser auth state and the legacy mock marker.
- Block A saved-simulation surfaces use server-only auth/persistence boundaries,
  reject client owner input, resolve owners through `levio_principals`, and do
  not trust Supabase `auth.users.id` as the canonical owner.

Confirmed closure boundaries:

- Real Supabase project settings, production redirect behavior, email delivery,
  and email confirmation behavior are validated by production evidence for the
  approved Block B scope.
- Password reset/recovery remains intentionally inactive on `/forgot-password`.
- Session restoration through callback, authenticated dashboard access, logout,
  and repeat sign-in are validated by production-like runtime evidence.
- No middleware file exists. B4 accepts this as sufficient for the current
  route shape because every protected dashboard page is a descendant of the
  force-dynamic dashboard layout guard. Middleware should be reconsidered only
  if protected non-dashboard routes, protected route handlers, or exact
  subroute-preserving unauthenticated redirects become product requirements.
- Dashboard account-facing shell/profile/security surfaces now use the
  normalized server-validated dashboard account state. Future-only memory,
  privacy, export/delete, subscriptions, Real AI, and billing surfaces remain
  prepared/demo where their runtime blocks are still deferred.
- The auth normalized principal still uses the Stage 4.1B temporary principal
  display id, while durable persistence ownership depends on a separate
  `levio_principals` row. B6 now bridges this through server-only persistence
  principal provisioning/sync before saved-simulation preflight.
- Dedicated B2/B3/B4/B5/B6/B7 quality gates now cover auth action redirects, email
  callback/recovery states, protected dashboard routes, session lifecycle,
  logout cleanup, dashboard account state, and account-owned saved-simulation
  persistence plus dashboard saved-simulation surface validation. A full Block
  B closure gate for real-provider evidence is still missing.

Recommended Block B implementation sequence:

1. **B1 Supabase Auth Configuration Lock**
   Status: complete as documentation/configuration contract in
   `docs/stages/stage-04-runtime-architecture/stage-04-01-auth-runtime/LEVIO_BLOCK_B1_SUPABASE_AUTH_CONFIGURATION_LOCK.md`.
   Confirm required local, preview, and production auth env variables, Site URL,
   redirect URLs, email confirmation posture, email templates, email provider
   assumptions, anonymous/OAuth/password posture, and rollout flags. This must
   happen first because runtime behavior cannot be meaningfully validated while
   provider settings are unknown.

2. **B2 Auth Action Boundary Completion**
   Status: complete. Login/register use the server-only
   `prepareEmailOtpAuthRedirect` boundary and `buildAuthRedirectUrl()` instead
   of uncontrolled client-origin redirect construction; password recovery
   remains controlled inactive; logout cleanup is preserved; the dedicated gate
   is `npm run quality:block-b-auth-action-boundary`.
   Complete or explicitly lock the approved action boundary for registration,
   login, logout, resend/confirmation states, and recovery entry points. This
   step should keep Supabase SDK calls behind `lib/auth` and must not expose
   provider tokens, user IDs, owner IDs, or session internals to product code.

3. **B3 Email Confirmation and Recovery Flow Validation**
   Status: complete at runtime/source-validation level. The auth callback maps
   provider and exchange failures into controlled invalid, expired, cancelled,
   missing-code, exchange-failed, or provider-error states; login/register show
   email-pending copy after approved OTP initiation; password recovery remains
   explicitly inactive; the dedicated gate is `npm run
   quality:block-b-email-flow`.
   Validate magic-link/callback success and provider error states, confirm
   whether password reset is disabled by policy or implemented, and make the
   user-facing recovery path match that decision. This follows B2 because the
   entry actions and callback states must exist before production-like QA.

4. **B4 Session Lifecycle and Protected Route Validation**
   Status: complete at runtime/source-validation level. Server session
   validation uses `getSession()` plus `getUser()`, maps missing, invalid,
   expired, and revoked/stale sessions to controlled states, keeps dashboard
   descendants protected by the force-dynamic layout guard, documents
   middleware as unnecessary for the current route shape, bounds browser refresh
   to Supabase `onAuthStateChange`, and keeps logout idempotent while clearing
   Supabase plus legacy mock state. The dedicated gate is `npm run
   quality:block-b-session-lifecycle`.
   Prove session restoration, refresh, expiration, invalid-session handling,
   logout, revoked-session behavior, dashboard redirects, and direct route
   access. This step should also decide whether the existing dashboard layout
   guard remains sufficient or whether middleware is required.

5. **B5 Real Account State in Dashboard**
   Status: complete. The guarded dashboard layout is the single boundary that
   obtains the authenticated account, maps the normalized server-validated
   session into dashboard account state, and provides that state through
   `DashboardAccountProvider`. Dashboard shell/profile/security consume this
   common runtime and do not receive provider references, session ids, principal
   ids, raw auth errors, or direct Supabase clients. Existing logout cleanup
   remains on the approved browser auth runtime. The dedicated gate is `npm run
   quality:block-b-dashboard-account-state`.
   Connect dashboard account-facing surfaces to normalized server-validated
   account/session state where appropriate, while preserving prepared/demo copy
   for future-only memory, subscriptions, export/delete, Real AI, and billing.
   This follows session validation so dashboard UI does not become an auth
   authority.

6. **B6 Principal Provisioning and Persistence Ownership Bridge**
   Status: complete. The server-only persistence provider resolves existing
   `levio_principals` rows, provisions a new active row for an authenticated
   Supabase user when missing, and syncs bounded email/auth timestamps before
   saved-simulation preflight. Block A save/list/load/reopen/archive operations
   remain owner-scoped to canonical `levio_principals.principal_id`, reject
   client owner injection, and do not expose provider ids or Supabase clients
   to dashboard UI. The dedicated gate is `npm run
   quality:block-b-account-owned-simulation-persistence`.

7. **B7 Block B Quality Gate and Closure Evidence**
   Status: complete for the account-owned dashboard simulation surface slice.
   Dashboard simulations routes remain dynamic server surfaces over the
   saved-simulation product boundary. The history surface lists only
   owner-scoped active saved simulations, detail/reopen maps missing,
   archived, invalid, or cross-owner records to controlled states, and archive
   is exposed only through a server action that reuses the account-owned
   runtime boundary. The dedicated gate is `npm run
   quality:block-b-dashboard-simulation-surface`.

   Add only the necessary auth/account quality checks for the real account
   lifecycle: unauthenticated protected-route denial, authenticated access,
   callback errors, recovery policy, logout/session invalidation, principal
   provisioning, client owner spoof rejection, and saved-simulation ownership
   integration. Block B can close only after these checks and real-provider
   configuration evidence pass.

## 8. Levio V1 Complete Criteria

Levio V1 Complete requires all of the following:

- Decision Simulation Engine identity remains intact.
- Immutable architecture remains intact.
- Users can create and manage real accounts.
- Users can run decision simulations.
- Users can save decision simulations as user-owned product objects.
- Users can list and reopen saved simulations.
- Saved simulations are owner-scoped through the approved persistence boundary.
- Users can export and delete relevant account-bound data.
- Retention and deletion lifecycle behavior is implemented and validated.
- Real AI Provider works only as an internal Decision Engine component.
- Simulation output remains structured decision simulation output.
- Public and internal contracts are stable and validated.
- Core user flows pass production-level QA.
- Observability, error handling, logging, support, rollback, and incident
  response are ready.
- Security, privacy, legal, trust, and operational blockers are closed or
  explicitly accepted by the correct owner for the intended release scope.
- Commercial subscription flows are functional if enabled for V1.
- Production Release is approved.
- Commercial Launch is approved if commercial operation is in scope.
- Scale Execution is approved only after readiness evidence supports it.

## 9. Non-Changes

This document does not change:

- runtime code;
- UI;
- API;
- public contract;
- architecture;
- roadmap;
- simulator behavior;
- Decision Engine behavior;
- Prompt Context behavior;
- AI Provider behavior;
- auth runtime;
- persistence runtime;
- billing;
- analytics;
- tracking;
- logging;
- infrastructure.

This document does not by itself complete any implementation block. It is the
canonical comparison plan for deciding what remains before Levio V1 Complete.
