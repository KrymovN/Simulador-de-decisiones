# LEVIO STAGE 4.2D-9 DEV SUPABASE EXECUTION SUPPORT PLAN

## Document Status

- Stage: 4.2D-9 - Dev Supabase Execution Support Plan.
- Status: execution support plan only.
- Date: 18 June 2026, Europe/Madrid.
- Approved dev target: Empty Dev Supabase Project.
- Local Supabase status: not used for this stage.
- Production Supabase status: forbidden.
- Depends on: `PROJECT_CONTEXT.md`, `LEVIO_CURRENT_STATE.md`, `CURRENT_STAGE.md`, `LEVIO_STAGE_4_2D_5_SUPABASE_EXECUTION_READINESS_PLAN.md`, `LEVIO_STAGE_4_2D_6_MANUAL_SUPABASE_EXECUTION_GUIDE.md`, `LEVIO_STAGE_4_2D_7_PRE_EXECUTION_AUDIT.md`, and `LEVIO_STAGE_4_2D_8_DEV_SUPABASE_TARGET_UNBLOCK_PLAN.md`.
- SQL execution status: not executed by Codex.
- Supabase connection status: not connected by Codex.
- Supabase table status: not created by Codex.
- Migration file status: unchanged.
- Runtime persistence status: not implemented.
- Stage 4.3 status: not started.
- Stage 4.4 status: not started.

This document supports the first owner/operator-run migration execution in an Empty Dev Supabase Project. It does not execute SQL, connect to Supabase, create tables, change migration files, change runtime code, change auth runtime, change simulator, change the Decision Engine, change `SimulationResponse`, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.

Secrets must not be written into this document, committed to git, pasted into project documentation, exposed in screenshots, or included in logs. Evidence must identify the dev target without revealing secret values.

## 1. Dev Project Requirements

### 1.1 Required Project Type

Approved target:

```text
Empty Dev Supabase Project
```

Requirements:

- the project must be a non-production Supabase project;
- the project must contain no production user data;
- the project must not be connected to production Vercel;
- the project must be clearly labeled as dev/test in the operator workflow;
- the operator must know the project ref before execution;
- a reset, restore, or recreate path must exist before execution;
- Supabase Auth must be available for local/dev test users;
- `auth.uid()` must be available for RLS policy validation;
- RLS must be supported by the target database;
- `pgcrypto` / `gen_random_uuid()` must be allowed by the target database.

### 1.2 Required Settings

The dev project should have:

- Supabase Auth enabled for test users;
- at least two non-production test users available or ready to create;
- SQL execution access limited to the owner/operator;
- service role access limited to owner/operator admin validation only;
- anon key available only for client-context RLS validation;
- project reset/snapshot method confirmed;
- no real user traffic;
- no production webhook, production callback, production OAuth, or production deployment dependency.

### 1.3 Forbidden Settings

The dev project must not:

- be the production Supabase project;
- contain production user data;
- use production database URLs;
- use production service role keys;
- use production anon keys;
- be connected to production Vercel;
- expose service role secrets to browser/client code;
- store secrets in git, docs, screenshots, tickets, or logs;
- enable guest/anonymous persistence;
- add storage buckets for user-owned data;
- add subscriptions, billing, payments, AI, memory, analytics, or observability tables as part of this stage.

### 1.4 Environment Separation Requirements

Environment separation must be explicit:

- dev project ref must be visually confirmed before each execution session;
- production project ref must not be open in the active SQL editor/session;
- production environment variables must not be edited;
- Vercel production environment must not be changed;
- future runtime env values must remain unset until a later approved runtime stage;
- all validation evidence must state that production was not touched.

## 2. Dev Project Checklist

Complete this checklist before running `001`.

