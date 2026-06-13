# LEVIO AI ABSTRACTION, OBSERVABILITY, AND COST BUDGETS

## Document Status

- Stage: 2.17 - AI Abstraction / Observability / Cost Budgets.
- Status: architecture specification only.
- Date: 13 June 2026, Europe/Madrid.
- Depends on: Decision Engine, Decision Schemas, Clarification Engine, `SimulationResponse V2`, User Data Architecture, Production Auth Architecture, Memory Model, Subscription Model, and Multilingual Architecture.
- Does not connect an AI provider, call a real model, implement streaming, change routes, or change the current `SimulationResponse`.

## 1. Purpose

This document defines how future Levio AI-assisted processing must:

- remain independent from any single AI provider;
- preserve the Decision Engine as the product authority;
- move requests through controlled lifecycle gates;
- validate provider output before product use;
- expose useful observability without creating hidden decision history;
- apply cost, token, request, retry, and rate-limit budgets;
- fail safely and visibly;
- support future evaluation datasets and automated tests.

This is the first architecture item in the Stage 3 AI track. It authorizes specification work only. It does not authorize AI integration.

## 2. Why Levio Needs an AI Abstraction Layer

Levio is a Decision Intelligence System, not a model wrapper.

An AI abstraction layer is required because:

- model providers, model names, capabilities, pricing, and limits change;
- different decision tasks may require different model capabilities;
- provider output is probabilistic and must not define product contracts;
- privacy, residency, safety, latency, and cost requirements may differ by request;
- the product must support retries, fallback, evaluation, and migration without rewriting Decision Engine logic;
- provider-specific errors must become stable Levio-controlled failure states;
- traceability must survive a model or provider change.

The abstraction layer protects Levio's product meaning and contracts from provider volatility.

## 3. Decision Engine Versus AI Provider

The Decision Engine and AI provider have different responsibilities.

### Decision Engine Responsibilities

The Decision Engine owns:

- canonical input and output schemas;
- preprocessing and context selection;
- completeness and critical-gap rules;
- clarification eligibility and stop conditions;
- deterministic validation;
- safety and recommendation gates;
- scenario and recommendation invariants;
- confidence and completeness meaning;
- provenance and traceability;
- `SimulationResponse V2` mapping;
- user-facing controlled failure semantics.

### AI Provider Responsibilities

An AI provider may assist with bounded tasks such as:

- extracting candidate structured facts;
- proposing gaps or contradictions;
- generating candidate scenarios;
- drafting risk and benefit analysis;
- producing localized explanatory prose;
- generating a candidate recommendation when gates permit it.

An AI provider must not decide:

- ownership or authorization;
- consent;
- subscription entitlement;
- retention;
- whether critical gaps may be ignored;
- whether safety gates may be bypassed;
- whether invalid output is acceptable;
- the authoritative product response contract.

The provider produces candidates. Levio decides whether they are valid and usable.

## 4. AI Provider Neutrality

Provider neutrality means Levio depends on its own capabilities and contracts, not a provider's native API shape.

Required principles:

- canonical Levio request and response types remain provider-independent;
- model identifiers are configuration, not product semantics;
- provider roles or message formats do not leak into Decision Engine schemas;
- provider errors map into stable Levio error categories;
- provider token counts and prices normalize into Levio usage records;
- safety, validation, traceability, and cost enforcement remain Levio-controlled;
- a provider change must not silently change user-facing behavior;
- provider fallback must preserve the same contract and safety gates.

Provider neutrality does not imply that all providers are interchangeable. Each adapter must declare tested capabilities and limitations.

## 5. Future Model Adapter Concept

A future model adapter is a bounded integration component between Levio orchestration and one provider/model combination.

Conceptual adapter capabilities:

```text
adapter_id
provider_id
model_id
model_version_or_alias
supported_tasks
supported_languages
structured_output_support
context_limit
output_limit
timeout_profile
cost_profile
data_processing_profile
capability_status
```

An adapter must:

- accept a Levio-controlled task request;
- translate it into provider-specific format;
- enforce configured limits;
- call the provider;
- normalize usage, timing, and errors;
- return raw candidate output only to the validation boundary;
- expose no provider secret to product logic;
- support deterministic test doubles.

