# Levio V1 Operational Readiness Runbook

Status: `PARTIAL`
Assessment date: `2026-08-27`
Production AI state: `OFF`
Provider operations performed during this assessment: `0`

## Purpose and evidence rules

This runbook defines the minimum deployment, rollback, emergency-stop,
incident, monitoring, backup, and restore procedures for Levio V1. A procedure
in this repository is not evidence that an external control is configured or
that a person has accepted an operational role.

Evidence is classified as:

- **Repository evidence**: committed code, configuration, tests, or procedures.
- **External infrastructure evidence**: current account or service state observed
  directly in Vercel or Supabase.
- **Owner decision**: the Project Owner explicitly approves a role and its
  authority boundary.

The assessment uses only `VERIFIED`, `PARTIALLY VERIFIED`, `NOT VERIFIED`,
`OWNER DECISION REQUIRED`, `EXTERNAL ACTION REQUIRED`, and `NOT APPLICABLE`.

## Observed production snapshot

The following external state was observed directly on `2026-08-27`. It is a
point-in-time observation and must be rechecked before every release:

- Vercel project: `simulador-de-decisiones`
  (`prj_LSBuOmbUGhefM3ySgXZeBaWj8o8x`), Hobby plan.
- Production deployment: `dpl_GFBHnkYtnNzduxfYMrLPxdbDvP5g`, state `READY`,
  branch `main`, commit
  `a6b6576a096bc9af0b8d3c9358c0a61964ac2a81`.
- `https://levio.es`: HTTP `200`, served by Vercel.
- Previous production deployment:
  `dpl_HAs3RwSvnVN5gn5MF8MNRpS3qzNE`, commit
  `f2865976c5c04e3868c8f7df059028775b710f88`; Vercel identifies it as a
  rollback candidate. It is not permanently approved as a rollback target.
- Vercel runtime logs and error views are accessible. No current-deployment
  error or fatal event was returned for the observed 24-hour window. This does
  not prove that alerts are configured.
- Supabase project: `levio-dev` (`whbabqpildzfwzcksudg`), region
  `eu-central-1`, state `ACTIVE_HEALTHY`, Free plan.
- Supabase API, Auth, and Postgres logs are accessible. No configured alert or
  backup evidence was found.
- The live footer exposes `mailto:hola@levio.es`. Delivery, intake workflow,
  and coverage were not verified.

Do not infer an owner from Git metadata, account email addresses, project
creators, or service-account membership.

## Approved solo-owner V1 operating model

Levio V1 currently operates under an explicitly approved sole-owner
operational model. All product, deployment, release, GO/NO-GO, incident,
support, abuse, monitoring, rollback, emergency-stop, backup/restore, and AI
production activation authority is held by the sole Project Owner.

| Operational role or authority | Approved V1 assignment |
| --- | --- |
| Project Owner | sole Project Owner |
| Product Owner | Project Owner |
| Deployment Owner | Project Owner |
| Release Authority | Project Owner |
| GO/NO-GO Authority | Project Owner |
| AI Production Activation Authority | Project Owner |
| Incident Owner | Project Owner |
| Incident Commander | Project Owner |
| Emergency Stop Authority | Project Owner |
| Rollback Authority | Project Owner |
| Support Owner | Project Owner |
| Abuse Handling Owner | Project Owner |
| Monitoring / Alert Owner | Project Owner |
| Backup / Restore Owner | Project Owner |

No secondary human operator, backup human operator, or delegate is required
for the approved V1 launch scope. Their absence is not a launch blocker.
Separate operational responsibilities may be delegated to other people as the
product scales, but that is future operational scaling, not a current V1
launch requirement or a staffing plan.

The sole Project Owner accepts the residual single-person operational
dependency: a prolonged period of owner unavailability may increase response
time. This is an accepted operational risk, not a zero-risk claim and not a V1
launch blocker.

The approved V1 operating concept depends on completing automated detection,
direct owner notifications, documented recovery procedures, verified
rollback/stop capability, and backup/restore capability:

