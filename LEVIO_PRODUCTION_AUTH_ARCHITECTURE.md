# LEVIO PRODUCTION AUTH ARCHITECTURE

## Document Status

- Stage: 2.16 - Production Auth Architecture.
- Status: architecture specification only.
- Date: 13 June 2026, Europe/Madrid.
- Depends on: `LEVIO_USER_DATA_ARCHITECTURE.md`.
- Does not implement authentication, authorization, persistence, providers, routes, UI, or database schemas.

## 1. Purpose

This document defines how a future Levio production authentication system must establish identity and enforce access to user-owned data.

It specifies:

- identity states;
- authentication and authorization boundaries;
- anonymous and guest behavior;
- account creation and migration;
- ownership claims;
- session and device behavior;
- security and abuse-prevention principles;
- provider strategy;
- GDPR-oriented boundaries;
- requirements that must be satisfied before production persistence and Stage 3 AI integration.

This document is provider-independent. It does not select or integrate Supabase, Auth.js, Clerk, Firebase, or any other auth provider.

## 2. Why Auth Follows User Data Architecture

Authentication must follow the user-data architecture because identity is useful only when the system already knows:

- which data can belong to a user;
- which principal owns each record;
- which data may be temporary;
- which data requires consent;
- which actions require verified ownership;
- how export, deletion, retention, and recovery work.

Auth must not invent ownership rules. It proves who is acting so that the ownership and lifecycle rules in `LEVIO_USER_DATA_ARCHITECTURE.md` can be enforced.

The required separation is:

- **Authentication** proves or establishes the acting principal.
- **Authorization** decides whether that principal may perform an action.
- **Ownership** identifies the principal that controls a user-owned object.
- **Consent** records permission for a specific optional processing purpose.
- **Subscription** grants product capabilities and limits.

None of these concepts may silently substitute for another.

## 3. Core Auth Principles

1. Auth must be optional until a feature requires durable identity.
2. Registration must not be required merely to explore Levio or run a temporary simulation.
3. Registration is not consent.
4. Authentication alone does not authorize access to every record.
5. Every protected operation must enforce authorization server-side.
6. Client-supplied user, owner, role, or entitlement identifiers are untrusted.
7. User-owned data must remain scoped to its verified owner.
8. Premium status is an entitlement state, not a separate identity.
9. Internal operators are not owners of user data.
10. Guest-to-account ownership transfer must be explicit, bounded, idempotent, and auditable.
11. Sessions must be revocable, expire predictably, and use least privilege.
12. Sensitive account actions require stronger assurance than ordinary browsing.
13. Auth data collection and retention must be minimized.
14. Auth logs must never become hidden decision history.
15. The current mock/localStorage session must never authorize production data.

## 4. Conceptual Principal Model

A principal is the identity or bounded context against which ownership and authorization are evaluated.

Conceptual principal types:

```text
anonymous_device
guest_session
registered_user
workspace
internal_operator
service
```

Only principals explicitly allowed by the user-data architecture may own user-owned records.

- `anonymous_device` may control low-risk local data but is not a durable verified identity.
- `guest_session` may temporarily control narrowly scoped server-side data until expiry or explicit claim.
- `registered_user` is the durable personal owner principal.
- `workspace` is a distinct collaborative owner scope and is not interchangeable with a personal account.
- `internal_operator` may perform narrowly authorized operational actions but does not own user content.
- `service` may process data for a defined system purpose but does not become its owner.

## 5. Identity States

### 5.1 Anonymous Visitor

An anonymous visitor has no server-recognized identity and no authenticated session.

Allowed behavior may include:

- viewing public pages;
- selecting a local language preference;
- drafting a situation locally;
- running a temporary simulation when the product permits it;
- receiving a result without creating an account.

Anonymous mode must not imply:

- durable cross-device identity;
- server-side ownership recovery;
- durable saved history;
- durable memory;
- subscription ownership;
- authenticated export or deletion.

### 5.2 Guest Session

A guest session is a temporary, server-recognized principal with bounded scope and expiry.

It may support:

- continuity during a short simulation flow;
- temporary server-side processing;
- temporary ownership of explicitly identified drafts or results;
- a controlled claim flow into a registered account.

A guest session must:

- have an opaque, unguessable identifier;
- expire after a defined period;
- be revocable;
- have strict storage and rate limits;
- never be treated as a verified person;
- never silently merge with a registered account.

### 5.3 Registered User

A registered user is a durable personal principal whose account identity has been verified through an approved auth provider flow.

A registered user may own:

- saved simulation drafts;
- saved simulation results;
- scenario history;
- explicit preferences;
- consented memory;
- export requests;
- deletion requests;
- subscription associations;
- personal projects and future user-owned records.

Registration does not automatically grant premium entitlements, workspace access, memory consent, or access to any record not owned by the user.

### 5.4 Premium User

A premium user is a registered user with an active premium entitlement.

Premium status:

- changes available capabilities, limits, or service levels;
- does not create a new owner principal;
- does not weaken consent, retention, export, or deletion rules;
- does not grant access to another user's data;
- must be verified server-side for protected premium actions.

Loss of premium status must not silently delete user-owned data.

### 5.5 Admin or Internal Operator

An internal operator exists only if operational needs require the role.

The role must:

- use a separate internal identity and authorization domain;
- have no default access to user decision content;
- follow least privilege;
- require strong authentication;
- use audited, time-bounded access for exceptional support or security actions;
- never become the owner of user data;
- never use ordinary user sessions for privileged operations.

Break-glass access, if ever implemented, must require a documented reason, elevated approval, narrow scope, and immutable audit evidence.

## 6. Identity, Role, and Entitlement Matrix

| State | Durable identity | May own durable personal data | May claim guest data | May own subscription | Default privileged access |
| --- | --- | --- | --- | --- | --- |
| Anonymous visitor | No | No | No | No | No |
| Guest session | Temporary only | No | Source of bounded claim | No | No |
| Registered user | Yes | Yes | Yes, after verification | Yes | No |
| Premium user | Yes | Yes | Yes, after verification | Yes, with premium entitlement | No |
| Internal operator | Separate internal identity | No | No | No | No |

## 7. Anonymous Mode Boundaries

Anonymous mode should remain useful without pretending to provide account guarantees.

Data that may be stored locally by default must be low-risk, bounded, and understandable, such as:

- interface language;
- non-sensitive presentation preferences;
- an unsaved local draft;
- temporary flow state.

Anonymous data must not be promoted into durable server-side user history without an explicit action and an authenticated owner.

An anonymous browser identifier:

- is not proof of a person;
- is not sufficient for sensitive export or deletion;
- must not be used to infer that two devices belong to the same user;
- must not be used to silently claim data into a new account.

## 8. Guest Session Boundaries

Guest sessions are optional infrastructure for temporary continuity, not lightweight accounts.

Guest-owned server data must:

- be explicitly tagged with the guest principal;
- have a short, documented retention period;
- be excluded from durable memory;
- be excluded from subscription ownership;
- be excluded from cross-device recovery unless the guest proves possession of the session;
- be deleted or irreversibly de-identified after expiry according to the retention policy.

Guest sessions must not be used to bypass account requirements for durable features.

## 9. Registered Account Boundaries

A registered account provides durable identity and an authorization anchor.

It must support:

- stable owner identifiers that do not depend on email address;
- provider identity changes without changing ownership;
- server-side authorization checks;
- session inspection and revocation;
- authenticated export and deletion requests;
- secure account recovery;
- auditable guest-data claims;
- correct association of consent records and subscription entitlements.

A registered account must not:

- imply consent to memory or marketing;
- expose data based only on a client-provided account ID;
- inherit unrelated anonymous browser data;
- merge with another account merely because emails appear similar.

## 10. Premium Account Boundaries

Premium is evaluated as a server-side entitlement attached to a registered principal.

The auth layer may expose a trusted entitlement context to authorization logic, but:

- provider or payment identifiers must not become owner identifiers;
- client claims of premium status are untrusted;
- cancellation or expiry changes capabilities, not ownership;
- export and deletion rights remain available regardless of tier;
- security and privacy protections remain equal across tiers.

## 11. When Auth Is Optional

Auth should remain optional for:

- browsing public information;
- trying the simulator in a temporary mode;
- creating a local unsaved draft;
- receiving a temporary result;
- selecting a local language or presentation preference;
- deciding whether Levio is useful before creating an account.

Optional auth must not be implemented through dark patterns or misleading save promises.

## 12. When Auth Is Required

Auth is required when Levio must reliably establish a durable owner or execute a sensitive action, including:

- saving data for cross-device access;
- accessing saved simulations or scenario history;
- enabling durable user memory;
- editing memory or consent settings;
- managing subscription ownership;
- exporting user-owned data;
- initiating account-wide deletion;
- changing identity providers or recovery settings;
- viewing or revoking active sessions;
- joining or administering a future workspace;
- performing internal privileged operations.

Sensitive actions may additionally require recent authentication or step-up verification.

