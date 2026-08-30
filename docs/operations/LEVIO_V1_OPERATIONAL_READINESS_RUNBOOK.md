# Levio V1 Operational Readiness Runbook

Status: `PARTIAL`
Assessment date: `2026-08-30`
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
- Production deployment: `dpl_2KvDxyxQUTGLtZcZaKCPdSLWewia`, state `READY`,
  branch `main`, commit
  `21a451b910b9bec88cde7e0c72c5d5bde9373e0b`, ready at
  `2026-08-27 19:24:07.877 UTC`.
- `https://levio.es`: HTTP `200`, served by Vercel.
- Previous production deployment:
  `dpl_3nZq2g6pLhkhxodiXE8BZk5KpmHy`, state `READY`, commit
  `ce1f42430056564ea4e20218039e20f688353fb4`; this was the approved
  source-recovery state exercised in the controlled drill below.
- The authenticated Vercel UI exposes deployment actions, but `Instant
  Rollback` is disabled for the observed current deployment. Current Vercel
  documentation limits rollback to a specific older deployment to Pro or
  Enterprise; the observed project is on Hobby.
- The controlled production recovery drill below was explicitly authorized by
  the Project Owner because no isolated preview/non-production target was
  available for equivalent proof.
- Vercel runtime logs and error views are accessible. No current-deployment
  error or fatal event was returned for the observed 24-hour window. This does
  not prove that alerts are configured.
- A focused monitoring review on `2026-08-29` confirmed that the Vercel Hobby
  account has Web and Email notifications enabled and that `Deployment
  Failures` is enabled for both destinations. The selected owner-account email
  is intentionally masked in repository evidence. Vercel project anomaly
  Alerts are not available on the current Hobby plan: the authenticated Alerts
  page exposes only an upgrade action. No Vercel-native recurring synthetic
  availability check for `levio.es` was evidenced.
- Supabase project: `levio-dev` (`whbabqpildzfwzcksudg`), region
  `eu-central-1`, state `ACTIVE_HEALTHY`, Free plan.
- Supabase API, Auth, and Postgres logs are accessible. No configured alert or
  backup evidence was found.
- The `2026-08-29` Supabase review confirmed that the Free project exposes
  Observability health/usage views and product-specific logs. Log Drains, which
  could forward these events to an external alerting system, require a paid
  add-on on a Pro, Team, or Enterprise plan. No active database/API/Auth alert
  destination or delivery test was evidenced on the current Free project.
- On `2026-08-30`, the Project Owner approved a native-only monitoring
  architecture: Vercel native monitoring/alerts plus Supabase native
  monitoring/alerts, routed to the sole Project Owner. Third-party monitoring
  SaaS is not an approved V1 closure path. Current official platform
  documentation identifies native alert-delivery gaps described below; a paid
  plan upgrade alone does not close those gaps or substitute for a delivery
  test.
- The production homepage returned HTTP `200` on `2026-08-30`; its `Confianza`
  footer exposes the visible `Contacto` link with
  `mailto:hola@levio.es`. `/privacy-policy` and `/terms` also returned HTTP
  `200`; they do not publish a separate or conflicting contact address.
- The canonical V1 support, incident, and abuse intake route is
  `hola@levio.es` -> Zoho Mail -> sole Project Owner. The first controlled send
  at `2026-08-30 14:35:05 UTC` exposed a real `550 5.1.1 User does not exist`
  defect. The Project Owner created the `hola@levio.es` Zoho alias and routed it
  to the existing sole-owner mailbox. A subsequent external Gmail delivery
  test passed: Zoho received the message, the Project Owner could read it on
  the existing iPhone at approximately `2026-08-30 16:59` local time, and no
  bounce occurred. Existing owner-device evidence separately verifies the
  general Zoho incoming-mail -> iPhone push path. The prior `550` defect is
  resolved; support, incident, and abuse routes are verified.

## Controlled production recovery drill evidence

