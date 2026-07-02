# LEVIO STAGE 4.2D-1 MIGRATION SQL REVIEW DRAFT

## Document Status

- Stage: 4.2D-1 - Persistence Migration Drafts, SQL Review Only.
- Status: review draft only.
- Date: 17 June 2026, Europe/Madrid.
- Depends on: `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, and Stage 4.1 Auth Runtime.
- Persistence runtime status: not implemented.
- Real SQL file status: not created.
- Migration status: not created.
- Supabase table status: not created.
- Supabase connection status: not connected.

This document contains SQL review drafts inside Markdown code blocks only. It does not create real migration files, SQL files, schema files, migration directories, Supabase tables, runtime code, auth runtime changes, dashboard changes, simulator changes, decision-engine changes, `SimulationResponse` changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.

## 1. Purpose

Stage 4.2D-1 converts the approved migration file list into reviewable SQL draft blocks before any real migration exists.

The purpose is to make ownership, data lifecycle, RLS posture, rollback order, and forbidden coupling visible for review. These drafts are not executable release artifacts. They must be reviewed and converted into real migration files only in a later explicitly approved stage.

## 2. Review Scope

This document drafts future SQL for:

```text
001_create_levio_principals
002_create_simulation_records
003_create_simulation_drafts
004_create_simulation_history_entries
005_indexes_and_constraints
006_enable_rls_and_policies
007_rollback_notes
```

The drafts preserve the approved schema boundary:

- canonical owner anchor: `levio_principals.principal_id`;
- Supabase `auth.users.id` stored only as `provider_reference`;
- `provider_reference` must not become `owner_id`;
- `owner_principal_id` is mandatory for persisted user-owned records;
- runtime must derive owners server-side from the Stage 4.1 auth session and principal mapping;
- client-provided owner fields are not trusted;
- guest persistence is denied until separately approved;
- no AI memory, vector, embedding, subscription, billing, or payment fields are introduced.

## 3. Non-Scope

Stage 4.2D-1 does not:

- create `supabase/`;
- create `migrations/`;
- create `.sql` files;
- apply SQL;
- connect to Supabase;
- create database tables;
- implement persistence runtime;
- implement persistence APIs;
- change auth runtime;
- change dashboard runtime;
- change simulator runtime;
- change the Decision Engine;
- change `SimulationResponse`;
- install packages;
- start Stage 4.3 User Data Controls;
- start Stage 4.4 Subscription Runtime.

## 4. SQL Draft Review Blocks

All SQL below is review-only. It must not be executed from this document.

### 4.1 `001_create_levio_principals`

Review intent:

- create the canonical Levio principal mapping table;
- keep `principal_id` as the only owner anchor;
- store Supabase `auth.users.id` only as `provider_reference`;
- include `provider_name` and principal/provider status;
- avoid provider tokens, secrets, subscription state, billing state, memory, or decision content.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration: 001_create_levio_principals
-- Canonical owner anchor: public.levio_principals.principal_id.
-- Supabase auth.users.id is stored only as provider_reference.
-- provider_reference is not owner_id and must not be used as the
-- ownership column for simulations, drafts, or history entries.

create table public.levio_principals (
  principal_id uuid primary key default gen_random_uuid(),

  principal_type text not null
    check (principal_type in ('registered_user')),

  principal_status text not null default 'active'
    check (
      principal_status in (
        'active',
        'disabled',
        'restricted',
        'deletion_requested',
        'deleted'
      )
    ),

  provider_name text not null
    check (provider_name in ('supabase')),

  provider_reference uuid not null,

  provider_reference_status text not null default 'active'
    check (
      provider_reference_status in (
        'active',
        'revoked',
        'replaced',
        'recovery_pending'
      )
    ),

  provider_subject_type text not null default 'user'
    check (provider_subject_type in ('user')),

  provider_email_snapshot text,
  provider_email_verified boolean not null default false,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  disabled_at timestamptz,
  deleted_at timestamptz,
  last_authenticated_at timestamptz,
  last_provider_sync_at timestamptz,

  deletion_state text not null default 'active'
    check (
      deletion_state in (
        'active',
        'deletion_requested',
        'restricted',
        'deleted',
        'anonymized',
        'retained_legal_exception'
      )
    ),

  retention_rule text not null default 'account_lifecycle',
  recovery_state text,
  locale_preference text,
  metadata_version integer,
  deletion_requested_at timestamptz,
  legal_hold_reason text,
  schema_version integer not null default 1,

  constraint levio_principals_registered_user_provider_reference_required
    check (
      principal_type <> 'registered_user'
      or provider_reference is not null
    )
);

comment on table public.levio_principals is
  'Review draft only. Stable Levio principal mapping. principal_id is the owner anchor; provider_reference is an auth provider link only.';

comment on column public.levio_principals.principal_id is
  'Canonical Levio owner anchor for future persisted user data.';

comment on column public.levio_principals.provider_reference is
  'Supabase auth.users.id stored as an identity link only. Not an owner_id.';
```

