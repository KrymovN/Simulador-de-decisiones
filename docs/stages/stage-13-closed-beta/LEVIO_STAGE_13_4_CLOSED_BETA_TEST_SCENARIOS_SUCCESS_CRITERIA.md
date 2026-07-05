# LEVIO STAGE 13.4 - CLOSED BETA TEST SCENARIOS & SUCCESS CRITERIA

Date: 5 July 2026, Europe/Madrid.

Status: Complete as documentation-only test scenario and success criteria
definition.

## Purpose

Stage 13.4 defines the scenario categories, mandatory scenario checks, per
scenario success criteria, and whole Closed Beta success criteria that may be
used by a later separately approved Closed Beta execution gate.

This document defines:

- Closed Beta test scenario categories;
- mandatory scenario checks;
- success criteria for each scenario category;
- excluded scenario classes;
- whole Closed Beta success criteria;
- continuing dependencies and Accepted Deferrals;
- the next bounded Stage 13 subblock.

Stage 13.4 does not execute beta testing, invite participants, collect beta
data, add test tooling, add feedback tooling, add analytics, add tracking, add
logging, change runtime behavior, change UI, change API, connect Real AI, or
open Production Release, Public Launch, Commercial Launch, or Scale.

## Immutable Architecture

Stage 13.4 preserves the existing Levio architecture:

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

Stage 13.4 depends on the current canonical roadmap state:

- Stage 10 Product Quality Hardening is closed;
- Stage 11 Legal & Trust Layer is closed;
- Stage 12 Market Readiness is closed;
- Stage 13.1 Closed Beta Scope & Entry Lock is complete;
- Stage 13.2 Closed Beta Participants & Eligibility is complete;
- Stage 13.3 Closed Beta Operating Model & Support Boundaries is complete;
- Closed Beta execution remains unopened.

Stage 13.4 uses Stage 13.1, Stage 13.2, and Stage 13.3 as the source of truth
for Closed Beta scope, participant eligibility, operating boundaries, support
limits, and explicit non-changes.

## Test Scenario Categories

Stage 13.4 defines the following Closed Beta test scenario categories for later
planning only.

1. Product Positioning Comprehension.
   Verifies whether a participant understands that Levio is a Decision
   Simulation Engine and not AI Chat, an Answer Engine, or a Generic AI
   Assistant.

2. Low-Risk Decision Simulation.
   Verifies whether the deterministic-preview simulator can be used for
   fictional, test, or low-risk decision exploration without implying advice or
   final answers.

3. Simulator Flow Comprehension.
   Verifies whether participants can follow the simulator flow, interpret
   states, and understand that output is simulation-oriented.

4. Boundary Recognition.
   Verifies whether participants recognize excluded high-risk, professional
   advice, sensitive data, account, persistence, billing, Real AI, and
   production-support boundaries.

5. Support Expectation Alignment.
   Verifies whether participants understand the limited manual support model,
   no-SLA boundary, no data recovery boundary, and pause/stop possibility.

6. Feedback Readiness.
   Verifies whether future manual feedback can be requested in a way that
   avoids sensitive data, analytics, tracking, logging, profiling, or support
   tooling implementation.

7. Stop / Pause Readiness.
   Verifies whether later beta operations can be paused or stopped when
   participant confusion, unsafe reliance, support overload, or Accepted
   Deferral risk appears.

## Mandatory Scenario Checks

The following scenario checks are mandatory before any later Closed Beta
execution gate can claim scenario readiness.

### Scenario 1 - Product Identity Understanding

Purpose:

- confirm that the participant understands Levio's product category.

Required check:

- participant is presented with Levio as a Decision Simulation Engine and must
  not treat it as AI Chat, an Answer Engine, Generic AI Assistant, advice
  software, or an authoritative decision maker.

Success criteria:

- participant can describe Levio as simulation-oriented;
- participant does not expect conversational AI behavior;
- participant does not expect final answers or recommendations;
- participant accepts that AI is an internal component, not the product surface.

Failure criteria:

- participant expects chat behavior, final answers, professional advice, or
  authoritative recommendations;
- participant treats simulator output as a decision-making substitute.

### Scenario 2 - Low-Risk Simulation Use

Purpose:

- confirm that future beta use can stay within fictional, test, or low-risk
  scenarios.

Required check:

- participant uses or reviews a low-risk scenario that does not involve
  sensitive personal data, regulated domains, professional advice, high-impact
  outcomes, secrets, credentials, or third-party personal data.

