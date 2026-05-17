# LEVIO.ES — АКТУАЛЬНОЕ СОСТОЯНИЕ ПРОЕКТА

## Дата обновления

17 мая 2026, Europe/Madrid.

Документ обновлён по текущему локальному состоянию проекта в `/Users/s3/Documents/New project` после ревизии структуры, git-состояния, ключевых страниц, компонентов, API route, визуального слоя и результатов проверок.

## 1. Краткое описание проекта

Levio.es — испаноязычная платформа симуляции решений с AI-позиционированием. Продукт помогает пользователю описать сложную ситуацию, увидеть возможные сценарии, риски, преимущества, отложенные последствия и стратегическую рекомендацию до принятия решения.

Текущая версия — cinematic MVP/demo: интерфейс выглядит как премиальный “движок мышления”, но backend, авторизация, база данных и реальная AI-интеграция пока заменены локальными mock-слоями и `localStorage`.

Ключевая идея продукта: не чатбот и не обычный SaaS-dashboard, а визуальный симулятор будущих последствий решений. Публичный сайт и личный кабинет должны оставаться на испанском языке.

# CURRENT DEVELOPMENT STAGE

Stage 1 — Technical stabilization and CSS consolidation.

Current priority:

- stabilize `app/globals.css`;
- preserve cinematic dark-gold identity;
- reduce architectural fragility;
- avoid visual regressions;
- do not connect real backend/auth/database/AI yet;
- do not start new product features before stabilization is complete.

# CRITICAL COMPONENTS — DO NOT REWRITE BLINDLY

Do not fully rewrite without explicit decision:

- `components/DecisionSingularity.tsx`
- `components/DecisionSingularity.module.css`
- `components/HomeSimulator.tsx`
- `components/DashboardShell.tsx`
- `lib/simulationEngine.ts`
- `SimulationResponse` contract
- `app/globals.css` canonical dark-gold layer
- localStorage architecture:
  - `levio_es_mock_session`
  - `levio_es_saved_simulations`
  - `levio_es_language`

Purpose:
These parts currently hold the working cinematic MVP, visual identity, mock simulation flow, dashboard structure and demo persistence. They may be improved carefully, but not replaced or simplified blindly.

# CORE PRODUCT PRINCIPLES

Levio.es is NOT:

- a chatbot;
- a generic SaaS dashboard;
- a template AI assistant;
- a white clean corporate interface;
- a simple form + button website.

Levio.es IS:

- a cinematic AI decision simulator;
- a visual thinking engine;
- an emotional-intellectual experience;
- a future-consequence simulation platform;
- a product where the user observes and feels the reasoning process, not just reads an answer.

Public UI default:

- Spanish language first.
- No visible English UI text.
- Technical reports for the developer may be written in Russian.

# ROADMAP STATUS

[COMPLETED]

- cinematic MVP foundation;
- mock simulator;
- dashboard foundation;
- Spanish UI stabilization;
- singularity visual system;
- mock protected personal area;
- localStorage-based simulation saving;
- mobile hero stabilization.

[IN PROGRESS]

- technical stabilization;
- CSS consolidation;
- architectural cleanup;
- anti-regression protection;
- context/handoff documentation.

[LOCKED / DO NOT START YET]

- real AI backend;
- OpenAI API integration;
- Supabase/Auth.js/Clerk authentication;
- database;
- payments;
- production persistence;
- production privacy/security implementation.

Reason:
These locked features must not be started until the current MVP is technically stabilized and the architecture is protected from regressions.

# VISUAL IDENTITY LOCK

Mandatory visual rules:

- dark cinematic atmosphere;
- deep black / graphite base;
- gold / amber / bronze highlights;
- cream text tones;
- glowing energy effects;
- event-horizon / black-hole / singularity metaphor;
- glass-like panels;
- premium but not generic SaaS aesthetics;
- no white UI redesign;
- no generic startup gradients;
- no template dashboard aesthetics;
- no replacement of `DecisionSingularity` with a static image;
- no simplification that removes the emotional “living thinking” effect.

# DEVELOPMENT WORKFLOW

After every meaningful stage:

1. Run:
   - `npm run build`
   - `npx tsc --noEmit`