```text
LEVIO STAGE 4.2D-9 DEV PROJECT CHECKLIST

Target:
[ ] Empty Dev Supabase Project selected:
[ ] Project ref visually confirmed:
[ ] Project is not production:
[ ] Project contains no production user data:
[ ] Project is not connected to production Vercel:
[ ] Production Supabase project is not open in the active execution context:

Recovery:
[ ] Reset/restore/recreate path confirmed:
[ ] Snapshot or baseline noted if needed:
[ ] Rollback notes reviewed:
[ ] 007_rollback_notes.sql will not be executed destructively during forward execution:

Auth/RLS:
[ ] Supabase Auth available:
[ ] auth.uid() available:
[ ] RLS supported:
[ ] Test user A available or ready to create:
[ ] Test user B available or ready to create:
[ ] Missing-principal authenticated case planned or explicitly deferred:

Secrets:
[ ] Service role secret not written to git/docs:
[ ] Service role not exposed to client/browser:
[ ] Anon key value not written to git/docs:
[ ] Production secrets absent from execution context:

Execution:
[ ] Execution method selected:
[ ] Migration files available locally for operator review:
[ ] Migration order accepted: 001, 002, 003, 004, 005, 006, 007:
[ ] Stop conditions accepted:

Evidence:
[ ] Validation log template ready:
[ ] Screenshots/log format agreed:
[ ] Secret redaction rule understood:
[ ] Production-not-touched confirmation will be captured:
```

## 3. Migration Execution Sequence

Execution must be performed manually by the owner/operator in the approved Empty Dev Supabase Project.

Codex must not execute these files.

### 3.1 Before `001`

Confirm:

- active Supabase project is the approved empty dev project;
- production project is not selected;
- reset/restore path exists;
- operator has the Stage 4.2D-6 validation log ready;
- no secrets will be pasted into documentation or committed.

Stop if any item is uncertain.

### 3.2 `001_create_levio_principals.sql`

Expected result:

- `pgcrypto` extension is available;
- `public.levio_principals` exists;
- `principal_id` is the canonical owner anchor;
- `provider_reference` exists only as Supabase auth identity reference.

Checks after `001`:

- table exists;
- `principal_id` default uses `gen_random_uuid()`;
- `provider_name` and `provider_reference` columns exist;
- `provider_reference` is not used as owner ID;
- no provider tokens or secrets exist in the table.

Stop if:

- `pgcrypto` cannot be created;
- `gen_random_uuid()` is unavailable;
- table creation fails;
- target is not confirmed dev.

### 3.3 `002_create_simulation_records.sql`

Expected result:

- `public.simulation_records` exists;
- `owner_principal_id` is required;
- owner foreign key references `levio_principals(principal_id)`;
- payload is separated into user input, deterministic output, metadata, and safety flags;
- no AI memory, vector, subscription, billing, or payment fields exist.

Checks after `002`:

- table exists;
- `owner_principal_id` is not nullable;
- owner FK exists;
- JSONB object checks exist;
- `parent_record_id` FK exists;
- forbidden AI/memory/subscription/billing fields are absent.

Stop if:

- owner FK fails;
- JSONB check constraints fail;
- forbidden fields appear;
- table already exists with incompatible shape.

### 3.4 `003_create_simulation_drafts.sql`

Expected result:

- `public.simulation_drafts` exists;
- drafts are registered-user scoped;
- `owner_principal_id` is required;
- `expires_at` is required;
- guest persistence remains absent.

Checks after `003`:

- table exists;
- `owner_principal_id` is not nullable;
- `expires_at` is not nullable;
- draft payload JSONB object check exists;
- no guest table, guest policy, or guest claim structure exists.

Stop if:

- owner FK fails;
- expiry constraint fails;
- guest persistence appears;
- table already exists with incompatible shape.

### 3.5 `004_create_simulation_history_entries.sql`

Expected result:

- `public.simulation_history_entries` exists;
- `record_id` references `public.simulation_records(record_id)`;
- `owner_principal_id` is required;
- history is user-visible lifecycle/revision/outcome history, not hidden analytics.

Checks after `004`:

