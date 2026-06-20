# LEVIO PROJECT PROGRESS TRACKER

## Last Updated

20 июня 2026

## Purpose

Этот документ нужен для отслеживания прогресса Levio.es от идеи до коммерческого продукта. Он не заменяет исходный план и не переписывает roadmap, а фиксирует текущее состояние, завершенные блоки, частично готовые foundation-слои и будущие product/runtime шаги.

## Source Plan

Базовый план взят из `Levio.es.rtf`. Он содержит 15 блоков развития проекта:

1. Идея и позиционирование
2. Визуальный MVP
3. Decision Engine Foundation
4. Runtime Architecture
5. Auth Runtime
6. Persistence Runtime
7. User Data Controls
8. Subscription Runtime
9. Real AI Integration
10. Product Quality Hardening
11. Legal & Trust Layer
12. Market Readiness
13. Closed Beta
14. Public Launch
15. Scale

## Current Visual Progress Summary

```text
Product Alignment        ██████████ 100%
Foundation Readiness     ██████████ 100%
Runtime Completion       ████░░░░░░ 40%
Commercial Readiness     ██░░░░░░░░ 15%
Overall Project Progress ███████░░░ 70%
```

Проценты являются осторожной рабочей оценкой. Foundation-ready не означает production-ready.

## Project Health

```text
Architecture Health      ██████████ 100%
Product Alignment        ██████████ 100%
Foundation Readiness     ██████████ 100%
Runtime Readiness        ████░░░░░░ 40%
Commercial Readiness     ██░░░░░░░░ 15%
Market Readiness         ░░░░░░░░░░ 5%
```

## Block Progress

### 1. Идея и позиционирование

Статус: Завершено
Прогресс: ██████████ 100%
Блокирующий фактор: Отсутствует.
Последнее изменение: Product alignment завершен, публичный слой выровнен под Decision Simulation Engine.
Следующий шаг: Поддерживать без отклонений.

### 2. Визуальный MVP

Статус: Завершено
Прогресс: ██████████ 100%
Блокирующий фактор: Отсутствует.
Последнее изменение: Главная страница, dashboard и mock output выровнены.
Следующий шаг: Только QA и поддержка соответствия стратегии.

### 3. Decision Engine Foundation

Статус: Завершено
Прогресс: ██████████ 100%
Блокирующий фактор: Отсутствует.
Последнее изменение: Детерминированный Decision Engine foundation завершен и изолирован от публичного runtime.
Следующий шаг: Использовать как внутреннюю основу будущего runtime, не превращая продукт в Answer Engine.

### 4. Runtime Architecture

Статус: Завершено
Прогресс: ██████████ 100%
Блокирующий фактор: Отсутствует.
Последнее изменение: Target runtime architecture зафиксирована как immutable governance reference.
Следующий шаг: Любая будущая интеграция должна сохранять утвержденный flow.

### 5. Auth Runtime

Статус: Частично выполнено
Прогресс: ████░░░░░░ 40%
Блокирующий фактор: Production validation еще не завершена.
Последнее изменение: Auth Runtime foundation и hardening завершены, но production-provider validation и полноценная account/session UX зрелость еще впереди.
Следующий шаг: Валидировать production Supabase settings, redirects, email delivery и session behavior перед реальными пользователями.

### 6. Persistence Runtime

Статус: Частично выполнено
Прогресс: ██████░░░░ 60%
Блокирующий фактор: Production persistence runtime еще не подключен к пользовательскому продукту.
Последнее изменение: Stage 4.2L Persistence Runtime State Closure & Product Integration Scope Lock завершен; Stage 4.2 закрыт как foundation / isolated runtime boundary, но product integration и production readiness не одобрены.
Следующий шаг: Поддерживать owner-scoped persistence boundary как зависимость Stage 4.3Q.

### 7. User Data Controls

Статус: Read provider integration gate завершён, production route enablement получил NO-GO
Прогресс: █████░░░░░ 52%
Блокирующий фактор: Route-through-provider integration evidence, route-specific rate limiting / abuse protection, CSRF/origin/session hardening, rollback rehearsal, browser/API product QA, public UI/product workflow, real export package generation, deletion writes и legal/privacy publication еще не завершены.
Последнее изменение: Stage 4.3Y User Data Controls Read Provider Integration Validation & Route Enablement Gate завершён; Stage 4.3S/4.3T/4.3V/4.3X integration chain признан структурно coherent, но production route enablement получил NO-GO.
Следующий шаг: Stage 4.3Z User Data Controls Route Enablement Blocker Closure & Integration Evidence после отдельного owner approval.

