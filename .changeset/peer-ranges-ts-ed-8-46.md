---
"@radoslavirha/tsed-common": patch
"@radoslavirha/tsed-configuration": patch
"@radoslavirha/tsed-logger": patch
"@radoslavirha/tsed-mongoose": patch
"@radoslavirha/tsed-platform": patch
"@radoslavirha/tsed-swagger": patch
"@radoslavirha/redaction": patch
---

Build against Ts.ED 8.46.2 and declare peer dependencies as caret ranges (`^8.46.2`, `^9.12.0`, `^4.6.7`, …) instead of exact versions, so consumers on a newer patch or minor no longer get unmet-peer warnings.
