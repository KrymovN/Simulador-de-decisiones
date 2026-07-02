# Levio Stage 11.3 - Privacy & Data Processing Scope Foundation

Date: 1 July 2026, Europe/Madrid.

Status: Complete as documentation-only architecture foundation.

This document defines the privacy and data-processing architecture boundaries
for Levio.es. It does not write Privacy Policy, GDPR text, Data Processing
Agreement, Cookie Policy, user notices, or legal prose. It does not implement
backend, runtime, UI, API, simulator, Decision Engine, AI integration, auth,
database, subscriptions, analytics, or logging changes.

## Scope Boundary

Stage 11.3 covers:

- data category inventory;
- origin of each data category;
- lifecycle expectations;
- where each category appears;
- where each category may be used;
- where each category must not be used;
- mandatory, conditional, and future-only classification;
- boundaries between Local Storage, Runtime Memory, User Account, AI Provider,
  Logs, and Analytics;
- external-service transfer prohibitions;
- legal-reference routing;
- separation between Decision Simulation Engine data and platform
  infrastructure data.

Stage 11.3 does not:

- approve production personal-data processing;
- approve database writes;
- approve external analytics;
- approve Real AI provider data transfer;
- approve production auth;
- approve billing/subscription processing;
- create or modify legal-document content.

## Data Boundary Model

Levio data belongs to one of six processing zones:

1. Local Storage.
   Browser-owned local data, currently used for local demo simulations and a
   legacy mock-session flag. It must not authorize production data access.
2. Runtime Memory.
   Request-time data used for the current deterministic simulation request,
   validation, response construction, and short-lived in-memory rate limiting.
3. User Account.
   Auth/session/account identity data controlled by approved auth runtime and
   owner-scoped persistence. Production use remains deferred.
4. AI Provider.
   Future external AI provider processing. Current status: prohibited and not
   connected.
5. Logs.
   Operational/debug evidence. Current public product must not log raw user
   decision input or sensitive artifacts as a product feature.
6. Analytics.
   Product/marketing measurement. Current status: not approved and not
   implemented.

No data may move from one zone to another unless a later approved subblock
defines purpose, source of truth, consent/notice dependency where applicable,
retention expectation, owner boundary, and rollback behavior.

## Data Category Register

### Category 1 - Public Decision Input

Origin: user-entered text in the public simulator textarea or API `input`.

Current lifecycle:

- appears in browser runtime while the user types;
- is submitted to `/api/simulate` for deterministic preview processing;
- is validated by size and shape boundaries;
- exists in request-time Runtime Memory;
- may appear in the successful public response envelope;
- may be saved to browser Local Storage only as part of local demo simulation
  history.

Appears in: HomeSimulator, `/api/simulate`, deterministic DecisionContext
Builder path, public response envelope, optional local browser simulation list.

Used for: Decision Simulation Engine deterministic preview only.

Must not be used for: AI Provider calls, analytics, marketing, support tooling,
training datasets, account profile enrichment, permanent memory, billing,
subscription entitlement checks, or production logs.

Required status: mandatory for using the public simulator.

Roadmap status: active deterministic-preview data; not production AI data.

Zone: Runtime Memory, optionally Local Storage.

Product classification: Decision Simulation Engine data.

Legal references required: Privacy/Data Processing, AI Transparency, Decision
Simulation Limitations, User Data Controls if persisted or associated with an
account later.

External transfer status: prohibited to AI providers, analytics, marketing, and
unapproved external services.

### Category 2 - Simulation Output Artifacts

Origin: deterministic Decision Engine preview output and local/demo simulation
artifacts.

Current lifecycle:

- generated from Public Decision Input through deterministic preview runtime;
- returned inside the public envelope when completed;
- may be stored in Local Storage as local simulation history;
- not written to production database by Stage 11.3.

Appears in: HomeSimulator result UI, local simulation list/detail surfaces,
`/api/simulate` response.

Used for: presenting deterministic simulation scenarios, thinking stages,
signals, and recommendations within the product surface.

Must not be used for: AI model training, external analytics, user profiling,
billing decisions, account scoring, employment/credit/medical/legal advice, or
provider payload construction.