Success criteria:

- scenario remains low-risk and non-sensitive;
- participant understands that the result is exploratory simulation;
- participant does not ask Levio to decide, recommend, approve, diagnose,
  predict, score, or judge a high-impact outcome;
- no account, persistence, Real AI, analytics, tracking, logging, or billing
  expectation is introduced.

Failure criteria:

- scenario moves into medical, legal, financial, employment, housing,
  insurance, education, safety, crisis, immigration, government benefit, or
  other high-impact use;
- participant submits or intends to submit sensitive data, secrets,
  credentials, or third-party personal data.

### Scenario 3 - Simulator Flow Comprehension

Purpose:

- confirm that the deterministic-preview simulator flow is understandable.

Required check:

- participant can follow the public simulator flow and understand the simulated
  nature of output without requiring hidden explanations, production support,
  account history, or AI-chat interaction.

Success criteria:

- participant can identify the input, simulation, and output phases;
- participant understands that output is not persisted unless a later approved
  roadmap block creates persistence;
- participant understands that no Real AI provider execution is active;
- participant does not require runtime, UI, API, Prompt Context, Decision
  Engine, Simulator, or AI Integration changes for comprehension.

Failure criteria:

- participant cannot distinguish the simulator from chat;
- participant expects stored history, account continuity, model memory, or
  production workflow support.

### Scenario 4 - Boundary Recognition

Purpose:

- confirm that participant boundaries are understood before a later beta
  execution gate.

Required check:

- participant reviews the beta boundary categories and can identify prohibited
  use classes.

Success criteria:

- participant recognizes high-risk and professional-advice exclusions;
- participant recognizes sensitive data and third-party data exclusions;
- participant recognizes no-account, no-persistence, no-billing, no-analytics,
  no-tracking, no-logging, no-Real-AI, and no-production-support boundaries;
- participant accepts that boundary violations may trigger exclusion, pause, or
  stop decisions.

Failure criteria:

- participant seeks excluded use;
- participant rejects pause/stop, no-advice, no-sensitive-data, or no-production
  limitations.

### Scenario 5 - Support Boundary Understanding

Purpose:

- confirm that support expectations remain compatible with Stage 13.3.

Required check:

- participant understands that future beta support, if separately approved, is
  limited manual readiness handling and not production support.

Success criteria:

- participant does not expect SLA, helpdesk, ticketing, account support, data
  recovery, billing support, subscription support, or legal/professional advice;
- participant understands that support may be limited to manual clarification,
  issue categorization, pause, stop, or exclusion;
- participant accepts that no support tooling is created by Stage 13.4.

Failure criteria:

- participant requires production support or data recovery;
- participant expects commercial support, enterprise support, or SLA behavior.

### Scenario 6 - Manual Feedback Safety

Purpose:

- confirm that future feedback can remain safe and non-instrumented.

Required check:

- participant can provide or plan to provide feedback manually without
  analytics, tracking, logging, telemetry, session replay, profiling, support
  tooling, or sensitive data collection.

Success criteria:

- feedback is limited to qualitative readiness categories;
- feedback avoids sensitive personal data, regulated data, secrets, and
  third-party personal data;
- feedback does not require forms, database storage, event schemas, dashboards,
  monitoring, or tracking;
- feedback can be handled under Stage 13.3 manual support boundaries.

Failure criteria:

- feedback requires instrumentation, user profiling, analytics, tracking,
  logging, or personal data processing not approved by a later roadmap block;
- participant provides sensitive or prohibited data.

### Scenario 7 - Pause / Stop Response

Purpose:

- confirm that a later Closed Beta can be controlled manually.

Required check:

- project owner and reviewers can identify when a future beta should pause,
  stop, exclude a participant, or escalate a readiness blocker.

Success criteria:

- pause/stop triggers are documented and understood;
- escalation remains manual and documentation-only;
- unsafe reliance, high-risk use, sensitive data attempts, support overload,
  legal/trust uncertainty, or product-category confusion can be routed to a
  pause, stop, exclusion, or blocker recommendation;
- no automated classifier, runtime gate, monitoring provider, logging provider,
  incident tooling, or production response process is required.

Failure criteria:

- beta continuation would depend on unresolved high-risk, support, privacy,
  trust, legal, data, or infrastructure work;
- pause/stop ownership is unclear.

