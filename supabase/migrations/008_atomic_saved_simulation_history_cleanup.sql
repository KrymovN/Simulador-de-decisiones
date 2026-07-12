-- Levio Stage 7
-- Atomic owner-scoped saved-simulation lifecycle deletion with parent-driven
-- user-visible history content cleanup. No physical delete or FK cascade.

create or replace function public.levio_delete_saved_simulation_with_history(
  p_record_id uuid,
  p_owner_principal_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_parent public.simulation_records%rowtype;
  v_deleted_at timestamptz := timezone('utc', now());
begin
  select r.*
    into v_parent
    from public.simulation_records as r
   where r.record_id = p_record_id
     and r.owner_principal_id = p_owner_principal_id
     and r.owner_principal_type = 'registered_user'
   for update;

  if not found then
    return jsonb_build_object('outcome', 'already_absent');
  end if;

  if v_parent.record_status = 'deleted' or v_parent.deletion_state = 'deleted' then
    return jsonb_build_object('outcome', 'already_absent');
  end if;

  if v_parent.record_status <> 'active'
     or v_parent.deletion_state <> 'active'
     or v_parent.legal_hold_reason is not null then
    return jsonb_build_object('outcome', 'restricted');
  end if;

  if exists (
    select 1
      from public.simulation_history_entries as h
     where h.record_id = p_record_id
       and h.owner_principal_id = p_owner_principal_id
       and h.owner_principal_type = 'registered_user'
       and (
         h.deletion_state in ('restricted', 'retained_legal_exception')
         or h.legal_hold_reason is not null
       )
  ) then
    return jsonb_build_object('outcome', 'restricted');
  end if;

  update public.simulation_history_entries as h
     set event_summary = null,
         event_payload = '{}'::jsonb,
         before_reference = null,
         after_reference = null,
         revision_reference = null,
         outcome_snapshot = null,
         claim_transaction_reference = null,
         export_reference = null,
         user_visible = false,
         deletion_state = 'deleted',
         export_eligible = false,
         deleted_at = v_deleted_at,
         updated_at = v_deleted_at
   where h.record_id = p_record_id
     and h.owner_principal_id = p_owner_principal_id
     and h.owner_principal_type = 'registered_user'
     and h.user_visible = true
     and h.deletion_state = 'active';

  update public.simulation_records as r
     set record_status = 'deleted',
         deletion_state = 'deleted',
         title = null,
         user_note = null,
         user_input_snapshot = '{}'::jsonb,
         deterministic_output_snapshot = '{}'::jsonb,
         metadata = '{}'::jsonb,
         safety_flags = '{}'::jsonb,
         clarification_snapshot = null,
         decision_model_snapshot = null,
         confidence_summary = null,
         deleted_at = v_deleted_at,
         export_eligible = false,
         updated_at = v_deleted_at
   where r.record_id = p_record_id
     and r.owner_principal_id = p_owner_principal_id
     and r.owner_principal_type = 'registered_user'
     and r.record_status = 'active'
     and r.deletion_state = 'active'
     and r.legal_hold_reason is null
   returning r.* into v_parent;

  if not found then
    raise exception 'saved simulation lifecycle changed during atomic deletion';
  end if;

  return jsonb_build_object('outcome', 'deleted', 'record', to_jsonb(v_parent));
end;
$$;

revoke all on function public.levio_delete_saved_simulation_with_history(uuid, uuid) from public;
revoke all on function public.levio_delete_saved_simulation_with_history(uuid, uuid) from anon;
revoke all on function public.levio_delete_saved_simulation_with_history(uuid, uuid) from authenticated;
grant execute on function public.levio_delete_saved_simulation_with_history(uuid, uuid) to service_role;