Review notes:

- A direct foreign key to `auth.users(id)` is intentionally not drafted here. The provider reference is an identity link, not the owner model.
- Future account linking may require a separate provider-reference table. This draft keeps the first implementation narrow.
- No provider token or auth secret is stored.

### 4.2 `002_create_simulation_records`

Review intent:

- create the future saved simulation table;
- require `owner_principal_id`;
- separate `user_input_snapshot`, `deterministic_output_snapshot`, `metadata`, and `safety_flags`;
- keep draft data separate from completed simulations;
- exclude AI memory, vector, embedding, prompt, raw AI response, subscription, and billing fields.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration: 002_create_simulation_records
-- owner_principal_id is required and must be derived server-side.
-- Client-provided owner values are forbidden by runtime design.

create table public.simulation_records (
  simulation_id uuid primary key default gen_random_uuid(),

  owner_principal_id uuid not null,
  owner_principal_type text not null default 'registered_user'
    check (owner_principal_type in ('registered_user')),

  record_status text not null default 'active'
    check (
      record_status in (
        'active',
        'archived',
        'restricted',
        'deletion_pending',
        'deleted'
      )
    ),

  source_type text not null default 'explicit_save'
    check (
      source_type in (
        'explicit_save',
        'approved_account_save',
        'registered_user_import'
      )
    ),

  title text,
  user_note text,

  user_input_snapshot jsonb not null,
  deterministic_output_snapshot jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '{}'::jsonb,

  clarification_snapshot jsonb,
  decision_model_snapshot jsonb,
  confidence_summary jsonb,

  simulation_response_version text not null,
  decision_contract_version text not null,
  language text not null,
  safety_classification text not null,
  recommendation_state text not null,
  content_sensitivity text not null default 'user_decision_content',

  originating_draft_id uuid,
  parent_simulation_id uuid,
  revision_label text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  deleted_at timestamptz,
  last_exported_at timestamptz,

  deletion_state text not null default 'active'
    check (
      deletion_state in (
        'active',
        'deletion_requested',
        'restricted',
        'deleted',
        'anonymized',
        'retained_legal_exception'
      )
    ),

  retention_rule text not null default 'saved_simulation_lifecycle',
  export_eligible boolean not null default true,
  legal_hold_reason text,
  schema_version integer not null default 1,

  constraint simulation_records_user_input_is_object
    check (jsonb_typeof(user_input_snapshot) = 'object'),

  constraint simulation_records_deterministic_output_is_object
    check (jsonb_typeof(deterministic_output_snapshot) = 'object'),

  constraint simulation_records_metadata_is_object
    check (jsonb_typeof(metadata) = 'object'),

  constraint simulation_records_safety_flags_is_object
    check (jsonb_typeof(safety_flags) = 'object')
);

comment on table public.simulation_records is
  'Review draft only. Explicitly saved user-owned simulation records. No AI memory, vector, embedding, subscription, or billing fields.';

