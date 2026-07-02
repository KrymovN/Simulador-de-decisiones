# Levio Stage 11.2 - Legal Surface Scope & Ownership Lock

Date: 1 July 2026, Europe/Madrid.

Status: Complete as documentation-only architecture lock.

This document defines the legal surface architecture for Levio.es. It does not
write, draft, or approve Privacy Policy, Terms of Service, Cookie Policy, AI
Disclaimer, or any other legal-document text.

## Scope Boundary

Stage 11.2 covers:

- legal surface inventory;
- ownership per surface;
- source-of-truth assignment;
- public / production / internal status;
- mandatory / conditional / deferred classification;
- document and page dependency order;
- responsibility boundaries to prevent duplicated legal ownership.

Stage 11.2 does not change:

- runtime;
- UI;
- API;
- simulator;
- Decision Engine;
- AI;
- auth;
- database;
- subscriptions;
- public contract;
- product behavior.

## Canonical Legal Surface Registry

This registry is the source of truth for which legal surfaces exist. Future
Stage 11 subblocks may define requirements or review packets for these
surfaces, but they must not create duplicate owners.

### Surface 1 - Privacy Surface

Name: Privacy Surface.

Current public route or location: `/privacy-policy`.

Primary owner: legal owner.

Engineering owner: product engineering for route/link integrity only.

Source of truth: future Stage 11.3 Privacy & Data Processing Scope Foundation,
then owner/legal-approved privacy document.

Required status: mandatory before production public use involving personal data.

Surface status: public, production-required, content not approved.

Dependencies: Data Processing Surface, User Data Controls Surface, Consent
Surface, Regulatory Readiness Matrix.

Responsibility boundary: owns user-facing personal-data disclosure only. It
does not own internal processing inventory, cookie consent mechanics, Terms, or
AI transparency.

### Surface 2 - Terms Surface

Name: Terms Surface.

Current public route or location: `/terms`.

Primary owner: legal owner.

Engineering owner: product engineering for route/link integrity only.

Source of truth: future Stage 11.4 Terms & Acceptable Use Scope Foundation, then
owner/legal-approved terms document.

Required status: mandatory before production public use, account usage, paid
plans, or any public commitment beyond deterministic preview.

Surface status: public, production-required, content not approved.

Dependencies: Product behavior baseline, AI Transparency Surface, Decision
Simulation Limitations Surface, Subscription/Billing Legal Surface if billing is
opened.

Responsibility boundary: owns user obligations, acceptable-use scope, account
relationship, and service limitations. It does not own privacy disclosures,
cookie consent, or data-subject rights procedure.

### Surface 3 - Cookie & Local Storage Surface

Name: Cookie & Local Storage Surface.

Current public route or location: no dedicated approved route yet.

Primary owner: legal owner.

Engineering owner: product engineering for inventory and implementation
readiness only.

Source of truth: future Stage 11.5 Cookies & Consent Scope Foundation, then
owner/legal-approved cookie document or cookie notice.

Required status: mandatory before non-essential cookies, analytics, marketing
tracking, or production cookie consent is enabled.

Surface status: public-required when tracking/storage scope requires it;
currently implementation-deferred.

Dependencies: Consent Surface, Privacy Surface, frontend/storage inventory,
analytics/marketing deferral decisions.

Responsibility boundary: owns cookie/local-storage categorization and notice
requirements. It does not own general privacy disclosure or consent record
architecture.

### Surface 4 - Consent Surface

Name: Consent Surface.

Current public route or location: no dedicated approved route or UI yet.

Primary owner: legal owner for consent requirements.

Engineering owner: product engineering for future consent-state architecture
only.

Source of truth: future Stage 11.5 Cookies & Consent Scope Foundation plus
future implementation approval if consent UI is opened.

Required status: mandatory when consent-gated processing, non-essential cookies,
marketing, analytics, or optional data processing is enabled.

Surface status: public/internal hybrid, production-required when applicable,
implementation-deferred.

Dependencies: Cookie & Local Storage Surface, Privacy Surface, Data Processing
Surface, User Data Controls Surface.

Responsibility boundary: owns consent requirement categories and consent-state
dependencies. It does not own legal copy for Privacy, Terms, or Cookie Policy.

### Surface 5 - Data Processing Surface

Name: Data Processing Surface.

