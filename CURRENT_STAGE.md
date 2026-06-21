# CURRENT STAGE

## Active Checkpoint

Stage 4.3 User Data Controls Foundation Closure.

Status: closed at foundation / runtime-boundary level.

Date: 21 June 2026, Europe/Madrid.

The previous active chain of Stage 4.3P through Stage 4.3Z has been
consolidated and removed from the active roadmap state. Stage 4.3 no longer
continues as an open-ended route enablement sequence.

## Product Invariant

Levio remains a Decision Simulation Engine.

Levio is not an AI Chat, not an Answer Engine, and not a Generic AI Assistant.

Immutable architecture:

```text
USER -> SIMULATOR -> DECISION ENGINE -> PROMPT CONTEXT -> AI PROVIDER -> DECISION ENGINE -> SIMULATOR -> UI
```

## What Is Closed

Stage 4.3 is closed as foundation/runtime-boundary complete for User Data
Controls.

Retained foundation:

- contracts;
- consent runtime foundation;
- retention runtime foundation;
- export planning foundation;
- deletion planning foundation;
- runtime boundary;
- runtime QA/regression catalogs;
- server workflow foundation;
- persistence read adapter foundation.

The retained foundation preserves the owner-scoped model based on
`levio_principals.principal_id`.

## What Was Rolled Back

The following Stage 4.3 overreach was removed:

- public User Data Controls route files;
- API route foundation handlers;
- route hardening foundation;
- production read-provider foundation;
- Stage 4.3P through Stage 4.3Z micro-stage documents;
- Stage 4.3Z-1 follow-up path.

This restores Stage 4.3 to its intended size: User Data Controls foundation, not
production API exposure.

## Current Non-Scope

Stage 4.3 does not include:

- Export UI;
- Deletion UI;
- public API endpoints;
- real export files;
- storage/download links;
- deletion writes;
- hard delete;
- account deletion orchestration;
- production Supabase User Data Controls read provider;
- OpenAI integration;
- Billing;
- Subscription Runtime integration;
- product behavior changes.

## Production Readiness

Stage 4.3 is foundation complete but not production-ready.

Any future API/product exposure must be separately approved as a later roadmap
stage and must not be treated as a continuation of Stage 4.3.

## Next Allowed Roadmap Step

Proceed to Stage 4.4 commercial/subscription/billing scope review, or another
explicitly approved roadmap block after Stage 4.3.
