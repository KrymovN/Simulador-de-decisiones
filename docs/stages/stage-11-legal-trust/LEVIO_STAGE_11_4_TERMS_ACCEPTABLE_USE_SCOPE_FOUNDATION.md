# Levio Stage 11.4 - Terms & Acceptable Use Scope Foundation

Date: 1 July 2026, Europe/Madrid.

Status: Complete as documentation-only architecture foundation.

This document defines the architectural boundaries for Terms of Service and
Acceptable Use for Levio.es. It does not write, draft, approve, or imply Terms
of Service, Acceptable Use Policy, legal clauses, user notices, modal copy, page
copy, or legal prose. It does not change runtime, UI, API, simulator, Decision
Engine, AI integration, auth, database, subscriptions, billing, analytics, or
product behavior.

## Scope Boundary

Stage 11.4 covers:

- product zones that must be covered by Terms of Service;
- product zones that must be covered by Acceptable Use;
- user actions classified as allowed, restricted, prohibited, deferred, or
  future-only;
- Decision Simulation Engine use limitations;
- AI Provider restrictions;
- account restrictions;
- subscription and billing restrictions;
- Local Storage, user data, and saved simulation restrictions;
- future roadmap-stage boundaries;
- required references from Terms to Privacy, Cookies, AI Transparency, Billing,
  Data Processing, User Data Controls, and Trust surfaces;
- boundary between product rules, legal rules, and technical enforcement;
- rules required before production launch;
- rules deferred or future-only.

Stage 11.4 does not:

- create Terms of Service;
- create Acceptable Use Policy;
- create legal language;
- create user-facing notices;
- create modal or page text;
- approve production accounts, billing, persistence, Real AI, analytics, or
  Market Readiness;
- implement enforcement beyond existing approved runtime behavior.

## Source-of-Truth Inputs

Stage 11.4 depends on:

- Stage 11.2 Legal Surface Scope & Ownership Lock;
- Stage 11.3 Privacy & Data Processing Scope Foundation;
- Stage 10 Product Quality Hardening closure baseline;
- Stage 5.4 AI Integration Foundation Complete / Real AI Runtime Deferred;
- Stage 4.3 User Data Controls foundation;
- Stage 4.4 Subscription Runtime Foundation Complete / Production Billing
  Deferred;
- current public product baseline for `/api/simulate`, local demo simulation
  history, provisional legal routes, auth placeholders, dashboard placeholders,
  and deferred production account/billing/AI behavior.

No public page, provisional copy, generated draft, placeholder route, or
implementation assumption may supersede this scope foundation.

## Terms Coverage Zones

Terms of Service must eventually cover the following zones.

### Zone 1 - Public Website and Informational Surfaces

Coverage purpose: define access and use boundaries for public Levio pages,
navigation, provisional legal pages, trust/readiness surfaces, and contact or
support surfaces when approved.

Current status: active public surface; legal content not approved.

Required before production launch: mandatory.

Dependencies: Terms Surface, Legal Identity & Contact Surface, User Trust
Surface, Regulatory Readiness Surface.

Out of scope for Stage 11.4: writing public terms copy or contact text.

### Zone 2 - Public Decision Simulator

Coverage purpose: define permitted use of the deterministic public simulator
and its limitations as a Decision Simulation Engine.

Current status: active deterministic preview using the approved public
`simulate-api-v1-mock` envelope.

Required before production launch: mandatory.

Dependencies: Decision Simulation Limitations Surface, AI Transparency Surface,
Privacy/Data Processing Surface, User Trust Surface.

Out of scope for Stage 11.4: changing simulator behavior, response content,
route shape, or UI copy.

### Zone 3 - Public `/api/simulate` Contract

Coverage purpose: define service-access expectations for the public simulation
API path, including abuse, automation, payload, and availability boundaries.

Current status: active public endpoint with existing validation and in-memory
abuse boundary.

Required before production launch: mandatory.

Dependencies: Product behavior baseline, Data Processing Surface, User Trust
Surface, Regulatory Readiness Surface.

