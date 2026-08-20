# @radoslavirha/redaction

## 0.2.1

### Patch Changes

- [#166](https://github.com/radoslavirha/toolkit-hub/pull/166) [`4f38c21`](https://github.com/radoslavirha/toolkit-hub/commit/4f38c21f5849de053391774441ba0e7cdcbae451) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Ship agent guidance as APM skills.
  
  `using-logger` covers the child-scope convention and the rule that the logger is a pure transport that neither redacts nor understands HTTP, plus the structural-port pattern for framework-free packages.
  
  `using-redaction` covers compiling one `RedactionProfile` at construction, `collect()` per call, and redacting before the logger rather than expecting it to sanitise.
  
  `using-tsed-logger` covers injecting `Logger`, deriving scoped children, and registering a subclass under the `Logger` token — including the double-decoration mistake that registers two providers.
  
  `using-tsed-swagger` covers building `SwaggerDocumentConfig` instead of passing object literals, and the field names (`docs`, `security`) that are easy to guess wrong.

## 0.2.0

### Minor Changes

- [#153](https://github.com/radoslavirha/toolkit-hub/pull/153) [`206c4e2`](https://github.com/radoslavirha/toolkit-hub/commit/206c4e27c818e5a086f846ac16fd65927a80c9ac) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Extract redaction into a standalone `@radoslavirha/redaction` package.

  Redaction was implemented inside `@radoslavirha/tsed-logger` and not exported, so any other
  package needing it (outbound HTTP clients, storage, messaging) had no way to reuse it. It is
  also not a logging concern — it sanitises values _before_ they reach a logger.

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

### Patch Changes

- [#153](https://github.com/radoslavirha/toolkit-hub/pull/153) [`206c4e2`](https://github.com/radoslavirha/toolkit-hub/commit/206c4e27c818e5a086f846ac16fd65927a80c9ac) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Redaction package
