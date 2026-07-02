# LEVIO STAGE 4.3A USER DATA CONTROLS SCOPE LOCK

## Document Status

- Stage: 4.3A - User Data Controls Scope Lock.
- Status: scope lock / documentation-only.
- Date: 18 June 2026, Europe/Madrid.
- Depends on: completed Stage 4.2 Persistence Runtime block, `../../../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, `../stage-04-01-auth-runtime/LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, `../stage-04-02-persistence-runtime/LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, and `../stage-04-02-persistence-runtime/LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`.
- Runtime implementation status: not started in this stage.
- Schema status: unchanged.
- Stage 4.4 status: not started.

This document starts Stage 4.3 only as a scope lock for user data controls. It does not add runtime code, API routes, UI, dashboard integration, auth-runtime changes, Supabase schema changes, migrations, subscriptions, AI/OpenAI integration, memory runtime, or Stage 4.4 work.

## 1. Purpose

Stage 4.3 introduces user data controls around the persistence foundation created in Stage 4.2.

Stage 4.3A fixes the minimum safe scope before implementation so future runtime work does not accidentally redefine ownership, consent, export, deletion, or retention behavior.

Stage 4.3A defines:

- export boundary;
- deletion boundary;
- consent boundary;
- retention boundary;
- owner boundaries;
- rollback posture;
- explicit non-scope;
- implementation sequence;
- QA criteria.

## 2. Scope Decision

Stage 4.3 must be a small user-data-control layer over the existing Stage 4.2 persistence model.

Approved initial scope:

- registered-user data controls only;
- owner-scoped `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries`;
- server-side owner resolution through the existing Levio principal model;
- fail-closed behavior when owner, provider, runtime, or control policy cannot be proven;
- no client-supplied owner identifiers as authorization evidence;
- no schema changes unless a later stage documents a specific blocking reason and owner approval;
- no dashboard or UI integration until the runtime foundation is separately validated.

Stage 4.3A itself is documentation-only. It creates the scope lock for later implementation stages and does not implement the controls.

## 3. Export Scope

Export is a user right and product-control capability. It must not be tied to subscription status.

Initial Stage 4.3 export boundary:

- export only data owned by the resolved `registered_user` Levio principal;
- include eligible provider-independent principal metadata;
- include eligible saved simulations;
- include eligible simulation drafts;
- include eligible simulation history entries;
- preserve stable identifiers, timestamps, relationships, provenance, lifecycle fields, and contract versions where available;
- distinguish user-authored content from system-derived analysis where available;
- exclude provider secrets, auth tokens, internal security signals, service-role data, another user's records, workspace records, billing records, AI prompts, embeddings, vectors, and memory data.

Export must fail closed when:

- there is no authenticated registered user;
- the provider reference cannot resolve to exactly one active Levio principal;
- owner scope cannot be proven;
- the provider is unavailable and no safe read-only control mode exists;
- a requested record is not owned by the resolved principal.

Stage 4.3A does not implement export generation, file packaging, download UI, background jobs, dashboard controls, or API routes.

## 4. Deletion Scope

Deletion is a lifecycle, not a view-only action.

Initial Stage 4.3 deletion boundary:

- support owner-scoped deletion planning for `simulation_records`, `simulation_drafts`, and `simulation_history_entries`;
- respect existing deletion lifecycle states: `active`, `deletion_requested`, `restricted`, `deleted`, `anonymized`, and `retained_legal_exception`;
- require server-side owner resolution before any deletion lifecycle transition;
- ensure dependent history entries remain tied to parent simulation deletion semantics;
- avoid hard-delete behavior until a later implementation stage explicitly proves rollback, validation, and legal evidence handling;
- preserve only minimal opaque operational proof where required.

Deletion must fail closed when:

- owner resolution fails;
- a record ID is supplied without owner proof;
- a dependent record relationship cannot be verified;
- a legal exception or retention rule cannot be evaluated safely;
- deletion would affect another principal's data.

Stage 4.3A does not implement deletion runtime, account deletion orchestration, backup deletion propagation, UI confirmation flows, dashboard controls, or API routes.

## 5. Consent Scope

Consent remains purpose-specific. Registration, simulation saving, subscription status, and authenticated session state are not consent.

Initial Stage 4.3 consent boundary:

- define consent checks as policy gates for future user data controls;
- treat memory consent, analytics consent, AI training consent, marketing consent, and workspace-sharing consent as separate purposes;
- avoid durable consent storage changes in Stage 4.3A;
- require a later explicit schema review before adding a durable consent ledger;
- ensure consent withdrawal maps to restriction or deletion workflow only after the relevant runtime is approved.

Consent checks must fail closed when:

- the required purpose is unknown;
- the consent status is missing for a purpose that requires consent;
- the consent record, if later implemented, does not belong to the resolved principal;
- consent withdrawal cannot be reconciled with retention or deletion rules.

Stage 4.3A does not implement a consent database table, consent UI, memory consent, analytics consent, AI/OpenAI consent, marketing consent, workspace consent, or legal copy.

## 6. Retention Scope

Retention must be category-specific, purpose-specific, configurable, documented, and testable. Indefinite silent retention is not an approved default.

Initial Stage 4.3 retention boundary:

- evaluate retention behavior for saved simulations, drafts, and history entries only;
- respect `retention_rule`, `expires_at`, `deleted_at`, `archived_at`, and deletion state fields already present in the Stage 4.2 model where available;
- treat active drafts as short-lived unless explicitly saved;
- treat saved simulations as retained until user deletion, account deletion, configured retention, or approved restriction;
- keep history entries bound to parent simulation retention behavior;
- separate operational logs and backups from normal product data controls.

Retention must fail closed when:

- the retention rule is unknown or unsupported;
- the record category is outside the Stage 4.3 approved set;
- evaluating retention would require schema or runtime behavior not yet approved;
- a retention action could affect another owner's data.

Stage 4.3A does not implement retention jobs, background deletion, backup lifecycle propagation, legal exception management, dashboard controls, or API routes.

## 7. Owner Boundaries

Stage 4.3 must preserve the Stage 4.1 and Stage 4.2 owner model.

Owner invariants:

- `levio_principals.principal_id` remains the canonical owner anchor;
- Supabase `auth.users.id` remains a provider reference, not the owner ID;
- `registered_user` is the only initial durable owner type for Stage 4.3 controls;
- client-supplied `principal_id`, `owner_id`, `provider_reference`, email, record ID, or subscription state is never authorization proof;
- server-side runtime must resolve provider reference to Levio principal before any control action;
- list, export, deletion, consent, and retention operations must be owner-scoped;
- workspace, guest, internal operator, service, subscription, AI, and memory scopes are not initial Stage 4.3 owners.

Any future expansion beyond `registered_user` requires a separate scope lock.

## 8. Rollback Posture

Stage 4.3 rollback must be simple at the scope-lock stage and controlled at future runtime stages.

Stage 4.3A rollback:

- remove this document if the owner rejects the scope;
- no code rollback is required;
- no schema rollback is required;
- no migration rollback is required;
- no data rollback is required.

Future runtime rollback requirements:

- controls must be disabled through a fail-closed flag or configuration boundary;
- write-like control actions must stop before read/export obligations are accidentally broken;
- deletion actions must prefer lifecycle states before irreversible removal;
- export must remain read-only and owner-scoped;
- runtime rollback must not expose protected data;
- runtime rollback must not silently delete user-owned data;
- schema rollback must remain separate from code rollback.

## 9. Explicit Out of Scope

Stage 4.3A and the first Stage 4.3 runtime steps do not include:

- Stage 4.4;
- subscriptions;
- billing;
- payments;
- AI/OpenAI;
- memory runtime;
- embeddings or vector storage;
- analytics or model-improvement data use;
- dashboard integration;
- UI integration;
- public API routes;
- auth-runtime architecture changes;
- simulator changes;
- persistence schema changes;
- migration changes;
- workspace controls;
- guest persistence controls;
- admin tooling;
- legal document publication;
- production rollout.

## 10. Implementation Sequence

Recommended Stage 4.3 sequence:

1. Stage 4.3A - User Data Controls Scope Lock.
   - Documentation-only scope boundary.
   - No runtime changes.

2. Stage 4.3B - Export Runtime Foundation.
   - Owner-scoped, read-only export service contracts.
   - No UI, dashboard, API route, or file packaging unless separately approved.

3. Stage 4.3C - Deletion Runtime Foundation.
   - Owner-scoped deletion lifecycle service.
   - Prefer soft lifecycle transitions before irreversible removal.

4. Stage 4.3D - Consent Control Boundary.
   - Runtime policy gates for approved purposes.
   - Durable consent ledger only after separate schema justification.

5. Stage 4.3E - Retention Control Boundary.
   - Category-specific retention evaluation for existing persistence records.
   - No background destructive jobs until separately approved.

6. Stage 4.3F - User Data Controls QA / Regression.
   - Cross-control validation for owner boundaries, fail-closed behavior, rollback, and Stage 4.4 isolation.

This sequence may be adjusted only by an explicit owner instruction.

## 11. QA Criteria

Stage 4.3A QA:

- `git diff --check`;
- `npx tsc --noEmit`;
- `npm run lint`;
- repository diff confirms documentation-only changes;
- no runtime, schema, migration, auth, simulator, UI, dashboard, AI, memory, subscription, or Stage 4.4 files changed.

Future Stage 4.3 runtime QA must prove:

- unauthenticated control requests fail closed;
- unresolved provider references fail closed;
- forged owner identifiers fail closed;
- record IDs alone do not authorize access;
- cross-principal export fails;
- cross-principal deletion fails;
- retention evaluation cannot affect another owner;
- consent checks do not imply memory, analytics, AI training, marketing, or workspace sharing consent;
- rollback disables unsafe operations without exposing protected data;
- Stage 4.4 remains unstarted.

## 12. Completion Criteria

Stage 4.3A is complete when:

- this scope-lock document exists;
- export, deletion, consent, retention, owner boundaries, rollback, explicit non-scope, implementation sequence, and QA criteria are defined;
- required checks pass;
- no runtime code is changed;
- no schema or migration files are changed;
- Stage 4.4 is not started.