An adapter must not:

- return provider prose directly to users;
- modify canonical schemas;
- bypass authorization, consent, safety, or cost checks;
- silently retry without the orchestrator's policy;
- silently select a more expensive model.

## 6. Conceptual AI Task Contract

Each provider call must represent one explicit task.

Conceptual request:

```text
ai_task_id
trace_id
task_type
contract_version
policy_version
prompt_template_version
requested_language
input_payload
allowed_output_schema
privacy_class
budget
timeout
idempotency_scope
```

Conceptual result:

```text
ai_task_id
adapter_id
provider_request_reference_optional
status
candidate_output
normalized_usage
latency
finish_reason
error_category_optional
validation_status
```

The task contract is conceptual and does not authorize a runtime schema or route in Stage 2.17.

## 7. End-to-End Request Lifecycle

```text
User input
->
Authorization and consent boundary where applicable
->
Decision Engine preprocessing
->
Completeness, clarification, and safety checks
->
AI task preparation
->
Preflight privacy and cost-budget gate
->
Provider adapter request
->
Provider candidate response
->
Normalization and deterministic validation
->
Decision Engine policy gates
->
SimulationResponse V2 mapping
->
User-facing output
->
Minimal observability and usage accounting
```

Every transition must have a clear owner and failure behavior.

## 8. User Input Boundary

User input remains user-owned content.

Before AI preparation, Levio must:

- establish the active owner or temporary processing scope;
- preserve original input language;
- reject structurally invalid or unsupported requests;
- identify high-risk secrets or unnecessary sensitive data where feasible;
- apply input-size limits;
- avoid sending unrelated history or memory;
- avoid treating input as consent for persistent storage or model training.

The current simulator input and route remain unchanged by this stage.

## 9. Decision Engine Preprocessing

Preprocessing converts eligible input into a minimal, structured task context.

It may:

- normalize locale-independent values;
- identify the requested decision intent;
- attach explicitly authorized context;
- separate user facts, assumptions, and known unknowns;
- select relevant memory only after authorization and consent;
- produce stable references for traceability;
- calculate preliminary complexity and budget class.

Preprocessing must not invent missing facts or flatten provenance.

## 10. Completeness and Clarification Check

Completeness, critical-gap, contradiction, and safety checks occur before recommendation generation.

The Decision Engine must determine whether to:

- ask clarification;
- proceed to normal analysis;
- proceed with limited analysis;
- withhold recommendation;
- refuse;
- return controlled failure.

AI may assist with candidate gap detection, but deterministic policy must enforce the final state.

A request that requires clarification should not spend a full recommendation-generation budget.

## 11. AI Request Preparation

AI request preparation must:

- choose one bounded task;
- select only minimum necessary context;
- specify the allowed output schema;
- include stable policy and prompt-template versions;
- specify requested output language;
- set timeout, token, and cost ceilings;
- set privacy classification;
- select an eligible adapter based on capabilities;
- exclude auth tokens, session identifiers, provider secrets, and unrelated account data.

Prompt text is an implementation detail. Prompt intent, schema, and policy version are architectural concerns.

## 12. Provider Response Boundary

Provider output is untrusted candidate data.

It may be:

- malformed;
- incomplete;
- contradictory;
- unsupported by evidence;
- unsafe;
- in the wrong language;
- outside the requested schema;
- more expensive or longer than expected;
- affected by provider-side refusal or truncation.

No provider response may be presented, saved, or mapped to V2 until validation and policy gates pass.

## 13. Validation Boundary

Validation must combine:

- structural schema validation;
- enum and identifier validation;
- reference-integrity checks;
- provenance checks;
- completeness checks;
- critical-gap and safety gates;
- recommendation invariants;
- unsupported-certainty checks;
- requested-language checks;
- token and output-size checks;
- duplicate and contradiction checks.

Validation outcomes:

```text
valid
valid_with_limitations
repairable
invalid
unsafe
```

Repair is a controlled new task, not silent acceptance of invalid output.

## 14. SimulationResponse V2 Mapping

Only validated Decision Engine output may map into `SimulationResponse V2`.

Mapping must:

