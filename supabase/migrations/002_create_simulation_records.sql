-- Levio Stage 4.2D-3
-- Migration 002: create saved simulation records table.
--
-- This file creates schema objects only when explicitly applied by an operator.
-- It must not be executed as part of Stage 4.2D-3.
--
-- Runtime rule:
--   owner_principal_id must be derived server-side from the authenticated
--   Supabase session -> provider_reference -> levio_principals.principal_id.
--   Client-provided owner fields are not trusted.
--
-- Exclusions:
--   No AI memory, vector, embedding, raw AI prompt/response, subscription,
--   billing, or payment fields are introduced here.

create table if not exists public.simulation_records (
  record_id uuid primary key default gen_random_uuid(),

  owner_principal_id uuid not null
    constraint simulation_records_owner_principal_fk
    references public.levio_principals (principal_id)
    on update restrict
    on delete restrict,

  owner_principal_type text not null default 'registered_user'
    constraint simulation_records_owner_principal_type_check
    check (owner_principal_type in ('registered_user')),

  record_status text not null default 'active'
    constraint simulation_records_record_status_check
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
    constraint simulation_records_source_type_check
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
  parent_record_id uuid,
  revision_label text,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  deleted_at timestamptz,
  last_exported_at timestamptz,

  deletion_state text not null default 'active'
    constraint simulation_records_deletion_state_check
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
    check (jsonb_typeof(safety_flags) = 'object'),

  constraint simulation_records_parent_record_fk
    foreign key (parent_record_id)
    references public.simulation_records (record_id)
    on update restrict
    on delete restrict
);

comment on table public.simulation_records is
  'Explicitly saved user-owned simulation records. No AI memory, vector, embedding, subscription, billing, or payment fields.';

comment on column public.simulation_records.record_id is
  'Stable saved simulation record identifier.';

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
