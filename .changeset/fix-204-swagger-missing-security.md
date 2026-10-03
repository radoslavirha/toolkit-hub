---
"@radoslavirha/tsed-swagger": patch
---

`SwaggerDocumentConfig.security` now defaults to `[]`, so a document config without `security` no longer crashes `SwaggerProvider` with "security is not iterable".
