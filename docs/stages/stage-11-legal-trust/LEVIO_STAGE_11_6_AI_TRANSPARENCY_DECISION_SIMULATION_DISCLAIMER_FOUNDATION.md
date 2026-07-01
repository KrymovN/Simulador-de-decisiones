# Levio Stage 11.6 - AI Transparency & Decision Simulation Disclaimer Foundation

Date: 1 July 2026, Europe/Madrid.

Status: Complete as documentation-only architecture foundation.

This document defines the architectural boundaries for AI Transparency and
Decision Simulation Disclaimer surfaces for Levio.es. It does not write, draft,
approve, or imply AI Disclaimer, legal disclaimer text, Terms text, Privacy
text, UI copy, user notices, modal text, page text, or legal prose. It does not
change runtime, UI, API, simulator, Decision Engine, AI integration, auth,
database, subscriptions, billing, analytics, logging, or product behavior.

## Scope Boundary

Stage 11.6 covers:

- AI Transparency surfaces that exist or may appear in Levio;
- Decision Simulation Disclaimer surfaces that exist or may appear in Levio;
- where users must understand that Levio is not AI Chat, Answer Engine,
  financial advisor, medical advisor, legal advisor, or other professional
  advisor;
- where the AI Provider role must be explained as an internal component;
- where the Decision Engine and Simulator roles must be explained;
- production-launch mandatory transparency and disclaimer requirements;
- future-only AI transparency requirements;
- high-risk decision warning requirements;
- uncertainty, scenarios, probabilities, risks, tradeoffs, and outcomes warning
  requirements;
- required links to Terms, Privacy, Data Processing, Cookies, User Trust, User
  Data Controls, and Regulatory Readiness surfaces;
- boundary between product positioning, legal disclaimer, and UI explanation;
- surfaces blocked until legal review;
- deferred and future-only surfaces.

Stage 11.6 does not:

- create AI Disclaimer text;
- create legal disclaimer text;
- create Terms text;
- create Privacy text;
- create UI copy;
- create user-facing notices;
- create modal text;
- create route/page text;
- implement runtime disclaimers;
- implement AI Provider runtime;
- modify deterministic simulator behavior;
- modify `/api/simulate`;
- approve Market Readiness, Closed Beta, Public Launch, Real AI runtime, or
  production professional-advice positioning.

## Source-of-Truth Inputs

Stage 11.6 depends on:

- Stage 11.2 Legal Surface Scope & Ownership Lock;
- Stage 11.3 Privacy & Data Processing Scope Foundation;
- Stage 11.4 Terms & Acceptable Use Scope Foundation;
- Stage 11.5 Cookies & Consent Scope Foundation;
- Stage 10 Product Quality Hardening closure baseline;
- Stage 5.4 AI Integration Foundation Complete / Real AI Runtime Deferred;
- current `/api/simulate` public contract:
  `contractVersion: "simulate-api-v1-mock"`, `mockOnly=true`,
  `safeRender=true`, `apiReady=true`;
- current deterministic preview runtime marker:
  `deterministic-engine-preview`;
- immutable product invariant that Levio is a Decision Simulation Engine, not
  AI Chat, Answer Engine, or Generic AI Assistant.

No public page, provisional legal page, placeholder copy, generated disclaimer,
implementation assumption, provider claim, model claim, or UI label may
supersede this scope foundation.

## Transparency Boundary Model

Levio transparency and disclaimer surfaces belong to one of seven zones:

1. Product Positioning.
   Explains what Levio is and is not as a product category.
2. Simulator Explanation.
   Explains the user's interaction surface and public decision-simulation
   workflow.
3. Decision Engine Explanation.
   Explains deterministic scenario, risk, tradeoff, uncertainty, and outcome
   structure.
4. AI Provider Explanation.
   Explains the future internal provider role and current Real AI deferral.
5. Legal Disclaimer.
   Covers legal/professional-advice limitations and high-risk use boundaries.
6. UI Explanation.
   Covers future factual UI text, labels, helper copy, status indicators, and
   explanatory elements.
7. Regulatory Evidence.
   Covers internal readiness mapping, blockers, review evidence, and future
   legal handoff material.

