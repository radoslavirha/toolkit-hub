---
"@radoslavirha/redaction": patch
"@radoslavirha/logger": patch
---

Use the toolkit type guards instead of hand-rolled `typeof`/`undefined` checks. `StringUtils.isString`, `CommonUtils.isUndefined` and `CommonUtils.notUndefined` replace four raw checks in `redaction` and six in `logger`.

Both packages gain `@radoslavirha/utils` as a dependency. They remain framework-agnostic — that has always meant no Ts.ED coupling, not no dependencies. Measured cost: 4.9 MB on disk and a 33 ms one-time import, with per-call overhead around 4 ns, which is immaterial next to the serialisation and transport work these packages do. Consumers that already depend on `@radoslavirha/utils` — every Ts.ED service, via `tsed-logger` — pay nothing.

`RedactionProfile`'s enablement check keeps its own semantics rather than moving to `ObjectUtils.isEnabled`: absent options count as enabled here, while `isEnabled` requires an explicit `true`.
