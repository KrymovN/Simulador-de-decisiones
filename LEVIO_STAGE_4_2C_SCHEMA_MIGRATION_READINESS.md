# LEVIO STAGE 4.2C SCHEMA MIGRATION READINESS

## Document Status

- Stage: 4.2C - Persistence Schema Planning and Migration Readiness.
- Status: planning specification only.
- Date: 17 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_USER_DATA_ARCHITECTURE.md`, `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, `LEVIO_AUTH_PROVIDER_DECISION.md`, and `LEVIO_STAGE_4_1_AUTH_RUNTIME_HARDENING.md`.
- Auth status: Stage 4.1 completed and pushed in `7ec286c`.
- Persistence runtime status: not implemented.
- Database schema status: not created.
- SQL status: not created.
- Migration status: not created.
- Supabase table status: not created.

This document prepares future persistence schema and migration readiness at planning level only. It does not create SQL, migrations, Supabase tables, runtime code, auth runtime changes, simulator changes, dashboard changes, UI changes, AI, memory, subscriptions, billing, or payments.

## 1. Purpose

Stage 4.2C translates the Stage 4.2A architecture and Stage 4.2B principal/data-model specification into a future schema planning and migration-readiness blueprint.

It defines:

- planned tables and columns in prose;
- required and nullable fields;
- index and uniqueness intentions;
- foreign-key strategy;
- deletion, retention, and export compatibility;
- future RLS model;
- migration file conventions and rollout readiness;
- data-integrity rules;
- environment requirements;
- Stage 4.2D prerequisites;
- risk register.

This is not an implementation step.

## 2. Schema Planning Principles

Future schema work must follow these principles:

- `levio_principals.principal_id` is the canonical owner anchor.
- Supabase `auth.users.id` remains a provider reference.
- User-owned records never rely on client-provided owner IDs.
- Unknown ownership is invalid for persistent user-owned data.
- All user-owned records must be export-compatible.
- All user-owned records must have deletion and retention states.
- Drafts remain temporary unless explicitly saved or approved for visible autosave.
- Simulation history is user-visible lifecycle/revision history, not a hidden analytics log.
- Memory, subscriptions, billing, analytics, vectors, and AI provider storage are excluded.
- RLS is a future enforcement layer, not the only authorization model.

## 3. Future Table: `levio_principals`

### 3.1 Purpose

`levio_principals` is the stable Levio owner-principal table. It maps a verified auth identity to a Levio-controlled principal that can own user data.

It must not store decision content.

### 3.2 Planned Columns

Required planned columns:

```text
principal_id
principal_type
principal_status
primary_provider
primary_provider_reference
provider_reference_status
created_at
updated_at
verified_at
deletion_state
retention_rule
schema_version
```

Nullable planned columns:

```text
disabled_at
deleted_at
last_authenticated_at
last_provider_sync_at
recovery_state
locale_preference
metadata_version
deletion_requested_at
legal_hold_reason
```

### 3.3 Required Fields

Required:

- `principal_id`;
- `principal_type`;
- `principal_status`;
- `primary_provider`;
- `primary_provider_reference`;
- `provider_reference_status`;
- `created_at`;
- `updated_at`;
- `verified_at`;
- `deletion_state`;
- `retention_rule`;
- `schema_version`.

### 3.4 Nullable Fields

Nullable:

- `disabled_at`;
- `deleted_at`;
- `last_authenticated_at`;
- `last_provider_sync_at`;
- `recovery_state`;
- `locale_preference`;
- `metadata_version`;
- `deletion_requested_at`;
- `legal_hold_reason`.

Nullable fields must not be used to bypass required ownership checks.

### 3.5 Indexes

Planned index intent:

- primary lookup by `principal_id`;
- lookup by `primary_provider` plus `primary_provider_reference`;
- lookup by `principal_status`;
- lookup by `deletion_state`;
- lookup by `last_authenticated_at` for future account/security maintenance.

### 3.6 Uniqueness Constraints

Planned uniqueness intent:

- `principal_id` is unique.
- Active provider links should be unique by `primary_provider` plus `primary_provider_reference`.
- Email, display name, locale, or subscription state must not be unique owner anchors.

Future account-linking may require a separate provider-link table, but Stage 4.2C does not create it.

### 3.7 Foreign-Key Strategy

`levio_principals` is the parent owner table for:

- `simulation_records.owner_principal_id`;
- `simulation_drafts.owner_principal_id`;
- `simulation_history_entries.owner_principal_id`.

