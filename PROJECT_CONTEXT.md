# PROJECT CONTEXT

## Current Confirmed State

Date: 2 July 2026, Europe/Madrid.

Levio.es is a Decision Simulation Engine.

Levio is not an AI Chat.

Levio is not an Answer Engine.

Levio is not a Generic AI Assistant.

The active checkpoint is Stage 11.9 - Legal Review Packet & Drafting Handoff
Complete. This is a documentation-only legal review and drafting handoff
foundation. It packages Stage 11 requirements, blockers, source truths, future
legal documents to prepare, professional legal review questions, prohibited
pre-review actions, and future drafting/publication ownership. It does not
create final legal policies, legal prose, public legal copy, UI copy, notices,
consent banners, trust page copy, compliance claims, Market Readiness, Closed
Beta, Public Launch, Stage 12, or production runtime behavior.

Stage 5.4 AI Integration Foundation Complete / Real AI Runtime Deferred remains
closed. Stage 5.4A-D are closed as foundation-only preflight, runtime
validation, boundary composition, and dry-run execution. Real model calls and
real AI provider integration remain deferred.

Stage 10 Product Quality Hardening is closed. The first five bounded public simulator
hardening steps are complete: Public Simulator Failure & Input Boundary
Hardening, API Response Contract Hardening, API Abuse Boundary Hardening,
Public Simulator Mock Truth Boundary, and Manual QA Matrix Verification with
12/12 PASS. The deterministic Decision Engine public backend runtime switch is
accepted: `/api/simulate` now executes Raw User Input -> DecisionContext
Builder -> `runSimulationPipeline` -> `SimulationResponseV2Draft` -> Public
Adapter -> `/api/simulate` while preserving the existing public
`simulate-api-v1-mock` envelope. The automated Public Simulator regression
gate is implemented as `npm run quality:public-simulator` and currently passes
56/56 after bounded edge-status hardening. The automated Home + Public
Simulator quality gate is implemented as
`npm run quality:public-home` and currently passes 68/68. Internal runtime
quality gates are implemented for the DecisionContext Builder, Simulation
Pipeline Runner, SimulationResponse Public Adapter, and deterministic runtime
observability / rollback semantics. The bounded deterministic runtime
observability / rollback semantics subblock is closed without changing the
public API contract. The bounded deterministic runtime security boundary /
abuse protection subblock is also closed without changing valid-request product
behavior.
The bounded deterministic runtime contract regression / public envelope
stability subblock is closed with a dedicated end-to-end public contract gate.
The bounded HomeSimulator -> `/api/simulate` integration stability subblock is
closed with a dedicated public UI/API integration gate.
The bounded Public Site Trust / Readiness Copy Audit subblock is closed with a
dedicated public copy/readiness gate.
Stage 10 Readiness Review is complete. Product Quality Hardening is assessed as
engineering-complete for deterministic runtime/API/security/rollback/contract/
HomeSimulator/trust-readiness foundations. The bounded Rendered Public Surface
Regression subblock is closed with targeted mobile simulator polish and a
dedicated rendered public surface gate.
The Stage 10 Closure Aggregate Gate / Documentation Lock is now complete as a
documentation-only closure decision. Stage 10 is closed with a reproducible
baseline and no runtime, API, UI, Home, HomeSimulator, Decision Engine, Prompt
Context, AI Provider, or product behavior changes.

Stage 5.3 remains closed as AI Quality / Cost / Safety Validation Foundation
Complete. Stage 5.2 remains closed as Prompt / Context Layer Foundation
Complete. Stage 5.1 remains closed as AI Provider Abstraction / Real AI
Integration Foundation Complete. Stage 4.4 remains closed as Subscription
Runtime Foundation Complete / Production Billing Deferred. Stage 4.3 remains
closed as User Data Controls foundation/runtime-boundary complete after the
excessive Stage 4.3 gate/audit/micro-stage chain was removed.

Stage 11 Legal & Trust Layer is open only for documentation-only legal/trust
architecture work. Legal & Trust Foundation Inventory, Stage 11.2 Legal Surface
Scope & Ownership Lock, Stage 11.3 Privacy & Data Processing Scope Foundation,
Stage 11.4 Terms & Acceptable Use Scope Foundation, Stage 11.5 Cookies &
Consent Scope Foundation, Stage 11.6 AI Transparency & Decision Simulation
Disclaimer Foundation, and Stage 11.7 User Trust Surface Requirements
Foundation, Stage 11.8 Regulatory Readiness Matrix, and Stage 11.9 Legal
Review Packet & Drafting Handoff are complete. The next implementation
subblock is Stage 11.10 Production Legal Blockers Closure Gate. The complete
Stage 11
structure contains 10 bounded subblocks:

1. Legal & Trust Foundation Inventory.
   Goal: define the complete Stage 11 map without implementing legal content.
   Engineering value: prevents premature document drafting, runtime changes, or
   Stage 12 expansion.
   Dependency: Stage 10 closure baseline and Repository Structure
   Normalization.
   Completion criterion: bounded subblocks, sequence, dependencies, completion
   criteria, and first recommended implementation subblock are recorded in the
   active state documents.
2. Legal Surface Scope & Ownership Lock.
   Goal: identify legal surfaces, document ownership, review responsibilities,
   jurisdiction assumptions, and allowed change boundaries.
   Engineering value: creates a controlled owner/legal review interface before
   any policy text or product change.
   Dependency: Legal & Trust Foundation Inventory.
   Completion criterion: legal surfaces and owners are locked; out-of-scope
   runtime/API/UI/product behavior changes are explicitly deferred.
3. Privacy & Data Processing Scope Foundation.
   Goal: map privacy scope, data categories, processing purposes, retention
   expectations, processors/subprocessors, and existing User Data Controls
   dependencies at a requirements level only.
   Engineering value: turns privacy into a traceable data-flow and dependency
   inventory before policy drafting.
   Dependency: Legal Surface Scope & Ownership Lock plus existing User Data
   Controls and Persistence foundations.
   Completion criterion: privacy/data-processing requirements and blockers are
   listed without writing a Privacy Policy.
