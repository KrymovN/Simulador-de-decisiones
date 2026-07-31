# Stage 9 Bounded Live-Provider Validation Authorization Decision v1

Decision state: `AUTHORIZED_FOR_ONE_BOUNDED_LIVE_PROVIDER_VALIDATION_RUN`

Authority role: `project_owner`

Owner decision date: `2026-07-31`

## Binding scope

This decision authorizes exactly one future foreground validation of the
existing server-only OpenAI candidate-risk adapter under the exact execution
specification and manifest committed with this decision. It authorizes only the
allowlisted synthetic fixture, model, two-request maximum, zero retries,
timeouts, token limits, cost ceiling, OpenAI network destinations, credential
access, and two repository evidence outputs named by the manifest.

The authorization is validation-only. It does not authorize public or
production AI, user traffic, real user data, a public API or UI, Prompt Context
or Decision Engine live composition, persistence, authentication, Supabase,
deployment, background work, adapter changes, or any runtime-boundary opening.
`/api/simulate` must remain unchanged and `mockOnly=true`.

## One-run and consumption rule

The deterministic run identifier is `S9-BLPV-RUN-001`. Authorization is
`UNCONSUMED` through repository, fixture, configuration, and credential
preflight. It becomes irrevocably `CONSUMED` at the first attempted provider
network request, whether that request succeeds, is rejected, times out, or
fails. Input-token counting is a provider request and therefore consumes the
authorization.

After consumption, only the remaining request budget inside that same
foreground run may be used. The run terminates after `PASS`, `FAIL`, an abort,
or exhaustion of any limit. Automatic or manual retry, fallback model, expanded
fixture scope, and a second execution are prohibited.

## Preflight-abort rule

An abort before the first provider request does not consume authorization. If
the abort occurs before credential access, no runtime evidence file is created.
If credential availability was checked, both approved evidence files record an
`ABORTED` result using only redacted booleans and zero request/network/cost
values. No other repository file may be written.

## Terminal rule

After a provider request has been attempted, both approved evidence files are
mandatory and the authorization state recorded in them is `CONSUMED`. `PASS`
or `FAIL` is terminal. Another live execution requires a new binding owner
decision; this decision cannot be reset, amended in place, or reused.

No result under this decision automatically changes Stage 9 from `In Progress`,
declares release readiness, changes `/api/simulate`, or opens any of the 11
runtime boundaries. A gate cannot expand this authorization.
