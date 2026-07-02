# LEVIO STAGE 4.2D-3 REAL MIGRATION FILES

## Document Status

- Stage: 4.2D-3 - Create Real Persistence Migration Files.
- Status: migration files created, not applied.
- Date: 17 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2D_2_MIGRATION_SQL_REVIEW_HARDENING.md`, `LEVIO_STAGE_4_2D_1_MIGRATION_SQL_REVIEW_DRAFT.md`, `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, and Stage 4.1 Auth Runtime.
- Persistence runtime status: not implemented.
- SQL execution status: not executed.
- Supabase connection status: not connected.
- Supabase table status: not created in any database by this stage.

Stage 4.2D-3 creates real migration files on disk for later review and application. It does not execute SQL, connect to Supabase, create database tables in any real database, implement persistence runtime, change auth runtime, change dashboard, change simulator, change the Decision Engine, change `SimulationResponse`, connect AI, connect memory, connect subscriptions, or start Stage 4.3/4.4.

## 1. Created Migration Files

Created directory:

```text
supabase/migrations/
```

Created files:

```text
supabase/migrations/001_create_levio_principals.sql
supabase/migrations/002_create_simulation_records.sql
supabase/migrations/003_create_simulation_drafts.sql
supabase/migrations/004_create_simulation_history_entries.sql
supabase/migrations/005_indexes_and_constraints.sql
supabase/migrations/006_enable_rls_and_policies.sql
supabase/migrations/007_rollback_notes.sql
```

## 2. Schema Summary

### 2.1 `levio_principals`

The first migration creates `public.levio_principals` as the stable Levio principal anchor.

Important properties:

- `principal_id` is the canonical owner anchor.
- `provider_name` and `provider_reference` map to the auth provider identity.
- Supabase `auth.users.id` is represented only as `provider_reference`.
- `provider_reference` is not an owner ID.
- status, deletion, retention, and timestamp fields are present.
- provider tokens, auth secrets, billing, subscription, AI, memory, vector, and decision-content fields are not present.

### 2.2 `simulation_records`

The second migration creates `public.simulation_records` for explicitly saved simulations.

Important properties:

- `record_id` is the saved simulation record identifier.
- `owner_principal_id` references `levio_principals.principal_id`.
- payload is separated into `user_input_snapshot`, `deterministic_output_snapshot`, `metadata`, and `safety_flags`.
- lifecycle, deletion, retention, export, timestamp, and version fields are present.
- AI memory, vectors, embeddings, raw AI prompts/responses, subscriptions, billing, and payments are excluded.

### 2.3 `simulation_drafts`

The third migration creates `public.simulation_drafts` for registered-user server-side drafts.

Important properties:

- `draft_id` is the draft identifier.
- `owner_principal_id` references `levio_principals.principal_id`.
- `draft_payload` remains separate from completed simulation records.
- status, expiry, deletion, retention, export, and timestamp fields are present.
- guest draft persistence is not introduced.

### 2.4 `simulation_history_entries`

The fourth migration creates `public.simulation_history_entries` for user-visible lifecycle/revision/outcome history.

Important properties:

- `history_entry_id` is the history identifier.
- `record_id` references `simulation_records.record_id`.
- `owner_principal_id` references `levio_principals.principal_id`.
- history is append-only by design except for approved lifecycle/deletion/export/legal metadata changes.
- hidden analytics and operational logs are out of scope.

### 2.5 Indexes, Constraints, and Immutability

The fifth migration adds:

- active non-terminal provider-reference uniqueness;
- owner-scoped indexes;
- draft expiry and deletion indexes;
- history owner and record indexes;
- cross-table provenance constraints;
- composite parent-owner alignment for history;
- immutable `principal_id` trigger;
- immutable `owner_principal_id` and `owner_principal_type` triggers.

## 3. RLS Summary

The sixth migration enables RLS on:

```text
levio_principals
simulation_records
simulation_drafts
simulation_history_entries
```

Policy posture:

- authenticated access must resolve through `provider_reference -> principal_id`;
- authenticated status alone is not sufficient;
- no guest access is granted;
- no unauthenticated policies are granted;
- direct client writes to `levio_principals` are denied;
- direct client deletes are denied for user-owned tables;
- direct client history insert/update/delete is denied;
- cross-user isolation is enforced through owner-principal mapping;
- service role remains server-only and purpose-bound.

## 4. Rollback Summary

The seventh migration is a rollback notes file.

It documents:

- read-only/write-disable emergency posture;
- warnings about destructive rollback after user data exists;
- policy drop order;
- constraint drop order;
- trigger/function drop order;
- table drop order;
- preference for additive forward migrations after production data exists.

The destructive rollback statements are intentionally commented out. This prevents `007_rollback_notes.sql` from dropping schema objects if a migration runner applies all files in lexical order. Any rollback must be copied into an explicit, reviewed rollback operation for the correct environment.

## 5. What Was Not Applied

Stage 4.2D-3 did not:

- execute SQL;
- connect to Supabase;
- create tables in a real database;
- create seed data;
- create persistence runtime;
- create API routes;
- change auth runtime;
- change dashboard runtime;
- change simulator runtime;
- change the Decision Engine;
- change `SimulationResponse`;
- change package files;
- connect AI;
- connect memory;
- connect subscriptions;
- connect billing;
- start Stage 4.3;
- start Stage 4.4.

## 6. Prerequisites Before Applying Migrations

Before any migration is applied:

1. Supabase local/dev/preview/prod targets must be confirmed.
2. Environment separation must be confirmed.
3. A backup/restore posture must be understood.
4. Service-role usage policy must be approved.
5. RLS policy tests must be prepared.
6. Cross-user isolation tests must be prepared.
7. Forged owner tests must be prepared.
8. Rollback/read-only/write-disable posture must be approved.
9. Retention defaults must be operationally defined.
10. Export/delete implications must be reviewed.
11. No real user data should exist during initial migration validation.
12. Stage 4.3 User Data Controls must remain closed unless separately approved.
13. Stage 4.4 Subscription Runtime must remain closed unless separately approved.

## 7. QA Required Before Supabase Execution

Required pre-execution QA:

- static SQL review for PostgreSQL/Supabase syntax;
- migration order review from `001` through `007`;
- verify no hidden AI/memory/subscription/billing fields exist;
- verify provider reference is not used as owner ID;
- verify owner-principal immutability triggers compile;
- verify provider-reference uniqueness scope;
- verify history parent-owner alignment;
- verify no guest policies exist;
- verify RLS denies missing principal mapping;
- verify cross-user read/update/delete isolation;
- verify forged owner inserts/updates fail;
- verify service role is not reachable from client runtime;
- verify rollback notes are environment-specific before use.

## 8. Roadmap Compliance

Stage 4.2D-3 confirms:

- real migration files are created on disk;
- SQL is not executed;
- Supabase is not contacted;
- Supabase tables are not created by this stage;
- runtime code is not changed;
- auth runtime is not changed;
- dashboard is not changed;
- simulator is not changed;
- decision engine and `SimulationResponse` are not changed;
- package files are not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 are not started.