```text
failure
-> automated alert
-> Project Owner receives a mobile-accessible notification
-> diagnosis
-> rollback / emergency stop if required
-> remediation
-> deterministic validation
-> redeploy
```

This assignment verifies who is responsible. It does not verify that an
external technical capability is configured or has been exercised.

## Operational readiness matrix

| Control | Status | Evidence and remaining gap |
| --- | --- | --- |
| Deployment ownership | `VERIFIED` | Explicit approved solo-owner V1 operating model assigns deployment and release authority to the Project Owner. |
| Product ownership | `VERIFIED` | Explicit approved solo-owner V1 operating model assigns product authority to the Project Owner. |
| Support ownership | `VERIFIED` | Explicit approved solo-owner V1 operating model assigns support ownership to the Project Owner. |
| Incident ownership | `VERIFIED` | Explicit approved solo-owner V1 operating model assigns incident ownership and command to the Project Owner. |
| Abuse handling | `PARTIALLY VERIFIED` | Abuse ownership and repository rate limiting are verified; the external abuse route and exercised triage path are not. |
| Rollback procedure | `VERIFIED` | The bounded procedure is defined below. |
| Rollback capability | `PARTIALLY VERIFIED` | Vercel exposes rollback candidates and rollback mechanisms; plan entitlement, operator permission, and a drill have not been verified. |
| Emergency stop | `PARTIALLY VERIFIED` | Repository AI kill-switch semantics and Vercel project-pause mechanisms exist; production configuration, permission, and a drill are unverified. |
| Monitoring | `PARTIALLY VERIFIED` | Vercel and Supabase log views are accessible; no complete availability, API, Auth, persistence, or AI-state monitor set is verified. |
| Alerts | `EXTERNAL ACTION REQUIRED` | No configured alert conditions, destinations, responders, or delivery test were evidenced. |
| Backup | `EXTERNAL ACTION REQUIRED` | Supabase is on Free; scheduled platform backups are not included, and no controlled off-site dump process was evidenced. |
| Restore verification | `NOT VERIFIED` | No dated non-production restore drill and integrity record exists. |
| Support path | `PARTIALLY VERIFIED` | The Project Owner is the responder and `hola@levio.es` is public; delivery, access, intake, and escalation are unverified. |
| Incident path | `PARTIALLY VERIFIED` | The Project Owner owns incident command and this runbook defines handling; no external incident channel/system or exercised path is evidenced. |
| GO/NO-GO authority | `VERIFIED` | Explicit approved solo-owner V1 operating model assigns GO/NO-GO authority to the Project Owner. |
| AI production activation authority | `VERIFIED` | Explicit approved solo-owner V1 operating model assigns authority to the Project Owner. Real AI remains OFF. |

The overall launch-critical verdict is `PARTIAL`. This document does not open
Production Release, Commercial Launch, or Real AI activation.

## Deployment procedure

Deployment may proceed only after the Project Owner records GO/NO-GO approval.
The deployment operator must:

1. Record the approved Git commit and confirm that it is the exact `main`
   commit intended for production.
2. Confirm the working tree is clean and the required deterministic release
   validation has passed for that commit.
3. Confirm externally, without printing secrets, that production Real AI is
   disabled. Repository fallback semantics require
   `LEVIO_REAL_AI_DEV_ENABLED` to be anything other than the exact string
   `true`; the approved production value is `false`.
4. Publish only the approved commit through the configured Git-to-Vercel path.
5. Wait for the production deployment to become `READY`. Verify its Git SHA,
   target, branch, and `levio.es` alias before treating it as released.
6. Verify `https://levio.es` returns a successful response and inspect runtime
   errors for the new deployment.
7. Record deployment ID, commit, operator, authority, timestamps, checks, and
   result in the release evidence record.

Preview readiness is not production readiness. Never promote or publish an
unidentified preview deployment.

## Rollback procedure

Rollback requires the Project Owner acting as incident and release authority.

1. Open an incident record and capture the active deployment ID, commit,
   symptom, start time, and containment decision.
2. Query current Vercel state. Select the latest approved known-good production
   deployment from current evidence; do not rely on an ID hardcoded in this
   document.