Stage 11.6 defines architecture requirements only. It does not decide final
wording, UI placement, legal sufficiency, or production readiness.

## AI Transparency Surface Register

### Surface 1 - Product Identity Transparency

Name: Product Identity Transparency.

Current status: active positioning requirement.

Purpose: make the product category clear: Levio is a Decision Simulation
Engine.

Must explain: Levio is not AI Chat, not Answer Engine, not Generic AI
Assistant, not a direct AI-to-user answer wrapper, and not a professional
advisor.

Applies to: public website, home surface, simulator entry points, future legal
pages, future trust surfaces, future onboarding, and future public launch
materials.

Required before production launch: mandatory.

Blocked until legal review: final public wording, legal disclaimer wording, and
any stronger production claim.

### Surface 2 - Deterministic Preview Runtime Transparency

Name: Deterministic Preview Runtime Transparency.

Current status: active public contract requirement.

Purpose: make the current public simulator state clear.

Must explain: current public `/api/simulate` behavior is deterministic preview,
mock-compatible, and not Real AI provider execution.

Applies to: public simulator, public response envelope, result surfaces, local
saved simulations, trust/readiness evidence, and future public documentation.

Required before production launch: mandatory if deterministic preview remains
public.

Blocked until legal review: final user-facing wording and any claim that
deterministic preview is production-grade advice.

### Surface 3 - AI Provider Role Transparency

Name: AI Provider Role Transparency.

Current status: future-only; Real AI runtime deferred.

Purpose: define how a future AI Provider may be described.

Must explain: AI Provider is an internal replaceable component that may supply
controlled candidate material only after explicit approval. It must not be
described as the product, final decision owner, direct respondent, chat agent,
answer engine, or autonomous advisor.

Applies to: future AI Provider documentation, future AI transparency surfaces,
future legal review packet, future provider/data-processing review, and future
UI if Real AI is separately approved.

Required before Real AI public use: mandatory.

Blocked until legal review: provider names, model names, provider capability
claims, model-quality claims, cost/safety claims, data-transfer claims, and any
public statement that Real AI is active.

### Surface 4 - Prompt Context / AI Quality / Controlled Integration Transparency

Name: Prompt Context / AI Quality / Controlled Integration Transparency.

Current status: internal foundation-only.

Purpose: keep internal AI foundations from becoming public AI product claims.

Must explain: Prompt Context, AI Quality, AI Provider abstraction, and
Controlled AI Integration are internal foundations, disabled/deferred as
applicable, and not user-facing AI behavior.

Applies to: internal architecture docs, legal review packet, regulatory
readiness evidence, and future engineering handoff material.

Required before production launch: mandatory as internal evidence if any public
AI-related claim is made.

Blocked until legal review: public wording that mentions internal AI foundations
as active user-facing features.

### Surface 5 - AI Processing of Personal Data Transparency

Name: AI Processing of Personal Data Transparency.

Current status: future-only.

Purpose: define required transparency dependencies if future AI Provider
processing includes personal data, saved simulations, account data, memory, or
profile context.

Must explain: data categories, processing purpose, provider role, external
transfer status, retention expectations, user controls, consent or lawful
processing dependency, and rollback/deletion dependencies before any public AI
processing is opened.

Applies to: future Real AI, future account-saved simulations, future memory,
future personalization, future AI Provider payload records.

Required before Real AI with personal data: mandatory.

Blocked until legal review: any AI data-transfer statement, retention statement,
provider-processing statement, training/fine-tuning statement, or user-control
claim.

### Surface 6 - AI Capability / Limitation Transparency

Name: AI Capability / Limitation Transparency.

Current status: future-only for Real AI, active for no-Real-AI boundary.

Purpose: prevent overclaiming AI capability.

Must explain: no model calls are active in the current state; future AI output,
if approved, must remain candidate material inside the Decision Simulation
Engine flow and must not guarantee correctness, completeness, fairness,
suitability, legality, safety, or outcome prediction.

Applies to: public website, simulator, result surfaces, future AI transparency,
future Terms/AUP dependencies, future legal review packet.

Required before production launch: mandatory for current no-Real-AI truth
boundary.