comment on column public.simulation_records.owner_principal_id is
  'Required Levio principal owner. Must be derived server-side; never trusted from client input.';

comment on column public.simulation_records.user_input_snapshot is
  'User-authored or user-confirmed input snapshot for the saved simulation.';

comment on column public.simulation_records.deterministic_output_snapshot is
  'User-controlled deterministic output snapshot mapped from the approved response contract.';

comment on column public.simulation_records.metadata is
  'Visible/content-minimized metadata such as versions, language, provenance, and timestamps.';

comment on column public.simulation_records.safety_flags is
  'User-visible or explainable safety state that affects product behavior.';
```

Review notes:

- The draft uses `metadata` because the stage request names that logical payload area. Future implementation review may rename it to `user_visible_metadata` if that better matches the Stage 4.2B payload policy.
- `metadata` must not become a dumping ground for hidden AI traces or operational logs.
- Foreign keys are deferred to `005_indexes_and_constraints` to match the approved migration sequence.

### 4.3 `003_create_simulation_drafts`

Review intent:

- create the future registered-user draft table;
- require `owner_principal_id`;
- store draft payload separately from completed simulation records;
- require status, expiry, deletion, retention, and export lifecycle fields;
- keep guest drafts denied until separately approved.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration: 003_create_simulation_drafts
-- Drafts are separate from completed simulations and history.
-- Guest drafts are not approved in this draft.

create table public.simulation_drafts (
  draft_id uuid primary key default gen_random_uuid(),

  owner_principal_id uuid not null,
  owner_principal_type text not null default 'registered_user'
    check (owner_principal_type in ('registered_user')),

  draft_status text not null default 'active'
    check (
      draft_status in (
        'active',
        'saved',
        'converted',
        'discarded',
        'expired',
        'restricted',
        'deleted'
      )
    ),

  draft_payload jsonb not null,
  draft_text_snapshot text,
  clarification_answers_snapshot jsonb,
  structured_context_snapshot jsonb,

  language text not null,
  autosave_enabled boolean not null default false,
  originating_surface text,
  converted_simulation_id uuid,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_autosaved_at timestamptz,
  expires_at timestamptz not null,
  discarded_at timestamptz,
  deleted_at timestamptz,

  deletion_state text not null default 'active'
    check (
      deletion_state in (
        'active',
        'deletion_requested',
        'restricted',
        'deleted',
        'anonymized',
        'retained_legal_exception'
      )
    ),

  retention_rule text not null default 'draft_short_lifecycle',
  export_eligible boolean not null default true,
  legal_hold_reason text,
  schema_version integer not null default 1,

  constraint simulation_drafts_payload_is_object
    check (jsonb_typeof(draft_payload) = 'object'),

  constraint simulation_drafts_expiry_after_creation
    check (expires_at > created_at)
);

comment on table public.simulation_drafts is
  'Review draft only. Registered-user server-side drafts with visible lifecycle. Guest persistence is not approved.';

comment on column public.simulation_drafts.owner_principal_id is
  'Required Levio principal owner. Must be derived server-side; never trusted from client input.';

comment on column public.simulation_drafts.draft_payload is
  'Draft payload separate from completed simulation records.';
```

Review notes:

- `draft_payload` is intentionally separate from completed simulation output.
- `autosave_enabled` defaults to `false`; visible autosave behavior requires later runtime/UI approval.
- Expiry is mandatory because drafts are temporary by default.

### 4.4 `004_create_simulation_history_entries`

Review intent:

- create the future user-visible simulation history table;
- require `owner_principal_id`;
- relate each entry to a `simulation_record`;
- keep history owner aligned with parent simulation owner;
- document append-only behavior and mutation limitations;
- exclude hidden analytics logs.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration: 004_create_simulation_history_entries
-- History is user-visible lifecycle/revision/outcome history, not analytics.
-- Entries are append-only by default. Later updates are limited to lifecycle,
-- restriction, anonymization, export, or deletion metadata.

