# Stage 9 Release Readiness and Runtime Boundary Decision Specification v1

Status: `DECISION_CONTRACT_PREPARED_DECISION_NOT_EXECUTED`

Decision identity: `Stage 9 Release Readiness and Runtime Boundary Decision`

Decision kind: `non_remediation_release_runtime_governance_decision`

Preparation commit: `chore(stage-9): prepare release readiness runtime decision`

This contract is not remediation, `S9-FIX-10`, a new Stage, a release decision,
runtime implementation, or live-provider validation. Preparation does not
constitute owner approval and cannot change Stage 9, release, runtime, or
`/api/simulate` status.

## Independent decision axes

The decision stores four independent axes. No axis implies another:

1. remediation status — enum `COMPLETED_9_OF_9`; it is immutable and cannot be
   reopened by decision work;
2. Stage 9 completion verdict — enum `KEEP_IN_PROGRESS`, `COMPLETE`;
3. release-readiness verdict — enum `NOT_DECLARED`, `DEFERRED`,
   `LIMITED_READY`, `READY`;
4. per-boundary runtime status — enum `CLOSED`,
   `OFFLINE_PREPARATION_ALLOWED`, `BOUNDED_VALIDATION_AUTHORIZED`, `OPEN`.

The closed decision-disposition enum is:

- `DEFERRED_PENDING_RUNTIME_EVIDENCE`;
- `STAGE_COMPLETE_RELEASE_NOT_DECLARED`;
- `BOUNDED_RUNTIME_VALIDATION_AUTHORIZED`;
- `RUNTIME_BOUNDARY_CHANGE_APPROVED`;
- `BLOCKED`.

The current provable future profile is
`DEFERRED_PENDING_RUNTIME_EVIDENCE`: remediation remains
`COMPLETED_9_OF_9`, Stage 9 remains `KEEP_IN_PROGRESS`, release readiness
remains `NOT_DECLARED`, every live boundary remains `CLOSED`, and
`/api/simulate` remains `mockOnly=true`. Offline contract/gate preparation is
separately `OFFLINE_PREPARATION_ALLOWED` and is not a runtime opening.

## Source-of-truth hierarchy and authority classification

Current-state authority, highest first:

1. `PROJECT_CONTEXT.md`;
2. completed FIX09 assessment package and result;
3. `AI_REMEDIATION_REVISION_LEDGER.json` through its terminal FIX09 event;
4. a future approved decision artifact created under this contract;
5. synchronized comparator/status documents.

`AI_REMEDIATION_SEQUENCE.v1.json` and
`AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json` are frozen planning evidence. Their
stale `implementation_executed:false`, initial-candidate, and not-started fields
describe the planning snapshot and are not current-state authority. They remain
immutable in preparation and future decision work. The candidate registry and
all FIX01–09 artifacts are also immutable inputs.

The exact immutable evidence inventory is:

| Path | SHA-256 |
| --- | --- |
| `PROJECT_CONTEXT.md` | `e9c26896d29a0e6593483ed7bc7364fe5a3c25323c026cd8aee71dc04bb5f933` |
| `docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_SPEC.v1.md` | `d73817967a4552df49a80accc75e892028518884ca15dcfbe434fb15ba38f2ea` |
| `docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json` | `b7718d79bad2e9c87839b23067e4b7b176596658097424d7ad9c7760c5172228` |
| `docs/qa/remediation/stage-9/results/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_RESULT.v1.json` | `c9aea2c69e6d841241402b8391a20ff401f9521ca4e546989730954e221b744f` |
| `docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json` | `15938859a9d9abf519c26a4983495ab9d6106ff94402a2b10f802af2dd7615db` |
| `docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json` | `7748be17e5f3ead5791aea4b65fd72f98c2187db83a10bf9d172aebd61f26d64` |
| `docs/qa/remediation/stage-9/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json` | `76d19477cef3757ca7b322f7bf84dfb47031c1a75a6a9a52fa74dad294987f41` |
| `LEVIO_PROJECT_CONSTITUTION.md` | `7381da6f669dabb425530c085f6e3bd1c413d80512cb5e442d51a16e2d3ba071` |
| `docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json` | `130048eb3561a90f99ee425706dd1f6835399039f5c2413ad07f466c46c58493` |
| `docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json` | `227203913b551ceb7b7c4f6d1c7e1cc71221f7902ecd670a88fdc0197e61681e` |
| `lib/ai-provider/openai-synthetic-risk-adapter.ts` | `4450f0190219fc875669146c6bfa575882b70fe010682e437b9ab62c9f5802a6` |
| `lib/ai-provider/openai-synthetic-risk-adapter.server.ts` | `5c478f0a814b11ecfce2e9ae9eb7b7fb288560562da7ed28662d0ed1da5d2eef` |
| `app/api/simulate/route.ts` | `9b29fdbfbcb78d539abca6a9dcc9bdbfaa5b396a6d8b514d9850eb93d1c94d11` |

