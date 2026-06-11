# LEVIO MULTILINGUAL ARCHITECTURE FOUNDATION

## 1. Purpose

This document defines the conceptual multilingual architecture for future Levio implementation.

It does not introduce a translation library, change routes, add a language selector, translate current UI, or connect an AI provider. The current visible product language remains Spanish until a separately approved implementation stage.

## 2. Language Rollout

### First Wave

- Español (`es`)
- English (`en`)
- Русский (`ru`)
- 中文 (`zh`)

### Second Wave

- Français (`fr`)
- العربية (`ar`)

Language rollout must be incremental. A language is production-ready only when product UI, system messages, decision terminology, validation messages, and AI behavior meet the same quality standard.

## 3. Locale Model

The future architecture should distinguish:

- interface locale: language used by product UI;
- input language: language detected or selected for user-provided decision text;
- output language: language used for generated analysis;
- regional context: country or locale-specific formatting and interpretation;
- content locale: language of stored user-authored content.

These values may differ. Changing the interface locale must not silently translate or rewrite saved user content.

## 4. Language Selector

The future language selector should:

- show language names in their native form;
- be available before and after authentication;
- make the active language clear;
- apply changes predictably;
- preserve the user's current work where possible;
- not submit forms or start simulations;
- support keyboard and assistive technology;
- account for RTL layout when Arabic is selected.

The selector is a product control, not merely a browser-language display.

## 5. Language Resolution Order

The future system should resolve interface language in this order:

1. explicit user selection;
2. authenticated user preference;
3. previously stored anonymous preference where permitted;
4. supported browser language;
5. Spanish fallback.

An explicit user selection must override automatic detection.

## 6. Persistence Strategy

Before authentication:

- store only the selected interface locale through an approved browser-safe preference mechanism;
- do not treat browser language as a permanent user preference;
- preserve privacy and allow reset.

After authentication:

- store the confirmed interface locale in the user profile;
- synchronize it across sessions;
- define conflict behavior between local and account preferences;
- keep content language metadata separate from interface preference.

The exact persistence mechanism is not defined in Stage 2.11.

## 7. Translation Dictionaries

Future product UI translations should use version-controlled structured dictionaries.

Dictionaries should:

- use stable semantic keys;
- be organized by product domain;
- support interpolation and pluralization;
- avoid concatenating translated fragments;
- support locale-specific punctuation and formatting;
- include accessibility labels and validation messages;
- expose missing-key behavior during development;
- provide a controlled fallback locale.

Conceptual domains may include:

- common;
- navigation;
- homepage;
- simulator;
- decisions;
- scenarios;
- risks;
- benefits;
- memory;
- subscriptions;
- authentication;
- dashboard;
- errors.

Translation keys must represent meaning rather than English source sentences.

## 8. Content and Data Model Requirements

Future multilingual data models should distinguish:

- stable identifiers;
- locale-independent structured values;
- localized labels;
- user-authored text and its original language;
- generated text and its output language;
- translation status and source where relevant.

Risk levels, decision types, statuses, and entitlement identifiers should be stored as locale-independent values and translated only at presentation boundaries.

Saved user content must preserve its original language unless the user explicitly requests translation.

## 9. RTL Requirements

Arabic requires first-class right-to-left support.

Future RTL implementation must address:

- document direction;
- layout flow;
- text alignment;
- navigation order;
- icons with directional meaning;
- spacing using logical CSS properties;
- mixed LTR and RTL text;
- numbers, dates, and technical identifiers;
- charts and scenario comparisons;
- form controls and validation messages;
- accessibility reading order.

RTL support must be verified as a layout system, not implemented as a text-alignment override.

## 10. AI Language Behaviour

Future AI integration must:

- detect input language without overriding explicit user preference;
- respond in the requested output language;
- preserve names, numbers, and user-provided terminology;
- avoid translating decision facts in ways that change meaning;
- distinguish translation from reasoning;
- retain structured decision values independently of output language;
- state uncertainty consistently across languages;
- use culturally neutral reasoning unless regional context is explicitly relevant;
- avoid inferring country, culture, or risk preference from language alone.

The same decision model should produce semantically equivalent analysis across supported languages, while allowing natural language differences.

## 11. Multilingual Decision Records

A future saved decision should record:

- original input language;
- interface locale at creation;
- generated output language;
- locale-independent structured decision data;
- whether any text was translated;
- translation source or method where relevant.

Changing interface language must not corrupt or silently replace the original record.

## 12. Rules for Future Translations

- Preserve product meaning before literal wording.
- Use consistent decision-intelligence terminology.
- Do not translate stable identifiers or stored enum values.
- Do not concatenate fragments to create sentences.
- Do not assume English grammar or word order.
- Keep text expansion in mind for layout.
- Preserve accessibility meaning.
- Use professional human review before declaring a locale production-ready.
- Review high-stakes safety and uncertainty language separately.
- Maintain a terminology glossary for each supported language.
- Mark machine-generated translations until reviewed where review is required.
- Test interpolation, pluralization, dates, numbers, currencies, and punctuation.
- Avoid regional assumptions unless a locale explicitly includes a region.

## 13. Quality and Testing Requirements

Future implementation must test:

- language selection and persistence;
- fallback behavior;
- missing translation keys;
- long text and text expansion;
- mixed-language input;
- multilingual forms and validation;
- original-language preservation;
- generated output language;
- RTL layout and interaction;
- accessibility labels and reading order;
- locale-specific number and date formatting;
- semantic consistency of decision outputs.

Automated checks should be combined with native-language review.

## 14. Future Implementation Boundaries

A future multilingual implementation stage must separately approve:

- routing strategy;
- dictionary format and tooling;
- locale persistence contracts;
- translation workflow;
- AI language contracts;
- RTL implementation;
- migration of existing visible Spanish strings;
- content and database language fields;
- QA ownership for each locale.

## 15. Current Implementation Status

This document is an architecture foundation only.

Stage 2.11 does not change current Spanish UI, routing, simulator behavior, auth/dashboard routes, or any product code.