4. Terms & Acceptable Use Scope Foundation.
   Goal: define the terms-of-use requirement areas, product limitations,
   acceptable-use boundaries, account/subscription deferrals, and responsibility
   model.
   Engineering value: prevents Terms copy from promising unavailable runtime,
   billing, account, persistence, or Real AI behavior.
   Dependency: Legal Surface Scope & Ownership Lock and current product
   behavior baseline.
   Completion criterion: terms requirement inventory is approved without writing
   Terms of Service.
5. Cookies & Consent Scope Foundation.
   Goal: inventory cookie/storage categories, consent needs, analytics/marketing
   deferrals, and consent-state dependencies.
   Engineering value: separates cookie/consent obligations from runtime
   implementation and avoids accidental tracking scope.
   Dependency: Legal Surface Scope & Ownership Lock and current frontend/storage
   behavior baseline.
   Completion criterion: cookie and consent requirements are captured without
   writing a Cookie Policy or adding consent UI.
6. AI Transparency & Decision Simulation Disclaimer Foundation.
   Goal: define disclosure requirements for deterministic preview behavior, Real
   AI deferral, Decision Simulation limitations, and no high-stakes advice
   positioning.
   Engineering value: keeps public trust copy aligned with the Decision
   Simulation Engine invariant and prevents AI Chat / Answer Engine drift.
   Dependency: Stage 10 trust/readiness copy audit and current `/api/simulate`
   public contract.
   Completion criterion: AI transparency and disclaimer requirements are listed
   without changing UI copy or runtime behavior.
7. User Trust Surface Requirements Foundation.
   Goal: define trust-surface requirements for security, privacy, support,
   contact, account state, data-control state, and product-readiness honesty.
   Engineering value: gives future UI/document work a bounded trust checklist
   without creating new public commitments.
   Dependency: Privacy/Data Processing, Cookies/Consent, and AI Transparency
   requirements.
   Completion criterion: user trust requirements and deferred claims are
   recorded with no UI implementation.
8. Regulatory Readiness Matrix.
   Goal: map relevant readiness areas such as GDPR, ePrivacy/cookies, consumer
   transparency, AI transparency, data-subject rights, and production review
   blockers at a requirements level.
   Engineering value: makes compliance dependencies visible before Market
   Readiness or Closed Beta.
   Dependency: Privacy/Data Processing, Terms, Cookies/Consent, AI
   Transparency, and User Trust requirements.
   Completion criterion: readiness matrix and unresolved legal/engineering
   blockers are documented without opening Stage 12.
9. Legal Review Packet & Drafting Handoff.
   Goal: package requirements, blockers, source truths, and review questions for
   owner/legal drafting.
   Engineering value: creates a controlled handoff for future Privacy, Terms,
   Cookie, and transparency documents.
   Dependency: Regulatory Readiness Matrix.
   Completion criterion: counsel/owner-ready drafting packet exists without
   treating generated text as final legal policy.
10. Production Legal Blockers Closure Gate.
    Goal: aggregate Stage 11 evidence, unresolved blockers, required approvals,
    and explicit deferrals before any production-readiness step.
    Engineering value: prevents Market Readiness, Closed Beta, Public Launch, or
    commercial runtime work from opening with unresolved legal blockers.
    Dependency: Legal Review Packet & Drafting Handoff.
    Completion criterion: Stage 11 blockers and approvals are accepted, or
    explicit unresolved blockers remain documented as preventing Stage 12.

Recommended first implementation subblock after this inventory: Legal Surface
Scope & Ownership Lock. It should remain documentation-only until separately
approved and should not write Privacy Policy, Terms, Cookie Policy, consent UI,
runtime code, API changes, UI changes, Decision Engine changes, product
behavior changes, Real AI integration, Market Readiness, Closed Beta, or Public
Launch.

Stage 11.2 Legal Surface Scope & Ownership Lock is complete as a
documentation-only architecture lock under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_2_LEGAL_SURFACE_SCOPE_OWNERSHIP_LOCK.md`.
It defines the canonical legal-surface registry, owners, engineering
responsibilities, source-of-truth hierarchy, mandatory/conditional status,
public/production/internal status, dependencies, linkage model, and duplicate
responsibility boundaries.

Locked legal surfaces:

- Privacy Surface;
- Terms Surface;
- Cookie & Local Storage Surface;
- Consent Surface;
- Data Processing Surface;
- User Data Controls Surface;
- AI Transparency Surface;
- Decision Simulation Limitations Surface;
- Legal Identity & Contact Surface;
- Auth & Account Legal Surface;
- Subscription & Billing Legal Surface;
- User Trust Surface;
- Regulatory Readiness Surface;
- Production Legal Blockers Surface.

Stage 11.2 does not approve or implement legal-document content, UI changes,
runtime changes, API changes, simulator changes, Decision Engine changes, AI,
auth, database, subscriptions, billing, Market Readiness, Closed Beta, Public
Launch, or production legal readiness.

Stage 11.2 successor subblock: Stage 11.3 Privacy & Data Processing Scope
Foundation, now complete.

Stage 11.3 Privacy & Data Processing Scope Foundation is complete as a
documentation-only architecture foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_3_PRIVACY_DATA_PROCESSING_SCOPE_FOUNDATION.md`.
It defines data categories, origins, lifecycles, appearances, permitted uses,
prohibited uses, mandatory/conditional/future-only status, processing-zone
boundaries, external-transfer prohibitions, legal-reference routing, and the
separation between Decision Simulation Engine data and platform infrastructure
data.

Locked Stage 11.3 data categories:

- Public Decision Input;
- Simulation Output Artifacts;
- Public API Metadata;
- Abuse Boundary / Rate-Limit Source Data;
- Local Simulation History;
- Mock Session Flag;
- Auth Email and Login Intent;
- Auth Session and Principal Data;
- Account Profile and Security Placeholder Data;
- Memory / Preference / Strategic Context Data;
- Consent, Retention, Export, and Deletion Records;
- Persistence Owner / Principal Mapping Data;
- Subscription and Billing Data;
- Operational Logs and Error Evidence;
- Analytics and Marketing Events;
- AI Provider Payload and Candidate Material;
- Browser Speech Recognition Transcript.