Current public route or location: internal architecture surface; no public route.

Primary owner: legal owner for processing obligations.

Engineering owner: product engineering for data-flow accuracy and system
dependency mapping.

Source of truth: future Stage 11.3 Privacy & Data Processing Scope Foundation,
existing User Data Controls foundation, Persistence foundation, and any approved
processor/subprocessor register.

Required status: mandatory before production personal-data processing.

Surface status: internal, production-required, content not approved.

Dependencies: Privacy Surface, User Data Controls Surface, Consent Surface,
Regulatory Readiness Matrix.

Responsibility boundary: owns internal processing categories, purposes,
retention dependencies, processor/subprocessor mapping, and legal blockers. It
does not own user-facing Privacy Policy prose.

### Surface 6 - User Data Controls Surface

Name: User Data Controls Surface.

Current public route or location: no active public user-data-controls route.

Primary owner: legal owner for rights requirements.

Engineering owner: product engineering for future export/deletion/access
workflow readiness only.

Source of truth: Stage 4.3 User Data Controls foundation and future Stage 11.3
Privacy & Data Processing Scope Foundation.

Required status: mandatory before production account/data processing where data
subject rights apply.

Surface status: internal/future public, production-required, implementation
deferred.

Dependencies: Data Processing Surface, Privacy Surface, Auth Legal Surface,
Persistence foundation.

Responsibility boundary: owns data-subject-rights workflow requirements and
engineering readiness dependencies. It does not own Privacy Policy wording.

### Surface 7 - AI Transparency Surface

Name: AI Transparency Surface.

Current public route or location: distributed public copy only; no dedicated
approved legal route yet.

Primary owner: product owner and legal owner jointly.

Engineering owner: product engineering for factual runtime and contract
alignment only.

Source of truth: future Stage 11.6 AI Transparency & Decision Simulation
Disclaimer Foundation, Stage 5.4 Real AI deferred state, and Stage 10 public
contract baseline.

Required status: mandatory before any public claim about AI, deterministic
preview, Real AI deferral, model execution, or provider behavior.

Surface status: public-facing requirement, production-required, content not
approved.

Dependencies: Decision Simulation Limitations Surface, Terms Surface, Privacy
Surface if AI processing of personal data is later opened.

Responsibility boundary: owns factual transparency about deterministic preview,
Real AI deferral, provider non-execution, and no AI Chat / Answer Engine
positioning. It does not own high-stakes limitation taxonomy by itself.

### Surface 8 - Decision Simulation Limitations Surface

Name: Decision Simulation Limitations Surface.

Current public route or location: distributed public copy only; no dedicated
approved legal route yet.

Primary owner: product owner and legal owner jointly.

Engineering owner: product engineering for Decision Engine and simulator
factual accuracy only.

Source of truth: future Stage 11.6 AI Transparency & Decision Simulation
Disclaimer Foundation, Stage 10 public contract baseline, and immutable product
positioning.

Required status: mandatory before production public simulator use and before
any expanded decision-simulation claims.

Surface status: public-facing requirement, production-required, content not
approved.

Dependencies: AI Transparency Surface, Terms Surface, Product behavior baseline.

Responsibility boundary: owns Decision Simulation Engine limitations and no
high-stakes advice positioning. It does not own AI provider transparency,
privacy, cookies, or account terms.

### Surface 9 - Legal Identity & Contact Surface

Name: Legal Identity & Contact Surface.

Current public route or location: no dedicated approved route yet.

Primary owner: legal owner / business owner.

Engineering owner: product engineering for future route/link integrity only.

Source of truth: owner-provided legal entity, jurisdiction, contact, and support
details; future Legal Review Packet & Drafting Handoff.

Required status: mandatory before production public launch.

Surface status: public-required, production-required, owner data pending.

Dependencies: Terms Surface, Privacy Surface, User Trust Surface, Regulatory
Readiness Matrix.

Responsibility boundary: owns identity, legal contact, and official notice
routing. It does not own support workflows, privacy rights processing, or Terms
content.

### Surface 10 - Auth & Account Legal Surface

Name: Auth & Account Legal Surface.

Current public route or location: login, register, forgot-password, dashboard
placeholder surfaces.

Primary owner: legal owner for account relationship requirements.

Engineering owner: auth/product engineering for factual auth readiness only.