create table public.simulation_history_entries (
  history_entry_id uuid primary key default gen_random_uuid(),

  owner_principal_id uuid not null,
  owner_principal_type text not null default 'registered_user'
    check (owner_principal_type in ('registered_user')),

  simulation_id uuid not null,

  event_type text not null
    check (
      event_type in (
        'created',
        'updated',
        'archived',
        'restored',
        'deleted',
        'export_requested',
        'export_completed',
        'revision_created',
        'outcome_added',
        'claim_completed'
      )
    ),

  event_timestamp timestamptz not null default timezone('utc', now()),
  event_source text not null default 'server'
    check (
      event_source in (
        'server',
        'owner_action',
        'system_lifecycle',
        'import_flow',
        'export_flow'
      )
    ),

  user_visible boolean not null default true,
  event_summary text,
  event_payload jsonb not null default '{}'::jsonb,

  before_reference uuid,
  after_reference uuid,
  revision_reference uuid,
  outcome_snapshot jsonb,
  claim_transaction_reference uuid,
  export_reference uuid,

  deletion_state text not null default 'active'
    check (
      deletion_state in (
        'active',
        'deletion_requested',
        'restricted',
        'deleted',
        'anonymized',
        'retained_legal_exception'
      )
    ),

  retention_rule text not null default 'parent_simulation_lifecycle',
  export_eligible boolean not null default true,
  deleted_at timestamptz,
  legal_hold_reason text,
  schema_version integer not null default 1,

  constraint simulation_history_event_payload_is_object
    check (jsonb_typeof(event_payload) = 'object')
);

comment on table public.simulation_history_entries is
  'Review draft only. User-visible simulation lifecycle and revision history. Not hidden analytics.';

comment on column public.simulation_history_entries.owner_principal_id is
  'Required Levio principal owner. Must match the parent simulation owner.';

comment on column public.simulation_history_entries.event_payload is
  'Content-minimized event data. Must not contain hidden operational logs or unrelated analytics.';
