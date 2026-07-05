# LEVIO STAGE 13.1 - CLOSED BETA SCOPE & ENTRY LOCK

Date: 5 July 2026, Europe/Madrid.

Status: Complete as documentation-only scope and entry lock.

## Purpose

Stage 13.1 opens Stage 13 - Closed Beta only as a bounded documentation and
readiness planning block.

This document defines:

- Stage 13 boundaries;
- Closed Beta goals;
- what is included in Closed Beta;
- what is not included in Closed Beta;
- dependencies from Stage 10, Stage 11, and Stage 12;
- entry criteria for Closed Beta planning;
- Accepted Deferrals carried forward from Stage 12;
- the next bounded Stage 13 subblock.

Stage 13.1 does not start a Closed Beta. It does not open beta users, beta
traffic, production release, public launch, commercial launch, runtime changes,
UI changes, API changes, data changes, billing, analytics, tracking, logging,
or Real AI execution.

## Immutable Architecture

Stage 13 must preserve the existing Levio architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

Levio remains a Decision Simulation Engine.

Levio is not:

- AI Chat;
- Answer Engine;
- Generic AI Assistant.

AI remains an internal component, not the product surface.

## Stage 13 Boundary

Stage 13 is the Closed Beta roadmap block.

Its approved scope is controlled preparation for a later limited beta decision.
Stage 13 may define readiness, gates, participant constraints, risk controls,
evidence, support expectations, beta operating rules, and decision criteria.

Stage 13 does not by itself authorize beta execution.

Stage 13 may define:

- Closed Beta goals;
- Closed Beta entry criteria;
- participant eligibility boundaries;
- beta operating model;
- risk and support requirements;
- data, privacy, trust, consent, and legal readiness dependencies;
- quality and rollback expectations;
- Accepted Deferrals that must be resolved or explicitly carried forward by
  later beta gates;
- next bounded Stage 13 subblocks.

Stage 13 does not open:

- Production Release;
- active Closed Beta users or beta traffic;
- Public Launch;
- Commercial Launch;
- Scale;
- Real AI runtime;
- production auth/account/persistence runtime;
- production billing/subscription runtime;
- analytics, tracking, marketing, retargeting, monitoring, or logging provider
  runtime;
- legal document drafting, publication, or legal copy;
- consent UI, trust UI, AI disclosure UI, or disclaimer UI.

## Closed Beta Goals

Closed Beta goals are readiness and learning goals only:

- validate whether the deterministic-preview simulator is understandable to a
  small controlled audience;
- validate whether Levio's positioning as a Decision Simulation Engine is clear;
- identify usability, comprehension, and trust risks before any public launch;
- validate support and feedback workflows before any broader release;
- assess whether unresolved legal, data, trust, operational, and product risks
  can be managed within a limited beta boundary;
- define evidence needed before a later beta execution decision.

Closed Beta goals are not commercial goals. Stage 13.1 does not target revenue,
paid conversion, growth, scale, marketing attribution, production launch, or
public adoption.

## Included in Closed Beta Planning

Stage 13 may plan the following surfaces:

1. Participant Scope.
   Define who may be considered for a future closed beta, why, and under what
   constraints.

2. Eligibility and Exclusion Rules.
   Define participant fit, non-fit, high-risk exclusion, professional-advice
   boundaries, and unsuitable-use boundaries.

3. Beta Operating Model.
   Define how a later beta would be run, supported, monitored, paused, or
   stopped.

4. Product Scope.
   Define which existing product surfaces may be evaluated during a later beta.

5. Data and Privacy Readiness.
   Define what data risks, controls, disclosures, and deferrals must be handled
   before any beta execution.

6. Legal and Trust Readiness.
   Define legal/trust blockers, review needs, and user-understanding
   requirements before any beta execution.

7. Quality and Rollback Readiness.
   Define minimum quality, safety, support, rollback, and incident expectations
   before any beta execution.

8. Feedback and Evidence Collection.
   Define what feedback may be collected later and how it must avoid analytics,
   tracking, or logging implementation unless separately approved.

9. Exit and Continuation Gates.
   Define what evidence would be required to continue, pause, close, or expand
   a later beta.

## Excluded From Closed Beta Planning

Stage 13.1 does not include:

