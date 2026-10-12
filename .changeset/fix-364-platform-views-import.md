---
"@radoslavirha/tsed-swagger": patch
---

Fix `GET /` returning 500 in the CommonJS build: import `PlatformViews` by name so the injection token is the class, not the module namespace.
