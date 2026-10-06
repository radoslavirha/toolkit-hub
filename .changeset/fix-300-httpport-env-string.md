---
"@radoslavirha/tsed-configuration": patch
---

`ServerConfig` now accepts `httpPort` supplied as a numeric string, so mapping `PORT` through `custom-environment-variables.json` no longer fails validation at startup.
