-- Levio Stage 4.2D-3
-- Migration 001: create Levio principal anchor table.
--
-- This file creates schema objects only when explicitly applied by an operator.
-- It must not be executed as part of Stage 4.2D-3.
--
-- Ownership rule:
--   levio_principals.principal_id is the canonical Levio owner anchor.
--   provider_reference stores Supabase auth.users.id only as an identity link.
--   provider_reference must never become owner_id for user-owned records.

create extension if not exists pgcrypto;

create table if not exists public.levio_principals (
  principal_id uuid primary key default gen_random_uuid(),

  principal_type text not null default 'registered_user'
    constraint levio_principals_principal_type_check
    check (principal_type in ('registered_user')),

  principal_status text not null default 'active'
    constraint levio_principals_principal_status_check
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
    constraint levio_principals_provider_name_check
    check (provider_name in ('supabase')),

  provider_reference uuid not null,

  provider_reference_status text not null default 'active'
    constraint levio_principals_provider_reference_status_check
    check (
      provider_reference_status in (
        'active',
        'revoked',
        'replaced',
        'recovery_pending'
      )
    ),

  provider_subject_type text not null default 'user'
    constraint levio_principals_provider_subject_type_check
    check (provider_subject_type in ('user')),

  provider_email_snapshot text,
  provider_email_verified boolean not null default false,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  disabled_at timestamptz,
  deleted_at timestamptz,
  deletion_requested_at timestamptz,
  last_authenticated_at timestamptz,
  last_provider_sync_at timestamptz,

  deletion_state text not null default 'active'
    constraint levio_principals_deletion_state_check
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
  legal_hold_reason text,
  schema_version integer not null default 1,

  constraint levio_principals_registered_user_provider_reference_required
    check (
      principal_type <> 'registered_user'
      or provider_reference is not null
    )
);

comment on table public.levio_principals is
  'Stable Levio principal mapping. principal_id is the canonical owner anchor; provider_reference is an auth provider link only.';

comment on column public.levio_principals.principal_id is
  'Canonical Levio owner anchor for persisted user-owned data.';

comment on column public.levio_principals.provider_reference is
  'Supabase auth.users.id stored as provider reference only. Not an owner_id.';