Source of truth: future Terms requirements, Privacy/Data Processing
requirements, Auth Runtime foundation, and production auth readiness review.

Required status: mandatory before production auth, real accounts, persistent
profiles, or account data controls are enabled.

Surface status: public/internal hybrid, production-required when auth is opened,
implementation deferred.

Dependencies: Terms Surface, Privacy Surface, User Data Controls Surface, Data
Processing Surface, Consent Surface if optional processing is attached.

Responsibility boundary: owns account-related legal acceptance, account-state
disclosures, and auth readiness dependencies. It does not own auth runtime or
database implementation.

### Surface 11 - Subscription & Billing Legal Surface

Name: Subscription & Billing Legal Surface.

Current public route or location: no approved billing route or UI.

Primary owner: legal owner and commercial owner.

Engineering owner: product engineering for future billing integration readiness
only.

Source of truth: Stage 4.4 Subscription Runtime foundation, future commercial
approval, pricing/legal/tax scope, and future owner/legal-approved commercial
terms.

Required status: mandatory before paid plans, checkout, billing provider,
entitlement API, invoices, tax handling, or customer portal.

Surface status: internal/future public, production-required before billing,
implementation deferred.

Dependencies: Terms Surface, Privacy Surface, Data Processing Surface, Legal
Identity & Contact Surface, Production Legal Blockers Closure Gate.

Responsibility boundary: owns commercial legal readiness, pricing/tax/refund
dependencies, and billing legal blockers. It does not own subscription runtime
foundation or entitlement enforcement logic.

### Surface 12 - User Trust Surface

Name: User Trust Surface.

Current public route or location: distributed public copy and dashboard/security
placeholder surfaces.

Primary owner: product owner and legal owner jointly.

Engineering owner: product engineering for factual security/product-readiness
alignment only.

Source of truth: future Stage 11.7 User Trust Surface Requirements Foundation,
Stage 10 trust/readiness copy audit, Security/Profile placeholder state, and
production readiness decisions.

Required status: mandatory before production public launch and before stronger
security/account/persistence claims.

Surface status: public-facing requirement, production-required, content not
approved.

Dependencies: Privacy Surface, Data Processing Surface, Auth & Account Legal
Surface, Legal Identity & Contact Surface, Regulatory Readiness Matrix.

Responsibility boundary: owns trust claim requirements and public-readiness
honesty. It does not own legal policy text, security implementation, auth
runtime, or privacy rights workflows.

### Surface 13 - Regulatory Readiness Surface

Name: Regulatory Readiness Surface.

Current public route or location: internal review surface; no public route.

Primary owner: legal owner.

Engineering owner: product engineering for evidence and dependency traceability.

Source of truth: future Stage 11.8 Regulatory Readiness Matrix and production
legal blocker review.

Required status: mandatory before Market Readiness, Closed Beta, Public Launch,
or production legal approval.

Surface status: internal, production-required, implementation deferred.

Dependencies: all public legal surfaces, Data Processing Surface, Consent
Surface, Subscription & Billing Legal Surface if billing is opened.

Responsibility boundary: owns readiness mapping and blocker visibility. It does
not own individual policy content or production launch approval by itself.

### Surface 14 - Production Legal Blockers Surface

Name: Production Legal Blockers Surface.

Current public route or location: internal closure surface; no public route.

Primary owner: legal owner and product owner jointly.

Engineering owner: product engineering for blocker evidence and release gate
traceability.

Source of truth: future Stage 11.10 Production Legal Blockers Closure Gate.

Required status: mandatory before Stage 12 Market Readiness.

Surface status: internal, production-required, not open.

Dependencies: all Stage 11 legal surfaces, Legal Review Packet & Drafting
Handoff, Regulatory Readiness Matrix.

Responsibility boundary: owns the final legal-blocker aggregation for Stage 11.
It does not approve Market Readiness, Closed Beta, Public Launch, runtime,
billing, or Real AI by itself.

## Linkage Model

The allowed legal-surface links are:

- Privacy Surface links to Data Processing, User Data Controls, Consent, Cookie
  & Local Storage, and Legal Identity & Contact surfaces.
- Terms Surface links to AI Transparency, Decision Simulation Limitations, Auth
  & Account, Subscription & Billing, and Legal Identity & Contact surfaces.