## Excluded Scenario Classes

The following scenario classes are excluded from Closed Beta:

- medical, legal, financial, employment, housing, insurance, education, safety,
  immigration, government benefit, crisis, or other high-impact scenarios;
- professional-advice, final-recommendation, automated-decision, scoring,
  ranking, diagnosis, approval, prediction, or eligibility scenarios;
- scenarios containing sensitive personal data, regulated data, secrets,
  credentials, confidential business data, or third-party personal data;
- account, persistence, data export, deletion, recovery, history, memory,
  authentication, or user-data-control scenarios;
- billing, checkout, subscription, invoicing, tax, refund, customer portal, or
  commercial procurement scenarios;
- analytics, marketing attribution, tracking, retargeting, session replay,
  heatmap, fingerprinting, monitoring, or logging scenarios;
- Real AI, model-call, provider SDK, streaming, provider-route, API key, or AI
  chat scenarios;
- production release, public launch, commercial launch, scale, SLA, support
  desk, or enterprise-support scenarios.

## Whole Closed Beta Success Criteria

A later Closed Beta may be considered successful only if all criteria below are
met by a separately approved execution gate:

- participant access remains controlled and aligned with Stage 13.2;
- operating, support, pause, stop, and escalation boundaries remain aligned
  with Stage 13.3;
- all mandatory scenario categories are reviewed without opening prohibited
  runtime, UI, API, data, support, analytics, tracking, logging, billing, auth,
  persistence, Real AI, production, public launch, commercial, or scale work;
- participants understand Levio as a Decision Simulation Engine;
- participants do not treat Levio as AI Chat, an Answer Engine, Generic AI
  Assistant, professional-advice software, or final decision maker;
- no high-risk, sensitive, regulated, production, commercial, or professional
  advice use is accepted;
- feedback remains manual, qualitative, low-risk, and non-instrumented unless a
  later approved roadmap block changes that boundary;
- any blocker can be carried forward, paused, or escalated without claiming
  production readiness;
- Accepted Deferrals remain explicit and do not get marked resolved by beta
  scenario completion;
- Closed Beta completion does not imply Production Release, Public Launch,
  Commercial Launch, or Scale.

## Dependencies

Stage 13.4 depends on:

- Stage 10 for deterministic-preview public simulator quality baseline and
  public contract stability;
- Stage 11 for Legal & Trust foundations and unresolved blocker categories;
- Stage 12 for Market Readiness surfaces, evidence inventory, Exit Gate, and
  Remaining Accepted Deferrals;
- Stage 13.1 for Closed Beta scope and entry lock;
- Stage 13.2 for participant eligibility, exclusions, and responsibilities;
- Stage 13.3 for operating model, support boundaries, feedback limits, and
  incident-handling limits.

Stage 13.4 does not modify any completed dependency.

## Accepted Deferrals Continuing After Stage 13.4

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

These Accepted Deferrals do not block Stage 13.4 documentation work. They
continue to block beta execution, production release, public launch, commercial
launch, or scale until a later approved gate resolves them or explicitly
carries them forward.

## Explicit Non-Changes

Stage 13.4 does not change:

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

Stage 13.4 does not create:

- active Closed Beta;
- beta users;
- participant invitations;
- beta traffic;
- participant data collection;
- test tooling;
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

Stage 13.4 is complete when:

- Closed Beta test scenario categories are documented;
- mandatory scenario checks are documented;
- success criteria for each scenario category are documented;
- excluded scenario classes are documented;
- whole Closed Beta success criteria are documented;
- dependencies from Stage 10, Stage 11, Stage 12, Stage 13.1, Stage 13.2, and
  Stage 13.3 are documented;
- continuing Accepted Deferrals are documented;
- explicit non-changes are documented;
- exactly one next bounded Stage 13 subblock is identified;
- canonical state documents reference this Stage 13.4 test scenario and
  success criteria definition.

## Next Bounded Stage 13 Subblock

Next bounded subblock: Stage 13.5 Closed Beta Feedback & Evidence Collection.

Stage 13.5 should define the future manual feedback categories, evidence
inventory, evidence acceptance criteria, and feedback-to-evidence mapping for a
later separately approved Closed Beta execution gate. Stage 13.5 must remain
documentation-only until separately approved and must not open beta execution,
runtime, UI, API, legal, data, commercial, analytics, tracking, logging,
support, or infrastructure implementation.
