-- Levio Stage 4.2D-3
-- Migration 003: create registered-user simulation drafts table.
--
-- This file creates schema objects only when explicitly applied by an operator.
-- It must not be executed as part of Stage 4.2D-3.
--
-- Scope:
--   Server-side registered-user drafts only.
--   Guest persistence remains denied until separately approved.

create table if not exists public.simulation_drafts (
  draft_id uuid primary key default gen_random_uuid(),

  owner_principal_id uuid not null
    constraint simulation_drafts_owner_principal_fk
    references public.levio_principals (principal_id)
    on update restrict
    on delete restrict,

  owner_principal_type text not null default 'registered_user'
    constraint simulation_drafts_owner_principal_type_check
    check (owner_principal_type in ('registered_user')),

  draft_status text not null default 'active'
    constraint simulation_drafts_draft_status_check
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
  converted_record_id uuid,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_autosaved_at timestamptz,
  expires_at timestamptz not null,
  discarded_at timestamptz,
  deleted_at timestamptz,

  deletion_state text not null default 'active'
    constraint simulation_drafts_deletion_state_check
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
  'Registered-user server-side drafts with visible lifecycle. Guest persistence is not approved.';

comment on column public.simulation_drafts.owner_principal_id is
  'Required Levio principal owner. Must be derived server-side; never trusted from client input.';

comment on column public.simulation_drafts.draft_payload is
  'Draft payload separate from completed simulation records.';
