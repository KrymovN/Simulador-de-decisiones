-- Levio Stage 4.2D-3
-- Migration 004: create simulation history entries table.
--
-- This file creates schema objects only when explicitly applied by an operator.
-- It must not be executed as part of Stage 4.2D-3.
--
-- Append-only design:
--   History is user-visible lifecycle/revision/outcome history, not analytics.
--   Normal runtime should append new entries for material changes.
--   Mutation is limited to lifecycle, restriction, anonymization, export,
--   legal-hold, or deletion metadata through approved server-side flows.

create table if not exists public.simulation_history_entries (
  history_entry_id uuid primary key default gen_random_uuid(),

  owner_principal_id uuid not null
    constraint simulation_history_owner_principal_fk
    references public.levio_principals (principal_id)
    on update restrict
    on delete restrict,

  owner_principal_type text not null default 'registered_user'
    constraint simulation_history_owner_principal_type_check
    check (owner_principal_type in ('registered_user')),

  record_id uuid not null
    constraint simulation_history_record_fk
    references public.simulation_records (record_id)
    on update restrict
    on delete restrict,

  event_type text not null
    constraint simulation_history_event_type_check
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
    constraint simulation_history_event_source_check
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

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  deletion_state text not null default 'active'
    constraint simulation_history_deletion_state_check
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
  'User-visible simulation lifecycle and revision history. Not hidden analytics.';

comment on column public.simulation_history_entries.owner_principal_id is
  'Required Levio principal owner. Must match the parent simulation record owner.';

comment on column public.simulation_history_entries.event_payload is
  'Content-minimized event data. Must not contain hidden operational logs or unrelated analytics.';