### 8. Subscription Runtime

Статус: Foundation завершен, billing не начат
Прогресс: █░░░░░░░░░ 10%
Блокирующий фактор: Billing provider, payments и commercial entitlement runtime еще не подключены.
Последнее изменение: Stage 4.4 subscription contracts/runtime/boundary/QA закрыты как foundation. Billing, payments, Stripe и UI не подключены.
Следующий шаг: Отдельно утвердить коммерческий billing/runtime integration scope.

### 9. Real AI Integration

Статус: Частично выполнено на foundation уровне
Прогресс: ██░░░░░░░░ 20%
Блокирующий фактор: Отсутствует real AI runtime и real model calls.
Последнее изменение: AI Provider, Prompt Context и AI quality/cost/safety foundation layers существуют изолированно; real model calls не подключены.
Следующий шаг: Подключать AI Provider только через target runtime architecture и Decision Engine validation.

### 10. Product Quality Hardening

Статус: Начато
Прогресс: █░░░░░░░░░ 10%
Блокирующий фактор: Нет полного production QA/security/privacy/performance hardening цикла.
Последнее изменение: Локальные проверки, lint/typecheck и отдельные QA/regression catalogs используются, но production hardening еще не завершен.
Следующий шаг: Расширить тесты, security/privacy/performance/mobile QA, monitoring и rollback evidence.

### 11. Legal & Trust Layer

Статус: Частично спланировано
Прогресс: ██░░░░░░░░ 20%
Блокирующий фактор: Публичные legal documents и qualified legal review еще не завершены.
Последнее изменение: Trust/legal principles и data-control boundaries описаны, но публичные legal documents и legal review не завершены.
Следующий шаг: Подготовить privacy policy, terms, cookies, AI transparency и high-risk disclaimers перед рынком.

### 12. Market Readiness

Статус: Почти не начато
Прогресс: ░░░░░░░░░░ 5%
Блокирующий фактор: Ожидает завершения core runtime, trust layer и commercial packaging.
Последнее изменение: Публичное позиционирование приведено в порядок, но pricing, onboarding, analytics, FAQ/help и conversion flows еще не готовы.
Следующий шаг: Начать market readiness после стабилизации core runtime и legal/trust layer.

### 13. Closed Beta

Статус: Не начато
Прогресс: ░░░░░░░░░░ 0%
Блокирующий фактор: Ожидает production-ready runtime, data controls, trust layer и QA.
Последнее изменение: Closed beta не запускалась.
Следующий шаг: Запускать только после real runtime, data controls, trust layer и достаточного QA.

### 14. Public Launch

Статус: Не начато
Прогресс: ░░░░░░░░░░ 0%
Блокирующий фактор: Ожидает closed beta, commercial readiness и launch QA.
Последнее изменение: Public launch не запускался.
Следующий шаг: Планировать после closed beta и коммерческой готовности.

### 15. Scale

Статус: Не начато
Прогресс: ░░░░░░░░░░ 0%
Блокирующий фактор: Ожидает public launch, первых клиентов и подтвержденной unit economics.
Последнее изменение: Scale-направления остаются future roadmap.
Следующий шаг: Рассматривать после public launch, первых клиентов и подтвержденной unit economics.

## Current Position