It must not depend on public product tables. It may logically reference Supabase `auth.users.id` through `primary_provider_reference`, but schema planning should avoid a brittle direct ownership dependency on provider-native IDs unless reviewed.

### 3.8 Deletion Strategy

Account deletion should move a principal through deletion lifecycle states:

```text
active
deletion_requested
restricted
deleted
anonymized
retained_legal_exception
```

Deleting a principal must trigger handling for owned simulations, drafts, and history. Minimal retained records must not preserve a hidden user profile.

### 3.9 Retention Strategy

Retention:

- active principal records exist while the account exists;
- disabled principals remain only as needed for security/recovery;
- deleted principals are deleted, anonymized, or minimally retained under approved legal/operational basis;
- retention must be testable and documented before production data exists.

### 3.10 Export Compatibility

Export may include:

- principal ID;
- principal type;
- principal status;
- creation and verification timestamps;
- provider-independent account metadata.

Export must exclude:

- provider tokens;
- auth secrets;
- internal security risk signals;
- raw security logs;
- unrelated provider profile blobs.

## 4. Future Table: `simulation_records`

### 4.1 Purpose

`simulation_records` stores explicitly saved user-owned simulation results and their provenance.

It is the primary future persisted decision-analysis record.

### 4.2 Planned Columns

Required planned columns:

```text
simulation_id
owner_principal_id
owner_principal_type
record_status
source_type
user_input_snapshot
deterministic_output_snapshot
simulation_response_version
decision_contract_version
language
safety_classification
recommendation_state
content_sensitivity
created_at
updated_at
deletion_state
retention_rule
export_eligible
schema_version
```

Nullable planned columns:

```text
title
user_note
clarification_snapshot
decision_model_snapshot
confidence_summary
archived_at
deleted_at
last_exported_at
originating_draft_id
parent_simulation_id
revision_label
legal_hold_reason
```

### 4.3 Required Fields

Required:

- `simulation_id`;
- `owner_principal_id`;
- `owner_principal_type`;
- `record_status`;
- `source_type`;
- `user_input_snapshot`;
- `deterministic_output_snapshot`;
- `simulation_response_version`;
- `decision_contract_version`;
- `language`;
- `safety_classification`;
- `recommendation_state`;
- `content_sensitivity`;
- `created_at`;
- `updated_at`;
- `deletion_state`;
- `retention_rule`;
- `export_eligible`;
- `schema_version`.

### 4.4 Nullable Fields

Nullable:

- `title`;
- `user_note`;
- `clarification_snapshot`;
- `decision_model_snapshot`;
- `confidence_summary`;
- `archived_at`;
- `deleted_at`;
- `last_exported_at`;
- `originating_draft_id`;
- `parent_simulation_id`;
- `revision_label`;
- `legal_hold_reason`.

### 4.5 Indexes

Planned index intent:

- primary lookup by `simulation_id`;
- owner-scoped listing by `owner_principal_id`, `record_status`, and `updated_at`;
- owner-scoped archive/deletion lookup by `owner_principal_id` and `deletion_state`;
- owner-scoped export lookup by `owner_principal_id` and `export_eligible`;
- optional lookup by `originating_draft_id`;
- optional lookup by `parent_simulation_id` for revisions.

### 4.6 Uniqueness Constraints

Planned uniqueness intent:

- `simulation_id` is unique.
- No uniqueness by title.
- No uniqueness by user input.
- Idempotent future save operations may require a separate idempotency key or request key, not direct content uniqueness.

### 4.7 Foreign-Key Strategy

Planned relation intent:

- `owner_principal_id` references `levio_principals.principal_id`.
- `originating_draft_id` may reference `simulation_drafts.draft_id` when present.
- `parent_simulation_id` may reference `simulation_records.simulation_id` for revisions.
- `simulation_history_entries.simulation_id` references this table.

Foreign-key actions must avoid accidental user-data deletion outside the approved deletion lifecycle.

### 4.8 Deletion Strategy

Deleting a simulation should:

- set deletion lifecycle state first;
- hide it from normal owner lists;
- address dependent history entries;
- address future derived records and memory links if those stages are later approved;
- retain only minimal opaque proof if needed.

Hard deletion should not occur until retention, backup, export, and legal exception rules are defined.

### 4.9 Retention Strategy

Retention:

- active records persist until user deletion, account deletion, or configured retention;
- archived records remain export eligible;
- deleted records enter restricted/deleted/anonymized state;
- retained legal exceptions must be narrow and excluded from normal product processing.