Out of scope for Stage 11.4: changing API contract, rate limits, status codes,
payload shape, or enforcement logic.

### Zone 4 - Local Storage and Local Saved Simulations

Coverage purpose: define user-facing responsibility boundaries for local demo
simulation history and browser-owned storage.

Current status: active local-only demo continuity.

Required before production launch: mandatory if local history remains present.

Dependencies: Privacy/Data Processing Surface, Cookie & Local Storage Surface,
Consent Surface if storage scope expands, User Data Controls Surface if local
data is imported or synced later.

Out of scope for Stage 11.4: changing Local Storage keys, adding consent UI, or
syncing local data to accounts.

### Zone 5 - Auth, Account, and Dashboard Surfaces

Coverage purpose: define account relationship boundaries, registration/login
conditions, account responsibility, credential handling expectations, dashboard
scope, and account-state limitations.

Current status: foundation/placeholders; production account readiness remains
deferred.

Required before production auth: mandatory.

Dependencies: Auth & Account Legal Surface, Privacy/Data Processing Surface,
User Data Controls Surface, User Trust Surface.

Out of scope for Stage 11.4: enabling auth, changing session logic, creating
account acceptance UI, or writing account terms.

### Zone 6 - User Data Controls and Saved Account Data

Coverage purpose: define boundaries for future saved simulations, export,
deletion, retention, account data controls, and owner-scoped access.

Current status: foundation-only; production UI/API exposure deferred.

Required before production account data: mandatory.

Dependencies: User Data Controls Surface, Privacy/Data Processing Surface,
Consent Surface, Auth & Account Legal Surface.

Out of scope for Stage 11.4: creating export/deletion flows, database writes,
or saved-account simulation behavior.

### Zone 7 - AI Provider and Real AI Runtime

Coverage purpose: define future service restrictions around AI Provider
candidate material, provider execution, non-chat positioning, and no direct
AI-to-user answers.

Current status: Real AI runtime deferred; no provider calls.

Required before Real AI public use: mandatory.

Dependencies: AI Transparency Surface, Decision Simulation Limitations Surface,
Privacy/Data Processing Surface, Regulatory Readiness Surface.

Out of scope for Stage 11.4: enabling model calls, provider SDKs, env/API keys,
AI provider API routes, prompt runtime calls, streaming, or UI AI runtime.

### Zone 8 - Subscriptions, Billing, and Entitlements

Coverage purpose: define future paid-plan terms boundaries, entitlement use,
commercial restrictions, refunds/tax/invoice dependencies, billing provider
dependencies, and paid access limitations.

Current status: subscription foundation-only; production billing deferred.

Required before paid plans or billing: mandatory.

Dependencies: Subscription & Billing Legal Surface, Privacy/Data Processing
Surface, Legal Identity & Contact Surface, Production Legal Blockers Surface.

Out of scope for Stage 11.4: approving Stripe or any provider, checkout,
pricing, payment UI, subscription UI, webhooks, customer portal, invoices, or
billing API.

### Zone 9 - Support, Contact, Trust, and Official Notices

Coverage purpose: define future contact, support, complaint, notice-routing,
security-trust, and product-readiness responsibility boundaries.

Current status: trust/readiness surfaces exist as copy/readiness baseline;
official legal identity/contact is not approved.

Required before production launch: mandatory.

Dependencies: Legal Identity & Contact Surface, User Trust Surface, Regulatory
Readiness Surface.

Out of scope for Stage 11.4: writing official support/contact language or
creating new routes.

## Acceptable Use Coverage Zones

Acceptable Use must eventually cover the following zones.

### AUP Zone 1 - Public Simulator Input

Coverage purpose: classify what users may and may not submit into the public
simulator.

Required before production launch: mandatory.

Related data categories: Public Decision Input, Browser Speech Recognition
Transcript after submission.

Technical enforcement status: current runtime validates payload shape and size,
but does not replace future legal Acceptable Use scope.

### AUP Zone 2 - Simulation Output Use

Coverage purpose: classify permissible reliance, redistribution, automation,
and downstream use of deterministic simulation outputs.

Required before production launch: mandatory.

