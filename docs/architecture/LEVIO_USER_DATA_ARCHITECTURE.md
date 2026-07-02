# LEVIO USER DATA ARCHITECTURE

## 1. Purpose

This document defines the future user data ownership and lifecycle architecture for Levio.

It establishes what belongs to a user, what may be stored, what remains temporary, how consent and retention apply, how export and deletion work, and how user-owned persistence must connect to future authentication, subscriptions, memory, and `SimulationResponse V2`.

This is an architecture specification only. It does not implement authentication, a database, persistence, consent UI, export, deletion, payments, or AI integration.

## 2. Core Ownership Principle

Data ownership is determined by origin, purpose, and user control, not by where data is stored.

A record does not stop being user-owned because Levio generated part of it, stored it on a server, or attached operational metadata to it. A record does not become user-owned merely because it references a user.

Levio must distinguish:

- **user-owned content**: content created, supplied, saved, confirmed, or intentionally organized by the user;
- **user-controlled derived content**: decision analysis generated from user-owned content and saved for the user's benefit;
- **system operational metadata**: minimum technical records required to operate, secure, measure, or comply with the service;
- **temporary processing data**: short-lived data needed to complete an active operation;
- **aggregated or irreversibly anonymized data**: data that can no longer reasonably identify or be linked back to a user.

Ownership, access, retention, export, deletion, and lawful basis are separate attributes. They must not be collapsed into one flag.

## 3. User-Owned Data Principles

- The user must be able to understand what personal and decision data Levio holds.
- User-owned data must have a stable owner or an explicit temporary guest scope.
- Unknown ownership is not acceptable for persistent personal data.
- User-owned content must remain isolated from other users and workspaces.
- Generated analysis saved for a user must remain linked to the source decision and its provenance.
- The user must be able to correct, export, and delete eligible user-owned data.
- A subscription tier may limit creation or advanced processing, but it must not remove ownership or privacy rights.
- Downgrades and cancellation must not silently delete user-owned data.
- Memory must remain a controlled subset of user-owned data, not a hidden copy of all activity.
- Data generated from user content must not be treated as a system asset that is exempt from user control.
- Operational metadata must not be used to reconstruct hidden personal profiles.
- Every persistent record must have a defined purpose, retention rule, and deletion behavior.
- Production and development data must remain separated.

## 4. Ownership and Access Model

### 4.1 Conceptual Principals

Future production architecture must recognize these principal types:

```ts
type OwnerPrincipal =
  | { type: "anonymous_device"; id: string }
  | { type: "guest_session"; id: string }
  | { type: "registered_user"; id: string }
  | { type: "workspace"; id: string };
```

This is a conceptual contract, not an implemented schema.

An owner principal identifies the entity that controls a record. An authenticated actor identifies who is currently requesting access. Ownership and current access are not interchangeable.

### 4.2 Ownership Attributes

Every future persistent user-data record should include:

- stable record identifier;
- owner principal type and identifier;
- record category;
- purpose;
- source and provenance;
- whether content is user-provided, user-confirmed, or system-derived;
- sensitivity classification;
- consent basis where required;
- creation and update timestamps;
- retention rule or expiry;
- export eligibility;
- deletion state;
- workspace scope where applicable.

### 4.3 Access Invariants

- Access must be denied unless ownership or explicit authorization is proven.
- Client-provided owner identifiers must not be trusted without server-side authorization.
- A registered user must not automatically gain access to guest data from another device or session.
- A workspace must not automatically gain ownership of a member's personal decisions or memory.
- Personal memory must not be shared into a professional workspace without an explicit user action and defined scope.
- Administrative access must be exceptional, least-privileged, and auditable.
- Cross-user data leakage is a critical security failure.

## 5. Anonymous, Guest, and Registered Boundaries

### 5.1 Anonymous Device

An anonymous device has no verified identity.

May store by default, through an approved browser-safe mechanism:

- interface locale;
- essential product-state preferences;
- a local unsaved simulation draft;
- explicitly saved local demo simulations, while clearly identified as device-local.

Must not be treated as:

- an authenticated owner;
- a durable cross-device identity;
- a basis for storing sensitive long-term memory;
- proof that the current person is the same person who created earlier local data.

Anonymous device data may disappear through browser clearing, device loss, private browsing, expiry, or product reset. Levio must not promise recovery.

