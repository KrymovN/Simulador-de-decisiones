# LEVIO STAGE 4.2D-2 MIGRATION SQL REVIEW HARDENING

## Document Status

- Stage: 4.2D-2 - Persistence Migration SQL Review Hardening.
- Status: documentation-only SQL review hardening.
- Date: 17 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2D_1_MIGRATION_SQL_REVIEW_DRAFT.md`, `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `LEVIO_USER_DATA_ARCHITECTURE.md`, and Stage 4.1 Auth Runtime.
- Persistence runtime status: not implemented.
- Real SQL file status: not created.
- Migration status: not created.
- Supabase table status: not created.
- Supabase connection status: not connected.

This document reviews and hardens the Stage 4.2D-1 SQL review draft before any real migration files are created. It does not create `.sql` files, migration directories, Supabase tables, runtime code, auth runtime changes, dashboard changes, simulator changes, decision-engine changes, `SimulationResponse` changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.

## 1. SQL Draft Review

### 1.1 Ownership Correctness

Review result: acceptable after hardening.

The D-1 draft correctly keeps `levio_principals.principal_id` as the canonical owner anchor and uses `owner_principal_id` on `simulation_records`, `simulation_drafts`, and `simulation_history_entries`.

Required hardening applied:

- D-1 now states database-level immutability for `owner_principal_id` and `owner_principal_type`.
- D-1 now promotes history parent-owner alignment to a required composite foreign-key strategy.

Remaining rule for real migrations:

- runtime must derive `owner_principal_id` server-side from the authenticated Supabase session and Levio principal mapping;
- browser/client input must never decide owner fields.

### 1.2 `principal_id` Immutability

Review result: issue found and corrected in D-1 draft.

`principal_id` was already a primary key, but the D-1 draft did not explicitly block updates to the owner anchor at database level. Stage 4.2C requires principal immutability.

Hardening applied:

- D-1 now includes a review-draft trigger function and trigger to reject `principal_id` updates.
- D-1 now includes review notes that this invariant is required before real SQL.

### 1.3 `provider_reference` Uniqueness

Review result: issue found and corrected in D-1 draft.

The D-1 provider-reference unique index originally covered only `deletion_state = 'active'`. That left a review ambiguity for deletion-requested or restricted principals that still have active provider links.

Hardening applied:

- D-1 now scopes active provider-reference uniqueness across non-terminal principal states:
  - `principal_status in ('active', 'restricted', 'deletion_requested')`;
  - `deletion_state in ('active', 'deletion_requested', 'restricted')`.

Review rationale:

- a single active Supabase `provider_reference` must not map to multiple non-terminal Levio principals;
- deleted/anonymized retained records still require separate legal/recovery review before any provider reference reuse.

### 1.4 Foreign-Key Strategy

Review result: acceptable after hardening.

The D-1 draft correctly avoids destructive cascades by using `on delete restrict` for owner-critical records. Optional provenance references use `on delete set null`.

Required hardening applied:

- D-1 now adds a unique `(simulation_id, owner_principal_id)` constraint on `simulation_records`;
- D-1 now adds a composite FK from `simulation_history_entries(simulation_id, owner_principal_id)` to `simulation_records(simulation_id, owner_principal_id)`;
- the previously optional parent-owner match strategy is now required for real migration review.

Remaining review item before real SQL:

- the optional draft/simulation cross-references create dependency complexity. Real SQL should confirm whether both `originating_draft_id` and `converted_simulation_id` are needed in the first migration set, or whether one should be deferred to reduce circular references.

### 1.5 Deletion Behavior

Review result: acceptable for review draft.

The draft uses deletion lifecycle fields instead of hard-delete-first behavior:

- `deletion_state`;
- `deleted_at`;
- `retention_rule`;
- `legal_hold_reason`;
- deny-by-default client deletes in RLS draft.

Hardening note:

- real runtime must implement deletion as lifecycle update through server-side authorization, not raw client delete;
- database `on delete restrict` aligns with the lifecycle model.

### 1.6 Retention Compatibility

Review result: acceptable for review draft.

The draft includes retention rules on all future tables:

- `account_lifecycle`;
- `saved_simulation_lifecycle`;
- `draft_short_lifecycle`;
- `parent_simulation_lifecycle`.

Remaining review item before production apply:

- retention strings need approved operational semantics before real user data exists;
- backups and legal exceptions remain outside this migration review and must be covered before production data.

### 1.7 Export Compatibility

Review result: acceptable for review draft.

The draft includes:

- `export_eligible`;
- `last_exported_at` where relevant;
- stable record IDs;
- relationship fields for draft -> simulation and simulation -> history;
- original `language`;
- contract/version fields for saved simulations.

Hardening note:

- export runtime is not implemented in Stage 4.2D-2;
- export compatibility fields do not start Stage 4.3 User Data Controls.

