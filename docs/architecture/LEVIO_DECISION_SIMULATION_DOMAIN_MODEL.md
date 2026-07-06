# LEVIO DECISION SIMULATION DOMAIN MODEL

Date: 6 July 2026, Europe/Madrid.

Status: Canonical product domain model for Block A1 - Decision Simulation
Persistence Implementation.

This document defines the final product Domain Model for a Levio Decision
Simulation. It is architecture documentation only. It does not implement runtime
code, change UI, change API, change Supabase schema, create migrations, open
Production Release, open Commercial Launch, execute Scale, or connect Real AI.

## 1. Product Definition

A **Decision Simulation** is the core user-owned product object in Levio.

It represents a structured simulation of one user decision, produced through
the approved Levio architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

A Decision Simulation is not:

- a chat thread;
- an answer;
- an assistant conversation;
- a memory record;
- a raw AI provider response;
- a billing entitlement;
- an analytics event.

A saved Decision Simulation is a durable, owner-scoped decision artifact that
contains:

- the user-authored or user-confirmed decision input snapshot;
- the normalized Decision Engine context used to evaluate the decision;
- generated scenarios, risks, limitations, safety notices, and recommendation
  state where available;
- provenance, contract versions, lifecycle metadata, and export/delete
  compatibility fields;
- enough audit metadata to support owner-scoped history, reopening, export, and
  deletion without turning operational logs into product history.

## 2. Lifecycle Model

The final lifecycle distinguishes product states from transient runtime states.

### 2.1 Canonical Lifecycle

```text
Draft
  ->
Running
  ->
Completed
  ->
Saved
  ->
Reopened
  ->
Archived
  ->
Deletion Requested
  ->
Deleted / Anonymized / Retained Legal Exception
```

### 2.2 State Definitions

| State | Durable object? | Meaning | Storage mapping |
| --- | --- | --- | --- |
| Draft | Optional durable draft for registered users; local/session for anonymous users | User-authored or user-edited input before simulation completion. | `simulation_drafts` when server-side registered-user drafts are approved; browser-local/session for anonymous demo flow. |
| Running | No by default | Active simulation execution through Simulator -> Decision Engine -> Prompt Context -> AI Provider -> Decision Engine. | Runtime-only operation. It must not become hidden history or persisted trace by default. |
| Completed | No by default | A simulation result exists for the active flow but has not necessarily been saved. | Runtime response object. Durable persistence begins only after explicit save or separately approved account-save behavior. |
| Saved | Yes | User intentionally stores the completed simulation as a durable product object. | `simulation_records.record_status = active`; `source_type = explicit_save`, approved account save, or approved import. |
| Reopened | Event, not persistent status | The owner opens a saved simulation again for review or future action. | Read/list behavior plus optional `simulation_history_entries` event if product history needs it. The record remains active unless another lifecycle action changes it. |
| Revised | Related record/event, not overwrite | A saved simulation is materially regenerated, edited, or extended. | New `simulation_records` revision or `simulation_history_entries.revision_created`; do not silently overwrite original snapshots. |
| Archived | Yes | Owner hides the saved simulation from default active views without deleting it. | `simulation_records.record_status = archived`, with `archived_at`; export eligibility remains unless legally restricted. |
| Deletion Requested | Yes | Owner or lifecycle policy starts deletion handling. | `record_status = deletion_pending` and/or `deletion_state = deletion_requested`. |
| Deleted | Terminal lifecycle | User-owned content is removed, restricted, anonymized, or minimally retained according to policy. | `record_status = deleted`, `deletion_state = deleted/anonymized/retained_legal_exception`, `deleted_at` where applicable. |
| Restricted | Exceptional lifecycle | Access is blocked because of abuse, legal hold, recovery, or safety/operational review. | `record_status = restricted` or `deletion_state = restricted`; must remain owner-scoped and explainable where user-visible. |

### 2.3 States Not Modeled as Primary Statuses

`Running`, `Completed`, and `Reopened` are not primary durable
`simulation_records.record_status` values because:

