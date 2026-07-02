# LEVIO TARGET RUNTIME ARCHITECTURE

Date: 19 June 2026, Europe/Madrid.

## Executive Summary

This document locks the immutable target runtime architecture for Levio.es.

Levio is not an AI Chat.
Levio is not an Answer Engine.
Levio is a Decision Simulation Engine.

The AI Provider is an internal replaceable component. It must never become the
center of the product, the direct respondent to the user, or the owner of
decision semantics.

## Immutable Runtime Flow

The target runtime architecture is:

```text
USER
  |
  v
SIMULATOR
  |
  v
DECISION ENGINE
  |
  v
PROMPT CONTEXT
  |
  v
AI PROVIDER
  |
  v
DECISION ENGINE
  |
  v
SIMULATOR
  |
  v
UI
```

This flow is immutable for future Stage 5 runtime integration work unless the
project owner explicitly approves a separate warning, risk analysis, consequence
analysis, and roadmap correction.

## Product Meaning

The Simulator remains the main product mechanism. It models future scenarios,
risks, tradeoffs, consequences, and outcomes.

The Decision Engine runs before AI and after AI:

- before AI, it structures the user decision problem, simulation intent,
  constraints, scenario frame, missing context, safety boundaries, and expected
  output shape;
- after AI, it validates, normalizes, constrains, scores, or rejects candidate
  AI output before any simulator or UI presentation can occur.

The Prompt Context layer prepares controlled context for the AI Provider. It is
not a chat surface and is not a free-form prompt wrapper.

The AI Provider supplies internal candidate material only. It does not answer the
user directly, decide final recommendations, bypass the Decision Engine, or own
the user-facing product behavior.

The UI shows a simulation process, not an AI answer. It must present scenarios,
risks, tradeoffs, consequences, outcomes, uncertainty, and decision structure.

## Forbidden Architecture Drift

Future implementation must not introduce any of these shapes without an explicit
architecture exception:

- `USER -> AI PROVIDER -> UI`;
- `USER -> PROMPT CONTEXT -> AI PROVIDER -> UI`;
- `SIMULATOR -> AI PROVIDER -> UI` without post-AI Decision Engine validation;
- AI-generated final answers that bypass scenario, risk, tradeoff, consequence,
  and outcome modeling;
- AI Provider ownership of final decision semantics;
- OpenAI-specific behavior that makes Levio a wrapper over OpenAI.

## Stage 5 Integration Rule

Any future Stage 5 Runtime Integration step must prove that it preserves:

- Simulator-first product behavior;
- Decision Engine pre-AI control;
- Prompt Context as a constrained internal context layer;
- AI Provider as replaceable candidate-generation infrastructure;
- Decision Engine post-AI validation and normalization;
- Simulator return path before UI presentation;
- UI presentation as decision simulation, not direct answer delivery.

If a proposed implementation cannot preserve this architecture, it must stop
before code changes and produce:

- a warning;
- risk analysis;
- consequence analysis;
- alternative architecture options;
- explicit owner confirmation.

## Current Governance Decision

This document is documentation-only. It does not connect OpenAI, execute model
calls, create API routes, modify simulator runtime, modify Decision Engine
runtime, modify Prompt Context code, modify AI Provider code, modify UI, or start
Stage 5.3D.

Decision: accepted as immutable architecture governance for all future Levio.es
runtime integration work.