## 13. Account Creation Triggers

Levio may offer account creation when a user chooses to:

- save a draft or result durably;
- access history across devices;
- enable memory;
- subscribe to a paid tier;
- request an authenticated export;
- manage durable preferences;
- create or join a future workspace.

Account creation must be an explicit user action.

It must clearly explain:

- what will become durable;
- which data will be claimed;
- which data will remain temporary;
- that registration is not memory consent;
- that subscription terms are separate.

## 14. Anonymous to Registered Migration

Anonymous local data may be offered for import after registration only when the user explicitly selects it.

Required rules:

1. Authenticate the target registered account.
2. Present the local items eligible for import.
3. Explain the ownership and retention change.
4. Require explicit confirmation.
5. Validate and sanitize imported data.
6. Create new registered-user-owned records.
7. Record minimal claim provenance.
8. Avoid duplicate imports through idempotency.
9. Leave unrelated local data untouched or offer a separate cleanup choice.

Local browser state alone must never authorize access to existing registered-user data.

## 15. Guest to Registered Migration

A guest claim transfers eligible temporary records from a verified guest session to a verified registered principal.

The claim operation must require:

- proof of control of the active guest session;
- proof of control of the target registered account;
- explicit user confirmation;
- a server-generated claim transaction;
- an allowlist of eligible record types;
- an idempotency key;
- conflict and duplicate handling;
- minimal audit evidence;
- a terminal claim state.

Conceptual claim states:

```text
pending
confirmed
completed
partially_completed
rejected
expired
```

A guest claim must not:

- claim expired or unrelated guest records;
- transfer another guest's data;
- silently overwrite existing registered-user data;
- convert temporary processing logs into user history;
- create memory consent.

## 16. Ownership Transfer Rules

Ownership transfer is exceptional and must be explicit.

Permitted personal-data ownership transitions are limited to:

- eligible anonymous local item imported into the authenticated user's scope;
- eligible guest-owned item claimed into the authenticated user's scope;
- future personal-to-workspace copy or transfer under a separately specified workspace policy.

General rules:

- authorization must be enforced server-side;
- source and target principals must be proven;
- the operation must be atomic where possible;
- partial completion must be visible and recoverable;
- transfer must be idempotent;
- audit evidence must exclude unnecessary decision content;
- ownership must never change because of subscription status;
- account linking must not merge user-owned data without a separate verified process.

## 17. Saved Simulations Ownership

Saved simulation drafts and results belong to the verified owner defined by the user-data architecture.

Auth requirements:

- every read, update, delete, share, or export operation checks owner scope;
- list queries are scoped server-side;
- record IDs alone never grant access;
- guest results may be claimed only through the bounded claim flow;
- an AI provider or internal operator never becomes the owner;
- subscription changes do not change ownership.

The current localStorage saved-simulation flow is demo behavior and is not a production authorization mechanism.

## 18. Memory Ownership

Durable memory requires:

- a registered owner principal;
- explicit, purpose-specific consent;
- server-side owner authorization;
- visible controls to inspect, correct, disable, and delete memory;
- retention and deletion behavior defined by the memory and user-data architectures.

Auth must not:

- silently enable memory at registration;
- treat a logged-in session as memory consent;
- share personal memory with another user or workspace;
- expose memory to AI before ownership and consent checks pass.

## 19. Preference Ownership

Preferences have different identity requirements:

- low-risk interface preferences may remain anonymous and local;
- cross-device preferences require a registered owner;
- sensitive or inference-rich preferences require explicit purpose review;
- memory-like preferences must follow memory consent rules.

When local and account preferences conflict, the merge policy must be explicit and reversible.

## 20. Subscription Ownership

A subscription belongs to a verified account or, in a future separately specified model, a workspace billing owner.

Auth responsibilities include:

- establishing the account that owns or administers the subscription;
- protecting billing-management actions;
- receiving trusted entitlement state from the future subscription system;
- preventing client-side entitlement forgery.

The auth layer must not store unnecessary payment details or treat billing identity as the canonical user identity.

## 21. Export and Deletion Relation to Auth

Export and deletion are high-impact operations that require verified identity.

### Export

An export request must:

- require an authenticated registered principal;
- re-check ownership for included records;
- use recent authentication or step-up verification when risk warrants it;
- produce a time-limited, access-controlled delivery;
- avoid exposing another principal's data;
- create minimal audit evidence;
- expire generated export artifacts.

### Deletion

An account deletion request must:

- require authenticated ownership and recent verification;
- explain immediate and delayed effects;
- distinguish account deletion from subscription cancellation;
- revoke active sessions according to the deletion lifecycle;
- trigger deletion or de-identification across owned data;
- preserve only legally or operationally required minimal records;
- make recovery boundaries explicit before confirmation.

Auth records retained after deletion must be minimized and must not recreate a hidden user profile.

## 22. Recovery and Undo Boundaries

Recovery exists to restore account control, not to bypass ownership checks.

Requirements:

- recovery uses a verified channel or provider process;
- recovery events revoke or review risky sessions;
- identity changes notify the user through an independent trusted channel where possible;
- recovery must not silently merge accounts;
- recovery secrets and tokens are one-time, short-lived, and never logged.

Undo may be offered for reversible profile actions or scheduled deletion during a clearly disclosed grace period.

After irreversible deletion or de-identification, Levio must not promise recovery.

## 23. Session Model

A production session represents authenticated access by a principal. It is not the principal itself.

Conceptual session fields:

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

Conceptual statuses:

```text
active
expired
revoked
compromised
pending_step_up
```

Conceptual assurance levels:

```text
guest
authenticated
recently_authenticated
step_up_verified
internal_strong_auth
```

Session requirements:

- identifiers are opaque and unguessable;
- session validity is checked server-side;
- sessions expire and may rotate;
- logout revokes the relevant session;
- account-wide logout revokes all sessions;
- passwordless or provider-token material is never exposed to product logic;
- sensitive operations verify sufficient assurance;
- session data is not used as decision memory.

The implementation may use secure cookies or another approved mechanism, but it must provide equivalent protection against token theft, fixation, CSRF, and replay.

## 24. Device and Browser Session Considerations

Users may have multiple legitimate sessions across devices and browsers.

The future product should support:

- a comprehensible list of active sessions;
- approximate device/browser labels without invasive fingerprinting;
- last-active time;
- individual session revocation;
- revoke-all-other-sessions;
- notification of material security events;
- safe behavior when cookies or local state are cleared.

Clearing a browser must not delete server-owned account data. Losing a guest session may make unclaimed guest data unrecoverable.

Device fingerprinting must not become a substitute for authentication.

## 25. Security Boundaries

The production auth design must enforce:

- server-side authentication and authorization;
- least privilege;
- secure transport;
- secure, HTTP-only session handling where cookies are used;
- CSRF protection where applicable;
- token rotation and replay resistance;
- short-lived, single-use login and recovery links;
- rate limiting and abuse controls;
- account-linking protection;
- session revocation;
- protected secrets and provider credentials;
- minimal security logging;
- separation of user and internal-operator auth;
- denial by default when ownership cannot be proven.

Authorization checks must evaluate the authenticated principal, resource owner, requested action, consent state where relevant, entitlement state where relevant, and current security risk.

## 26. Abuse Prevention Principles

Abuse controls must protect both the service and user privacy.

Controls may include:

- rate limits for login links, OAuth callbacks, guest sessions, claims, exports, and deletion requests;
- bot and automation resistance proportionate to risk;
- suspicious-session detection;
- temporary throttling;
- provider-level abuse signals;
- alerting for repeated failed claims or account-linking attempts.

Abuse prevention must not:

- retain decision content unnecessarily;
- use sensitive user content for unrelated profiling;
- permanently block legitimate recovery without review;
- weaken access for users who exercise privacy rights.

## 27. Provider Strategy

### 27.1 Email Magic Link

Email magic link is a strong candidate for a low-friction initial account flow.

Required properties:

- verified delivery destination;
- one-time token;
- short expiration;
- replay resistance;
- no token material in logs;
- clear handling when a link opens on another device;
- protection against email enumeration;
- step-up support for sensitive actions.

### 27.2 OAuth Providers

OAuth may reduce account-creation friction.

Required properties:

- minimal scopes;
- verified provider identity;
- robust state, nonce, and callback validation;
- no unnecessary provider profile collection;
- safe account-linking flow;
- no automatic merge based only on matching email;
- provider unlinking only when another recovery path exists.

### 27.3 Future Enterprise SSO

Enterprise SSO may be considered only with a separately specified workspace and organization model.

It must define:

- workspace ownership and administration;
- personal versus workspace data separation;
- provisioning and deprovisioning;
- domain and tenant verification;
- role mapping;
- export and deletion responsibilities;
- behavior when a user leaves an organization.

Enterprise SSO must not silently transfer personal data to an employer or workspace.

## 28. Why Provider Choice Is Deferred

Provider choice is deferred because implementation must first be evaluated against the architecture, not allowed to define it.

Selection depends on:

