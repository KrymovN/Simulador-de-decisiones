# LEVIO STAGE 13.2 - CLOSED BETA PARTICIPANTS & ELIGIBILITY

Date: 5 July 2026, Europe/Madrid.

Status: Complete as documentation-only participant and eligibility definition.

## Purpose

Stage 13.2 defines who may be considered for a later Closed Beta decision and
which participant classes must remain excluded.

This document defines:

- participant categories for Closed Beta planning;
- admission criteria;
- limitations for each participant category;
- participant responsibilities and expectations;
- excluded participant groups;
- dependencies from previously closed stages;
- Accepted Deferrals that continue to constrain Closed Beta execution;
- the next bounded Stage 13 subblock.

Stage 13.2 does not invite participants, run a beta, collect beta data, create
accounts, enable persistence, add analytics, add tracking, add logging, change
runtime behavior, change UI, change API, connect Real AI, or open Production
Release, Public Launch, Commercial Launch, or Scale.

## Immutable Architecture

Stage 13.2 preserves the existing Levio architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Levio remains a Decision Simulation Engine.

Levio is not:

- AI Chat;
- Answer Engine;
- Generic AI Assistant.

AI remains an internal component, not the product surface.

## Source Position

Stage 13.2 depends on the current canonical roadmap state:

- Stage 10 Product Quality Hardening is closed;
- Stage 11 Legal & Trust Layer is closed;
- Stage 12 Market Readiness is closed;
- Stage 13.1 Closed Beta Scope & Entry Lock is complete;
- Closed Beta execution remains unopened.

Stage 13.2 uses Stage 13.1 as the entry lock for Closed Beta planning and does
not expand the roadmap beyond the approved Stage 13 boundary.

## Participant Category Model

Stage 13.2 defines the following Closed Beta participant categories for future
planning only.

### Category A - Internal Project Reviewers

Purpose:

- verify that Closed Beta expectations stay aligned with the approved product,
  roadmap, architecture, and state documents;
- review participant understanding before any external access is considered;
- identify gaps in support, pause, and feedback handling.

Admission criteria:

- direct project responsibility or explicit owner approval;
- understanding that Levio is a deterministic-preview Decision Simulation
  Engine;
- ability to review without treating the product as production software.

Limitations:

- may not represent Stage 13.2 as an active beta;
- may not invite third parties;
- may not add implementation, instrumentation, tracking, logging, or runtime
  behavior;
- may not rely on simulator output for real decisions.

### Category B - Product Comprehension Reviewers

Purpose:

- assess whether Levio's simulator flow, positioning, and non-AI-chat framing
  are understandable;
- identify language, expectation, and trust risks before any beta execution;
- provide qualitative feedback on comprehension only.

Admission criteria:

- able to evaluate product comprehension in low-risk scenarios;
- accepts deterministic-preview limitations;
- does not require account, persistence, Real AI, analytics, tracking, or
  production support.

Limitations:

- may use only fictional, test, or low-risk scenarios;
- may not submit sensitive personal data;
- may not treat results as advice, recommendations, or final answers;
- may not use Levio for medical, legal, financial, employment, housing,
  insurance, education, safety, crisis, or other high-impact decisions.

### Category C - Trusted Low-Risk External Testers

Purpose:

- test whether a small controlled audience can understand and use the existing
  deterministic-preview surface within explicit constraints;
- surface usability, expectation, and support questions before any execution
  gate;
- validate whether participant instructions are sufficient.

Admission criteria:

- individually approved by the project owner;
- adult participant with capacity to understand limitations;
- agrees to use only low-risk, non-sensitive scenarios;
- accepts that no account, persistence, billing, analytics, tracking, logging,
  Real AI, SLA, or production support is available.

Limitations:

- no public self-service access;
- no paid use;
- no commercial procurement, enterprise evaluation, or production dependency;
- no use for professional advice, regulated decisions, sensitive data, or
  high-risk personal outcomes;
- no redistribution, public launch claims, or marketing representation.

### Category D - Operational Readiness Reviewers

Purpose:

- evaluate the future manual support, pause, stop, issue triage, and feedback
  handling model;
- identify owner responsibilities and response boundaries;
- verify whether a later Closed Beta can be controlled without analytics,
  tracking, or logging implementation.

Admission criteria:

- operational or support responsibility approved by the project owner;
- understands that support boundaries are planning-only at Stage 13.2;
- accepts that no production incident process is opened by this document.

Limitations:

- may not create support infrastructure;
- may not add ticketing, monitoring, logging, analytics, or tracking runtime;
- may not promise response times, SLAs, data recovery, or production support;
- may not open a public support channel.

### Category E - Legal, Trust, and Risk Review Candidates

Purpose:

- review participant suitability boundaries, exclusion rules, trust risks, and
  unresolved Accepted Deferrals before beta execution is considered;
- identify blockers that must be resolved or carried forward by later gates.

Admission criteria:

- explicitly approved as a reviewer candidate;
- reviews readiness boundaries only;
- accepts that Stage 13.2 does not draft legal documents or create legal copy.

Limitations:

- may not produce Privacy Policy, Terms, Cookie Policy, AI Disclaimer, legal
  prose, compliance claims, or public trust copy inside Stage 13.2;
- may not approve production release, public launch, commercial launch, or
  scale;
- may not mark Accepted Deferrals resolved without a later approved roadmap
  block.

## General Admission Criteria

Any future Closed Beta participant candidate must satisfy all criteria below
before a later execution gate may consider access:

- participant is individually selected and controlled;
- participant is able to understand that Levio is not an AI Chat, Answer
  Engine, Generic AI Assistant, or professional-advice product;
- participant accepts deterministic-preview behavior and mock-only public
  contract limitations where applicable;