Stage 11.3 locks boundaries between Local Storage, Runtime Memory, User Account,
AI Provider, Logs, and Analytics. Current approved external transfer remains
prohibited for raw decision input, simulation artifacts, local history, mock
session data, browser speech transcripts controlled by Levio code, AI provider
payloads, analytics/marketing events, and any account, consent, export,
deletion, billing, or principal data except where an already approved
infrastructure boundary applies.

Stage 11.3 does not approve production personal-data processing, database
writes, external analytics, Real AI provider transfer, production auth,
billing/subscription processing, legal-document content, or product behavior
changes.

Stage 11.4 Terms & Acceptable Use Scope Foundation is complete as a
documentation-only architecture foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_4_TERMS_ACCEPTABLE_USE_SCOPE_FOUNDATION.md`.
It defines Terms coverage zones, Acceptable Use coverage zones, allowed /
restricted / prohibited user action classes, Decision Simulation Engine
restrictions, AI Provider restrictions, account restrictions, subscription and
billing restrictions, Local Storage / user data / saved simulation
restrictions, future roadmap-stage restrictions, required cross-surface
references, product-rule / legal-rule / technical-enforcement boundaries,
production-launch mandatory rules, and deferred/future-only rules.

Stage 11.4 locks Terms/AUP coverage for:

- Public Website and Informational Surfaces;
- Public Decision Simulator;
- Public `/api/simulate` Contract;
- Local Storage and Local Saved Simulations;
- Auth, Account, and Dashboard Surfaces;
- User Data Controls and Saved Account Data;
- AI Provider and Real AI Runtime;
- Subscriptions, Billing, and Entitlements;
- Support, Contact, Trust, and Official Notices.

Stage 11.4 locks Acceptable Use coverage for:

- Public Simulator Input;
- Simulation Output Use;
- Abuse, Security, and Availability;
- Account and Identity Misuse;
- Local Storage and Saved Simulations;
- AI Provider Misuse;
- Billing and Subscription Misuse.

Stage 11.4 does not approve Terms of Service, Acceptable Use Policy, legal
content, user-facing notices, runtime enforcement, production accounts,
production persistence, billing, subscriptions, Real AI, analytics, logging,
Market Readiness, Closed Beta, Public Launch, or product behavior changes.

Stage 11.5 Cookies & Consent Scope Foundation is complete as a
documentation-only architecture foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_5_COOKIES_CONSENT_SCOPE_FOUNDATION.md`.
It defines cookie / consent / tracking surfaces, mandatory / conditional /
deferred / future-only classifications, strictly necessary boundaries,
analytics boundaries, billing/subscription boundaries, auth/session boundaries,
Local Storage / saved simulations / memory boundaries, AI Provider and external
service boundaries, consent-required surfaces, no-consent architecture surfaces,
legal-review-blocked surfaces, prohibited surfaces, cross-surface links,
boundaries between cookies, Local Storage, Runtime Memory, logs, and analytics,
production-launch mandatory requirements, and deferred/future-only
requirements.

Stage 11.5 locked cookies/consent/tracking surfaces:

- Public Request Runtime Memory;
- Public API Abuse / Rate-Limit Runtime Memory;
- Local Simulation History;
- Legacy Mock Session Local Storage;
- Supabase Auth / Session Cookies;
- Consent Preference / Consent Record Storage;
- Analytics Events and Analytics Cookies;
- Marketing / Retargeting / Advertising Tracking;
- Billing / Subscription Provider Cookies and Checkout State;
- AI Provider / External AI Service State;
- Operational Logs / Monitoring / Error Evidence;
- Browser Speech Recognition Vendor Processing;
- Future Memory / Personalization Storage.

Stage 11.5 does not approve Cookie Policy, Privacy Policy, consent banner text,
legal content, consent runtime, tracking, analytics provider integration,
production auth cookies, billing provider cookies, Real AI external-service
processing, Market Readiness, Closed Beta, Public Launch, or product behavior
changes.

Stage 11.6 AI Transparency & Decision Simulation Disclaimer Foundation is
complete as a documentation-only architecture foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_6_AI_TRANSPARENCY_DECISION_SIMULATION_DISCLAIMER_FOUNDATION.md`.
It defines AI Transparency surfaces, Decision Simulation Disclaimer surfaces,
no-AI-Chat / no-Answer-Engine / no-professional-advisor understanding points,
AI Provider role explanation requirements, Decision Engine and Simulator role
explanation requirements, production-launch mandatory requirements,
future-only requirements, high-risk decision warning requirements, uncertainty /
scenario / probability / risk / tradeoff / outcome warning requirements,
cross-surface links, product-positioning / legal-disclaimer / UI-explanation /
technical-enforcement boundaries, legal-review-blocked surfaces, and deferred /
future-only surfaces.

Stage 11.6 locked AI Transparency surfaces:

- Product Identity Transparency;
- Deterministic Preview Runtime Transparency;
- AI Provider Role Transparency;
- Prompt Context / AI Quality / Controlled Integration Transparency;
- AI Processing of Personal Data Transparency;
- AI Capability / Limitation Transparency.

Stage 11.6 locked Decision Simulation Disclaimer surfaces:

- Public Simulator Entry Disclaimer Surface;
- Simulation Result Disclaimer Surface;
- Scenario / Probability / Confidence Disclaimer Surface;
- Risk / Tradeoff / Outcome Disclaimer Surface;
- Recommendation / Suggested Direction Disclaimer Surface;
- High-Risk Decision Disclaimer Surface;
- Clarification / Cannot Recommend / Refusal Disclaimer Surface;
- Local Saved Simulation Disclaimer Surface;
- Auth / Dashboard Placeholder Disclaimer Surface;
- Future AI-Backed Simulation Disclaimer Surface.

Stage 11.6 does not approve AI Disclaimer text, legal disclaimer text, Terms
text, Privacy text, UI copy, user notices, modal text, page text, Real AI
runtime, AI Provider execution, professional-advice positioning, Market
Readiness, Closed Beta, Public Launch, or product behavior changes.

Stage 11.7 User Trust Surface Requirements Foundation is complete as a
documentation-only architecture foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_7_USER_TRUST_SURFACE_REQUIREMENTS_FOUNDATION.md`.
It defines trust surfaces, production-launch mandatory trust surfaces,
conditional / deferred / future-only trust surfaces, required status visibility
for data / AI / Local Storage / account / billing / privacy / cookies /
consent / simulations, no-AI-Chat / no-Answer-Engine / Decision Simulation
Engine trust indicators, cross-surface links, trust-UX / legal-disclosure /
product-explanation / technical-enforcement boundaries, legal-review-blocked
trust surfaces, and source-of-truth requirements for future UI implementation.