Blocked until legal review: capability claims, benchmark claims, safety claims,
accuracy claims, and provider/model quality claims.

## Decision Simulation Disclaimer Surface Register

### Surface 1 - Public Simulator Entry Disclaimer Surface

Name: Public Simulator Entry Disclaimer Surface.

Current status: active requirement, content not approved.

Purpose: ensure users understand the simulator is for decision simulation and
structured thinking, not final professional advice.

Must explain: the simulator receives user-provided decision context and returns
structured deterministic preview output. It does not replace professional,
legal, medical, financial, safety, employment, credit, emergency, or other
regulated advice.

Applies to: HomeSimulator entry, future simulator onboarding, future public
simulator legal/trust references.

Required before production launch: mandatory.

Blocked until legal review: exact disclaimer language, placement, prominence,
modal/inline behavior, and high-risk wording.

### Surface 2 - Simulation Result Disclaimer Surface

Name: Simulation Result Disclaimer Surface.

Current status: active requirement, content not approved.

Purpose: ensure users understand scenario outputs, scores, recommendations, and
signals are not predictions or final decisions.

Must explain: results are structured simulation artifacts; scenarios, risk
levels, confidence, probability-like values, tradeoffs, recommendations, and
outcome indicators must be interpreted as decision-support signals, not
guarantees.

Applies to: public result UI, saved local simulations, future account-saved
simulations, future exports, future share/download surfaces.

Required before production launch: mandatory.

Blocked until legal review: exact wording for scenarios, probabilities,
recommendations, confidence, and outcomes.

### Surface 3 - Scenario / Probability / Confidence Disclaimer Surface

Name: Scenario / Probability / Confidence Disclaimer Surface.

Current status: active requirement, content not approved.

Purpose: prevent misinterpretation of numerical or probability-like outputs.

Must explain: confidence, probability, score, risk level, and scenario ranking
are not calibrated forecasts unless a separately approved future model states
otherwise. Current deterministic preview values are comparative structure, not
outcome certainty.

Applies to: scenario cards, result summaries, local saved simulations, detail
views, future account history, future export.

Required before production launch: mandatory if scenario/probability/confidence
values remain visible.

Blocked until legal review: wording that interprets values as forecasts,
probabilities of success, or professional risk scores.

### Surface 4 - Risk / Tradeoff / Outcome Disclaimer Surface

Name: Risk / Tradeoff / Outcome Disclaimer Surface.

Current status: active requirement, content not approved.

Purpose: make the limits of risk, tradeoff, and outcome analysis explicit.

Must explain: risk levels, tradeoffs, costs of error, reversibility, benefits,
and outcome indicators are structured analysis aids, not exhaustive analysis,
professional review, guaranteed mitigation, or complete safety assessment.

Applies to: result surfaces, scenario details, saved simulations, future
account history, future exports, future AI-backed candidate material.

Required before production launch: mandatory.

Blocked until legal review: high-risk/legal/professional wording and any claim
that risks are exhaustive.

### Surface 5 - Recommendation / Suggested Direction Disclaimer Surface

Name: Recommendation / Suggested Direction Disclaimer Surface.

Current status: active requirement, content not approved.

Purpose: prevent a recommendation from being treated as an order, guarantee, or
professional instruction.

Must explain: a recommendation or suggested direction is conditional,
simulation-based, and dependent on user context, missing information,
constraints, and external facts. Users retain responsibility for validation and
action.

Applies to: recommendation cards, result summaries, local saved simulations,
future account history, future exports, future AI-backed candidate material.

Required before production launch: mandatory if recommendations remain visible.

Blocked until legal review: final wording for action-taking, reliance, and
professional advice limitations.

### Surface 6 - High-Risk Decision Disclaimer Surface

Name: High-Risk Decision Disclaimer Surface.

Current status: mandatory requirement, content not approved.

Purpose: establish categories where Levio must not be positioned as final
advice or final decision support.

Must explain: high-risk contexts include at minimum medical, legal, financial,
credit, employment, housing, insurance, education, safety-critical, emergency,
criminal justice, immigration, regulated compliance, and other professional or
rights-affecting decisions.

