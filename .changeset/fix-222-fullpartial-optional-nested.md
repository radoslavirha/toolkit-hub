---
"@radoslavirha/types": patch
---

`FullPartial` now also makes optional (`X | undefined`) and nullable (`X | null`) nested objects partial, instead of leaving their fields required.
