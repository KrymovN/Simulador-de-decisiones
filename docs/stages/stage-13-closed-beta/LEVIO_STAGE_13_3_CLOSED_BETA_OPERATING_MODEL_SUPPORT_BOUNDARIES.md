# LEVIO STAGE 13.3 - CLOSED BETA OPERATING MODEL & SUPPORT BOUNDARIES

Date: 5 July 2026, Europe/Madrid.

Status: Complete as documentation-only operating model and support boundary
definition.

## Purpose

Stage 13.3 defines how a later Closed Beta may be operated if a separate
execution gate approves it. It also defines the support boundary, role
responsibilities, escalation limits, feedback constraints, and incident-handling
constraints that must remain true before any beta execution decision.

This document defines:

- Closed Beta operating model;
- support boundaries;
- allowed and disallowed beta operations;
- roles, responsibilities, and escalation boundaries;
- feedback, support, and incident-handling limits;
- continuing dependencies and Accepted Deferrals;
- the next bounded Stage 13 subblock.

Stage 13.3 does not start a Closed Beta, invite participants, create support
infrastructure, implement feedback tooling, collect beta data, enable accounts,
enable persistence, add analytics, add tracking, add logging, change runtime
behavior, change UI, change API, connect Real AI, or open Production Release,
Public Launch, Commercial Launch, or Scale.

## Immutable Architecture

Stage 13.3 preserves the existing Levio architecture:

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

Stage 13.3 depends on the current canonical roadmap state:

- Stage 10 Product Quality Hardening is closed;
- Stage 11 Legal & Trust Layer is closed;
- Stage 12 Market Readiness is closed;
- Stage 13.1 Closed Beta Scope & Entry Lock is complete;
- Stage 13.2 Closed Beta Participants & Eligibility is complete;
- Closed Beta execution remains unopened.

Stage 13.3 uses Stage 13.1 and Stage 13.2 as the source of truth for Closed
Beta scope, participant eligibility, exclusions, and explicit non-changes.

## Operating Model

A later Closed Beta may only be planned as a small, controlled, manually
supervised readiness exercise. It is not a production launch, public launch,
commercial launch, growth campaign, self-serve release, or scale event.

The operating model is:

1. Manual Entry Control.
   Any future participant access must be individually approved by the project
   owner under the Stage 13.2 eligibility rules. No public self-serve entry,
   open waitlist, marketing funnel, or automated onboarding is permitted by
   Stage 13.3.

2. Deterministic-Preview Product Boundary.
   Any future beta evaluation must remain limited to the approved
   deterministic-preview public simulator baseline unless a later approved
   roadmap block changes that boundary.

3. Low-Risk Scenario Constraint.
   Participants may be directed only toward fictional, test, or low-risk
   scenarios. High-impact, professional-advice, regulated, sensitive, or
   personal-dependency scenarios remain excluded.

4. Manual Feedback Intake.
   Feedback may be planned only as a later manual process. Stage 13.3 does not
   add forms, telemetry, analytics, tracking, logging, session replay,
   fingerprinting, monitoring provider integration, or feedback runtime.

5. Manual Pause / Stop Control.
   A later beta must be pausable or stoppable by the project owner if
   participant confusion, unsafe framing, support overload, legal/trust
   uncertainty, product instability, or Accepted Deferral risk becomes material.

6. No Production Dependency.
   No participant may depend on Levio for production work, professional
   decisions, commercial commitments, account continuity, data recovery,
   support SLAs, or legally significant outcomes.

## Support Boundaries

Stage 13.3 defines support as limited manual readiness handling only.

Allowed support planning:

- acknowledge manually reported confusion or product issues;
- classify issues by product comprehension, participant expectation, trust
  risk, support load, or future implementation dependency;
- request clarification about a reported issue without collecting sensitive
  data;
- pause or stop later beta participation if boundaries are breached;
- record documentation-only evidence categories for a later gate.