- `Running` is an execution state, not a durable product artifact.
- `Completed` may remain unsaved and must not imply persistence.
- `Reopened` is access behavior or history, not a different lifecycle state.

They may appear as runtime events, dashboard view states, or user-visible
history entries where explicitly approved.

## 3. Object Structure

The final Decision Simulation object is represented as a domain aggregate over:

- `simulation_records` as the durable saved simulation root;
- `simulation_drafts` as optional pre-save draft state;
- `simulation_history_entries` as user-visible lifecycle/revision/outcome
  history;
- `levio_principals` as the owner anchor.

The domain object should be exposed to product code as a structured model, not
as raw table rows.

### 3.1 Identity

Required:

- `simulationId` / `record_id`;
- `schemaVersion`;
- `domainModelVersion`;
- `createdAt`;
- `updatedAt`.

Purpose:

- identify the saved simulation;
- support stable URLs, dashboard detail views, export/delete targeting, and
  history relationships;
- preserve migration/version awareness.

### 3.2 Ownership

Required:

- `ownerPrincipalId`;
- `ownerPrincipalType = registered_user`;
- `ownershipSource = resolved_server_principal`;
- `ownerVerifiedAt` or equivalent server-side authorization evidence where
  available.

Rules:

- ownership is derived server-side from Auth Runtime -> provider reference ->
  `levio_principals.principal_id`;
- client-supplied owner identifiers are never trusted;
- Supabase `auth.users.id` remains provider reference only;
- ownership fields are immutable after creation.

### 3.3 Simulation Input

Required:

- `userInputSnapshot`;
- `language`;
- source surface, such as public simulator or dashboard simulator;
- submitted/generated timestamp.

Optional:

- `clarificationSnapshot`;
- `originatingDraftId`;
- selected user note/title.

Rules:

- user input is user-owned content;
- active temporary input is not durable until save or approved autosave;
- raw microphone audio, transient voice state, and retry state are excluded.

### 3.4 Decision Context

Required when available:

- normalized decision statement;
- decision types;
- goals;
- options;
- constraints;
- assumptions;
- gaps;
- contradictions;
- evidence references;
- completeness and confidence summaries.

Rules:

- this is the structured Decision Engine context, not a chat transcript;
- unsupported inferences must remain labeled as assumptions, gaps, or
  limitations;
- context must preserve what was user-provided, user-confirmed, or inferred by
  the system.

### 3.5 Generated Scenarios

Required when available:

- scenario identifiers;
- option references;
- scenario perspective/type;
- dependencies;
- outcome indicators;
- uncertainty markers;
- scenario confidence/quality;
- related risk references.

Rules:

- generated scenarios are user-controlled derived content after save;
- scenarios are structured simulation artifacts, not direct advice;
- scenario history must be revised through new records or history events, not
  silent overwrite.

### 3.6 Decision Engine Output

Required:

- internal `SimulationResponseV2Draft` contract version or successor;
- status: `analysis_ready`, `limited_analysis`, `clarification_required`,
  `cannot_recommend`, `refused`, or `failed`;
- model quality/completeness summary;
- safety boundary;
- recommendation state;
- notices;
- availability of scenarios, risks, and recommendation;
- controlled failure summary where applicable.

Rules:

- public `/api/simulate` envelope remains separate from saved domain object;
- internal traceability must be content-minimized before persistence;
- failed/refused/clarification states must not invent normal analysis or
  recommendation artifacts.

### 3.7 AI Metadata

Current state:

- Real AI execution is deferred.
- Saved simulations may record `aiProviderUsed = false` or equivalent
  deterministic-preview evidence.

Future allowed metadata after separately approved Real AI integration:

- provider boundary identifier;
- model family or abstract provider reference if needed for provenance;
- prompt context version;
- AI output normalization version;
- cost/safety/error control summary;
- fallback state.

Prohibited by default:

- raw prompts;
- raw AI provider responses;
- hidden chain-of-thought;
- provider tokens;
- API keys;
- embeddings or vectors;
- direct AI answers as authoritative product output.