### 4.10 Export Compatibility

Export should include:

- user input snapshot;
- deterministic output snapshot;
- visible metadata;
- safety notices;
- language;
- timestamps;
- provenance;
- contract versions;
- revision relationships where applicable.

Export must not include:

- provider tokens;
- hidden AI traces;
- internal operational logs;
- another user's records;
- raw secrets.

## 5. Future Table: `simulation_drafts`

### 5.1 Purpose

`simulation_drafts` stores user-authored decision drafts when server-side registered-user drafts are explicitly approved.

Drafts remain temporary by default.

### 5.2 Planned Columns

Required planned columns:

```text
draft_id
owner_principal_id
owner_principal_type
draft_status
draft_text_snapshot
language
created_at
updated_at
expires_at
deletion_state
retention_rule
export_eligible
schema_version
```

Nullable planned columns:

```text
clarification_answers_snapshot
structured_context_snapshot
autosave_enabled
last_autosaved_at
originating_surface
converted_simulation_id
discarded_at
deleted_at
legal_hold_reason
```

### 5.3 Required Fields

Required:

- `draft_id`;
- `owner_principal_id`;
- `owner_principal_type`;
- `draft_status`;
- `draft_text_snapshot`;
- `language`;
- `created_at`;
- `updated_at`;
- `expires_at`;
- `deletion_state`;
- `retention_rule`;
- `export_eligible`;
- `schema_version`.

### 5.4 Nullable Fields

Nullable:

- `clarification_answers_snapshot`;
- `structured_context_snapshot`;
- `autosave_enabled`;
- `last_autosaved_at`;
- `originating_surface`;
- `converted_simulation_id`;
- `discarded_at`;
- `deleted_at`;
- `legal_hold_reason`.

### 5.5 Indexes

Planned index intent:

- primary lookup by `draft_id`;
- owner-scoped listing by `owner_principal_id`, `draft_status`, and `updated_at`;
- expiry processing by `expires_at`;
- deletion processing by `deletion_state`;
- optional lookup by `converted_simulation_id`.

### 5.6 Uniqueness Constraints

Planned uniqueness intent:

- `draft_id` is unique.
- Draft text is not unique.
- A draft may convert to at most one final simulation unless a later revision workflow explicitly allows multiple conversions.

### 5.7 Foreign-Key Strategy

Planned relation intent:

- `owner_principal_id` references `levio_principals.principal_id`.
- `converted_simulation_id` may reference `simulation_records.simulation_id`.

The schema should avoid requiring a simulation record for every draft.

### 5.8 Deletion Strategy

Draft deletion should:

- support explicit discard;
- support expiry;
- avoid leaving raw draft text in operational logs;
- mark deletion state before hard deletion if needed for recovery or audit;
- not create hidden history.

### 5.9 Retention Strategy

Retention:

- unsaved drafts use short retention;
- server-side autosave must be visible before it exists;
- expired drafts become inaccessible;
- registered saved drafts may persist only under approved settings.

### 5.10 Export Compatibility

Export should include:

- saved registered drafts that still exist;
- original language;
- timestamps;
- draft status;
- related final simulation where applicable.

Expired and hard-deleted temporary drafts should not be exported unless retained within an approved recovery window.

## 6. Future Table: `simulation_history_entries`

### 6.1 Purpose

`simulation_history_entries` stores user-visible lifecycle, revision, and outcome events for saved simulations.

It is not an analytics table and not a hidden activity log.

### 6.2 Planned Columns

Required planned columns:

```text
history_entry_id
owner_principal_id
owner_principal_type
simulation_id
event_type
event_timestamp
event_source
user_visible
deletion_state
retention_rule
export_eligible
schema_version
```

Nullable planned columns:

```text
event_summary
before_reference
after_reference
revision_reference
outcome_snapshot
claim_transaction_reference
export_reference
deleted_at
legal_hold_reason
```

### 6.3 Required Fields

Required:

- `history_entry_id`;
- `owner_principal_id`;
- `owner_principal_type`;
- `simulation_id`;
- `event_type`;
- `event_timestamp`;
- `event_source`;
- `user_visible`;
- `deletion_state`;
- `retention_rule`;
- `export_eligible`;
- `schema_version`.

### 6.4 Nullable Fields

Nullable:

- `event_summary`;
- `before_reference`;
- `after_reference`;
- `revision_reference`;
- `outcome_snapshot`;
- `claim_transaction_reference`;
- `export_reference`;
- `deleted_at`;
- `legal_hold_reason`.