### 1.8 RLS Correctness

Review result: acceptable after hardening requirements are made explicit.

The D-1 RLS draft correctly:

- uses `auth.uid()` only to resolve `provider_reference`;
- maps access through `levio_principals.principal_id`;
- denies guest access by absence of policies;
- denies direct principal writes from authenticated clients;
- denies client-side history insert/update/delete;
- denies direct client deletes for simulation and draft tables.

Hardening requirement:

- RLS update policies must be paired with database-level owner immutability triggers, now drafted in D-1;
- real migration tests must prove forged owner updates fail, not only cross-user reads.

### 1.9 Rollback Safety

Review result: issue found and corrected in D-1 draft.

The original rollback block dropped tables after policies but did not first drop constraints/triggers. Because draft and simulation references can be cyclic, table drops may fail or require unsafe cascade.

Hardening applied:

- D-1 rollback now drops FK constraints before dropping tables;
- D-1 rollback now drops owner-immutability triggers/functions;
- D-1 now documents that dependency cycles must be handled before destructive drops.

### 1.10 Index Coverage

Review result: acceptable for the first real migration draft.

Coverage exists for:

- active provider lookup;
- principal status/deletion lookup;
- owner-scoped simulation listing;
- owner-scoped deletion/export lookup;
- draft owner/status listing;
- draft expiry processing;
- history owner/timestamp listing;
- history parent simulation ordering;
- visible owner history listing.

Remaining review item before runtime load:

- add or revise indexes only after expected query shapes are known. Stage 4.2D-2 does not optimize for unimplemented persistence runtime.

## 2. Required Fixes

### 2.1 Principal ID Immutability

Problem:

- D-1 did not explicitly harden `principal_id` against updates at database level.

Risk:

- accidental principal mutation could detach owned records, break export/delete obligations, or weaken account recovery semantics.

Required correction:

- add a database-level immutability trigger or equivalent reviewed constraint strategy.

Affected future migration file:

- `005_indexes_and_constraints`.

Correction applied to D-1:

- added `levio_reject_principal_id_update()` review-draft trigger function and trigger.

### 2.2 Owner Field Immutability

Problem:

- D-1 relied on runtime/RLS posture but did not explicitly block updates to `owner_principal_id` or `owner_principal_type`.

Risk:

- owner fields could be mutated by a future server bug, overly broad service role path, or incomplete policy.

Required correction:

- add database-level owner immutability hardening for user-owned tables.

Affected future migration file:

- `005_indexes_and_constraints`.

Correction applied to D-1:

- added `levio_reject_owner_principal_update()` review-draft trigger function and triggers for simulation records, drafts, and history.

### 2.3 Provider Reference Uniqueness Scope

Problem:

- D-1 active provider-reference uniqueness applied only when `deletion_state = 'active'`.

Risk:

- a deletion-requested or restricted principal with an active provider reference could leave ambiguity if a new active principal is created for the same provider reference.

Required correction:

- enforce uniqueness for active provider references across non-terminal principal states.

Affected future migration file:

- `005_indexes_and_constraints`.

Correction applied to D-1:

- expanded `levio_principals_active_provider_reference_uidx` to cover `active`, `restricted`, and `deletion_requested` principal/deletion states.

### 2.4 History Parent Owner Alignment

Problem:

- D-1 originally left composite parent-owner alignment as optional review strategy.

Risk:

- a history entry could reference a parent simulation while carrying a mismatched owner, creating export/deletion/RLS ambiguity.

Required correction:

- make parent-owner alignment required.

Affected future migration file:

- `005_indexes_and_constraints`.

Correction applied to D-1:

- added unique `(simulation_id, owner_principal_id)` constraint on `simulation_records`;
- added composite FK from history to simulation record and owner pair.

### 2.5 Rollback Constraint Order

Problem:

- D-1 rollback did not drop constraints/triggers before table drops.

Risk:

- rollback may fail or tempt unsafe `cascade` usage, especially with optional draft/simulation cross-references.

Required correction:

- drop constraints and triggers/functions before table drops.

Affected future migration file:

- `007_rollback_notes`.

Correction applied to D-1:

- added constraint drops, trigger drops, and function drops before table drops.

## 3. RLS Hardening

### 3.1 Authenticated Owner Access

Future policies must grant authenticated access only when all conditions hold:

- valid Supabase authenticated session exists;
- `auth.uid()` matches `levio_principals.provider_reference`;
- provider name is `supabase`;
- provider reference status is `active`;
- principal type is `registered_user`;
- principal status is allowed for the operation;
- principal deletion state permits the operation;
- target row `owner_principal_id` matches the resolved `principal_id`.

Authenticated status alone is never enough.

### 3.2 No Guest Access Until Separate Approval

