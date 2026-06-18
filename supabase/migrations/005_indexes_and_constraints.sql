-- Levio Stage 4.2D-3
-- Migration 005: indexes, uniqueness, owner-alignment constraints, and
-- immutable owner/principal triggers.
--
-- This file creates schema objects only when explicitly applied by an operator.
-- It must not be executed as part of Stage 4.2D-3.

create unique index if not exists levio_principals_active_provider_reference_uidx
  on public.levio_principals (provider_name, provider_reference)
  where provider_reference_status = 'active'
    and principal_status in ('active', 'restricted', 'deletion_requested')
    and deletion_state in ('active', 'deletion_requested', 'restricted');

create index if not exists levio_principals_status_idx
  on public.levio_principals (principal_status, deletion_state);

create index if not exists levio_principals_provider_lookup_idx
  on public.levio_principals (
    provider_name,
    provider_reference,
    principal_status
  );

create index if not exists simulation_records_owner_status_updated_idx
  on public.simulation_records (
    owner_principal_id,
    record_status,
    updated_at desc
  );

create index if not exists simulation_records_owner_deletion_idx
  on public.simulation_records (owner_principal_id, deletion_state);

create index if not exists simulation_records_owner_export_idx
  on public.simulation_records (owner_principal_id, export_eligible);

create index if not exists simulation_records_originating_draft_idx
  on public.simulation_records (originating_draft_id)
  where originating_draft_id is not null;

create index if not exists simulation_records_parent_record_idx
  on public.simulation_records (parent_record_id)
  where parent_record_id is not null;

create index if not exists simulation_drafts_owner_status_updated_idx
  on public.simulation_drafts (
    owner_principal_id,
    draft_status,
    updated_at desc
  );

create index if not exists simulation_drafts_expiry_idx
  on public.simulation_drafts (expires_at, draft_status);

create index if not exists simulation_drafts_deletion_idx
  on public.simulation_drafts (owner_principal_id, deletion_state);

create unique index if not exists simulation_drafts_converted_once_uidx
  on public.simulation_drafts (converted_record_id)
  where converted_record_id is not null;

create index if not exists simulation_history_owner_timestamp_idx
  on public.simulation_history_entries (
    owner_principal_id,
    event_timestamp desc
  );

create index if not exists simulation_history_record_timestamp_idx
  on public.simulation_history_entries (record_id, event_timestamp asc);

create index if not exists simulation_history_owner_visible_timestamp_idx
  on public.simulation_history_entries (
    owner_principal_id,
    user_visible,
    event_timestamp desc
  );

create index if not exists simulation_history_deletion_idx
  on public.simulation_history_entries (owner_principal_id, deletion_state);

alter table public.simulation_records
  add constraint simulation_records_record_owner_unique
  unique (record_id, owner_principal_id);

alter table public.simulation_records
  add constraint simulation_records_originating_draft_fk
  foreign key (originating_draft_id)
  references public.simulation_drafts (draft_id)
  on update restrict
  on delete set null;

alter table public.simulation_drafts
  add constraint simulation_drafts_converted_record_fk
  foreign key (converted_record_id)
  references public.simulation_records (record_id)
  on update restrict
  on delete set null;

alter table public.simulation_history_entries
  add constraint simulation_history_parent_owner_match_fk
  foreign key (record_id, owner_principal_id)
  references public.simulation_records (record_id, owner_principal_id)
  on update restrict
  on delete restrict;

create or replace function public.levio_reject_principal_id_update()
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

drop trigger if exists levio_principals_reject_principal_id_update
  on public.levio_principals;

create trigger levio_principals_reject_principal_id_update
  before update on public.levio_principals
  for each row
  execute function public.levio_reject_principal_id_update();

create or replace function public.levio_reject_owner_principal_update()
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

drop trigger if exists simulation_records_reject_owner_update
  on public.simulation_records;

create trigger simulation_records_reject_owner_update
  before update on public.simulation_records
  for each row
  execute function public.levio_reject_owner_principal_update();

drop trigger if exists simulation_drafts_reject_owner_update
  on public.simulation_drafts;

create trigger simulation_drafts_reject_owner_update
  before update on public.simulation_drafts
  for each row
  execute function public.levio_reject_owner_principal_update();

drop trigger if exists simulation_history_reject_owner_update
  on public.simulation_history_entries;

create trigger simulation_history_reject_owner_update
  before update on public.simulation_history_entries
  for each row
  execute function public.levio_reject_owner_principal_update();