- preserve the response contract version;
- select the correct V2 status;
- preserve evidence and traceability references;
- expose confidence and completeness honestly;
- expose limitations and unresolved gaps;
- exclude provider-native fields;
- exclude internal prompts and hidden reasoning;
- represent controlled failures without fabricated analysis.

The current `SimulationResponse` remains unchanged until a separately approved implementation stage.

## 15. What Must Be Model-Independent

The following must remain model-independent:

- Decision Engine schemas and canonical values;
- completeness and confidence meaning;
- critical-gap severity;
- clarification rules and stop conditions;
- safety and refusal policy;
- scenario and recommendation invariants;
- evidence and provenance model;
- `SimulationResponse V2`;
- authorization, ownership, consent, and retention;
- cost-budget policy;
- rate-limit and abuse policy;
- normalized failure categories;
- trace and audit record shape;
- acceptance thresholds;
- evaluation datasets and scoring methods.

## 16. What May Be Provider-Specific

Provider-specific implementation may include:

- request serialization;
- authentication to the provider;
- model name and version;
- native structured-output mode;
- provider timeout behavior;
- provider rate-limit headers;
- tokenization and usage reporting;
- region and data-processing configuration;
- provider-native safety signals;
- error parsing;
- capability limits;
- pricing inputs.

Provider-specific behavior must be normalized before it affects Levio policy or user output.

## 17. AI Failure Boundaries

AI-assisted processing can fail at distinct boundaries:

- preflight rejection;
- authorization or consent denial;
- privacy minimization failure;
- budget denial;
- adapter unavailable;
- provider rate limit;
- timeout;
- network failure;
- provider refusal;
- truncated response;
- malformed response;
- schema validation failure;
- safety validation failure;
- unsupported evidence or contradiction;
- V2 mapping failure;
- persistence or delivery failure in future implementations.

Each failure category must have a defined retry, fallback, user-message, and observability policy.

## 18. Controlled Failure Behavior

Controlled failure must be honest, bounded, and actionable.

Required behavior:

- never silently replace a failed AI response with mock output presented as real analysis;
- never present invalid partial output as a complete recommendation;
- distinguish retryable from non-retryable failures;
- preserve the user's original input where permitted;
- avoid duplicate consequential actions;
- map eligible failures to the V2 controlled-failure state;
- explain whether the user should retry, clarify, reduce scope, or wait;
- record a minimal human-readable audit event;
- avoid exposing provider internals or secrets.

## 19. Observability Principles

Observability exists to understand reliability, quality, safety, latency, and cost.

It must:

- use stable trace and task identifiers;
- separate product events from raw user content;
- support request-level and aggregate analysis;
- support provider and model comparison;
- expose failures and retries;
- connect usage to budgets;
- support incident investigation;
- use purpose-limited retention;
- restrict access;
- remain independent from user memory and decision history.

Observability must not become unrestricted surveillance or a hidden copy of user decisions.

## 20. Trace Model

A future trace represents the execution path of one decision request.

Conceptual trace spans:

```text
request_received
authorization_checked
context_selected
preprocessing_completed
clarification_gate_completed
safety_gate_completed
budget_checked
adapter_selected
provider_request_started
provider_request_completed
validation_completed
v2_mapping_completed
response_delivered
```

Each span should record status, timestamps, duration, version references, normalized usage, and error category where applicable.

Trace IDs must be opaque and must not encode user identity or decision content.

## 21. What Should Be Logged

Subject to retention and access policy, log only necessary operational metadata:

- opaque trace, request, task, and adapter identifiers;
- canonical contract and policy versions;
- prompt-template version, not prompt content by default;
- provider and model identifiers;
- task type;
- response status;
- validation outcome and error category;
- retry and fallback decisions;
- latency by stage;
- normalized input and output token counts;
- normalized request cost;
- configured and consumed budget;
- rate-limit decision;
- safety state code without sensitive narrative;
- requested and produced language codes;
- owner-scope type where operationally necessary, not raw owner identity;
- timestamps and retention class.

## 22. What Must Not Be Logged

Operational logs must not contain by default:

- raw user decision text;
- raw clarification answers;
- full provider request or response payloads;
- hidden reasoning or chain-of-thought;
- auth tokens or session identifiers;
- provider secrets or API keys;
- passwords, recovery tokens, or magic links;
- payment data;
- raw voice audio;
- reusable memory content;
- personal identifiers when opaque references suffice;
- unsupported sensitive inferences;
- deleted user content;
- prompts containing user content;
- complete `SimulationResponse V2` payloads.

Any temporary diagnostic capture of content would require a separately approved, purpose-specific, access-controlled, time-limited process.

## 23. Traceability and SimulationResponse V2

V2 traceability must explain product reasoning without exposing internal model secrets.

The user-visible response may reference:

- evidence and assumption identifiers;
- policy version;
- model-quality explanation;
- conditions that change the recommendation;
- limitations;
- response generation time;
- applicable notices.

Internal traceability may additionally reference:

- adapter and model version;
- prompt-template version;
- validation result;
- retry and fallback path;
- normalized usage and cost.

Provider-native request identifiers may be retained only when operationally necessary and must not become public owner identifiers.

## 24. Human-Readable Audit Trail

The audit trail must answer:

- what type of analysis was requested;
- which major gates ran;
- whether clarification or safety changed the path;
- which policy and contract versions applied;
- which adapter/model class assisted;
- whether validation passed;
- whether retry or fallback occurred;
- whether a recommendation was allowed, limited, withheld, or refused;
- what cost budget was consumed.

It must not expose:

- hidden reasoning;
- raw prompts;
- raw decision content by default;
- secrets;
- another user's data.

The audit trail is an operational explanation, not a substitute for the user-owned saved decision record.

## 25. Cost Budget Principles

Cost is a controlled product constraint, not an after-the-fact report.

Principles:

- estimate before provider execution;
- deny or reduce scope before exceeding a hard budget;
- separate cost budgets from subscription ownership;
- keep safety and privacy independent from tier;
- make limits configurable;
- account for retries and fallback;
- normalize provider pricing;
- monitor actual versus estimated cost;
- preserve useful free-tier value;
- prevent unbounded context growth;
- do not silently choose a more expensive model;
- optimize through task design, not by weakening validation.

Exact monetary and token limits remain deferred until provider and product validation.

## 26. Cost Per Simulation

Every future simulation must have a configured budget envelope.

The envelope may include:

- maximum provider requests;
- maximum input tokens;
- maximum output tokens;
- maximum repair attempts;
- maximum retry attempts;
- maximum normalized monetary cost;
- maximum latency;
- allowed adapter classes;
- allowed scenario depth.

Cost accounting must include preprocessing-related AI tasks, clarification assistance, generation, validation repair, retries, and fallback.

A simulation that reaches its budget must reduce scope, return limited analysis, request clarification, or fail in a controlled way. It must not exceed the hard ceiling silently.

## 27. Cost Per User

User-level budgets protect service sustainability and detect abnormal usage.

They may include:

- rolling daily or monthly normalized cost;
- request count;
- token count;
- concurrency;
- repeated failed request cost;
- guest and anonymous limits;
- exceptional review thresholds.

User-level budgets must:

- be evaluated against the authenticated or temporary principal;
- avoid using decision content for entitlement enforcement;
- distinguish legitimate deep use from abuse through transparent policies;
- preserve export, deletion, and privacy rights when limits are reached.

## 28. Cost Per Subscription Tier

Tier budgets translate validated product economics into configurable entitlements.

Possible dimensions:

- simulation count;
- maximum depth;
- scenario count;
- model class;
- context allowance;
- project or workspace allowance;
- priority;
- period budget.

Rules:

- FREE, PREMIUM, and PROFESSIONAL limits remain conceptual until validated;
- tier does not change safety, privacy, ownership, or validation standards;
- premium status does not guarantee unlimited AI spend;
- downgrade must not delete user data;
- hard server-side enforcement is required in future implementation;
- UI visibility alone is never enforcement.

## 29. Cost Per Language

Languages may have different tokenization, output length, model quality, and review requirements.

Cost planning must:

- measure actual usage by requested language;
- preserve semantically equivalent quality standards;
- avoid penalizing users for language through weaker safety or reasoning;
- budget for language-specific validation and evaluation;
- treat translation and decision reasoning as distinct tasks where needed;
- preserve original-language content;
- avoid inferring country, culture, or tier from language.

