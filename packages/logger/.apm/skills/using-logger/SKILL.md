---
name: using-logger
description: Use when adding logging to a package or service, choosing a log scope, deciding what to put in a log line, or wiring a logger into a framework-free package. Covers the child-scope convention, the level methods, and the rule that the logger is a transport that neither redacts nor understands HTTP.
---

# Using @radoslavirha/logger

An OTEL-shaped Winston logger that emits one JSON line per call. It has no Ts.ED dependency,
so it works anywhere.

## It is a pure transport

The logger does not redact, and it knows nothing about HTTP. **The caller builds the
structure and sanitises it first.** Anything that logs payloads, headers or query strings
builds a `RedactionProfile` from `@radoslavirha/redaction` once at construction and calls
`collect()` per log line — never pass raw request data and hope the logger handles it.

## Scope every logger

Create the logger once, then derive a child per subsystem. `child(scope)` pins a `scope`
field on every line it emits:

```ts
import { Logger } from '@radoslavirha/logger';

const logger = new Logger();
const log = logger.child('ITEM_SERVICE');

log.info('Item created', {});
```

Scope naming is `SUBSYSTEM` or `SUBSYSTEM:instance` — `HTTP_REQUEST` for inbound,
`HTTP_CLIENT:miot-spec` for one configured outbound provider. The instance suffix is what
lets you separate two clients of the same kind in a log query.

## Levels

`fatal`, `error`, `warn`, `info`, `debug`, `trace`, plus `log(level, body, meta)` when the
level is dynamic. Each takes a message string and an optional metadata object — put the
variable parts in the metadata, not interpolated into the message, or the lines stop being
groupable.

## Framework-free packages take a port, not a logger

A package that does not depend on Ts.ED should accept a structural
`{ child, info, error }` port and let the composition root pass a real logger in. Importing a
concrete logger into a library forces every consumer onto that implementation and makes the
package hard to test.

In a Ts.ED service, do the opposite: inject the DI-managed `Logger` from
`@radoslavirha/tsed-logger` rather than constructing this one.
