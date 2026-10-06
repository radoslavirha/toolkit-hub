---
"@radoslavirha/tsed-logger": patch
---

The logged `response` is now serialised the way Ts.ED sends it, so `@Ignore`d fields no longer leak into logs and `response.redactPaths` match `@Name` aliases.