Related data categories: Simulation Output Artifacts, Public API Metadata.

Technical enforcement status: current product returns deterministic preview
outputs only; downstream user behavior is not technically enforced.

### AUP Zone 3 - Abuse, Security, and Availability

Coverage purpose: classify abusive traffic, automated scraping, bypass attempts,
payload manipulation, endpoint stress, vulnerability misuse, and service
interference.

Required before production launch: mandatory.

Related data categories: Abuse Boundary / Rate-Limit Source Data, Operational
Logs and Error Evidence.

Technical enforcement status: current API has bounded validation and in-memory
rate limiting; future production terms must not imply broader enforcement than
implemented.

### AUP Zone 4 - Account and Identity Misuse

Coverage purpose: classify credential misuse, account sharing, impersonation,
unauthorized access, account ownership disputes, and misuse of future account
data controls.

Required before production auth: mandatory.

Related data categories: Auth Email and Login Intent, Auth Session and
Principal Data, Persistence Owner / Principal Mapping Data.

Technical enforcement status: production auth enforcement remains deferred.

### AUP Zone 5 - Local Storage and Saved Simulations

Coverage purpose: classify user responsibility boundaries for local browser
data, local saved simulations, future account-saved simulations, and import/sync
behavior if later approved.

Required before production launch if local history remains present: mandatory.

Related data categories: Local Simulation History, Simulation Output Artifacts.

Technical enforcement status: local deletion/removal is browser/local-product
behavior only; account sync is not approved.

### AUP Zone 6 - AI Provider Misuse

Coverage purpose: classify future misuse of AI-backed candidate material,
prompt injection attempts, attempts to extract provider/system details, unsafe
high-stakes use, and attempts to force AI Chat / Answer Engine behavior.

Required before Real AI public use: mandatory.

Related data categories: AI Provider Payload and Candidate Material, Memory /
Preference / Strategic Context Data if later approved.

Technical enforcement status: not active because AI Provider runtime is
prohibited in the current state.

### AUP Zone 7 - Billing and Subscription Misuse

Coverage purpose: classify future paid-plan misuse, entitlement bypass,
payment abuse, refund abuse, chargeback handling boundaries, and subscription
account misuse.

Required before paid plans: mandatory.

Related data categories: Subscription and Billing Data, entitlement records.

Technical enforcement status: not active because billing provider, checkout,
webhooks, paid plans, and customer portal are not approved.

## User Action Classification

### Allowed Actions

Allowed in the current product state:

- browse public Levio informational surfaces;
- use the public deterministic simulator within current input and rate
  boundaries;
- submit a decision scenario for deterministic preview processing;
- use browser voice input only as a user-initiated convenience where supported;
- view deterministic simulation output returned by the current public contract;
- keep local demo simulation history in the same browser when the product
  offers that local behavior;
- clear or remove local demo simulation history where the product exposes that
  local control;
- access login, registration, recovery, and dashboard placeholder surfaces only
  within their current prepared/foundation limits.

Allowed later only after separate approval:

- create and use production accounts;
- persist simulations to an account;
- use export/deletion/data-control workflows;
- use paid plans or subscription entitlements;
- use Real AI-backed candidate material;
- use analytics-dependent personalization or memory features.

### Restricted Actions

Restricted actions require product, legal, or technical boundaries before they
can be treated as approved:

- using the simulator for sensitive or high-stakes decision contexts;
- relying on simulation output as final professional, legal, medical, financial,
  employment, credit, safety, or emergency advice;
- submitting personal or third-party sensitive information into public decision
  input;
- submitting browser speech transcripts that contain sensitive information;
- automating repeated public API usage beyond existing public boundaries;
- reproducing or redistributing simulation output in contexts that imply Levio
  endorsement or guaranteed correctness;
- importing local simulation history into an account;
- associating local simulation history with a verified identity;
- using account placeholders as if production account services are active;
- using subscription or entitlement concepts as if paid plans are active;
- using any future AI Provider output as a direct answer, chat response, or
  autonomous decision.

Restricted means the action requires explicit future scope, acceptance,
disclosure, review, enforcement, or product behavior before production reliance.