- participant can use fictional, test, or low-risk scenarios only;
- participant does not need account creation, persistence, data recovery,
  billing, subscriptions, analytics, tracking, logging, Real AI, provider
  execution, or production support;
- participant agrees not to submit sensitive personal data, secrets, regulated
  data, or high-impact decision material;
- participant understands that feedback may be requested manually later, but
  Stage 13.2 does not collect beta feedback or implement feedback tooling;
- participant accepts stop, pause, exclusion, or access withdrawal if later
  beta controls require it.

## Excluded Participant Groups

The following groups are excluded from Closed Beta planning unless a later
approved roadmap block explicitly changes the boundary:

- minors;
- vulnerable users or users seeking crisis, medical, legal, financial,
  insurance, employment, housing, education, safety, immigration, government
  benefit, or other high-impact decision support;
- users seeking professional advice, final recommendations, automated
  decisions, or authoritative answers;
- users intending to submit sensitive personal data, regulated data, secrets,
  credentials, confidential business information, or third-party personal data;
- users who require accounts, persistence, history, data export, deletion
  workflows, billing, subscriptions, enterprise procurement, SLAs, production
  support, or data recovery;
- users who require Real AI, model calls, provider execution, streaming, API
  keys, provider SDKs, or AI-chat behavior;
- public traffic, social traffic, press audiences, influencer audiences,
  marketing campaigns, advertising audiences, or open waitlist traffic;
- commercial prospects expecting production readiness, paid conversion,
  checkout, invoicing, tax handling, refunds, or customer portal behavior;
- users unwilling to accept pause, stop, access withdrawal, no-advice
  boundaries, and deterministic-preview limitations.

## Participant Responsibilities And Expectations

Any future Closed Beta participant candidate must be expected to:

- use only low-risk, non-sensitive, fictional, or test scenarios;
- avoid personal secrets, credentials, regulated information, or third-party
  personal data;
- treat simulator output as exploratory simulation, not advice or a final
  answer;
- report confusion, usability problems, expectation mismatch, unsafe framing,
  or support issues through a later approved manual feedback path only;
- stop using the beta if asked by the project owner or if a pause/stop
  condition is triggered later;
- avoid public claims that Levio is launched, production-ready, commercially
  available, or AI-advice software;
- understand that no SLA, production support, data recovery, account support,
  billing support, or commercial service exists during Stage 13.2.

## Dependencies

Stage 13.2 depends on:

- Stage 10 for deterministic-preview product quality baseline and public
  contract stability;
- Stage 11 for Legal & Trust surface foundations and blocker categories;
- Stage 12 for Market Readiness surfaces, evidence inventory, Exit Gate, and
  Remaining Accepted Deferrals;
- Stage 13.1 for Closed Beta boundaries, goals, entry criteria, and explicit
  non-changes.

Stage 13.2 does not modify any completed dependency.

## Accepted Deferrals Continuing After Stage 13.2

The following Accepted Deferrals continue to constrain later beta execution:

- Privacy / Personal Data Processing;
- Data-Subject Rights / User Data Controls;
- Cookies / Local Storage / Consent;
- Terms / Acceptable Use / Consumer Transparency;
- AI Transparency / Decision Simulation Disclaimer;
- High-Risk / Professional-Advice Boundary;
- Security / Abuse / Operational Trust;
- Legal Identity / Contact / Support;
- Production Legal Blockers / Stage 12 Gate;
- production auth/account/persistence runtime;
- subscription, billing, checkout, paid-plan, tax, refund, and commercial
  runtime;
- analytics, marketing, tracking, retargeting, session replay, heatmaps, and
  fingerprinting runtime;
- Real AI provider execution, model calls, streaming, provider routes, and UI
  AI runtime;
- production monitoring/logging provider integration;
- high-risk runtime classifier/gate/escalation behavior.

These Accepted Deferrals do not block Stage 13.2 documentation work. They
continue to block beta execution, production release, public launch, commercial
launch, or scale until a later approved gate resolves them or explicitly
carries them forward.

## Explicit Non-Changes

Stage 13.2 does not change:

- runtime;
- UI;
- API;
- Decision Engine;
- Simulator;
- Prompt Context;
- AI Integration;
- Auth;
- Database;
- Billing;
- Analytics;
- Tracking;
- Logging;
- infrastructure;
- product behavior;
- architecture;
- roadmap.

Stage 13.2 does not create:

- active Closed Beta;
- beta users;
- participant invitations;
- beta traffic;
- participant data collection;
- feedback tooling;
- support tooling;
- Production Release;
- Public Launch;
- Commercial Launch;
- legal documents;
- consent UI;
- trust UI;
- AI disclosure UI;
- disclaimer UI;
- Real AI provider calls;
- provider SDK connection;
- API keys;
- model calls;
- fetch calls.

## Completion Criteria

Stage 13.2 is complete when:

- participant categories are documented;
- admission criteria are documented;
- limitations for each participant category are documented;
- participant responsibilities and expectations are documented;
- excluded participant groups are documented;
- dependencies from Stage 10, Stage 11, Stage 12, and Stage 13.1 are
  documented;
- continuing Accepted Deferrals are documented;
- explicit non-changes are documented;
- exactly one next bounded Stage 13 subblock is identified;
- canonical state documents reference this Stage 13.2 participant and
  eligibility definition.

## Next Bounded Stage 13 Subblock

Next bounded subblock: Stage 13.3 Closed Beta Operating Model & Support
Boundaries.

Stage 13.3 should define the future Closed Beta operating model, manual support
boundaries, pause/stop rules, issue handling expectations, and non-runtime
feedback-routing constraints. Stage 13.3 must remain documentation-only until
separately approved and must not open beta execution, runtime, UI, API, legal,
data, commercial, analytics, tracking, logging, support, or infrastructure
implementation.
