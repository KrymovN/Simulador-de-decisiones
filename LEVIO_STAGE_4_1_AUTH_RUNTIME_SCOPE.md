# LEVIO STAGE 4.1 AUTH RUNTIME SCOPE LOCK

## Document Status

- Stage: 4.1 - Auth Runtime Foundation.
- Status: completed scope lock / documentation-only foundation.
- Date: 16 June 2026, Europe/Madrid.
- Depends on: `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, `LEVIO_USER_DATA_ARCHITECTURE.md`, `LEVIO_TRUST_LEGAL_LAYER.md`, `LEVIO_TESTING_STRATEGY.md`, and completed Stage 3.16 Runtime QA / Regression.
- Runtime implementation status: not started.
- Provider status: provider-neutral boundary fixed; provider selection remains deferred.

## 1. Purpose

Stage 4.1 starts the Production Infrastructure track by defining the smallest safe authentication/runtime identity foundation for Levio.

This stage exists to prevent an auth provider, SDK, route, database table, or dashboard gate from silently defining Levio ownership rules.

Stage 4.1 defines:

- auth runtime scope;
- provider/runtime boundary;
- identity states;
- session model;
- anonymous, guest, and authenticated separation;
- guest/authenticated transition boundary;
- protected route strategy;
- rollback and safety strategy;
- roadmap compliance for the next implementation decision.

## 2. Scope Decision

Stage 4.1 is a scope-lock stage, not a provider-integration stage.

Reason:

- `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md` intentionally deferred provider choice until implementation can be evaluated against the architecture;
- the existing app uses mock/localStorage session behavior that must never authorize production data;
- production auth cannot be safely connected before selecting a provider, session mechanism, callback rules, CSRF posture, account-linking policy, and server-side authorization model;
- persistence is explicitly outside this stage, so there is no production user-data store to protect yet.

Therefore Stage 4.1 completes only the provider-neutral runtime identity foundation. A later approved implementation step must choose and integrate the provider.

## 3. Explicit Non-Scope

Stage 4.1 does not:

- install or configure Supabase, Auth.js, Clerk, Firebase, Auth0, or another provider;
- add auth SDK dependencies;
- add a database or persistence layer;
- save simulations, drafts, history, memory, consent records, or profiles to production storage;
- add subscriptions, payments, or entitlements;
- connect AI providers;
- connect memory runtime;
- change the deterministic brain;
- change Stages 3.11-3.16 runtime switch behavior;
- expose deterministic V2 publicly;
- change public simulator behavior;
- change `/api/simulate`;
- change homepage, dashboard, or auth UI behavior;
- convert the current mock auth gate into production authorization.

## 4. Provider-Neutral Runtime Boundary

The future auth runtime must be isolated behind a Levio-owned boundary.

Conceptual boundary:

```text
Provider SDK / hosted auth flow
->
Levio Auth Runtime Boundary
->
Normalized Principal + Session Context
->
Server-side Authorization Checks
->
Product Runtime
```

The product runtime must not consume provider-native user objects directly.

The normalized boundary must expose only the minimum trusted context required by Levio:

```text
principal_id
principal_type
session_id
session_status
assurance_level
auth_time
expires_at
risk_flags
provider_reference
```

Provider tokens, refresh tokens, magic-link secrets, OAuth access tokens, callback payloads, and provider profile blobs must not enter product logic.

## 5. Provider Decision

No provider is selected in Stage 4.1.

The approved Stage 4.1 provider decision is:

- use a provider-neutral Levio boundary first;
- evaluate providers against `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md` readiness gates before integration;
- treat email magic link as a strong candidate flow, not an implementation decision;
- keep OAuth optional until account-linking, nonce/state, and data-minimization rules are fixed;
- forbid provider-specific owner identifiers from becoming canonical Levio owner IDs without a stable internal principal mapping.

Provider selection must be a later explicit implementation decision with rollback, test, and privacy evidence.

## 6. Identity States

Stage 4.1 fixes the identity state vocabulary for future runtime work:

```text
anonymous_visitor
guest_session
registered_user
premium_user
internal_operator
service
```

State boundaries:

- `anonymous_visitor`: no server-recognized identity and no durable cross-device guarantees.
- `guest_session`: temporary bounded identity for active flow continuity only.
- `registered_user`: durable verified personal principal.
- `premium_user`: registered principal plus entitlement state; not a new owner type.
- `internal_operator`: separate privileged operational identity; never owner of user content.
- `service`: system processing identity; never owner of user content.

Only `registered_user` and future explicitly defined `workspace` scopes may own durable personal user records.

## 7. Session Model

Stage 4.1 adopts the conceptual session model from `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`:

```text
session_id
principal_id
principal_type
status
assurance_level
created_at
last_seen_at
expires_at
revoked_at
provider_session_reference
device_label_optional
risk_flags
```

Supported session statuses:

```text
active
expired
revoked
compromised
pending_step_up
```

Supported assurance levels:

```text
guest
authenticated
recently_authenticated
step_up_verified
internal_strong_auth
```

Session requirements:

- session validation is server-side;
- session IDs are not owner IDs;
- session status can never authorize a record by itself;
- sensitive operations require sufficient assurance;
- logout and revocation must be enforceable server-side;
- session state must not become decision history or memory.

## 8. Anonymous, Guest, and Authenticated Separation

Stage 4.1 locks these separations:

- anonymous local state remains browser/device local and low-risk;
- current `levio_es_mock_session` remains demo-only and must not authorize production data;
- guest session state is temporary, bounded, expiring, and not a verified person;
- registered user state is durable only after approved provider authentication;
- premium entitlement is evaluated separately from identity;
- memory consent remains separate from registration;
- subscription ownership remains separate from authentication;
- authorization is always distinct from authentication.

## 9. Guest to Authenticated Transition

Guest-to-account transition is allowed only as a future explicit claim operation.

Required future claim boundary:

1. Verify control of the guest session.
2. Verify control of the target registered account.
3. Show eligible records to the user.
4. Require explicit confirmation.
5. Transfer only allowlisted eligible records.
6. Use an idempotency key.
7. Preserve minimal audit evidence without unnecessary decision content.
8. End in a terminal claim state.

Claim states:

```text
pending
confirmed
completed
partially_completed
rejected
expired
```

Stage 4.1 does not implement this claim flow because persistence is not in scope.

## 10. Protected Route Strategy

Future protected routes must be divided by assurance requirement.

Public without auth:

- homepage;
- temporary simulator exploration;
- auth entry pages;
- public legal/trust pages when implemented.

Optional auth:

- temporary simulation flow;
- local unsaved draft behavior;
- low-risk local preferences.

Registered auth required:

- durable dashboard data;
- saved simulations and decision history;
- profile settings tied to account identity;
- account-level preferences;
- export initiation;
- deletion initiation;
- memory settings;
- session management.

Step-up or recent auth required:

- account deletion;
- export delivery;
- session revocation for other devices;
- provider linking/unlinking;
- recovery-sensitive actions;
- future billing-management actions.

Implementation rule:

- UI gates are not authorization;
- every protected read/write must enforce authorization server-side;
- route protection must fail closed when identity, owner, consent, entitlement, or assurance is missing.

## 11. Current Mock Auth Boundary

The current mock auth system remains a demo surface only.

Protected facts:

- `components/MockAuthGate.tsx` is not production authorization;
- `levio_es_mock_session` is not a production session;
- demo dashboard access is not proof of registered identity;
- localStorage saved simulations are demo-local data;
- no production user-owned data may rely on these mechanisms.

Stage 4.1 does not replace the mock gate because doing so would require provider choice, route behavior changes, and broader QA.

## 12. Runtime File Decision

No runtime files are created in Stage 4.1.

Reason:

- an executable auth boundary without provider choice would either be unused placeholder code or an implicit architecture decision;
- changing route gates or session behavior risks public auth/dashboard regressions;
- adding provider-neutral runtime types is useful only when the approved implementation can connect them to real validation and tests.

The first future runtime files should be limited to a provider-neutral auth boundary module and tests only after provider selection is approved.

## 13. Rollback and Safety Strategy

The immediate rollback path is simple because Stage 4.1 changes documentation only.

Future implementation rollback requirements:

- keep mock/demo behavior explicitly separate until production auth fully replaces it;
- gate production auth rollout behind an explicit config boundary;
- fail closed for protected data;
- preserve public simulator V1/mock behavior;
- preserve Stage 3.15 deny-by-default deterministic V2 switch;
- avoid data migration until persistence and claim flow are approved;
- allow provider integration to be disabled without altering deterministic brain behavior;
- never silently fall back from failed production auth to mock authorization.

## 14. Testing Requirements for Future Auth Runtime

Future auth runtime implementation must include tests for:

- anonymous flow remains optional where allowed;
- guest session identifiers are opaque, expiring, and revocable;
- registered principal identifiers are stable and not email-dependent;
- current mock session cannot authorize production data;
- forged owner, role, entitlement, and principal claims fail;
- server-side route/data authorization denies by default;
- logout and revocation invalidate sessions;
- recent-auth or step-up gates protect sensitive actions;
- registration does not create memory consent;
- subscription status does not change ownership;
- guest claim is explicit, bounded, and idempotent when persistence exists.

## 15. Relationship to Stage 3.16

Stage 4.1 does not alter the Stage 3.11-3.16 runtime integration block.

Preserved facts:

- public simulator remains V1/mock-only;
- `/api/simulate` remains unchanged;
- deterministic V2 remains internal/dev-only and deny-by-default;
- no public V2 exposure is introduced;
- no AI, memory, persistence, subscription, or external provider is connected;
- Stage 3.15 controlled switch remains untouched.

## 16. Roadmap Compliance

Stage 4.1 satisfies the requested auth runtime foundation only by defining the safe implementation boundary.

Confirmed:

- auth runtime scope is defined;
- auth boundary is defined;
- identity states are defined;
- session model is defined;
- provider-neutral boundary is fixed;
- guest/authenticated separation is defined;
- protected route strategy is defined;
- rollback/safety plan is defined;
- Stage 4.2 is not started;
- persistence is not connected;
- subscriptions are not connected;
- AI is not connected;
- memory runtime is not connected;
- deterministic brain and public simulator behavior are unchanged.

## 17. Next Allowed Step

The next allowed auth step is a separately approved provider decision and implementation plan.

That step must answer:

- which provider is selected and why it satisfies Levio readiness gates;
- which login method launches first;
- how sessions are stored, validated, rotated, expired, and revoked;
- how CSRF, replay, callback, and token-handling risks are controlled;
- how stable Levio principal IDs are mapped from provider identities;
- which routes become production-protected first;
- which tests prove mock/auth separation and server-side authorization;
- how rollback disables provider auth without exposing protected data.

It must still not start persistence, subscriptions, AI, memory runtime, or Stage 4.2 unless explicitly approved.
