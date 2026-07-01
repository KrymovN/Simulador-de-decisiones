# Levio Stage 11.5 - Cookies & Consent Scope Foundation

Date: 1 July 2026, Europe/Madrid.

Status: Complete as documentation-only architecture foundation.

This document defines the architectural boundaries for cookies, consent,
tracking, browser storage, and related consent surfaces for Levio.es. It does
not write, draft, approve, or imply Cookie Policy, Privacy Policy, consent
banner text, legal clauses, user notices, UI copy, modal copy, page copy, or
legal prose. It does not change runtime, UI, API, simulator, Decision Engine,
AI integration, auth, database, subscriptions, billing, analytics, logging, or
product behavior.

## Scope Boundary

Stage 11.5 covers:

- existing and future cookie / consent / tracking surfaces;
- mandatory, conditional, deferred, and future-only classification;
- strictly necessary classification at architecture level;
- analytics classification;
- billing/subscription classification;
- auth/session classification;
- Local Storage / saved simulations / memory classification;
- AI Provider and external service classification;
- where consent is required;
- where consent is not required at architecture level;
- where consent classification must remain blocked until production legal
  review;
- surfaces prohibited until separate legal approval;
- required links between Cookies, Privacy, Terms, Data Processing, AI
  Transparency, User Data Controls, Billing, and Trust surfaces;
- boundary between cookies, Local Storage, Runtime Memory, logs, analytics, and
  external-service processing;
- production-launch mandatory requirements;
- deferred and future-only requirements.

Stage 11.5 does not:

- create Cookie Policy;
- create Privacy Policy;
- create consent banner text;
- create legal wording;
- create user-facing notices;
- create UI copy;
- implement consent runtime;
- implement analytics;
- implement cookie banner, consent modal, preference center, or tracking;
- approve production auth, billing, Real AI, analytics, Market Readiness,
  Closed Beta, or Public Launch.

## Source-of-Truth Inputs

Stage 11.5 depends on:

- Stage 11.2 Legal Surface Scope & Ownership Lock;
- Stage 11.3 Privacy & Data Processing Scope Foundation;
- Stage 11.4 Terms & Acceptable Use Scope Foundation;
- Stage 10 Product Quality Hardening closure baseline;
- current Local Storage behavior for `levio_es_saved_simulations`;
- legacy/demo Local Storage behavior for `levio_es_mock_session`;
- conditional Supabase auth/session cookie runtime;
- Stage 4.3 User Data Controls foundation;
- Stage 4.4 Subscription Runtime Foundation Complete / Production Billing
  Deferred;
- Stage 5.4 AI Integration Foundation Complete / Real AI Runtime Deferred.

No public page, provisional legal page, placeholder copy, generated draft,
implementation assumption, analytics provider, billing provider, or AI provider
may supersede this scope foundation.

## Consent Boundary Model

Levio consent/storage surfaces belong to one of seven zones:

1. Cookies.
   Browser cookies set by first-party application code or approved third-party
   services. Current production-approved cookie surface is not expanded by
   Stage 11.5. Conditional Supabase auth cookies may exist only when auth
   runtime is explicitly configured.
2. Local Storage.
   Browser-owned persistent storage used currently for local demo simulation
   history and a legacy mock-session flag. Local Storage must not authorize
   production data access.
3. Runtime Memory.
   Request-time or browser-session data not persisted by Levio as cookies or
   Local Storage. Runtime Memory is not a cookie/consent storage surface by
   itself.
4. Logs.
   Operational evidence and future observability output. Logs are not cookies
   but can become data-processing or tracking-related surfaces if expanded.
5. Analytics.
   Product measurement, conversion tracking, marketing analytics, behavioral
   profiling, or event collection. Current status: not approved and not
   implemented.
6. External Services.
   Auth, billing, AI Provider, analytics, logging, monitoring, support, or
   other processors/subprocessors. Current approved external-service transfer
   is limited by prior Stage 11 boundaries.
7. Consent Records.
   Future records of consent choices, withdrawal, purpose state, and consent
   evidence. Foundation exists only as future User Data Controls architecture;
   production consent runtime is not implemented.

No data may move between zones unless a later approved subblock defines the
purpose, source of truth, consent or no-consent basis, notice dependency,
retention expectation, owner boundary, processor/subprocessor boundary, and
rollback behavior.