Required status: conditional on a completed simulation.

Roadmap status: active deterministic-preview data; durable account persistence
deferred.

Zone: Runtime Memory, optionally Local Storage.

Product classification: Decision Simulation Engine data.

Legal references required: Privacy/Data Processing if persisted, Terms,
Decision Simulation Limitations, AI Transparency.

External transfer status: prohibited to AI providers and analytics until a
future approved stage defines lawful processing boundaries.

### Category 3 - Public API Metadata

Origin: `/api/simulate` route and public adapter.

Current lifecycle:

- generated per request as `requestId`, `generatedAt`, `lang`, status, error
  state, and public contract metadata;
- returned in the public response;
- not intended to identify a user by itself.

Appears in: `/api/simulate` response envelope and UI error/success handling.

Used for: public contract stability, error handling, and deterministic preview
traceability.

Must not be used for: user identity, account ownership, cross-session tracking,
analytics profiles, billing, or marketing.

Required status: mandatory for public API responses.

Roadmap status: active public contract metadata.

Zone: Runtime Memory.

Product classification: platform infrastructure data supporting the Decision
Simulation Engine.

Legal references required: Privacy/Data Processing if retained in logs or
associated with user/account data later.

External transfer status: prohibited to analytics/marketing unless later
approved as a separate analytics scope.

### Category 4 - Abuse Boundary / Rate-Limit Source Data

Origin: request headers such as forwarded IP headers, Cloudflare connecting IP,
or user-agent fallback used by `/api/simulate`.

Current lifecycle:

- read at request time;
- mapped to an in-memory rate-limit bucket;
- pruned from memory by time window and bucket cap;
- not written to production database by Stage 11.3.

Appears in: `/api/simulate` rate-limit boundary.

Used for: lightweight abuse protection and request throttling.

Must not be used for: analytics, marketing, user profiling, account identity,
Decision Engine semantics, AI Provider prompts, or billing.

Required status: conditional when public API abuse boundary is active.

Roadmap status: active in-memory security/abuse data.

Zone: Runtime Memory.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing and User Trust/Security
requirements if retained or expanded.

External transfer status: prohibited except to approved hosting/security
infrastructure required to operate the request path.

### Category 5 - Local Simulation History

Origin: browser Local Storage key `levio_es_saved_simulations`.

Current lifecycle:

- created in the user's browser after public simulator use;
- read by local simulation list/detail surfaces;
- can be removed from the local view by the user;
- not synchronized to a server account by Stage 11.3.

Appears in: HomeSimulator, SimulationsList, SimulationDetailClient.

Used for: local demo continuity in the same browser.

Must not be used for: production account history, auth decisions, analytics,
AI Provider calls, billing, profile enrichment, or cross-device persistence.

Required status: optional.

Roadmap status: active local-only demo data.

Zone: Local Storage.

Product classification: Decision Simulation Engine data when created by a
simulation; platform-local persistence when used for browser continuity.

Legal references required: Privacy/Data Processing, User Data Controls if later
imported to an account, Decision Simulation Limitations.

External transfer status: prohibited unless a future explicit import/sync flow
is approved.

### Category 6 - Mock Session Flag

Origin: browser Local Storage key `levio_es_mock_session`.

Current lifecycle:

- created only by legacy/demo mock-auth helper;
- stores mock provider, creation timestamp, and privacyMode demo value;
- can be cleared from Local Storage;
- must not authorize production data.

Appears in: MockAuthGate compatibility code.

Used for: legacy demo compatibility only.

Must not be used for: production auth, account ownership, consent records,
personal-data access, export/deletion rights, billing, subscription
entitlements, or database access.

Required status: optional and legacy/demo only.

Roadmap status: active code artifact, not production authentication.

Zone: Local Storage.

Product classification: platform infrastructure demo data.

Legal references required: Privacy/Data Processing if retained in product,
Auth & Account Legal Surface if any future auth behavior depends on browser
state.

External transfer status: prohibited.

### Category 7 - Auth Email and Login Intent