Applies to: simulator entry, result surfaces, Terms/AUP, future AI
transparency, future regulatory readiness, future public launch review.

Required before production launch: mandatory.

Blocked until legal review: exact category taxonomy, wording, severity,
placement, and whether specific uses must be refused, gated, redirected, or
otherwise handled in a future runtime step.

### Surface 7 - Clarification / Cannot Recommend / Refusal Disclaimer Surface

Name: Clarification / Cannot Recommend / Refusal Disclaimer Surface.

Current status: active contract requirement, content not approved.

Purpose: make fail-close states understandable without exposing internal logic
or converting them into legal advice.

Must explain: when Levio asks for clarification, cannot recommend, or refuses a
request, the product is preserving safety, completeness, or scope boundaries;
it is not making a professional determination.

Applies to: `/api/simulate` fail-close states, HomeSimulator error states,
future saved result handling, future account history.

Required before production launch: mandatory.

Blocked until legal review: exact public wording and escalation/next-step copy.

### Surface 8 - Local Saved Simulation Disclaimer Surface

Name: Local Saved Simulation Disclaimer Surface.

Current status: active requirement, content not approved.

Purpose: ensure locally saved simulation artifacts retain the same limitations
as original public results.

Must explain: local saved simulations are local demo continuity, not account
history, professional record, legal record, or durable advice archive.

Applies to: SimulationsList, SimulationDetailClient, future import/sync review.

Required before production launch: mandatory if local history remains present.

Blocked until legal review: exact copy, retention wording, and data-control
references.

### Surface 9 - Auth / Dashboard Placeholder Disclaimer Surface

Name: Auth / Dashboard Placeholder Disclaimer Surface.

Current status: active placeholder requirement, content not approved.

Purpose: prevent login/register/dashboard placeholders from implying production
account, persistence, memory, AI, or data-control readiness.

Must explain: account, dashboard, profile, security, memory, and saved-data
features are prepared/foundation surfaces unless separately approved.

Applies to: login, register, forgot password, dashboard shell, dashboard
profile/security/memory placeholders, future account surfaces.

Required before production auth: mandatory.

Blocked until legal review: final account/legal wording and any production
account promise.

### Surface 10 - Future AI-Backed Simulation Disclaimer Surface

Name: Future AI-Backed Simulation Disclaimer Surface.

Current status: future-only.

Purpose: define requirements before any future Real AI public simulation.

Must explain: future AI-backed material, if approved, is candidate material
inside a Decision Simulation Engine, not direct advice, chat, final answer, or
autonomous decision. It must remain subject to Decision Engine validation and
post-provider boundaries.

Applies to: future Real AI runtime, future AI Provider output, future AI
transparency, future regulatory readiness.

Required before Real AI public use: mandatory.

Blocked until legal review: all public wording, provider/model claims, data-use
claims, reliance wording, and AI-risk disclosures.

## Role Explanation Requirements

### Simulator Role

The Simulator is the user interaction surface. It collects user-provided
decision context, displays deterministic preview outputs, and may display
future approved explanations. It must not be presented as a professional
advisor, autonomous agent, or final decision maker.

### Decision Engine Role

The Decision Engine structures decision context, scenarios, risks, uncertainty,
tradeoffs, outcomes, and recommendations within the approved product model. It
owns deterministic decision-simulation semantics. It must not be presented as
an oracle, guarantee engine, professional reviewer, or calibrated forecasting
system unless a future approved stage explicitly changes that claim.

### AI Provider Role

The AI Provider is a future internal replaceable component. It may supply
controlled candidate material only after explicit approval. It must not own the
product, final decision semantics, final user-facing answer, legal/professional
judgment, or direct conversation with the user.

### User Role

The user supplies context, evaluates relevance, validates external facts, and
retains responsibility for decisions and actions. This role requirement must be
captured by future Terms, User Trust, and Decision Simulation Disclaimer
surfaces without writing final legal text in Stage 11.6.

## High-Risk Decision Warning Requirements

High-risk warnings must be defined before production public launch for:

- medical or health decisions;
- legal, compliance, or rights-affecting decisions;
- financial, investment, tax, insurance, credit, or debt decisions;
- employment, hiring, termination, promotion, or workplace decisions;
- housing, education, immigration, criminal justice, or public-benefit
  decisions;
