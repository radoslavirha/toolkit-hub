# @radoslavirha/redaction

## 0.3.2

### Patch Changes

- [`58987a4`](https://github.com/radoslavirha/toolkit-hub/commit/58987a4aa81d3d4e706b5c7baca51c1ab31d91ad) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix peer dependency, rollback pnpm
- Updated dependencies [[`58987a4`](https://github.com/radoslavirha/toolkit-hub/commit/58987a4aa81d3d4e706b5c7baca51c1ab31d91ad)]:
  - @radoslavirha/utils@0.9.2

## 0.3.1

### Patch Changes

- [`87a3a08`](https://github.com/radoslavirha/toolkit-hub/commit/87a3a080b81aced77c2728df4681b39c6ea80686) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages
- Updated dependencies [[`87a3a08`](https://github.com/radoslavirha/toolkit-hub/commit/87a3a080b81aced77c2728df4681b39c6ea80686)]:
  - @radoslavirha/utils@0.9.1

## 0.3.0

### Minor Changes

- [#183](https://github.com/radoslavirha/toolkit-hub/pull/183) [`99ca5fd`](https://github.com/radoslavirha/toolkit-hub/commit/99ca5fd5f72596bf192e537f3f043ae54eee6ebc) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Redact credential-bearing request headers by default.
  
  `requests.headers.redactPaths` defaulted to `[]`, so a Ts.ED service that configured nothing
  logged every header verbatim — including a rejected `Authorization: Bearer …`, at `error`
  level, on every 401. A rejected token is frequently still a live one (minted for another
  audience, expired by seconds, valid against a different API), and those lines ship to log
  aggregation. Forgetting to configure redaction was silent, which made it the default outcome.
  
  `requests.headers.redactPaths` now defaults to
  `['authorization', 'cookie', '["set-cookie"]', '["proxy-authorization"]', '["x-api-key"]']`,
  exported from `@radoslavirha/redaction` as the new `SENSITIVE_HEADER_SELECTORS`. Header names
  are the one category of sensitive field knowable in advance — HTTP fixes them, the application
  does not — so `query`, `request` and `response` still default to `[]`: their field names belong
  to the service and guessing at them would censor the wrong things.
  
  A configured `redactPaths` **replaces** the default rather than extending it, so a caller still
  gets exactly the list it wrote, and `redactPaths: []` restores fully unredacted headers.
  
  `createRedactionSchema` also stops dropping a field's default selectors when that field is
  partially configured. Zod's `.default()` fires only on `undefined`, so `headers: { enabled:
  true }` used to skip the object-level default and fall back to the bare `[]` — the same
  fail-open, reachable from any consumer of the helper. The defaults are now declared on
  `redactPaths` as well, and `LoggerRequestOptionsSchema` derives its own default by parsing
  rather than restating it, so nested defaults can no longer drift.
  
  Minor, not major: no type, config key or call signature changes, every existing configuration
  keeps parsing and keeps meaning what it meant, and the opt-out is one line. This is the same
  shape of change as the `requests.ignorePaths` default in 0.6.0, which also altered what every
  consumer's logs contain and shipped as a minor. Anyone reading a header value out of their logs
  will lose it and must set `redactPaths` explicitly.

## 0.2.2

### Patch Changes

- [#169](https://github.com/radoslavirha/toolkit-hub/pull/169) [`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Use the toolkit type guards instead of hand-rolled `typeof`/`undefined` checks. `StringUtils.isString`, `CommonUtils.isUndefined` and `CommonUtils.notUndefined` replace four raw checks in `redaction` and six in `logger`.
  
  Both packages gain `@radoslavirha/utils` as a dependency. They remain framework-agnostic — that has always meant no Ts.ED coupling, not no dependencies. Measured cost: 4.9 MB on disk and a 33 ms one-time import, with per-call overhead around 4 ns, which is immaterial next to the serialisation and transport work these packages do. Consumers that already depend on `@radoslavirha/utils` — every Ts.ED service, via `tsed-logger` — pay nothing.
  
  `RedactionProfile`'s enablement check keeps its own semantics rather than moving to `ObjectUtils.isEnabled`: absent options count as enabled here, while `isEnabled` requires an explicit `true`.
- Updated dependencies [[`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a)]:
  - @radoslavirha/utils@0.9.0

## 0.2.1

### Patch Changes

- [#166](https://github.com/radoslavirha/toolkit-hub/pull/166) [`4f38c21`](https://github.com/radoslavirha/toolkit-hub/commit/4f38c21f5849de053391774441ba0e7cdcbae451) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Ship agent guidance as APM skills.
  
  `using-logger` covers the child-scope convention and the rule that the logger is a pure transport that neither redacts nor understands HTTP, plus the structural-port pattern for framework-free packages.
  
  `using-redaction` covers compiling one `RedactionProfile` at construction, `collect()` per call, and redacting before the logger rather than expecting it to sanitise.
  
  `using-tsed-logger` covers injecting `Logger`, deriving scoped children, and registering a subclass under the `Logger` token — including the double-decoration mistake that registers two providers.
  
  `using-tsed-swagger` covers building `SwaggerDocumentConfig` instead of passing object literals, and the field names (`docs`, `security`) that are easy to guess wrong.

## 0.2.0

### Minor Changes

- [#153](https://github.com/radoslavirha/toolkit-hub/pull/153) [`206c4e2`](https://github.com/radoslavirha/toolkit-hub/commit/206c4e27c818e5a086f846ac16fd65927a80c9ac) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Extract redaction into a standalone `@radoslavirha/redaction` package.

  Redaction was implemented inside `@radoslavirha/tsed-logger` and not exported, so any other
  package needing it (outbound HTTP clients, storage, messaging) had no way to reuse it. It is
  also not a logging concern — it sanitises values _before_ they reach a logger.

  - New `@radoslavirha/redaction`: `RedactionProfile` (redactors compiled **once** from
    configuration, then reused per call — `fast-redact` compiles via `new Function`, so building
    per call would dominate logging cost), plus the low-level `RedactionUtils` and the shared Zod
    `{ enabled, redactPaths }` configuration vocabulary.
  - `@radoslavirha/tsed-logger`: now consumes the new package instead of its own private copy.
    `RequestFieldOptionsSchema` is the shared schema, and `$onResponse` builds its redactors via
    `RedactionProfile`. **No behavioural change** — inbound request logging emits exactly the same
    lines, and `fast-redact` is no longer a direct dependency.

  `@radoslavirha/logger` is deliberately untouched: it stays a pure transport with no redaction
  and no `fast-redact`/`zod` dependency.

### Patch Changes

- [#153](https://github.com/radoslavirha/toolkit-hub/pull/153) [`206c4e2`](https://github.com/radoslavirha/toolkit-hub/commit/206c4e27c818e5a086f846ac16fd65927a80c9ac) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Redaction package
