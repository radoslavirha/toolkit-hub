---
'@radoslavirha/tsed-configuration': minor
---

`getServerDefaultConfig()` now defaults `logger.ignoreUrlPatterns` to
`['^/health(/|$)', '^/healthz$']`, suppressing `@tsed/platform-log-request`'s `request.end`
line for Kubernetes probe endpoints. The `@radoslavirha/tsed-logger` emitter is a separate
one, suppressed for the same paths by its `logger.requests.ignorePaths` default.

An app that sets its own `logger` key in `@Configuration` overrides this wholesale, as with
every other key returned by this helper.
