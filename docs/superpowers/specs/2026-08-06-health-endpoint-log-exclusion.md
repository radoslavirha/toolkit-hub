# Excluding Health-Probe Traffic from Request Logs

> **Status:** Proposed
> **Blocks:** `iot-miniservers` — [`docs/superpowers/specs/2026-08-06-backend-health-checks.md`](https://github.com/radoslavirha/iot-miniservers) (Phase 0)
> **Packages:** `@radoslavirha/tsed-logger`, `@radoslavirha/tsed-configuration`

## Goal

A Ts.ED API can declare HTTP paths whose request/response logging is suppressed, so
Kubernetes liveness/readiness/startup probes do not write a log line every few seconds
for the life of every pod.

## Why this is blocking

The `iot-miniservers` apps are gaining `/health/live` and `/health/ready` endpoints
polled by kubelet. With the probe periods planned there:

| Probe | Period | Endpoint |
| --- | --- | --- |
| liveness | 10 s | `/health/live` |
| readiness | 5 s | `/health/ready` |
| startup | 5 s (until first success) | `/health/live` |

That is ~0.3 req/s per pod at steady state. Across 3 APIs × 2 environments × 2 servers
this is a permanent, uninformative stream into Loki that dwarfs real traffic and makes
request logs useless for their actual purpose. It must be filtered **at the source** —
Loki-side drop rules still pay the ingest cost and are invisible to anyone reading the
app's own logs.

## Current state — there are two independent emitters

Both fire on every response. Silencing one leaves the other.

### 1. `@tsed/platform-log-request` (Ts.ED's own)

`BaseServer` (`tsed/platform/src/BaseServer.ts`) has a bare `import '@tsed/platform-log-request'`,
which registers `PlatformLogRequestFactory`. Its `$onResponse` hook calls
`defaultLogResponse($ctx)`, which emits:

```js
$ctx.logger.info({ event: 'request.end', status, status_code, state: 'OK' });
```

**This one already has a supported off-switch.** Ts.ED's `DILoggerOptions` declares
`ignoreUrlPatterns?: (string | RegExp)[]`, consumed in
`@tsed/platform-http/.../utils/createContext.js`:

```js
const ignoreLog = buildIgnoreLog(loggerOptions.ignoreUrlPatterns);
// ...
ignoreLog && $ctx.logger.alterIgnoreLog((ignore, data) => ignoreLog(ignore, data, $ctx.url));
```

No code change needed in `tsed-logger` for this emitter — only a default value.

### 2. `@radoslavirha/tsed-logger` `Logger.$onResponse` (ours)

`tsed/logger/src/Logger.ts` registers its own `$onResponse` hook that builds the
redacted `HTTP_REQUEST` log line and emits `httpLog.info('Request completed', meta)`.
It reads `$ctx` directly and **never consults `alterIgnoreLog` or `ignoreUrlPatterns`**,
so Ts.ED's native setting has no effect on it. Its only guard is:

```ts
if (!ObjectUtils.isEnabled(this.options.requests)) { return; }
```

which is all-or-nothing.

## Changes

### A. `@radoslavirha/tsed-logger` — `requests.ignorePaths`

`tsed/logger/src/RequestLogOptions.schema.ts`, inside `LoggerRequestOptionsSchema`:

```ts
/**
 * Request paths to exclude from HTTP request/response logging. Matched against
 * the request pathname (query string stripped) as an anchored prefix: an entry
 * `/health` suppresses `/health`, `/health/live` and `/health/ready`, but not
 * `/healthcheck`. Kubernetes probe endpoints are excluded by default — they run
 * every few seconds for the life of the pod and carry no information.
 */
ignorePaths: z.array(z.string()).default(['/health', '/healthz'])
```

`tsed/logger/src/Logger.ts`:

- Compile the list once in the constructor (never per request), next to where
  `RedactionProfile` is already compiled.
- Guard at the top of `$onResponse`, **before** any redaction work:

```ts
private $onResponse($ctx: PlatformContext): void {
    if (!ObjectUtils.isEnabled(this.options.requests)) { return; }
    if (this.isIgnoredPath($ctx.request.url)) { return; }
    // ...
}
```

Matching rules — get these right, they are the whole feature:

- Strip the query string before matching (`/health/ready?x=1` must match `/health`).
- Anchored prefix on a path-segment boundary: `path === entry || path.startsWith(entry + '/')`.
  Plain `startsWith` would let `/health` swallow an unrelated `/healthchecks-admin` route.
- Case-sensitive. Paths are, and Ts.ED's own `ignoreUrlPatterns` compiling with `/gi`
  is a quirk to not copy.
- Empty array disables the feature.

Deliberately **strings, not `RegExp`**: this config is loaded from JSON, where a regex
can only arrive as a string and would then need compiling with attacker-adjacent input.
Prefix matching covers every real case here.

### B. `@radoslavirha/tsed-configuration` — default `ignoreUrlPatterns`

`tsed/configuration/src/helpers/ServerDefaultConfig.ts`:

```ts
export const getServerDefaultConfig = (): Partial<TsED.Configuration> => ({
    httpPort: 4000,
    acceptMimes: ['application/json'],
    httpsPort: false,
    exclude: ['**/*.spec.ts'],
    disableComponentsScan: true,
    jsonMapper: { additionalProperties: false },
    ajv: { returnsCoercedValues: true },
    // Kubernetes probe endpoints. Suppresses `@tsed/platform-log-request`'s
    // `request.end` line; the @radoslavirha/tsed-logger equivalent is suppressed
    // by `logger.requests.ignorePaths`, which defaults to the same paths.
    logger: {
        ignoreUrlPatterns: ['^/health(/|$)', '^/healthz$']
    }
});
```

Note every app spreads `getServerDefaultConfig()` into its own `@Configuration`, so an
app that sets its own `logger` key overrides this wholesale — acceptable, and the same
is already true of every other key here.

## On defaulting to on

Both changes ship the exclusion **enabled by default** rather than opt-in.

- A default of `[]` means every existing app keeps logging probes until someone
  remembers to configure it, and every future app starts wrong. The failure mode of
  forgetting is a silent, permanent cost.
- The failure mode of the default being wrong is bounded and obvious: an app that
  genuinely wants `/health` in its request log sets `requests.ignorePaths: []`.
- It is additive under the repository's configuration-contract rule — old pods reading
  a config without the key get the default; new pods reading an old ConfigMap likewise.
  No rolling-deploy hazard in either direction.

If you would rather not change behaviour for existing consumers, the alternative is
`default([])` plus an explicit `ignorePaths` in each `iot-miniservers` app's config JSON.
That works, costs one config block per app, and is the only difference.

## Tests

`tsed/logger/src/Logger.spec.ts` (extend the existing suite):

- `/health/live` produces no `HTTP_REQUEST` log line; `/api/things` still does.
- `/health/ready?verbose=1` is suppressed — query string is stripped before matching.
- `/healthchecks-admin` is **not** suppressed by the `/health` entry (boundary case).
- `ignorePaths: []` restores logging for `/health/live`.
- A suppressed request does no redaction work — spy on the `RedactionProfile` and assert
  `collect` is never called. This is the reason the guard sits above it.
- A suppressed 5xx is also suppressed (the filter is about the path, not the outcome) —
  assert this explicitly so nobody "fixes" it later; errors on a probe endpoint surface
  through the probe's own failure and the pod's events, not the request log.

`tsed/configuration/src/helpers/ServerDefaultConfig.spec.ts`: the existing
`toEqual({...})` assertion enumerates every key and **will fail** — update it with the
new `logger` key rather than loosening it to `toMatchObject`.

## Release

- Changeset for `@radoslavirha/tsed-logger` — **minor** (new config field, behaviour
  change under default-on).
- Changeset for `@radoslavirha/tsed-configuration` — **minor** (new default config key).
- `pnpm run verify` at the repo root, then publish per the normal release flow.
- `iot-miniservers` bumps both catalog entries (`@radoslavirha/tsed-logger`,
  `@radoslavirha/tsed-configuration`) in `pnpm-workspace.yaml`.

## Verification after deploy

Probes must be live before this proves anything, so run it once the `iot-miniservers`
Phase C rollout lands:

```sh
# No probe lines in the last 15 minutes.
# Expect zero results for both the Ts.ED and the toolkit emitter.
{namespace="sandbox"} |= "request.end" |= "/health"
{namespace="sandbox"} |= "Request completed" |= "/health"

# Real traffic still logged — sanity check that the filter is not over-broad.
{namespace="sandbox"} |= "Request completed" != "/health"
```

## Out of scope

- **Metrics.** Nothing in *this* change touches the metrics path — it is purely about log
  lines. Note separately that the OTel change in `iot-miniservers` (below) *does* drop
  `http.server.request.duration` for probe endpoints, and replaces it with a per-check
  `health.check.duration` histogram. The two changes are independent; neither depends on
  the other's decision.
- **Trace suppression.** Handled in `iot-miniservers` via
  `HttpInstrumentation.ignoreIncomingRequestHook` in `packages/otel`, because that is
  where the OTel bootstrap lives. Verified there that the ignore branch wraps the handler
  in `context.with(suppressTracing(...))` and that `Tracer.startSpan` returns a
  non-recording span under suppression, so Express child spans go with the root span.
- **Sampling instead of exclusion.** Logging 1-in-N probe responses was considered and
  rejected: a sampled success line tells you nothing a probe failure event does not
  already tell you better, and it reintroduces the ingest cost this change exists to remove.
