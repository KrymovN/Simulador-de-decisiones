# MATERIAL-013 Privacy Review-Reference Addendum

## Authority

- Fixture reference: `S9-MATERIAL-013`
- Issue: `B1-ISSUE-006`
- Root cause: `REVIEW_METHODOLOGY`

This addendum clarifies future review-evidence display. The fixture and runtime
privacy behavior remain correct and unchanged. Frozen historical evidence is
not rewritten.

## Privacy-safe representation

- Human-readable display: `[REDACTED_EMAIL]`
- Machine-readable category: `personal_email_identifier`

Purpose-written synthetic identifiers follow the same display-safety rule.
Ordinary review output must not reproduce the identifier. Authorized forensic
inspection may follow the frozen structural evidence reference.

## Hash-bound structural reference

```json
{
  "fixture_id": "S9-MATERIAL-013",
  "issue_id": "B1-ISSUE-006",
  "evidence_pointer": "docs/qa/review/ai-batches/batch-1/pass-a.json#results[fixture_id=S9-MATERIAL-013]",
  "source_fixture_sha256": "e4983e9ad8ca0c2ee5fe8d046bfe562c05f5ad050528267169dcfc608687026b"
}
```

The reference preserves traceability without changing the source fixture,
historical review artifacts, adjudication, or runtime privacy enforcement.