AI Provider never owns the Decision Simulation.

### 3.8 Runtime Metadata

Required:

- `simulationResponseVersion`;
- `decisionContractVersion`;
- pipeline/runtime version;
- source type: explicit save, approved account save, or registered-user import;
- runtime truth boundary: deterministic preview or future approved Real AI path;
- safety classification;
- content sensitivity classification.

Rules:

- runtime metadata is system-controlled;
- it must be content-minimized;
- it must be sufficient for compatibility, debugging, rollback, and export
  explanation without storing unnecessary internal traces.

### 3.9 Audit Metadata

Required:

- creation timestamp;
- update timestamp;
- lifecycle event references where relevant;
- last exported timestamp where relevant;
- parent/revision references where relevant.

Optional:

- user-visible lifecycle history entries;
- import/claim transaction references;
- export request references.

Rules:

- audit metadata must not become hidden decision history;
- user-visible history is export eligible;
- operational proof should use opaque identifiers where possible.

### 3.10 Lifecycle Metadata

Required:

- `recordStatus`;
- `deletionState`;
- `retentionRule`;
- `exportEligible`;
- archive/deletion timestamps where applicable;
- legal hold reason where applicable.

Rules:

- deletion is a lifecycle, not a visual hide;
- archived records remain owned and export eligible unless restricted;
- retention must be explicit and category-specific.

### 3.11 Future Versioning

Required:

- `schemaVersion`;
- `domainModelVersion`;
- source contract version;
- response mapping version;
- parent/revision references for material changes.

Rules:

- material regeneration creates a revision or history event;
- future model upgrades must preserve readable/exportable historical records;
- migrations must not erase provenance or owner scope.

## 4. Field Mutability

### 4.1 Immutable Fields

Immutable after creation:

- `simulationId` / `record_id`;
- `ownerPrincipalId`;
- `ownerPrincipalType`;
- ownership source;
- original saved `userInputSnapshot`;
- original saved Decision Engine output snapshot;
- source contract versions for the saved snapshot;
- source type;
- creation timestamp;
- originating draft reference once converted;
- parent record reference once set;
- schema version for the stored row.

If any immutable decision content needs to change, create a revision or a new
history entry instead of overwriting the original saved artifact.

### 4.2 Mutable Fields

Mutable through owner-scoped server runtime only:

- title;
- user note;
- archive/restore state;
- deletion lifecycle state;
- retention/legal-hold metadata where policy allows;
- last exported timestamp;
- user-visible outcome metadata if separately approved;
- revision label where policy allows.

### 4.3 Computed Fields

Computed from stored data:

- dashboard display title fallback;
- category/decision type summary;
- active/archived/deleted list visibility;
- effective export eligibility;
- effective deletion availability;
- latest lifecycle event;
- derived risk/quality display summaries.

Computed fields must not become authorization evidence.

### 4.4 Service Fields

System-controlled service fields:

- runtime metadata;
- safety flags;
- content sensitivity;
- provider boundary metadata;
- pipeline/version metadata;
- operational references;
- schema/domain version fields.

Service fields must not expose provider secrets, auth tokens, raw prompts, raw
AI output, or sensitive hidden traces to product surfaces.

## 5. Ownership Model

### 5.1 User-Owned Data

The user owns or controls:

- user input snapshot;
- clarification answers saved into the record;
- user notes and titles;
- saved generated scenarios and decision analysis as user-controlled derived
  content;
- user-visible lifecycle history;
- drafts and saved records under their principal;
- export/delete requests over eligible account-bound simulation data.

### 5.2 System-Owned Data

The system controls:

- record identifiers;
- owner resolution process;
- runtime/version metadata;
- safety classification;
- content sensitivity classification;
- retention policy identifiers;
- operational references;
- legal-hold markers where applicable.

System-owned does not mean exempt from privacy, export, deletion, or
explanation obligations where the metadata relates to the user.

### 5.3 Data That Cannot Be User-Edited Directly