## Cookie / Consent / Tracking Surface Register

### Surface 1 - Public Request Runtime Memory

Name: Public Request Runtime Memory.

Current status: active.

Classification: mandatory, strictly necessary runtime processing.

Zone: Runtime Memory.

Appears in: public simulator browser state before submission, `/api/simulate`
request processing, deterministic pipeline request memory, public response
construction.

Consent requirement: no cookie/local-storage consent is required at architecture
level because this surface is request-time processing, not persistent browser
storage or tracking. Privacy/Data Processing review remains required for
production public use.

Must not be used for: analytics, marketing, AI Provider transfer, permanent
memory, account enrichment, billing, subscription entitlement checks, or
production logs containing raw decision input.

Required before production launch: mandatory as part of public simulator
operation, with Privacy/Data Processing and Trust references.

### Surface 2 - Public API Abuse / Rate-Limit Runtime Memory

Name: Public API Abuse / Rate-Limit Runtime Memory.

Current status: active.

Classification: mandatory for public API protection; strictly necessary
security/abuse boundary at architecture level.

Zone: Runtime Memory.

Appears in: `/api/simulate` in-memory rate-limit bucket based on request source
signals.

Consent requirement: no cookie/local-storage consent is required at
architecture level for current in-memory abuse protection. Production retention,
logging, or external security provider use requires Privacy/Data Processing and
Trust review.

Must not be used for: analytics, marketing, user profiling, account identity,
Decision Engine semantics, AI Provider prompts, billing, or consent records.

Required before production launch: mandatory if public endpoint remains open.

### Surface 3 - Local Simulation History

Name: Local Simulation History.

Current status: active local-only demo behavior.

Classification: conditional browser storage; production classification blocked
until legal review determines whether it is strictly necessary, functional, or
consent-gated.

Zone: Local Storage.

Appears in: `levio_es_saved_simulations`, HomeSimulator, SimulationsList, and
SimulationDetailClient.

Consent requirement: blocked until production legal review. Current Stage 11.5
does not decide that local saved simulations can be used without consent in
production. If retained as local functional storage, it needs Cookie & Local
Storage, Privacy/Data Processing, Terms, Decision Simulation Limitations, and
Trust review. If expanded, synced, imported, personalized, or analyzed, consent
and User Data Controls dependencies may be required.

Must not be used for: production account history, account identity, consent
records, analytics, AI Provider calls, billing, subscription entitlement,
cross-device persistence, marketing, or hidden memory.

Required before production launch: mandatory review if the local history feature
remains present.

### Surface 4 - Legacy Mock Session Local Storage

Name: Legacy Mock Session Local Storage.

Current status: active code artifact, legacy/demo only.

Classification: deferred for production; not a valid production auth or consent
surface.

Zone: Local Storage.

Appears in: `levio_es_mock_session` compatibility helper.

Consent requirement: consent does not make this a production auth mechanism.
The production requirement is to keep it out of production identity, ownership,
consent, billing, and data-control decisions, or remove/replace it under a
future approved implementation step.

Must not be used for: production auth, account ownership, consent records,
export/deletion authorization, billing, subscriptions, database access,
analytics identity, or Trust claims.

Required before production launch: mandatory blocker review if still present in
any public production surface.

### Surface 5 - Supabase Auth / Session Cookies

Name: Supabase Auth / Session Cookies.

Current status: conditional; auth runtime is configured only when approved
environment settings enable it.

Classification: conditional auth/session surface; strictly necessary only when
production auth is explicitly approved and configured.

Zone: Cookies and User Account.

Appears in: Supabase auth browser/server clients, auth callback, dashboard
guard, login/register/recovery flows when auth runtime is enabled.

Consent requirement: not a marketing/analytics consent surface. Architecture
classifies it as auth/session necessity only after production auth legal review.
Before production auth, consent status remains blocked and the surface must not
be represented as production-ready.

Must not be used for: analytics, marketing, Decision Engine content, AI Provider
payloads, billing without commercial approval, memory consent, or tracking.

Required before production auth: mandatory; deferred until auth/legal/privacy
review is complete.

### Surface 6 - Consent Preference / Consent Record Storage

Name: Consent Preference / Consent Record Storage.

