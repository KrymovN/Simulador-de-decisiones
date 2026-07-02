# LEVIO AUTH PROVIDER DECISION

## Document Status

- Stage: 4.1A - Auth Provider Decision.
- Status: completed provider decision / documentation-only.
- Date: 16 June 2026, Europe/Madrid.
- Depends on: `../stages/stage-04-runtime-architecture/stage-04-01-auth-runtime/LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, `../architecture/LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, `../architecture/LEVIO_USER_DATA_ARCHITECTURE.md`, `../architecture/LEVIO_TRUST_LEGAL_LAYER.md`, and `../architecture/LEVIO_IDENTITY_CORE.md`.
- Implementation status: not started.
- Runtime status: unchanged.

## 1. Purpose

This document evaluates production authentication providers for Levio.es and selects the provider that best fits the already approved auth, ownership, user-data, trust, and future persistence architecture.

This is an architecture decision only. It does not install dependencies, configure a provider, create routes, create middleware, modify UI, create API endpoints, connect persistence, or change runtime behavior.

## 2. Decision Summary

Approved provider for the next auth implementation planning stage:

```text
Supabase Auth
```

Approved with strict conditions:

- Supabase Auth must sit behind the Levio Auth Runtime Boundary defined in `../stages/stage-04-runtime-architecture/stage-04-01-auth-runtime/LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`.
- Supabase `auth.users.id` must be treated as `provider_reference` until Stage 4.2 defines the stable internal Levio principal mapping.
- The canonical production owner ID must be Levio-controlled, not provider-native, unless a later persistence decision explicitly proves that direct mapping is safe.
- Supabase anonymous sign-ins must not be enabled by default.
- Supabase RLS must not replace Levio authorization design; it is an enforcement layer for server-side ownership rules.
- Stage 4.1A does not approve persistence, database schema, migrations, saved simulations, subscriptions, AI, or memory runtime.

## 3. Evaluated Providers

Minimum evaluated providers:

- Auth.js / NextAuth;
- Supabase Auth;
- Clerk.

Additional candidates considered but not fully scored:

- Better Auth, because the Auth.js project now identifies itself as part of Better Auth;
- Auth0, because it is a mature enterprise identity provider.

Better Auth is not selected because Levio has not yet approved a migration away from the documented Auth.js/Next.js candidate set, and it would need its own implementation-risk review. Auth0 is not selected because it is more enterprise-identity heavy than Levio's current MVP needs and adds cost and vendor operational complexity without solving the Stage 4.2 persistence alignment better than Supabase.

## 4. Source Baseline

Provider facts were checked against official sources on 16 June 2026:

- Auth.js states it is free and open source and supports Next.js integration.
- Auth.js supports JWT and database session strategies, and database adapters are optional unless persistent user information or certain flows are required.
- Auth.js magic-link flows require an email provider integration.
- Supabase Auth supports password, magic link / OTP, social login, SSO, JWTs, and RLS-integrated authorization.
- Supabase Auth stores auth data in the project's Postgres database and integrates auth tokens with database access.
- Supabase anonymous sign-ins create anonymous users that later can link an authentication method, but anonymous users use the `authenticated` role and require careful RLS policy checks.
- Supabase sessions use access tokens and refresh tokens, expose a `session_id` claim, and support session lifetime controls on paid plans.
- Clerk supports Next.js, user management, session management, organization management, billing management, and prebuilt UI.
- Clerk's session model uses short-lived session tokens and a managed frontend/backend API architecture.
- Clerk pricing includes a free Hobby plan, Pro and Business tiers, and billing add-ons; regional data pinning is not offered on the public pricing page, while Clerk references Data Privacy Framework support.

## 5. Decision Criteria

The decision uses Levio-specific criteria, not generic popularity:

1. Fit with provider-neutral Levio auth boundary.
2. Fit with Stage 4.2 Persistence Runtime.
3. Fit with User Data Architecture ownership and lifecycle rules.
4. GDPR-oriented data minimization, export, deletion, and processor review.
5. Vendor lock-in risk.
6. Cost and pricing risk.
7. Support and operational burden.
8. Migration complexity.
9. Impact on future AI layer.
10. Impact on subscriptions.
11. Impact on user ownership model.
12. Support for anonymous, guest, registered, and protected-dashboard flows.
13. Support for multilingual future environment.
14. Support for export and deletion requirements.

## 6. Comparison Matrix

