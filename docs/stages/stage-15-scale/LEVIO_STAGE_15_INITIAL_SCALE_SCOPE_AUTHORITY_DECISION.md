# LEVIO STAGE 15 INITIAL SCALE SCOPE AND AUTHORITY DECISION

Date: 23 August 2026, Europe/Madrid.

Status: Owner-approved bounded Stage 15 scope-and-authority decision.

Decision ID: `stage-15-initial-scale-scope-authority.1`.

Baseline: `76748c2e56789d450f1fc4ac71f7e79525ba623a`.

## Purpose and Boundary

This record persists the owner-approved initial Scale scope classification for
S15-P21 through S15-P25 and creates the minimum authority register required to
advance S15-P12 and S15-P29 without inventing personal assignments.

It applies the existing rules in:

- `LEVIO_PROJECT_CONSTITUTION.md`;
- Stage 15.1 Scale Scope & Entry Lock;
- Stage 15.2 Scale Preconditions & Evidence Inventory;
- Stage 15.3 Scale Readiness Evidence Validation;
- Stage 15.4 Scale Readiness Evidence Assessment;
- Stage 15.5 Scale Blocker Resolution Framework;
- `canonical-levio-integration-readiness.1` and
  `stage-9-levio-integration-readiness-rebaseline.1` for the S15-P25
  dependency only.

This decision does not execute Scale, Production Release, or Commercial
Launch. It does not activate accounts, persistence, billing, external
measurement providers, or a public production surface. It does not change
Stage 9, restart Position 5+, or change Terra configuration.

## Owner-Approved Initial Scale Scope

| ID | Owner-approved scope literal | Canonical application | Current status |
| --- | --- | --- | --- |
| S15-P21 | `EXCLUDED_FROM_INITIAL_SCALE_SCOPE` | Initial Scale does not depend on production accounts or persistent user state. This record is the required approved scope exclusion. | `VERIFIED` |
| S15-P22 | `STATELESS_INITIAL_SCALE_SCOPE` | Initial Scale remains stateless within existing privacy and data boundaries. Existing user-data-control implementations remain intact but are not Scale dependencies. | `VERIFIED` |
| S15-P23 | `EXCLUDED_FROM_INITIAL_SCALE_SCOPE` | Billing, paid subscriptions, commercial charging, and tax/payment execution are excluded. Commercial activation requires separate approval. | `VERIFIED` |
| S15-P24 | `EXTERNAL_MEASUREMENT_PROVIDERS_EXCLUDED` | Initial Scale excludes external analytics and measurement providers. Existing deterministic/internal evidence may remain only when it creates no external-provider dependency or new privacy scope. | `VERIFIED` |
| S15-P25 | `REAL_AI_INCLUDED_AS_APPROVED_SCALE_DEPENDENCY` | Real AI is included using the Stage 9 `STAGE9_QUALIFIED` integration-readiness evidence and selected provider `openai / gpt-5.6-terra`. Stage 15 operational rollback and scale-cost dependencies remain unresolved. | `PARTIALLY VERIFIED` |

Historical provider qualification
`QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD` remains diagnostic only under
`stage-9-levio-integration-readiness-rebaseline.1`. The provider campaign
remains `STOPPED_BY_OWNER_REBASELINE_EVIDENCE_RETAINED`, and Position 5+
remains `NOT_AUTHORIZED_OWNER_REBASELINE`.

## Authority Principle

Final release, rollback, and stop authority belongs to the canonical Project
Owner until a separate explicit delegation is approved. This final authority
does not assign the Project Owner to any operational role.

Operational roles remain distinct from final approval authority. Where no
person is identified by canonical repository evidence, the assignment state is
`OWNER_ASSIGNMENT_REQUIRED`.

## Minimum Owner and Authority Register

