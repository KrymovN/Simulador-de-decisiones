# LEVIO STAGE 4.2D-6 MANUAL SUPABASE EXECUTION GUIDE

## Document Status

- Stage: 4.2D-6 - Manual Supabase Execution Guide and Validation Log Template.
- Status: manual execution guide only.
- Date: 18 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2D_5_SUPABASE_EXECUTION_READINESS_PLAN.md`, `../../../../CURRENT_STAGE.md`, `../../../../LEVIO_CURRENT_STATE.md`, `../../../../PROJECT_CONTEXT.md`, and `supabase/migrations/*.sql`.
- SQL execution status: not executed by Codex.
- Supabase connection status: not connected by Codex.
- Supabase table status: not created by Codex.
- Persistence runtime status: not implemented.

This document is the final operator-facing guide for manually applying the Stage 4.2D migration files in an isolated local/dev Supabase environment. It does not execute SQL, connect to Supabase, create tables, change migration SQL files, change runtime code, change auth runtime, change dashboard, change simulator, change the Decision Engine, change `SimulationResponse`, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.

## 1. Execution Scope

Approved execution scope:

```text
isolated local/dev Supabase only
```

Forbidden execution scope:

```text
production Supabase
```

Rules:

- Codex does not execute SQL in Stage 4.2D-6.
- Codex does not connect to Supabase in Stage 4.2D-6.
- The guide is intended for manual execution by the project owner or an explicitly authorized operator.
- The first execution target must be isolated local/dev and must not contain production user data.
- Applying schema is not a persistence runtime launch.
- Direct client writes remain intentionally blocked by RLS until a separately approved server-only persistence runtime exists.
- Vercel environment configuration must not be changed until local/dev validation is complete and reviewed.

## 2. Environment Checklist

Complete this checklist before running any migration.

### 2.1 Supabase Project Type

Select exactly one:

```text
[ ] Supabase local development database
[ ] Empty Supabase dev project
[ ] Empty preview/staging project after local/dev approval
[ ] Production project - FORBIDDEN IN THIS STAGE
```

Required confirmation:

```text
[ ] Target contains no production user data.
[ ] Target is not connected to production Vercel deployment.
[ ] Target can be reset or restored if migration validation fails.
```

### 2.2 Required Environment Data

Record before execution:

```text
Supabase project identifier:
Supabase project type:
Database target / connection method:
Operator:
Execution date:
Snapshot / reset method:
```

Required local/dev values:

```text
[ ] Local/dev Supabase URL identified.
[ ] Local/dev anon key identified for client-context validation.
[ ] Local/dev service role key available only to the operator/server-side context.
[ ] Production keys are not present in the execution environment.
```

No new environment variables are created by this stage.

### 2.3 Auth Provider Readiness

Confirm:

```text
[ ] Supabase Auth is the target auth provider.
[ ] auth.uid() is available in the target environment.
[ ] At least two local/dev test users can be created or already exist.
[ ] Test users are not production users.
[ ] Supabase anonymous/guest access remains unapproved for persistence.
```

### 2.4 Database Target Confirmation

Before executing `001`, confirm:

```text
[ ] Current SQL editor / CLI / client points to local/dev.
[ ] Project ref matches the intended local/dev target.
[ ] No production project ref is visible.
[ ] No production database URL is used.
[ ] No production secrets are pasted into the tool.
```

### 2.5 Backup / Snapshot Note

For disposable local databases:

```text
[ ] Reset/recreate path is known.
```

For shared dev/staging databases:

```text
[ ] Snapshot taken before execution.
[ ] Restore path confirmed.
[ ] Object counts recorded before execution.
```

For production:

```text
[ ] Not applicable. Production execution is forbidden in Stage 4.2D-6.
```

### 2.6 Service Role Handling

Service role may be used only for:

- manual schema execution if required by the selected local/dev workflow;
- local/dev administrative validation;
- controlled test data setup;
- future server-only runtime after separate approval.

Service role must not be:

- exposed to browser/client code;
- stored in public env vars;
- logged in client-visible output;
- used from public simulator code;
- used to bypass authorization in production.

### 2.7 Client Anon Key Boundaries

Anon key may be used only to validate client-context RLS behavior in local/dev.

Expected result:

- direct authenticated inserts are blocked;
- direct authenticated updates are blocked;
- direct authenticated deletes are blocked;
- cross-user reads are blocked;
- unauthenticated/guest access is blocked.

### 2.8 Vercel Environment Boundary

Do not update Vercel env vars until:

- local/dev migration execution succeeds;
- validation log is complete;
- project owner reviews results;
- a later runtime stage explicitly approves environment integration.

## 3. Exact Execution Order

Execute the files in this exact order.

### 3.1 `001_create_levio_principals.sql`

Expected result:

- `pgcrypto` extension is available.
- `public.levio_principals` exists.
- `principal_id` is the canonical Levio owner anchor.
- `provider_reference` stores Supabase `auth.users.id` only as an identity link.

Check after execution:

```text
[ ] Table exists.
[ ] principal_id default uses gen_random_uuid().
[ ] provider_reference column exists.
[ ] provider_reference is not used as owner_id.
[ ] No provider tokens or secrets exist in the table.
```

Stop if:

- `pgcrypto` cannot be created;
- `gen_random_uuid()` is unavailable;
- table creation fails;
- target environment is not local/dev.

### 3.2 `002_create_simulation_records.sql`

Expected result:

- `public.simulation_records` exists.
- `owner_principal_id` is required.
- `owner_principal_id` references `public.levio_principals(principal_id)`.
- user input, deterministic output, metadata, and safety flags are separate JSONB fields.
- no AI memory, vector, embedding, subscription, billing, or payment fields are present.

Check after execution:

```text
[ ] Table exists.
[ ] owner_principal_id is not nullable.
[ ] owner foreign key exists.
[ ] JSONB object checks exist.
[ ] parent_record_id FK exists.
[ ] No forbidden AI/memory/subscription/billing fields exist.
```

Stop if:

- owner FK fails;
- JSONB check constraints fail to create;
- forbidden fields appear;
- table already exists unexpectedly with a different shape.

### 3.3 `003_create_simulation_drafts.sql`

Expected result:

- `public.simulation_drafts` exists.
- drafts are registered-user scoped.
- `owner_principal_id` is required.
- `expires_at` is required.
- guest persistence remains absent.

Check after execution:

```text
[ ] Table exists.
[ ] owner_principal_id is not nullable.
[ ] expires_at is not nullable.
[ ] draft payload JSONB object check exists.
[ ] No guest table, guest policy, or guest claim structure is introduced.
```

Stop if:

- owner FK fails;
- expiry constraint fails;
- guest persistence appears;
- table already exists unexpectedly with a different shape.

### 3.4 `004_create_simulation_history_entries.sql`

Expected result:

- `public.simulation_history_entries` exists.
- `record_id` references `public.simulation_records(record_id)`.
- `owner_principal_id` is required.
- history remains user-visible lifecycle/revision/outcome history, not hidden analytics.

Check after execution:

```text
[ ] Table exists.
[ ] record_id FK exists.
[ ] owner_principal_id is not nullable.
[ ] event_payload JSONB object check exists.
[ ] No analytics-only or hidden operational-log table is introduced.
```

Stop if:

- parent simulation FK fails;
- owner FK fails;
- event payload constraint fails;
- table already exists unexpectedly with a different shape.

### 3.5 `005_indexes_and_constraints.sql`

Expected result:

- owner-scoped indexes exist.
- active provider-reference uniqueness exists.
- draft/simulation provenance constraints exist.
- history parent-owner alignment exists.
- `principal_id` immutability trigger exists.
- owner immutability triggers exist.

Check after execution:

```text
[ ] levio_principals_active_provider_reference_uidx exists.
[ ] owner-scoped record indexes exist.
[ ] owner-scoped draft indexes exist.
[ ] owner-scoped history indexes exist.
[ ] simulation_records_record_owner_unique exists.
[ ] simulation_history_parent_owner_match_fk exists.
[ ] levio_reject_principal_id_update() exists.
[ ] levio_reject_owner_principal_update() exists.
[ ] immutability triggers exist on principals, records, drafts, and history.
```

Stop if:

- constraint creation fails;
- trigger function creation fails;
- circular dependency error appears;
- object already exists unexpectedly with incompatible shape.

### 3.6 `006_enable_rls_and_policies.sql`

Expected result:

- RLS is enabled on all four tables.
- principal self-read policy exists.
- owner read policies map through `provider_reference -> principal_id -> owner_principal_id`.
- no guest policies exist.
- direct authenticated writes are denied.
- direct authenticated deletes are denied.

Check after execution:

```text
[ ] RLS enabled on public.levio_principals.
[ ] RLS enabled on public.simulation_records.
[ ] RLS enabled on public.simulation_drafts.
[ ] RLS enabled on public.simulation_history_entries.
[ ] levio_principals_select_own exists.
[ ] simulation_records_select_own exists.
[ ] simulation_drafts_select_own exists.
[ ] simulation_history_select_own exists.
[ ] *_insert_none policies exist.
[ ] *_update_none policies exist.
[ ] *_delete_none policies exist.
[ ] No guest/anonymous allow policy exists.
```

Stop if:

- RLS enablement fails;
- any policy fails to create;
- any policy allows guest access;
- direct client write policies are not deny policies.

### 3.7 `007_rollback_notes.sql`

Expected result:

- file is reviewed as rollback guidance.
- destructive rollback statements remain commented during normal execution.
- no rollback is performed during successful forward execution.

Check after review:

```text
[ ] Rollback notes reviewed.
[ ] Destructive rollback statements were not executed.
[ ] RLS was not disabled as a shortcut.
[ ] Empty local/dev rollback path is understood.
[ ] Production rollback remains forbidden without separate approval.
```

Stop if:

- operator is uncertain whether rollback statements are commented;
- rollback seems necessary before validation is complete;
- target environment is not disposable local/dev.

## 4. Validation Log Template

Copy and complete this template after manual local/dev execution.

```text
LEVIO STAGE 4.2D-6 VALIDATION LOG

Execution date:
Operator:
Environment:
Supabase project identifier:
Database target / connection method:
Production touched? yes/no:
Production keys used? yes/no:
Snapshot/reset method:

Applied files:
[ ] 001_create_levio_principals.sql - success/failure:
    Notes:
[ ] 002_create_simulation_records.sql - success/failure:
    Notes:
[ ] 003_create_simulation_drafts.sql - success/failure:
    Notes:
[ ] 004_create_simulation_history_entries.sql - success/failure:
    Notes:
[ ] 005_indexes_and_constraints.sql - success/failure:
    Notes:
[ ] 006_enable_rls_and_policies.sql - success/failure:
    Notes:
[ ] 007_rollback_notes.sql reviewed only - yes/no:
    Rollback executed? yes/no:
    Notes:

Table existence check:
[ ] public.levio_principals exists:
[ ] public.simulation_records exists:
[ ] public.simulation_drafts exists:
[ ] public.simulation_history_entries exists:

Constraints check:
[ ] owner foreign keys exist:
[ ] provider-reference uniqueness exists:
[ ] history parent-owner alignment exists:
[ ] JSONB object checks exist:
[ ] draft expiry constraint exists:

Triggers check:
[ ] levio_reject_principal_id_update() exists:
[ ] levio_reject_owner_principal_update() exists:
[ ] principal immutability trigger exists:
[ ] record owner immutability trigger exists:
[ ] draft owner immutability trigger exists:
[ ] history owner immutability trigger exists:

RLS enabled check:
[ ] RLS enabled on levio_principals:
[ ] RLS enabled on simulation_records:
[ ] RLS enabled on simulation_drafts:
[ ] RLS enabled on simulation_history_entries:

Policies check:
[ ] principal self-read policy exists:
[ ] owner-scoped record read policy exists:
[ ] owner-scoped draft read policy exists:
[ ] owner-scoped history read policy exists:
[ ] direct insert deny policies exist:
[ ] direct update deny policies exist:
[ ] direct delete deny policies exist:
[ ] no guest/anonymous allow policies exist:

Direct client insert blocked check:
[ ] authenticated client insert into simulation_records blocked:
[ ] authenticated client update on simulation_records blocked:
[ ] authenticated client delete from simulation_records blocked:
[ ] authenticated client insert into simulation_drafts blocked:
[ ] authenticated client update on simulation_drafts blocked:
[ ] authenticated client delete from simulation_drafts blocked:
[ ] authenticated client insert/update/delete on simulation_history_entries blocked:

Cross-user access blocked check:
[ ] user A cannot read user B principal row:
[ ] user A cannot read user B simulation records:
[ ] user A cannot read user B drafts:
[ ] user A cannot read user B history:
[ ] forged owner_principal_id does not grant access:
[ ] missing principal mapping fails closed:
[ ] unauthenticated access denied:
[ ] guest/anonymous access denied:

Service role boundary check:
[ ] service role not exposed to client/browser:
[ ] service role used only for local/dev admin validation if used:
[ ] future server-only runtime path remains required:

Rollback:
[ ] rollback not executed:
[ ] rollback executed only in empty local/dev:
[ ] rollback notes:

Errors:

Open questions:

Operator confirmation:
[ ] Execution was local/dev only.
[ ] Production was not touched.
[ ] SQL was executed manually by operator, not by Codex.
[ ] Runtime persistence was not implemented.
[ ] Stage 4.3 was not started.
[ ] Stage 4.4 was not started.
```

## 5. Stop Conditions

Stop immediately if any of the following occurs:

- migration execution error;
- missing `pgcrypto`;
- `gen_random_uuid()` unavailable;
- table already exists unexpectedly with incompatible shape;
- RLS policy creation error;
- RLS policy grants guest/anonymous access;
- direct client write deny policies are missing;
- constraint creation error;
- trigger/function creation error;
- rollback uncertainty;
- wrong environment detected;
- production project reference detected;
- production database URL detected;
- production key detected;
- service role appears in client/browser context;
- operator cannot confirm snapshot/reset path.

After stopping:

1. Do not continue to later migration files.
2. Record the failed file and exact error.
3. Confirm environment and target.
4. If target is disposable local/dev, reset and retry only after reviewing the cause.
5. If target is shared dev/staging, restore snapshot or prepare a reviewed correction.
6. Do not touch production.

## 6. Post-Execution Gate

After manual execution, send back:

- completed validation log;
- exact errors, if any;
- confirmation that execution was local/dev only;
- confirmation that production was not touched;
- confirmation that rollback was not executed, or exact rollback details if it was executed in empty local/dev;
- confirmation that runtime persistence was not implemented;
- confirmation that Vercel env was not changed;
- screenshots or copied validation query results if available.

Do not request Stage 4.2E until validation log is successful and reviewed.

## 7. Next Stage Decision

After successful local/dev execution and accepted validation log, the next eligible stage is:

```text
STAGE 4.2E
PERSISTENCE RUNTIME FOUNDATION
```

Stage 4.2E may begin only after:

- local/dev migrations are confirmed applied;
- validation log confirms table/constraint/trigger/RLS/policy behavior;
- direct client writes are confirmed blocked;
- cross-user access is confirmed blocked;
- production remains untouched;
- runtime persistence remains unimplemented until the Stage 4.2E scope is explicitly approved.

Stage 4.2E must not start Stage 4.3 User Data Controls, Stage 4.4 Subscription Runtime, simulator persistence integration, AI, memory, billing, or production deployment unless separately approved.

## 8. Roadmap Compliance

Stage 4.2D-6 confirms:

- manual execution scope is defined;
- environment checklist is defined;
- exact execution order is defined;
- per-file expected results and stop conditions are defined;
- validation log template is provided;
- post-execution gate is defined;
- next stage decision is bounded to Stage 4.2E only after successful local/dev validation;
- SQL is not executed by Codex;
- Supabase is not contacted by Codex;
- Supabase tables are not created by Codex;
- migration SQL files are not changed;
- runtime code is not changed;
- auth runtime is not changed;
- dashboard is not changed;
- simulator is not changed;
- decision engine and `SimulationResponse` are not changed;
- package files are not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 are not started.