### 5.2 Guest Session

A guest session is a temporary server-recognized or browser-recognized interaction scope without a registered account.

It may support:

- active simulation processing;
- clarification answers during the active flow;
- short-lived drafts;
- temporary results;
- a bounded claim flow into a newly registered account.

Guest data must:

- have a defined expiry;
- avoid long-term memory by default;
- avoid sensitive persistent storage unless a separately approved consent and legal basis exists;
- be inaccessible after expiry;
- not be merged into an account without proof of control and an explicit user action.

### 5.3 Registered User

A registered user has a verified account principal created by future Production Auth.

A registered user may own:

- saved simulation drafts and results;
- scenario and decision history;
- profile preferences;
- user-confirmed memory;
- projects and project-linked decisions;
- export requests;
- consent choices and withdrawal records;
- future subscription-related entitlements and user-visible billing records.

Registration does not itself grant consent for memory, sensitive history, analytics, or marketing.

### 5.4 Workspace Boundary

A future professional workspace is a separate owner and access scope.

- Workspace-owned records must be explicitly created in or transferred to the workspace.
- Personal records remain personal unless the user explicitly shares or transfers them.
- Workspace administrators do not automatically own or access personal memory.
- Leaving a workspace must not silently delete or transfer personal records.
- Workspace retention and legal obligations require a separately approved architecture.

## 6. Guest-to-Account Claim Boundary

Future Stage 2.16 Production Auth must support an explicit, safe method for claiming eligible guest data.

Claim requirements:

1. The user proves control of the target registered account.
2. The user proves control of the eligible guest session or device claim token.
3. Levio shows what data will be attached to the account.
4. The user explicitly confirms the claim.
5. Ineligible, expired, or sensitive temporary processing data is not claimed.
6. Existing account data is not overwritten silently.
7. Claim operations are idempotent and auditable.
8. A claim token cannot grant access to unrelated guest data.

Claimable data may include:

- user-authored draft text;
- an explicitly saved guest simulation result;
- selected interface preferences.

Data that must not be claimed automatically:

- raw processing traces;
- security logs;
- expired clarification context;
- raw microphone audio;
- inferred memory;
- another user's or another session's data.

## 7. Data Category Matrix

| Category | User-owned | Default persistence | Consent requirement | Typical lifecycle |
| --- | --- | --- | --- | --- |
| Active simulation draft | Yes | Local/session only | No, for active use | Until submit, clear, expiry, or explicit save |
| Clarification answers | Yes | Temporary by default | Explicit consent for persistent reuse | Active session, then expire or save into decision record |
| Saved simulation result | Yes, including user-controlled derived content | Only after explicit save or account setting | May require explicit consent when sensitive | Until deletion, expiry policy, or account deletion |
| Scenario history | Yes when saved as part of a decision | Not by default for anonymous users | Explicit save; sensitive history may require specific consent | Until deletion or configured retention |
| Decision history | Yes | Not by default | Explicit, purpose-specific consent | Until deletion or configured retention |
| Long-term memory | Yes | Never silently | Explicit consent and confirmation | Until deletion, withdrawal, or expiry |
| Project memory | Yes or workspace-owned | Only after project association | Explicit project association; sensitive data may require consent | Until project deletion/archive policy |
| Interface locale | Yes as a preference | May persist by default | No separate consent where legally permitted | Until reset or change |
| Risk preference | Yes | Only after intentional confirmation | Explicit confirmation | Until change or deletion |
| Subscription entitlement state | User-related, system-controlled | Required for service delivery | Contract/service basis, not memory consent | While required for account and legal obligations |
| Payment card data | No Levio storage | Never | Not applicable | Must remain with approved payment provider |
| Operational security logs | No | Limited and purpose-bound | Legitimate security/operational basis, subject to legal review | Short, defined retention |
| Aggregated anonymous metrics | No, if irreversibly anonymized | May persist | Subject to legal review | Defined analytical retention |

## 8. Simulation Draft Ownership

A simulation draft is user-authored decision input before a completed analysis is saved.

Draft ownership rules:

- The text belongs to the user who authored it.
- An anonymous draft is scoped to the current device or guest session.
- A registered draft is scoped to the registered user unless explicitly created in a workspace.
- Drafts are temporary by default.
- Autosave, if implemented later, must be visible and reversible.
- Drafts must not become decision history or memory without explicit action.
- A draft containing sensitive information must not receive a longer retention period merely because autosave exists.
- Clearing a draft must remove the active copy and schedule deletion of eligible temporary copies.

