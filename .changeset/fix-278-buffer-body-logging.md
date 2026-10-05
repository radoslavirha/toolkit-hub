---
"@radoslavirha/tsed-logger": patch
---

Buffer request/response bodies are now decoded to text before logging, so `redactPaths` applies to them and they are no longer logged as JSON byte arrays.