- table exists;
- `record_id` FK exists;
- `owner_principal_id` is not nullable;
- event payload JSONB object check exists;
- no hidden analytics table or analytics-only field is introduced.

Stop if:

- parent simulation FK fails;
- owner FK fails;
- event payload constraint fails;
- table already exists with incompatible shape.

### 3.6 `005_indexes_and_constraints.sql`

Expected result:

- owner-scoped indexes exist;
- active provider-reference uniqueness exists;
- draft/simulation provenance constraints exist;
- history parent-owner alignment exists;
- principal immutability trigger exists;
- owner immutability triggers exist.

Checks after `005`:

- `levio_principals_active_provider_reference_uidx` exists;
- owner/status/deletion/export indexes exist;
- `simulation_records_record_owner_unique` exists;
- `simulation_history_parent_owner_match_fk` exists;
- `levio_reject_principal_id_update()` exists;
- `levio_reject_owner_principal_update()` exists;
- immutability triggers exist on principals, records, drafts, and history.

Stop if:

- constraint creation fails;
- trigger function creation fails;
- circular dependency error appears;
- object already exists with incompatible shape.

### 3.7 `006_enable_rls_and_policies.sql`

Expected result:

- RLS is enabled on all four tables;
- principal self-read policy exists;
- owner read policies map through `provider_reference -> principal_id -> owner_principal_id`;
- no guest policies exist;
- direct authenticated writes are denied;
- direct authenticated deletes are denied.

Checks after `006`:

- RLS enabled on all four tables;
- `levio_principals_select_own` exists;
- `simulation_records_select_own` exists;
- `simulation_drafts_select_own` exists;
- `simulation_history_select_own` exists;
- direct insert/update/delete deny policies exist;
- no guest/anonymous allow policy exists.

Stop if:

- RLS enablement fails;
- any policy fails to create;
- any policy allows guest/anonymous access;
- direct client write denial policies are missing.

### 3.8 `007_rollback_notes.sql`

Expected result:

- file is reviewed as guidance;
- destructive rollback statements remain commented;
- no rollback is performed during successful forward execution.

Checks after `007` review:

- rollback notes reviewed;
- destructive statements not executed;
- empty-dev rollback path understood;
- production rollback remains forbidden.

Stop if:

- operator is uncertain whether rollback statements are commented;
- rollback seems necessary before validation is complete;
- target is not empty dev.

## 4. Validation Evidence

Collect evidence after manual execution. Evidence must not include secrets.

### 4.1 Screenshots

Recommended screenshots:

- dev project identifier label/ref with secrets hidden;
- table list showing `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries`;
- RLS enabled view for all four tables;
- policy list for all four tables;
- trigger/function existence view if available;
- failed direct client write attempts if displayed by the validation tool;
- cross-user denial evidence if displayed by the validation tool.

Do not include:

- service role key;
- anon key value;
- database password;
- credential-bearing URL;
- production project details unrelated to confirmation that production was not touched.

### 4.2 Logs

Required logs or copied non-secret outputs:

- execution date and operator;
- dev project reference/label;
- file-by-file success/failure status;
- exact error text for any failure;
- confirmation that `007` was reviewed only;
- confirmation that rollback was not executed, or exact empty-dev rollback details if rollback occurred.

### 4.3 Table List Evidence

Evidence must show:

- `public.levio_principals`;
- `public.simulation_records`;
- `public.simulation_drafts`;
- `public.simulation_history_entries`.

### 4.4 Policy List Evidence

Evidence must show:

- principal self-read policy;
- owner-scoped record read policy;
- owner-scoped draft read policy;
- owner-scoped history read policy;
- direct insert deny policies;
- direct update deny policies;
- direct delete deny policies;
- no guest/anonymous allow policies.

### 4.5 Constraint Validation Evidence

Evidence must confirm:

- owner foreign keys exist;
- provider-reference uniqueness exists;
- history parent-owner alignment exists;
- JSONB object checks exist;
- draft expiry constraint exists;
- principal ID immutability trigger exists;
- owner immutability triggers exist.