- running a beta;
- inviting participants;
- collecting user data;
- enabling accounts;
- enabling persistence;
- changing `/api/simulate`;
- changing simulator behavior;
- changing Decision Engine behavior;
- changing Prompt Context behavior;
- connecting AI Provider runtime;
- adding Real AI;
- changing UI;
- adding consent UI;
- adding trust UI;
- adding AI disclosure UI;
- adding disclaimer UI;
- drafting or publishing legal documents;
- adding billing or subscriptions;
- adding analytics, tracking, monitoring, or logging providers;
- creating launch copy;
- changing infrastructure.

## Dependencies From Stage 10

Stage 13 depends on the Stage 10 Product Quality Hardening closure baseline:

- deterministic-preview public simulator baseline;
- public `/api/simulate` contract stability;
- Public Simulator quality gates;
- Public Home quality gates;
- DecisionContext Builder quality gate;
- Simulation Pipeline Runner quality gate;
- SimulationResponse Public Adapter quality gate;
- deterministic runtime observability / rollback semantics baseline;
- deterministic runtime security boundary / abuse protection baseline;
- rendered public surface regression baseline;
- Stage 10 Closure Aggregate Gate / Documentation Lock.

Stage 13.1 does not add new Stage 10 quality gates and does not change any
Stage 10 runtime, API, UI, or product behavior.

## Dependencies From Stage 11

Stage 13 depends on the closed Stage 11 Legal & Trust Layer:

- Legal Surface Scope & Ownership Lock;
- Privacy & Data Processing Scope Foundation;
- Terms & Acceptable Use Scope Foundation;
- Cookies & Consent Scope Foundation;
- AI Transparency & Decision Simulation Disclaimer Foundation;
- User Trust Surface Requirements Foundation;
- Regulatory Readiness Matrix;
- Legal Review Packet & Drafting Handoff;
- Production Legal Blockers Closure Gate.

Stage 13.1 does not draft legal documents, legal copy, public trust copy,
consent text, AI disclaimer text, or compliance claims.

## Dependencies From Stage 12

Stage 13 depends on Stage 12 Closed:

- Stage 12.1 Scope & Entry Lock;
- Stage 12.2 Market Readiness Surfaces Definition;
- Stage 12.3 Dependencies & Execution Order;
- Stage 12.4 Evidence Inventory & Dependency Map;
- Stage 12.5 Completion Criteria & Exit Gate;
- Stage 12.6 Closure Gate.

Stage 12 closed as a documentation-only Market Readiness roadmap stage. Stage
13 uses Stage 12 as the source of truth for readiness surfaces, evidence,
Accepted Deferrals, and closure status.

## Closed Beta Entry Criteria

Stage 13 planning may proceed only if all criteria below remain true:

- Stage 10 is complete;
- Stage 11 is complete;
- Stage 12 is closed;
- the working public simulator baseline remains deterministic-preview only;
- Levio remains a Decision Simulation Engine;
- the immutable architecture is preserved;
- no beta execution is started by Stage 13.1;
- no runtime, UI, API, Decision Engine, Simulator, Prompt Context, AI
  Integration, Auth, Database, Billing, Analytics, Tracking, or Logging change
  is introduced by Stage 13.1;
- Stage 13.1 records the Accepted Deferrals carried forward from Stage 12;
- exactly one next bounded Stage 13 subblock is identified.

## Accepted Deferrals Carried From Stage 12

The following Accepted Deferrals carry forward into Stage 13:

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

These Accepted Deferrals do not block Stage 13.1 documentation work. They do
block later beta execution, production, public, commercial, launch, or scale
decisions until a later approved gate resolves them or explicitly carries them
forward.

## Explicit Non-Changes

Stage 13.1 does not change:

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
- architecture.

Stage 13.1 does not create:

- active Closed Beta;
- beta users;
- beta traffic;
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

Stage 13.1 is complete when:

- Stage 13 boundaries are documented;
- Closed Beta goals are documented;
- included and excluded Closed Beta surfaces are documented;
- dependencies from Stage 10, Stage 11, and Stage 12 are documented;
- Closed Beta entry criteria are documented;
- Accepted Deferrals carried from Stage 12 are documented;
- explicit non-changes are documented;
- exactly one next bounded Stage 13 subblock is identified;
- canonical state documents reference this Stage 13.1 scope and entry lock.

## Next Bounded Stage 13 Subblock

Next bounded subblock: Stage 13.2 Closed Beta Participant Scope & Operating
Model.

Stage 13.2 should define participant categories, eligibility, exclusion rules,
support ownership, feedback workflow, operating constraints, stop/pause rules,
and evidence needed before any later beta execution decision. Stage 13.2 must
remain documentation-only until separately approved.