Origin: user-entered email in login/register/recovery flows.

Current lifecycle:

- appears in auth forms;
- may be submitted to Supabase Auth only when auth runtime is configured;
- otherwise remains in prepared/local form state and no production account is
  promised.

Appears in: login, register, forgot-password pages, Supabase auth client/server
foundation.

Used for: future approved authentication flow only.

Must not be used for: Decision Engine semantics, local simulation history,
analytics, marketing, AI Provider payloads, billing, subscriptions, or memory
without separate approval.

Required status: conditional on production auth.

Roadmap status: auth foundation exists; production auth readiness remains
deferred.

Zone: User Account when auth is enabled; Runtime Memory during form handling.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing, Auth & Account Legal,
User Data Controls, User Trust.

External transfer status: allowed only to the approved auth provider when auth
runtime is explicitly configured; otherwise prohibited.

### Category 8 - Auth Session and Principal Data

Origin: Supabase Auth session/user data and Levio normalization layer.

Current lifecycle:

- read from Supabase session cookies when auth runtime is enabled;
- normalized to principalId, providerReference, email, sessionId,
  sessionStatus, authTime, expiresAt, assuranceLevel, and riskFlags;
- exposed to the client only as reduced auth state.

Appears in: auth session runtime, dashboard guard, future User Data Controls
ownership checks.

Used for: authenticated access boundary and future owner-scoped data controls.

Must not be used for: Decision Engine content, AI Provider prompts, analytics,
marketing, billing without commercial approval, or permanent memory consent.

Required status: conditional on production auth, account, export/deletion, or
owner-scoped persistence.

Roadmap status: foundation present; production validation deferred.

Zone: User Account.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing, Auth & Account Legal,
User Data Controls, User Trust.

External transfer status: allowed only to approved auth infrastructure;
prohibited to AI providers, analytics, marketing, and unapproved services.

### Category 9 - Account Profile and Security Placeholder Data

Origin: dashboard profile/security placeholder surfaces and future account
forms.

Current lifecycle:

- currently placeholder/demo UI data;
- not approved as production account data;
- no production write path is approved by Stage 11.3.

Appears in: dashboard profile/security placeholder surfaces.

Used for: demonstration of future account/profile/security surfaces only.

Must not be used for: production identity, AI context, analytics, billing,
support records, or persistent user profile.

Required status: future-only.

Roadmap status: deferred until production auth, persistence, and legal scope
approval.

Zone: future User Account.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing, Auth & Account Legal, User
Trust.

External transfer status: prohibited until a future approved account/profile
processing scope exists.

### Category 10 - Memory / Preference / Strategic Context Data

Origin: future memory/profile/context features and placeholder dashboard memory
surfaces.

Current lifecycle:

- not active as production processing;
- no permanent memory is approved;
- no AI or Decision Engine runtime may consume it in Stage 11.3.

Appears in: placeholder memory/profile surfaces and foundation documents only.

Used for: future approved personalization or strategic context only.

Must not be used for: current simulator runtime, AI Provider payloads, account
profiling, analytics, marketing, or billing.

Required status: future-only and consent-dependent.

Roadmap status: deferred.

Zone: future User Account, possibly future Runtime Memory after approval.

Product classification: Decision Simulation Engine data only if it becomes
approved decision context; otherwise platform personalization data.

Legal references required: Privacy/Data Processing, Consent, User Data
Controls, AI Transparency if used with AI, Decision Simulation Limitations.

External transfer status: prohibited until explicit future approval.

### Category 11 - Consent, Retention, Export, and Deletion Records

Origin: Stage 4.3 User Data Controls foundation and future legal/user-data
workflows.

Current lifecycle:

- foundation contracts exist;
- production UI/API exposure is not active;
- real export generation and deletion writes remain deferred.

Appears in: User Data Controls foundation and server workflow contracts.

Used for: future data subject controls, retention evaluation, export planning,
and deletion planning.

Must not be used for: marketing, AI Provider payloads, Decision Engine
semantics, billing, or analytics.

Required status: mandatory before production account/personal-data processing.

