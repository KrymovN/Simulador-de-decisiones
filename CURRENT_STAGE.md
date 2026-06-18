# CURRENT STAGE - LEVIO.ES

Date: 18 June 2026, Europe/Madrid.

## Current Confirmed Checkpoint - 18 June 2026

Stage 4.2D-10 Owner Execution Checklist is the current confirmed checkpoint.

Confirmed facts from the repository:

- Stage 4.2D-10 creates `LEVIO_STAGE_4_2D_10_OWNER_EXECUTION_CHECKLIST.md`, a short practical owner/operator checklist for manually applying the reviewed migration files in the approved Empty Dev Supabase Project.
- Stage 4.2D-10 keeps the exact migration order `001_create_levio_principals.sql`, `002_create_simulation_records.sql`, `003_create_simulation_drafts.sql`, `004_create_simulation_history_entries.sql`, `005_indexes_and_constraints.sql`, `006_enable_rls_and_policies.sql`, and review-only `007_rollback_notes.sql`.
- Stage 4.2D-10 defines before-start checks, per-file success/failure recording, post-execution validation checks, evidence to return, and stop conditions for wrong project, production selection, migration errors, rollback uncertainty, RLS/policy errors, and constraint errors.
- Stage 4.2D-10 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-9 creates `LEVIO_STAGE_4_2D_9_DEV_SUPABASE_EXECUTION_SUPPORT_PLAN.md`, defining the practical first-execution support plan for owner/operator-run migrations in an Empty Dev Supabase Project.
- Stage 4.2D-9 records the project-owner decision that the approved dev target is `Empty Dev Supabase Project`, local Supabase is not used for this stage, and production Supabase remains forbidden.
- Stage 4.2D-9 defines dev project requirements, dev project checklist, per-file migration execution sequence, validation evidence requirements, failure handling, Go criteria, and next-stage mapping to Stage 4.2E only after successful dev execution and accepted validation evidence.
- Stage 4.2D-9 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-8 creates `LEVIO_STAGE_4_2D_8_DEV_SUPABASE_TARGET_UNBLOCK_PLAN.md`, breaking down the Stage 4.2D-7 `NO-GO` blockers and defining the owner/operator inputs required before dev migration execution can be reconsidered.
- Stage 4.2D-8 requires confirmation of an isolated local/dev Supabase target, reset/restore path, execution method, test user strategy, service-role boundary, anon-key validation boundary, validation-log capture process, and stop-condition acceptance. Secrets must not be written into git or project documentation.
- Stage 4.2D-8 recommended safe path is Supabase local development first, with an empty dev Supabase project as fallback only when reset/snapshot and non-production boundaries are confirmed. Production Supabase and Vercel production env changes remain forbidden.
- Stage 4.2D-8 defines the next eligible step as `STAGE 4.2D-9 DEV MIGRATION EXECUTION SUPPORT PLAN` only after target/checklist confirmation. It does not start execution, Stage 4.2E, Stage 4.3, or Stage 4.4.
- Stage 4.2D-8 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-7 creates `LEVIO_STAGE_4_2D_7_PRE_EXECUTION_AUDIT.md`, auditing the full migration package order, dependencies, rollback chain, RLS dependencies, trigger dependencies, foreign key dependencies, ownership consistency, execution risks, environment readiness, and next-stage mapping.
- Stage 4.2D-7 Go / No-Go decision is `NO-GO`. The migration package is structurally coherent, but real execution remains blocked until the owner/operator confirms the exact isolated local/dev Supabase target, reset/restore path, execution method, test users, service-role boundary, anon-key validation boundary, stop-condition acceptance, and validation-log capture process.
- Stage 4.2D-7 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-6 creates `LEVIO_STAGE_4_2D_6_MANUAL_SUPABASE_EXECUTION_GUIDE.md`, defining the owner/operator manual execution scope, environment checklist, exact migration execution order, per-file checks, stop conditions, validation log template, post-execution gate, and next-stage decision.
- Stage 4.2D-6 keeps execution scoped to isolated local/dev Supabase only. Production execution remains forbidden in this stage.
- Stage 4.2D-6 defines the validation log that must be returned before Stage 4.2E Persistence Runtime Foundation may begin.
- Stage 4.2D-6 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-5 creates `LEVIO_STAGE_4_2D_5_SUPABASE_EXECUTION_READINESS_PLAN.md`, defining execution target, pre-execution checklist, manual execution plan, post-execution validation plan, failure/rollback plan, Stage 4.2D-6 criteria, and readiness status.
- Stage 4.2D-5 recommends isolated local/dev Supabase execution first and keeps production execution unapproved until local/dev validation logs, RLS evidence, rollback posture, and environment separation are confirmed.
- Stage 4.2D-5 readiness status is `READY FOR MANUAL SUPABASE EXECUTION`, scoped only to a separately approved local/dev manual execution. It is not production approval and not runtime persistence launch.
- Stage 4.2D-5 does not execute SQL, connect to Supabase, create tables in any real database, change migration SQL files, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-4 creates `LEVIO_STAGE_4_2D_4_MIGRATION_STATIC_REVIEW.md`, documenting reviewed migration files, static review findings, fixes applied, remaining risks, and readiness status.
- Stage 4.2D-4 hardens `supabase/migrations/006_enable_rls_and_policies.sql` so direct authenticated client inserts/updates on `simulation_records` and `simulation_drafts` fail closed. Future writes must come from a server-only persistence runtime after owner resolution from the validated auth session.
- Stage 4.2D-4 updates `supabase/migrations/007_rollback_notes.sql` so commented rollback policy names match the hardened RLS policy names.
- Stage 4.2D-4 readiness status is `READY FOR SUPABASE EXECUTION REVIEW`, meaning a separate isolated Supabase execution review may be planned later. It does not approve production execution.
- Stage 4.2D-4 does not execute SQL, connect to Supabase, create tables in any real database, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-3 creates real migration files on disk under `supabase/migrations/`: `001_create_levio_principals.sql`, `002_create_simulation_records.sql`, `003_create_simulation_drafts.sql`, `004_create_simulation_history_entries.sql`, `005_indexes_and_constraints.sql`, `006_enable_rls_and_policies.sql`, and `007_rollback_notes.sql`.
- Stage 4.2D-3 creates `LEVIO_STAGE_4_2D_3_REAL_MIGRATION_FILES.md`, documenting the created files, schema summary, RLS summary, rollback summary, what was not applied, prerequisites before applying migrations, and QA required before Supabase execution.
- Stage 4.2D-3 creates migration files only. It does not execute SQL, connect to Supabase, create tables in any real database, create runtime persistence, change auth runtime, change dashboard, change simulator, change package files, connect AI, connect memory, connect subscriptions, connect billing, start Stage 4.3, or start Stage 4.4.
- Stage 4.2D-2 creates `LEVIO_STAGE_4_2D_2_MIGRATION_SQL_REVIEW_HARDENING.md`, reviewing the D-1 draft across ownership correctness, principal immutability, provider-reference uniqueness, foreign keys, deletion, retention, export, RLS, rollback, and indexes.
- Stage 4.2D-2 hardens the D-1 review draft by adding required future database-level immutability for `principal_id` and owner fields, expanding active provider-reference uniqueness across non-terminal states, requiring composite history parent-owner alignment, and improving rollback order for constraints/triggers before table drops.
- Stage 4.2D-2 readiness decision is `READY FOR REAL MIGRATION FILES`, meaning the reviewed draft is ready to be converted into real migration files only in a later explicitly approved stage. It does not mean migrations are ready to apply to production.
- Stage 4.2D-2 is documentation-only. It does not create real SQL files, migration files, schema files, migration directories, Supabase tables, runtime code, persistence APIs, auth runtime changes, dashboard changes, simulator changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.
- Stage 4.2D-1 creates `LEVIO_STAGE_4_2D_1_MIGRATION_SQL_REVIEW_DRAFT.md`, containing review-only SQL draft blocks for future `001_create_levio_principals`, `002_create_simulation_records`, `003_create_simulation_drafts`, `004_create_simulation_history_entries`, `005_indexes_and_constraints`, `006_enable_rls_and_policies`, and `007_rollback_notes`.
- Stage 4.2D-1 keeps `levio_principals.principal_id` as the canonical owner anchor, stores Supabase `auth.users.id` only as `provider_reference`, requires future user-owned records to use `owner_principal_id`, and documents RLS drafts through `provider_reference -> principal_id` owner isolation.
- Stage 4.2D-1 is SQL review only. It does not create real SQL files, migration files, schema files, migration directories, Supabase tables, runtime code, persistence APIs, auth runtime changes, dashboard changes, simulator changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.
- Stage 4.2D-0 creates `LEVIO_STAGE_4_2D_MIGRATION_FILE_LIST_APPROVAL.md`, defining only the future migration file list, per-file purpose/dependencies/rollback/review checklist, schema boundary, RLS review plan, cross-user isolation/forged-owner/guest/fail-closed test expectations, and Stage 4.2D-1 prerequisites.
- Stage 4.2D-0 proposes future migration units for `create_levio_principals`, `create_simulation_records`, `create_simulation_drafts`, `create_simulation_history_entries`, `indexes_and_constraints`, `enable_rls_and_policies`, and `rollback_notes`.
- Stage 4.2D-0 does not create SQL, migration files, schema files, Supabase tables, runtime code, persistence APIs, auth runtime changes, dashboard changes, simulator changes, package changes, AI, memory, subscriptions, billing, Stage 4.3, or Stage 4.4.
- Stage 4.2C creates `LEVIO_STAGE_4_2C_SCHEMA_MIGRATION_READINESS.md`, defining future schema planning, planned table columns, required/nullable fields, indexes, uniqueness constraints, foreign-key strategy, deletion/retention/export compatibility, RLS planning, migration readiness, data-integrity rules, environment requirements, Stage 4.2D prerequisites, and risk register.
- Stage 4.2C plans future `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries` tables without creating SQL, migrations, Supabase tables, schema files, runtime code, persistence APIs, storage buckets, auth runtime changes, simulator changes, dashboard/UI changes, package changes, AI, memory, subscriptions, billing, payments, Stage 4.3, or Stage 4.4.
- Stage 4.2C keeps `levio_principals.principal_id` as the canonical future owner anchor and requires future RLS/server authorization to fail closed when principal mapping cannot be proven.
- Stage 4.2B creates `LEVIO_STAGE_4_2B_DATA_MODEL_PRINCIPAL_MAPPING.md`, defining the conceptual principal mapping model, ownership rules, persistence entities, SimulationResponse V2 payload policy, guest-to-authenticated transition boundaries, GDPR/data-rights compatibility, and Stage 4.2C prerequisites.
- Stage 4.2B confirms that `levio_principals.principal_id` is the canonical Levio owner anchor for future persisted user data, while Supabase `auth.users.id` remains a `provider_reference` and must not become the direct owner ID without a later architecture approval.
- Stage 4.2B specifies `levio_principals`, `simulation_records`, `simulation_drafts`, and `simulation_history_entries` as conceptual entities only. It creates no SQL, migrations, Supabase tables, runtime code, persistence API, storage buckets, auth runtime changes, simulator changes, dashboard changes, package changes, AI, memory, subscriptions, billing, or payments.
- Stage 4.2A creates `LEVIO_STAGE_4_2_PERSISTENCE_RUNTIME_ARCHITECTURE.md`, defining persistence scope, ownership model, conceptual data lifecycle, security/RLS posture, Stage 4.2 breakdown, rollback strategy, and dependencies at architecture level only.
- Stage 4.2A starts Stage 4.2 as documentation-only. It does not implement persistence runtime, create database schemas, write SQL, create migrations, connect storage, change auth runtime, change simulator runtime, change public API, change UI, connect subscriptions, connect AI, or connect memory.
- Stage 4.1B-2 creates `LEVIO_STAGE_4_1_AUTH_RUNTIME_HARDENING.md`, documenting the completed auth-runtime scope, audit findings, fixed issues, known limitations, remaining blockers, rollback instructions, Stage 4.2 prerequisites, and readiness decision.
- Stage 4.1B-2 hardens the existing Supabase Auth runtime foundation with stricter redirect sanitization, visible auth error mapping, provider callback error handling, malformed auth config rejection, unsupported provider rejection, authenticated-user redirects away from auth entry pages, safer submit `try/finally` handling, and logout cleanup of the legacy mock session marker.
- Stage 4.1B-2 confirms the release readiness decision `READY FOR STAGE 4.2`, meaning the auth identity/session boundary is ready for a separately approved persistence stage. It does not mean ready for production users or real personal data.
- Stage 4.1B-2 does not create persistence, database schemas, user tables, saved simulations, drafts/history storage, subscriptions, payments, AI integration, memory, simulator changes, Decision Engine changes, runtime-integration changes, or `SimulationResponse` changes.
- Stage 4.1B-1 implemented the Auth Runtime foundation with Supabase Auth packages, `lib/auth` runtime boundary, normalized identity/session model, server-side dashboard guard, `/auth/callback`, login/register magic-link foundation, disabled password-reset posture, and mock-auth separation.
- Stage 4.1B created `LEVIO_STAGE_4_1B_AUTH_RUNTIME_IMPLEMENTATION_PLAN.md`, defining the implementation blueprint for the auth runtime foundation without writing runtime code in that step.
- Stage 4.1A creates `LEVIO_AUTH_PROVIDER_DECISION.md`, evaluating Auth.js / NextAuth, Supabase Auth, and Clerk against Levio architecture, Stage 4.2 persistence fit, user-data ownership, GDPR-oriented requirements, lock-in, cost, support burden, migration, AI, subscriptions, and ownership impact.
- Stage 4.1A approves Supabase Auth as the provider for the next auth implementation planning stage, with a strict Levio Auth Runtime Boundary, stable internal principal mapping requirement, Supabase anonymous sign-ins disabled by default, and no direct provider-native owner ID assumption.
- Stage 4.1A rejects Auth.js / NextAuth and Clerk as initial providers while preserving Auth.js as the preferred fallback if Supabase lock-in or persistence alignment becomes unacceptable.
- Stage 4.1A is documentation-only. It does not start Stage 4.1B, implement auth runtime, create routes, install dependencies, change UI/dashboard/simulator/runtime code, connect persistence, subscriptions, AI, or memory, or change deterministic brain / `SimulationResponse`.
- Stage 4.1 creates `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`, defining the provider-neutral auth runtime boundary, identity states, session model, guest/authenticated transition boundary, protected route strategy, rollback/safety plan, and roadmap compliance for production auth foundation.
- Stage 4.1 is documentation/scope-lock only because provider integration requires an explicit provider decision and implementation plan. No Supabase, Auth.js, Clerk, Firebase, Auth0, NextAuth, database, auth SDK, middleware, route gate, provider callback, session runtime, or dependency is added.
- Stage 4.1 preserves the current mock auth boundary: `components/MockAuthGate.tsx`, `levio_es_mock_session`, and localStorage saved simulations remain demo-only and must never authorize production data.
- Stage 4.1 does not start persistence, subscriptions, payments, AI, memory runtime, Stage 4.2, Stage 4.3, Stage 4.4, or Stage 5. Public simulator V1/mock behavior, `/api/simulate`, deterministic brain code, and Stages 3.11-3.16 runtime-switch behavior remain unchanged.
- `848a108` locked Stage 2.8G Hero artwork fidelity.
- `9c7447d` completed Stage 2.8H homepage minimal premium reduction.
- `6adefd6` completed the Stage 2.8 homepage motion and brand polish checkpoint.
- Stage 2.9D preserves product architecture and changes only homepage presentation markup in `app/page.tsx` and final desktop-only motion/visual overrides in `app/globals.css`.
- Stage 2.9E changes only the final mobile navigation override in `app/globals.css` and synchronizes stage documentation; auth/dashboard/simulator business logic is untouched.
- Stage 2.9F adds only responsive presentation overrides in `app/globals.css`: tablet `01/02/03/04` cards share one internal grid, final CTA typography is balanced, and the desktop simulator form is lighter and more compact.
- `HomeSimulator`, simulator/API contracts, auth/dashboard logic, localStorage keys, production persistence and favicon/metadata remain unchanged in Stage 2.9F.
- Stage 2.10A aligns `/login`, `/register` and `/forgot-password` with the homepage premium black-gold system through scoped auth presentation overrides in `app/globals.css`.
- Mock auth logic, routing, localStorage keys and dashboard logic remain unchanged; desktop/mobile route QA and mock auth flows passed.
- Stage 2.10A UX follow-up synchronizes homepage anchor navigation with scroll-linked reveals so Safari anchor landings render their target sections immediately.
- `HomeSimulator` uses its existing submit path for Enter, preserves Shift+Enter newlines and softly follows active thinking stages and completed output.
- Stage 2.10B preserves already reached homepage sections before simulator auto-follow, preventing dynamic result height from moving Safari root-scroll timelines back into dimmed intermediate frames.
- `HomeSimulator` adds progressive browser-safe `SpeechRecognition` / `webkitSpeechRecognition` voice input with start/stop/listening states and Spanish fallback/error feedback; voice input never submits automatically.
- Stage 2.11 creates `LEVIO_DECISION_ENGINE.md`, defining the future decision pipeline, confidence and completeness concepts, clarification logic, scenario construction, and Stage 3 AI integration requirements.
- Stage 2.11 creates `LEVIO_MEMORY_MODEL.md`, defining short-term, long-term, project, and decision memory with consent, retention, and GDPR boundaries.
- Stage 2.11 creates `LEVIO_SUBSCRIPTION_MODEL.md`, defining the conceptual FREE, PREMIUM, and PROFESSIONAL foundations without final prices or production entitlements.
- Stage 2.11 creates `LEVIO_MULTILINGUAL_ARCHITECTURE.md`, defining language selection, persistence, dictionaries, RTL requirements, and future AI language behavior.
- Stage 2.11 is documentation-only: product code, UI, business logic, simulator, auth/dashboard routes, API, localStorage contracts, OpenAI integration, database, and payments remain unchanged.
- Stage 2.12A unifies the shared dashboard shell with the homepage premium black-gold identity: Levio mark, sidebar, compact navigation, headers, active/hover states, glass surfaces, borders, shadows, and spacing.
- `/dashboard`, simulations, decisions, memory, profile, security, and privacy use consistent graphite/black/gold/amber presentation primitives without visually active cyan, rainbow, green, or legacy coral states.
- Stage 2.12A changes only presentation in `components/DashboardShell.tsx` and the final scoped dashboard cascade in `app/globals.css`; dashboard data, business logic, routes, localStorage, and API contracts remain unchanged.
- Stage 2.12B establishes one scoped dashboard grid rhythm with consistent content gaps, column/row gaps, card padding, start lines, and equal-height paired cards.
- Stage 2.12B neutralizes the legacy adjacent-section margin only inside dashboard, aligns the sidebar with the header, and disciplines history, decisions, memory, profile, security, and privacy layouts.
- Stage 2.12B changes only layout/CSS in `app/globals.css`; JSX, dashboard data, business logic, routes, auth, simulator, localStorage, and API contracts remain unchanged.
- Stage 2.13 creates `LEVIO_PRODUCT_READINESS_AUDIT.md`, assessing homepage, dashboard, auth, simulator, Decision Engine, memory, multilingual, monetization, Stage 3 readiness, production risks, and priority fixes.
- Stage 2.13 assesses Levio as a strong controlled-demo frontend and PARTIALLY READY product, but NOT READY for production users, real personal data, monetization, or direct AI connection.
- Stage 2.13 is audit/documentation-only: product code and protected contracts remain unchanged.
- Stage 2.14 creates `LEVIO_DECISION_SCHEMAS.md`, defining provider-independent canonical schemas, provenance, deterministic validation, confidence/completeness, safety, scenario, and recommendation invariants.
- Stage 2.14 creates `LEVIO_SIMULATION_RESPONSE_V2.md`, defining a future major-version response contract with clarification, analysis, limited-analysis, withheld-recommendation, refusal, and controlled-failure states.
- Stage 2.14 creates `LEVIO_CLARIFICATION_ENGINE.md`, defining critical-gap detection, question information value, minimal-question selection, contradiction handling, safety behavior, and stop conditions.
- Stage 2.14 is documentation-only: the current `SimulationResponse`, simulator, UI, dashboard, product code, API, auth, localStorage, persistence, payments, and OpenAI integration remain unchanged.
- Stage 2.15 creates `LEVIO_USER_DATA_ARCHITECTURE.md`, defining user-owned data principles, anonymous/guest/registered boundaries, simulation/history/memory/preference ownership, consent, retention, export, deletion, and recovery boundaries.
- Stage 2.15 connects future user-owned persistence to Production Auth Stage 2.16, subscriptions, memory, and `SimulationResponse V2` without selecting an auth/database provider or implementing persistence.
- Stage 2.15 is documentation-only: product code, UI, homepage, dashboard, simulator, API routes, the current `SimulationResponse`, localStorage, OpenAI integration, auth, database, payments, and dependencies remain unchanged.
- Stage 2.16 creates `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`, defining auth principles, identity and session states, optional and required auth, anonymous and guest claims, ownership authorization, provider strategy, security, abuse-prevention, and GDPR-oriented boundaries.
- Stage 2.16 follows the User Data Architecture: authentication, authorization, ownership, consent, and subscription remain separate concepts, while production provider choice is deferred until implementation.
- Stage 2.16 is documentation-only: auth routes/providers, database, dependencies, product code, UI, homepage, dashboard, simulator, API routes, the current `SimulationResponse`, persistence, payments, and OpenAI integration remain unchanged.
- Stage 2.17 creates `LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md`, defining provider-neutral model adapters, controlled request lifecycle, validation and failure boundaries, observability, traceability, retries and fallbacks, rate limits, and cost budgets.
- Stage 2.17 preserves the Decision Engine as product authority: an AI provider creates candidate output only and does not decide ownership, auth, consent, entitlement, safety gates, or `SimulationResponse V2` semantics.
- Stage 2.17 is documentation-only: OpenAI or other AI providers, real model calls, streaming, AI routes, `/api/simulate`, environment variables, dependencies, product code, UI, dashboard, simulator, and the current `SimulationResponse` remain unchanged.
- Stage 2.18 creates `LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md`, defining evaluation dataset structure, measurable quality gates, the minimum pre-integration dataset, human and regression review, and an initial catalog of 24 synthetic cases.
- Stage 2.18 establishes zero-tolerance gates for critical safety/privacy violations and recommendations with unresolved critical gaps, plus multilingual, traceability, cost-aware, and controlled-failure thresholds.
- Stage 2.18 is documentation-only: AI providers/models, eval/test runners, automated tests, executable fixtures, SDKs, dependencies, product code, UI, dashboard, simulator, API routes, and the current `SimulationResponse` remain unchanged.
- Stage 2.19 creates `LEVIO_TESTING_STRATEGY.md`, defining product, Decision Engine, SimulationResponse, user-data, auth, and security testing layers, release quality gates, regression strategy, metrics, and audit evidence.
- Stage 2.19 separates semantic evaluation from deterministic testing and establishes development, internal release, beta, and production gates with blocking safety, privacy, ownership, and access boundaries.
- Stage 2.19 is documentation-only: tests, test/eval runners, CI/CD, GitHub Actions, Playwright/Vitest/Jest, dependencies, product code, UI, dashboard, simulator, API routes, AI, and the current `SimulationResponse` remain unchanged.
- Stage 2.19A creates `LEVIO_DOCUMENTATION_LANGUAGE_AUDIT.md`, audits key and root project-level Markdown documentation, and aligns detected Russian or mixed-language documentation fragments with the English-first standard.
- Stage 2.19A establishes the explicit language policy: project documentation is English, owner-facing Codex reports are Russian, and product UI remains multilingual with Spanish as the current primary public UI language unless product strategy changes.
- Stage 2.19A is documentation-only: product code, UI, dashboard, simulator, API routes, dependencies, AI integration, tests, and CI/CD remain unchanged.
- Stage 2.20 creates `LEVIO_TRUST_LEGAL_LAYER.md`, defining product transparency, expectation management, simulation and recommendation limitations, high-risk boundaries, user autonomy, trust indicators, accountability, auditability, and future legal dependencies.
- Stage 2.20 connects existing safety, data, auth, AI, evaluation, and testing foundations into a production Trust Layer while explicitly deferring public legal documents and qualified legal review.
- Stage 2.20 is documentation-only: no Terms of Service, Privacy Policy, legal publication, product code, UI, dashboard, simulator, API routes, dependencies, AI integration, tests, or CI/CD are created or changed.
- The Stage 2 Final Architecture Closure Audit creates `LEVIO_STAGE_2_FINAL_ARCHITECTURE_CLOSURE_AUDIT.md`, confirms cross-document consistency, corrects historical stage-status terminology, and closes the Stage 2 architecture package.
- Stage 3.1 creates an isolated provider-independent contract layer in `lib/decision-engine/` with canonical TypeScript types, draft result/V2 contracts, stable exports, and lightweight deterministic shape validators.
- Stage 3.1 does not implement the Decision Engine, generate scenarios, connect AI, auth, database, or persistence, change UI or API behavior, or modify the current simulator and `SimulationResponse` runtime.
- Stage 3.2 adds the first executable Decision Engine layer through pure deterministic completeness, critical-gap, confidence, trace, and limited contradiction-analysis functions in `lib/decision-engine/`.
- Stage 3.2 supports `missing_goal`, `missing_context`, `missing_constraints`, `missing_time_horizon`, `critical_unknown`, `contradiction_detected`, and `safety_gap` without AI, auth, database, persistence, subscriptions, UI, API, or simulator runtime integration.
- Stage 3.3 adds pure deterministic clarification functions that prioritize gaps, select a minimal first-pass question set, and decide whether to ask, proceed with limitations, withhold, or refuse.
- Stage 3.3 provides stable English question templates for all seven Stage 3.2 gap codes and preserves safety-first behavior without AI, memory runtime, auth, database, persistence, subscriptions, UI, API, or simulator runtime integration.
- Stage 3.4 adds pure deterministic scenario construction for optimistic, realistic, and pessimistic perspectives mapped to canonical favorable, base-case, and adverse scenario types.
- Stage 3.4 keeps scenarios structural and traceable through explicit assumptions, dependencies, uncertainty markers, outcome indicators, confidence calculations, and clarification gates without narrative generation or runtime integration.
- Stage 3.5 adds pure deterministic scenario-risk assessment with low, medium, high, and critical levels plus structured comparative probability, impact severity, reversibility, uncertainty, cost-of-error, confidence, and traceability.
- Stage 3.5 marks probability as comparative and not calibrated, links risk assessments to scenario assumptions and uncertainties, and adds no narrative generation or runtime integration.
- Stage 3.6 adds pure deterministic recommendation reasoning with structured categories, priorities, preconditions, option comparison, confidence, rationale, and source traceability.
- Stage 3.6 enforces critical-gap, clarification, and safety withholding gates; a consequential preferred option is exposed only for eligible recommended or conditional outputs.
- Stage 3.7 adds `runDecisionEngine(...)`, a pure deterministic orchestrator that coordinates validation, completeness, critical gaps, contradictions, clarification, scenarios, risks, and recommendations in the required order.
- Stage 3.7 adds controlled pipeline stops, stage-level traceability, controlled failures, and a model-quality confidence summary without connecting the orchestrator to product runtime.
- Stage 3.8 adds a pure deterministic mapper from `DecisionEngineResult` to `SimulationResponseV2Draft`, including lifecycle status, availability, safety, controlled failure, confidence, and full pipeline traceability mapping.
- Stage 3.8 keeps the V2 runtime draft isolated from UI, API routes, simulator runtime, dashboard, and the current public `SimulationResponse`.
- Stage 3.9 adds `runSimulationPipeline(...)`, a single deterministic internal runtime entrypoint that runs the Decision Engine, maps the result to a V2 draft, validates the final lifecycle envelope, and returns controlled failure instead of an uncaught runtime error.
- Stage 3.9 preserves validation, completeness, gaps, contradictions, clarification, scenarios, risks, recommendations, orchestrator, response-mapping, and response-validation traceability without exposing the pipeline to product runtime.
- Stage 3.10 adds `runDecisionEngineRuntimeValidation()` and an internal catalog of ten synthetic deterministic cases covering successful, limited, clarification, safety, scenario, risk, withholding, and controlled-failure behavior.
- Stage 3.10 runtime validation passed `10/10` cases and is documented in `LEVIO_STAGE_3_RUNTIME_VALIDATION.md`; no test framework, CI/CD, dependency, or product-runtime integration was introduced.
- The Stage 3 Final Deterministic Brain Audit creates `LEVIO_STAGE_3_FINAL_DETERMINISTIC_BRAIN_AUDIT.md`, confirms that the Stage 3.1-3.10 package is coherent and internally validated, and records known deterministic limitations without changing code.
- The audit found no direct contract contradiction requiring a code change. AI, memory runtime, auth, database, persistence, subscriptions, UI, API routes, simulator runtime, and current public `SimulationResponse` remain unconnected and unchanged.
- Stage 3.11 creates `LEVIO_STAGE_3_11_INTERNAL_RUNTIME_INTEGRATION_PLANNING.md`, defining the controlled internal adapter boundary, raw-text and structured-context mapping rules, V1/V2 coexistence, feature-flag and rollback requirements, internal error mapping, observability/privacy limits, contract-validation requirements, deeper invariants, and approval gates through Stage 3.16.
- Stage 3.11 confirms that raw public simulator text cannot responsibly become structured deterministic context without a separately approved semantic extraction capability; Stage 3.12 must preserve missing context rather than invent it.
- Stage 3.11 is documentation-only. It does not connect the deterministic brain to the public simulator, `/api/simulate`, UI, dashboard, localStorage, AI, memory runtime, auth, persistence, subscriptions, or external services.
- Stage 3.12 adds a controlled internal runtime adapter in `lib/decision-engine/` with adapter contracts, canonical input construction, internal-mode validation, controlled error mapping, explicit no-coupling operational evidence, and deeper V2 invariant validation.
- Stage 3.12 adds `runInternalRuntimeAdapterValidation()` with twelve passing synthetic cases and revalidates the Stage 3.10 deterministic catalog at `10/10`.
- Stage 3.12 calls only `runSimulationPipeline(...)`. Public simulator behavior, `/api/simulate`, UI, dashboard, localStorage, AI, memory runtime, auth, database, persistence, subscriptions, dependencies, and external services remain unchanged and unconnected.
- Stage 3.13 adds a code-only simulator-shaped sandbox in `lib/decision-engine/` that requires an explicit deny-by-default `simulator_sandbox_v2` feature gate and invokes the deterministic brain only through the Stage 3.12 adapter.
- Stage 3.13 generates internal `SimulationResponseV2Draft` results for enabled valid sandbox requests; disabled and rejected requests execute neither the adapter nor the deterministic brain.
- Stage 3.13 adds `runSimulatorIntegrationSandboxValidation()` with nine passing smoke/isolation cases and revalidates Stage 3.12 at `12/12` and Stage 3.10 at `10/10`.
- Stage 3.13 creates no route, page, endpoint, navigation link, UI mapping, public runtime switch, persistence, auth, memory, subscription, AI, or external-service coupling.
- Stage 3.14 adds a pure internal `SimulationResponseV2Draft` to `SimulationResponseV2UiModel` mapping contract covering lifecycle, decision summary, model quality, clarification, scenarios, risks, consequences, recommendation, safety, notices, and traceability.
- Stage 3.14 defines loading, empty, clarification, ready, limited, cannot-recommend, refused, and controlled-failure presentation states without importing or executing the sandbox, adapter, pipeline, or public runtime.
- Stage 3.14 adds `runSimulationResponseV2UiMappingValidation()` with ten passing mapping-only cases and revalidates Stage 3.13 at `9/9`, Stage 3.12 at `12/12`, and Stage 3.10 at `10/10`.
- Stage 3.14 creates no component, route, rendering change, public runtime switch, V2-to-V1 coercion, persistence, auth, memory, subscription, AI, or external-service coupling.
- Stage 3.15 adds an internal/dev-only controlled switch boundary in `lib/runtime-integration/` with deny-by-default V1 selection, explicit dual-gated V2 execution through the sandbox, and discriminated V1, V2, or controlled-failure results.
- Stage 3.15 preserves `buildMockSimulation(...)` as the unchanged immediate rollback path and makes every runtime fallback explicit through reason and source-status metadata.
- Stage 3.15 adds `runControlledSimulatorSwitchValidation()` with ten passing switch/fallback/isolation cases and revalidates Stage 3.14 at `10/10`, Stage 3.13 at `9/9`, Stage 3.12 at `12/12`, and Stage 3.10 at `10/10`.
- Stage 3.15 creates no public route, public runtime switch, component, rendering change, public API contract change, persistence, auth, memory, subscription, AI, or external-service coupling.
- Stage 3.16 creates `LEVIO_STAGE_3_16_RUNTIME_QA_REGRESSION.md`, completing the runtime-integration QA checklist across static validation, runtime catalogs, public isolation, API, desktop, and mobile regression.
- Stage 3.16 revalidates Stage 3.15 at `10/10`, Stage 3.14 at `10/10`, Stage 3.13 at `9/9`, Stage 3.12 at `12/12`, and Stage 3.10 at `10/10`; TypeScript, ESLint, production build, public V1 API, desktop, and mobile checks pass.
- Stage 3.16 is documentation-only. Public UI, public API, public runtime, V1 behavior, deterministic V2 gating, dependencies, AI, memory runtime, auth runtime, persistence, database, and subscriptions remain unchanged.
- Simulator business logic, API and `SimulationResponse` contracts, auth logic, routing and localStorage keys remain unchanged.
- Desktop auth composition is more balanced and its edge accents are restricted to the black/graphite/gold/amber identity; desktop/mobile QA passed without console errors or horizontal overflow.
- The public homepage retains `public/hero-approved-network-bg.png`, rendered through `next/image` with `quality={100}` and `unoptimized`.
- Mobile navigation is one controlled horizontal row: `Inicio`, `Simulador`, `Mi espacio`, `Iniciar sesión`.
- Mobile navigation now uses readable `44px` premium glass controls, stronger typography/contrast/active/tap states and a distinct login CTA without horizontal overflow.
- Mobile root-scroll reveal ranges start later and run longer across hero feature, decision-system, process and capability blocks.
- Hero title scroll-exit starts earlier and the approved artwork breathing cycle is accelerated to `21s`.
- Desktop reveal timing for hero feature, decision-system, process and `01/02/03/04` blocks is aligned against the capability-card reference; accepted Stage 2.9C mobile timing remains unchanged.
- Simulator workspace has deeper black-gold composition and a premium input surface without changes to `HomeSimulator` business logic.
- The simulator workspace heading reveals by word around desktop viewport center; the final CTA arrives softly from the right and reveals its copy by letter on desktop only.
- `app/layout.tsx` defines consistent `Levio.es` title, application name, Spanish description, Apple Web App, Open Graph, Twitter, viewport and theme color metadata.
- The only declared favicon uses cache-busted `public/levio-favicon-v3.ico`; the Apple touch icon uses `public/levio-apple-touch-icon-v3.png`.
- The manifest is served through `public/levio-manifest-v3.webmanifest` and uses consistent `public/levio-icon-192-v3.png` and `public/levio-icon-512-v3.png`.
- Conflicting file-based `app/icon.png`, old `public/apple-icon.png`, `public/icon-192.png` and `public/manifest.webmanifest` are removed.
- No `xaz`, `xaz’` or `XAZ` source exists in the repository or Git history; that name belongs to Safari Favorites/History cache and may remain cached after source correction.
- Approved hero artwork breathing is slowed from `21s` to `22.75s`, while hero title scroll-exit is accelerated from `0-7%` to `0-6%`.
- Hero feature cards, decision heading, process heading/cards and capability cards have separately calibrated desktop and mobile ranges that complete around the viewport center.
- Timing for the `01/02/03/04` system cards remains unchanged; reduced-motion fallback remains active.
- Obsolete production visual assets and unused `components/SingularityVisual.tsx` are removed.