Current status: future-only.

Classification: mandatory before non-essential cookies, optional storage,
analytics, marketing, personalization, or consent-gated processing.

Zone: future Consent Records, possible Cookies or Local Storage, future User
Account when authenticated.

Appears in: no approved production runtime; Stage 4.3 foundation only.

Consent requirement: this is the future mechanism for recording consent state.
It may be strictly necessary for managing consent choices once consent runtime
exists, but Stage 11.5 does not approve implementation or storage method.

Must not be used for: marketing, analytics, AI Provider prompts, Decision Engine
semantics, billing, or account profiling.

Required before production launch: mandatory if any non-essential storage,
tracking, analytics, marketing, personalization, or consent-gated processing is
enabled.

### Surface 7 - Analytics Events and Analytics Cookies

Name: Analytics Events and Analytics Cookies.

Current status: not approved, not implemented.

Classification: future-only and consent/legal-scope dependent.

Zone: Analytics, possible Cookies, possible external service.

Appears in: no approved production surface.

Consent requirement: consent required before use. Consent must be blocked until
analytics provider, purposes, event taxonomy, storage method, retention,
processor/subprocessor role, opt-out/withdrawal behavior, and Privacy/Data
Processing references are approved.

Must not be used for: current simulator, decision input analysis, simulation
output analysis, local history reuse, account profiling, marketing,
retargeting, user segmentation, AI Provider payloads, or billing decisions.

Required before production launch: optional only if analytics remains disabled;
mandatory review if analytics is enabled.

### Surface 8 - Marketing / Retargeting / Advertising Tracking

Name: Marketing / Retargeting / Advertising Tracking.

Current status: prohibited until separate legal approval.

Classification: future-only.

Zone: Analytics, Cookies, external marketing services.

Appears in: no approved production surface.

Consent requirement: consent required and blocked until separate legal approval,
provider approval, purpose approval, cookie/storage inventory, withdrawal
behavior, and Privacy/Cookies/Data Processing review exist.

Must not be used for: current product, public simulator, auth surfaces, local
history, saved simulations, AI Provider payloads, billing, or user trust claims.

Required before production launch: not required if absent; must remain blocked
unless explicitly approved.

### Surface 9 - Billing / Subscription Provider Cookies and Checkout State

Name: Billing / Subscription Provider Cookies and Checkout State.

Current status: future-only; billing provider and checkout are not approved.

Classification: conditional billing/subscription surface.

Zone: Cookies, external billing service, future User Account.

Appears in: no approved production route, checkout, portal, webhook, or billing
UI.

Consent requirement: blocked until commercial/legal/tax review. Some future
billing/session storage may be classified as transaction/session necessary, but
Stage 11.5 does not approve that classification or any provider behavior.

Must not be used for: current simulator, Decision Engine semantics, AI Provider
payloads, analytics, marketing, memory, or account profiling.

Required before paid plans: mandatory billing/legal/cookie review.

### Surface 10 - AI Provider / External AI Service State

Name: AI Provider / External AI Service State.

Current status: future-only; Real AI runtime deferred.

Classification: prohibited until separate AI/legal/data-processing approval.

Zone: AI Provider and external services.

Appears in: no approved production runtime.

Consent requirement: blocked until Real AI integration is separately approved.
If future AI Provider processing involves personal data, it must reference
Privacy/Data Processing, AI Transparency, Decision Simulation Limitations, User
Trust, Regulatory Readiness, and consent requirements where applicable.

Must not be used for: current public simulator, cookies, analytics, marketing,
logs, billing, local storage, direct AI answers, or AI Chat behavior.

Required before Real AI public use: mandatory AI/legal/data-processing review.

### Surface 11 - Operational Logs / Monitoring / Error Evidence

Name: Operational Logs / Monitoring / Error Evidence.

Current status: bounded engineering evidence only; production telemetry
provider not approved.

Classification: conditional infrastructure surface.

Zone: Logs, possible external monitoring service in the future.

Appears in: development scripts, quality gates, runtime error handling, future
observability planning.

Consent requirement: no cookie/local-storage consent is required at architecture
level for current non-tracking engineering evidence. Production logging that
contains personal data, request metadata, persistent identifiers, or external
monitoring providers requires Privacy/Data Processing and Trust review.