```

Append-only review policy:

- normal runtime must append a new history entry for material changes;
- updates may be allowed only for deletion lifecycle, restriction, anonymization, export metadata, or legal-hold metadata;
- silent rewrite of material decision history is forbidden;
- event payload must not become a hidden operational log.

### 4.5 `005_indexes_and_constraints`

Review intent:

- add lookup indexes for owner-scoped operations;
- add active provider-reference uniqueness;
- add foreign keys after base tables exist;
- avoid destructive cascade defaults;
- enforce parent-owner alignment for history where possible.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration: 005_indexes_and_constraints
-- Adds future indexes and relationship constraints after base tables exist.

create unique index levio_principals_active_provider_reference_uidx
  on public.levio_principals (provider_name, provider_reference)
  where provider_reference_status = 'active'
    and principal_status in ('active', 'restricted', 'deletion_requested')
    and deletion_state in ('active', 'deletion_requested', 'restricted');

create index levio_principals_status_idx
  on public.levio_principals (principal_status, deletion_state);

create index levio_principals_provider_lookup_idx
  on public.levio_principals (provider_name, provider_reference, principal_status);

create index simulation_records_owner_status_updated_idx
  on public.simulation_records (owner_principal_id, record_status, updated_at desc);

create index simulation_records_owner_deletion_idx
  on public.simulation_records (owner_principal_id, deletion_state);

create index simulation_records_owner_export_idx
  on public.simulation_records (owner_principal_id, export_eligible);

create index simulation_records_originating_draft_idx
  on public.simulation_records (originating_draft_id)
  where originating_draft_id is not null;

create index simulation_records_parent_simulation_idx
  on public.simulation_records (parent_simulation_id)
  where parent_simulation_id is not null;

create index simulation_drafts_owner_status_updated_idx
  on public.simulation_drafts (owner_principal_id, draft_status, updated_at desc);

create index simulation_drafts_expiry_idx
  on public.simulation_drafts (expires_at, draft_status);

create index simulation_drafts_deletion_idx
  on public.simulation_drafts (owner_principal_id, deletion_state);

create unique index simulation_drafts_converted_once_uidx
  on public.simulation_drafts (converted_simulation_id)
  where converted_simulation_id is not null;

create index simulation_history_owner_timestamp_idx
  on public.simulation_history_entries (owner_principal_id, event_timestamp desc);

create index simulation_history_simulation_timestamp_idx
  on public.simulation_history_entries (simulation_id, event_timestamp asc);

create index simulation_history_owner_visible_timestamp_idx
  on public.simulation_history_entries (owner_principal_id, user_visible, event_timestamp desc);

create index simulation_history_deletion_idx
  on public.simulation_history_entries (owner_principal_id, deletion_state);

alter table public.simulation_records
  add constraint simulation_records_owner_principal_fk
  foreign key (owner_principal_id)
  references public.levio_principals (principal_id)
  on update restrict
  on delete restrict;

alter table public.simulation_records
  add constraint simulation_records_originating_draft_fk
  foreign key (originating_draft_id)
  references public.simulation_drafts (draft_id)
  on update restrict
  on delete set null;

alter table public.simulation_records
  add constraint simulation_records_parent_simulation_fk
  foreign key (parent_simulation_id)
  references public.simulation_records (simulation_id)
  on update restrict
  on delete restrict;

alter table public.simulation_records
  add constraint simulation_records_simulation_owner_unique
  unique (simulation_id, owner_principal_id);

alter table public.simulation_drafts
  add constraint simulation_drafts_owner_principal_fk
  foreign key (owner_principal_id)
  references public.levio_principals (principal_id)
  on update restrict
  on delete restrict;

alter table public.simulation_drafts
  add constraint simulation_drafts_converted_simulation_fk
  foreign key (converted_simulation_id)
  references public.simulation_records (simulation_id)
  on update restrict
  on delete set null;

alter table public.simulation_history_entries
  add constraint simulation_history_owner_principal_fk
  foreign key (owner_principal_id)
  references public.levio_principals (principal_id)
  on update restrict
  on delete restrict;

alter table public.simulation_history_entries
  add constraint simulation_history_simulation_fk
  foreign key (simulation_id)
  references public.simulation_records (simulation_id)
  on update restrict
  on delete restrict;

alter table public.simulation_history_entries
  add constraint simulation_history_parent_owner_match_fk
  foreign key (simulation_id, owner_principal_id)
  references public.simulation_records (simulation_id, owner_principal_id)
  on update restrict
  on delete restrict;

-- Review draft hardening: immutable owner anchors.
-- Real migration review must decide whether to use one shared trigger function
-- with TG_ARGV, separate table-specific trigger functions, or application plus
-- database constraints. The invariant is not optional.
create function public.levio_reject_principal_id_update()
returns trigger
language plpgsql
as $$
begin
  if new.principal_id <> old.principal_id then
    raise exception 'principal_id is immutable';
  end if;

  return new;
end;
$$;

create trigger levio_principals_reject_principal_id_update
  before update on public.levio_principals
  for each row
  execute function public.levio_reject_principal_id_update();

create function public.levio_reject_owner_principal_update()
returns trigger
language plpgsql
as $$
begin
  if new.owner_principal_id <> old.owner_principal_id then
    raise exception 'owner_principal_id is immutable';
  end if;

  if new.owner_principal_type <> old.owner_principal_type then
    raise exception 'owner_principal_type is immutable';
  end if;

  return new;
end;
$$;

create trigger simulation_records_reject_owner_update
  before update on public.simulation_records
  for each row
  execute function public.levio_reject_owner_principal_update();

create trigger simulation_drafts_reject_owner_update
  before update on public.simulation_drafts
  for each row
  execute function public.levio_reject_owner_principal_update();

create trigger simulation_history_reject_owner_update
  before update on public.simulation_history_entries
  for each row
  execute function public.levio_reject_owner_principal_update();
```

Review notes:

- `on delete restrict` is preferred for user-owned tables to avoid accidental hard deletion outside the approved lifecycle.
- `on delete set null` is drafted only for optional provenance references that should not block lifecycle handling.
- No uniqueness is based on title, user input, email, display name, or content.
- Active provider-reference uniqueness covers non-terminal principal states to avoid duplicate active mappings during deletion/restriction workflows.
- History owner alignment is a required future constraint, not an optional post-review enhancement.
- `principal_id`, `owner_principal_id`, and `owner_principal_type` immutability require database-level hardening in addition to runtime safeguards.

### 4.6 `006_enable_rls_and_policies`

Review intent:

- enable RLS on future persistence tables;
- keep owner isolation enforced through `provider_reference -> principal_id`;
- deny access when principal mapping is missing;
- deny guest access until separately approved;
- prevent client-side owner injection;
- keep service role server-only and purpose-bound.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration: 006_enable_rls_and_policies
-- RLS is a database enforcement layer, not a substitute for server-side
-- authorization. Runtime must still resolve principal server-side.

alter table public.levio_principals enable row level security;
alter table public.simulation_records enable row level security;
alter table public.simulation_drafts enable row level security;
alter table public.simulation_history_entries enable row level security;

-- Principal self-resolution.
-- Authenticated Supabase users may read only their own active principal
-- mapping through provider_reference = auth.uid().
create policy levio_principals_select_own
  on public.levio_principals
  for select
  to authenticated
  using (
    provider_name = 'supabase'
    and provider_reference = auth.uid()
    and provider_reference_status = 'active'
    and principal_type = 'registered_user'
    and principal_status = 'active'
    and deletion_state = 'active'
  );

-- Direct client inserts into levio_principals are denied.
-- Principal creation must be performed by an approved server-side flow.
create policy levio_principals_insert_none
  on public.levio_principals
  for insert
  to authenticated
  with check (false);

create policy levio_principals_update_none
  on public.levio_principals
  for update
  to authenticated
  using (false)
  with check (false);

create policy levio_principals_delete_none
  on public.levio_principals
  for delete
  to authenticated
  using (false);

-- Saved simulations: owner-only access through principal mapping.
create policy simulation_records_select_own
  on public.simulation_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_records.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_records.owner_principal_type = 'registered_user'
    and simulation_records.deletion_state in ('active', 'deletion_requested')
  );

create policy simulation_records_insert_own
  on public.simulation_records
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_records.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_records.owner_principal_type = 'registered_user'
  );

create policy simulation_records_update_own
  on public.simulation_records
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_records.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_records.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_records.owner_principal_type = 'registered_user'
  );

create policy simulation_records_delete_none
  on public.simulation_records
  for delete
  to authenticated
  using (false);

-- Drafts: owner-only, registered-user only, no guest access.
create policy simulation_drafts_select_own
  on public.simulation_drafts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_drafts.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_drafts.owner_principal_type = 'registered_user'
    and simulation_drafts.deletion_state = 'active'
    and simulation_drafts.expires_at > timezone('utc', now())
  );

create policy simulation_drafts_insert_own
  on public.simulation_drafts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_drafts.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_drafts.owner_principal_type = 'registered_user'
  );

create policy simulation_drafts_update_own
  on public.simulation_drafts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_drafts.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_drafts.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_drafts.owner_principal_type = 'registered_user'
  );

create policy simulation_drafts_delete_none
  on public.simulation_drafts
  for delete
  to authenticated
  using (false);

-- History: owner-only select; normal client insert/update/delete denied.
-- Server-side runtime may create append-only history through an approved
-- server-only path after authorization.
create policy simulation_history_select_own
  on public.simulation_history_entries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.levio_principals p
      where p.principal_id = simulation_history_entries.owner_principal_id
        and p.provider_name = 'supabase'
        and p.provider_reference = auth.uid()
        and p.provider_reference_status = 'active'
        and p.principal_type = 'registered_user'
        and p.principal_status = 'active'
        and p.deletion_state = 'active'
    )
    and simulation_history_entries.owner_principal_type = 'registered_user'
    and simulation_history_entries.user_visible = true
    and simulation_history_entries.deletion_state = 'active'
  );

