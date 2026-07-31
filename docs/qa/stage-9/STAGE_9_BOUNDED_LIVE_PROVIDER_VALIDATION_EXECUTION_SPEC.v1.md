# Stage 9 Bounded Live-Provider Validation Execution Specification v1

Status: `EXECUTABLE_CONTRACT_READY_PENDING_LIVE_PROVIDER_EXECUTION`

This is an offline executable contract. It does not execute the provider,
access a credential, open runtime, or claim live validation evidence.

## Controlling files and precedence

Fail closed on any conflict. Precedence is:

1. `STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_AUTHORIZATION_DECISION.v1.md` for
   owner authority and consumption;
2. `STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_EXECUTION_MANIFEST.v1.json` for
   exact machine limits, paths, schema, and verdict rules;
3. this specification for execution procedure and interpretation;
4. the committed bounded runtime-readiness preparation specification, manifest,
   and result as immutable source evidence;
5. hash-bound adapter, fixture, Decision Engine, route, and canonical decision
   sources as implementation facts only.

No prompt or operator assumption may override these files.

## Exact execution scope

Provider is `OpenAI Responses API`; exact model is `gpt-5.6-terra`; capability
is `candidate_risk_signals_v1`; the only fixture is `S9-EVAL-001` / `EVAL-001`,
input hash `b6798ac3fc7aba896e7d8706de66ecc0c29142363aee9af26f6a1acf644a6dfd`.
The run ID is `S9-BLPV-RUN-001` and only one invocation is allowed.

The maximum is two provider requests: request 1 counts input tokens and request
2 generates the strict structured response. Retry count is exactly `0`; no
fallback model or extra request is permitted. Timeouts are `5000` ms for input
counting, `30000` ms for generation, and `35000` ms overall.

Limits derived unchanged from the committed adapter contract are: maximum
`16000` serialized local payload characters, `3000` input tokens, `1200` output
tokens, and `4200` total tokens. The explicit output limit is therefore `1200`.
Maximum cost is `$0.03`. Cost is calculated from observed generation usage at
`$2.50` per million input tokens plus `$15.00` per million output tokens. The
adapter's worst allowed token budget is `$0.0255`, below the ceiling. Unknown or
unprovable actual cost is `null` and forces `FAIL`; it is never normalized to
zero after a provider request.

## Credential and network policy

Credential access occurs only inside the existing server-only adapter through
the approved project environment mechanism, after all non-secret preflight
passes. The execution harness must not read, copy, print, log, persist, hash, or
inspect the credential value. Evidence records only `credential_available` and
logical `api_key_access_count` (`0` before adapter invocation, `1` after it).

The only network host is `api.openai.com` over TLS port `443`. The only allowed
methods and paths are `POST /v1/responses/input_tokens` and
`POST /v1/responses`. Redirects, proxies, telemetry, package registries, web
browsing, and every other destination are denied. A forwarding fetch guard must
count requests and reject non-allowlisted host/method/path combinations without
logging headers or bodies. Network count equals attempted allowlisted HTTP
requests and must not exceed two.

## Adapter and Decision Engine path

The live call must invoke only
`executeOpenAISyntheticCandidateRiskSignalsManually()` from the existing
server-only adapter. No direct SDK call, replacement transport, parallel
provider implementation, copied schema, or adapter bypass is allowed. The
adapter must retain `store:false`, `tools:[]`, streaming false, background
false, strict schema, reasoning effort low, and `maxRetries:0`.

Because every public/runtime boundary remains `CLOSED`, provider material must
not be connected to the product Decision Engine. The canonical Decision Engine
path is used only through its existing deterministic
`quality:simulation-pipeline-runner` integrity gate before final evidence; its
source hash is bound by the manifest. Evidence must record
`INTEGRITY_GATE_ONLY_NO_PROVIDER_COMPOSITION`, the gate result, and
`provider_material_composed:false`. This proves the canonical path remains
available and unchanged without opening the pre/post-provider boundaries.

## Fixture, privacy, and redaction

