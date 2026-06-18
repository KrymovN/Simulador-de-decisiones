-- Levio Stage 4.2D-3
-- Migration 006: enable RLS and owner-scoped policies.
--
-- This file creates schema objects only when explicitly applied by an operator.
-- It must not be executed as part of Stage 4.2D-3.
--
-- RLS is a database enforcement layer, not a substitute for server-side
-- authorization. Runtime must still resolve owner principal server-side.
--
-- Guest access:
--   No guest policies are defined. Unauthenticated and anonymous/guest-like
--   users remain denied until a separate stage approves guest persistence.
--
-- Service role:
--   Supabase service role bypass must remain server-only, purpose-bound, and
--   unavailable to browser bundles, client runtime, public simulator code, or logs.

alter table public.levio_principals enable row level security;
alter table public.simulation_records enable row level security;
alter table public.simulation_drafts enable row level security;
alter table public.simulation_history_entries enable row level security;

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

-- Direct authenticated client writes are intentionally denied. Future
-- persistence runtime must create records from a server-only path after
-- resolving owner_principal_id from the validated auth session.
create policy simulation_records_insert_none
  on public.simulation_records
  for insert
  to authenticated
  with check (false);

create policy simulation_records_update_none
  on public.simulation_records
  for update
  to authenticated
  using (false)
  with check (false);

create policy simulation_records_delete_none
  on public.simulation_records
  for delete
  to authenticated
  using (false);

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

-- Direct authenticated client writes are intentionally denied. Future
-- persistence runtime must create drafts from a server-only path after
-- resolving owner_principal_id from the validated auth session.
create policy simulation_drafts_insert_none
  on public.simulation_drafts
  for insert
  to authenticated
  with check (false);

create policy simulation_drafts_update_none
  on public.simulation_drafts
  for update
  to authenticated
  using (false)
  with check (false);

create policy simulation_drafts_delete_none
  on public.simulation_drafts
  for delete
  to authenticated
  using (false);

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