create policy simulation_history_insert_none
  on public.simulation_history_entries
  for insert
  to authenticated
  with check (false);

create policy simulation_history_update_none
  on public.simulation_history_entries
  for update
  to authenticated
  using (false)
  with check (false);

create policy simulation_history_delete_none
  on public.simulation_history_entries
  for delete
  to authenticated
  using (false);

-- No guest policies are defined. Unauthenticated and anonymous/guest-like
-- users remain denied by absence of matching policies and principal mapping.
-- Service role bypass is allowed only from approved server-side code,
-- never from client runtime, browser bundles, public simulator code, or logs.
```

RLS review notes:

- These policies rely on `auth.uid()` resolving to the Supabase user ID and matching `levio_principals.provider_reference`.
- Authenticated status alone is not enough; the principal must be active and mapped.
- Missing, revoked, disabled, restricted, deleted, or mismatched principal mapping fails closed.
- The insert policies still require a matching `owner_principal_id`; runtime must derive it server-side and must not let browser input choose it.
- Client-side delete is denied in this draft. Deletion should be a lifecycle update through approved server-side controls, not an arbitrary row delete.
- History client insert is denied to preserve append-only/server-created semantics.

### 4.7 `007_rollback_notes`

Review intent:

- define safe rollback order for a future empty/pre-production schema;
- warn that destructive rollback after user data exists requires data lifecycle approval;
- separate schema rollback from code rollback;
- define emergency write-disabled and read-only posture.

```sql
-- REVIEW DRAFT ONLY - DO NOT EXECUTE.
-- Future migration companion: 007_rollback_notes
-- This block is documentation-oriented. It is not a normal production rollback.

-- Emergency runtime posture before schema rollback:
-- 1. Disable persistence writes in application runtime configuration.
-- 2. Keep authenticated dashboard fail-closed for protected routes.
-- 3. If user data exists, prefer read-only access for export/delete review.
-- 4. Do not disable RLS in production as a shortcut rollback.
-- 5. Preserve export and deletion obligations.

-- Safe destructive rollback order ONLY before production user data exists:
alter table if exists public.simulation_history_entries
  drop constraint if exists simulation_history_parent_owner_match_fk;
alter table if exists public.simulation_history_entries
  drop constraint if exists simulation_history_simulation_fk;
alter table if exists public.simulation_history_entries
  drop constraint if exists simulation_history_owner_principal_fk;

alter table if exists public.simulation_drafts
  drop constraint if exists simulation_drafts_converted_simulation_fk;
alter table if exists public.simulation_drafts
  drop constraint if exists simulation_drafts_owner_principal_fk;

alter table if exists public.simulation_records
  drop constraint if exists simulation_records_simulation_owner_unique;
alter table if exists public.simulation_records
  drop constraint if exists simulation_records_parent_simulation_fk;
alter table if exists public.simulation_records
  drop constraint if exists simulation_records_originating_draft_fk;
alter table if exists public.simulation_records
  drop constraint if exists simulation_records_owner_principal_fk;

drop policy if exists simulation_history_delete_none
  on public.simulation_history_entries;
drop policy if exists simulation_history_update_none
  on public.simulation_history_entries;
drop policy if exists simulation_history_insert_none
  on public.simulation_history_entries;
drop policy if exists simulation_history_select_own
  on public.simulation_history_entries;

drop policy if exists simulation_drafts_delete_none
  on public.simulation_drafts;
drop policy if exists simulation_drafts_update_own
  on public.simulation_drafts;
drop policy if exists simulation_drafts_insert_own
  on public.simulation_drafts;
drop policy if exists simulation_drafts_select_own
  on public.simulation_drafts;

drop policy if exists simulation_records_delete_none
  on public.simulation_records;
drop policy if exists simulation_records_update_own
  on public.simulation_records;
drop policy if exists simulation_records_insert_own
  on public.simulation_records;
drop policy if exists simulation_records_select_own
  on public.simulation_records;