## Completion, readiness, and positive-decision evidence

Stage 9 `COMPLETE` requires explicit `project_owner` approval plus evidence
that the approved Production AI Integration scope is satisfied: provider
execution through the immutable Simulator → Decision Engine → Prompt Context →
AI Provider → Decision Engine → Simulator → UI architecture; controlled
provider errors; structured product output; safety, cost, privacy, quality,
observability, fallback, rollback, and relevant verification gates.

`LIMITED_READY` or `READY` requires an exact release scope, explicit owner
approval, current build/type/lint and core-flow evidence, security/privacy
review, performance/runtime QA, observability/error tracking, deployment and
environment readiness, support/incident ownership, rollback authority, and
documented or closed production blockers. Assessment PASS alone cannot produce
a positive Stage or release verdict.

Any boundary status above `CLOSED` requires its own evidence and may not open
other boundaries implicitly. `OFFLINE_PREPARATION_ALLOWED` permits only
contracts, gates, mocks, deterministic fixtures, and execution-free dry-runs.
`BOUNDED_VALIDATION_AUTHORIZED` permits only the explicitly approved validation
package. `OPEN` requires the full boundary-specific exit evidence.

## Granular runtime-boundary registry

The required stable IDs are:

1. `LIVE_OPENAI_PROVIDER_RUNTIME`;
2. `PROMPT_CONTEXT_RUNTIME`;
3. `DECISION_ENGINE_PRE_PROVIDER`;
4. `DECISION_ENGINE_POST_PROVIDER`;
5. `AI_API`;
6. `AI_UI`;
7. `PERSISTENCE_COUPLING`;
8. `SUPABASE_AUTH_EXPANSION`;
9. `LIVE_AI_OBSERVABILITY`;
10. `PRODUCTION_DEPLOYMENT`;
11. `API_SIMULATE_MOCK_ONLY`.

The current status of every registry entry is `CLOSED`; the last entry also
requires `mockOnly:true`. The current server-only adapter is a
manual-development candidate, not an open boundary.

## Existing runtime boundary

The server-only OpenAI adapter exists for `candidate_risk_signals_v1`, accepts
repository-owned `synthetic_non_personal` input only, is disabled by default,
and is manual-development-only. It has no repository callsite, route, Prompt
Context, Decision Engine, AI UI, persistence, or auth integration. Production
observability, fallback, kill-switch contract, and rollback rehearsal are
absent. `/api/simulate` remains deterministic, `simulate-api-v1-mock`, and
`mockOnly=true`. Adapter and route bytes are protected by the evidence hashes.

## Residual-risk decision schema

Every decision contains exactly, in this order:

- `HISTORICAL_REVIEW_LIMITATION`;
- `OFFLINE_EVIDENCE_BOUNDARY`;
- `RELEASE_RUNTIME_UNASSESSED`;
- `ACCEPTED_VERSION_BASELINE`.

Each entry contains `acceptance_state`, `owner_role`, impacts on Stage,
release, and runtime, `required_mitigation`, and ordered evidence references
with hashes. Acceptance-state enum: `NOT_ACCEPTED_PENDING_OWNER_DECISION`,
`ACCEPTED`, `REJECTED`. Preparation accepts none on behalf of the owner.

## Owner approval and sign-off

Authority role is exactly `project_owner`; no name, email, provider ID, or
invented identity is stored. Approval-state enum:

- `NOT_APPROVED`;
- `TEST_ONLY_APPROVED`;
- `APPROVED`;
- `REVOKED`.

A permanent deferred or positive decision requires `APPROVED`. Sign-off fields
are `authority_role`, `approval_state`, `decision_date`,
`decision_payload_sha256`, `amends_decision_id`, and `revocation_reason`.
`decision_date` is an explicit owner-supplied calendar date (`YYYY-MM-DD`) or
`null`; wall-clock timestamps are forbidden. Amendment or revocation requires a
new decision version, explicit owner approval, binding to the prior decision,
and a reason. A gate cannot create or substitute owner approval.

`TEST_ONLY_APPROVED` is accepted only by the explicit temporary-test profile,
must never appear in a permanent artifact, and is not owner approval.

## Forbidden combinations

The gate rejects:

- positive release readiness without approved owner sign-off;
- live provider above `CLOSED` while release readiness is `NOT_DECLARED`;
- provider validation/opening without a runtime evidence package;
- `mockOnly:false` without route/runtime implementation evidence;
- AI API above `CLOSED` without provider plus pre/post Decision Engine gates;
- AI UI above `CLOSED` without safe API and controlled-error evidence;
- persistence coupling without auth, consent, privacy, retention, and owner
  isolation evidence;
- Stage 9 `COMPLETE` without canonical exit evidence;
- remediation other than `COMPLETED_9_OF_9`;
- `S9-FIX-10`;
- one verdict opening every boundary;
- positive decisions based only on offline corpus assessment;
- missing or silently accepted residual risks;
- missing evidence hashes, absolute paths, timestamps, network count above
  zero in the deferred profile, or an eighth write file.