Current direction remains unchanged: Levio.es is an AI Decision Intelligence System, not a chatbot, AI playground, sci-fi showcase, WebGL experiment or visual-effects demo.

Stage 4.2D-10 is complete as a practical owner execution checklist only. The approved target remains an Empty Dev Supabase Project; local Supabase is not used and production Supabase remains forbidden. SQL has not been executed by Codex, Supabase has not been contacted by Codex, Supabase tables have not been created by Codex, persistence runtime has not started, auth runtime/dashboard/simulator/public product runtime remain unchanged, and subscriptions, AI, memory, billing, Stage 4.3, and Stage 4.4 have not started.

### Stage 2.10 Candidate - Secondary Product Surface Unification

- Start with shared auth shell and shared dashboard shell/navigation so a controlled primitive-level pass improves the widest route surface.
- Align auth mark, form hierarchy, input/label contrast and spacing with the homepage premium system.
- Align dashboard brand mark, active navigation, cards, controls, spacing/radius/borders and remove incompatible white/cyan/rainbow identity traces.
- Preserve auth/dashboard/mock logic, routing, simulator contracts, localStorage keys, API and production persistence boundaries.
- Keep `/visual-lab` isolated as a sandbox, not a production style target.

## Historical Authoritative Strategy - 30 May 2026