drop policy if exists levio_principals_delete_none
  on public.levio_principals;
drop policy if exists levio_principals_update_none
  on public.levio_principals;
drop policy if exists levio_principals_insert_none
  on public.levio_principals;
drop policy if exists levio_principals_select_own
  on public.levio_principals;

drop trigger if exists simulation_history_reject_owner_update
  on public.simulation_history_entries;
drop trigger if exists simulation_drafts_reject_owner_update
  on public.simulation_drafts;
drop trigger if exists simulation_records_reject_owner_update
  on public.simulation_records;
drop trigger if exists levio_principals_reject_principal_id_update
  on public.levio_principals;

drop function if exists public.levio_reject_owner_principal_update();
drop function if exists public.levio_reject_principal_id_update();

drop table if exists public.simulation_history_entries;
drop table if exists public.simulation_drafts;
drop table if exists public.simulation_records;
drop table if exists public.levio_principals;

-- Data-loss warning:
-- Do not run destructive table drops after real user data exists without
-- explicit data export, deletion lifecycle, retention, legal, and owner approval.
-- After production data exists, rollback should generally be forward-only:
-- write-disable, read-only if needed, fix policies/schema with additive
-- migrations, then re-enable writes after QA.
```

Rollback review notes:

- Before any real user data exists, dropping drafted objects may be acceptable in a dev database.
- After user data exists, rollback must preserve export/delete obligations and cannot rely on git revert alone.
- Emergency posture must prefer write-disable/read-only over disabling RLS or broadening access.
- Any production rollback must be environment-specific and approved separately.
- Constraint and trigger rollback must happen before table drops because optional draft/simulation references can create dependency cycles.

## 5. Required Review Checklist

Before any draft becomes a real migration file, review must confirm:

- `principal_id` remains the canonical owner anchor.
- `provider_reference` remains a provider identity link only.
- No client-controlled owner injection is possible.
- `owner_principal_id` is required on simulation, draft, and history tables.
- Simulation payload is separated into user input, deterministic output, metadata, and safety flags.
- No AI prompts, raw AI responses, embeddings, vectors, hidden memory, subscriptions, billing, or payment data are included.
- Drafts have explicit status, expiry, retention, deletion, and export fields.
- History is user-visible lifecycle/revision/outcome data, not analytics.
- History is append-only by default with limited mutation.
- RLS denies guest access until separately approved.
- RLS fails closed for missing or invalid principal mapping.
- Service role remains server-only and purpose-bound.
- Rollback does not assume destructive drops are safe after user data exists.

## 6. Stage 4.2D-2 Prerequisites

Before real migration files may be created:

1. This SQL review draft must be accepted.
2. Supabase local/dev/preview/prod target must be confirmed.
3. Migration directory location must be explicitly approved.
4. Timestamp naming convention must be confirmed.
5. Each SQL draft block must be reviewed for PostgreSQL/Supabase syntax.
6. RLS policy tests must be written or planned for cross-user isolation and forged owners.
7. Runtime server-side principal resolution must be approved before writes exist.
8. Emergency write-disable/read-only posture must be approved.
9. Export/delete lifecycle implications must be accepted.
10. Guest persistence must remain denied unless separately approved.
11. Stage 4.3 User Data Controls must remain closed.
12. Stage 4.4 Subscription Runtime must remain closed.
13. Simulator persistence integration must not begin yet.
14. Persistence runtime code must not be written unless a later stage explicitly approves it.

## 7. Roadmap Compliance

Stage 4.2D-1 confirms:

- SQL review draft sections are prepared for the approved future migration sequence;
- no real SQL files are created;
- no migration files are created;
- no `supabase/` or migration directory is created;
- no Supabase tables are created;
- no SQL is executed;
- no Supabase connection is made;
- no runtime code is written;
- auth runtime is not changed;
- dashboard is not changed;
- simulator is not changed;
- decision engine and `SimulationResponse` are not changed;
- package files are not changed;
- AI, memory, subscriptions, billing, Stage 4.3, and Stage 4.4 are not started.