Guest access remains denied by default:

- no guest principal type in real first migration;
- no RLS policies for unauthenticated users;
- no RLS policies for Supabase anonymous users;
- no guest persistence table;
- no guest claim token table;
- no guest-to-authenticated import flow.

Guest persistence requires a later explicit stage.

### 3.3 Deny Client-Side Owner Injection

Real persistence runtime must reject or ignore client-supplied:

- `owner_principal_id`;
- `owner_principal_type`;
- `principal_id`;
- `provider_reference`;
- `provider_name`;
- `principal_status`;
- deletion exception fields.

Database hardening must complement runtime hardening:

- RLS insert policies require a mapped principal;
- owner immutability triggers reject owner changes after insert;
- service role paths must run only after server-side authorization.

### 3.4 Block Cross-User Reads

Cross-user reads must fail when:

- record ID belongs to another principal;
- principal mapping is missing;
- provider reference is revoked;
- principal is disabled, restricted, deleted, or mismatched;
- deletion state blocks normal access.

Required tests:

- direct ID read across users;
- list query leakage;
- archived/deleted record visibility boundaries;
- history read through parent simulation ID.

### 3.5 Block Cross-User Updates

Cross-user updates must fail when:

- row owner differs from authenticated principal;
- request tries to change owner fields;
- request tries to attach a history entry to another user's simulation;
- request tries to convert another user's draft into a simulation.

Required tests:

- forged `owner_principal_id` on insert;
- owner mutation on update;
- cross-owner `simulation_id` in history insert;
- cross-owner `converted_simulation_id` and `originating_draft_id`.

### 3.6 Block Cross-User Deletes

Direct client row delete should remain denied in the first real migration.

Deletion must be a server-authorized lifecycle transition:

- simulation deletion updates lifecycle state;
- draft discard/deletion updates lifecycle state;
- history follows parent simulation lifecycle;
- hard delete requires retention/export/legal review.

### 3.7 Service Role Boundaries

Service role is server-only and purpose-bound.

Allowed future uses may include:

- controlled migration;
- principal initialization;
- export job generation;
- deletion lifecycle jobs;
- retention cleanup.

Forbidden:

- service role in browser bundles;
- service role in public simulator code;
- service role in client-visible logs;
- service role as a substitute for server-side authorization.

### 3.8 Fail-Closed Behavior

Future RLS and runtime must fail closed when:

- session is missing, expired, or invalid;
- principal mapping is missing;
- provider reference is revoked or duplicated;
- principal is disabled/restricted/deleted;
- owner mismatch exists;
- deletion state blocks access;
- guest scope is requested before approval;
- service role purpose is absent or unapproved.

## 4. Migration Safety Checklist

Before creating real migration files, confirm:

- naming convention is timestamped and preserves the approved `001` through `007` logical order;
- migration directory location is explicitly approved;
- files are created only in the approved migration directory;
- `001_create_levio_principals` precedes every user-owned table;
- base tables are created before constraints and RLS;
- indexes and FKs are reviewed before RLS policies;
- owner immutability triggers or equivalent database hardening are included;
- rollback notes drop constraints/triggers before tables;
- rollback notes distinguish pre-data destructive rollback from post-data forward recovery;
- no `cascade` is used as the default rollback path;
- RLS tests cover cross-user reads, updates, deletes, and forged owners;
- service role isolation is reviewed;
- local/dev/preview/prod Supabase separation is confirmed;
- no production seed user data is introduced;
- no AI, memory, subscription, billing, payment, analytics, or vector fields are introduced;
- simulator persistence integration remains closed;
- Stage 4.3 and Stage 4.4 remain closed.

## 5. Readiness Decision

Status: READY FOR REAL MIGRATION FILES.

Reason:

- D-1 now has review-draft corrections for the blockers found in D-2;
- ownership anchor and provider-reference boundaries are preserved;
- immutable owner/principal requirements are documented at database level;
- RLS hardening requirements are explicit;
- rollback ordering is safer for constraint dependencies;
- no runtime, real SQL files, migrations, schema directories, Supabase tables, or Supabase connections were created.

This status means the reviewed draft is ready to be converted into real migration files in a later explicitly approved stage. It does not mean migrations are ready to be applied to production, and it does not start persistence runtime.

## 6. Roadmap Compliance

Stage 4.2D-2 confirms:

- SQL draft review is completed;
- D-1 review draft is hardened where needed;
- real migration files are not created;
- `.sql` files are not created;
- migration/schema directories are not created;
- SQL is not executed;
- Supabase is not contacted;
- Supabase tables are not created;
- runtime code is not changed;
- auth runtime is not changed;
- dashboard is not changed;
- simulator is not changed;
- decision engine and `SimulationResponse` are not changed;
- package files are not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 are not started.