Roadmap status: foundation-only; production workflow deferred.

Zone: future User Account and platform infrastructure.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing, Consent, User Data
Controls, Regulatory Readiness.

External transfer status: prohibited except to approved infrastructure required
to complete a verified user-data request.

### Category 12 - Persistence Owner / Principal Mapping Data

Origin: Persistence Runtime foundation, Auth foundation, User Data Controls
foundation.

Current lifecycle:

- foundation model exists;
- maps provider identity to Levio principal/owner boundary;
- production data writes remain deferred.

Appears in: persistence/auth/user-data foundation documents and server workflow
contracts.

Used for: future owner-scoped persistence, authorization, export, deletion, and
entitlement boundaries.

Must not be used for: public simulator semantics, AI Provider payloads,
analytics, marketing, or client-supplied owner claims.

Required status: mandatory before production owner-scoped data.

Roadmap status: foundation-only.

Zone: future User Account and database infrastructure.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing, Auth & Account Legal, User
Data Controls, User Trust.

External transfer status: prohibited except approved auth/persistence
infrastructure.

### Category 13 - Subscription and Billing Data

Origin: future billing provider, pricing/tax scope, subscription runtime
foundation, entitlement foundation.

Current lifecycle:

- subscription foundation exists only as internal contracts;
- no billing provider, checkout, customer portal, invoices, or subscription API
  is active.

Appears in: subscription foundation documents/contracts only.

Used for: future entitlement and commercial access if billing is approved.

Must not be used for: Decision Engine semantics, AI Provider payloads,
analytics, marketing, public simulator content, or account memory.

Required status: future-only, mandatory before paid plans.

Roadmap status: deferred until commercial/legal/tax approval.

Zone: future User Account and platform infrastructure.

Product classification: platform infrastructure data.

Legal references required: Terms, Privacy/Data Processing, Subscription &
Billing Legal Surface, Legal Identity & Contact.

External transfer status: prohibited until an approved billing provider and
commercial/legal scope exist.

### Category 14 - Operational Logs and Error Evidence

Origin: server/runtime errors, quality gates, development scripts, and future
observability.

Current lifecycle:

- current quality scripts print pass/fail evidence;
- public route catches failures and returns safe public envelopes;
- no production telemetry logging system is approved by Stage 11.3.

Appears in: development scripts, runtime error handling, future observability
planning.

Used for: engineering quality, rollback evidence, controlled diagnostics.

Must not be used for: analytics, marketing, user profiling, AI Provider
payloads, or storing raw decision input.

Required status: conditional on operations and quality work.

Roadmap status: bounded engineering evidence; production observability logging
scope deferred.

Zone: Logs.

Product classification: platform infrastructure data.

Legal references required: Privacy/Data Processing and User Trust/Security if
production logs include personal or request metadata.

External transfer status: prohibited to external logging/monitoring providers
until a future approved processor/logging scope exists.

### Category 15 - Analytics and Marketing Events

Origin: future analytics or marketing tooling only.

Current lifecycle:

- not approved;
- not implemented as a production data flow;
- no analytics provider is part of Stage 11.3.

Appears in: no approved production surface.

Used for: nothing in the current product.

Must not be used for: current simulator, account profiling, marketing,
retargeting, conversion tracking, or user segmentation.

Required status: future-only and consent/legal-scope dependent.

Roadmap status: deferred.

Zone: Analytics.

Product classification: platform infrastructure data if later approved.

Legal references required: Cookies & Consent, Privacy/Data Processing,
Regulatory Readiness.

External transfer status: prohibited until analytics provider, cookie/consent
scope, and legal review are approved.

### Category 16 - AI Provider Payload and Candidate Material

Origin: future Prompt Context -> AI Provider integration only.

Current lifecycle:

- not active;
- no provider SDK, API key, env handling, fetch/model call, streaming, or AI
  provider API route is connected;
- current Stage 5.4 remains dry-run/foundation only.

Appears in: future AI Provider boundary only after explicit approval.

Used for: future controlled candidate material, never final decision ownership.

Must not be used for: current public simulator, analytics, marketing, logs,
billing, permanent memory, or direct AI-to-user answers.

