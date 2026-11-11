---
"@radoslavirha/tsed-configuration": patch
---

ConfigDocs now HTML-escapes description text outside code spans, so placeholders like `api.<domain>` are no longer stripped as HTML tags when rendered.