Drafts may contain partial goals, options, assumptions, and clarification answers. These remain user-owned even before they form a complete `DecisionModel`.

## 9. Simulation Result Ownership

A simulation result combines user-owned input with system-derived analysis.

The user controls a saved result because it was generated for their decision and is inseparable from their personal context.

A saved result may include:

- original input;
- clarification answers selected for the decision record;
- decision summary;
- goals, options, constraints, assumptions, and gaps;
- scenarios, risks, benefits, and indicators;
- recommendation or withheld-recommendation state;
- confidence and completeness explanations;
- safety notices;
- user-visible provenance and version metadata.

System-generated content remains subject to:

- correction through updated user facts;
- export;
- deletion with the parent decision;
- retention limits;
- clear distinction between user facts and engine inferences.

Operational audit metadata may be retained separately only where required and must not preserve deleted user content unnecessarily.

## 10. Scenario and Decision History Ownership

Scenario history is not a universal activity log. It is the user-controlled history of saved decision analyses.

Rules:

- A simulation result enters history only after explicit save or a clearly enabled account-level save setting.
- Anonymous browser-local demo records are not equivalent to production user-owned history.
- Saved history belongs to the user or explicit workspace owner.
- History must preserve the model at decision time separately from later outcomes.
- Later outcomes supplied by the user are user-owned records.
- Regenerated analysis must create a new version or revision; it must not silently rewrite the historical record.
- Scenario history must not automatically become long-term memory.
- Deleting a decision must delete or detach dependent scenarios, recommendations, and derived summaries according to the deletion lifecycle.

## 11. Memory Ownership

Memory is a purpose-specific, user-controlled subset of data selected to influence future decisions.

Memory ownership follows `LEVIO_MEMORY_MODEL.md`:

- short-term memory is temporary and scoped to the active decision;
- decision memory exists only when the user saves the decision;
- project memory exists only when the user associates content with a project;
- long-term memory contains only intentionally provided or confirmed durable context;
- inferred information must not become persistent fact without user confirmation.

Memory must record:

- owner;
- purpose;
- source;
- memory type;
- consent basis;
- promotion source;
- retention and expiry;
- user visibility;
- deletion state.

Deleting source data must also delete or invalidate derived memory unless a separate justified basis and user-visible relationship exists.

## 12. Preference Ownership

Preferences are user-controlled settings, not behavioral profiles.

Preferences may include:

- interface locale;
- output language;
- accessibility choices;
- notification choices;
- explicitly confirmed risk preference;
- explicitly confirmed analysis preferences;
- project organization preferences.

Rules:

- Explicit preferences override automatic detection.
- Language alone must not imply country, culture, or risk preference.
- Preferences must be editable and resettable.
- Inferred preferences require explicit confirmation before persistent storage.
- Anonymous preferences must remain limited to low-risk browser-safe settings.
- Account preferences may synchronize only after authentication.
- Workspace defaults must not overwrite personal preferences silently.

## 13. Subscription-Related Data Boundaries

Subscription data is related to a user or workspace but is not memory and must not influence decision reasoning unless the user explicitly requests a capability affected by entitlement.

Future subscription-related records may include:

- plan identifier;
- entitlement configuration;
- usage counters;
- billing status;
- renewal or cancellation state;
- invoice references;
- workspace subscription owner;
- grace-period state.

Boundaries:

- Payment card data must not be stored by Levio.
- Subscription tier must not infer risk tolerance, wealth, profession, or decision importance.
- Subscription data must not be promoted into memory.
- Cancellation and downgrade must not remove export, deletion, or privacy rights.
- Downgrade must not silently delete decisions, projects, or memory.
- Usage counters should contain the minimum data needed for entitlement enforcement.
- Billing records may have legal retention requirements distinct from user-content deletion.
- Personal and workspace subscriptions must remain separate ownership scopes.

## 14. Non-Owned System Metadata

System metadata is created and controlled by Levio for operation, security, reliability, and compliance. It is not user-owned content, though it may still be personal data and subject to privacy rights.

Examples:

- opaque record identifiers;
- schema and contract versions;
- policy version;
- service timestamps;
- request status;
- validation outcome;
- rate-limit counters;
- abuse-prevention signals;
- authentication and security events;
- processor delivery status;
- deletion-job status;
- export-job status;
- minimal billing and entitlement state;
- aggregate reliability metrics.

System metadata rules:

- Collect only what is necessary for a defined purpose.
- Do not include raw decision content when an opaque reference is sufficient.
- Do not use operational logs as hidden decision history or memory.
- Apply independent retention periods.
- Restrict administrative access.
- Preserve legal holds only through an approved and auditable process.
- Delete or anonymize linkable metadata when its purpose expires, subject to legal obligations.

## 15. Temporary Processing Data

Temporary processing data exists only to complete an active operation.

It may include:

- current request payload;
- active clarification context;
- provisional `DecisionModel`;
- temporary assumptions and gaps;
- transient scenario candidates;
- validation errors;
- in-memory safety classification;
- retry state;
- temporary export package;
- temporary claim token.

Temporary processing rules:

- It must have a short, defined expiry.
- It must not silently become history or memory.
- It must not be used for unrelated analytics.
- It must contain the minimum required context.
- Raw microphone audio must not be stored.
- Voice transcripts must expire after active use unless the user explicitly saves relevant text.
- Failed or refused outputs must not create a hidden persistent decision record.
- Temporary export files and claim tokens must expire and become unusable.

## 16. What Can Be Stored by Default

Subject to future legal review and implementation approval, Levio may store by default only data necessary for the requested product operation or a low-risk explicit preference.

Potential default storage:

- interface locale on an anonymous device;
- essential session state;
- registered-account identifiers and security state required for authentication;
- minimum operational and security metadata;
- entitlement and usage state required to deliver the selected plan;
- temporary processing data within its defined expiry;
- account preferences intentionally selected by the user.

Default storage must not include:

- detailed decision history;
- long-term memory;
- sensitive clarification answers;
- cross-decision patterns;
- voice transcripts after active use;
- raw documents;
- inferred personal preferences.

## 17. What Requires Explicit Consent

Explicit, purpose-specific consent is required before persistent storage or reuse of:

- detailed decision and scenario history where consent is the chosen lawful basis;
- personal relationship context;
- financial context;
- health-related context;
- employer or client information;
- project documents;
- sensitive stakeholder details;
- inferred preferences;
- reusable generated summaries;
- voice transcripts after active interaction;
- cross-decision patterns and analytics;
- promotion from decision or project data into long-term memory.

Consent for one purpose must not imply consent for another purpose.

Saving a decision is not automatically consent to:

- create long-term memory;
- train or improve models;
- use the decision for analytics;
- share it with a workspace;
- retain it after account deletion.

## 18. What Must Not Be Stored

Levio must not intentionally store:

- passwords in reversible or readable form;
- authentication secrets;
- private keys or access tokens;
- payment card details;
- raw microphone audio;
- government identification numbers unless a separately approved legal requirement exists;
- unrelated browsing history;
- contact lists;
- precise location history;
- information obtained without user awareness;
- hidden psychological, political, or demographic profiles;
- unsupported inferences represented as facts;
- deleted user content beyond the approved deletion lifecycle;
- guest data without a defined expiry;
- sensitive data for undefined future use;
- raw decision content in operational logs where an opaque reference is sufficient.

High-risk secrets accidentally supplied by a user should be excluded, redacted, or quarantined where technically feasible under a separately approved implementation.

## 19. Consent Model

### 19.1 Consent Record

Future consent records should include:

```ts
type ConsentRecord = {
  consentId: string;
  ownerId: string;
  purpose: string;
  dataCategories: string[];
  status: "granted" | "withdrawn" | "expired";
  policyVersion: string;
  grantedAt?: string;
  withdrawnAt?: string;
  expiryAt?: string;
  captureContext: string;
};
```

This is a conceptual contract only.

### 19.2 Consent Requirements

- Consent must be specific, informed, freely given, and revocable where consent is the lawful basis.
- Consent must use clear purpose language.
- Optional consent must not be bundled with account creation.
- Consent choices must not be preselected.
- Withdrawing consent must be as accessible as granting it.
- Withdrawal must stop future processing for that purpose and trigger the defined deletion or restriction workflow.
- Historical proof that consent existed may be retained only as legally required and without retaining unnecessary source content.
- Product access must remain available without optional memory where the capability can function without it.