Required status: future-only.

Roadmap status: Real AI runtime deferred.

Zone: AI Provider.

Product classification: Decision Simulation Engine data only if later approved
as controlled candidate material.

Legal references required: Privacy/Data Processing if personal data is included,
AI Transparency, Decision Simulation Limitations, User Trust, Regulatory
Readiness.

External transfer status: prohibited in current state.

### Category 17 - Browser Speech Recognition Transcript

Origin: user microphone/browser speech recognition API when the user chooses to
use voice input.

Current lifecycle:

- exists in browser Runtime Memory as dictated by the browser speech API;
- may populate the simulator input field;
- becomes Public Decision Input only if the user submits or saves it;
- no Levio server persistence is approved by Stage 11.3.

Appears in: HomeSimulator voice input path.

Used for: user-controlled entry convenience.

Must not be used for: background recording, analytics, AI Provider payloads,
marketing, account profile, logs, or hidden persistence.

Required status: optional and user-initiated.

Roadmap status: active browser capability where supported; not a server data
processing approval.

Zone: Runtime Memory, then Public Decision Input if submitted.

Product classification: Decision Simulation Engine input only after user
submission.

Legal references required: Privacy/Data Processing and User Trust; Cookies &
Consent only if future storage/analytics is attached.

External transfer status: Levio must not forward transcripts to unapproved
external services. Browser/vendor speech processing must be treated as a
separate review dependency before production positioning.

## Mandatory, Conditional, and Future-Only Categories

Mandatory for current deterministic public simulator:

- Public Decision Input;
- Public API Metadata;
- Simulation Output Artifacts when a simulation completes;
- Abuse Boundary / Rate-Limit Source Data for public API protection.

Optional current local/browser categories:

- Local Simulation History;
- Mock Session Flag;
- Browser Speech Recognition Transcript when user-initiated.

Conditional on production auth/account:

- Auth Email and Login Intent;
- Auth Session and Principal Data;
- Account Profile and Security Placeholder Data after approval;
- Persistence Owner / Principal Mapping Data;
- Consent, Retention, Export, and Deletion Records.

Future-only:

- Memory / Preference / Strategic Context Data;
- Subscription and Billing Data;
- Analytics and Marketing Events;
- AI Provider Payload and Candidate Material;
- production Operational Logs that include personal or request metadata.

## Zone Boundary Rules

### Local Storage

Allowed:

- local demo simulation history;
- mock session flag for legacy demo compatibility.

Not allowed:

- production auth;
- consent records;
- verified owner identity;
- export/deletion authorization;
- billing data;
- AI Provider payload staging;
- analytics identity.

### Runtime Memory

Allowed:

- current request validation;
- deterministic simulation pipeline execution;
- public response construction;
- in-memory rate limiting;
- browser-only voice transcript before submission.

Not allowed:

- durable personal profile;
- hidden memory;
- analytics profile;
- provider payload persistence;
- long-term logs containing raw decision input.

### User Account

Allowed only after future approval:

- verified auth identity;
- owner principal mapping;
- saved simulations;
- user data controls;
- consent records;
- profile/security settings;
- billing entitlements if commercial scope is approved.

Not allowed:

- silent import of local demo data;
- treating registration as memory consent;
- AI processing without separate AI transparency and data-processing approval.

### AI Provider

Allowed: nothing in the current state.

Not allowed:

- raw decision input;
- saved simulations;
- account identity;
- email;
- principal IDs;
- consent records;
- billing data;
- logs;
- analytics events;
- memory/preferences.

### Logs

Allowed:

- minimal operational evidence;
- request IDs;
- non-sensitive status/error aggregates where approved.

Not allowed:

- raw decision input;
- full simulation artifacts;
- email;
- access tokens;
- session cookies;
- consent records;
- billing data;
- AI provider payloads.

### Analytics

Allowed: nothing in the current state.

Not allowed:

- user decision input;
- simulation output;
- local history;
- email/auth identity;
- principal IDs;
- consent/export/deletion records;
- billing/subscription data;
- AI provider payloads.