Must not be used for: analytics, marketing, user profiling, AI Provider
payloads, raw decision input storage, full simulation artifacts, email, access
tokens, session cookies, consent records, or billing data.

Required before production launch: mandatory logging/monitoring boundary review
if production logs retain request or personal metadata.

### Surface 12 - Browser Speech Recognition Vendor Processing

Name: Browser Speech Recognition Vendor Processing.

Current status: optional user-initiated browser capability where supported.

Classification: conditional external/browser capability surface.

Zone: Runtime Memory, external browser/vendor dependency outside Levio-controlled
server processing.

Appears in: HomeSimulator voice input path where supported by the browser.

Consent requirement: blocked for production positioning until browser/vendor
speech processing responsibilities and user initiation boundaries are reviewed.
Levio-controlled code must not treat speech transcripts as analytics, tracking,
AI Provider payloads, logs, account profile, or hidden persistence.

Must not be used for: background recording, analytics, marketing, AI Provider
payloads, account profile, logs, or hidden persistence.

Required before production launch: mandatory review if voice input remains
available or is positioned as a supported feature.

### Surface 13 - Future Memory / Personalization Storage

Name: Future Memory / Personalization Storage.

Current status: future-only.

Classification: consent-dependent optional processing.

Zone: future User Account, possible Local Storage, possible Cookies, possible
Analytics depending on future design.

Appears in: placeholder memory/profile surfaces and foundation documents only.

Consent requirement: consent or equivalent explicit legal/product approval is
required before production use. Stage 11.5 does not approve memory,
personalization, permanent profile, or analytics reuse.

Must not be used for: current simulator runtime, AI Provider payloads, account
profiling, analytics, marketing, billing, or Decision Engine context without
separate approval.

Required before production launch: not required if absent; mandatory review if
memory/personalization is opened.

## Mandatory, Conditional, Deferred, and Future-Only Status

Mandatory for current public deterministic simulator operation:

- Public Request Runtime Memory;
- Public API Abuse / Rate-Limit Runtime Memory.

Mandatory review before production launch if the surfaces remain present:

- Local Simulation History;
- Legacy Mock Session Local Storage;
- Browser Speech Recognition Vendor Processing;
- Operational Logs / Monitoring / Error Evidence if production metadata is
  retained;
- Cookie & Local Storage Surface and Consent Surface route/link/readiness
  dependencies.

Conditional before production auth:

- Supabase Auth / Session Cookies;
- account-linked consent records if optional account processing is added.

Conditional before paid plans:

- Billing / Subscription Provider Cookies and Checkout State.

Conditional before Real AI public use:

- AI Provider / External AI Service State;
- AI-related consent references if personal data, personalization, memory, or
  optional AI processing is included.

Future-only and blocked until separate approval:

- Consent Preference / Consent Record Storage;
- Analytics Events and Analytics Cookies;
- Marketing / Retargeting / Advertising Tracking;
- Future Memory / Personalization Storage;
- external monitoring providers that retain request or personal metadata;
- any third-party tracking service.

## Strictly Necessary Classification

Strictly necessary at architecture level in the current product state:

- Public Request Runtime Memory for simulator request processing;
- Public API Abuse / Rate-Limit Runtime Memory for public endpoint protection;
- Public API response metadata required for deterministic preview contract
  stability.

Potentially strictly necessary only after separate approval:

- Supabase Auth / Session Cookies for production auth/session continuity;
- Consent Preference / Consent Record Storage for consent management once
  consent runtime exists;
- Billing / Subscription Provider Cookies and Checkout State for future
  checkout or customer portal sessions;
- security/logging metadata required for production operation, if scoped and
  reviewed.

Not classified as strictly necessary by Stage 11.5:

- Local Simulation History;
- Legacy Mock Session Local Storage;
- analytics cookies or analytics events;
- marketing/retargeting/ad tracking;
- future memory/personalization storage;
- AI Provider state;
- browser speech transcripts beyond user-initiated runtime input.

Any future no-consent classification for browser storage must be confirmed by
production legal review and cannot be inferred from this architecture document.

## Consent Required

Consent or equivalent explicit future approval is required before:

- analytics cookies;
- analytics event collection tied to users, sessions, devices, behavior, or
  conversion paths;
