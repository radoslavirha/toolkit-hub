---
"@radoslavirha/tsed-logger": patch
---

Request logging no longer rejects when the response cannot be serialised (e.g. a circular object). The response is logged as `[[ UNSERIALIZABLE ]]` instead of crashing the process with an unhandled rejection.