Users cannot directly change:

- owner principal fields;
- provider reference mappings;
- creation/provenance timestamps;
- original saved input/output snapshots;
- engine contract versions;
- safety classification;
- deletion/legal hold states except through approved user actions and policy
  gates;
- raw operational metadata.

## 6. Relationship to Implementation Blocks

| Block | Relationship |
| --- | --- |
| A. Decision Simulation Persistence Implementation | This model is the root contract for save/list/load/reopen, archive, revision, history, and persistence boundary behavior. |
| B. Real User Account Runtime | Auth proves the acting principal. Ownership remains `levio_principals.principal_id`; account runtime must not use provider IDs as simulation owners. |
| C. User Data Management | Export/delete/retention operate over this model's owner-scoped records, drafts, history, lifecycle, and provenance fields. |
| D. Production AI Integration | Real AI output may enter the domain object only after normalization through Decision Engine contracts; raw AI provider material remains excluded by default. |
| E. Product Validation & Production Readiness | QA must validate lifecycle, owner isolation, contract versions, fail-closed states, export/delete compatibility, and no AI Chat/Answer Engine drift. |
| F. Commercial Production | Subscription state may gate capabilities or limits but must not change ownership, export/delete rights, or saved simulation provenance. |

## 7. Runtime Constraints

Runtime must verify:

- authenticated registered-user context before durable account-bound operations;
- provider reference resolves to exactly one active Levio principal;
- requested record belongs to the resolved principal;
- owner fields are never accepted from browser/client input;
- record status permits the requested operation;
- deletion and retention state permit the requested operation;
- history parent owner matches the parent simulation owner;
- source payload maps to the approved Decision Engine output contract;
- failed/refused/clarification outputs do not persist fabricated normal
  recommendation artifacts;
- direct client writes remain denied;
- public `/api/simulate` contract remains unchanged unless separately approved.

Runtime must prohibit:

- cross-owner read/write/export/delete;
- mock/localStorage ownership for production saved records;
- raw AI provider prompt/response storage by default;
- hidden chat/conversation history;
- memory promotion without explicit later consent and scope;
- billing/subscription status as ownership proof;
- analytics/tracking data as product history;
- overwrite of historical decision snapshots without revision semantics.

## 8. Persistence Layer Requirements for A2

A2 Persistence Runtime must use this domain model without changing schema in
this A1 step.

Required future persistence behavior:

- expose a server-only domain service over `simulation_records`,
  `simulation_drafts`, and `simulation_history_entries`;
- resolve ownership through Auth Runtime -> provider reference ->
  `levio_principals.principal_id`;
- map domain fields to existing Stage 4.2 row fields;
- keep direct client writes denied;
- keep list/read owner-scoped;
- keep save/update/archive/delete operations server-only and preflighted;
- append user-visible lifecycle events for create/archive/restore/delete,
  revision, export, and claim events where approved;
- preserve export/delete compatibility fields;
- preserve revision and parent references;
- maintain deterministic-preview and future Real AI provenance without storing
  raw provider material by default;
- return domain-level blocked states instead of leaking provider/database
  details.

Persistence must not:

- create new Supabase schema or migrations without separate approval;
- bypass existing Stage 4.2 persistence boundaries;
- use Supabase `auth.users.id` as product owner;
- expose service-role behavior to client code;
- introduce chat, answer, memory, vector, embedding, billing, analytics, or
  tracking fields into the Decision Simulation product object.

## 9. A2 Readiness

The Domain Model is ready for A2 Persistence Runtime when A2 remains bounded to:

- server/runtime mapping of this model to existing persistence boundaries;
- owner-scoped save/list/load/reopen behavior;
- archive/delete lifecycle preparation where approved;
- dashboard/product integration only through approved boundaries;
- no public contract change;
- no schema/migration change unless separately approved.

This document satisfies A1 by defining the final Decision Simulation product
object, lifecycle, fields, ownership, constraints, cross-block relationships,
and future persistence requirements.
