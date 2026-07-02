# LEVIO STAGE 4.2D-8 DEV SUPABASE TARGET UNBLOCK PLAN

## Document Status

- Stage: 4.2D-8 - Dev Supabase Target Unblock Plan.
- Status: unblock plan only.
- Date: 18 June 2026, Europe/Madrid.
- Depends on: `../../../../PROJECT_CONTEXT.md`, `../../../../LEVIO_CURRENT_STATE.md`, `../../../../CURRENT_STAGE.md`, `LEVIO_STAGE_4_2D_5_SUPABASE_EXECUTION_READINESS_PLAN.md`, `LEVIO_STAGE_4_2D_6_MANUAL_SUPABASE_EXECUTION_GUIDE.md`, `LEVIO_STAGE_4_2D_7_PRE_EXECUTION_AUDIT.md`, and `supabase/migrations/*.sql`.
- SQL execution status: not executed by Codex.
- Supabase connection status: not connected by Codex.
- Supabase table status: not created by Codex.
- Migration file status: unchanged.
- Runtime persistence status: not implemented.
- Stage 4.3 status: not started.
- Stage 4.4 status: not started.

This document defines how to unblock the Stage 4.2D-7 `NO-GO` decision before any dev migration execution. It does not execute SQL, connect to Supabase, create tables, change migration files, change runtime code, change auth runtime, change dashboard, change simulator, change the Decision Engine, change `SimulationResponse`, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.

Secrets must not be written into this document, committed to git, pasted into project documentation, or exposed in screenshots/logs. Required owner inputs should confirm handling and environment identity without storing secret values.

## 1. Blocker Breakdown

### 1.1 Isolated Local/Dev Supabase Target Not Confirmed

Blocker:

- Stage 4.2D-7 has no recorded isolated local/dev Supabase target.
- Without the exact non-production target, migration execution could accidentally hit the wrong environment.

Required unblock:

- Select one target type:
  - Supabase local development database; or
  - empty Supabase dev project with no production user data.
- Record a non-secret target identifier such as project name/ref label or local environment label.
- Confirm the target is not production and is not connected to production Vercel.

Do not record:

- database passwords;
- service role secret values;
- full connection strings containing credentials;
- production project secrets.

### 1.2 Reset / Restore Path Not Confirmed

Blocker:

- Stage 4.2D-7 has no proof that failed migration execution can be safely reset or restored.
- Partial migration failure could leave a local/dev target in a mixed state.

Required unblock:

- For local disposable databases, confirm the reset/recreate command or process is known.
- For empty dev projects, confirm a snapshot, backup, or full project reset path.
- Confirm rollback notes in `007_rollback_notes.sql` are reviewed but not executed during normal forward migration.

### 1.3 Execution Method Not Approved

Blocker:

- Stage 4.2D-7 does not know whether execution will use Supabase CLI, Supabase Dashboard SQL editor, or another controlled SQL client.
- Different workflows may have different expectations, including timestamped migration filenames.

Required unblock:

- Choose exactly one execution method:
  - local Supabase CLI workflow;
  - Supabase Dashboard SQL editor for an empty dev project;
  - controlled SQL client pointed only at the approved local/dev database.
- Confirm the method supports the existing reviewed files or explicitly return for a separate migration-file naming stage if timestamped filenames are required.

### 1.4 Test Users Not Defined

Blocker:

- RLS and cross-user isolation cannot be validated without controlled local/dev Supabase Auth users.

Required unblock:

- Prepare at least two local/dev test users:
  - user A for owner-positive checks;
  - user B for cross-user denial checks.
- Prepare a missing-principal authenticated user case if feasible.
- Confirm test users are not production users and do not contain real personal data beyond minimal local/dev test identifiers.

### 1.5 Service-Role Boundary Not Confirmed

Blocker:

- Service role may be needed for local/dev administrative setup, but it must never enter browser/client/runtime code.

Required unblock:

- Confirm service role use is limited to local/dev operator/admin context.
- Confirm service role secrets will not be placed in `.env.local`, public env vars, browser bundles, docs, screenshots, issue text, or logs.
- Confirm service role will not be used to simulate normal client access.

