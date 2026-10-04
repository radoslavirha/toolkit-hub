---
"@radoslavirha/tsed-platform": patch
---

Ts.ED log calls with a `null` argument (e.g. `$log.info('cached value:', null)`) no longer throw a `TypeError`; the `null` is logged as `null`.