- Product Alignment завершен.
- Foundation layers в основном завершены.
- Runtime completion еще впереди.
- Stage 4.3 Runtime Dependency & Scope Lock Audit завершен.
- Stage 4.2L Persistence Runtime State Closure & Product Integration Scope Lock завершен.
- Stage 4.3P User Data Controls Product Integration Scope Lock завершен.
- Stage 4.3Q User Data Controls Product Integration Readiness Plan завершен.
- Stage 4.3R User Data Controls Implementation Gate & Evidence Closure завершен с итогом NO-GO.
- Stage 4.3R Blocker Reality Audit завершен.
- Итог аудита: blockers are predominantly implementation gap.
- Часть блокеров можно закрывать evidence validation, но core user-data workflows требуют инженерной разработки.
- Владелец проекта явно одобрил начало Stage 4.3S implementation.
- Stage 4.3S User Data Controls Server Workflow Foundation реализован.
- Владелец проекта явно одобрил начало Stage 4.3T implementation.
- Stage 4.3T User Data Controls Persistence Read Adapter Foundation реализован.
- User Data Controls теперь имеют server-side workflow foundation и owner-scoped persistence read adapter foundation, но не public product integration.
- Владелец проекта явно одобрил Stage 4.3U governance gate.
- Stage 4.3U User Data Controls API Scope & Product Exposure Gate завершен.
- User Data Controls теперь имеют conditional GO для будущего narrow server-side API route foundation stage.
- Владелец проекта явно одобрил Stage 4.3V API route foundation implementation.
- Stage 4.3V User Data Controls API Route Foundation реализован.
- User Data Controls теперь имеют authenticated, owner-scoped, feature-flagged export/deletion request route foundation.
- Владелец проекта явно одобрил Stage 4.3W governance gate.
- Stage 4.3W User Data Controls API Route Validation & Production Read Provider Scope Gate завершен.
- Gate result: GO for Stage 4.3X Production Read Provider Foundation; NO-GO for production route enablement.
- Владелец проекта явно одобрил Stage 4.3X production read provider foundation implementation.
- Stage 4.3X User Data Controls Production Read Provider Foundation реализован.
- User Data Controls теперь имеют server-only, read-only, owner-scoped production read provider foundation, disabled by default.
- Stage 4.3Y User Data Controls Read Provider Integration Validation & Route Enablement Gate завершен.
- Gate result: NO-GO for production route enablement.
- Stage 4.3S/4.3T/4.3V/4.3X integration chain is structurally coherent, but route-through-provider integration evidence, route hardening evidence, rollback rehearsal and browser/API product QA remain blockers.
- Stage 4.3 production runtime пока не завершен.
- Production route enablement, public UI workflows, production release, real export generation, deletion writes и production QA начинать нельзя без отдельного approval.
- Следующий допустимый roadmap-шаг: Stage 4.3Z User Data Controls Route Enablement Blocker Closure & Integration Evidence.
- В текущем состоянии Stage 4.3 и Stage 4.4 следует понимать как foundation/runtime-boundary закрытие, а не как production-ready UI/API/commercial execution.

## Current Roadmap Focus

Current Focus:
Stage 4.3Z User Data Controls Route Enablement Blocker Closure & Integration Evidence → later route enablement/product workflow approval → Stage 4.4 Commercial/Billing Runtime Scope → Real AI Integration

Do Not Skip:
Persistence product integration boundary
User Data Controls
Subscription Runtime

Reason:
Эти блоки являются обязательным мостом между foundation и production product. Stage 4.3 real user-data workflows зависят от owner-scoped persistence runtime и production-safe auth/session behavior.

## Decision Log

### 20 июня 2026

