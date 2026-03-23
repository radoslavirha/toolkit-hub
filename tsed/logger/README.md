# @radoslavirha/tsed-logger

> Ts.ED injectable singleton logger with built-in HTTP request/response logging, wrapping `@radoslavirha/logger` for dependency injection.

Provides a Ts.ED `@Injectable()` `Logger` class that extends the OTEL-compliant `@radoslavirha/logger`. Injects into any service or controller, logs HTTP request/response metadata via `$onResponse`, and is designed to be overridden per-API using `@OverrideProvider(Logger)`.

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
import { Injectable, OverrideProvider, Scope, ProviderScope } from '@tsed/di';
import { Logger } from '@radoslavirha/tsed-logger';

@Injectable()
@OverrideProvider(Logger)
@Scope(ProviderScope.SINGLETON)
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

> **HTTP request logging is automatic.** Ts.ED calls `$onResponse` on every `@Injectable()` provider that declares it — no manual wiring in `Server` is needed.

**Key exports:** `Logger`, `LoggerOptions`, `LoggerOptionsSchema`, `LogLevel`

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
| `Logger<T>` | Class | Injectable Ts.ED singleton logger extending `@radoslavirha/logger` |
| `LoggerOptionsSchema` | Zod schema | Parses raw config with defaults for all logging options |
| `LoggerOptions` | Type | Input type for `LoggerOptionsSchema` (all fields optional) |
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

In each API, create a `LoggerProvider` that extends `Logger` and reads from `ConfigService`. Use `@OverrideProvider(Logger)` so the DI container substitutes it everywhere `Logger` is injected — including shared library packages:

```typescript
// src/config/LoggerProvider.ts
import { OverrideProvider, Scope, ProviderScope } from '@tsed/di';
import { Logger } from '@radoslavirha/tsed-logger';
import { ConfigService } from './ConfigService.js';

@OverrideProvider(Logger)
@Scope(ProviderScope.SINGLETON)
export class LoggerProvider extends Logger {
  constructor(readonly configService: ConfigService) {
    super(
      configService.config.logger,
      () => ({ additionalAttribute: 'value' })  // optional metaProvider
    );
  }
}
```

### 3. Inject in shared packages

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

### 4. HTTP request/response logging

`$onResponse` is automatically called by Ts.ED on every `@Injectable()` provider that declares it. No manual wiring in `Server` is needed — registering `LoggerProvider` (or the `Logger` override) is sufficient.

Request log output (success):
```json
{
  "timestamp": "2026-03-20T10:00:00.000Z",
  "level": "info",
  "message": "Request completed",
  "scope": "HTTP_REQUEST",
  "attributes": {
    "reqId": "req-abc",
    "method": "GET",
    "url": "/api/items",
    "status": 200,
    "duration": 42,
    "headers": { "content-type": "application/json" },
    "query": { "page": "1" },
    "requestBody": { "key": "value" },
    "responseBody": { "id": 1 }
  }
}
```

Request log output (error, status ≥ 400):
```json
{
  "timestamp": "2026-03-20T10:00:00.000Z",
  "level": "error",
  "message": "Request failed",
  "scope": "HTTP_REQUEST",
  "attributes": {
    "reqId": "req-abc",
    "method": "POST",
    "url": "/api/items",
    "status": 422,
    "duration": 15,
    "error_name": "BadRequest",
    "error_message": "Validation failed",
    "error_stack": "Error: Validation failed\n    at ..."
  }
}
```

### 5. Disable or selectively suppress request logging

Control what is included in request log entries via in configuration JSON file:

```json
{
    "logger": {
        "enabled": true,
        "level": "info",
        "requests": {
            "enabled": true,
            "headers": { "enabled": false },   // omit raw headers
            "query": { "enabled": true },
            "payload": { "enabled": false },   // omit request body
            "responseBody": { "enabled": false }, // omit response body
            "stack": false                   // omit error stack traces
        }
}
```

Set `requests.enabled: false` to disable HTTP request logging entirely.

---

## API Reference

### `Logger<T extends object = object>`

```typescript
@Injectable()
@Scope(ProviderScope.SINGLETON)
class Logger<T extends object = object> extends BaseLogger<T> {
    constructor(options: LoggerOptions, metaProvider?: () => Partial<T>)
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

### `LoggerOptions`

Input type for `LoggerOptionsSchema`. All fields are optional — defaults are applied on `.parse()`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable or disable all logging |
| `level` | `LogLevel` | `LogLevel.INFO` | Minimum severity to emit |
| `requests.enabled` | `boolean` | `true` | Enable HTTP request/response logging |
| `requests.headers.enabled` | `boolean` | `true` | Include raw request headers |
| `requests.query.enabled` | `boolean` | `true` | Include query-string parameters |
| `requests.payload.enabled` | `boolean` | `true` | Include parsed request body |
| `requests.responseBody.enabled` | `boolean` | `true` | Include endpoint return value |
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