Stage 11.7 locked trust surfaces:

- Product Identity and Readiness Trust Surface;
- Simulation Status Trust Surface;
- Data Status Trust Surface;
- Local Storage and Saved Simulation Trust Surface;
- Privacy and Data Processing Trust Surface;
- Cookies, Consent, Analytics, and Tracking Trust Surface;
- AI Status and Provider Trust Surface;
- Account and Auth Trust Surface;
- Billing and Subscription Trust Surface;
- User Data Controls Trust Surface;
- Security, Abuse, and Operational Trust Surface;
- Support, Contact, and Legal Identity Trust Surface;
- Legal Document Status Trust Surface;
- Regulatory and Production Readiness Trust Surface.

Stage 11.7 does not approve legal documents, page text, UI copy, banners,
modals, user notifications, trust page copy, runtime trust indicators, Real AI
runtime, production account trust claims, billing trust claims, analytics trust
claims, Market Readiness, Closed Beta, Public Launch, or product behavior
changes.

Stage 11.8 Regulatory Readiness Matrix is complete as a documentation-only
regulatory readiness architecture foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_8_REGULATORY_READINESS_MATRIX.md`.
It maps GDPR / personal-data processing readiness, data-subject rights
readiness, ePrivacy / cookies / Local Storage / consent readiness, consumer
transparency / product representation readiness, AI transparency / AI-related
readiness, high-risk / professional-advice boundary readiness, security /
abuse / operational readiness, auth / account / persistence readiness,
subscription / billing / commercial readiness, analytics / marketing /
tracking readiness, legal identity / contact / support readiness, and
Production Legal Blockers / Stage 12 gate readiness.

Stage 11.8 locked:

- mandatory production-launch readiness areas;
- mandatory readiness dependencies before production auth/account;
- mandatory readiness dependencies before paid plans;
- mandatory readiness dependencies before Real AI public use;
- mandatory readiness dependencies before analytics or marketing;
- consolidated unresolved legal blockers;
- consolidated unresolved engineering blockers;
- boundary between readiness, compliance claims, legal approval, and technical
  enforcement;
- deferred and future-only regulatory dependencies;
- Stage 11.9 handoff inputs.

Stage 11.8 does not claim compliance, approve Privacy Policy, Terms, Cookie
Policy, AI Disclaimer, consent notice, user-facing copy, legal prose, production
auth, production persistence, billing, analytics, Real AI, consent runtime,
Market Readiness, Closed Beta, Public Launch, Stage 12, or product behavior
changes.

Stage 11.9 Legal Review Packet & Drafting Handoff is complete as a
documentation-only legal review and drafting handoff foundation under
`docs/stages/stage-11-legal-trust/LEVIO_STAGE_11_9_LEGAL_REVIEW_PACKET_DRAFTING_HANDOFF.md`.
It packages prepared Stage 11 documents, covered legal areas, future legal
documents to prepare, professional legal review questions, consolidated
unresolved legal blockers, consolidated unresolved engineering/product
blockers, prohibited actions before legal review, drafting handoff inputs,
future drafting/publication ownership, and source-of-truth rules for future
drafting.

Stage 11.9 locked:

- Stage 11 prepared-document inventory;
- legal areas covered by Stage 11;
- future legal documents to prepare: Privacy Policy, Terms of Use, Cookie
  Policy, AI / Decision Simulation Disclaimer, Data Processing / User Rights
  notices where applicable, and Legal Identity / Contact / Support notice;
- professional legal review questions;
- consolidated unresolved legal blockers;
- consolidated engineering/product blockers;
- prohibited pre-review actions;
- future drafting/publication routing to Stage 11.10, Stage 12, Closed Beta
  preparation, Public Launch preparation, or separate future legal review.

Stage 11.9 does not write final legal policies, legal prose, Privacy Policy,
Terms of Use, Cookie Policy, AI Disclaimer, consent notice, trust page copy, UI
copy, public legal copy, compliance claims, production approvals, Market
Readiness, Closed Beta, Public Launch, Stage 12, runtime behavior, or product
behavior changes.

Next implementation subblock: Stage 11.10 Production Legal Blockers Closure
Gate.

Supporting references:

- `docs/stages/stage-04-runtime-architecture/stage-04-03-user-data-controls/LEVIO_STAGE_4_3A_USER_DATA_CONTROLS_SCOPE_LOCK.md`
- `docs/stages/stage-04-runtime-architecture/stage-04-03-user-data-controls/LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`
- `docs/stages/stage-04-runtime-architecture/stage-04-03-user-data-controls/LEVIO_STAGE_4_3_USER_DATA_CONTROLS_FOUNDATION_CLOSURE.md`
- `docs/stages/stage-04-runtime-architecture/stage-04-04-subscription-runtime/LEVIO_STAGE_4_4A_SUBSCRIPTION_RUNTIME_SCOPE_LOCK.md`
- `docs/architecture/LEVIO_TARGET_RUNTIME_ARCHITECTURE.md`

## Immutable Runtime Architecture

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

No runtime or product step may bypass the Simulator, Decision Engine, Prompt
Context, AI Provider boundary, AI Quality validation, or post-provider Decision
Engine validation.

AI Quality / Cost / Safety Validation is an internal structured-evidence layer.
It evaluates quality, cost, safety, and release-gate evidence only. It must
never become a chat surface, answer engine, provider caller, or owner of final
decision semantics.

Prompt Context is an internal controlled context layer. It prepares structured
Decision Simulation context for future AI Provider use, but it must never become
raw chat prompt handling, user-controlled system prompting, an answer engine, or
the owner of final decision semantics.

AI Provider is an internal replaceable component. It supplies controlled
candidate material only and must never become the product, the direct respondent
to the user, or the owner of decision semantics.

Controlled AI Integration is an internal foundation layer. It validates and
composes existing Prompt Context, AI Provider, and AI Quality boundaries for
preflight and dry-run evidence only. It must never become a provider caller,
answer engine, chat surface, direct AI-to-user path, or owner of final decision
semantics.

## Stage 5.4 Implementation State

Stage 5.4A-D is closed as Controlled AI Integration Foundation under
`lib/ai-integration`.

Implemented:

- Stage 5.4A controlled AI integration preflight contracts foundation;
- Stage 5.4B controlled AI integration runtime validation foundation;
- Stage 5.4C controlled AI integration boundary composition foundation;
- Stage 5.4D controlled AI integration dry-run execution foundation;
- deterministic, fail-closed validation for Prompt Context Boundary, AI
  Provider Boundary, and AI Quality Boundary references;
- rejection of raw prompts, chat messages, user system prompts, provider
  payloads, model-call payloads, provider execution, streaming, env/API-key
  fields, API routes, Simulator runtime, Decision Engine runtime, and UI
  runtime fields.

Stage 5.4 does not connect OpenAI SDK, real provider SDKs, API keys,
environment variables, fetch/network calls, model execution, provider
execution, streaming, API routes, UI, Simulator runtime, Decision Engine
runtime, Prompt Context runtime calls, AI Provider runtime calls, database,
Supabase, auth, persistence, subscriptions, dashboard, or product behavior.

Stage 5.4 closure does not approve production model execution or user-facing AI
runtime.

## Product Quality Hardening State

Product Quality Hardening #1-#5 is complete for the public simulator surface.
The first public deterministic Decision Engine backend runtime switch is
accepted. Automated Product Quality Hardening gates are implemented.

Completed:

- Public Simulator Failure & Input Boundary Hardening;
- API Response Contract Hardening;
- API Abuse Boundary Hardening;
- Public Simulator Mock Truth Boundary;
- Manual QA Matrix Verification, 12/12 PASS.

Automated gates:

- `npm run quality:public-simulator`, 56/56 PASS;
- verifies the public `/api/simulate` API contract, status codes, response
  schema, `contractVersion`, `mockOnly=true`, `safeRender=true`,
  `apiReady=true`, deterministic engine preview response envelope, controlled
  error states, rate-limit failure metadata, no `buildMockSimulation` route
  call, and no provider/env/model-call leakage;
- verifies bounded edge-status acceptance: `REFUSED`, `CANNOT_RECOMMEND`, and
  `CLARIFICATION_REQUIRED` fail-close with `data:null`, `error.code`, preserved
  `mockOnly=true`, `safeRender=true`, `apiReady=true`, and no simulation,
  scenario, or recommendation artifacts;
- verifies the route-level `SIMULATION_FAILED` fallback with a source-level
  guard for missing pipeline response;
- verifies the public `HomeSimulator` UI boundary preserves API-contract usage,
  no local fallback after API failure, successful response rendering, controlled
  error rendering, and the mock-only / Real AI deferred truth boundary;
- `npm run quality:public-home`, 68/68 PASS;
- verifies Home + Public Simulator mobile/tablet responsive guardrails, public
  DOM presence, accessibility invariants, performance / UX safety, no Real AI,
  provider, or env leakage, no local fallback builder, and the single
  `/api/simulate` request path.
- `npm run quality:decision-context-builder`, 12/12 PASS;
- `npm run quality:simulation-pipeline-runner`, 13/13 PASS;
- `npm run quality:simulation-response-public-adapter`, 13/13 PASS;
- `npm run quality:deterministic-runtime-observability`, 23/23 PASS;
- `npm run quality:deterministic-runtime-security-boundary`, 34/34 PASS;
- `npm run quality:deterministic-runtime-contract-regression`, 25/25 PASS;
- `npm run quality:public-home-simulator-api-integration`, 57/57 PASS;
- `npm run quality:public-site-trust-readiness`, 85/85 PASS.
- `npm run quality:rendered-public-surface-regression`, 97/97 PASS.

The public simulator now uses the deterministic Decision Engine preview in the
backend while keeping the existing mock-compatible public contract. It
explicitly presents preview/demo state, keeps `contractVersion:
"simulate-api-v1-mock"`, keeps `mockOnly=true`, `safeRender=true`, and
`apiReady=true`, exposes controlled error states, avoids local fallback
simulation after API failure, applies client/API input boundaries, has a
lightweight in-memory abuse boundary, and is protected by automated Public
Simulator, Public Home, Builder, Runner, Adapter, and deterministic runtime
observability quality gates. The bounded public deterministic runtime
edge-status hardening subblock is closed. The bounded deterministic runtime
observability / rollback semantics subblock is also closed: the internal
runtime marker is `deterministic-engine-preview`, runtime outcomes separate
success/refused/clarification/cannot_recommend/simulation_failed states, the
route validates the public envelope before responding, and rollback fallback
returns safe `SIMULATION_FAILED` with `data:null`.

The bounded deterministic runtime security boundary / abuse protection subblock
is closed. `/api/simulate` now validates payload shape before the deterministic
runner, allows only public `input` and `lang` fields, rejects malformed JSON
shapes, unexpected field types, unsupported `lang`, unknown top-level fields,
prototype-like/provider-like fields, oversized bodies, and oversized inputs
fail-closed while preserving the public envelope and avoiding internal leakage.

The bounded deterministic runtime contract regression / public envelope
stability subblock is closed. The public `/api/simulate` envelope is now covered
by a dedicated end-to-end gate for successful deterministic responses,
`REFUSED`, `CLARIFICATION_REQUIRED`, `CANNOT_RECOMMEND`, `invalid_payload`, and
source-level `SIMULATION_FAILED` guards. The gate verifies exact public
top-level/meta/data/error shape, `contractVersion`, `mockOnly=true`,
`safeRender=true`, `apiReady=true`, `data:null` fail-close behavior, and no
internal/debug/provider leakage.

The bounded HomeSimulator -> `/api/simulate` integration stability subblock is
closed. The public Home simulator now has dedicated regression coverage for
successful deterministic envelopes and fail-close `data:null` envelopes
(`REFUSED`, `CLARIFICATION_REQUIRED`, `CANNOT_RECOMMEND`, and
`invalid_payload`), source-level guards that render artifacts only after a
validated `completed` response, controlled error UI for failed envelopes, no
local substitute simulation, no dependency on internal/debug/provider metadata,
and preserved Decision Simulation Engine positioning.

The bounded Public Site Trust / Readiness Copy Audit subblock is closed. Public
Home, HomeSimulator, auth pages, dashboard placeholder copy, privacy, security,
profile/memory placeholders, provisional privacy policy, provisional terms,
CTA, footer, and navigation copy now have dedicated regression coverage for
prepared/demo/local/mock/deterministic status, no premature account,
persistence, billing, subscription, permanent memory, legal-grade, paid-plan,
closed-beta, public-launch, high-stakes advice, guarantee, AI chat, or answer
engine promises, and preserved Decision Simulation Engine positioning.

The bounded Rendered Public Surface Regression subblock is closed. The actual
public surface was checked across representative desktop, tablet, and mobile
viewports for Home, Hero, HomeSimulator, CTA, login, register, forgot password,
privacy, terms, and dashboard protected redirects/placeholders. One real
mobile render issue was found and fixed: the HomeSimulator textarea placeholder
could clip vertically on mobile because the voice control reserved bottom
space. The dedicated gate verifies rendered public route HTML, protected
dashboard redirect safety, responsive guardrails, dashboard placeholder source
readiness, and the approved `/api/simulate` public contract flags.

Product Quality Hardening #1-#5, the internal deterministic runtime bridge, and
the public backend switch, including edge-status hardening and observability /
rollback semantics, security boundary / abuse protection, and contract
regression / public envelope stability plus HomeSimulator API integration
stability plus Public Site Trust / Readiness Copy Audit, did not add Real AI runtime
integration, provider execution, SDK/env/API keys, fetch/model calls, auth
changes, billing changes, persistence changes, subscription changes, analytics,
telemetry logging systems, new heavy dependencies, Home visual concept changes,
UI behavior changes, or production AI behavior. The public switch, edge-status
hardening, observability / rollback semantics, security boundary / abuse
protection, and contract regression /
public envelope stability plus HomeSimulator API integration stability, Public
Site Trust / Readiness Copy Audit, Rendered Public Surface Regression, and the
Stage 10 Closure Aggregate Gate / Documentation Lock complete Stage 10 Product
Quality Hardening. They did not open a new Stage.

Repository Structure Normalization is complete. Stage 11 - Legal & Trust Layer
has completed the Legal & Trust Foundation Inventory and Stage 11.2 Legal
Surface Scope & Ownership Lock as documentation-only subblocks. Market
Readiness, Closed Beta, Public Launch, and Scale are not active yet.

Stage 10 Readiness Review result:

- closed fully: public simulator input/failure hardening, public API response
  contract, abuse boundary, mock truth boundary, manual QA matrix, deterministic
  Builder/Runner/Adapter, public deterministic runtime switch, edge-status
  acceptance, observability/rollback, security boundary, contract regression,
  HomeSimulator integration, trust/readiness copy audit, and rendered public
  surface regression;
- closed enough for transition: deterministic preview runtime as a public
  mock-compatible surface, public Home + Simulator source/runtime guardrails,
  and documentation consistency;
- closure decision: Stage 10 Product Quality Hardening is objectively closed.

## Stage 10 Closure Baseline

Closed bounded subblocks:

- Public Simulator Failure & Input Boundary Hardening;
- API Response Contract Hardening;
- API Abuse Boundary Hardening;
- Public Simulator Mock Truth Boundary;
- Manual QA Matrix Verification, 12/12 PASS;
- Public Simulator Quality Gate;
- Public Home Quality Gate;
- DecisionContext Builder;
- Simulation Pipeline Runner;
- SimulationResponse Public Adapter;
- Deterministic Runtime Switch;
- Edge-status Acceptance;
- Runtime Observability / Rollback;
- Runtime Security Boundary;
- Runtime Contract Regression;
- HomeSimulator -> `/api/simulate` Integration;
- Public Site Trust / Readiness Copy Audit;
- Rendered Public Surface Regression;
- Stage 10 Closure Aggregate Gate / Documentation Lock.

Stage 10 baseline quality gates:

- `npm run quality:public-simulator`, 56/56 PASS;
- `npm run quality:public-home`, 68/68 PASS;
- `npm run quality:decision-context-builder`, 12/12 PASS;
- `npm run quality:simulation-pipeline-runner`, 13/13 PASS;
- `npm run quality:simulation-response-public-adapter`, 13/13 PASS;
- `npm run quality:deterministic-runtime-observability`, 23/23 PASS;
- `npm run quality:deterministic-runtime-security-boundary`, 34/34 PASS;
- `npm run quality:deterministic-runtime-contract-regression`, 25/25 PASS;
- `npm run quality:public-home-simulator-api-integration`, 57/57 PASS;
- `npm run quality:public-site-trust-readiness`, 85/85 PASS;
- `npm run quality:rendered-public-surface-regression`, 97/97 PASS.

Public contract invariants:

- `contractVersion: "simulate-api-v1-mock"`;
- `mockOnly=true`;
- `safeRender=true`;
- `apiReady=true`;
- failed/refusal/fail-close public states keep `data:null` where accepted by
  the contract;
- no internal/debug/provider metadata is exposed through the public envelope.

Runtime invariants:

- `/api/simulate` remains on deterministic-engine-preview runtime:
  Raw User Input -> DecisionContext Builder -> `runSimulationPipeline` ->
  `SimulationResponseV2Draft` -> Public Adapter -> `/api/simulate`;
- rollback-safe `SIMULATION_FAILED` fallback remains fail-closed;
- invalid payloads do not enter the runner;
- `HomeSimulator` renders only approved public-envelope data and does not build
  a local substitute simulation after API failure.

Deferred after Stage 10:

- Real AI Runtime;
- AI Provider execution;
- Prompt Context -> AI Provider real bridge;
- OpenAI/provider SDKs, env/API keys, fetch/model calls, streaming;
- production auth, persistence, billing, subscriptions;
- Legal & Trust Layer;
- Market Readiness;
- Closed Beta;
- Public Launch.

## Stage 5.3 Closure Result

Stage 5.3 is closed as AI Quality / Cost / Safety Validation Foundation Complete
at the contracts/runtime-boundary/QA level.

Closed under `lib/ai-quality`:

- AI Quality / Cost / Safety contracts foundation;
- quality criteria, score-band, cost-budget, safety-policy, evidence,
  release-gate, and fail-closed error contracts;
- contracts validation catalog covering chat, answer engine, generic assistant,
  model-call, env/API-key, and provider-payload rejection;
- AI Quality Runtime foundation;
- disabled-by-default runtime evaluation;
- fail-closed quality/cost/safety release-gate evaluation;
- structured runtime result/error contracts;
- AI Quality Boundary / Facade foundation;
- boundary-level runtime evaluation before boundary-ready result;
- boundary-level rejection of unsafe mode, provider-payload, env/API-key, and
  model-call payload fields;
- Stage 5.3 runtime QA/regression aggregation;
- exports through `lib/ai-quality/index.ts`.

Stage 5.3 does not connect OpenAI SDK, real provider SDKs, API keys,
environment variables, fetch/network calls, model execution, API routes, UI,
Simulator runtime, Decision Engine runtime, Prompt Context runtime, AI Provider
runtime, database, Supabase, auth, persistence, subscriptions, dashboard, or
product behavior.

## Stage 5.2 Closure Result

Stage 5.2 remains closed as Prompt / Context Layer Foundation Complete at the
contracts/runtime-boundary/QA level.

Closed under `lib/prompt-context`:

- provider-agnostic Prompt Context input, output, policy, evidence,
  risk-boundary, and error contracts;
- fail-closed input and output validation;
- disabled-by-default contract, runtime, and boundary behavior;
- rejection of raw chat messages, user-supplied system prompts, provider/model
  fields, env names, API keys, client runtime fields, direct answer mode, and
  generic assistant behavior;
- Prompt Context Runtime foundation;
- structured Decision Simulation context construction;
- runtime validation before and after context creation;
- Controlled Prompt Context Boundary / Facade foundation;
- boundary-level runtime build before boundary-ready result;
- structured controlled result/error contracts;
- Stage 5.2 runtime QA/regression aggregation;
- exports through `lib/prompt-context/index.ts`.

## Stage 5.1 Closure Result

Stage 5.1 remains closed as AI Provider Abstraction / Real AI Integration
Foundation Complete at the foundation/runtime-boundary/QA level.

Closed under `lib/ai-provider`:

- provider-agnostic AI Provider Adapter contracts;
- AI Provider request, response, capability, and error models;
- fail-closed contract validation;
- disabled-by-default adapter behavior;
- Runtime Selection / Preflight foundation;
- provider availability and capability preflight;
- fail-closed provider resolution;
- safe missing, disabled, unavailable, and unsupported provider errors;
- Controlled Adapter Boundary / Facade foundation;
- boundary rejection of raw prompts, secrets, API keys, env names, and client
  runtime fields;
- structured controlled result/error contracts;
- Stage 5.1 runtime QA/regression aggregation;
- exports through `lib/ai-provider/index.ts`.

## Stage 4.4 Closure Result

Stage 4.4 remains closed as Subscription Runtime Foundation Complete /
Production Billing Deferred.

Closed at foundation/runtime-boundary level:

- subscription tier contracts for Free, Premium, and Professional;
- entitlement meaning and owner boundary;
- owner-scoped entitlement snapshot persistence foundation;
- server-only entitlement read/write provider contracts;
- server-only entitlement enforcement contracts;
- unified server-only subscription runtime facade;
- fail-closed entitlement and capability resolution;
- disabled-by-default rollback-safe behavior;
- Decision Simulation Engine-safe capability limits;
- rejection of client-supplied tier, owner, capability, customer, and billing fields;
- deterministic validation catalogs.

Production billing is deferred because:

- billing provider is not approved;
- Stripe is not approved;
- pricing, legal, and tax scope are not approved;
- checkout, webhooks, and customer portal are not ready.

## Current Runtime Boundaries

Allowed at current closure:

- foundation-only evaluation;
- owner-scoped planning contracts;
- subscription scope reasoning;
- entitlement persistence foundation;
- entitlement enforcement foundation;
- subscription runtime integration foundation;
- AI Provider adapter contracts foundation;
- AI Provider runtime selection/preflight foundation;
- AI Provider controlled boundary/facade foundation;
- Prompt Context contracts foundation;
- Prompt Context runtime foundation;
- Prompt Context controlled boundary/facade foundation;
- Prompt Context runtime QA/regression aggregation;
- AI Quality / Cost / Safety contracts foundation;
- AI Quality / Cost / Safety runtime foundation;
- AI Quality / Cost / Safety boundary/facade foundation;
- AI Quality / Cost / Safety runtime QA/regression aggregation;
- Controlled AI Integration preflight contracts foundation;
- Controlled AI Integration runtime validation foundation;
- Controlled AI Integration boundary composition foundation;
- Controlled AI Integration dry-run execution foundation;
- public simulator failure/input boundary hardening;
- `/api/simulate` response contract hardening;
- lightweight public simulator abuse boundary hardening;
- public simulator mock/preview truth boundary;
- public simulator manual QA matrix verification, 12/12 PASS;
- public simulator automated regression gate, `npm run quality:public-simulator`,
  56/56 PASS;
- bounded public deterministic runtime edge-status hardening for `REFUSED`,
  `CANNOT_RECOMMEND`, `CLARIFICATION_REQUIRED`, and route-level
  `SIMULATION_FAILED` fallback;
- public Home + Simulator quality gate, `npm run quality:public-home`,
  68/68 PASS;
- deterministic DecisionContext Builder quality gate,
  `npm run quality:decision-context-builder`, 12/12 PASS;
- internal Simulation Pipeline Runner quality gate,
  `npm run quality:simulation-pipeline-runner`, 13/13 PASS;
- SimulationResponse Public Adapter quality gate,
  `npm run quality:simulation-response-public-adapter`, 13/13 PASS;
- deterministic runtime observability / rollback semantics quality gate,
  `npm run quality:deterministic-runtime-observability`, 23/23 PASS;
- deterministic runtime security boundary / abuse protection quality gate,
  `npm run quality:deterministic-runtime-security-boundary`, 34/34 PASS;
- deterministic runtime contract regression / public envelope stability quality
  gate, `npm run quality:deterministic-runtime-contract-regression`, 25/25 PASS;
- HomeSimulator -> `/api/simulate` integration stability quality gate,
  `npm run quality:public-home-simulator-api-integration`, 57/57 PASS;
- public site trust/readiness copy audit quality gate,
  `npm run quality:public-site-trust-readiness`, 85/85 PASS;
- public `/api/simulate` deterministic Decision Engine preview switch through
  Builder -> `runSimulationPipeline` -> `SimulationResponseV2Draft` -> Public
  Adapter while preserving the `simulate-api-v1-mock` envelope;
- canonical owner model based on `levio_principals.principal_id`;
- fail-closed behavior;
- deterministic validation functions;
- no Real AI, provider, auth, billing, persistence, subscription, or UI
  behavior change.

Not allowed or not present:

- public User Data Controls API;
- Export UI;
- Deletion UI;
- dashboard data-control workflows;
- real export package generation;
- storage/download links;
- deletion writes;
- hard delete;
- account deletion orchestration;
- production Supabase read provider for User Data Controls;
- OpenAI SDK;
- real AI provider SDK;
- environment variable reads for AI;
- API keys for AI;
- model calls;
- provider execution;
- streaming;
- AI API routes;
- AI UI;
- Simulator integration with Prompt Context, AI Provider, or AI Quality;
- Simulator integration with Controlled AI Integration;
- Decision Engine integration with Prompt Context, AI Provider, or AI Quality;
- Decision Engine integration with Controlled AI Integration;
- Prompt Context runtime calls from AI Quality;
- AI Provider runtime calls from Prompt Context, AI Quality, or Controlled AI
  Integration;
- Billing;
- production Subscription Runtime product integration;
- Stripe integration;
- checkout/customer portal;
- subscription API routes;
- billing UI.

## Ownership Model

The canonical owner anchor is `levio_principals.principal_id`.

Supabase `auth.users.id` remains a provider reference and must not become the
product owner ID.

Client-supplied owner fields are never authorization proof.

Stage 4.3 protects decision simulation artifacts:

- saved simulations;
- simulation drafts;
- simulation history entries;
- owner metadata needed to control those artifacts.

Stage 4.4 subscription scope does not change the product object. Entitlements
control access to decision simulation capabilities; they do not create AI chat
history or generic assistant behavior.

Stage 5.1 AI Provider scope does not change the product object. AI Provider
foundation controls internal candidate-material infrastructure only; it does not
create assistant memory, chat history, direct answers, or generic prompt logs.

Stage 5.2 Prompt Context scope does not change the product object. Prompt
Context foundation prepares internal structured Decision Simulation context only;
it does not create chat prompts, answer-mode output, assistant memory, or user
prompt history.

Stage 5.3 AI Quality scope does not change the product object. AI Quality
foundation validates internal structured quality/cost/safety evidence only; it
does not call providers, execute models, generate answers, or present UI.

Stage 5.4 Controlled AI Integration scope does not change the product object.
Controlled AI Integration composes internal foundation boundaries for preflight
and dry-run evidence only; it does not execute providers, execute models,
generate answers, present UI, or connect product runtime.

## Production Readiness

Stage 5.4 is not production-ready real AI.

Real AI work remains blocked until a separately approved future stage defines
provider integration, SDK/env/key handling, Prompt Context to AI Provider
connection, post-provider Decision Engine validation, production
safety/cost/quality enforcement, observability, and rollback.

Stage 4.4 is not production-ready billing.

Billing/product work remains blocked until a separately approved future stage
defines provider integration, pricing/legal/tax scope, entitlement sync,
webhooks, UI/API, QA, and rollback rehearsal.

## Next Roadmap Step

The current roadmap position is Stage 11.9 - Legal Review Packet & Drafting
Handoff Complete. The next implementation subblock is Stage 11.10 Production
Legal Blockers Closure Gate.

The next step is not a new Product Quality Hardening subblock. The immutable
Decision Simulation Engine architecture remains mandatory, and the next step
must not create AI Chat, Answer Engine, Generic Assistant, direct AI-to-user
behavior, model calls, provider execution, API keys/env/SDKs, AI provider API
routes, UI AI runtime, auth, persistence, billing, subscriptions, analytics,
tracking, logging, consent UI, cookie banner, AI disclosure UI, disclaimer UI,
trust UI, trust page copy, legal-document text, regulatory claims, compliance
claims, Stage 12, or a new public contract without a separate approved step. It
must not open Market Readiness, Closed Beta, Public Launch, or Scale.
