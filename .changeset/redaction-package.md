---
"@radoslavirha/redaction": minor
"@radoslavirha/tsed-logger": patch
---

Extract redaction into a standalone `@radoslavirha/redaction` package.

Redaction was implemented inside `@radoslavirha/tsed-logger` and not exported, so any other
package needing it (outbound HTTP clients, storage, messaging) had no way to reuse it. It is
also not a logging concern — it sanitises values *before* they reach a logger.

- New `@radoslavirha/redaction`: `RedactionProfile` (redactors compiled **once** from
  configuration, then reused per call — `fast-redact` compiles via `new Function`, so building
  per call would dominate logging cost), plus the low-level `RedactionUtils` and the shared Zod
  `{ enabled, redactPaths }` configuration vocabulary.
- `@radoslavirha/tsed-logger`: now consumes the new package instead of its own private copy.
  `RequestFieldOptionsSchema` is the shared schema, and `$onResponse` builds its redactors via
  `RedactionProfile`. **No behavioural change** — inbound request logging emits exactly the same
  lines, and `fast-redact` is no longer a direct dependency.

`@radoslavirha/logger` is deliberately untouched: it stays a pure transport with no redaction
and no `fast-redact`/`zod` dependency.