- marketing, retargeting, advertising, or third-party tracking;
- non-essential Local Storage expansion;
- import or sync of local simulation history to an account;
- memory, personalization, preference, or strategic context storage;
- optional AI processing involving personal data or user profile context;
- browser speech transcript storage beyond immediate user-submitted input;
- external monitoring if used as user/session tracking rather than bounded
  operational evidence;
- any third-party service that receives identifiers, decision input, simulation
  artifacts, local history, account data, or consent records for non-essential
  purposes.

Stage 11.5 does not implement any consent collection, withdrawal, preference
center, banner, or consent record runtime.

## Consent Not Required at Architecture Level

Consent is not required at architecture level for:

- request-time Runtime Memory used to process a submitted simulation;
- in-memory public API abuse protection that is not retained, tracked, or
  exported to analytics/marketing;
- deterministic response construction required to answer the current request;
- current absence of analytics, marketing, billing provider, AI Provider, and
  production consent runtime.

This is not legal wording. It is an architecture boundary. Production legal
review may still require notices, disclosures, or different classification.

## Consent Blocked Until Production Legal Review

Consent classification must remain blocked for:

- Local Simulation History production classification;
- Legacy Mock Session Local Storage production handling;
- Supabase Auth / Session Cookies before production auth approval;
- Browser Speech Recognition Vendor Processing before production positioning;
- production logs or monitoring retaining request/personal metadata;
- billing provider cookies and checkout state;
- consent record storage mechanism;
- memory/personalization storage;
- AI Provider data flows;
- any third-party cookie, script, iframe, SDK, pixel, analytics tag, or tracking
  endpoint.

Blocked means no implementation, UI, notice, banner, copy, SDK, provider, or
tracking behavior may be added until the relevant legal/owner review is
explicitly approved.

## Prohibited Surfaces Until Separate Legal Approval

The following surfaces are prohibited in the current approved state:

- analytics provider scripts or SDKs;
- marketing pixels;
- retargeting cookies;
- advertising identifiers;
- cross-site tracking;
- third-party behavioral analytics;
- session replay;
- heatmaps;
- fingerprinting;
- A/B testing identifiers tied to user/session/device behavior;
- AI Provider cookies, SDK state, or external prompt telemetry;
- billing provider checkout cookies or customer portal state;
- external monitoring that captures raw decision input or full simulation
  artifacts;
- consent banner or preference-center UI that stores choices without an
  approved consent architecture;
- any hidden persistence of browser speech transcripts;
- any use of Local Storage as production auth, consent, billing, entitlement,
  account ownership, or data-control authority.

## Required Cross-Surface Links

Cookie & Local Storage Surface must link to:

- Privacy Surface for user-facing personal-data disclosure;
- Data Processing Surface for internal purpose, storage, retention, processor,
  and transfer mapping;
- Consent Surface for consent categories and consent-state dependencies;
- Terms Surface for user/service responsibilities around local storage and
  acceptable use;
- User Data Controls Surface if local data is imported, synced, exported, or
  deleted through account workflows;
- AI Transparency Surface if any storage participates in AI processing;
- Subscription & Billing Legal Surface if billing provider storage is opened;
- User Trust Surface for product-readiness honesty and security claims;
- Regulatory Readiness Surface before production launch;
- Production Legal Blockers Surface before Stage 12.

Consent Surface must link to:

- Cookie & Local Storage Surface;
- Privacy Surface;
- Data Processing Surface;
- User Data Controls Surface;
- AI Transparency Surface where optional AI processing exists;
- Subscription & Billing Legal Surface where paid-plan consent or provider
  state is relevant;
- User Trust Surface;
- Regulatory Readiness Surface.

These links are dependencies only. Stage 11.5 does not transfer ownership of
Privacy, Terms, Billing, AI Transparency, User Data Controls, Trust, or
Regulatory Readiness content into the Cookie & Local Storage or Consent
surfaces.

## Boundary Between Cookies, Local Storage, Runtime Memory, Logs, and Analytics

Cookies:

- browser cookie state attached to requests or managed by approved providers;
- includes future auth/session cookies and possible future billing/consent
  cookies;
- does not include request-time local variables or server-only runtime memory.

Local Storage:

- browser persistent key/value storage;
- currently includes local demo simulations and legacy mock-session flag;
- must not become production identity, consent, billing, entitlement, or account
  authority.