Cost differences may inform internal budgets, but language alone must not silently reduce user rights or safety.

## 30. Token and Request Budgeting

Every task must define:

- maximum context tokens;
- maximum output tokens;
- maximum provider calls;
- reserved retry allowance;
- reserved validation-repair allowance;
- response truncation behavior;
- budget-exhaustion behavior.

Context selection should prioritize:

1. current user input;
2. required clarification answers;
3. decision facts and constraints;
4. relevant user-confirmed memory with consent;
5. minimal prior decision context when explicitly applicable.

Context must not grow merely because data exists.

## 31. Rate Limiting Principles

Rate limits protect reliability, cost, and fair access.

Limits may apply by:

- anonymous device or guest session;
- registered principal;
- subscription entitlement;
- workspace;
- IP or network signal as a secondary abuse signal;
- endpoint or task type;
- concurrency;
- rolling cost.

Rate limiting must:

- be enforced server-side;
- return stable, understandable failure states;
- avoid leaking account existence;
- avoid permanent punitive profiling;
- preserve privacy rights;
- distinguish temporary service protection from entitlement exhaustion.

## 32. Abuse Prevention

AI abuse prevention must address:

- automated high-volume requests;
- prompt injection attempts against system policy;
- attempts to extract secrets or internal prompts;
- repeated unsafe requests;
- cost-amplification attacks;
- repeated malformed-output triggers;
- guest-session farming;
- account or entitlement forgery;
- retry storms.

Controls may include:

- request and cost rate limits;
- input-size limits;
- concurrency limits;
- task allowlists;
- circuit breakers;
- anomaly signals;
- temporary throttling;
- provider-level safety signals;
- manual operational review under least privilege.

Abuse controls must not store raw decision content unnecessarily.

## 33. Retry Strategy

Retries are allowed only for defined transient failures.

Retryable examples:

- transient network failure;
- provider temporary unavailable response;
- provider rate limit when policy permits delayed retry;
- timeout when idempotency and budget allow;
- repairable structured-output failure.

Non-retryable examples:

- authorization or consent denial;
- hard budget denial;
- unsafe request;
- deterministic validation failure caused by unsupported content;
- invalid task configuration;
- user cancellation.

Retry requirements:

- bounded attempts;
- exponential or policy-controlled backoff;
- jitter where appropriate;
- idempotency;
- remaining-budget check before every attempt;
- no silent infinite retries;
- observable retry reason and outcome.

## 34. Fallback Strategy

Fallback is an explicit policy decision, not an automatic promise.

Possible fallback paths:

- retry the same adapter;
- use a validated alternative adapter with equivalent capability;
- reduce optional depth;
- produce limited analysis;
- ask clarification;
- withhold recommendation;
- return controlled failure.

Fallback must not:

- bypass privacy or residency constraints;
- weaken safety or validation;
- exceed the cost budget;
- silently change output semantics;
- present deterministic mock output as AI analysis;
- use an unvalidated model or language capability.

A fallback provider must pass the same contract and evaluation gates as the primary provider.

## 35. Privacy Boundaries

Before any provider request, Levio must confirm:

- lawful and product-approved processing purpose;
- authorization to use durable user-owned data;
- memory consent where memory is included;
- minimum necessary context;
- permitted provider and region;
- permitted retention and training settings;
- absence of secrets and unrelated account data;
- defined temporary-processing lifecycle.

Provider payloads remain temporary processing data unless a separately approved retention basis exists.

Auth tokens, session identifiers, billing data, unrelated history, and unnecessary personal identifiers must never be sent.

## 36. Relation to User Data Architecture

This architecture follows the data categories and ownership rules in `LEVIO_USER_DATA_ARCHITECTURE.md`.

- User input and saved results remain user-owned or user-controlled derived content.
- Provider payloads and candidate outputs are temporary processing data by default.
- Operational traces are non-owned system metadata with limited purpose and retention.
- Observability must not create hidden decision history.
- AI output may become a saved result only through the approved user-data lifecycle.
- Deletion must remove eligible saved data without leaving content in logs.
- Export must not expose provider secrets or another principal's data.

