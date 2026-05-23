# VISUAL_ENGINE_PLAN.md

# Levio.es — Stage 2.7.1: WebGL architecture research

Текущий стабильный baseline: `0cec475 Prepare visual engine baseline`.

Статус этапа: research only. Этот документ не является спецификацией к немедленной реализации и не разрешает внедрение WebGL в production hero, `DecisionSingularity`, `HomeSimulator`, simulator logic или контракт `SimulationResponse`.

## 1. Three.js: плюсы, минусы, риски

### Плюсы

- Низкоуровневый контроль над WebGL-сценой, камерой, материалами, постобработкой, частицами и шейдерами.
- Подходит для кинематографичной метафоры Levio.es: глубина, свет, гравитация, мягкое движение, объемная атмосфера.
- Может работать без React-обвязки, что дает больше контроля над lifecycle, размером bundle и точками инициализации.
- Хорошо подходит для isolated prototype: можно построить отдельную сцену, измерить FPS, memory pressure, shader cost и только затем решать вопрос интеграции.

### Минусы

- Это отдельный rendering runtime поверх React/Next.js: появляется ручное управление canvas, renderer, resize, pixel ratio, animation loop, cleanup.
- WebGL-сцена легко начинает конкурировать с DOM за CPU/GPU, особенно на hero-экране, где уже важны first paint, input responsiveness и mobile layout stability.
- Требует дисциплины в asset budget: текстуры, геометрия, post-processing и shader complexity быстро создают тяжелый initial load.
- Команда должна поддерживать отдельный слой визуальной архитектуры, debugging и regression QA, а не только CSS/React UI.

### Риски

- Утечки GPU-ресурсов при неправильном dispose материалов, геометрии, render targets и текстур.
- Нестабильный frame pacing на слабых устройствах и при переключении вкладок.
- Ошибки контекста WebGL: context lost, context restore, ограничение количества активных canvas/context в браузере.
- Сложность graceful fallback: production UI не должен деградировать в пустой или сломанный hero, если WebGL недоступен.

## 2. React Three Fiber: плюсы, минусы, риски

### Плюсы

- Декларативный React-подход к Three.js-сценам: сцена описывается компонентами, состояние и props легче согласовать с React-моделью.
- Удобнее разделять визуальные элементы на компоненты, тестировать композицию сцены и переиспользовать примитивы.
- Экосистема вокруг R3F может ускорить прототипирование: controls, helpers, post-processing, asset loading.
- Потенциально лучше подходит для будущей интеграции с App Router, если WebGL будет вынесен в строго client-only boundary.

### Минусы

- Добавляет еще один runtime-слой: React reconciler для Three.js поверх самого Three.js.
- Увеличивает dependency surface и bundle size, особенно если подтянуть дополнительные helper-библиотеки.
- Абстракция может скрыть реальные GPU-costs; сцена выглядит React-компонентной, но исполняется как тяжелый realtime renderer.
- Требует особенно аккуратной границы между Server Components и Client Components.

### Риски

- Hydration/SSR ошибки при случайном использовании browser-only API вне client-only зоны.
- Непредсказуемые performance regressions из-за React state updates, которые затрагивают сцену чаще, чем нужно.
- Сложнее гарантировать deterministic visual baseline, если сцена зависит от времени, размеров viewport, devicePixelRatio и async asset loading.
- Риск преждевременно превратить production hero в экспериментальную лабораторию вместо стабильной cinematic baseline.

## 3. Совместимость с Next.js App Router

Текущий проект использует Next.js `14.2.5` и структуру `app/`, то есть App Router. В такой архитектуре WebGL нельзя рассматривать как обычный Server Component: canvas, WebGL context, `window`, `document`, `ResizeObserver`, `requestAnimationFrame` и device APIs доступны только в браузере.

Безопасная модель для будущего:

- WebGL должен жить внутри отдельного Client Component с явным `"use client"`.
- Импорт тяжелых WebGL-зависимостей должен быть отложенным и изолированным, чтобы не тащить renderer в server path.
- Production route должен сохранять SSR-friendly fallback DOM/CSS baseline.
- Любая будущая WebGL-интеграция должна быть отключаемой feature flag или runtime guard.
- Сцена не должна менять контракт simulator API и не должна становиться зависимостью `SimulationResponse`.

Важно: инструкция проекта просит читать `node_modules/next/dist/docs/` перед изменениями Next.js-кода, но в текущей установке такого каталога нет. В рамках Stage 2.7.1 код Next.js не изменяется; выводы выше основаны на текущей структуре проекта, типах/пакете Next.js в `node_modules` и общих требованиях App Router к client-only browser APIs.

## 4. Hydration/SSR risks

WebGL имеет высокий риск hydration mismatch, если его внедрять прямо в production hero:

- сервер не может отрендерить реальное состояние WebGL canvas;
- размеры viewport, DPR и GPU capabilities известны только на клиенте;
- animation state не является deterministic между SSR и client hydration;
- async asset loading может менять DOM/размеры после hydration;
- browser-only API вызовы во время server render приводят к ошибкам build/runtime.

Минимальное правило будущей архитектуры: сервер должен отдавать стабильный DOM/CSS fallback, а WebGL может подключаться только после client mount и только если runtime checks прошли успешно.

