---
"@radoslavirha/tsed-platform": patch
---

Ts.ED log events with non-string message or data (Error objects, plain objects, numbers) no longer throw in the logger bridge and are logged with their details.