Runtime Memory:

- transient browser or server memory for current request/session handling;
- includes public simulator input before submission, deterministic request
  handling, in-memory rate limiting, and current response construction;
- must not be treated as durable storage, analytics, or consent records.

Logs:

- operational/debug/quality evidence;
- not a cookie or browser storage surface;
- becomes privacy/trust relevant if request or personal metadata is retained or
  sent to external monitoring.

Analytics:

- product measurement, behavioral events, conversion tracking, marketing, or
  profiling;
- current status is disabled/not approved;
- must not reuse cookies, Local Storage, runtime memory, logs, local history,
  account data, billing data, or AI Provider payloads without explicit future
  approval.

## Production-Launch Mandatory Requirements

Mandatory before production public launch:

- Cookie & Local Storage Surface requirements must be owner/legal-reviewed.
- Consent Surface requirements must be owner/legal-reviewed.
- All active cookies, Local Storage keys, browser APIs, and tracking-like
  surfaces must be inventoried.
- Local Simulation History must be classified as strictly necessary,
  functional, consent-gated, changed, or removed.
- Legacy Mock Session Local Storage must be reviewed as a production blocker or
  explicitly removed/replaced.
- Browser Speech Recognition Vendor Processing must be reviewed if voice input
  remains available or supported.
- Analytics, marketing, retargeting, session replay, heatmaps, and
  fingerprinting must remain absent unless separately approved.
- Any auth/session cookies must be tied to production auth approval.
- Any billing/subscription provider cookies must be tied to billing approval.
- Any AI Provider/external-service state must be tied to AI Transparency,
  Privacy/Data Processing, and Regulatory Readiness approval.
- Consent/no-consent classifications must be documented before public Cookie
  Policy or banner drafting.
- Privacy, Terms, Data Processing, AI Transparency, User Trust, Regulatory
  Readiness, and Production Legal Blockers references must be aligned.

Mandatory before analytics or marketing:

- provider approval;
- purpose approval;
- event taxonomy approval;
- cookie/storage inventory;
- consent requirement approval;
- retention and deletion expectations;
- opt-out/withdrawal behavior;
- processor/subprocessor mapping;
- Privacy/Data Processing update;
- User Trust review.

Mandatory before consent runtime:

- consent categories;
- consent storage method;
- consent state lifecycle;
- withdrawal behavior;
- account/auth relationship if authenticated;
- rollback behavior;
- privacy and data-processing references;
- no hidden dependency on local demo data or mock session data.

## Deferred and Future-Only Requirements

Deferred until separate approval:

- Cookie Policy drafting;
- Privacy Policy update;
- consent banner or modal text;
- preference center UI;
- consent runtime implementation;
- consent record persistence;
- production auth cookie approval;
- production billing provider cookie approval;
- analytics provider integration;
- marketing/tracking provider integration;
- AI Provider external-service processing;
- production monitoring provider integration;
- account-saved simulations;
- memory/personalization;
- Market Readiness;
- Closed Beta;
- Public Launch.

Future-only requirements must not be described as active product behavior.

## Closure Decision

Stage 11.5 Cookies & Consent Scope Foundation is complete when:

- cookie / consent / tracking surfaces are listed;
- mandatory, conditional, deferred, and future-only classifications are
  recorded;
- strictly necessary surfaces are separated from analytics, billing,
  auth/session, Local Storage, AI Provider, and external-service surfaces;
- consent-required surfaces are listed;
- no-consent architecture surfaces are listed;
- legal-review-blocked surfaces are listed;
- prohibited surfaces are listed;
- cross-surface links are defined;
- cookies, Local Storage, Runtime Memory, logs, and analytics boundaries are
  defined;
- production-launch mandatory requirements are listed;
- deferred and future-only requirements are listed;
- no Cookie Policy, Privacy Policy, consent banner text, legal wording,
  user-facing notices, UI copy, or legal prose is written;
- no runtime, UI, API, simulator, Decision Engine, AI integration, auth,
  database, subscription, billing, analytics, logging, or tracking behavior is
  changed.

Completion status: accepted as documentation-only architecture foundation.

Next implementation subblock: Stage 11.6 AI Transparency & Decision Simulation
Disclaimer Foundation.