### 6.5 Indexes

Planned index intent:

- primary lookup by `history_entry_id`;
- owner-scoped history by `owner_principal_id` and `event_timestamp`;
- simulation-scoped history by `simulation_id` and `event_timestamp`;
- owner-visible history by `owner_principal_id`, `user_visible`, and `event_timestamp`;
- deletion processing by `deletion_state`.

### 6.6 Uniqueness Constraints

Planned uniqueness intent:

- `history_entry_id` is unique.
- A future idempotency key may be unique for claim/export lifecycle events.
- Event summaries are not unique.

### 6.7 Foreign-Key Strategy

Planned relation intent:

- `owner_principal_id` references `levio_principals.principal_id`.
- `simulation_id` references `simulation_records.simulation_id`.
- `owner_principal_id` must match the parent simulation owner.

Parent-owner mismatch is invalid.

### 6.8 Deletion Strategy

History deletion should:

- follow parent simulation deletion;
- preserve only minimal opaque proof where required;
- avoid retaining raw deleted decision content;
- not expose internal operational entries as user-visible history.

### 6.9 Retention Strategy

Retention:

- user-visible history follows parent simulation retention;
- internal operational entries, if any later exist, require shorter independent retention;
- hidden activity logs are out of scope.

### 6.10 Export Compatibility

Export should include:

- user-visible entries;
- event ordering;
- event types;
- timestamps;
- parent simulation relationship;
- revision and outcome references where applicable.

Export should exclude internal-only operational events unless they are required for user-visible account activity.

## 7. RLS Planning

No SQL policies are created in Stage 4.2C.

### 7.1 Owner and Principal Access

Future RLS must enforce owner-scoped access by resolving the authenticated provider reference to a Levio principal.

Desired model:

```text
authenticated Supabase user
->
provider_reference
->
levio_principals.principal_id
->
record.owner_principal_id
```

Every owner-scoped table must deny access when this mapping cannot be proven.

### 7.2 Authenticated User Access

Authenticated users may access only records owned by their resolved `principal_id`.

Access intent:

- read own active/archived records;
- create records only under own principal;
- update own records within allowed lifecycle rules;
- delete or request deletion only for own records;
- export only own eligible records.

Authenticated status alone is not enough. Ownership must also match.

### 7.3 Guest Limitations

Guest access is denied for the first schema plan.

Future guest access may be planned only after:

- guest principal scope is approved;
- expiry model is approved;
- claim flow is approved;
- RLS policies can distinguish guest from registered owner records safely.

Supabase anonymous sign-ins remain disabled by default.

### 7.4 Service Role Boundaries

Service role access must be rare, server-only, and purpose-bound.

Allowed future uses may include:

- controlled migration;
- deletion lifecycle jobs;
- export package generation;
- retention cleanup;
- account deletion orchestration.

Service role must not be exposed to client bundles, browser code, public routes, or logs. Service role bypass of RLS must be paired with server-side authorization and auditable purpose.

### 7.5 Forbidden Client-Side Owner Injection

Client requests must not decide:

- `owner_principal_id`;
- `owner_principal_type`;
- `provider_reference`;
- `principal_status`;
- entitlement state;
- deletion exception state.

Server-side code must derive owner identity from the validated Stage 4.1 auth runtime and principal mapping.

### 7.6 Fail-Closed Principles

Future RLS and server-side authorization must fail closed when:

- no session exists;
- session is expired or invalid;
- provider reference cannot be resolved;
- principal is disabled, deleted, restricted, or missing;
- owner mismatch occurs;
- deletion state blocks access;
- guest scope is not approved;
- policy version is unknown.

### 7.7 Server-Side Principal Resolution

Persistence runtime must resolve principal server-side before any write and before any sensitive read.

Resolution steps for future Stage 4.2D:

1. Validate session through Stage 4.1 auth runtime.
2. Read provider reference from normalized auth state.
3. Resolve provider reference to `levio_principals.principal_id`.
4. Verify principal status.
5. Execute owner-scoped operation.
6. Let RLS enforce the same owner boundary at database level.

## 8. Migration Readiness

### 8.1 Future Migration File Location

Future migration files should live under a dedicated migrations location, likely:

```text
supabase/migrations/
```

Stage 4.2C does not create this directory and does not create migration files.

### 8.2 Naming Convention

Future migration filenames should follow a timestamped, stage-aware naming convention:

```text
YYYYMMDDHHMMSS_stage_4_2c_persistence_foundation.sql
YYYYMMDDHHMMSS_stage_4_2c_persistence_rls_policies.sql
YYYYMMDDHHMMSS_stage_4_2c_persistence_indexes.sql
```

Names should be descriptive, monotonic, and reviewable. They must not hide broad unrelated changes.

### 8.3 Rollback Approach

Schema rollback must be planned before migrations are applied.

Rollback principles:

- prefer additive forward migrations;
- avoid destructive migration unless data lifecycle is approved;
- document rollback for each migration;
- separate code rollback from schema rollback;
- provide write-disable/read-only mode for runtime rollback;
- preserve export/delete obligations when data exists;
- never rely on git revert alone after real user data exists.

### 8.4 Migration Order

Recommended future order:

1. Create principal mapping foundation.
2. Add simulation record table.
3. Add simulation draft table.
4. Add simulation history table.
5. Add indexes and uniqueness constraints.
6. Add foreign keys after parent tables exist.
7. Add RLS policies after ownership columns and principal mapping exist.
8. Add validation and QA evidence.
9. Apply only after environment and rollback readiness are confirmed.

This order is planning only, not executable.

### 8.5 Seed Data Policy

Production seed data:

- no user-owned production seed data;
- no synthetic personal content in production;
- no shared demo users with persisted decision content.

Local/dev seed data:

- synthetic only;
- clearly marked as development data;
- no real personal decision content;
- no copied user data from production;
- resettable without affecting production.

### 8.6 Local, Dev, Preview, and Production Separation

Separation requirements:

- local, preview, and production Supabase projects must not share real user data;
- production data must never be imported into local development by default;
- preview environments must use isolated test data;
- migration testing must happen outside production first;
- environment variables must be scoped per environment;
- project refs and keys must not be mixed between environments.

## 9. Data Integrity Rules

### 9.1 Principal Immutability

`principal_id` must be immutable after creation.

Rules:

- email changes do not change `principal_id`;
- provider recovery does not change `principal_id` when account continuity is proven;
- subscription state does not change `principal_id`;
- workspace membership does not change personal `principal_id`;
- account linking requires explicit verified process.

### 9.2 Provider Reference Rules

Provider references:

- are identity links, not owner IDs;
- may be revoked or replaced without deleting user-owned data automatically;
- must be unique for active primary provider links;
- must not store provider tokens;
- must not be written from client input.

### 9.3 Simulation Payload Constraints

Simulation payload must:

- separate user input from deterministic output;
- include contract/schema versions;
- include safety classification;
- include provenance;
- exclude provider tokens, raw AI traces, raw audio, embeddings, vectors, hidden memory, and operational logs;
- avoid storing unsupported inferences as facts.

### 9.4 Draft Lifecycle Constraints

Draft lifecycle:

- drafts are temporary by default;
- server-side autosave must be visible;
- drafts require expiry;
- expired drafts become inaccessible;
- draft deletion must not create hidden history;
- converting a draft into a simulation must preserve provenance.

### 9.5 History Append-Only or Mutable Policy

History entries should be append-only by default.

Allowed changes:

- deletion lifecycle state updates;
- restriction/anonymization metadata;
- correction through a new entry;
- export/deletion status metadata where user-visible.

Not allowed by default:

- silent rewrite of material decision history;
- hidden operational activity logs;
- analytics events stored as decision history.

### 9.6 Deletion and Export Compatibility

Every table must support:

- deletion state;
- retention rule;
- export eligibility;
- timestamps;
- provenance or relationship fields;
- owner-scoped filtering.

Deletion and export must remain possible even if subscription is cancelled or downgraded.

## 10. Environment Requirements

### 10.1 Supabase Project Requirements

Before schema implementation:

- Supabase project selected for local/dev/preview/prod separation;
- region/legal posture reviewed;
- auth settings reviewed;
- RLS support confirmed;
- database backup/restore posture understood;
- service role usage policy approved;
- project access limited to authorized maintainers.

### 10.2 Required Environment Variables