### 4.6 RLS Validation Evidence

Evidence must confirm:

- user A can read only owned eligible rows after controlled test setup;
- user A cannot read user B principal row;
- user A cannot read user B records/drafts/history;
- missing principal mapping fails closed;
- unauthenticated access is denied;
- guest/anonymous access is denied;
- direct authenticated client inserts/updates/deletes are blocked;
- service role remains server/operator-only and is not treated as client behavior.

## 5. Failure Handling

### 5.1 Migration Failed

If any migration file fails:

1. Stop immediately.
2. Do not continue to later migration files.
3. Record file name, error, and last successful file.
4. Confirm the active project is the empty dev project.
5. Do not execute rollback notes automatically.
6. Use the approved reset/restore path if the dev project can be safely reset.
7. Return with the error log for review before retrying.

### 5.2 Policy Failed

If a policy fails to create or behaves incorrectly:

1. Stop validation.
2. Capture the exact policy error or unexpected access result.
3. Do not weaken RLS to proceed.
4. Do not add ad hoc allow policies.
5. Do not enable guest access.
6. Return for migration review/hardening before another execution attempt.

### 5.3 Constraint Failed

If a constraint fails:

1. Stop immediately.
2. Capture the exact constraint name and error.
3. Do not skip the constraint.
4. Do not alter table shape manually outside reviewed migrations.
5. If the dev project is empty, reset/restore and return for review.

### 5.4 Wrong Project Selected

If the wrong project is selected or suspected:

1. Stop immediately.
2. Do not execute further SQL.
3. Record whether any file was already applied.
4. If production may have been touched, escalate immediately and do not attempt local fixes.
5. Preserve evidence without exposing secrets.
6. Do not proceed to Stage 4.2E.

## 6. Go Criteria

Stage 4.2D may be considered actually complete only when all of the following are true:

- migrations were manually executed in the approved Empty Dev Supabase Project;
- production Supabase was not touched;
- production Vercel env was not changed;
- `001` through `006` applied successfully;
- `007` was reviewed only, unless an explicit empty-dev rollback was required and documented;
- all four tables exist;
- required constraints exist;
- required indexes exist;
- required trigger functions and triggers exist;
- RLS is enabled on all four tables;
- expected policies exist;
- no guest/anonymous allow policy exists;
- direct authenticated client writes are blocked;
- cross-user reads are blocked;
- missing principal mapping fails closed;
- service role boundary is confirmed server/operator-only;
- validation log is completed and returned;
- runtime persistence remains unimplemented;
- Stage 4.3 and Stage 4.4 remain not started.

If any item is incomplete, Stage 4.2D remains open and Stage 4.2E must not begin.

## 7. Next Stage Mapping

After successful dev execution and accepted validation evidence, the next eligible stage is:

```text
STAGE 4.2E
PERSISTENCE RUNTIME FOUNDATION
```

Stage 4.2E may begin only after:

- dev migrations are confirmed applied;
- validation log is reviewed and accepted;
- table, constraint, trigger, RLS, policy, direct-client-write denial, and cross-user isolation evidence is complete;
- production remains untouched;
- runtime persistence remains unimplemented until Stage 4.2E scope is explicitly approved.

Stage 4.2E must not automatically start Stage 4.3 User Data Controls, Stage 4.4 Subscription Runtime, simulator persistence integration, AI, memory, billing, or production deployment.

## Roadmap Compliance Confirmation

- SQL was not executed by Codex.
- Supabase was not connected by Codex.
- Tables were not created by Codex.
- Migration files were not changed.
- Runtime code was not changed.
- Auth runtime was not changed.
- Simulator was not changed.
- Decision Engine was not changed.
- `SimulationResponse` was not changed.
- AI was not connected.
- Memory was not connected.
- Subscriptions and billing were not connected.
- Stage 4.3 was not started.
- Stage 4.4 was not started.