### 19.3 Consent Is Not the Only Lawful Basis

Some operational, security, contractual, or legal data may rely on another lawful basis. Future legal review must define the basis for each processing purpose.

Levio must not label all data processing as consent-based merely to simplify implementation.

## 20. Data Retention Model

Retention must be defined by category and purpose, not by one global period.

```ts
type RetentionRule = {
  category: string;
  trigger: "creation" | "last_activity" | "project_archive" | "consent_withdrawal" | "account_deletion";
  duration: string;
  action: "delete" | "anonymize" | "restrict" | "review";
  legalException?: string;
};
```

Conceptual retention behavior:

- active drafts: session-scoped or short-lived unless explicitly saved;
- guest sessions: short-lived with fixed expiry;
- temporary processing data: shortest practical duration;
- saved decisions: until user deletion, account deletion, or configured retention;
- memory: until deletion, consent withdrawal, expiry, or account deletion;
- archived projects: configurable retention with user visibility;
- operational logs: short, independently defined security/operations retention;
- billing records: retained only as required for contract, tax, or legal obligations;
- backups: deletion must propagate through an approved backup lifecycle;
- derived summaries: must not outlive source data without a separate justified basis.

Retention periods must be configurable, documented, and testable. "Indefinite" is not an acceptable default.

## 21. Export Model

Export is a user right and product-control capability, not a premium-only privilege.

### 21.1 Export Scope

A future export should include eligible user-owned and user-related data:

- profile and preferences;
- saved drafts;
- saved simulations and decisions;
- scenarios, risks, benefits, recommendations, and later outcomes;
- user-confirmed memory;
- projects and project associations;
- consent choices;
- subscription and entitlement summary;
- user-visible account activity and security information where appropriate.

### 21.2 Export Requirements

- Export must preserve stable identifiers and relationships.
- User-authored text must preserve its original language.
- Locale-independent structured values must remain distinguishable from localized labels.
- User-provided facts and engine inferences must remain distinguishable.
- Export must identify record timestamps, provenance, and relevant contract versions.
- Export must use a documented, portable format.
- Export generation must be authenticated and auditable.
- Temporary export files must expire.
- Export must not expose another user, workspace, secret, security signal, or internal proprietary implementation detail.
- A subscription downgrade or cancellation must not block export.

## 22. Deletion Model

Deletion must be a lifecycle, not a view-only action.

### 22.1 Deletion Scopes

Future deletion must support:

- active draft deletion;
- individual simulation or decision deletion;
- project deletion;
- memory item deletion;
- memory-scope deletion;
- guest data reset;
- account deletion;
- workspace-owned record deletion under future workspace rules.

### 22.2 Deletion States

```ts
type DeletionState =
  | "active"
  | "deletion_requested"
  | "restricted"
  | "deleted"
  | "anonymized"
  | "retained_legal_exception";
```

### 22.3 Deletion Requirements

- User-facing deletion must clearly state its scope.
- Deleting a parent record must address dependent records and derived summaries.
- Deleting a decision must not leave its content in memory unless the user explicitly created an independent memory item with a valid basis.
- Account deletion must revoke access and schedule deletion of eligible associated personal data.
- Consent withdrawal must trigger the relevant deletion or restriction workflow.
- Operational proof of deletion may retain opaque identifiers and status only where necessary.
- Backup copies must age out or be deleted according to an approved backup-deletion lifecycle.
- Legal exceptions must be narrow, documented, restricted, and invisible to normal product processing.

## 23. Recovery and Undo Boundaries

Recovery must not undermine deletion promises.

- Draft recovery may be available only during a short visible recovery window.
- Soft deletion may be used only with a clearly stated duration and purpose.
- During a recovery window, data must be restricted from normal processing where practical.
- After the recovery window, deletion becomes irreversible except for narrow legal backup obligations.
- Memory consent withdrawal must not be silently undone.
- Account deletion cancellation may be allowed only during a clearly disclosed pre-deletion grace period.
- Guest data lost through expiry, browser clearing, or device loss is not recoverable unless it was explicitly claimed or saved to an account.
- Levio must not claim that deleted data is immediately absent from every backup if the approved lifecycle requires bounded backup expiry.

## 24. GDPR-Oriented Principles

Future implementation must be reviewed for applicable GDPR obligations before storing production personal data.

