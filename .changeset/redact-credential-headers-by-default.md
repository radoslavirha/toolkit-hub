---
'@radoslavirha/redaction': minor
'@radoslavirha/tsed-logger': minor
---

Redact credential-bearing request headers by default.

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