The Project Owner performed the authorized drill against Vercel project
`simulador-de-decisiones` on `2026-08-27`. The starting deployment was
`dpl_4hrfmg9hEXvQYZAGi2MB8PLPxAgk`, commit
`34b8bf8f2782b7b203dc78f411b13633a160b562`, state `READY`, with
`https://levio.es`, `/privacy-policy`, and `/terms` returning HTTP `200`.

- Project pause succeeded through the authenticated Project Owner Dashboard at
  `2026-08-27 19:12:52.115 UTC`. Three bounded checks at
  `19:13:04`, `19:13:04`, and `19:13:05 UTC` each returned HTTP `503` for
  `https://levio.es/`.
- The first automated resume interaction selected an ambiguous duplicate UI
  locator and caused no mutation. Project state was rechecked as paused, and
  the single permitted exact-control retry resumed the project at
  `2026-08-27 19:13:29.979 UTC`. The first observed recovered request returned
  HTTP `200` at `19:13:42 UTC`, about 12 seconds after resume and about 50
  seconds after the recorded pause update. `/privacy-policy` and `/terms` also
  returned HTTP `200`; the active deployment remained `READY` with the correct
  `levio.es` alias.
- The approved known-good source target was
  `f74e64267a9aaed50906b4897d5fcb39267bf16c`. Its only difference from the
  starting tree was this operational runbook, so it required no database,
  schema, Supabase, Auth, environment, credential, persisted-data, or Real AI
  change.
- History-preserving recovery commit
  `ce1f42430056564ea4e20218039e20f688353fb4` produced deployment
  `dpl_3nZq2g6pLhkhxodiXE8BZk5KpmHy`, which became `READY`, owned the
  `levio.es` alias, and returned HTTP `200` for `/`, `/privacy-policy`, and
  `/terms` at `2026-08-27 19:20:52 UTC`. No runtime error cluster was found.
- History-preserving restoration commit
  `21a451b910b9bec88cde7e0c72c5d5bde9373e0b` returned the source tree to the
  original approved state and produced deployment
  `dpl_2KvDxyxQUTGLtZcZaKCPdSLWewia`. It became `READY` with the `levio.es`
  alias; `/`, `/privacy-policy`, and `/terms` returned HTTP `200` at
  `2026-08-27 19:24:36 UTC`, and no runtime error cluster was found.
- Deterministic validation passed before both production pushes. Real AI was
  `OFF`; provider generation, token-count, `/v1/responses`,
  `/v1/responses/input_tokens`, other provider, and provider transport
  operations were all `0`.
- Production impact was limited to the recorded bounded `503` pause window.
  Database, Auth, DNS, environment, and production-data mutations were `0`;
  production data impact was `NONE`.

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
| Abuse handling | `VERIFIED` | The canonical public mailbox, external delivery, Zoho receipt, sole-owner mobile access, bounded repository rate limiting, and abuse triage procedure are verified. |
| Rollback procedure | `VERIFIED` | The bounded procedure is defined below. |
| Rollback capability | `VERIFIED` | The Project Owner exercised the approved history-preserving source-recovery path to a compatible known-good tree, validated and deployed it, verified production HTTP, and restored the original approved source state. |
| Emergency stop | `VERIFIED` | The Project Owner exercised project pause/resume permission; bounded checks observed HTTP `503` while paused and HTTP `200` after resume, with data unaffected. |
| Monitoring | `PARTIALLY VERIFIED` | The approved architecture is Vercel native plus Supabase native. Current log/observability views and Vercel deployment-failure routing are verified; Vercel-native synthetic availability detection and Supabase-native active DB/API/Auth alerting are not evidenced. |
| Alerts | `PARTIALLY VERIFIED` | Vercel Web and Email plus the Deployment Failures category are enabled. Vercel anomaly alerts require Observability Plus; Supabase native active DB/API/Auth alert delivery is not documented on current paid tiers. No launch-critical alert has a dated generated-and-received delivery test. |
| Backup | `EXTERNAL ACTION REQUIRED` | Supabase is on Free; scheduled platform backups are not included, and no controlled off-site dump process was evidenced. |
| Restore verification | `NOT VERIFIED` | No dated non-production restore drill and integrity record exists. |
| Support path | `VERIFIED` | `hola@levio.es` is a visible production mailto route; a post-fix external test was accepted by Zoho and received and read by the sole Project Owner on the existing mobile path. |
| Incident path | `VERIFIED` | The same verified canonical mailbox accepts incident intake, and the Project Owner owns incident command under the P0-P2 process below. A separate incident platform or second responder is not required for V1. |
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
4. Recheck project plan and action availability. On the observed Hobby project,
   `Instant Rollback` is disabled; do not treat the generic Dashboard, API, or
   `vercel rollback <deployment-id-or-url>` documentation as entitlement. If a
   project-specific rollback action is enabled and authorized, use it. If it is
   unavailable, use the separately approved source recovery path: revert the
   faulty Git change without rewriting history, run deterministic validation,
   and publish the resulting approved `main` commit through the normal Git
   deployment path.
