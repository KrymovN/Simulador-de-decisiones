# LEVIO STAGE 4.2D-10 OWNER EXECUTION CHECKLIST

## Document Status

- Stage: 4.2D-10 - Owner Execution Checklist.
- Status: practical manual checklist only.
- Date: 18 June 2026, Europe/Madrid.
- Approved dev target: Empty Dev Supabase Project.
- SQL execution status: not executed by Codex.
- Supabase connection status: not connected by Codex.
- Supabase table status: not created by Codex.
- Runtime persistence status: not implemented.

This checklist is for the owner/operator who will manually apply the reviewed migration files in the approved Empty Dev Supabase Project.

## 1. Before Starting

Confirm before running any SQL:

- [ ] The selected Supabase project is the Empty Dev Supabase Project.
- [ ] The selected project is not production.
- [ ] The project contains no production user data.
- [ ] The project is not connected to production Vercel.
- [ ] The project reference is saved without secrets.
- [ ] SQL Editor or the approved execution method is open.
- [ ] Validation log is ready.
- [ ] Rollback/reset option is confirmed.
- [ ] No service role key, anon key, password, or credential-bearing URL will be pasted into git/docs.

## 2. Execution Order

Run or review files in this exact order:

1. `001_create_levio_principals.sql`
2. `002_create_simulation_records.sql`
3. `003_create_simulation_drafts.sql`
4. `004_create_simulation_history_entries.sql`
5. `005_indexes_and_constraints.sql`
6. `006_enable_rls_and_policies.sql`
7. `007_rollback_notes.sql`

Important:

- `001` through `006` are forward migration files.
- `007_rollback_notes.sql` is review guidance. Do not execute destructive rollback statements during normal forward execution.

## 3. After Each File

After each file:

- [ ] Record success/failure in the validation log.
- [ ] Check expected objects before continuing.
- [ ] If there is an error, stop immediately.
- [ ] Do not continue to the next file until the current file is verified.
- [ ] Do not manually patch the schema outside reviewed migration files.

## 4. After Full Execution

Verify and record:

- [ ] Tables exist.
- [ ] Constraints exist.
- [ ] Triggers and trigger functions exist.
- [ ] RLS is enabled.
- [ ] Policies exist.
- [ ] Direct client writes are blocked.
- [ ] Cross-user access is blocked.
- [ ] Guest/anonymous access is blocked.
- [ ] Production was not touched.

## 5. Send Back After Manual Execution

Return:

- environment confirmation;
- project reference without secrets;
- executed file list;
- validation results;
- errors, if any;
- screenshots/logs if available, with secrets hidden;
- confirmation that production was not touched;
- confirmation that runtime persistence was not implemented;
- confirmation that Stage 4.3 and Stage 4.4 were not started.

## 6. Stop Conditions

Stop immediately if:

- wrong project is selected;
- production is selected or suspected;
- migration error occurs;
- rollback uncertainty appears;
- RLS or policy error occurs;
- constraint error occurs;
- service role appears in client/browser context;
- secrets are visible in a screenshot/log/document;
- reset/restore path is uncertain.

After stopping, record the exact file, error, and last successful step. Do not continue without review.

## Roadmap Compliance Confirmation

- SQL was not executed by Codex.
- Supabase was not connected by Codex.
- Tables were not created by Codex.
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
