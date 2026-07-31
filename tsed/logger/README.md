# @radoslavirha/tsed-logger

> Ts.ED injectable singleton logger with built-in HTTP request/response logging, wrapping `@radoslavirha/logger` for dependency injection.

Provides a Ts.ED `@Injectable()` `Logger` class that extends the OTEL-compliant `@radoslavirha/logger`. Injects into any service or controller, logs HTTP request/response metadata via `$onResponse`, and is designed to be overridden per-API using `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})`.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Ts.ED injectable wrapper for `@radoslavirha/logger` with HTTP request logging.

**Install in pnpm monorepo:**
```bash
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-logger
```

**Essential Pattern:**
```typescript
// 1. API-side — override Logger with your own LoggerProvider
import { Injectable, ProviderScope } from '@tsed/di';
import { Logger } from '@radoslavirha/tsed-logger';

@Injectable({token: Logger, scope: ProviderScope.SINGLETON})
export class LoggerProvider extends Logger {
  constructor(readonly configService: ConfigService) {
    super(configService.config.logger);
  }
}

// 2. Shared library packages — inject Logger and call child()
import { Injectable } from '@tsed/di';
import { Logger } from '@radoslavirha/tsed-logger';

@Injectable()
export class Service {
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child('Service');
  }

  public doWork(): void {
    this.log.info('Working');
  }
}
```

> `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})` already replaces the Logger provider token; registering the override as a second injectable provider also registers lifecycle hooks twice.

> **HTTP request logging is automatic.** Ts.ED calls `$onResponse` on every `@Injectable()` provider that declares it — no manual wiring in `Server` is needed.

**Key exports:** `Logger`, `LoggerMetadata`, `LoggerOptionsInput`, `LoggerOptions`, `LoggerOptionsSchema`, `LogLevel`

**Full documentation below** ↓

---

## Installation

```bash
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/tsed-logger
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

---

## What's Included

| Export | Type | Description |
|--------|------|-------------|
| `Logger` | Class | Injectable Ts.ED singleton logger extending `@radoslavirha/logger`, typed as `BaseLogger<LoggerMetadata>` |
| `LoggerMetadata` | Interface | Empty extension point for custom log metadata — augment via TypeScript declaration merging |
| `LoggerOptionsSchema` | Zod schema | Parses raw config with defaults for all logging options |
| `LoggerOptionsInput` | Type | Raw input type for `LoggerOptionsSchema` (all fields optional) |
| `LoggerOptions` | Type | Parsed output type from `LoggerOptionsSchema` (defaults applied) |
| `LogLevel` | Enum | Re-exported from `@radoslavirha/logger` — OTEL severity levels |

---

## Usage

### 1. Use ZOD validator in config model 

Use `LoggerOptionsSchema.parse()` at bootstrap time to apply defaults before passing options to the `Logger` constructor:

```typescript
import { BaseConfig } from '@radoslavirha/tsed-configuration';
import { LoggerOptionsSchema } from '@radoslavirha/tsed-logger';

export const ConfigSchema = BaseConfig.extend({
    ...
    logger: LoggerOptionsSchema
});

export type ConfigModel = z.infer<typeof ConfigSchema>;
```

### 2. Override Logger per API

In each API, create a `LoggerProvider` that extends `Logger` and reads from `ConfigService`. Use `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})` so the DI container substitutes it everywhere `Logger` is injected — including shared library packages:

```typescript
// src/config/LoggerProvider.ts
import { Injectable, ProviderScope } from '@tsed/di';
import { Logger } from '@radoslavirha/tsed-logger';
import { ConfigService } from './ConfigService.js';