### 1.6 Anon-Key Validation Boundary Not Confirmed

Blocker:

- RLS must be validated from anon/authenticated client context, but anon-key use must remain clearly separated from service role use.

Required unblock:

- Confirm anon key is used only for local/dev client-context RLS tests.
- Confirm expected direct client insert/update/delete operations are blocked.
- Confirm cross-user reads are blocked from authenticated client context.
- Confirm guest/unauthenticated access remains denied.

Do not record the anon key value in git or docs.

### 1.7 Validation-Log Capture Process Not Approved

Blocker:

- Stage 4.2D-7 has no agreed process for capturing and returning evidence after manual execution.

Required unblock:

- Use the Stage 4.2D-6 validation log template.
- Confirm who will fill it out.
- Confirm exact evidence format:
  - completed text log;
  - copied non-secret query results;
  - screenshots with secrets redacted, if used.
- Confirm validation evidence will include table, constraint, trigger, RLS, policy, direct-client-write denial, cross-user isolation, guest denial, and production-not-touched checks.

## 2. Required Owner Inputs

Before any dev execution, the project owner/operator must provide decisions or confirmations for the following items.

### 2.1 Target Selection

Required owner input:

```text
Selected target type:
[ ] Supabase local development database
[ ] Empty Supabase dev project
[ ] Other non-production target, requiring separate approval:
```

Required confirmation:

```text
[ ] Target contains no production user data.
[ ] Target is not connected to production Vercel.
[ ] Production Supabase is not selected.
```

### 2.2 Dev Project URL / Reference

Required owner input:

```text
Non-secret dev project label/reference:
Non-secret database target label:
```

Rules:

- Record only non-secret identifiers.
- Do not record passwords, access tokens, service role key values, anon key values, or credential-bearing connection strings.
- If a URL contains a secret or credential, do not paste it into the document.

### 2.3 Anon Key Handling

Required owner input:

```text
[ ] Local/dev anon key is available for client-context validation.
[ ] Anon key value will not be committed or documented.
[ ] Anon key is not treated as server authority.
[ ] Anon-key tests will check RLS denial and owner isolation.
```

### 2.4 Service Role Handling

Required owner input:

```text
[ ] Local/dev service role key is available only to the operator/admin context.
[ ] Service role value will not be committed or documented.
[ ] Service role will not be exposed to browser/client code.
[ ] Service role will be used only for schema/admin/test setup if needed.
```

### 2.5 Execution Method

Required owner input:

```text
Selected execution method:
[ ] Supabase local CLI
[ ] Supabase Dashboard SQL editor
[ ] Controlled SQL client
```

Required confirmation:

```text
[ ] Execution method points only to the selected local/dev target.
[ ] Existing reviewed file names are compatible with the selected method, or a separate naming stage is required before execution.
[ ] Migration order from 001 through 007 is accepted.
```

### 2.6 Rollback / Reset Method

Required owner input:

```text
Reset/restore method:
[ ] Disposable local reset/recreate
[ ] Dev project snapshot/restore
[ ] Other separately approved recovery process:
```

Required confirmation:

```text
[ ] Reset/restore process is understood before execution.
[ ] Rollback notes are reviewed as guidance only.
[ ] Destructive rollback statements will not be executed during normal forward migration.
```

### 2.7 Test User Strategy

Required owner input:

```text
[ ] Test user A exists or can be created in local/dev.
[ ] Test user B exists or can be created in local/dev.
[ ] Test users are not production users.
[ ] Test users contain no real personal data beyond minimal local/dev test identifiers.
[ ] Missing-principal authenticated case is available or explicitly deferred with rationale.
```

## 3. Recommended Safe Path

Recommended path:

```text
Supabase local development database first
```

Why this is safest:

- the target can usually be reset without data lifecycle risk;
- no production user data is present;
- migration parse, dependency, trigger, constraint, and RLS behavior can be validated before any shared dev project;
- partial failures can be handled by reset/recreate rather than manual cleanup;
- no Vercel production environment changes are needed.