- Cookie & Local Storage Surface links to Consent and Privacy surfaces.
- Consent Surface links to Cookie & Local Storage, Privacy, Data Processing, and
  User Data Controls surfaces.
- AI Transparency Surface links to Decision Simulation Limitations, Terms, and
  Privacy only when future AI processing of personal data is approved.
- Decision Simulation Limitations Surface links to Terms and AI Transparency.
- Auth & Account Legal Surface links to Terms, Privacy, User Data Controls, and
  Data Processing.
- Subscription & Billing Legal Surface links to Terms, Privacy, Legal Identity &
  Contact, and Production Legal Blockers surfaces.
- User Trust Surface links to Privacy, Data Processing, Auth & Account, Legal
  Identity & Contact, and Regulatory Readiness surfaces.
- Regulatory Readiness Surface links to every mandatory production legal
  surface as an internal readiness matrix.
- Production Legal Blockers Surface links to every unresolved blocker and to the
  Stage 11 closure decision only.

No legal surface may create a direct shortcut to Market Readiness, Closed Beta,
Public Launch, billing runtime, Real AI runtime, auth runtime, database writes,
or product behavior changes.

## Mandatory Status Rules

Mandatory before production public use:

- Privacy Surface;
- Terms Surface;
- Legal Identity & Contact Surface;
- AI Transparency Surface;
- Decision Simulation Limitations Surface;
- User Trust Surface;
- Regulatory Readiness Surface;
- Production Legal Blockers Surface.

Mandatory before personal-data production processing:

- Data Processing Surface;
- User Data Controls Surface;
- Consent Surface when consent-based processing is used.

Mandatory before cookies, analytics, or marketing tracking:

- Cookie & Local Storage Surface;
- Consent Surface;
- Privacy Surface update/review.

Mandatory before production auth or real accounts:

- Auth & Account Legal Surface;
- Privacy Surface;
- Terms Surface;
- User Data Controls Surface;
- Data Processing Surface.

Mandatory before billing or subscriptions:

- Subscription & Billing Legal Surface;
- Terms Surface;
- Privacy Surface;
- Legal Identity & Contact Surface;
- Production Legal Blockers Surface.

## Responsibility Deduplication Rules

- Privacy owns user-facing personal-data disclosure; Data Processing owns
  internal processing inventory.
- Cookie & Local Storage owns cookie/storage notice requirements; Consent owns
  consent categories and consent-state dependencies.
- Terms owns user/service obligations; Decision Simulation Limitations owns
  product limitation requirements.
- AI Transparency owns factual AI/runtime truth boundaries; it does not own
  Decision Engine behavior or provider integration.
- User Data Controls owns data-subject-rights workflow requirements; it does
  not own Privacy Policy wording.
- Auth & Account Legal owns account legal readiness; it does not own auth
  runtime.
- Subscription & Billing Legal owns commercial legal blockers; it does not own
  subscription runtime or entitlement enforcement.
- User Trust owns trust claim requirements; it does not own legal policy text or
  security implementation.
- Regulatory Readiness owns readiness mapping; Production Legal Blockers owns
  Stage 11 blocker aggregation.

## Source-of-Truth Hierarchy

1. This Stage 11.2 lock defines the legal-surface registry and ownership map.
2. Future Stage 11 subblocks define requirements for their assigned surfaces.
3. Owner/legal-approved documents become the source of truth for final public
   legal content only after explicit approval.
4. Existing runtime and product state documents remain the source of truth for
   factual product behavior.
5. No public page, placeholder copy, provisional policy, or generated draft may
   supersede the source-of-truth hierarchy.

## Closure Decision

Stage 11.2 Legal Surface Scope & Ownership Lock is complete when:

- the legal surface registry is defined;
- ownership and engineering responsibility are assigned per surface;
- source-of-truth hierarchy is defined;
- mandatory, conditional, public, production, and internal statuses are
  recorded;
- dependency links between surfaces are recorded;
- duplicate responsibility boundaries are explicitly blocked;
- no legal document text is written;
- no runtime, UI, API, simulator, Decision Engine, AI, auth, database, or
  subscription behavior is changed.

Completion status: accepted as documentation-only architecture lock.

Next implementation subblock: Stage 11.3 Privacy & Data Processing Scope
Foundation.
