---
'@radoslavirha/tsed-logger': minor
---

Add `requests.ignorePaths` to exclude paths from HTTP request/response logging.

Matching is an anchored, case-sensitive prefix on a path-segment boundary against the
request pathname with the query string stripped: `/health` suppresses `/health`,
`/health/live` and `/health/ready?verbose=1`, but not `/healthchecks-admin`. The guard
runs before any redaction work and applies to failed responses too — the filter is about
the path, not the outcome.

Defaults to `['/health', '/healthz']`, so Kubernetes probe traffic no longer produces a
log line every few seconds for the life of every pod. Set `requests.ignorePaths: []` to
restore the previous behaviour.