- safety-critical, emergency, security, or physical-harm contexts;
- decisions involving minors, vulnerable persons, or significant personal
  impact;
- regulated professional contexts;
- any domain where incorrect reliance may cause material harm.

Stage 11.6 does not decide final legal wording, runtime refusal behavior,
domain classifier behavior, or UI treatment. Those remain blocked until legal
review and separate implementation approval.

## Uncertainty / Scenarios / Probabilities / Risks / Tradeoffs / Outcomes

Future transparency and disclaimer requirements must cover:

- scenario outputs as structured alternatives, not predictions;
- probabilities or probability-like values as uncalibrated unless explicitly
  approved otherwise;
- confidence values as confidence in structure or analysis, not certainty of
  real-world outcome;
- risk levels as comparative risk signals, not exhaustive risk review;
- tradeoffs as structured prompts for evaluation, not complete cost-benefit
  analysis;
- outcome indicators as possible states, not guaranteed results;
- recommendations as conditional simulation outputs, not commands;
- missing information and uncertainty as normal limits of the simulation;
- external facts as outside Levio's verified knowledge unless separately
  sourced and approved.

Any future UI or legal wording for these concepts is blocked until legal review.

## Mandatory for Production Launch

Mandatory before production public launch:

- Product Identity Transparency requirements must be owner/legal-reviewed.
- Deterministic Preview Runtime Transparency must be aligned with the public
  `/api/simulate` contract.
- Public Simulator Entry Disclaimer requirements must be approved.
- Simulation Result Disclaimer requirements must be approved.
- Scenario / Probability / Confidence Disclaimer requirements must be approved
  if such values remain visible.
- Risk / Tradeoff / Outcome Disclaimer requirements must be approved.
- Recommendation / Suggested Direction Disclaimer requirements must be approved
  if recommendations remain visible.
- High-Risk Decision Disclaimer requirements must be approved.
- Clarification / Cannot Recommend / Refusal Disclaimer requirements must be
  approved.
- Local Saved Simulation Disclaimer requirements must be approved if local
  history remains present.
- Auth / Dashboard Placeholder Disclaimer requirements must be approved before
  production account positioning.
- AI Provider Role Transparency must clearly preserve Real AI deferral unless
  Real AI is separately approved.
- Product positioning, legal disclaimer, and UI explanation boundaries must be
  separated.
- Terms, Privacy, Data Processing, Cookies, User Trust, User Data Controls, and
  Regulatory Readiness references must be aligned.
- Production Legal Blockers must confirm unresolved AI/disclaimer blockers do
  not prevent the next roadmap stage.

Mandatory before Real AI public use:

- AI Provider Role Transparency;
- Future AI-Backed Simulation Disclaimer;
- AI Processing of Personal Data Transparency if any personal data is involved;
- AI Capability / Limitation Transparency;
- Privacy/Data Processing provider-transfer review;
- Cookies/Consent review if storage/tracking/personalization is involved;
- Terms/AUP AI restrictions;
- User Trust and Regulatory Readiness review;
- post-provider Decision Engine validation boundary.

## Future-Only / Deferred Requirements

Deferred until separate approval:

- legal AI Disclaimer drafting;
- legal disclaimer text drafting;
- user-facing UI copy;
- modal/banner/interstitial disclaimer behavior;
- dedicated AI transparency page or route;
- Real AI provider public claims;
- provider/model names in public copy;
- model cards, model capability claims, benchmark claims, or safety claims;
- AI processing of personal data;
- permanent memory or personalization explanations;
- AI-backed saved simulations;
- AI-backed exports;
- professional-domain or high-risk runtime gates;
- calibrated probability or forecasting claims;
- closed beta AI disclosure;
- public launch AI disclosure;
- regulatory AI readiness matrix decisions.

Future-only requirements must not be described as active product behavior.

## Required Cross-Surface Links

AI Transparency Surface must link to:

- Terms Surface for acceptable use, responsibility, account, and service
  limitation boundaries;
- Privacy Surface for user-facing disclosure where personal data or AI
  processing is relevant;