Support planning does not include:

- production support;
- SLA commitments;
- account support;
- data recovery;
- billing support;
- subscription support;
- legal advice;
- medical, financial, employment, housing, insurance, education, immigration,
  safety, crisis, or other professional advice;
- regulatory claims;
- compliance claims;
- incident response infrastructure;
- monitoring/logging provider integration;
- helpdesk, ticketing, chat support, or CRM implementation.

## Allowed Beta Operations

Stage 13.3 allows planning for the following future beta operations only:

- manual participant approval under Stage 13.2 eligibility boundaries;
- manual participant orientation using future approved non-legal instructions;
- low-risk deterministic-preview simulator evaluation;
- manual collection of qualitative feedback if separately approved later;
- manual classification of feedback into readiness categories;
- manual pause, stop, or access-withdrawal decisions if a later beta is
  approved;
- documentation-only evidence preparation for later Stage 13 gates.

These allowed operations are planning constraints only. They do not authorize
execution.

## Disallowed Beta Operations

Stage 13.3 does not allow:

- public beta launch;
- active Closed Beta execution;
- participant invitations;
- beta traffic;
- self-serve signup;
- account creation;
- login/auth flows;
- persistence;
- data export, deletion, or account-management runtime;
- billing, checkout, subscriptions, invoices, taxes, refunds, or customer
  portal behavior;
- analytics, marketing attribution, retargeting, tracking, session replay,
  heatmaps, fingerprinting, monitoring, or logging provider integration;
- Real AI, model calls, provider SDKs, API keys, streaming, provider routes, or
  UI AI runtime;
- legal document drafting or publication;
- consent UI, trust UI, AI disclosure UI, disclaimer UI, or cookie banner;
- production support or SLA commitments;
- public launch, production release, commercial launch, or scale.

## Roles And Responsibilities

Stage 13.3 defines role responsibilities for future planning:

1. Project Owner.
   Owns beta boundary decisions, manual approval rules, pause/stop decisions,
   and final readiness interpretation. The project owner may reject, pause, or
   stop any future beta operation that violates Stage 13 boundaries.

2. Product / Simulation Reviewer.
   Reviews product comprehension, deterministic-preview expectations, simulator
   clarity, and Decision Simulation Engine positioning. This role may not
   change runtime, UI, API, simulator behavior, Decision Engine behavior, Prompt
   Context behavior, or AI integration.

3. Support Coordinator.
   Plans manual handling of participant questions and feedback categories. This
   role may not create support tooling, ticketing systems, monitoring, logging,
   analytics, or production support obligations.

4. Trust / Risk Reviewer.
   Identifies trust, legal, data, professional-advice, high-risk, and
   participant-exclusion concerns. This role may not draft legal documents,
   publish legal copy, make compliance claims, or mark Accepted Deferrals
   resolved without a later approved gate.

5. Participant Candidate.
   May only be considered under Stage 13.2 eligibility. Participants do not own
   roadmap decisions, support obligations, product commitments, or beta
   expansion decisions.

## Escalation Boundaries

Escalation in Stage 13.3 means manual readiness review only.

Escalation may be triggered by:

- participant confusion about Levio being a Decision Simulation Engine;
- participant expectation that Levio is AI Chat, an Answer Engine, or a Generic
  AI Assistant;
- attempted high-risk or professional-advice use;
- attempted submission of sensitive personal data, regulated data, credentials,
  secrets, or confidential third-party information;
- support load exceeding manual handling capacity;
- unclear legal, trust, consent, privacy, or data-processing dependency;
- product behavior that threatens the deterministic-preview contract;
- any request for production support, data recovery, billing, account support,
  SLA, or commercial commitment.

Escalation outcomes may include:

- manual clarification request;
- participant exclusion recommendation;
- beta pause recommendation;
- beta stop recommendation;
- accepted-deferral carry-forward recommendation;
- later gate blocker recommendation.

