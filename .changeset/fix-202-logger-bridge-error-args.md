---
"@radoslavirha/tsed-platform": patch
---

`TsEDLoggerBridge` now keeps the message and stack of an `Error` passed to Ts.ED's logger (`logger.error('msg', error)`) instead of silently dropping it.