@Injectable({token: Logger, scope: ProviderScope.SINGLETON})
export class LoggerProvider extends Logger {
  constructor(readonly configService: ConfigService) {
    super(
      configService.config.logger,
      () => ({ additionalAttribute: 'value' })  // optional metaProvider
    );
  }
}
```

### 3. Extend `LoggerMetadata` for typed custom attributes

`Logger` is not generic — it is always typed as `Logger extends BaseLogger<LoggerMetadata>`. `LoggerMetadata` is an empty interface by default; augment it via TypeScript declaration merging so `metaProvider` and every per-call `meta` argument are typed with your API's own attributes, with no generic parameter needed on `Logger` itself:

```typescript
// src/config/LoggerProviderLogMetadata.ts
export interface LoggerProviderLogMetadata {
  requestId?: string;
  tenantId?: string;
}
```

```typescript
// src/types/tsed-logger.d.ts
import '@radoslavirha/tsed-logger';
import { LoggerProviderLogMetadata } from '../config/LoggerProviderLogMetadata.js';

declare module '@radoslavirha/tsed-logger' {
  interface LoggerMetadata extends LoggerProviderLogMetadata {}
}
```

Once declared, `metaProvider` in `LoggerProvider` and every `.info(body, meta)`-style call across the codebase — including in shared library packages — are typed with `LoggerProviderLogMetadata`'s fields.

### 4. Inject in shared packages

Any `@Injectable` in any package just injects `Logger` and scopes it with `child()`:

```typescript
@Injectable()
export class Service {
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child('Service');
  }

  public async process(id: string): Promise<void> {
    this.log.info('Processing', { id });
  }
}
```

### 5. HTTP request/response logging

`$onResponse` is automatically called by Ts.ED on every `@Injectable()` provider that declares it. No manual wiring in `Server` is needed — registering `LoggerProvider` (or the `Logger` override) is sufficient.

Request log output (success):
```json
{
  "timestamp": "2026-03-20T10:00:00.000Z",
  "level": "info",
  "message": "Request completed",
  "scope": "HTTP_REQUEST",
  "reqId": "req-abc",
  "method": "GET",
  "url": "/api/items",
  "status": 200,
  "duration": 42,
  "headers": "{\"content-type\":\"application/json\"}",
  "query": "{\"page\":\"1\"}",
  "request": "{\"key\":\"value\"}",
  "response": "{\"id\":1}"
}
```

Request log output (error, status ≥ 400):
```json
{
  "timestamp": "2026-03-20T10:00:00.000Z",
  "level": "error",
  "message": "Request failed",
  "scope": "HTTP_REQUEST",
  "reqId": "req-abc",
  "method": "POST",
  "url": "/api/items",
  "status": 422,
  "duration": 15,
  "error_name": "BadRequest",
  "error_message": "Validation failed",
  "error_stack": "Error: Validation failed\n    at ..."
}
```

### 6. Disable or selectively suppress request logging

Control what is included in request log entries via in configuration JSON file:

```json
{
    "logger": {
        "enabled": true,
        "level": "info",
        "requests": {
            "enabled": true,
            "headers": { "enabled": false, "redactPaths": ["authorization", "cookie"] },
            "query": { "enabled": true, "redactPaths": ["token"] },
            "request": { "enabled": false, "redactPaths": ["password", "user.secret"] },
            "response": { "enabled": false, "redactPaths": ["body.password"] },
            "stack": false
        }
    }
}
```

`stack: false` omits error stack traces from error log entries.

    `redactPaths` selectors are path-based per source:
    - `authorization` redacts only root-level `authorization` for that source.
    - `user.password` redacts an exact nested path.
    - `items.*.token` redacts wildcard path matches.

Set `requests.enabled: false` to disable HTTP request logging entirely.

---

## Testing

Import your `LoggerProvider` override (see [Override Logger per API](#2-override-logger-per-api)) **once**, in a test setup file — the `@Injectable({token: Logger, scope: ProviderScope.SINGLETON})` decorator registers the DI override as soon as the file is loaded, nothing else is needed. Every spec file should only import and use `Logger` — never `LoggerProvider` directly.

```typescript
// test/setup.ts
import '../src/config/LoggerProvider.js';
```

Wire the setup file via Vitest `setupFiles` so it runs before any test bootstraps the platform:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts']
  }
});
```

Then in any spec file, just import and use `Logger`:

```typescript
import { Logger } from '@radoslavirha/tsed-logger';
import { PlatformTest } from '@tsed/platform-http/testing';

const logger = PlatformTest.get<Logger>(Logger);
```

---

## API Reference

### `Logger`

```typescript
@Injectable()
@Scope(ProviderScope.SINGLETON)
class Logger extends BaseLogger<LoggerMetadata> {
    constructor(options?: LoggerOptionsInput, metaProvider?: () => Partial<LoggerMetadata>)
}
```

Inherits all methods from `@radoslavirha/logger`:

| Method | Description |
|--------|-------------|
| `child(scope)` | Creates a child logger with `scope` pinned on every line |
| `fatal(body, meta?)` | Log at FATAL level — writes to **stderr** |
| `error(body, meta?)` | Log at ERROR level — writes to **stderr** |
| `warn(body, meta?)` | Log at WARN level — writes to **stdout** |
| `info(body, meta?)` | Log at INFO level — writes to **stdout** |
| `debug(body, meta?)` | Log at DEBUG level — writes to **stdout** |
| `trace(body, meta?)` | Log at TRACE level — writes to **stdout** |

---

### `LoggerMetadata`

```typescript
interface LoggerMetadata {}
```

Empty by default. Augment via TypeScript declaration merging to type `metaProvider` and per-call `meta` with your API's custom attributes — see [Extend `LoggerMetadata` for typed custom attributes](#3-extend-loggermetadata-for-typed-custom-attributes).

---

### `LoggerOptionsSchema`

Use `LoggerOptionsSchema` in config model, `@radoslavirha/tsed-configuration` will parse data from JSON file:

```typescript
import { BaseConfig } from '@radoslavirha/tsed-configuration';
import { LoggerOptionsSchema } from '@radoslavirha/tsed-logger';

export const ConfigSchema = BaseConfig.extend({
    ...
    logger: LoggerOptionsSchema
});

export type ConfigModel = z.infer<typeof ConfigSchema>;
```

---

### `LoggerOptionsInput`

Input type for `LoggerOptionsSchema`. All fields are optional — defaults are applied on `.parse()`.

### `LoggerOptions`

Parsed output type from `LoggerOptionsSchema` with defaults already applied.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable all logging |
| `level` | `LogLevel` | `LogLevel.INFO` | Minimum severity to emit |
| `requests.enabled` | `boolean` | `true` | Enable HTTP request/response logging |
| `requests.headers.enabled` | `boolean` | `true` | Include raw request headers |
| `requests.headers.redactPaths` | `string[]` | `[]` | Path selectors for header redaction |
| `requests.query.enabled` | `boolean` | `true` | Include query-string parameters |
| `requests.query.redactPaths` | `string[]` | `[]` | Path selectors for query redaction |
| `requests.request.enabled` | `boolean` | `true` | Include parsed request body |
| `requests.request.redactPaths` | `string[]` | `[]` | Path selectors for request payload redaction |
| `requests.response.enabled` | `boolean` | `true` | Include endpoint return value |
| `requests.response.redactPaths` | `string[]` | `[]` | Path selectors for response payload redaction |
| `requests.stack` | `boolean` | `true` | Include error stack trace in error log entries |

---

### `LogLevel`

Re-exported from `@radoslavirha/logger`:

```typescript
enum LogLevel {
    FATAL = 'fatal',
    ERROR = 'error',
    WARN  = 'warn',
    INFO  = 'info',
    DEBUG = 'debug',
    TRACE = 'trace'
}
```

---

## See Also

- [AGENTS.md](../../AGENTS.md) — cross-package integration patterns and architecture guide

---

## Related Packages

| Package | Description |
|---------|-------------|
| [`@radoslavirha/logger`](../../packages/logger/README.md) | OTEL-compliant Winston logger (base class, zero Ts.ED dependencies) |
| [`@radoslavirha/tsed-platform`](../platform/README.md) | Express server bootstrap and `BaseServer` |
| [`@radoslavirha/tsed-configuration`](../configuration/README.md) | Config management — provides the raw config object to parse |