2. If lint script exists, also run:
   - `npm run lint`

3. Manual browser QA:
   - desktop hero;
   - mobile hero around 390px width;
   - simulator input/result flow;
   - dashboard overview;
   - profile/privacy/security/simulations/detail/memory/decisions pages.

4. Review git diff before commit.

5. Commit only after successful checks.

6. Update:
   - `PROJECT_CONTEXT.md`
   - `LEVIO_CURRENT_STATE.md` if it is used as the external handoff copy;
   - `CURRENT_STAGE.md` if it exists;
   - `CHANGELOG.md` if it exists.

7. Technical explanations and work reports must be written in Russian.
8. Visible user interface must remain in Spanish.

## 2. Текущий технический стек

- Next.js `14.2.5` с App Router.
- React `18.2.0`.
- TypeScript `6.0.3`.
- Глобальные стили: `app/globals.css`.
- CSS module для центральной сингулярности: `components/DecisionSingularity.module.css`.
- Mock API route: `app/api/simulate/route.ts`.
- Mock simulation engine: `lib/simulationEngine.ts`.
- Demo/personal-area data: `lib/mockSimulations.ts`, `lib/personalArea.ts`.
- Mock-авторизация через `localStorage`: `components/MockAuthGate.tsx`.
- i18n-заготовка: `lib/i18n.ts`.
- Выбор языка в профиле: `components/LanguagePreference.tsx`.
- Скрипты: `npm run dev`, `npm run build`, `npm start`.
- `lint` script в `package.json` отсутствует.
- Remote: `origin/main` указывает на `git@github.com:KrymovN/Simulador-de-decisiones.git` по предыдущему контексту.

Важно по `AGENTS.md`: проект предупреждает, что это “не тот Next.js”, и перед изменением Next.js-кода нужно читать релевантные guide-файлы в `node_modules/next/dist/docs/`. В текущей установке каталог `node_modules/next/dist/docs/` отсутствует, команда `ls node_modules/next/dist/docs` возвращает `No such file or directory`.

## 3. Структура проекта

Ключевая структура на 15 мая 2026:

```text
app/
  layout.tsx
  page.tsx
  globals.css
  api/simulate/route.ts
  login/page.tsx
  register/page.tsx
  forgot-password/page.tsx
  dashboard/page.tsx
  dashboard/decisions/page.tsx
  dashboard/memory/page.tsx
  dashboard/privacy/page.tsx
  dashboard/profile/page.tsx
  dashboard/security/page.tsx
  dashboard/simulations/page.tsx
  dashboard/simulations/[id]/page.tsx

components/
  AuthShell.tsx
  DashboardShell.tsx
  DecisionSingularity.tsx
  DecisionSingularity.module.css
  HomeSimulator.tsx
  LanguagePreference.tsx
  LevioMark.tsx
  MockAuthGate.tsx
  MockFeedbackButton.tsx
  PrivacyPanel.tsx
  SecurityPanel.tsx
  SimulationDetailClient.tsx
  SimulationsList.tsx
  SingularityVisual.tsx

lib/
  i18n.ts
  mockSimulations.ts
  personalArea.ts
  simulationEngine.ts

public/
  apple-icon.png
  favicon.ico
  icon.png
  icon-192.png
  singularity-reference.jpg
```

В корне также есть `AGENTS.md`, `CLAUDE.md`, `LEVIO_CURRENT_STATE.md`, `PROJECT_CONTEXT_LEVIO.md`, `README.md`, `package.json`, `package-lock.json`, `next.config.js`, `tsconfig.json`, `tsconfig.tsbuildinfo`.

`PROJECT_CONTEXT.md` является актуальным основным русскоязычным handoff-файлом. `LEVIO_CURRENT_STATE.md` должен оставаться синхронизированной копией этого контекста для external handoff/Desktop-copy workflow. `PROJECT_CONTEXT_LEVIO.md` остаётся старым summary и не должен использоваться как основной источник без явной просьбы.

## 4. Что реализовано