- supported identity methods;
- session and revocation controls;
- account linking behavior;
- data residency and processing terms;
- GDPR support;
- auditability;
- operational burden;
- security posture;
- pricing and scaling;
- integration with future persistence and subscriptions.

No provider may be selected merely because the current mock auth UI resembles its flow.

## 29. Auth Data Minimization

Auth-related data must be limited to what is necessary for identity, security, recovery, and legal obligations.

Do not store unnecessarily:

- raw magic-link or recovery tokens;
- OAuth access or refresh tokens beyond the provider integration need;
- provider profile fields unrelated to Levio;
- passwords when using passwordless or delegated auth;
- full IP histories without a defined security purpose and retention period;
- invasive device fingerprints;
- decision content in auth or security logs;
- simulation history as an abuse-prevention shortcut;
- payment card data;
- hidden copies of deleted identity data;
- internal notes that become an unreviewable user profile.

Security metadata must have a documented purpose, access boundary, and retention period.

## 30. GDPR-Oriented Relationship

Production auth must enable the GDPR-oriented user-data architecture without claiming legal compliance by architecture alone.

It must support:

- data minimization;
- purpose limitation;
- storage limitation;
- accuracy and correction;
- authenticated access and portability;
- deletion and restriction workflows;
- consent records independent of registration;
- auditable security controls;
- transparent identity and provider processing;
- processor and subprocessor review;
- privacy by default.

Auth logs and provider data remain personal data and must follow retention and access rules.

## 31. Relation to Stage 3 AI Integration

Production auth is a prerequisite for any Stage 3 behavior that uses durable user data.

Before AI may access user-owned context:

1. The acting principal must be authenticated when durable data is involved.
2. Authorization must prove access to each input source.
3. Memory consent must be active for memory use.
4. Only the minimum necessary context may be sent.
5. Auth tokens, session identifiers, provider secrets, and unrelated account data must never be sent to the AI provider.
6. AI output must be stored only under the verified owner and applicable retention policy.
7. The AI must never decide authorization, ownership, consent, or entitlement.

Temporary anonymous simulations may follow a separately approved minimal-processing path, but auth architecture must not be bypassed for durable history or memory.

## 32. Production Auth Readiness Gates

Implementation must not be considered production-ready until it demonstrates:

- stable registered principal identifiers;
- server-side authorization on every protected resource;
- secure session issuance, rotation, expiry, and revocation;
- safe anonymous and guest boundaries;
- explicit, idempotent guest claims;
- safe provider linking and unlinking;
- recent-auth or step-up controls for sensitive actions;
- session visibility and revocation;
- authenticated export and deletion initiation;
- account recovery with takeover protections;
- consent association independent from registration;
- server-side entitlement validation;
- minimal security logging and retention;
- rejection of forged owner, role, and entitlement identifiers;
- isolation of internal-operator access;
- migration tests for anonymous and guest data;
- no reliance on current mock/localStorage auth.

## 33. What This Stage Does Not Implement

Stage 2.16 does not:

- create auth routes;
- add login, registration, recovery, or session-management UI;
- integrate an auth provider;
- create database tables;
- install dependencies;
- implement persistence;
- implement subscriptions or payments;
- implement export or deletion workflows;
- implement AI or OpenAI integration;
- change the simulator flow;
- change API routes;
- change the current `SimulationResponse`;
- change product code or product logic;
- authorize production access through the current mock session.

## 34. Open Questions for Future Implementation

The following decisions are intentionally deferred:

- Which auth provider best satisfies the readiness gates?
- Which login methods launch first?
- What are the exact guest-session and login-link expiry periods?
- Which sensitive actions require recent auth versus step-up verification?
- How are provider identities linked, unlinked, and recovered?
- What is the account merge policy when a user creates duplicates?
- What is the precise account-deletion grace period?
- Which security events trigger user notifications?
- What minimal session metadata is shown to users?
- What retention periods apply to auth, abuse, and security logs?
- Which jurisdictions and data-residency constraints apply?
- When is enterprise SSO justified?
- How will future workspace roles remain separate from personal ownership?
- How will anonymous local imports handle conflicts with account data?
- What operational process governs exceptional internal access?

These questions must be resolved during an approved implementation stage without weakening this architecture.

## 35. Stage 2.16 Completion Boundary

Stage 2.16 is complete through this provider-independent specification and repository fixation only.

It closes the architecture definition for the final Stage 2 user-data item: Production Auth.

It does not make Levio production-authenticated, production-persistent, subscription-ready, or ready for unrestricted Stage 3 AI integration.