3. Record the chosen target and authority. Confirm the target was previously a
   production deployment and is compatible with the current data state.
4. Use the authorized Vercel Dashboard rollback action, documented rollback
   API, or `vercel rollback <deployment-id-or-url>`. Do not use a force push or
   rewrite Git history.
5. Verify the rollback deployment is `READY`, owns the intended production
   alias, serves `levio.es`, and has no new fatal/runtime error pattern.
6. Record the result, residual data risk, follow-up owner, and closure decision.

The observed previous deployment is only a candidate. Capability remains
`PARTIALLY VERIFIED` until an authorized operator confirms entitlement and
permission and completes a controlled drill.

## Emergency stop

### Real AI stop

Real AI must stay OFF. If provider execution is suspected:

1. Treat it as an incident and stop release activity.
2. An authorized environment operator sets
   `LEVIO_REAL_AI_DEV_ENABLED=false` in the affected production environment and
   redeploys the last approved commit, or rolls back to a known-good
   deterministic deployment.
3. Verify the deterministic response path and inspect production runtime events
   for unexpected provider attempts. Do not expose provider keys or request
   content in evidence.
4. Record the environment, deployment ID, timestamp, operator, authority, and
   verification result.

Repository logic makes the provider path opt-in only when the variable equals
the exact string `true`. That logic is repository evidence, not proof of the
current external environment value.

### Public application stop

For an immediate public stop, an authorized Vercel operator may pause the
project using the Dashboard or documented project-pause API. If safe service
can be restored faster, the authority may instead order a rollback. A pause
blocks the active production deployment and domain assignment, so it must not
be exercised against production merely as a test. Resume only on recorded
GO/NO-GO approval and verify the active deployment and domain afterward.

## Incident procedure

Classify incidents as:

- `SEV-1`: privacy/security exposure, unauthorized provider activity, material
  data loss, or production unavailable for the public path.
- `SEV-2`: major degraded function, persistent auth/persistence failures, or a
  release defect without confirmed exposure.
- `SEV-3`: limited degradation with a safe workaround.

For every incident:

1. Record severity, detected time, observable facts, affected scope, and the
   acting incident commander. Do not copy secrets or unnecessary personal
   decision content into the record.
2. Contain first: stop Real AI, pause, or roll back as the facts require.
3. Preserve deployment IDs, Git SHAs, sanitized logs, and action timestamps.
4. Verify recovery across the public path and affected Auth/data paths.
5. Record customer/support handling, follow-up owner, and authority closure.

The solo-owner model creates no response-time promise or 24/7 coverage. A
prolonged period of Project Owner unavailability is the accepted residual risk.

## Support and abuse intake

The public path currently exposes `hola@levio.es`. Before launch, an external
operator must verify delivery, access controls, retention, triage, escalation,
and direct Project Owner receipt. A distinct abuse route or explicit alias must
be approved and verified. Repository API rate limiting is a technical
mitigation, not an abuse-handling process.

Intake records should contain contact details only when necessary, a concise
description, timestamps, affected surface, severity, and disposition. Do not
request passwords, provider keys, raw private decision content, or unrelated
personal data.

## Monitoring and alerts

At minimum, the external monitoring owner must configure and evidence:

- failed and unhealthy production deployments;
- `levio.es` availability and public API 5xx/error-rate changes;
- Auth failures and persistence/Postgres error changes;
- unexpected Real AI/provider activity while production AI is OFF;
- backup failures and missed restore-verification dates.

Each alert requires a threshold, evaluation window, mobile-accessible
destination that directly notifies the Project Owner, severity, runbook link,
and a dated delivery test. Access to Vercel or Supabase log views alone is not
an alert. No second responder is required for the approved V1 scope.

## Backup and restore

The observed Supabase project is on the Free plan. Current Supabase platform
documentation limits scheduled backups to paid plans and recommends regular
off-site CLI dumps for Free projects. Database backups do not include Storage
API objects. Before launch, the owner must choose and evidence either an
approved plan with scheduled backups or a controlled recurring dump process for
the existing approved project. A new Supabase project is not implied.