Fallback path:

```text
Empty Supabase dev project
```

Allowed only if:

- local Supabase is not available or not representative enough;
- the dev project is empty;
- production is not selected;
- project ref is confirmed non-production;
- reset/snapshot path exists;
- production Vercel env is not changed.

Forbidden path:

```text
Production Supabase
```

Production remains forbidden for this stage. Vercel production environment variables must not be changed before successful local/dev validation and a later explicit approval.

## 4. Pre-Execution Checklist Template

Complete this checklist before asking to move from `NO-GO` to `GO FOR DEV EXECUTION`.

```text
LEVIO STAGE 4.2D-8 PRE-EXECUTION CHECKLIST

Target:
[ ] Target confirmed:
[ ] Target type is local/dev:
[ ] Production not selected:
[ ] Target contains no production user data:
[ ] Target is not connected to production Vercel:

Recovery:
[ ] Backup/reset available:
[ ] Reset/restore method recorded without secrets:
[ ] Rollback notes reviewed:
[ ] Destructive rollback statements will not be executed during forward migration:

Secrets:
[ ] Service role not exposed:
[ ] Service role value not written to git/docs:
[ ] Anon key value not written to git/docs:
[ ] Production secrets not present in execution context:

Client Boundary:
[ ] Anon key client boundary understood:
[ ] Direct client write denial will be tested:
[ ] Cross-user read denial will be tested:
[ ] Guest/unauthenticated denial will be tested:

Execution:
[ ] Execution method selected:
[ ] Existing reviewed file names are compatible, or naming issue is escalated:
[ ] Migration order confirmed:
[ ] 007_rollback_notes.sql will be reviewed only:

Validation:
[ ] Test user A ready:
[ ] Test user B ready:
[ ] Missing-principal case ready or deferred with rationale:
[ ] Validation log ready:
[ ] Evidence format agreed:
[ ] Stop conditions accepted:

Owner/operator confirmation:
[ ] Execution will be local/dev only.
[ ] Production will not be touched.
[ ] SQL will be executed manually by owner/operator, not by Codex.
[ ] Runtime persistence will not be implemented during execution.
[ ] Stage 4.3 will not be started.
[ ] Stage 4.4 will not be started.
```

## 5. Go Criteria

The status may return to:

```text
GO FOR DEV EXECUTION
```

only when all of the following are true:

- the selected target is confirmed local/dev and not production;
- production Vercel env is untouched;
- no production keys or database URLs are present in the execution context;
- reset/restore path is confirmed;
- execution method is selected and compatible with the reviewed migration files;
- test user strategy is ready;
- service-role boundary is confirmed and secrets remain out of git/docs;
- anon-key validation boundary is confirmed and secrets remain out of git/docs;
- migration order is accepted;
- `007_rollback_notes.sql` is understood as review-only during normal forward execution;
- validation log template is ready;
- stop conditions are accepted;
- owner/operator explicitly confirms the checklist.

If any criterion is incomplete, the status remains:

```text
NO-GO
```

## 6. Next Step After Owner Inputs

After the owner/operator completes the checklist and confirms the local/dev target, the next stage may be:

```text
STAGE 4.2D-9
DEV MIGRATION EXECUTION SUPPORT PLAN
```

Stage 4.2D-9 may plan execution support only after target/checklist confirmation. It must not automatically start Stage 4.2E, Stage 4.3, Stage 4.4, runtime persistence, simulator persistence integration, subscriptions, AI, memory, billing, or production execution.

## Roadmap Compliance Confirmation

- SQL was not executed.
- Supabase was not connected.
- Tables were not created.
- Migration files were not changed.
- Runtime code was not changed.
- Auth runtime was not changed.
- Dashboard was not changed.
- Simulator was not changed.
- Decision Engine was not changed.
- `SimulationResponse` was not changed.
- Package files were not changed.
- AI was not connected.
- Memory was not connected.
- Subscriptions and billing were not connected.
- Stage 4.3 was not started.
- Stage 4.4 was not started.
