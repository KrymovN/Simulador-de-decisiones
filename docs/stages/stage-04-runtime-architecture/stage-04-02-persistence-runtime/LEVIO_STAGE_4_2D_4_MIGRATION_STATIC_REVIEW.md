# LEVIO STAGE 4.2D-4 MIGRATION STATIC REVIEW

## Document Status

- Stage: 4.2D-4 - Migration Files Static Review and Hardening.
- Status: static review complete, migration files hardened, not applied.
- Date: 18 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2D_3_REAL_MIGRATION_FILES.md`, `LEVIO_STAGE_4_2D_2_MIGRATION_SQL_REVIEW_HARDENING.md`, `LEVIO_STAGE_4_2D_1_MIGRATION_SQL_REVIEW_DRAFT.md`, `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, and Stage 4.1 Auth Runtime.
- SQL execution status: not executed.
- Supabase connection status: not connected.
- Supabase table status: not created in any database by this stage.
- Persistence runtime status: not implemented.

Stage 4.2D-4 statically reviews and hardens the real migration files created in Stage 4.2D-3. It does not execute SQL, connect to Supabase, create tables, create runtime persistence, change auth runtime, change dashboard, change simulator, change the Decision Engine, change `SimulationResponse`, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.

## 1. Reviewed Files

The following files were reviewed:

```text
supabase/migrations/001_create_levio_principals.sql
supabase/migrations/002_create_simulation_records.sql
supabase/migrations/003_create_simulation_drafts.sql
supabase/migrations/004_create_simulation_history_entries.sql
supabase/migrations/005_indexes_and_constraints.sql
supabase/migrations/006_enable_rls_and_policies.sql
supabase/migrations/007_rollback_notes.sql
```

Review areas:

- table creation order;
- extension requirements;
- UUID defaults;
- timestamp defaults;
- check constraints;
- foreign keys;
- nullable fields;
- JSONB field constraints;
- trigger/function order;
- rollback compatibility;
- ownership correctness;
- RLS correctness;
- security hardening;
- migration safety.

## 2. Findings

### 2.1 Direct Authenticated Writes Weakened Owner-Injection Boundary

Severity: blocking before Supabase execution review.

Affected file:

```text
supabase/migrations/006_enable_rls_and_policies.sql
```

Problem:

The Stage 4.2D-3 RLS policies allowed direct authenticated inserts and updates on `simulation_records` and `simulation_drafts` when the submitted `owner_principal_id` matched the authenticated user's resolved Levio principal.

Risk:

Although the policy enforced owner match, it still left the browser/client in control of submitting owner-bearing rows. That conflicted with the Stage 4.2 architecture rule that client-provided owner identifiers must not be trusted and that persistence writes must derive owner fields server-side from the validated auth session.

Required correction:

Direct authenticated client writes to owner-scoped persistence tables must fail closed until a future server-side persistence runtime is explicitly implemented and reviewed.

### 2.2 Rollback Notes Referenced Previous Policy Names

Severity: low, but required for consistency.

Affected file:

```text
supabase/migrations/007_rollback_notes.sql
```

Problem:

After hardening write policies in `006_enable_rls_and_policies.sql`, rollback notes needed to reference the updated policy names.

Risk:

If an operator later copies rollback notes for an empty local/dev database review, stale policy names could cause confusion or partial cleanup.

Required correction:

Update commented rollback policy names to match the hardened RLS policy names.

## 3. Fixes Applied

### 3.1 Records Write Policies Hardened

Changed:

```text
supabase/migrations/006_enable_rls_and_policies.sql
```

Applied fix:

- replaced `simulation_records_insert_own` with `simulation_records_insert_none`;
- replaced `simulation_records_update_own` with `simulation_records_update_none`;
- set authenticated insert/update checks to `false`;
- added comments clarifying that future writes must come from a server-only persistence runtime after resolving `owner_principal_id` from the validated auth session.

Result:

Authenticated users may still read eligible owned simulation records through the `provider_reference -> principal_id -> owner_principal_id` mapping, but direct client inserts and updates fail closed.

### 3.2 Draft Write Policies Hardened

Changed:

```text
supabase/migrations/006_enable_rls_and_policies.sql
```

Applied fix:

- replaced `simulation_drafts_insert_own` with `simulation_drafts_insert_none`;
- replaced `simulation_drafts_update_own` with `simulation_drafts_update_none`;
- set authenticated insert/update checks to `false`;
- added comments clarifying that future draft writes must come from a server-only persistence runtime after resolving `owner_principal_id` from the validated auth session.

Result:

Authenticated users may still read eligible owned, non-expired drafts through the owner mapping, but direct client inserts and updates fail closed.