### Prohibited Actions

Prohibited for current and future acceptable-use scope:

- attempting to turn Levio into AI Chat, Answer Engine, Generic AI Assistant, or
  direct AI-to-user answer product;
- using the product to generate, request, or rely on emergency, medical, legal,
  financial, employment, credit, housing, insurance, safety-critical, or other
  high-stakes determinations as final decisions;
- submitting unlawful, harmful, exploitative, abusive, or malicious content;
- submitting content that violates third-party rights or confidentiality
  obligations;
- attempting to bypass input validation, rate limiting, auth boundaries,
  entitlement boundaries, owner boundaries, or future consent gates;
- attempting to access another user's account, data, saved simulations,
  exports, deletion records, consent records, billing data, or session data;
- attempting to extract secrets, API keys, env values, provider configuration,
  system prompts, internal debug metadata, source maps, or private operational
  evidence;
- sending provider-shaped, prototype-like, injection, exploit, or malformed
  payloads to public endpoints;
- scraping, stress testing, denial-of-service behavior, vulnerability probing,
  or automated usage outside approved boundaries;
- using local storage, mock session data, or client state to claim production
  identity, entitlement, consent, ownership, or access rights;
- transferring Public Decision Input, Simulation Output Artifacts, local
  history, account data, billing data, consent records, or AI provider payloads
  to unapproved external services through Levio-controlled workflows;
- reverse engineering or misrepresenting deterministic preview outputs as Real
  AI provider execution in the current product state.

## Decision Simulation Engine Restrictions

Terms/AUP scope must preserve these Decision Simulation Engine boundaries:

- Levio provides decision simulation, not final decision ownership.
- The simulator may present scenarios, signals, reasoning stages, and
  recommendations only within the approved product model.
- Deterministic preview output must not be positioned as legal-grade,
  professional-grade, guaranteed, or final advice.
- User input remains the user's responsibility to frame and validate.
- Simulation output must not create a professional relationship, legal review,
  advisory relationship, employment screening decision, credit decision, medical
  recommendation, or emergency instruction.
- Decision Simulation Engine restrictions apply to public simulator output,
  saved simulations, future account history, future AI-backed candidate
  material, and future subscription tiers.

Engineering boundary: current runtime may validate payload shape and fail-close
states, but it does not enforce every downstream use restriction. Future Terms
must not imply technical enforcement where none exists.

## AI Provider Restrictions

Terms/AUP scope must preserve these AI Provider boundaries:

- AI Provider runtime is not active in the current product.
- No provider execution, SDK, API key, env handling, fetch/model call,
  streaming, provider route, or UI AI runtime is approved by Stage 11.4.
- Future AI Provider output, if approved, may only provide controlled candidate
  material inside the Decision Simulation Engine flow.
- Future AI Provider output must not become direct AI Chat, Answer Engine,
  Generic AI Assistant, autonomous decision maker, or direct user-facing answer
  owner.
- Any future AI Provider processing that includes personal data requires
  Privacy/Data Processing, AI Transparency, Decision Simulation Limitations,
  User Trust, and Regulatory Readiness references.

Engineering boundary: current technical enforcement is prohibition by absence of
runtime integration. Future technical enforcement must be defined in a separate
approved implementation stage.

## Account Restrictions

Terms/AUP scope must preserve these account boundaries:

- Production accounts are not approved by Stage 11.4.
- Login/register/recovery/dashboard surfaces remain foundation/prepared surfaces
  unless production auth is separately approved.
- Local Storage mock session data must not create production identity,
  ownership, entitlement, consent, or account access.
- Future account terms must cover account eligibility, account responsibility,
  credential responsibility, account access boundaries, owner-scoped saved data,
  account closure, data controls, and misuse.
- Future account legal scope must reference Privacy/Data Processing, User Data
  Controls, Consent where applicable, and User Trust surfaces.

Engineering boundary: account legal rules do not enable auth runtime, database
writes, account acceptance flows, or dashboard behavior.

## Subscription and Billing Restrictions

