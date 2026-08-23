# Stage 9 Human Review Manual Provenance Decision v1

Decision ID: `stage-9-human-review-manual-provenance-decision.1`

Status: `OWNER_APPROVED_CANONICAL_DECISION`

## Scope

A real independent Human Reviewer may complete an authoritative Canonical Human
Review Presentation manually outside an external form platform. This bounded
collection mechanism is permitted only when the resulting Human Review evidence
uses the existing canonical Human Review V2 contract and remains bound to the
exact authoritative presentation.

## Collector-assigned provenance

Manual collection uses an explicit collector-assigned `submissionId`. The
`sourceSystem` identifies the collection mechanism and never identifies the
reviewer. For the Position 3 review authorized by this decision, the exact values
are:

- `submissionId`: `manual-s9-core-001-ru-p3-r1`
- `sourceSystem`: `manual-canonical-presentation-review`

The submission identifier is the first canonical manual Human Review collected
for Position 3 case `S9-CORE-001-RU` against its exact authoritative canonical
presentation. It is not an external form-provider identifier and must not be
used to create a second full review.

## Binding, identity, and validation

Canonical presentation linkage remains mandatory and must establish the exact
presentation version and hash, source blind-packet version and physical hash,
case identity, locale, semantic cluster, and reviewed execution hash. Manual
provenance does not weaken Human Review V2 structural validation, completion,
normalization, duplicate rejection, or campaign evidence validation.

No personal reviewer identity is stored. The source-system value must not be
interpreted as Jotform, Codex, provider output, AI review, or automated review.
This decision does not permit fabricated or AI-generated Human Reviews.

## Frozen semantics

This decision does not change reviewer answers, scoring thresholds, localized
binary tokens, privacy semantics, aggregation rules, duplicate-review rules,
provider qualification, campaign ordering, or continuation-gate semantics.