### 3.3 Rollback Notes Synchronized

Changed:

```text
supabase/migrations/007_rollback_notes.sql
```

Applied fix:

- updated commented rollback policy names from `_insert_own` / `_update_own` to `_insert_none` / `_update_none` for simulation records and drafts.

Result:

Rollback notes remain aligned with the hardened RLS policy names while staying fully commented and non-destructive.

## 4. Confirmed Static Review Results

### 4.1 SQL Correctness

Static review result: acceptable for execution review after hardening.

Confirmed:

- `001_create_levio_principals.sql` creates `pgcrypto` before using `gen_random_uuid()`;
- tables are created before dependent indexes, constraints, triggers, and RLS policies;
- owner table is created before owner-scoped tables;
- `simulation_records` is created before `simulation_history_entries`;
- JSONB payload fields use object-shape checks where required;
- timestamp defaults consistently use `timezone('utc', now())`;
- immutability trigger functions are created before triggers;
- destructive rollback statements in `007_rollback_notes.sql` remain commented.

### 4.2 Ownership Correctness

Static review result: acceptable after hardening.

Confirmed:

- `levio_principals.principal_id` remains the canonical owner anchor;
- Supabase `auth.users.id` is represented only as `provider_reference`;
- `provider_reference` is not used as `owner_id`;
- all user-owned records require `owner_principal_id`;
- `owner_principal_id` references `levio_principals.principal_id`;
- history entries have composite parent-owner alignment through `(record_id, owner_principal_id)`;
- owner fields are protected by immutable-owner triggers.

### 4.3 RLS Correctness

Static review result: hardened and acceptable for execution review.

Confirmed:

- RLS is enabled on all four persistence tables;
- principal self-read requires active Supabase provider mapping;
- user-owned reads require `provider_reference -> principal_id -> owner_principal_id`;
- no guest policies are present;
- no unauthenticated policies are present;
- direct authenticated writes to `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries` are denied;
- direct authenticated deletes are denied;
- service role remains documented as server-only and outside the client model.

### 4.4 Security Hardening

Static review result: acceptable for execution review.

Confirmed:

- `principal_id` immutability is enforced by trigger;
- `owner_principal_id` and `owner_principal_type` immutability are enforced by trigger;
- active non-terminal provider-reference uniqueness is constrained;
- owner-principal table does not store provider tokens or secrets;
- simulation records do not include AI memory, vectors, embeddings, raw AI prompts, raw AI responses, subscriptions, billing, or payment fields;
- deletion, retention, export, and legal-hold compatibility fields exist without starting Stage 4.3.

### 4.5 Migration Safety

Static review result: acceptable for execution review, with remaining review risks below.

Confirmed:

- migration order is dependency-safe;
- indexes use `if not exists`;
- table creation uses `if not exists`;
- rollback notes are non-destructive when applied as a normal migration file because destructive statements remain commented;
- no SQL was executed and no Supabase environment was contacted during this review.

## 5. Remaining Risks

These risks remain before any Supabase execution:

1. SQL has not been parsed or executed by a Supabase/PostgreSQL engine in this stage.
2. Constraint additions in `005_indexes_and_constraints.sql` are intended for one-time ordered migrations and are not fully idempotent if manually re-run after partial application.
3. Persistence runtime does not exist yet. Direct client writes are intentionally denied, so a future server-side write path must be designed and reviewed separately.
4. RLS tests for cross-user isolation, forged owner IDs, guest denial, and fail-closed behavior have not been executed.
5. Retention strings and legal-hold operational semantics still require production policy approval before real user data exists.
6. Rollback notes are review guidance only and must not be copied into production without environment-specific approval.

## 6. Readiness Status

Status:

```text
READY FOR SUPABASE EXECUTION REVIEW
```

Meaning:

- migration files are statically reviewed and hardened enough for a separate Supabase execution review stage;
- this does not approve direct production execution;
- SQL must still be tested in an isolated local/dev Supabase environment before any production rollout;
- Stage 4.2 persistence runtime remains not implemented;
- Stage 4.3 User Data Controls remains closed;
- Stage 4.4 Subscription Runtime remains closed.

## 7. Roadmap Compliance

Stage 4.2D-4 confirms:

- real migration files were reviewed and hardened only inside `supabase/migrations/`;
- SQL was not executed;
- Supabase was not contacted;
- Supabase tables were not created;
- runtime code was not changed;
- auth runtime was not changed;
- dashboard was not changed;
- simulator was not changed;
- decision engine and `SimulationResponse` were not changed;
- package files were not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 were not started.
