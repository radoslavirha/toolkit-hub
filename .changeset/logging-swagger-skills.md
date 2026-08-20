---
"@radoslavirha/logger": patch
"@radoslavirha/redaction": patch
"@radoslavirha/tsed-logger": patch
"@radoslavirha/tsed-swagger": patch
---

Ship agent guidance as APM skills.

`using-logger` covers the child-scope convention and the rule that the logger is a pure transport that neither redacts nor understands HTTP, plus the structural-port pattern for framework-free packages.

`using-redaction` covers compiling one `RedactionProfile` at construction, `collect()` per call, and redacting before the logger rather than expecting it to sanitise.

`using-tsed-logger` covers injecting `Logger`, deriving scoped children, and registering a subclass under the `Logger` token — including the double-decoration mistake that registers two providers.

`using-tsed-swagger` covers building `SwaggerDocumentConfig` instead of passing object literals, and the field names (`docs`, `security`) that are easy to guess wrong.
