# Stage 9 Human Review RU Binary Token Decision v1

Decision ID: `stage-9-human-review-ru-binary-token-decision.1`

Status: `OWNER_APPROVED_CANONICAL_DECISION`

Scope: Human Review V2 submissions with `reviewLanguage = "ru"`.

## Canonical literals

| Raw literal | Normalized semantic |
| --- | --- |
| `ДА` | `AFFIRMATIVE` |
| `НЕТ` | `NEGATIVE` |

The literals are exact and case-sensitive. The normalizer does not add trimming,
case folding, coercion, synonyms, translations, fuzzy matching, or a
locale-independent fallback.

This decision does not define tokens for `zh` and does not change existing `es`
or `en` mappings. It does not change scoring, PASS/FAIL thresholds, privacy
semantics, the exact `ADECUADO` global privacy assessment requirement,
independence semantics, aggregation, duplicate-review policy, supplement policy,
provider qualification, or campaign continuation criteria.