The approved backup design must record the Project Owner, backup mechanism,
RPO, retention, encryption, access, off-site location, failure alert,
Storage-object treatment, and deletion-propagation policy.

A restore is verified only by a dated drill into a controlled temporary or
non-production target. The drill must record the backup source, target,
operator, timestamps, tool/version, integrity identifier, migration state, RLS
and user-isolation checks, representative counts, deletion behavior, and final
result. Never use production as a destructive restore-test target. Remove the
temporary target through an approved recoverable process after evidence is
accepted.

## Required handoffs

### Owner decisions

No operational ownership or human-staffing decision remains open for the
approved V1 scope. The sole Project Owner holds every authority listed in the
approved operating model. Choosing concrete alert thresholds, support routing,
backup RPO/retention, and restore frequency is part of completing the external
controls below, not a requirement to appoint another person.

### External actions

HANDOFF:
Control: rollback capability and emergency stop
Why repository evidence is insufficient: repository procedures cannot prove
Vercel plan entitlement, account permission, or successful operator execution.
Exact external system: Vercel project `simulador-de-decisiones`.
Exact action required: verify rollback and project-pause permission; perform a
controlled non-production rollback drill; document production pause permission
without pausing production.
Evidence required to close: dated operator, target/source deployment IDs,
permission result, successful drill checks, and approved production-stop path.
Risk if left open: a failed or harmful release may not be containable within an
accepted recovery window.

HANDOFF:
Control: monitoring and alerts
Why repository evidence is insufficient: log-view access does not prove that
continuous checks, alert conditions, destinations, or responders exist.
Exact external system: Vercel project `simulador-de-decisiones`, Supabase
project `whbabqpildzfwzcksudg`, and the approved alert delivery channel.
Exact action required: configure the minimum checks in this runbook with
accepted thresholds and direct, mobile-accessible Project Owner delivery.
Evidence required to close: configuration capture plus a dated successful test
for each condition and destination.
Risk if left open: production, Auth, persistence, or unexpected provider
failures may remain undetected or may not reach the Project Owner.

HANDOFF:
Control: support path, incident path, and abuse handling
Why repository evidence is insufficient: a public mail link and rate limiting
do not prove mail delivery, access, triage, escalation, or accountable handling.
Exact external system: `hola@levio.es` mailbox and the owner-approved incident
and abuse intake system or aliases.
Exact action required: verify delivery and access, provision accepted incident
and abuse routes, and exercise sanitized support, incident, and abuse intake
through escalation.
Evidence required to close: dated delivery/intake records, access list, routing
result, disposition, and confirmed Project Owner receipt.
Risk if left open: user or abuse reports may be lost, mishandled, or left
without accountable response.

HANDOFF:
Control: backup
Why repository evidence is insufficient: the observed Supabase Free plan has no
included scheduled backup, and the repository cannot prove an off-site dump.
Exact external system: Supabase project `whbabqpildzfwzcksudg` and the approved
encrypted off-site backup destination if dumps are selected.
Exact action required: enable and evidence the approved scheduled-backup option
or controlled recurring off-site dump process, including failure notification
and Storage-object treatment.
Evidence required to close: current configuration, successful dated backup,
integrity identifier, retention/RPO record, access controls, and alert test.
Risk if left open: production data may have no recoverable point after loss or
corruption.

HANDOFF:
Control: restore verification
Why repository evidence is insufficient: no document or account evidence shows
that a real backup has been restored and checked.
Exact external system: Supabase controlled temporary or non-production restore
target for project `whbabqpildzfwzcksudg` backup data.
Exact action required: perform the non-destructive restore drill specified in
this runbook; do not restore over production.
Evidence required to close: successful restore record, date, source and target,
integrity identifier, migrations, RLS/isolation checks, representative counts,
and accepted result.
Risk if left open: a nominal backup may be unusable or may restore an unsafe
authorization/data state during an incident.

Until these handoffs are complete, the operational readiness status remains
`PARTIAL` and the launch-critical controls are not all verified.