The fixture is loaded from the committed fixture module and its canonical input
is hash-checked before credential access. No fixture content is copied into
evidence. Real user data, saved simulations, drafts, accounts, sessions,
production records, personal data, auth data, and Supabase data are prohibited.

Evidence must contain only schema-approved fields. It must exclude the API key,
secret placeholders, environment values, request/response IDs, headers, raw
prompt/instructions/input/output, provider bodies, personal data, chain of
thought, absolute paths, and wall-clock timestamps. The runner performs a
secret-key-name scan and secret-like-value scan before staging; any match is a
terminal `FAIL` and the secret must not be reproduced in output.

## Exact live-evidence outputs and write allowlist

The only repository files a future execution may create are:

1. `docs/qa/stage-9/live-evidence/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_EVIDENCE.v1.json`
2. `docs/qa/stage-9/results/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_RESULT.v1.json`

These two paths are the complete runtime-evidence write and staging allowlist.
No generator, runner, log, snapshot, fixture, status document, source file, or
temporary repository file may be created or modified. Temporary orchestration,
if required, must remain outside the repository and be removed after use.

## Evidence schema

The manifest defines the complete machine schema. The evidence artifact has
exact top-level objects for identity/authorization, configuration, execution,
request observations, validation, usage/cost, privacy/redaction, and final
repository state. The result artifact binds the evidence hash and records only
the terminal verdict and gate/repository checks. Unknown fields are forbidden.

Request observations contain no payload: only index, operation, attempted,
accepted, normalized outcome/error category, and elapsed milliseconds. Usage is
recorded only when returned by the provider. `actual_cost_usd` is a number only
when calculable from observed usage; otherwise `null`.

## Stop and error rules

Stop before credential access for repository/hash/fixture/configuration or
closed-state mismatch. Stop before request 2 if request 1 fails, input tokens
exceed `3000`, worst-case cost cannot remain within `$0.03`, or the remaining
overall timeout is insufficient. Stop immediately on credential exposure,
personal-data detection, network allowlist violation, tool/retry/storage change,
unknown request count, request count above two, cost above/unknown after a
request, timeout, refusal, incomplete response, provider error, invalid JSON,
schema/grounding/safety/semantic failure, adapter failure, Decision Engine
integrity failure, runtime leakage, or evidence/redaction failure.

Provider errors retain the adapter's normalized category. Schema failure is
`provider_schema_invalid`; grounding/safety/semantic failure retains the exact
validator category. Adapter or deterministic Decision Engine integrity failure
is terminal and never converted to `PASS`. No remediation or second execution
is allowed.

## PASS, FAIL, and ABORTED

`PASS` requires consumed one-run authorization, exactly one adapter invocation,
one or two allowlisted requests within the ceiling, a completed strict response,
valid schema/grounding/safety/semantics, observed usage and calculable cost at or
below `$0.03`, zero retries, `store:false`, no tools, Decision Engine integrity
PASS without provider composition, complete redacted evidence, unchanged route,
`mockOnly=true`, and all 11 boundaries `CLOSED`.

`FAIL` applies after a provider request for any provider, usage/cost, schema,
adapter, Decision Engine, privacy, evidence, limit, or closed-state failure. It
also applies after credential access when required evidence cannot be completed.

`ABORTED` applies only before the first provider request. Authorization remains
`UNCONSUMED`; request/network/cost counts are zero. An abort before credential
access creates no repository artifact. An abort after credential-availability
checking creates both allowlisted artifacts with redacted boolean evidence.

## Evidence finalization and repository checks

After a provider attempt, create both evidence files once from observed values,
then disable the manual adapter switch and remove the credential from the
process environment. Run `quality:simulation-pipeline-runner`, then
`quality:stage-9-bounded-live-provider-validation-contract`, its embedded
negative self-tests, `git diff --check`, and `git diff --cached --check`.
Confirm only the two evidence files changed, route and adapter hashes match,
`mockOnly=true`, Stage 9 remains `In Progress`, release remains `NOT_DECLARED`,
and all 11 boundaries remain `CLOSED`.

Stage exactly the two evidence files only after all applicable checks. Do not
commit or push during the future execution task. Provider responses need not be
byte-identical and a second live execution is forbidden.