5. Verify the rollback deployment is `READY`, owns the intended production
   alias, serves `levio.es`, and has no new fatal/runtime error pattern.
6. Record the result, residual data risk, follow-up owner, and closure decision.

Instant Rollback remains unavailable on the observed Hobby plan. The approved
source-recovery path and project write permission were verified by the dated
controlled production drill recorded above.

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
GO/NO-GO approval and verify the active deployment and domain afterward. The
documented endpoint is `POST /v1/projects/{projectId}/pause`; its existence does
not prove permission for an arbitrary project. Resume uses
`POST /v1/projects/{projectId}/unpause`. Permission for both controls on the
observed project was verified by the dated controlled drill above.

## Incident procedure

Classify incidents as:

- `P0`: service unavailable, critical security or data-isolation failure,
  unauthorized provider activity, or material data loss.
- `P1`: a major production function is broken, persistent Auth/persistence
  failure exists, or a severe release defect has no safe workaround.
- `P2`: degraded or non-critical behavior with a safe workaround and no
  confirmed critical exposure.

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

### Canonical V1 route and ownership

The single canonical V1 intake route is:

```text
user or reporter
-> public Contacto mailto:hola@levio.es
-> Zoho Mail
-> sole Project Owner
-> classification, response, remediation, and closure
```

The sole Project Owner is Support Owner, Incident Owner, Incident Commander,
and Abuse Handling Owner. A second responder, support team, incident team,
abuse team, ticketing service, or separate mailbox is not required for V1.
Recommended subject prefixes are `[SUPPORT]`, `[INCIDENT]`, and `[ABUSE]`, but
the owner must classify ordinary messages without a prefix.

### Support triage

For support intake, the Project Owner must record the received time, affected
surface, concise problem statement, reproducibility, severity if operational,
action taken, response, and disposition. The owner diagnoses the bounded
product surface, provides a safe workaround when available, remediates and
validates a defect when required, and responds or closes the request.

### Incident intake

An incident report received through the same mailbox is classified `P0`, `P1`,
or `P2` under the incident procedure above. The Project Owner inspects current
production evidence, performs emergency stop or rollback when required,
remediates, runs the appropriate deterministic validation, redeploys, verifies
recovery, responds to the reporter when appropriate, and records closure.

### Abuse intake

An abuse report received through the same mailbox is classified `ABUSE`. The
Project Owner preserves only relevant sanitized evidence, assesses the report
against current product, account, and rate-limit controls, uses only a
technically available and authorized restriction or stop control, and escalates
to product, security, or legal review when necessary before recording the
outcome.

Current technical controls are bounded: the public simulation API validates
content type and payload size, limits input length, and applies a per-source
in-memory limit of 12 requests per 60 seconds with HTTP `429` and
`Retry-After`; the Project Owner also has verified Vercel project pause/resume
and history-preserving source recovery authority. This does not constitute an
automated moderation system, durable account-level abuse block, or guaranteed
attribution capability, and none is promised.

Intake records should contain contact details only when necessary, a concise
description, timestamps, affected surface, severity, and disposition. Never
request passwords, OTPs, access tokens, service-role credentials, API keys,
database credentials, raw private decision content, or unrelated personal data
by email.