## 5. Mobile Safari risks

Mobile Safari является критичным риском для Levio.es, потому что mobile stability имеет приоритет над экспериментальными visuals.

Основные риски:

- агрессивное управление памятью и выгрузка ресурсов при pressure;
- WebGL context lost при тяжелой сцене, смене вкладки, блокировке экрана или возврате из background;
- нестабильность `devicePixelRatio` и canvas resize при изменении viewport, address bar, orientation;
- перегрев и throttling на длинных animation loops;
- ограничения на video/textures/post-processing в зависимости от устройства и версии iOS;
- touch responsiveness может ухудшиться, если animation loop забирает main thread budget.

Для Levio.es это особенно важно: cinematic feeling не должен ломать читаемость, input latency, scroll stability и premium calmness.

## 6. GPU/performance risks на слабых устройствах

WebGL-сцена в hero может быть визуально сильной, но слабые устройства первыми покажут цену:

- падение FPS ниже стабильного уровня создает ощущение дешевой, дерганой анимации;
- высокий `devicePixelRatio` резко увеличивает fill-rate cost;
- bloom, blur, noise, volumetric effects и particles могут перегрузить fragment shader;
- parallel CSS effects, shadows, filters и WebGL post-processing конкурируют за GPU;
- initial JS bundle может ухудшить LCP/TTI;
- постоянный render loop расходует батарею даже без пользовательского действия;
- отсутствие adaptive quality приведет к неравному опыту между устройствами.

Будущий engine должен иметь quality tiers: low, medium, high; hard caps на DPR; pause/resume logic; reduced-motion handling; canvas teardown; fallback без WebGL.

## 7. Почему сейчас нельзя внедрять WebGL напрямую в production hero

Сейчас production baseline только что стабилизирован в commit `0cec475`. Прямое внедрение WebGL в hero на этом этапе нарушило бы принцип controlled and incremental architecture changes.

Причины не внедрять сейчас:

- Stage 2.7.1 определен как research only, не implementation stage.
- В проекте нет WebGL-зависимостей, и установка новых пакетов на этом этапе запрещена.
- Нет isolated prototype, нет performance data, нет Mobile Safari validation.
- Не определены fallback states, quality tiers, lifecycle cleanup и context lost handling.
- Production hero является частью первого впечатления Levio.es; экспериментальный renderer может повредить cinematic baseline.
- Любая ошибка в hydration или client-only boundary может затронуть главную страницу.
- Визуальная метафора singularity уже имеет продуктовую ценность и не должна быть заменена без доказанного выигрыша.

Вывод: WebGL не должен входить напрямую в production hero до отдельного прототипа и измерений.

## 8. Рекомендуемая безопасная стратегия внедрения в будущем

Будущая стратегия должна быть консервативной:

1. Сохранить текущий CSS/DOM production baseline как canonical fallback.
2. Исследовать Three.js и R3F отдельно от production UI.
3. Создать isolated visual prototype в отдельной зоне, не связанной с `HomeSimulator`, `DecisionSingularity` и simulator API.
4. Ввести performance budget до интеграции: bundle impact, FPS, memory, GPU time, LCP/TTI, battery/thermal behavior.
5. Проверить Mobile Safari на реальных устройствах или максимально близкой device matrix.
6. Добавить runtime capability detection: WebGL support, reduced motion, memory/device class, context lost.
7. Разрешать production integration только после доказанного преимущества над текущим baseline.

Ключевой принцип: WebGL должен быть progressive enhancement, а не обязательной зависимостью главного пользовательского опыта.

## 9. Предложение staged approach

### Stage A — research only

- Зафиксировать архитектурные риски.
- Сравнить Three.js и React Three Fiber.
- Не устанавливать пакеты.
- Не менять production UI.
- Не менять simulator contract.

### Stage B — isolated visual prototype later

- Только после отдельного решения создать изолированный prototype route или lab-area.
- Не подключать prototype к production hero.
- Не менять `DecisionSingularity` и `HomeSimulator`.
- Сравнить raw Three.js и R3F на одном visual brief.

### Stage C — performance tests

- Измерить FPS, dropped frames, memory, GPU pressure, bundle size.
- Проверить adaptive DPR и quality tiers.
- Проверить pause on hidden tab, reduced motion и cleanup.
- Сравнить с текущим CSS/DOM baseline.

### Stage D — mobile Safari validation

- Проверить iPhone Safari в portrait/landscape.
- Проверить scroll, touch latency, orientation changes, address bar resize.
- Проверить context lost/restore.
- Проверить thermal throttling при длительной сессии.

### Stage E — possible production integration

- Только при успешных результатах Stage B-D.
- Внедрять как progressive enhancement.
- Сохранять CSS/DOM fallback.
- Держать feature flag/kill switch.
- Не менять simulator API без отдельного архитектурного этапа.

## 10. Четкий вывод

WebGL сейчас не внедрять.

Production baseline сохранить.

Stage 2.7.1 должен завершиться исследовательским документом и проверками стабильности, без установки зависимостей, без Three.js, без React Three Fiber, без WebGL components, без `/visual-lab`, без изменений production UI, `DecisionSingularity`, `HomeSimulator`, simulator logic, `SimulationResponse` и `app/globals.css`.