Terms/AUP scope must preserve these billing boundaries:

- Paid plans are not approved by Stage 11.4.
- Billing provider, Stripe, pricing, tax, checkout, webhooks, customer portal,
  invoices, subscription UI, subscription API, and entitlement sync remain
  deferred.
- Future paid terms must cover commercial eligibility, plan limits, entitlement
  boundaries, payment provider role, renewal/cancellation/refund/tax
  dependencies, failed payments, customer portal boundaries, and plan misuse.
- Subscription entitlements must restrict access to Decision Simulation Engine
  capabilities only; they must not create AI Chat, Answer Engine, or direct
  AI-to-user behavior.
- Billing data must not influence Decision Engine semantics or AI Provider
  payloads.

Engineering boundary: billing legal rules do not approve provider integration,
checkout, webhooks, entitlement runtime exposure, or paid-plan UI.

## Local Storage, User Data, and Saved Simulation Restrictions

Terms/AUP scope must preserve these local/user-data boundaries:

- Local simulation history remains browser-local demo continuity unless a future
  import/sync flow is separately approved.
- Local history must not be treated as production account history.
- Local history must not authorize account access, identity, consent, export,
  deletion, billing, or subscription entitlement.
- Future saved simulations must distinguish local browser storage from
  owner-scoped account persistence.
- Future account-saved simulations must reference Privacy/Data Processing, User
  Data Controls, Consent where applicable, AI Transparency where applicable, and
  Decision Simulation Limitations.
- User data controls must not be promised beyond the approved foundation until
  production flows are separately approved.

Engineering boundary: legal restrictions do not add storage migration,
server-side persistence, account sync, export/deletion APIs, or retention jobs.

## Future Roadmap Stage Restrictions

Terms/AUP scope must mark these as future-only or deferred:

- Market Readiness;
- Closed Beta;
- Public Launch;
- Scale;
- production auth;
- production persistence;
- production User Data Controls;
- production billing and paid plans;
- Real AI provider execution;
- external analytics and marketing tooling;
- consent UI and consent record production flows;
- production logging/monitoring providers;
- official legal identity/contact/public support workflows;
- legal-review-approved public Terms text.

No Stage 11.4 rule may be interpreted as opening any future roadmap stage.

## Required Cross-Surface References

Future Terms requirements must reference:

- Privacy Surface for user-facing personal-data disclosure;
- Data Processing Surface for internal data category, purpose, retention,
  processor, and transfer boundaries;
- Cookie & Local Storage Surface for browser storage, cookies, non-essential
  storage, analytics, and marketing tracking;
- Consent Surface when optional, consent-gated, analytics, marketing, or
  personalization processing is used;
- AI Transparency Surface for deterministic preview, Real AI deferral, provider
  execution status, and future AI processing;
- Decision Simulation Limitations Surface for no-final-advice and high-stakes
  limitation requirements;
- Auth & Account Legal Surface before production accounts;
- User Data Controls Surface before export, deletion, retention, saved account
  data, or data-subject workflows;
- Subscription & Billing Legal Surface before paid plans or billing;
- Legal Identity & Contact Surface before production public launch;
- User Trust Surface for security, readiness, support, and product-honesty
  claims;
- Regulatory Readiness Surface and Production Legal Blockers Surface before
  Stage 12.

Terms must not absorb the responsibilities of these surfaces. References create
dependency links only; they do not duplicate ownership.

## Product Rules, Legal Rules, and Technical Enforcement

### Product Rules

Product rules define what Levio is and is not:

- Decision Simulation Engine;
- deterministic preview in the current public simulator;
- not AI Chat;
- not Answer Engine;
- not Generic AI Assistant;
- no Real AI runtime in the current state;
- no production account, billing, persistence, analytics, or launch readiness
  approval in Stage 11.4.

Source of truth: product state documents, Stage 10 baseline, Stage 5.4 deferred
AI state, and Stage 11 architecture documents.

### Legal Rules

Legal rules define user/service obligations, acceptable-use restrictions,
account relationship requirements, paid-plan requirements, limitation
requirements, dispute/notice/review dependencies, and production legal blockers.