This section supersedes older Stage 2.7.x visual-research notes below wherever they conflict with the current plan.

- Historical active stage at that checkpoint: Stage 2.8 - documentation/current-state synchronization, production state alignment and MVP preparation after strategic visual pivot.
- Current product direction: Premium Black-Gold AI Decision Intelligence System.
- Stage 2.7.x is completed as research and direction discovery. Its cinematic/WebGL/shader work remains historical context, not the current production target.
- Heavy production WebGL is rejected for the current MVP path. Do not integrate WebGL/canvas/Three.js/R3F into production without a new explicit approval.
- Current production checkpoint: `78913da` - `Refocus Levio homepage toward premium black-gold product UI`.
- Stage 2.8 priorities: synchronize documentation, verify production after the black-gold pivot, plan legacy heavy visual CSS cleanup, and prepare MVP decision-flow polish.
- Protected areas remain protected: simulator logic, API contracts, auth/dashboard logic, dependency files and deployment settings.

## Superseded Transition State - 24 May 2026

Historical note: this was the handoff source of truth before the Stage 2.8 synchronization and the 30 May 2026 product pivot. Treat it as superseded by `Historical Authoritative Strategy - 30 May 2026` for the visual-direction decision and by the current confirmed checkpoint for stage status.

- Historical active stage at that time: Stage 2.7.3b - isolated lightweight shader cinematic-depth correction and validation.
- Historical status at that time: Stage 2.7.3b was not complete. Real iPhone Safari after `fa5dfd9` confirmed technical safety, but did not confirm enough perceived cinematic-depth improvement.
- Historical status at that time: Stage 2.7.4 was blocked until Stage 2.7.3b closed.
- Stage 2.7.5 is provisional only: existing mobile-safety work is useful but not a final validation stage and not a production-integration basis.
- Stage 2.7.6 and any Stage 2.7.7 escalation remain blocked/provisional until Stage 2.7.3b has a real visual-quality path forward.
- Current WebGL sandbox is isolated in `/visual-lab` and must stay isolated.
- Current sandbox is not yet premium cinematic quality. The `fa5dfd9` retest confirms more strongly that the current single-pass lightweight shader has a visual ceiling.
- Current engineering direction: preserve production `DecisionSingularity`, keep WebGL lab-only, and do not integrate production hero.
- Historical conclusion at that time: the lightweight shader path had a visual ceiling. The current Stage 2.8 direction is the Premium Black-Gold MVP path, not advanced rendering research.
- Strict stage discipline: no skipped stages, no retroactive completion, no production code changes during documentation-only work.
- Quota protection: before opening a new context, avoid rendering experiments, long browser QA loops, new builds, or broad analysis unless explicitly requested.
- Production protection: do not modify `components/DecisionSingularity.tsx`, `components/DecisionSingularity.module.css`, `components/HomeSimulator.tsx`, simulator logic, `SimulationResponse`, or `app/globals.css` without explicit approval.
- Stash protection: do not apply `stash@{0}` without explicit permission.

