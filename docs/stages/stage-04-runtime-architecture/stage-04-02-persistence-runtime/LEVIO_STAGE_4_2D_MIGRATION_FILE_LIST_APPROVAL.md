# LEVIO STAGE 4.2D MIGRATION FILE LIST APPROVAL

## Document Status

- Stage: 4.2D-0 - Persistence Migration File List Approval.
- Status: approval plan only.
- Date: 17 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, and Stage 4.1 Auth Runtime.
- Persistence runtime status: not implemented.
- SQL status: not created.
- Migration status: not created.
- Supabase table status: not created.

This document approves only the future migration file list and review plan. It does not create SQL, migration files, schema files, Supabase tables, runtime code, auth runtime changes, dashboard changes, simulator changes, decision-engine changes, `SimulationResponse` changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.

## 1. Purpose

Stage 4.2D-0 defines the future migration/schema file sequence that may be created in a later explicitly approved step.

The purpose is to prevent the first real schema work from becoming a broad uncontrolled migration. Each future file must have a narrow responsibility, clear dependencies, review checklist, rollback considerations, and ownership/RLS boundary.

No file in this list is created by Stage 4.2D-0.

## 2. Proposed Migration Files

Future migration files should be created under the approved migrations location only after Stage 4.2D-1 is explicitly authorized.

Proposed order:

```text
001_create_levio_principals
002_create_simulation_records
003_create_simulation_drafts
004_create_simulation_history_entries
005_indexes_and_constraints
006_enable_rls_and_policies
007_rollback_notes
```

If timestamped Supabase filenames are required, the stage-aware suffixes should remain equivalent:

```text
YYYYMMDDHHMMSS_001_create_levio_principals.sql
YYYYMMDDHHMMSS_002_create_simulation_records.sql
YYYYMMDDHHMMSS_003_create_simulation_drafts.sql
YYYYMMDDHHMMSS_004_create_simulation_history_entries.sql
YYYYMMDDHHMMSS_005_indexes_and_constraints.sql
YYYYMMDDHHMMSS_006_enable_rls_and_policies.sql
YYYYMMDDHHMMSS_007_rollback_notes.sql
```

The timestamped names are a future naming plan only. Stage 4.2D-0 does not create these files.

## 3. Purpose of Each Migration

### 3.1 `001_create_levio_principals`

Purpose:

- create the future canonical Levio principal mapping table.
- establish `levio_principals.principal_id` as the owner anchor.
- store Supabase `auth.users.id` only as `provider_reference`.

Affected future objects:

- `levio_principals`;
- principal status fields;
- provider reference fields;
- deletion and retention compatibility fields;
- export compatibility fields.

Dependencies:

- Stage 4.2A architecture accepted;
- Stage 4.2B principal mapping accepted;
- Stage 4.2C schema planning accepted;
- Supabase project/database target approved before real migration creation.

Rollback considerations:

- safe before user-owned records reference principals;
- after dependent tables exist, rollback must account for foreign-key dependencies;
- no real user data should exist during initial migration validation.

Review checklist:

- `principal_id` is the only canonical owner anchor;
- provider reference is isolated from user-owned content;
- no provider tokens or secrets are stored;
- deletion and retention fields exist;
- export-compatible minimal identity metadata exists;
- no subscription, memory, billing, or AI fields are introduced.

### 3.2 `002_create_simulation_records`

Purpose:

- create the future saved simulation table.
- store explicitly saved user-owned simulation results and provenance.
- separate user input, deterministic output, metadata, and safety state.

Affected future objects:

- `simulation_records`;
- owner fields;
- simulation payload fields;
- status/deletion/retention/export fields;
- relation to `levio_principals`.

Dependencies:

- `001_create_levio_principals`;
- approved payload policy from Stage 4.2B;
- approved schema planning from Stage 4.2C.

Rollback considerations:

- safe before runtime writes exist;
- after data exists, rollback must preserve export/delete obligations;
- hard deletion must not be the default rollback strategy.

Review checklist:

- owner is `owner_principal_id`, not Supabase `auth.users.id`;
- payload separates user input and deterministic output;
- no AI provider prompts/responses are stored;
- no memory/vector/embedding fields are introduced;
- deletion and retention states exist;
- export eligibility exists;
- record IDs alone cannot authorize access.

### 3.3 `003_create_simulation_drafts`

Purpose:

- create the future registered-user draft table.
- support temporary or explicitly saved drafts with visible lifecycle.
- keep drafts separate from saved simulation history and memory.

Affected future objects:

- `simulation_drafts`;
- owner fields;
- draft text snapshot fields;
- expiry/deletion/retention/export fields;
- optional conversion reference to `simulation_records`.

Dependencies:

- `001_create_levio_principals`;
- future decision that registered-user server-side drafts are in scope;
- Stage 4.2C draft retention/expiry plan.

Rollback considerations:

- draft data is sensitive user-authored content;
- expired/discarded draft cleanup must be understood before production;
- rollback after data exists should prefer write-disable/read-only posture.

Review checklist:

- drafts are owner-scoped;
- drafts include expiry;
- autosave is not silently implied;
- guest drafts are not introduced;
- draft deletion does not create hidden history;
- draft conversion to simulation preserves provenance.

### 3.4 `004_create_simulation_history_entries`

Purpose:

- create the future user-visible simulation history table.
- record lifecycle, revision, and outcome events for saved simulations.
- avoid hidden analytics or operational logs.

Affected future objects:

- `simulation_history_entries`;
- relation to `simulation_records`;
- owner match to parent simulation;
- append-only event model;
- deletion/retention/export fields.

Dependencies:

- `001_create_levio_principals`;
- `002_create_simulation_records`;
- approved history policy from Stage 4.2B and Stage 4.2C.

Rollback considerations:

- safe before runtime writes;
- after data exists, history must follow parent simulation lifecycle;
- rollback must not leave orphaned or cross-owner history entries.

Review checklist:

- parent simulation relationship exists;
- owner matches parent simulation owner;
- history is user-visible lifecycle/revision data, not analytics;
- entries are append-only by default;
- deletion follows parent simulation lifecycle;
- export preserves event order and relationships.

### 3.5 `005_indexes_and_constraints`

Purpose:

- add performance and integrity constraints after base tables exist.
- support owner-scoped listing, export, deletion, and lifecycle queries.
- enforce uniqueness and relationship expectations.

Affected future objects:

- indexes for all four future tables;
- uniqueness constraints;
- foreign-key constraints;
- optional owner/status/deletion/export lookup indexes.

Dependencies:

- base tables created;
- all planned key columns reviewed;
- expected access patterns approved.

Rollback considerations:

- indexes are generally reversible before production traffic;
- uniqueness/foreign-key changes can fail if existing data violates assumptions;
- constraints should be validated against synthetic data before production.

Review checklist:

- no uniqueness by user input, title, email, or display name;
- active provider reference uniqueness is scoped correctly;
- owner-scoped query indexes exist;
- deletion/export processing indexes exist;
- foreign keys do not cause accidental destructive cascades;
- performance additions do not change ownership semantics.

### 3.6 `006_enable_rls_and_policies`

Purpose:

- enable future RLS and define owner-scoped access policies.
- make database enforcement align with server-side principal resolution.
- fail closed when principal mapping is absent or invalid.

Affected future objects:

- RLS enablement for owner-scoped tables;
- select/insert/update/delete policies;
- service-role boundary assumptions;
- guest-deny posture.

Dependencies:

- base tables created;
- indexes and constraints reviewed;
- server-side principal resolution model approved;
- RLS test plan approved before policies are applied.

Rollback considerations:

- disabling RLS is not an acceptable production rollback if user data exists;
- rollback should prefer read-only/write-disabled application posture;
- policy rollback must preserve fail-closed behavior.

Review checklist:

- no policy allows broad authenticated-user access;
- policies use principal mapping, not client-provided owner ID;
- insert policies derive owner from authenticated mapping;
- guest access is denied;
- service role is server-only and purpose-bound;
- forged owner IDs fail;
- missing principal mapping fails closed.

### 3.7 `007_rollback_notes`

Purpose:

- document migration rollback and operational recovery notes.
- separate code rollback, schema rollback, write-disable mode, read-only mode, data correction, and export/delete obligations.

Affected future objects:

- documentation-only migration companion file or rollback notes;
- no runtime object;
- no database object unless future migration tooling requires comments metadata.

Dependencies:

- all planned migration files reviewed;
- rollback approach approved by owner before any migration is applied.

Rollback considerations:

- this file is the rollback guide;
- it must explain what can and cannot be safely reverted after data exists.

Review checklist:

- no assumption that git revert is enough after user data exists;
- destructive rollback requires explicit data lifecycle approval;
- read-only/write-disabled posture is defined;
- export/delete obligations remain preserved;
- environment-specific rollback steps are separated.

## 4. Schema Boundary

Approved schema boundary for future migration creation:

- canonical owner anchor: `levio_principals.principal_id`;
- Supabase `auth.users.id` is only `provider_reference`;
- client-side owner injection is forbidden;
- `owner_principal_id` is derived server-side;
- service role is server-side only;
- service role never enters client bundles, browser code, public simulator code, or public logs;
- user-owned tables do not store provider tokens;
- simulation payloads do not store AI provider prompts, raw AI responses, vectors, embeddings, memory, subscriptions, or billing data.

The future schema must preserve the Stage 4.1 auth boundary and must not modify auth runtime behavior.

## 5. RLS Review Plan

### 5.1 Required Future RLS Policies

Future RLS policy groups:

- `levio_principals`: current authenticated principal can resolve/read only its own minimized principal record through provider mapping.
- `simulation_records`: owner-only select/insert/update/delete lifecycle access.
- `simulation_drafts`: owner-only select/insert/update/delete lifecycle access, with expiry/deletion constraints.
- `simulation_history_entries`: owner-only select, server-created insert, lifecycle update/delete following parent simulation rules.
- guest-deny policies: no guest access unless a later guest persistence stage approves it.
- service-role operational path: server-only, purpose-bound, not client accessible.

No SQL policies are created in Stage 4.2D-0.

### 5.2 Cross-User Isolation Tests

Future tests must prove:

- user A cannot list user B simulations;
- user A cannot read user B simulation by ID;
- user A cannot update/archive/delete user B simulation;
- user A cannot read or update user B drafts;
- user A cannot read user B history entries;
- direct record IDs do not grant access;
- archived/deleted records do not leak outside allowed lifecycle actions.

### 5.3 Forged Owner ID Tests

Future tests must prove:

- insert with forged `owner_principal_id` fails;
- update request that changes `owner_principal_id` fails;
- request with mismatched `provider_reference` fails;
- client-supplied owner fields are ignored or rejected;
- service-role path cannot be invoked from client runtime.

### 5.4 Guest Restriction Tests

Future tests must prove:

- unauthenticated requests cannot read/write persistence tables;
- Supabase anonymous sign-in users do not gain registered-user access;
- guest-like localStorage state cannot authorize production records;
- guest principal access remains denied until separately approved.

### 5.5 Fail-Closed Access Tests

Future tests must prove access is denied when:

- session is missing;
- session is expired;
- session is invalid;
- principal mapping is missing;
- principal is disabled/restricted/deleted;
- provider reference is revoked;
- RLS policy version is missing or unexpected;
- owner mismatch exists;
- deletion state blocks normal access.

## 6. Stage 4.2D-1 Prerequisites

Before real migration files may be created:

1. Stage 4.2D-0 must be accepted.
2. Supabase project/database target must be confirmed for local/dev/preview/prod.
3. Migration directory location must be explicitly approved.
4. Timestamp naming convention must be confirmed.
5. Future SQL authoring scope must be approved file-by-file.
6. RLS policy intent must be reviewed before SQL exists.
7. Cross-user isolation test plan must be accepted.
8. Forged owner ID test plan must be accepted.
9. Guest restriction and fail-closed test plan must be accepted.
10. Rollback/write-disable/read-only strategy must be accepted.
11. Service-role usage policy must be accepted.
12. No Stage 4.3 User Data Controls scope may be added.
13. No Stage 4.4 Subscription Runtime scope may be added.
14. No simulator persistence integration may begin.
15. No runtime persistence code may be written.

Stage 4.2D-1 may create migration files only if explicitly authorized by a later user request.

## 7. Roadmap Compliance

Stage 4.2D-0 confirms:

- future migration file list is defined;
- purpose, dependencies, rollback considerations, and review checklist are defined per future file;
- schema boundary is reaffirmed;
- RLS review plan is defined;
- Stage 4.2D-1 prerequisites are defined;
- SQL is not created;
- migrations are not created;
- schema files are not created;
- Supabase tables are not created;
- runtime code is not written;
- auth runtime is not changed;
- dashboard is not changed;
- simulator is not changed;
- decision engine and `SimulationResponse` are not changed;
- package files are not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 are not started.