Source of truth: Stage 11.4 for requirements architecture first, then
owner/legal-approved Terms or Acceptable Use documents only after explicit
approval.

### Technical Enforcement

Technical enforcement defines what the system actually enforces:

- payload shape and size validation;
- existing public contract fail-close behavior;
- current in-memory public API abuse boundary;
- current absence of Real AI provider runtime;
- current absence of production billing runtime;
- current absence of approved production account persistence;
- future auth, consent, billing, user-data-control, AI, analytics, or logging
  enforcement only after separate approved implementation stages.

Technical enforcement must not be claimed as broader than implementation
evidence. Legal requirements do not create runtime behavior by themselves.

## Production-Launch Mandatory Rules

Mandatory before production public launch:

- Terms Surface must have owner/legal-approved final public content.
- Acceptable Use scope must cover simulator input, simulation output use,
  abuse/security, Local Storage, account state if active, and future-product
  limitations.
- Terms must preserve Decision Simulation Engine positioning.
- Terms must not promise unavailable Real AI, production accounts, persistence,
  billing, subscriptions, analytics, permanent memory, legal-grade advice,
  closed beta, public launch, or guaranteed decisions.
- Terms must reference Privacy, Data Processing, Cookies/Consent where
  applicable, AI Transparency, Decision Simulation Limitations, User Trust, and
  Legal Identity & Contact surfaces.
- Terms must distinguish product rules, legal rules, and technical enforcement.
- Terms must define no-final-advice and no-high-stakes-reliance boundaries at
  requirements level.
- Terms must define abuse, automation, security, and endpoint-use boundaries.
- Terms must define account and saved-data boundaries before production
  accounts or account-saved simulations.
- Terms must define billing and subscription boundaries before paid plans.
- Production Legal Blockers Surface must confirm no unresolved Stage 11 blocker
  prevents Stage 12.

Mandatory before production auth:

- account relationship requirements;
- credential/account responsibility requirements;
- owner-scoped data responsibility boundaries;
- User Data Controls references;
- Privacy/Data Processing references.

Mandatory before paid plans:

- subscription and billing legal requirements;
- pricing/tax/refund/payment provider dependencies;
- entitlement boundary requirements;
- commercial owner/legal approval.

Mandatory before Real AI public use:

- AI Provider restrictions;
- AI Transparency references;
- Privacy/Data Processing references if personal data is processed;
- Decision Simulation Limitations references;
- Regulatory Readiness review.

## Deferred and Future-Only Rules

Deferred until separate approval:

- production account terms;
- production saved-simulation/account-persistence terms;
- production export/deletion/retention procedure terms;
- production billing and paid-plan terms;
- AI Provider / Real AI terms;
- analytics and marketing acceptable-use or consent-linked rules;
- official legal identity/contact and support-notice routing;
- security incident or vulnerability disclosure rules;
- closed beta rules;
- public launch terms;
- marketplace, partner, API-commercialization, or enterprise terms.

Future-only rules must not be described as active product behavior.

## Closure Decision

Stage 11.4 Terms & Acceptable Use Scope Foundation is complete when:

- Terms coverage zones are defined;
- Acceptable Use coverage zones are defined;
- allowed, restricted, and prohibited user actions are classified;
- Decision Simulation Engine restrictions are recorded;
- AI Provider restrictions are recorded;
- account restrictions are recorded;
- subscription and billing restrictions are recorded;
- Local Storage, user data, and saved simulation restrictions are recorded;
- future roadmap-stage restrictions are recorded;
- cross-surface references are defined;
- product rules, legal rules, and technical enforcement are separated;
- production-launch mandatory rules are listed;
- deferred and future-only rules are listed;
- no Terms of Service, Acceptable Use Policy, legal prose, user notices, modal
  text, or page text is written;
- no runtime, UI, API, simulator, Decision Engine, AI integration, auth,
  database, subscription, billing, analytics, or logging behavior is changed.

Completion status: accepted as documentation-only architecture foundation.

Next implementation subblock: Stage 11.5 Cookies & Consent Scope Foundation.