### Delivery evidence

- External sender class: independent non-Levio Gmail account; private address
  omitted from repository evidence.
- Destination: `hola@levio.es`.
- Body: controlled operational route test; no secrets or user data.
- Initial defect: the send accepted by Gmail at `2026-08-30 14:35:05 UTC`
  subsequently returned `550 5.1.1 User does not exist`.
- Remediation: the Project Owner created the `hola@levio.es` Zoho alias with
  destination set to the existing sole Project Owner mailbox.
- Post-remediation external delivery test: `PASS`.
- Zoho acceptance and receipt: `PASS`.
- Sole Project Owner receipt and readability: `PASS`.
- Mobile access: `PASS`; the message was readable on the Project Owner's
  existing iPhone at approximately `2026-08-30 16:59` local time. The general
  Zoho incoming-mail -> iPhone push path was verified separately.
- Post-remediation bounce: `NONE`.
- Resolution: the previous `550` defect is resolved. Support, incident, and
  abuse routes are `VERIFIED`; sole-owner routing is preserved and no second
  responder is required for V1.

## Monitoring and alerts

### Approved native production monitoring strategy

The Project Owner approved this V1 target architecture on `2026-08-30`:

```text
Vercel native monitoring / alerts
+ Supabase native monitoring / alerts
-> sole Project Owner Web / Email notification channel
```

No third-party uptime or observability SaaS is required or approved by this
strategy. A platform Marketplace integration remains a third-party service and
is not treated as native merely because it can be installed from a platform
dashboard.

Vercel's target paid capability is a Pro or Enterprise team with Observability
Plus and Alerts/Alert Rules enabled. It supplies error and usage anomaly
detection, configurable project/metric/status/route rules, Email and Vercel
notification delivery, and 30-day runtime-log retention with up to 14
consecutive days queryable at once. Error anomaly detection is based on
traffic and abnormal 5xx rates; it is not a recurring synthetic request and
does not prove detection when the application or domain serves no traffic or
no response. Vercel Checks validate deployments and do not establish a native
continuous production uptime monitor. This is a `NATIVE PLATFORM GAP` for
complete `levio.es` availability detection under the approved architecture.

Supabase's native Reports and Logs cover Database, API/PostgREST, Auth,
Storage, Realtime, and Edge Functions. Pro extends Reports history from 24
hours to 7 days; Team and Enterprise expose additional Advanced Telemetry.
Every hosted project also exposes a beta Prometheus-compatible Metrics API.
Current official documentation places alert evaluation and delivery outside
Supabase Studio: Metrics API data must be scraped by an alerting system, while
paid Log Drains forward events to another destination. Neither capability is
itself a Supabase-native alert rule and owner-notification service. Log Drains
are therefore not mandatory for the approved native-only strategy and would
not close alert delivery without a separately approved receiver. This is a
`NATIVE PLATFORM GAP` for active DB/API/Auth alert delivery.

The target coverage matrix is:

| Condition | Native platform | Required capability | Current plan state | Target paid state | Owner action | Closure evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A. Failed Vercel production deployment | Vercel | Deployment state plus critical Deployment Failure notification | Enabled on Hobby | Preserve on paid production plan | Reconfirm owner Web/Email routing after upgrade and generate a safe failed non-production deployment condition if available | Failure event timestamp, notification generated, owner receipt timestamp, latency, no production impact |
| B. Production runtime/server errors | Vercel | Observability Plus Alerts and Alert Rules for production 5xx/error anomalies; retained runtime logs for diagnosis | Logs available; anomaly Alerts plan-limited | Pro or Enterprise with Observability Plus; Alerts/Rules enabled; 30-day runtime-log retention | Upgrade/activate, scope production error rules to the project, route to owner Web/Email, run a non-destructive alert test | Rule configuration, test condition and timestamps, generated alert, owner receipt, diagnosis link |
| C. `levio.es` application availability | Vercel | Recurring production request/health evaluation that can detect no response | No native synthetic check evidenced | `NATIVE PLATFORM GAP`: paid anomaly Alerts remain traffic/error based | After upgrade, recheck the actual native product surface; if no synthetic availability control exists, return an owner architecture decision rather than silently adding a provider | Native check configuration and dated delivered test, or explicit accepted residual-gap decision |
| D. Supabase database/API problem | Supabase | Database/API Reports and logs plus active threshold/health alert delivery | Manual Reports/Logs on Free | Pro for 7-day Reports; Team/Enterprise only if Advanced Telemetry is required; native active delivery remains unproven | Upgrade the approved production project, verify paid native alert surface, configure only controls actually exposed, and test; otherwise record the native gap | Plan/capability state, rule/condition, generated alert, owner receipt and latency |
| E. Supabase Auth problem | Supabase | Auth/API error Reports and logs plus active alert delivery | Manual Auth Reports/Logs on Free | Paid Reports history improves diagnosis; native active delivery remains unproven | After upgrade, configure any factual native Auth alert exposed and test it; if none exists, return an owner architecture decision | Auth condition, configuration capture, alert timestamp, owner receipt and latency |

No paid plan, add-on, external service, endpoint, environment variable,
database/schema/Auth setting, or DNS setting was created or changed during
this strategy review.

Alert delivery evidence for this review:

- Test condition: `NONE`.
- Test time: `NONE`.
- Destination: Vercel owner Web/Email routing is configured for deployment
  failures; independent-monitor and Supabase-critical destinations are not
  configured.
- Alert generated: `NO`.
- Owner receipt: `NOT VERIFIED`.
- Latency and operational impact: `NOT APPLICABLE`; no failure was induced.

The current plans expose no safe, non-destructive native test that closes all
launch-critical paths. Intentionally failing a deployment or production
request was not authorized as monitoring evidence. Paid activation and actual
post-upgrade capability inspection remain owner actions.

At minimum, the monitoring owner must configure and evidence:

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
Control: monitoring and alerts
Why repository evidence is insufficient: configured Vercel deployment-failure
routing and manual platform views do not provide native synthetic availability,
active Supabase-critical delivery, or proof of owner receipt.

OWNER HANDOFF — VERCEL

Action: upgrade or activate the approved production Vercel plan and
Observability Plus for project `simulador-de-decisiones`.
After activation: enable and scope native Alerts/Alert Rules for production
runtime errors, preserve Deployment Failure Web/Email routing to the sole
Project Owner, recheck whether a native synthetic availability capability has
become available, and perform a non-destructive delivery test. Do not equate a
5xx anomaly rule with a no-response uptime check.
Evidence: plan and capability state, alert configuration, test timestamp,
alert generated, owner receipt timestamp, latency, and production impact.

OWNER HANDOFF — SUPABASE

Action: upgrade or activate the approved paid production capability on the
existing canonical project `whbabqpildzfwzcksudg`; do not create another
project.
After activation: verify the actual paid native DB/API/Auth monitoring and
notification surface, configure every required native alert that is factually
available, route it to the sole Project Owner, and perform a non-destructive
delivery test. If active native alert rules/delivery remain unavailable, record
`NATIVE PLATFORM GAP` and return an owner architecture decision; do not add a
third-party destination automatically.
Evidence: plan and capability state, alert configuration if available, test
timestamp, alert generated, owner receipt timestamp, latency, and production
impact.

Risk if left open: production, Auth, persistence, or unexpected provider
failures may remain undetected or may not reach the Project Owner.

CONTROL CLOSED:
Control: support path, incident path, and abuse handling
Status: `VERIFIED`.
Evidence: after the Project Owner resolved the observed `550` by creating the
`hola@levio.es` Zoho alias to the existing sole-owner mailbox, a subsequent
external Gmail test was delivered, received in Zoho, and readable by the sole
Project Owner on the existing iPhone at approximately `2026-08-30 16:59` local
time, with no bounce. The general Zoho incoming-mail -> iPhone push path was
verified separately. No second mailbox, responder, or support/incident SaaS is
required for V1.

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