| Criterion | Auth.js / NextAuth | Supabase Auth | Clerk |
| --- | --- | --- | --- |
| Levio architecture fit | High control, but more custom work. | Strong if wrapped behind Levio boundary. | Good runtime convenience, weaker ownership control. |
| Stage 4.2 persistence fit | Flexible with any DB adapter, but Stage 4.2 must design more. | Strongest if Stage 4.2 uses Supabase/Postgres/RLS. | Requires separate persistence sync and webhook discipline. |
| User Data Architecture fit | Strong with custom schemas, high implementation burden. | Strong with Postgres owner tables and RLS, if internal principal mapping is enforced. | Moderate; user identity lives primarily in Clerk, app data elsewhere. |
| GDPR model fit | Strongest data-control potential if self-managed, but requires owner-operated compliance controls. | Strong: region choice, Postgres ownership, DPA/security docs, self-hosting option, but still needs legal review. | Acceptable for many apps, but public page says no region selection; DPF/DPA support helps but does not remove transfer review. |
| Vendor lock-in | Low to medium. | Medium. Auth and DB coupling increases lock-in, but Postgres and exportability reduce it. | High. Runtime, user management, UI, orgs, and billing can become Clerk-shaped. |
| Cost | Library free, but DB/email/ops costs are external. | Predictable early fit: Free quota, then paid plan plus MAU/usage. | Free to 50k retained users, then Pro/usage; add-ons can shape roadmap/costs. |
| Support burden | Highest; Levio owns most auth operations. | Medium; managed auth plus database policies, still needs careful RLS and lifecycle work. | Lowest initial integration burden; higher conceptual dependency. |
| Migration complexity | Medium; depends on chosen DB schema. | Medium; exportable Postgres helps, but auth/session migration is non-trivial. | High; external managed identity and UI/runtime assumptions need careful migration. |
| AI layer impact | Minimal if implemented carefully. | Good: DB/RLS can enforce minimum necessary context before AI. | Requires robust sync from Clerk identity to app DB before AI can use user context. |
| Subscriptions impact | Neutral; subscriptions remain separate. | Neutral; subscriptions remain separate. | Risk: Clerk Billing could blur subscription and identity boundaries. Must be forbidden for initial stages. |
| Ownership impact | Best control if built correctly. | Strong, if Supabase IDs are provider references and Levio principal IDs own records. | Risk of provider user ID becoming implicit owner without explicit internal mapping. |
| Anonymous users | Must build separately. | Built-in anonymous sign-ins exist but require strict policy handling; not enabled by default. | Not the best fit for Levio guest model unless custom. |
| Guest users | Must build separately. | Can support later through anonymous/guest tables, but claim flow must be custom. | Requires custom app-side guest model and later account linking. |
| Registered users | Strong with adapters and providers. | Strong built-in registered user model. | Strong managed registered user model. |
| Session model | JWT or database sessions; high configurability. | JWT/refresh-token model with configurable controls. | Strong managed hybrid model with short-lived tokens. |
| Protected dashboard | Needs custom middleware/server checks. | Strong with server checks plus RLS. | Strong with SDK/middleware, but app authorization still custom. |
| Multilingual future | Fully app-controlled. | App-controlled; auth emails/templates need configuration. | Prebuilt UI may constrain exact Spanish/multilingual product tone unless custom flows are used. |
| Export/deletion | Fully custom and app-controlled. | Strong if auth and app data remain in Postgres-controlled lifecycle. | Requires Clerk user export/delete plus app data export/delete coordination. |

## 7. Provider Evaluation

### 7.1 Auth.js / NextAuth

Auth.js is the most provider-neutral and code-owned option. It is free and open source, supports many providers, supports Next.js, and supports both JWT-based and database-backed sessions.

Strengths:

- lowest vendor lock-in;
- high alignment with Levio's provider-neutral boundary;
- full control over custom Spanish auth UI and product tone;
- can keep auth, user-data ownership, consent, and subscriptions fully separate;
- can be paired with any Stage 4.2 database decision;
- good long-term exit path even if another provider launches first.

Weaknesses:

- not a managed identity platform by itself;
- requires a database adapter for durable user data and some flows;
- requires a separate email provider for magic links;
- session revocation, account recovery, audit visibility, abuse controls, and support tooling require more custom implementation;
- higher implementation and security maintenance burden for a solo/small MVP path;
- provider maturity direction must be reviewed because Auth.js now points to Better Auth.

Fit conclusion:

Auth.js is rejected as the initial approved provider because Levio's near-term need is a safe production identity foundation that also prepares Stage 4.2 persistence. Auth.js remains the best fallback or migration path if Supabase coupling becomes unacceptable.

### 7.2 Supabase Auth

Supabase Auth is the approved provider for the next implementation planning stage.

Strengths:

- strongest Stage 4.2 alignment because auth, Postgres persistence, and RLS can share a coherent server-side authorization model;
- supports magic link / OTP, password, social login, SSO, and JWT-based auth;
- stores auth data in the project's Postgres database under a special schema;
- integrates auth tokens with Postgres RLS policies for row-level access control;
- supports session controls and session identifiers;
- supports data-region planning better than a pure external identity SaaS;
- fits future export/deletion work better because identity, ownership tables, and user-owned data can be modeled in Postgres;
- supports a clear pattern for future AI minimum-necessary context: query only authorized owner-scoped data before AI calls.

Risks:

- Auth and persistence can become too tightly coupled if Levio lets Supabase schemas define ownership semantics.
- Supabase anonymous sign-ins can blur Levio's anonymous versus guest boundary because they create anonymous users with the `authenticated` Postgres role.
- JWT/RLS convenience can tempt the project to put too much trust in client-visible claims.
- Session controls on free versus paid tiers must be checked before production use.
- Migration away from Supabase Auth plus Supabase Postgres is possible but non-trivial.

Required mitigations:

- Use a Levio-owned `principal` mapping table in Stage 4.2.
- Treat Supabase user ID as provider reference until proven safe.
- Keep anonymous browser state separate from Supabase anonymous sign-ins.
- Do not enable Supabase anonymous sign-ins for Stage 4.1B unless an explicit guest-session policy is approved.
- Enforce server-side checks and RLS together; neither replaces the other.
- Keep subscriptions outside Supabase Auth.
- Keep AI provider context selection outside Supabase Auth.

Fit conclusion:

Supabase Auth best satisfies Levio's current architecture because it supports production identity while preparing the future persistence and ownership enforcement model without forcing Clerk-style user-management or billing assumptions.

### 7.3 Clerk

Clerk is a highly capable managed authentication platform with strong Next.js support, prebuilt UI, session management, organization features, and billing features.

Strengths:

- fastest implementation path;
- polished managed auth UX;
- strong session architecture and production deployment guidance;
- easy protected-route integration;
- built-in user management and organizations;
- strong dashboard and operational tooling;
- generous free entry tier.

Weaknesses:

- high vendor lock-in;
- user identity and operational user management live primarily in Clerk;
- public pricing page says region selection is not offered, relying instead on Data Privacy Framework support for GDPR-compatible use;
- prebuilt UI and flows can constrain Levio's Spanish-first premium product tone unless custom flows are built;
- Clerk Billing and organization features can blur Levio's strict separation between identity, subscription, workspace, and ownership;
- export/deletion requires coordinated Clerk plus app database lifecycle;
- migration away from Clerk can become expensive once user management, sessions, orgs, and billing are adopted.

Fit conclusion:

Clerk is rejected as the initial approved provider because Levio's architecture prioritizes ownership, persistence, consent, export/deletion, and provider-neutral product control over fastest auth UX. Clerk remains a viable future enterprise/workspace candidate only after workspace architecture is defined.

## 8. Additional Candidate Notes

### 8.1 Better Auth

Better Auth should be evaluated later if the project wants a more modern successor path to Auth.js. It is not selected in Stage 4.1A because the requested candidate set centers Auth.js/NextAuth, Supabase Auth, and Clerk, and switching the evaluation target would create a new implementation-risk surface.

### 8.2 Auth0

Auth0 is mature and enterprise-capable, but it is not selected for MVP because it does not naturally improve Stage 4.2 persistence alignment, adds enterprise identity complexity, and increases external identity-provider dependency.

## 9. Approved Provider

Approved:

```text
Supabase Auth
```

Approved initial login posture:

```text
email magic link / OTP first
OAuth later only after account-linking policy is approved
password login later only if product/support needs justify it
anonymous sign-ins disabled by default
```

Why this provider:

- Levio's next infrastructure stage is persistence-oriented, and Supabase Auth aligns naturally with Postgres/RLS-based ownership enforcement.
- Levio needs stable owner-scoped data, export, deletion, consent, retention, and AI context gating; these are easier to prove when auth and persistence can share database-enforced access boundaries.
- Supabase gives enough managed auth to reduce operational burden while retaining more data-model control than Clerk.
- Supabase avoids the custom-auth maintenance burden that Auth.js would place on Stage 4.1B before persistence is ready.

## 10. Rejected Providers

Rejected as initial provider:

- Auth.js / NextAuth.
- Clerk.

Rejected does not mean permanently forbidden.

Auth.js remains the preferred fallback if:

- Supabase Auth cannot satisfy session, deletion, export, or provider-linking requirements;
- Stage 4.2 selects a non-Supabase persistence backend;
- vendor lock-in risk becomes more important than implementation speed.

Clerk remains a possible future candidate if:

- Levio approves a separate workspace/enterprise stage;
- data residency/legal review accepts Clerk's processing model;
- the project deliberately chooses managed identity and user-management convenience over ownership-model control.

