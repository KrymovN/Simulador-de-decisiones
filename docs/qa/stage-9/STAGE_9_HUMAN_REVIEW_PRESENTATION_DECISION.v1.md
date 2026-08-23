# Stage 9 Human Review Presentation Decision v1

Decision ID: `stage-9-human-review-presentation-decision.1`

Status: `OWNER_APPROVED_CANONICAL_DECISION`

## Scope

A versioned deterministic Canonical Human Review Presentation may be generated
from a canonical blind review packet. Human reviewers are not required to read
raw JSON or internal program structures. The generated presentation is the exact
reviewer-visible review target.

## Content preservation

Every `candidate_material.items[].content` value must appear exactly once,
verbatim, and in original item order. Candidate content must not be omitted,
paraphrased, summarized, corrected, or supplemented with new substantive
content. Formatting-only whitespace and layout outside candidate content are
allowed.

## Technical omissions and headings

The presentation may omit technical identifiers, item-type identifiers,
provenance, references, confidence, evidence and authority classifications,
capability/contract metadata, evaluation annotations, transport/outcome
structure, hashes, and schema/version names. These remain available through
canonical source linkage.

Neutral locale-specific headings may be mapped deterministically from supported
item types. They are navigational only and must not add evaluation,
interpretation, or a desired verdict.

## Isolation and provenance

The reviewer-visible presentation must not expose hidden oracle, matcher,
expected answers/verdicts, automated PASS/FAIL, campaign thresholds,
aggregation state, or continuation consequences.

Immutable metadata must include the presentation version, case identity,
locale, semantic cluster, reviewed execution hash, source blind-packet version,
physical source blind-packet SHA-256, and SHA-256 of the exact deterministic
reviewer-visible representation. Human Review provenance must be able to bind a
later submission to that exact presentation without storing reviewer identity.

## Prior manual RU review

The previously completed Russian review based on a manually paraphrased document
is classified as `NON_CANONICAL_PRESENTATION_REVIEW`. It must not be ingested,
converted to Human Review V2, aggregated, used as a supplement, or copied into a
new review. A full independent review must be collected again using the
canonical presentation defined by this decision.