## Stage 2.7.3b Direction Checkpoint - 26 May 2026

This checkpoint supersedes the previous hybrid static image direction for the active `/visual-lab` implementation.

- Active/checkpointed stage: Stage 2.7.3b - isolated CSS-only black-gold sphere/prognosis sandbox direction.
- The hybrid static image + lightweight overlays direction has been visually rejected and must not be continued as the current direction.
- `public/visual-lab/singularity-hybrid-reference.png` remains a tracked asset, but it is no longer the dominant base layer for `/visual-lab`.
- Current accepted sandbox direction: CSS-only black-gold living sphere with forecast/risk/value labels, soft orbit drift, breathing glow and calm premium cinematic motion.
- Current `/visual-lab` implementation uses no WebGL, no canvas, no Three.js, no React Three Fiber and no new dependencies.
- Production remains untouched: no production hero integration and no changes to `DecisionSingularity`, `HomeSimulator`, simulator logic, `app/page.tsx`, `app/layout.tsx` or `app/globals.css`.
- `/visual-lab` remains an isolated sandbox route and is not linked into production navigation.
- Stage 2.7.4 remains blocked and must not start from this checkpoint.

## Historical transition checkpoint - 27 May 2026

Historical note: this block was the final handoff checkpoint before the repository/deployment migration and production homepage pivot. It is retained for history and superseded by the 30 May 2026 current stage.

- Authoritative project path: `/Users/s3/Documents/New project`.
- Current Stage 2.7.3b checkpoint commit: `31d8902` - `Checkpoint Stage 2.7.3b sphere sandbox direction`.
- Current stage status: Stage 2.7.3b is checkpointed around the accepted isolated `/visual-lab` direction; Stage 2.7.4 has not started from this checkpoint and remains blocked.
- Accepted `/visual-lab` direction: CSS-only black-gold living sphere/prognosis sandbox with small forecast/risk/value labels, slow orbit/drift, soft breathing glow and premium calm motion.
- Blocked/provisional stages: Stage 2.7.4 blocked; Stage 2.7.5 provisional only; Stage 2.7.6 provisional only; Stage 2.7.7 blocked.
- Production protection rules remain active: do not change `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/DecisionSingularity.tsx`, `components/HomeSimulator.tsx`, simulator logic, dependencies, lockfiles, git remotes or deployment configuration without separate approval.
- `New project` is the current working source for this Codex thread and the accepted sandbox checkpoint.
- Older production/GitHub/Vercel source is presumed to be `/Users/s3/levio-app`; it requires a separate migration audit before any update to `levio.es`.
- `levio.es` currently shows the older production site state and must not be updated from this checkpoint without an approved migration/deployment plan.
- Historical next technical stage at that time: Stage 2.8 - repository/deployment migration preparation.

## Historical next context recovery

Historical recovery instructions from the 27 May handoff:

- Read `PROJECT_CONTEXT.md`, `CURRENT_STAGE.md` and `LEVIO_CURRENT_STATE.md`.
- Run `git status --short`, `git branch --show-current` and `git log --oneline -10` from `/Users/s3/Documents/New project`.
- Confirm that Stage 2.7.3b is checkpointed, `/visual-lab` remains isolated, production files are untouched and Stage 2.7.4 remains blocked.
- Do not immediately start Stage 2.7.4, migration, deploy, push, remote changes, dependency changes, file copying between repositories or production integration.
- Next safe step: begin Stage 2.8 with a read-only repository/deployment migration preparation audit.

## Historical Stage 2.8 first task

Historical first task for the original Stage 2.8 migration-preparation pass:

- Audit `/Users/s3/Documents/New project`.
- Audit `/Users/s3/levio-app`.
- Identify the GitHub remote(s) and branch relationships.
- Identify which local folder is connected to the current production/Vercel source.
- Prepare a backup and migration plan before any file transfer, remote change, push or deploy.
- Do not copy, delete, move, deploy, push or migrate anything without separate explicit approval.

## Strategic visual pivot - 28 May 2026

This checkpoint records a controlled production homepage pivot away from heavy cinematic effects.

- New strategic direction: Premium Black-Gold Minimal AI Decision Intelligence UI.
- Levio.es should feel expensive, fast, calm, reliable, technological and serious, not like a visual-effects showcase.
- Heavy cinematic/WebGL/shader direction is not the production target; WebGL remains forbidden in production.
- Stage 2.7.3b is not closed by this pivot and the previous cinematic target must not be claimed as achieved.
- Production homepage now favors a lightweight black-gold product interface and a minimal SVG/CSS singularity mark.
- Removed from the production hero path: particle DOM layers, heavy sandbox sphere layers, large blur/glow stack and multi-layer orbit animation.
- Preserved: Spanish visible UI, `HomeSimulator`, simulator/API contracts, auth/dashboard logic, no new dependencies.
- `/visual-lab` remains available as a sandbox route, but its current visual is also refocused toward a lighter mark for consistency.
- Remaining caveat: `app/globals.css` still contains historical visual CSS sections; production homepage has scoped override rules, but a later CSS cleanup stage may remove legacy unused blocks after visual QA.

## Current Stage

Stage 4.2D-0 Persistence Migration File List Approval - COMPLETED CHECKPOINT.

Roadmap from the current checkpoint:

- Stage 2.7.x: completed research track covering visual-engine exploration, `/visual-lab`, WebGL/shader testing, mobile safety checks and the final strategic pivot away from heavy cinematic production visuals.
- Stage 2 architecture package: completed through the final closure audit.
- Stage 3.1: completed only as an isolated deterministic contract foundation.
- Stage 3.2: completed only as an isolated deterministic completeness and critical-gap execution layer.
- Stage 3.3: completed only as an isolated deterministic clarification and question-selection layer.
- Stage 3.4: completed only as an isolated deterministic scenario-construction layer.
- Stage 3.5: completed only as an isolated deterministic risk-assessment layer.
- Stage 3.6: completed only as an isolated deterministic recommendation-reasoning layer.
- Stage 3.7: completed only as an isolated deterministic orchestration layer.
- Stage 3.8: completed only as an isolated deterministic SimulationResponse V2 draft-mapping layer.
- Stage 3.9: completed only as an isolated validated end-to-end deterministic simulation pipeline.
- Stage 3.10: completed only as internal deterministic runtime validation with ten passing synthetic cases.
- Stage 3 Final Deterministic Brain Audit: completed as a documentation-only closure review; no direct contract contradiction requiring a code change was found.
- Stage 3.11: completed as a documentation-only integration-planning boundary; no runtime code or public behavior changed.
- Stage 3.12: completed as an isolated controlled internal runtime adapter with twelve passing synthetic adapter cases and deeper invariant validation.
- Stage 3.13: completed as a code-only feature-gated simulator integration sandbox with nine passing smoke/isolation cases.
- Stage 3.14: completed as an isolated mapping-first V2 presentation contract with ten passing mapping-only cases.
- Stage 3.15: completed as an internal/dev-only deny-by-default controlled runtime switch with ten passing switch/fallback/isolation cases.
- Stage 3.16: completed as the runtime-integration QA and regression closure with all required catalogs, static checks, build, public-isolation, API, desktop, and mobile checks passing.
- Stage 4.1: completed as auth runtime scope lock only.
- Stage 4.1A: completed as auth provider decision only; Supabase Auth is approved for next-stage planning, and provider-specific production auth integration still requires separate explicit approval.

Completed Stage 2 stabilization commits:

- `8eeb150` - Stage 2.1, motion.css extraction.
- `959ffe5` - Stage 2.2, dashboard.css extraction.
- `7ea3e61` - Stage 2.3, auth.css extraction.
- `c9a86da` - Stage 2.4, simulator.css extraction.
- Stage 2.5 visual regression QA completed after `c9a86da`.
- `aeace9f` - Stage 2.6, checkpoint + context sync.
- `c81a9c8` - Stage 2.6 documentation closure.
- `0cec475` - Stage 2.7-prep visual engine preparation completed.
- `3d8ef6e` - Stage 2.7.1 WebGL architecture research completed.
- `0781b46` - Stage 2.7.2 isolated WebGL sandbox prototype completed.
- `5553455` - Stage 2.7.3 isolated WebGL visual quality iteration completed.
- Stage 2.7.3 corrective closure status: isolated shader cinematic pass applied; local `/visual-lab` route QA passed; strict closure remains pending post-pass real iPhone Safari retest.
- Stage 2.7.3 corrective pass 2 status: real iPhone Safari retest after the first corrective pass stayed technically stable but did not improve perceived cinematic depth; second isolated shader depth pass applied; strict closure remains pending another real iPhone Safari visual-quality retest.
- `fa5dfd9` - Stage 2.7.3b controlled depth-contrast iteration committed; real iPhone Safari retest passed technical safety but visual improvement was almost not noticeable. This is now historical evidence for the later pivot, not an active-stage marker.
- Stage 2.7.3b direction checkpoint: hybrid static image direction rejected; `/visual-lab` now holds an isolated CSS-only black-gold living sphere/prognosis sandbox with forecast/risk/value labels and no WebGL/canvas/Three.js/R3F.
- Stage 2.7.4 isolated WebGL performance profiling and stress testing completed with no file changes and no implementation commit needed.
- `89e534c` - Stage 2.7.5 isolated WebGL mobile safety optimization completed; this is not full Safari/iPhone validation.
- Stage 2.7.6 formal integration decision completed: keep production `DecisionSingularity`, keep WebGL isolated in `/visual-lab`, no production replacement approved.
- Stage 2.8G Hero artwork fidelity completed in `848a108`.
- Stage 2.8H homepage minimal premium reduction completed in `9c7447d`.
- Stage 2.8 homepage motion and brand polish checkpoint completed in `6adefd6`.
- Stage 2.9A mobile navigation, scroll timing and simulator premium polish completed.
- Stage 2.9B Safari metadata and favicon identity fix completed.
- Stage 2.9C homepage scroll motion fine-tuning completed.
- Stage 2.9D desktop motion alignment and CTA polish completed.
- Stage 2.9E mobile navigation visibility polish and secondary-pages audit completed.
- Stage 2.9F tablet card alignment, final CTA typography polish and simulator form refinement completed.
- Stage 2.10A auth pages premium black-gold unification completed; auth logic and routes preserved.
- Stage 2.10A navigation reveal sync, simulator Enter/Shift+Enter and auto-follow flow completed; simulator contracts and business logic preserved.
- Stage 2.10B simulator reveal preservation and progressive voice input completed; simulator/API/localStorage contracts and business logic preserved.
- Stage 2.11 Core Architecture Foundation completed through four architecture documents; product code and protected contracts preserved.
- Stage 2.12A dashboard premium system unification completed; dashboard logic, routes, data, localStorage, and API contracts preserved.
- Stage 2.12B dashboard layout grid discipline completed; dashboard logic, routes, data, auth, simulator, localStorage, and API contracts preserved.
- Stage 2.13 product readiness audit completed; product code, UI, CSS, simulator, dashboard, auth, routes, API, localStorage, voice input, and architecture foundations preserved.
- Stage 2.14 Decision Engine Specification completed through three provider-independent contract documents; Stage 3, OpenAI, auth, persistence, payments, product code, UI, simulator, dashboard, API, and current `SimulationResponse` remain unchanged.
- Stage 2.15 User Data Architecture completed through `LEVIO_USER_DATA_ARCHITECTURE.md`; Stage 2.16 Production Auth is prepared at architecture level only, while auth, database, persistence, subscriptions, OpenAI, product code, UI, simulator, dashboard, API, and current `SimulationResponse` remain unchanged.
- Stage 2.16 Production Auth Architecture completed through `LEVIO_PRODUCTION_AUTH_ARCHITECTURE.md`; production auth, providers, database, persistence, subscriptions, OpenAI, product code, UI, simulator, dashboard, API, and current `SimulationResponse` remain unchanged.
- Stage 2.17 AI Abstraction / Observability / Cost Budgets completed through `LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md`; no AI provider, real model, streaming, AI route, dependency, environment variable, product code, UI, simulator, dashboard, API, or current `SimulationResponse` was changed.
- Stage 2.18 Evaluation Dataset / Quality Thresholds completed through `LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md` and its initial 24-case synthetic catalog; no AI provider/model, eval/test runner, automated test, executable fixture, dependency, product code, UI, simulator, dashboard, API, or current `SimulationResponse` was changed.
- Stage 2.19 Product / Security / Quality Test Architecture completed through `LEVIO_TESTING_STRATEGY.md`; no tests, test/eval runner, CI/CD, GitHub Actions, dependency, product code, UI, simulator, dashboard, API, AI provider, or current `SimulationResponse` was changed.
- Stage 2.19A Documentation Language Consistency Audit completed through `LEVIO_DOCUMENTATION_LANGUAGE_AUDIT.md`; key and root project-level documentation is English-first, owner-facing Codex reports remain Russian, product UI remains governed by the multilingual architecture, and no product code changed.
- Stage 2.20 Production Trust / Legal Layer completed through `LEVIO_TRUST_LEGAL_LAYER.md`; trust requirements and future legal dependencies are defined architecturally, while public legal documents, legal approval, product code, UI, simulator, dashboard, API, AI integration, tests, and CI/CD remain unchanged.
- Stage 2 Final Architecture Closure Audit completed through `LEVIO_STAGE_2_FINAL_ARCHITECTURE_CLOSURE_AUDIT.md`; Stage 2 architecture is closed, Stage 3 has not started, and product code remains unchanged.
- Stage 3.1 Deterministic Decision Engine Contract Foundation completed through isolated TypeScript contracts and lightweight shape validators in `lib/decision-engine/`; AI, auth, persistence, UI, API behavior, current `SimulationResponse`, and simulator runtime remain unchanged.
- Stage 3.2 Deterministic Completeness & Critical Gap Engine completed through pure functions in `lib/decision-engine/`; no AI, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.3 Deterministic Clarification & Question Selection Engine completed through pure functions in `lib/decision-engine/`; no AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.4 Deterministic Scenario Engine completed through pure structured scenario functions in `lib/decision-engine/`; no AI, narrative generation, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.5 Deterministic Risk Engine completed through pure structured scenario-risk functions in `lib/decision-engine/`; no AI, narrative generation, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.6 Deterministic Recommendation Engine completed through pure structured recommendation functions in `lib/decision-engine/`; no AI, advice prose, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.7 Decision Engine Orchestrator completed through pure deterministic pipeline coordination and controlled stop behavior in `lib/decision-engine/`; no AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current `SimulationResponse`, or simulator runtime changed.
- Stage 3.8 SimulationResponse V2 Runtime Integration completed through an isolated deterministic V2 draft mapper and lightweight validator in `lib/decision-engine/`; no AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current public `SimulationResponse`, or simulator runtime changed.
- Stage 3.9 End-to-End Deterministic Simulation Pipeline completed through a single validated internal runtime entrypoint in `lib/decision-engine/`; no AI, external service, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current public `SimulationResponse`, or simulator runtime changed.
- Stage 3.10 Runtime Validation & Internal Testing completed through `runDecisionEngineRuntimeValidation()` and `LEVIO_STAGE_3_RUNTIME_VALIDATION.md`; all ten synthetic deterministic cases passed, and no test framework, AI, memory runtime, auth, database, persistence, subscriptions, UI, API behavior, current public `SimulationResponse`, or simulator runtime changed.
- Stage 3 Final Deterministic Brain Audit completed through `LEVIO_STAGE_3_FINAL_DETERMINISTIC_BRAIN_AUDIT.md`; the isolated Stage 3.1-3.10 package is coherent and no direct contract contradiction required a code change.
- Stage 3.11 Internal Runtime Integration Planning completed through `LEVIO_STAGE_3_11_INTERNAL_RUNTIME_INTEGRATION_PLANNING.md`; Stage 3.12 Controlled Internal Runtime Adapter is the approved next block.
- Stage 3.12 Controlled Internal Runtime Adapter completed through isolated adapter contracts, invocation, validation, deeper invariants, and `LEVIO_STAGE_3_12_CONTROLLED_INTERNAL_RUNTIME_ADAPTER.md`.
- Stage 3.13 Simulator Integration Sandbox completed through code-only feature-gated sandbox wiring, adapter execution, V2 generation, smoke/isolation validation, and `LEVIO_STAGE_3_13_SIMULATOR_INTEGRATION_SANDBOX.md`.
- Stage 3.14 SimulationResponse V2 UI Mapping completed through isolated mapping contracts, lifecycle and section definitions, strict V1/V2 separation, mapping-only validation, and `LEVIO_STAGE_3_14_SIMULATION_RESPONSE_V2_UI_MAPPING.md`.
- Stage 3.15 Controlled Simulator Runtime Switch completed through an internal/dev-only deny-by-default switch, explicit V1 rollback and fallback evidence, sandbox-to-V2-to-UI-mapping execution, switch validation, and `LEVIO_STAGE_3_15_CONTROLLED_SIMULATOR_RUNTIME_SWITCH.md`.
- Stage 3.16 Runtime QA / Regression completed through `LEVIO_STAGE_3_16_RUNTIME_QA_REGRESSION.md`; all required runtime catalogs, static checks, production build, public isolation, API, desktop, and mobile regression checks passed.
- Stage 4.1 Auth Runtime Scope Lock completed through `LEVIO_STAGE_4_1_AUTH_RUNTIME_SCOPE.md`; provider-neutral auth runtime boundary, identity states, session model, guest/authenticated separation, protected route strategy, and rollback/safety plan are fixed without changing runtime code, dependencies, public simulator behavior, persistence, subscriptions, AI, memory, or deterministic brain behavior.
- Stage 4.1A Auth Provider Decision completed through `LEVIO_AUTH_PROVIDER_DECISION.md`; Supabase Auth is approved for next-stage implementation planning under strict provider-boundary and principal-mapping conditions, while Auth.js / NextAuth and Clerk are rejected as initial providers.