- Выполнен Stage 4.3Y User Data Controls Read Provider Integration Validation & Route Enablement Gate.
- Создан `LEVIO_STAGE_4_3Y_READ_PROVIDER_INTEGRATION_VALIDATION_AND_ROUTE_ENABLEMENT_GATE.md`.
- Runtime code, API routes, UI, OpenAI, Billing, Subscription Runtime, real export packages, storage/download links, deletion writes, hard delete и account deletion orchestration не изменялись.
- Зафиксировано: Stage 4.3S/4.3T/4.3V/4.3X integration chain structurally coherent; canonical principal resolution, ownership guarantees, read provider boundaries, route protection, feature flags, sanitization, fail-closed behavior и rollback posture reviewed.
- Gate result: NO-GO for production route enablement.
- Technical blockers: no recorded route-through-provider validation against approved production-like Supabase target, no route-specific rate limiting / abuse-protection evidence, no CSRF/origin/session-hardening evidence, no expired/revoked-session route evidence, no route-through-provider sanitized error validation, no rollback rehearsal, no browser/API product QA for enabled routes.
- Следующий допустимый roadmap-шаг: Stage 4.3Z User Data Controls Route Enablement Blocker Closure & Integration Evidence после отдельного owner approval.
- Владелец проекта явно одобрил переход к Stage 4.3X.
- Выполнен Stage 4.3X User Data Controls Production Read Provider Foundation.
- Создан `LEVIO_STAGE_4_3X_PRODUCTION_READ_PROVIDER_FOUNDATION.md`.
- Добавлен `lib/user-data-controls/production-read-provider.ts`.
- Добавлен `lib/user-data-controls/production-read-provider-validation.ts`.
- Обновлен `lib/user-data-controls/api-route-foundation.ts`.
- Обновлен `lib/user-data-controls/index.ts`.
- Реализовано: server-only owner-scoped production read provider foundation, canonical principal_id based reads, minimal planning column selection, sanitized row contracts, fail-closed disabled/missing-principal/wrong-owner/malformed-row behavior, export planning read path и deletion planning read path.
- Не реализовано: production route enablement, Product UI, Export UI, Deletion UI, OpenAI, Billing, Subscription Runtime, real export packages, storage/download links, deletion writes, hard delete, account deletion orchestration, durable consent ledger, retention jobs, product behavior changes.
- Stage 4.3X validation catalog прошел: 10 passed / 0 failed.
- Следующий допустимый roadmap-шаг: Stage 4.3Y User Data Controls Read Provider Integration Validation & Route Enablement Gate после отдельного owner approval.
- Владелец проекта явно одобрил переход к Stage 4.3W.
- Выполнен Stage 4.3W User Data Controls API Route Validation & Production Read Provider Scope Gate.
- Создан `LEVIO_STAGE_4_3W_API_ROUTE_VALIDATION_AND_READ_PROVIDER_SCOPE_GATE.md`.
- Зафиксировано: current API route foundation audit, owner-scoped guarantees, principal resolution path, fail-closed behavior, feature flag protection, response sanitization, export/deletion planning paths, production read-provider requirements, allowed/forbidden reads, validation matrix и rollback matrix.
- Gate result: GO for Stage 4.3X User Data Controls Production Read Provider Foundation.
- NO-GO remains for production route enablement, public UI exposure, real export package generation, deletion writes, hard delete, account deletion orchestration, OpenAI, Billing и Subscription Runtime.
- Следующий допустимый roadmap-шаг: Stage 4.3X User Data Controls Production Read Provider Foundation после отдельного owner approval.
- Владелец проекта явно одобрил переход к Stage 4.3V.
- Выполнен Stage 4.3V User Data Controls API Route Foundation.
- Создан `LEVIO_STAGE_4_3V_API_ROUTE_FOUNDATION.md`.
- Добавлен `lib/user-data-controls/api-route-foundation.ts`.
- Добавлен `lib/user-data-controls/api-route-foundation-validation.ts`.
- Добавлен `app/api/user-data-controls/export/route.ts`.
- Добавлен `app/api/user-data-controls/deletion/route.ts`.
- Обновлен `lib/user-data-controls/index.ts`.
- Реализовано: authenticated owner-scoped route foundation, canonical principal workflow usage, export request manifest-only endpoint foundation, deletion request lifecycle-only endpoint foundation, fail-closed feature flag, rollback-safe response contract и deterministic validation.
- Не реализовано: Product UI, Export UI, Deletion UI, OpenAI, Billing, Subscription Runtime, production route enablement, production Supabase read-provider connection, real export packages, storage/download links, deletion writes, hard delete, account deletion orchestration, durable consent ledger, retention jobs, product behavior changes.
- Stage 4.3V validation catalog прошел: 10 passed / 0 failed.
- Следующий допустимый roadmap-шаг: Stage 4.3W User Data Controls API Route Validation & Production Read Provider Scope Gate после отдельного owner approval.
- Владелец проекта явно одобрил переход к Stage 4.3U.
- Выполнен Stage 4.3U User Data Controls API Scope & Product Exposure Gate.
- Создан `LEVIO_STAGE_4_3U_API_SCOPE_AND_PRODUCT_EXPOSURE_GATE.md`.
- Зафиксировано: allowed future API operations, data that may/must not leave the persistence boundary, server-only operations, ownership/principal checks, rollback requirements, API exposure matrix и product exposure matrix.
- Gate result: conditional GO для будущего narrow server-side API route foundation stage.
- Не реализовано: API routes, public endpoints, UI, OpenAI, Billing, Subscription Runtime, real export packages, deletion writes, hard delete, consent ledger, retention jobs, product behavior changes.
- Следующий допустимый roadmap-шаг: Stage 4.3V User Data Controls API Route Foundation после отдельного owner approval.
- Владелец проекта явно одобрил переход к Stage 4.3T.
- Выполнен Stage 4.3T User Data Controls Persistence Read Adapter Foundation.
- Создан `LEVIO_STAGE_4_3T_PERSISTENCE_READ_ADAPTER_FOUNDATION.md`.
- Добавлен `lib/user-data-controls/persistence-read-adapter.ts`.
- Добавлен `lib/user-data-controls/persistence-read-adapter-validation.ts`.
- Обновлен `lib/user-data-controls/index.ts`.
- Реализовано: owner-scoped persistence read adapter foundation, safe server-only read provider contract, client ownership exclusion, principal-based artifact access, export/deletion snapshot mapping, history parent context и rollback-safe behavior.
- Не реализовано: UI, API routes, OpenAI, Billing, Subscription Runtime, real export packages, deletion writes, hard delete, account deletion orchestration, product behavior changes.
- Stage 4.3T validation catalog прошел: 10 passed / 0 failed.
- Следующий допустимый roadmap-шаг: Stage 4.3U User Data Controls API Scope & Product Exposure Gate после отдельного owner approval.
- Владелец проекта явно одобрил переход к Stage 4.3S.
- Выполнен Stage 4.3S User Data Controls Server Workflow Foundation.
- Создан `LEVIO_STAGE_4_3S_SERVER_WORKFLOW_FOUNDATION.md`.
- Добавлен `lib/user-data-controls/server-workflow.ts`.
- Добавлен `lib/user-data-controls/server-workflow-validation.ts`.
- Обновлен `lib/user-data-controls/index.ts`.
- Реализовано: canonical principal resolution path, ownership verification workflow, owner-scoped artifact access contract, export workflow foundation contracts, deletion workflow foundation contracts, runtime invariants и rollback-safe implementation.
- Не реализовано: UI, API routes, OpenAI, Billing, Subscription Runtime, real export files, deletion writes, hard delete, product behavior changes.
- Stage 4.3S validation catalog прошел: 11 passed / 0 failed.
- Следующий допустимый roadmap-шаг: Stage 4.3T User Data Controls Persistence Read Adapter Foundation после отдельного owner approval.
- Выполнен Stage 4.3R Blocker Reality Audit.
- Создан `LEVIO_STAGE_4_3R_BLOCKER_REALITY_AUDIT.md`.
- Для каждого Stage 4.3R blocker зафиксированы implementation status и evidence status.
- Итоговое заключение: blockers are predominantly implementation gap.
- Evidence validation может помочь по production auth/session, legal/privacy copy path, foundation QA и rollback design.
- Engineering implementation требуется для canonical principal resolution product path, owner-scoped persistence product reads, export workflow, deletion workflow, product QA и complete workflow rollback evidence.
- Новый roadmap stage этим аудитом не создан автоматически.
- Выполнен Stage 4.3R User Data Controls Implementation Gate & Evidence Closure.
- Создан `LEVIO_STAGE_4_3R_USER_DATA_CONTROLS_IMPLEMENTATION_GATE.md`.
- Итоговый gate status: NO-GO.
- Зафиксировано: foundation evidence существует, но implementation evidence не закрывает production auth/session, canonical principal resolution, owner-scoped persistence product readiness, export/deletion/retention/consent workflows, legal/privacy, QA, rollback и explicit owner approval.
- Stage 4.3S User Data Controls Server Workflow Foundation начинать нельзя.
- Следующий approved step: Stage 4.3R-1 User Data Controls Gate Blocker Closure Plan.
- Выполнен Stage 4.3Q User Data Controls Product Integration Readiness Plan.
- Создан `LEVIO_STAGE_4_3Q_USER_DATA_CONTROLS_READINESS_PLAN.md`.
- Зафиксировано: Stage 4.3 foundation готов как input, но implementation не разрешен сразу после 4.3Q.
- Перед implementation обязательны Stage 4.3R gate, auth/session evidence, principal-resolution evidence, persistence product-readiness evidence, legal/privacy copy path, QA matrix, rollback evidence и explicit owner approval.
- Первый возможный implementation stage после gate: Stage 4.3S User Data Controls Server Workflow Foundation.
- Следующий approved step: Stage 4.3R User Data Controls Implementation Gate & Evidence Closure.
- Выполнен Stage 4.3P User Data Controls Product Integration Scope Lock.
- Создан `LEVIO_STAGE_4_3P_USER_DATA_CONTROLS_PRODUCT_INTEGRATION_SCOPE_LOCK.md`.
- Зафиксировано: user data controls относятся к export, deletion, consent, retention, privacy visibility и ownership verification вокруг decision simulation artifacts.
- Зафиксировано: AI chat history, generic prompt history и assistant conversation logs не являются основными продуктовыми объектами Levio.
- Следующий approved step: Stage 4.3Q User Data Controls Product Integration Readiness Plan.
- Выполнен Stage 4.2L Persistence Runtime State Closure & Product Integration Scope Lock.
- Создан `LEVIO_STAGE_4_2L_PERSISTENCE_RUNTIME_STATE_CLOSURE.md`.
- Зафиксировано: Stage 4.2 foundation / isolated runtime boundary complete, но product integration и production readiness не одобрены.
- Следующий approved step: Stage 4.3P User Data Controls Product Integration Scope Lock.
- Выполнен Stage 4.3 Runtime Dependency & Scope Lock Audit.
- Создан `LEVIO_STAGE_4_3_RUNTIME_DEPENDENCY_SCOPE_LOCK.md`.
- Зафиксировано: Stage 4.3 production runtime не одобрен, потому что owner-scoped persistence product integration и production auth validation еще не закрыты.
- Предыдущий вывод Stage 4.3 audit: Stage 4.2L Persistence Runtime State Closure & Product Integration Scope Lock должен быть выполнен перед Stage 4.3 production runtime.
- Создан `LEVIO_PROJECT_PROGRESS.md` как активный progress tracker проекта.
- Product Alignment Session завершена.
- Главная страница выровнена под Decision Simulation Engine.
- Dashboard/Auth/Memory/Profile/Privacy/Security copy выровнены без overpromise.
- Simulation/detail/mock output copy очищены от final recommendation / answer-engine wording.
- Зафиксировано правило: перед крупными действиями сверять `PROJECT_CONTEXT.md`, `CURRENT_STAGE.md`, `LEVIO_CURRENT_STATE.md` и `LEVIO_PROJECT_PROGRESS.md`.
- Следующий roadmap focus: Stage 4.3 User Data Controls Runtime → Stage 4.4 Subscription Runtime → Real AI Integration.