Escalation does not include:

- automated classification;
- runtime gates;
- high-risk runtime classifier implementation;
- incident response infrastructure;
- legal advice;
- compliance approval;
- production release approval;
- public launch approval;
- commercial launch approval.

## Feedback Handling Limits

Stage 13.3 permits only documentation-only feedback planning.

Feedback must remain:

- manual unless later approved otherwise;
- qualitative unless a later approved block defines a data model;
- free of sensitive personal data, secrets, regulated data, and third-party
  personal data;
- limited to readiness categories such as comprehension, usability, trust
  boundary, participant fit, support load, and blocker identification;
- unusable as analytics, marketing attribution, tracking, retargeting,
  performance monitoring, or user profiling.

Stage 13.3 does not implement feedback forms, databases, telemetry, event
schemas, analytics, tracking, logging, dashboards, alerts, or support tooling.

## Incident Handling Limits

Stage 13.3 defines incident handling as a future manual pause/stop readiness
concept only.

Potential future beta incidents include:

- high-risk scenario attempts;
- participant misunderstanding of the product category;
- unsafe reliance on simulator output;
- attempted sensitive data submission;
- legal/trust uncertainty;
- unsupported support demands;
- deterministic-preview contract confusion;
- public launch or commercial readiness misrepresentation.

Permitted Stage 13.3 response planning:

- document incident categories;
- document manual pause/stop expectations;
- document escalation ownership;
- document future gate blockers.

Prohibited Stage 13.3 incident work:

- incident response tooling;
- monitoring/logging provider implementation;
- automated alerts;
- runtime enforcement;
- production operations;
- legal incident procedure drafting;
- public status pages;
- SLA or support commitments.

## Dependencies

Stage 13.3 depends on:

- Stage 10 for deterministic-preview public simulator quality baseline and
  public contract stability;
- Stage 11 for Legal & Trust foundations and unresolved blocker categories;
- Stage 12 for Market Readiness surfaces, evidence inventory, Exit Gate, and
  Remaining Accepted Deferrals;
- Stage 13.1 for Closed Beta scope and entry lock;
- Stage 13.2 for participant eligibility, exclusions, and responsibilities.

Stage 13.3 does not modify any completed dependency.

## Accepted Deferrals Continuing After Stage 13.3

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

These Accepted Deferrals do not block Stage 13.3 documentation work. They
continue to block beta execution, production release, public launch, commercial
launch, or scale until a later approved gate resolves them or explicitly
carries them forward.

## Explicit Non-Changes

Stage 13.3 does not change:

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

Stage 13.3 does not create:

- active Closed Beta;
- beta users;
- participant invitations;
- beta traffic;
- participant data collection;
- feedback tooling;
- support tooling;
- incident tooling;
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

Stage 13.3 is complete when:

- Closed Beta operating model is documented;
- support boundaries are documented;
- allowed and disallowed beta operations are documented;
- roles, responsibilities, and escalation boundaries are documented;
- feedback handling limits are documented;
- support and incident-handling limits are documented;
- dependencies from Stage 10, Stage 11, Stage 12, Stage 13.1, and Stage 13.2
  are documented;
- continuing Accepted Deferrals are documented;
- explicit non-changes are documented;
- exactly one next bounded Stage 13 subblock is identified;
- canonical state documents reference this Stage 13.3 operating model and
  support boundary definition.

## Next Bounded Stage 13 Subblock

Next bounded subblock: Stage 13.4 Closed Beta Test Scenarios & Success
Criteria.

Stage 13.4 should define Closed Beta test scenario categories, mandatory
scenario checks, per-scenario success criteria, excluded scenarios, and whole
Closed Beta success criteria. Stage 13.4 must remain documentation-only until
separately approved and must not open beta execution, runtime, UI, API, legal,
data, commercial, analytics, tracking, logging, support, or infrastructure
implementation.