| Role | Authority scope | Escalation path | Primary owner | Backup owner | Acceptance requirement |
| --- | --- | --- | --- | --- | --- |
| Product operational owner | Own the bounded product scope and product-truth constraints for Stage 15 operations; cannot authorize Scale execution. | Canonical Project Owner for final scope or execution decisions. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Deployment operational owner | Own deployment coordination, environment readiness, and deployment evidence; cannot authorize release alone. | Rollback/stop operational owners, then canonical Project Owner. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Support operational owner | Own support boundary, routing, volume assumptions, and escalation evidence. | Incident operational owner, then canonical Project Owner for final decisions. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Legal/trust operational owner | Own routing and acceptance evidence for legal/trust scope; cannot fabricate legal approval. | Canonical Project Owner; external legal approval remains separate where required. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Abuse operational owner | Own abuse-boundary operations and escalation evidence without weakening safety rules. | Incident and stop/pause operational owners, then canonical Project Owner. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Incident operational owner | Own incident classification, communication routing, and recovery coordination evidence. | Rollback and stop/pause operational owners, then canonical Project Owner. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Rollback operational owner | Own rollback execution coordination and rollback evidence; final rollback approval remains with the canonical Project Owner. | Canonical Project Owner. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Stop/pause operational owner | Own stop/pause trigger monitoring and escalation; final stop authority remains with the canonical Project Owner. | Canonical Project Owner. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` | Explicit role acceptance required. |
| Canonical Project Owner / final release, rollback, and stop authority | Approve release scope, rollback triggers, stop conditions, and scope constraints. This record does not approve execution. | Final authority until separately delegated. | `OWNER_ASSIGNMENT_REQUIRED` | `OWNER_ASSIGNMENT_REQUIRED` through separate delegation | Explicit assignment and acceptance evidence required. |

## S15-P12 and S15-P29 Recomputed State

| ID | Before | After | Result | Remaining gap |
| --- | --- | --- | --- | --- |
| S15-P12 | `NOT VERIFIED` | `PARTIALLY VERIFIED` | Required operational roles, authority scopes, escalation paths, primary/backup requirements, and acceptance requirements are now canonical. | Concrete primary and backup assignments plus acceptance evidence remain absent for every operational role. |
| S15-P29 | `NOT VERIFIED` | `PARTIALLY VERIFIED` | The canonical Project Owner is fixed as final release/rollback/stop authority until separate delegation; final authority scope and escalation destination are defined. | Concrete primary assignment, backup/delegation assignment, and acceptance evidence remain absent. |

Neither prerequisite is `VERIFIED`. Stage 15.5 requires complete assignment
evidence and does not permit implicit owners.

## Stage 15 Bounded Recomputation

All prerequisites outside S15-P12, S15-P29, and S15-P21 through S15-P25 retain
their Stage 15.4 statuses.

Target deltas:

- S15-P21 through S15-P24: `PARTIALLY VERIFIED` -> `VERIFIED`;
- S15-P25: remains `PARTIALLY VERIFIED`;
- S15-P12 and S15-P29: `NOT VERIFIED` -> `PARTIALLY VERIFIED`.

Current aggregate:

- `VERIFIED`: 11;
- `PARTIALLY VERIFIED`: 7;
- `NOT VERIFIED`: 12;
- unresolved blockers: 19;
- Stage 15 verdict: `NOT READY`.

## Next Canonical Action

`OWNER_ASSIGNMENTS_REQUIRED`

Required assignments:

- Product operational owner — primary owner required / backup owner required;
- Deployment operational owner — primary owner required / backup owner required;
- Support operational owner — primary owner required / backup owner required;
- Legal/trust operational owner — primary owner required / backup owner required;
- Abuse operational owner — primary owner required / backup owner required;
- Incident operational owner — primary owner required / backup owner required;
- Rollback operational owner — primary owner required / backup owner required;
- Stop/pause operational owner — primary owner required / backup owner required;
- Canonical Project Owner / final release, rollback, and stop authority —
  primary owner required / backup or delegated owner required.

No later Stage 15 blocker-resolution group is opened by this record.