## 11. Migration Impact

### From Current Mock Auth to Supabase Auth

Current mock auth must not be migrated as trusted identity.

Required migration posture:

- `levio_es_mock_session` is ignored by production auth.
- Existing localStorage demo simulations remain local demo data.
- No localStorage item is silently claimed into Supabase.
- Any future import must be explicit, selective, sanitized, idempotent, and associated with a verified registered account.

### From Supabase Auth to Another Provider Later

Mitigation plan:

- maintain a `provider_reference` layer;
- keep Levio principal IDs independent from provider-native IDs where possible;
- avoid storing provider tokens in product tables;
- keep account preferences, consent, memory, subscription, and decision records in Levio-owned tables;
- document provider identity link records separately from user-owned content;
- test export of auth mappings without exposing secrets.

## 12. Security Considerations

Supabase Auth implementation must prove:

- server-side session validation;
- secure cookie/token handling for Next.js App Router;
- CSRF/replay/callback protections appropriate to the selected flow;
- no provider token leakage into product runtime;
- denial by default for protected records;
- RLS policies for every owner-scoped table in Stage 4.2;
- no trust in client-provided owner, role, entitlement, or principal identifiers;
- logout and revocation behavior understood and tested;
- recent-auth or step-up strategy for export, deletion, provider linking, and future billing actions;
- rate limits and abuse controls for magic links, OTP, OAuth callbacks, guest-session creation, export, and deletion;
- minimal auth/security logging without decision content.

## 13. Rollback Strategy

Because Stage 4.1A is documentation-only, rollback is a normal documentation revert.

Future Supabase implementation rollback must:

- be gated behind an explicit runtime flag or boundary;
- leave public simulator V1/mock behavior unchanged;
- leave Stage 3.15 deterministic V2 switch unchanged and deny-by-default;
- never fall back from failed Supabase production auth to `MockAuthGate` authorization;
- fail closed for protected production data;
- preserve local demo flows until explicitly retired;
- avoid schema or data migrations until Stage 4.2 approves persistence;
- support disabling Supabase auth integration without deleting user-owned data.

## 14. Implementation Prerequisites

Before Stage 4.1B or any runtime auth implementation, Levio must define:

1. Supabase project/environment boundary.
2. Magic-link / OTP email provider and template policy.
3. Redirect URL and callback allowlist.
4. SSR/session handling approach for Next.js App Router.
5. Cookie/token storage and CSRF posture.
6. Stable Levio principal mapping plan.
7. Minimal `registered_user` profile fields and data minimization rules.
8. Protected route rollout order.
9. Logout, revoke-session, and revoke-all behavior.
10. Account recovery and provider-linking policy.
11. Anonymous and guest policy, with Supabase anonymous sign-ins disabled unless separately approved.
12. Testing plan for forged claims, cross-user isolation, mock-auth separation, and server-side authorization.
13. Rollback flag and failure behavior.
14. Legal/privacy review of Supabase DPA, region, subprocessors, and retention facts before production personal data.

## 15. Stage 4.1A Completion Boundary

Stage 4.1A completes only the Auth Provider Decision.

Completed:

- evaluated Auth.js / NextAuth, Supabase Auth, and Clerk;
- compared architecture, persistence, user-data, GDPR, lock-in, cost, support, migration, AI, subscription, and ownership effects;
- selected Supabase Auth as the approved provider for next auth planning;
- rejected Auth.js and Clerk as initial provider choices;
- documented migration impact, security considerations, rollback strategy, and implementation prerequisites.

Not started:

- Stage 4.1B;
- auth runtime implementation;
- auth routes;
- provider configuration;
- dependency installation;
- database/persistence;
- subscriptions/payments;
- AI;
- memory runtime;
- dashboard/UI changes;
- simulator changes;
- deterministic brain changes;
- `SimulationResponse` changes;
- API endpoint creation.

## 16. References

- Auth.js overview: https://authjs.dev/
- Auth.js session strategies: https://authjs.dev/concepts/session-strategies
- Auth.js database adapters: https://authjs.dev/getting-started/database
- Auth.js magic links: https://authjs.dev/getting-started/authentication/email
- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase sessions: https://supabase.com/docs/guides/auth/sessions
- Supabase anonymous sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase security: https://supabase.com/security
- Clerk docs: https://clerk.com/docs
- Clerk architecture: https://clerk.com/docs/guides/how-clerk-works/overview
- Clerk production deployment: https://clerk.com/docs/guides/development/deployment/production
- Clerk pricing: https://clerk.com/pricing
- Clerk DPA: https://clerk.com/legal/dpa