## Current CSS Architecture

Current style files:

- `app/styles/motion.css`
- `app/styles/dashboard.css`
- `app/styles/auth.css`
- `app/styles/simulator.css`
- `app/globals.css`

Import/cascade policy:

- `dashboard.css`, `auth.css` and `simulator.css` are intentionally imported before `globals.css`.
- `globals.css` remains the canonical final dark-gold cascade layer.
- `motion.css` is keyframes-only and separate from selector cascade concerns.
- Do not remove or relocate final dark-gold cascade locks without a dedicated visual regression plan.

## Current Stable Status

Stable after Stage 2.7.4:

- cinematic dark-gold baseline preserved;
- desktop stable;
- mobile `390px` stable;
- dashboard mobile navigation stable;
- auth routes stable;
- mock auth flow stable;
- home simulator interaction stable;
- no visual regressions detected;
- context files synchronized after Stage 2.5 QA;
- stable frontend baseline backup branch created: `stable/stage-2-frontend-baseline`;
- mobile performance baseline stable at `390x844`;
- build-trace caveat did not reproduce: `npm run build` completed successfully;
- Stage 2.7.1 research documentation completed in `VISUAL_ENGINE_PLAN.md`;
- Levio product/visual identity source of truth added in `LEVIO_IDENTITY_CORE.md`;
- Stage 2.7.1 checks passed: `npm run lint`, `npm run build`, `./node_modules/.bin/tsc --noEmit`;
- Stage 2.7.2 isolated `/visual-lab` sandbox created in `0781b46`;
- Stage 2.7.3 isolated WebGL visual quality iteration completed in `5553455`;
- Stage 2.7.3 corrective cinematic rendering pass improved glow, simulated bloom, layered fog, animated depth, volumetric feeling and living core motion inside the isolated sandbox;
- Stage 2.7.3 corrective pass 2 further strengthened central gravity/depth, layered atmospheric fog, amber/gold bloom, volumetric halo and internal energy illusion inside the isolated sandbox;
- `fa5dfd9` depth-contrast iteration passed real iPhone Safari technical safety, but did not produce enough perceived cinematic depth or emotional gravity improvement;
- Stage 2.7.4 profiling completed: `/visual-lab` works, no console errors, no horizontal overflow;
- Stage 2.7.4 performance samples: desktop `20-21 FPS`, mobile `390x844` about `26 FPS`, resize `820x760` low sample about `6 FPS`;
- DPR cap works with max `1.5`;
- First Load JS for `/visual-lab`: `90.9 kB`;
- post Stage 2.7.5 build output observed First Load JS for `/visual-lab`: `91.2 kB`;
- post Safari-safe motion fix build output observed First Load JS for `/visual-lab`: `91.4 kB`;
- post Stage 2.7.3 corrective cinematic pass build output observed First Load JS for `/visual-lab`: `91.7 kB`;
- cleanup/remount checked through route transition;
- hidden-tab pause not fully verified because of in-app browser limitations;
- initial iPhone Safari real-device testing started: `/visual-lab` opened, WebGL rendered, FPS was stable around `60`, layout/orientation/no-overflow/heat checks passed, but visible WebGL animation failed before the Safari-safe motion fix;
- iPhone Safari retest after Safari-safe motion fix passed: motion overlay exists, `Time` counter updates, visual animation is visible as breathing zoom plus slight horizontal drift, FPS stayed around `60`, no heat was observed and the page remained stable after `1-2` minutes;
- Stage 2.7.5c adaptive quality / reduced mobile mode decision completed: no additional reduced mode is required now because current real-device data does not trigger the decision gate;
- Stage 2.7.5 mobile safety optimization completed only inside isolated WebGL sandbox files;
- Stage 2.7.5 implemented mobile-safe DPR cap, mobile-safe quality state, lower-power WebGL context preference, reduced-motion handling, hidden-tab pause path and softer mobile shader intensity;
- Stage 2.7.6 formal integration decision completed: current production `DecisionSingularity` remains active, production hero is not replaced, `/visual-lab` remains isolated and no automatic production replacement is approved;
- no npm install was performed;
- no Three.js, React Three Fiber or WebGL dependency was installed;
- no hero redesign or production UI redesign was created;
- production code was not changed during Stage 2.7.1-2.7.6;
- Stage 2.7.5 changed only `components/DecisionSingularityWebGL.tsx` and `components/DecisionSingularityWebGL.module.css`;
- `stash@{0}: pre-stage-1.5-existing-changes` exists and has not been applied.

## QA Baseline From Stage 2.1-2.7-prep

Stage 2.1:

- motion extraction completed in `8eeb150`;
- lint/build/tsc passed;
- route QA found no console errors or horizontal overflow.

Stage 2.2:

- dashboard extraction completed in `959ffe5`;
- desktop and mobile `390px` dashboard routes stable:
  - `/dashboard`
  - `/dashboard/profile`
  - `/dashboard/privacy`
  - `/dashboard/security`
  - `/dashboard/simulations`
  - `/dashboard/simulations/oferta-premium`
  - `/dashboard/decisions`
  - `/dashboard/memory`
- mobile dashboard nav stable.

Stage 2.3:

- auth extraction completed in `7ea3e61`;
- desktop and mobile `390px` auth routes stable:
  - `/login`
  - `/register`
  - `/forgot-password`
- Spanish UI preserved;
- mock login flow stable.

Stage 2.4:

- simulator extraction completed in `c9a86da`;
- simulator base styles moved to `app/styles/simulator.css`;
- `simulator.css` is imported before `globals.css`;
- production `HomeSimulator`, `DecisionSingularity`, WebGL and simulator business logic were not rewritten.

Stage 2.5:

- visual regression QA completed;
- desktop `1440x900` public/auth/dashboard routes stable;
- mobile `390x844` home/auth/dashboard checks stable;
- mobile dashboard compact nav opens and shows 7 links;
- home simulator interaction stable:
  - textarea input accepted;
  - `POST /api/simulate` returned `200`;
  - result rendered with 4 scenario cards;
- no console errors observed;
- no horizontal overflow detected;
- `npm run lint` passed;
- `./node_modules/.bin/tsc --noEmit` passed;
- `npm run build` compiled successfully, completed type/lint validation and generated `19/19` static pages, then stayed on `Collecting build traces` for several minutes and was stopped manually. This is a local build-trace caveat, not a visual regression.

Stage 2.6:

- checkpoint + context sync completed in `aeace9f`;
- Stage 2 documentation closure completed in `c81a9c8`;
- `PROJECT_CONTEXT.md`, `LEVIO_CURRENT_STATE.md` and `CURRENT_STAGE.md` were synchronized after Stage 2.5 visual QA;
- no production code was changed;
- next planned stage is Stage 2.7-prep, visual engine preparation.

Stage 2.7-prep:

- visual engine preparation completed as a protective checkpoint before future experiments;
- backup branch created: `stable/stage-2-frontend-baseline`;
- `npm run build` passed successfully and the previous `Collecting build traces` caveat did not reproduce;
- `npm run lint` passed with no warnings or errors;
- `./node_modules/.bin/tsc --noEmit` passed;
- mobile performance baseline at `390x844` stable:
  - `/` rendered without horizontal overflow;
  - `/dashboard` rendered after mock login without horizontal overflow;
  - mobile dashboard compact nav opens and shows 7 links;
  - home simulator accepted input, called `POST /api/simulate`, rendered 5 thinking steps and 4 scenario cards;
  - console errors were empty;
  - animations were subjectively stable with no obvious jank or layout shift;
- stable frontend foundation is protected before Stage 2.7.1;
- no npm install was performed;
- no Three.js or React Three Fiber dependency was installed;
- no WebGL components were created;
- `/visual-lab` was not created;
- hero and production UI were not redesigned;
- production `DecisionSingularity` remains protected;
- production `HomeSimulator`, simulator logic and `SimulationResponse` contract remain protected;
- WebGL remains forbidden in production until isolated architecture approval.

Stage 2.7.1:

- WebGL architecture research completed in `3d8ef6e`;
- `VISUAL_ENGINE_PLAN.md` created as the research artifact;
- Three.js and React Three Fiber were evaluated at architecture level only;
- Next.js App Router, hydration/SSR, Mobile Safari and weak-device GPU risks were documented;
- conclusion is explicit: do not implement WebGL now, preserve production baseline;
- no npm install was performed;
- no dependencies were added;
- no production code was changed;
- `npm run lint` passed with no warnings or errors;
- `npm run build` passed;
- `./node_modules/.bin/tsc --noEmit` passed;
- next possible stage is only an isolated experimental WebGL track, not production hero integration.

Stage 2.7.2:

- isolated `/visual-lab` route created in `0781b46`;
- raw WebGL sandbox component created without Three.js or React Three Fiber;
- fallback, cleanup, resize handling, DPR cap, hidden-tab pause path, prefers-reduced-motion path and FPS/debug overlay were implemented;
- route was not connected to production navigation;
- production hero and simulator flow were not changed.

Stage 2.7.3:

- isolated WebGL singularity visuals refined in `5553455`;
- visual iteration stayed inside `components/DecisionSingularityWebGL.tsx` and `components/DecisionSingularityWebGL.module.css`;
- production code was not changed;
- dependencies were not added.

Stage 2.7.3 corrective cinematic rendering audit:

- original visual goals:
  - glow;
  - bloom;
  - layered fog;
  - animated depth;
  - volumetric feeling;
  - living core effect;
  - no gaming UI.
- achieved before corrective pass:
  - dark-gold singularity direction;
  - event-horizon core;
  - ring structure;
  - mobile-safe motion;
  - restrained non-gaming behavior.
- partially achieved before corrective pass:
  - simulated bloom;
  - atmospheric layering;
  - volumetric depth;
  - emotional gravity.
- missing cinematic qualities before corrective pass:
  - stronger layered fog;
  - broader soft bloom;
  - deeper atmospheric stacking;
  - subtler volumetric veils;
  - more immersive gravity field.
- corrective improvement applied only inside `components/DecisionSingularityWebGL.tsx`:
  - soft fog veils;
  - depth lensing;
  - simulated horizon bloom;
  - outer depth arc;
  - calmer cinematic atmospheric layering.
- current feel after corrective pass:
  - more cinematic;
  - more premium;
  - more singularity-like;
  - more alive;
  - more emotionally immersive than the previous technical prototype;
  - still lab-only and not production-ready.
- local QA:
  - `npm run dev -- -p 3001` served `/visual-lab` from the correct repo;
  - `curl` returned `200`;
  - dev server was stopped after QA.
- iPhone Safari safety note:
  - previous iPhone Safari validation passed before this corrective visual pass;
  - real iPhone Safari has not yet been re-tested after the new fog/bloom/depth shader changes.
- strict closure status:
  - visually corrected;
  - still blocked until post-pass real iPhone Safari retest confirms FPS, heat, layout/orientation and visible motion remain safe.

Stage 2.7.3 corrective pass 2:

- real iPhone Safari retest after the first corrective pass:
  - `/visual-lab` opened;
  - animation was visible;
  - breathing zoom plus slight horizontal drift worked;
  - FPS stayed around `60`;
  - no heat after `2-3` minutes;
  - orientation was stable;
  - vertical scroll existed;
  - horizontal overflow was absent;
  - no white screen, `404`, freeze or crash occurred.
- blocker remained:
  - visual quality did not feel deeper or more cinematic;
  - sandbox still read as simple motion instead of a premium cinematic singularity.
- conclusion:
  - Stage 2.7.3 remains blocked despite good technical stability.
- second isolated shader pass applied only to `components/DecisionSingularityWebGL.tsx`;
- pass 2 visual focus:
  - stronger central gravity/depth;
  - more visible layered atmospheric fog;
  - richer amber/gold bloom;
  - subtle volumetric halo;
  - more premium cinematic contrast;
  - better internal energy illusion.
- constraints preserved:
  - no Three.js;
  - no R3F;
  - no npm install;
  - existing DPR/mobile-safe behavior preserved;
  - no particle overload;
  - no gaming HUD;
  - no chaotic neon;
  - no aggressive motion.
- strict closure status:
  - Stage 2.7.3 must not be marked completed until another real iPhone Safari retest confirms perceived cinematic depth improvement while FPS, heat, layout/orientation and visible motion remain safe.

Stage 2.7.3b fa5dfd9 iPhone Safari retest:

- commit tested: `fa5dfd9` - controlled WebGL sandbox depth-contrast iteration;
- scope: isolated `/visual-lab` only, no production integration;
- technical result: pass;
- real iPhone Safari opened `/visual-lab`;
- WebGL stayed active;
- fallback did not appear;
- blank canvas did not occur;
- FPS stayed around `60`;
- DPR reported `1.15 / cap 1.15`;
- canvas reported `409x476`;
- motion stayed running;
- portrait and landscape orientation changes stayed stable;
- visible lag was not observed;
- visual result: warning/blocker;
- perceived cinematic depth improvement was almost not noticeable;
- center did not feel significantly deeper or heavier;
- visual appearance was almost the same as before `fa5dfd9`;
- conclusion: `fa5dfd9` is technically safe but visually insufficient;
- historical conclusion at that time: Stage 2.7.3b remained active and required explicit closure;
- current single-pass lightweight shader ceiling is now confirmed more strongly;
- current conclusion after the later pivot: do not continue micro-tweaks in the same shader path for MVP; advanced rendering would require a separate approved future stage.

Stage 2.7.3b research-gate boundary:

- current single-pass lightweight shader path is technically safe but visually insufficient;
- additional micro-tweaks are no longer approved as the default continuation path;
- next decision must be explicit before any next stage:
  - abandon the current shader path;
  - continue only as controlled research;
  - or approve a new isolated research branch;
- minimum information required before any future rendering experiment:
  - explicit approval;
  - one research direction only;
  - sandbox-only scope;
  - visual success criteria defined before implementation;
  - mobile Safari safety budget;
  - rollback checkpoint;
  - stop condition if visual gain is not validated;
  - dependency policy;
  - confirmation of no production imports, routes or navigation exposure;
- Stage 2.7.4 cannot start yet because Stage 2.7.3b has not closed and the visual-quality gate failed;
- Stage 2.7.3b should move toward documentation closure, not implementation.

Stage 2.7.3b reference-target visual gap:

- the uploaded reference screenshot is the current visual benchmark for the intended premium cinematic singularity direction;
- the current `/visual-lab` lightweight WebGL sandbox is technically safe, but does not match the benchmark;
- the gap is not only parameter tuning; it is a visual architecture gap;
- required target qualities:
  - dense orbital field;
  - black gravity core;
  - amber-gold accretion ring;
  - high optical density;
  - layered cinematic depth;
  - fine trajectory detail;
  - premium dark atmosphere;
- candidate future research directions:
  - hybrid static + animated architecture;
  - asset-backed visual layers;
  - multi-layer compositing;
  - controlled orbit/particle system;
  - multi-pass/post-processing research;
- no implementation is approved;
- production `DecisionSingularity` remains protected;
- `/visual-lab` remains isolated;
- Stage 2.7.4 remains blocked;
- future rendering work requires explicit approval.

Stage 2.7.3b preferred next research path:

- hybrid static + lightweight animated architecture is now the preferred next research path over additional lightweight shader micro-tuning;
- reason:
  - the current shader path is technically safe but visually insufficient;
  - the reference target depends on high-density detail that is better handled by a base visual asset;
- preferred direction:
  - static/reference-quality base layer;
  - lightweight overlays only;
- static candidates:
  - dense orbital field;
  - black gravity core;
  - amber-gold accretion ring;
  - fine trajectory detail;
  - cinematic dark atmosphere;
- animated candidates:
  - breathing glow;
  - subtle opacity pulse;
  - slow radial shimmer;
  - minimal orbit drift;
  - light atmospheric veil;
- constraints:
  - sandbox-only;
  - owned, licensed or generated asset required;
  - no production integration;
  - no dependency change by default;
  - reduced-motion fallback;
  - static fallback;
  - mobile Safari safety budget;
- Stage 2.7.4 remains blocked until Stage 2.7.3b documentation closure and explicit next-path approval.

Stage 2.7.4:

- isolated WebGL performance profiling and stress testing completed;
- no files were changed during profiling, so no implementation commit is needed;
- `/visual-lab` worked in the Codex in-app browser;
- console errors were absent;
- horizontal overflow was absent on desktop and mobile;
- desktop FPS was approximately `20-21` in Codex in-app browser;
- mobile `390x844` FPS was approximately `26`;
- resize stress at `820x760` produced a low sample around `6 FPS`;
- DPR cap worked with max `1.5`;
- First Load JS for `/visual-lab` was `90.9 kB`;
- cleanup/remount was checked through route transition;
- hidden-tab pause could not be fully verified because of in-app browser limitations;
- Mobile Safari real-device testing has not been performed yet;
- conclusion: WebGL sandbox remains experimental-only; do not integrate into production hero before performance optimization and real-device Safari validation.

Stage 2.7.5 correction:

- current completed Stage 2.7.5 is mobile safety optimization, not full Safari validation;
- already done:
  - mobile-safe DPR cap lowered to `1.15` for mobile mode;
  - mobile-safe quality state added to the debug/status surface;
  - WebGL context now requests lower-power preference;
  - reduced-motion and hidden-tab pause paths remain part of the sandbox;
  - mobile shader intensity was softened;
  - changes stayed inside isolated `DecisionSingularityWebGL` files;
- not done:
  - completed real-device iPhone Safari validation after the Safari-safe motion fix;
  - thermal/throttling measurement on real devices;
  - formal device matrix;
  - full adaptive quality tiers beyond the current mobile-safe mode;
  - production integration.

Stage 2.7.5b Safari/iPhone validation checklist:

- status: checklist prepared only; Stage 2.7.5 is not complete until real Safari/iPhone validation is actually performed and results are documented;
- scope:
  - test only isolated `/visual-lab`;
  - do not test or integrate production hero as part of this stage;
  - do not modify WebGL code during the observation pass.
- environment fields to record:
  - device model;
  - iOS version;
  - Safari version if available, otherwise iOS/WebKit proxy;
  - test URL, such as `http://<local-network-ip>:3000/visual-lab` or deployed preview `/visual-lab`;
  - network mode: local Wi-Fi, preview deployment or other.
- viewport/orientation matrix:
  - portrait initial load;
  - portrait after Safari address bar collapse/expand;
  - landscape initial load;
  - landscape after address bar collapse/expand where possible;
  - portrait to landscape to portrait repeated at least 3 times.
- observations to record:
  - FPS from the visible debug panel after initial settle;
  - FPS after 60 seconds;
  - FPS after scroll;
  - FPS after each orientation change;
  - debug-panel DPR and quality mode;
  - scroll/layout stability;
  - horizontal overflow presence or absence;
  - canvas resize behavior;
  - visual continuity during orientation changes;
  - memory pressure symptoms: reloads, tab termination, context loss, progressive jank;
  - thermal behavior after 5-10 minutes;
  - battery/heat notes, including starting/ending battery percentage if practical;
  - console errors if connected to Mac Safari Web Inspector;
  - WebGL warnings or context loss/restore events;
  - visual quality notes: cinematic, calm, premium, non-gaming, readable.
- pass criteria:
  - no crash, tab termination or unexpected reload;
  - no persistent blank canvas unless graceful fallback appears;
  - no console errors indicating runtime failure;
  - no horizontal overflow;
  - orientation changes recover layout and canvas sizing;
  - debug panel remains readable;
  - heat remains acceptable for an experimental sandbox;
  - FPS remains usable without severe sustained degradation.
- fail criteria:
  - repeated WebGL context loss;
  - tab reload or termination;
  - persistent blank canvas without fallback;
  - severe FPS collapse after initial settle or orientation changes;
  - layout overflow, clipped controls or unreadable text;
  - excessive heat or rapid battery drain;
  - Safari-specific runtime errors.
- decision gate for Stage 2.7.5c:
  - proceed to adaptive quality / reduced mobile mode only if real-device data shows FPS, heat, memory, orientation or Safari-specific instability;
  - if results pass, keep `/visual-lab` isolated and continue to Stage 2.7.6b formal integration decision only after documented real-device data;
  - production replacement remains not approved.

Stage 2.7.5b initial iPhone Safari result and blocker fix:

- real iPhone Safari opened `/visual-lab` correctly after the earlier local-server-root blocker was resolved;
- WebGL rendered;
- FPS overlay reported approximately `60 FPS`;
- layout stability passed;
- orientation change stability passed;
- horizontal overflow was absent;
- no heat was observed in the initial check;
- blocker found: the visual WebGL singularity appeared static even though FPS was updating;
- likely technical cause: shader motion used absolute `requestAnimationFrame` time with mobile fragment precision risk, so subtle time-based shader changes could visually collapse on iPhone Safari;
- fix applied only inside `components/DecisionSingularityWebGL.tsx`:
  - bounded local shader time instead of absolute RAF timestamp;
  - fragment `highp` precision when available;
  - Safari-safe motion status and animation time diagnostics;
  - slightly clearer but still subtle cinematic breathing, depth, glow and energy-flow motion;
- retest result:
  - `/visual-lab` opened on iPhone Safari;
  - motion overlay exists;
  - `Time` counter updates;
  - visual animation is now visible;
  - motion reads as breathing zoom plus slight horizontal drift;
  - FPS remained stable around `60`;
  - no heat was observed;
  - page remained stable after `1-2` minutes;
- no production files were changed;
- WebGL remains isolated in `/visual-lab`;
- previous animation blocker is resolved in the isolated sandbox;
- Stage 2.7.5b can be marked completed;
- Stage 2.7.5 overall is not fully complete until the adaptive quality / reduced mobile mode decision is made if required.

Stage 2.7.5c adaptive quality / reduced mobile mode decision:

- inspected current isolated WebGL sandbox implementation;
- current sandbox already includes:
  - mobile/small viewport detection;
  - mobile-safe DPR cap `1.15`;
  - lower-power WebGL context preference;
  - reduced-motion path;
  - hidden-tab pause path;
  - softened mobile shader intensity;
  - debug overlay with quality mode, DPR/pixel ratio, motion state and animation time.
- decision gate:
  - add stricter adaptive quality or reduced mobile mode only if real iPhone Safari data shows sustained FPS degradation, heat, memory pressure, context loss, orientation/layout instability, horizontal overflow, unreadable UI or failed visible motion.
- observed real-device result after Safari-safe motion fix:
  - FPS around `60`;
  - visible cinematic motion;
  - no heat after `1-2` minutes;
  - stable layout and orientation;
  - no horizontal overflow.
- decision:
  - no additional adaptive quality or reduced mobile mode implementation is required now;
  - reduced mobile mode active: no, beyond the existing mobile-safe quality mode;
  - do not over-engineer the sandbox while the current mobile-safe path is passing.
- Stage 2.7.5 can be considered complete for the current isolated sandbox validation scope;
- longer thermal profiling remains recommended before any production integration or formal Stage 2.7.6b integration decision, but it is not a blocker for the current Stage 2.7.5c decision.

Stage 2.7.6 formal integration decision:

- decision:
  - keep current production `DecisionSingularity`;
  - do not replace the production hero;
  - keep WebGL in `/visual-lab` only;
  - no automatic production replacement.
- reason:
  - iPhone Safari isolated sandbox validation passed;
  - visual animation is visible;
  - FPS stayed around `60`;
  - no heat was observed in the short test;
  - layout and orientation stayed stable.
- production integration still requires:
  - stronger cinematic quality review;
  - longer thermal profiling;
  - production rollback plan;
  - visual regression QA.
- future direction:
  - possible hybrid or partial integration later;
  - any such work needs a separate explicit approval stage;
  - production `DecisionSingularity` remains protected until then.

## Roadmap

Stable frontend stabilization phase:

- Stage 2.4 - simulator CSS stabilization - completed in `c9a86da`.
- Stage 2.5 - visual regression QA - completed.
- Stage 2.6 - checkpoint + context sync - completed in `c81a9c8`.
- Stage 2.7-prep - visual engine preparation - completed in `0cec475`.
- Stage 2.7.1 - WebGL architecture research - completed in `3d8ef6e`.

Experimental visual engine phase:

- Stage 2.7.2 - isolated WebGL sandbox prototype - completed in `0781b46`.
- Stage 2.7.3 - isolated WebGL visual quality iteration - completed in `5553455`.
- Stage 2.7.3 corrective closure - visually corrected, pending post-pass iPhone Safari retest.
- Stage 2.7.3 corrective pass 2 - applied after failed cinematic-depth retest, pending another real iPhone Safari visual-quality retest.
- Stage 2.7.3b - `fa5dfd9` technical iPhone Safari safety passed, but visual depth improvement failed; stage remains active.
- Stage 2.7.4 - blocked until Stage 2.7.3b closes under strict stage discipline, despite older profiling notes.
- Stage 2.7.5 - provisional mobile safety work in `89e534c`; not a final validation stage or production-integration basis.
- Stage 2.7.6 - provisional/no-production decision only; production replacement remains blocked.
- Stage 2.7.7 - blocked; no escalation stage is approved.
- Stage 2.7.5b - real Safari/iPhone validation completed after Safari-safe motion retest:
  - test iPhone Safari portrait/landscape;
  - test scroll, touch latency, resize/address bar behavior and orientation changes;
  - observe FPS stability, context loss/restore and console errors;
  - document thermal/throttling behavior during longer sessions.
- Stage 2.7.5c - adaptive quality / reduced mobile mode decision completed:
  - no extra reduced mobile mode is required now;
  - current mobile-safe sandbox path is sufficient for observed iPhone Safari data;
  - keep all work isolated from production hero;
  - preserve CSS/DOM production fallback.
- Stage 2.7.6b - reserved for a future production integration proposal only if hybrid or partial integration is explicitly requested later:
  - current production singularity remains active;
  - WebGL stays isolated;
  - no automatic production replacement.

## Critical Experimental Rules

- WebGL/canvas/Three.js/R3F are forbidden in production for the current MVP path unless a future explicit approval creates a new rendering stage.
- `VISUAL_ENGINE_PLAN.md` remains historical research context; it must not override the current Premium Black-Gold AI Decision Intelligence System direction.
- Stage 2.7.x visual-engine findings are historical evidence for the pivot: `/visual-lab` remains experimental-only and heavy rendering must not be integrated into production hero.
- Stage 2.7.3/2.7.3b corrective passes remain documented as research outcomes, not active blockers for Stage 2.8.
- The single-pass lightweight shader visual ceiling is confirmed; do not spend MVP effort on more micro-tweaks in that direction.
- Any future advanced rendering research requires a separate approved stage and must not displace the current Premium Black-Gold MVP path.
- Stage 2.7.5 correction is binding: current mobile work is safety optimization only, not completed Safari validation.
- Stage 2.7.5b result is binding: iPhone Safari retest passed after the isolated Safari-safe motion fix; Stage 2.7.5 overall still awaits the Stage 2.7.5c adaptive-quality/reduced-mobile-mode decision if required.
- Stage 2.7.5c result is binding: current real-device data does not require additional adaptive quality or reduced mobile mode; Stage 2.7.5 is complete for the isolated sandbox scope, with longer thermal profiling still recommended before any production integration decision.
- Stage 2.7.6 formal decision is binding: keep current production `DecisionSingularity`, do not replace production hero, keep WebGL isolated in `/visual-lab`, and require separate approval before any hybrid or partial production integration.
- Production `DecisionSingularity` must not be directly replaced.
- WebGL must run through an isolated sandbox/experimental track.
- Simulator business logic is protected.
- `SimulationResponse` contract is protected.
- Mobile performance baseline is critical.
- No gaming UI direction.
- Cinematic premium minimalism must remain.

## Locked Areas

Do not start without explicit approval:

- real AI backend;
- OpenAI API integration;
- provider-specific production auth integration beyond the Stage 4.1 scope lock;
- database;
- payments;
- production persistence;
- production privacy/security implementation.

Do not rewrite blindly:

- `components/DecisionSingularity.tsx`
- `components/DecisionSingularity.module.css`
- `components/HomeSimulator.tsx`
- `components/DashboardShell.tsx`
- `lib/simulationEngine.ts`
- `SimulationResponse` contract
- `app/globals.css` canonical dark-gold layer
- localStorage keys:
  - `levio_es_mock_session`
  - `levio_es_saved_simulations`
  - `levio_es_language`

## Reporting

- Developer reports: Russian.
- Visible UI: Spanish.
- Do not push unless explicitly requested.
- Do not apply `stash@{0}` without explicit permission.
