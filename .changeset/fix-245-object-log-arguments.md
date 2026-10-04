---
"@radoslavirha/tsed-platform": patch
---

Ts.ED log calls no longer drop object and array arguments, or `Error`s nested in a structured log object (`$log.warn({ event, message, error })`); they are now serialised into the forwarded message.