- Data Processing Surface for internal data categories, provider transfer,
  purpose, retention, and processor/subprocessor mapping;
- Cookies & Consent Surface if AI processing uses optional storage, tracking,
  memory, personalization, or consent-gated data;
- Decision Simulation Limitations Surface for no-final-advice and high-risk
  decision limitations;
- User Data Controls Surface if saved simulations, account data, memory, or AI
  payload records are retained;
- User Trust Surface for product-readiness honesty and capability claims;
- Regulatory Readiness Surface before production or Real AI launch;
- Production Legal Blockers Surface before Stage 12.

Decision Simulation Limitations Surface must link to:

- Terms Surface;
- AI Transparency Surface;
- Privacy/Data Processing Surface where simulation data is processed or
  retained;
- Cookies & Consent Surface where local history, memory, or optional storage is
  involved;
- User Trust Surface;
- Regulatory Readiness Surface.

These links are dependencies only. Stage 11.6 does not transfer ownership of
Terms, Privacy, Cookies, Data Processing, User Data Controls, User Trust, or
Regulatory Readiness content into the AI Transparency or Disclaimer surfaces.

## Boundary Between Product Positioning, Legal Disclaimer, and UI Explanation

Product positioning defines the product category and factual product state:

- Decision Simulation Engine;
- deterministic preview;
- Real AI deferred;
- not AI Chat;
- not Answer Engine;
- not Generic AI Assistant;
- not professional advisor.

Legal disclaimer defines legal/professional reliance boundaries, high-risk
limitations, user responsibility, and liability/risk allocation. Stage 11.6
does not write that text.

UI explanation defines future interface-level guidance, labels, status
indicators, and explanatory copy. Stage 11.6 does not write or implement UI
copy.

Technical enforcement defines what runtime actually enforces: current payload
validation, fail-close envelopes, deterministic preview contract, and absence of
Real AI provider calls. Technical enforcement must not be overstated as legal
disclaimer coverage.

## Blocked Until Legal Review

Blocked until owner/legal review:

- final AI Disclaimer text;
- final Decision Simulation Disclaimer text;
- simulator-entry disclaimer wording;
- result disclaimer wording;
- high-risk decision category wording;
- scenario/probability/confidence wording;
- recommendation/reliance wording;
- refusal/clarification/cannot-recommend wording;
- AI Provider public explanation;
- provider/model/capability claims;
- legal/professional-advice limitation language;
- dedicated AI transparency page or route;
- UI modal/banner/interstitial disclaimer behavior;
- dashboard/account/persistence/memory AI explanations;
- Real AI public launch wording;
- any claim that Levio provides calibrated probabilities, forecasts, guaranteed
  outcomes, professional advice, or direct answers.

Blocked means no runtime, UI, copy, route, modal, API, provider, or product
behavior may be added until separate legal/owner approval exists.

## Closure Decision

Stage 11.6 AI Transparency & Decision Simulation Disclaimer Foundation is
complete when:

- AI Transparency surfaces are listed;
- Decision Simulation Disclaimer surfaces are listed;
- no-AI-Chat / no-Answer-Engine / no-professional-advisor understanding points
  are defined;
- AI Provider role explanation requirements are defined;
- Decision Engine and Simulator role explanation requirements are defined;
- production-launch mandatory requirements are listed;
- future-only requirements are listed;
- high-risk decision warning requirements are listed;
- uncertainty, scenario, probability, risk, tradeoff, and outcome warning
  requirements are listed;
- cross-surface links are defined;
- product positioning, legal disclaimer, UI explanation, and technical
  enforcement boundaries are separated;
- legal-review-blocked surfaces are listed;
- deferred and future-only surfaces are listed;
- no AI Disclaimer, legal disclaimer text, Terms text, Privacy text, UI copy,
  user notice, modal text, page text, or legal prose is written;
- no runtime, UI, API, simulator, Decision Engine, AI integration, auth,
  database, subscription, billing, analytics, or logging behavior is changed.

Completion status: accepted as documentation-only architecture foundation.

Next implementation subblock: Stage 11.7 User Trust Surface Requirements
Foundation.