## Future live-runtime evidence contract

The future evidence package version is
`stage-9-bounded-live-runtime-readiness-evidence.1`. It is separate from this
preparation and decision. One bounded run requires explicit user/project-owner
permission, OpenAI, the exact approved model, one synthetic non-personal input,
server-only credential injection, `store:false`, no tools, automatic retries
zero, at most one execution, at most two provider requests, and a hard total
cost ceiling of `$0.03`. It aborts on cost, configuration, privacy, or contract
mismatch and must not connect route, UI, or persistence.

It records authentication/configuration, schema/model compatibility,
latency/timeout, rate-limit/error behavior, cost, privacy/redaction,
observability/log exclusion, fallback, kill switch, and rollback rehearsal.
Secrets, prompts, and raw responses are never logged. Preparation requests or
uses no API key and performs no network/provider execution.

## Decision and result artifacts

Future decision path:
`docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION.v1.json`

Version: `stage-9-release-readiness-runtime-boundary-decision.1`.

Future result path:
`docs/qa/stage-9/results/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_RESULT.v1.json`

Version: `stage-9-release-readiness-runtime-boundary-decision-result.1`.

The decision stores all four axes, boundary registry, `mockOnly`, residual
risks, evidence hashes, sign-off, gate results, provider/network count and cost,
rollback/kill-switch conditions, forbidden-combination validation, and next
action. The result binds the decision hash, exact diff, preservation claims,
gate profile, deterministic serialization, and synchronized status update.

## Exact preparation write set

1. `docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_SPEC.v1.md`
2. `scripts/stage-9-release-readiness-runtime-boundary-decision-quality.mjs`
3. `package.json`
4. `LEVIO_IMPLEMENTATION_PLAN.md`
5. `CURRENT_STAGE.md`
6. `LEVIO_CURRENT_STATE.md`
7. `LEVIO_PROJECT_PROGRESS.md`

## Exact future decision write set

1. `docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION.v1.json`
2. `docs/qa/stage-9/results/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_RESULT.v1.json`
3. `PROJECT_CONTEXT.md`
4. `LEVIO_IMPLEMENTATION_PLAN.md`
5. `CURRENT_STAGE.md`
6. `LEVIO_CURRENT_STATE.md`
7. `LEVIO_PROJECT_PROGRESS.md`

Ledger, sequence, graph, registry, FIX01–09 artifacts, fixtures, adapter, route,
runtime/API/UI/persistence code, this specification, gate, and package are
forbidden in the future decision diff.

## Status-document boundaries

Preparation adds only one new leading current-state section after the title in
each comparator/status document. Historical sections remain untouched. The new
sections record remediation `9/9`, FIX09 PASS, Stage 9 `In Progress`, release
`NOT_DECLARED`, runtime `CLOSED`, `mockOnly=true`, decision contract prepared,
no `S9-FIX-10`, and the exact next decision identity.

Future decision changes only the leading current-state decision section of the
four comparator documents and the exact first Stage 9 remediation section in
`PROJECT_CONTEXT.md`.

## Mandatory gate union

The dedicated command is
`quality:stage-9-release-readiness-runtime-boundary-decision`. Its prospective
profile validates the exact seven-file preparation, evidence hashes, frozen
planning classification, synchronized status, deferred profile, absent decision
artifacts, protected runtime/source bytes, deterministic self-tests, and network
zero. Its strict post-decision profile validates the exact future seven-file
diff, owner approval, evidence, and status combinations. The explicit temporary
profile permits only marked test-only sign-off.

The temporary union covers: dedicated gate; FIX09 assessment/result hash and
schema validation; remediation-ledger terminal-event integrity; exact future
allowlist; status synchronization; evidence binding; forbidden combinations;
runtime/source protection; network/provider zero; deterministic repeat; and
`git diff --check`. It does not regenerate the corpus or reconciliation and
does not run lint, build, browser, or UI tests.

## Determinism, atomicity, and rollback

Artifacts use stable ordering, repository-relative paths, `generated_at:null`,
no UUID, no absolute path, and no wall-clock timestamp. A real decision is one
atomic exact-seven-file commit after complete gates and owner approval.

Preparation is one atomic exact-seven-file commit. A temporary decision dry-run
is destroyed after two byte-identical PASS runs. Any requirement for an eighth
preparation file aborts and restores the baseline. A future decision rollback
reverts only its exact decision commit; all runtime boundaries remain closed
unless a separately approved runtime implementation and rollback contract says
otherwise.

## Next canonical action

After preparation, the next action is one bounded runtime-readiness evidence
preparation step. It requires a separate contract and explicit permission
before any live call. Stage 9 remains `In Progress`, remediation remains `9/9`,
release readiness remains `NOT_DECLARED`, every runtime boundary remains
`CLOSED`, `/api/simulate` remains `mockOnly=true`, and visual migration remains
`0`.