Current Progress:
Overall Project Progress — 70%

## Completed Recently

- `0ce7290a88475448d1429b8eb48db4c0d54de6a6` — Decision Simulation Positioning Alignment
- `76816e40dde0bf1a12dc2e4b18b35200a4f922b3` — Presentation Overpromise Alignment
- `793da6ef09c077cbeadfcd38e1c2173655ffe7ee` — Dashboard Presentation Alignment
- `2465d6a940b0c98d5d8967f175c544733b567142` — Simulation Presentation Alignment

## Rules

- Levio = Decision Simulation Engine.
- Не AI Chat.
- Не Answer Engine.
- Не generic AI assistant.
- AI Provider — внутренний компонент.
- Target runtime architecture:

```text
USER → SIMULATOR → DECISION ENGINE → PROMPT CONTEXT → AI PROVIDER → DECISION ENGINE → SIMULATOR → UI
```

## How To Update This Document

1. Обновлять после каждого завершенного этапа.
2. Не завышать проценты.
3. Не считать foundation как production-ready.
4. Разделять:
   - planned
   - foundation
   - partial
   - completed
5. Любое увеличение процента должно иметь основание: commit, audit, runtime implementation или documented closure.
6. Если реализация частичная — не писать "завершено".
7. Перед началом нового крупного этапа сверять документ с `CURRENT_STAGE.md` и `LEVIO_CURRENT_STATE.md`.
8. После stage closure обновлять проценты.
9. После audit closure обновлять статус блока.
10. Блокирующий фактор обязателен для всех незавершенных блоков.
11. Если блок достиг 100%, блокирующий фактор должен быть "Отсутствует".

Шкала прогресса:

```text
0%   = ░░░░░░░░░░
10%  = █░░░░░░░░░
20%  = ██░░░░░░░░
30%  = ███░░░░░░░
40%  = ████░░░░░░
50%  = █████░░░░░
60%  = ██████░░░░
70%  = ███████░░░
80%  = ████████░░
90%  = █████████░
100% = ██████████
```