## 37. Relation to Production Auth Architecture

Production auth and server-side authorization are prerequisites when AI uses durable user-owned context.

The AI orchestration layer must:

- trust only server-established principals;
- verify access to each context source;
- verify consent and entitlement separately;
- apply user, guest, and workspace budgets to the correct principal;
- reject forged owner, role, or tier identifiers;
- exclude auth/session secrets from provider payloads and logs;
- keep internal-operator access separate and audited.

AI never authenticates users and never decides authorization.

## 38. Relation to Future Evaluation Dataset

A future evaluation dataset is required before a provider or model is approved for production tasks.

It should cover:

- representative decision types;
- completeness and critical-gap behavior;
- contradiction handling;
- safety levels and refusals;
- scenario distinctness;
- recommendation invariants;
- unsupported certainty;
- traceability;
- controlled failures;
- multilingual semantic consistency;
- cost, token, and latency profiles;
- provider and model regressions.

Evaluation records must use consented, synthetic, or appropriately de-identified data under an approved governance process.

Production user decisions must not silently become evaluation data.

## 39. Relation to Future Automated Tests

Future automated tests must include:

- adapter contract tests;
- deterministic test doubles;
- provider-error normalization tests;
- schema and reference-integrity tests;
- safety and critical-gap gates;
- V2 mapping fixtures for every status;
- retry and fallback tests;
- timeout and circuit-breaker tests;
- budget and rate-limit tests;
- privacy redaction tests;
- trace/log content-exclusion tests;
- auth, ownership, consent, and entitlement boundary tests;
- multilingual consistency tests;
- cost regression tests;
- end-to-end controlled-failure tests.

Real provider tests, if approved, must be isolated, budget-capped, and excluded from ordinary deterministic test runs.

## 40. AI Readiness Gates

No real model may be connected until an approved implementation stage defines and validates:

- adapter interface and at least one tested adapter;
- task-level canonical contracts;
- provider and model approval criteria;
- deterministic validation;
- privacy and context-minimization controls;
- auth, ownership, and consent enforcement;
- retry, fallback, timeout, and circuit-breaker policy;
- normalized observability and retention;
- hard cost and request budgets;
- rate limiting and abuse controls;
- evaluation dataset and acceptance thresholds;
- automated contract and failure tests;
- V2 mapping and migration plan;
- truthful user-facing failure behavior.

## 41. What This Stage Does Not Implement

Stage 2.17 does not:

- connect OpenAI or another AI provider;
- install OpenAI SDK, AI SDK, or any dependency;
- call a real model;
- create AI routes;
- change `/api/simulate`;
- implement streaming;
- change environment variables;
- change `package.json` or lockfiles;
- change the current `SimulationResponse`;
- implement `SimulationResponse V2`;
- change simulator flow;
- change UI, homepage, or dashboard;
- implement auth, persistence, subscription, memory, or payments;
- create logs, traces, meters, budgets, or rate limits in code.

## 42. Open Questions for Stage 3 Implementation

- Which bounded AI tasks are required for the first implementation slice?
- What adapter interface and capability declaration are sufficient?
- Which provider and model candidates satisfy privacy, quality, latency, and cost gates?
- What are the initial hard per-task and per-simulation budgets?
- What normalized pricing source and update process will be used?
- What timeout, retry, and fallback values pass evaluation?
- Which failures should reduce scope versus return controlled failure?
- What observability backend and retention periods are appropriate?
- Which trace fields are required for incident response without logging content?
- How will prompt-template versions be reviewed and released?
- How will model aliases be pinned and regression-tested?
- What languages are approved per adapter?
- What evaluation dataset governance process will be used?
- What acceptance thresholds block a model release?
- How will anonymous and guest budgets be enforced safely?
- How will workspace budgets remain separate from personal ownership?
- What provider data-retention and training settings are contractually acceptable?
- When is human operational review justified and how is it audited?

## 43. Stage 2.17 Completion Boundary

Stage 2.17 is complete through this provider-independent architecture specification and repository fixation only.

It begins the Stage 3 AI track by defining the boundary around future AI integration. It does not connect AI, authorize model calls, or make Levio ready for production AI processing.
