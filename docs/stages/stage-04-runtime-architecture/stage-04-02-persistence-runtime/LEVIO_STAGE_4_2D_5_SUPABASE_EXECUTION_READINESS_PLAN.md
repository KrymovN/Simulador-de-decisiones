# LEVIO STAGE 4.2D-5 SUPABASE EXECUTION READINESS PLAN

## Document Status

- Stage: 4.2D-5 - Supabase Execution Readiness Plan.
- Status: execution readiness plan only.
- Date: 18 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2D_4_MIGRATION_STATIC_REVIEW.md`, `LEVIO_STAGE_4_2D_3_REAL_MIGRATION_FILES.md`, `LEVIO_STAGE_4_2D_2_MIGRATION_SQL_REVIEW_HARDENING.md`, `LEVIO_STAGE_4_2D_1_MIGRATION_SQL_REVIEW_DRAFT.md`, `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `../../../architecture/LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, and Stage 4.1 Auth Runtime.
- SQL execution status: not executed.
- Supabase connection status: not connected.
- Supabase table status: not created in any database by this stage.
- Persistence runtime status: not implemented.

This document prepares only the plan for manual migration execution readiness. It does not execute SQL, connect to Supabase, create tables, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change the Decision Engine, change `SimulationResponse`, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.

## 1. Execution Target

### 1.1 Recommended First Target

Recommended first execution target:

```text
isolated local/dev Supabase database
```

The first execution must not target production.

The first target should be one of:

1. Supabase local development database created for migration validation only.
2. Empty Supabase development project that contains no production user data.
3. Empty preview/staging Supabase project only after local/dev succeeds.

### 1.2 Production Target

Production target status:

```text
not approved for Stage 4.2D-5
```

Production execution may be considered only after:

- local/dev execution succeeds;
- validation logs are captured;
- RLS behavior is tested;
- rollback/read-only/write-disabled posture is confirmed;
- environment separation is confirmed;
- service-role handling is approved;
- no real user-owned persistence runtime writes exist before schema readiness is confirmed.

### 1.3 Why Local/Dev First

Local/dev must run first because:

- the SQL has been statically reviewed but not parsed or executed by PostgreSQL/Supabase yet;
- `005_indexes_and_constraints.sql` contains one-time ordered constraints that should be validated in an empty environment before any production target;
- RLS policies must be validated with controlled test users;
- rollback notes are safe only before real user data exists;
- persistence runtime does not exist yet, so application behavior cannot be used as migration evidence;
- production data would create export, deletion, retention, and legal obligations immediately.

### 1.4 Required Supabase Project and Environment Data

Before manual execution, the operator must identify:

- Supabase project reference for the local/dev target;
- database connection method for the local/dev target;
- Supabase Auth project used by the target database;
- confirmation that `auth.uid()` is available in the target environment;
- confirmation that RLS is supported and enabled by the platform;
- local/dev anon key for client-authenticated RLS tests;
- local/dev service role key for server-only/admin validation only;
- local/dev project URL;
- explicit confirmation that no production key or production database URL is used;
- snapshot/backup method for the target if the target is not disposable.

No environment variables are created by Stage 4.2D-5.

## 2. Pre-Execution Checklist

### 2.1 Migration Order

Manual execution order:

```text
001_create_levio_principals.sql
002_create_simulation_records.sql
003_create_simulation_drafts.sql
004_create_simulation_history_entries.sql
005_indexes_and_constraints.sql
006_enable_rls_and_policies.sql
007_rollback_notes.sql
```

Execution notes:

- `001` must run before every user-owned table.
- `002` must run before `004`.
- `005` must run after all base tables exist.
- `006` must run after ownership columns, constraints, indexes, and triggers exist.
- `007` is a rollback notes companion. Its destructive rollback statements are commented and must not be copied into an active execution session unless a separate rollback operation is approved.

### 2.2 Required Extensions

Required extension:

```text
pgcrypto
```

`001_create_levio_principals.sql` creates the extension with:

```text
create extension if not exists pgcrypto;
```

Pre-execution check:

- confirm the target database allows `pgcrypto`;
- confirm `gen_random_uuid()` is available after `001`.

### 2.3 Rollback Readiness

Rollback readiness must be confirmed before execution:

- target is disposable local/dev, or snapshot/restore exists;
- no production user data is present;
- `007_rollback_notes.sql` has been reviewed;
- destructive rollback is understood as empty local/dev only;
- production rollback must prefer write-disable/read-only/forward-fix posture;
- disabling RLS is not accepted as a production shortcut after user data exists.

### 2.4 RLS Readiness

Before execution:

- prepare at least two Supabase Auth test users in local/dev;
- prepare a no-principal authenticated user case;
- prepare a disabled/restricted/deleted principal case if validation data is inserted manually;
- prepare cross-user read tests;
- prepare direct client insert/update/delete denial tests;
- prepare guest/unauthenticated denial tests;
- prepare service-role isolation notes.

### 2.5 Service Role Boundaries

Service role may be used only for:

- manual schema execution where required by the target workflow;
- administrative validation queries;
- controlled seed/test setup in local/dev;
- future server-only persistence runtime, after separately approved implementation.

Service role must not be:

- placed in browser/client bundles;
- exposed through public routes;
- logged in client-visible output;
- used as a substitute for application-level authorization;
- used to bypass owner checks in production.

### 2.6 Auth Provider Dependency

The migration policy model assumes:

- Supabase Auth is the Stage 4.1 approved provider;
- authenticated users are represented by `auth.uid()`;
- `levio_principals.provider_reference` stores Supabase `auth.users.id`;
- `provider_reference` is an identity link only, not owner ID;
- `levio_principals.principal_id` remains the canonical owner anchor.

### 2.7 Environment Variables

No environment variables are created or changed in Stage 4.2D-5.

Before any future runtime integration, environment strategy must distinguish:

- local/dev Supabase URL;
- local/dev anon key;
- local/dev server-only service role key;
- preview/staging equivalents if used;
- production equivalents only after production approval;
- strict separation between public anon keys and server-only secrets.

### 2.8 Backup and Snapshot Expectations

For disposable local databases:

- a snapshot is optional if the database can be recreated.

For shared dev/staging databases:

- take a snapshot before migration execution;
- record object counts before execution;
- record applied file order and timestamps;
- verify restore or reset path.

For production:

- Stage 4.2D-5 does not approve execution;
- a production backup/restore plan must exist before any later approval.

### 2.9 No Runtime Write Path Yet

Persistence runtime is not implemented.

Consequences:

- the app should not create records after migration execution;
- direct authenticated client inserts/updates are intentionally blocked by RLS;
- future writes require a separately approved server-only persistence runtime;
- applying schema alone must not be interpreted as launching persistence.

## 3. Manual Execution Plan

Commands and actions in this section are instructions only. Stage 4.2D-5 does not run them.

### 3.1 Execution Location

Use exactly one approved local/dev target:

- Supabase local database through Supabase CLI, if the project uses CLI workflow; or
- Supabase Dashboard SQL editor for an empty development project; or
- a controlled SQL client connected only to the approved local/dev database.

Do not connect to production.

### 3.2 Suggested CLI-Oriented Flow

If Supabase CLI is the approved workflow, the operator may use a manual flow equivalent to:

```bash
supabase status
supabase db reset
supabase migration list
```

Then apply the reviewed migration files in order through the approved migration mechanism.

If the files are not timestamped, confirm whether the local Supabase workflow accepts the current filenames. If timestamped filenames are required, do not rename files during execution; return to a separate approved migration-file naming stage.

Stop if the CLI reports any parse, dependency, permission, extension, or policy error.

### 3.3 Suggested SQL Editor Flow

If Supabase Dashboard SQL editor is the approved local/dev workflow:

1. Open only the local/dev Supabase project.
2. Confirm project ref and environment label.
3. Confirm the target has no production data.
4. Open `001_create_levio_principals.sql`.
5. Paste and execute only `001`.
6. Validate `001`.
7. Repeat for `002`, `003`, `004`, `005`, and `006`.
8. Review `007_rollback_notes.sql` as documentation. Do not uncomment or execute destructive rollback statements during normal forward execution.

Stop immediately if:

- a file fails;
- an object already exists unexpectedly;
- an RLS policy fails to create;
- an extension is unavailable;
- an owner constraint or trigger fails;
- the selected project is not local/dev;
- any production key or production target is detected.

### 3.4 Post-File Checks During Execution

After `001`:

- `levio_principals` exists;
- `principal_id` default works;
- `provider_reference` exists and is not used as owner column elsewhere.

After `002`:

- `simulation_records` exists;
- `owner_principal_id` is required;
- JSONB object checks exist;
- no AI memory/vector/subscription/billing fields exist.

After `003`:

- `simulation_drafts` exists;
- `owner_principal_id` is required;
- `expires_at` is required;
- guest draft fields or guest policies are absent.

After `004`:

- `simulation_history_entries` exists;
- `record_id` references `simulation_records`;
- `owner_principal_id` is required.

After `005`:

- indexes exist;
- provider-reference uniqueness exists;
- parent-owner alignment constraint exists;
- principal immutability trigger exists;
- owner immutability triggers exist.

After `006`:

- RLS is enabled on all four tables;
- policies exist;
- direct authenticated writes are denied;
- owner read policies map through `provider_reference -> principal_id`.

After `007`:

- confirm it remains non-destructive;
- confirm rollback notes are recorded as operator guidance only.

## 4. Post-Execution Validation Plan

Validation must be captured as logs or screenshots in the next approved execution stage.

### 4.1 Object Existence

Validate that these tables exist:

```text
public.levio_principals
public.simulation_records
public.simulation_drafts
public.simulation_history_entries
```

Validate that:

- expected constraints exist;
- expected indexes exist;
- expected trigger functions exist;
- expected triggers exist;
- RLS policies exist;
- RLS is enabled on all four tables.

### 4.2 Constraint and Trigger Validation

Validate:

- `principal_id` cannot be updated;
- `owner_principal_id` cannot be updated;
- `owner_principal_type` cannot be updated;
- history parent-owner mismatch is rejected;
- provider-reference uniqueness blocks duplicate active non-terminal mappings.

### 4.3 RLS Validation

Validate with controlled local/dev test users:

- authenticated user can select only own principal row;
- authenticated user cannot select another user's principal row;
- authenticated user can select only owned eligible records after test setup;
- authenticated user cannot select another user's records;
- unauthenticated access is denied;
- guest-like or anonymous access is denied;
- missing principal mapping fails closed;
- disabled/restricted/deleted principal cases fail closed according to policy.

### 4.4 Direct Client Write Denial

Validate through anon/authenticated client context:

- direct insert into `simulation_records` is blocked;
- direct update on `simulation_records` is blocked;
- direct delete from `simulation_records` is blocked;
- direct insert into `simulation_drafts` is blocked;
- direct update on `simulation_drafts` is blocked;
- direct delete from `simulation_drafts` is blocked;
- direct insert/update/delete on `simulation_history_entries` is blocked.

### 4.5 Cross-User Access Denial

Validate:

- user A cannot read user B records;
- user A cannot update user B records;
- user A cannot delete user B records;
- forged `owner_principal_id` does not grant access;
- forged `provider_reference` does not grant access;
- direct client owner injection remains impossible.

### 4.6 Future Server-Only Path Requirement

Validation must confirm:

- service role can perform administrative setup only when used server-side;
- no service role key is exposed to browser/client runtime;
- direct client writes remain blocked;
- future save/update/archive/delete flows require a separately implemented server-only persistence runtime.

## 5. Failure and Rollback Plan

### 5.1 When Rollback Is Acceptable

Rollback may be acceptable only when:

- target is local/dev;
- target has no production user data;
- no real user-owned content exists;
- failure occurs before runtime integration;
- operator has reviewed `007_rollback_notes.sql`;
- rollback is performed as an explicit, reviewed operation.

### 5.2 When Rollback Is Dangerous

Rollback is dangerous when:

- production user data exists;
- export/delete/retention obligations exist;
- users may have created records;
- runtime writes have been enabled;
- rollback would delete or orphan user-owned records;
- rollback relies on `cascade` or disabling RLS as a shortcut.

### 5.3 Read-Only / Write-Disabled Mode

If failure occurs after data exists:

- disable persistence writes in application runtime configuration;
- keep protected routes fail-closed;
- keep RLS enabled;
- preserve read access needed for export/delete review if legally required;
- prefer additive forward repair migrations;
- record incident details without logging user content;
- do not drop user-owned tables without separate data lifecycle approval.

### 5.4 Partial Migration Failure

If a migration fails mid-sequence:

1. Stop immediately.
2. Record the target environment, file name, error, and last successful file.
3. Do not continue to later files.
4. Do not execute rollback notes automatically.
5. If local/dev and empty, reset or restore the target.
6. If shared dev/staging, restore snapshot or create a reviewed corrective migration.
7. If any user data exists, switch to write-disabled/read-only posture and escalate for data lifecycle review.

## 6. Stage 4.2D-6 Criteria

Stage 4.2D-6 may begin only after:

- manual execution target is explicitly approved;
- local/dev Supabase environment is selected;
- real migrations are applied in the selected non-production environment;
- validation logs are captured;
- object existence is verified;
- constraints are verified;
- triggers are verified;
- RLS policies are verified;
- direct client write denial is verified;
- cross-user isolation is verified;
- guest/unauthenticated denial is verified;
- service-role/server-only boundary is verified;
- Supabase environment strategy is confirmed;
- runtime integration remains not implemented unless a later stage explicitly approves it.

Stage 4.2D-6 must not start Stage 4.3, Stage 4.4, simulator persistence integration, subscriptions, AI, memory, or billing.

## 7. Readiness Status

Status:

```text
READY FOR MANUAL SUPABASE EXECUTION
```

Scope of this status:

- ready only for manually approved local/dev Supabase execution;
- not ready for production execution;
- not a runtime persistence launch;
- not approval to create user-facing save/history/draft behavior;
- not approval to expose service role to client runtime.

## 8. Roadmap Compliance

Stage 4.2D-5 confirms:

- execution target recommendation is defined;
- pre-execution checklist is defined;
- manual execution plan is defined;
- post-execution validation plan is defined;
- failure/rollback plan is defined;
- Stage 4.2D-6 criteria are defined;
- SQL is not executed;
- Supabase is not contacted;
- Supabase tables are not created;
- migration SQL files are not changed;
- runtime code is not changed;
- auth runtime is not changed;
- dashboard is not changed;
- simulator is not changed;
- decision engine and `SimulationResponse` are not changed;
- package files are not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 are not started.