Existing/future auth variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
LEVIO_AUTH_PROVIDER
LEVIO_APP_URL
LEVIO_AUTH_REDIRECT_ALLOWLIST
```

Future persistence variables may include server-only database or service credentials, but Stage 4.2C does not create them.

Any future server-only secret must:

- never use `NEXT_PUBLIC_`;
- never be exposed to the browser;
- be scoped per environment;
- be rotated if leaked;
- be documented before use.

### 10.3 Local Development Requirements

Local development must support:

- isolated local or development Supabase project;
- synthetic test users only;
- synthetic decision content only;
- repeatable migration test process;
- clear reset command or manual reset procedure;
- no production data import by default.

### 10.4 Production Deployment Requirements

Production deployment requires:

- approved Supabase production project;
- reviewed environment variables;
- RLS policies applied and tested;
- rollback and read-only/write-disabled posture defined;
- export/delete lifecycle implications reviewed;
- monitoring of migration application status without exposing user content.

### 10.5 Vercel Environment Readiness

Vercel readiness requires:

- production env values set only in production scope;
- preview env values point to preview/dev Supabase project;
- no service role key exposed to client runtime;
- deployment ordering defined when migrations are introduced;
- rollback plan for code deploy separate from schema rollback;
- protected dashboard remains fail-closed if persistence env is missing.

## 11. Stage 4.2D Prerequisites

Stage 4.2D Persistence Runtime Foundation may begin only after:

1. Stage 4.2C is accepted.
2. Future schema file list is explicitly approved.
3. Migration files are created only in a separately approved step.
4. Supabase project/database target is confirmed.
5. Environment variable strategy is approved.
6. RLS policy intent is converted into reviewed SQL in a separate migration step.
7. RLS tests for forged owner IDs and cross-user isolation are defined.
8. Principal resolution flow is approved for runtime implementation.
9. Server-only persistence boundary file list is approved.
10. Rollback/write-disable/read-only plan is approved.
11. Export/delete compatibility is accepted.
12. Public simulator V1/mock contract protection is reaffirmed.
13. Stage 4.3 User Data Controls remains closed.
14. Stage 4.4 Subscription Runtime remains closed.
15. No unresolved Stage 4.1 auth blockers affect persistence identity.

Stage 4.2D must not start simulator persistence integration unless its own approved scope includes it.

## 12. Risk Register

### 12.1 Incorrect Ownership Mapping

Risk:

- Supabase `auth.users.id` becomes the implicit owner ID and weakens future provider migration or recovery.

Mitigation:

- keep `levio_principals.principal_id` as owner anchor;
- keep provider reference isolated;
- test account recovery and provider-reference resolution.

### 12.2 RLS Mistakes

Risk:

- overly broad policies expose data across users or fail open for missing mappings.

Mitigation:

- deny by default;
- test forged owner IDs;
- test cross-user reads/writes;
- pair RLS with server-side authorization.

### 12.3 Accidental Public Data Exposure

Risk:

- public simulator, dashboard demo data, or client code reads/writes persisted records without proper ownership checks.

Mitigation:

- keep public simulator unchanged until approved;
- server-only persistence boundary;
- no client-side owner injection;
- protected dashboard remains fail-closed.

### 12.4 Migration Rollback Issues

Risk:

- destructive schema changes or rollback confusion after real data exists.

Mitigation:

- additive migrations first;
- migration rollback plans before apply;
- separate schema rollback from code rollback;
- read-only/write-disabled recovery posture.

### 12.5 Auth/Persistence Coupling

Risk:

- auth provider details leak into product data model or simulation payloads.

Mitigation:

- provider references stored only in principal mapping;
- product tables use Levio principal IDs;
- no provider tokens in persistence records.

### 12.6 Premature Simulator Integration

Risk:

- save/list behavior is connected before schema, RLS, authorization, and rollback are ready.

Mitigation:

- Stage 4.2C remains planning-only;
- Stage 4.2D must implement foundation before 4.2E integration;
- public V1/mock simulator contract remains protected.

### 12.7 Premature Stage 4.3 or 4.4 Coupling

Risk:

- user data controls, subscriptions, billing, or entitlements influence persistence schema before their stages are approved.

Mitigation:

- no subscription/billing fields in Stage 4.2 tables;
- no memory tables;
- export/delete compatibility fields only, not User Data Controls runtime;
- keep Stage 4.3 and Stage 4.4 closed.

## 13. Roadmap Compliance

Stage 4.2C confirms:

- schema planning is documented;
- migration readiness is documented;
- future RLS strategy is documented without SQL policies;
- data integrity rules are documented;
- environment requirements are documented;
- Stage 4.2D prerequisites are documented;
- risk register is documented;
- no SQL is created;
- no migrations are created;
- no Supabase tables are created;
- no runtime code is created;
- auth runtime is not changed;
- simulator is not changed;
- dashboard and UI are not changed;
- decision engine and `SimulationResponse` runtime are not changed;
- AI, memory, subscriptions, billing, payments, Stage 4.3, and Stage 4.4 are not started.