- Публичная главная страница Levio.es на испанском языке.
- Первый экран с брендом `LEVIO.ES`, испанской навигацией, hero-текстом `Simula. Comprende. Decide con claridad.`, CTA, trust-row и встроенным симулятором.
- Центральная визуальная метафора: animated event-horizon / black-hole / decision singularity.
- Canvas particle field внутри `DecisionSingularity`.
- Компактный hero simulator на desktop и полноширинный mobile simulator.
- POST `/api/simulate`, который валидирует input и возвращает структурированный mock-результат на испанском.
- Thinking stages: понимание ситуации, переменные, сценарии, риски/beneficios, стратегическая рекомендация.
- Вывод сценариев: вероятность, уровень риска, потенциальная выгода, последствия, предупреждения, рекомендация.
- Локальное сохранение симуляций в `localStorage` по ключу `levio_es_saved_simulations`.
- Demo session flow через `levio_es_mock_session`.
- Auth pages: `/login`, `/register`, `/forgot-password`.
- Mock-protected dashboard через `MockAuthGate`.
- Dashboard shell с desktop sidebar и compact `<details>` navigation на mobile.
- Разделы личного кабинета: overview, simulations, simulation detail, decisions, memory, profile, privacy, security.
- Demo feedback actions через `MockFeedbackButton`.
- Privacy/GDPR-like панели, но в интерфейсе термин приведён к испанскому `RGPD`.
- Security panel с демонстрационной защитой, сессиями и 2FA-prep.
- Метаданные и иконки для домена `levio.es`.
- Language preference logic: регистрация и профиль сохраняют выбранный язык в `levio_es_language`.
- Важная текущая особенность i18n: даже если сохранён `en`, `ru` или `uk`, видимый публичный и приватный интерфейс сейчас остаётся на испанском, чтобы не появлялся смешанный English + Spanish UI.

## 5. Что изменилось за последний рабочий этап

Последний рабочий этап был посвящён стабилизации фронтенда и полному удалению английских пользовательских текстов из UI.

Сделано:

- Полностью проверены указанные зоны: `app/page.tsx`, `HomeSimulator`, `DashboardShell`, auth pages, dashboard pages, `lib/i18n.ts`, `lib/personalArea.ts`, `lib/mockSimulations.ts`, `lib/simulationEngine.ts`.
- Исправлены видимые англоязычные/англицизированные тексты:
  - `Confianza mock` → `Confianza estimada`;
  - `Crear sesión demo` → `Crear sesión de prueba`;
  - `Auth productivo pendiente` → `Autenticación real pendiente`;
  - `auth provider productivo` → `proveedor de autenticación productivo`;
  - `backend productivo` → `servidor productivo`;
  - `Local demo` → `Demostración local`;
  - `Mock MVP` → `Prototipo de demostración`;
  - `AI decision-simulation platform` → `Plataforma de simulación de decisiones con IA`;
  - `English` → `Inglés`;
  - `GDPR` → `RGPD`;
  - `timing` → `momento`;
  - `momentum` → `impulso`;
  - `chatbot` → `asistente conversacional`;
  - `premium` в видимых demo-данных → `avanzada` / `clientes de alto valor`.
- `lib/i18n.ts` пересобран вокруг `spanishInterface`: языковые коды и preference сохраняются, но все словари возвращают испанский UI.
- `app/layout.tsx` metadata description переведён на испанский.
- `app/api/simulate/route.ts` meta note переведён на испанский без англоязычного backend/MVP wording.
- `HomeSimulator` теперь использует испанские label/placeholder из `getDictionary("es")`.
- В `app/globals.css` добавлен финальный consolidated stability layer:
  - canonical dark-gold design tokens;
  - panel/border/shadow/radius variables;
  - mobile-safe grids;
  - контраст для форм, sidebar status и ghost buttons;
  - исправления для dashboard mobile;
  - безопасная single-column hero layout на mobile.
- Исправлена mobile-регрессия hero headline: заголовок больше не ломается по буквам.
- `DecisionSingularity.module.css` стабилизирован:
  - уменьшены размеры и max-height;
  - добавлен `contain: layout paint`;
  - снижена opacity particle canvas;
  - ослаблены blur/glow на mobile;
  - исправлена лишняя закрывающая скобка, из-за которой `npm run build` падал.
- Browser QA показал испанский UI на desktop hero, mobile hero, auth pages и dashboard sections.

## 6. Текущее визуальное состояние