Architecture principles:

- lawful basis per processing purpose;
- purpose limitation;
- data minimization;
- privacy by design and by default;
- transparency;
- accuracy and correction;
- storage limitation;
- security and confidentiality;
- access and portability;
- erasure;
- restriction and objection;
- consent withdrawal;
- processor and subprocessor control;
- international transfer safeguards;
- breach response;
- records of processing;
- age and sensitive-data review where applicable.

This document is not legal advice and does not establish compliance by itself.

## 25. Relationship to SimulationResponse V2

`SimulationResponse V2` is a processing and response contract, not automatically a persistent user record.

Rules:

- A V2 response remains temporary unless the user explicitly saves it or an approved account setting applies.
- Saved V2 content becomes user-controlled derived content linked to its source decision.
- `requestId`, `responseId`, contract version, and user-visible traceability may be retained with a saved result.
- Raw processing traces, rejected candidates, and hidden reasoning must not be saved as user history.
- Clarification answers remain temporary unless included in the saved decision record or separately promoted with consent.
- `failed` and `refused` responses must not create hidden persistent decision history by default.
- Safety notices and withheld-recommendation states may be saved when the user saves the result.
- Deleting a saved result must address its decision model, scenarios, recommendation, traceability, and dependent memory.

## 26. Relationship to Future Auth

Stage 2.16 Production Auth must establish identity and authorization without redefining user data ownership.

Stage 2.16 must prepare or define:

- stable registered-user principal identifiers;
- server-side ownership enforcement;
- session lifecycle and revocation;
- authorization rules for user and future workspace scopes;
- safe guest-to-account claim;
- account deletion initiation;
- security-event retention boundaries;
- account recovery that does not expose user-owned data;
- consent and policy-version association with the correct owner;
- protection against client-forged owner identifiers;
- migration boundaries for existing device-local demo data.

Stage 2.16 must not:

- treat authentication as consent for memory or history;
- automatically claim all browser-local data;
- grant workspace access to personal memory;
- make subscription status an ownership rule;
- expose production user data through the current mock auth gate.

## 27. Relationship to Future Persistence

Future persistence must implement this architecture rather than choosing ownership behavior implicitly from database tables.

Before a database is approved, a future stage must define:

- owner and access-control schemas;
- record category and sensitivity taxonomy;
- consent record schema;
- retention configuration;
- deletion dependency graph;
- export format and job lifecycle;
- guest expiry and claim workflow;
- workspace isolation;
- encryption requirements;
- audit logging;
- backup deletion;
- tests for cross-user isolation, deletion, export, and consent withdrawal.

No database provider is selected or approved by Stage 2.15.

## 28. Relationship to Subscription and Memory

- Subscription controls capabilities and limits, not ownership.
- Memory remains consent-based at every tier.
- Free-tier users retain eligible export and deletion rights.
- Downgrades must use read-only or user-choice restrictions rather than silent deletion.
- Personal memory must not become workspace memory through subscription changes.
- Memory promotion requires explicit user confirmation independently of saving a simulation.
- Subscription cancellation does not cancel ownership or privacy rights.

## 29. Required Future Tests

Future implementation must test:

- registered user cannot access another user's records;
- guest data expires as configured;
- guest claim requires control of both guest scope and account;
- guest claim cannot be replayed or applied twice;
- saving a simulation does not silently create long-term memory;
- memory promotion requires explicit confirmation;
- subscription downgrade does not delete user-owned data;
- workspace membership does not expose personal memory;
- export preserves relationships and excludes other users' data;
- deletion removes dependent user content;
- consent withdrawal stops future processing and triggers lifecycle actions;
- deleted content is absent from normal processing;
- backup deletion follows the documented lifecycle;
- client-forged owner identifiers are rejected;
- failed and refused V2 responses do not create hidden history;
- original content language is preserved in export.

## 30. Current Implementation Boundary

Stage 2.15 creates this architecture specification only.

It does not:

- implement Production Auth;
- create or connect a database;
- implement user-owned persistence;
- add consent, export, deletion, or recovery UI;
- install dependencies;
- connect OpenAI or another AI provider;
- implement payments or subscriptions;
- change `SimulationResponse V2`;
- change the current `SimulationResponse`;
- change UI, homepage, dashboard, simulator, API routes, product logic, or localStorage behavior.
