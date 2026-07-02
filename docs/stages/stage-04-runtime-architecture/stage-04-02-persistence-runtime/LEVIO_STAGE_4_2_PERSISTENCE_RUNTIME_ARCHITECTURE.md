# LEVIO STAGE 4.2 PERSISTENCE RUNTIME ARCHITECTURE

## Document Status

- Stage: 4.2A - Persistence Runtime Architecture.
- Status: architecture specification only.
- Date: 16 June 2026, Europe/Madrid.
- Depends on: `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, `../../../architecture/LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, `../../../decisions/LEVIO_AUTH_PROVIDER_DECISION.md`, `../stage-04-01-auth-runtime/LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, and `../stage-04-01-auth-runtime/LEVIO_STAGE_4_1_AUTH_RUNTIME_HARDENING.md`.
- Auth status: Stage 4.1 completed.
- Persistence implementation status: not started.
- Database schema status: not started.
- Migration status: not started.

This document starts Stage 4.2 at architecture level only. It does not create runtime code, SQL, migrations, tables, storage buckets, persistence APIs, simulator changes, auth changes, UI changes, subscriptions, AI integration, or memory runtime.

## 1. Purpose

Stage 4.2 introduces the future persistence runtime for Levio user-owned decision data.

The purpose of Stage 4.2A is to define the safe ownership, lifecycle, security, and rollout architecture before any database or runtime implementation exists. Persistence must follow the completed Stage 4.1 auth runtime boundary and the user-data architecture. It must not let Supabase tables, client code, localStorage, or the public simulator define ownership rules accidentally.

Stage 4.2A defines:

- persistence scope;
- owner and principal strategy;
- conceptual data model;
- data lifecycle;
- security and future RLS posture;
- stage breakdown;
- rollback strategy;
- dependencies for each future substage.

## 2. Architecture Decision Summary

Stage 4.2 must use a Levio-owned principal model for persisted user data.

Approved direction:

```text
Supabase Auth identity
->
Levio Auth Runtime Boundary
->
Stable Levio Principal
->
Owner-scoped Persistence Runtime
->
Server-side Authorization + Future RLS Enforcement
```

The canonical owner identifier for user-owned records must be a stable Levio principal ID, not a raw provider user ID, unless a later architecture review explicitly proves that direct provider mapping is safer and sufficient.

Supabase `auth.users.id` remains a provider reference for Stage 4.2 planning. It may be used to look up or link a Levio principal, but user-owned records should be scoped to the Levio principal model.

## 3. Persistence Scope

### 3.1 In Scope for Stage 4.2

Stage 4.2 covers the production persistence foundation for:

- saved simulations;
- simulation history;
- simulation drafts;
- ownership;
- user-scoped data;
- future export compatibility;
- future deletion compatibility;
- future retention compatibility;
- future guest-to-account claim compatibility, if guest persistence is separately approved.

Stage 4.2 may eventually include runtime paths that let an authenticated registered user save, list, read, update, archive, delete, and export eligible simulation-related records.

### 3.2 Out of Scope for Stage 4.2

Stage 4.2 does not include:

- subscriptions;
- billing;
- payments;
- AI memory;
- long-term memory;
- vector storage;
- embeddings;
- analytics;
- observability pipelines;
- model evaluation storage;
- AI provider integration;
- payment provider integration;
- workspace persistence;
- admin tooling;
- broad dashboard redesign;
- public simulator contract changes unless explicitly approved in the simulator persistence integration substage.

### 3.3 Explicit Stage 4.2A Non-Scope

Stage 4.2A itself does not include:

- runtime implementation;
- database schema;
- migrations;
- SQL;
- tables;
- storage buckets;
- persistence API routes;
- simulator changes;
- auth runtime changes;
- dependency changes;
- environment variable changes.

## 4. Ownership Model

### 4.1 Owner ID Strategy

Every durable user-owned persistence record must have an owner.

Conceptual owner fields:

```text
owner_principal_id
owner_principal_type
owner_scope
owner_verified_at
ownership_source
```

The owner principal ID should be generated and controlled by Levio. It must remain stable if:

- the user's email changes;
- the Supabase provider reference changes through account recovery or account linking;
- a future auth provider migration occurs;
- a future subscription state changes.

Provider identifiers may be stored only in identity-link records or auth mapping records. They should not become the only ownership anchor for simulations, drafts, or history entries.

### 4.2 Relation to Supabase Auth Identity

Supabase Auth is the approved auth provider from Stage 4.1A.

Stage 4.2 persistence must treat Supabase identity as:

```text
provider = "supabase"
provider_user_reference = auth.users.id
```

Future runtime flow:

1. Server validates the Supabase session through the Levio auth runtime.
2. The auth runtime returns a normalized authenticated state.
3. Persistence runtime resolves the authenticated provider reference to a stable Levio principal.
4. Persistence operations authorize against the Levio principal and requested resource.
5. Future RLS policies enforce the same owner boundary at the database layer.

The product runtime must not accept owner IDs from the browser as proof of ownership.

### 4.3 Anonymous Users

Anonymous users have no durable server-side owner in Stage 4.2.

Allowed persistence posture:

- anonymous drafts may remain local or session-scoped only;
- anonymous local demo simulations are not production saved simulations;
- anonymous browser state must not be migrated silently;
- anonymous local data may be offered for explicit import only after authentication and a separately approved import flow.

Anonymous local identifiers must never authorize access to registered-user records.

### 4.4 Guest Users

Guest persistence is not approved by Stage 4.2A.

If a later Stage 4.2 substage approves guest persistence, guest records must:

- use an opaque guest principal;
- have fixed expiry;
- have strict record-type allowlists;
- be excluded from durable memory;
- be excluded from subscriptions;
- be claimable only through explicit user confirmation;
- never be merged into a registered account automatically.

Stage 4.2 should be designed so guest ownership can be added later without changing registered-user ownership semantics.

### 4.5 Authenticated Registered Users

Registered users are the first durable owner scope for Stage 4.2.

A registered user may own:

- saved simulation drafts;
- saved simulation results;
- simulation history entries;
- future export requests;
- future deletion requests;
- user-visible persistence preferences, if separately approved.

Registration does not imply:

- memory consent;
- analytics consent;
- subscription entitlement;
- workspace access;
- AI provider integration;
- permission to save every temporary interaction automatically.

### 4.6 Future Account Recovery Compatibility

Account recovery must restore access to the stable Levio principal, not create a new owner scope by accident.

Requirements:

- provider account recovery may change auth credentials but must not change owned record IDs;
- provider linking must not merge user-owned records without a verified process;
- duplicate provider identities must not receive access to another principal's records;
- recovery events should trigger session review and may require recent authentication for export/delete actions;
- deletion promises must not be weakened by recovery.

## 5. Conceptual Data Model

This section defines conceptual entities only. It is not SQL, not a migration plan, and not an implementation schema.

### 5.1 Shared Record Attributes

Every persistent user-owned record should carry:

```text
record_id
owner_principal_id
owner_principal_type
record_type
record_status
source
provenance
language
contract_version
created_at
updated_at
archived_at
deleted_at
deletion_state
retention_rule
export_eligible
content_sensitivity
```

Records must distinguish user-authored content from system-derived analysis. Operational metadata must avoid raw decision content when an opaque reference is enough.

### 5.2 Simulation

A `Simulation` is a saved decision-analysis record intentionally stored for a registered user.

Conceptual fields:

```text
simulation_id
owner_principal_id
owner_principal_type = registered_user
title_or_summary
original_input_snapshot
clarification_snapshot
simulation_response_version
simulation_response_snapshot
decision_model_snapshot
recommendation_state
safety_state
language
created_from
status
retention_rule
deletion_state
export_eligible
```

Rules:

- A simulation enters durable persistence only after explicit save or a separately approved account setting.
- A simulation is user-owned, including user-controlled derived content generated for the user's decision.
- A simulation must keep provenance linking generated analysis to the source input and contract version.
- Regeneration must create a revision or related history entry, not silently overwrite the historical record.
- Saved simulations must not automatically become long-term memory.

### 5.3 Simulation Draft

A `Simulation Draft` is user-authored or user-edited decision input before it becomes a saved simulation.

Conceptual fields:

```text
draft_id
owner_principal_id
owner_principal_type
draft_text
structured_context_snapshot
clarification_answers_snapshot
language
autosave_source
status
expires_at
retention_rule
deletion_state
export_eligible
```

Rules:

- Drafts are temporary by default.
- Registered-user drafts may become durable only when the product clearly indicates autosave or explicit save.
- Anonymous drafts remain local/session scoped unless explicitly imported after registration.
- Guest drafts require a future guest persistence decision.
- Clearing a draft must delete or schedule deletion of the active copy and eligible temporary copies.

### 5.4 Simulation History Entry

A `Simulation History Entry` records a user-visible lifecycle, revision, or outcome event related to a saved simulation.

Conceptual fields:

```text
history_entry_id
owner_principal_id
owner_principal_type
simulation_id
event_type
event_summary
before_reference
after_reference
user_visible
created_at
source
retention_rule
deletion_state
export_eligible
```

Possible event types:

```text
created
updated
archived
restored
regenerated
outcome_added
deleted
exported
claim_completed
```

Rules:

- Simulation history is not a universal activity log.
- History exists to preserve user-visible decision context, revisions, and outcomes.
- Hidden operational logs must not become decision history.
- Deleting a simulation must delete, restrict, or detach dependent history entries according to the deletion lifecycle.

## 6. Data Lifecycle

### 6.1 Simulation Lifecycle

Create:

- allowed only for authenticated registered users in the first implementation;
- requires server-side session validation;
- resolves a Levio principal before write;
- stores only an explicitly saved result or approved account-save behavior;
- records provenance and contract version.

Update:

- allowed only for the owner;
- should preserve historical versions or create a history entry when content meaning changes;
- must not overwrite original input provenance silently;
- may update title, archive state, user notes, or later outcome fields if separately approved.

Archive:

- owner-only;
- hides from default active lists without deleting;
- preserves export eligibility;
- must remain reversible unless retention or deletion policy says otherwise.

Delete:

- owner-only;
- enters an explicit deletion lifecycle;
- deletes or restricts dependent drafts, history entries, derived summaries, and future memory links where applicable;
- may retain minimal opaque operational proof only if required.

Export:

- owner-only;
- must include source input, generated analysis, timestamps, provenance, language, and contract versions;
- must distinguish user-provided facts from engine inferences;
- must not include another user's records or secrets.

Retention:

- default should be until user deletion, account deletion, or configured retention;
- indefinite retention is not an acceptable silent default;
- backups must follow an approved deletion propagation lifecycle.

### 6.2 Simulation Draft Lifecycle

Create:

- anonymous drafts may remain local/session only;
- registered drafts require authenticated owner resolution;
- guest drafts require a future guest-persistence approval.

Update:

- owner-only for registered drafts;
- must be autosave-visible if server-side autosave exists;
- must avoid promoting sensitive partial text into history or memory.

Archive:

- drafts normally expire or are deleted rather than archived;
- if archive exists, it must be visible and reversible.

Delete:

- clearing a draft deletes or schedules deletion of active and temporary copies;
- expired drafts must become inaccessible;
- deletion must not leave raw draft text in operational logs.

Export:

- registered saved drafts are export eligible;
- temporary drafts may be excluded if they expired before export request;
- original language must be preserved.

Retention:

- shortest practical duration for unsaved drafts;
- registered saved drafts may persist until deletion or configured retention;
- guest drafts must have fixed expiry if ever approved.

### 6.3 Simulation History Entry Lifecycle

Create:

- created only as part of a user-visible simulation lifecycle or revision event;
- created under the same owner principal as the parent simulation;
- should avoid duplicating full decision content unless needed for versioned history.

Update:

- history entries should generally be append-only;
- correction may create a new entry rather than rewrite an old one;
- operational corrections must be auditable without exposing unnecessary content.

Archive:

- follows parent simulation archive unless a specific event remains needed for export/deletion evidence;
- archived entries should not appear as active decision history.

Delete:

- follows parent simulation deletion unless a narrow legal/operational exception applies;
- retained proof should use opaque identifiers and deletion status where possible.

Export:

- user-visible history is export eligible;
- export should preserve event order, timestamps, provenance, and related simulation IDs.

Retention:

- tied to the parent simulation unless separately justified;
- must not outlive deleted source content as hidden history.

## 7. Security Model

### 7.1 Ownership Enforcement

Every persistence operation must enforce:

```text
authenticated principal
+ resolved Levio owner principal
+ requested resource owner
+ requested action
+ record status
+ consent/retention/deletion state where relevant
```

Rules:

- deny by default when ownership cannot be proven;
- never trust client-supplied owner IDs;
- record IDs alone never grant access;
- list queries must be owner-scoped server-side;
- write operations must derive owner from the validated session;
- export/delete must require authenticated registered identity and may require recent auth later.

### 7.2 Future RLS Strategy

Stage 4.2 must plan RLS as a database enforcement layer, not as the only authorization model.

Future RLS principles:

- every owner-scoped table must have explicit RLS enabled;
- policies must compare the authenticated provider reference to a Levio principal mapping;
- anonymous and guest access must be explicitly denied unless a later guest stage approves it;
- service-role operations must be minimized and isolated;
- tests must prove forged owner IDs and cross-user reads fail;
- RLS must be paired with application-level server checks.

No RLS SQL is approved by Stage 4.2A.

### 7.3 Access Boundaries

Persistence access boundaries:

- public homepage: no persistence access;
- public simulator: no production persistence by default;
- auth pages: no user-owned persistence reads or writes;
- dashboard: registered-user owner-scoped persistence only after runtime implementation;
- export/delete: future high-assurance actions, not part of the first runtime foundation;
- internal operators: no default access to decision content.

### 7.4 Separation from Auth Runtime

Auth runtime proves identity and session state. Persistence runtime authorizes record operations.

The auth layer must not:

- own simulations;
- store decision content;
- decide retention;
- decide memory consent;
- decide subscription entitlements;
- expose provider objects directly to persistence consumers.

The persistence layer must not:

- validate provider tokens directly outside the auth boundary;
- treat a session ID as an owner ID;
- treat Supabase user ID as canonical owner without the approved principal mapping;
- fall back to mock auth on runtime failure.

## 8. Stage 4.2 Breakdown

### 8.1 Stage 4.2A - Persistence Runtime Architecture

Scope:

- define persistence scope;
- define ownership and principal strategy;
- define conceptual data model;
- define lifecycle and security boundaries;
- define stage breakdown and dependencies.

Non-scope:

- runtime code;
- SQL;
- migrations;
- tables;
- API routes;
- simulator changes.

Completion evidence:

- this architecture document exists;
- checks pass;
- no runtime files are changed.

### 8.2 Stage 4.2B - Data Model and Principal Mapping Specification

Scope:

- define exact conceptual table/resource names;
- define internal principal mapping contract;
- define record statuses;
- define export/delete compatibility fields;
- define RLS policy intent in prose;
- define migration plan shape without executing it.

Non-scope:

- executable migrations unless explicitly approved for 4.2B;
- runtime implementation;
- simulator integration.

Recommended output:

- `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`.

### 8.3 Stage 4.2C - Persistence Schema Planning and Migration Readiness

Scope:

- prepare reviewed schema/migration plan if explicitly approved;
- define Supabase project/database prerequisites;
- define RLS test matrix;
- define rollback for schema rollout;
- define backup/deletion implications.

Non-scope unless explicitly approved:

- applying migrations;
- production data writes;
- simulator integration.

### 8.4 Stage 4.2D - Persistence Runtime Foundation

Scope:

- implement server-only persistence boundary;
- resolve authenticated session to Levio principal;
- implement owner-scoped create/read/update/archive/delete primitives for approved entities;
- keep public simulator unchanged;
- keep UI behavior unchanged except where explicitly required to call the persistence boundary.

Required gates:

- data model approved;
- schema/migration approved and applied in a controlled step;
- RLS and server authorization tests defined;
- rollback plan verified.

### 8.5 Stage 4.2E - Simulator Persistence Integration

Scope:

- connect approved save/list/read behavior to saved simulations;
- preserve public simulator V1/mock contract unless a separate runtime-switch approval changes it;
- ensure saving is explicit;
- prevent anonymous local demo data from being treated as production data;
- define any guest-to-account import path only if separately approved.

Non-scope:

- AI integration;
- memory promotion;
- subscriptions;
- broad UI redesign.

### 8.6 Stage 4.2F - Persistence QA and Regression

Scope:

- verify owner isolation;
- verify forged owner rejection;
- verify direct dashboard access;
- verify session expiration behavior;
- verify save/list/read/update/archive/delete;
- verify export/delete compatibility fields;
- verify simulator public contract remains stable;
- verify rollback.

Completion evidence:

- TypeScript, ESLint, production build;
- RLS/server authorization evidence where applicable;
- Stage 3.16 public simulator assumptions preserved.

## 9. Dependencies

### 9.1 Dependencies Before Stage 4.2A

Completed:

- Stage 4.1 auth runtime foundation;
- Supabase Auth provider decision;
- auth runtime hardening;
- user-data architecture;
- production auth architecture.

### 9.2 Dependencies Before Stage 4.2B

Required:

- Stage 4.2A accepted;
- decision on whether `registered_user` is the only initial durable owner type;
- agreement that Supabase `auth.users.id` remains provider reference;
- agreement that guest persistence is deferred unless explicitly approved.

### 9.3 Dependencies Before Stage 4.2C

Required:

- Stage 4.2B accepted;
- Supabase project/database target identified;
- data region and legal/privacy posture reviewed;
- RLS policy intent reviewed;
- export/delete compatibility fields approved;
- rollback and migration review completed.

### 9.4 Dependencies Before Stage 4.2D

Required:

- approved schema and migration step completed or explicitly authorized;
- environment variables available for database/server access if needed;
- server-only persistence boundary file list approved;
- RLS/server authorization tests approved;
- no unresolved auth runtime blockers.

### 9.5 Dependencies Before Stage 4.2E

Required:

- Stage 4.2D persistence boundary passes QA;
- save semantics approved;
- public simulator contract protection reviewed;
- dashboard save/list/read UX scope approved;
- guest/import behavior explicitly approved or deferred.

### 9.6 Dependencies Before Stage 4.2F

Required:

- implementation complete for the approved 4.2 runtime scope;
- test plan includes auth, ownership, lifecycle, rollback, and simulator regression;
- real Supabase environment available if runtime QA requires it.

## 10. Rollback Strategy

### 10.1 Stage 4.2A Rollback

Stage 4.2A is documentation-only.

Rollback:

- revert `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`;
- no database, runtime, migration, or user data rollback is required.

### 10.2 Future Runtime Rollback Requirements

Future persistence rollout must support rollback that:

- disables persistence writes without exposing protected data;
- preserves public simulator V1/mock behavior;
- preserves Stage 3.15 deny-by-default deterministic V2 switch;
- preserves Stage 4.1 auth fail-closed behavior;
- does not fall back to mock auth for production data;
- does not orphan user-owned records;
- does not silently delete user-owned records on code rollback;
- can pause writes while preserving authenticated read/export/delete obligations where legally required;
- documents migration rollback separately from runtime rollback.

### 10.3 Data Rollback Caution

Once real user-owned data exists, rollback cannot be treated as a simple git revert.

Future rollback must distinguish:

- code rollback;
- schema rollback;
- write-disable mode;
- read-only recovery mode;
- data correction;
- deletion lifecycle repair;
- export obligation preservation.

## 11. Roadmap Compliance

Stage 4.2A confirms:

- Stage 4.1 is completed and remains the auth boundary;
- Stage 4.2 starts only as persistence architecture;
- no runtime implementation is created;
- no database schema is created;
- no migrations are created or applied;
- no SQL is created;
- no tables or storage buckets are created;
- no persistence API is created;
- no simulator change is made;
- no auth runtime change is made;
- no decision-engine change is made;
- no public API change is made;
- no UI change is made;
- no subscriptions, billing, payments, AI, memory, analytics, observability, or vector storage is started.

## 12. Next Allowed Step

The next allowed step after Stage 4.2A is a separately approved Stage 4.2B Data Model and Principal Mapping Specification.

Stage 4.2B must remain within its approved scope and must not implement runtime code, create migrations, or connect persistence unless the owner explicitly changes the stage scope.