## External Transfer Prohibitions

The following categories must not be transferred to external services in the
current approved state:

- Public Decision Input;
- Simulation Output Artifacts;
- Local Simulation History;
- Mock Session Flag;
- Browser Speech Recognition Transcript by Levio-controlled code;
- Auth Session and Principal Data except approved auth infrastructure;
- Consent, Retention, Export, and Deletion Records;
- Persistence Owner / Principal Mapping Data except approved auth/persistence
  infrastructure;
- Subscription and Billing Data until billing scope is approved;
- Operational Logs containing raw input or personal data;
- Analytics and Marketing Events;
- AI Provider Payload and Candidate Material.

## Legal Reference Routing

Categories requiring Privacy/Data Processing reference:

- Public Decision Input;
- Simulation Output Artifacts if persisted;
- Public API Metadata if retained;
- Abuse Boundary / Rate-Limit Source Data;
- Local Simulation History;
- Auth Email and Login Intent;
- Auth Session and Principal Data;
- Account Profile and Security Placeholder Data;
- Memory / Preference / Strategic Context Data;
- Consent, Retention, Export, and Deletion Records;
- Persistence Owner / Principal Mapping Data;
- Operational Logs if production metadata is retained;
- Analytics and Marketing Events if approved;
- AI Provider Payload and Candidate Material if approved;
- Browser Speech Recognition Transcript if submitted or otherwise processed by
  Levio.

Categories requiring Cookies & Consent reference:

- Cookie/local-storage categories if expanded beyond current local demo state;
- Consent records;
- Analytics and Marketing Events;
- optional memory/personalization;
- future non-essential tracking or storage.

Categories requiring AI Transparency reference:

- Public Decision Input when used for AI in the future;
- Simulation Output Artifacts;
- AI Provider Payload and Candidate Material;
- Memory / Preference / Strategic Context Data if used for AI;
- Decision Simulation limitations for all user-facing simulation outputs.

Categories requiring User Data Controls reference:

- Local Simulation History if imported/synced;
- saved simulations;
- account profile/security data;
- memory/preferences;
- consent records;
- export/deletion records;
- owner/principal mapping;
- AI provider payload records if ever retained.

Categories requiring Subscription/Billing legal reference:

- Subscription and Billing Data;
- entitlement records;
- payment provider identifiers;
- invoices, tax data, refunds, and customer portal data if later approved.

## Decision Simulation Engine vs Platform Infrastructure

Decision Simulation Engine data:

- Public Decision Input;
- Simulation Output Artifacts;
- Browser Speech Recognition Transcript after user submission;
- future Memory / Preference / Strategic Context Data only if approved as
  controlled decision context;
- future AI Provider Payload and Candidate Material only if approved as
  controlled candidate material.

Platform infrastructure data:

- Public API Metadata;
- Abuse Boundary / Rate-Limit Source Data;
- Mock Session Flag;
- Auth Email and Login Intent;
- Auth Session and Principal Data;
- Account Profile and Security Placeholder Data;
- Consent, Retention, Export, and Deletion Records;
- Persistence Owner / Principal Mapping Data;
- Subscription and Billing Data;
- Operational Logs and Error Evidence;
- Analytics and Marketing Events;
- Legal Identity and contact data when added later.

## Closure Decision

Stage 11.3 Privacy & Data Processing Scope Foundation is complete when:

- data categories are listed;
- origin, lifecycle, appearance, permitted use, and prohibited use are recorded;
- mandatory, conditional, and future-only categories are separated;
- Local Storage, Runtime Memory, User Account, AI Provider, Logs, and Analytics
  boundaries are defined;
- external transfer prohibitions are recorded;
- legal-reference routing is defined;
- Decision Simulation Engine data is separated from platform infrastructure
  data;
- no legal document text is written;
- no runtime, UI, API, simulator, Decision Engine, AI integration, auth,
  database, subscription, analytics, or logging behavior is changed.

Completion status: accepted as documentation-only architecture foundation.

Next implementation subblock: Stage 11.4 Terms & Acceptable Use Scope
Foundation.