Интерфейс сайта описывается как испаноязычный.

Главная страница открывается с:

- брендом `LEVIO.ES`;
- испанской навигацией: `Inicio`, `Escenarios`, `Análisis`, `Riesgos`, `Perspectivas`, `Espacio personal`;
- hero-текстом `Simula. Comprende. Decide con claridad.`;
- CTA `Iniciar nueva simulación` и `Explorar escenarios`;
- trust-row `Motor de IA activo` и `Tus datos son privados y seguros`;
- visual core в стиле event-horizon / black-hole;
- метриками `Escenarios`, `Riesgos`, `Perspectivas`, `Confianza`;
- feature cards на испанском;
- compact simulator input.

Визуальный стиль:

- cinematic dark-gold;
- deep black / warm graphite base;
- gold, amber, bronze и cream accents;
- glass-like panels;
- тонкие золотые линии;
- мягкие glow effects без чрезмерного blur на mobile;
- центральная сингулярность как основной first-viewport signal;
- dashboard остаётся utilitarian/premium, без marketing-hero подхода.

`app/globals.css` остаётся большим и исторически слоистым. В нём есть несколько старых visual refresh sections, включая тёмно-красные, зелёные/кислотные, светлые bright/premium блоки и финальные dark-gold locks. Последний рабочий этап добавил финальный стабилизирующий слой поверх каскада, но полная консолидация CSS ещё не завершена.

## 7. Страницы и маршруты

Реализованные routes:

```text
/                                      главная страница
/login                                 вход
/register                              регистрация
/forgot-password                       восстановление пароля
/dashboard                             overview личного кабинета
/dashboard/decisions                   сохранённые решения
/dashboard/memory                      память решений
/dashboard/privacy                     приватность и права пользователя
/dashboard/profile                     профиль и язык
/dashboard/security                    безопасность
/dashboard/simulations                 история симуляций
/dashboard/simulations/[id]            detail page симуляции
/api/simulate                          mock API route
```

Static params для detail routes:

```text
/dashboard/simulations/oferta-premium
/dashboard/simulations/cambio-pais
/dashboard/simulations/nueva-linea-producto
```

Последний `npm run build` показал 19 app routes: статические страницы, SSG detail route и dynamic `/api/simulate`.

## 8. Компоненты

Ключевые компоненты:

- `LevioMark` — кодовый brand mark с grid/core/orbits/nodes.
- `DecisionSingularity` — клиентский animated event-horizon visual с canvas particle field.
- `DecisionSingularity.module.css` — CSS module для black-hole/accretion-plane/photon-ring visual.
- `HomeSimulator` — клиентский simulator на главной; отправляет POST на `/api/simulate`, имеет local fallback через `buildMockSimulation`, показывает thinking stages и сохраняет результат в `localStorage`.
- `AuthShell` — shell для login/register/forgot-password с испанским security note.
- `MockAuthGate` — mock guard для dashboard pages через `localStorage`.
- `DashboardShell` — общий layout личного кабинета, desktop sidebar, mobile compact nav, logout, privacy-state.
- `LanguagePreference` — выбор языка в profile/demo-mode, сохраняет `levio_es_language` и отправляет событие `levio-language-change`.
- `SimulationsList` — объединяет demo simulations и localStorage simulations, умеет скрывать/удалять симуляции из текущей demo-view.
- `SimulationDetailClient` — detail page; ищет simulation по demo data или `localStorage`.
- `MockFeedbackButton` — временная кнопка для backend-less действий с inline feedback.
- `PrivacyPanel` — права пользователя и privacy actions.
- `SecurityPanel` — demo security score и sessions.
- `SingularityVisual` — файл присутствует, но текущим основным hero visual является `DecisionSingularity`.

## 9. API и логика симуляции

`POST /api/simulate`:

- читает JSON body;
- ожидает строковое поле `input`;
- при пустом input возвращает `400` с испанской ошибкой `Describe una situación para poder simular escenarios.`;
- вызывает `buildMockSimulation(input)`;
- возвращает response с:
  - `meta.lang = "es"`;
  - `safeRender: true`;
  - `mockOnly: true`;
  - `apiReady: true`;
  - испанской note о демонстрационном ответе.

`lib/simulationEngine.ts`:

- строит deterministic-ish mock response на основе hash input;
- определяет категорию: `Negocio`, `Finanzas`, `Vida`, `Estrategia`;
- рассчитывает `risk`, `advantage`, `confidence`, `latency`;
- генерирует thinking stages на испанском;
- генерирует 4 сценария:
  - `Ruta de crecimiento`;
  - `Ruta de exposición`;
  - `Consecuencia retrasada`;
  - `Alternativa estratégica`;
- добавляет impacts и timeline;
- возвращает `SimulationResponse` с `lang: "es"`.

Fallback: если fetch `/api/simulate` в `HomeSimulator` падает, компонент локально вызывает `buildMockSimulation(situation)`.

Реальной AI-интеграции, OpenAI API, streaming, базы данных и server-side persistence пока нет.

## 10. Авторизация и личный кабинет

Авторизация сейчас demo-only:

- `createMockSession()` пишет `levio_es_mock_session` в `localStorage`;
- session содержит `provider`, `createdAt`, `language`, `privacyMode`;
- `createMockSession()` также пишет `levio_es_language`;
- `MockAuthGate` проверяет наличие session и редиректит на `/login?next=...`, если session нет;
- `clearMockSession()` удаляет только mock session;
- login form не валидирует реальные credentials;
- register form создаёт mock session и сохраняет выбранный язык;
- forgot-password показывает demo-сообщение без отправки email.

Личный кабинет:

- `/dashboard` показывает summary cards, engine state, priority simulation, radar, latest simulations, timeline, saved decisions и memory preview.
- `/dashboard/simulations` показывает demo + local simulations.
- `/dashboard/simulations/[id]` показывает сценарии, метрики, impacts, timeline, privacy state.
- `/dashboard/decisions` показывает saved decisions, clarity/exposure bars и review state.
- `/dashboard/memory` показывает consent-like memory controls, scopes, remembered patterns и memory actions.
- `/dashboard/profile` показывает identity/profile form, `LanguagePreference`, account signals, activity log.
- `/dashboard/privacy` показывает privacy cards и `PrivacyPanel`.
- `/dashboard/security` показывает password form, 2FA-prep и `SecurityPanel`.

Нельзя считать это production auth, production privacy implementation или production persistence.

## 11. Ошибки, ограничения и проблемы

- Реальный backend отсутствует.
- Реальная AI-интеграция отсутствует.
- Реальная авторизация отсутствует.
- База данных отсутствует.
- Все персональные данные и симуляции в текущем MVP являются demo/mock/localStorage.
- `app/globals.css` всё ещё слишком большой и слоистый; финальный consolidated layer снижает риск, но не заменяет полноценную CSS-консолидацию.
- Старые visual sections внутри `app/globals.css` могут путать следующие правки и создавать риск responsive-регрессий.
- `PROJECT_CONTEXT_LEVIO.md` остаётся старым summary.
- `components/SingularityVisual.tsx` присутствует, но не является текущим основным visual component.
- `lint` script отсутствует.
- `node_modules/next/dist/docs/` отсутствует, хотя `AGENTS.md` требует читать Next.js guide-файлы из этого каталога.
- Browser QA был сделан выборочно по ключевым страницам, но не является полноценной визуальной регрессией по всем scroll-depth состояниям.
- Технические имена вроде `mock-feedback`, `mock-auth`, route/id `oferta-premium` остаются в коде; они не считаются видимым пользовательским UI.

## 12. Последний стабильный commit

Последний commit:

```text
84e77af (HEAD -> main, origin/main) Refine Levio cinematic singularity visual system
```

Этот commit является последним закоммиченным стабильным состоянием. Все текущие языковые, i18n, CSS-stability и mobile-hero изменения находятся поверх него как незакоммиченные изменения.

## 13. Git status

Состояние перед перезаписью этого контекстного файла:

```text
## main...origin/main
 M app/api/simulate/route.ts
 M app/dashboard/decisions/page.tsx
 M app/dashboard/memory/page.tsx
 M app/dashboard/page.tsx
 M app/dashboard/profile/page.tsx
 M app/dashboard/security/page.tsx
 M app/forgot-password/page.tsx
 M app/globals.css
 M app/layout.tsx
 M app/page.tsx
 M app/register/page.tsx
 M components/DashboardShell.tsx
 M components/DecisionSingularity.module.css
 M components/HomeSimulator.tsx
 M components/MockAuthGate.tsx
 M components/PrivacyPanel.tsx
 M components/SecurityPanel.tsx
 M components/SimulationDetailClient.tsx
 M components/SimulationsList.tsx
 M lib/mockSimulations.ts
 M lib/personalArea.ts
 M lib/simulationEngine.ts
?? PROJECT_CONTEXT.md
?? components/LanguagePreference.tsx
?? lib/i18n.ts
```

После текущей задачи `PROJECT_CONTEXT.md` также обновлён как часть handoff-документации.

## 14. Проверки

Последние проверки, выполненные после стабилизации испанского UI и CSS:

```text
npm run build
npx tsc --noEmit
```

Результат:

- `npm run build` прошёл успешно.
- `npx tsc --noEmit` прошёл успешно.
- Build сгенерировал 19 app routes.
- `lint` не запускался, потому что script отсутствует в `package.json`.

Browser QA:

- Desktop hero на `localhost:3000` проверен: первый экран полностью на испанском, singularity visual отображается.
- Mobile hero на viewport около `390x844` проверен: headline читаемый, кнопки и статусы испанские, simulator button не ломается.
- `/login`, `/register`, `/forgot-password` проверены по DOM-фильтру на подозрительные английские UI-слова.
- `/dashboard`, `/dashboard/profile`, `/dashboard/privacy`, `/dashboard/security`, `/dashboard/simulations`, `/dashboard/simulations/oferta-premium`, `/dashboard/decisions`, `/dashboard/memory` проверены по DOM-фильтру на подозрительные английские UI-слова.
- В видимом UI подозрительные английские слова не обнаружены; route URL и технические class/id не считаются UI.

## 15. Следующие задачи

Рекомендуемый следующий этап:

1. Сделать осознанную CSS-консолидацию `app/globals.css`:
   - удалить или изолировать старые visual refresh sections;
   - оставить один canonical dark-gold token layer;
   - разделить base/layout/dashboard/auth/simulator styles, если это не ломает архитектуру;
   - после каждого шага проверять desktop/mobile hero и dashboard.
2. Прогнать расширенный Browser QA:
   - desktop 1280/1440;
   - mobile 390;
   - dashboard compact navigation;
   - profile/privacy/security/simulations/detail/memory/decisions;
   - длинные simulation results.
3. Подготовить commit текущего этапа после ручного review diff.
4. Не подключать реальный backend, OpenAI API, Supabase, Auth.js/NextAuth, Clerk, payments или database до отдельного решения.
5. Сохранить испаноязычный публичный интерфейс как обязательный default.
6. Если продолжать i18n, решить продуктово: либо временно оставить все словари испанскими, либо включать другие языки только после полной локализации всех visible strings.
7. При дальнейших Next.js-изменениях снова проверять наличие `node_modules/next/dist/docs/`; сейчас каталога нет.

## 16. Инструкция для нового чата Codex

Новый чат должен начать так:

```text
Прочитай PROJECT_CONTEXT.md в корне проекта Levio.es.
Используй его как основной актуальный контекст проекта.
Продолжай разработку строго от состояния, описанного в этом файле.
Не начинай проект заново.
Не меняй архитектуру без необходимости.
Все технические отчёты и объяснения пиши на русском языке.
Интерфейс сайта должен оставаться на испанском языке.
```

Критические правила для следующего этапа:

- Не ломать `/api/simulate` mock flow.
- Не ломать `HomeSimulator` local fallback.
- Не ломать `MockAuthGate` demo-protection.
- Не менять localStorage keys:
  - `levio_es_mock_session`;
  - `levio_es_saved_simulations`;
  - `levio_es_language`.
- Не заменять `DecisionSingularity` картинкой.
- Сохранять event-horizon / black-hole visual metaphor.
- Не возвращать английские пользовательские тексты в UI.
- Не подключать real backend/auth/database/payments/AI на следующем мелком этапе без отдельного решения.
- Перед коммитом просмотреть общий diff: в рабочем дереве много незакоммиченных изменений поверх `84e77af`.
