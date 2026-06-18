-- Levio Stage 4.2D-3
-- Migration 007: rollback and emergency notes.
--
-- This file is a rollback companion. It must not be executed as part of
-- Stage 4.2D-3.
--
-- Data-loss warning:
--   The destructive table-drop sequence below is safe only before production
--   user data exists. After real user data exists, rollback must preserve
--   export, deletion, retention, legal, and owner obligations.
--
-- Emergency production posture after data exists:
--   1. Disable persistence writes in application runtime configuration.
--   2. Keep protected routes fail-closed.
--   3. Prefer read-only mode for export/delete review.
--   4. Do not disable RLS as a shortcut rollback.
--   5. Prefer additive forward migrations over destructive rollback.

-- If an operator needs to roll back an empty local/dev database, copy the
-- reviewed order below into an explicit rollback operation. The statements
-- are intentionally commented so this file is not destructive if a migration
-- runner applies all files in lexical order.

-- Empty local/dev rollback only: disable RLS before dropping policies.
-- Do not use this as a production shortcut after user data exists.
-- alter table if exists public.simulation_history_entries disable row level security;
-- alter table if exists public.simulation_drafts disable row level security;
-- alter table if exists public.simulation_records disable row level security;
-- alter table if exists public.levio_principals disable row level security;

-- drop policy if exists simulation_history_delete_none
--   on public.simulation_history_entries;
-- drop policy if exists simulation_history_update_none
--   on public.simulation_history_entries;
-- drop policy if exists simulation_history_insert_none
--   on public.simulation_history_entries;
-- drop policy if exists simulation_history_select_own
--   on public.simulation_history_entries;

-- drop policy if exists simulation_drafts_delete_none
--   on public.simulation_drafts;
-- drop policy if exists simulation_drafts_update_none
--   on public.simulation_drafts;
-- drop policy if exists simulation_drafts_insert_none
--   on public.simulation_drafts;
-- drop policy if exists simulation_drafts_select_own
--   on public.simulation_drafts;

-- drop policy if exists simulation_records_delete_none
--   on public.simulation_records;
-- drop policy if exists simulation_records_update_none
--   on public.simulation_records;
-- drop policy if exists simulation_records_insert_none
--   on public.simulation_records;
-- drop policy if exists simulation_records_select_own
--   on public.simulation_records;

-- drop policy if exists levio_principals_delete_none
--   on public.levio_principals;
-- drop policy if exists levio_principals_update_none
--   on public.levio_principals;
-- drop policy if exists levio_principals_insert_none
--   on public.levio_principals;
-- drop policy if exists levio_principals_select_own
--   on public.levio_principals;

-- alter table if exists public.simulation_history_entries
--   drop constraint if exists simulation_history_parent_owner_match_fk;
-- alter table if exists public.simulation_history_entries
--   drop constraint if exists simulation_history_record_fk;
-- alter table if exists public.simulation_history_entries
--   drop constraint if exists simulation_history_owner_principal_fk;

-- alter table if exists public.simulation_drafts
--   drop constraint if exists simulation_drafts_converted_record_fk;
-- alter table if exists public.simulation_drafts
--   drop constraint if exists simulation_drafts_owner_principal_fk;

-- alter table if exists public.simulation_records
--   drop constraint if exists simulation_records_record_owner_unique;
-- alter table if exists public.simulation_records
--   drop constraint if exists simulation_records_parent_record_fk;
-- alter table if exists public.simulation_records
--   drop constraint if exists simulation_records_originating_draft_fk;
-- alter table if exists public.simulation_records
--   drop constraint if exists simulation_records_owner_principal_fk;

-- drop trigger if exists simulation_history_reject_owner_update
--   on public.simulation_history_entries;
-- drop trigger if exists simulation_drafts_reject_owner_update
--   on public.simulation_drafts;
-- drop trigger if exists simulation_records_reject_owner_update
--   on public.simulation_records;
-- drop trigger if exists levio_principals_reject_principal_id_update
--   on public.levio_principals;

-- drop function if exists public.levio_reject_owner_principal_update();
-- drop function if exists public.levio_reject_principal_id_update();

-- drop table if exists public.simulation_history_entries;
-- drop table if exists public.simulation_drafts;
-- drop table if exists public.simulation_records;
-- drop table if exists public.levio_principals;
